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

interface ReviewNotificationRequest {
  type: "new_review";
  performerEmail: string;
  performerName: string;
  customerName: string;
  rating: number;
  reviewText?: string;
}

type NotificationRequest = BookingNotificationRequest | ReviewNotificationRequest;

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

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: NotificationRequest = await req.json();
    console.log("Notification type:", payload.type);

    if (payload.type === "new_booking") {
      const {
        performerEmail,
        performerName,
        customerName,
        customerPhone,
        bookingDate,
        bookingTime,
        address,
        eventType,
        priceTotal,
      } = payload as BookingNotificationRequest;

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
              
              <p style="font-size: 16px; color: #333;">
                Здравствуйте, <strong>${performerName}</strong>!
              </p>
              
              <p style="font-size: 16px; color: #333;">
                У вас новое бронирование на платформе ДедМороз.kg
              </p>
              
              <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <h3 style="margin-top: 0; color: #333;">📋 Детали заказа:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Дата:</td>
                    <td style="padding: 8px 0; font-weight: bold; color: #333;">${bookingDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Время:</td>
                    <td style="padding: 8px 0; font-weight: bold; color: #333;">${bookingTime}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Тип мероприятия:</td>
                    <td style="padding: 8px 0; font-weight: bold; color: #333;">${eventTypeLabels[eventType] || eventType}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Адрес:</td>
                    <td style="padding: 8px 0; font-weight: bold; color: #333;">${address}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Стоимость:</td>
                    <td style="padding: 8px 0; font-weight: bold; color: #c41e3a;">${priceTotal.toLocaleString()} сом</td>
                  </tr>
                </table>
              </div>
              
              <div style="background: #e8f5e9; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <h3 style="margin-top: 0; color: #333;">👤 Контакты клиента:</h3>
                <p style="margin: 8px 0;"><strong>Имя:</strong> ${customerName}</p>
                <p style="margin: 8px 0;"><strong>Телефон:</strong> <a href="tel:${customerPhone}" style="color: #c41e3a;">${customerPhone}</a></p>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-top: 24px;">
                Пожалуйста, подтвердите заказ в личном кабинете или свяжитесь с клиентом.
              </p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
              
              <p style="font-size: 12px; color: #999; text-align: center;">
                ДедМороз.kg — платформа для поиска исполнителей новогодних поздравлений
              </p>
            </div>
          `,
        }),
      });

      const data = await res.json();
      console.log("Booking email response:", data);

      if (!res.ok) {
        throw new Error(data.message || "Failed to send email");
      }

      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (payload.type === "new_review") {
      const { performerEmail, performerName, customerName, rating, reviewText } =
        payload as ReviewNotificationRequest;

      console.log("Sending review notification to:", performerEmail);

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
              
              <p style="font-size: 16px; color: #333;">
                Здравствуйте, <strong>${performerName}</strong>!
              </p>
              
              <p style="font-size: 16px; color: #333;">
                Клиент оставил вам отзыв на платформе ДедМороз.kg
              </p>
              
              <div style="background: #fff8e1; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
                <p style="font-size: 32px; margin: 0;">${stars}</p>
                <p style="font-size: 24px; font-weight: bold; color: #333; margin: 8px 0;">${rating} из 5</p>
              </div>
              
              ${
                reviewText
                  ? `
                <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin: 24px 0;">
                  <h3 style="margin-top: 0; color: #333;">💬 Текст отзыва:</h3>
                  <p style="font-style: italic; color: #555; line-height: 1.6;">"${reviewText}"</p>
                  <p style="text-align: right; color: #999; margin-bottom: 0;">— ${customerName}</p>
                </div>
              `
                  : `<p style="color: #666;">Клиент <strong>${customerName}</strong> не оставил текстовый отзыв.</p>`
              }
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
              
              <p style="font-size: 12px; color: #999; text-align: center;">
                ДедМороз.kg — платформа для поиска исполнителей новогодних поздравлений
              </p>
            </div>
          `,
        }),
      });

      const data = await res.json();
      console.log("Review email response:", data);

      if (!res.ok) {
        throw new Error(data.message || "Failed to send email");
      }

      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
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
