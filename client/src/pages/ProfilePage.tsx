import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  User,
  MapPin,
  Music,
  Globe,
  Save,
  CheckCircle,
  Radio,
  LogOut,
  ShieldCheck,
  Activity,
  AlertCircle,
  Calendar,
  Sparkles,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { meApi } from '../services/api.js';

export const ProfilePage: React.FC = () => {
  const { user, profile, updateProfile, promptLogout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState<string>(user?.fullName || user?.username || '');
  const [username, setUsername] = useState<string>(user?.username || '');
  const [bio, setBio] = useState<string>(profile?.bio || '');
  const [location, setLocation] = useState<string>(profile?.location || '');
  const [favoriteGenres, setFavoriteGenres] = useState<string>(profile?.favoriteGenres || '');
  const [website, setWebsite] = useState<string>(profile?.website || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatarUrl || '');
  const [success, setSuccess] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Quick stats
  const [userStats, setUserStats] = useState<any>(null);

  useEffect(() => {
    if (isAuthenticated) {
      meApi.getStatistics().then(setUserStats).catch(() => {});
    }
  }, [isAuthenticated]);

  if (!isAuthenticated || !user) {
    return (
      <div className="glass-panel rounded-3xl p-12 text-center max-w-lg mx-auto my-12 border border-[#352044] animate-fadeIn">
        <User className="w-16 h-16 text-[#A020F0] mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">User Profile</h3>
        <p className="text-sm text-[#B7A6C8] mb-6">Please sign in to view and customize your VIBE profile.</p>
        <NavLink
          to="/login"
          className="px-6 py-3 rounded-full bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white font-bold text-sm shadow-lg hover:brightness-110 transition-all inline-block"
        >
          Continue with Google
        </NavLink>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      await updateProfile({
        fullName,
        username,
        bio,
        location,
        favoriteGenres,
        website,
        avatarUrl,
      });
      setSuccess('Profile updated successfully and synced with your account!');
      setTimeout(() => setSuccess(''), 3500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-fadeIn">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#170D24] border border-[#352044] text-[#B7A6C8] text-xs font-semibold mb-2">
            <User className="w-3.5 h-3.5 text-[#E51D87]" /> Account & Identity
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Your Music Profile</h2>
          <p className="text-sm text-[#B7A6C8] mt-1">
            Manage your personal profile, view Google account security, and access music analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <NavLink
            to="/dashboard"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white font-bold text-xs shadow-md hover:brightness-110 transition-all flex items-center gap-1.5 min-h-[42px]"
          >
            <Activity className="w-4 h-4" />
            <span>Music Dashboard</span>
          </NavLink>
          <button
            onClick={() => promptLogout()}
            className="px-4 py-2.5 rounded-xl bg-[#170D24] border border-red-500/30 text-red-300 hover:text-red-200 hover:bg-red-950/40 text-xs font-bold transition-all flex items-center gap-2 min-h-[42px]"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {success && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs flex items-center gap-2.5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Profile Header Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-panel border border-[#352044] p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 shadow-2xl">
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-[#A020F0] shadow-2xl ring-4 ring-[#E51D87]/20 flex-shrink-0">
          <img
            src={avatarUrl || user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80'}
            alt={fullName || user.username}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
            <h3 className="text-2xl sm:text-3xl font-black text-white">{fullName || user.username}</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Google Verified</span>
            </span>
          </div>

          <p className="text-xs sm:text-sm text-[#B7A6C8] font-mono">{user.email}</p>

          <p className="text-xs text-slate-300 max-w-xl">
            {bio || 'Music lover streaming lossless audio and HD music videos on VIBE.'}
          </p>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs text-[#B7A6C8]">
            <span>
              <strong className="text-white">{userStats?.totalSongsPlayed || 0}</strong> songs played
            </span>
            <span>•</span>
            <span>
              <strong className="text-white">{userStats?.totalListeningHours || '0'}h</strong> listening
            </span>
            <span>•</span>
            <span>
              <strong className="text-white">{userStats?.totalLikedSongs || 0}</strong> liked tracks
            </span>
          </div>
        </div>
      </div>

      {/* Profile Details Edit Form */}
      <form onSubmit={handleSaveProfile} className="glass-panel rounded-3xl p-6 md:p-8 border border-[#352044] space-y-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#352044]">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#A020F0]" /> Personal Profile Details
          </h3>
          <span className="text-xs text-[#B7A6C8]">Public VIBE Identity</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">Username / Handle</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. johndoe"
              className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">Location / City</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#B7A6C8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Mumbai, India"
                className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500"
              />
            </div>
          </div>

          {/* Favorite Genres */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">Favorite Genres</label>
            <div className="relative">
              <Music className="w-4 h-4 text-[#B7A6C8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={favoriteGenres}
                onChange={(e) => setFavoriteGenres(e.target.value)}
                placeholder="e.g. Bollywood, Punjabi, EDM, Lo-Fi"
                className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500"
              />
            </div>
          </div>

          {/* Bio */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">About Me / Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell other music enthusiasts about your taste and favourite beats..."
              className="w-full glass-input rounded-xl p-3.5 text-sm text-white placeholder-slate-500 resize-none"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white font-bold text-sm shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2 min-h-[44px]"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving Changes...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>

      {/* Account Security & Google Authentication Card (Password Reset Completely Removed) */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 border border-[#352044] space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#352044]">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" /> Account Security & Authentication
          </h3>
          <span className="text-xs text-emerald-300 font-semibold">Active & Protected</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
          <div className="p-4 rounded-2xl bg-[#090510]/80 border border-[#352044]">
            <span className="text-[10px] uppercase font-bold text-[#B7A6C8]">Authentication Method</span>
            <p className="font-bold text-white mt-1 text-sm flex items-center gap-1.5">
              <span>Google OAuth 2.0</span>
            </p>
            <p className="text-[11px] text-[#B7A6C8] mt-0.5">Passwordless secure sign-in</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#090510]/80 border border-[#352044]">
            <span className="text-[10px] uppercase font-bold text-[#B7A6C8]">Verified Email</span>
            <p className="font-bold text-white mt-1 text-sm truncate">{user.email}</p>
            <p className="text-[11px] text-emerald-400 mt-0.5">Identity verified</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#090510]/80 border border-[#352044]">
            <span className="text-[10px] uppercase font-bold text-[#B7A6C8]">Session Security</span>
            <p className="font-bold text-[#E51D87] mt-1 text-sm">30-Day Encrypted JWT</p>
            <p className="text-[11px] text-[#B7A6C8] mt-0.5">Auto-revoked upon logout</p>
          </div>
        </div>

        <div className="pt-2 text-xs text-[#B7A6C8]/80 leading-relaxed">
          <p>
            Your VIBE account is authenticated through Google Identity Services. Passwords are never stored or needed, ensuring bank-grade protection for your private listening history, playlists, and favorites.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
