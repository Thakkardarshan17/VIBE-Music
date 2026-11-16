import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Maximize2,
  Tv,
} from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { favoriteApi } from '../../services/api.js';
import { localMusicStorage } from '../../services/localMusicStorage.js';
import { AudioVisualizer } from './AudioVisualizer.js';
import { VibeLogo } from '../common/VibeLogo.js';
import { AlbumArtwork } from '../common/AlbumArtwork.js';

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const MiniPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    activePlaybackMode,
    isVideoVisible,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    setIsFullScreenOpen,
    toggleVideoVisible,
  } = usePlayer();

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isLikeLoading, setIsLikeLoading] = useState<boolean>(false);

  // Check liked status from local storage & server
  useEffect(() => {
    if (!currentTrack) {
      setIsLiked(false);
      return;
    }

    const checkStatus = () => {
      const localStatus = localMusicStorage.isSongLiked(currentTrack.id);
      setIsLiked(localStatus);

      if (isAuthenticated) {
        favoriteApi
          .check(currentTrack.id)
          .then((serverLiked) => {
            if (serverLiked !== localStatus) {
              setIsLiked(serverLiked);
            }
          })
          .catch(() => {});
      }
    };

    checkStatus();

    const handleUpdate = (e: any) => {
      if (e.detail?.trackId === currentTrack.id) {
        setIsLiked(e.detail.isLiked);
      } else {
        setIsLiked(localMusicStorage.isSongLiked(currentTrack.id));
      }
    };

    window.addEventListener('vibe_favorites_updated', handleUpdate);
    return () => window.removeEventListener('vibe_favorites_updated', handleUpdate);
  }, [currentTrack, isAuthenticated]);

  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentTrack || isLikeLoading) return;
    setIsLikeLoading(true);
    try {
      const newStatus = await localMusicStorage.toggleLikeSong(currentTrack, isAuthenticated);
      setIsLiked(newStatus);
    } catch (e) {
      console.warn(e);
    } finally {
      setIsLikeLoading(false);
    }
  };

  if (!currentTrack) return null;

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-[calc(62px+env(safe-area-inset-bottom,0px))] lg:bottom-0 left-2.5 right-2.5 lg:left-0 lg:right-0 z-40 rounded-2xl lg:rounded-none bg-[#150a22]/95 lg:bg-[#12091D]/95 backdrop-blur-2xl border border-[#352044] px-2.5 sm:px-4 md:px-6 py-2 md:py-2.5 transition-all shadow-[0_10px_35px_rgba(0,0,0,0.85)] select-none">
      {/* Top Touch Scrub Line with Rounded Corners on Mobile */}
      <div
        className="absolute top-0 left-0 right-0 h-1 bg-[#090510] rounded-t-2xl lg:rounded-none overflow-hidden cursor-pointer group hover:h-1.5 transition-all"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickPos = (e.clientX - rect.left) / rect.width;
          seek(clickPos * duration);
        }}
      >
        <div
          className="h-full bg-gradient-to-r from-[#A020F0] to-[#E51D87] relative transition-all"
          style={{ width: `${progressPercentage}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 md:gap-4 mt-0.5">
        {/* Left: Thumbnail & Track Info - Tapping opens full player */}
        <div
          onClick={() => setIsFullScreenOpen(true)}
          className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1 cursor-pointer"
        >
          <div className="relative group w-11 h-11 sm:w-14 sm:h-14 min-w-[44px] min-h-[44px] sm:min-w-[56px] sm:min-h-[56px] max-w-[56px] max-h-[56px] rounded-xl overflow-hidden flex-shrink-0 shadow-md border border-[#352044] bg-[#090510]">
            <AlbumArtwork
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              aspectRatio="square"
              rounded="rounded-xl"
              className="w-full h-full object-cover"
              imgClassName={isPlaying ? 'ring-2 ring-[#A020F0]' : ''}
            />
            <div className="absolute inset-0 z-20 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Maximize2 className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <div className="min-w-0 flex-1 overflow-hidden">
            <h4 className="font-bold text-xs sm:text-sm text-white truncate hover:text-purple-300 transition-colors leading-tight">
              {currentTrack.title}
            </h4>
            <p className="text-[11px] sm:text-xs text-[#B7A6C8] truncate mt-0.5 font-medium">
              {currentTrack.artist}
            </p>
            <div className="hidden sm:flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-emerald-400 whitespace-nowrap shrink-0">
                FULL SONG
              </span>
              {currentTrack.album && (
                <span className="text-[9px] font-medium px-1.5 py-0.2 rounded-full bg-[#170D24] border border-[#352044] text-[#B7A6C8] truncate max-w-[120px] whitespace-nowrap">
                  {currentTrack.album}
                </span>
              )}
            </div>
          </div>

          {/* Desktop Like Button */}
          <button
            onClick={handleLikeToggle}
            className="hidden sm:block p-1.5 text-[#B7A6C8] hover:text-[#E51D87] transition-colors flex-shrink-0 min-h-[36px]"
            title={isLiked ? 'Unlike' : 'Like'}
          >
            <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isLiked ? 'fill-[#E51D87] text-[#E51D87]' : ''}`} />
          </button>
        </div>

        {/* Center: Controls & Time Scrub Bar (Desktop & Tablet) */}
        <div className="hidden sm:flex flex-col items-center flex-1 max-w-xl px-2">
          {/* Buttons Row */}
          <div className="flex items-center gap-4 mb-1">
            <button
              onClick={toggleShuffle}
              className={`p-1.5 rounded-full transition-colors ${
                isShuffle ? 'text-[#E51D87] bg-[#E51D87]/20' : 'text-[#B7A6C8] hover:text-white'
              }`}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={prevTrack}
              className="p-1.5 text-slate-300 hover:text-white transition-colors"
              title="Previous"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#A020F0] to-[#E51D87] text-white flex items-center justify-center shadow-lg shadow-[#A020F0]/40 hover:scale-105 active:scale-95 transition-all"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <button
              onClick={nextTrack}
              className="p-1.5 text-slate-300 hover:text-white transition-colors"
              title="Next"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            <button
              onClick={cycleRepeat}
              className={`p-1.5 rounded-full transition-colors ${
                repeatMode !== 'off' ? 'text-[#E51D87] bg-[#E51D87]/20' : 'text-[#B7A6C8] hover:text-white'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            </button>
          </div>

          {/* Scrub Slider & Times */}
          <div className="w-full flex items-center gap-3 text-xs font-mono text-[#B7A6C8]">
            <span className="w-10 text-right">{formatTime(currentTime)}</span>
            <div className="relative flex-1 flex items-center">
              <input
                type="range"
                min="0"
                max={duration > 0 ? duration : 240}
                value={currentTime}
                onChange={(e) => seek(parseFloat(e.target.value))}
                className="w-full h-1.5 accent-[#E51D87] bg-[#090510] rounded-lg cursor-pointer"
              />
            </div>
            <span className="w-10 text-left">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Mobile Right Controls: Like, Play/Pause, Next */}
        <div className="flex sm:hidden items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleLikeToggle}
            className="p-2 text-[#B7A6C8] hover:text-[#E51D87] active:scale-90 transition-all min-h-[40px] min-w-[40px] flex items-center justify-center"
            title={isLiked ? 'Unlike' : 'Like'}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#E51D87] text-[#E51D87]' : ''}`} />
          </button>

          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#A020F0] to-[#E51D87] text-white flex items-center justify-center shadow-lg shadow-[#A020F0]/40 active:scale-90 transition-transform flex-shrink-0"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>

          <button
            onClick={nextTrack}
            className="p-2 text-slate-300 hover:text-white active:scale-90 transition-all min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Next Track"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop Right Tools: Video, Volume, Fullscreen */}
        <div className="hidden sm:flex items-center gap-3 min-w-[160px] justify-end">
          <div className="hidden 2xl:block opacity-75 hover:opacity-100 transition-opacity">
            <VibeLogo size="xs" glow={false} />
          </div>

          <div className="hidden xl:block">
            <AudioVisualizer barCount={16} height={18} />
          </div>

          <button
            onClick={toggleVideoVisible}
            className={`p-2 rounded-lg border transition-colors ${
              isVideoVisible
                ? 'bg-[#A020F0]/40 text-purple-300 border-[#A020F0]'
                : 'text-[#B7A6C8] border-transparent hover:text-white'
            }`}
            title={isVideoVisible ? 'Hide Music Video' : 'Watch Music Video'}
          >
            <Tv className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="text-[#B7A6C8] hover:text-white transition-colors">
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 md:w-20 h-1.5 accent-[#A020F0] bg-[#090510] rounded-lg cursor-pointer"
            />
          </div>

          <button
            onClick={() => setIsFullScreenOpen(true)}
            className="p-2 text-[#B7A6C8] hover:text-[#E51D87] hover:bg-[#170D24] rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Full Screen Player"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
