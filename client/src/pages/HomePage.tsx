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
} from 'lucide-react';
import { musicApi, historyApi } from '../services/api.js';
import { localMusicStorage } from '../services/localMusicStorage.js';
import { Track, Artist, Album } from '../types/music.js';
import { SongCard } from '../components/music/SongCard.js';
import { ArtistCard } from '../components/music/ArtistCard.js';
import { AlbumCard } from '../components/music/AlbumCard.js';
import { AddToPlaylistModal } from '../components/music/AddToPlaylistModal.js';
import { AlbumArtwork } from '../components/common/AlbumArtwork.js';
import { usePlayer } from '../context/PlayerContext.js';
import { useAuth } from '../context/AuthContext.js';

export const HomePage: React.FC = () => {
  const [trending, setTrending] = useState<Track[]>([]);
  const [newReleases, setNewReleases] = useState<Track[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [recentTracks, setRecentTracks] = useState<Track[]>(() => localMusicStorage.getRecentTracks());
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trendData, releaseData, artistData, albumData] = await Promise.all([
          musicApi.getTrending(),
          musicApi.getNewReleases(),
          musicApi.getArtists(),
          musicApi.getAlbums(),
        ]);
        setTrending(trendData);
        setNewReleases(releaseData);
        setArtists(artistData);
        setAlbums(albumData);

        if (isAuthenticated) {
          historyApi
            .list()
            .then((items) => {
              if (Array.isArray(items) && items.length > 0) {
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
        console.warn('Error fetching homepage data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  const heroTrack = trending[0];

  const popularGenres = [
    { name: 'Bollywood Hits', color: 'from-[#A020F0] to-[#E51D87]', query: 'Bollywood' },
    { name: 'Punjabi Beats', color: 'from-[#E51D87] to-amber-500', query: 'Punjabi' },
    { name: 'Gujarati Folk & Garba', color: 'from-amber-500 to-[#A020F0]', query: 'Gujarati' },
    { name: 'Hindi Romantic', color: 'from-pink-600 to-purple-600', query: 'Hindi' },
    { name: 'Global EDM & Dance', color: 'from-cyan-500 to-[#A020F0]', query: 'EDM' },
    { name: 'Lo-Fi Chill & Focus', color: 'from-purple-800 to-indigo-600', query: 'Lo-Fi' },
  ];

  return (
    <div className="space-y-10 pb-16 animate-fadeIn">
      {/* 1. Featured Spotlight Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-panel border border-[#352044] p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 shadow-2xl">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#170D24] border border-[#352044] text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#E51D87]" />
            <span className="text-[#B7A6C8]">Featured Spotlight</span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-3">
            {heroTrack ? heroTrack.title : 'Feel the Pure Music Rhythm'}
          </h2>
          <p className="text-sm sm:text-base text-[#B7A6C8] mb-6 line-clamp-2">
            {heroTrack
              ? `Trending sensation by ${heroTrack.artist}. Stream full high-fidelity studio sound now on VIBE.`
              : 'Stream millions of Hindi, Gujarati, Bollywood, Punjabi and Global songs directly.'}
          </p>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <button
              onClick={() => heroTrack && playTrack(heroTrack, trending)}
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

      {/* 2. Trending Section */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-[#E51D87]" />
            <h3 className="text-xl md:text-2xl font-bold text-white">Trending Right Now</h3>
          </div>
          <button
            onClick={() => navigate('/trending')}
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
            {trending.slice(0, 6).map((track) => (
              <SongCard
                key={track.id}
                track={track}
                queueContext={trending}
                onAddToPlaylist={(t) => setSelectedTrackForModal(t)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 3. Popular Genres Grid */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-[#A020F0]" />
            <h3 className="text-xl md:text-2xl font-bold text-white">Popular Genres</h3>
          </div>
          <button
            onClick={() => navigate('/explore')}
            className="text-xs md:text-sm font-semibold text-[#B7A6C8] hover:text-white flex items-center gap-1 transition-colors"
          >
            All Categories <ChevronRight className="w-4 h-4" />
          </button>
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

      {/* 4. Top Artists Section */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-[#A020F0]" />
            <h3 className="text-xl md:text-2xl font-bold text-white">Featured Artists</h3>
          </div>
          <button
            onClick={() => navigate('/artists')}
            className="text-xs md:text-sm font-semibold text-[#B7A6C8] hover:text-white flex items-center gap-1 transition-colors"
          >
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {artists.slice(0, 6).map((artist) => (
            <ArtistCard
              key={artist.id}
              artist={artist}
              onClick={() => navigate(`/artists?name=${encodeURIComponent(artist.name)}`)}
            />
          ))}
        </div>
      </section>

      {/* 5. Fresh Releases Section */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
            <h3 className="text-xl md:text-2xl font-bold text-white">Fresh Releases</h3>
          </div>
          <button
            onClick={() => navigate('/new-releases')}
            className="text-xs md:text-sm font-semibold text-[#B7A6C8] hover:text-white flex items-center gap-1 transition-colors"
          >
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {newReleases.slice(0, 6).map((track) => (
            <SongCard
              key={track.id}
              track={track}
              queueContext={newReleases}
              onAddToPlaylist={(t) => setSelectedTrackForModal(t)}
            />
          ))}
        </div>
      </section>

      {/* 6. Recommended Albums Section */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Disc className="w-5 h-5 sm:w-6 sm:h-6 text-[#E51D87]" />
            <h3 className="text-xl md:text-2xl font-bold text-white">Iconic Albums</h3>
          </div>
          <button
            onClick={() => navigate('/albums')}
            className="text-xs md:text-sm font-semibold text-[#B7A6C8] hover:text-white flex items-center gap-1 transition-colors"
          >
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {albums.slice(0, 6).map((album) => (
            <AlbumCard
              key={album.id}
              album={album}
              onClick={() => navigate(`/albums?title=${encodeURIComponent(album.title)}`)}
            />
          ))}
        </div>
      </section>

      {/* 7. Recently Played (if user has history) */}
      {recentTracks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
              <h3 className="text-xl md:text-2xl font-bold text-white">Recently Played</h3>
            </div>
            <button
              onClick={() => navigate('/history')}
              className="text-xs md:text-sm font-semibold text-[#B7A6C8] hover:text-white flex items-center gap-1 transition-colors"
            >
              Full History <ChevronRight className="w-4 h-4" />
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

      {/* Playlist modal */}
      <AddToPlaylistModal
        track={selectedTrackForModal}
        isOpen={!!selectedTrackForModal}
        onClose={() => setSelectedTrackForModal(null)}
      />
    </div>
  );
};
