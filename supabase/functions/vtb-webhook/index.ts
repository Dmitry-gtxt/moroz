import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VtbWebhookPayload {
  invoice_id: string;
  order_id: string; // This is our booking_id
  status: 'created' | 'pending' | 'paid' | 'expired' | 'declined' | 'refunded';
  amount: {
    value: number;
    currency: string;
  };
  paid_at?: string;
  transaction_id?: string;
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

    // Get raw body for logging
    const rawBody = await req.text();
    console.log('VTB Webhook received:', rawBody);

    const payload: VtbWebhookPayload = JSON.parse(rawBody);
    const { invoice_id, order_id, status, amount, paid_at, transaction_id } = payload;

    console.log(`Processing webhook for booking ${order_id}, status: ${status}`);

    // Map VTB status to our payment_status
    let paymentStatus: 'not_paid' | 'prepayment_paid' | 'fully_paid' | 'refunded';
    let bookingStatus: string | null = null;

    switch (status) {
      case 'paid':
        // Check if this is prepayment or full payment based on amount
        // For now, treat all successful payments as prepayment_paid
        paymentStatus = 'prepayment_paid';
        bookingStatus = 'confirmed';
        break;
      case 'refunded':
        paymentStatus = 'refunded';
        bookingStatus = 'cancelled';
        break;
      case 'declined':
      case 'expired':
        // Payment failed, keep as not_paid
        paymentStatus = 'not_paid';
        break;
      default:
        // pending, created - no status change
        console.log(`Ignoring status: ${status}`);
        return new Response(
          JSON.stringify({ success: true, message: 'Status acknowledged' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Update booking with payment status
    const updateData: Record<string, unknown> = {
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    };

    if (bookingStatus) {
      updateData.status = bookingStatus;
    }

    const { error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', order_id);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update booking' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Booking ${order_id} updated: payment_status=${paymentStatus}, status=${bookingStatus}`);

    // Log the transaction for audit
    await supabase
      .from('audit_logs')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // System user
        action: 'vtb_payment_webhook',
        entity_type: 'booking',
        entity_id: order_id,
        details: {
          invoice_id,
          vtb_status: status,
          amount: amount.value,
          currency: amount.currency,
          paid_at,
          transaction_id,
          payment_status: paymentStatus,
        },
      });

    // If payment successful, send notifications
    if (status === 'paid') {
      // Get booking details for notifications
      const { data: booking } = await supabase
        .from('bookings')
        .select('*, performer_profiles(user_id, display_name)')
        .eq('id', order_id)
        .single();

      if (booking) {
        // Send SMS notification about successful payment
        try {
          await supabase.functions.invoke('send-sms-notification', {
            body: {
              type: 'payment_confirmed',
              bookingId: order_id,
            },
          });
        } catch (smsError) {
          console.error('Failed to send SMS notification:', smsError);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('VTB Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
