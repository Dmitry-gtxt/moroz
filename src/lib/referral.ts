// Referral tracking utility
// Cookie lifetime: 30 days (as per admin requirement)

const REFERRAL_KEY = 'ref_code';
const REFERRAL_EXPIRY_KEY = 'ref_expiry';
const REFERRAL_DAYS = 30;

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

// Check URL for ref parameter and save it
export function checkAndSaveReferralFromUrl(): void {
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref');
  
  if (refCode) {
    saveReferralCode(refCode);
    // Clean URL without reloading
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('ref');
    window.history.replaceState({}, '', newUrl.toString());
  }
}
