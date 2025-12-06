-- Remove the "Require authentication for bookings" policy entirely
-- The existing SELECT policies already implicitly require authentication:
-- - "Customers can view own bookings" uses auth.uid() = customer_id (fails if not authenticated)
-- - "Performers can view their bookings" uses auth.uid() in subquery
-- - "Admins can view all bookings" uses has_role() which requires authentication
-- - "Customers can create bookings" uses auth.uid() = customer_id
-- - "Users can update own bookings" uses auth.uid() checks
-- - "Admins can update any booking" uses has_role()
DROP POLICY IF EXISTS "Require authentication for bookings" ON public.bookings;