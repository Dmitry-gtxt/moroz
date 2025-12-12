// Referral tracking utility
// Cookie lifetime: 30 days (as per admin requirement)

import { supabase } from '@/integrations/supabase/client';

const REFERRAL_KEY = 'ref_code';
const REFERRAL_EXPIRY_KEY = 'ref_expiry';
const VISITOR_ID_KEY = 'visitor_id';
const REFERRAL_DAYS = 30;

function getOrCreateVisitorId(): string {
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
  return visitorId;
}

export function saveReferralCode(code: string): void {
  const expiry = Date.now() + REFERRAL_DAYS * 24 * 60 * 60 * 1000;
  localStorage.setItem(REFERRAL_KEY, code);
  localStorage.setItem(REFERRAL_EXPIRY_KEY, expiry.toString());
}

export function getReferralCode(): string | null {
  const code = localStorage.getItem(REFERRAL_KEY);
  const expiry = localStorage.getItem(REFERRAL_EXPIRY_KEY);
  
  if (!code || !expiry) {
    return null;
  }
  
  // Check if expired
  if (Date.now() > parseInt(expiry, 10)) {
    clearReferralCode();
    return null;
  }
  
  return code;
}

export function clearReferralCode(): void {
  localStorage.removeItem(REFERRAL_KEY);
  localStorage.removeItem(REFERRAL_EXPIRY_KEY);
}

// Track referral visit in database
async function trackReferralVisit(refCode: string): Promise<void> {
  try {
    // Find partner by referral code
    const { data: partner } = await supabase
      .from('partners')
      .select('id')
      .eq('referral_code', refCode)
      .eq('is_active', true)
      .maybeSingle();

    if (!partner) return;

    const visitorId = getOrCreateVisitorId();

    // Insert visit record
    await supabase.from('referral_visits').insert({
      partner_id: partner.id,
      visitor_id: visitorId,
      user_agent: navigator.userAgent,
      referrer_url: document.referrer || null,
      landing_page: window.location.pathname,
    });
  } catch (err) {
    console.log('Referral visit tracking skipped:', err);
  }
}

// Check URL for ref parameter and save it
export function checkAndSaveReferralFromUrl(): void {
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref');
  
  if (refCode) {
    // Only track if this is a new referral (not already saved)
    const existingCode = getReferralCode();
    if (existingCode !== refCode) {
      saveReferralCode(refCode);
      // Track the visit
      trackReferralVisit(refCode);
    }
    
    // Clean URL without reloading
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('ref');
    window.history.replaceState({}, '', newUrl.toString());
  }
}
