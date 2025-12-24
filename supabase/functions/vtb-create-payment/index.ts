import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// VTB API endpoints
// Note: this project uses the invoice API (payUrl is returned as payment_url)
const VTB_AUTH_URL = "https://payment-gateway-api.vtb.ru/oauth/token";
const VTB_INVOICE_URL = "https://payment-gateway-api.vtb.ru/api/v1/invoices";


interface CreatePaymentRequest {
  bookingId: string;
  amount: number; // в копейках
  description: string;
  customerEmail?: string;
  customerPhone?: string;
}

// Create HTTP client with proxy support
function createProxyClient(): Deno.HttpClient | undefined {
  const rawProxyUrl = (Deno.env.get('PROXY_URL') || '').trim();
  const proxyUserEnv = (Deno.env.get('PROXY_USER') || '').trim();
  const proxyPassEnv = (Deno.env.get('PROXY_PASS') || '').trim();

  if (!rawProxyUrl) return undefined;

  // Accept both formats:
  // 1) http://ip:port
  // 2) user:pass@ip:port
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

  // Basic sanity-check: must be IP or domain (contain dot)
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

async function getVtbAccessToken(client?: Deno.HttpClient): Promise<string> {
  const clientId = Deno.env.get('VTB_CLIENT_ID');
  const clientSecret = Deno.env.get('VTB_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('VTB credentials not configured');
  }

  const credentials = btoa(`${clientId}:${clientSecret}`);

  const fetchOptions: RequestInit & { client?: Deno.HttpClient } = {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  };

  if (client) fetchOptions.client = client;

  let response: Response;
  let proxyError: unknown;

  try {
    response = await fetch(VTB_AUTH_URL, fetchOptions);
  } catch (err) {
    if (!client) throw err;

    proxyError = err;
    console.warn(
      'VTB auth via proxy failed, retrying without proxy:',
      err instanceof Error ? err.message : err,
    );

    try {
      const { client: _client, ...optsNoClient } = fetchOptions as any;
      response = await fetch(VTB_AUTH_URL, optsNoClient);
    } catch (directErr) {
      const pe = proxyError instanceof Error ? proxyError.message : String(proxyError);
      const de = directErr instanceof Error ? directErr.message : String(directErr);
      throw new Error(`VTB auth failed. Proxy error: ${pe}. Direct error: ${de}`);
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error('VTB auth error:', response.status, errorText);
    throw new Error(`Failed to get VTB access token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Create proxy client once for this request
  let proxyClient: Deno.HttpClient | undefined;

  try {
    proxyClient = createProxyClient();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { bookingId, amount, description, customerEmail, customerPhone }: CreatePaymentRequest = await req.json();

    const amountRub = Number((Math.round(amount) / 100).toFixed(2));

    console.log(
      'Creating VTB payment for booking:',
      bookingId,
      'amount:',
      amountRub,
      'RUB',
      `(raw=${amount} kopecks)`
    );

    // Validate booking exists and get details
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

    // Get VTB access token
    const accessToken = await getVtbAccessToken(proxyClient);
    console.log('Got VTB access token');

    // Create invoice in VTB
    const merchantSiteId = Deno.env.get('VTB_MERCHANT_SITE_ID');
    if (!merchantSiteId) {
      throw new Error('VTB_MERCHANT_SITE_ID not configured');
    }

    const invoicePayload = {
      merchant_site_id: merchantSiteId,
      amount: {
        value: amount, // в копейках
        currency: "RUB",
      },
      order: {
        order_id: bookingId,
        description: description,
      },
      settings: {
        success_url: `https://дед-морозы.рф/customer/bookings?payment=success&booking=${bookingId}`,
        fail_url: `https://дед-морозы.рф/customer/bookings?payment=failed&booking=${bookingId}`,
        notification_url: `https://дед-морозы.рф/api/vtb-webhook`,
      },
      customer: {
        email: customerEmail || booking.customer_email,
        phone: customerPhone || booking.customer_phone?.replace(/\D/g, ''),
      },
      ttl: 1440, // 24 hours in minutes
    };

    console.log('Sending invoice to VTB');

    const fetchOptions: RequestInit & { client?: Deno.HttpClient } = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoicePayload),
    };

    if (proxyClient) fetchOptions.client = proxyClient;

    let invoiceResponse: Response;
    let invoiceData: any;
    let proxyError: unknown;

    try {
      invoiceResponse = await fetch(VTB_INVOICE_URL, fetchOptions);
    } catch (err) {
      if (!proxyClient) throw err;

      proxyError = err;
      console.warn(
        'VTB invoice via proxy failed, retrying without proxy:',
        err instanceof Error ? err.message : err,
      );

      try {
        const { client: _client, ...optsNoClient } = fetchOptions as any;
        invoiceResponse = await fetch(VTB_INVOICE_URL, optsNoClient);
      } catch (directErr) {
        const pe = proxyError instanceof Error ? proxyError.message : String(proxyError);
        const de = directErr instanceof Error ? directErr.message : String(directErr);
        throw new Error(`VTB invoice failed. Proxy error: ${pe}. Direct error: ${de}`);
      }
    }

    invoiceData = await invoiceResponse.json();

    console.log('VTB invoice response status:', invoiceResponse.status);

    if (!invoiceResponse.ok) {
      console.error('VTB invoice creation failed:', invoiceData);
      return new Response(
        JSON.stringify({ error: 'Failed to create payment', details: invoiceData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl: invoiceData.payment_url,
        invoiceId: invoiceData.invoice_id,
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
    // Clean up proxy client
    if (proxyClient) {
      proxyClient.close();
    }
  }
});
