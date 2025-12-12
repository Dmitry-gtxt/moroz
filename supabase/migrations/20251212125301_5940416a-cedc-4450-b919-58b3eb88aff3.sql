-- Add RESTRICTIVE policy to profiles table to explicitly require authentication
-- This is a defense-in-depth measure that blocks unauthenticated access

CREATE POLICY "Require authentication for profile access"
ON public.profiles
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL);