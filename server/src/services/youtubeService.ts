import axios from 'axios';
import { ENV } from '../config/env.js';
import { NormalizedTrack } from '../types/index.js';

export interface YouTubeVideoItem {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  thumbnail: string;
  duration: number; // in seconds
  durationFormatted: string; // mm:ss or hh:mm:ss
  viewCount?: number;
  viewCountFormatted?: string;
  likeCount?: number;
  isLive?: boolean;
}

export interface YouTubeSearchResponse {
  items: YouTubeVideoItem[];
  nextPageToken?: string;
  prevPageToken?: string;
  totalResults?: number;
  filterApplied: string;
}

export function parseISO8601Duration(durationStr: string): number {
  if (!durationStr) return 0;
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

export function formatDuration(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds <= 0) return '0:00';
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function formatViewCount(views: number): string {
  if (!views || isNaN(views)) return '0 views';
  if (views >= 1_000_000_000) {
    return `${(views / 1_000_000_000).toFixed(1)}B views`;
  }
  if (views >= 1_000_000) {
    return `${(views / 1_000_000).toFixed(1)}M views`;
  }
  if (views >= 1_000) {
    return `${(views / 1_000).toFixed(1)}K views`;
  }
  return `${views} views`;
}

// In-memory 10-minute cache for API results
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL_MS = 10 * 60 * 1000;

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data;
  }
  return null;
}

function setCache<T>(key: string, data: T) {
  cache.set(key, { data, timestamp: Date.now() });
}

export class YouTubeService {
  private getApiKey(): string {
    return ENV.YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY || '';
  }

  /**
   * Real-time music search with custom filters & nextPageToken pagination
   */
  async search(
    query: string,
    filter: string = 'all',
    pageToken?: string,
    maxResults: number = 25
  ): Promise<YouTubeSearchResponse> {
    const cleanQuery = (query || '').trim();
    if (!cleanQuery) {
      return { items: [], filterApplied: filter };
    }

    const apiKey = this.getApiKey();

    // Apply specific filter queries
    let searchQuery = cleanQuery;
    let typeParam = 'video';

    switch (filter) {
      case 'official':
        searchQuery = `${cleanQuery} official music video`;
        break;
      case 'songs':
        searchQuery = `${cleanQuery} song audio`;
        break;
      case 'live':
        searchQuery = `${cleanQuery} live concert performance`;
        break;
      case 'covers':
        searchQuery = `${cleanQuery} cover`;
        break;
      case 'remixes':
        searchQuery = `${cleanQuery} remix`;
        break;
      case 'lyrics':
        searchQuery = `${cleanQuery} lyrics lyrical video`;
        break;
      case 'channels':
        searchQuery = `${cleanQuery} official artist`;
        typeParam = 'channel';
        break;
      default:
        searchQuery = cleanQuery;
    }

    const cacheKey = `yt_search_${cleanQuery.toLowerCase()}_${filter}_${pageToken || 'p0'}_${maxResults}`;
    const cached = getCached<YouTubeSearchResponse>(cacheKey);
    if (cached) return cached;

    // If API key is present, use official YouTube Data API v3
    if (apiKey) {
      try {
        const limit = Math.min(50, Math.max(1, maxResults));
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=${typeParam}&q=${encodeURIComponent(
          searchQuery
        )}&maxResults=${limit}&regionCode=IN&relevanceLanguage=hi${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}&key=${apiKey}`;

        const res = await axios.get(searchUrl, { timeout: 10000 });
        const searchData = res.data;

        if (searchData.items && Array.isArray(searchData.items)) {
          // If channel search, return channel items formatted
          if (typeParam === 'channel') {
            const channelItems: YouTubeVideoItem[] = searchData.items.map((item: any) => ({
              id: item.id?.channelId || item.id,
              title: item.snippet?.channelTitle || item.snippet?.title || 'Artist Channel',
              description: item.snippet?.description || '',
              channelTitle: item.snippet?.channelTitle || '',
              channelId: item.id?.channelId || '',
              publishedAt: item.snippet?.publishedAt || '',
              thumbnail:
                item.snippet?.thumbnails?.high?.url ||
                item.snippet?.thumbnails?.medium?.url ||
                item.snippet?.thumbnails?.default?.url ||
                '',
              duration: 0,
              durationFormatted: 'Channel',
            }));

            const result: YouTubeSearchResponse = {
              items: channelItems,
              nextPageToken: searchData.nextPageToken,
              prevPageToken: searchData.prevPageToken,
              totalResults: searchData.pageInfo?.totalResults,
              filterApplied: filter,
            };
            setCache(cacheKey, result);
            return result;
          }

          // Extract video IDs for batch details fetch (duration, viewCount, etc.)
          const videoIds = searchData.items
            .map((item: any) => item.id?.videoId)
            .filter(Boolean)
            .join(',');

          let videoDetailsMap = new Map<string, any>();
          if (videoIds) {
            try {
              const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${apiKey}`;
              const detailsRes = await axios.get(detailsUrl, { timeout: 8000 });
              if (detailsRes.data?.items) {
                detailsRes.data.items.forEach((item: any) => {
                  videoDetailsMap.set(item.id, item);
                });
              }
            } catch (detailsErr) {
              console.warn('[YouTube Service] Batch details fetch notice:', detailsErr);
            }
          }

          const items: YouTubeVideoItem[] = searchData.items
            .map((item: any) => {
              const vid = item.id?.videoId;
              if (!vid) return null;

              const details = videoDetailsMap.get(vid);
              const snippet = details?.snippet || item.snippet || {};
              const contentDetails = details?.contentDetails || {};
              const statistics = details?.statistics || {};

              const durationSeconds = parseISO8601Duration(contentDetails.duration || '');
              const views = statistics.viewCount ? parseInt(statistics.viewCount, 10) : undefined;
              const likes = statistics.likeCount ? parseInt(statistics.likeCount, 10) : undefined;

              const thumbnail =
                snippet.thumbnails?.maxres?.url ||
                snippet.thumbnails?.high?.url ||
                snippet.thumbnails?.medium?.url ||
                snippet.thumbnails?.default?.url ||
                `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;

              return {
                id: vid,
                title: snippet.title || 'Music Video',
                description: snippet.description || '',
                channelTitle: snippet.channelTitle || 'YouTube Artist',
                channelId: snippet.channelId || '',
                publishedAt: snippet.publishedAt ? snippet.publishedAt.substring(0, 10) : '',
                thumbnail,
                duration: durationSeconds || 240,
                durationFormatted: formatDuration(durationSeconds || 240),
                viewCount: views,
                viewCountFormatted: views !== undefined ? formatViewCount(views) : undefined,
                likeCount: likes,
                isLive: snippet.liveBroadcastContent === 'live',
              };
            })
            .filter(Boolean) as YouTubeVideoItem[];

          const result: YouTubeSearchResponse = {
            items,
            nextPageToken: searchData.nextPageToken,
            prevPageToken: searchData.prevPageToken,
            totalResults: searchData.pageInfo?.totalResults,
            filterApplied: filter,
          };

          setCache(cacheKey, result);
          return result;
        }
      } catch (err: any) {
        console.warn('[YouTube Service] Official Data API error, falling back to Web Search:', err?.message);
      }
    }

    // Web Search Parser Fallback (No Key / Quota Exhaustion)
    const fallbackTracks = await searchYouTube(searchQuery, maxResults);
    const items: YouTubeVideoItem[] = fallbackTracks.map((t) => ({
      id: t.youtubeId || t.id.replace('youtube-', ''),
      title: t.title,
      description: '',
      channelTitle: t.artist,
      channelId: '',
      publishedAt: t.releaseDate || '2026',
      thumbnail: t.coverUrl,
      duration: t.duration || 240,
      durationFormatted: formatDuration(t.duration || 240),
    }));

    const result: YouTubeSearchResponse = {
      items,
      filterApplied: filter,
    };
    setCache(cacheKey, result);
    return result;
  }

  /**
   * Retrieve video information via videos.list
   */
  async getVideoDetails(videoId: string): Promise<YouTubeVideoItem | null> {
    const vid = (videoId || '').trim();
    if (!vid) return null;

    const cacheKey = `yt_video_${vid}`;
    const cached = getCached<YouTubeVideoItem>(cacheKey);
    if (cached) return cached;

    const apiKey = this.getApiKey();
    if (apiKey) {
      try {
        const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${encodeURIComponent(
          vid
        )}&key=${apiKey}`;

        const res = await axios.get(url, { timeout: 8000 });
        const item = res.data?.items?.[0];
        if (item) {
          const snippet = item.snippet || {};
          const contentDetails = item.contentDetails || {};
          const statistics = item.statistics || {};

          const durationSeconds = parseISO8601Duration(contentDetails.duration || '');
          const views = statistics.viewCount ? parseInt(statistics.viewCount, 10) : undefined;
          const likes = statistics.likeCount ? parseInt(statistics.likeCount, 10) : undefined;

          const thumbnail =
            snippet.thumbnails?.maxres?.url ||
            snippet.thumbnails?.high?.url ||
            snippet.thumbnails?.medium?.url ||
            snippet.thumbnails?.default?.url ||
            `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;

          const video: YouTubeVideoItem = {
            id: vid,
            title: snippet.title || 'Video',
            description: snippet.description || '',
            channelTitle: snippet.channelTitle || '',
            channelId: snippet.channelId || '',
            publishedAt: snippet.publishedAt ? snippet.publishedAt.substring(0, 10) : '',
            thumbnail,
            duration: durationSeconds || 240,
            durationFormatted: formatDuration(durationSeconds || 240),
            viewCount: views,
            viewCountFormatted: views !== undefined ? formatViewCount(views) : undefined,
            likeCount: likes,
            isLive: snippet.liveBroadcastContent === 'live',
          };

          setCache(cacheKey, video);
          return video;
        }
      } catch (e: any) {
        console.warn('[YouTube Service] getVideoDetails error:', e?.message);
      }
    }

    // Default basic video information fallback
    return {
      id: vid,
      title: 'YouTube Music Video',
      description: 'Official Video stream via YouTube IFrame Player',
      channelTitle: 'YouTube Music',
      channelId: '',
      publishedAt: '2026',
      thumbnail: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
      duration: 240,
      durationFormatted: '4:00',
    };
  }

  /**
   * Retrieve trending music videos
   */
  async getTrending(regionCode: string = 'IN', maxResults: number = 25, pageToken?: string): Promise<YouTubeSearchResponse> {
    const apiKey = this.getApiKey();
    const cacheKey = `yt_trending_${regionCode}_${pageToken || 'p0'}_${maxResults}`;
    const cached = getCached<YouTubeSearchResponse>(cacheKey);
    if (cached) return cached;

    if (apiKey) {
      try {
        const limit = Math.min(50, Math.max(1, maxResults));
        const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&chart=mostPopular&videoCategoryId=10&regionCode=${encodeURIComponent(
          regionCode
        )}&maxResults=${limit}${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}&key=${apiKey}`;

        const res = await axios.get(url, { timeout: 10000 });
        const data = res.data;

        const items: YouTubeVideoItem[] = (data.items || []).map((item: any) => {
          const snippet = item.snippet || {};
          const contentDetails = item.contentDetails || {};
          const statistics = item.statistics || {};

          const durationSeconds = parseISO8601Duration(contentDetails.duration || '');
          const views = statistics.viewCount ? parseInt(statistics.viewCount, 10) : undefined;
          const likes = statistics.likeCount ? parseInt(statistics.likeCount, 10) : undefined;

          const thumbnail =
            snippet.thumbnails?.maxres?.url ||
            snippet.thumbnails?.high?.url ||
            snippet.thumbnails?.medium?.url ||
            snippet.thumbnails?.default?.url ||
            `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`;

          return {
            id: item.id,
            title: snippet.title || 'Trending Music Video',
            description: snippet.description || '',
            channelTitle: snippet.channelTitle || '',
            channelId: snippet.channelId || '',
            publishedAt: snippet.publishedAt ? snippet.publishedAt.substring(0, 10) : '',
            thumbnail,
            duration: durationSeconds || 240,
            durationFormatted: formatDuration(durationSeconds || 240),
            viewCount: views,
            viewCountFormatted: views !== undefined ? formatViewCount(views) : undefined,
            likeCount: likes,
            isLive: snippet.liveBroadcastContent === 'live',
          };
        });

        const result: YouTubeSearchResponse = {
          items,
          nextPageToken: data.nextPageToken,
          prevPageToken: data.prevPageToken,
          totalResults: data.pageInfo?.totalResults,
          filterApplied: 'trending',
        };

        setCache(cacheKey, result);
        return result;
      } catch (err: any) {
        console.warn('[YouTube Service] getTrending error:', err?.message);
      }
    }

    // Fallback: search for Trending Music India 2026
    return await this.search('Trending Music India 2026', 'all', pageToken, maxResults);
  }

  /**
   * Retrieve playlist videos
   */
  async getPlaylistVideos(playlistId: string, pageToken?: string, maxResults: number = 25): Promise<YouTubeSearchResponse> {
    const pid = (playlistId || '').trim();
    if (!pid) return { items: [], filterApplied: 'playlist' };

    const apiKey = this.getApiKey();
    const cacheKey = `yt_playlist_${pid}_${pageToken || 'p0'}_${maxResults}`;
    const cached = getCached<YouTubeSearchResponse>(cacheKey);
    if (cached) return cached;

    if (apiKey) {
      try {
        const limit = Math.min(50, Math.max(1, maxResults));
        const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${encodeURIComponent(
          pid
        )}&maxResults=${limit}${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}&key=${apiKey}`;

        const res = await axios.get(url, { timeout: 10000 });
        const data = res.data;

        const items: YouTubeVideoItem[] = (data.items || [])
          .map((item: any) => {
            const vid = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId;
            if (!vid) return null;

            const snippet = item.snippet || {};
            const thumbnail =
              snippet.thumbnails?.maxres?.url ||
              snippet.thumbnails?.high?.url ||
              snippet.thumbnails?.medium?.url ||
              snippet.thumbnails?.default?.url ||
              `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;

            return {
              id: vid,
              title: snippet.title || 'Playlist Video',
              description: snippet.description || '',
              channelTitle: snippet.channelTitle || '',
              channelId: snippet.channelId || '',
              publishedAt: snippet.publishedAt ? snippet.publishedAt.substring(0, 10) : '',
              thumbnail,
              duration: 240,
              durationFormatted: '4:00',
            };
          })
          .filter(Boolean) as YouTubeVideoItem[];

        const result: YouTubeSearchResponse = {
          items,
          nextPageToken: data.nextPageToken,
          prevPageToken: data.prevPageToken,
          totalResults: data.pageInfo?.totalResults,
          filterApplied: 'playlist',
        };

        setCache(cacheKey, result);
        return result;
      } catch (err: any) {
        console.warn('[YouTube Service] getPlaylistVideos error:', err?.message);
      }
    }

    return { items: [], filterApplied: 'playlist' };
  }
}

export const youtubeService = new YouTubeService();

// Backward compatibility functions
export async function searchYouTube(query: string, limit = 15): Promise<NormalizedTrack[]> {
  if (ENV.YOUTUBE_API_KEY) {
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          type: 'video',
          videoCategoryId: '10',
          maxResults: limit,
          q: `${query} music song`,
          key: ENV.YOUTUBE_API_KEY,
        },
        timeout: 8000,
      });

      if (response.data?.items?.length > 0) {
        return response.data.items.map((item: any): NormalizedTrack => {
          const videoId = item.id?.videoId;
          return {
            id: `youtube-${videoId}`,
            title: item.snippet?.title?.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"') || 'YouTube Track',
            artist: item.snippet?.channelTitle || 'Official Artist',
            album: 'Official Full Track',
            duration: 240,
            coverUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url,
            youtubeId: videoId,
            provider: 'youtube',
            providerName: 'YouTube (Full Song)',
            isAuthorized: true,
            playbackType: 'youtube',
            releaseDate: item.snippet?.publishedAt?.substring(0, 10) || '2026',
          };
        });
      }
    } catch (error: any) {
      console.warn(`[YouTube Service] Data API error for "${query}":`, error.message);
    }
  }

  // Fallback web search parser
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' song official')}`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 8000,
    });

    const html = response.data;
    const match = html.match(/var ytInitialData\s*=\s*({.+?});<\/script>/s) || html.match(/ytInitialData\s*=\s*({.+?});/s);

    if (match) {
      try {
        const data = JSON.parse(match[1]);
        const contents =
          data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];

        const results: NormalizedTrack[] = [];
        const seen = new Set<string>();

        for (const item of contents) {
          const v = item.videoRenderer;
          if (v && v.videoId && !seen.has(v.videoId)) {
            seen.add(v.videoId);
            const title = (v.title?.runs?.map((r: any) => r.text).join('') || `${query} Full Song`)
              .replace(/&amp;/g, '&')
              .replace(/&#39;/g, "'")
              .replace(/&quot;/g, '"');
            const artist = v.ownerText?.runs?.[0]?.text || 'Official Artist';
            const durationStr = v.lengthText?.simpleText || '3:30';
            const parts = durationStr.split(':').map((p: string) => parseInt(p, 10));
            const duration = parts.length === 2 ? parts[0] * 60 + parts[1] : 210;
            const coverUrl = v.thumbnail?.thumbnails?.slice(-1)[0]?.url || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;

            results.push({
              id: `youtube-${v.videoId}`,
              title,
              artist,
              album: 'Official Full Track',
              duration,
              coverUrl,
              youtubeId: v.videoId,
              provider: 'youtube',
              providerName: 'YouTube (Full Song)',
              isAuthorized: true,
              playbackType: 'youtube',
              releaseDate: '2026',
            });

            if (results.length >= limit) break;
          }
        }

        if (results.length > 0) return results;
      } catch (jsonErr) {}
    }
  } catch (err: any) {}

  return [];
}

export async function resolveFullSong(title: string, artist: string): Promise<{ youtubeId: string; duration: number; coverUrl: string } | null> {
  try {
    const q = `${title} ${artist} full song official`;
    const tracks = await searchYouTube(q, 3);
    if (tracks.length > 0 && tracks[0].youtubeId) {
      return {
        youtubeId: tracks[0].youtubeId,
        duration: tracks[0].duration || 220,
        coverUrl: tracks[0].coverUrl,
      };
    }
  } catch (err: any) {
    console.warn('[YouTube Resolver] Error resolving full track:', err.message);
  }
  return null;
}
