import React, { useState, useEffect } from 'react';
import { BarChart2, Play, Trophy, Music2 } from 'lucide-react';
import { musicApi } from '../services/api.js';
import { Track } from '../types/music.js';
import { SongRow, SongTableHeader } from '../components/music/SongRow.js';
import { AddToPlaylistModal } from '../components/music/AddToPlaylistModal.js';
import { usePlayer } from '../context/PlayerContext.js';

interface ChartCategory {
  category: string;
  tracks: Track[];
}

export const TopChartsPage: React.FC = () => {
  const [charts, setCharts] = useState<ChartCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const { playTrack } = usePlayer();

  useEffect(() => {
    musicApi
      .getCharts()
      .then(setCharts)
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-10 pb-16 animate-fadeIn">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-2">
          <Trophy className="w-3.5 h-3.5 text-emerald-400" /> Leaderboards
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Top Music Charts</h2>
        <p className="text-sm text-purple-200/70 mt-1">
          Ranked lists by plays, engagement, and listener popularity.
        </p>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 glass-card rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : (
        (charts || []).map((chart, cIdx) => (
          <section key={cIdx} className="glass-panel rounded-3xl p-6 border border-purple-500/20 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-900/60 border border-purple-500/30 flex items-center justify-center font-bold text-white">
                  #{cIdx + 1}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{chart.category}</h3>
                  <p className="text-xs text-purple-300/70">{chart.tracks.length} Top Ranked Tracks</p>
                </div>
              </div>

              {chart.tracks.length > 0 && (
                <button
                  onClick={() => playTrack(chart.tracks[0], chart.tracks)}
                  className="px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Play Chart
                </button>
              )}
            </div>

            <SongTableHeader />
            <div className="divide-y divide-[#352044]/30">
              {chart.tracks.map((track, idx) => (
                <SongRow
                  key={track.id}
                  track={track}
                  index={idx}
                  queueContext={chart.tracks}
                  onAddToPlaylist={(t) => setSelectedTrack(t)}
                />
              ))}
            </div>
          </section>
        ))
      )}

      <AddToPlaylistModal
        track={selectedTrack}
        isOpen={!!selectedTrack}
        onClose={() => setSelectedTrack(null)}
      />
    </div>
  );
};

