import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log(`[list-users] ${req.method} ${req.url}`);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Get the authorization header to verify admin
    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Не авторизован" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const match = authHeader.match(/Bearer\s+(.+)/i);
    const token = match?.[1]?.trim();

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: "Не авторизован" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify requesting user by access token
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: { user: requestingUser }, error: userError } = await supabaseUser.auth.getUser(token);
    if (userError || !requestingUser) {
      return new Response(
        JSON.stringify({ success: false, error: "Не авторизован" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if requesting user is admin (server-side)
    const { data: adminRoles, error: adminRolesError } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', requestingUser.id)
      .eq('role', 'admin')
      .limit(1);

    if (adminRolesError) {
      throw adminRolesError;
    }

    if (!adminRoles || adminRoles.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Доступ запрещён" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all users from auth.users
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    });

    if (error) {
      throw error;
    }

    // Get all user roles
    const { data: rolesData } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role');

    const rolesMap = new Map<string, string[]>();
    if (rolesData) {
      for (const r of rolesData) {
        if (!rolesMap.has(r.user_id)) {
          rolesMap.set(r.user_id, []);
        }
        rolesMap.get(r.user_id)!.push(r.role);
      }
    }

    // Get all performer profiles to identify performers
    const { data: performerProfiles } = await supabaseAdmin
      .from('performer_profiles')
      .select('user_id');

    const performerUserIds = new Set<string>();
    if (performerProfiles) {
      for (const p of performerProfiles) {
        if (p.user_id) {
          performerUserIds.add(p.user_id);
        }
      }
    }

    // Format users for response
    const formattedUsers = users.map(user => {
      const roles = rolesMap.get(user.id) || [];
      
      // Add performer role dynamically if user has a performer profile
      if (performerUserIds.has(user.id) && !roles.includes('performer')) {
        roles.push('performer');
      }
      
      // Default to customer if no roles
      if (roles.length === 0) {
        roles.push('customer');
      }
      
      return {
        id: user.id,
        email: user.email,
        phone: user.phone || user.user_metadata?.phone || null,
        full_name: user.user_metadata?.full_name || user.email || user.phone || 'Без имени',
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        roles,
      };
    });

    return new Response(
      JSON.stringify({ success: true, users: formattedUsers }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in list-users function:", error?.stack ?? error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
