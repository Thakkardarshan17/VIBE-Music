import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Music, Headphones, Volume2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { VibeLogo } from '../common/VibeLogo.js';
import './SplashScreen.css';

interface SplashScreenProps {
  onComplete?: () => void;
  isStandalone?: boolean;
}

interface Particle {
  id: number;
  top: string;
  left: string;
  size: number;
  color: string;
  duration: number;
  delay: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, isStandalone = false }) => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [progress, setProgress] = useState<number>(0);
  const [phase, setPhase] = useState<'initial' | 'reveal' | 'ready' | 'exit'>('initial');
  const [isExiting, setIsExiting] = useState<boolean>(false);

  // Generate deterministic floating particles
  const particles: Particle[] = useMemo(() => {
    return Array.from({ length: 22 }, (_, i) => ({
      id: i,
      top: `${10 + ((i * 19) % 80)}%`,
      left: `${5 + ((i * 31) % 90)}%`,
      size: 4 + (i % 5) * 2,
      color: i % 2 === 0 ? 'rgba(160, 32, 240, 0.55)' : 'rgba(229, 29, 135, 0.5)',
      duration: 3 + (i % 4) * 0.8,
      delay: (i % 7) * 0.3,
    }));
  }, []);

  // Equalizer bar heights pattern
  const eqBars = [
    { height: 45, delay: 0.1 },
    { height: 75, delay: 0.25 },
    { height: 100, delay: 0.05 },
    { height: 60, delay: 0.3 },
    { height: 90, delay: 0.15 },
    { height: 50, delay: 0.35 },
    { height: 85, delay: 0.2 },
    { height: 40, delay: 0.4 },
    { height: 95, delay: 0.1 },
    { height: 70, delay: 0.3 },
    { height: 55, delay: 0.2 },
    { height: 80, delay: 0.45 },
    { height: 65, delay: 0.15 },
    { height: 90, delay: 0.35 },
    { height: 45, delay: 0.25 },
    { height: 75, delay: 0.05 },
  ];

  // Animate progress smoothly over ~2.4 seconds
  useEffect(() => {
    setPhase('reveal');

    const startTime = Date.now();
    const duration = 2400; // 2.4s to reach 100%

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);
        setPhase('ready');
      }
    }, 30);

    return () => clearInterval(interval);
  }, []);

  // Handle completion and authentication routing
  const handleFinish = () => {
    setIsExiting(true);

    setTimeout(() => {
      sessionStorage.setItem('vibe_splash_shown', 'true');

      if (onComplete) {
        onComplete();
      }

      // Check user routing rules:
      localStorage.setItem('vibe_visited', 'true');

      if (isAuthenticated) {
        // Logged in -> Direct to Home
        if (isStandalone) {
          navigate('/');
        }
      } else {
        // Unauthenticated -> Google-Only Welcome / Login screen
        navigate('/login');
      }
    }, 450); // smooth fade transition
  };

  // Trigger exit when ready (after short hold)
  useEffect(() => {
    if (phase === 'ready' && !authLoading) {
      const exitTimer = setTimeout(() => {
        handleFinish();
      }, 350);
      return () => clearTimeout(exitTimer);
    }
  }, [phase, authLoading]);

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          key="vibe-splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className="fixed inset-0 z-[99999] bg-[#090510] flex flex-col justify-between items-center px-4 py-4 sm:py-6 md:py-8 select-none overflow-hidden"
          style={{ minHeight: '100dvh' }}
        >
          {/* =========================================================
              1. BACKGROUND AMBIENT GLOWS & PARTICLES
             ========================================================= */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Deep dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#06020D] via-[#090510] to-[#12091D]" />

            {/* Glowing radial ambient orbs */}
            <div className="absolute -top-32 -left-32 w-72 sm:w-96 md:w-[480px] h-72 sm:h-96 md:h-[480px] rounded-full bg-[#A020F0]/25 blur-[100px] splash-ambient-glow" />
            <div className="absolute -bottom-32 -right-32 w-72 sm:w-96 md:w-[480px] h-72 sm:h-96 md:h-[480px] rounded-full bg-[#E51D87]/20 blur-[110px] splash-ambient-glow" style={{ animationDelay: '2.5s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] rounded-full bg-gradient-to-tr from-[#A020F0]/15 to-[#E51D87]/15 blur-[80px]" />

            {/* Floating Music Particles */}
            {particles.map((p) => (
              <div
                key={p.id}
                className="splash-particle"
                style={{
                  top: p.top,
                  left: p.left,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  backgroundColor: p.color,
                  boxShadow: `0 0 12px ${p.color}`,
                  animationDuration: `${p.duration}s`,
                  animationDelay: `${p.delay}s`,
                }}
              />
            ))}
          </div>

          {/* Top Skip / Version indicator (Subtle & Non-intrusive) */}
          <div className="relative z-10 w-full max-w-5xl flex items-center justify-between text-xs text-[#B7A6C8]/70 px-2 sm:px-4">
            <span className="font-mono text-[10px] sm:text-[11px] tracking-wider uppercase text-purple-400/90 flex items-center gap-1.5 whitespace-nowrap shrink-0">
              <Headphones className="w-3.5 h-3.5 text-[#E51D87] shrink-0" /> Lossless High&#8209;Fidelity
            </span>
            <button
              onClick={handleFinish}
              className="text-[11px] font-semibold text-[#B7A6C8] hover:text-white px-2.5 py-1 rounded-full bg-[#170D24]/80 border border-[#352044] hover:border-[#A020F0] transition-all min-h-[32px] flex items-center gap-1"
            >
              Skip
            </button>
          </div>

          {/* =========================================================
              2. CENTER: LOGO REVEAL, EQUALIZER & TAGLINE
             ========================================================= */}
          <div className="relative z-10 flex flex-col items-center justify-center my-auto px-4 max-w-lg w-full text-center">
            {/* Logo Wrapper with Frequency Wave Rings */}
            <div className="relative mb-3 sm:mb-4 flex items-center justify-center">
              {/* Frequency Wave Rings Pulsing Outward */}
              <div className="splash-wave-ring w-32 h-32 sm:w-44 sm:h-44" />
              <div className="splash-wave-ring w-32 h-32 sm:w-44 sm:h-44" />
              <div className="splash-wave-ring w-32 h-32 sm:w-44 sm:h-44" />
              <div className="splash-wave-ring w-32 h-32 sm:w-44 sm:h-44" />

              {/* Official VIBE MUSIC Logo Reveal (Scales 70% -> 100%) */}
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                className="relative flex items-center justify-center"
              >
                <VibeLogo size="xl" glow={true} animated={false} />
              </motion.div>
            </div>

            {/* 3. MUSIC EQUALIZER BARS (Visualizer Rhythm) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex items-end justify-center gap-1 sm:gap-1.5 h-6 sm:h-8 my-2 sm:my-3 px-3 sm:px-4 py-1 rounded-xl bg-[#170D24]/70 border border-[#352044] backdrop-blur-md shadow-inner"
            >
              {eqBars.map((bar, idx) => (
                <div
                  key={idx}
                  className="w-1 sm:w-1.5 rounded-full bg-gradient-to-t from-[#A020F0] via-purple-400 to-[#E51D87] splash-eq-bar"
                  style={{
                    height: `${bar.height}%`,
                    animationDelay: `${bar.delay}s`,
                  }}
                />
              ))}
            </motion.div>

            {/* 4. LOADING PROGRESS BAR & INDICATOR */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="w-full max-w-[260px] sm:max-w-xs space-y-2 mt-2"
            >
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-[#B7A6C8]">
                <span className="flex items-center gap-1.5 font-medium">
                  <Music className="w-3 h-3 text-[#E51D87] animate-pulse" />
                  Loading Your VIBE Experience...
                </span>
                <span className="font-mono font-bold text-white">{progress}%</span>
              </div>

              {/* Glowing Progress Bar Track */}
              <div className="w-full h-1.5 sm:h-2 bg-[#170D24] rounded-full overflow-hidden border border-[#352044] relative shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-[#A020F0] via-[#C026D3] to-[#E51D87] rounded-full transition-all duration-100 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  {/* Glowing shimmer light */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent splash-shimmer" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* =========================================================
              5. DEVELOPER CREDIT - SPLASH SCREEN FOOTER
             ========================================================= */}
          <motion.footer
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 w-full text-center pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
          >
            <p className="text-xs sm:text-sm text-[#B7A6C8] tracking-wide font-medium splash-dev-glow">
              Developed by{' '}
              <span className="font-black bg-gradient-to-r from-[#A020F0] via-pink-400 to-[#E51D87] bg-clip-text text-transparent">
                Thakkar Darshan
              </span>
            </p>
          </motion.footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
