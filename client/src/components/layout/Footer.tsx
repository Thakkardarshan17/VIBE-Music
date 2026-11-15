import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Headphones, ShieldCheck, Heart, Sparkles, Disc3, Radio } from 'lucide-react';
import { VibeLogo } from '../common/VibeLogo.js';

export const Footer: React.FC = () => {
  const location = useLocation();

  // Hide footer on splash screen
  if (location.pathname === '/splash') return null;

  return (
    <footer className="mt-16 pt-10 pb-8 border-t border-[#352044] select-none text-[#B7A6C8]">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
        {/* Official VIBE Logo & Tagline */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-2">
          <VibeLogo size="md" linkToHome={true} />
          <p className="text-xs text-[#B7A6C8] max-w-sm mt-1">
            Studio-grade music streaming web application. Unlimited playback of Hindi, Punjabi, Bollywood, Gujarati and Global artists.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
          <NavLink to="/" className="hover:text-white transition-colors">Home</NavLink>
          <NavLink to="/explore" className="hover:text-white transition-colors">Explore</NavLink>
          <NavLink to="/search" className="hover:text-white transition-colors">Search</NavLink>
          <NavLink to="/trending" className="hover:text-white transition-colors">Trending</NavLink>
          <NavLink to="/library" className="hover:text-white transition-colors">Library</NavLink>
          <NavLink to="/settings" className="hover:text-white transition-colors">Settings</NavLink>
        </div>
      </div>

      {/* Badges Row */}
      <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-3 text-[11px] py-4 border-y border-[#352044]/60">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 sm:gap-x-6 gap-y-2 whitespace-nowrap select-none">
          <span className="inline-flex items-center gap-1.5 text-slate-300 whitespace-nowrap text-[10.5px] sm:text-xs shrink-0 font-medium">
            <Headphones className="w-3.5 h-3.5 text-[#E51D87] shrink-0" />
            <span className="whitespace-nowrap">Lossless High&#8209;Fidelity</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-300 whitespace-nowrap text-[10.5px] sm:text-xs shrink-0 font-medium">
            <Disc3 className="w-3.5 h-3.5 text-[#A020F0] shrink-0" />
            <span className="whitespace-nowrap">Full Song Playback</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-300 whitespace-nowrap text-[10.5px] sm:text-xs shrink-0 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="whitespace-nowrap">Authorized Streaming</span>
          </span>
        </div>

        <p className="text-[10.5px] sm:text-xs text-[#B7A6C8] whitespace-nowrap text-center md:text-right shrink-0">
          © {new Date().getFullYear()} <strong className="text-white">VIBE MUSIC</strong>. All rights reserved.
        </p>
      </div>

      {/* Bottom Developer Credit */}
      <div className="pt-4 text-center">
        <p className="text-xs text-[#B7A6C8]">
          Developed by{' '}
          <span className="font-bold bg-gradient-to-r from-[#A020F0] to-[#E51D87] bg-clip-text text-transparent">
            Thakkar Darshan
          </span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;

