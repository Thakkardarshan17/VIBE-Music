import React from 'react';
import { ListMusic, Play } from 'lucide-react';
import { Playlist } from '../../types/music.js';
import { AlbumArtwork } from '../common/AlbumArtwork.js';

interface PlaylistCardProps {
  playlist: Playlist;
  onClick?: () => void;
  onPlay?: () => void;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onClick, onPlay }) => {
  return (
    <div
      onClick={onClick}
      className="glass-card group p-3.5 rounded-2xl cursor-pointer flex flex-col transition-all hover:scale-[1.02] border border-[#352044]"
    >
      <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-[#090510] shadow-md">
        <AlbumArtwork
          src={playlist.coverUrl}
          alt={playlist.title}
          aspectRatio="square"
          rounded="rounded-xl"
          imgClassName="group-hover:scale-105 transition-transform duration-500"
        />

        {onPlay && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlay();
              }}
              className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#A020F0] to-[#E51D87] text-white flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </button>
          </div>
        )}

        <div className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/70 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <ListMusic className="w-4 h-4 text-purple-400" />
        </div>
      </div>

      <h4 className="font-semibold text-sm text-white group-hover:text-purple-300 transition-colors truncate">
        {playlist.title}
      </h4>
      <p className="text-xs text-[#B7A6C8] truncate mt-0.5">{playlist.description || 'VIBE Playlist'}</p>
    </div>
  );
};

export default PlaylistCard;

