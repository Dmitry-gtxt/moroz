import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// VTB API endpoints
const VTB_AUTH_URL = "https://payment-gateway-api.vtb.ru/oauth/token";
const VTB_INVOICE_URL = "https://payment-gateway-api.vtb.ru/api/v1/invoices";

interface CreatePaymentRequest {
  bookingId: string;
  amount: number; // в копейках
  description: string;
  customerEmail?: string;
  customerPhone?: string;
}

async function getVtbAccessToken(): Promise<string> {
  const clientId = Deno.env.get('VTB_CLIENT_ID');
  const clientSecret = Deno.env.get('VTB_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('VTB credentials not configured');
  }

  const credentials = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch(VTB_AUTH_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('VTB auth error:', errorText);
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

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { bookingId, amount, description, customerEmail, customerPhone }: CreatePaymentRequest = await req.json();

    console.log('Creating VTB payment for booking:', bookingId, 'amount:', amount);

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
    const accessToken = await getVtbAccessToken();
    console.log('Got VTB access token');

    // Create invoice in VTB
    const merchantSiteId = Deno.env.get('VTB_MERCHANT_SITE_ID') || '9e628968-ff52-458a-b7b0-94b7d1f7fb10'; // test by default
    
    const invoicePayload = {
      merchant_site_id: merchantSiteId,
      amount: {
        value: amount, // в копейках
        currency: "RUB"
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

    console.log('Sending invoice to VTB:', JSON.stringify(invoicePayload));

    const invoiceResponse = await fetch(VTB_INVOICE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoicePayload),
    });

    const invoiceData = await invoiceResponse.json();
    console.log('VTB invoice response:', JSON.stringify(invoiceData));

    if (!invoiceResponse.ok) {
      console.error('VTB invoice creation failed:', invoiceData);
      return new Response(
        JSON.stringify({ error: 'Failed to create payment', details: invoiceData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save payment info to booking or create a payments table entry if needed
    // For now, we'll just return the payment URL

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
  }
});
