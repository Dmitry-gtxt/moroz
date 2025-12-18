import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { performerId } = await req.json();

    if (!performerId) {
      return new Response(
        JSON.stringify({ error: "performerId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get performer's user_id
    const { data: performer, error: performerError } = await supabase
      .from("performer_profiles")
      .select("user_id")
      .eq("id", performerId)
      .maybeSingle();

    if (performerError || !performer?.user_id) {
      console.log("[get-performer-phone] Performer not found:", performerId);
      return new Response(
        JSON.stringify({ phone: null }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's email from auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
      performer.user_id
    );

    if (userError || !userData?.user?.email) {
      console.log("[get-performer-phone] User not found:", performer.user_id);
      return new Response(
        JSON.stringify({ phone: null }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const email = userData.user.email;
    let phone: string | null = null;

    // Extract phone from email if it matches pattern: phone@ded-morozy-rf.ru
    if (email.endsWith("@ded-morozy-rf.ru")) {
      const localPart = email.split("@")[0];
      // Check if local part is a phone number (digits only, possibly starting with 7 or 8)
      if (/^\d{10,11}$/.test(localPart)) {
        phone = localPart;
        // Format: ensure it starts with 7 for Russian numbers
        if (phone.startsWith("8") && phone.length === 11) {
          phone = "7" + phone.substring(1);
        }
        console.log(`[get-performer-phone] Extracted phone from email: ${phone}`);
      }
    }

    // Also check user metadata for phone
    if (!phone && userData.user.phone) {
      phone = userData.user.phone.replace(/\D/g, "");
      console.log(`[get-performer-phone] Got phone from user.phone: ${phone}`);
    }

    // Check user_metadata.phone
    if (!phone && userData.user.user_metadata?.phone) {
      phone = userData.user.user_metadata.phone.replace(/\D/g, "");
      console.log(`[get-performer-phone] Got phone from user_metadata: ${phone}`);
    }

    return new Response(
      JSON.stringify({ phone }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[get-performer-phone] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
