import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
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
          if (typeof serverLiked === 'boolean' && serverLiked !== localStatus) {
            setIsLiked(serverLiked);
          }
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
    const shareUrl = `${window.location.origin}/search?q=${encodeURIComponent(currentTrack.title)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  if (!isFullScreenOpen || !currentTrack) return null;

  const progressPercentage = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-[#090510] flex flex-col justify-between p-3 sm:p-6 md:p-8 overflow-y-auto overflow-x-hidden animate-fadeIn select-none box-border w-full max-w-full pb-safe">
      {/* Background Ambient Glow */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none blur-3xl scale-125"
        style={{
          backgroundImage: `url(${currentTrack.coverUrl})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#12091D]/90 via-[#090510]/95 to-[#090510] pointer-events-none" />

      {/* ========================================================= */}
      {/* 1. MOBILE HEADER WITH BACK BUTTON, LOGO & ACTIONS         */}
      {/* ========================================================= */}
      <div className="relative z-10 w-full max-w-2xl mx-auto flex items-center justify-between gap-2 flex-shrink-0 mb-2 pb-2 border-b border-[#352044]/60">
        {/* Back Button with Left Arrow */}
        <button
          onClick={() => setIsFullScreenOpen(false)}
          className="flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#170D24] border border-[#352044] hover:border-[#A020F0] text-white hover:bg-[#231338] transition-all flex-shrink-0 shadow-md active:scale-95"
          title="Back to Previous Page"
          aria-label="Back to previous page"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        {/* Compact VIBE MUSIC Logo (Aspect ratio preserved) */}
        <div className="flex-shrink-0 flex items-center justify-center">
          <VibeLogo size="xs" />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <button
            onClick={handleLikeToggle}
            className={`w-10 h-10 min-w-[40px] min-h-[40px] sm:w-11 sm:h-11 sm:min-w-[44px] sm:min-h-[44px] rounded-full border flex items-center justify-center transition-all ${
              isLiked
                ? 'bg-[#E51D87]/25 border-[#E51D87] text-[#E51D87]'
                : 'bg-[#170D24] text-[#B7A6C8] border-[#352044] hover:text-white'
            }`}
            title={isLiked ? 'Unlike' : 'Like'}
            aria-label="Like song"
          >
            <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isLiked ? 'fill-[#E51D87]' : ''}`} />
          </button>

          <button
            onClick={toggleVideoVisible}
            className={`w-10 h-10 min-w-[40px] min-h-[40px] sm:w-11 sm:h-11 sm:min-w-[44px] sm:min-h-[44px] rounded-full border flex items-center justify-center transition-all ${
              isVideoVisible
                ? 'bg-[#A020F0] text-white border-[#A020F0] shadow-md shadow-[#A020F0]/50'
                : 'bg-[#170D24] text-[#B7A6C8] border-[#352044] hover:text-white'
            }`}
            title={isVideoVisible ? 'Hide Music Video' : 'Watch Music Video'}
            aria-label="Toggle music video"
          >
            <Tv className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={handleShare}
            className="w-10 h-10 min-w-[40px] min-h-[40px] sm:w-11 sm:h-11 sm:min-w-[44px] sm:min-h-[44px] rounded-full bg-[#170D24] text-[#B7A6C8] border border-[#352044] hover:text-white flex items-center justify-center transition-all"
            title="Share Song"
            aria-label="Share song"
          >
            {copied ? <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" /> : <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          <button
            onClick={() => setActivePanel(activePanel === 'queue' ? 'none' : 'queue')}
            className={`w-10 h-10 min-w-[40px] min-h-[40px] sm:w-11 sm:h-11 sm:min-w-[44px] sm:min-h-[44px] rounded-full border flex items-center justify-center transition-all ${
              activePanel === 'queue'
                ? 'bg-[#A020F0] text-white border-[#A020F0]'
                : 'bg-[#170D24] text-[#B7A6C8] border-[#352044] hover:text-white'
            }`}
            title="Queue"
            aria-label="Toggle queue"
          >
            <ListMusic className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. NOW PLAYING LABEL (Single line, centered, no break)    */}
      {/* ========================================================= */}
      <div className="relative z-10 w-full text-center py-1 flex-shrink-0 min-w-0">
        <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-widest text-[#E51D87] whitespace-nowrap overflow-hidden text-ellipsis block max-w-full">
          NOW PLAYING
        </span>
      </div>

      {/* ========================================================= */}
      {/* MAIN BODY                                                 */}
      {/* ========================================================= */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto my-auto min-w-0">
        {/* Panel: Queue */}
        {activePanel === 'queue' && (
          <div className="w-full max-h-[380px] sm:max-h-[440px] glass-panel rounded-3xl p-4 flex flex-col border border-[#352044] animate-fadeIn my-2">
            <div className="flex items-center justify-between pb-2 border-b border-[#352044] text-xs font-bold text-white mb-2">
              <span className="flex items-center gap-1.5">
                <ListMusic className="w-4 h-4 text-[#A020F0]" />
                Playing Queue ({queue.length})
              </span>
              <button
                onClick={() => setActivePanel('none')}
                className="text-xs text-[#E51D87] hover:underline"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {queue.map((track, idx) => (
                <div
                  key={`${track.id}-${idx}`}
                  onClick={() => playTrack(track)}
                  className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                    idx === queueIndex
                      ? 'bg-[#A020F0]/25 border border-[#A020F0]/50 text-white'
                      : 'hover:bg-[#170D24] text-[#B7A6C8]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden min-w-0 flex-1">
                    <span className="w-4 text-[10px] text-[#A020F0] font-mono text-center">{idx + 1}</span>
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-[#090510]">
                      <AlbumArtwork
                        src={track.coverUrl}
                        alt={track.title}
                        aspectRatio="square"
                        rounded="rounded-lg"
                        className="w-full h-full"
                      />
                    </div>
                    <div className="truncate min-w-0 flex-1">
                      <p className="font-semibold text-xs truncate text-white">{track.title}</p>
                      <p className="text-[10px] text-[#B7A6C8] truncate">{track.artist}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-[10px] font-mono text-slate-400">{formatTime(track.duration)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromQueue(idx);
                      }}
                      className="text-slate-500 hover:text-red-400 p-1"
                      title="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Panel: Lyrics */}
        {activePanel === 'lyrics' && (
          <div className="w-full max-h-[380px] sm:max-h-[440px] glass-panel rounded-3xl p-5 flex flex-col border border-[#352044] animate-fadeIn text-center overflow-y-auto my-2">
            <div className="flex items-center justify-between pb-2 border-b border-[#352044] text-xs font-bold text-white mb-2">
              <span className="flex items-center gap-1.5 text-[#E51D87]">
                <FileText className="w-4 h-4" /> Lyrics
              </span>
              <button
                onClick={() => setActivePanel('none')}
                className="text-xs text-[#E51D87] hover:underline"
              >
                Close
              </button>
            </div>
            <div className="space-y-3 text-xs sm:text-sm text-[#B7A6C8] my-auto py-4">
              <p className="text-white font-bold text-base truncate">{currentTrack.title}</p>
              <p className="text-[#E51D87] font-semibold text-xs truncate">{currentTrack.artist}</p>
              <p className="pt-2">Turn up the volume, feel the rhythm flow</p>
              <p className="text-white font-semibold">Every beat, every note, letting the music grow</p>
              <p>Streaming studio master clarity in HD</p>
              <p>VIBE Music keeping the energy free.</p>
            </div>
          </div>
        )}

        {/* Default Player View: Layout items 4 through 9 */}
        {activePanel === 'none' && (
          <>
            {/* ========================================================= */}
            {/* 4. ALBUM ARTWORK: object-fit contain, aspect 1/1, centered */}
            {/* ========================================================= */}
            <div className="w-full flex justify-center items-center my-2 sm:my-4">
              <div
                className="relative aspect-square rounded-3xl overflow-hidden border-2 border-[#352044] shadow-[0_0_40px_rgba(160,32,240,0.35)] bg-[#090510] flex items-center justify-center transition-all"
                style={{
                  width: 'min(65vw, 280px)',
                  maxWidth: '100%',
                  aspectRatio: '1 / 1',
                }}
              >
                <AlbumArtwork
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  aspectRatio="square"
                  rounded="rounded-3xl"
                  showGlow={true}
                  className="w-full h-full"
                  imgClassName={`object-contain transition-transform duration-700 ${
                    isPlaying ? 'scale-[1.03]' : ''
                  }`}
                />
              </div>
            </div>

            {/* ========================================================= */}
            {/* 5. AUDIO QUALITY & FULL SONG BADGES                       */}
            {/* ========================================================= */}
            <div className="w-full flex items-center justify-center flex-wrap gap-1.5 sm:gap-2 my-1 px-2 min-w-0">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-400 text-[10px] sm:text-[11px] font-extrabold tracking-wider whitespace-nowrap">
                FULL SONG
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-[10px] sm:text-[11px] font-semibold tracking-wider whitespace-nowrap">
                STUDIO MASTER
              </span>
              {currentTrack.genre && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#170D24] border border-[#352044] text-[#B7A6C8] text-[10px] sm:text-[11px] font-medium whitespace-nowrap truncate max-w-[140px]">
                  {currentTrack.genre}
                </span>
              )}
            </div>

            {/* ========================================================= */}
            {/* 6. SONG TITLE, 7. ARTIST NAME, 8. ALBUM NAME (No breaks)  */}
            {/* ========================================================= */}
            <div className="w-full text-center px-3 my-2 min-w-0">
              {/* Song Title: Ellipsis on overflow, single line */}
              <h2
                className="text-lg sm:text-2xl font-black text-white leading-tight whitespace-nowrap overflow-hidden text-ellipsis w-full block tracking-tight"
                title={currentTrack.title}
              >
                {currentTrack.title}
              </h2>

              {/* Artist Name: Ellipsis, single line */}
              <p
                className="text-sm sm:text-base text-[#E51D87] font-bold mt-1 whitespace-nowrap overflow-hidden text-ellipsis w-full block"
                title={currentTrack.artist}
              >
                {currentTrack.artist}
              </p>

              {/* Album Name: Ellipsis, single line */}
              <p
                className="text-xs text-[#B7A6C8] mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis w-full block"
                title={currentTrack.album || 'Single'}
              >
                Album: {currentTrack.album || 'Single'}
              </p>
            </div>

            {/* ========================================================= */}
            {/* 9. SOUND SPECTRUM (Responsive, animated, full width)      */}
            {/* ========================================================= */}
            <div className="w-full my-2 p-2 sm:p-2.5 rounded-2xl bg-[#090510]/80 border border-[#352044] flex flex-col items-center justify-center overflow-hidden box-border">
              <div className="w-full flex items-center justify-between text-[10px] font-mono text-[#B7A6C8] mb-1 px-1">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE SPECTRUM
                </span>
                <span className="whitespace-nowrap font-semibold">320kbps Hi-Fi</span>
              </div>
              <AudioVisualizer barCount={30} height={26} className="w-full max-w-full" />
            </div>
          </>
        )}
      </div>

      {/* ========================================================= */}
      {/* 10. PLAYBACK PROGRESS & 11. CONTROLS                      */}
      {/* ========================================================= */}
      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col gap-2 flex-shrink-0 mt-2 min-w-0">
        {/* Seek Bar */}
        <div className="w-full px-1">
          <div
            className="w-full h-7 flex items-center cursor-pointer relative group touch-none select-none"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickPos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              seek(clickPos * duration);
            }}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              const rect = e.currentTarget.getBoundingClientRect();
              const touchPos = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
              seek(touchPos * duration);
            }}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={duration}
            aria-valuenow={currentTime}
            aria-label="Playback scrub bar"
          >
            <div className="w-full h-2 bg-[#170D24] rounded-full overflow-hidden border border-[#352044]">
              <div
                className="h-full bg-gradient-to-r from-[#A020F0] to-[#E51D87] rounded-full transition-all relative"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between text-[11px] font-mono text-[#B7A6C8] -mt-1 select-none">
            <span className="whitespace-nowrap">{formatTime(currentTime)}</span>
            <span className="whitespace-nowrap">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback Controls Row (44px min touch target, evenly spaced) */}
        <div className="w-full flex items-center justify-between gap-1 sm:gap-2 px-1 select-none">
          {/* Shuffle */}
          <button
            onClick={toggleShuffle}
            className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all ${
              isShuffle ? 'text-[#E51D87] bg-[#E51D87]/20 border border-[#E51D87]/50' : 'text-[#B7A6C8] hover:text-white'
            }`}
            title={isShuffle ? 'Shuffle On' : 'Shuffle Off'}
            aria-label="Toggle shuffle"
          >
            <Shuffle className="w-5 h-5" />
          </button>

          {/* Previous */}
          <button
            onClick={prevTrack}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-slate-200 hover:text-white hover:bg-[#170D24] transition-all active:scale-95"
            title="Previous Track"
            aria-label="Previous track"
          >
            <SkipBack className="w-6 h-6" />
          </button>

          {/* Centered Main Play / Pause Button */}
          <button
            onClick={togglePlay}
            className="w-14 h-14 sm:w-16 sm:h-16 min-w-[56px] min-h-[56px] rounded-full bg-gradient-to-tr from-[#A020F0] to-[#E51D87] text-white flex items-center justify-center shadow-lg shadow-[#A020F0]/50 hover:scale-105 active:scale-95 transition-all flex-shrink-0"
            title={isPlaying ? 'Pause' : 'Play'}
            aria-label={isPlaying ? 'Pause playback' : 'Start playback'}
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-current" />
            ) : (
              <Play className="w-7 h-7 fill-current ml-0.5" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={nextTrack}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-slate-200 hover:text-white hover:bg-[#170D24] transition-all active:scale-95"
            title="Next Track"
            aria-label="Next track"
          >
            <SkipForward className="w-6 h-6" />
          </button>

          {/* Repeat */}
          <button
            onClick={cycleRepeat}
            className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all ${
              repeatMode !== 'off'
                ? 'text-[#E51D87] bg-[#E51D87]/20 border border-[#E51D87]/50'
                : 'text-[#B7A6C8] hover:text-white'
            }`}
            title={`Repeat: ${repeatMode}`}
            aria-label="Cycle repeat mode"
          >
            {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
