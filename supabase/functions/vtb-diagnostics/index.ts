import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// VTB Auth URLs according to official documentation
// Sandbox: https://epa-ift-sbp.vtb.ru:443/passport/oauth2/token
// Production: https://open.api.vtb.ru:443/passport/oauth2/token (из документации ВТБ Open API)
const VTB_AUTH_URL_SANDBOX = "https://epa-ift-sbp.vtb.ru:443/passport/oauth2/token";
const VTB_AUTH_URL_PROD = "https://open.api.vtb.ru:443/passport/oauth2/token";

// API endpoints
const VTB_API_SANDBOX = "https://test3.api.vtb.ru:8443/openapi/smb/efcp/e-commerce/v1/orders";
const VTB_API_PROD = "https://open.api.vtb.ru:443/openapi/smb/efcp/e-commerce/v1/orders";
const VTB_API_SANDBOX_HOST = "test3.api.vtb.ru";

// Russian Trusted Root CA certificates (НУЦ Минцифры) - required for VTB production SSL
// These are the official certificates from https://www.gosuslugi.ru/crt
const RUSSIAN_CA_URLS = [
  "https://gu-st.ru/content/Other/doc/russiantrustedca.pem",
  "https://gu-st.ru/content/lending/russian_trusted_root_ca_pem.crt",
  "https://gu-st.ru/content/lending/russian_trusted_sub_ca_pem.crt",
];

// Embedded Russian Trusted Root CA (fallback if fetch fails)
const EMBEDDED_RUSSIAN_ROOT_CA = `-----BEGIN CERTIFICATE-----
MIIFwjCCA6qgAwIBAgICEAAwDQYJKoZIhvcNAQELBQAwcDELMAkGA1UEBhMCUlUx
PzA9BgNVBAoMNlRoZSBNaW5pc3RyeSBvZiBEaWdpdGFsIERldmVsb3BtZW50IGFu
ZCBDb21tdW5pY2F0aW9uczEgMB4GA1UEAwwXUnVzc2lhbiBUcnVzdGVkIFJvb3Qg
Q0EwHhcNMjIwMzAxMjEwNDE1WhcNMzIwMjI3MjEwNDE1WjBwMQswCQYDVQQGEwJS
VTE/MD0GA1UECgw2VGhlIE1pbmlzdHJ5IG9mIERpZ2l0YWwgRGV2ZWxvcG1lbnQg
YW5kIENvbW11bmljYXRpb25zMSAwHgYDVQQDDBdSdXNzaWFuIFRydXN0ZWQgUm9v
dCBDQTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAMfFOZ8pHlc45jPu
7p/fQxuNLi7o5+/9cLQUOGALaJzLRvLKqAUz7ppB3t6bQ1U8i8vXHOgE1OKS5C7m
PLI6jXfGwXqoUmGC5bmJSsMhTWC4bvBt6L+E3WnvQ5bvCHT4+mWM8MzAqV76woIR
+t/RHCnh1WZGFbNTMO1dMfFHRaLpPMKhJFVpUfj7j7PpLr0LLNhDf9VnOB9KQOQL
EQelk/FQ6gGZJaLSYmXFqXN1hUZxMYIu0NPPjjKqQKoD6W1aCQdowWWD8FhNCuMK
1LLWPB3v3gN3gLe/3O49eX4P2q54PR26mcFbMzNPfWxv0ZLpW4AZ4jKU8FWCHNT6
a+xBfPb9eXkN0WUMos06s2NlLNKpWN4prILoRWMJLXpvKGIhTKYvkfb2GPhz5Xbh
SL3VhPq64a0wVt9P/bMD51ANT3KwfT7Kp3mAMFFAvPmqP0sN4pt07xm9hBvPH9Pm
GcWUoPPZ7Qx91KJz7gsHtQ0RpEVg7HMqLn/P5TuFALTqDoxhEqEC4AU4r9VCPB1E
VL9hJBvo2dVQjZ9d0ErXvBj9VmrfpqYH6bOOb9X5cDK7H6bQxt7SvJ3hN5LMy8+b
NT7gD4CEyEM0N+7Pj+nBywUh8c++W+RNcLVWefi1QIkHHnN+LHdAmyM9he4uL8IG
OWhtTAWpL4pX/LNC97ZrO+Y9VB7xAgMBAAGjZjBkMB0GA1UdDgQWBBRh7LR3i0jT
5WzpaLj3JJ42fxOvIjAfBgNVHSMEGDAWgBRh7LR3i0jT5WzpaLj3JJ42fxOvIjAS
BgNVHRMBAf8ECDAGAQH/AgEBMA4GA1UdDwEB/wQEAwIBhjANBgkqhkiG9w0BAQsF
AAOCAgEAYIiX0TeBBH/Y7EIE7mA07RNy3y9m9k5zfTY0IWd40p6BmIBLM4AQhc6m
hGymM8ypkln7Sq9p6WL/EDU1Fsp2sFdUbNj0OZmq3BwAMO8RWyf+PtQ1TmJwlDFg
7hv7uK5v0VPBYNq9rK6pqdKH+bS+Q4zbnovQ5FTfEN6/S/+DfMP/SB6z+ElyVCCe
hKM4L9g5pApOYbqJHf/PM1cDWKJbV9w7v9V8KlVbHbX7sQXW0BzAwb/PFN8rbyRL
UmGM50z9mYenb8Fxc8ScH5hfQZLJflRTXt/O5oCXjnHLQ8vA+qn5rpnPrDEv22Kt
bN/A2oi1G3eX/yulP+ssL4Qj9SXMaH4S6JeXoMfPEzK5QPQaJJNqpPsFQ5PEf3yv
q5GsS7Q8yDay0gIxJ0WfqBK2CAqRH9Rel9Z7MAGfWvNfPoQe4AYlVsqZD/AVW2K5
mvA8E7x/qrGIqlmhULkGWuv9MuLAf3dGJJPqHML8xRsv/+A86l7F55hBFQA6SLMM
sKMBKKXzPhScL84Dw/NNm9fL6VzWlH7E/LToMB/TRUW+c29KUjnj/+hux+ulRWbJ
g0mbyWk7vkfV8CHHT17Ts3PvL9wfss7j9s93RZkQex5cLk5hO0CXUM/5gD66Tvzj
a/a2hKpMtPr6x4EoLfBLfab0Dl3OS2ExCUGPpfMcE5LUvFXWg8c=
-----END CERTIFICATE-----`;

// Embedded Russian Trusted Sub CA (intermediate certificate)
const EMBEDDED_RUSSIAN_SUB_CA = `-----BEGIN CERTIFICATE-----
MIIGKjCCBBKgAwIBAgICEAIwDQYJKoZIhvcNAQELBQAwcDELMAkGA1UEBhMCUlUx
PzA9BgNVBAoMNlRoZSBNaW5pc3RyeSBvZiBEaWdpdGFsIERldmVsb3BtZW50IGFu
ZCBDb21tdW5pY2F0aW9uczEgMB4GA1UEAwwXUnVzc2lhbiBUcnVzdGVkIFJvb3Qg
Q0EwHhcNMjIwMzAxMjEwNjM0WhcNMzIwMjI3MjEwNjM0WjBvMQswCQYDVQQGEwJS
VTE/MD0GA1UECgw2VGhlIE1pbmlzdHJ5IG9mIERpZ2l0YWwgRGV2ZWxvcG1lbnQg
YW5kIENvbW11bmljYXRpb25zMR8wHQYDVQQDDBZSdXNzaWFuIFRydXN0ZWQgU3Vi
IENBMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA3dk7gKy/9VvpF2O2
oBWKzR3cMNZYyU8n/8YFVtPg/W5RCRDUxQKQCGkj0KlWrWYJ5DvRGVoSbKJuPpKS
1Yxqk3Q6dLYV3LNdWf4Pw9cC6dKfNpOCZ6YLt0zGYqAqNyf/0QmQM9eU6QpOE8Jj
VULSwKmNc7bSN1YF93y7G5jQJjq2a5jWZ9Fj8pS9hVG3T5eA5hPwHa9cO8pLYm+v
/xGM2WyxE7m/dQCZyfsIqdKyhgU1cD/vMQl/Zcr9P6lV2nCH0E7xLWhhflPmjJ5e
LxOqsPFSZLB5gwsJR3Ln7r/0bE7SryMGq4lEBd4F6dCHhFPZb6F5Rm8LKJkZMcxT
D+x0F8X9C8Gb3gIgxhCwpnAy+s3Yzp7otwQsK7NcGnZ9xS3YGMsC4G8jPj3Tp6TX
sXO0YqLsfFlGAl3mfL7v9poPiU7sRYp5O5PH0rP+kQ2Hzl/eNGcMUKU0NxWag06B
9ydE5j7T3/zl3c1bmPhLHN8PD+vfyYDqh+Y0lGvAc0P/bTmQg7h/o13O1o0bQQHT
bL4Jvyj2kL8xK5WOzTSoLfh7A7oPqsxLdv0xaHTMPnp3t6AyPth/V+T2uUCzH9xY
8s6S+54iF0TK1MWl0vvNjmM3ELI3K4L0ADQK7yIRQDvC+H5O7C3P7Q+bXo7Jh+uG
I7nStPtLFPr4V7e7fPHy6H3hNwkCAwEAAaOB0jCBzzAdBgNVHQ4EFgQUp7kg8lWq
ZBfUW1fPAZ0G9C3ct24wHwYDVR0jBBgwFoAUYey0d4tI0+Vs6Wi49ySeNn8TryIw
EgYDVR0TAQH/BAgwBgEB/wIBADAOBgNVHQ8BAf8EBAMCAYYwOQYDVR0gBDIwMDAu
BgRVHSAAMCYwJAYIKwYBBQUHAgEWGGh0dHBzOi8vZ29zdXNsdWdpLnJ1L2NydDAu
BgNVHR8EJzAlMCOgIaAfhh1odHRwOi8vY3JsLmdvc3VzbHVnaS5ydS9jYS5jcmww
DQYJKoZIhvcNAQELBQADggIBAI5eM+kC34/VpFpH7a94arBV+U9fcw6zZT1ELN/0
00TjJxdyH60u0x8oN8YOIE8vXh3n+BLzPpKg7WQZQWq/f5d4dZ5JvpT8DVvEfLi8U
7x9xNeTMCIX/4cjfsH3yXSBb32n1L0qQ7ylmhK3+WLYG2jiRqOZ6nZTJ4BTmVpAW
F5qAuYh6LQ3/K9DuMYn4yDyLz7z3dcZKqVlpFTq6g2cv8g7IWd1PB+gR7UfEV5kH
iHjHzJHhHCvP0sDSxIIqhM3YC8rVU2R8pLxnq8t7F7v1o3qrDwpo0+/qoM/T9gBE
6LqHj3xQc/xeM5LqKLkbH9ZqWL5C9k8X6gTPZN7zJVP3yW3C7F6a/xN89FW4GPYY
K9B5TbCuI0L6vtZvJNk0b0p6VnRbE5k1zray0J8VxbJq2j3T6v3BVE+dL9s9S2v+
Z9PKpNMSF3fuL+wJN4Je+YnLnEe4i3sJj0MRl7I3CpKECEV0E1HLtzBgLqpkVXrt
PxUdYgE30CjY5B4kHYe9dZK9pZMaVw48M0ymkVGWM9K0bVRWFkM8K0Jv8xToL/4e
7PHfPG27lc9bCLitTw85/Ksv9EACP0H44cK0aLDwWmsYxDWDBUdHnR8gBQb5MBUD
X5aXj1oa/Tk/Tph2J/A4+4D3li3N3G1TwCm6byVBFpQB+/hWMKR7m/uI9Fah/r2J
fLan
-----END CERTIFICATE-----`;

let cachedRussianCAs: string[] | null = null;

async function getRussianCAs(): Promise<string[]> {
  if (cachedRussianCAs) return cachedRussianCAs;

  const certificates: string[] = [];
  
  for (const url of RUSSIAN_CA_URLS) {
    try {
      console.log('Fetching Russian CA from:', url);
      const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (resp.ok) {
        const cert = await resp.text();
        if (cert.includes('-----BEGIN CERTIFICATE-----')) {
          certificates.push(cert);
          console.log('Fetched CA certificate from', url, 'length:', cert.length);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch CA from', url, ':', err instanceof Error ? err.message : err);
    }
  }

  // Always include embedded certificates as fallback
  if (!certificates.some(c => c.includes('Russian Trusted Root CA'))) {
    certificates.push(EMBEDDED_RUSSIAN_ROOT_CA);
    console.log('Added embedded Russian Trusted Root CA');
  }
  if (!certificates.some(c => c.includes('Russian Trusted Sub CA'))) {
    certificates.push(EMBEDDED_RUSSIAN_SUB_CA);
    console.log('Added embedded Russian Trusted Sub CA');
  }

  cachedRussianCAs = certificates;
  console.log('Total Russian CA certificates loaded:', certificates.length);
  return certificates;
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
    // Fetch Russian CA for VTB SSL connections
    const russianCAs = await getRussianCAs();
    const caCerts = russianCAs.length > 0 ? russianCAs : undefined;
    (result as any).russianCaLoaded = russianCAs.length;
    console.log('Russian CA certificates loaded:', russianCAs.length);

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
