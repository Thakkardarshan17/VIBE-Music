import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Compass,
  Search,
  Flame,
  BarChart2,
  Sparkles,
  Users,
  Disc,
  Library,
  ListMusic,
  Heart,
  Clock,
  Settings,
  ShieldCheck,
  Radio,
  Headphones,
  Activity,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { playlistApi } from '../../services/api.js';
import { Playlist } from '../../types/music.js';
import { VibeLogo } from '../common/VibeLogo.js';
import { useTranslation } from '../../context/LanguageContext.js';

export const Sidebar: React.FC = () => {
  const { user, isAdmin, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      playlistApi.list().then(setPlaylists).catch(() => {});
    } else {
      setPlaylists([]);
    }
  }, [isAuthenticated]);

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all min-h-[40px] ${
      isActive
        ? 'bg-gradient-to-r from-[#A020F0]/30 to-[#E51D87]/20 text-white border-l-4 border-[#A020F0] shadow-md'
        : 'text-[#B7A6C8] hover:text-white hover:bg-[#170D24]'
    }`;

  return (
    <aside className="w-64 bg-[#12091D]/90 backdrop-blur-xl border-r border-[#352044] h-screen flex flex-col justify-between py-6 px-4 select-none flex-shrink-0 hidden lg:flex">
      {/* Official VIBE MUSIC Brand Header */}
      <div className="overflow-y-auto pr-1">
        <div className="px-2 mb-6 flex justify-start">
          <VibeLogo size="md" linkToHome={true} />
        </div>

        {/* Primary Navigation */}
        <div className="space-y-1 mb-6">
          <span className="px-3 text-[10px] font-bold tracking-wider uppercase text-[#B7A6C8]/70">{t('discover')}</span>
          <NavLink to="/" className={navItemClass}>
            <Home className="w-4 h-4 text-[#A020F0]" /> {t('home')}
          </NavLink>
          <NavLink to="/explore" className={navItemClass}>
            <Compass className="w-4 h-4 text-[#E51D87]" /> {t('explore')}
          </NavLink>
          <NavLink to="/search" className={navItemClass}>
            <Search className="w-4 h-4 text-purple-400" /> {t('search')}
          </NavLink>
          <NavLink to="/player" className={navItemClass}>
            <Headphones className="w-4 h-4 text-pink-400" /> Music Studio
          </NavLink>
          <NavLink to="/trending" className={navItemClass}>
            <Flame className="w-4 h-4 text-amber-400" /> {t('trending')}
          </NavLink>
          <NavLink to="/charts" className={navItemClass}>
            <BarChart2 className="w-4 h-4 text-emerald-400" /> {t('topCharts')}
          </NavLink>
          <NavLink to="/new-releases" className={navItemClass}>
            <Sparkles className="w-4 h-4 text-cyan-400" /> New Releases
          </NavLink>
          <NavLink to="/artists" className={navItemClass}>
            <Users className="w-4 h-4 text-purple-300" /> {t('artists')}
          </NavLink>
          <NavLink to="/albums" className={navItemClass}>
            <Disc className="w-4 h-4 text-pink-300" /> {t('albums')}
          </NavLink>
        </div>

        {/* Library Navigation */}
        <div className="space-y-1">
          <span className="px-3 text-[10px] font-bold tracking-wider uppercase text-[#B7A6C8]/70">{t('library')}</span>
          <NavLink to="/dashboard" className={navItemClass}>
            <Activity className="w-4 h-4 text-[#A020F0]" /> {t('dashboard')}
          </NavLink>
          <NavLink to="/library" className={navItemClass}>
            <Library className="w-4 h-4 text-purple-400" /> {t('library')}
          </NavLink>
          <NavLink to="/playlists" className={navItemClass}>
            <ListMusic className="w-4 h-4 text-violet-400" /> {t('playlists')}
          </NavLink>
          <NavLink to="/liked" className={navItemClass}>
            <Heart className="w-4 h-4 text-[#E51D87]" /> {t('likedSongs')}
          </NavLink>
          <NavLink to="/history" className={navItemClass}>
            <Clock className="w-4 h-4 text-cyan-400" /> {t('history')}
          </NavLink>
        </div>
      </div>

      {/* Bottom User / Admin Section */}
      <div className="pt-4 border-t border-[#352044] space-y-1">
        {isAdmin && (
          <NavLink to="/admin" className={navItemClass}>
            <ShieldCheck className="w-4 h-4 text-[#E51D87]" /> Admin Dashboard
          </NavLink>
        )}
        <NavLink to="/settings" className={navItemClass}>
          <Settings className="w-4 h-4 text-[#B7A6C8]" /> {t('settings')}
        </NavLink>

        {isAuthenticated && user && (
          <NavLink
            to="/profile"
            className="flex items-center gap-3 p-2 mt-2 rounded-xl bg-[#170D24] hover:bg-[#231338] border border-[#352044] transition-all"
          >
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80'}
              alt={user.username}
              className="w-8 h-8 rounded-full object-cover border border-[#A020F0]"
            />
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-semibold text-white truncate">{user.username}</p>
              <p className="text-[10px] text-[#B7A6C8] truncate capitalize">{user.role.toLowerCase()}</p>
            </div>
          </NavLink>
        )}
      </div>
    </aside>
  );
};
