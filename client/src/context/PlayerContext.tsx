import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Track } from '../types/music.js';
import { historyApi, musicApi, meApi } from '../services/api.js';
import { localMusicStorage } from '../services/localMusicStorage.js';

interface YTController {
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  setVolume: (volumePercent: number) => void;
}

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  queue: Track[];
  queueIndex: number;
  isFullScreenOpen: boolean;
  analyserNode: AnalyserNode | null;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  activePlaybackMode: 'audio' | 'youtube';
  youtubeVideoId: string | null;
  isVideoVisible: boolean;

  playTrack: (track: Track, newQueue?: Track[]) => void;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (seconds: number) => void;
  setVolume: (val: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  setIsFullScreenOpen: (open: boolean) => void;
  toggleVideoVisible: () => void;
  setIsVideoVisible: (visible: boolean) => void;
  registerYTController: (controller: YTController | null) => void;
  onYouTubeStateChange: (eventState: number, ytCurrentTime: number, ytDuration: number) => void;
  setYouTubeCurrentTime: (time: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(240);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(() => {
    const saved = localStorage.getItem('vibe_player_volume');
    return saved !== null ? Math.max(0, Math.min(100, parseInt(saved, 10))) / 100 : 0.85;
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState<boolean>(false);
  const [activePlaybackMode, setActivePlaybackMode] = useState<'audio' | 'youtube'>('youtube');
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [isVideoVisible, setIsVideoVisible] = useState<boolean>(false); // Minimized by default for audio-first experience

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const ytControllerRef = useRef<YTController | null>(null);
  const hasLoggedThresholdRef = useRef<{ trackId: string; logged: boolean }>({ trackId: '', logged: false });

  const registerYTController = (controller: YTController | null) => {
    ytControllerRef.current = controller;
  };

  // Web Audio API initialization
  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    const initAudioContext = () => {
      if (!audioContextRef.current) {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            analyser.smoothingTimeConstant = 0.8;

            if (!sourceNodeRef.current) {
              const src = ctx.createMediaElementSource(audio);
              src.connect(analyser);
              analyser.connect(ctx.destination);
              sourceNodeRef.current = src;
            }

            audioContextRef.current = ctx;
            analyserRef.current = analyser;
          }
        } catch (e) {
          console.warn('[Web Audio API] Notice:', e);
        }
      }
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    };

    audio.addEventListener('play', initAudioContext);
    return () => {
      audio.removeEventListener('play', initAudioContext);
    };
  }, []);

  // Stop playback on user logout
  useEffect(() => {
    const handleLogoutEvent = () => {
      pause();
      setCurrentTrack(null);
      setIsVideoVisible(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (ytControllerRef.current) {
        ytControllerRef.current.pause();
      }
    };
    window.addEventListener('vibe_logout_event', handleLogoutEvent);
    return () => window.removeEventListener('vibe_logout_event', handleLogoutEvent);
  }, []);

  // HTML5 Audio Event Listeners for Jamendo
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (activePlaybackMode === 'audio') {
        setCurrentTime(audio.currentTime);
      }
    };

    const onLoadedMetadata = () => {
      if (activePlaybackMode === 'audio' && audio.duration && audio.duration > 30) {
        setDuration(audio.duration);
      }
    };

    const onEnded = () => {
      handleTrackEnded();
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [activePlaybackMode, currentTrack, queueIndex, queue, repeatMode]);

  // Volume sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    if (ytControllerRef.current) {
      ytControllerRef.current.setVolume(isMuted ? 0 : volume * 100);
    }
  }, [volume, isMuted]);

  // Meaningful Listening Threshold Tracker (Section 5 requirement: >= 30s or >= 50% completion)
  useEffect(() => {
    if (!currentTrack || !isPlaying || currentTime <= 0) return;

    if (
      hasLoggedThresholdRef.current.trackId === currentTrack.id &&
      !hasLoggedThresholdRef.current.logged
    ) {
      const meetsDurationThreshold = currentTime >= 30;
      const meetsPercentageThreshold = duration > 0 && currentTime / duration >= 0.5;

      if (meetsDurationThreshold || meetsPercentageThreshold) {
        hasLoggedThresholdRef.current.logged = true;
        meApi
          .logListeningEvent({
            song: currentTrack,
            listenedDuration: Math.round(currentTime),
            completionPercentage: Math.min(100, Math.round((currentTime / (duration || 200)) * 100)),
            eventType: meetsPercentageThreshold ? 'half_completed' : 'threshold_30s_reached',
          })
          .catch(() => {});
      }
    }
  }, [currentTime, currentTrack, duration, isPlaying]);

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (ytControllerRef.current) {
      ytControllerRef.current.pause();
    }
    setIsPlaying(false);
  };

  const resume = () => {
    if (activePlaybackMode === 'audio' && audioRef.current) {
      audioRef.current.play().catch(console.warn);
    }
    if (activePlaybackMode === 'youtube' && ytControllerRef.current) {
      ytControllerRef.current.play();
    }
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (!currentTrack) {
      if (queue.length > 0) {
        playTrack(queue[0]);
      }
      return;
    }

    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const playTrack = (track: Track, newQueue?: Track[]) => {
    // Queue maintenance
    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
      const idx = newQueue.findIndex((t) => t.id === track.id);
      setQueueIndex(idx !== -1 ? idx : 0);
    } else if (!queue.some((t) => t.id === track.id)) {
      setQueue((prev) => [...prev, track]);
      setQueueIndex(queue.length);
    } else {
      const idx = queue.findIndex((t) => t.id === track.id);
      if (idx !== -1) setQueueIndex(idx);
    }

    setCurrentTrack(track);
    setCurrentTime(0);
    hasLoggedThresholdRef.current = { trackId: track.id, logged: false };

    // Save to local recent history immediately (works for both guests & logged in users)
    localMusicStorage.addRecentTrack(track);

    // Record listening history in background
    historyApi.logPlay(track, 0).catch(() => {});

    // Full Track Playback Router: INSTANT PLAYBACK
    // Priority 1: Direct Audio Stream (iTunes Master / Jamendo / MP3) -> Plays in 50ms instantly!
    if (track.audioUrl) {
      setActivePlaybackMode('audio');
      setYoutubeVideoId(null);
      if (audioRef.current) {
        audioRef.current.src = track.audioUrl;
        audioRef.current.load();
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch((err) => {
              console.warn('Direct audio play error:', err);
              // Fallback to youtube video stream if audio stream is blocked
              if (track.youtubeId) {
                setActivePlaybackMode('youtube');
                setYoutubeVideoId(track.youtubeId);
              }
            });
        }
      }
      setIsPlaying(true);
      setDuration(track.duration || 180);

      // In background, pre-fetch YouTube video ID for video mode
      if (!track.youtubeId) {
        musicApi
          .resolveFullTrack(track.title, track.artist)
          .then((res) => {
            if (res && res.youtubeId) {
              track.youtubeId = res.youtubeId;
            }
          })
          .catch(() => {});
      }
      return;
    }

    // Priority 2: Already has YouTube ID
    if (track.youtubeId) {
      setActivePlaybackMode('youtube');
      setYoutubeVideoId(track.youtubeId);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
      }
      setIsPlaying(true);
      setDuration(track.duration || 240);
      return;
    }

    // Priority 3: YouTube Provider track
    if (track.provider === 'youtube') {
      const vid = track.id.replace('youtube-', '');
      track.youtubeId = vid;
      setActivePlaybackMode('youtube');
      setYoutubeVideoId(vid);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
      }
      setIsPlaying(true);
      setDuration(track.duration || 240);
      return;
    }

    // Priority 4: Any track without audioUrl -> Resolve and stream
    setActivePlaybackMode('youtube');
    setDuration(track.duration && track.duration > 35 ? track.duration : 240);
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
    }

    musicApi
      .resolveFullTrack(track.title, track.artist)
      .then((res) => {
        if (res && res.youtubeId) {
          track.youtubeId = res.youtubeId;
          track.duration = res.duration || 240;
          track.providerName = 'VIBE Studio Audio';
          setYoutubeVideoId(res.youtubeId);
          setDuration(res.duration || 240);
          setIsPlaying(true);
        }
      })
      .catch((err) => {
        console.warn('Error resolving full track:', err);
      });
  };

  const nextTrack = () => {
    if (queue.length === 0) return;

    if (isShuffle) {
      const randomIdx = Math.floor(Math.random() * queue.length);
      setQueueIndex(randomIdx);
      playTrack(queue[randomIdx]);
      return;
    }

    const nextIdx = queueIndex + 1;
    if (nextIdx < queue.length) {
      setQueueIndex(nextIdx);
      playTrack(queue[nextIdx]);
    } else if (repeatMode === 'all') {
      setQueueIndex(0);
      playTrack(queue[0]);
    } else {
      pause();
    }
  };

  const prevTrack = () => {
    if (currentTime > 3) {
      seek(0);
      return;
    }
    if (queue.length === 0) return;

    const prevIdx = queueIndex - 1;
    if (prevIdx >= 0) {
      setQueueIndex(prevIdx);
      playTrack(queue[prevIdx]);
    } else {
      seek(0);
    }
  };

  const handleTrackEnded = () => {
    if (repeatMode === 'one' && currentTrack) {
      seek(0);
      resume();
      return;
    }
    nextTrack();
  };

  const seek = (seconds: number) => {
    const clamped = Math.max(0, Math.min(seconds, duration || 300));
    setCurrentTime(clamped);
    if (activePlaybackMode === 'audio' && audioRef.current) {
      audioRef.current.currentTime = clamped;
    }
    if (activePlaybackMode === 'youtube' && ytControllerRef.current) {
      ytControllerRef.current.seek(clamped);
    }
  };

  const setVolume = (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    try {
      localStorage.setItem('vibe_player_volume', String(Math.round(clamped * 100)));
    } catch (_) {}
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleShuffle = () => {
    setIsShuffle(!isShuffle);
  };

  const cycleRepeat = () => {
    if (repeatMode === 'off') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('off');
  };

  const addToQueue = (track: Track) => {
    setQueue((prev) => [...prev, track]);
  };

  const removeFromQueue = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
    if (index === queueIndex) {
      nextTrack();
    } else if (index < queueIndex) {
      setQueueIndex((prev) => prev - 1);
    }
  };

  const clearQueue = () => {
    setQueue([]);
    setQueueIndex(-1);
    pause();
    setCurrentTrack(null);
  };

  const toggleVideoVisible = () => {
    setIsVideoVisible((prev) => !prev);
  };

  // YouTube IFrame Player integration handler
  const onYouTubeStateChange = (eventState: number, ytCurrentTime: number, ytDuration: number) => {
    // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
    if (eventState === 1) {
      setIsPlaying(true);
      if (ytDuration > 30) setDuration(ytDuration);
    } else if (eventState === 2) {
      setIsPlaying(false);
    } else if (eventState === 0) {
      handleTrackEnded();
    }
  };

  const setYouTubeCurrentTime = (time: number) => {
    setCurrentTime(time);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        duration,
        currentTime,
        volume,
        isMuted,
        isShuffle,
        repeatMode,
        queue,
        queueIndex,
        isFullScreenOpen,
        analyserNode: analyserRef.current,
        audioRef,
        activePlaybackMode,
        youtubeVideoId,
        isVideoVisible,
        playTrack,
        togglePlay,
        pause,
        resume,
        nextTrack,
        prevTrack,
        seek,
        setVolume,
        toggleMute,
        toggleShuffle,
        cycleRepeat,
        addToQueue,
        removeFromQueue,
        clearQueue,
        setIsFullScreenOpen,
        toggleVideoVisible,
        setIsVideoVisible,
        registerYTController,
        onYouTubeStateChange,
        setYouTubeCurrentTime,
      }}
    >
      {/* Hidden Global HTML5 Audio Element for MP3s */}
      <audio ref={audioRef} crossOrigin="anonymous" preload="auto" />
      {children}
    </PlayerContext.Provider>
  );
};

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
