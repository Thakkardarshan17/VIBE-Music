import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Headphones,
  Music2,
  Video,
  Mic,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  X,
  FileText,
  Lock,
} from 'lucide-react';
import { VibeLogo } from '../components/common/VibeLogo.js';
import { GoogleAuthButton } from '../components/auth/GoogleAuthButton.js';
import { useAuth } from '../context/AuthContext.js';

export const LoginPage: React.FC = () => {
  const [error, setError] = useState<string>('');
  const [isVerifyingRedirect, setIsVerifyingRedirect] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);

  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Destination after successful login
  const from = (location.state as any)?.from?.pathname || '/';

  // Handle Google OAuth 2.0 full-page redirect callback (Crucial for mobile devices & cross-device)
  React.useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;

    // 1. Check for cancel/error returned from Google OAuth
    if (hash.includes('error=') || search.includes('error=')) {
      const params = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : search);
      const errorReason = params.get('error_description') || params.get('error') || 'Google sign-in was cancelled.';
      window.history.replaceState(null, '', window.location.pathname);
      handleLoginError(errorReason);
      return;
    }

    // 2. Check for successful access_token in hash
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      if (accessToken) {
        setIsVerifyingRedirect(true);
        googleLogin(accessToken)
          .then(() => {
            window.history.replaceState(null, '', window.location.pathname);
            navigate(from, { replace: true });
          })
          .catch((err) => {
            setIsVerifyingRedirect(false);
            window.history.replaceState(null, '', window.location.pathname);
            handleLoginError(err.response?.data?.error || err.message || 'Google OAuth verification failed');
          });
      }
    }
  }, []);

  const handleLoginSuccess = () => {
    navigate(from, { replace: true });
  };

  const handleLoginError = (errMessage: string) => {
    // Human-friendly error parsing
    if (errMessage.includes('popup_closed') || errMessage.includes('closed')) {
      setError('Google sign-in was closed before completing. Please try again.');
    } else if (errMessage.includes('invalid_client') || errMessage.includes('not found')) {
      setError('Google Cloud Client ID register nahi hai ya invalid hai. Google Cloud Console se apna real Client ID .env me enter karein.');
    } else if (errMessage.includes('network') || errMessage.includes('Network')) {
      setError('Network connection error. Please check your internet connection.');
    } else if (errMessage.includes('expired') || errMessage.includes('Invalid')) {
      setError('Google session has expired. Please sign in again.');
    } else {
      setError(errMessage || 'Google authentication failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-3 sm:p-6 lg:p-10 relative overflow-hidden bg-[#090510] text-white">
      {/* Ambient Neon Glow Lighting Effects */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#A020F0]/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#E51D87]/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#A020F0]/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Main Authentication Container */}
      <div className="w-full max-w-xl mx-auto rounded-3xl glass-panel border border-[#352044] shadow-2xl p-6 sm:p-10 md:p-12 relative z-10 flex flex-col items-center text-center animate-fadeIn">
        {/* VIBE Brand Logo */}
        <div className="mb-6 flex justify-center">
          <VibeLogo size="lg" linkToHome={false} glow={true} />
        </div>

        {/* Primary Welcome Headings */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Welcome to{' '}
          <span className="bg-gradient-to-r from-[#A020F0] via-[#E51D87] to-pink-400 bg-clip-text text-transparent">
            VIBE
          </span>
        </h1>
        <p className="text-sm sm:text-base text-[#B7A6C8] font-medium mt-2 max-w-md">
          Your Music. Your World.
        </p>

        {/* Feature Highlights Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full my-6 sm:my-8 text-left">
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#170D24]/80 border border-[#352044]">
            <div className="w-7 h-7 rounded-xl bg-[#A020F0]/20 border border-[#A020F0]/30 flex items-center justify-center text-[#A020F0] flex-shrink-0">
              <Headphones className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-white">Lossless Audio</div>
              <div className="text-[10px] text-[#B7A6C8]">High-Fidelity Sound</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#170D24]/80 border border-[#352044]">
            <div className="w-7 h-7 rounded-xl bg-[#E51D87]/20 border border-[#E51D87]/30 flex items-center justify-center text-[#E51D87] flex-shrink-0">
              <Video className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-white">Music Videos</div>
              <div className="text-[10px] text-[#B7A6C8]">HD Video Streams</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#170D24]/80 border border-[#352044]">
            <div className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 flex-shrink-0">
              <Mic className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-white">Smart Voice</div>
              <div className="text-[10px] text-[#B7A6C8]">Multi-language Voice</div>
            </div>
          </div>
        </div>

        {/* Error Alert Display with Retry Button */}
        {error && (
          <div className="w-full mb-5 p-3.5 rounded-2xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs flex items-center justify-between gap-3 animate-fadeIn text-left">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError('')}
              className="p-1 rounded-lg hover:bg-red-900/50 text-red-300 transition-colors flex items-center gap-1 text-[11px] flex-shrink-0"
              title="Dismiss error"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Verifying Google redirect banner */}
        {isVerifyingRedirect && (
          <div className="w-full mb-5 p-3.5 rounded-2xl bg-purple-950/70 border border-[#A020F0]/50 text-purple-200 text-xs flex items-center justify-center gap-2.5 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-[#E51D87]" />
            <span>Verifying Google account and initializing your profile...</span>
          </div>
        )}

        {/* Primary Action: Official Google Only Authentication */}
        <div className="w-full max-w-sm mb-6">
          <GoogleAuthButton
            buttonText="Continue with Google"
            onSuccess={handleLoginSuccess}
            onError={handleLoginError}
            className="w-full"
          />
        </div>

        {/* Trust & Security Badge */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-[#B7A6C8]/80 mb-6">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>Official Google OAuth 2.0 Verified Sign-In</span>
        </div>

        {/* Legal Links (Terms & Privacy) */}
        <div className="pt-4 border-t border-[#352044] w-full flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#B7A6C8]">
          <button
            type="button"
            onClick={() => setShowTermsModal(true)}
            className="hover:text-white transition-colors underline decoration-[#352044] hover:decoration-white"
          >
            Terms & Conditions
          </button>
          <span className="text-[#352044]">•</span>
          <button
            type="button"
            onClick={() => setShowPrivacyModal(true)}
            className="hover:text-white transition-colors underline decoration-[#352044] hover:decoration-white"
          >
            Privacy Policy
          </button>
        </div>

        <p className="text-[11px] text-[#B7A6C8]/60 mt-4">
          © 2026 VIBE MUSIC. All rights reserved.
        </p>
      </div>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setShowTermsModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl max-h-[85vh] rounded-3xl bg-[#12091D] border border-[#352044] p-6 sm:p-8 shadow-2xl overflow-y-auto text-left"
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#352044]">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-[#E51D87]" />
                <h3 className="text-lg font-bold text-white">Terms & Conditions</h3>
              </div>
              <button
                onClick={() => setShowTermsModal(false)}
                className="p-1.5 rounded-full text-[#B7A6C8] hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-[#B7A6C8] leading-relaxed">
              <p>
                <strong>1. Acceptance of Terms:</strong> By signing into and using VIBE MUSIC via Google Authentication, you agree to comply with and be bound by these Terms and Conditions.
              </p>
              <p>
                <strong>2. Service Description:</strong> VIBE MUSIC provides lossless streaming audio and music video playback for personal, non-commercial entertainment. Content catalogs include Hindi, Gujarati, Punjabi, Bollywood, and international libraries.
              </p>
              <p>
                <strong>3. Google Authentication:</strong> Users sign in exclusively using their Google Account. We do not store Google passwords. We receive your verified email, display name, and profile photo according to Google's standard OAuth scopes.
              </p>
              <p>
                <strong>4. User Conduct:</strong> You agree not to reverse-engineer, unlawfully duplicate, or redistribute media streamed through VIBE.
              </p>
              <p>
                <strong>5. Termination:</strong> You may discontinue use at any time by logging out and revoking access in your Google Account security settings.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#352044] flex justify-end">
              <button
                onClick={() => setShowTermsModal(false)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white text-xs font-bold hover:brightness-110 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setShowPrivacyModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl max-h-[85vh] rounded-3xl bg-[#12091D] border border-[#352044] p-6 sm:p-8 shadow-2xl overflow-y-auto text-left"
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#352044]">
              <div className="flex items-center gap-2.5">
                <Lock className="w-5 h-5 text-[#A020F0]" />
                <h3 className="text-lg font-bold text-white">Privacy Policy</h3>
              </div>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="p-1.5 rounded-full text-[#B7A6C8] hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-[#B7A6C8] leading-relaxed">
              <p>
                <strong>1. Information We Collect:</strong> When you sign in with Google, we collect your verified name, email address, profile avatar URL, and Google ID (sub).
              </p>
              <p>
                <strong>2. How We Use Information:</strong> Your profile data is used strictly to identify your VIBE account, save your playlists, preserve liked tracks, and record playback history.
              </p>
              <p>
                <strong>3. Data Protection:</strong> We employ industry-standard encryption and security tokens (JWT) to safeguard your account session. We never sell or share your personal data with third-party advertisers.
              </p>
              <p>
                <strong>4. Account Deletion:</strong> You have the right to request deletion of your VIBE account and associated listening history at any time.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#352044] flex justify-end">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white text-xs font-bold hover:brightness-110 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
