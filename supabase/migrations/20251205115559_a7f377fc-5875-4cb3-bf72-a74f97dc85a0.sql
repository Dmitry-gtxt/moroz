-- Create storage bucket for performer videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('performer-videos', 'performer-videos', true, 52428800, ARRAY['video/mp4', 'video/quicktime', 'video/webm'])
ON CONFLICT (id) DO NOTHING;

-- Storage policy for viewing videos (public)
CREATE POLICY "Videos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'performer-videos');

-- Storage policy for uploading videos (authenticated users)
CREATE POLICY "Performers can upload their own videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'performer-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policy for deleting videos
CREATE POLICY "Performers can delete their own videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'performer-videos' AND auth.uid()::text = (storage.foldername(name))[1]);