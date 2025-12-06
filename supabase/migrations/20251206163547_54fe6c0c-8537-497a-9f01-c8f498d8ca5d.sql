-- Remove the broad authentication policy that may be causing issues
-- The existing policies already implicitly require authentication:
-- - "Users can view own profile" uses auth.uid() = user_id (NULL if not authenticated)
-- - "Admins can view all profiles" uses has_role() which requires authentication
DROP POLICY IF EXISTS "Require authentication for profiles" ON public.profiles;