-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Require authentication" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

-- Simple and clear PERMISSIVE policies
-- Each policy explicitly requires auth.uid() comparison, which implicitly requires authentication

-- SELECT: Users can ONLY view their own profile
CREATE POLICY "Users can view own profile only" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- SELECT: Admins can view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- INSERT: Users can only create their own profile
CREATE POLICY "Users can insert own profile only" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own profile  
CREATE POLICY "Users can update own profile only" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Admins can update any profile
CREATE POLICY "Admins can update any profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));