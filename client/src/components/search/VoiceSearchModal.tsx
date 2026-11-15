import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  X,
  Volume2,
  Sparkles,
  AlertCircle,
  Globe,
  Play,
  SkipForward,
  SkipBack,
  Pause,
  ListMusic,
  CheckCircle2,
  Music,
} from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext.js';
import { searchApi } from '../../services/api.js';

interface VoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string, autoPlay?: boolean) => void;
}

type VoiceStatus =
  | 'idle'
  | 'listening'
  | 'recognizing'
  | 'searching'
  | 'command-executed'
  | 'no-speech'
  | 'denied'
  | 'unsupported'
  | 'error';

interface LanguageOption {
  code: string;
  label: string;
  native: string;
  flag: string;
}

const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en-IN', label: 'English', native: 'English (India)', flag: '🇬🇧' },
  { code: 'hi-IN', label: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
  { code: 'gu-IN', label: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
];

export const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({
  isOpen,
  onClose,
  onSearch,
}) => {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [selectedLang, setSelectedLang] = useState<string>(() => {
    return localStorage.getItem('vibe_voice_lang') || 'en-IN';
  });
  const [commandFeedback, setCommandFeedback] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('Tap to Speak');

  const recognitionRef = useRef<any>(null);
  const autoCloseTimerRef = useRef<any>(null);
  const navigate = useNavigate();
  const { playTrack, togglePlay, pause, resume, nextTrack, prevTrack, isPlaying } = usePlayer();

  // Save language preference
  const handleLanguageChange = (langCode: string) => {
    setSelectedLang(langCode);
    localStorage.setItem('vibe_voice_lang', langCode);
    if (status === 'listening' || status === 'recognizing') {
      stopListening();
      setTimeout(() => {
        startListening(langCode);
      }, 250);
    }
  };

  // Clean voice search command words to extract pure query
  const cleanVoiceQuery = (raw: string): { isPlayCommand: boolean; query: string } => {
    let text = raw.trim();
    const lower = text.toLowerCase();

    // Check if starts with "play" or similar
    const playStarters = [
      'play song',
      'play track',
      'play music',
      'play',
      'bajao',
      'chalao',
      'sunao',
      'dikhao',
    ];

    let isPlayCommand = false;

    // Direct "play" prefix
    if (lower.startsWith('play ')) {
      isPlayCommand = true;
      text = text.substring(5).trim();
    } else if (lower.endsWith(' chalao') || lower.endsWith(' bajao') || lower.endsWith(' sunao')) {
      isPlayCommand = true;
      text = text.replace(/\s+(chalao|bajao|sunao)$/i, '').trim();
    } else if (lower.endsWith(' dikhao') || lower.endsWith(' batavo') || lower.endsWith(' બતાવો')) {
      text = text.replace(/\s+(dikhao|batavo|બતાવો)$/i, '').trim();
    }

    // Strip trailing song/songs/gane/gana words
    text = text.replace(/\s+(ke\s+)?(songs|song|gane|gana|geet|ગીતો|ગીત)$/i, '').trim();

    return { isPlayCommand, query: text || raw };
  };

  // Process potential voice playback commands
  const processVoiceCommand = async (raw: string): Promise<boolean> => {
    const text = raw.trim().toLowerCase();

    // Command: Next track
    if (
      text === 'play next song' ||
      text === 'next song' ||
      text === 'next track' ||
      text === 'next' ||
      text === 'agla gana' ||
      text === 'agla geet' ||
      text === 'આગળ નું ગીત'
    ) {
      nextTrack();
      setStatus('command-executed');
      setCommandFeedback('Playing Next Track ⏭️');
      setStatusMessage('Skipped to next track');
      autoCloseTimerRef.current = setTimeout(onClose, 1200);
      return true;
    }

    // Command: Previous track
    if (
      text === 'play previous song' ||
      text === 'previous song' ||
      text === 'prev song' ||
      text === 'previous track' ||
      text === 'previous' ||
      text === 'pichhla gana' ||
      text === 'પાછળ નું ગીત'
    ) {
      prevTrack();
      setStatus('command-executed');
      setCommandFeedback('Playing Previous Track ⏮️');
      setStatusMessage('Skipped to previous track');
      autoCloseTimerRef.current = setTimeout(onClose, 1200);
      return true;
    }

    // Command: Pause music
    if (
      text === 'pause music' ||
      text === 'pause song' ||
      text === 'pause' ||
      text === 'stop music' ||
      text === 'gana roko' ||
      text === 'gana band karo' ||
      text === 'સંગીત રોકો'
    ) {
      pause();
      setStatus('command-executed');
      setCommandFeedback('Music Paused ⏸️');
      setStatusMessage('Playback paused');
      autoCloseTimerRef.current = setTimeout(onClose, 1200);
      return true;
    }

    // Command: Resume music
    if (
      text === 'resume music' ||
      text === 'resume song' ||
      text === 'resume' ||
      text === 'continue music' ||
      text === 'play music' ||
      text === 'gana chalao' ||
      text === 'gana shuru karo'
    ) {
      resume();
      setStatus('command-executed');
      setCommandFeedback('Music Resumed ▶️');
      setStatusMessage('Playback resumed');
      autoCloseTimerRef.current = setTimeout(onClose, 1200);
      return true;
    }

    // Command: Show my playlists
    if (
      text === 'show my playlists' ||
      text === 'my playlists' ||
      text === 'open playlists' ||
      text === 'show playlists' ||
      text === 'playlist dikhao' ||
      text === 'મારી પ્લેલિસ્ટ'
    ) {
      navigate('/playlists');
      setStatus('command-executed');
      setCommandFeedback('Opening Playlists 🎵');
      setStatusMessage('Navigating to playlists');
      autoCloseTimerRef.current = setTimeout(onClose, 1000);
      return true;
    }

    // Not a direct system control command -> Proceed to music search
    return false;
  };

  // Start speech recognition
  const startListening = (langCode: string = selectedLang) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus('unsupported');
      setStatusMessage('Voice search is not supported in this browser');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = langCode;

      recognition.onstart = () => {
        setStatus('listening');
        setStatusMessage('Listening... Speak now');
        setTranscript('');
        setInterimTranscript('');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            final += res[0].transcript;
          } else {
            interim += res[0].transcript;
          }
        }

        if (interim) {
          setInterimTranscript(interim);
          setStatus('recognizing');
          setStatusMessage('Recognizing your voice...');
        }

        if (final) {
          const finalClean = final.trim();
          setTranscript(finalClean);
          setInterimTranscript('');
          handleFinalSpeech(finalClean);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setStatus('denied');
          setStatusMessage('Microphone permission denied');
        } else if (event.error === 'no-speech') {
          setStatus('no-speech');
          setStatusMessage('No voice detected. Please try speaking again');
        } else {
          setStatus('error');
          setStatusMessage(`Speech error (${event.error || 'unknown'})`);
        }
      };

      recognition.onend = () => {
        // If still listening without final, mark no-speech
        setStatus((prev) => (prev === 'listening' || prev === 'recognizing' ? 'no-speech' : prev));
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Failed to start speech recognition:', err);
      setStatus('error');
      setStatusMessage('Could not start microphone');
    }
  };

  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  };

  // Handle final speech result
  const handleFinalSpeech = async (spokenText: string) => {
    stopListening();

    // 1. Check if it's a playback command
    const isCommand = await processVoiceCommand(spokenText);
    if (isCommand) return;

    // 2. Otherwise it's a music search / play query
    setStatus('searching');
    setStatusMessage('Searching music...');

    const { isPlayCommand, query } = cleanVoiceQuery(spokenText);

    // If explicit "Play [song]" command, try to find and autoplay top song
    if (isPlayCommand) {
      try {
        const searchResults = await searchApi.searchAll(query, 'songs');
        if (searchResults.songs && searchResults.songs.length > 0) {
          const topSong = searchResults.songs[0];
          playTrack(topSong, searchResults.songs);
          setStatus('command-executed');
          setCommandFeedback(`Playing "${topSong.title}" 🎶`);
          setStatusMessage(`Found & playing: ${topSong.title}`);
          autoCloseTimerRef.current = setTimeout(() => {
            onSearch(query, true);
            onClose();
          }, 1200);
          return;
        }
      } catch (err) {
        console.warn('Auto-play search failed, falling back to normal search:', err);
      }
    }

    // Standard Search navigation
    autoCloseTimerRef.current = setTimeout(() => {
      onSearch(query, false);
      onClose();
    }, 600);
  };

  // Auto-start recognition on modal open, clean up on close
  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setTranscript('');
      setInterimTranscript('');
      setCommandFeedback('');
      setStatusMessage('Listening...');
      startListening();
    } else {
      stopListening();
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    }

    return () => {
      stopListening();
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentDisplaySpeech = transcript || interimTranscript;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xl animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg glass-panel rounded-3xl border-2 border-[#A020F0]/60 p-6 sm:p-8 shadow-[0_0_80px_rgba(160,32,240,0.4)] flex flex-col items-center text-center overflow-hidden"
      >
        {/* Ambient background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#A020F0]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#E51D87]/25 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header: Brand & Close */}
        <div className="w-full flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#A020F0] to-[#E51D87] flex items-center justify-center shadow-md">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#E51D87] block">
                VIBE SMART SEARCH
              </span>
              <h3 className="text-sm font-bold text-white">Voice Search & Commands</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-[#170D24] text-[#B7A6C8] hover:text-white border border-[#352044] hover:border-[#A020F0] transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Close Voice Search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Language Selector Pills */}
        <div className="relative z-10 flex items-center justify-center gap-1.5 p-1 rounded-2xl bg-[#170D24] border border-[#352044] mb-6">
          <Globe className="w-3.5 h-3.5 text-[#B7A6C8] ml-2 mr-0.5" />
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = selectedLang === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 min-h-[32px] ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white shadow-md shadow-[#A020F0]/30'
                    : 'text-[#B7A6C8] hover:text-white hover:bg-[#231338]'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.native}</span>
              </button>
            );
          })}
        </div>

        {/* Center: Glowing Microphone Button with Animated Soundwave Rings */}
        <div className="relative my-4 flex items-center justify-center">
          {/* Animated Pulsing Sound-Wave Rings when listening */}
          {(status === 'listening' || status === 'recognizing') && (
            <>
              <div className="voice-wave-ring w-28 h-28 sm:w-36 sm:h-36" />
              <div className="voice-wave-ring w-28 h-28 sm:w-36 sm:h-36" />
              <div className="voice-wave-ring w-28 h-28 sm:w-36 sm:h-36" />
            </>
          )}

          {/* Central Button */}
          <button
            onClick={() => {
              if (status === 'listening' || status === 'recognizing') {
                stopListening();
                setStatus('idle');
                setStatusMessage('Tap to Speak');
              } else {
                startListening();
              }
            }}
            className={`relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center transition-all shadow-2xl ${
              status === 'listening' || status === 'recognizing'
                ? 'bg-gradient-to-tr from-[#A020F0] to-[#E51D87] text-white shadow-[0_0_40px_rgba(229,29,135,0.7)] scale-105 animate-pulse'
                : status === 'command-executed'
                ? 'bg-emerald-600 text-white shadow-[0_0_40px_rgba(16,185,129,0.7)]'
                : 'bg-[#170D24] border-2 border-[#A020F0] text-purple-300 hover:text-white hover:border-[#E51D87] hover:scale-105 active:scale-95'
            }`}
            title={status === 'listening' ? 'Click to Stop' : 'Click to Speak'}
          >
            {status === 'listening' || status === 'recognizing' ? (
              <Mic className="w-10 h-10 animate-bounce" />
            ) : status === 'command-executed' ? (
              <CheckCircle2 className="w-10 h-10 animate-scale" />
            ) : (
              <Mic className="w-10 h-10" />
            )}
          </button>
        </div>

        {/* Status Message */}
        <div className="relative z-10 mt-3 mb-2">
          <p
            className={`text-sm sm:text-base font-bold ${
              status === 'listening' || status === 'recognizing'
                ? 'text-pink-400 animate-pulse'
                : status === 'command-executed'
                ? 'text-emerald-400 font-extrabold'
                : status === 'denied' || status === 'error'
                ? 'text-red-400'
                : 'text-white'
            }`}
          >
            {commandFeedback || statusMessage}
          </p>
        </div>

        {/* Real-time Spoken Transcript Box */}
        <div className="relative z-10 w-full min-h-[64px] bg-[#090510]/90 border border-[#352044] rounded-2xl p-3.5 my-3 flex items-center justify-center text-center">
          {currentDisplaySpeech ? (
            <p className="text-base sm:text-lg font-bold text-white tracking-wide break-words line-clamp-2">
              "{currentDisplaySpeech}"
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-[#B7A6C8]/70 italic">
              Say a song, artist, or command (e.g. "Play Tum Hi Ho", "Shubh", "Next song")...
            </p>
          )}
        </div>

        {/* Action Controls: Stop Listening or Retry */}
        <div className="relative z-10 flex items-center gap-3 mt-2">
          {status === 'listening' || status === 'recognizing' ? (
            <button
              onClick={() => {
                stopListening();
                setStatus('idle');
                setStatusMessage('Tap to Speak');
              }}
              className="px-4 py-2 rounded-xl bg-[#170D24] border border-[#352044] hover:border-[#E51D87] text-xs font-bold text-[#E51D87] hover:bg-[#E51D87]/15 transition-all flex items-center gap-1.5"
            >
              <MicOff className="w-4 h-4" /> Stop Listening
            </button>
          ) : (
            <button
              onClick={() => startListening()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-xs font-bold text-white shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Mic className="w-4 h-4" /> Tap to Speak Again
            </button>
          )}
        </div>

        {/* Helpful Spoken Examples & Commands */}
        <div className="relative z-10 w-full mt-5 pt-4 border-t border-[#352044]/60">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#B7A6C8]/70 mb-2">
            Try saying:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
            {[
              { label: '🎵 Play Tum Hi Ho', val: 'Play Tum Hi Ho' },
              { label: '👑 Shubh ke songs', val: 'Shubh ke songs' },
              { label: '💖 Arijit Singh', val: 'Arijit Singh' },
              { label: '🪕 ગુજરાતી ગીતો', val: 'ગુજરાતી ગીતો' },
              { label: '⏭️ Next song', val: 'Next song' },
              { label: '⏸️ Pause music', val: 'Pause music' },
            ].map((sample) => (
              <button
                key={sample.val}
                onClick={() => {
                  setTranscript(sample.val);
                  handleFinalSpeech(sample.val);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#170D24] hover:bg-[#231338] text-[#B7A6C8] hover:text-white border border-[#352044] transition-all"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceSearchModal;

