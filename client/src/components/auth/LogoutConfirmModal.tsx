import React, { useState } from 'react';
import { LogOut, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

export const LogoutConfirmModal: React.FC = () => {
  const { showLogoutModal, setShowLogoutModal, confirmLogout, user } = useAuth();
  const [loggingOut, setLoggingOut] = useState<boolean>(false);

  if (!showLogoutModal) return null;

  const handleConfirm = async () => {
    setLoggingOut(true);
    try {
      await confirmLogout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-[#12091D] border border-[#352044] p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-[#E51D87]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-[#A020F0]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => setShowLogoutModal(false)}
          className="absolute top-4 right-4 p-2 text-[#B7A6C8] hover:text-white rounded-full transition-colors"
          title="Cancel"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <LogOut className="w-8 h-8" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">Log Out of VIBE?</h3>
          <p className="text-xs sm:text-sm text-[#B7A6C8] mt-2 leading-relaxed">
            {user?.fullName || user?.username ? (
              <span className="text-purple-300 font-semibold block mb-1">
                Signed in as {user.fullName || user.username}
              </span>
            ) : null}
            Your active music session will end. All your playlists, liked songs, and listening history remain safe and intact.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-6">
          <button
            type="button"
            onClick={() => setShowLogoutModal(false)}
            disabled={loggingOut}
            className="flex-1 py-3 px-4 rounded-xl bg-[#170D24] border border-[#352044] hover:border-slate-500 text-slate-300 hover:text-white text-sm font-semibold transition-all min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loggingOut}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-[#E51D87] text-white text-sm font-bold shadow-lg shadow-red-600/30 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 min-h-[44px]"
          >
            <LogOut className="w-4 h-4" />
            {loggingOut ? 'Signing out...' : 'Log Out'}
          </button>
        </div>
      </div>
    </div>
  );
};

