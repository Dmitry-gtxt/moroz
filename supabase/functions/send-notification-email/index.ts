import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const ADMIN_EMAIL = "admin@dedmoroz.kg"; // Admin notification email

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// HTML escape function to prevent XSS/injection in email templates
function escapeHtml(text: string | undefined | null): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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

interface BookingRejectedRequest {
  type: "booking_rejected";
  customerEmail: string;
  customerName: string;
  performerName: string;
  bookingDate: string;
  bookingTime: string;
  rejectionReason: string;
}

interface ReviewNotificationRequest {
  type: "new_review";
  performerEmail: string;
  performerName: string;
  customerName: string;
  rating: number;
  reviewText?: string;
}

interface BookingCancelledRequest {
  type: "booking_cancelled";
  customerEmail?: string;
  performerEmail?: string;
  customerName: string;
  performerName: string;
  bookingDate: string;
  bookingTime: string;
  cancellationReason: string;
  cancelledBy: "customer" | "performer";
}

interface ProfilePendingVerificationRequest {
  type: "profile_pending_verification";
  performerId: string;
  performerName: string;
  performerEmail?: string;
  changedFields?: string[];
}

interface ProfileUnpublishedAdminRequest {
  type: "profile_unpublished_admin";
  performerId: string;
  performerName: string;
  changedFields?: string[];
}

type NotificationRequest = 
  | BookingNotificationRequest 
  | BookingConfirmedRequest 
  | BookingRejectedRequest 
  | ReviewNotificationRequest 
  | BookingCancelledRequest
  | ProfilePendingVerificationRequest
  | ProfileUnpublishedAdminRequest;

const eventTypeLabels: Record<string, string> = {
  home: "На дом",
  kindergarten: "Детский сад",
  school: "Школа",
  office: "Офис",
  corporate: "Корпоратив",
  outdoor: "На улице",
};

const fieldLabels: Record<string, string> = {
  display_name: "Имя",
  description: "Описание",
  photo_urls: "Фотографии",
  video_greeting_url: "Видео-приветствие",
  performer_types: "Типы исполнителя",
  base_price: "Цена",
  costume_style: "Стиль костюма",
  age: "Возраст",
  experience_years: "Опыт работы",
  district_slugs: "Районы",
  formats: "Форматы мероприятий",
  price_from: "Цена от",
  price_to: "Цена до",
};

async function sendEmail(to: string[], subject: string, html: string): Promise<Response> {
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "ДедМороз.kg <onboarding@resend.dev>",
      to,
      subject,
      html,
    }),
  });
}

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

      const res = await sendEmail(
        [performerEmail],
        "🎄 Новая заявка на бронирование!",
        `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #c41e3a; margin-bottom: 24px;">🎅 Новая заявка!</h1>
            <p style="font-size: 16px; color: #333;">Здравствуйте, <strong>${escapeHtml(performerName)}</strong>!</p>
            <p style="font-size: 16px; color: #333;">У вас новая заявка на бронирование на платформе ДедМороз.kg</p>
            
            <div style="background: #fff3e0; border-radius: 12px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0; color: #e65100;">⚠️ <strong>Важно:</strong> Подтвердите или отклоните заявку в личном кабинете. До подтверждения время остаётся доступным для других клиентов.</p>
            </div>
            
            <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <h3 style="margin-top: 0; color: #333;">📋 Детали заявки:</h3>
              <p><strong>Дата:</strong> ${escapeHtml(bookingDate)}</p>
              <p><strong>Время:</strong> ${escapeHtml(bookingTime)}</p>
              <p><strong>Тип:</strong> ${escapeHtml(eventTypeLabels[eventType] || eventType)}</p>
              <p><strong>Адрес:</strong> ${escapeHtml(address)}</p>
              <p><strong>Стоимость:</strong> <span style="color: #c41e3a; font-weight: bold;">${priceTotal.toLocaleString()} сом</span></p>
            </div>
            <div style="background: #e8f5e9; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <h3 style="margin-top: 0; color: #333;">👤 Клиент:</h3>
              <p><strong>Имя:</strong> ${escapeHtml(customerName)}</p>
              <p><strong>Телефон:</strong> <a href="tel:${escapeHtml(customerPhone)}" style="color: #c41e3a;">${escapeHtml(customerPhone)}</a></p>
            </div>
            <p style="font-size: 14px; color: #666;">Подтвердите или отклоните заявку в личном кабинете.</p>
          </div>
        `
      );

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

      const res = await sendEmail(
        [customerEmail],
        "✅ Ваша заявка подтверждена!",
        `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2e7d32; margin-bottom: 24px;">✅ Заявка подтверждена!</h1>
            <p style="font-size: 16px; color: #333;">Здравствуйте, <strong>${escapeHtml(customerName)}</strong>!</p>
            <p style="font-size: 16px; color: #333;">Отличные новости! Исполнитель <strong>${escapeHtml(performerName)}</strong> подтвердил вашу заявку. Время забронировано!</p>
            
            <div style="background: #e8f5e9; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <h3 style="margin-top: 0; color: #333;">🎄 Детали визита:</h3>
              <p><strong>📅 Дата:</strong> ${escapeHtml(bookingDate)}</p>
              <p><strong>⏰ Время:</strong> ${escapeHtml(bookingTime)}</p>
              <p><strong>📍 Адрес:</strong> ${escapeHtml(address)}</p>
              <p><strong>💰 К оплате при встрече:</strong> <span style="font-weight: bold;">${Math.round(priceTotal * 0.7).toLocaleString()} сом</span></p>
            </div>
            
            ${performerPhone ? `
            <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <h3 style="margin-top: 0; color: #333;">📞 Контакт исполнителя:</h3>
              <p>Если нужно уточнить детали: <a href="tel:${escapeHtml(performerPhone)}" style="color: #c41e3a; font-weight: bold;">${escapeHtml(performerPhone)}</a></p>
            </div>
            ` : ''}
            
            <div style="background: #fff3e0; border-radius: 12px; padding: 16px; margin: 24px 0;">
              <p style="margin: 0; color: #e65100;">💡 <strong>Совет:</strong> Подготовьте подарки заранее и положите их в мешок Деда Мороза!</p>
            </div>
            
            <p style="font-size: 14px; color: #666;">Ждём вас на празднике! 🎅</p>
          </div>
        `
      );

      const data = await res.json();
      console.log("Customer confirmation email response:", data);

      return new Response(JSON.stringify({ success: true, data }), {
        status: res.ok ? 200 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (payload.type === "booking_rejected") {
      const { customerEmail, customerName, performerName, bookingDate, bookingTime, rejectionReason } = payload as BookingRejectedRequest;

      if (!customerEmail) {
        console.log("No customer email provided, skipping notification");
        return new Response(JSON.stringify({ success: true, skipped: true }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      console.log("Sending rejection notice to customer:", customerEmail);

      const res = await sendEmail(
        [customerEmail],
        "😔 Заявка отклонена",
        `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #d32f2f; margin-bottom: 24px;">😔 Заявка отклонена</h1>
            <p style="font-size: 16px; color: #333;">Здравствуйте, <strong>${escapeHtml(customerName)}</strong>!</p>
            <p style="font-size: 16px; color: #333;">К сожалению, исполнитель <strong>${escapeHtml(performerName)}</strong> не смог принять вашу заявку.</p>
            
            <div style="background: #ffebee; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <h3 style="margin-top: 0; color: #333;">📋 Детали заявки:</h3>
              <p><strong>📅 Дата:</strong> ${escapeHtml(bookingDate)}</p>
              <p><strong>⏰ Время:</strong> ${escapeHtml(bookingTime)}</p>
            </div>
            
            <div style="background: #fff3e0; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <h3 style="margin-top: 0; color: #333;">💬 Причина:</h3>
              <p style="color: #555;">${escapeHtml(rejectionReason)}</p>
            </div>
            
            <p style="font-size: 14px; color: #666;">Не расстраивайтесь! Вы можете выбрать другого исполнителя в нашем каталоге. Предоплата будет возвращена.</p>
            
            <div style="text-align: center; margin-top: 24px;">
              <a href="https://dedmoroz.kg/catalog" style="display: inline-block; background: #c41e3a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">🎅 Найти другого исполнителя</a>
            </div>
          </div>
        `
      );

      const data = await res.json();
      console.log("Rejection email response:", data);

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

      const res = await sendEmail(
        [performerEmail],
        `✨ Новый отзыв: ${stars}`,
        `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #c41e3a; margin-bottom: 24px;">✨ Новый отзыв!</h1>
            <p style="font-size: 16px; color: #333;">Здравствуйте, <strong>${escapeHtml(performerName)}</strong>!</p>
            <div style="background: #fff8e1; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
              <p style="font-size: 32px; margin: 0;">${stars}</p>
              <p style="font-size: 24px; font-weight: bold; color: #333; margin: 8px 0;">${rating} из 5</p>
            </div>
            ${reviewText ? `
              <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <p style="font-style: italic; color: #555;">"${escapeHtml(reviewText)}"</p>
                <p style="text-align: right; color: #999;">— ${escapeHtml(customerName)}</p>
              </div>
            ` : `<p style="color: #666;">Клиент ${escapeHtml(customerName)} оценил вашу работу.</p>`}
          </div>
        `
      );

      const data = await res.json();
      return new Response(JSON.stringify({ success: true, data }), {
        status: res.ok ? 200 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (payload.type === "booking_cancelled") {
      const { customerEmail, performerEmail, customerName, performerName, bookingDate, bookingTime, cancellationReason, cancelledBy } = payload as BookingCancelledRequest;

      const emails: Promise<Response>[] = [];

      // Send to customer if performer cancelled
      if (cancelledBy === "performer" && customerEmail) {
        console.log("Sending cancellation notice to customer:", customerEmail);
        emails.push(
          sendEmail(
            [customerEmail],
            "❌ Заказ отменён исполнителем",
            `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #d32f2f; margin-bottom: 24px;">❌ Заказ отменён</h1>
                <p style="font-size: 16px; color: #333;">Здравствуйте, <strong>${escapeHtml(customerName)}</strong>!</p>
                <p style="font-size: 16px; color: #333;">К сожалению, исполнитель <strong>${escapeHtml(performerName)}</strong> отменил ваш заказ.</p>
                
                <div style="background: #ffebee; border-radius: 12px; padding: 20px; margin: 24px 0;">
                  <h3 style="margin-top: 0; color: #333;">📋 Детали отменённого заказа:</h3>
                  <p><strong>📅 Дата:</strong> ${escapeHtml(bookingDate)}</p>
                  <p><strong>⏰ Время:</strong> ${escapeHtml(bookingTime)}</p>
                </div>
                
                <div style="background: #fff3e0; border-radius: 12px; padding: 20px; margin: 24px 0;">
                  <h3 style="margin-top: 0; color: #333;">💬 Причина отмены:</h3>
                  <p style="color: #555;">${escapeHtml(cancellationReason)}</p>
                </div>
                
                <p style="font-size: 14px; color: #666;">Вы можете выбрать другого исполнителя в нашем каталоге. Предоплата будет возвращена.</p>
                
                <div style="text-align: center; margin-top: 24px;">
                  <a href="https://dedmoroz.kg/catalog" style="display: inline-block; background: #c41e3a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">🎅 Найти другого исполнителя</a>
                </div>
              </div>
            `
          )
        );
      }

      // Send to performer if customer cancelled
      if (cancelledBy === "customer" && performerEmail) {
        console.log("Sending cancellation notice to performer:", performerEmail);
        emails.push(
          sendEmail(
            [performerEmail],
            "❌ Клиент отменил заказ",
            `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #d32f2f; margin-bottom: 24px;">❌ Заказ отменён клиентом</h1>
                <p style="font-size: 16px; color: #333;">Здравствуйте, <strong>${escapeHtml(performerName)}</strong>!</p>
                <p style="font-size: 16px; color: #333;">Клиент <strong>${escapeHtml(customerName)}</strong> отменил бронирование.</p>
                
                <div style="background: #ffebee; border-radius: 12px; padding: 20px; margin: 24px 0;">
                  <h3 style="margin-top: 0; color: #333;">📋 Детали отменённого заказа:</h3>
                  <p><strong>📅 Дата:</strong> ${escapeHtml(bookingDate)}</p>
                  <p><strong>⏰ Время:</strong> ${escapeHtml(bookingTime)}</p>
                </div>
                
                <div style="background: #fff3e0; border-radius: 12px; padding: 20px; margin: 24px 0;">
                  <h3 style="margin-top: 0; color: #333;">💬 Причина отмены:</h3>
                  <p style="color: #555;">${escapeHtml(cancellationReason)}</p>
                </div>
                
                <p style="font-size: 14px; color: #666;">Освободившееся время снова доступно для бронирования.</p>
              </div>
            `
          )
        );
      }

      if (emails.length === 0) {
        console.log("No recipient emails provided, skipping notification");
        return new Response(JSON.stringify({ success: true, skipped: true }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const responses = await Promise.all(emails);
      const allOk = responses.every(r => r.ok);

      return new Response(JSON.stringify({ success: true }), {
        status: allOk ? 200 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Handle profile pending verification notification (to performer)
    if (payload.type === "profile_pending_verification") {
      const { performerId, performerName, performerEmail, changedFields } = payload as ProfilePendingVerificationRequest;
      
      let emailToSend = performerEmail;
      
      // If no email provided, try to fetch from database
      if (!emailToSend && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        // Get performer's user_id
        const { data: performer } = await supabase
          .from('performer_profiles')
          .select('user_id')
          .eq('id', performerId)
          .single();
        
        if (performer?.user_id) {
          // Get user email from auth
          const { data: authUser } = await supabase.auth.admin.getUserById(performer.user_id);
          emailToSend = authUser?.user?.email;
        }
      }

      if (!emailToSend) {
        console.log("No performer email found, skipping notification");
        return new Response(JSON.stringify({ success: true, skipped: true }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const changedFieldsText = changedFields && changedFields.length > 0
        ? changedFields.map(f => fieldLabels[f] || f).join(', ')
        : 'данные профиля';

      console.log("Sending pending verification notice to performer:", emailToSend);

      const res = await sendEmail(
        [emailToSend],
        "⏳ Ваш профиль отправлен на проверку",
        `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #ff9800; margin-bottom: 24px;">⏳ Профиль на проверке</h1>
            <p style="font-size: 16px; color: #333;">Здравствуйте, <strong>${escapeHtml(performerName)}</strong>!</p>
            <p style="font-size: 16px; color: #333;">Вы обновили информацию в своём профиле. В соответствии с правилами платформы, ваш профиль временно снят с публикации и отправлен на проверку модератором.</p>
            
            <div style="background: #fff3e0; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <h3 style="margin-top: 0; color: #333;">📝 Изменённые данные:</h3>
              <p style="color: #555;">${escapeHtml(changedFieldsText)}</p>
            </div>
            
            <div style="background: #e3f2fd; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <p style="margin: 0; color: #1565c0;">ℹ️ <strong>Что это значит:</strong></p>
              <ul style="color: #555; margin-top: 12px;">
                <li>Ваш профиль не отображается в каталоге</li>
                <li>Новые бронирования временно недоступны</li>
                <li>Существующие бронирования остаются в силе</li>
              </ul>
            </div>
            
            <p style="font-size: 14px; color: #666;">Проверка обычно занимает до 24 часов. Мы уведомим вас о результате.</p>
          </div>
        `
      );

      const data = await res.json();
      console.log("Pending verification email response:", data);

      return new Response(JSON.stringify({ success: true, data }), {
        status: res.ok ? 200 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Handle profile unpublished notification (to admin)
    if (payload.type === "profile_unpublished_admin") {
      const { performerId, performerName, changedFields } = payload as ProfileUnpublishedAdminRequest;

      const changedFieldsText = changedFields && changedFields.length > 0
        ? changedFields.map(f => fieldLabels[f] || f).join(', ')
        : 'данные профиля';

      console.log("Sending unpublished profile notice to admin");

      const res = await sendEmail(
        [ADMIN_EMAIL],
        "🔔 Исполнитель обновил профиль — требуется проверка",
        `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1976d2; margin-bottom: 24px;">🔔 Профиль на проверке</h1>
            <p style="font-size: 16px; color: #333;">Исполнитель <strong>${escapeHtml(performerName)}</strong> обновил данные профиля.</p>
            <p style="font-size: 16px; color: #333;">Профиль автоматически снят с публикации и ожидает модерации.</p>
            
            <div style="background: #e3f2fd; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <h3 style="margin-top: 0; color: #333;">📋 Детали:</h3>
              <p><strong>ID исполнителя:</strong> ${escapeHtml(performerId)}</p>
              <p><strong>Имя:</strong> ${escapeHtml(performerName)}</p>
              <p><strong>Изменённые данные:</strong> ${escapeHtml(changedFieldsText)}</p>
            </div>
            
            <div style="text-align: center; margin-top: 24px;">
              <a href="https://dedmoroz.kg/admin/moderation" style="display: inline-block; background: #1976d2; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">📋 Перейти к модерации</a>
            </div>
          </div>
        `
      );

      const data = await res.json();
      console.log("Admin notification email response:", data);

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
