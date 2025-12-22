import { supabase } from '@/integrations/supabase/client';

interface SendPushParams {
  userId: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

export async function sendPushNotification(params: SendPushParams): Promise<void> {
  try {
    await supabase.functions.invoke('send-push-notification', {
      body: params
    });
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
}

// Auto-subscribe to push notifications after registration
export async function autoSubscribeToPush(userId: string): Promise<boolean> {
  // Check if push is supported
  if (!('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window)) {
    console.log('Push notifications not supported');
    return false;
  }

  try {
    // Fetch VAPID key
    const { data, error: vapidError } = await supabase.functions.invoke('get-vapid-key');
    if (vapidError || !data?.publicKey) {
      console.error('Failed to get VAPID key:', vapidError);
      return false;
    }
    const vapidKey = data.publicKey;

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return false;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey)
    });

    const subscriptionJson = subscription.toJSON();

    // Save to database
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint: subscriptionJson.endpoint!,
        p256dh: subscriptionJson.keys!.p256dh,
        auth: subscriptionJson.keys!.auth
      }, {
        onConflict: 'user_id,endpoint'
      });

    if (error) {
      console.error('Error saving push subscription:', error);
      return false;
    }

    console.log('Auto-subscribed to push notifications');
    return true;
  } catch (error) {
    console.error('Auto push subscription failed:', error);
    return false;
  }
}

// Schedule booking reminders when booking is confirmed and paid
export async function scheduleBookingReminders(bookingId: string, bookingDate: string, bookingTime: string, customerId: string, performerId: string): Promise<void> {
  try {
    // Parse booking datetime
    const [hours, minutes] = bookingTime.split(':').map(Number);
    const bookingDateTime = new Date(bookingDate);
    bookingDateTime.setHours(hours || 12, minutes || 0, 0, 0);

    // Get performer user_id
    const { data: performer } = await supabase
      .from('performer_profiles')
      .select('user_id')
      .eq('id', performerId)
      .single();

    const notifications = [
      {
        notification_type: 'reminder_3_days',
        scheduled_for: new Date(bookingDateTime.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        notification_type: 'reminder_1_day',
        scheduled_for: new Date(bookingDateTime.getTime() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        notification_type: 'reminder_5_hours',
        scheduled_for: new Date(bookingDateTime.getTime() - 5 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Schedule for customer
    for (const notif of notifications) {
      // Skip if scheduled time is in the past
      if (new Date(notif.scheduled_for) <= new Date()) continue;

      await supabase.from('notification_queue').insert({
        user_id: customerId,
        booking_id: bookingId,
        notification_type: notif.notification_type,
        scheduled_for: notif.scheduled_for
      });
    }

    // Schedule for performer
    if (performer?.user_id) {
      for (const notif of notifications) {
        if (new Date(notif.scheduled_for) <= new Date()) continue;

        await supabase.from('notification_queue').insert({
          user_id: performer.user_id,
          booking_id: bookingId,
          notification_type: `performer_${notif.notification_type}`,
          scheduled_for: notif.scheduled_for
        });
      }
    }

    console.log('Scheduled booking reminders for booking:', bookingId);
  } catch (error) {
    console.error('Failed to schedule reminders:', error);
  }
}

// Send notification for new chat message
export async function notifyNewChatMessage(
  recipientUserId: string,
  senderName: string,
  messagePreview: string
): Promise<void> {
  await sendPushNotification({
    userId: recipientUserId,
    title: `💬 Новое сообщение от ${senderName}`,
    body: messagePreview.length > 100 ? messagePreview.substring(0, 100) + '...' : messagePreview,
    url: '/customer/bookings',
    tag: `chat-${recipientUserId}`
  });
}

// Send notification for verification status change
export async function notifyVerificationStatusChange(
  performerUserId: string,
  status: 'verified' | 'rejected' | 'pending',
  reason?: string
): Promise<void> {
  let title = '';
  let body = '';

  switch (status) {
    case 'verified':
      title = '✅ Профиль верифицирован!';
      body = 'Ваш профиль прошёл проверку и теперь виден клиентам.';
      break;
    case 'rejected':
      title = '❌ Профиль отклонён';
      body = reason || 'Ваш профиль не прошёл проверку. Проверьте комментарии в личном кабинете.';
      break;
    case 'pending':
      title = '⏳ Профиль на проверке';
      body = 'Ваш профиль отправлен на проверку. Ожидайте результата.';
      break;
  }

  await sendPushNotification({
    userId: performerUserId,
    title,
    body,
    url: '/performer/profile',
    tag: 'verification-status'
  });
}

// Send notification for profile publication change
export async function notifyPublicationStatusChange(
  performerUserId: string,
  isActive: boolean,
  reason?: string
): Promise<void> {
  await sendPushNotification({
    userId: performerUserId,
    title: isActive ? '🎉 Профиль опубликован!' : '📝 Профиль снят с публикации',
    body: isActive 
      ? 'Ваш профиль теперь виден клиентам в каталоге.' 
      : reason || 'Ваш профиль временно снят с публикации.',
    url: '/performer/profile',
    tag: 'publication-status'
  });
}

// Send notification for new booking request
export async function notifyNewBookingRequest(
  performerUserId: string,
  customerName: string,
  bookingDate: string,
  bookingTime: string
): Promise<void> {
  await sendPushNotification({
    userId: performerUserId,
    title: '🎄 Новая заявка!',
    body: `${customerName} хочет заказать вас на ${bookingDate} в ${bookingTime}`,
    url: '/performer/bookings',
    tag: 'new-booking'
  });
}

// Send notification when booking is confirmed
export async function notifyBookingConfirmed(
  customerUserId: string,
  performerName: string,
  bookingDate: string,
  bookingTime: string
): Promise<void> {
  await sendPushNotification({
    userId: customerUserId,
    title: '✅ Заявка подтверждена!',
    body: `${performerName} подтвердил визит на ${bookingDate} в ${bookingTime}`,
    url: '/cabinet/bookings',
    tag: 'booking-confirmed'
  });
}

// Send notification to remind customer to pay
export async function notifyPaymentRequired(
  customerUserId: string,
  performerName: string,
  bookingDate: string,
  prepaymentAmount: number
): Promise<void> {
  await sendPushNotification({
    userId: customerUserId,
    title: '💳 Оплатите бронирование',
    body: `Внесите предоплату ${prepaymentAmount.toLocaleString()} ₽ за визит ${performerName} на ${bookingDate}`,
    url: '/cabinet/payment',
    tag: 'payment-required'
  });
}

// Schedule payment reminder 1 hour before deadline
export async function schedulePaymentReminder(
  bookingId: string,
  customerId: string,
  paymentDeadline: string,
  performerName: string,
  prepaymentAmount: number
): Promise<void> {
  try {
    const deadline = new Date(paymentDeadline);
    const reminder1Hour = new Date(deadline.getTime() - 60 * 60 * 1000); // 1 hour before
    const reminder10Min = new Date(deadline.getTime() - 10 * 60 * 1000); // 10 minutes before

    const now = new Date();

    // Schedule 1 hour reminder if not in the past
    if (reminder1Hour > now) {
      await supabase.from('notification_queue').insert({
        user_id: customerId,
        booking_id: bookingId,
        notification_type: 'payment_reminder_1_hour',
        scheduled_for: reminder1Hour.toISOString()
      });
      console.log('Scheduled 1-hour payment reminder for booking:', bookingId);
    }

    // Schedule 10 minute reminder if not in the past
    if (reminder10Min > now) {
      await supabase.from('notification_queue').insert({
        user_id: customerId,
        booking_id: bookingId,
        notification_type: 'payment_reminder_10_min',
        scheduled_for: reminder10Min.toISOString()
      });
      console.log('Scheduled 10-min payment reminder for booking:', bookingId);
    }

    // Schedule auto-cancellation check at deadline
    await supabase.from('notification_queue').insert({
      user_id: customerId,
      booking_id: bookingId,
      notification_type: 'payment_deadline_expired',
      scheduled_for: deadline.toISOString()
    });
    console.log('Scheduled payment deadline check for booking:', bookingId);

  } catch (error) {
    console.error('Failed to schedule payment reminders:', error);
  }
}

// Send notification when booking is rejected
export async function notifyBookingRejected(
  customerUserId: string,
  performerName: string,
  bookingDate: string
): Promise<void> {
  await sendPushNotification({
    userId: customerUserId,
    title: '❌ Заявка отклонена',
    body: `${performerName} не может принять заказ на ${bookingDate}`,
    url: '/customer/bookings',
    tag: 'booking-rejected'
  });
}

// Send notification when booking is cancelled
export async function notifyBookingCancelled(
  recipientUserId: string,
  cancellerName: string,
  bookingDate: string,
  cancelledBy: 'customer' | 'performer' | 'admin'
): Promise<void> {
  const url = cancelledBy === 'customer' ? '/performer/bookings' : '/customer/bookings';
  await sendPushNotification({
    userId: recipientUserId,
    title: '😔 Бронирование отменено',
    body: cancelledBy === 'admin' 
      ? `Администратор отменил заказ на ${bookingDate}` 
      : `${cancellerName} отменил заказ на ${bookingDate}`,
    url,
    tag: 'booking-cancelled'
  });
}

// Send notification when payment is received
export async function notifyPaymentReceived(
  performerUserId: string,
  customerName: string,
  bookingDate: string,
  amount: number
): Promise<void> {
  await sendPushNotification({
    userId: performerUserId,
    title: '💰 Оплата получена!',
    body: `${customerName} оплатил заказ на ${bookingDate}. Сумма: ${amount.toLocaleString()} ₽`,
    url: '/performer/bookings',
    tag: 'payment-received'
  });
}

// Send welcome notification
export async function notifyWelcome(userId: string, userName: string): Promise<void> {
  await sendPushNotification({
    userId,
    title: '🎅 Добро пожаловать!',
    body: `${userName}, добро пожаловать на платформу Дед-Морозы.РФ!`,
    url: '/',
    tag: 'welcome'
  });
}

// Notify admin when performer edits profile and needs moderation
export async function notifyAdminProfileEdited(
  adminUserId: string,
  performerName: string
): Promise<void> {
  await sendPushNotification({
    userId: adminUserId,
    title: '🔔 Профиль изменён',
    body: `${performerName} обновил профиль. Требуется модерация.`,
    url: '/admin/moderation',
    tag: 'moderation-needed'
  });
}

// Notify admin when booking is cancelled
export async function notifyAdminBookingCancelled(
  customerName: string,
  performerName: string,
  bookingDate: string,
  cancelledBy: 'customer' | 'performer',
  reason?: string
): Promise<void> {
  // Get admin user ids
  const { data: admins } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin');

  if (!admins?.length) return;

  for (const admin of admins) {
    await sendPushNotification({
      userId: admin.user_id,
      title: '❌ Заказ отменён',
      body: `${cancelledBy === 'customer' ? customerName : performerName} отменил заказ на ${bookingDate}. ${reason ? `Причина: ${reason}` : ''}`,
      url: '/admin/booking-history',
      tag: 'admin-booking-cancelled'
    });
  }
}
