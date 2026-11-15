import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Play, Trash2, Headphones, Compass } from 'lucide-react';
import { historyApi } from '../services/api.js';
import { localMusicStorage } from '../services/localMusicStorage.js';
import { Track } from '../types/music.js';
import { SongRow, SongTableHeader } from '../components/music/SongRow.js';
import { AddToPlaylistModal } from '../components/music/AddToPlaylistModal.js';
import { usePlayer } from '../context/PlayerContext.js';
import { useAuth } from '../context/AuthContext.js';

export const HistoryPage: React.FC = () => {
  const [recentTracks, setRecentTracks] = useState<Track[]>(() => localMusicStorage.getRecentTracks());
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  const { isAuthenticated } = useAuth();
  const { playTrack } = usePlayer();
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Initial local load
    const local = localMusicStorage.getRecentTracks();
    setRecentTracks(local);

    // 2. Fetch server history if authenticated
    if (isAuthenticated) {
      historyApi
        .list()
        .then((items) => {
          if (Array.isArray(items) && items.length > 0) {
            const serverTracks = items.map((i) => i.song).filter(Boolean);
            const map = new Map<string, Track>();
            [...local, ...serverTracks].forEach((t) => {
              if (t && t.id) map.set(t.id, t);
            });
            setRecentTracks(Array.from(map.values()));
          }
        })
        .catch(console.warn)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    // 3. Real-time recent updates listener
    const handleRecentUpdate = (e: any) => {
      const updated = e.detail || localMusicStorage.getRecentTracks();
      setRecentTracks(updated);
    };

    window.addEventListener('vibe_recent_updated', handleRecentUpdate);
    return () => window.removeEventListener('vibe_recent_updated', handleRecentUpdate);
  }, [isAuthenticated]);

  const handleClearHistory = () => {
    localMusicStorage.clearRecentTracks();
    setRecentTracks([]);
  };

  return (
    <div className="space-y-8 pb-16 animate-fadeIn">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 border border-purple-500/25 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl bg-gradient-to-r from-purple-950/40 via-[#12091D] to-transparent">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#A020F0] to-[#E51D87] flex items-center justify-center shadow-lg shadow-[#A020F0]/40 flex-shrink-0">
            <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-[#E51D87]">PLAYBACK TIMELINE</span>
            <h2 className="text-2xl sm:text-4xl font-black text-white mt-0.5">Recently Played</h2>
            <p className="text-xs sm:text-sm text-[#B7A6C8] mt-1">Tracks and sessions you have recently streamed on VIBE</p>
          </div>
        </div>

        {recentTracks.length > 0 && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => playTrack(recentTracks[0], recentTracks)}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white font-bold text-xs sm:text-sm shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 min-h-[40px]"
            >
              <Play className="w-4 h-4 fill-current" /> Play All
            </button>
            <button
              onClick={handleClearHistory}
              className="px-4 py-2.5 rounded-full bg-[#170D24] border border-[#352044] text-[#B7A6C8] hover:text-red-400 hover:border-red-500/40 text-xs font-semibold transition-all flex items-center gap-1.5 min-h-[40px]"
              title="Clear Listening History"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          </div>
        )}
      </div>

      {/* Empty State */}
      {recentTracks.length === 0 && !loading && (
        <div className="glass-panel rounded-3xl p-12 text-center max-w-lg mx-auto border border-[#352044]">
          <Headphones className="w-16 h-16 text-purple-400/50 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Listening History Yet</h3>
          <p className="text-sm text-[#B7A6C8] mb-6">
            Tracks you play will automatically appear here so you can easily return to them.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2 min-h-[44px]"
          >
            <Compass className="w-4 h-4" /> Start Listening
          </button>
        </div>
      )}

      {/* Tracks List */}
      {recentTracks.length > 0 && (
        <div className="glass-panel rounded-3xl p-4 sm:p-6 border border-[#352044] space-y-1">
          <SongTableHeader />
          {recentTracks.map((track, idx) => (
            <SongRow
              key={`${track.id}-${idx}`}
              track={track}
              index={idx}
              queueContext={recentTracks}
              onAddToPlaylist={(t) => setSelectedTrack(t)}
            />
          ))}
        </div>
      )}

      {/* Add to Playlist Modal */}
      <AddToPlaylistModal
        track={selectedTrack}
        isOpen={!!selectedTrack}
        onClose={() => setSelectedTrack(null)}
      />
    </div>
  );
};

export default HistoryPage;
