-- =====================================================
-- FIX 1: profiles table - block anonymous access explicitly
-- =====================================================

-- Add explicit denial for anonymous users on profiles
CREATE POLICY "Block anonymous access to profiles" 
ON public.profiles 
AS RESTRICTIVE
FOR ALL 
TO anon
USING (false);

-- =====================================================
-- FIX 2: bookings table - strengthen RLS policies
-- =====================================================

-- Add explicit denial for anonymous users on bookings
CREATE POLICY "Block anonymous access to bookings" 
ON public.bookings 
AS RESTRICTIVE
FOR ALL 
TO anon
USING (false);

-- =====================================================
-- FIX 3: platform_settings - restrict public access
-- =====================================================

-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Settings are publicly readable" ON public.platform_settings;

-- Create a view for public settings (only non-sensitive ones)
CREATE OR REPLACE VIEW public.public_platform_settings AS
SELECT key, value
FROM public.platform_settings
WHERE key IN ('commission_rate', 'prepayment_percent', 'min_booking_notice_hours')
  AND key NOT LIKE '%secret%'
  AND key NOT LIKE '%api%'
  AND key NOT LIKE '%token%';

-- Allow public read access to the safe view only
GRANT SELECT ON public.public_platform_settings TO anon, authenticated;

-- Settings table now only accessible to authenticated users
CREATE POLICY "Authenticated users can read settings" 
ON public.platform_settings 
FOR SELECT 
TO authenticated
USING (true);

-- Admins can still manage all settings (policies already exist)
-- Keep existing admin insert/update policies