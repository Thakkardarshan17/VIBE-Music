import React, { useState, useEffect } from 'react';
import {
  X,
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
  ListMusic,
  Disc3,
  FileText,
  Share2,
  Check,
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

export const FullScreenPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    queue,
    queueIndex,
    isFullScreenOpen,
    setIsFullScreenOpen,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    playTrack,
    removeFromQueue,
    isVideoVisible,
    toggleVideoVisible,
  } = usePlayer();

  const { isAuthenticated } = useAuth();
  const [activePanel, setActivePanel] = useState<'none' | 'queue' | 'lyrics'>('none');
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!currentTrack) {
      setIsLiked(false);
      return;
    }

    const localStatus = localMusicStorage.isSongLiked(currentTrack.id);
    setIsLiked(localStatus);

    if (isAuthenticated) {
      favoriteApi
        .check(currentTrack.id)
        .then((serverLiked) => {
          if (serverLiked !== localStatus) setIsLiked(serverLiked);
        })
        .catch(() => {});
    }

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

  const handleLikeToggle = async () => {
    if (!currentTrack) return;
    try {
      const newStatus = await localMusicStorage.toggleLikeSong(currentTrack, isAuthenticated);
      setIsLiked(newStatus);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleShare = () => {
    if (!currentTrack) return;
    const shareUrl = window.location.origin + `/search?q=${encodeURIComponent(currentTrack.title)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  if (!isFullScreenOpen || !currentTrack) return null;

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-[#090510] flex flex-col justify-between p-4 sm:p-6 md:p-10 overflow-y-auto animate-fadeIn select-none">
      {/* Background Ambient Glow */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none blur-3xl scale-125"
        style={{
          backgroundImage: `url(${currentTrack.coverUrl})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#12091D]/85 via-[#090510]/95 to-[#090510] pointer-events-none" />

      {/* Top Header Bar */}
      <div className="relative z-10 flex items-center justify-between max-w-6xl w-full mx-auto flex-shrink-0 mb-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <VibeLogo size="xs" />
          <div className="hidden xs:block border-l border-[#352044] pl-2.5">
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[#B7A6C8] font-bold block">
              Now Playing
            </span>
            <p className="text-xs sm:text-sm font-semibold text-white">Audio Studio</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Like Song Button (All Users) */}
          <button
            onClick={handleLikeToggle}
            className={`p-2.5 rounded-full border transition-all ${
              isLiked
                ? 'bg-[#E51D87]/25 border-[#E51D87] text-[#E51D87]'
                : 'bg-[#170D24] text-[#B7A6C8] border-[#352044] hover:text-white'
            }`}
            title={isLiked ? 'Unlike' : 'Like'}
          >
            <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isLiked ? 'fill-[#E51D87]' : ''}`} />
          </button>

          {/* Watch Music Video Button */}
          <button
            onClick={toggleVideoVisible}
            className={`p-2.5 rounded-full border transition-all ${
              isVideoVisible
                ? 'bg-[#A020F0] text-white border-[#A020F0] shadow-lg shadow-[#A020F0]/50'
                : 'bg-[#170D24] text-[#B7A6C8] border-[#352044] hover:text-white'
            }`}
            title={isVideoVisible ? 'Hide Music Video' : 'Watch Music Video'}
          >
            <Tv className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={handleShare}
            className="p-2.5 rounded-full bg-[#170D24] text-[#B7A6C8] border border-[#352044] hover:text-white transition-all"
            title="Share Song"
          >
            {copied ? <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" /> : <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          <button
            onClick={() => setActivePanel(activePanel === 'lyrics' ? 'none' : 'lyrics')}
            className={`p-2.5 rounded-full border transition-all ${
              activePanel === 'lyrics'
                ? 'bg-[#A020F0] text-white border-[#A020F0]'
                : 'bg-[#170D24] text-[#B7A6C8] border-[#352044] hover:text-white'
            }`}
            title="Lyrics"
          >
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={() => setActivePanel(activePanel === 'queue' ? 'none' : 'queue')}
            className={`p-2.5 rounded-full border transition-all ${
              activePanel === 'queue'
                ? 'bg-[#A020F0] text-white border-[#A020F0]'
                : 'bg-[#170D24] text-[#B7A6C8] border-[#352044] hover:text-white'
            }`}
            title="Toggle Queue"
          >
            <ListMusic className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={() => setIsFullScreenOpen(false)}
            className="p-2.5 rounded-full bg-[#170D24] text-[#B7A6C8] border border-[#352044] hover:text-white transition-all"
            title="Close Full Screen"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-8 md:gap-12 max-w-6xl w-full mx-auto my-auto py-2">
        {activePanel === 'none' && (
          <>
            {/* Artwork Section: 100% Full Uncropped Contain */}
            <div className="relative group w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 aspect-square flex items-center justify-center flex-shrink-0">
              <div
                className={`w-full h-full rounded-3xl overflow-hidden border-2 border-[#352044] shadow-[0_0_50px_rgba(160,32,240,0.35)] relative bg-[#090510] ${
                  isPlaying ? 'ring-4 ring-[#E51D87]/40' : ''
                }`}
              >
                <AlbumArtwork
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  aspectRatio="square"
                  rounded="rounded-3xl"
                  showGlow={true}
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* Track Info & Visualizer */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left max-w-md w-full">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#170D24] border border-[#352044] text-[#B7A6C8] text-xs font-medium mb-2 sm:mb-3">
                <Disc3 className={`w-3.5 h-3.5 ${isPlaying ? 'animate-spin-slow' : ''}`} />
                <span className="text-[10px] font-bold text-purple-300">STUDIO MASTER</span>
                <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-emerald-400 whitespace-nowrap shrink-0">
                  FULL SONG
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight line-clamp-2">
                {currentTrack.title}
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-[#E51D87] font-semibold mt-1">
                {currentTrack.artist}
              </p>
              <p className="text-xs sm:text-sm text-[#B7A6C8] mt-1">
                Album: {currentTrack.album || 'Single'}
              </p>

              {/* Reactive Visualizer */}
              <div className="w-full mt-4 sm:mt-6 py-2.5 sm:py-3 px-3 sm:px-4 glass-card rounded-2xl flex items-center justify-between gap-4">
                <span className="text-[10px] sm:text-xs uppercase tracking-wider text-[#A020F0] font-bold">Sound Spectrum</span>
                <AudioVisualizer barCount={32} height={28} />
              </div>
            </div>
          </>
        )}

        {/* Panel: Queue */}
        {activePanel === 'queue' && (
          <div className="w-full max-w-2xl h-full max-h-[460px] glass-panel rounded-3xl p-5 sm:p-6 flex flex-col border border-[#352044] animate-fadeIn">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <ListMusic className="w-5 h-5 text-[#A020F0]" />
              Playing Queue ({queue.length})
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {queue.map((track, idx) => (
                <div
                  key={`${track.id}-${idx}`}
                  onClick={() => playTrack(track)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                    idx === queueIndex
                      ? 'bg-[#A020F0]/25 border border-[#A020F0]/50 text-white'
                      : 'hover:bg-[#170D24] text-[#B7A6C8]'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="w-5 text-xs text-[#A020F0] font-mono text-center">{idx + 1}</span>
                    <div className="w-9 h-9 flex-shrink-0">
                      <AlbumArtwork
                        src={track.coverUrl}
                        alt={track.title}
                        aspectRatio="square"
                        rounded="rounded-lg"
                        className="w-9 h-9"
                      />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-semibold text-xs sm:text-sm truncate text-white">{track.title}</p>
                      <p className="text-[11px] text-[#B7A6C8] truncate">{track.artist}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400">{formatTime(track.duration)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromQueue(idx);
                      }}
                      className="text-slate-500 hover:text-red-400 p-1"
                      title="Remove from queue"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Panel: Lyrics */}
        {activePanel === 'lyrics' && (
          <div className="w-full max-w-2xl h-full max-h-[460px] glass-panel rounded-3xl p-6 flex flex-col border border-[#352044] animate-fadeIn text-center overflow-y-auto">
            <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-[#E51D87]" /> Lyrics
            </h3>
            <div className="space-y-4 text-sm sm:text-base text-[#B7A6C8] my-auto py-6">
              <p className="text-white font-bold text-lg">{currentTrack.title}</p>
              <p className="text-[#E51D87] font-semibold">{currentTrack.artist}</p>
              <p className="pt-4">Turn up the volume, feel the bass drop low</p>
              <p className="text-white font-bold">Every beat, every note, letting the rhythm flow</p>
              <p>Streaming high fidelity across the night</p>
              <p>VIBE Music keeping the energy bright.</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="relative z-10 max-w-4xl w-full mx-auto flex flex-col gap-3 sm:gap-4 flex-shrink-0 mt-4">
        {/* Seek Bar */}
        <div>
          <div
            className="w-full h-3 flex items-center cursor-pointer relative group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickPos = (e.clientX - rect.left) / rect.width;
              seek(clickPos * duration);
            }}
          >
            <div className="w-full h-2 bg-[#170D24] rounded-full overflow-hidden border border-[#352044]">
              <div
                className="h-full bg-gradient-to-r from-[#A020F0] to-[#E51D87] rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between text-xs font-mono text-[#B7A6C8] mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between">
          <button
            onClick={toggleShuffle}
            className={`p-2.5 sm:p-3 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
              isShuffle ? 'text-[#E51D87] bg-[#E51D87]/20' : 'text-[#B7A6C8] hover:text-white'
            }`}
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={prevTrack}
              className="p-2 sm:p-3 text-slate-300 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Previous Track"
            >
              <SkipBack className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>

            <button
              onClick={togglePlay}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-[#A020F0] to-[#E51D87] text-white flex items-center justify-center shadow-lg shadow-[#A020F0]/40 hover:scale-105 active:scale-95 transition-all min-h-[44px]"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 sm:w-8 sm:h-8 fill-current" />
              ) : (
                <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current ml-1" />
              )}
            </button>

            <button
              onClick={nextTrack}
              className="p-2 sm:p-3 text-slate-300 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Next Track"
            >
              <SkipForward className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={cycleRepeat}
              className={`p-2.5 sm:p-3 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                repeatMode !== 'off' ? 'text-[#E51D87] bg-[#E51D87]/20' : 'text-[#B7A6C8] hover:text-white'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Repeat className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <button onClick={toggleMute} className="text-[#B7A6C8] hover:text-white">
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 md:w-24 h-1.5 accent-[#A020F0] bg-[#170D24] rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
