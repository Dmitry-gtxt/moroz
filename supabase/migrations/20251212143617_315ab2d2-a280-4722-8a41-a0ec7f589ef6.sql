-- Create table for tracking referral visits
CREATE TABLE public.referral_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  visitor_id text NOT NULL, -- anonymous visitor identifier (from localStorage)
  user_agent text,
  referrer_url text,
  landing_page text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_visits ENABLE ROW LEVEL SECURITY;

-- Public can insert visits (for tracking)
CREATE POLICY "Anyone can insert visits"
ON public.referral_visits
FOR INSERT
WITH CHECK (true);

-- Admins and public read for partner stats
CREATE POLICY "Public can read referral_visits"
ON public.referral_visits
FOR SELECT
USING (true);

-- Index for faster lookups
CREATE INDEX idx_referral_visits_partner_id ON public.referral_visits(partner_id);
CREATE INDEX idx_referral_visits_created_at ON public.referral_visits(created_at);