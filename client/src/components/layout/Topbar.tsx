import React, { useState } from 'react';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import { LogIn, UserPlus, LogOut, User, Shield, Radio, Headphones } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { LiveSearchAutocomplete } from '../search/LiveSearchAutocomplete.js';
import { VibeLogo } from '../common/VibeLogo.js';

interface TopbarProps {
  onToggleMobileNav?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleMobileNav }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isAdmin, promptLogout } = useAuth();
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  const isSearchPage = location.pathname === '/search';

  const handleQuickTagClick = (tag: string) => {
    navigate(`/search?q=${encodeURIComponent(tag)}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#12091D] border-b border-[#352044] px-3 sm:px-6 md:px-8 py-2 sm:py-2.5 flex items-center justify-between gap-2.5 sm:gap-4">
      {/* Mobile Branding */}
      <div className="flex items-center lg:hidden flex-shrink-0">
        <VibeLogo size="xs" linkToHome={true} />
      </div>

      {/* Smart Live Search Bar - Strictly SINGLE across the application (Hidden when on SearchPage to avoid double search bars) */}
      <div className="flex-1 max-w-2xl flex items-center gap-2 sm:gap-3 min-w-0">
        {isSearchPage ? (
          <div className="flex-1 min-w-0 flex items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300 px-3 py-1.5 rounded-full bg-[#170D24] border border-[#352044]">
              Intelligent Search
            </span>
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <LiveSearchAutocomplete
              isTopBar={true}
              onSearchSubmit={(q) => navigate(`/search?q=${encodeURIComponent(q)}`)}
            />
          </div>
        )}

        {/* Quick Language Pills (Desktop XL+) */}
        <div className="hidden xl:flex items-center gap-1.5 flex-shrink-0">
          {['Hindi', 'Gujarati', 'Bollywood', 'Punjabi', 'EDM'].map((tag) => (
            <button
              key={tag}
              onClick={() => handleQuickTagClick(tag)}
              className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#170D24] hover:bg-[#231338] text-[#B7A6C8] hover:text-white border border-[#352044] transition-all"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {isAuthenticated && user ? (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-[#170D24] border border-[#352044] transition-all min-h-[40px]"
            >
              <img
                src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80'}
                alt={user.username}
                className="w-8 h-8 rounded-full object-cover border border-[#A020F0]"
              />
              <span className="hidden md:block text-xs font-semibold text-slate-200 max-w-[100px] truncate pr-1.5">
                {user.username}
              </span>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-[#170D24] rounded-2xl p-2 border border-[#352044] shadow-2xl z-50 animate-fadeIn">
                <div className="px-3 py-2 border-b border-[#352044] mb-1">
                  <p className="text-xs font-bold text-white truncate">{user.username}</p>
                  <p className="text-[10px] text-[#B7A6C8] truncate">{user.email}</p>
                </div>

                <NavLink
                  to="/profile"
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-[#231338] hover:text-white"
                >
                  <User className="w-3.5 h-3.5 text-[#A020F0]" /> My Profile
                </NavLink>

                <NavLink
                  to="/player"
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-[#231338] hover:text-white"
                >
                  <Headphones className="w-3.5 h-3.5 text-pink-400" /> Audio Studio
                </NavLink>

                {isAdmin && (
                  <NavLink
                    to="/admin"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#E51D87] hover:bg-[#231338]"
                  >
                    <Shield className="w-3.5 h-3.5" /> Admin Dashboard
                  </NavLink>
                )}

                <button
                  onClick={() => {
                    setShowDropdown(false);
                    promptLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 text-left mt-1 border-t border-[#352044]"
                >
                  <LogOut className="w-3.5 h-3.5" /> Log Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <NavLink
              to="/login"
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-[#B7A6C8] hover:text-white hover:bg-[#170D24] transition-colors min-h-[36px]"
            >
              <LogIn className="w-3.5 h-3.5" /> Log In
            </NavLink>
            <NavLink
              to="/signup"
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white shadow-md hover:brightness-110 active:scale-95 transition-all min-h-[36px]"
            >
              <UserPlus className="w-3.5 h-3.5" /> Sign Up
            </NavLink>
          </div>
        )}
      </div>
    </header>
  );
};
