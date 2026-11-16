import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
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
  ListMusic,
  Disc3,
  Share2,
  Plus,
  FileText,
  ArrowLeft,
  Check,
  Activity,
  Sliders,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext.js';
import { useAuth } from '../context/AuthContext.js';
import { favoriteApi } from '../services/api.js';
import { localMusicStorage } from '../services/localMusicStorage.js';
import { AudioVisualizer } from '../components/player/AudioVisualizer.js';
import { AddToPlaylistModal } from '../components/music/AddToPlaylistModal.js';
import { VibeLogo } from '../components/common/VibeLogo.js';
import { AlbumArtwork } from '../components/common/AlbumArtwork.js';

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const MusicPlayerPage: React.FC = () => {
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
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    playTrack,
  } = usePlayer();

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'player' | 'queue' | 'lyrics'>('player');
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isLikeLoading, setIsLikeLoading] = useState<boolean>(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  // Sync like status from local storage and server
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

  const handleShare = () => {
    if (!currentTrack) return;
    const shareUrl = `${window.location.origin}/search?q=${encodeURIComponent(currentTrack.title)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 2200);
      });
    }
  };

  // Safe navigation back to previous route with fallback to Home
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const progressPercentage = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  // Empty State
  if (!currentTrack) {
    return (
      <div className="w-full max-w-full overflow-x-hidden min-h-[75vh] flex flex-col items-center justify-center text-center px-4 py-8 animate-fadeIn box-border">
        <div className="w-20 h-20 rounded-3xl bg-[#170D24] border border-[#352044] flex items-center justify-center mb-4 shadow-xl">
          <Disc3 className="w-10 h-10 text-[#A020F0] animate-spin-slow" />
        </div>
        <h2 className="text-2xl font-black text-white">No Track Playing</h2>
        <p className="text-sm text-[#B7A6C8] max-w-xs sm:max-w-sm mt-1.5 leading-relaxed">
          Pick any song from Home, Trending, Top Charts or Search to start listening.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-6 py-3 rounded-full bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white font-bold text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all min-h-[44px]"
        >
          Explore Music
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden min-w-0 box-border px-3 sm:px-6 py-2 sm:py-6 pb-36 lg:pb-24 animate-fadeIn">
      {/* 
        CONTAINER:
        Mobile view follows strictly the requested 10-step layout order.
        Desktop view (lg+) retains studio two-column layout.
      */}
      <div className="w-full max-w-4xl mx-auto glass-panel rounded-3xl border border-[#352044] p-3 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden box-border">
        {/* Ambient Glow */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none blur-3xl scale-125"
          style={{
            backgroundImage: `url(${currentTrack.coverUrl})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
        />

        <div className="relative z-10 w-full min-w-0 flex flex-col">
          {/* ========================================================= */}
          {/* 1. MOBILE HEADER WITH BACK BUTTON & 2. COMPACT VIBE LOGO  */}
          {/* ========================================================= */}
          <div className="w-full flex items-center justify-between gap-2 min-w-0 pb-3 border-b border-[#352044]/60">
            {/* Top-Left: Back Button */}
            <button
              onClick={handleBack}
              className="flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#170D24] border border-[#352044] hover:border-[#A020F0] text-white hover:bg-[#231338] transition-all flex-shrink-0 shadow-md active:scale-95"
              title="Back"
              aria-label="Back to previous page"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>

            {/* Center: Compact VIBE MUSIC Logo (preserves original aspect ratio) */}
            <div className="flex-shrink-0 flex items-center justify-center">
              <VibeLogo size="xs" />
            </div>

            {/* Top-Right: Action Icons (Like, Share, Queue / Tabs) */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <button
                onClick={handleLikeToggle}
                className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-full border flex items-center justify-center transition-all ${
                  isLiked
                    ? 'bg-[#E51D87]/20 border-[#E51D87] text-[#E51D87]'
                    : 'bg-[#170D24] border-[#352044] text-[#B7A6C8] hover:text-white'
                }`}
                title={isLiked ? 'Unlike' : 'Like Song'}
                aria-label="Like song"
              >
                <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isLiked ? 'fill-[#E51D87]' : ''}`} />
              </button>

              <button
                onClick={handleShare}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#170D24] border border-[#352044] hover:border-[#A020F0] text-[#B7A6C8] hover:text-white flex items-center justify-center transition-all"
                title="Share Song Link"
                aria-label="Share song"
              >
                {copiedToast ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>

              <button
                onClick={() => setActiveTab(activeTab === 'queue' ? 'player' : 'queue')}
                className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-full border flex items-center justify-center transition-all ${
                  activeTab === 'queue'
                    ? 'bg-[#A020F0] text-white border-[#A020F0]'
                    : 'bg-[#170D24] border-[#352044] text-[#B7A6C8] hover:text-white'
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
          <div className="w-full text-center py-2 min-w-0">
            <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-widest text-[#E51D87] whitespace-nowrap overflow-hidden text-ellipsis block max-w-full">
              NOW PLAYING
            </span>
          </div>

          {/* If Queue or Lyrics tab active on mobile */}
          {activeTab === 'queue' && (
            <div className="w-full my-3 p-3 rounded-2xl bg-[#090510]/90 border border-[#352044] max-h-72 overflow-y-auto space-y-1.5 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-[#352044] text-xs font-bold text-white">
                <span>Play Queue ({queue.length})</span>
                <button
                  onClick={() => setActiveTab('player')}
                  className="text-xs text-[#E51D87] hover:underline"
                >
                  Close Queue
                </button>
              </div>
              {queue.map((track, idx) => (
                <div
                  key={`${track.id}-${idx}`}
                  onClick={() => playTrack(track)}
                  className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                    idx === queueIndex
                      ? 'bg-[#A020F0]/25 border border-[#A020F0]/50 text-white'
                      : 'bg-[#170D24]/60 hover:bg-[#170D24] text-[#B7A6C8]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden min-w-0 flex-1">
                    <span className="w-4 text-[10px] font-mono text-center text-[#B7A6C8]">{idx + 1}</span>
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
                      <p className="text-xs font-bold text-white truncate">{track.title}</p>
                      <p className="text-[10px] text-[#B7A6C8] truncate">{track.artist}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 ml-2 flex-shrink-0">
                    {formatTime(track.duration)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'player' && (
            <>
              {/* ========================================================= */}
              {/* 4. ALBUM ARTWORK: object-fit contain, aspect 1/1, centered */}
              {/* ========================================================= */}
              <div className="w-full flex justify-center items-center my-3 sm:my-5">
                <div
                  className="relative aspect-square rounded-3xl overflow-hidden border-2 border-[#352044] shadow-[0_0_45px_rgba(160,32,240,0.35)] bg-[#090510] flex items-center justify-center transition-all group"
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
              <div className="w-full max-w-md mx-auto text-center px-3 my-2.5 min-w-0">
                {/* Song Title: Ellipsis, single line */}
                <h1
                  className="text-lg sm:text-2xl md:text-3xl font-black text-white leading-tight whitespace-nowrap overflow-hidden text-ellipsis w-full block tracking-tight"
                  title={currentTrack.title}
                >
                  {currentTrack.title}
                </h1>

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
              {/* 9. SOUND SPECTRUM (Responsive, animated, full container)  */}
              {/* ========================================================= */}
              <div className="w-full max-w-md mx-auto my-2 p-2.5 sm:p-3 rounded-2xl bg-[#090510]/80 border border-[#352044] flex flex-col items-center justify-center overflow-hidden box-border">
                <div className="w-full flex items-center justify-between text-[10px] font-mono text-[#B7A6C8] mb-1 px-1">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-semibold whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE SPECTRUM
                  </span>
                  <span className="whitespace-nowrap font-semibold">320kbps Hi-Fi</span>
                </div>
                <AudioVisualizer barCount={32} height={28} className="w-full max-w-full" />
              </div>

              {/* ========================================================= */}
              {/* 10. PLAYBACK PROGRESS (Touch-friendly seek bar)           */}
              {/* ========================================================= */}
              <div className="w-full max-w-md mx-auto px-1 sm:px-2 my-2 min-w-0 box-border">
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
                  <div className="w-full h-2 bg-[#090510] rounded-full overflow-hidden border border-[#352044]">
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

              {/* ========================================================= */}
              {/* 11. PLAYBACK CONTROLS (Shuffle, Prev, Play/Pause, Next,   */}
              {/*     Repeat - 44px min touch targets, evenly distributed)  */}
              {/* ========================================================= */}
              <div className="w-full max-w-md mx-auto flex items-center justify-between gap-1 sm:gap-2 my-2 px-1 select-none">
                {/* Shuffle Button */}
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

                {/* Previous Button */}
                <button
                  onClick={prevTrack}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-slate-200 hover:text-white hover:bg-[#170D24] transition-all active:scale-95"
                  title="Previous Track"
                  aria-label="Previous track"
                >
                  <SkipBack className="w-6 h-6" />
                </button>

                {/* Main Play / Pause Button (Centered, 56px-64px, touch-friendly) */}
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

                {/* Next Button */}
                <button
                  onClick={nextTrack}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-slate-200 hover:text-white hover:bg-[#170D24] transition-all active:scale-95"
                  title="Next Track"
                  aria-label="Next track"
                >
                  <SkipForward className="w-6 h-6" />
                </button>

                {/* Repeat Button */}
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

              {/* Secondary Actions: Add to Playlist & Volume */}
              <div className="w-full max-w-md mx-auto flex items-center justify-between pt-3 mt-2 border-t border-[#352044]/50 px-2 min-w-0">
                {isAuthenticated && (
                  <button
                    onClick={() => setShowAddToPlaylist(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#170D24] border border-[#352044] hover:border-[#A020F0] text-xs font-semibold text-[#B7A6C8] hover:text-white transition-all min-h-[36px]"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#A020F0]" />
                    <span>Add to Playlist</span>
                  </button>
                )}

                {/* Volume Slider (Compact & Accessible) */}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={toggleMute}
                    className="text-[#B7A6C8] hover:text-white p-1 min-w-[32px] min-h-[32px] flex items-center justify-center"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.02"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-16 sm:w-24 h-1.5 accent-[#A020F0] bg-[#090510] rounded-lg cursor-pointer"
                    aria-label="Volume slider"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add To Playlist Modal */}
      {showAddToPlaylist && currentTrack && (
        <AddToPlaylistModal
          track={currentTrack}
          isOpen={showAddToPlaylist}
          onClose={() => setShowAddToPlaylist(false)}
        />
      )}
    </div>
  );
};
