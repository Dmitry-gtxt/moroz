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

// Use production by default (боевые доступы)
const DEFAULT_USE_SANDBOX = Deno.env.get('VTB_USE_SANDBOX') === 'true';

// Russian Trusted Root CA certificates (НУЦ Минцифры) - required for VTB production SSL
// These are the official certificates from https://www.gosuslugi.ru/crt
// Direct download: https://gu-st.ru/content/Other/doc/russiantrustedca.pem
const RUSSIAN_CA_URLS = [
  "https://gu-st.ru/content/Other/doc/russiantrustedca.pem",
  "https://gu-st.ru/content/lending/russian_trusted_root_ca_pem.crt",
  "https://gu-st.ru/content/lending/russian_trusted_sub_ca_pem.crt",
];

// Embedded Russian Trusted Root CA (from https://gu-st.ru/content/lending/russian_trusted_root_ca_pem.crt)
// Valid until 2032
const EMBEDDED_RUSSIAN_ROOT_CA = `-----BEGIN CERTIFICATE-----
MIIFwjCCA6qgAwIBAgICEAAwDQYJKoZIhvcNAQELBQAwcDELMAkGA1UEBhMCUlUx
PzA9BgNVBAoMNlRoZSBNaW5pc3RyeSBvZiBEaWdpdGFsIERldmVsb3BtZW50IGFu
ZCBDb21tdW5pY2F0aW9uczEgMB4GA1UEAwwXUnVzc2lhbiBUcnVzdGVkIFJvb3Qg
Q0EwHhcNMjIwMzAxMjEwNDE1WhcNMzIwMjI3MjEwNDE1WjBwMQswCQYDVQQGEwJS
VTE/MD0GA1UECgw2VGhlIE1pbmlzdHJ5IG9mIERpZ2l0YWwgRGV2ZWxvcG1lbnQg
YW5kIENvbW11bmljYXRpb25zMSAwHgYDVQQDDBdSdXNzaWFuIFRydXN0ZWQgUm9v
dCBDQTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAMfFOZ8pUAL3+r2n
qqE0Zp52selXsKGFYoG0GM5bwz1bSFtCt+AZQMhkWQheI3poZAToYJu69pHLKS6Q
XBiwBC1cvzYmUYKMYZC7jE5YhEU2bSL0mX7NaMxMDmH2/NwuOVRj8OImVa5s1F4U
zn4Kv3PFlDBjjSjXKVY9kmjUBsXQrIHeaqmUIsPIlNWUnimXS0I0abExqkbdrXbX
YwCOXhOO2pDUx3ckmJlCMUGacUTnylyQW2VsJIyIGA8V0xzdaeUXg0VZ6ZmNUr5Y
Ber/EAOLPb8NYpsAhJe2mXjMB/J9HNsoFMBFJ0lLOT/+dQvjbdRZoOT8eqJpWnVD
U+QL/qEZnz57N88OWM3rabJkRNdU/Z7x5SFIM9FrqtN8xewsiBWBI0K6XFuOBOTD
4V08o4TzJ8+Ccq5XlCUW2L48pZNCYuBDfBh7FxkB7qDgGDiaftEkZZfApRg2E+M9
G8wkNKTPLDc4wH0FDTijhgxR3Y4PiS1HL2Zhw7bD3CbslmEGgfnnZojNkJtcLeBH
BLa52/dSwNU4WWLubaYSiAmA9IUMX1/RpfpxOxd4Ykmhz97oFbUaDJFipIggx5sX
ePAlkTdWnv+RWBxlJwMQ25oEHmRguNYf4Zr/Rxr9cS93Y+mdXIZaBEE0KS2iLRqa
OiWBki9IMQU4phqPOBAaG7A+eP8PAgMBAAGjZjBkMB0GA1UdDgQWBBTh0YHlzlpf
BKrS6badZrHF+qwshzAfBgNVHSMEGDAWgBTh0YHlzlpfBKrS6badZrHF+qwshzAS
BgNVHRMBAf8ECDAGAQH/AgEEMA4GA1UdDwEB/wQEAwIBhjANBgkqhkiG9w0BAQsF
AAOCAgEAALIY1wkilt/urfEVM5vKzr6utOeDWCUczmWX/RX4ljpRdgF+5fAIS4vH
tmXkqpSCOVeWUrJV9QvZn6L227ZwuE15cWi8DCDal3Ue90WgAJJZMfTshN4OI8cq
W9E4EG9wglbEtMnObHlms8F3CHmrw3k6KmUkWGoa+/ENmcVl68u/cMRl1JbW2bM+
/3A+SAg2c6iPDlehczKx2oa95QW0SkPPWGuNA/CE8CpyANIhu9XFrj3RQ3EqeRcS
AQQod1RNuHpfETLU/A2gMmvn/w/sx7TB3W5BPs6rprOA37tutPq9u6FTZOcG1Oqj
C/B7yTqgI7rbyvox7DEXoX7rIiEqyNNUguTk/u3SZ4VXE2kmxdmSh3TQvybfbnXV
4JbCZVaqiZraqc7oZMnRoWrXRG3ztbnbes/9qhRGI7PqXqeKJBztxRTEVj8ONs1d
WN5szTwaPIvhkhO3CO5ErU2rVdUr89wKpNXbBODFKRtgxUT70YpmJ46VVaqdAhOZ
D9EUUn4YaeLaS8AjSF/h7UkjOibNc4qVDiPP+rkehFWM66PVnP1Msh93tc+taIfC
EYVMxjh8zNbFuoc7fzvvrFILLe7ifvEIUqSVIC/AzplM/Jxw7buXFeGP1qVCBEHq
391d/9RAfaZ12zkwFsl+IKwE/OZxW8AHa9i1p4GO0YSNuczzEm4=
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
  // Use only the embedded root CA - it's the official Russian Trusted Root CA
  console.log('Using embedded Russian Trusted Root CA');
  return [EMBEDDED_RUSSIAN_ROOT_CA];
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

// Proxy support disabled - using direct connection
function createProxyClient(): Deno.HttpClient | undefined {
  console.log('Proxy disabled - using direct connection');
  return undefined;
}

// Получение access_token через Менеджер доступа VTB
// Формат запроса: x-www-form-urlencoded с grant_type, client_id, client_secret в теле
async function getVtbAccessToken(authUrl: string, client?: Deno.HttpClient): Promise<string> {
  const clientId = Deno.env.get('VTB_CLIENT_ID');
  const clientSecret = Deno.env.get('VTB_CLIENT_SECRET');

  console.log('VTB credentials check - clientId:', clientId ? `${clientId.substring(0, 10)}...` : 'NOT SET', 
              'clientSecret length:', clientSecret ? clientSecret.length : 0);

  if (!clientId || !clientSecret) {
    throw new Error('VTB credentials not configured');
  }

  // Формируем тело запроса согласно документации
  const bodyWithCreds = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  // Альтернативный (часто требуемый) формат: Basic auth + только grant_type в body
  const basic = btoa(`${clientId}:${clientSecret}`);
  const bodyBasic = new URLSearchParams({
    grant_type: 'client_credentials',
  });

  console.log('Requesting VTB access token from:', authUrl);
  console.log('Request body preview:', `grant_type=client_credentials&client_id=${clientId.substring(0, 15)}...`);

  const strategies: Array<{ name: string; headers: Record<string, string>; body: string }> = [
    {
      name: 'body_credentials',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: bodyWithCreds.toString(),
    },
    {
      name: 'basic_auth',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basic}`,
      },
      body: bodyBasic.toString(),
    },
  ];

  let lastErrorText: string | null = null;

  for (const strat of strategies) {
    const fetchOptions: RequestInit & { client?: Deno.HttpClient } = {
      method: 'POST',
      headers: strat.headers,
      body: strat.body,
    };

    if (client) fetchOptions.client = client;

    let response: Response;

    try {
      response = await fetch(authUrl, fetchOptions);
    } catch (err) {
      if (!client) throw err;

      console.warn(
        `VTB auth (${strat.name}) via custom client failed, retrying without custom client:`,
        err instanceof Error ? err.message : err,
      );

      try {
        const { client: _client, ...optsNoClient } = fetchOptions as any;
        response = await fetch(authUrl, optsNoClient);
      } catch (directErr) {
        const de = directErr instanceof Error ? directErr.message : String(directErr);
        throw new Error(`VTB auth failed (${strat.name}). Direct error: ${de}`);
      }
    }

    console.log(`VTB auth response status (${strat.name}):`, response.status);

    if (!response.ok) {
      lastErrorText = await response.text();
      console.error('VTB auth error:', response.status, lastErrorText);
      continue;
    }

    const data = await response.json();
    console.log('VTB access token received, expires_in:', data.expires_in, 'strategy:', strat.name);
    return data.access_token;
  }

  throw new Error(`Failed to get VTB access token (all strategies). Last error: ${lastErrorText ?? 'unknown'}`);

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

    // Always use direct connection with Russian CA certificates
    const vtbClient = russianCaClient;
    console.log('Using direct connection with Russian CA client:', vtbClient ? 'yes' : 'no (fallback to system)');

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
    // VTB API возвращает структуру: { type: "ORDER", object: { payUrl: "...", orderId: "...", orderCode: "..." } }
    const paymentUrl = orderData.object?.payUrl || orderData.payUrl || orderData.form_url || orderData.payment_url || orderData.redirect_url;
    const orderId = orderData.object?.orderCode || orderData.object?.orderId || orderData.order_id || orderData.id;

    console.log('VTB order created successfully, payment URL:', paymentUrl, 'orderId:', orderId);

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
