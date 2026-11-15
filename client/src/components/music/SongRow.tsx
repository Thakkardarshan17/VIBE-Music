import React, { useState } from 'react';
import { Play, Pause, Heart, Plus, Clock, Volume2 } from 'lucide-react';
import { Track } from '../../types/music.js';
import { usePlayer } from '../../context/PlayerContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { localMusicStorage } from '../../services/localMusicStorage.js';
import { AlbumArtwork } from '../common/AlbumArtwork.js';

interface SongRowProps {
  track: Track;
  index: number;
  queueContext?: Track[];
  onAddToPlaylist?: (track: Track) => void;
  onRemove?: () => void;
}

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '3:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const SongTableHeader: React.FC = () => {
  return (
    <div className="w-full flex items-center px-3 py-2 text-[11px] font-bold text-[#B7A6C8]/70 uppercase tracking-wider border-b border-[#352044] mb-1 select-none">
      {/* 1. Track Index Header */}
      <span className="w-8 sm:w-10 text-center flex-shrink-0">#</span>

      {/* 2. Artwork Spacer */}
      <span className="w-10 sm:w-11 flex-shrink-0 mx-2" />

      {/* 3. Title Header */}
      <span className="flex-1 min-w-0 pr-4 text-left">Title</span>

      {/* 4. Album Header (hidden on mobile) */}
      <span className="hidden md:block w-36 lg:w-48 text-left truncate pr-2">Album</span>

      {/* 5. Fidelity Header (hidden on small/medium screens) */}
      <span className="hidden lg:block w-24 text-left pr-2">Fidelity</span>

      {/* 6. Actions & Duration Header */}
      <div className="w-20 sm:w-28 flex items-center justify-end gap-2 pr-1 flex-shrink-0">
        <Heart className="w-3.5 h-3.5 text-[#B7A6C8]/60 mr-auto hidden sm:block" />
        <Clock className="w-3.5 h-3.5 text-[#B7A6C8]" />
      </div>
    </div>
  );
};

export const SongRow: React.FC<SongRowProps> = ({
  track,
  index,
  queueContext,
  onAddToPlaylist,
  onRemove,
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const { isAuthenticated } = useAuth();
  const [isLiked, setIsLiked] = useState<boolean>(() => localMusicStorage.isSongLiked(track.id));

  const isCurrent = currentTrack?.id === track.id;

  const handleRowClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, queueContext);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const status = await localMusicStorage.toggleLikeSong(track, isAuthenticated);
      setIsLiked(status);
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <div
      onClick={handleRowClick}
      role="row"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleRowClick();
      }}
      className={`group w-full flex items-center px-3 py-2.5 rounded-2xl transition-all cursor-pointer select-none ${
        isCurrent
          ? 'bg-[#251336] border border-[#A020F0]/50 text-white shadow-lg shadow-[#A020F0]/15'
          : 'hover:bg-[#170D24] text-slate-300'
      }`}
    >
      {/* 1. Track Index / Play Hover Button */}
      <div className="w-8 sm:w-10 flex items-center justify-center text-center flex-shrink-0">
        {isCurrent && isPlaying ? (
          <div className="flex items-center justify-center gap-0.5 h-3.5">
            <span className="w-0.5 h-3.5 bg-[#E51D87] animate-pulse" />
            <span className="w-0.5 h-2 bg-[#A020F0] animate-pulse delay-75" />
            <span className="w-0.5 h-4 bg-pink-400 animate-pulse delay-150" />
          </div>
        ) : (
          <>
            <span className="text-xs font-mono text-[#B7A6C8] group-hover:hidden">
              {index + 1}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRowClick();
              }}
              className="hidden group-hover:flex items-center justify-center text-white hover:text-pink-300 transition-colors p-1"
              title={isCurrent && isPlaying ? 'Pause' : 'Play'}
            >
              {isCurrent && isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>
          </>
        )}
      </div>

      {/* 2. Song Cover Artwork (Contains entire artwork with no cropping) */}
      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden flex-shrink-0 mx-2 bg-[#090510] border border-[#352044]">
        <AlbumArtwork
          src={track.coverUrl}
          alt={track.title}
          aspectRatio="square"
          rounded="rounded-xl"
          className="w-full h-full"
        />
      </div>

      {/* 3. Title & Artist (Takes remaining width and truncates cleanly without ever overlapping the Like button) */}
      <div className="flex-1 min-w-0 pr-4">
        <p
          className={`font-bold text-xs sm:text-sm truncate transition-colors ${
            isCurrent ? 'text-pink-300' : 'text-white group-hover:text-pink-200'
          }`}
          title={track.title}
        >
          {track.title}
        </p>
        <p className="text-[11px] sm:text-xs text-[#B7A6C8] truncate mt-0.5" title={track.artist}>
          {track.artist}
        </p>
      </div>

      {/* 4. Album (Strictly aligned column, hidden on mobile) */}
      <div className="hidden md:block w-36 lg:w-48 text-left truncate pr-2">
        <span
          className="text-xs text-[#B7A6C8] hover:text-slate-200 transition-colors truncate block"
          title={track.album || 'Single'}
        >
          {track.album || 'Single'}
        </span>
      </div>

      {/* 5. Quality / Fidelity Badge (hidden on mobile/tablet) */}
      <div className="hidden lg:flex w-24 items-center justify-start pr-2">
        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 whitespace-nowrap">
          Full Song
        </span>
      </div>

      {/* 6. Dedicated Actions & Duration Container (Cleanly separated on the right edge) */}
      <div className="w-20 sm:w-28 flex items-center justify-end gap-1 sm:gap-2 flex-shrink-0 pr-1 text-right">
        {/* Like Button */}
        <button
          type="button"
          onClick={handleLike}
          className={`p-1 sm:p-1.5 rounded-full transition-all flex items-center justify-center flex-shrink-0 active:scale-75 hover:scale-110 ${
            isLiked
              ? 'text-[#E51D87] hover:brightness-110 drop-shadow-[0_0_8px_rgba(229,29,135,0.7)]'
              : 'text-[#B7A6C8] hover:text-[#E51D87] hover:bg-white/5'
          }`}
          title={isLiked ? 'Unlike song' : 'Like song'}
        >
          <Heart
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 ${
              isLiked ? 'fill-[#E51D87] scale-110' : ''
            }`}
          />
        </button>

        {/* Add to Playlist Button (Visible on tablet/desktop) */}
        {onAddToPlaylist && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToPlaylist(track);
            }}
            className="p-1 sm:p-1.5 rounded-full text-[#B7A6C8] hover:text-white hover:bg-white/5 transition-all hidden sm:flex items-center justify-center flex-shrink-0 active:scale-75 hover:scale-110"
            title="Add to Playlist"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}

        {/* Duration */}
        <span className="text-xs font-mono text-[#B7A6C8] w-10 sm:w-12 text-right flex-shrink-0 tabular-nums">
          {formatDuration(track.duration)}
        </span>
      </div>
    </div>
  );
};

export default SongRow;
