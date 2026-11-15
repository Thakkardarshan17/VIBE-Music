import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Disc3,
  Play,
  ListFilter,
  AlertCircle,
  Sparkles,
  Flame,
  CheckCircle2,
  User,
  Disc,
  ListMusic,
  Radio,
  RefreshCw,
} from 'lucide-react';
import { searchApi, musicApi, SearchAllResult } from '../services/api.js';
import { Track, Artist, Album, Playlist } from '../types/music.js';
import { SongCard } from '../components/music/SongCard.js';
import { SongRow, SongTableHeader } from '../components/music/SongRow.js';
import { ArtistCard } from '../components/music/ArtistCard.js';
import { AlbumCard } from '../components/music/AlbumCard.js';
import { AddToPlaylistModal } from '../components/music/AddToPlaylistModal.js';
import { LiveSearchAutocomplete } from '../components/search/LiveSearchAutocomplete.js';
import { usePlayer } from '../context/PlayerContext.js';

const QUICK_CATEGORIES = [
  { label: '🔥 Latest 2026 Hits', query: 'Latest Top Songs 2026' },
  { label: '👑 Shubh Punjabi', query: 'Shubh' },
  { label: '🎬 Bollywood Latest', query: 'Bollywood Latest Songs 2026' },
  { label: '🥁 Diljit Dosanjh', query: 'Diljit Dosanjh' },
  { label: '🪕 Gujarati Folk', query: 'Gujarati Folk Songs Aditya Gadhvi' },
  { label: '💖 Arijit Singh', query: 'Arijit Singh' },
  { label: '⚡ EDM & Club', query: 'EDM Electronic Dance 2026' },
];

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [activeTab, setActiveTab] = useState<'all' | 'songs' | 'artists' | 'albums'>('all');
  const [provider, setProvider] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [searchResult, setSearchResult] = useState<SearchAllResult | null>(null);
  const [latestTracks, setLatestTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingLatest, setLoadingLatest] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  const { playTrack } = usePlayer();
  const navigate = useNavigate();

  // Load Latest Music Automatically on initial mount
  useEffect(() => {
    musicApi
      .getLatest()
      .then((data) => {
        setLatestTracks(data);
      })
      .catch(console.warn)
      .finally(() => setLoadingLatest(false));
  }, []);

  const executeSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await searchApi.searchAll(searchTerm.trim(), activeTab);
      setSearchResult(data);
    } catch (err: any) {
      console.warn('Search failed:', err);
      setError(err.response?.data?.error || 'Music search failed. Please check your connection and try again.');
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      executeSearch(q);
    } else {
      setSearchResult(null);
    }
  }, [searchParams, activeTab]);

  const handleSelectQuery = (q: string) => {
    setSearchParams({ q });
    executeSearch(q);
  };

  const currentQuery = searchParams.get('q') || '';
  const hasSearched = !!currentQuery.trim();

  // Categorized items
  const songs = searchResult?.songs || [];
  const artists = searchResult?.artists || [];
  const albums = searchResult?.albums || [];
  const displaySongs = hasSearched ? songs : latestTracks;

  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
      {/* Search Header Banner */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#170D24] border border-[#352044] text-[#B7A6C8] text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-[#E51D87]" /> Intelligent Music Search
        </div>
        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-1.5">
          Live Search & Auto-Suggestions
        </h2>
        <p className="text-xs sm:text-sm text-[#B7A6C8] mb-4">
          Type to instantly explore songs, artists, and albums across Hindi, Gujarati, Bollywood, Punjabi and Global catalogs.
        </p>

        {/* Centralized Live Search Autocomplete Component */}
        <div className="max-w-3xl">
          <LiveSearchAutocomplete
            initialQuery={currentQuery}
            onSearchSubmit={handleSelectQuery}
            placeholder="Type any song, artist, album (e.g. Shubh, Arijit, Diljit, Avicii)..."
          />
        </div>

        {/* Quick Category Chips */}
        <div className="flex flex-wrap items-center gap-2 mt-3.5">
          {QUICK_CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => handleSelectQuery(cat.query)}
              className="px-3 py-1 rounded-full text-xs font-semibold bg-[#170D24] hover:bg-[#231338] text-[#B7A6C8] hover:text-white border border-[#352044] transition-all hover:scale-105 active:scale-95"
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Tabs & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#352044]">
        {/* Category Tabs: All, Songs, Artists, Albums */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Results' },
            { id: 'songs', label: `Songs (${songs.length})` },
            { id: 'artists', label: `Artists (${artists.length})` },
            { id: 'albums', label: `Albums (${albums.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap min-h-[36px] ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white shadow-md'
                  : 'bg-[#170D24] text-[#B7A6C8] hover:text-white border border-[#352044]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results Counter & View Switcher */}
        <div className="flex items-center gap-4 text-xs text-[#B7A6C8] justify-between sm:justify-end">
          <span>
            {hasSearched ? (
              <>Found <strong className="text-white font-mono">{searchResult?.total || 0}</strong> matches</>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Latest Music (2026)
              </span>
            )}
          </span>
          <div className="flex items-center gap-1 bg-[#170D24] p-1 rounded-lg border border-[#352044]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${viewMode === 'grid' ? 'bg-[#A020F0] text-white' : 'text-slate-400'}`}
              title="Grid View"
            >
              <Radio className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded ${viewMode === 'list' ? 'bg-[#A020F0] text-white' : 'text-slate-400'}`}
              title="List View"
            >
              <ListFilter className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="p-6 rounded-2xl bg-red-950/60 border border-red-500/40 text-center space-y-3 animate-fadeIn">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <p className="text-sm font-semibold text-white">{error}</p>
          <button
            onClick={() => executeSearch(currentQuery)}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-2 mx-auto min-h-[40px]"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Search
          </button>
        </div>
      )}

      {/* Section Header */}
      {!error && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            {hasSearched ? (
              <>Results for "{currentQuery}"</>
            ) : (
              <>
                <Flame className="w-5 h-5 text-[#E51D87]" />
                Latest Released & Trending Music (Full Songs)
              </>
            )}
          </h3>
          {displaySongs.length > 0 && (
            <button
              onClick={() => playTrack(displaySongs[0], displaySongs)}
              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white text-xs font-semibold flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all min-h-[36px]"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Play All
            </button>
          )}
        </div>
      )}

      {/* Loading Skeletons */}
      {loading || (loadingLatest && !hasSearched) ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 py-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="glass-card aspect-square rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : hasSearched && songs.length === 0 && artists.length === 0 && albums.length === 0 ? (
        /* NO RESULTS STATE */
        <div className="glass-panel p-10 sm:p-14 rounded-3xl text-center max-w-lg mx-auto border border-[#352044] my-6 space-y-3">
          <AlertCircle className="w-12 h-12 text-[#A020F0] mx-auto opacity-70" />
          <h4 className="text-lg font-bold text-white">No music found for "{currentQuery}"</h4>
          <p className="text-xs text-[#B7A6C8]">
            Try another search keyword, or pick from popular trending suggestions below.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-2">
            {QUICK_CATEGORIES.slice(0, 4).map((c) => (
              <button
                key={c.label}
                onClick={() => handleSelectQuery(c.query)}
                className="px-3.5 py-1.5 rounded-xl bg-[#170D24] border border-[#352044] text-xs font-semibold text-white hover:border-[#A020F0]"
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* RESULTS CONTENT */
        <div className="space-y-8">
          {/* Categorized Artists Section */}
          {(activeTab === 'all' || activeTab === 'artists') && artists.length > 0 && (
            <section className="space-y-3">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-[#A020F0]" /> Matching Artists ({artists.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {artists.map((artist) => (
                  <ArtistCard
                    key={artist.id}
                    artist={artist}
                    onClick={() => navigate(`/artists?name=${encodeURIComponent(artist.name)}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Categorized Albums Section */}
          {(activeTab === 'all' || activeTab === 'albums') && albums.length > 0 && (
            <section className="space-y-3">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Disc className="w-4 h-4 text-[#E51D87]" /> Matching Albums ({albums.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {albums.map((album) => (
                  <AlbumCard
                    key={album.id}
                    album={album}
                    onClick={() => navigate(`/albums?title=${encodeURIComponent(album.title)}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Categorized Songs Section */}
          {(activeTab === 'all' || activeTab === 'songs') && displaySongs.length > 0 && (
            <section className="space-y-3">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Disc3 className="w-4 h-4 text-[#E51D87]" /> Songs ({displaySongs.length})
              </h4>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                  {displaySongs.map((track) => (
                    <SongCard
                      key={track.id}
                      track={track}
                      queueContext={displaySongs}
                      onAddToPlaylist={(t) => setSelectedTrack(t)}
                    />
                  ))}
                </div>
              ) : (
                <div className="glass-panel rounded-2xl p-3 sm:p-4 border border-[#352044]">
                  <SongTableHeader />
                  <div className="divide-y divide-[#352044]/30">
                    {displaySongs.map((track, idx) => (
                      <SongRow
                        key={track.id}
                        track={track}
                        index={idx}
                        queueContext={displaySongs}
                        onAddToPlaylist={(t) => setSelectedTrack(t)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* Playlist modal */}
      <AddToPlaylistModal
        track={selectedTrack}
        isOpen={!!selectedTrack}
        onClose={() => setSelectedTrack(null)}
      />
    </div>
  );
};
