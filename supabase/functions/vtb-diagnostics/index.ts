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
  proxyAuthConfigured: boolean;
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

function createProxyClient(): { client: Deno.HttpClient; host: string; hasAuth: boolean } | null {
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

  return {
    client: Deno.createHttpClient({
      proxy: { url: proxyUrlWithCreds.toString() },
    }),
    host: proxyUrl.host,
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
    proxyAuthConfigured: false,
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
      result.proxyAuthConfigured = proxyInfo.hasAuth;
      proxyClient = proxyInfo.client;

      // Test proxy connection to VTB
      try {
        const resp = await fetch(VTB_AUTH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'grant_type=client_credentials',
          client: proxyClient,
        } as any);
        // Even 401 means network works
        result.proxyConnectSuccess = true;
      } catch (err) {
        result.proxyConnectSuccess = false;
        result.proxyError = err instanceof Error ? err.message : String(err);
      }
    }

    // Test direct connection (without proxy)
    try {
      const resp = await fetch(VTB_AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=client_credentials',
      });
      result.directConnectSuccess = true;
    } catch (err) {
      result.directConnectSuccess = false;
      result.directError = err instanceof Error ? err.message : String(err);
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
