import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Flame,
  Sparkles,
  Users,
  Disc,
  ChevronRight,
  Headphones,
  Radio,
  Clock,
  Compass,
  TrendingUp,
  Music2,
  ListMusic,
  Plus,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { musicApi, historyApi, DEFAULT_TRACKS, DEFAULT_ARTISTS, DEFAULT_ALBUMS } from '../services/api.js';
import { audiusApi } from '../services/audiusApi.js';
import { localMusicStorage } from '../services/localMusicStorage.js';
import { Track, Artist, Album } from '../types/music.js';
import { SongCard } from '../components/music/SongCard.js';
import { ArtistCard } from '../components/music/ArtistCard.js';
import { AlbumCard } from '../components/music/AlbumCard.js';
import { AddToPlaylistModal } from '../components/music/AddToPlaylistModal.js';
import { AlbumArtwork } from '../components/common/AlbumArtwork.js';
import { usePlayer } from '../context/PlayerContext.js';
import { useAuth } from '../context/AuthContext.js';

type DiscoveryFilter = 'all' | 'latest' | 'trending' | 'popular' | 'electronic' | 'chill';

export const HomePage: React.FC = () => {
  // 8 Core Music Sections State
  const [latestReleases, setLatestReleases] = useState<Track[]>([]);
  const [newSongs, setNewSongs] = useState<Track[]>([]);
  const [trendingSongs, setTrendingSongs] = useState<Track[]>([]);
  const [popularTracks, setPopularTracks] = useState<Track[]>([]);
  const [recommendedTracks, setRecommendedTracks] = useState<Track[]>([]);
  const [recentTracks, setRecentTracks] = useState<Track[]>(() => localMusicStorage.getRecentTracks());
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);

  const [activeFilter, setActiveFilter] = useState<DiscoveryFilter>('all');
  const [visibleCount, setVisibleCount] = useState<number>(6);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTrackForModal, setSelectedTrackForModal] = useState<Track | null>(null);

  const { playTrack } = usePlayer();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Real-time listener for playback updates
  useEffect(() => {
    const handleRecent = (e: any) => {
      setRecentTracks(e.detail || localMusicStorage.getRecentTracks());
    };
    window.addEventListener('vibe_recent_updated', handleRecent);
    return () => window.removeEventListener('vibe_recent_updated', handleRecent);
  }, []);

  // Fetch real data from Audius API & catalog
  useEffect(() => {
    let isMounted = true;

    const fetchAllCatalogData = async () => {
      setLoading(true);
      try {
        const [
          liveTrending,
          liveReleases,
          liveUnderground,
          livePlaylists,
          liveArtists,
        ] = await Promise.allSettled([
          audiusApi.getTrendingTracks(24),
          audiusApi.getLatestReleases(24),
          audiusApi.getUndergroundTracks(24),
          audiusApi.getTrendingPlaylists(12),
          audiusApi.searchArtists('music', 12),
        ]);

        if (!isMounted) return;

        const trendList = liveTrending.status === 'fulfilled' && liveTrending.value.length > 0
          ? liveTrending.value
          : DEFAULT_TRACKS;

        const releaseList = liveReleases.status === 'fulfilled' && liveReleases.value.length > 0
          ? liveReleases.value
          : trendList;

        const undergroundList = liveUnderground.status === 'fulfilled' && liveUnderground.value.length > 0
          ? liveUnderground.value
          : trendList.slice().reverse();

        const playlistList = livePlaylists.status === 'fulfilled' && livePlaylists.value.length > 0
          ? livePlaylists.value
          : DEFAULT_ALBUMS;

        const artistList = liveArtists.status === 'fulfilled' && liveArtists.value.length > 0
          ? liveArtists.value
          : DEFAULT_ARTISTS;

        setTrendingSongs(trendList);
        setLatestReleases(releaseList);
        setNewSongs(undergroundList);
        setPopularTracks(trendList.slice(0, 12));
        setRecommendedTracks(undergroundList.slice(6, 18).concat(trendList.slice(6, 12)));
        setAlbums(playlistList);
        setArtists(artistList);

        if (isAuthenticated) {
          historyApi
            .list()
            .then((items) => {
              if (Array.isArray(items) && items.length > 0 && isMounted) {
                const mapped = items.map((i) => i.song).filter(Boolean);
                const local = localMusicStorage.getRecentTracks();
                const map = new Map<string, Track>();
                [...local, ...mapped].forEach((t) => {
                  if (t && t.id) map.set(t.id, t);
                });
                setRecentTracks(Array.from(map.values()));
              }
            })
            .catch(() => {});
        }
      } catch (err) {
        console.warn('[HomePage] Data fetch warning:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAllCatalogData();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const heroTrack = trendingSongs[0] || latestReleases[0];

  const popularGenres = [
    { name: 'Bollywood Hits', color: 'from-[#A020F0] to-[#E51D87]', query: 'Bollywood' },
    { name: 'Punjabi Beats', color: 'from-[#E51D87] to-amber-500', query: 'Punjabi' },
    { name: 'Gujarati Folk & Garba', color: 'from-amber-500 to-[#A020F0]', query: 'Gujarati' },
    { name: 'Hindi Romantic', color: 'from-pink-600 to-purple-600', query: 'Hindi' },
    { name: 'Global EDM & Dance', color: 'from-cyan-500 to-[#A020F0]', query: 'Electronic' },
    { name: 'Lo-Fi Chill & Focus', color: 'from-purple-800 to-indigo-600', query: 'Chill' },
  ];

  // Filter items based on active quick filter
  const filterTracks = (tracks: Track[]) => {
    if (activeFilter === 'electronic') {
      return tracks.filter((t) => (t.genre || '').toLowerCase().includes('electronic') || (t.genre || '').toLowerCase().includes('dance'));
    }
    if (activeFilter === 'chill') {
      return tracks.filter((t) => (t.mood || '').toLowerCase().includes('chill') || (t.genre || '').toLowerCase().includes('ambient'));
    }
    return tracks;
  };

  return (
    <div className="space-y-10 pb-16 animate-fadeIn">
      {/* 1. Featured Spotlight Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-panel border border-[#352044] p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 shadow-2xl">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#170D24] border border-[#352044] text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#E51D87]" />
            <span className="text-[#B7A6C8]">Real API Catalog • Audius Protocol</span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-3">
            {heroTrack ? heroTrack.title : 'Feel the Pure Music Rhythm'}
          </h2>
          <p className="text-sm sm:text-base text-[#B7A6C8] mb-6 line-clamp-2">
            {heroTrack
              ? `Live release by ${heroTrack.artist}. Stream full studio quality audio directly on VIBE.`
              : 'Discover and stream real releases from the decentralized Audius music protocol.'}
          </p>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <button
              onClick={() => heroTrack && playTrack(heroTrack, trendingSongs)}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white font-bold text-xs sm:text-sm shadow-lg shadow-[#A020F0]/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 min-h-[44px]"
            >
              <Play className="w-4 h-4 fill-current" /> Play Spotlight
            </button>
            <button
              onClick={() => navigate('/explore')}
              className="px-6 py-3 rounded-full bg-[#090510]/80 border border-[#352044] text-white font-semibold text-xs sm:text-sm hover:border-[#A020F0] transition-all min-h-[44px]"
            >
              Explore Genres
            </button>
          </div>
        </div>

        {heroTrack && (
          <div className="relative z-10 w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(160,32,240,0.35)] flex-shrink-0 group">
            <AlbumArtwork
              src={heroTrack.coverUrl}
              alt={heroTrack.title}
              aspectRatio="square"
              rounded="rounded-2xl"
              showGlow={true}
              className="w-full h-full"
              imgClassName="group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}
      </div>

      {/* Discovery Filters Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'all', label: 'All Catalog' },
          { id: 'latest', label: '✨ Latest 2026' },
          { id: 'trending', label: '🔥 Trending' },
          { id: 'popular', label: '⭐ Popular' },
          { id: 'electronic', label: '⚡ Electronic / Dance' },
          { id: 'chill', label: '🌙 Chill / Lo-Fi' },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setActiveFilter(btn.id as DiscoveryFilter)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap min-h-[38px] ${
              activeFilter === btn.id
                ? 'bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white shadow-lg shadow-[#A020F0]/30'
                : 'bg-[#170D24] text-[#B7A6C8] hover:text-white border border-[#352044]'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Section 1: Latest Releases */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400" />
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-white">1. Latest Releases</h3>
              <p className="text-[11px] sm:text-xs text-[#B7A6C8]">Freshly minted official releases with verified release dates</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/new-releases')}
            className="text-xs md:text-sm font-semibold text-[#B7A6C8] hover:text-white flex items-center gap-1 transition-colors"
          >
            View All <ChevronRight className="w-4 h-4" />
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
            {filterTracks(latestReleases).slice(0, visibleCount).map((track) => (
              <SongCard
                key={track.id}
                track={track}
                queueContext={latestReleases}
                onAddToPlaylist={(t) => setSelectedTrackForModal(t)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Section 2: New Songs */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <Music2 className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-white">2. New Songs</h3>
              <p className="text-[11px] sm:text-xs text-[#B7A6C8]">Brand new underground sensations and original releases</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/new-releases')}
            className="text-xs md:text-sm font-semibold text-[#B7A6C8] hover:text-white flex items-center gap-1 transition-colors"
          >
            Explore <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {filterTracks(newSongs).slice(0, visibleCount).map((track) => (
            <SongCard
              key={track.id}
              track={track}
              queueContext={newSongs}
              onAddToPlaylist={(t) => setSelectedTrackForModal(t)}
            />
          ))}
        </div>
      </section>

      {/* Section 3: Trending Songs */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-[#E51D87]" />
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-white">3. Trending Songs</h3>
              <p className="text-[11px] sm:text-xs text-[#B7A6C8]">Top trending beats right now across the globe</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/trending')}
            className="text-xs md:text-sm font-semibold text-[#B7A6C8] hover:text-white flex items-center gap-1 transition-colors"
          >
            Leaderboard <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {filterTracks(trendingSongs).slice(0, visibleCount).map((track) => (
            <SongCard
              key={track.id}
              track={track}
              queueContext={trendingSongs}
              onAddToPlaylist={(t) => setSelectedTrackForModal(t)}
            />
          ))}
        </div>
      </section>

      {/* Section 4: Recently Added / Played */}
      {recentTracks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-white">4. Recently Added</h3>
                <p className="text-[11px] sm:text-xs text-[#B7A6C8]">Your recently added and played tracks</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/history')}
              className="text-xs md:text-sm font-semibold text-[#B7A6C8] hover:text-white flex items-center gap-1 transition-colors"
            >
              History <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {recentTracks.slice(0, 6).map((track) => (
              <SongCard
                key={track.id}
                track={track}
                queueContext={recentTracks}
                onAddToPlaylist={(t) => setSelectedTrackForModal(t)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Section 5: Popular Tracks */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-white">5. Popular Tracks</h3>
              <p className="text-[11px] sm:text-xs text-[#B7A6C8]">Most streamed crowd favorites</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/top-charts')}
            className="text-xs md:text-sm font-semibold text-[#B7A6C8] hover:text-white flex items-center gap-1 transition-colors"
          >
            Charts <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {popularTracks.slice(0, 6).map((track) => (
            <SongCard
              key={track.id}
              track={track}
              queueContext={popularTracks}
              onAddToPlaylist={(t) => setSelectedTrackForModal(t)}
            />
          ))}
        </div>
      </section>

      {/* Section 6: Recommended Music */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <Headphones className="w-5 h-5 sm:w-6 sm:h-6 text-[#A020F0]" />
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-white">6. Recommended Music</h3>
              <p className="text-[11px] sm:text-xs text-[#B7A6C8]">Curated based on your listening taste</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/explore')}
            className="text-xs md:text-sm font-semibold text-[#B7A6C8] hover:text-white flex items-center gap-1 transition-colors"
          >
            Explore <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {recommendedTracks.slice(0, 6).map((track) => (
            <SongCard
              key={track.id}
              track={track}
              queueContext={recommendedTracks}
              onAddToPlaylist={(t) => setSelectedTrackForModal(t)}
            />
          ))}
        </div>
      </section>

      {/* Section 7: Latest Albums / Playlists */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <Disc className="w-5 h-5 sm:w-6 sm:h-6 text-[#E51D87]" />
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-white">7. Latest Albums / Playlists</h3>
              <p className="text-[11px] sm:text-xs text-[#B7A6C8]">Trending full albums and curator playlists</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/albums')}
            className="text-xs md:text-sm font-semibold text-[#B7A6C8] hover:text-white flex items-center gap-1 transition-colors"
          >
            All Playlists <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {(albums || []).slice(0, 6).map((album) => (
            <AlbumCard
              key={album.id}
              album={album}
              onClick={() => navigate(`/albums?title=${encodeURIComponent(album.title)}`)}
            />
          ))}
        </div>
      </section>

      {/* Section 8: Discover New Artists */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-[#A020F0]" />
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-white">8. Discover New Artists</h3>
              <p className="text-[11px] sm:text-xs text-[#B7A6C8]">Follow creators and artists making waves</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/artists')}
            className="text-xs md:text-sm font-semibold text-[#B7A6C8] hover:text-white flex items-center gap-1 transition-colors"
          >
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {(artists || []).slice(0, 6).map((artist) => (
            <ArtistCard
              key={artist.id}
              artist={artist}
              onClick={() => navigate(`/artists?name=${encodeURIComponent(artist.name)}`)}
            />
          ))}
        </div>
      </section>

      {/* Popular Genres & Moods */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-[#A020F0]" />
            <h3 className="text-xl md:text-2xl font-bold text-white">Browse By Genre & Mood</h3>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {popularGenres.map((genre) => (
            <div
              key={genre.name}
              onClick={() => navigate(`/search?q=${encodeURIComponent(genre.query)}`)}
              className={`p-4 rounded-2xl bg-gradient-to-br ${genre.color} text-white font-bold text-sm sm:text-base flex items-end h-24 sm:h-28 cursor-pointer shadow-lg hover:scale-105 active:scale-95 transition-all select-none border border-white/10`}
            >
              <span>{genre.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Load More Pagination */}
      {visibleCount < latestReleases.length && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => setVisibleCount((prev) => prev + 6)}
            className="px-6 py-3 rounded-full bg-[#170D24] hover:bg-[#221338] border border-[#352044] hover:border-[#A020F0] text-white text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shadow-lg"
          >
            <RefreshCw className="w-4 h-4 text-[#E51D87]" />
            <span>Load More Tracks</span>
          </button>
        </div>
      )}

      {/* Playlist modal */}
      <AddToPlaylistModal
        track={selectedTrackForModal}
        isOpen={!!selectedTrackForModal}
        onClose={() => setSelectedTrackForModal(null)}
      />
    </div>
  );
};
