import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// Product photo with a neutral placeholder for a missing or broken image URL.
export default function ProductImage({ src, alt, className }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const showPlaceholder = !src || failedSrc === src;

  return (
    <div className={cn('relative overflow-hidden bg-muted', className)}>
      {showPlaceholder ? (
        <div className="flex size-full items-center justify-center text-muted-foreground/60">
          <ImageOff className="size-6" aria-hidden="true" />
          <span className="sr-only">No image available</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailedSrc(src)}
          className="size-full object-cover object-center"
        />
      )}
    </div>
  );
}
