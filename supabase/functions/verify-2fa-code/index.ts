import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  auth_id: string;
  access_code: string;
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
    console.log("[2FA Verify] Getting bearer token from Notificore...");

    const response = await fetch("https://one-api.notificore.ru/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ api_key: apiKey }),
    });

    const responseText = await response.text();
    console.log(`[2FA Verify] Auth response status: ${response.status}`);

    if (!response.ok) {
      console.error(`[2FA Verify] Auth failed: ${responseText}`);
      return null;
    }

    const data = JSON.parse(responseText);
    const rawBearer = typeof data?.bearer === "string" ? data.bearer : "";

    if (rawBearer) {
      const token = normalizeNotificoreBearerToken(rawBearer);
      console.log(`[2FA Verify] Bearer token received, len=${token.length}`);
      return token;
    }

    console.error("[2FA Verify] No bearer in response:", responseText);
    return null;
  } catch (error) {
    console.error("[2FA Verify] Auth error:", error);
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

  // Get JWT bearer token
  const bearerToken = await getNotificoreBearerToken(apiKey);
  
  if (!bearerToken) {
    return new Response(
      JSON.stringify({ success: false, error: "Failed to authenticate with Notificore" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { auth_id, access_code }: VerifyRequest = await req.json();

    if (!auth_id || !access_code) {
      return new Response(
        JSON.stringify({ success: false, error: "auth_id and access_code are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[2FA Verify] Verifying code for auth_id: ${auth_id}`);

    // Notificore 2FA Verify API
    const apiUrl = `https://one-api.notificore.ru/api/2fa/authentications/otp/${auth_id}/verify`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${bearerToken}`,
      },
      body: JSON.stringify({ access_code }),
    });

    const responseText = await response.text();
    console.log(`[2FA Verify] Response status: ${response.status}`);
    console.log(`[2FA Verify] Response body: ${responseText}`);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    if (response.ok && responseData?.data?.status === "verified") {
      return new Response(
        JSON.stringify({
          success: true,
          verified: true,
          auth_id: responseData.data.id,
          status: responseData.data.status,
          recipient: responseData.data.recipient,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      const isExpired = responseData?.data?.status === "expired";
      const isMaxTries = responseData?.data?.status === "max_tries_exceeded";
      
      return new Response(
        JSON.stringify({
          success: false,
          verified: false,
          error: isExpired 
            ? "Код истёк" 
            : isMaxTries 
              ? "Превышено количество попыток" 
              : responseData?.message || "Неверный код",
          status: responseData?.data?.status,
          details: responseData,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[2FA Verify] Error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
