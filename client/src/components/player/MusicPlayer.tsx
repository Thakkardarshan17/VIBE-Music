import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Heart,
  Disc3,
} from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { localMusicStorage } from '../../services/localMusicStorage.js';
import { AudioVisualizer } from './AudioVisualizer.js';
import { AlbumArtwork } from '../common/AlbumArtwork.js';

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

interface MusicPlayerProps {
  className?: string;
  showVisualizer?: boolean;
}

/**
 * Reusable clean VIBE MUSIC player component.
 * STRICT: 100% uncropped album artwork with object-fit: contain.
 * No external music provider labels or branding.
 */
export const MusicPlayer: React.FC<MusicPlayerProps> = ({
  className = '',
  showVisualizer = true,
}) => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
  } = usePlayer();

  const { isAuthenticated } = useAuth();
  const [isLiked, setIsLiked] = React.useState<boolean>(() => {
    return currentTrack ? localMusicStorage.isSongLiked(currentTrack.id) : false;
  });

  React.useEffect(() => {
    if (currentTrack) {
      setIsLiked(localMusicStorage.isSongLiked(currentTrack.id));
    }
  }, [currentTrack]);

  const handleLike = async () => {
    if (!currentTrack) return;
    try {
      const status = await localMusicStorage.toggleLikeSong(currentTrack, isAuthenticated);
      setIsLiked(status);
    } catch (e) {
      console.warn(e);
    }
  };

  if (!currentTrack) return null;

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`glass-panel rounded-3xl p-6 sm:p-8 border border-[#352044] shadow-2xl relative overflow-hidden ${className}`}>
      <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
        {/* Album Artwork: 100% Uncropped Contain */}
        <div className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 aspect-square flex-shrink-0">
          <AlbumArtwork
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            aspectRatio="square"
            rounded="rounded-2xl"
            showGlow={true}
            className="w-full h-full"
            imgClassName={isPlaying ? 'scale-105' : ''}
          />
        </div>

        {/* Track Info & Controls */}
        <div className="flex-1 w-full flex flex-col justify-center space-y-4 text-center md:text-left">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#170D24] border border-[#352044] text-[10px] font-bold text-[#E51D87] mb-2">
              <Disc3 className={`w-3 h-3 ${isPlaying ? 'animate-spin-slow' : ''}`} />
              <span>VIBE AUDIO STUDIO</span>
            </div>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight truncate">
              {currentTrack.title}
            </h3>
            <p className="text-base text-[#E51D87] font-semibold mt-0.5 truncate">
              {currentTrack.artist}
            </p>
            {currentTrack.album && (
              <p className="text-xs text-[#B7A6C8] mt-0.5 truncate">
                Album: {currentTrack.album}
              </p>
            )}
          </div>

          {/* Visualizer */}
          {showVisualizer && (
            <div className="py-2 px-3 glass-card rounded-xl flex items-center justify-between gap-4 max-w-sm mx-auto md:mx-0">
              <span className="text-[10px] uppercase font-bold text-purple-400">Spectrum</span>
              <AudioVisualizer barCount={24} height={20} />
            </div>
          )}

          {/* Progress Seek Bar */}
          <div className="w-full space-y-1">
            <div
              className="w-full h-2 bg-[#090510] rounded-full overflow-hidden border border-[#352044] cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                seek(pos * duration);
              }}
            >
              <div
                className="h-full bg-gradient-to-r from-[#A020F0] to-[#E51D87] rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-mono text-[#B7A6C8]">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Buttons Row */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={toggleShuffle}
              className={`p-2 rounded-full transition-colors ${
                isShuffle ? 'text-[#E51D87] bg-[#E51D87]/20' : 'text-[#B7A6C8] hover:text-white'
              }`}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={prevTrack}
                className="p-2 text-slate-300 hover:text-white transition-colors"
                title="Previous Track"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#A020F0] to-[#E51D87] text-white flex items-center justify-center shadow-lg shadow-[#A020F0]/40 hover:scale-105 active:scale-95 transition-all"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <button
                onClick={nextTrack}
                className="p-2 text-slate-300 hover:text-white transition-colors"
                title="Next Track"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleLike}
                className="p-2 text-[#B7A6C8] hover:text-[#E51D87] transition-colors"
                title={isLiked ? 'Unlike' : 'Like'}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#E51D87] text-[#E51D87]' : ''}`} />
              </button>

              <button
                onClick={cycleRepeat}
                className={`p-2 rounded-full transition-colors ${
                  repeatMode !== 'off' ? 'text-[#E51D87] bg-[#E51D87]/20' : 'text-[#B7A6C8] hover:text-white'
                }`}
                title={`Repeat: ${repeatMode}`}
              >
                {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;

