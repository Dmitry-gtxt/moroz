import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get('VTB_CLIENT_ID') || '';
    const clientSecret = Deno.env.get('VTB_CLIENT_SECRET') || '';
    const merchantSiteId = Deno.env.get('VTB_MERCHANT_SITE_ID') || '';

    const result = {
      clientIdPrefix: clientId.substring(0, 8),
      clientIdLength: clientId.length,
      clientSecretPrefix: clientSecret.substring(0, 4),
      clientSecretLength: clientSecret.length,
      merchantSiteIdPrefix: merchantSiteId.substring(0, 8),
      merchantSiteIdLength: merchantSiteId.length,
      hasClientId: clientId.length > 0,
      hasClientSecret: clientSecret.length > 0,
      hasMerchantSiteId: merchantSiteId.length > 0,
    };

    console.log('VTB credentials check:', result);

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error checking credentials:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
