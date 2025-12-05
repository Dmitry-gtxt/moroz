-- Drop the views with security issues and recreate with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_reviews;
DROP VIEW IF EXISTS public.public_performers;

-- Create view for public reviews without customer_id
-- Using SECURITY INVOKER (explicit)
CREATE VIEW public.public_reviews 
WITH (security_invoker = true)
AS
SELECT 
  r.id,
  r.performer_id,
  r.rating,
  r.text,
  r.created_at,
  r.booking_id
FROM reviews r
WHERE r.is_visible = true;

-- Create view for public performer profiles without commission_rate
-- This view shows all active performers (no auth check needed for public)
CREATE VIEW public.public_performers 
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.user_id,
  p.display_name,
  p.performer_types,
  p.photo_urls,
  p.base_price,
  p.price_from,
  p.price_to,
  p.experience_years,
  p.age,
  p.description,
  p.costume_style,
  p.formats,
  p.district_slugs,
  p.video_greeting_url,
  p.verification_status,
  p.rating_average,
  p.rating_count,
  p.is_active,
  p.created_at,
  p.updated_at
FROM performer_profiles p
WHERE p.is_active = true;

-- Grant SELECT on the views to public
GRANT SELECT ON public.public_reviews TO anon, authenticated;
GRANT SELECT ON public.public_performers TO anon, authenticated;

-- Add comments for documentation
COMMENT ON VIEW public.public_reviews IS 'Public view of reviews excluding customer_id for privacy';
COMMENT ON VIEW public.public_performers IS 'Public view of active performer profiles excluding commission_rate for business privacy';