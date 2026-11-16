import React from 'react';
import { Disc, Calendar } from 'lucide-react';
import { Album } from '../../types/music.js';
import { AlbumArtwork } from '../common/AlbumArtwork.js';

interface AlbumCardProps {
  album: Album;
  onClick?: () => void;
}

export const AlbumCard: React.FC<AlbumCardProps> = ({ album, onClick }) => {
  if (!album || !album.title) return null;
  return (
    <div
      onClick={onClick}
      className="glass-card group p-3.5 rounded-2xl cursor-pointer flex flex-col transition-all"
    >
      <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-[#090510] shadow-md">
        <AlbumArtwork
          src={album.coverUrl}
          alt={album.title}
          aspectRatio="square"
          rounded="rounded-xl"
          imgClassName="group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/70 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <Disc className="w-4 h-4 text-purple-400" />
        </div>
      </div>

      <h4 className="font-semibold text-sm text-white group-hover:text-purple-300 transition-colors truncate">
        {album.title}
      </h4>
      <p className="text-xs text-purple-300/80 truncate mt-0.5">{album.artist}</p>

      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-purple-400" /> {album.releaseDate}
        </span>
        <span>{album.totalTracks} tracks</span>
      </div>
    </div>
  );
};

