import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SANDBOX_URL = 'https://vtb.rbsuat.com/payment/rest';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, amount, orderNumber, orderId, returnUrl, failUrl, userName, password } = await req.json();

    console.log(`[vtb-sandbox-test] Action: ${action}`);

    if (!userName || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'userName и password обязательны' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let endpoint: string;
    let params: URLSearchParams;

    if (action === 'register') {
      endpoint = '/register.do';
      params = new URLSearchParams({
        userName: userName,
        password: password,
        amount: amount?.toString() || '10000',
        currency: '643',
        orderNumber: orderNumber || `TEST_${Date.now()}`,
        returnUrl: returnUrl || 'https://example.com/success',
        failUrl: failUrl || 'https://example.com/fail',
        description: 'Тестовый платёж из админки',
        language: 'ru',
      });
    } else if (action === 'status') {
      if (!orderId) {
        return new Response(
          JSON.stringify({ success: false, error: 'orderId обязателен для проверки статуса' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      endpoint = '/getOrderStatusExtended.do';
      params = new URLSearchParams({
        userName: userName,
        password: password,
        orderId: orderId,
      });
    } else {
      return new Response(
        JSON.stringify({ success: false, error: `Неизвестное действие: ${action}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[vtb-sandbox-test] Calling ${SANDBOX_URL}${endpoint} with user: ${userName}`);

    const response = await fetch(`${SANDBOX_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const responseText = await response.text();
    console.log(`[vtb-sandbox-test] Response status: ${response.status}`);
    console.log(`[vtb-sandbox-test] Response body: ${responseText}`);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { rawResponse: responseText };
    }

    const success = data.errorCode === 0 || data.errorCode === '0' || data.orderId;

    return new Response(
      JSON.stringify({ 
        success, 
        response: data,
        httpStatus: response.status 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    console.error(`[vtb-sandbox-test] Error:`, error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
