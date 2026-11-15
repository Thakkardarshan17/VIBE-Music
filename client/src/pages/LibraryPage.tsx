import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Library,
  ListMusic,
  Heart,
  Clock,
  Plus,
  Play,
  Users,
  Disc,
  Download,
  Trash2,
  ExternalLink,
  Music2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Volume2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { meApi } from '../services/api.js';
import { Playlist, Track } from '../types/music.js';
import { SongRow, SongTableHeader } from '../components/music/SongRow.js';
import { SongCard } from '../components/music/SongCard.js';
import { AlbumArtwork } from '../components/common/AlbumArtwork.js';
import { AddToPlaylistModal } from '../components/music/AddToPlaylistModal.js';
import { usePlayer } from '../context/PlayerContext.js';

type LibraryTab = 'liked' | 'history' | 'playlists' | 'artists' | 'albums' | 'downloads';

export const LibraryPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { playTrack } = usePlayer();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = (searchParams.get('tab') as LibraryTab) || 'liked';
  const [activeTab, setActiveTab] = useState<LibraryTab>(tabParam);

  const [likedSongs, setLikedSongs] = useState<Track[]>([]);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [followedArtists, setFollowedArtists] = useState<any[]>([]);
  const [savedAlbums, setSavedAlbums] = useState<any[]>([]);
  const [downloads, setDownloads] = useState<Track[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTrackForModal, setSelectedTrackForModal] = useState<Track | null>(null);

  // New Playlist Modal state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);

  useEffect(() => {
    const t = searchParams.get('tab') as LibraryTab;
    if (t && ['liked', 'history', 'playlists', 'artists', 'albums', 'downloads'].includes(t)) {
      setActiveTab(t);
    }
  }, [searchParams]);

  const handleTabChange = (tab: LibraryTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const fetchLibraryData = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [favs, recents, pls, artists, albums] = await Promise.all([
        meApi.getLikedSongs().catch(() => []),
        meApi.getRecentlyPlayed(1, 40).then((res) => res.tracks).catch(() => []),
        meApi.getPlaylists().catch(() => []),
        meApi.getFollowedArtists().catch(() => []),
        meApi.getSavedAlbums().catch(() => []),
      ]);

      setLikedSongs(favs || []);
      setRecentTracks(recents || []);
      setPlaylists(pls || []);
      setFollowedArtists(artists || []);
      setSavedAlbums(albums || []);

      // Mock legal demo offline cache from local storage if available
      try {
        const cached = localStorage.getItem('vibe_offline_tracks');
        if (cached) setDownloads(JSON.parse(cached));
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibraryData();
  }, [isAuthenticated]);

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await meApi.createPlaylist({
        title: newTitle.trim(),
        description: newDesc.trim(),
        isPublic,
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      await fetchLibraryData();
    } catch (e) {
      console.warn(e);
    } finally {
      setCreating(false);
    }
  };

  const handleUnlike = async (songId: string) => {
    try {
      await meApi.removeLikedSong(songId);
      setLikedSongs((prev) => prev.filter((s) => s.id !== songId));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Clear all listening history?')) {
      await meApi.clearRecentlyPlayed();
      setRecentTracks([]);
    }
  };

  const handleUnfollowArtist = async (artistId: string) => {
    await meApi.unfollowArtist(artistId);
    setFollowedArtists((prev) => prev.filter((a) => a.artistId !== artistId));
  };

  const handleRemoveAlbum = async (albumId: string) => {
    await meApi.removeSavedAlbum(albumId);
    setSavedAlbums((prev) => prev.filter((a) => a.albumId !== albumId));
  };

  if (!isAuthenticated) {
    return (
      <div className="glass-panel rounded-3xl p-12 text-center max-w-lg mx-auto my-12 border border-[#352044] animate-fadeIn">
        <Library className="w-16 h-16 text-[#A020F0] mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Sign in to your Library</h3>
        <p className="text-sm text-[#B7A6C8] mb-6">
          Access your personal playlists, liked songs, and listening history synchronized with your Google account.
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

  return (
    <div className="space-y-8 pb-20 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#170D24] border border-[#352044] text-xs font-semibold mb-2">
            <Library className="w-3.5 h-3.5 text-[#E51D87]" />
            <span className="text-[#B7A6C8]">Personal Music Vault</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Your Library</h2>
          <p className="text-sm text-[#B7A6C8] mt-1">
            All your favorites, personal playlists, followed artists, and albums in one place.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-full bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white font-bold text-xs shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 min-h-[42px]"
          >
            <Plus className="w-4 h-4" />
            <span>Create Playlist</span>
          </button>
        </div>
      </div>

      {/* 6 Library Tabs (Section 8 Requirement) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#352044] scrollbar-none">
        <button
          onClick={() => handleTabChange('liked')}
          className={`px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'liked'
              ? 'bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white shadow'
              : 'text-[#B7A6C8] hover:text-white bg-[#170D24] border border-[#352044]'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${activeTab === 'liked' ? 'fill-current' : ''}`} />
          <span>Liked Songs ({likedSongs.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('history')}
          className={`px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'history'
              ? 'bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white shadow'
              : 'text-[#B7A6C8] hover:text-white bg-[#170D24] border border-[#352044]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Recently Played ({recentTracks.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('playlists')}
          className={`px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'playlists'
              ? 'bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white shadow'
              : 'text-[#B7A6C8] hover:text-white bg-[#170D24] border border-[#352044]'
          }`}
        >
          <ListMusic className="w-3.5 h-3.5" />
          <span>My Playlists ({playlists.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('artists')}
          className={`px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'artists'
              ? 'bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white shadow'
              : 'text-[#B7A6C8] hover:text-white bg-[#170D24] border border-[#352044]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Followed Artists ({followedArtists.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('albums')}
          className={`px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'albums'
              ? 'bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white shadow'
              : 'text-[#B7A6C8] hover:text-white bg-[#170D24] border border-[#352044]'
          }`}
        >
          <Disc className="w-3.5 h-3.5" />
          <span>Saved Albums ({savedAlbums.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('downloads')}
          className={`px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'downloads'
              ? 'bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white shadow'
              : 'text-[#B7A6C8] hover:text-white bg-[#170D24] border border-[#352044]'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Offline Music ({downloads.length})</span>
        </button>
      </div>

      {/* Tab Content Display */}
      {loading ? (
        <div className="space-y-3 py-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 glass-card rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* TAB 1: Liked Songs */}
          {activeTab === 'liked' && (
            <section className="glass-panel rounded-3xl p-6 sm:p-8 border border-[#352044] shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-[#E51D87] fill-current" />
                  <h3 className="text-xl font-bold text-white">Favorite Liked Tracks</h3>
                </div>
                {likedSongs.length > 0 && (
                  <button
                    onClick={() => playTrack(likedSongs[0], likedSongs)}
                    className="px-5 py-2 rounded-full bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white font-bold text-xs flex items-center gap-2 shadow"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play All ({likedSongs.length})</span>
                  </button>
                )}
              </div>

              {likedSongs.length > 0 ? (
                <div className="overflow-x-auto">
                  <SongTableHeader />
                  <div className="divide-y divide-[#352044]/40">
                    {likedSongs.map((track, idx) => (
                      <SongRow
                        key={track.id || idx}
                        track={track}
                        index={idx}
                        queueContext={likedSongs}
                        onAddToPlaylist={(t) => setSelectedTrackForModal(t)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-[#B7A6C8] space-y-2">
                  <Heart className="w-12 h-12 text-[#E51D87] mx-auto opacity-50" />
                  <p className="text-base font-bold text-white">No liked songs yet</p>
                  <p className="text-xs">
                    Tap the heart icon on any song while exploring to save it to your personal favorites.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* TAB 2: Recently Played */}
          {activeTab === 'history' && (
            <section className="glass-panel rounded-3xl p-6 sm:p-8 border border-[#352044] shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-xl font-bold text-white">Recently Played History</h3>
                </div>
                {recentTracks.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => playTrack(recentTracks[0], recentTracks)}
                      className="px-4 py-2 rounded-full bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white font-bold text-xs flex items-center gap-1.5 shadow"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Play Recent
                    </button>
                    <button
                      onClick={handleClearHistory}
                      className="px-3.5 py-2 rounded-full bg-[#170D24] border border-red-500/30 text-red-300 hover:text-red-200 text-xs font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Clear History
                    </button>
                  </div>
                )}
              </div>

              {recentTracks.length > 0 ? (
                <div className="overflow-x-auto">
                  <SongTableHeader />
                  <div className="divide-y divide-[#352044]/40">
                    {recentTracks.map((track, idx) => (
                      <SongRow
                        key={track.id || idx}
                        track={track}
                        index={idx}
                        queueContext={recentTracks}
                        onAddToPlaylist={(t) => setSelectedTrackForModal(t)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-[#B7A6C8]">
                  <p className="text-base font-bold text-white">No listening history</p>
                  <p className="text-xs mt-1">Songs you play will be automatically remembered here.</p>
                </div>
              )}
            </section>
          )}

          {/* TAB 3: My Playlists */}
          {activeTab === 'playlists' && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <ListMusic className="w-5 h-5 text-[#A020F0]" /> Playlists ({playlists.length})
                </h3>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-3.5 h-3.5" /> New Playlist
                </button>
              </div>

              {playlists.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                  {playlists.map((pl) => (
                    <NavLink
                      key={pl.id}
                      to={`/playlists?id=${pl.id}`}
                      className="glass-card p-3 sm:p-4 rounded-2xl group flex flex-col justify-between hover:scale-[1.02] transition-all"
                    >
                      <div className="aspect-square w-full rounded-xl overflow-hidden mb-3 bg-[#090510] relative border border-[#352044]">
                        <img
                          src={pl.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80'}
                          alt={pl.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-white truncate">{pl.title}</h4>
                      <p className="text-[11px] text-[#B7A6C8] truncate mt-0.5">
                        {pl.tracks?.length || 0} songs • {pl.isPublic ? 'Public' : 'Private'}
                      </p>
                    </NavLink>
                  ))}
                </div>
              ) : (
                <div className="glass-panel p-12 rounded-3xl text-center text-[#B7A6C8] border border-[#352044]">
                  <ListMusic className="w-12 h-12 text-[#A020F0] mx-auto mb-3 opacity-60" />
                  <p className="text-base font-bold text-white">Create your first playlist</p>
                  <p className="text-xs mt-1">Organize your favorite music into custom playlists.</p>
                </div>
              )}
            </section>
          )}

          {/* TAB 4: Followed Artists */}
          {activeTab === 'artists' && (
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" /> Followed Artists ({followedArtists.length})
              </h3>

              {followedArtists.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                  {followedArtists.map((artist) => (
                    <div
                      key={artist.id}
                      className="glass-card p-4 rounded-2xl flex flex-col items-center text-center group hover:scale-105 transition-all relative"
                    >
                      <div
                        onClick={() => navigate(`/artists?name=${encodeURIComponent(artist.artistName)}`)}
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <div className="w-24 h-24 rounded-full overflow-hidden mb-3 border-2 border-[#A020F0]/40 shadow">
                          <img
                            src={artist.artistImage || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80'}
                            alt={artist.artistName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h4 className="font-bold text-xs sm:text-sm text-white truncate w-full">
                          {artist.artistName}
                        </h4>
                        <p className="text-[10px] text-[#B7A6C8] truncate mt-0.5">{artist.genre || 'Artist'}</p>
                      </div>

                      <button
                        onClick={() => handleUnfollowArtist(artist.artistId)}
                        className="mt-3 px-3 py-1 rounded-full bg-[#170D24] border border-[#352044] text-[10px] font-semibold text-[#B7A6C8] hover:text-red-400 hover:border-red-500/40 transition-colors"
                      >
                        Unfollow
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-panel p-12 rounded-3xl text-center text-[#B7A6C8] border border-[#352044]">
                  <Users className="w-12 h-12 text-purple-400 mx-auto mb-3 opacity-60" />
                  <p className="text-base font-bold text-white">No followed artists yet</p>
                  <p className="text-xs mt-1">Explore artists and follow your favorites.</p>
                  <NavLink
                    to="/artists"
                    className="mt-4 inline-block px-5 py-2 rounded-full bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white font-bold text-xs shadow"
                  >
                    Browse Artists
                  </NavLink>
                </div>
              )}
            </section>
          )}

          {/* TAB 5: Saved Albums */}
          {activeTab === 'albums' && (
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Disc className="w-5 h-5 text-pink-400" /> Saved Albums ({savedAlbums.length})
              </h3>

              {savedAlbums.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                  {savedAlbums.map((album) => (
                    <div
                      key={album.id}
                      className="glass-card p-3 rounded-2xl group flex flex-col justify-between hover:scale-105 transition-all"
                    >
                      <div
                        onClick={() => navigate(`/search?q=${encodeURIComponent(album.albumTitle)}`)}
                        className="cursor-pointer"
                      >
                        <div className="aspect-square rounded-xl overflow-hidden mb-2 bg-[#090510] border border-[#352044]">
                          <AlbumArtwork
                            src={album.albumCover}
                            alt={album.albumTitle}
                            className="w-full h-full"
                          />
                        </div>
                        <h4 className="font-bold text-xs sm:text-sm text-white truncate">{album.albumTitle}</h4>
                        <p className="text-[11px] text-[#B7A6C8] truncate">{album.albumArtist}</p>
                      </div>

                      <button
                        onClick={() => handleRemoveAlbum(album.albumId)}
                        className="mt-2 text-[10px] text-slate-400 hover:text-red-400 text-left"
                      >
                        Remove from library
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-panel p-12 rounded-3xl text-center text-[#B7A6C8] border border-[#352044]">
                  <Disc className="w-12 h-12 text-pink-400 mx-auto mb-3 opacity-60" />
                  <p className="text-base font-bold text-white">No saved albums</p>
                  <p className="text-xs mt-1">Save albums from the explore and search views.</p>
                </div>
              )}
            </section>
          )}

          {/* TAB 6: Offline Music */}
          {activeTab === 'downloads' && (
            <section className="glass-panel rounded-3xl p-6 sm:p-8 border border-[#352044] shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-xl font-bold text-white">Offline Music Cache</h3>
                </div>
                <span className="text-xs text-emerald-300 font-semibold">Lossless Audio Storage</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#090510]/80 border border-[#352044] mb-6 text-xs text-[#B7A6C8] leading-relaxed">
                Lossless audio streams from authorized providers (such as Jamendo Creative Commons and direct audio endpoints) are cached in your browser's persistent storage for uninterrupted offline playback when offline.
              </div>

              {downloads.length > 0 ? (
                <div className="overflow-x-auto">
                  <SongTableHeader />
                  <div className="divide-y divide-[#352044]/40">
                    {downloads.map((track, idx) => (
                      <SongRow
                        key={track.id || idx}
                        track={track}
                        index={idx}
                        queueContext={downloads}
                        onAddToPlaylist={(t) => setSelectedTrackForModal(t)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-[#B7A6C8] space-y-2">
                  <Download className="w-12 h-12 text-emerald-400 mx-auto opacity-50" />
                  <p className="text-base font-bold text-white">No downloaded offline tracks</p>
                  <p className="text-xs">
                    Tracks played from offline-compatible providers are automatically cached for you.
                  </p>
                </div>
              )}
            </section>
          )}
        </>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl bg-[#12091D] border border-[#352044] p-6 sm:p-8 shadow-2xl text-left"
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#352044]">
              <div className="flex items-center gap-2">
                <ListMusic className="w-5 h-5 text-[#A020F0]" />
                <h3 className="text-lg font-bold text-white">Create New Playlist</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-full text-[#B7A6C8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">Playlist Name</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. My Midnight Beats"
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">Description (Optional)</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={2}
                  placeholder="Describe the vibe of this playlist..."
                  className="w-full glass-input rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#090510] border border-[#352044]">
                <div>
                  <div className="text-xs font-bold text-white">Public Playlist</div>
                  <div className="text-[11px] text-[#B7A6C8]">Visible on your profile</div>
                </div>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 accent-[#A020F0] cursor-pointer"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#B7A6C8] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTitle.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white font-bold text-xs shadow hover:brightness-110 active:scale-95 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Playlist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        track={selectedTrackForModal}
        isOpen={!!selectedTrackForModal}
        onClose={() => setSelectedTrackForModal(null)}
      />
    </div>
  );
};

export default LibraryPage;
