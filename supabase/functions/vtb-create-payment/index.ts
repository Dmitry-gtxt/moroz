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

// Production:
const VTB_AUTH_URL_PROD = "https://epa.api.vtb.ru:443/passport/oauth2/token";
const VTB_API_URL_PROD = "https://api.vtb.ru:443/openapi/smb/efcp/e-commerce/v1/orders";

// Use sandbox by default, can be switched via env var or per-request override
const DEFAULT_USE_SANDBOX = Deno.env.get('VTB_USE_SANDBOX') !== 'false';

interface CreatePaymentRequest {
  bookingId: string;
  amount: number; // в копейках
  description: string;
  customerEmail?: string;
  customerPhone?: string;
  // optional: override environment for testing
  mode?: 'sandbox' | 'prod';
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

  try {
    proxyClient = createProxyClient();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { bookingId, amount, description, customerEmail, customerPhone, mode }: CreatePaymentRequest = await req.json();

    // Сумма должна быть в рублях с копейками (value: 10.56)
    const amountKopecks = Math.round(amount);
    const amountRub = amountKopecks / 100;

    const useSandbox = mode ? mode !== 'prod' : DEFAULT_USE_SANDBOX;
    const VTB_AUTH_URL = useSandbox ? VTB_AUTH_URL_SANDBOX : VTB_AUTH_URL_PROD;
    const VTB_API_URL = useSandbox ? VTB_API_URL_SANDBOX : VTB_API_URL_PROD;

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

    // Получаем access_token
    const accessToken = await getVtbAccessToken(VTB_AUTH_URL, proxyClient);
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

    if (proxyClient) fetchOptions.client = proxyClient;

    let orderResponse: Response;
    let proxyError: unknown;

    try {
      orderResponse = await fetch(VTB_API_URL, fetchOptions);
    } catch (err) {
      if (!proxyClient) throw err;

      proxyError = err;
      console.warn(
        'VTB API via proxy failed, retrying without proxy:',
        err instanceof Error ? err.message : err,
      );

      try {
        const { client: _client, ...optsNoClient } = fetchOptions as any;
        orderResponse = await fetch(VTB_API_URL, optsNoClient);
      } catch (directErr) {
        const pe = proxyError instanceof Error ? proxyError.message : String(proxyError);
        const de = directErr instanceof Error ? directErr.message : String(directErr);
        throw new Error(`VTB API failed. Proxy error: ${pe}. Direct error: ${de}`);
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
  }
});
