import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Search,
  Play,
  Flame,
  ExternalLink,
  Tv,
  Sparkles,
  Maximize2,
  RefreshCw,
  Video,
  Clock,
  Eye,
  Calendar,
  AlertCircle,
  X,
  History,
  Music,
  Radio,
  Disc,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext.js';
import { youtubeApi, YouTubeVideo, YouTubeFilterType } from '../services/youtubeApi.js';
import { Track } from '../types/music.js';

const FILTERS: { id: YouTubeFilterType; label: string }[] = [
  { id: 'all', label: 'All Videos' },
  { id: 'official', label: 'Official Music Videos' },
  { id: 'songs', label: 'Songs' },
  { id: 'live', label: 'Live Music' },
  { id: 'covers', label: 'Covers' },
  { id: 'remixes', label: 'Remixes' },
  { id: 'lyrics', label: 'Lyrics Videos' },
  { id: 'channels', label: 'Artist Channels' },
];

const SEARCH_SUGGESTIONS = [
  'Arijit Singh',
  'Latest Bollywood songs 2026',
  'Punjabi songs Diljit Dosanjh',
  'Gujarati folk songs Aditya Gadhvi',
  'English songs Dua Lipa',
  'Old Hindi songs Kishore Kumar',
  'Sad songs Arijit',
  'Romantic songs Bollywood',
  'Movie songs 2026',
  'Live concert coldplay',
];

export const MusicVideosPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<YouTubeFilterType>('all');
  const [searchResults, setSearchResults] = useState<YouTubeVideo[]>([]);
  const [trendingVideos, setTrendingVideos] = useState<YouTubeVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingTrending, setLoadingTrending] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  // Search History from localStorage
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vibe_yt_search_history');
      return saved ? JSON.parse(saved) : ['Arijit Singh', 'Bollywood 2026', 'Diljit Dosanjh', 'Gujarati Folk'];
    } catch {
      return ['Arijit Singh', 'Bollywood 2026', 'Diljit Dosanjh', 'Gujarati Folk'];
    }
  });

  const { playTrack, setIsVideoVisible } = usePlayer();
  const debounceTimerRef = useRef<any>(null);

  // Load Trending Music Videos on mount
  useEffect(() => {
    youtubeApi
      .getTrending('IN', 12)
      .then((res) => {
        if (res.items && res.items.length > 0) {
          setTrendingVideos(res.items);
          if (!selectedVideo) setSelectedVideo(res.items[0]);
        }
      })
      .catch((err) => console.warn('Trending fetch notice:', err))
      .finally(() => setLoadingTrending(false));
  }, []);

  // Save Search History
  const saveToHistory = (query: string) => {
    const q = query.trim();
    if (!q) return;
    setSearchHistory((prev) => {
      const updated = [q, ...prev.filter((item) => item.toLowerCase() !== q.toLowerCase())].slice(0, 8);
      try {
        localStorage.setItem('vibe_yt_search_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Execute Search
  const executeSearch = async (term: string, filter: YouTubeFilterType = activeFilter, pageToken?: string) => {
    const cleanTerm = term.trim();
    if (!cleanTerm) {
      setSearchResults([]);
      setNextPageToken(undefined);
      return;
    }

    if (!pageToken) setLoading(true);
    else setLoadingMore(true);
    setError('');

    try {
      const res = await youtubeApi.search(cleanTerm, filter, pageToken, 24);
      if (pageToken) {
        setSearchResults((prev) => [...prev, ...res.items]);
      } else {
        setSearchResults(res.items);
        if (res.items.length > 0 && !selectedVideo) {
          setSelectedVideo(res.items[0]);
        }
      }
      setNextPageToken(res.nextPageToken);
      if (!pageToken) saveToHistory(cleanTerm);
    } catch (err: any) {
      setError(err?.message || 'YouTube search failed. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // 300ms Debounce Search Handler
  const handleQueryChange = (val: string) => {
    setSearchQuery(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (!val.trim()) {
      setSearchResults([]);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      executeSearch(val, activeFilter);
    }, 300);
  };

  const handleFilterClick = (filter: YouTubeFilterType) => {
    setActiveFilter(filter);
    if (searchQuery.trim()) {
      executeSearch(searchQuery, filter);
    }
  };

  const handleSuggestionClick = (query: string) => {
    setSearchQuery(query);
    executeSearch(query, activeFilter);
  };

  const handlePlayVideo = (video: YouTubeVideo) => {
    setSelectedVideo(video);
    setIsVideoVisible(true);

    const trackItem: Track = {
      id: `youtube-${video.id}`,
      title: video.title,
      artist: video.channelTitle,
      album: 'YouTube Official Video',
      duration: video.duration || 240,
      coverUrl: video.thumbnail,
      youtubeId: video.id,
      provider: 'youtube',
      providerName: 'YouTube Music Video',
      isAuthorized: true,
      playbackType: 'youtube',
      releaseDate: video.publishedAt,
    };

    playTrack(trackItem);
  };

  const handleLoadMore = () => {
    if (nextPageToken && searchQuery.trim()) {
      executeSearch(searchQuery, activeFilter, nextPageToken);
    }
  };

  const activeVideos = searchResults.length > 0 ? searchResults : trendingVideos;

  return (
    <div className="space-y-8 pb-16 animate-fadeIn text-white">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-500/30 text-red-300 text-xs font-semibold mb-2">
            <Film className="w-3.5 h-3.5 text-red-400" /> Official YouTube Video Hub
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Music Videos</h2>
          <p className="text-xs sm:text-sm text-[#B7A6C8] mt-1">
            Real-time YouTube Data API v3 search across Bollywood, Punjabi, Gujarati, English, and Live Concerts.
          </p>
        </div>

        {/* Search Input Bar with 300ms Debounce */}
        <div className="w-full lg:w-96 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B7A6C8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search YouTube music videos, artists, songs..."
            className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#170D24] border border-[#352044] focus:border-[#E51D87] text-white text-xs outline-none transition-all placeholder:text-[#B7A6C8]/60 shadow-lg"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="p-1 rounded-full text-[#B7A6C8] hover:text-white absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => handleFilterClick(f.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap min-h-[36px] ${
              activeFilter === f.id
                ? 'bg-gradient-to-r from-red-600 to-[#E51D87] text-white shadow-md'
                : 'bg-[#170D24] text-[#B7A6C8] hover:text-white border border-[#352044]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Search History & Quick Suggestions */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
        <span className="text-[11px] font-semibold text-[#B7A6C8]/80 flex items-center gap-1">
          <History className="w-3.5 h-3.5" /> Recent:
        </span>
        {searchHistory.map((item) => (
          <button
            key={item}
            onClick={() => handleSuggestionClick(item)}
            className="px-2.5 py-1 rounded-xl bg-[#170D24] hover:bg-[#201133] border border-[#352044] hover:border-[#A020F0] text-[#B7A6C8] hover:text-white transition-all text-[11px]"
          >
            {item}
          </button>
        ))}
      </div>

      {/* Error Alert with Retry */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-950/70 border border-red-500/40 text-xs text-red-200 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => executeSearch(searchQuery, activeFilter)}
            className="px-3 py-1 rounded-xl bg-red-800 hover:bg-red-700 text-white font-bold transition-all"
          >
            Retry
          </button>
        </div>
      )}

      {/* Featured Video Player Theater Stage */}
      {selectedVideo && (
        <div className="relative rounded-3xl overflow-hidden glass-panel border border-[#352044] shadow-2xl p-4 sm:p-6 bg-gradient-to-br from-[#170D24]/95 via-[#090510] to-[#170D24]/85">
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            {/* Video Thumbnail / Play Target */}
            <div className="w-full lg:w-3/5 aspect-video rounded-2xl overflow-hidden relative group bg-black shadow-2xl border border-[#352044]">
              <img
                src={selectedVideo.thumbnail}
                alt={selectedVideo.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-center justify-center">
                <button
                  onClick={() => handlePlayVideo(selectedVideo)}
                  className="w-16 h-16 rounded-full bg-gradient-to-tr from-red-600 to-[#E51D87] text-white flex items-center justify-center shadow-2xl shadow-red-500/50 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                  title="Play Full Video"
                >
                  <Play className="w-7 h-7 fill-current ml-1" />
                </button>
              </div>

              {/* Badges */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-black tracking-wider flex items-center gap-1 shadow-md">
                <Video className="w-3 h-3" /> OFFICIAL VIDEO
              </div>

              {selectedVideo.durationFormatted && (
                <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/80 text-white text-[11px] font-mono font-bold">
                  {selectedVideo.durationFormatted}
                </div>
              )}
            </div>

            {/* Video Metadata Column */}
            <div className="w-full lg:w-2/5 space-y-3.5 text-left">
              <div>
                <span className="text-[11px] font-bold text-[#E51D87] uppercase tracking-wider">
                  Featured Stream
                </span>
                <h3 className="text-lg sm:text-2xl font-black text-white leading-tight mt-1 line-clamp-2">
                  {selectedVideo.title}
                </h3>
                <p className="text-sm font-bold text-purple-300 mt-1">
                  {selectedVideo.channelTitle}
                </p>
              </div>

              {/* View Count & Published Date Stats */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#B7A6C8] font-medium pt-1">
                {selectedVideo.viewCountFormatted && (
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    {selectedVideo.viewCountFormatted}
                  </span>
                )}
                {selectedVideo.publishedAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    {selectedVideo.publishedAt}
                  </span>
                )}
              </div>

              {selectedVideo.description && (
                <p className="text-xs text-[#B7A6C8] line-clamp-3 leading-relaxed">
                  {selectedVideo.description}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => handlePlayVideo(selectedVideo)}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-[#E51D87] text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-red-500/30"
                >
                  <Play className="w-4 h-4 fill-current" /> Play in Theater
                </button>

                <a
                  href={`https://www.youtube.com/watch?v=${selectedVideo.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-3 rounded-2xl bg-[#170D24] hover:bg-[#201133] border border-[#352044] text-[#B7A6C8] hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <span>Watch on YouTube</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Results Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            {searchQuery ? (
              <>
                <Search className="w-5 h-5 text-[#E51D87]" /> Search Results ({searchResults.length})
              </>
            ) : (
              <>
                <Flame className="w-5 h-5 text-orange-400" /> Trending Music Videos
              </>
            )}
          </h3>
        </div>

        {/* Loading Skeletons */}
        {loading || (loadingTrending && !searchQuery) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass-card aspect-video rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : activeVideos.length === 0 ? (
          /* Empty State */
          <div className="glass-panel p-10 rounded-3xl text-center max-w-md mx-auto border border-[#352044] space-y-3">
            <Film className="w-12 h-12 text-[#E51D87] mx-auto opacity-60" />
            <h4 className="text-base font-bold text-white">No videos found</h4>
            <p className="text-xs text-[#B7A6C8]">
              Try searching with popular suggestions below.
            </p>
            <div className="flex flex-wrap justify-center gap-1.5 pt-2">
              {SEARCH_SUGGESTIONS.slice(0, 4).map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestionClick(s)}
                  className="px-2.5 py-1 rounded-xl bg-[#170D24] border border-[#352044] text-[11px] text-[#B7A6C8] hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Real Video Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {activeVideos.map((video) => (
              <div
                key={video.id}
                onClick={() => handlePlayVideo(video)}
                className="group glass-card rounded-2xl overflow-hidden border border-[#352044] hover:border-red-500/70 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="relative aspect-video bg-black overflow-hidden">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-red-600 to-[#E51D87] flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                    </div>
                  </div>

                  {video.durationFormatted && (
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white">
                      {video.durationFormatted}
                    </span>
                  )}
                </div>

                <div className="p-3 text-left space-y-1">
                  <h4 className="font-bold text-xs text-white line-clamp-2 group-hover:text-red-400 transition-colors">
                    {video.title}
                  </h4>
                  <p className="text-[11px] text-[#B7A6C8] truncate">
                    {video.channelTitle}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-[#B7A6C8]/70 pt-1 font-mono">
                    <span>{video.viewCountFormatted || ''}</span>
                    <span>{video.publishedAt}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Next Page Pagination ("Load More Videos") */}
        {nextPageToken && (
          <div className="flex justify-center pt-6">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-6 py-3 rounded-full bg-[#170D24] hover:bg-[#201133] border border-[#352044] hover:border-red-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-red-400 ${loadingMore ? 'animate-spin' : ''}`} />
              <span>{loadingMore ? 'Loading More Videos...' : 'Load More Videos'}</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default MusicVideosPage;
