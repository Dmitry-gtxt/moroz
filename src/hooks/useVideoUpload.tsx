import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseVideoUploadOptions {
  userId: string;
  bucket?: string;
  maxSizeMB?: number;
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

export function useVideoUpload({
  userId,
  bucket = 'performer-videos',
  maxSizeMB = 50,
  onSuccess,
  onError,
}: UseVideoUploadOptions) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | undefined>();

  const uploadVideo = useCallback(async (file: File): Promise<string | null> => {
    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error(`Видео слишком большое. Максимум ${maxSizeMB} МБ`);
      return null;
    }

    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      toast.error('Неподдерживаемый формат видео. Используйте MP4, WebM или MOV');
      return null;
    }

    setUploading(true);
    setProgress(0);
    setFileName(file.name);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      // Simulate progress for better UX (Supabase doesn't provide real progress)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          // Slowly increase progress, but cap at 90% until actual completion
          if (prev < 90) {
            const increment = Math.max(1, (90 - prev) * 0.1);
            return Math.min(90, prev + increment);
          }
          return prev;
        });
      }, 200);

      const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      clearInterval(progressInterval);

      if (error) {
        throw error;
      }

      setProgress(100);

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      onSuccess?.(publicUrl);
      toast.success('Видео успешно загружено');
      
      return publicUrl;
    } catch (error) {
      console.error('Video upload error:', error);
      const err = error as Error;
      onError?.(err);
      toast.error('Ошибка загрузки видео: ' + err.message);
      return null;
    } finally {
      // Reset after short delay to show 100%
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
        setFileName(undefined);
      }, 500);
    }
  }, [userId, bucket, maxSizeMB, onSuccess, onError]);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setFileName(undefined);
  }, []);

  return {
    uploadVideo,
    uploading,
    progress,
    fileName,
    reset,
  };
}
