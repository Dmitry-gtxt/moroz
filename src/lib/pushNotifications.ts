import { supabase } from '@/integrations/supabase/client';

interface SendPushParams {
  userId: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
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
    url: '/customer/bookings',
    tag: 'booking-confirmed'
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
