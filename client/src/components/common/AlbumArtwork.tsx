import React, { useState } from 'react';
import { Disc3 } from 'lucide-react';

interface AlbumArtworkProps {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  rounded?: string;
  aspectRatio?: 'square' | 'auto';
  showGlow?: boolean;
  priority?: boolean;
}

const DEFAULT_FALLBACK_COVER =
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80';

/**
 * Centralized, production-quality AlbumArtwork component for VIBE MUSIC.
 * STRICT RULE: All song and album artwork MUST use `object-fit: contain`
 * and `object-position: center` inside a consistent dark container.
 * Never crop, stretch or distort album images.
 */
export const AlbumArtwork: React.FC<AlbumArtworkProps> = ({
  src,
  alt,
  className = 'w-full h-full',
  imgClassName = '',
  rounded = 'rounded-xl',
  aspectRatio = 'square',
  showGlow = false,
  priority = false,
}) => {
  const [hasError, setHasError] = useState<boolean>(false);
  const imageSrc = !hasError && src ? src : DEFAULT_FALLBACK_COVER;

  const aspectClass = aspectRatio === 'square' ? 'aspect-square' : '';

  return (
    <div
      className={`relative overflow-hidden bg-[#090510] flex items-center justify-center border border-[#352044] ${rounded} ${aspectClass} ${className}`}
      style={{ backgroundColor: '#090510' }}
    >
      {/* Subtle ambient backing gradient for letterboxed artwork */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#170D24]/60 via-[#090510] to-[#090510] pointer-events-none" />

      {/* Optional ambient glow */}
      {showGlow && (
        <div
          className="absolute inset-0 opacity-25 blur-xl pointer-events-none scale-110"
          style={{
            backgroundImage: `url(${imageSrc})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
        />
      )}

      {/* Primary Artwork Image - 100% Uncropped with object-fit: contain */}
      <img
        src={imageSrc}
        alt={alt || 'Album Artwork'}
        loading={priority ? 'eager' : 'lazy'}
        onError={() => setHasError(true)}
        className={`relative z-10 w-full h-full object-contain object-center transition-transform duration-300 ${imgClassName}`}
        style={{
          objectFit: 'contain',
          objectPosition: 'center',
        }}
      />
    </div>
  );
};

export default AlbumArtwork;

