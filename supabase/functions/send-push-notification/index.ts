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
  type?: 'new_message' | 'new_support_message' | 'direct';
  bookingId?: string;
  senderName?: string;
  senderId?: string;
  // For support messages
  chatId?: string;
  senderType?: 'admin' | 'performer';
  performerId?: string;
}

// Base64 URL decode helper
function base64UrlDecode(str: string): Uint8Array {
  // Add padding if necessary
  const padding = '='.repeat((4 - str.length % 4) % 4);
  const base64 = (str + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Base64 URL encode helper
function base64UrlEncode(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Generate VAPID JWT token
async function generateVAPIDAuthToken(endpoint: string): Promise<string> {
  const audience = new URL(endpoint).origin;
  const expiration = Math.floor(Date.now() / 1000) + 12 * 60 * 60;
  
  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: audience,
    exp: expiration,
    sub: "mailto:ded-morozy@gtxt.biz"
  };
  
  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;
  
  // Decode the raw 32-byte private key
  const privateKeyRaw = base64UrlDecode(VAPID_PRIVATE_KEY!);
  
  console.log("Private key length:", privateKeyRaw.length);
  
  // For ECDSA P-256, the raw private key should be 32 bytes
  // We need to create a proper JWK to import
  const jwk = {
    kty: "EC",
    crv: "P-256",
    d: base64UrlEncode(privateKeyRaw),
    // We also need x and y from public key for JWK import
    // Public key is 65 bytes: 0x04 + 32 bytes x + 32 bytes y
    x: "",
    y: ""
  };
  
  // Decode public key to get x and y coordinates
  const publicKeyRaw = base64UrlDecode(VAPID_PUBLIC_KEY!);
  console.log("Public key length:", publicKeyRaw.length);
  
  if (publicKeyRaw.length === 65 && publicKeyRaw[0] === 0x04) {
    // Uncompressed public key format
    jwk.x = base64UrlEncode(publicKeyRaw.slice(1, 33));
    jwk.y = base64UrlEncode(publicKeyRaw.slice(33, 65));
  } else {
    console.error("Invalid public key format, expected uncompressed P-256 key (65 bytes starting with 0x04)");
    throw new Error("Invalid VAPID public key format");
  }
  
  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(unsignedToken)
  );
  
  // Convert DER signature to raw format (r || s, each 32 bytes)
  const signatureBytes = new Uint8Array(signature);
  let rawSignature: Uint8Array;
  
  // Web Crypto returns signature in IEEE P1363 format (r || s) for ECDSA
  // Each value is 32 bytes for P-256
  if (signatureBytes.length === 64) {
    rawSignature = signatureBytes;
  } else {
    // Fallback - shouldn't happen with Web Crypto
    rawSignature = signatureBytes;
  }
  
  const signatureB64 = base64UrlEncode(rawSignature);
  
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

  console.log(`Found ${subscriptions.length} subscriptions for user ${userId}`);

  let sent = 0;
  const failedEndpoints: string[] = [];

  for (const sub of subscriptions) {
    try {
      console.log("Sending push to endpoint:", sub.endpoint.substring(0, 50) + "...");
      
      const jwt = await generateVAPIDAuthToken(sub.endpoint);
      console.log("Generated JWT token successfully");
      
      const pushPayload = JSON.stringify(payload);
      
      const response = await fetch(sub.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "TTL": "86400",
          "Authorization": `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
        },
        body: pushPayload,
      });

      console.log("Push response status:", response.status);
      
      if (response.ok || response.status === 201) {
        sent++;
        console.log("Push sent successfully");
      } else {
        const errorText = await response.text();
        console.error("Push failed:", response.status, errorText);
        if (response.status === 404 || response.status === 410) {
          failedEndpoints.push(sub.endpoint);
        }
      }
    } catch (error) {
      console.error("Error sending push:", error);
      failedEndpoints.push(sub.endpoint);
    }
  }

  if (failedEndpoints.length > 0) {
    console.log("Removing failed endpoints:", failedEndpoints.length);
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
        from: "Дед-Морозы.РФ <noreply@ded-morozy-rf.ru>",
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

    // Handle new support message notification
    if (payload.type === 'new_support_message' && payload.chatId && payload.senderType) {
      console.log("Processing new support message notification for chat:", payload.chatId);

      // Get support chat to find performer
      const { data: supportChat, error: chatError } = await supabaseAdmin
        .from("support_chats")
        .select(`
          id,
          performer_id,
          performer_profiles!support_chats_performer_id_fkey (
            user_id,
            display_name
          )
        `)
        .eq("id", payload.chatId)
        .single();

      if (chatError || !supportChat) {
        console.error("Support chat not found:", chatError);
        return new Response(JSON.stringify({ error: "Chat not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const performer = supportChat.performer_profiles as any;

      if (payload.senderType === 'admin') {
        // Admin sent message -> notify performer
        const recipientUserId = performer?.user_id;
        if (recipientUserId) {
          const notificationPayload = {
            title: "Сообщение от поддержки",
            body: "Вам пришло новое сообщение от службы поддержки",
            icon: "/favicon.png",
            url: `/messages?chat=${payload.chatId}&type=support`,
            tag: `support-${payload.chatId}`
          };

          const sent = await sendPushToUser(supabaseAdmin, recipientUserId, notificationPayload);
          console.log(`Sent push to performer ${recipientUserId}: ${sent}`);
        }
      } else if (payload.senderType === 'performer') {
        // Performer sent message -> notify all admins
        const { data: adminRoles } = await supabaseAdmin
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin");

        const adminUserIds = adminRoles?.map(r => r.user_id) || [];
        console.log(`Notifying ${adminUserIds.length} admins about new support message`);

        for (const adminUserId of adminUserIds) {
          const notificationPayload = {
            title: "Новое сообщение в поддержку",
            body: `${performer?.display_name || 'Исполнитель'} написал в поддержку`,
            icon: "/favicon.png",
            url: `/admin/messages?chat=${payload.chatId}`,
            tag: `support-${payload.chatId}`
          };

          await sendPushToUser(supabaseAdmin, adminUserId, notificationPayload);
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Handle new message notification (booking chat)
    if (payload.type === 'new_message' && payload.bookingId && payload.senderId) {
      console.log("Processing new message notification for booking:", payload.bookingId);

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
        url: `/messages?chat=${payload.bookingId}&type=booking`,
        tag: `message-${payload.bookingId}`
      };

      const sent = await sendPushToUser(supabaseAdmin, recipientUserId, notificationPayload);

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
              <a href="https://ded-morozy-rf.ru/messages?chat=${booking.id}&type=booking" 
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

    // Direct notification
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
