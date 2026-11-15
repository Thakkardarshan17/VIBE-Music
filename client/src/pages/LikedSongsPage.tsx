import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Play, Music, Compass, Sparkles } from 'lucide-react';
import { favoriteApi } from '../services/api.js';
import { localMusicStorage } from '../services/localMusicStorage.js';
import { Track } from '../types/music.js';
import { SongRow, SongTableHeader } from '../components/music/SongRow.js';
import { AddToPlaylistModal } from '../components/music/AddToPlaylistModal.js';
import { usePlayer } from '../context/PlayerContext.js';
import { useAuth } from '../context/AuthContext.js';

export const LikedSongsPage: React.FC = () => {
  const [favorites, setFavorites] = useState<Track[]>(() => localMusicStorage.getLikedSongs());
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  const { isAuthenticated } = useAuth();
  const { playTrack } = usePlayer();
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Load initial local favorites
    const local = localMusicStorage.getLikedSongs();
    setFavorites(local);

    // 2. If authenticated, fetch server favorites and merge
    if (isAuthenticated) {
      favoriteApi
        .list()
        .then((serverItems) => {
          if (Array.isArray(serverItems) && serverItems.length > 0) {
            // Merge deduplicated
            const map = new Map<string, Track>();
            [...local, ...serverItems].forEach((t) => {
              if (t && t.id) map.set(t.id, t);
            });
            const merged = Array.from(map.values());
            setFavorites(merged);
            localMusicStorage.setLikedSongs(merged);
          }
        })
        .catch(console.warn)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    // 3. Real-time updates listener
    const handleUpdate = (e: any) => {
      const updated = e.detail?.favorites || localMusicStorage.getLikedSongs();
      setFavorites(updated);
    };

    window.addEventListener('vibe_favorites_updated', handleUpdate);
    return () => window.removeEventListener('vibe_favorites_updated', handleUpdate);
  }, [isAuthenticated]);

  return (
    <div className="space-y-8 pb-16 animate-fadeIn">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 border border-pink-500/25 flex flex-col sm:flex-row items-center gap-6 shadow-2xl bg-gradient-to-r from-pink-950/40 via-purple-950/40 to-transparent">
        <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-gradient-to-tr from-pink-600 to-purple-600 flex items-center justify-center shadow-[0_0_40px_rgba(236,72,153,0.4)] flex-shrink-0">
          <Heart className="w-16 h-16 text-white fill-white" />
        </div>

        <div className="flex-1 text-center sm:text-left">
          <span className="text-xs uppercase font-bold tracking-widest text-pink-400">PLAYLIST</span>
          <h2 className="text-3xl md:text-5xl font-black text-white mt-1">Liked Songs</h2>
          <p className="text-sm text-purple-200/80 mt-1">Your curated personal favorites collection</p>
          <p className="text-xs text-slate-400 font-mono mt-2">{favorites.length} songs</p>
        </div>

        {favorites.length > 0 && (
          <button
            onClick={() => playTrack(favorites[0], favorites)}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-sm shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 min-h-[44px]"
          >
            <Play className="w-4 h-4 fill-current" /> Play All Liked
          </button>
        )}
      </div>

      {/* Empty State */}
      {favorites.length === 0 && !loading && (
        <div className="glass-panel rounded-3xl p-12 text-center max-w-lg mx-auto border border-[#352044]">
          <Heart className="w-16 h-16 text-pink-500/60 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Liked Songs Yet</h3>
          <p className="text-sm text-[#B7A6C8] mb-6">
            Tap the heart icon on any track to save it here for instant listening.
          </p>
          <button
            onClick={() => navigate('/explore')}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2 min-h-[44px]"
          >
            <Compass className="w-4 h-4" /> Explore Songs
          </button>
        </div>
      )}

      {/* Songs Table List */}
      {favorites.length > 0 && (
        <div className="glass-panel rounded-3xl p-4 sm:p-6 border border-[#352044] space-y-1">
          <SongTableHeader />
          {favorites.map((track, idx) => (
            <SongRow
              key={`${track.id}-${idx}`}
              track={track}
              index={idx}
              queueContext={favorites}
              onAddToPlaylist={(t) => setSelectedTrack(t)}
            />
          ))}
        </div>
      )}

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        track={selectedTrack}
        isOpen={!!selectedTrack}
        onClose={() => setSelectedTrack(null)}
      />
    </div>
  );
};

export default LikedSongsPage;
