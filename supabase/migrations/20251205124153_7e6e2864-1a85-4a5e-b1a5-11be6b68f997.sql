-- Fix RLS policies for bookings table to explicitly require authentication
-- and prevent any anonymous access to sensitive PII data

-- Drop existing SELECT policies and recreate them as PERMISSIVE with auth check
DROP POLICY IF EXISTS "Customers can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Performers can view their bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;

-- Recreate policies as PERMISSIVE with explicit auth check
CREATE POLICY "Customers can view own bookings" 
ON public.bookings 
FOR SELECT 
TO authenticated
USING (auth.uid() = customer_id);

CREATE POLICY "Performers can view their bookings" 
ON public.bookings 
FOR SELECT 
TO authenticated
USING (performer_id IN (
  SELECT id FROM performer_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can view all bookings" 
ON public.bookings 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Also fix UPDATE policies to be explicit about authentication
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can update any booking" ON public.bookings;

CREATE POLICY "Users can update own bookings" 
ON public.bookings 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() = customer_id 
  OR performer_id IN (SELECT id FROM performer_profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can update any booking" 
ON public.bookings 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix INSERT policy
DROP POLICY IF EXISTS "Customers can create bookings" ON public.bookings;

CREATE POLICY "Customers can create bookings" 
ON public.bookings 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = customer_id);