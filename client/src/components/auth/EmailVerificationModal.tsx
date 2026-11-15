import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, X, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface EmailVerificationModalProps {
  email: string;
  demoCode?: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  email,
  demoCode,
  onSuccess,
  onCancel,
}) => {
  const { verifyEmail, resendVerificationCode } = useAuth();
  const [code, setCode] = useState<string>(demoCode || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [currentDemoCode, setCurrentDemoCode] = useState<string>(demoCode || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await verifyEmail({ email, code: code.trim() });
      setSuccess('Email verified successfully! Welcome to VIBE.');
      setTimeout(() => {
        onSuccess();
      }, 700);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid or expired verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    setResending(true);
    try {
      const res = await resendVerificationCode(email);
      setSuccess('A new verification code has been dispatched.');
      if (res.demoCode) {
        setCurrentDemoCode(res.demoCode);
        setCode(res.demoCode);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-[#12091D] border border-[#352044] p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-[#A020F0]/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-[#E51D87]/20 rounded-full blur-3xl pointer-events-none" />

        {onCancel && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-2 text-[#B7A6C8] hover:text-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#A020F0]/20 to-[#E51D87]/20 border border-[#A020F0]/40 flex items-center justify-center mx-auto mb-4 text-[#E51D87] shadow-[0_0_25px_rgba(160,32,240,0.3)]">
            <Mail className="w-8 h-8" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">Verify Your Email</h3>
          <p className="text-xs sm:text-sm text-[#B7A6C8] mt-2 leading-relaxed">
            We sent a 6-digit confirmation code to:
            <span className="text-purple-300 font-semibold block mt-0.5 break-all">{email}</span>
          </p>
        </div>

        {/* Development Demo Code Pill for Instant Verification */}
        {currentDemoCode && (
          <div className="mb-5 p-3 rounded-2xl bg-[#170D24] border border-[#A020F0]/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-purple-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verification Code:</span>
            </div>
            <button
              type="button"
              onClick={() => setCode(currentDemoCode)}
              className="font-mono font-bold text-sm text-[#E51D87] bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-[#E51D87]/30 transition-all cursor-pointer"
              title="Click to auto-fill"
            >
              {currentDemoCode} (Auto-Fill)
            </button>
          </div>
        )}

        {/* Feedback alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/50 flex items-center gap-2.5 text-red-300 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50 flex items-center gap-2.5 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Verification Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-center">
              Enter 6-Digit Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="123456"
              className="w-full tracking-[0.5em] text-center font-mono font-black text-2xl py-3 px-4 rounded-2xl bg-[#170D24] border border-[#352044] focus:border-[#A020F0] text-white shadow-inner focus:outline-none focus:ring-2 focus:ring-[#A020F0]/30 transition-all"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white font-bold text-sm shadow-lg shadow-[#A020F0]/30 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 min-h-[46px]"
          >
            {loading ? 'Verifying...' : 'Verify & Launch VIBE'}
          </button>

          <div className="pt-2 flex items-center justify-between text-xs text-[#B7A6C8]">
            <span>Didn't receive the code?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-[#E51D87] hover:underline flex items-center gap-1 font-semibold disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
              Resend Code
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

