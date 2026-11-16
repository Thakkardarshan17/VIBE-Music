import axios from 'axios';
import { Track, Artist, Album } from '../types/music.js';

// Official Audius API base endpoints
const AUDIUS_DEFAULT_HOST = 'https://api.audius.co';
const APP_NAME = 'VIBE_MUSIC';

// Cache for Audius API responses (5 minutes TTL)
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL_MS = 5 * 60 * 1000;

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

// Convert raw Audius API track object to VIBE MUSIC standard Track interface
export function mapAudiusTrack(t: any): Track {
  const artwork =
    t.artwork?.['480x480'] ||
    t.artwork?.['1000x1000'] ||
    t.artwork?.['150x150'] ||
    (t.artwork?.mirrors?.[0] ? `${t.artwork.mirrors[0]}/content/${t.cover_art_sizes || t.cover_art}/480x480.jpg` : '') ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80';

  const dateStr = t.release_date || t.created_at || '';
  const formattedDate = dateStr ? dateStr.substring(0, 10) : '';

  return {
    id: `audius-${t.id}`,
    title: t.title ? t.title.trim() : 'Untitled Track',
    artist: t.user?.name ? t.user.name.trim() : (t.user?.handle || 'Audius Creator'),
    album: t.genre ? `${t.genre} Edition` : 'Single',
    duration: Math.max(10, Math.round(t.duration || 180)),
    coverUrl: artwork,
    audioUrl: `${AUDIUS_DEFAULT_HOST}/v1/tracks/${t.id}/stream?app_name=${APP_NAME}`,
    provider: 'audius',
    providerName: 'Audius Official Catalog',
    isAuthorized: true,
    playbackType: 'audio',
    genre: t.genre || 'Electronic',
    mood: t.mood || undefined,
    releaseDate: formattedDate,
  };
}

// Convert raw Audius API user to standard Artist
export function mapAudiusArtist(u: any): Artist {
  const image =
    u.profile_picture?.['480x480'] ||
    u.profile_picture?.['1000x1000'] ||
    u.profile_picture?.['150x150'] ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80';

  return {
    id: `art-audius-${u.id || u.handle}`,
    name: u.name ? u.name.trim() : (u.handle || 'Artist'),
    genre: 'Creator',
    imageUrl: image,
    verified: !!u.is_verified,
    monthlyListeners: Math.max(10000, (u.follower_count || 50) * 120),
    bio: u.bio || undefined,
  };
}

// Convert raw Audius API playlist to standard Album
export function mapAudiusPlaylist(p: any): Album {
  const cover =
    p.artwork?.['480x480'] ||
    p.artwork?.['1000x1000'] ||
    p.artwork?.['150x150'] ||
    'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80';

  const dateStr = p.release_date || p.created_at || '';
  const formattedDate = dateStr ? dateStr.substring(0, 10) : '2026';

  return {
    id: `alb-audius-${p.id}`,
    title: p.playlist_name || 'Featured Playlist',
    artist: p.user?.name || 'Audius Curators',
    coverUrl: cover,
    releaseDate: formattedDate,
    totalTracks: p.track_count || 10,
  };
}

export const audiusApi = {
  /**
   * Fetch Trending tracks from Audius API
   * GET /v1/tracks/trending
   */
  async getTrendingTracks(limit = 24, genre?: string): Promise<Track[]> {
    const cacheKey = `audius_trending_${limit}_${genre || 'all'}`;
    const cached = getCached<Track[]>(cacheKey);
    if (cached) return cached;

    try {
      const genreParam = genre ? `&genre=${encodeURIComponent(genre)}` : '';
      const url = `${AUDIUS_DEFAULT_HOST}/v1/tracks/trending?app_name=${APP_NAME}&limit=${limit}${genreParam}`;
      const res = await axios.get(url, { timeout: 8000 });
      if (res.data && Array.isArray(res.data.data)) {
        const tracks = res.data.data.map(mapAudiusTrack).filter((t: Track) => !!t.id && !!t.title);
        setCache(cacheKey, tracks);
        return tracks;
      }
    } catch (err) {
      console.warn('[Audius API] getTrendingTracks error:', err);
    }
    return [];
  },

  /**
   * Fetch Underground Trending tracks (Fresh discoveries & new talent)
   * GET /v1/tracks/trending/underground
   */
  async getUndergroundTracks(limit = 20): Promise<Track[]> {
    const cacheKey = `audius_underground_${limit}`;
    const cached = getCached<Track[]>(cacheKey);
    if (cached) return cached;

    try {
      const url = `${AUDIUS_DEFAULT_HOST}/v1/tracks/trending/underground?app_name=${APP_NAME}&limit=${limit}`;
      const res = await axios.get(url, { timeout: 8000 });
      if (res.data && Array.isArray(res.data.data)) {
        const tracks = res.data.data.map(mapAudiusTrack).filter((t: Track) => !!t.id && !!t.title);
        setCache(cacheKey, tracks);
        return tracks;
      }
    } catch (err) {
      console.warn('[Audius API] getUndergroundTracks error:', err);
    }
    return [];
  },

  /**
   * Fetch Best New Releases / Latest Tracks
   * Uses live search with date sorting to get the latest releases
   */
  async getLatestReleases(limit = 20): Promise<Track[]> {
    const cacheKey = `audius_latest_${limit}`;
    const cached = getCached<Track[]>(cacheKey);
    if (cached) return cached;

    try {
      // Query 2026 fresh releases
      const url = `${AUDIUS_DEFAULT_HOST}/v1/tracks/search?query=2026&sort_method=release_date&app_name=${APP_NAME}&limit=${limit}`;
      const res = await axios.get(url, { timeout: 8000 });
      if (res.data && Array.isArray(res.data.data)) {
        const tracks = res.data.data
          .map(mapAudiusTrack)
          .filter((t: Track) => !!t.id && !!t.title)
          .sort((a: Track, b: Track) => (b.releaseDate || '').localeCompare(a.releaseDate || ''));
        if (tracks.length > 0) {
          setCache(cacheKey, tracks);
          return tracks;
        }
      }
    } catch (err) {
      console.warn('[Audius API] getLatestReleases error:', err);
    }

    // Fallback to trending
    return await this.getTrendingTracks(limit);
  },

  /**
   * Fetch Trending Playlists / Albums
   * GET /v1/playlists/trending
   */
  async getTrendingPlaylists(limit = 12): Promise<Album[]> {
    const cacheKey = `audius_playlists_${limit}`;
    const cached = getCached<Album[]>(cacheKey);
    if (cached) return cached;

    try {
      const url = `${AUDIUS_DEFAULT_HOST}/v1/playlists/trending?app_name=${APP_NAME}&limit=${limit}`;
      const res = await axios.get(url, { timeout: 8000 });
      if (res.data && Array.isArray(res.data.data)) {
        const playlists = res.data.data.map(mapAudiusPlaylist).filter((p: Album) => !!p.id && !!p.title);
        setCache(cacheKey, playlists);
        return playlists;
      }
    } catch (err) {
      console.warn('[Audius API] getTrendingPlaylists error:', err);
    }
    return [];
  },

  /**
   * Search tracks across Audius live catalog
   * GET /v1/tracks/search?query={searchText}
   */
  async searchTracks(query: string, limit = 20): Promise<Track[]> {
    const q = (query || '').trim();
    if (!q) return [];

    const cacheKey = `audius_search_tracks_${q.toLowerCase()}_${limit}`;
    const cached = getCached<Track[]>(cacheKey);
    if (cached) return cached;

    try {
      const url = `${AUDIUS_DEFAULT_HOST}/v1/tracks/search?query=${encodeURIComponent(q)}&app_name=${APP_NAME}&limit=${limit}`;
      const res = await axios.get(url, { timeout: 8000 });
      if (res.data && Array.isArray(res.data.data)) {
        const tracks = res.data.data.map(mapAudiusTrack).filter((t: Track) => !!t.id && !!t.title);
        setCache(cacheKey, tracks);
        return tracks;
      }
    } catch (err) {
      console.warn('[Audius API] searchTracks error:', err);
    }
    return [];
  },

  /**
   * Search artists / users across Audius
   * GET /v1/users/search?query={searchText}
   */
  async searchArtists(query: string, limit = 10): Promise<Artist[]> {
    const q = (query || '').trim();
    if (!q) return [];

    const cacheKey = `audius_search_artists_${q.toLowerCase()}_${limit}`;
    const cached = getCached<Artist[]>(cacheKey);
    if (cached) return cached;

    try {
      const url = `${AUDIUS_DEFAULT_HOST}/v1/users/search?query=${encodeURIComponent(q)}&app_name=${APP_NAME}&limit=${limit}`;
      const res = await axios.get(url, { timeout: 8000 });
      if (res.data && Array.isArray(res.data.data)) {
        const artists = res.data.data.map(mapAudiusArtist).filter((a: Artist) => !!a.id && !!a.name);
        setCache(cacheKey, artists);
        return artists;
      }
    } catch (err) {
      console.warn('[Audius API] searchArtists error:', err);
    }
    return [];
  },
};
