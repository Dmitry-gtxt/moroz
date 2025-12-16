import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const ADMIN_EMAIL = "ded-morozy@gtxt.biz"; // Admin notification email

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
  bookingId?: string;
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

interface WelcomeEmailRequest {
  type: "welcome_email";
  email: string;
  fullName: string;
}

interface AdminActionRequest {
  type: "admin_action";
  performerId: string;
  performerName: string;
  action: "photo_deleted" | "video_deleted";
  reason: string;
}

interface AdminStatusChangeRequest {
  type: "admin_status_change";
  performerId: string;
  performerName: string;
  changeType: "verification" | "publication";
  newValue: string | boolean;
  reason: string;
}

interface VerificationApprovedRequest {
  type: "verification_approved";
  performerId: string;
  performerName: string;
}

interface VerificationRejectedRequest {
  type: "verification_rejected";
  performerId: string;
  performerName: string;
  reason: string;
}

interface ProfileActivatedRequest {
  type: "profile_activated";
  performerId: string;
  performerName: string;
}

interface VerificationSubmittedAdminRequest {
  type: "verification_submitted_admin";
  performerId: string;
  performerName: string;
}

interface ModerationApprovedRequest {
  type: "moderation_approved";
  performerId: string;
  performerName: string;
}

interface ModerationRejectedRequest {
  type: "moderation_rejected";
  performerId: string;
  performerName: string;
  reason: string;
}

interface TestEmailRequest {
  type: "test";
  email: string;
  data?: {
    testMessage?: string;
  };
}

interface PaymentReceivedRequest {
  type: "payment_received";
  performerEmail: string;
  performerName: string;
  customerName: string;
  bookingDate: string;
  bookingTime: string;
  amount: number;
  paymentStatus: string;
}

type NotificationRequest = 
  | BookingNotificationRequest 
  | BookingConfirmedRequest 
  | BookingRejectedRequest 
  | ReviewNotificationRequest 
  | BookingCancelledRequest
  | ProfilePendingVerificationRequest
  | ProfileUnpublishedAdminRequest
  | WelcomeEmailRequest
  | AdminActionRequest
  | AdminStatusChangeRequest
  | VerificationApprovedRequest
  | VerificationRejectedRequest
  | ProfileActivatedRequest
  | VerificationSubmittedAdminRequest
  | ModerationApprovedRequest
  | ModerationRejectedRequest
  | PaymentReceivedRequest
  | TestEmailRequest;

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

const SITE_DOMAIN = "ded-morozy-rf.ru";
const SITE_URL = `https://${SITE_DOMAIN}`;

async function sendEmail(to: string[], subject: string, html: string): Promise<Response> {
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: `Дед-Морозы.РФ <noreply@${SITE_DOMAIN}>`,
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
            <p style="font-size: 16px; color: #333;">У вас новая заявка на бронирование на платформе Дед-Морозы.РФ</p>
            
            <div style="background: #fff3e0; border-radius: 12px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0; color: #e65100;">⚠️ <strong>Важно:</strong> Подтвердите или отклоните заявку в личном кабинете. До подтверждения время остаётся доступным для других клиентов.</p>
            </div>
            
            <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <h3 style="margin-top: 0; color: #333;">📋 Детали заявки:</h3>
              <p><strong>Дата:</strong> ${escapeHtml(bookingDate)}</p>
              <p><strong>Время:</strong> ${escapeHtml(bookingTime)}</p>
              <p><strong>Тип:</strong> ${escapeHtml(eventTypeLabels[eventType] || eventType)}</p>
              <p><strong>Адрес:</strong> ${escapeHtml(address)}</p>
              <p><strong>Стоимость:</strong> <span style="color: #c41e3a; font-weight: bold;">${priceTotal.toLocaleString()} ₽</span></p>
            </div>
            <div style="background: #e8f5e9; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <h3 style="margin-top: 0; color: #333;">👤 Клиент:</h3>
              <p><strong>Имя:</strong> ${escapeHtml(customerName)}</p>
              <p><strong>Телефон:</strong> <a href="tel:${escapeHtml(customerPhone)}" style="color: #c41e3a;">${escapeHtml(customerPhone)}</a></p>
            </div>
            
            <div style="text-align: center; margin-top: 24px;">
              <a href="${SITE_URL}/performer/bookings" style="display: inline-block; background: #c41e3a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">📋 Перейти к заказам</a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 24px;">Подтвердите или отклоните заявку в личном кабинете.</p>
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
              <a href="${SITE_URL}/catalog" style="display: inline-block; background: #c41e3a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">🎅 Найти другого исполнителя</a>
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
      const { bookingId, customerEmail, performerEmail, customerName, performerName, bookingDate, bookingTime, cancellationReason, cancelledBy } = payload as BookingCancelledRequest;

      let finalCustomerEmail = customerEmail;
      let finalPerformerEmail = performerEmail;

      // Fetch emails from database if not provided
      if ((!finalCustomerEmail || !finalPerformerEmail) && bookingId && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        const { data: booking } = await supabase
          .from('bookings')
          .select('customer_email, performer_id')
          .eq('id', bookingId)
          .single();

        if (booking) {
          if (!finalCustomerEmail) {
            finalCustomerEmail = booking.customer_email || undefined;
          }
          
          if (!finalPerformerEmail && booking.performer_id) {
            // Get performer's user_id then email
            const { data: performer } = await supabase
              .from('performer_profiles')
              .select('user_id')
              .eq('id', booking.performer_id)
              .single();

            if (performer?.user_id) {
              const { data: userData } = await supabase.auth.admin.getUserById(performer.user_id);
              finalPerformerEmail = userData?.user?.email || undefined;
            }
          }
        }
      }

      const emails: Promise<Response>[] = [];

      // Send to customer if performer cancelled
      if (cancelledBy === "performer" && finalCustomerEmail) {
        console.log("Sending cancellation notice to customer:", finalCustomerEmail);
        emails.push(
          sendEmail(
            [finalCustomerEmail],
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
                  <a href="${SITE_URL}/catalog" style="display: inline-block; background: #c41e3a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">🎅 Найти другого исполнителя</a>
                </div>
              </div>
            `
          )
        );
      }

      // Send to performer if customer cancelled
      if (cancelledBy === "customer" && finalPerformerEmail) {
        console.log("Sending cancellation notice to performer:", finalPerformerEmail);
        emails.push(
          sendEmail(
            [finalPerformerEmail],
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
        console.log("No recipient emails provided or found, skipping notification");
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
            
            <div style="text-align: center; margin-top: 24px;">
              <a href="${SITE_URL}/performer/profile" style="display: inline-block; background: #ff9800; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">📋 Перейти в личный кабинет</a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 24px;">Проверка обычно занимает до 24 часов. Мы уведомим вас о результате.</p>
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
              <a href="${SITE_URL}/admin/moderation" style="display: inline-block; background: #1976d2; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">📋 Перейти к модерации</a>
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

    // Handle welcome email for new users
    if (payload.type === "welcome_email") {
      const { email, fullName } = payload as WelcomeEmailRequest;

      if (!email) {
        console.log("No email provided for welcome message, skipping");
        return new Response(JSON.stringify({ success: true, skipped: true }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      console.log("Sending welcome email to:", email);

      const res = await sendEmail(
        [email],
        "🎄 Добро пожаловать на Дед-Морозы.РФ!",
        `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #c41e3a; margin-bottom: 8px;">🎅 Добро пожаловать!</h1>
              <p style="font-size: 18px; color: #333;">на Дед-Морозы.РФ</p>
            </div>
            
            <p style="font-size: 16px; color: #333;">Здравствуйте${fullName ? `, <strong>${escapeHtml(fullName)}</strong>` : ''}!</p>
            
            <p style="font-size: 16px; color: #333;">Благодарим вас за регистрацию на нашей платформе! Теперь вы можете заказать настоящего Деда Мороза для своих детей или близких.</p>
            
            <div style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-radius: 16px; padding: 24px; margin: 24px 0; text-align: center;">
              <h2 style="margin: 0 0 16px 0; color: #2e7d32;">🎁 Что вас ждёт?</h2>
              <ul style="text-align: left; color: #333; margin: 0; padding-left: 20px;">
                <li style="margin: 8px 0;">Выбор из проверенных Дедов Морозов и Снегурочек</li>
                <li style="margin: 8px 0;">Удобное онлайн-бронирование</li>
                <li style="margin: 8px 0;">Реальные отзывы от других родителей</li>
                <li style="margin: 8px 0;">Гарантия качества и возврат средств</li>
              </ul>
            </div>
            
            <div style="background: #f3e5f5; border-radius: 16px; padding: 24px; margin: 24px 0;">
              <h3 style="margin: 0 0 12px 0; color: #7b1fa2; text-align: center;">🎄 Каталог Дедов Морозов</h3>
              <p style="color: #555; text-align: center; margin: 0 0 16px 0;">В нашем каталоге вы найдёте проверенных исполнителей с реальными отзывами. Выберите подходящего Деда Мороза и забронируйте визит онлайн!</p>
              <div style="text-align: center;">
                <a href="${SITE_URL}/catalog" style="display: inline-block; background: linear-gradient(135deg, #c41e3a 0%, #8b0000 100%); color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 15px;">🎅 Выбрать Деда Мороза</a>
              </div>
            </div>
            
            <div style="background: #e3f2fd; border-radius: 16px; padding: 24px; margin: 24px 0;">
              <h3 style="margin: 0 0 12px 0; color: #1565c0; text-align: center;">🎭 Хотите стать Дедом Морозом?</h3>
              <p style="color: #555; text-align: center; margin: 0 0 16px 0;">Если вы профессиональный аниматор или артист — присоединяйтесь к нашей команде и принимайте заказы на новогодние праздники!</p>
              <div style="text-align: center;">
                <a href="${SITE_URL}/performer/register" style="display: inline-block; background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%); color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 15px;">🎅 Стать исполнителем</a>
              </div>
            </div>
            
            <div style="background: #fff3e0; border-radius: 12px; padding: 16px; margin: 24px 0;">
              <p style="margin: 0; color: #e65100; text-align: center;">💡 <strong>Совет:</strong> Бронируйте заранее! В предновогодние дни самые популярные исполнители быстро разбираются.</p>
            </div>
            
            <p style="font-size: 14px; color: #666; text-align: center;">С наступающим Новым годом! 🎄✨</p>
            <p style="font-size: 14px; color: #666; text-align: center;">Команда Дед-Морозы.РФ</p>
          </div>
        `
      );

      const data = await res.json();
      console.log("Welcome email response:", data);

      return new Response(JSON.stringify({ success: true, data }), {
        status: res.ok ? 200 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Handle admin actions (photo/video deletion)
    if (payload.type === "admin_action") {
      const { performerId, performerName, action, reason } = payload as AdminActionRequest;

      let emailToSend: string | undefined;

      // Get performer's email
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        const { data: performer } = await supabase
          .from('performer_profiles')
          .select('user_id')
          .eq('id', performerId)
          .single();
        
        if (performer?.user_id) {
          const { data: authUser } = await supabase.auth.admin.getUserById(performer.user_id);
          emailToSend = authUser?.user?.email;
        }
      }

      if (!emailToSend) {
        console.log("No performer email found, skipping admin action notification");
        return new Response(JSON.stringify({ success: true, skipped: true }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const actionText = action === "photo_deleted" ? "фотографию" : "видео-приветствие";
      const actionEmoji = action === "photo_deleted" ? "🖼️" : "🎬";

      console.log("Sending admin action notification to:", emailToSend);

      const res = await sendEmail(
        [emailToSend],
        `⚠️ Модератор удалил ${actionText} из вашего профиля`,
        `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #ff9800; margin-bottom: 24px;">${actionEmoji} Уведомление от модератора</h1>
            <p style="font-size: 16px; color: #333;">Здравствуйте, <strong>${escapeHtml(performerName)}</strong>!</p>
            <p style="font-size: 16px; color: #333;">Модератор платформы удалил ${actionText} из вашего профиля.</p>
            
            <div style="background: #fff3e0; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <h3 style="margin-top: 0; color: #333;">📝 Причина:</h3>
              <p style="color: #555;">${escapeHtml(reason)}</p>
            </div>
            
            <div style="background: #e3f2fd; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <p style="margin: 0; color: #1565c0;">ℹ️ Вы можете загрузить новое ${action === "photo_deleted" ? "фото" : "видео"} в личном кабинете, соответствующее правилам платформы.</p>
            </div>
            
            <p style="font-size: 14px; color: #666;">Если у вас есть вопросы, свяжитесь с нами через чат поддержки в личном кабинете.</p>
          </div>
        `
      );

      const data = await res.json();
      console.log("Admin action email response:", data);

      return new Response(JSON.stringify({ success: true, data }), {
        status: res.ok ? 200 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Handle admin status changes (verification/publication)
    if (payload.type === "admin_status_change") {
      const { performerId, performerName, changeType, newValue, reason } = payload as AdminStatusChangeRequest;

      let emailToSend: string | undefined;

      // Get performer's email
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        const { data: performer } = await supabase
          .from('performer_profiles')
          .select('user_id')
          .eq('id', performerId)
          .single();
        
        if (performer?.user_id) {
          const { data: authUser } = await supabase.auth.admin.getUserById(performer.user_id);
          emailToSend = authUser?.user?.email;
        }
      }

      if (!emailToSend) {
        console.log("No performer email found, skipping status change notification");
        return new Response(JSON.stringify({ success: true, skipped: true }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      let subject: string;
      let title: string;
      let description: string;
      let statusColor: string;

      if (changeType === "verification") {
        const verificationLabels: Record<string, string> = {
          unverified: "Не верифицирован",
          pending: "На проверке",
          verified: "Верифицирован",
          rejected: "Отклонён",
        };
        const statusLabel = verificationLabels[newValue as string] || newValue;
        
        if (newValue === "verified") {
          subject = "✅ Ваш профиль верифицирован!";
          title = "✅ Верификация пройдена!";
          description = "Поздравляем! Ваш профиль успешно прошёл верификацию.";
          statusColor = "#4caf50";
        } else if (newValue === "rejected") {
          subject = "❌ Верификация отклонена";
          title = "❌ Верификация не пройдена";
          description = "К сожалению, ваш профиль не прошёл верификацию.";
          statusColor = "#f44336";
        } else {
          subject = `📋 Статус верификации изменён: ${statusLabel}`;
          title = "📋 Изменение статуса верификации";
          description = `Ваш статус верификации изменён на "${statusLabel}".`;
          statusColor = "#ff9800";
        }
      } else {
        // Publication change
        if (newValue === true) {
          subject = "🎉 Ваш профиль опубликован!";
          title = "🎉 Профиль активирован!";
          description = "Отличные новости! Ваш профиль теперь виден в каталоге и доступен для бронирования.";
          statusColor = "#4caf50";
        } else {
          subject = "⚠️ Ваш профиль снят с публикации";
          title = "⚠️ Профиль деактивирован";
          description = "Ваш профиль был снят с публикации модератором.";
          statusColor = "#ff9800";
        }
      }

      console.log("Sending status change notification to:", emailToSend);

      const res = await sendEmail(
        [emailToSend],
        subject,
        `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: ${statusColor}; margin-bottom: 24px;">${title}</h1>
            <p style="font-size: 16px; color: #333;">Здравствуйте, <strong>${escapeHtml(performerName)}</strong>!</p>
            <p style="font-size: 16px; color: #333;">${description}</p>
            
            <div style="background: #f5f5f5; border-radius: 12px; padding: 20px; margin: 24px 0; border-left: 4px solid ${statusColor};">
              <h3 style="margin-top: 0; color: #333;">💬 Комментарий модератора:</h3>
              <p style="color: #555;">${escapeHtml(reason)}</p>
            </div>
            
            ${changeType === "publication" && newValue === true ? `
            <div style="background: #e8f5e9; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <h3 style="margin-top: 0; color: #2e7d32;">🚀 Что дальше?</h3>
              <ul style="color: #333; margin: 0; padding-left: 20px;">
                <li style="margin: 8px 0;">Убедитесь, что указали дни и часы работы в расписании</li>
                <li style="margin: 8px 0;">Чем больше фотографий — тем выше интерес клиентов</li>
                <li style="margin: 8px 0;">Видео-приветствие значительно повышает конверсию бронирований</li>
                <li style="margin: 8px 0;">Качественное описание помогает выделиться среди конкурентов</li>
              </ul>
            </div>
            ` : ''}
            
            <div style="text-align: center; margin-top: 24px;">
              <a href="${SITE_URL}/performer/dashboard" style="display: inline-block; background: #c41e3a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">📋 Перейти в личный кабинет</a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 24px;">Если у вас есть вопросы, свяжитесь с нами через чат поддержки.</p>
          </div>
        `
      );

      const data = await res.json();
      console.log("Status change email response:", data);

      return new Response(JSON.stringify({ success: true, data }), {
        status: res.ok ? 200 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Handle verification approved
    if (payload.type === "verification_approved") {
      const { performerId, performerName } = payload as VerificationApprovedRequest;
      
      let emailToSend: string | undefined;
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: performer } = await supabase.from('performer_profiles').select('user_id').eq('id', performerId).single();
        if (performer?.user_id) {
          const { data: authUser } = await supabase.auth.admin.getUserById(performer.user_id);
          emailToSend = authUser?.user?.email;
        }
      }

      if (emailToSend) {
        await sendEmail([emailToSend], "✅ Верификация пройдена!", `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4caf50;">✅ Поздравляем, ${escapeHtml(performerName)}!</h1>
            <p>Ваш профиль успешно прошёл верификацию. Теперь администратор может активировать ваш профиль для публикации в каталоге.</p>
            <div style="text-align: center; margin-top: 24px;">
              <a href="${SITE_URL}/performer/dashboard" style="display: inline-block; background: #4caf50; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">📋 Перейти в личный кабинет</a>
            </div>
          </div>
        `);
      }
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders } });
    }

    // Handle verification rejected
    if (payload.type === "verification_rejected") {
      const { performerId, performerName, reason } = payload as VerificationRejectedRequest;
      
      let emailToSend: string | undefined;
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: performer } = await supabase.from('performer_profiles').select('user_id').eq('id', performerId).single();
        if (performer?.user_id) {
          const { data: authUser } = await supabase.auth.admin.getUserById(performer.user_id);
          emailToSend = authUser?.user?.email;
        }
      }

      if (emailToSend) {
        await sendEmail([emailToSend], "❌ Верификация отклонена", `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #f44336;">❌ Верификация не пройдена</h1>
            <p>Здравствуйте, ${escapeHtml(performerName)}!</p>
            <p><strong>Причина:</strong> ${escapeHtml(reason)}</p>
            <p>Вы можете обновить профиль и отправить заявку повторно.</p>
            <div style="text-align: center; margin-top: 24px;">
              <a href="${SITE_URL}/performer/profile" style="display: inline-block; background: #f44336; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">📝 Редактировать профиль</a>
            </div>
          </div>
        `);
      }
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders } });
    }

    // Handle profile activated
    if (payload.type === "profile_activated") {
      const { performerId, performerName } = payload as ProfileActivatedRequest;
      
      let emailToSend: string | undefined;
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: performer } = await supabase.from('performer_profiles').select('user_id').eq('id', performerId).single();
        if (performer?.user_id) {
          const { data: authUser } = await supabase.auth.admin.getUserById(performer.user_id);
          emailToSend = authUser?.user?.email;
        }
      }

      if (emailToSend) {
        await sendEmail([emailToSend], "🎉 Ваш профиль активирован!", `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4caf50;">🎉 Поздравляем, ${escapeHtml(performerName)}!</h1>
            <p>Ваш профиль теперь виден в каталоге и доступен для бронирования!</p>
            <div style="background: #e8f5e9; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <h3>🚀 Рекомендации для успеха:</h3>
              <ul>
                <li>Укажите дни и часы работы в расписании</li>
                <li>Добавьте больше качественных фотографий</li>
                <li>Загрузите видео-приветствие — это повышает доверие клиентов</li>
                <li>Заполните подробное описание о себе</li>
              </ul>
            </div>
            <div style="text-align: center; margin-top: 24px;">
              <a href="${SITE_URL}/performer/dashboard" style="display: inline-block; background: #4caf50; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">📋 Перейти в личный кабинет</a>
            </div>
          </div>
        `);
      }
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders } });
    }

    // Handle verification submitted to admin
    if (payload.type === "verification_submitted_admin") {
      const { performerId, performerName } = payload as VerificationSubmittedAdminRequest;
      
      await sendEmail([ADMIN_EMAIL], "🔔 Верификация: новая заявка", `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1976d2;">📋 Новая заявка на верификацию</h1>
          <p>Исполнитель <strong>${escapeHtml(performerName)}</strong> подал заявку на верификацию.</p>
          <div style="text-align: center; margin-top: 24px;">
            <a href="${SITE_URL}/admin/verification" style="display: inline-block; background: #1976d2; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">📋 Перейти к верификации</a>
          </div>
        </div>
      `);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders } });
    }

    // Handle moderation approved
    if (payload.type === "moderation_approved") {
      const { performerId, performerName } = payload as ModerationApprovedRequest;
      
      let emailToSend: string | undefined;
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: performer } = await supabase.from('performer_profiles').select('user_id').eq('id', performerId).single();
        if (performer?.user_id) {
          const { data: authUser } = await supabase.auth.admin.getUserById(performer.user_id);
          emailToSend = authUser?.user?.email;
        }
      }

      if (emailToSend) {
        await sendEmail([emailToSend], "✅ Изменения профиля одобрены!", `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4caf50;">✅ Профиль одобрен!</h1>
            <p>Здравствуйте, ${escapeHtml(performerName)}!</p>
            <p>Ваши изменения в профиле прошли модерацию. Профиль снова виден в каталоге.</p>
            <div style="text-align: center; margin-top: 24px;">
              <a href="${SITE_URL}/performer/dashboard" style="display: inline-block; background: #4caf50; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">📋 Перейти в личный кабинет</a>
            </div>
          </div>
        `);
      }
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders } });
    }

    // Handle moderation rejected
    if (payload.type === "moderation_rejected") {
      const { performerId, performerName, reason } = payload as ModerationRejectedRequest;
      
      let emailToSend: string | undefined;
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: performer } = await supabase.from('performer_profiles').select('user_id').eq('id', performerId).single();
        if (performer?.user_id) {
          const { data: authUser } = await supabase.auth.admin.getUserById(performer.user_id);
          emailToSend = authUser?.user?.email;
        }
      }

      if (emailToSend) {
        await sendEmail([emailToSend], "❌ Изменения профиля отклонены", `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #f44336;">❌ Модерация не пройдена</h1>
            <p>Здравствуйте, ${escapeHtml(performerName)}!</p>
            <p><strong>Причина:</strong> ${escapeHtml(reason)}</p>
            <p>Пожалуйста, внесите изменения и отправьте профиль повторно.</p>
            <div style="text-align: center; margin-top: 24px;">
              <a href="${SITE_URL}/performer/profile" style="display: inline-block; background: #f44336; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">📝 Редактировать профиль</a>
            </div>
          </div>
        `);
      }
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders } });
    }

    // Handle payment received notification
    if (payload.type === "payment_received") {
      const { performerEmail, performerName, customerName, bookingDate, bookingTime, amount, paymentStatus } = payload as PaymentReceivedRequest;

      if (!performerEmail) {
        console.log("No performer email provided, skipping notification");
        return new Response(JSON.stringify({ success: true, skipped: true }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const paymentStatusLabels: Record<string, string> = {
        prepayment_paid: "Предоплата получена",
        fully_paid: "Полная оплата получена",
      };

      console.log("Sending payment notification to performer:", performerEmail);

      const res = await sendEmail(
        [performerEmail],
        `💰 ${paymentStatusLabels[paymentStatus] || 'Оплата получена'}!`,
        `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2e7d32; margin-bottom: 24px;">💰 Оплата получена!</h1>
            <p style="font-size: 16px; color: #333;">Здравствуйте, <strong>${escapeHtml(performerName)}</strong>!</p>
            <p style="font-size: 16px; color: #333;">Клиент <strong>${escapeHtml(customerName)}</strong> оплатил заказ.</p>
            
            <div style="background: #e8f5e9; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <h3 style="margin-top: 0; color: #333;">💳 Детали оплаты:</h3>
              <p><strong>📅 Дата визита:</strong> ${escapeHtml(bookingDate)}</p>
              <p><strong>⏰ Время:</strong> ${escapeHtml(bookingTime)}</p>
              <p><strong>💵 Сумма:</strong> <span style="color: #2e7d32; font-weight: bold; font-size: 18px;">${amount.toLocaleString()} ₽</span></p>
              <p><strong>📋 Статус:</strong> ${escapeHtml(paymentStatusLabels[paymentStatus] || paymentStatus)}</p>
            </div>
            
            <div style="background: #e3f2fd; border-radius: 12px; padding: 16px; margin: 24px 0;">
              <p style="margin: 0; color: #1565c0;">✅ <strong>Контактные данные клиента теперь доступны</strong> в вашем личном кабинете.</p>
            </div>
            
            <div style="text-align: center; margin-top: 24px;">
              <a href="${SITE_URL}/performer/bookings" style="display: inline-block; background: #2e7d32; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">📋 Перейти к заказам</a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 24px;">Не забудьте связаться с клиентом для уточнения деталей!</p>
          </div>
        `
      );

      const data = await res.json();
      console.log("Payment notification email response:", data);

      return new Response(JSON.stringify({ success: true, data }), {
        status: res.ok ? 200 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Handle test email
    if (payload.type === "test") {
      const { email, data } = payload as TestEmailRequest;
      const testMessage = data?.testMessage || 'Это тестовое уведомление.';
      
      console.log("Sending test email to:", email);
      
      const res = await sendEmail(
        [email],
        "🧪 Тестовое уведомление — Дед-Морозы.РФ",
        `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4caf50; margin-bottom: 24px;">✅ Тест успешен!</h1>
            <p style="font-size: 16px; color: #333;">${escapeHtml(testMessage)}</p>
            <div style="background: #e8f5e9; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <p style="margin: 0; color: #2e7d32;">🎉 Email-уведомления работают корректно!</p>
              <p style="margin: 8px 0 0; color: #666; font-size: 14px;">Время отправки: ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })} (МСК)</p>
            </div>
            <p style="font-size: 14px; color: #666;">С уважением,<br>Платформа Дед-Морозы.РФ</p>
          </div>
        `
      );

      const responseData = await res.json();
      console.log("Test email response:", responseData);

      return new Response(JSON.stringify({ success: true, data: responseData }), {
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
