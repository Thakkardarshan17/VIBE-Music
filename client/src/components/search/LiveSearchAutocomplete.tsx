import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Play,
  Pause,
  Disc3,
  User,
  Disc,
  ListMusic,
  Compass,
  Clock,
  Flame,
  ArrowRight,
  TrendingUp,
  Loader2,
  Music,
  Mic,
} from 'lucide-react';
import { searchApi, LiveSuggestionsResult } from '../../services/api.js';
import { Track, Artist, Album, Playlist } from '../../types/music.js';
import { usePlayer } from '../../context/PlayerContext.js';
import { VoiceSearchModal } from './VoiceSearchModal.js';
import { AlbumArtwork } from '../common/AlbumArtwork.js';

interface LiveSearchAutocompleteProps {
  placeholder?: string;
  initialQuery?: string;
  className?: string;
  onSearchSubmit?: (query: string) => void;
  autoFocus?: boolean;
  isTopBar?: boolean;
}

export const LiveSearchAutocomplete: React.FC<LiveSearchAutocompleteProps> = ({
  placeholder = 'Search Hindi, Gujarati, Bollywood, Punjabi tracks, artists, albums...',
  initialQuery = '',
  className = '',
  onSearchSubmit,
  autoFocus = false,
  isTopBar = false,
}) => {
  const [query, setQuery] = useState<string>(initialQuery);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<LiveSuggestionsResult['suggestions']>({
    artists: [],
    songs: [],
    albums: [],
    playlists: [],
    genres: [],
  });
  const [totalCount, setTotalCount] = useState<number>(0);

  // Trending & Recent Search state
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Keyboard navigation focus index
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const debounceTimerRef = useRef<any>(null);

  const { currentTrack, isPlaying, playTrack } = usePlayer();
  const navigate = useNavigate();

  // Load trending and recent searches on mount
  useEffect(() => {
    searchApi
      .getTrending()
      .then((data) => {
        setTrendingSearches(data.trendingQueries || []);
      })
      .catch(() => {});

    searchApi
      .getHistory()
      .then((hist) => {
        setRecentSearches(hist || []);
      })
      .catch(() => {});
  }, []);

  // Sync if initialQuery prop changes
  useEffect(() => {
    if (initialQuery !== undefined) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch live suggestions debounced (300ms)
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions({
        artists: [],
        songs: [],
        albums: [],
        playlists: [],
        genres: [],
      });
      setTotalCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await searchApi.getSuggestions(trimmed);
        setSuggestions(res.suggestions);
        setTotalCount(res.total);
      } catch (err) {
        console.warn('Live search suggestions error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query]);

  // Flatten suggestions for keyboard indexing
  const flattenedItems: {
    type: 'song' | 'artist' | 'album' | 'playlist' | 'genre';
    data: any;
  }[] = [
    ...suggestions.artists.map((a) => ({ type: 'artist' as const, data: a })),
    ...suggestions.songs.map((s) => ({ type: 'song' as const, data: s })),
    ...suggestions.albums.map((al) => ({ type: 'album' as const, data: al })),
    ...suggestions.playlists.map((pl) => ({ type: 'playlist' as const, data: pl })),
    ...suggestions.genres.map((g) => ({ type: 'genre' as const, data: g })),
  ];

  // Highlight matching text helper
  const highlightMatch = (text: string, q: string) => {
    if (!q.trim() || !text) return text;
    const parts = text.split(new RegExp(`(${q.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === q.toLowerCase() ? (
            <span key={i} className="text-[#E51D87] font-black underline decoration-[#E51D87]/70">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const handleSelectQuery = (searchQuery: string) => {
    setQuery(searchQuery);
    setIsOpen(false);
    searchApi.saveHistory(searchQuery).catch(() => {});
    if (onSearchSubmit) {
      onSearchSubmit(searchQuery);
    } else {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSelectSong = (song: Track, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    searchApi.saveHistory(song.title).catch(() => {});
    setIsOpen(false);
    playTrack(song, suggestions.songs);
  };

  const handleSelectArtist = (artist: Artist) => {
    setIsOpen(false);
    searchApi.saveHistory(artist.name).catch(() => {});
    navigate(`/artists?name=${encodeURIComponent(artist.name)}`);
  };

  const handleSelectAlbum = (album: Album) => {
    setIsOpen(false);
    searchApi.saveHistory(album.title).catch(() => {});
    navigate(`/albums?title=${encodeURIComponent(album.title)}`);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions({
      artists: [],
      songs: [],
      albums: [],
      playlists: [],
      genres: [],
    });
    setTotalCount(0);
    setFocusedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1 < flattenedItems.length ? prev + 1 : 0));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : flattenedItems.length - 1));
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < flattenedItems.length) {
        const item = flattenedItems[focusedIndex];
        if (item.type === 'song') handleSelectSong(item.data);
        else if (item.type === 'artist') handleSelectArtist(item.data);
        else if (item.type === 'album') handleSelectAlbum(item.data);
        else if (item.type === 'genre') handleSelectQuery(item.data.name);
      } else if (query.trim()) {
        handleSelectQuery(query.trim());
      }
    }
  };

  const handleClearHistory = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await searchApi.clearHistory();
      setRecentSearches([]);
    } catch (e) {
      console.warn(e);
    }
  };

  // Determine dropdown position: If in TopBar on mobile, use fixed full width; otherwise absolute top-full
  const dropdownPositionClass = isTopBar
    ? 'fixed inset-x-2 top-[58px] sm:absolute sm:inset-x-0 sm:top-full sm:mt-2'
    : 'absolute top-full left-0 right-0 mt-2';

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-[#B7A6C8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setFocusedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-[#12091D] border border-[#352044] focus:border-[#A020F0] focus:ring-2 focus:ring-[#A020F0]/30 rounded-full pl-10 pr-20 sm:pr-24 py-2 sm:py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 shadow-inner min-h-[44px] transition-all"
        />

        {/* Right side: Loading spinner, Clear button & Glowing Neon Mic Button */}
        <div className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {loading && <Loader2 className="w-4 h-4 text-[#A020F0] animate-spin flex-shrink-0" />}
          {query.length > 0 && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-[#B7A6C8] hover:text-white rounded-full transition-colors flex-shrink-0"
              title="Clear Search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Smart Glowing Voice Search Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsVoiceOpen(true);
            }}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-[#A020F0] to-[#E51D87] text-white flex items-center justify-center shadow-[0_0_12px_rgba(229,29,135,0.45)] hover:shadow-[0_0_18px_rgba(160,32,240,0.85)] hover:scale-110 active:scale-95 transition-all flex-shrink-0 cursor-pointer min-h-[30px] min-w-[30px]"
            title="Voice Search (English, Hindi, Gujarati)"
          >
            <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white/20" />
          </button>
        </div>
      </div>

      {/* 100% Solid Opaque Autocomplete Dropdown Panel (NO TRANSPARENCY) */}
      {isOpen && (
        <div
          className={`${dropdownPositionClass} z-[9999] rounded-2xl border-2 border-[#A020F0]/80 shadow-[0_25px_80px_rgba(0,0,0,1)] overflow-hidden max-h-[60vh] sm:max-h-[70vh] overflow-y-auto overscroll-contain animate-fadeIn divide-y divide-[#352044]`}
          style={{
            backgroundColor: '#12091D',
            opacity: 1,
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
          }}
        >
          {/* STATE 1: Empty Query (< 2 chars) -> Show Trending & Recent Searches */}
          {query.trim().length < 2 && (
            <div className="p-3.5 sm:p-5 space-y-4" style={{ backgroundColor: '#12091D' }}>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#B7A6C8] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#A020F0]" /> Recent Searches
                    </span>
                    <button
                      onClick={handleClearHistory}
                      className="text-[10px] text-[#E51D87] hover:text-pink-300 font-semibold"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {recentSearches.slice(0, 6).map((term) => (
                      <button
                        key={term}
                        onClick={() => handleSelectQuery(term)}
                        className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#170D24] hover:bg-[#231338] border border-[#352044] text-xs text-[#B7A6C8] hover:text-white flex items-center gap-1.5 transition-all"
                      >
                        <Clock className="w-3 h-3 text-purple-400" />
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Searches */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#B7A6C8] flex items-center gap-1.5 mb-2">
                  <Flame className="w-3.5 h-3.5 text-[#E51D87]" /> Trending Searches
                </span>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {trendingSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => handleSelectQuery(term)}
                      className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#170D24] hover:bg-[#231338] border border-[#352044] hover:border-[#A020F0] text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 transition-all"
                    >
                      <TrendingUp className="w-3 h-3 text-[#E51D87]" />
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[10px] sm:text-[11px] text-slate-400 italic text-center pt-2 border-t border-[#352044]">
                Type at least 2 characters for live suggestions across songs, artists & albums.
              </p>
            </div>
          )}

          {/* STATE 2: Loading Skeleton State */}
          {query.trim().length >= 2 && loading && (
            <div className="p-3 sm:p-4 space-y-2.5" style={{ backgroundColor: '#12091D' }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-[#170D24] border border-[#352044] animate-pulse">
                  <div className="w-10 h-10 rounded-lg bg-[#231338] flex-shrink-0" />
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="w-3/4 h-3 rounded bg-[#231338]" />
                    <div className="w-1/2 h-2.5 rounded bg-[#231338]" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STATE 3: Categorized Suggestions List (100% Solid Cards) */}
          {query.trim().length >= 2 && !loading && totalCount > 0 && (() => {
            const artistList = suggestions?.artists || [];
            const songList = suggestions?.songs || [];
            const albumList = suggestions?.albums || [];
            const genreList = suggestions?.genres || [];

            return (
            <div className="p-2 sm:p-3 space-y-3.5" style={{ backgroundColor: '#12091D' }}>
              {/* Category: Artists */}
              {artistList.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#A020F0] flex items-center gap-1.5 mb-1">
                    <User className="w-3 h-3" /> Artists
                  </div>
                  <div className="space-y-1.5">
                    {artistList.map((artist) => (
                      <div
                        key={artist.id}
                        onClick={() => handleSelectArtist(artist)}
                        className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-[#170D24] hover:bg-[#231338] border border-[#352044] cursor-pointer transition-all group min-h-[44px]"
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden min-w-0 flex-1">
                          <img
                            src={artist.imageUrl}
                            alt={artist.name}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-[#A020F0] flex-shrink-0"
                          />
                          <div className="truncate min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-bold text-white group-hover:text-purple-300 truncate">
                              {highlightMatch(artist.name, query)}
                            </p>
                            <p className="text-[10px] sm:text-[11px] text-[#B7A6C8] truncate">
                              {artist.genre || 'Artist'} • {(artist.monthlyListeners || 1000000) / 1000000}M Monthly
                            </p>
                          </div>
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#090510] border border-[#352044] text-[#B7A6C8] flex-shrink-0 ml-2">
                          Artist
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category: Songs */}
              {songList.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#E51D87] flex items-center gap-1.5 mb-1">
                    <Disc3 className="w-3 h-3" /> Songs
                  </div>
                  <div className="space-y-1.5">
                    {songList.map((song) => {
                      const isCurrent = currentTrack?.id === song.id;
                      return (
                        <div
                          key={song.id}
                          onClick={() => handleSelectSong(song)}
                          className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-[#170D24] hover:bg-[#231338] border border-[#352044] cursor-pointer transition-all group min-h-[44px]"
                        >
                          <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden min-w-0 flex-1">
                            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#090510] border border-[#352044]">
                              <AlbumArtwork
                                src={song.coverUrl}
                                alt={song.title}
                                aspectRatio="square"
                                rounded="rounded-lg"
                                className="w-full h-full"
                              />
                              <div
                                onClick={(e) => handleSelectSong(song, e)}
                                className={`absolute inset-0 z-20 bg-black/60 flex items-center justify-center transition-opacity ${
                                  isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                }`}
                              >
                                {isCurrent && isPlaying ? (
                                  <Pause className="w-3.5 h-3.5 text-white fill-current" />
                                ) : (
                                  <Play className="w-3.5 h-3.5 text-white fill-current ml-0.5" />
                                )}
                              </div>
                            </div>

                            <div className="truncate min-w-0 flex-1">
                              <p className="text-xs sm:text-sm font-bold text-white group-hover:text-pink-300 truncate leading-tight">
                                {highlightMatch(song.title, query)}
                              </p>
                              <p className="text-[10px] sm:text-[11px] text-[#B7A6C8] truncate mt-0.5">
                                {highlightMatch(song.artist, query)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-2">
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-emerald-400 whitespace-nowrap">
                              FULL SONG
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                              {Math.floor((song.duration || 180) / 60)}:
                              {String((song.duration || 180) % 60).padStart(2, '0')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Category: Albums */}
              {albumList.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-pink-400 flex items-center gap-1.5 mb-1">
                    <Disc className="w-3 h-3" /> Albums
                  </div>
                  <div className="space-y-1.5">
                    {albumList.map((album) => (
                      <div
                        key={album.id}
                        onClick={() => handleSelectAlbum(album)}
                        className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-[#170D24] hover:bg-[#231338] border border-[#352044] cursor-pointer transition-all group min-h-[44px]"
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden min-w-0 flex-1">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0">
                            <AlbumArtwork
                              src={album.coverUrl}
                              alt={album.title}
                              aspectRatio="square"
                              rounded="rounded-lg"
                              className="w-full h-full"
                            />
                          </div>
                          <div className="truncate min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-bold text-white group-hover:text-purple-300 truncate">
                              {highlightMatch(album.title, query)}
                            </p>
                            <p className="text-[10px] sm:text-[11px] text-[#B7A6C8] truncate">
                              {album.artist} • {album.releaseDate}
                            </p>
                          </div>
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#090510] border border-[#352044] text-[#B7A6C8] flex-shrink-0 ml-2">
                          Album
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category: Genres */}
              {genreList.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-1">
                    <Compass className="w-3 h-3" /> Genres
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-1 py-0.5">
                    {genreList.map((genre) => (
                      <button
                        key={genre.id}
                        onClick={() => handleSelectQuery(genre.name)}
                        className="px-2.5 py-1 rounded-xl bg-[#170D24] hover:bg-[#231338] border border-[#352044] text-xs font-semibold text-white transition-all"
                      >
                        {highlightMatch(genre.name, query)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* View Full Results Footer */}
              <button
                type="button"
                onClick={() => handleSelectQuery(query.trim())}
                className="w-full py-2.5 px-3 rounded-xl bg-[#170D24] hover:bg-[#231338] border border-[#352044] text-xs font-bold text-white flex items-center justify-center gap-2 transition-all min-h-[44px]"
              >
                <span>View all results for "{query.trim()}"</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#E51D87]" />
              </button>
            </div>
            );
          })()}

          {/* STATE 4: No Results State */}
          {query.trim().length >= 2 && !loading && totalCount === 0 && (
            <div className="p-6 text-center space-y-2" style={{ backgroundColor: '#12091D' }}>
              <Search className="w-8 h-8 text-[#B7A6C8] mx-auto opacity-50" />
              <p className="text-sm font-semibold text-white">No music found for "{query}"</p>
              <p className="text-xs text-[#B7A6C8]">
                Check your spelling or search for another artist, song, or genre.
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-2">
                {trendingSearches.slice(0, 4).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleSelectQuery(t)}
                    className="px-2.5 py-1 rounded-full bg-[#170D24] border border-[#352044] text-[11px] text-[#B7A6C8] hover:text-white"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Smart Voice Search & Commands Modal */}
      <VoiceSearchModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onSearch={(spokenText) => {
          handleSelectQuery(spokenText);
        }}
      />
    </div>
  );
};
