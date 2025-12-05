import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingNotificationRequest {
  type: "new_booking";
  bookingId: string;
  performerEmail: string;
  performerName: string;
  customerName: string;
  customerPhone: string;
  bookingDate: string;
  bookingTime: string;
  address: string;
  eventType: string;
  priceTotal: number;
}

interface BookingConfirmedRequest {
  type: "booking_confirmed";
  customerEmail: string;
  customerName: string;
  performerName: string;
  performerPhone?: string;
  bookingDate: string;
  bookingTime: string;
  address: string;
  priceTotal: number;
}

interface ReviewNotificationRequest {
  type: "new_review";
  performerEmail: string;
  performerName: string;
  customerName: string;
  rating: number;
  reviewText?: string;
}

type NotificationRequest = BookingNotificationRequest | BookingConfirmedRequest | ReviewNotificationRequest;

const eventTypeLabels: Record<string, string> = {
  home: "На дом",
  kindergarten: "Детский сад",
  school: "Школа",
  office: "Офис",
  corporate: "Корпоратив",
  outdoor: "На улице",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Received notification email request");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: NotificationRequest = await req.json();
    console.log("Notification type:", payload.type);

    if (payload.type === "new_booking") {
      const { performerEmail, performerName, customerName, customerPhone, bookingDate, bookingTime, address, eventType, priceTotal } = payload as BookingNotificationRequest;

      if (!performerEmail) {
        console.log("No performer email provided, skipping notification");
        return new Response(JSON.stringify({ success: true, skipped: true }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      console.log("Sending booking notification to:", performerEmail);

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "ДедМороз.kg <onboarding@resend.dev>",
          to: [performerEmail],
          subject: "🎄 Новое бронирование!",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #c41e3a; margin-bottom: 24px;">🎅 Новый заказ!</h1>
              <p style="font-size: 16px; color: #333;">Здравствуйте, <strong>${performerName}</strong>!</p>
              <p style="font-size: 16px; color: #333;">У вас новое бронирование на платформе ДедМороз.kg</p>
              <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <h3 style="margin-top: 0; color: #333;">📋 Детали заказа:</h3>
                <p><strong>Дата:</strong> ${bookingDate}</p>
                <p><strong>Время:</strong> ${bookingTime}</p>
                <p><strong>Тип:</strong> ${eventTypeLabels[eventType] || eventType}</p>
                <p><strong>Адрес:</strong> ${address}</p>
                <p><strong>Стоимость:</strong> <span style="color: #c41e3a; font-weight: bold;">${priceTotal.toLocaleString()} сом</span></p>
              </div>
              <div style="background: #e8f5e9; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <h3 style="margin-top: 0; color: #333;">👤 Клиент:</h3>
                <p><strong>Имя:</strong> ${customerName}</p>
                <p><strong>Телефон:</strong> <a href="tel:${customerPhone}" style="color: #c41e3a;">${customerPhone}</a></p>
              </div>
              <p style="font-size: 14px; color: #666;">Подтвердите заказ в личном кабинете.</p>
            </div>
          `,
        }),
      });

      const data = await res.json();
      console.log("Booking email response:", data);

      return new Response(JSON.stringify({ success: true, data }), {
        status: res.ok ? 200 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (payload.type === "booking_confirmed") {
      const { customerEmail, customerName, performerName, performerPhone, bookingDate, bookingTime, address, priceTotal } = payload as BookingConfirmedRequest;

      if (!customerEmail) {
        console.log("No customer email provided, skipping notification");
        return new Response(JSON.stringify({ success: true, skipped: true }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      console.log("Sending confirmation to customer:", customerEmail);

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "ДедМороз.kg <onboarding@resend.dev>",
          to: [customerEmail],
          subject: "✅ Ваш заказ подтверждён!",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #2e7d32; margin-bottom: 24px;">✅ Заказ подтверждён!</h1>
              <p style="font-size: 16px; color: #333;">Здравствуйте, <strong>${customerName}</strong>!</p>
              <p style="font-size: 16px; color: #333;">Отличные новости! Исполнитель <strong>${performerName}</strong> подтвердил ваш заказ.</p>
              
              <div style="background: #e8f5e9; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <h3 style="margin-top: 0; color: #333;">🎄 Детали визита:</h3>
                <p><strong>📅 Дата:</strong> ${bookingDate}</p>
                <p><strong>⏰ Время:</strong> ${bookingTime}</p>
                <p><strong>📍 Адрес:</strong> ${address}</p>
                <p><strong>💰 К оплате при встрече:</strong> <span style="font-weight: bold;">${Math.round(priceTotal * 0.7).toLocaleString()} сом</span></p>
              </div>
              
              ${performerPhone ? `
              <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <h3 style="margin-top: 0; color: #333;">📞 Контакт исполнителя:</h3>
                <p>Если нужно уточнить детали: <a href="tel:${performerPhone}" style="color: #c41e3a; font-weight: bold;">${performerPhone}</a></p>
              </div>
              ` : ''}
              
              <div style="background: #fff3e0; border-radius: 12px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0; color: #e65100;">💡 <strong>Совет:</strong> Подготовьте подарки заранее и положите их в мешок Деда Мороза!</p>
              </div>
              
              <p style="font-size: 14px; color: #666;">Ждём вас на празднике! 🎅</p>
            </div>
          `,
        }),
      });

      const data = await res.json();
      console.log("Customer confirmation email response:", data);

      return new Response(JSON.stringify({ success: true, data }), {
        status: res.ok ? 200 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (payload.type === "new_review") {
      const { performerEmail, performerName, customerName, rating, reviewText } = payload as ReviewNotificationRequest;

      if (!performerEmail) {
        console.log("No performer email provided, skipping notification");
        return new Response(JSON.stringify({ success: true, skipped: true }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const stars = "⭐".repeat(rating);

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "ДедМороз.kg <onboarding@resend.dev>",
          to: [performerEmail],
          subject: `✨ Новый отзыв: ${stars}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #c41e3a; margin-bottom: 24px;">✨ Новый отзыв!</h1>
              <p style="font-size: 16px; color: #333;">Здравствуйте, <strong>${performerName}</strong>!</p>
              <div style="background: #fff8e1; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
                <p style="font-size: 32px; margin: 0;">${stars}</p>
                <p style="font-size: 24px; font-weight: bold; color: #333; margin: 8px 0;">${rating} из 5</p>
              </div>
              ${reviewText ? `
                <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin: 24px 0;">
                  <p style="font-style: italic; color: #555;">"${reviewText}"</p>
                  <p style="text-align: right; color: #999;">— ${customerName}</p>
                </div>
              ` : `<p style="color: #666;">Клиент ${customerName} оценил вашу работу.</p>`}
            </div>
          `,
        }),
      });

      const data = await res.json();
      return new Response(JSON.stringify({ success: true, data }), {
        status: res.ok ? 200 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    throw new Error("Unknown notification type");
  } catch (error: any) {
    console.error("Error in send-notification-email function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
