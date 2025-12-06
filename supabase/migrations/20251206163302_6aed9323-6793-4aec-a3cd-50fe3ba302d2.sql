-- Add restrictive policy requiring authentication for all operations on profiles
-- This prevents any unauthenticated access to user personal data

CREATE POLICY "Require authentication for profiles" 
ON public.profiles 
AS RESTRICTIVE
FOR ALL 
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Add admin access to view profiles for support purposes
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));