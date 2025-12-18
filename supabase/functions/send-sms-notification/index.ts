import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// SMS notification templates
const SMS_TEMPLATES = {
  // Template 80: New booking request → Performer
  new_booking_to_performer: 80,
  // Template 81: Performer rejection → Customer
  booking_rejected_to_customer: 81,
  // Template 82: Slot change proposal → Customer
  slot_proposal_to_customer: 82,
  // Template 83: Time confirmation → Customer
  booking_confirmed_to_customer: 83,
};

interface SmsNotificationRequest {
  type: keyof typeof SMS_TEMPLATES;
  phone?: string;
  userId?: string; // If phone is empty, lookup phone by userId from auth.users
  // Optional metadata for logging
  bookingId?: string;
  performerName?: string;
  customerName?: string;
  bookingDate?: string;
  bookingTime?: string;
}

// Normalize tokens to avoid issues with accidental "Bearer " prefix, quotes or whitespace
function normalizeNotificoreBearerToken(raw: string): string {
  let t = raw.trim();
  t = t.replace(/^\"+|\"+$/g, "\"");
  t = t.replace(/^Bearer\s+/i, "");
  return t.trim();
}

// Get JWT bearer token from Notificore API
async function getNotificoreBearerToken(apiKey: string): Promise<string | null> {
  try {
    console.log("[SMS-NOTIFY] Getting bearer token from Notificore...");

    const response = await fetch("https://one-api.notificore.ru/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ api_key: apiKey }),
    });

    const responseText = await response.text();
    console.log(`[SMS-NOTIFY] Auth response status: ${response.status}`);

    if (!response.ok) {
      console.error(`[SMS-NOTIFY] Auth failed: ${responseText}`);
      return null;
    }

    const data = JSON.parse(responseText);
    const rawBearer = typeof data?.bearer === "string" ? data.bearer : "";

    if (rawBearer) {
      const token = normalizeNotificoreBearerToken(rawBearer);
      console.log(`[SMS-NOTIFY] Bearer token received, len=${token.length}`);
      return token;
    }

    console.error("[SMS-NOTIFY] No bearer in response:", responseText);
    return null;
  } catch (error) {
    console.error("[SMS-NOTIFY] Auth error:", error);
    return null;
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Get API key from secrets
  const apiKey = Deno.env.get("NOTIFICORE_2FA_BEARER_TOKEN")?.trim() || "";
  
  if (!apiKey) {
    console.error("[SMS-NOTIFY] NOTIFICORE_2FA_BEARER_TOKEN is not set");
    return new Response(
      JSON.stringify({ success: false, error: "SMS API key not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get JWT bearer token
  const bearerToken = await getNotificoreBearerToken(apiKey);
  
  if (!bearerToken) {
    return new Response(
      JSON.stringify({ success: false, error: "Failed to authenticate with Notificore" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const requestBody: SmsNotificationRequest = await req.json();
    const { type, phone, userId, bookingId, performerName, customerName, bookingDate, bookingTime } = requestBody;

    if (!type) {
      return new Response(
        JSON.stringify({ success: false, error: "Type is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get phone: either from request or lookup by userId
    let recipientPhone = phone || "";
    
    if (!recipientPhone && userId) {
      console.log(`[SMS-NOTIFY] Phone not provided, looking up by userId: ${userId}`);
      
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get user's email from auth.users (email is in format phone@ded-morozy-rf.ru)
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
      
      if (userError || !userData?.user?.email) {
        console.error(`[SMS-NOTIFY] Failed to get user email: ${userError?.message}`);
        return new Response(
          JSON.stringify({ success: false, error: "Could not find user phone" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const userEmail = userData.user.email;
      
      // Check if email is in format phone@ded-morozy-rf.ru
      if (userEmail.endsWith("@ded-morozy-rf.ru") && /^\d+@/.test(userEmail)) {
        recipientPhone = userEmail.split("@")[0];
        console.log(`[SMS-NOTIFY] Extracted phone from email: ${recipientPhone}`);
      } else {
        console.error(`[SMS-NOTIFY] Email is not in phone format: ${userEmail}`);
        return new Response(
          JSON.stringify({ success: false, error: "User email is not a phone number" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (!recipientPhone) {
      return new Response(
        JSON.stringify({ success: false, error: "Phone or userId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const templateId = SMS_TEMPLATES[type];
    if (!templateId) {
      return new Response(
        JSON.stringify({ success: false, error: `Unknown notification type: ${type}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format phone: remove everything except digits
    let formattedPhone = recipientPhone.replace(/\D/g, "");
    
    // Remove leading 8 for Russian numbers, keep country code
    if (formattedPhone.startsWith("8") && formattedPhone.length === 11) {
      formattedPhone = "7" + formattedPhone.substring(1);
    }

    console.log(`[SMS-NOTIFY] Sending ${type} to ${formattedPhone}, template: ${templateId}`);

    // Notificore 2FA API - sending notification without code verification
    // We use 2FA endpoint but set minimal code params since we don't need verification
    const apiUrl = "https://one-api.notificore.ru/api/2fa/authentications/otp";
    
    const payload = {
      channel: "sms",
      recipient: formattedPhone,
      sender: "ded-morozy",
      template_id: templateId,
      // These are required by 2FA API but we won't use the code
      code_digits: 6,
      code_max_tries: 1,
      code_lifetime: 60,
    };

    console.log("[SMS-NOTIFY] Request payload:", JSON.stringify(payload));

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${bearerToken}`,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log(`[SMS-NOTIFY] Response status: ${response.status}`);
    console.log(`[SMS-NOTIFY] Response body: ${responseText}`);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    // Log to sms_logs for tracking
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const logMessage = `[SMS-NOTIFY] ${type} | booking: ${bookingId || '-'} | performer: ${performerName || '-'} | customer: ${customerName || '-'} | date: ${bookingDate || '-'} ${bookingTime || '-'}`;

    await supabase.from("sms_logs").insert({
      phone: formattedPhone,
      message: logMessage,
      reference: responseData?.data?.id || null,
      request_payload: payload,
      response_status: response.status,
      response_body: responseData,
      success: response.ok && responseData?.data?.id,
      error_message: response.ok ? null : (responseData?.message || responseData?.error || "Unknown error"),
    });

    if (response.ok && responseData?.data?.id) {
      return new Response(
        JSON.stringify({
          success: true,
          messageId: responseData.data.id,
          type,
          phone: formattedPhone,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: responseData?.message || responseData?.error || "Failed to send SMS",
          details: responseData,
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[SMS-NOTIFY] Error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
