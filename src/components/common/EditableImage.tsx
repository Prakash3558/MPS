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
}

export const EditableImage: React.FC<EditableImageProps> = React.memo(({
  src,
  alt,
  className = '',
  isVideo = false,
  loading = 'lazy'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
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
    <div className="relative w-full h-full overflow-hidden bg-slate-200/60 dark:bg-slate-800/60 select-none">
      {!isLoaded && !isEager && (
        <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse flex items-center justify-center pointer-events-none">
          <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        </div>
      )}
      {hasError ? (
        <div className={`w-full h-full min-h-[120px] flex flex-col items-center justify-center p-4 text-center bg-slate-100 dark:bg-slate-800 text-slate-400 ${className}`}>
          <ImageIcon className="w-8 h-8 mb-1 text-slate-400 opacity-60" />
          <span className="text-xs font-medium">{alt || 'Image unavailable'}</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={loading}
          decoding={isEager ? 'sync' : 'async'}
          referrerPolicy="no-referrer"
          {...(isEager ? { fetchPriority: 'high' as const } : {})}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`${className} transition-opacity duration-300 ${isLoaded || isEager ? 'opacity-100' : 'opacity-80'}`}
        />
      )}
    </div>
  );
});
