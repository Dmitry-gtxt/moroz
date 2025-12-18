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
  check_unique?: boolean; // If true, check that phone is not already registered
  current_user_id?: string; // Exclude this user from uniqueness check (for profile updates)
}


// Normalize tokens to avoid issues with accidental "Bearer " prefix, quotes or whitespace
function normalizeNotificoreBearerToken(raw: string): string {
  let t = raw.trim();
  // remove accidental surrounding quotes
  t = t.replace(/^"+|"+$/g, "");
  // remove accidental Bearer prefix (we add it in Authorization header)
  t = t.replace(/^Bearer\s+/i, "");
  return t.trim();
}

// Get JWT bearer token from Notificore API
async function getNotificoreBearerToken(apiKey: string): Promise<string | null> {
  try {
    console.log("[2FA] Getting bearer token from Notificore...");

    const response = await fetch("https://one-api.notificore.ru/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ api_key: apiKey }),
    });

    const responseText = await response.text();
    console.log(`[2FA] Auth response status: ${response.status}`);

    if (!response.ok) {
      console.error(`[2FA] Auth failed: ${responseText}`);
      return null;
    }

    const data = JSON.parse(responseText);
    const rawBearer = typeof data?.bearer === "string" ? data.bearer : "";

    if (rawBearer) {
      const token = normalizeNotificoreBearerToken(rawBearer);
      console.log(`[2FA] Bearer token received, len=${token.length}`);
      return token;
    }

    console.error("[2FA] No bearer in response:", responseText);
    return null;
  } catch (error) {
    console.error("[2FA] Auth error:", error);
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
    console.error("NOTIFICORE_2FA_BEARER_TOKEN is not set");
    return new Response(
      JSON.stringify({ success: false, error: "2FA API key not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.log(`[2FA] API key sanity: len=${apiKey.length}, prefix=${apiKey.substring(0, 5)}`);

  // Get JWT bearer token
  const bearerToken = await getNotificoreBearerToken(apiKey);
  
  if (!bearerToken) {
    return new Response(
      JSON.stringify({ success: false, error: "Failed to authenticate with Notificore" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { 
      phone, 
      template_id, 
      code_digits = 6, 
      code_lifetime = 120, 
      code_max_tries = 3,
      check_unique = false,
      current_user_id,
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

    // Check phone uniqueness if requested
    if (check_unique) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

      // Get all users from auth.users
      const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 1000,
      });

      if (usersError) {
        console.error("[2FA] Error fetching users for uniqueness check:", usersError);
        return new Response(
          JSON.stringify({ success: false, error: "Ошибка проверки номера" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if phone already exists (in user_metadata.phone or auth phone field)
      const phoneExists = users.some(user => {
        // Skip current user if provided
        if (current_user_id && user.id === current_user_id) {
          return false;
        }
        
        const userPhone = user.phone || user.user_metadata?.phone || "";
        // Normalize for comparison
        let normalizedUserPhone = userPhone.replace(/\D/g, "");
        if (normalizedUserPhone.startsWith("8") && normalizedUserPhone.length === 11) {
          normalizedUserPhone = "7" + normalizedUserPhone.substring(1);
        }
        
        return normalizedUserPhone === formattedPhone;
      });

      if (phoneExists) {
        console.log(`[2FA] Phone ${formattedPhone} already registered`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Этот номер телефона уже зарегистрирован в системе",
            code: "PHONE_EXISTS"
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[2FA] Phone ${formattedPhone} is unique, proceeding with OTP`);
    }

    console.log(`[2FA] Sending OTP to ${formattedPhone}, template: ${template_id}`);

    // Notificore 2FA API
    const apiUrl = "https://one-api.notificore.ru/api/2fa/authentications/otp";
    
    const payload = {
      channel: "sms",
      recipient: formattedPhone,
      sender: "Ded-Morozy",
      template_id: Number(template_id),
      code_digits: Number(code_digits),
      code_max_tries: Number(code_max_tries),
      code_lifetime: Number(code_lifetime),
    };

    console.log("[2FA] Request payload:", JSON.stringify(payload));

    // Log token format for debugging
    console.log(`[2FA] Token first 20 chars: ${bearerToken.substring(0, 20)}...`);
    console.log(`[2FA] Token last 20 chars: ...${bearerToken.substring(bearerToken.length - 20)}`);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${bearerToken}`,
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
