-- Create storage bucket for performer photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('performer-photos', 'performer-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for verification documents (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-docs', 'verification-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for performer photos
CREATE POLICY "Anyone can view performer photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'performer-photos');

CREATE POLICY "Performers can upload own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'performer-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Performers can update own photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'performer-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Performers can delete own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'performer-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for verification documents
CREATE POLICY "Performers can view own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'verification-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Performers can upload verification docs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'verification-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all verification docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'verification-docs'
  AND public.has_role(auth.uid(), 'admin')
);