-- Remove the overly permissive authenticated users policy
DROP POLICY IF EXISTS "Authenticated users can read settings" ON public.platform_settings;

-- Now only admins can read settings (existing admin policy handles this)
-- Verify admin SELECT policy exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'platform_settings' 
    AND policyname LIKE '%Admin%' 
    AND cmd = 'SELECT'
  ) THEN
    CREATE POLICY "Admins can view settings" 
    ON public.platform_settings 
    FOR SELECT 
    USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;