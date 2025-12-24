import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// VTB API endpoints (Production)
const VTB_AUTH_URL = "https://epa.api.vtb.ru/openapi/passport/oauth2/token";
const VTB_ORDERS_URL = "https://epa.api.vtb.ru/openapi/merchants/v1/orders";

// For sandbox/testing, use these instead:
// const VTB_AUTH_URL = "https://epa-ift-sbp.vtb.ru:443/passport/oauth2/token";
// const VTB_ORDERS_URL = "https://epa-ift-sbp.vtb.ru:443/api/v1/orders";

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
  } catch (e) {
    console.error('Invalid PROXY_URL:', rawProxyUrl);
    throw new Error('Некорректный PROXY_URL. Используйте формат http://ip:port или user:pass@ip:port');
  }

  const embeddedUser = proxyUrl.username;
  const embeddedPass = proxyUrl.password;
  proxyUrl.username = '';
  proxyUrl.password = '';

  const username = proxyUserEnv || embeddedUser;
  const password = proxyPassEnv || embeddedPass;

  console.log('Using proxy host:', proxyUrl.host);

  return Deno.createHttpClient({
    proxy: {
      url: proxyUrl.toString(),
      basicAuth: username && password ? { username, password } : undefined,
    },
  });
}

async function getVtbAccessToken(client?: Deno.HttpClient): Promise<string> {
  const clientId = Deno.env.get('VTB_CLIENT_ID');
  const clientSecret = Deno.env.get('VTB_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('VTB credentials not configured');
  }

  console.log('Getting VTB access token from:', VTB_AUTH_URL);

  // VTB uses form-urlencoded for token request
  const formData = new URLSearchParams();
  formData.append('grant_type', 'client_credentials');
  formData.append('client_id', clientId);
  formData.append('client_secret', clientSecret);

  const fetchOptions: RequestInit & { client?: Deno.HttpClient } = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  };

  if (client) {
    fetchOptions.client = client;
  }

  const response = await fetch(VTB_AUTH_URL, fetchOptions);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('VTB auth error:', response.status, errorText);
    throw new Error(`Failed to get VTB access token: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('VTB token received, expires_in:', data.expires_in);
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
    console.log('Got VTB access token successfully');

    // Get merchant site ID for Merchant-Authorization header (optional, if multiple sites)
    const merchantSiteId = Deno.env.get('VTB_MERCHANT_SITE_ID');

    // Create order in VTB according to API docs
    // Amount should be in rubles with optional decimal (e.g., 1055.20)
    const orderPayload = {
      orderId: bookingId, // Unique order ID in merchant system
      orderName: description,
      expire: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      amount: {
        value: amountRub,
        code: "RUB"
      },
      customer: {
        email: customerEmail || booking.customer_email,
        phone: customerPhone || booking.customer_phone?.replace(/\D/g, ''),
      },
      returnUrl: `https://дед-морозы.рф/customer/bookings?payment=callback&booking=${bookingId}`,
    };

    console.log('Sending order to VTB:', JSON.stringify(orderPayload));

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    // Add Merchant-Authorization if we have multiple sites
    if (merchantSiteId) {
      headers['Merchant-Authorization'] = merchantSiteId;
    }

    const fetchOptions: RequestInit & { client?: Deno.HttpClient } = {
      method: 'POST',
      headers,
      body: JSON.stringify(orderPayload),
    };

    if (proxyClient) {
      fetchOptions.client = proxyClient;
    }

    const orderResponse = await fetch(VTB_ORDERS_URL, fetchOptions);
    const orderData = await orderResponse.json();

    console.log('VTB order response status:', orderResponse.status);
    console.log('VTB order response:', JSON.stringify(orderData));

    if (!orderResponse.ok) {
      console.error('VTB order creation failed:', orderData);
      return new Response(
        JSON.stringify({ error: 'Failed to create payment', details: orderData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // VTB returns payUrl in the response object
    const payUrl = orderData.object?.payUrl || orderData.payUrl;
    const orderCode = orderData.object?.orderCode || orderData.orderCode;

    if (!payUrl) {
      console.error('No payUrl in VTB response:', orderData);
      return new Response(
        JSON.stringify({ error: 'No payment URL received from VTB', details: orderData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Payment URL:', payUrl);

    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl: payUrl,
        invoiceId: orderCode,
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
