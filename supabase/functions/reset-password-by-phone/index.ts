import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetRequest {
  phone: string;
  new_password: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, new_password } = await req.json() as ResetRequest;

    if (!phone || !new_password) {
      return new Response(
        JSON.stringify({ error: "Укажите телефон и новый пароль" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean phone number
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('8') && formattedPhone.length === 11) {
      formattedPhone = '7' + formattedPhone.slice(1);
    }

    console.log("[Reset] Looking for user with phone:", formattedPhone);

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Find user by phone in profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, full_name")
      .eq("phone", formattedPhone)
      .single();

    // Also try with + prefix
    let userId = profile?.user_id;
    
    if (!userId) {
      const { data: profile2 } = await supabaseAdmin
        .from("profiles")
        .select("user_id, full_name")
        .eq("phone", `+${formattedPhone}`)
        .single();
      
      userId = profile2?.user_id;
    }

    // Also check user metadata in auth.users
    if (!userId) {
      // Get all users and find by phone in metadata
      const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (!usersError && users) {
        for (const user of users) {
          const userPhone = user.user_metadata?.phone || user.phone;
          if (userPhone) {
            const cleanUserPhone = userPhone.replace(/\D/g, '');
            if (cleanUserPhone === formattedPhone || cleanUserPhone === formattedPhone.slice(1)) {
              userId = user.id;
              console.log("[Reset] Found user by metadata phone:", user.id);
              break;
            }
          }
        }
      }
    }

    if (!userId) {
      console.log("[Reset] User not found for phone:", formattedPhone);
      return new Response(
        JSON.stringify({ error: "Пользователь с таким телефоном не найден" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[Reset] Found user:", userId);

    // Update user password using admin API
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: new_password }
    );

    if (updateError) {
      console.error("[Reset] Update error:", updateError);
      return new Response(
        JSON.stringify({ error: updateError.message || "Ошибка обновления пароля" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[Reset] Password updated successfully for user:", userId);

    // Get user email to help with login
    const userEmail = updateData.user?.email;

    return new Response(
      JSON.stringify({ 
        success: true,
        email: userEmail,
        message: "Пароль успешно изменён"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Reset] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Произошла ошибка" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
