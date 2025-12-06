-- Enable RLS on public_performers view and add explicit public read policy
-- This view is intentionally public-facing for the performer catalog

ALTER VIEW public.public_performers SET (security_invoker = on);

-- Add explicit policy allowing public read access to the performers catalog
CREATE POLICY "Public performers are publicly readable"
ON public.performer_profiles
AS PERMISSIVE
FOR SELECT
TO anon, authenticated
USING (is_active = true AND verification_status = 'verified');