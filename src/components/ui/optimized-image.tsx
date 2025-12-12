import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  fallback?: string;
}

// Generate srcset for different screen sizes
function generateSrcSet(src: string): string | undefined {
  // Only generate srcset for Supabase storage URLs
  if (!src.includes('supabase') && !src.includes('unsplash')) {
    return undefined;
  }
  
  // For Unsplash, use their built-in image optimization
  if (src.includes('unsplash.com')) {
    const baseUrl = src.split('?')[0];
    return `${baseUrl}?w=400&q=75 400w, ${baseUrl}?w=800&q=75 800w, ${baseUrl}?w=1200&q=75 1200w`;
  }
  
  return undefined;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  priority = false,
  fallback = 'https://images.unsplash.com/photo-1576919228236-a097c32a5cd4?w=400&h=400&fit=crop',
  className,
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setError(false);
    setIsLoaded(false);
  }, [src]);

  const srcSet = generateSrcSet(imgSrc);

  return (
    <img
      src={error ? fallback : imgSrc}
      srcSet={error ? undefined : srcSet}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      onLoad={() => setIsLoaded(true)}
      onError={() => {
        setError(true);
        setImgSrc(fallback);
      }}
      className={cn(
        'transition-opacity duration-300',
        isLoaded ? 'opacity-100' : 'opacity-0',
        className
      )}
      {...props}
    />
  );
}
