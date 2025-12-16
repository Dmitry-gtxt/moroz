-- Drop the unsafe policy that allows anyone to read all partners
DROP POLICY IF EXISTS "Partners can view own data by token" ON public.partners;

-- Create secure policy: only admins can view partners table directly
CREATE POLICY "Only admins can view partners"
ON public.partners
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create security definer function for partner authentication by token
-- This allows partners to authenticate without exposing other partners' tokens
CREATE OR REPLACE FUNCTION public.get_partner_by_token(_token uuid)
RETURNS TABLE (
  id uuid,
  name text,
  referral_code text,
  is_active boolean,
  organization_type text,
  contact_email text,
  contact_phone text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name, p.referral_code, p.is_active, p.organization_type, p.contact_email, p.contact_phone
  FROM partners p
  WHERE p.access_token = _token AND p.is_active = true
$$;