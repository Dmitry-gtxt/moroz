import { supabase } from '@/integrations/supabase/client';

type SmsNotificationType = 
  | 'new_booking_to_performer'      // Template 80
  | 'booking_rejected_to_customer'  // Template 81
  | 'slot_proposal_to_customer'     // Template 82
  | 'booking_confirmed_to_customer'; // Template 83

interface SmsNotificationParams {
  type: SmsNotificationType;
  phone?: string;
  userId?: string; // Fallback: if phone is empty, lookup by userId
  bookingId?: string;
  performerName?: string;
  customerName?: string;
  bookingDate?: string;
  bookingTime?: string;
}

/**
 * Send SMS notification via Notificore 2FA API
 * Priority notification channel for booking events
 */
export async function sendSmsNotification(params: SmsNotificationParams): Promise<boolean> {
  try {
    console.log(`[SMS] Sending ${params.type} to ${params.phone}`);
    
    const { data, error } = await supabase.functions.invoke('send-sms-notification', {
      body: params,
    });

    if (error) {
      console.error('[SMS] Failed to send notification:', error);
      return false;
    }

    if (data?.success) {
      console.log('[SMS] Notification sent successfully:', data.messageId);
      return true;
    } else {
      console.error('[SMS] Notification failed:', data?.error);
      return false;
    }
  } catch (err) {
    console.error('[SMS] Error sending notification:', err);
    return false;
  }
}

/**
 * Send SMS to performer when new booking is created
 * Template 80
 */
export async function smsNewBookingToPerformer(params: {
  performerPhone: string;
  bookingId: string;
  customerName: string;
  bookingDate: string;
  bookingTime: string;
}): Promise<boolean> {
  return sendSmsNotification({
    type: 'new_booking_to_performer',
    phone: params.performerPhone,
    bookingId: params.bookingId,
    customerName: params.customerName,
    bookingDate: params.bookingDate,
    bookingTime: params.bookingTime,
  });
}

/**
 * Send SMS to customer when performer rejects booking
 * Template 81
 */
export async function smsBookingRejectedToCustomer(params: {
  customerPhone?: string;
  customerId?: string; // Fallback if phone not available
  bookingId: string;
  performerName: string;
  bookingDate: string;
  bookingTime: string;
}): Promise<boolean> {
  return sendSmsNotification({
    type: 'booking_rejected_to_customer',
    phone: params.customerPhone,
    userId: params.customerId,
    bookingId: params.bookingId,
    performerName: params.performerName,
    bookingDate: params.bookingDate,
    bookingTime: params.bookingTime,
  });
}

/**
 * Send SMS to customer when performer proposes alternative slots
 * Template 82
 */
export async function smsSlotProposalToCustomer(params: {
  customerPhone?: string;
  customerId?: string; // Fallback if phone not available
  bookingId: string;
  performerName: string;
  bookingDate: string;
  bookingTime: string;
}): Promise<boolean> {
  return sendSmsNotification({
    type: 'slot_proposal_to_customer',
    phone: params.customerPhone,
    userId: params.customerId,
    bookingId: params.bookingId,
    performerName: params.performerName,
    bookingDate: params.bookingDate,
    bookingTime: params.bookingTime,
  });
}

/**
 * Send SMS to customer when performer confirms booking time
 * Template 83
 */
export async function smsBookingConfirmedToCustomer(params: {
  customerPhone?: string;
  customerId?: string; // Fallback if phone not available
  bookingId: string;
  performerName: string;
  bookingDate: string;
  bookingTime: string;
}): Promise<boolean> {
  return sendSmsNotification({
    type: 'booking_confirmed_to_customer',
    phone: params.customerPhone,
    userId: params.customerId,
    bookingId: params.bookingId,
    performerName: params.performerName,
    bookingDate: params.bookingDate,
    bookingTime: params.bookingTime,
  });
}
