import React, { useState, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface EditableImageProps {
  src: string;
  alt: string;
  className?: string;
  onSaveImage?: (newUrl: string) => void;
  aspectRatio?: string;
  isVideo?: boolean;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
}

export const EditableImage: React.FC<EditableImageProps> = React.memo(({
  src,
  alt,
  className = '',
  isVideo = false,
  loading = 'lazy',
  decoding
}) => {
  const [isLoaded, setIsLoaded] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const handleImageLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoaded(true);
    setHasError(true);
  };

  if (isVideo) {
    return <video src={src} className={className} autoPlay loop muted playsInline />;
  }

  const isEager = loading === 'eager';

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-900 select-none">
      {hasError ? (
        <div className={`w-full h-full min-h-[120px] flex flex-col items-center justify-center p-4 text-center bg-slate-800 text-slate-400 ${className}`}>
          <ImageIcon className="w-8 h-8 mb-1 text-slate-400 opacity-60" />
          <span className="text-xs font-medium">{alt || 'Image unavailable'}</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={loading}
          decoding={decoding || 'async'}
          referrerPolicy="no-referrer"
          {...(isEager ? { fetchPriority: 'high' as const } : {})}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`${className} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-80'}`}
        />
      )}
    </div>
  );
});
