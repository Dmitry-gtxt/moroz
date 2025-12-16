/**
 * Pricing utilities for the platform
 * 
 * NEW Pricing policy:
 * - Performers set their minimum price (what customer pays)
 * - Platform commission is deducted from performer's price
 * - Performer receives: price - (price * commission%)
 * - Customer prepayment = commission% of the price
 * 
 * Example with 20% commission:
 * - Performer sets price: 5000 ₽ (customer pays this)
 * - Platform commission/prepayment: 1000 ₽ (5000 * 0.2)
 * - Performer receives "на руки": 4000 ₽ (5000 - 1000)
 */

import { supabase } from '@/integrations/supabase/client';

// Default commission percentage (can be overridden by platform settings)
let CACHED_COMMISSION_RATE: number | null = null;
const DEFAULT_COMMISSION_RATE = 20; // 20%

/**
 * Fetch the commission rate from platform settings
 */
export async function getCommissionRate(): Promise<number> {
  if (CACHED_COMMISSION_RATE !== null) {
    return CACHED_COMMISSION_RATE;
  }

  try {
    // Use public_platform_settings view for anonymous access
    const { data, error } = await supabase
      .from('public_platform_settings')
      .select('value')
      .eq('key', 'commission_rate')
      .maybeSingle();

    if (error || !data) {
      return DEFAULT_COMMISSION_RATE;
    }

    CACHED_COMMISSION_RATE = parseInt(data.value, 10) || DEFAULT_COMMISSION_RATE;
    return CACHED_COMMISSION_RATE;
  } catch {
    return DEFAULT_COMMISSION_RATE;
  }
}

/**
 * Clear cached commission rate (call when settings are updated)
 */
export function clearCommissionCache(): void {
  CACHED_COMMISSION_RATE = null;
}

/**
 * Get the commission as a decimal (e.g., 20% = 0.2)
 */
export function getCommissionDecimal(commissionRate: number): number {
  return commissionRate / 100;
}

/**
 * The prepayment percentage equals the commission percentage
 * Customer pays commission% upfront as prepayment
 */
export function getPrepaymentPercentage(commissionRate: number): number {
  return commissionRate;
}

/**
 * Calculate what the performer receives "на руки" (after commission)
 * Price is what customer pays, performer gets: price - commission
 */
export function getPerformerNetAmount(customerPrice: number, commissionRate: number = DEFAULT_COMMISSION_RATE): number {
  return Math.round(customerPrice * (1 - getCommissionDecimal(commissionRate)));
}

/**
 * Calculate the prepayment amount (= platform commission)
 */
export function getPrepaymentAmount(customerPrice: number, commissionRate: number = DEFAULT_COMMISSION_RATE): number {
  return Math.round(customerPrice * getCommissionDecimal(commissionRate));
}

/**
 * LEGACY: This now returns the same price (no markup added)
 * Customer pays the price set by performer directly
 */
export function getCustomerPrice(performerPrice: number, commissionRate: number = DEFAULT_COMMISSION_RATE): number {
  // Price is now what customer pays directly
  return performerPrice;
}

/**
 * LEGACY: What the performer receives (now equals net amount after commission)
 */
export function getPerformerPayment(performerPrice: number, commissionRate: number = DEFAULT_COMMISSION_RATE): number {
  return getPerformerNetAmount(performerPrice, commissionRate);
}

/**
 * Get all pricing details for a booking
 */
export function getBookingPricing(price: number, commissionRate: number = DEFAULT_COMMISSION_RATE) {
  return {
    customerPrice: price, // What customer pays
    prepayment: getPrepaymentAmount(price, commissionRate), // Commission = prepayment
    performerPayment: getPerformerNetAmount(price, commissionRate), // What performer gets "на руки"
    performerPrice: price,
    commissionRate,
  };
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return `${price.toLocaleString()} ₽`;
}
