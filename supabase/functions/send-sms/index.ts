import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SMSRequest {
  phone: string;
  message: string;
  reference?: string;
}

interface NotificoreResult {
  id?: string;
  reference?: string;
  price?: number;
  currency?: string;
  error?: number;
  errorDescription?: string;
}

interface NotificoreResponse {
  result?: NotificoreResult;
  error?: number;
  errorDescription?: string;
  id?: string;
  reference?: string;
  rawResponse?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize Supabase client for logging
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let phone = "";
  let message = "";
  let reference = "";
  let requestPayload: Record<string, unknown> = {};

  try {
    // Try both API key and password - Notificore uses different auth methods
    const apiKey = Deno.env.get("NOTIFICORE_API_KEY");
    const apiPassword = Deno.env.get("NOTIFICORE_API_PASSWORD");
    
    const authKey = apiKey || apiPassword;
    if (!authKey) {
      console.error("NOTIFICORE_API_KEY or NOTIFICORE_API_PASSWORD is not set");
      
      // Log the error
      await supabase.from("sms_logs").insert({
        phone: "unknown",
        message: "API key not configured",
        error_message: "NOTIFICORE_API_KEY is not set",
        success: false,
      });

      return new Response(
        JSON.stringify({ error: "SMS service not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const requestData: SMSRequest = await req.json();
    phone = requestData.phone;
    message = requestData.message;
    reference = requestData.reference || `sms_${Date.now()}`;

    console.log("Sending SMS to:", phone, "Message:", message.substring(0, 50) + "...");

    if (!phone || !message) {
      await supabase.from("sms_logs").insert({
        phone: phone || "unknown",
        message: message || "empty",
        error_message: "Phone and message are required",
        success: false,
      });

      return new Response(
        JSON.stringify({ error: "Phone and message are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Format phone number - remove any non-digit characters except leading +
    let formattedPhone = phone.replace(/[^\d+]/g, "");
    // If starts with 8, replace with 7 (Russian numbers)
    if (formattedPhone.startsWith("8") && formattedPhone.length === 11) {
      formattedPhone = "7" + formattedPhone.substring(1);
    }
    // Remove + if present
    formattedPhone = formattedPhone.replace("+", "");

    // Build SMS payload according to Notificore official SDK (Node.js)
    // createSMS expects extra fields like tariff/validity; provide safe defaults.
    requestPayload = {
      destination: "phone",
      originator: "Ded-Morozy", // max 11 chars
      body: message,
      msisdn: formattedPhone,
      reference: reference,
      validity: "1",
      tariff: "0",
    };

    console.log("SMS request payload:", JSON.stringify(requestPayload));
    console.log("Auth Key (first 10 chars):", authKey.substring(0, 10) + "...");

    // Notificore auth is via X-API-KEY header (NOT Bearer)
    const response = await fetch("https://api.notificore.ru/rest/sms/create", {
      method: "POST",
      headers: {
        "X-API-KEY": authKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([requestPayload]),
    });

    const responseText = await response.text();
    console.log("Notificore response status:", response.status);
    console.log("Notificore response body:", responseText);

    let result: NotificoreResponse;
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { rawResponse: responseText };
    }

    // Determine if successful
    const isSuccess = response.ok && 
      (!result.error || result.error === 0) && 
      (!result.result || !result.result.error || result.result.error === 0);

    // Extract error message if any
    let errorMessage: string | null = null;
    if (!isSuccess) {
      if (result.errorDescription) {
        errorMessage = String(result.errorDescription);
      } else if (result.result?.errorDescription) {
        errorMessage = String(result.result.errorDescription);
      } else if (result.error) {
        errorMessage = `Error code: ${result.error}`;
      } else if (!response.ok) {
        errorMessage = `HTTP ${response.status}`;
      }
    }

    // Log to database
    await supabase.from("sms_logs").insert({
      phone: formattedPhone,
      message: message,
      reference: reference,
      request_payload: requestPayload,
      response_status: response.status,
      response_body: result as Record<string, unknown>,
      error_message: errorMessage,
      success: isSuccess,
    });

    if (!response.ok) {
      console.error("Notificore API error:", result);
      return new Response(
        JSON.stringify({ 
          error: "Failed to send SMS", 
          details: result 
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check for API-level errors in response
    if (result.result && result.result.error && result.result.error !== 0) {
      console.error("Notificore SMS error:", result.result);
      return new Response(
        JSON.stringify({ 
          error: result.result.errorDescription || "SMS sending failed",
          code: result.result.error
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check top-level error
    if (result.error && result.error !== 0) {
      console.error("Notificore error:", result);
      return new Response(
        JSON.stringify({ 
          error: result.errorDescription || "SMS sending failed",
          code: result.error
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("SMS sent successfully:", result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.result?.id || result.id,
        reference: result.result?.reference || result.reference,
        price: result.result?.price,
        currency: result.result?.currency
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Error in send-sms function:", error);

    // Log error to database
    try {
      await supabase.from("sms_logs").insert({
        phone: phone || "unknown",
        message: message || "unknown",
        reference: reference || null,
        request_payload: Object.keys(requestPayload).length > 0 ? requestPayload : null,
        error_message: errorMsg,
        success: false,
      });
    } catch (logError) {
      console.error("Failed to log SMS error:", logError);
    }

    return new Response(
      JSON.stringify({ error: errorMsg }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
