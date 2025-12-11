-- =====================================================
-- КРИТИЧЕСКИ ВАЖНО: Политики для загрузки файлов исполнителями
-- =====================================================

-- Политики для bucket performer-photos
CREATE POLICY "Anyone can view performer photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'performer-photos');

CREATE POLICY "Authenticated users can upload performer photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'performer-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own performer photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'performer-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own performer photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'performer-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Политики для bucket performer-videos
CREATE POLICY "Anyone can view performer videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'performer-videos');

CREATE POLICY "Authenticated users can upload performer videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'performer-videos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own performer videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'performer-videos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own performer videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'performer-videos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);