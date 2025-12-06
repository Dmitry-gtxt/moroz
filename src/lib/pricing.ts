/**
 * Pricing utilities for the platform
 * 
 * Pricing policy:
 * - Performers set their base price (what they receive)
 * - Customers see price + 40% markup
 * - Customer pays 40% of performer's price as prepayment (which is platform commission)
 * - Remaining 100% is paid directly to performer in cash after the event
 * 
 * Example:
 * - Performer price: 5000 сом
 * - Customer sees: 7000 сом (5000 * 1.4)
 * - Prepayment: 2000 сом (5000 * 0.4) - goes to platform
 * - Cash to performer: 5000 сом
 */

export const PLATFORM_MARKUP = 0.4; // 40%

/**
 * Calculate the price shown to customers (with platform markup)
 */
export function getCustomerPrice(performerPrice: number): number {
  return Math.round(performerPrice * (1 + PLATFORM_MARKUP));
}

/**
 * Calculate the prepayment amount (platform commission)
 */
export function getPrepaymentAmount(performerPrice: number): number {
  return Math.round(performerPrice * PLATFORM_MARKUP);
}

/**
 * Calculate what the performer receives (in cash after event)
 */
export function getPerformerPayment(performerPrice: number): number {
  return performerPrice;
}

/**
 * Get all pricing details for a booking
 */
export function getBookingPricing(performerPrice: number) {
  return {
    customerPrice: getCustomerPrice(performerPrice),
    prepayment: getPrepaymentAmount(performerPrice),
    performerPayment: getPerformerPayment(performerPrice),
    performerPrice,
  };
}