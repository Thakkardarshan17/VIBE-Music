import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
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
  Radio,
  Share2,
  Plus,
  FileText,
  Sliders,
  Sparkles,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext.js';
import { useAuth } from '../context/AuthContext.js';
import { favoriteApi } from '../services/api.js';
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
    removeFromQueue,
  } = usePlayer();

  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'visualizer' | 'queue' | 'lyrics'>('visualizer');
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isLikeLoading, setIsLikeLoading] = useState<boolean>(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  useEffect(() => {
    if (!currentTrack || !isAuthenticated) {
      setIsLiked(false);
      return;
    }
    favoriteApi.check(currentTrack.id).then(setIsLiked).catch(() => setIsLiked(false));
  }, [currentTrack, isAuthenticated]);

  const handleLikeToggle = async () => {
    if (!currentTrack || !isAuthenticated || isLikeLoading) return;
    setIsLikeLoading(true);
    try {
      const res = await favoriteApi.toggle(currentTrack.id, currentTrack);
      setIsLiked(res.isFavorite);
    } catch (e) {
      console.warn(e);
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleShare = () => {
    if (!currentTrack) return;
    const shareUrl = window.location.origin + `/search?q=${encodeURIComponent(currentTrack.title)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 2500);
      });
    }
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!currentTrack) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 animate-fadeIn">
        <div className="w-20 h-20 rounded-3xl bg-[#170D24] border border-[#352044] flex items-center justify-center mb-4 shadow-xl">
          <Disc3 className="w-10 h-10 text-[#A020F0]" />
        </div>
        <h2 className="text-2xl font-black text-white">No Track Playing</h2>
        <p className="text-sm text-[#B7A6C8] max-w-sm mt-1">
          Pick any song from Home, Trending, Top Charts or Search to start listening.
        </p>
        <NavLink
          to="/"
          className="mt-6 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white font-bold text-sm shadow-lg hover:brightness-110 transition-all"
        >
          Explore Music
        </NavLink>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-6 px-3 sm:px-6 space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Top Bar with Back Link and Title */}
      <div className="flex items-center justify-between">
        <NavLink
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#B7A6C8] hover:text-white transition-colors py-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </NavLink>
        <VibeLogo size="xs" />
      </div>

      {/* Main Studio Card */}
      <div className="glass-panel rounded-3xl border border-[#352044] p-5 sm:p-8 lg:p-10 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none blur-3xl scale-125"
          style={{
            backgroundImage: `url(${currentTrack.coverUrl})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left: Artwork (100% Uncropped Contain) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 aspect-square rounded-3xl overflow-hidden border-2 border-[#352044] shadow-[0_0_50px_rgba(160,32,240,0.3)] relative group bg-[#090510]">
              <AlbumArtwork
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                aspectRatio="square"
                rounded="rounded-3xl"
                showGlow={true}
                className="w-full h-full"
                imgClassName={isPlaying ? 'scale-105' : ''}
              />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white z-20">
                <span className="font-extrabold px-2 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-400 text-[10px]">
                  FULL STREAM
                </span>
                <span className="text-[11px] font-semibold text-purple-300">
                  STUDIO MASTER
                </span>
              </div>
            </div>
          </div>

          {/* Right: Info, Tabs & Actions */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#170D24] border border-[#352044] text-[#B7A6C8]">
                  {currentTrack.genre || 'Soundtrack'}
                </span>
                <span className="text-xs text-[#B7A6C8]">Album: {currentTrack.album || 'Single'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight">
                {currentTrack.title}
              </h1>
              <p className="text-base sm:text-lg text-[#E51D87] font-semibold mt-1">
                {currentTrack.artist}
              </p>
            </div>

            {/* Quick Actions Row */}
            <div className="flex items-center gap-3">
              {isAuthenticated && (
                <button
                  onClick={handleLikeToggle}
                  className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 text-xs font-bold ${
                    isLiked
                      ? 'bg-[#E51D87]/20 border-[#E51D87] text-[#E51D87]'
                      : 'bg-[#090510]/80 border-[#352044] text-[#B7A6C8] hover:text-white'
                  }`}
                  title={isLiked ? 'Unlike' : 'Like Song'}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#E51D87]' : ''}`} />
                  <span>{isLiked ? 'Liked' : 'Like'}</span>
                </button>
              )}

              {isAuthenticated && (
                <button
                  onClick={() => setShowAddToPlaylist(true)}
                  className="p-2.5 rounded-xl bg-[#090510]/80 border border-[#352044] hover:border-[#A020F0] text-[#B7A6C8] hover:text-white transition-all flex items-center gap-2 text-xs font-bold"
                >
                  <Plus className="w-4 h-4 text-[#A020F0]" />
                  <span>Add to Playlist</span>
                </button>
              )}

              <button
                onClick={handleShare}
                className="p-2.5 rounded-xl bg-[#090510]/80 border border-[#352044] hover:border-[#A020F0] text-[#B7A6C8] hover:text-white transition-all flex items-center gap-2 text-xs font-bold"
                title="Share Song Link"
              >
                {copiedToast ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedToast ? 'Link Copied!' : 'Share'}</span>
              </button>
            </div>

            {/* Studio Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-[#352044] pt-2">
              <button
                onClick={() => setActiveTab('visualizer')}
                className={`pb-2.5 text-xs font-bold transition-all relative ${
                  activeTab === 'visualizer'
                    ? 'text-white border-b-2 border-[#A020F0]'
                    : 'text-[#B7A6C8] hover:text-white'
                }`}
              >
                Sound Spectrum
              </button>
              <button
                onClick={() => setActiveTab('queue')}
                className={`pb-2.5 text-xs font-bold transition-all relative ${
                  activeTab === 'queue'
                    ? 'text-white border-b-2 border-[#A020F0]'
                    : 'text-[#B7A6C8] hover:text-white'
                }`}
              >
                Queue ({queue.length})
              </button>
              <button
                onClick={() => setActiveTab('lyrics')}
                className={`pb-2.5 text-xs font-bold transition-all relative ${
                  activeTab === 'lyrics'
                    ? 'text-white border-b-2 border-[#A020F0]'
                    : 'text-[#B7A6C8] hover:text-white'
                }`}
              >
                Lyrics
              </button>
            </div>

            {/* Tab 1: Visualizer */}
            {activeTab === 'visualizer' && (
              <div className="p-4 rounded-2xl bg-[#090510]/70 border border-[#352044] flex items-center justify-between gap-4 animate-fadeIn">
                <span className="text-[11px] font-mono text-[#B7A6C8]">Hi-Fi Realtime Stream</span>
                <AudioVisualizer barCount={36} height={32} />
              </div>
            )}

            {/* Tab 2: Queue */}
            {activeTab === 'queue' && (
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-2 animate-fadeIn">
                {queue.map((track, idx) => (
                  <div
                    key={`${track.id}-${idx}`}
                    onClick={() => playTrack(track)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                      idx === queueIndex
                        ? 'bg-[#A020F0]/25 border border-[#A020F0]/50 text-white'
                        : 'bg-[#090510]/60 hover:bg-[#170D24] text-[#B7A6C8]'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="w-5 text-xs font-mono text-center text-[#B7A6C8]">{idx + 1}</span>
                      <div className="w-8 h-8 flex-shrink-0">
                        <AlbumArtwork
                          src={track.coverUrl}
                          alt={track.title}
                          aspectRatio="square"
                          rounded="rounded-lg"
                          className="w-8 h-8"
                        />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-white truncate">{track.title}</p>
                        <p className="text-[10px] text-[#B7A6C8] truncate">{track.artist}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{formatTime(track.duration)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 3: Lyrics */}
            {activeTab === 'lyrics' && (
              <div className="p-4 rounded-2xl bg-[#090510]/70 border border-[#352044] text-xs text-slate-300 space-y-2 max-h-56 overflow-y-auto leading-relaxed animate-fadeIn">
                <p className="font-bold text-[#E51D87] text-[11px] uppercase tracking-wider">Synchronized Lyrics</p>
                <p>Feel the rhythm, feel the flow</p>
                <p className="text-white font-semibold">Turn up the volume and let it go</p>
                <p>Streaming every frequency in crystal clarity</p>
                <p>VIBE Music in high-definition stereo.</p>
              </div>
            )}

            {/* Bottom Controls: Seek bar + Buttons */}
            <div className="space-y-4 pt-2">
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
                  <div className="w-full h-2 bg-[#090510] rounded-full overflow-hidden border border-[#352044]">
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

              {/* Playback Buttons */}
              <div className="flex items-center justify-between">
                <button
                  onClick={toggleShuffle}
                  className={`p-2.5 rounded-full transition-colors ${
                    isShuffle ? 'text-[#E51D87] bg-[#E51D87]/20' : 'text-[#B7A6C8] hover:text-white'
                  }`}
                  title="Shuffle"
                >
                  <Shuffle className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                <div className="flex items-center gap-4 sm:gap-6">
                  <button
                    onClick={prevTrack}
                    className="p-2 sm:p-2.5 text-slate-300 hover:text-white transition-colors"
                    title="Previous Track"
                  >
                    <SkipBack className="w-6 h-6 sm:w-7 sm:h-7" />
                  </button>

                  <button
                    onClick={togglePlay}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-[#A020F0] to-[#E51D87] text-white flex items-center justify-center shadow-lg shadow-[#A020F0]/40 hover:scale-105 active:scale-95 transition-all"
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
                    className="p-2 sm:p-2.5 text-slate-300 hover:text-white transition-colors"
                    title="Next Track"
                  >
                    <SkipForward className="w-6 h-6 sm:w-7 sm:h-7" />
                  </button>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={cycleRepeat}
                    className={`p-2.5 rounded-full transition-colors ${
                      repeatMode !== 'off' ? 'text-[#E51D87] bg-[#E51D87]/20' : 'text-[#B7A6C8] hover:text-white'
                    }`}
                    title={`Repeat: ${repeatMode}`}
                  >
                    {repeatMode === 'one' ? (
                      <Repeat1 className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <Repeat className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>

                  <div className="hidden sm:flex items-center gap-2">
                    <button onClick={toggleMute} className="text-[#B7A6C8] hover:text-white">
                      {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.02"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-20 md:w-24 h-1.5 accent-[#A020F0] bg-[#090510] rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
