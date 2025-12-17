import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("NOTIFICORE_API_KEY");
    if (!apiKey) {
      console.error("NOTIFICORE_API_KEY is not set");
      return new Response(
        JSON.stringify({ error: "SMS service not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { phone, message, reference }: SMSRequest = await req.json();
    console.log("Sending SMS to:", phone, "Message:", message.substring(0, 50) + "...");

    if (!phone || !message) {
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

    const smsPayload = {
      destination: "phone",
      originator: "Ded-Morozy", // Alpha name - sender ID (max 11 chars)
      body: message,
      msisdn: formattedPhone,
      reference: reference || `sms_${Date.now()}`,
      validity: "3600", // 1 hour validity
      tariff: "0",
    };

    console.log("SMS payload:", JSON.stringify(smsPayload));

    const response = await fetch("https://api.notificore.ru/v1.0/sms/create", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(smsPayload),
    });

    const responseText = await response.text();
    console.log("Notificore response status:", response.status);
    console.log("Notificore response body:", responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { rawResponse: responseText };
    }

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

    console.log("SMS sent successfully:", result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.result?.id,
        reference: result.result?.reference,
        price: result.result?.price,
        currency: result.result?.currency
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-sms function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
