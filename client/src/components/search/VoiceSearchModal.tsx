import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  X,
  Sparkles,
  Globe,
  Play,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
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
  { code: 'hi-IN', label: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
  { code: 'en-IN', label: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'gu-IN', label: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'pa-IN', label: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
];

export const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({
  isOpen,
  onClose,
  onSearch,
}) => {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [selectedLang, setSelectedLang] = useState<string>(() => {
    return localStorage.getItem('vibe_voice_lang') || 'hi-IN';
  });
  const [commandFeedback, setCommandFeedback] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('Tap to Speak');
  const [manualText, setManualText] = useState<string>('');

  const recognitionRef = useRef<any>(null);
  const autoSearchTimerRef = useRef<any>(null);
  const navigate = useNavigate();
  const { playTrack, pause, resume, nextTrack, prevTrack } = usePlayer();

  // Save language preference and restart if listening
  const handleLanguageChange = (langCode: string) => {
    setSelectedLang(langCode);
    localStorage.setItem('vibe_voice_lang', langCode);
    if (status === 'listening' || status === 'recognizing') {
      stopListening();
      setTimeout(() => {
        startListening(langCode);
      }, 200);
    }
  };

  // Clean voice search command words
  const cleanVoiceQuery = (raw: string): { isPlayCommand: boolean; query: string } => {
    let text = raw.trim();
    const lower = text.toLowerCase();

    let isPlayCommand = false;
    if (lower.startsWith('play ')) {
      isPlayCommand = true;
      text = text.substring(5).trim();
    } else if (lower.endsWith(' chalao') || lower.endsWith(' bajao') || lower.endsWith(' sunao')) {
      isPlayCommand = true;
      text = text.replace(/\s+(chalao|bajao|sunao)$/i, '').trim();
    } else if (lower.endsWith(' dikhao') || lower.endsWith(' batavo') || lower.endsWith(' બતાવો')) {
      text = text.replace(/\s+(dikhao|batavo|બતાવો)$/i, '').trim();
    }

    text = text.replace(/\s+(ke\s+)?(songs|song|gane|gana|geet|ગીતો|ગીત)$/i, '').trim();
    return { isPlayCommand, query: text || raw };
  };

  // Voice Playback commands
  const processVoiceCommand = async (raw: string): Promise<boolean> => {
    const text = raw.trim().toLowerCase();

    if (
      text === 'play next song' ||
      text === 'next song' ||
      text === 'next track' ||
      text === 'next' ||
      text === 'agla gana' ||
      text === 'આગળ નું ગીત'
    ) {
      nextTrack();
      setStatus('command-executed');
      setCommandFeedback('Playing Next Track ⏭️');
      setStatusMessage('Skipped to next track');
      setTimeout(onClose, 1200);
      return true;
    }

    if (
      text === 'play previous song' ||
      text === 'previous song' ||
      text === 'pichhla gana' ||
      text === 'પાછળ નું ગીત'
    ) {
      prevTrack();
      setStatus('command-executed');
      setCommandFeedback('Playing Previous Track ⏮️');
      setStatusMessage('Skipped to previous track');
      setTimeout(onClose, 1200);
      return true;
    }

    if (
      text === 'pause music' ||
      text === 'pause song' ||
      text === 'pause' ||
      text === 'stop music' ||
      text === 'gana roko' ||
      text === 'સંગીત રોકો'
    ) {
      pause();
      setStatus('command-executed');
      setCommandFeedback('Music Paused ⏸️');
      setStatusMessage('Playback paused');
      setTimeout(onClose, 1200);
      return true;
    }

    if (
      text === 'resume music' ||
      text === 'resume song' ||
      text === 'resume' ||
      text === 'continue music' ||
      text === 'gana chalao'
    ) {
      resume();
      setStatus('command-executed');
      setCommandFeedback('Music Resumed ▶️');
      setStatusMessage('Playback resumed');
      setTimeout(onClose, 1200);
      return true;
    }

    return false;
  };

  // Start speech recognition directly without audio stream locking
  const startListening = (langCode: string = selectedLang) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus('unsupported');
      setStatusMessage('Voice recognition is not supported in this browser. Please type below:');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = langCode;

      recognition.onstart = () => {
        setStatus('listening');
        setStatusMessage('Listening... Speak now');
        setTranscript('');
      };

      recognition.onresult = (event: any) => {
        let fullSpeech = '';
        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          fullSpeech += res[0].transcript + ' ';
        }

        const cleaned = fullSpeech.trim();
        if (cleaned) {
          setTranscript(cleaned);
          setManualText(cleaned);
          setStatus('recognizing');
          setStatusMessage(`Listening: "${cleaned}"`);

          // Reset auto-search timer: auto-execute after 1.8 seconds of silence
          if (autoSearchTimerRef.current) clearTimeout(autoSearchTimerRef.current);
          autoSearchTimerRef.current = setTimeout(() => {
            handleFinalSpeech(cleaned);
          }, 1800);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setStatus('denied');
          setStatusMessage('Microphone access blocked. Please allow microphone in your browser settings.');
        } else if (event.error === 'no-speech') {
          setStatus('no-speech');
          setStatusMessage('No voice heard. Tap the microphone to speak again');
        } else {
          setStatus('error');
          setStatusMessage('Could not hear clearly. Tap mic to try again');
        }
      };

      recognition.onend = () => {
        setStatus((prev) => (prev === 'listening' ? 'no-speech' : prev));
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Failed to start speech recognition:', err);
      setStatus('idle');
      setStatusMessage('Tap microphone to speak');
    }
  };

  const stopListening = () => {
    if (autoSearchTimerRef.current) clearTimeout(autoSearchTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
  };

  const handleFinalSpeech = async (spokenText: string) => {
    const textToSearch = spokenText.trim();
    if (!textToSearch) return;

    stopListening();

    // 1. Check if voice control command
    const isCommand = await processVoiceCommand(textToSearch);
    if (isCommand) return;

    // 2. Music search query
    setStatus('searching');
    setStatusMessage(`Searching for "${textToSearch}"...`);

    const { isPlayCommand, query } = cleanVoiceQuery(textToSearch);

    // If explicit play command, attempt to autoplay
    if (isPlayCommand) {
      try {
        const searchResults = await searchApi.searchAll(query, 'songs');
        if (searchResults.songs && searchResults.songs.length > 0) {
          const topSong = searchResults.songs[0];
          playTrack(topSong, searchResults.songs);
          setStatus('command-executed');
          setCommandFeedback(`Playing "${topSong.title}" 🎶`);
          setStatusMessage(`Now playing: ${topSong.title}`);
          setTimeout(() => {
            onSearch(query, true);
            onClose();
          }, 1000);
          return;
        }
      } catch (err) {
        console.warn('Autoplay error:', err);
      }
    }

    // Execute standard search
    setTimeout(() => {
      onSearch(query || textToSearch, false);
      onClose();
    }, 400);
  };

  // On modal open, attempt to start listening
  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setTranscript('');
      setManualText('');
      setCommandFeedback('');
      setStatusMessage('Listening... Speak now');
      startListening();
    } else {
      stopListening();
    }

    return () => {
      stopListening();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg glass-panel rounded-3xl border-2 border-[#A020F0]/60 p-5 sm:p-7 shadow-[0_0_80px_rgba(160,32,240,0.4)] flex flex-col items-center text-center overflow-hidden box-border"
      >
        {/* Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#A020F0]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#E51D87]/25 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="w-full flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#A020F0] to-[#E51D87] flex items-center justify-center shadow-md">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#E51D87] block">
                VIBE VOICE SEARCH
              </span>
              <h3 className="text-sm font-bold text-white">Speak in any Language</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-[#170D24] text-[#B7A6C8] hover:text-white border border-[#352044] hover:border-[#A020F0] transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Language Selector Pills */}
        <div className="relative z-10 flex items-center justify-center flex-wrap gap-1 p-1 rounded-2xl bg-[#170D24] border border-[#352044] mb-4">
          <Globe className="w-3.5 h-3.5 text-[#B7A6C8] ml-2 mr-1" />
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

        {/* Center Microphone Button with Animated Waves */}
        <div className="relative my-3 flex items-center justify-center">
          {(status === 'listening' || status === 'recognizing') && (
            <>
              <div className="voice-wave-ring w-28 h-28 sm:w-36 sm:h-36" />
              <div className="voice-wave-ring w-28 h-28 sm:w-36 sm:h-36" />
            </>
          )}

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
                ? 'bg-gradient-to-tr from-[#A020F0] to-[#E51D87] text-white shadow-[0_0_40px_rgba(229,29,135,0.7)] scale-105'
                : status === 'command-executed'
                ? 'bg-emerald-600 text-white shadow-[0_0_40px_rgba(16,185,129,0.7)]'
                : 'bg-[#170D24] border-2 border-[#A020F0] text-purple-300 hover:text-white hover:border-[#E51D87] hover:scale-105 active:scale-95'
            }`}
            title={status === 'listening' ? 'Tap to Pause' : 'Tap to Speak'}
            aria-label="Microphone button"
          >
            {status === 'listening' || status === 'recognizing' ? (
              <Mic className="w-10 h-10 animate-pulse" />
            ) : status === 'command-executed' ? (
              <CheckCircle2 className="w-10 h-10" />
            ) : (
              <Mic className="w-10 h-10" />
            )}
          </button>
        </div>

        {/* Status Message */}
        <div className="relative z-10 mt-2 mb-1">
          <p
            className={`text-sm sm:text-base font-bold ${
              status === 'listening' || status === 'recognizing'
                ? 'text-pink-400'
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

        {/* Real-time Spoken Transcript Box - Words appear as spoken */}
        <div className="relative z-10 w-full min-h-[68px] bg-[#090510]/90 border border-[#352044] rounded-2xl p-3 my-2.5 flex items-center justify-center text-center">
          {transcript ? (
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-extrabold block">
                ✓ SPEECH RECOGNIZED:
              </span>
              <p className="text-base sm:text-lg font-black text-white tracking-wide break-words line-clamp-2">
                "{transcript}"
              </p>
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-[#B7A6C8]/70 italic">
              Speak any song or artist (e.g. "Kesariya", "Arijit Singh", "Shubh", "Diljit Dosanjh", "ગુજરાતી ગીતો")...
            </p>
          )}
        </div>

        {/* Quick Search Action when speech is heard */}
        {transcript && (
          <button
            onClick={() => handleFinalSpeech(transcript)}
            className="relative z-10 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white font-bold text-xs shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 mb-2 min-h-[42px]"
          >
            <Search className="w-4 h-4" />
            <span>Search for "{transcript}"</span>
          </button>
        )}

        {/* Direct Text Search Bar (Always available as instant fallback) */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (manualText.trim()) {
              handleFinalSpeech(manualText.trim());
            }
          }}
          className="relative z-10 w-full mt-2 flex items-center gap-2"
        >
          <input
            type="text"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Or type song/artist to search..."
            className="flex-1 bg-[#090510] rounded-xl px-3.5 py-2.5 text-sm sm:text-base text-white placeholder-slate-400 border border-[#352044] focus:border-[#A020F0] outline-none min-h-[44px]"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition-all flex-shrink-0 min-h-[44px] flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        </form>

        {/* Helpful Spoken Examples */}
        <div className="relative z-10 w-full mt-4 pt-3 border-t border-[#352044]/60">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#B7A6C8]/70 mb-2">
            Try clicking any suggestion:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
            {[
              { label: '🎵 Kesariya', val: 'Kesariya' },
              { label: '👑 Shubh', val: 'Shubh' },
              { label: '💖 Arijit Singh', val: 'Arijit Singh' },
              { label: '🥁 Diljit Dosanjh', val: 'Diljit Dosanjh' },
              { label: '🪕 ગુજરાતી ગીતો', val: 'Aditya Gadhvi' },
            ].map((sample) => (
              <button
                key={sample.val}
                onClick={() => {
                  setTranscript(sample.val);
                  handleFinalSpeech(sample.val);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#170D24] hover:bg-[#231338] text-[#B7A6C8] hover:text-white border border-[#352044] transition-all min-h-[30px]"
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
