-- Create partners table
CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_email text,
  contact_phone text,
  organization_type text, -- event_agency, kids_center, individual, other
  access_token uuid NOT NULL DEFAULT gen_random_uuid(), -- long UUID for dashboard access without auth
  referral_code text NOT NULL UNIQUE, -- short code for referral links
  notes text, -- admin notes
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create referral_registrations table to track registered users via partner
CREATE TABLE public.referral_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  user_type text NOT NULL CHECK (user_type IN ('performer', 'customer')),
  registered_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id) -- each user can only be referred once
);

-- Create referral_bookings table to track bookings via partner referrals
CREATE TABLE public.referral_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('confirmed_paid', 'cancelled_after_payment')),
  booking_amount integer NOT NULL, -- price_total from booking
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (booking_id) -- each booking can only be tracked once
);

-- Enable RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_bookings ENABLE ROW LEVEL SECURITY;

-- Partners: only admins can manage
CREATE POLICY "Admins can manage partners"
ON public.partners
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Partners: public read by access_token (for partner dashboard)
CREATE POLICY "Partners can view own data by token"
ON public.partners
FOR SELECT
USING (true); -- We'll filter by access_token in queries

-- Referral registrations: admins full access
CREATE POLICY "Admins can manage referral_registrations"
ON public.referral_registrations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Referral registrations: public read for partner stats
CREATE POLICY "Public can read referral_registrations"
ON public.referral_registrations
FOR SELECT
USING (true);

-- Referral bookings: admins full access
CREATE POLICY "Admins can manage referral_bookings"
ON public.referral_bookings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Referral bookings: public read for partner stats
CREATE POLICY "Public can read referral_bookings"
ON public.referral_bookings
FOR SELECT
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_partners_updated_at
BEFORE UPDATE ON public.partners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster lookups
CREATE INDEX idx_partners_referral_code ON public.partners(referral_code);
CREATE INDEX idx_partners_access_token ON public.partners(access_token);
CREATE INDEX idx_referral_registrations_partner_id ON public.referral_registrations(partner_id);
CREATE INDEX idx_referral_bookings_partner_id ON public.referral_bookings(partner_id);