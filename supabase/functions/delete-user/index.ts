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

    // Get the user ID to delete from request body
    const { userId } = await req.json();
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "userId обязателен" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent admin from deleting themselves
    if (userId === requestingUser.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Нельзя удалить самого себя" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get performer profile if exists
    const { data: performerProfile } = await supabaseAdmin
      .from("performer_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    const performerId = performerProfile?.id;

    // Delete related data in order (respecting foreign keys)
    
    // 1. Delete chat messages where user is sender
    await supabaseAdmin
      .from("chat_messages")
      .delete()
      .eq("sender_id", userId);

    // 2. Delete support messages where user is sender
    await supabaseAdmin
      .from("support_messages")
      .delete()
      .eq("sender_id", userId);

    // 3. Delete support chats for user
    await supabaseAdmin
      .from("support_chats")
      .delete()
      .eq("user_id", userId);

    // 4. Delete reviews by this customer
    await supabaseAdmin
      .from("reviews")
      .delete()
      .eq("customer_id", userId);

    // 5. Delete referral registrations
    await supabaseAdmin
      .from("referral_registrations")
      .delete()
      .eq("user_id", userId);

    // 6. Delete push subscriptions
    await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId);

    // 7. Delete notification queue items
    await supabaseAdmin
      .from("notification_queue")
      .delete()
      .eq("user_id", userId);

    // 8. Delete user roles
    await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    // If user has performer profile, delete performer-related data
    if (performerId) {
      // Delete booking proposals for performer's bookings
      const { data: performerBookings } = await supabaseAdmin
        .from("bookings")
        .select("id")
        .eq("performer_id", performerId);
      
      if (performerBookings && performerBookings.length > 0) {
        const bookingIds = performerBookings.map(b => b.id);
        
        await supabaseAdmin
          .from("booking_proposals")
          .delete()
          .in("booking_id", bookingIds);
        
        await supabaseAdmin
          .from("chat_messages")
          .delete()
          .in("booking_id", bookingIds);
        
        await supabaseAdmin
          .from("reviews")
          .delete()
          .in("booking_id", bookingIds);
        
        await supabaseAdmin
          .from("referral_bookings")
          .delete()
          .in("booking_id", bookingIds);
        
        await supabaseAdmin
          .from("notification_queue")
          .delete()
          .in("booking_id", bookingIds);
      }

      // Delete reviews for this performer
      await supabaseAdmin
        .from("reviews")
        .delete()
        .eq("performer_id", performerId);

      // Delete availability slots
      await supabaseAdmin
        .from("availability_slots")
        .delete()
        .eq("performer_id", performerId);

      // Delete verification documents
      await supabaseAdmin
        .from("verification_documents")
        .delete()
        .eq("performer_id", performerId);

      // Delete support chat for performer
      await supabaseAdmin
        .from("support_chats")
        .delete()
        .eq("performer_id", performerId);

      // Delete bookings where user is performer
      await supabaseAdmin
        .from("bookings")
        .delete()
        .eq("performer_id", performerId);

      // Delete performer profile
      await supabaseAdmin
        .from("performer_profiles")
        .delete()
        .eq("id", performerId);
    }

    // Delete bookings where user is customer
    const { data: customerBookings } = await supabaseAdmin
      .from("bookings")
      .select("id")
      .eq("customer_id", userId);
    
    if (customerBookings && customerBookings.length > 0) {
      const bookingIds = customerBookings.map(b => b.id);
      
      await supabaseAdmin
        .from("booking_proposals")
        .delete()
        .in("booking_id", bookingIds);
      
      await supabaseAdmin
        .from("chat_messages")
        .delete()
        .in("booking_id", bookingIds);
      
      await supabaseAdmin
        .from("reviews")
        .delete()
        .in("booking_id", bookingIds);
      
      await supabaseAdmin
        .from("referral_bookings")
        .delete()
        .in("booking_id", bookingIds);
      
      await supabaseAdmin
        .from("notification_queue")
        .delete()
        .in("booking_id", bookingIds);
    }

    await supabaseAdmin
      .from("bookings")
      .delete()
      .eq("customer_id", userId);

    // Delete profile
    await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("user_id", userId);

    // Finally, delete the auth user
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteAuthError) {
      console.error("Error deleting auth user:", deleteAuthError);
      return new Response(
        JSON.stringify({ success: false, error: `Ошибка удаления auth: ${deleteAuthError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the action in audit log
    await supabaseAdmin
      .from("audit_logs")
      .insert({
        user_id: requestingUser.id,
        action: "delete_user",
        entity_type: "user",
        entity_id: userId,
        details: { deleted_by_admin: requestingUser.id },
      });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in delete-user function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
