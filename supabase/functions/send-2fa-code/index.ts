import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TwoFaRequest {
  phone: string;
  template_id: string;
  code_digits?: number;
  code_lifetime?: number;
  code_max_tries?: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const tokenRaw = Deno.env.get("NOTIFICORE_2FA_BEARER_TOKEN") ?? "";
  const tokenTrimmed = tokenRaw.trim();
  const tokenNoAuthPrefix = tokenTrimmed.replace(/^Authorization:\s*/i, "").trim();
  const tokenUnquoted = tokenNoAuthPrefix.replace(/^['"]|['"]$/g, "").trim();
  const tokenClean = tokenUnquoted.replace(/^Bearer\s+/i, "").trim();

  // Never log the token itself
  console.log(
    `[2FA] Token sanity: len=${tokenClean.length}, dots=${Math.max(0, tokenClean.split(".").length - 1)}`,
  );

  if (!tokenClean) {
    console.error("NOTIFICORE_2FA_BEARER_TOKEN is not set");
    return new Response(
      JSON.stringify({ success: false, error: "2FA Bearer token not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const NOTIFICORE_2FA_AUTH_HEADER = `Bearer ${tokenClean}`;

  try {
    const { 
      phone, 
      template_id, 
      code_digits = 6, 
      code_lifetime = 120, 
      code_max_tries = 3 
    }: TwoFaRequest = await req.json();

    if (!phone || !template_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Phone and template_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format phone: remove everything except digits
    let formattedPhone = phone.replace(/\D/g, "");
    
    // Remove leading 8 for Russian numbers, keep country code
    if (formattedPhone.startsWith("8") && formattedPhone.length === 11) {
      formattedPhone = "7" + formattedPhone.substring(1);
    }

    console.log(`[2FA] Sending OTP to ${formattedPhone}, template: ${template_id}`);

    // Notificore 2FA API
    const apiUrl = "https://one-api.notificore.ru/api/2fa/authentications/otp";
    
    const payload = {
      channel: "sms",
      sender: "Ded-Morozy",
      recipient: formattedPhone,
      template_id: template_id,
      code_digits: code_digits,
      code_lifetime: code_lifetime,
      code_max_tries: code_max_tries,
    };

    console.log("[2FA] Request payload:", JSON.stringify(payload));

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": NOTIFICORE_2FA_AUTH_HEADER,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log(`[2FA] Response status: ${response.status}`);
    console.log(`[2FA] Response body: ${responseText}`);

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

    await supabase.from("sms_logs").insert({
      phone: formattedPhone,
      message: `[2FA] template_id: ${template_id}, digits: ${code_digits}`,
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
          auth_id: responseData.data.id,
          status: responseData.data.status,
          expires_at: responseData.data.expired_at,
          code_digits: responseData.data.code_digits,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: responseData?.message || responseData?.error || "Failed to send OTP",
          details: responseData,
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[2FA] Error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
