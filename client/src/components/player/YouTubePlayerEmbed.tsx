import React, { useEffect, useRef, useState, Component, ErrorInfo } from 'react';
import { Minus, Maximize2, Minimize2, X, Tv, Film, ExternalLink } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext.js';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

// Error Boundary to prevent any unhandled player error from breaking the app
class PlayerErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('[Video Player Safe Catch]:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

const YouTubePlayerEmbedInternal: React.FC = () => {
  const {
    currentTrack,
    activePlaybackMode,
    youtubeVideoId,
    isPlaying,
    volume,
    isMuted,
    isVideoVisible,
    toggleVideoVisible,
    registerYTController,
    onYouTubeStateChange,
    setYouTubeCurrentTime,
  } = usePlayer();

  const iframeHostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // 1. Ensure YouTube IFrame API script is in document
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.YT) {
      const existing = document.querySelector('script[src*="youtube.com/iframe_api"]');
      if (!existing) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.async = true;
        document.head.appendChild(tag);
      }
    }
  }, []);

  // 2. Register direct playback controller into context
  useEffect(() => {
    registerYTController({
      play: () => {
        try {
          if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
            playerRef.current.playVideo();
          }
        } catch (e) {
          console.warn('[YT Play notice]:', e);
        }
      },
      pause: () => {
        try {
          if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
            playerRef.current.pauseVideo();
          }
        } catch (e) {
          console.warn('[YT Pause notice]:', e);
        }
      },
      seek: (seconds: number) => {
        try {
          if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
            playerRef.current.seekTo(seconds, true);
          }
        } catch (e) {
          console.warn('[YT Seek notice]:', e);
        }
      },
      setVolume: (volumePercent: number) => {
        try {
          if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
            playerRef.current.setVolume(volumePercent);
          }
        } catch (e) {
          console.warn('[YT Volume notice]:', e);
        }
      },
    });

    return () => {
      registerYTController(null);
    };
  }, []);

  // 3. Initialize or update YouTube Player safely inside unmanaged container
  useEffect(() => {
    if (!youtubeVideoId) return;

    let isSubscribed = true;

    const setupPlayer = () => {
      if (!isSubscribed) return;
      if (!window.YT || !window.YT.Player) {
        setTimeout(setupPlayer, 200);
        return;
      }

      // If player instance already initialized, simply load new video ID
      if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
        try {
          playerRef.current.loadVideoById(youtubeVideoId);
          if (isPlaying) {
            playerRef.current.playVideo();
          }
          return;
        } catch (e) {
          console.warn('Re-cue video notice:', e);
        }
      }

      const host = iframeHostRef.current;
      if (!host) return;

      // Safely manage inner DOM slot without React reconciliation conflicts
      try {
        host.innerHTML = '';
        const slot = document.createElement('div');
        slot.style.width = '100%';
        slot.style.height = '100%';
        host.appendChild(slot);

        playerRef.current = new window.YT.Player(slot, {
          height: '100%',
          width: '100%',
          videoId: youtubeVideoId,
          playerVars: {
            autoplay: 1,
            controls: 1, // Full standard YouTube playback controls
            modestbranding: 0, // Show standard YouTube branding & attribution
            rel: 0,
            playsinline: 1,
            fs: 1, // Allow fullscreen
            cc_load_policy: 1, // Support closed captions
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              try {
                event.target.setVolume(isMuted ? 0 : volume * 100);
                if (isPlaying) {
                  event.target.playVideo();
                }
              } catch (e) {}
            },
            onStateChange: (event: any) => {
              try {
                const state = event.data;
                const currentTime = event.target.getCurrentTime ? event.target.getCurrentTime() : 0;
                const duration = event.target.getDuration ? event.target.getDuration() : 0;
                onYouTubeStateChange(state, currentTime, duration);
              } catch (e) {}
            },
            onError: (err: any) => {
              const code = err?.data;
              console.warn('[YouTube IFrame Player Error Code]:', code);
              // 100 = Video not found or marked private
              // 101 / 150 = Embedding not allowed by content owner
              if (code === 101 || code === 150) {
                console.info('This video does not allow embedded playback by request of the copyright owner.');
              }
            },
          },
        });
      } catch (err) {
        console.warn('Safe player mount catch:', err);
      }
    };

    setupPlayer();

    return () => {
      isSubscribed = false;
    };
  }, [youtubeVideoId]);

  // 4. Volume Synchronization
  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      try {
        playerRef.current.setVolume(isMuted ? 0 : volume * 100);
      } catch (e) {}
    }
  }, [volume, isMuted]);

  // 5. Time tracking interval for seek synchronization
  useEffect(() => {
    if (isPlaying && youtubeVideoId) {
      timerRef.current = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          try {
            const time = playerRef.current.getCurrentTime();
            setYouTubeCurrentTime(time);
          } catch (e) {}
        }
      }, 500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, youtubeVideoId]);

  if (!youtubeVideoId) return null;

  return (
    <div
      className={`fixed z-50 transition-all duration-300 rounded-2xl overflow-hidden border-2 border-[#A020F0]/60 shadow-[0_20px_60px_rgba(0,0,0,0.95)] bg-black ${
        isVideoVisible
          ? isExpanded
            ? 'inset-3 sm:inset-10 md:inset-20 w-auto h-auto' // Expanded theater mode
            : 'bottom-36 sm:bottom-28 right-3 sm:right-6 w-[280px] h-[175px] sm:w-[360px] sm:h-[215px] md:w-[420px] md:h-[250px]' // Floating PiP
          : 'w-1 h-1 opacity-0 pointer-events-none -bottom-96 right-0' // Hidden audio-only playback
      }`}
    >
      {/* Video Window Top Toolbar */}
      {isVideoVisible && (
        <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-3 py-1.5 bg-gradient-to-b from-black/90 via-black/60 to-transparent">
          <div className="flex items-center gap-2 overflow-hidden mr-2">
            <span className="p-1 rounded-md bg-[#A020F0]/40 text-purple-200">
              <Film className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] font-bold text-white truncate max-w-[180px] sm:max-w-[260px]">
              {currentTrack?.title || 'Music Video'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Expand / Minimize Window */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg bg-black/60 hover:bg-[#170D24] text-slate-300 hover:text-white border border-[#352044] transition-colors"
              title={isExpanded ? 'Restore Floating Window' : 'Expand Video Theater'}
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Hide Video (Audio continues playing) */}
            <button
              onClick={toggleVideoVisible}
              className="p-1.5 rounded-lg bg-black/60 hover:bg-red-950/80 text-slate-300 hover:text-red-400 border border-[#352044] transition-colors"
              title="Hide Video Window (Audio keeps playing)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Unmanaged Container for YouTube Iframe Slot (No React DOM Conflicts) */}
      <div ref={iframeHostRef} className="w-full h-full bg-black" />
    </div>
  );
};

export const YouTubePlayerEmbed: React.FC = () => {
  return (
    <PlayerErrorBoundary>
      <YouTubePlayerEmbedInternal />
    </PlayerErrorBoundary>
  );
};

export default YouTubePlayerEmbed;
