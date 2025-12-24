import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VTB_AUTH_URL = "https://payment-gateway-api.vtb.ru/oauth/token";
const VTB_HOST = new URL(VTB_AUTH_URL).hostname;

interface DiagnosticResult {
  proxyConfigured: boolean;
  proxyHost: string | null;
  proxyPort: number | null;
  proxyAuthConfigured: boolean;
  proxyReachable: boolean | null;
  proxyReachableError: string | null;
  proxyConnectSuccess: boolean | null;
  proxyError: string | null;
  directConnectSuccess: boolean | null;
  directError: string | null;
  dnsResolved: boolean | null;
  dnsAddresses: string[] | null;
  dnsError: string | null;
  vtbCredentialsConfigured: boolean;
  vtbAuthSuccess: boolean | null;
  vtbAuthError: string | null;
}

function createProxyClient(): { client: Deno.HttpClient; host: string; port: number; hasAuth: boolean } | null {
  const rawProxyUrl = (Deno.env.get('PROXY_URL') || '').trim();
  const proxyUserEnv = (Deno.env.get('PROXY_USER') || '').trim();
  const proxyPassEnv = (Deno.env.get('PROXY_PASS') || '').trim();

  if (!rawProxyUrl) return null;

  let proxyUrlString = rawProxyUrl;
  if (!/^https?:\/\//i.test(proxyUrlString)) {
    proxyUrlString = `http://${proxyUrlString}`;
  }

  let proxyUrl: URL;
  try {
    proxyUrl = new URL(proxyUrlString);
  } catch {
    throw new Error('Некорректный PROXY_URL');
  }

  const embeddedUser = proxyUrl.username;
  const embeddedPass = proxyUrl.password;
  proxyUrl.username = '';
  proxyUrl.password = '';

  const username = proxyUserEnv || embeddedUser;
  const password = proxyPassEnv || embeddedPass;

  const proxyUrlWithCreds = new URL(proxyUrl.toString());
  if (username && password) {
    proxyUrlWithCreds.username = username;
    proxyUrlWithCreds.password = password;
  }

  const port = proxyUrl.port ? parseInt(proxyUrl.port, 10) : (proxyUrl.protocol === 'https:' ? 443 : 80);

  return {
    client: Deno.createHttpClient({
      proxy: { url: proxyUrlWithCreds.toString() },
    }),
    host: proxyUrl.hostname,
    port,
    hasAuth: !!(username && password),
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const result: DiagnosticResult = {
    proxyConfigured: false,
    proxyHost: null,
    proxyPort: null,
    proxyAuthConfigured: false,
    proxyReachable: null,
    proxyReachableError: null,
    proxyConnectSuccess: null,
    proxyError: null,
    directConnectSuccess: null,
    directError: null,
    dnsResolved: null,
    dnsAddresses: null,
    dnsError: null,
    vtbCredentialsConfigured: false,
    vtbAuthSuccess: null,
    vtbAuthError: null,
  };

  let proxyClient: Deno.HttpClient | undefined;

  try {
    // Check VTB credentials
    const clientId = Deno.env.get('VTB_CLIENT_ID');
    const clientSecret = Deno.env.get('VTB_CLIENT_SECRET');
    result.vtbCredentialsConfigured = !!(clientId && clientSecret);

    // DNS check (does this runtime resolve the VTB domain?)
    try {
      const addrs = await Deno.resolveDns(VTB_HOST, 'A');
      result.dnsAddresses = addrs;
      result.dnsResolved = addrs.length > 0;
    } catch (err) {
      result.dnsResolved = false;
      result.dnsError = err instanceof Error ? err.message : String(err);
    }

    // Check proxy config
    const proxyInfo = createProxyClient();
    if (proxyInfo) {
      result.proxyConfigured = true;
      result.proxyHost = proxyInfo.host;
      result.proxyPort = proxyInfo.port;
      result.proxyAuthConfigured = proxyInfo.hasAuth;
      proxyClient = proxyInfo.client;

      // Test if proxy itself is reachable (TCP connect)
      try {
        const conn = await Deno.connect({
          hostname: proxyInfo.host,
          port: proxyInfo.port,
        });
        conn.close();
        result.proxyReachable = true;
      } catch (err) {
        result.proxyReachable = false;
        result.proxyReachableError = err instanceof Error ? err.message : String(err);
      }

      // Test proxy connection to VTB (CONNECT tunnel)
      try {
        console.log('Testing proxy CONNECT tunnel to VTB...');
        const resp = await fetch(VTB_AUTH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'grant_type=client_credentials',
          client: proxyClient,
        } as any);
        // Even 401 means network works
        result.proxyConnectSuccess = true;
        console.log('Proxy CONNECT success, HTTP status:', resp.status);
      } catch (err) {
        result.proxyConnectSuccess = false;
        const errorMsg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
        result.proxyError = errorMsg;
        console.error('Proxy CONNECT failed:', errorMsg);
        if (err instanceof Error && err.stack) {
          console.error('Stack:', err.stack);
        }
      }
    }

    // Test direct connection (without proxy)
    try {
      console.log('Testing direct connection to VTB (no proxy)...');
      const resp = await fetch(VTB_AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=client_credentials',
      });
      result.directConnectSuccess = true;
      console.log('Direct connection success, HTTP status:', resp.status);
    } catch (err) {
      result.directConnectSuccess = false;
      const errorMsg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      result.directError = errorMsg;
      console.error('Direct connection failed:', errorMsg);
    }

    // If credentials configured and at least one connection works, try real auth
    if (result.vtbCredentialsConfigured && (result.proxyConnectSuccess || result.directConnectSuccess)) {
      const credentials = btoa(`${clientId}:${clientSecret}`);
      const useProxy = result.proxyConnectSuccess && proxyClient;

      try {
        const fetchOpts: any = {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'grant_type=client_credentials',
        };
        if (useProxy) fetchOpts.client = proxyClient;

        const resp = await fetch(VTB_AUTH_URL, fetchOpts);
        if (resp.ok) {
          result.vtbAuthSuccess = true;
        } else {
          result.vtbAuthSuccess = false;
          const text = await resp.text();
          result.vtbAuthError = `HTTP ${resp.status}: ${text.slice(0, 200)}`;
        }
      } catch (err) {
        result.vtbAuthSuccess = false;
        result.vtbAuthError = err instanceof Error ? err.message : String(err);
      }
    }

    console.log('vtb-diagnostics', {
      proxyConfigured: result.proxyConfigured,
      proxyReachable: result.proxyReachable,
      proxyConnectSuccess: result.proxyConnectSuccess,
      directConnectSuccess: result.directConnectSuccess,
      dnsResolved: result.dnsResolved,
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } finally {
    if (proxyClient) proxyClient.close();
  }
});
