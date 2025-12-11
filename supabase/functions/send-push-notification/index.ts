import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushNotificationRequest {
  userId?: string;
  title?: string;
  body?: string;
  icon?: string;
  url?: string;
  tag?: string;
  // For new message notifications
  type?: 'new_message' | 'direct';
  bookingId?: string;
  senderName?: string;
  senderId?: string;
}

// Web Push implementation using Web Crypto API
async function generateVAPIDAuthToken(endpoint: string): Promise<string> {
  const audience = new URL(endpoint).origin;
  const expiration = Math.floor(Date.now() / 1000) + 12 * 60 * 60;
  
  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: audience,
    exp: expiration,
    sub: "mailto:ded-morozy@gtxt.biz"
  };
  
  const base64UrlEncode = (data: ArrayBuffer | Uint8Array | string): string => {
    let bytes: Uint8Array;
    if (typeof data === 'string') {
      bytes = new TextEncoder().encode(data);
    } else if (data instanceof ArrayBuffer) {
      bytes = new Uint8Array(data);
    } else {
      bytes = data;
    }
    
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${headerB64}.${payloadB64}`;
  
  const privateKeyRaw = Uint8Array.from(atob(VAPID_PRIVATE_KEY!.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  
  const key = await crypto.subtle.importKey(
    "raw",
    privateKeyRaw,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(unsignedToken)
  );
  
  const signatureB64 = base64UrlEncode(new Uint8Array(signature));
  
  return `${unsignedToken}.${signatureB64}`;
}

async function sendPushToUser(
  supabaseAdmin: any,
  userId: string,
  payload: { title: string; body: string; icon?: string; url?: string; tag?: string }
): Promise<number> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.log("VAPID keys not configured, skipping push notification");
    return 0;
  }

  const { data: subscriptions, error } = await supabaseAdmin
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId);

  if (error || !subscriptions?.length) {
    console.log("No push subscriptions for user:", userId);
    return 0;
  }

  let sent = 0;
  const failedEndpoints: string[] = [];

  for (const sub of subscriptions) {
    try {
      const jwt = await generateVAPIDAuthToken(sub.endpoint);
      
      const response = await fetch(sub.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Encoding": "aes128gcm",
          "TTL": "86400",
          "Authorization": `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        sent++;
      } else {
        console.error("Push failed:", response.status);
        failedEndpoints.push(sub.endpoint);
      }
    } catch (error) {
      console.error("Error sending push:", error);
      failedEndpoints.push(sub.endpoint);
    }
  }

  if (failedEndpoints.length > 0) {
    await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId)
      .in("endpoint", failedEndpoints);
  }

  return sent;
}

async function sendEmailNotification(
  email: string,
  subject: string,
  htmlContent: string
): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log("RESEND_API_KEY not configured, skipping email");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Дед-Морозы.РФ <noreply@moroz.lovable.app>",
        to: [email],
        subject,
        html: htmlContent,
      }),
    });
    
    if (!response.ok) {
      console.error("Email send failed:", await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Received push notification request");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const payload: PushNotificationRequest = await req.json();

    // Handle new message notification
    if (payload.type === 'new_message' && payload.bookingId && payload.senderId) {
      console.log("Processing new message notification for booking:", payload.bookingId);

      // Get booking details
      const { data: booking, error: bookingError } = await supabaseAdmin
        .from("bookings")
        .select(`
          id,
          customer_id,
          customer_name,
          customer_email,
          performer_id,
          performer_profiles!bookings_performer_id_fkey (
            user_id,
            display_name
          )
        `)
        .eq("id", payload.bookingId)
        .single();

      if (bookingError || !booking) {
        console.error("Booking not found:", bookingError);
        return new Response(JSON.stringify({ error: "Booking not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const performer = booking.performer_profiles as any;
      const isFromCustomer = payload.senderId === booking.customer_id;
      
      // Determine recipient
      const recipientUserId = isFromCustomer ? performer?.user_id : booking.customer_id;
      const senderName = isFromCustomer ? booking.customer_name : performer?.display_name;

      if (!recipientUserId) {
        console.log("No recipient user id found");
        return new Response(JSON.stringify({ success: true, sent: 0 }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const notificationPayload = {
        title: "Новое сообщение",
        body: `${senderName || "Пользователь"}: Новое сообщение в чате заказа`,
        icon: "/favicon.png",
        url: `/messages?booking=${payload.bookingId}`,
        tag: `message-${payload.bookingId}`
      };

      // Send push notification
      const sent = await sendPushToUser(supabaseAdmin, recipientUserId, notificationPayload);

      // Send email notification to customer if message is from performer
      if (!isFromCustomer && booking.customer_email) {
        await sendEmailNotification(
          booking.customer_email,
          "Новое сообщение от исполнителя",
          `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a2e;">🎅 Новое сообщение</h2>
            <p>Здравствуйте, ${booking.customer_name}!</p>
            <p>Вы получили новое сообщение от <strong>${performer?.display_name || 'исполнителя'}</strong>.</p>
            <p style="margin-top: 20px;">
              <a href="https://moroz.lovable.app/messages?booking=${booking.id}" 
                 style="background-color: #1a1a2e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
                Перейти к диалогу
              </a>
            </p>
            <p style="color: #666; margin-top: 30px; font-size: 14px;">
              С наилучшими пожеланиями,<br>
              Команда Дед-Морозы.РФ
            </p>
          </div>
          `
        );
      }

      return new Response(JSON.stringify({ success: true, sent }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Direct notification (existing behavior)
    const { userId, title, body, icon, url, tag } = payload;

    if (!userId || !title || !body) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Sending direct push notification to user:", userId);

    const sent = await sendPushToUser(supabaseAdmin, userId, {
      title,
      body,
      icon: icon || "/favicon.png",
      url,
      tag
    });

    return new Response(JSON.stringify({ success: true, sent }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-push-notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);