import React, { useState, useEffect } from 'react';
import { Flame, Play, Sparkles } from 'lucide-react';
import { musicApi } from '../services/api.js';
import { Track } from '../types/music.js';
import { SongRow, SongTableHeader } from '../components/music/SongRow.js';
import { SongCard } from '../components/music/SongCard.js';
import { AddToPlaylistModal } from '../components/music/AddToPlaylistModal.js';
import { usePlayer } from '../context/PlayerContext.js';

export const TrendingPage: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const { playTrack } = usePlayer();

  useEffect(() => {
    musicApi
      .getTrending()
      .then(setTracks)
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 pb-16 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-950/60 border border-pink-500/30 text-pink-300 text-xs font-semibold mb-2">
            <Flame className="w-3.5 h-3.5 text-pink-400" /> Viral & Hot Hits
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Trending Music</h2>
          <p className="text-sm text-purple-200/70 mt-1">
            The most streamed and played songs across global and Indian charts today.
          </p>
        </div>

        {tracks.length > 0 && (
          <button
            onClick={() => playTrack(tracks[0], tracks)}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <Play className="w-4 h-4 fill-current" /> Play Trending Mix
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 glass-card rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-3xl p-4 md:p-6 border border-purple-500/20 shadow-2xl">
          <SongTableHeader />
          <div className="divide-y divide-[#352044]/30">
            {(tracks || []).map((track, idx) => (
              <SongRow
                key={track.id}
                track={track}
                index={idx}
                queueContext={tracks}
                onAddToPlaylist={(t) => setSelectedTrack(t)}
              />
            ))}
          </div>
        </div>
      )}

      <AddToPlaylistModal
        track={selectedTrack}
        isOpen={!!selectedTrack}
        onClose={() => setSelectedTrack(null)}
      />
    </div>
  );
};

