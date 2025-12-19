import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Format phone to standard format (digits only, starting with 7)
function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('8') && digits.length === 11) {
    return '7' + digits.substring(1);
  }
  if (digits.length === 10) {
    return '7' + digits;
  }
  return digits;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Get the authorization header to verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Не авторизован" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to check if they're admin
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: requestingUser } } = await supabaseUser.auth.getUser();
    if (!requestingUser) {
      return new Response(
        JSON.stringify({ success: false, error: "Не авторизован" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if requesting user is admin
    const { data: isAdmin } = await supabaseUser.rpc("has_role", {
      _user_id: requestingUser.id,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Доступ запрещён" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { dryRun = true } = await req.json().catch(() => ({ dryRun: true }));

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get all users from auth.users
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    });

    if (error) {
      throw error;
    }

    const results: {
      id: string;
      name: string;
      oldEmail: string;
      newEmail: string;
      phone: string;
      status: 'migrated' | 'skipped' | 'error';
      reason?: string;
    }[] = [];

    for (const user of users) {
      const email = user.email || '';
      const phone = user.phone || user.user_metadata?.phone || '';
      const name = user.user_metadata?.full_name || email || 'Без имени';

      // Skip admin@gtxt.biz
      if (email === 'admin@gtxt.biz') {
        results.push({
          id: user.id,
          name,
          oldEmail: email,
          newEmail: email,
          phone,
          status: 'skipped',
          reason: 'Админ - пропущен',
        });
        continue;
      }

      // Skip if already in phone@ded-morozy-rf.ru format
      if (email.endsWith('@ded-morozy-rf.ru')) {
        results.push({
          id: user.id,
          name,
          oldEmail: email,
          newEmail: email,
          phone,
          status: 'skipped',
          reason: 'Уже в правильном формате',
        });
        continue;
      }

      // Skip if no phone
      if (!phone) {
        results.push({
          id: user.id,
          name,
          oldEmail: email,
          newEmail: email,
          phone: '',
          status: 'skipped',
          reason: 'Нет телефона',
        });
        continue;
      }

      // Generate new email from phone
      const formattedPhone = formatPhone(phone);
      const newEmail = `${formattedPhone}@ded-morozy-rf.ru`;

      if (dryRun) {
        results.push({
          id: user.id,
          name,
          oldEmail: email,
          newEmail,
          phone,
          status: 'migrated',
          reason: 'Будет обновлён (dry run)',
        });
      } else {
        // Actually update the user
        try {
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            user.id,
            { email: newEmail }
          );

          if (updateError) {
            results.push({
              id: user.id,
              name,
              oldEmail: email,
              newEmail,
              phone,
              status: 'error',
              reason: updateError.message,
            });
          } else {
            results.push({
              id: user.id,
              name,
              oldEmail: email,
              newEmail,
              phone,
              status: 'migrated',
              reason: 'Успешно обновлён',
            });
          }
        } catch (e: any) {
          results.push({
            id: user.id,
            name,
            oldEmail: email,
            newEmail,
            phone,
            status: 'error',
            reason: e.message,
          });
        }
      }
    }

    const migratedCount = results.filter(r => r.status === 'migrated').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    console.log(`[migrate-user-emails] DryRun: ${dryRun}, Migrated: ${migratedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        dryRun,
        summary: {
          total: results.length,
          migrated: migratedCount,
          skipped: skippedCount,
          errors: errorCount,
        },
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in migrate-user-emails function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
