-- Add a RESTRICTIVE policy that requires authentication for all operations on bookings
-- This ensures anonymous users cannot access any booking data even if other policies exist

CREATE POLICY "Require authentication for bookings"
ON public.bookings
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);