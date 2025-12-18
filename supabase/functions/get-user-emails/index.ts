import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GetUserEmailsRequest {
  userIds: string[];
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Received get-user-emails request");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the caller is an admin
    const authHeader = req.headers.get('authorization');
    console.log("Auth header present:", !!authHeader);
    
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Extract the token from "Bearer <token>"
    const token = authHeader.replace('Bearer ', '');
    console.log("Token extracted, length:", token.length);

    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // Verify user using the token directly
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError) {
      console.error("User verification error:", userError.message);
      throw new Error("Unauthorized");
    }
    
    if (!user) {
      console.error("No user found from token");
      throw new Error("Unauthorized");
    }

    console.log("User verified:", user.id);

    // Check if user is admin using service role
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin');

    if (rolesError) {
      console.error("Roles check error:", rolesError.message);
    }

    console.log("Admin roles found:", roles?.length || 0);

    if (!roles || roles.length === 0) {
      throw new Error("Forbidden: Admin access required");
    }

    const { userIds }: GetUserEmailsRequest = await req.json();
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return new Response(JSON.stringify({ emails: {} }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Fetching emails for user IDs:", userIds.length);

    // Fetch emails and phones for each user
    const emails: Record<string, string> = {};
    const phones: Record<string, string> = {};
    
    for (const userId of userIds) {
      try {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (authUser?.user?.email) {
          emails[userId] = authUser.user.email;
        }
        if (authUser?.user?.phone) {
          phones[userId] = authUser.user.phone;
        }
      } catch (err) {
        console.error(`Failed to get data for user ${userId}:`, err);
      }
    }

    console.log("Retrieved emails for", Object.keys(emails).length, "users");
    console.log("Retrieved phones for", Object.keys(phones).length, "users");

    return new Response(JSON.stringify({ emails, phones }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in get-user-emails function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.message.includes("Forbidden") ? 403 : error.message.includes("Unauthorized") ? 401 : 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
