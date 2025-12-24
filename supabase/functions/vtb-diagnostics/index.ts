import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// VTB Auth URLs to try
const VTB_AUTH_URLS = [
  "https://epa.api.vtb.ru/passport/oauth2/token",     // Primary (without explicit :443)
  "https://open.api.vtb.ru/passport/oauth2/token",    // Alternative Open API
  "https://api.vtb.ru/passport/oauth2/token",         // Simple domain
];

// Sandbox domain for connectivity test
const VTB_ALT_URL = "https://vtb.rbsuat.com/payment/rest/register.do";
const VTB_ALT_HOST = "vtb.rbsuat.com";

interface DiagnosticResult {
  proxyConfigured: boolean;
  proxyHost: string | null;
  proxyPort: number | null;
  proxyAuthConfigured: boolean;
  proxyReachable: boolean | null;
  proxyReachableError: string | null;
  proxyConnectSuccess: boolean | null;
  proxyError: string | null;
  // Alternative domain test
  altDomainDnsResolved: boolean | null;
  altDomainDnsAddresses: string[] | null;
  altDomainDnsError: string | null;
  altDomainProxySuccess: boolean | null;
  altDomainProxyError: string | null;
  altDomainDirectSuccess: boolean | null;
  altDomainDirectError: string | null;
  // Original tests
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
    altDomainDnsResolved: null,
    altDomainDnsAddresses: null,
    altDomainDnsError: null,
    altDomainProxySuccess: null,
    altDomainProxyError: null,
    altDomainDirectSuccess: null,
    altDomainDirectError: null,
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

    // DNS check for first URL
    const firstUrl = new URL(VTB_AUTH_URLS[0]);
    const vtbHost = firstUrl.hostname;
    try {
      const addrs = await Deno.resolveDns(vtbHost, 'A');
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

      // Test proxy connection to VTB (CONNECT tunnel) - try multiple URLs
      for (const testUrl of VTB_AUTH_URLS) {
        try {
          console.log('Testing proxy CONNECT tunnel to:', testUrl);
          const resp = await fetch(testUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'grant_type=client_credentials',
            client: proxyClient,
          } as any);
          // Even 401 means network works
          result.proxyConnectSuccess = true;
          console.log('Proxy CONNECT success to', testUrl, 'HTTP status:', resp.status);
          break; // Stop on first success
        } catch (err) {
          result.proxyConnectSuccess = false;
          const errorMsg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
          result.proxyError = `${testUrl}: ${errorMsg}`;
          console.error('Proxy CONNECT failed to', testUrl, ':', errorMsg);
        }
      }
    }

    // Test direct connection (without proxy) - try multiple URLs
    for (const testUrl of VTB_AUTH_URLS) {
      try {
        console.log('Testing direct connection to:', testUrl);
        const resp = await fetch(testUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'grant_type=client_credentials',
        });
        result.directConnectSuccess = true;
        console.log('Direct connection success to', testUrl, 'HTTP status:', resp.status);
        break; // Stop on first success
      } catch (err) {
        result.directConnectSuccess = false;
        const errorMsg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
        result.directError = `${testUrl}: ${errorMsg}`;
        console.error('Direct connection failed to', testUrl, ':', errorMsg);
      }
    }

    // ============ TEST ALTERNATIVE DOMAIN (platezh.vtb24.ru) ============
    console.log('Testing alternative VTB domain:', VTB_ALT_HOST);

    // DNS for alt domain
    try {
      const altAddrs = await Deno.resolveDns(VTB_ALT_HOST, 'A');
      result.altDomainDnsAddresses = altAddrs;
      result.altDomainDnsResolved = altAddrs.length > 0;
      console.log('Alt domain DNS resolved:', altAddrs);
    } catch (err) {
      result.altDomainDnsResolved = false;
      result.altDomainDnsError = err instanceof Error ? err.message : String(err);
      console.error('Alt domain DNS failed:', result.altDomainDnsError);
    }

    // Proxy connection to alt domain
    if (proxyClient) {
      try {
        console.log('Testing proxy CONNECT to alt domain...');
        const resp = await fetch(VTB_ALT_URL, {
          method: 'GET',
          client: proxyClient,
        } as any);
        result.altDomainProxySuccess = true;
        console.log('Alt domain proxy CONNECT success, HTTP status:', resp.status);
      } catch (err) {
        result.altDomainProxySuccess = false;
        result.altDomainProxyError = err instanceof Error ? err.message : String(err);
        console.error('Alt domain proxy CONNECT failed:', result.altDomainProxyError);
      }
    }

    // Direct connection to alt domain
    try {
      console.log('Testing direct connection to alt domain...');
      const resp = await fetch(VTB_ALT_URL, { method: 'GET' });
      result.altDomainDirectSuccess = true;
      console.log('Alt domain direct success, HTTP status:', resp.status);
    } catch (err) {
      result.altDomainDirectSuccess = false;
      result.altDomainDirectError = err instanceof Error ? err.message : String(err);
      console.error('Alt domain direct failed:', result.altDomainDirectError);
    }

    // Try VTB OAuth with real credentials - try multiple URLs
    if (result.vtbCredentialsConfigured) {
      const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId!,
        client_secret: clientSecret!,
      });

      const useProxy = result.proxyConnectSuccess && proxyClient;
      
      console.log('Testing VTB OAuth with real credentials via', useProxy ? 'proxy' : 'direct');

      for (const testUrl of VTB_AUTH_URLS) {
        try {
          console.log('Trying OAuth at:', testUrl);
          const fetchOpts: any = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
          };
          if (useProxy) fetchOpts.client = proxyClient;

          const resp = await fetch(testUrl, fetchOpts);
          const respText = await resp.text();
          console.log('VTB OAuth response from', testUrl, 'status:', resp.status, 'body:', respText.slice(0, 300));
          
          if (resp.ok) {
            result.vtbAuthSuccess = true;
            try {
              const data = JSON.parse(respText);
              result.vtbAuthError = `Success from ${testUrl}! expires_in: ${data.expires_in}`;
            } catch {
              result.vtbAuthError = `Success from ${testUrl} (non-JSON response)`;
            }
            break; // Stop on success
          } else {
            result.vtbAuthSuccess = false;
            result.vtbAuthError = `${testUrl}: HTTP ${resp.status}: ${respText.slice(0, 200)}`;
            // Continue trying other URLs
          }
        } catch (err) {
          result.vtbAuthSuccess = false;
          result.vtbAuthError = `${testUrl}: ${err instanceof Error ? err.message : String(err)}`;
          console.error('VTB OAuth error at', testUrl, ':', result.vtbAuthError);
          // Continue trying other URLs
        }
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
