import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, Search, Library, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useTranslation } from '../../context/LanguageContext.js';

export const MobileNav: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center gap-1 py-1 text-[10px] font-semibold transition-colors flex-1 min-h-[44px] ${
      isActive ? 'text-[#E51D87]' : 'text-[#B7A6C8] hover:text-white'
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-14 bg-[#090510]/95 backdrop-blur-xl border-t border-[#352044] lg:hidden flex items-center justify-around px-2 shadow-2xl pb-safe">
      <NavLink to="/" className={navItemClass}>
        <Home className="w-4 h-4" /> {t('home')}
      </NavLink>
      <NavLink to="/explore" className={navItemClass}>
        <Compass className="w-4 h-4" /> {t('explore')}
      </NavLink>
      <NavLink to="/search" className={navItemClass}>
        <Search className="w-4 h-4" /> {t('search')}
      </NavLink>
      <NavLink to="/library" className={navItemClass}>
        <Library className="w-4 h-4" /> {t('library')}
      </NavLink>
      <NavLink to={isAuthenticated ? '/profile' : '/login'} className={navItemClass}>
        <User className="w-4 h-4" /> {isAuthenticated ? 'Profile' : 'Account'}
      </NavLink>
    </nav>
  );
};
