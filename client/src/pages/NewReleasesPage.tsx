import React, { useState, useEffect } from 'react';
import { Sparkles, Play } from 'lucide-react';
import { musicApi } from '../services/api.js';
import { Track } from '../types/music.js';
import { SongCard } from '../components/music/SongCard.js';
import { AddToPlaylistModal } from '../components/music/AddToPlaylistModal.js';
import { usePlayer } from '../context/PlayerContext.js';

export const NewReleasesPage: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const { playTrack } = usePlayer();

  useEffect(() => {
    musicApi
      .getNewReleases()
      .then(setTracks)
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 pb-16 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Just Dropped
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">New Releases</h2>
          <p className="text-sm text-purple-200/70 mt-1">
            Fresh singles, latest studio master recordings, and brand new album drops.
          </p>
        </div>

        {tracks.length > 0 && (
          <button
            onClick={() => playTrack(tracks[0], tracks)}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <Play className="w-4 h-4 fill-current" /> Play New Hits
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="glass-card aspect-square rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
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

      <AddToPlaylistModal
        track={selectedTrack}
        isOpen={!!selectedTrack}
        onClose={() => setSelectedTrack(null)}
      />
    </div>
  );
};

