-- Drop existing view and recreate with security definer function
DROP VIEW IF EXISTS public_platform_settings;

-- Create a security definer function to read public settings
CREATE OR REPLACE FUNCTION public.get_public_platform_settings()
RETURNS TABLE (key text, value text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ps.key, ps.value
  FROM platform_settings ps
  WHERE ps.key IN ('commission_rate', 'prepayment_percent', 'min_booking_notice_hours', 'admin_phone')
    AND ps.key NOT LIKE '%secret%'
    AND ps.key NOT LIKE '%api%'
    AND ps.key NOT LIKE '%token%';
$$;

-- Create view using the security definer function
CREATE VIEW public_platform_settings AS
SELECT * FROM get_public_platform_settings();