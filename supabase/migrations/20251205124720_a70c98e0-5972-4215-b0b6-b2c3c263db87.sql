-- Create view for public reviews without customer_id
CREATE OR REPLACE VIEW public.public_reviews AS
SELECT 
  r.id,
  r.performer_id,
  r.rating,
  r.text,
  r.created_at,
  r.booking_id
FROM reviews r
WHERE r.is_visible = true;

-- Grant SELECT on the view to public
GRANT SELECT ON public.public_reviews TO anon, authenticated;

-- Create view for public performer profiles without commission_rate
CREATE OR REPLACE VIEW public.public_performers AS
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
WHERE p.is_active = true OR p.user_id = auth.uid();

-- Grant SELECT on the view to public
GRANT SELECT ON public.public_performers TO anon, authenticated;

-- Add comment for documentation
COMMENT ON VIEW public.public_reviews IS 'Public view of reviews excluding customer_id for privacy';
COMMENT ON VIEW public.public_performers IS 'Public view of performer profiles excluding commission_rate for business privacy';