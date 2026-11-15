import React, { useState } from 'react';
import { Play, Pause, Heart, Plus, Check } from 'lucide-react';
import { Track } from '../../types/music.js';
import { usePlayer } from '../../context/PlayerContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { favoriteApi } from '../../services/api.js';
import { localMusicStorage } from '../../services/localMusicStorage.js';
import { AlbumArtwork } from '../common/AlbumArtwork.js';

interface SongCardProps {
  track: Track;
  queueContext?: Track[];
  onAddToPlaylist?: (track: Track) => void;
}

export const SongCard: React.FC<SongCardProps> = ({ track, queueContext, onAddToPlaylist }) => {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const { isAuthenticated } = useAuth();
  const [isLiked, setIsLiked] = useState<boolean>(() => localMusicStorage.isSongLiked(track.id));

  const isCurrent = currentTrack?.id === track.id;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
    } catch (err) {
      console.warn(err);
    }
  };

  return (
    <div
      onClick={handlePlayClick}
      className="glass-card group relative p-3 rounded-2xl cursor-pointer flex flex-col justify-between"
    >
      {/* Artwork container with 100% Uncropped Contain Image */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-[#090510]">
        <AlbumArtwork
          src={track.coverUrl}
          alt={track.title}
          aspectRatio="square"
          rounded="rounded-xl"
          imgClassName="group-hover:scale-105 transition-transform duration-500"
        />

        {/* Hover overlay with Play button */}
        <div className={`absolute inset-0 z-20 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${
          isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          <button
            onClick={handlePlayClick}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#A020F0] to-[#E51D87] text-white flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all"
          >
            {isCurrent && isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Quality status badge (No external provider names) */}
        <div className="absolute top-2 left-2 z-20 flex items-center gap-1">
          <span className="px-2 py-0.5 rounded-md bg-emerald-950/90 backdrop-blur-md text-[9px] font-extrabold text-emerald-400 border border-emerald-500/40">
            FULL SONG
          </span>
        </div>

        {/* Like & Add Button on hover */}
        {isAuthenticated && (
          <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleLike}
              className="p-1.5 rounded-full bg-black/70 backdrop-blur-md text-slate-300 hover:text-pink-500 transition-colors"
              title="Like"
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-pink-500 text-pink-500' : ''}`} />
            </button>
            {onAddToPlaylist && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToPlaylist(track);
                }}
                className="p-1.5 rounded-full bg-black/70 backdrop-blur-md text-slate-300 hover:text-purple-300 transition-colors"
                title="Add to Playlist"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col justify-end">
        <h4 className={`font-semibold text-sm truncate leading-tight ${isCurrent ? 'text-purple-400' : 'text-white'}`}>
          {track.title}
        </h4>
        <p className="text-xs text-purple-300/70 truncate mt-1">{track.artist}</p>
      </div>
    </div>
  );
};

