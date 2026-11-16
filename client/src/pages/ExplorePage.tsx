import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Sparkles, Music, Play, Radio } from 'lucide-react';
import { musicApi } from '../services/api.js';
import { Track } from '../types/music.js';
import { SongCard } from '../components/music/SongCard.js';
import { AddToPlaylistModal } from '../components/music/AddToPlaylistModal.js';

interface GenreItem {
  id: string;
  name: string;
  color: string;
  bgGradient: string;
  query: string;
  icon: string;
}

const GENRES: GenreItem[] = [
  { id: 'bolly', name: 'Bollywood Hits', color: 'text-amber-400', bgGradient: 'from-amber-600/40 to-orange-900/60', query: 'Bollywood Hits 2026', icon: '🎬' },
  { id: 'guj', name: 'Gujarati Folk & Garba', color: 'text-rose-400', bgGradient: 'from-rose-600/40 to-red-950/60', query: 'Gujarati Garba Aditya Gadhvi Folk', icon: '🪕' },
  { id: 'punj', name: 'Punjabi Bangers', color: 'text-yellow-400', bgGradient: 'from-yellow-600/40 to-amber-950/60', query: 'Punjabi Top Songs Diljit AP Dhillon', icon: '🥁' },
  { id: 'edm', name: 'EDM & Electronic', color: 'text-cyan-400', bgGradient: 'from-cyan-600/40 to-blue-950/60', query: 'EDM Electronic Dance Festival', icon: '⚡' },
  { id: 'lofi', name: 'Lo-Fi & Chill Beats', color: 'text-purple-400', bgGradient: 'from-purple-600/40 to-indigo-950/60', query: 'Lo-Fi Chill Hop Beats Study', icon: '☕' },
  { id: 'hiphop', name: 'Hip Hop & Rap', color: 'text-pink-400', bgGradient: 'from-pink-600/40 to-rose-950/60', query: 'Hip Hop Rap Beats', icon: '🎤' },
  { id: 'pop', name: 'Global Pop', color: 'text-emerald-400', bgGradient: 'from-emerald-600/40 to-teal-950/60', query: 'Global Pop Hits Today', icon: '🌟' },
  { id: 'rock', name: 'Rock & Alternative', color: 'text-red-400', bgGradient: 'from-red-600/40 to-slate-950/60', query: 'Rock Alternative Classics', icon: '🎸' },
  { id: 'sufi', name: 'Sufi & Classical', color: 'text-violet-400', bgGradient: 'from-violet-600/40 to-purple-950/60', query: 'Sufi Soul Qawwali Classical', icon: '🕊️' },
  { id: 'romance', name: 'Romantic Melodies', color: 'text-fuchsia-400', bgGradient: 'from-fuchsia-600/40 to-pink-950/60', query: 'Romantic Love Songs Hindi', icon: '💖' },
];

export const ExplorePage: React.FC = () => {
  const [activeGenre, setActiveGenre] = useState<GenreItem | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const navigate = useNavigate();

  const handleSelectGenre = async (genre: GenreItem) => {
    setActiveGenre(genre);
    setLoading(true);
    try {
      const res = await musicApi.search(genre.query, 'all', 12);
      setTracks(Array.isArray(res?.tracks) ? res.tracks : []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 animate-fadeIn">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#170D24] border border-[#352044] text-[#B7A6C8] text-xs font-semibold mb-2">
          <Compass className="w-3.5 h-3.5 text-[#E51D87]" /> Sonic Discovery
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Explore Genres & Moods</h2>
        <p className="text-sm text-[#B7A6C8] mt-1">
          Dive into regional hits, global rhythms, and curated soundscapes.
        </p>
      </div>

      {/* Genres Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {GENRES.map((g) => (
          <div
            key={g.id}
            onClick={() => handleSelectGenre(g)}
            className={`glass-card p-4 sm:p-5 rounded-3xl cursor-pointer bg-gradient-to-br ${g.bgGradient} relative overflow-hidden group hover:scale-[1.03] transition-all border border-[#352044] select-none`}
          >
            <span className="text-2xl sm:text-3xl block mb-2">{g.icon}</span>
            <h4 className="font-bold text-sm sm:text-base text-white group-hover:text-pink-200 transition-colors">{g.name}</h4>
            <p className="text-[11px] text-[#B7A6C8] mt-1">Tap to explore</p>
            <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-white/10 blur-xl group-hover:scale-150 transition-transform" />
          </div>
        ))}
      </div>

      {/* Active Genre Tracks Showcase */}
      {activeGenre && (
        <section className="pt-6 border-t border-[#352044]">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{activeGenre.icon}</span>
              <h3 className="text-xl sm:text-2xl font-bold text-white">{activeGenre.name} Showcase</h3>
            </div>
            <button
              onClick={() => navigate(`/search?q=${encodeURIComponent(activeGenre.query)}`)}
              className="text-xs font-semibold text-[#E51D87] hover:text-pink-300"
            >
              Open Full Search
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-card aspect-square rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {tracks.map((track) => (
                <SongCard
                  key={track.id}
                  track={track}
                  queueContext={tracks}
                  onAddToPlaylist={(t) => setSelectedTrack(t)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {selectedTrack && (
        <AddToPlaylistModal
          track={selectedTrack}
          isOpen={!!selectedTrack}
          onClose={() => setSelectedTrack(null)}
        />
      )}
    </div>
  );
};
