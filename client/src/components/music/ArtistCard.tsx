import React from 'react';
import { CheckCircle2, Users, Play, Loader2 } from 'lucide-react';
import { Artist } from '../../types/music.js';

interface ArtistCardProps {
  artist: Artist;
  onClick?: () => void;
  isSelected?: boolean;
  isLoading?: boolean;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({
  artist,
  onClick,
  isSelected = false,
  isLoading = false,
}) => {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`glass-card group p-3.5 sm:p-4 rounded-2xl cursor-pointer flex flex-col items-center text-center transition-all select-none relative ${
        isSelected
          ? 'ring-2 ring-[#E51D87] bg-[#221033] shadow-lg shadow-[#A020F0]/30 scale-[1.02]'
          : 'hover:scale-[1.02] hover:bg-[#1a0e28] hover:border-[#A020F0]/40'
      }`}
    >
      {/* Selected Indicator Pill */}
      {isSelected && (
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-[10px] font-bold text-white shadow-sm flex items-center gap-1 z-10 animate-fadeIn">
          {isLoading ? (
            <>
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              <span>Loading</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Selected</span>
            </>
          )}
        </div>
      )}

      {/* Artist Avatar Circle with Play Hover Overlay */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden mb-3 border-2 transition-all shadow-md group-hover:shadow-[#A020F0]/30 ${
        isSelected
          ? 'border-[#E51D87] shadow-[#E51D87]/40 ring-2 ring-[#A020F0]/40'
          : 'border-[#352044] group-hover:border-[#A020F0]'
      }">
        <img
          src={artist.imageUrl}
          alt={artist.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Hover / Active Play Action Overlay */}
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-opacity duration-300 ${
            isSelected ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#A020F0] to-[#E51D87] flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition-transform">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
        </div>
      </div>

      {/* Artist Name & Verified Badge */}
      <div className="flex items-center gap-1.5 justify-center w-full px-1">
        <h4 className="font-bold text-xs sm:text-sm text-white group-hover:text-pink-300 transition-colors truncate">
          {artist.name}
        </h4>
        {artist.verified && (
          <CheckCircle2 className="w-3.5 h-3.5 text-[#E51D87] fill-[#E51D87]/20 flex-shrink-0" />
        )}
      </div>

      {/* Genre / Subtitle */}
      <p className="text-[11px] text-[#B7A6C8] truncate mt-0.5 max-w-full">
        {artist.genre || 'Artist'}
      </p>

      {/* Monthly Listeners */}
      {artist.monthlyListeners && (
        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-2 font-mono">
          <Users className="w-3 h-3 text-[#A020F0]" />
          <span>{(artist.monthlyListeners / 1000000).toFixed(1)}M listeners</span>
        </div>
      )}
    </div>
  );
};

export default ArtistCard;
