import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Activity,
  Headphones,
  Clock,
  Heart,
  ListMusic,
  Users,
  Disc,
  Play,
  TrendingUp,
  Calendar,
  Sparkles,
  BarChart3,
  RefreshCw,
  Trash2,
  ChevronRight,
  ShieldCheck,
  Music2,
  Volume2,
} from 'lucide-react';
import { meApi, UserDashboardData } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { usePlayer } from '../context/PlayerContext.js';
import { Track } from '../types/music.js';
import { AlbumArtwork } from '../components/common/AlbumArtwork.js';
import { SongRow, SongTableHeader } from '../components/music/SongRow.js';
import { AddToPlaylistModal } from '../components/music/AddToPlaylistModal.js';

export const DashboardPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { playTrack } = usePlayer();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState<UserDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedTrackForModal, setSelectedTrackForModal] = useState<Track | null>(null);
  const [activeTimeRange, setActiveTimeRange] = useState<'weekly' | 'monthly'>('weekly');

  const fetchDashboard = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await meApi.getDashboard();
      setDashboardData(data);
    } catch (err) {
      console.warn('Failed to load user dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboard();
    }
  }, [isAuthenticated]);

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear your personal listening history? This will reset your recent songs.')) {
      try {
        await meApi.clearRecentlyPlayed();
        await fetchDashboard();
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const handleRemoveHistoryItem = async (historyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await meApi.deleteRecentItem(historyId);
      await fetchDashboard();
    } catch (e) {
      console.warn(e);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="glass-panel rounded-3xl p-10 sm:p-14 text-center max-w-lg mx-auto my-12 border border-[#352044] animate-fadeIn">
        <Activity className="w-16 h-16 text-[#A020F0] mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Personal Music Dashboard</h3>
        <p className="text-sm text-[#B7A6C8] mb-6">
          Sign in with Google to view your personal listening time, most played songs, and music analytics.
        </p>
        <NavLink
          to="/login"
          className="px-6 py-3 rounded-full bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white font-bold text-sm shadow-lg hover:brightness-110 transition-all inline-block"
        >
          Continue with Google
        </NavLink>
      </div>
    );
  }

  const stats = dashboardData?.stats;
  const weekly = dashboardData?.weeklyActivity || [];
  const monthly = dashboardData?.monthlyActivity || [];
  const mostPlayed = dashboardData?.mostPlayedSongs || [];
  const recentlyPlayed = dashboardData?.recentlyPlayed || [];
  const favouriteArtists = dashboardData?.favouriteArtists || [];
  const favouriteAlbums = dashboardData?.favouriteAlbums || [];

  // Max minutes calculation for chart scaling
  const maxWeeklyMinutes = Math.max(...weekly.map((d) => d.minutes), 30);
  const maxMonthlyMinutes = Math.max(...monthly.map((d) => d.minutes), 60);

  return (
    <div className="space-y-8 pb-20 animate-fadeIn">
      {/* 1. Header Banner with User Profile Summary */}
      <div className="relative rounded-3xl overflow-hidden glass-panel border border-[#352044] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-[#A020F0] ring-4 ring-[#E51D87]/20 shadow-xl flex-shrink-0">
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80'}
              alt={user.fullName || user.username}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#170D24] border border-[#352044] text-[11px] font-semibold text-[#B7A6C8] mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Google Verified Account</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
              {user.fullName || user.username}'s Music World
            </h2>
            <p className="text-xs sm:text-sm text-[#B7A6C8] mt-1">
              {user.email} • Synchronized across your VIBE sessions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="px-4 py-2.5 rounded-xl bg-[#170D24] border border-[#352044] hover:border-[#A020F0] text-xs font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-2 min-h-[42px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#E51D87]' : ''}`} />
            <span>Sync Stats</span>
          </button>
          <NavLink
            to="/library"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white font-bold text-xs shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 min-h-[42px]"
          >
            <span>My Library</span>
            <ChevronRight className="w-4 h-4" />
          </NavLink>
        </div>
      </div>

      {/* 2. Key Lifetime Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Metric 1 */}
        <div className="glass-card p-4 rounded-2xl border border-[#352044] flex flex-col justify-between">
          <div className="w-8 h-8 rounded-xl bg-[#A020F0]/20 flex items-center justify-center text-[#A020F0] mb-2">
            <Headphones className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {loading ? '...' : stats?.totalSongsPlayed || 0}
            </div>
            <div className="text-[11px] text-[#B7A6C8] font-medium">Songs Played</div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-card p-4 rounded-2xl border border-[#352044] flex flex-col justify-between">
          <div className="w-8 h-8 rounded-xl bg-[#E51D87]/20 flex items-center justify-center text-[#E51D87] mb-2">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {loading ? '...' : `${stats?.totalListeningHours || 0}h`}
            </div>
            <div className="text-[11px] text-[#B7A6C8] font-medium">Listening Time</div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-card p-4 rounded-2xl border border-[#352044] flex flex-col justify-between">
          <div className="w-8 h-8 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-400 mb-2">
            <Heart className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {loading ? '...' : stats?.totalLikedSongs || 0}
            </div>
            <div className="text-[11px] text-[#B7A6C8] font-medium">Liked Songs</div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass-card p-4 rounded-2xl border border-[#352044] flex flex-col justify-between">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300 mb-2">
            <ListMusic className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {loading ? '...' : stats?.totalPlaylists || 0}
            </div>
            <div className="text-[11px] text-[#B7A6C8] font-medium">My Playlists</div>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="glass-card p-4 rounded-2xl border border-[#352044] flex flex-col justify-between">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 mb-2">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {loading ? '...' : stats?.totalFollowedArtists || 0}
            </div>
            <div className="text-[11px] text-[#B7A6C8] font-medium">Followed Artists</div>
          </div>
        </div>

        {/* Metric 6 */}
        <div className="glass-card p-4 rounded-2xl border border-[#352044] flex flex-col justify-between">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 mb-2">
            <Disc className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {loading ? '...' : stats?.totalSavedAlbums || 0}
            </div>
            <div className="text-[11px] text-[#B7A6C8] font-medium">Saved Albums</div>
          </div>
        </div>
      </div>

      {/* 3. Listening Activity Chart Section */}
      <section className="glass-panel rounded-3xl p-6 sm:p-8 border border-[#352044] shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#A020F0]" />
            <h3 className="text-lg sm:text-xl font-bold text-white">Listening Activity Analytics</h3>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-[#170D24] rounded-xl border border-[#352044] text-xs">
            <button
              onClick={() => setActiveTimeRange('weekly')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTimeRange === 'weekly'
                  ? 'bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white shadow'
                  : 'text-[#B7A6C8] hover:text-white'
              }`}
            >
              Past 7 Days
            </button>
            <button
              onClick={() => setActiveTimeRange('monthly')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTimeRange === 'monthly'
                  ? 'bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white shadow'
                  : 'text-[#B7A6C8] hover:text-white'
              }`}
            >
              Past 4 Weeks
            </button>
          </div>
        </div>

        {/* Visual Bar Chart */}
        {activeTimeRange === 'weekly' ? (
          <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-48 pt-6 pb-2 px-2 border-b border-[#352044]">
            {weekly.map((item, idx) => {
              const heightPct = Math.max(8, Math.round((item.minutes / maxWeeklyMinutes) * 100));
              return (
                <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-mono text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.minutes}m
                  </span>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[42px] rounded-t-xl bg-gradient-to-t from-[#A020F0] to-[#E51D87] group-hover:brightness-125 transition-all shadow-md shadow-[#A020F0]/20"
                  />
                  <span className="text-[11px] font-bold text-[#B7A6C8] mt-1">{item.day}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3 sm:gap-6 items-end h-48 pt-6 pb-2 px-4 border-b border-[#352044]">
            {monthly.map((item, idx) => {
              const heightPct = Math.max(10, Math.round((item.minutes / maxMonthlyMinutes) * 100));
              return (
                <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-mono text-pink-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.minutes}m
                  </span>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[64px] rounded-t-xl bg-gradient-to-t from-purple-700 to-[#E51D87] group-hover:brightness-125 transition-all shadow-md shadow-[#E51D87]/20"
                  />
                  <span className="text-[11px] font-bold text-[#B7A6C8] mt-1">{item.label}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-[#B7A6C8] pt-3">
          <span>* Only counts verified sessions with &gt; 30s playback or &gt; 50% completion.</span>
          <span className="font-semibold text-white">
            Total Minutes: {stats?.totalListeningMinutes || 0} min
          </span>
        </div>
      </section>

      {/* 4. Most Played Songs (Top Tracks) */}
      <section className="glass-panel rounded-3xl p-6 sm:p-8 border border-[#352044] shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#E51D87]" />
            <h3 className="text-lg sm:text-xl font-bold text-white">Your Most Played Songs</h3>
          </div>
          {mostPlayed.length > 0 && (
            <button
              onClick={() => playTrack(mostPlayed[0], mostPlayed)}
              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white font-bold text-xs flex items-center gap-1.5 shadow hover:scale-105 active:scale-95 transition-all min-h-[36px]"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play All</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 glass-card rounded-xl animate-pulse" />
            ))}
          </div>
        ) : mostPlayed.length > 0 ? (
          <div className="divide-y divide-[#352044]/50">
            {mostPlayed.map((track, idx) => (
              <div
                key={track.id || idx}
                onClick={() => playTrack(track, mostPlayed)}
                className="py-3 px-3 rounded-2xl hover:bg-[#170D24] flex items-center justify-between gap-4 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="w-5 text-center text-xs font-bold text-[#B7A6C8] group-hover:text-white">
                    {idx + 1}
                  </span>
                  <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-[#090510] border border-[#352044]">
                    <AlbumArtwork
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-full h-full"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white group-hover:text-pink-300 transition-colors truncate">
                      {track.title}
                    </p>
                    <p className="text-xs text-[#B7A6C8] truncate">{track.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="px-2.5 py-1 rounded-full bg-[#170D24] border border-[#352044] text-[10px] font-mono text-purple-300">
                    {track.playCount} {track.playCount === 1 ? 'play' : 'plays'}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-[#B7A6C8] space-y-2">
            <Music2 className="w-10 h-10 text-[#A020F0] mx-auto opacity-60" />
            <p className="text-sm font-semibold text-white">No play history recorded yet</p>
            <p className="text-xs text-[#B7A6C8]">
              Start streaming music and your most played tracks will automatically appear here.
            </p>
          </div>
        )}
      </section>

      {/* 5. Top Listened Artists & Top Albums Dual Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Artists */}
        <section className="glass-panel rounded-3xl p-6 border border-[#352044] shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-[#A020F0]" /> Top Artists
            </h3>
            <NavLink to="/artists" className="text-xs text-[#E51D87] hover:underline font-semibold">
              Explore All
            </NavLink>
          </div>

          {favouriteArtists.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {favouriteArtists.map((artist, i) => (
                <div
                  key={i}
                  onClick={() => navigate(`/artists?name=${encodeURIComponent(artist.name)}`)}
                  className="glass-card p-3 rounded-2xl flex flex-col items-center text-center cursor-pointer hover:scale-105 transition-all group"
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden mb-2 border-2 border-[#A020F0]/40 group-hover:border-[#E51D87] shadow">
                    <img src={artist.imageUrl} alt={artist.name} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-xs font-bold text-white group-hover:text-pink-300 truncate w-full">
                    {artist.name}
                  </p>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {artist.playCount} plays
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#B7A6C8] py-8 text-center">
              Play songs by your favorite artists to populate this list.
            </p>
          )}
        </section>

        {/* Top Albums */}
        <section className="glass-panel rounded-3xl p-6 border border-[#352044] shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Disc className="w-4 h-4 text-[#E51D87]" /> Top Albums
            </h3>
            <NavLink to="/albums" className="text-xs text-[#A020F0] hover:underline font-semibold">
              Explore All
            </NavLink>
          </div>

          {favouriteAlbums.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {favouriteAlbums.map((album, i) => (
                <div
                  key={i}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(album.title)}`)}
                  className="glass-card p-3 rounded-2xl cursor-pointer hover:scale-105 transition-all group"
                >
                  <div className="aspect-square rounded-xl overflow-hidden mb-2 border border-[#352044] bg-[#090510]">
                    <AlbumArtwork src={album.coverUrl} alt={album.title} className="w-full h-full" />
                  </div>
                  <p className="text-xs font-bold text-white group-hover:text-pink-300 truncate">
                    {album.title}
                  </p>
                  <p className="text-[10px] text-[#B7A6C8] truncate">{album.artist}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#B7A6C8] py-8 text-center">
              Listen to albums to see your most frequented records.
            </p>
          )}
        </section>
      </div>

      {/* 6. Recently Played with Clear & Individual Delete Actions */}
      <section className="glass-panel rounded-3xl p-6 sm:p-8 border border-[#352044] shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg sm:text-xl font-bold text-white">Recently Played History</h3>
          </div>

          {recentlyPlayed.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => playTrack(recentlyPlayed[0], recentlyPlayed)}
                className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white text-xs font-bold flex items-center gap-1.5 shadow min-h-[36px]"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play Recent</span>
              </button>
              <button
                onClick={handleClearHistory}
                className="px-3 py-1.5 rounded-full bg-[#170D24] border border-red-500/30 text-red-300 hover:text-red-200 hover:bg-red-950/40 text-xs font-semibold flex items-center gap-1 transition-all min-h-[36px]"
                title="Clear all listening history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            </div>
          )}
        </div>

        {recentlyPlayed.length > 0 ? (
          <div className="divide-y divide-[#352044]/50">
            {recentlyPlayed.map((track: any, idx) => (
              <div
                key={track.historyId || track.id || idx}
                onClick={() => playTrack(track, recentlyPlayed)}
                className="py-3 px-3 rounded-2xl hover:bg-[#170D24] flex items-center justify-between gap-4 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-[#090510] border border-[#352044]">
                    <AlbumArtwork src={track.coverUrl} alt={track.title} className="w-full h-full" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white group-hover:text-pink-300 transition-colors truncate">
                      {track.title}
                    </p>
                    <p className="text-xs text-[#B7A6C8] truncate">{track.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {track.playedAt && (
                    <span className="text-[11px] text-[#B7A6C8]/70 font-mono hidden sm:inline">
                      {new Date(track.playedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                  {track.historyId && (
                    <button
                      onClick={(e) => handleRemoveHistoryItem(track.historyId, e)}
                      className="p-1.5 rounded-lg text-[#B7A6C8] hover:text-red-400 hover:bg-red-950/40 transition-colors"
                      title="Remove from history"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-[#B7A6C8]">
            <p className="text-sm font-semibold text-white">Your listening history is clear</p>
            <p className="text-xs text-[#B7A6C8] mt-1">Play any song to see your recent plays here.</p>
          </div>
        )}
      </section>

      {/* Playlist Modal */}
      <AddToPlaylistModal
        track={selectedTrackForModal}
        isOpen={!!selectedTrackForModal}
        onClose={() => setSelectedTrackForModal(null)}
      />
    </div>
  );
};

export default DashboardPage;

