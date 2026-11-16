import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext.js';
import { youtubeProvider } from '../services/providers/youtubeProvider.js';
import { Track } from '../types/music.js';

const FEATURED_VIDEOS: Track[] = [
  {
    id: 'youtube-feat-1',
    title: 'Kesariya - Brahmāstra (Official Music Video)',
    artist: 'Pritam, Arijit Singh, Amitabh Bhattacharya',
    album: 'Brahmāstra Part One: Shiva',
    duration: 268,
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80',
    youtubeId: 'BddP6PYo2gs',
    provider: 'youtube',
    providerName: 'YouTube Official',
    isAuthorized: true,
    playbackType: 'youtube',
    releaseDate: '2026',
  },
  {
    id: 'youtube-feat-2',
    title: 'Starboy - The Weeknd ft. Daft Punk',
    artist: 'The Weeknd, Daft Punk',
    album: 'Starboy (Official Video)',
    duration: 230,
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80',
    youtubeId: '34Na4j8AVgA',
    provider: 'youtube',
    providerName: 'YouTube Official',
    isAuthorized: true,
    playbackType: 'youtube',
    releaseDate: '2026',
  },
  {
    id: 'youtube-feat-3',
    title: 'Lover - Diljit Dosanjh',
    artist: 'Diljit Dosanjh',
    album: 'MoonChild Era',
    duration: 200,
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
    youtubeId: 'mH_LFkWxpI0',
    provider: 'youtube',
    providerName: 'YouTube Official',
    isAuthorized: true,
    playbackType: 'youtube',
    releaseDate: '2026',
  },
  {
    id: 'youtube-feat-4',
    title: 'Levitating - Dua Lipa (Official Music Video)',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    duration: 220,
    coverUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&q=80',
    youtubeId: 'TUVcZfQe-Kw',
    provider: 'youtube',
    providerName: 'YouTube Official',
    isAuthorized: true,
    playbackType: 'youtube',
    releaseDate: '2026',
  },
];

export const MusicVideosPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [trendingVideos, setTrendingVideos] = useState<Track[]>(FEATURED_VIDEOS);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedVideo, setSelectedVideo] = useState<Track | null>(FEATURED_VIDEOS[0]);

  const { playTrack, currentTrack, isPlaying, setIsVideoVisible } = usePlayer();

  useEffect(() => {
    youtubeProvider.getTrendingMusicVideos(8).then((videos) => {
      if (videos && videos.length > 0) {
        setTrendingVideos(videos);
        if (!selectedVideo) setSelectedVideo(videos[0]);
      }
    });
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await youtubeProvider.search(searchQuery.trim(), 12);
      setSearchResults(res.tracks);
    } catch (err) {
      console.warn('Video search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayVideo = (video: Track) => {
    setSelectedVideo(video);
    setIsVideoVisible(true);
    playTrack(video);
  };

  return (
    <div className="space-y-8 pb-16 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-500/30 text-red-300 text-xs font-semibold mb-2">
            <Film className="w-3.5 h-3.5 text-red-400" /> Official Video Theater
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Music Videos</h2>
          <p className="text-sm text-[#B7A6C8] mt-1">
            Watch official HD music videos, live performances, and concert sessions.
          </p>
        </div>

        {/* Video Search Bar */}
        <form onSubmit={handleSearch} className="w-full sm:w-80">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B7A6C8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search music videos..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#170D24] border border-[#352044] focus:border-[#E51D87] text-white text-xs outline-none transition-all placeholder:text-[#B7A6C8]/60"
            />
          </div>
        </form>
      </div>

      {/* Featured Big Theater Stage */}
      {selectedVideo && (
        <div className="relative rounded-3xl overflow-hidden glass-panel border border-[#352044] shadow-2xl p-4 sm:p-6 bg-gradient-to-br from-[#170D24]/90 via-[#090510] to-[#170D24]/80">
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            {/* Video Preview / Embed Thumbnail */}
            <div className="w-full lg:w-3/5 aspect-video rounded-2xl overflow-hidden relative group bg-black shadow-2xl border border-[#352044]">
              <img
                src={selectedVideo.coverUrl}
                alt={selectedVideo.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-center justify-center">
                <button
                  onClick={() => handlePlayVideo(selectedVideo)}
                  className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#A020F0] to-[#E51D87] text-white flex items-center justify-center shadow-2xl shadow-pink-500/50 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                  title="Play Video"
                >
                  <Play className="w-7 h-7 fill-current ml-1" />
                </button>
              </div>

              {/* YouTube badge */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-red-600/90 text-white text-[10px] font-extrabold tracking-wider flex items-center gap-1 shadow-md">
                <Video className="w-3 h-3" /> OFFICIAL VIDEO
              </div>
            </div>

            {/* Video Details */}
            <div className="w-full lg:w-2/5 space-y-4 text-left">
              <div>
                <span className="text-[11px] font-bold text-[#E51D87] uppercase tracking-wider">Now Featuring</span>
                <h3 className="text-xl sm:text-2xl font-black text-white leading-tight mt-1">
                  {selectedVideo.title}
                </h3>
                <p className="text-sm font-semibold text-purple-300 mt-1">
                  {selectedVideo.artist}
                </p>
                {selectedVideo.album && (
                  <p className="text-xs text-[#B7A6C8] mt-0.5">
                    {selectedVideo.album}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => handlePlayVideo(selectedVideo)}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-purple-500/30"
                >
                  <Play className="w-4 h-4 fill-current" /> Play Video
                </button>

                {selectedVideo.youtubeId && (
                  <a
                    href={`https://www.youtube.com/watch?v=${selectedVideo.youtubeId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-3 rounded-2xl bg-[#170D24] hover:bg-[#201133] border border-[#352044] text-[#B7A6C8] hover:text-white text-xs font-semibold transition-all flex items-center gap-2"
                  >
                    <span>Watch on YouTube</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Results (if searched) */}
      {searchResults.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-[#E51D87]" /> Search Results ({searchResults.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {searchResults.map((video) => (
              <div
                key={video.id}
                onClick={() => handlePlayVideo(video)}
                className="group glass-card rounded-2xl overflow-hidden border border-[#352044] hover:border-[#A020F0] transition-all cursor-pointer"
              >
                <div className="relative aspect-video overflow-hidden bg-black">
                  <img
                    src={video.coverUrl}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-8 h-8 text-white fill-current" />
                  </div>
                </div>
                <div className="p-3 text-left">
                  <h4 className="font-bold text-xs text-white truncate group-hover:text-purple-300 transition-colors">
                    {video.title}
                  </h4>
                  <p className="text-[11px] text-[#B7A6C8] truncate mt-0.5">
                    {video.artist}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trending Music Videos Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" /> Trending Music Videos
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {trendingVideos.map((video) => (
            <div
              key={video.id}
              onClick={() => handlePlayVideo(video)}
              className="group glass-card rounded-2xl overflow-hidden border border-[#352044] hover:border-[#E51D87] transition-all cursor-pointer"
            >
              <div className="relative aspect-video overflow-hidden bg-black">
                <img
                  src={video.coverUrl}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#A020F0] to-[#E51D87] flex items-center justify-center shadow-lg">
                    <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                  </div>
                </div>
                <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white">
                  HD
                </span>
              </div>
              <div className="p-3 text-left">
                <h4 className="font-bold text-xs text-white truncate group-hover:text-[#E51D87] transition-colors">
                  {video.title}
                </h4>
                <p className="text-[11px] text-[#B7A6C8] truncate mt-0.5">
                  {video.artist}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default MusicVideosPage;
