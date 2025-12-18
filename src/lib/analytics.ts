// DataLayer events for GTM/analytics tracking

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

// Initialize dataLayer if not exists
if (typeof window !== 'undefined' && !window.dataLayer) {
  window.dataLayer = [];
}

export function pushEvent(eventName: string, data?: Record<string, unknown>) {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      ...data,
    });
    console.log('[Analytics] Event pushed:', eventName, data);
  }
}

// Registration event - after successful 2FA verification
export function trackRegistration(userId?: string) {
  pushEvent('registration', { user_id: userId });
}

// Booking event - after clicking "Send request" button
export function trackBooking(bookingData?: {
  performer_id?: string;
  price?: number;
  event_type?: string;
}) {
  pushEvent('booking', bookingData);
}

// Payment event - when prepayment is made
export function trackPayment(paymentData?: {
  booking_id?: string;
  amount?: number;
}) {
  pushEvent('payment', paymentData);
}

// Confirmation event - when performer confirms booking
export function trackConfirmation(confirmationData?: {
  booking_id?: string;
  performer_id?: string;
}) {
  pushEvent('confirmation', confirmationData);
}
