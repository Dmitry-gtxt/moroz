-- Fix public_performers view to use SECURITY INVOKER
-- This ensures RLS policies of the querying user are respected

DROP VIEW IF EXISTS public.public_performers;

CREATE VIEW public.public_performers
WITH (security_invoker = on)
AS
SELECT 
  id,
  user_id,
  display_name,
  performer_types,
  photo_urls,
  base_price,
  price_from,
  price_to,
  experience_years,
  age,
  description,
  costume_style,
  formats,
  district_slugs,
  video_greeting_url,
  verification_status,
  rating_average,
  rating_count,
  is_active,
  created_at,
  updated_at
FROM performer_profiles p
WHERE is_active = true;

-- Fix public_platform_settings view to use SECURITY INVOKER
-- The underlying function get_public_platform_settings() already handles security
DROP VIEW IF EXISTS public.public_platform_settings;

CREATE VIEW public.public_platform_settings
WITH (security_invoker = on)
AS
SELECT key, value
FROM get_public_platform_settings();