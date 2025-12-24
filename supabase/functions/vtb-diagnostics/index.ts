import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// VTB Auth URLs according to official documentation
// Sandbox: https://epa-ift-sbp.vtb.ru:443/passport/oauth2/token
// Production: https://epa.api.vtb.ru:443/passport/oauth2/token
const VTB_AUTH_URL_SANDBOX = "https://epa-ift-sbp.vtb.ru:443/passport/oauth2/token";
const VTB_AUTH_URL_PROD = "https://epa.api.vtb.ru:443/passport/oauth2/token";

// API endpoints
const VTB_API_SANDBOX = "https://test3.api.vtb.ru:8443/openapi/smb/efcp/e-commerce/v1/orders";
const VTB_API_SANDBOX_HOST = "test3.api.vtb.ru";

// Russian Trusted Root CA (НУЦ Минцифры) - required for VTB sandbox SSL
const RUSSIAN_CA_URL = "https://gu-st.ru/content/Other/doc/russiantrustedca.pem";
let cachedRussianCA: string | null = null;

async function getRussianCA(): Promise<string | null> {
  if (cachedRussianCA) return cachedRussianCA;
  
  try {
    console.log('Fetching Russian Trusted Root CA...');
    const resp = await fetch(RUSSIAN_CA_URL);
    if (resp.ok) {
      cachedRussianCA = await resp.text();
      console.log('Russian CA certificate fetched successfully, length:', cachedRussianCA.length);
      return cachedRussianCA;
    }
    console.error('Failed to fetch Russian CA:', resp.status);
    return null;
  } catch (err) {
    console.error('Error fetching Russian CA:', err);
    return null;
  }
}

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

function createProxyClient(caCerts?: string[]): { client: Deno.HttpClient; host: string; port: number; hasAuth: boolean } | null {
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

  const clientOptions: any = {
    proxy: { url: proxyUrlWithCreds.toString() },
  };
  if (caCerts && caCerts.length > 0) {
    clientOptions.caCerts = caCerts;
  }

  return {
    client: Deno.createHttpClient(clientOptions),
    host: proxyUrl.hostname,
    port,
    hasAuth: !!(username && password),
  };
}

// Create HTTP client with Russian CA for direct connections (no proxy)
function createDirectClientWithCA(caCerts?: string[]): Deno.HttpClient | null {
  if (!caCerts || caCerts.length === 0) return null;
  
  return Deno.createHttpClient({
    caCerts: caCerts,
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestBody: any = await req.json().catch(() => ({}));
  const mode: 'sandbox' | 'prod' = requestBody?.mode === 'prod' ? 'prod' : 'sandbox';

  const authUrlOverride =
    typeof requestBody?.authUrlOverride === 'string' && requestBody.authUrlOverride.trim()
      ? requestBody.authUrlOverride.trim()
      : null;

  const authUrls = authUrlOverride
    ? [authUrlOverride]
    : mode === 'prod'
      ? [VTB_AUTH_URL_PROD]
      : [VTB_AUTH_URL_SANDBOX];

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

  // Helpful meta for debugging TLS issues like "Expired"
  (result as any).nowIso = new Date().toISOString();
  (result as any).mode = mode;
  (result as any).authUrlOverride = authUrlOverride;

  let proxyClient: Deno.HttpClient | undefined;
  let directClient: Deno.HttpClient | undefined;

  try {
    // Fetch Russian CA for VTB sandbox SSL (only needed for sandbox)
    let caCerts: string[] | undefined;
    if (mode === 'sandbox') {
      const russianCA = await getRussianCA();
      caCerts = russianCA ? [russianCA] : undefined;
      (result as any).russianCaLoaded = !!russianCA;
      console.log('Russian CA loaded for sandbox:', !!russianCA);
    } else {
      (result as any).russianCaLoaded = 'not_needed_for_prod';
      console.log('Production mode - using standard SSL certificates');
    }

    // Check VTB credentials
    const clientId = Deno.env.get('VTB_CLIENT_ID');
    const clientSecret = Deno.env.get('VTB_CLIENT_SECRET');
    result.vtbCredentialsConfigured = !!(clientId && clientSecret);

    // Create direct client with Russian CA (only for sandbox)
    if (caCerts && caCerts.length > 0) {
      directClient = createDirectClientWithCA(caCerts) || undefined;
    }

    // DNS check for first URL
    const firstUrl = new URL(authUrls[0]);
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
    const proxyInfo = createProxyClient(caCerts);
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
      for (const testUrl of authUrls) {
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

    // Test direct connection with Russian CA
    for (const testUrl of authUrls) {
      try {
        console.log('Testing direct connection (with Russian CA) to:', testUrl);
        const fetchOpts: any = {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'grant_type=client_credentials',
        };
        if (directClient) fetchOpts.client = directClient;
        
        const resp = await fetch(testUrl, fetchOpts);
        result.directConnectSuccess = true;
        console.log('Direct connection success to', testUrl, 'HTTP status:', resp.status);
        break;
      } catch (err) {
        result.directConnectSuccess = false;
        const errorMsg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
        result.directError = `${testUrl}: ${errorMsg}`;
        console.error('Direct connection failed to', testUrl, ':', errorMsg);
      }
    }

    // ============ TEST API SANDBOX DOMAIN ============
    console.log('Testing VTB API Sandbox domain:', VTB_API_SANDBOX_HOST);

    // DNS for API sandbox domain
    try {
      const altAddrs = await Deno.resolveDns(VTB_API_SANDBOX_HOST, 'A');
      result.altDomainDnsAddresses = altAddrs;
      result.altDomainDnsResolved = altAddrs.length > 0;
      console.log('API Sandbox DNS resolved:', altAddrs);
    } catch (err) {
      result.altDomainDnsResolved = false;
      result.altDomainDnsError = err instanceof Error ? err.message : String(err);
      console.error('API Sandbox DNS failed:', result.altDomainDnsError);
    }

    // Proxy connection to API sandbox
    if (proxyClient) {
      try {
        console.log('Testing proxy CONNECT to API Sandbox...');
        const resp = await fetch(VTB_API_SANDBOX, {
          method: 'GET',
          client: proxyClient,
        } as any);
        result.altDomainProxySuccess = true;
        console.log('API Sandbox proxy CONNECT success, HTTP status:', resp.status);
      } catch (err) {
        result.altDomainProxySuccess = false;
        result.altDomainProxyError = err instanceof Error ? err.message : String(err);
        console.error('API Sandbox proxy CONNECT failed:', result.altDomainProxyError);
      }
    }

    // Direct connection to API sandbox
    try {
      console.log('Testing direct connection to API Sandbox...');
      const resp = await fetch(
        VTB_API_SANDBOX,
        ({
          method: 'GET',
          ...(directClient ? { client: directClient } : {}),
        } as any),
      );
      result.altDomainDirectSuccess = true;
      console.log('API Sandbox direct success, HTTP status:', resp.status);
    } catch (err) {
      result.altDomainDirectSuccess = false;
      result.altDomainDirectError = err instanceof Error ? err.message : String(err);
      console.error('API Sandbox direct failed:', result.altDomainDirectError);
    }

    // Try VTB OAuth with real credentials
    if (result.vtbCredentialsConfigured) {
      const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId!,
        client_secret: clientSecret!,
      });

      const useProxy = result.proxyConnectSuccess && proxyClient;
      let lastTriedUrl: string | null = null;

      console.log('Testing VTB OAuth with real credentials via', useProxy ? 'proxy' : 'direct', 'mode:', mode);

      for (const testUrl of authUrls) {
        lastTriedUrl = testUrl;
        try {
          console.log('Trying OAuth at:', testUrl);
          const fetchOpts: any = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
          };

          // IMPORTANT: when not using proxy, still use directClient with Russian CA
          if (useProxy) fetchOpts.client = proxyClient;
          else if (directClient) fetchOpts.client = directClient;

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
            break;
          } else {
            result.vtbAuthSuccess = false;
            result.vtbAuthError = `${testUrl}: HTTP ${resp.status}: ${respText.slice(0, 200)}`;
          }
        } catch (err) {
          result.vtbAuthSuccess = false;
          result.vtbAuthError = `${testUrl}: ${err instanceof Error ? err.message : String(err)}`;
          console.error('VTB OAuth error at', testUrl, ':', result.vtbAuthError);
        }
      }

      // Backward/forward compatible shape for UI
      (result as any).vtb_auth = {
        success: !!result.vtbAuthSuccess,
        error: result.vtbAuthSuccess ? null : result.vtbAuthError,
        url: lastTriedUrl,
        mode,
      };
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
    if (directClient) directClient.close();
  }
});
