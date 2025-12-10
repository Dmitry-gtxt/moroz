-- Drop the problematic policy that uses {public} role
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Recreate the policy with explicit authenticated role requirement
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));