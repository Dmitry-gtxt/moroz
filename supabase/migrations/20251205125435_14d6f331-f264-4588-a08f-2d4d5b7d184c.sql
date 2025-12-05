-- Fix verification_documents RLS to require authentication
DROP POLICY IF EXISTS "Performers can view own documents" ON public.verification_documents;
DROP POLICY IF EXISTS "Performers can upload documents" ON public.verification_documents;

-- Recreate with explicit TO authenticated
CREATE POLICY "Performers can view own documents" 
ON public.verification_documents 
FOR SELECT 
TO authenticated
USING (performer_id IN (
  SELECT performer_profiles.id
  FROM performer_profiles
  WHERE performer_profiles.user_id = auth.uid()
));

CREATE POLICY "Performers can upload documents" 
ON public.verification_documents 
FOR INSERT 
TO authenticated
WITH CHECK (performer_id IN (
  SELECT performer_profiles.id
  FROM performer_profiles
  WHERE performer_profiles.user_id = auth.uid()
));