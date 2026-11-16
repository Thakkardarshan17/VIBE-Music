import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Play,
  Shuffle,
  CheckCircle2,
  Music2,
  Headphones,
  Disc3,
  ExternalLink,
  Flame,
  Radio,
  ListFilter,
  Volume2,
} from 'lucide-react';
import { musicApi } from '../services/api.js';
import { Artist, Track } from '../types/music.js';
import { ArtistCard } from '../components/music/ArtistCard.js';
import { SongCard } from '../components/music/SongCard.js';
import { SongRow, SongTableHeader } from '../components/music/SongRow.js';
import { AddToPlaylistModal } from '../components/music/AddToPlaylistModal.js';
import { usePlayer } from '../context/PlayerContext.js';

export const ArtistsPage: React.FC = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [artistTracks, setArtistTracks] = useState<Track[]>([]);
  const [loadingArtists, setLoadingArtists] = useState<boolean>(true);
  const [loadingTracks, setLoadingTracks] = useState<boolean>(false);
  const [selectedTrackForModal, setSelectedTrackForModal] = useState<Track | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const [searchParams, setSearchParams] = useSearchParams();
  const queryArtistName = searchParams.get('name') || '';

  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const navigate = useNavigate();
  const tracksSectionRef = useRef<HTMLDivElement>(null);

  // Load all artists on mount
  useEffect(() => {
    let isMounted = true;
    musicApi
      .getArtists()
      .then((data) => {
        if (!isMounted) return;
        setArtists(Array.isArray(data) && data.length > 0 ? data : []);
        setLoadingArtists(false);

        // If URL has artist name, select that artist; otherwise default to first artist
        if (data.length > 0) {
          const match = queryArtistName
            ? data.find((a) => a.name.toLowerCase() === queryArtistName.toLowerCase())
            : null;
          const initial = match || data[0];
          handleSelectArtist(initial, false);
        }
      })
      .catch((err) => {
        console.warn('Failed to load artists:', err);
        setLoadingArtists(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // When URL query param changes, update selected artist if needed
  useEffect(() => {
    if (queryArtistName && artists.length > 0) {
      if (!selectedArtist || selectedArtist.name.toLowerCase() !== queryArtistName.toLowerCase()) {
        const found = artists.find(
          (a) => a.name.toLowerCase() === queryArtistName.toLowerCase()
        );
        if (found) {
          handleSelectArtist(found, false);
        }
      }
    }
  }, [queryArtistName, artists]);

  // Handle selecting an artist
  const handleSelectArtist = async (artist: Artist, shouldScroll = true) => {
    setSelectedArtist(artist);
    setLoadingTracks(true);
    setSearchParams({ name: artist.name }, { replace: true });

    if (shouldScroll) {
      setTimeout(() => {
        tracksSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }

    try {
      // 1. Fetch artist details and tracks
      const details = await musicApi.getArtistDetails(artist.name);
      if (details && Array.isArray(details.tracks) && details.tracks.length > 0) {
        setArtistTracks(details.tracks);
      } else {
        // Fallback: search for songs by this artist
        const fallbackRes = await musicApi.search(`${artist.name} songs`, 'all', 20);
        setArtistTracks(fallbackRes.tracks || []);
      }
    } catch (e) {
      console.warn('Error fetching artist tracks, trying fallback search:', e);
      try {
        const fallbackRes = await musicApi.search(`${artist.name} songs`, 'all', 20);
        setArtistTracks(fallbackRes.tracks || []);
      } catch (err2) {
        console.warn('Fallback search also failed:', err2);
        setArtistTracks([]);
      }
    } finally {
      setLoadingTracks(false);
    }
  };

  const handleShufflePlay = () => {
    if (artistTracks.length === 0) return;
    const shuffled = [...artistTracks].sort(() => Math.random() - 0.5);
    playTrack(shuffled[0], shuffled);
  };

  const filteredArtists = artists.filter(
    (a) =>
      a.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (a.genre && a.genre.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8 pb-20 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#170D24] border border-[#352044] text-purple-200 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5 text-[#E51D87]" />
            <span>Legendary Voices & Creators</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Artists & Singers
          </h2>
          <p className="text-sm text-[#B7A6C8] mt-1">
            Click on any artist to instantly load and play their top hits and full discography.
          </p>
        </div>

        {/* Filter Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#A020F0] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter artists by name..."
            className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400"
          />
        </div>
      </div>

      {/* 1. Artist Selection Carousel / Grid */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-[#B7A6C8] uppercase tracking-wider">
            Select an Artist ({filteredArtists.length})
          </span>
          {selectedArtist && (
            <span className="text-xs text-[#E51D87] font-semibold">
              Now Viewing: {selectedArtist.name}
            </span>
          )}
        </div>

        {loadingArtists ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass-card aspect-square rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {filteredArtists.map((artist) => {
              const isSelected = selectedArtist?.id === artist.id || selectedArtist?.name === artist.name;
              return (
                <ArtistCard
                  key={artist.id}
                  artist={artist}
                  isSelected={isSelected}
                  isLoading={isSelected && loadingTracks}
                  onClick={() => handleSelectArtist(artist, true)}
                />
              );
            })}
          </div>
        )}

        {/* Active Selection Banner & Immediate Feedback */}
        {selectedArtist && (
          <div className="mt-3.5 p-3.5 rounded-2xl bg-gradient-to-r from-[#170D24] via-[#241238] to-[#170D24] border border-[#A020F0]/50 flex items-center justify-between shadow-lg shadow-[#A020F0]/15 animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs sm:text-sm text-white">
                Now Viewing: <strong className="text-pink-300 font-bold">{selectedArtist.name}</strong> Discography
              </span>
            </div>
            <button
              type="button"
              onClick={() => tracksSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white text-xs font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 shadow-md"
            >
              <span>Explore Songs</span>
              <Music2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </section>

      {/* 2. Selected Artist Music Spotlight & Track List */}
      <div ref={tracksSectionRef} className="pt-2">
        {selectedArtist ? (
          <section className="glass-panel rounded-3xl p-5 sm:p-8 border border-[#352044] shadow-2xl relative overflow-hidden">
            {/* Ambient Lighting */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#A020F0]/15 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#E51D87]/15 rounded-full blur-[100px] pointer-events-none" />

            {/* Artist Header Banner */}
            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 pb-6 border-b border-[#352044]">
              {/* Large Circular Artist Avatar */}
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-[#A020F0] shadow-2xl flex-shrink-0 ring-4 ring-[#E51D87]/30">
                <img
                  src={selectedArtist.imageUrl}
                  alt={selectedArtist.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Artist Info & Stats */}
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#170D24] border border-[#352044] text-[11px] font-semibold text-[#B7A6C8] mb-2">
                  <Flame className="w-3.5 h-3.5 text-[#E51D87]" />
                  <span>Verified VIBE Artist</span>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                  <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                    {selectedArtist.name}
                  </h3>
                  {selectedArtist.verified && (
                    <CheckCircle2 className="w-6 h-6 text-[#E51D87] fill-[#E51D87]/20 flex-shrink-0" />
                  )}
                </div>

                <p className="text-sm sm:text-base text-purple-300 font-semibold mt-1">
                  {selectedArtist.genre || 'Playback Singer & Music Producer'}
                </p>

                {selectedArtist.monthlyListeners && (
                  <p className="text-xs text-slate-300 font-mono mt-1">
                    {(selectedArtist.monthlyListeners / 1000000).toFixed(1)} Million Monthly Listeners on VIBE
                  </p>
                )}

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-5">
                  {artistTracks.length > 0 && (
                    <button
                      onClick={() => playTrack(artistTracks[0], artistTracks)}
                      className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white font-bold text-xs sm:text-sm shadow-lg shadow-[#A020F0]/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 min-h-[42px]"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Play All Songs</span>
                    </button>
                  )}

                  {artistTracks.length > 1 && (
                    <button
                      onClick={handleShufflePlay}
                      className="px-5 py-2.5 rounded-full bg-[#170D24] border border-[#352044] hover:border-[#A020F0] text-white font-semibold text-xs sm:text-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-2 min-h-[42px]"
                    >
                      <Shuffle className="w-4 h-4 text-purple-300" />
                      <span>Shuffle Play</span>
                    </button>
                  )}

                  <button
                    onClick={() => navigate(`/search?q=${encodeURIComponent(selectedArtist.name)}`)}
                    className="px-4 py-2.5 rounded-full bg-[#170D24]/60 border border-[#352044] hover:border-[#E51D87] text-[#B7A6C8] hover:text-white font-medium text-xs flex items-center gap-1.5 transition-all min-h-[42px]"
                  >
                    <span>More in Search</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tracks List Section Header */}
            <div className="relative z-10 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Music2 className="w-5 h-5 text-[#A020F0]" />
                  <h4 className="text-lg sm:text-xl font-bold text-white">
                    Top Hits & Discography ({artistTracks.length})
                  </h4>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 p-1 bg-[#170D24] rounded-xl border border-[#352044]">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewMode === 'list'
                        ? 'bg-[#A020F0] text-white shadow'
                        : 'text-[#B7A6C8] hover:text-white'
                    }`}
                    title="List View"
                  >
                    <ListFilter className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-[#A020F0] text-white shadow'
                        : 'text-[#B7A6C8] hover:text-white'
                    }`}
                    title="Grid View"
                  >
                    <Radio className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tracks Display */}
              {loadingTracks ? (
                <div className="space-y-3 py-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-14 glass-card rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : artistTracks.length > 0 ? (
                viewMode === 'list' ? (
                  <div className="overflow-x-auto">
                    <SongTableHeader />
                    <div className="divide-y divide-[#352044]/40">
                      {artistTracks.map((track, idx) => (
                        <SongRow
                          key={track.id || idx}
                          track={track}
                          index={idx}
                          queueContext={artistTracks}
                          onAddToPlaylist={(t) => setSelectedTrackForModal(t)}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                    {artistTracks.map((track) => (
                      <SongCard
                        key={track.id}
                        track={track}
                        queueContext={artistTracks}
                        onAddToPlaylist={(t) => setSelectedTrackForModal(t)}
                      />
                    ))}
                  </div>
                )
              ) : (
                <div className="py-12 text-center text-[#B7A6C8] space-y-2">
                  <Headphones className="w-10 h-10 text-[#A020F0] mx-auto opacity-60" />
                  <p className="text-sm font-semibold">No tracks found for {selectedArtist.name}.</p>
                  <p className="text-xs text-slate-400">
                    Try searching for "{selectedArtist.name}" in the search bar.
                  </p>
                </div>
              )}
            </div>
          </section>
        ) : (
          <div className="glass-panel p-10 rounded-3xl text-center text-[#B7A6C8] border border-[#352044]">
            <Users className="w-10 h-10 text-[#A020F0] mx-auto mb-3 opacity-60" />
            <p className="text-sm font-semibold text-white">Select an artist above to view their songs</p>
          </div>
        )}
      </div>

      {/* Playlist Modal */}
      <AddToPlaylistModal
        track={selectedTrackForModal}
        isOpen={!!selectedTrackForModal}
        onClose={() => setSelectedTrackForModal(null)}
      />
    </div>
  );
};

export default ArtistsPage;
