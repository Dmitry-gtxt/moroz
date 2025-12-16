import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendNotifications(supabase: any, booking: any, notificationType: string, adminPhone: string) {
  const baseUrl = "https://ded-morozy-rf.ru";
  
  // Get performer user_id
  const { data: performer } = await supabase
    .from("performer_profiles")
    .select("user_id, display_name")
    .eq("id", booking.performer_id)
    .single();
  
  // Get performer email
  let performerEmail = "";
  if (performer?.user_id) {
    const { data: authUser } = await supabase.auth.admin.getUserById(performer.user_id);
    performerEmail = authUser?.user?.email || "";
  }

  const formattedDate = new Date(booking.booking_date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  let title = "";
  let body = "";
  let emailSubject = "";
  let emailBody = "";

  switch (notificationType) {
    case "reminder_3_days":
      title = "🎄 Напоминание о заказе";
      body = `Через 3 дня (${formattedDate}) визит ${performer?.display_name || "исполнителя"}. Всё по плану?`;
      emailSubject = "🎄 Напоминание: через 3 дня праздник!";
      emailBody = `
        <p>Напоминаем, что через 3 дня, <strong>${formattedDate}</strong> в <strong>${booking.booking_time}</strong>, к вам придёт ${performer?.display_name || "исполнитель"}.</p>
        <p>Адрес: ${booking.address}</p>
        <p>Если что-то изменилось, пожалуйста, свяжитесь с нами: <a href="tel:${adminPhone}">${adminPhone}</a></p>
      `;
      break;
    case "reminder_1_day":
      title = "🎅 Завтра праздник!";
      body = `Завтра (${formattedDate}) к вам придёт ${performer?.display_name || "исполнитель"}. Подготовьте подарки!`;
      emailSubject = "🎅 Завтра к вам придёт Дед Мороз!";
      emailBody = `
        <p>Напоминаем, что <strong>завтра, ${formattedDate}</strong> в <strong>${booking.booking_time}</strong>, к вам придёт ${performer?.display_name || "исполнитель"}!</p>
        <p>Адрес: ${booking.address}</p>
        <p><strong>💡 Совет:</strong> Подготовьте подарки заранее и положите их в мешок!</p>
        <p>Если что-то изменилось: <a href="tel:${adminPhone}">${adminPhone}</a></p>
      `;
      break;
    case "reminder_5_hours":
      title = "⏰ Скоро приедет Дед Мороз!";
      body = `Через 5 часов к вам придёт ${performer?.display_name || "исполнитель"}. Готовы к празднику?`;
      emailSubject = "⏰ Через 5 часов начнётся праздник!";
      emailBody = `
        <p>Через несколько часов, в <strong>${booking.booking_time}</strong>, к вам придёт ${performer?.display_name || "исполнитель"}!</p>
        <p>Адрес: ${booking.address}</p>
        <p>Если возникли вопросы или изменения: <a href="tel:${adminPhone}">${adminPhone}</a></p>
      `;
      break;
  }

  // Send push notification to customer
  try {
    await supabase.functions.invoke("send-push-notification", {
      body: {
        userId: booking.customer_id,
        title,
        body,
        url: `${baseUrl}/customer/bookings`,
        tag: `reminder-${booking.id}`
      }
    });
  } catch (err) {
    console.error("Failed to send customer push:", err);
  }

  // Send push notification to performer
  if (performer?.user_id) {
    let performerTitle = title;
    let performerBody = "";
    
    switch (notificationType) {
      case "reminder_3_days":
        performerBody = `Через 3 дня (${formattedDate}) заказ по адресу ${booking.address}. Всё по плану? Если нет - ${adminPhone}`;
        break;
      case "reminder_1_day":
        performerBody = `Завтра (${formattedDate}) заказ по адресу ${booking.address}. Вы готовы? Если нет - ${adminPhone}`;
        break;
      case "reminder_5_hours":
        performerBody = `Через 5 часов заказ по адресу ${booking.address}. Выезжаете? Если проблемы - ${adminPhone}`;
        break;
    }

    try {
      await supabase.functions.invoke("send-push-notification", {
        body: {
          userId: performer.user_id,
          title: performerTitle,
          body: performerBody,
          url: `${baseUrl}/performer/bookings`,
          tag: `reminder-${booking.id}`
        }
      });
    } catch (err) {
      console.error("Failed to send performer push:", err);
    }
  }

  // Send emails
  const customerEmail = booking.customer_email;
  
  if (customerEmail) {
    try {
      await supabase.functions.invoke("send-notification-email", {
        body: {
          type: "booking_reminder",
          email: customerEmail,
          subject: emailSubject,
          html: emailBody,
          adminPhone
        }
      });
    } catch (err) {
      console.error("Failed to send customer email:", err);
    }
  }

  if (performerEmail) {
    const performerEmailBody = emailBody.replace("к вам придёт", "вы едете к клиенту").replace("Подготовьте подарки", "Подготовьте костюм");
    try {
      await supabase.functions.invoke("send-notification-email", {
        body: {
          type: "booking_reminder",
          email: performerEmail,
          subject: emailSubject.replace("к вам", "у вас"),
          html: performerEmailBody,
          adminPhone
        }
      });
    } catch (err) {
      console.error("Failed to send performer email:", err);
    }
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Processing notification queue");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get admin phone from settings
    const { data: settings } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "admin_phone")
      .single();
    
    const adminPhone = settings?.value || "+7(995)3829736";

    // Get pending notifications that are due
    const now = new Date().toISOString();
    const { data: pendingNotifications, error } = await supabase
      .from("notification_queue")
      .select("*, booking:bookings(*)")
      .is("sent_at", null)
      .lte("scheduled_for", now)
      .limit(50);

    if (error) {
      console.error("Error fetching queue:", error);
      throw error;
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      console.log("No pending notifications");
      return new Response(JSON.stringify({ processed: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Processing", pendingNotifications.length, "notifications");

    let processed = 0;

    for (const notification of pendingNotifications) {
      const booking = notification.booking;
      
      // Skip if booking is cancelled or not confirmed+paid
      if (!booking || 
          booking.status !== "confirmed" || 
          !["prepayment_paid", "fully_paid"].includes(booking.payment_status)) {
        // Mark as sent to skip in future
        await supabase
          .from("notification_queue")
          .update({ sent_at: now })
          .eq("id", notification.id);
        continue;
      }

      await sendNotifications(supabase, booking, notification.notification_type, adminPhone);

      // Mark as sent
      await supabase
        .from("notification_queue")
        .update({ sent_at: now })
        .eq("id", notification.id);

      processed++;
    }

    return new Response(JSON.stringify({ processed }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error processing queue:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
