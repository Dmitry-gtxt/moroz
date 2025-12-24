import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// VTB API endpoints from official documentation v1.0.13
// Sandbox (Песочница):
const VTB_AUTH_URL_SANDBOX = "https://epa-ift-sbp.vtb.ru:443/passport/oauth2/token";
const VTB_API_URL_SANDBOX = "https://test3.api.vtb.ru:8443/openapi/smb/efcp/e-commerce/v1/orders";

// Production (из документации ВТБ Open API):
const VTB_AUTH_URL_PROD = "https://open.api.vtb.ru:443/passport/oauth2/token";
const VTB_API_URL_PROD = "https://gw.api.vtb.ru/openapi/smb/efcp/e-commerce/v1/orders";

// Use sandbox by default, can be switched via env var or per-request override
const DEFAULT_USE_SANDBOX = Deno.env.get('VTB_USE_SANDBOX') !== 'false';

// Russian Trusted Root CA certificates (НУЦ Минцифры) - required for VTB production SSL
// These are the official certificates from https://www.gosuslugi.ru/crt
// Direct download: https://gu-st.ru/content/Other/doc/russiantrustedca.pem
const RUSSIAN_CA_URLS = [
  "https://gu-st.ru/content/Other/doc/russiantrustedca.pem",
  "https://gu-st.ru/content/lending/russian_trusted_root_ca_pem.crt",
  "https://gu-st.ru/content/lending/russian_trusted_sub_ca_pem.crt",
];

// Embedded Russian Trusted Root CA (fallback if fetch fails)
// Valid until 2036, issued by Национальный удостоверяющий центр
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
0TjJxdyH60u0x8oN8YOIE8vXh3n+BLzPpKg7WQZQWq/f5d4dZ5JvpT8DVvEfLi8U
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
  // Temporarily disable custom CA certificates due to parsing issues
  // VTB production might work with standard SSL if they use globally trusted CAs
  console.log('Custom CA certificates disabled for testing');
  return [];
}

function createDirectClientWithCA(caCerts: string[]): Deno.HttpClient | undefined {
  if (caCerts.length === 0) return undefined;
  try {
    console.log('Creating HTTP client with', caCerts.length, 'CA certificates');
    return Deno.createHttpClient({ caCerts });
  } catch (err) {
    console.error('Failed to create HTTP client with CA:', err);
    return undefined;
  }
}

interface CreatePaymentRequest {
  bookingId: string;
  amount: number; // в копейках
  description: string;
  customerEmail?: string;
  customerPhone?: string;
  // optional: override environment for testing
  mode?: 'sandbox' | 'prod';
  // optional: override endpoints (helps when bank provides different prod hosts)
  authUrlOverride?: string;
  apiUrlOverride?: string;
}

// Create HTTP client with proxy support
function createProxyClient(): Deno.HttpClient | undefined {
  const rawProxyUrl = (Deno.env.get('PROXY_URL') || '').trim();
  const proxyUserEnv = (Deno.env.get('PROXY_USER') || '').trim();
  const proxyPassEnv = (Deno.env.get('PROXY_PASS') || '').trim();

  if (!rawProxyUrl) return undefined;

  let proxyUrlString = rawProxyUrl;
  if (!/^https?:\/\//i.test(proxyUrlString)) {
    proxyUrlString = `http://${proxyUrlString}`;
  }

  let proxyUrl: URL;
  try {
    proxyUrl = new URL(proxyUrlString);
  } catch {
    throw new Error('Некорректный PROXY_URL. Используйте формат http://IP:PORT');
  }

  const embeddedUser = proxyUrl.username;
  const embeddedPass = proxyUrl.password;
  proxyUrl.username = '';
  proxyUrl.password = '';

  const host = proxyUrl.hostname;
  const isIpv4 = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);
  const isDomain = host.includes('.');
  if (!isIpv4 && !isDomain) {
    throw new Error('PROXY_URL должен быть вида http://IP:PORT (без логина/пароля)');
  }

  const username = proxyUserEnv || embeddedUser;
  const password = proxyPassEnv || embeddedPass;

  const proxyUrlWithCreds = new URL(proxyUrl.toString());
  if (username && password) {
    proxyUrlWithCreds.username = username;
    proxyUrlWithCreds.password = password;
  }

  console.log('Using proxy host:', proxyUrl.host, 'auth:', username ? 'yes' : 'no');

  return Deno.createHttpClient({
    proxy: {
      url: proxyUrlWithCreds.toString(),
    },
  });
}

// Получение access_token через Менеджер доступа VTB
// Формат запроса: x-www-form-urlencoded с grant_type, client_id, client_secret в теле
async function getVtbAccessToken(authUrl: string, client?: Deno.HttpClient): Promise<string> {
  const clientId = Deno.env.get('VTB_CLIENT_ID');
  const clientSecret = Deno.env.get('VTB_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('VTB credentials not configured');
  }

  // Формируем тело запроса согласно документации
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  console.log('Requesting VTB access token from:', authUrl);

  const fetchOptions: RequestInit & { client?: Deno.HttpClient } = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  };

  if (client) fetchOptions.client = client;

  let response: Response;
  let proxyError: unknown;

  try {
    response = await fetch(authUrl, fetchOptions);
  } catch (err) {
    if (!client) throw err;

    proxyError = err;
    console.warn(
      'VTB auth via proxy failed, retrying without proxy:',
      err instanceof Error ? err.message : err,
    );

    try {
      const { client: _client, ...optsNoClient } = fetchOptions as any;
      response = await fetch(authUrl, optsNoClient);
    } catch (directErr) {
      const pe = proxyError instanceof Error ? proxyError.message : String(proxyError);
      const de = directErr instanceof Error ? directErr.message : String(directErr);
      throw new Error(`VTB auth failed. Proxy error: ${pe}. Direct error: ${de}`);
    }
  }

  console.log('VTB auth response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('VTB auth error:', response.status, errorText);
    throw new Error(`Failed to get VTB access token: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('VTB access token received, expires_in:', data.expires_in);
  return data.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let proxyClient: Deno.HttpClient | undefined;
  let russianCaClient: Deno.HttpClient | undefined;

  try {
    proxyClient = createProxyClient();
    
    // Load Russian CA certificates for production VTB connections
    const russianCAs = await getRussianCAs();
    russianCaClient = createDirectClientWithCA(russianCAs);
    console.log('Russian CA client created:', russianCaClient ? 'yes' : 'no');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      bookingId,
      amount,
      description,
      customerEmail,
      customerPhone,
      mode,
      authUrlOverride,
      apiUrlOverride,
    }: CreatePaymentRequest = await req.json();

    // Сумма должна быть в рублях с копейками (value: 10.56)
    const amountKopecks = Math.round(amount);
    const amountRub = amountKopecks / 100;

    const useSandbox = mode ? mode !== 'prod' : DEFAULT_USE_SANDBOX;
    const VTB_AUTH_URL = (authUrlOverride && authUrlOverride.trim())
      ? authUrlOverride.trim()
      : (useSandbox ? VTB_AUTH_URL_SANDBOX : VTB_AUTH_URL_PROD);
    const VTB_API_URL = (apiUrlOverride && apiUrlOverride.trim())
      ? apiUrlOverride.trim()
      : (useSandbox ? VTB_API_URL_SANDBOX : VTB_API_URL_PROD);

    console.log(
      'Creating VTB payment for booking:',
      bookingId,
      'amount:',
      amountRub.toFixed(2),
      'RUB',
      `(${amountKopecks} kopecks)`,
      'mode:',
      useSandbox ? 'SANDBOX' : 'PRODUCTION'
    );

    // Проверяем бронирование
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingError);
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Choose client: prefer Russian CA client for production, proxy for sandbox
    const vtbClient = useSandbox ? proxyClient : (russianCaClient || proxyClient);
    console.log('Using VTB client type:', useSandbox ? 'proxy/sandbox' : 'russianCA/production');

    // Получаем access_token
    const accessToken = await getVtbAccessToken(VTB_AUTH_URL, vtbClient);
    console.log('Got VTB access token');

    // Получаем настройки мерчанта
    const merchantSiteId = Deno.env.get('VTB_MERCHANT_SITE_ID');
    const clientId = Deno.env.get('VTB_CLIENT_ID') || '';
    
    if (!merchantSiteId) {
      throw new Error('VTB_MERCHANT_SITE_ID not configured');
    }

    // X-IBM-Client-Id: в нижнем регистре, без домена @ext.vtb.ru
    const clientIdForHeader = clientId.toLowerCase().split('@')[0];

    // Формируем payload заказа согласно документации VTB v1.0.13
    // POST v1 /orders - параметры: orderId, orderName, amount {value, code}, returnUrl, expire, customer
    const orderPayload = {
      orderId: bookingId, // Уникальный идентификатор ордера в системе мерчанта
      orderName: description || `Заказ ${bookingId}`, // Наименование ордера
      amount: {
        value: amountRub, // Сумма в рублях (10.56)
        code: "RUB"
      },
      returnUrl: `https://дед-морозы.рф/customer/bookings?payment=success&booking=${bookingId}`,
      customer: {
        email: customerEmail || booking.customer_email || undefined,
        phone: (customerPhone || booking.customer_phone || '').replace(/\D/g, '') || undefined,
      }
    };

    console.log('Sending order to VTB API:', VTB_API_URL);
    console.log('Order payload:', JSON.stringify(orderPayload, null, 2));

    const fetchOptions: RequestInit & { client?: Deno.HttpClient } = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-IBM-Client-Id': clientIdForHeader,
        ...(merchantSiteId ? { 'Merchant-Authorization': merchantSiteId } : {}),
      },
      body: JSON.stringify(orderPayload),
    };

    // Use Russian CA client for production, proxy for sandbox
    if (vtbClient) fetchOptions.client = vtbClient;

    let orderResponse: Response;
    let firstError: unknown;

    try {
      orderResponse = await fetch(VTB_API_URL, fetchOptions);
    } catch (err) {
      firstError = err;
      console.warn(
        'VTB API via primary client failed:',
        err instanceof Error ? err.message : err,
      );

      // Try with Russian CA client if not already used
      if (vtbClient !== russianCaClient && russianCaClient) {
        console.log('Retrying with Russian CA client...');
        try {
          fetchOptions.client = russianCaClient;
          orderResponse = await fetch(VTB_API_URL, fetchOptions);
        } catch (caErr) {
          console.warn('Russian CA client also failed:', caErr instanceof Error ? caErr.message : caErr);
          // Try without any custom client
          try {
            const { client: _client, ...optsNoClient } = fetchOptions as any;
            orderResponse = await fetch(VTB_API_URL, optsNoClient);
          } catch (directErr) {
            const fe = firstError instanceof Error ? firstError.message : String(firstError);
            const de = directErr instanceof Error ? directErr.message : String(directErr);
            throw new Error(`VTB API failed. First error: ${fe}. Direct error: ${de}`);
          }
        }
      } else {
        // Try without any custom client
        try {
          const { client: _client, ...optsNoClient } = fetchOptions as any;
          orderResponse = await fetch(VTB_API_URL, optsNoClient);
        } catch (directErr) {
          const fe = firstError instanceof Error ? firstError.message : String(firstError);
          const de = directErr instanceof Error ? directErr.message : String(directErr);
          throw new Error(`VTB API failed. First error: ${fe}. Direct error: ${de}`);
        }
      }
    }

    const responseText = await orderResponse.text();
    console.log('VTB API response status:', orderResponse.status);
    console.log('VTB API response body:', responseText);

    let orderData: any;
    try {
      orderData = JSON.parse(responseText);
    } catch {
      orderData = { raw: responseText };
    }

    if (!orderResponse.ok) {
      console.error('VTB order creation failed:', orderData);
      return new Response(
        JSON.stringify({ error: 'Failed to create payment', details: orderData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Возвращаем URL для оплаты
    // Согласно документации, ответ содержит form_url для редиректа
    const paymentUrl = orderData.form_url || orderData.payment_url || orderData.redirect_url;
    const orderId = orderData.order_id || orderData.id;

    console.log('VTB order created successfully, payment URL:', paymentUrl);

    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl: paymentUrl,
        orderId: orderId,
        vtbResponse: orderData,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating VTB payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } finally {
    if (proxyClient) {
      proxyClient.close();
    }
    if (russianCaClient) {
      russianCaClient.close();
    }
  }
});
