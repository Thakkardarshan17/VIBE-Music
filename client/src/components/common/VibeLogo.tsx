import React from 'react';
import { NavLink } from 'react-router-dom';

export interface VibeLogoProps {
  variant?: 'full' | 'compact' | 'icon' | 'hero';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  className?: string;
  glow?: boolean;
  animated?: boolean;
  linkToHome?: boolean;
  onClick?: () => void;
  alt?: string;
}

export const VibeLogo: React.FC<VibeLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  glow = true,
  animated = true,
  linkToHome = false,
  onClick,
  alt = 'VIBE MUSIC Official Logo',
}) => {
  // Size configurations for emblem and typography
  const config = {
    xs: {
      emblem: 'w-6 h-6',
      vibeText: 'text-base sm:text-lg',
      musicText: 'text-[7.5px] sm:text-[8px] tracking-[0.28em]',
      dot: 'w-1 h-1',
      gap: 'gap-1.5',
    },
    sm: {
      emblem: 'w-7 h-7',
      vibeText: 'text-lg sm:text-xl',
      musicText: 'text-[8.5px] sm:text-[9px] tracking-[0.3em]',
      dot: 'w-1 h-1',
      gap: 'gap-2',
    },
    md: {
      emblem: 'w-9 h-9',
      vibeText: 'text-2xl sm:text-3xl',
      musicText: 'text-[10px] sm:text-[11px] tracking-[0.34em]',
      dot: 'w-1.5 h-1.5',
      gap: 'gap-2.5',
    },
    lg: {
      emblem: 'w-12 h-12',
      vibeText: 'text-3xl sm:text-4xl',
      musicText: 'text-xs sm:text-sm tracking-[0.36em]',
      dot: 'w-2 h-2',
      gap: 'gap-3',
    },
    xl: {
      emblem: 'w-16 h-16 sm:w-20 sm:h-20',
      vibeText: 'text-4xl sm:text-6xl',
      musicText: 'text-sm sm:text-base tracking-[0.4em]',
      dot: 'w-2.5 h-2.5',
      gap: 'gap-3.5',
    },
    custom: {
      emblem: 'w-8 h-8',
      vibeText: 'text-xl',
      musicText: 'text-[9px] tracking-[0.3em]',
      dot: 'w-1 h-1',
      gap: 'gap-2',
    },
  }[size];

  // Studio-grade Neon Glow Filters
  const glowDropShadow = glow
    ? 'drop-shadow-[0_0_16px_rgba(160,32,240,0.65)] hover:drop-shadow-[0_0_24px_rgba(229,29,135,0.85)]'
    : '';

  // Interactive Micro-Animations
  const animClass = animated
    ? 'transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98]'
    : '';

  // 100% Vector SVG Soundwave Emblem (No raster images, no outer poster card, no borders)
  const emblem = (
    <div className={`relative ${config.emblem} flex items-center justify-center shrink-0`}>
      <svg
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full ${glowDropShadow}`}
        aria-hidden="true"
      >
        <defs>
          {/* Main Brand Gradient: Neon Purple to Hot Pink */}
          <linearGradient id="vibePrimaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A020F0" />
            <stop offset="50%" stopColor="#C026D3" />
            <stop offset="100%" stopColor="#E51D87" />
          </linearGradient>

          {/* Electric Pulse Gradient */}
          <linearGradient id="vibePulseGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E51D87" />
            <stop offset="100%" stopColor="#FF3399" />
          </linearGradient>

          {/* Audio Wave Gradient */}
          <linearGradient id="vibeWaveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F472B6" />
          </linearGradient>

          {/* Vector Studio Blur */}
          <filter id="vibeVectorGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Dynamic Acoustic "V" Emblem */}
        <path
          d="M7 8C7 6.89543 7.89543 6 9 6H13.6C14.48 6 15.26 6.57 15.53 7.41L21.5 25.8L27.47 7.41C27.74 6.57 28.52 6 29.4 6H34C35.1046 6 36 6.89543 36 8C36 8.38 35.89 8.75 35.69 9.07L23.4 28.6C22.6 29.9 20.4 29.9 19.6 28.6L7.31 9.07C7.11 8.75 7 8.38 7 8Z"
          fill="url(#vibePrimaryGrad)"
          filter="url(#vibeVectorGlow)"
        />

        {/* Dynamic Studio Soundwave Frequencies inside the V */}
        <rect x="14" y="9.5" width="2.2" height="7.5" rx="1.1" fill="url(#vibeWaveGrad)" opacity="0.9" />
        <rect x="17.8" y="12.5" width="2.2" height="10.5" rx="1.1" fill="url(#vibeWaveGrad)" opacity="0.95" />
        <rect x="21.6" y="13.5" width="2.2" height="9" rx="1.1" fill="url(#vibeWaveGrad)" opacity="0.95" />
        <rect x="25.4" y="10.5" width="2.2" height="6.5" rx="1.1" fill="url(#vibeWaveGrad)" opacity="0.9" />

        {/* Glowing Acoustic Apex Pulse Orb */}
        <circle cx="21.5" cy="35" r="3" fill="url(#vibePulseGrad)" />
        <circle cx="21.5" cy="35" r="1.3" fill="#FFFFFF" />
        <circle cx="21.5" cy="35" r="4.5" stroke="#E51D87" strokeWidth="0.8" opacity="0.5" strokeDasharray="2 2" />
      </svg>
    </div>
  );

  // If only the iconic emblem is requested
  if (variant === 'icon') {
    const iconOnly = (
      <div
        onClick={onClick}
        title={alt}
        className={`inline-flex items-center justify-center select-none cursor-pointer ${animClass} ${className}`}
      >
        {emblem}
      </div>
    );

    if (linkToHome) {
      return (
        <NavLink to="/" className="inline-flex items-center focus:outline-none" title="VIBE MUSIC - Home">
          {iconOnly}
        </NavLink>
      );
    }
    return iconOnly;
  }

  // Wordmark Typography (Zero border, clean, modern, studio-grade branding)
  const typography = (
    <div className="flex flex-col justify-center leading-none select-none text-left">
      <div className="flex items-center">
        <span
          className={`font-black tracking-tight text-white ${config.vibeText} drop-shadow-[0_0_12px_rgba(160,32,240,0.5)]`}
          style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}
        >
          VIBE
        </span>
      </div>

      {variant !== 'compact' && (
        <div className="flex items-center gap-1.5 mt-0.5">
          <span
            className={`font-extrabold uppercase ${config.musicText} bg-gradient-to-r from-[#C026D3] via-[#E51D87] to-[#FF4D94] bg-clip-text text-transparent`}
            style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}
          >
            MUSIC
          </span>
          <span className={`${config.dot} rounded-full bg-emerald-400 animate-pulse shrink-0`} />
        </div>
      )}
    </div>
  );

  const logoContent = (
    <div
      onClick={onClick}
      role="banner"
      aria-label={alt}
      className={`inline-flex items-center ${config.gap} select-none ${animClass} ${className}`}
    >
      {emblem}
      {typography}
    </div>
  );

  if (linkToHome) {
    return (
      <NavLink
        to="/"
        className="inline-flex items-center focus:outline-none focus:ring-2 focus:ring-[#A020F0]/40 rounded-xl"
        title="VIBE MUSIC - Home"
      >
        {logoContent}
      </NavLink>
    );
  }

  return logoContent;
};

export default VibeLogo;
