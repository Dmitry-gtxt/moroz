-- Remove the overly permissive policy that allows any authenticated user to see all bookings
DROP POLICY IF EXISTS "Require authentication for bookings" ON public.bookings;

-- The remaining policies already properly restrict access:
-- - "Customers can view own bookings" - SELECT where customer_id = auth.uid()
-- - "Performers can view their bookings" - SELECT where performer_id matches user's performer profile
-- - "Admins can view all bookings" - SELECT for admins
-- - "Customers can create bookings" - INSERT where customer_id = auth.uid()
-- - "Users can update own bookings" - UPDATE for customers and performers
-- - "Admins can update any booking" - UPDATE for admins

-- Add a restrictive authentication requirement as a safety layer
-- This ensures ALL operations require authentication without granting broad access
CREATE POLICY "Require authentication for bookings" 
ON public.bookings 
AS RESTRICTIVE
FOR ALL 
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);