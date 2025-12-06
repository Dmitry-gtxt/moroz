import { supabase } from '@/integrations/supabase/client';

interface BookingNotification {
  type: 'new_booking';
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

interface ReviewNotification {
  type: 'new_review';
  performerEmail: string;
  performerName: string;
  customerName: string;
  rating: number;
  reviewText?: string;
}

interface ProfilePendingVerificationNotification {
  type: 'profile_pending_verification';
  performerId: string;
  performerName: string;
  performerEmail?: string;
  changedFields?: string[];
}

interface ProfileUnpublishedAdminNotification {
  type: 'profile_unpublished_admin';
  performerId: string;
  performerName: string;
  changedFields?: string[];
}

type NotificationPayload = 
  | BookingNotification 
  | ReviewNotification 
  | ProfilePendingVerificationNotification
  | ProfileUnpublishedAdminNotification;

export async function sendNotificationEmail(payload: NotificationPayload): Promise<void> {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification-email', {
      body: payload,
    });

    if (error) {
      console.error('Failed to send notification email:', error);
    } else {
      console.log('Notification email sent:', data);
    }
  } catch (err) {
    console.error('Error sending notification email:', err);
  }
}

export async function sendBookingNotification(params: {
  bookingId: string;
  performerId: string;
  customerName: string;
  customerPhone: string;
  bookingDate: string;
  bookingTime: string;
  address: string;
  eventType: string;
  priceTotal: number;
}): Promise<void> {
  // Fetch performer profile to get email and name
  const { data: performer } = await supabase
    .from('performer_profiles')
    .select('display_name, user_id')
    .eq('id', params.performerId)
    .maybeSingle();

  if (!performer) {
    console.error('Performer not found for notification');
    return;
  }

  // Fetch user email from profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('user_id', performer.user_id)
    .maybeSingle();

  // Get email from auth user - we'll use the user_id to construct the notification
  // Since we can't access auth.users directly, we'll need the performer to have their email in their profile
  // For now, let's try to get it from the booking customer relationship
  
  // Alternative: send to the performer dashboard instead of email if no email available
  console.log('Sending booking notification for performer:', performer.display_name);

  // We need performer's email - let's add this to the edge function call
  // The edge function will need to handle cases where email might not be available
  await sendNotificationEmail({
    type: 'new_booking',
    bookingId: params.bookingId,
    performerEmail: '', // Will be fetched server-side in future
    performerName: performer.display_name,
    customerName: params.customerName,
    customerPhone: params.customerPhone,
    bookingDate: params.bookingDate,
    bookingTime: params.bookingTime,
    address: params.address,
    eventType: params.eventType,
    priceTotal: params.priceTotal,
  });
}

export async function sendReviewNotification(params: {
  performerId: string;
  customerName: string;
  rating: number;
  reviewText?: string;
}): Promise<void> {
  // Fetch performer profile
  const { data: performer } = await supabase
    .from('performer_profiles')
    .select('display_name, user_id')
    .eq('id', params.performerId)
    .maybeSingle();

  if (!performer) {
    console.error('Performer not found for notification');
    return;
  }

  // For demo purposes, we'll log the notification
  // In production, you'd need to store performer email in their profile
  console.log('Sending review notification for performer:', performer.display_name);

  await sendNotificationEmail({
    type: 'new_review',
    performerEmail: '', // Would need performer's email stored somewhere accessible
    performerName: performer.display_name,
    customerName: params.customerName,
    rating: params.rating,
    reviewText: params.reviewText,
  });
}

export async function sendProfileVerificationNotification(params: {
  performerId: string;
  performerName: string;
  changedFields?: string[];
}): Promise<void> {
  console.log('Sending profile verification notifications for performer:', params.performerName);

  // Send notification to performer
  await sendNotificationEmail({
    type: 'profile_pending_verification',
    performerId: params.performerId,
    performerName: params.performerName,
    changedFields: params.changedFields,
  });

  // Send notification to admin
  await sendNotificationEmail({
    type: 'profile_unpublished_admin',
    performerId: params.performerId,
    performerName: params.performerName,
    changedFields: params.changedFields,
  });
}
