/**
 * Pricing utilities for the platform
 * 
 * Pricing policy:
 * - Performers set their base price for 30 min (what they receive)
 * - Customers see price + X% markup (configurable via platform settings)
 * - Customer pays X% of performer's price as prepayment (platform commission)
 * - Remaining 100% is paid directly to performer in cash after the event
 * 
 * Example with 40% commission:
 * - Performer price: 5000 ₽
 * - Customer sees: 7000 ₽ (5000 * 1.4)
 * - Prepayment: 2000 ₽ (5000 * 0.4) - goes to platform
 * - Cash to performer: 5000 ₽
 */

import { supabase } from '@/integrations/supabase/client';

// Default markup percentage (can be overridden by platform settings)
let CACHED_COMMISSION_RATE: number | null = null;
const DEFAULT_COMMISSION_RATE = 40; // 40%

/**
 * Fetch the commission rate from platform settings
 */
export async function getCommissionRate(): Promise<number> {
  if (CACHED_COMMISSION_RATE !== null) {
    return CACHED_COMMISSION_RATE;
  }

  try {
    const { data, error } = await supabase
      .from('platform_settings')
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
 * Get the markup as a decimal (e.g., 40% = 0.4)
 */
export function getMarkupDecimal(commissionRate: number): number {
  return commissionRate / 100;
}

/**
 * Calculate prepayment percentage for display to customers
 * Formula: x / (x + 100) where x is commission rate
 * Example: 40% commission → 40/(40+100) = 28.57% ≈ 29%
 */
export function getPrepaymentPercentage(commissionRate: number): number {
  if (commissionRate <= 0) return 0;
  return Math.round((commissionRate / (commissionRate + 100)) * 100);
}

/**
 * Calculate the price shown to customers (with platform markup)
 */
export function getCustomerPrice(performerPrice: number, commissionRate: number = DEFAULT_COMMISSION_RATE): number {
  return Math.round(performerPrice * (1 + getMarkupDecimal(commissionRate)));
}

/**
 * Calculate the prepayment amount (platform commission)
 */
export function getPrepaymentAmount(performerPrice: number, commissionRate: number = DEFAULT_COMMISSION_RATE): number {
  return Math.round(performerPrice * getMarkupDecimal(commissionRate));
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
export function getBookingPricing(performerPrice: number, commissionRate: number = DEFAULT_COMMISSION_RATE) {
  return {
    customerPrice: getCustomerPrice(performerPrice, commissionRate),
    prepayment: getPrepaymentAmount(performerPrice, commissionRate),
    performerPayment: getPerformerPayment(performerPrice),
    performerPrice,
    commissionRate,
  };
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return `${price.toLocaleString()} ₽`;
}
