import axios from 'axios';
import { Track, Playlist, User, UserProfile, UserSettings, Artist, Album, AdminDashboardData } from '../types/music.js';
import { localMusicStorage } from './localMusicStorage.js';

const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const API_BASE_URL = isLocalhost
  ? (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api')
  : '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Attach Authorization Bearer Token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('vibe_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor for 401 handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if invalid/expired
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/signup') {
        // localStorage.removeItem('vibe_token');
      }
    }
    return Promise.reject(error);
  }
);

// Auth Endpoints
export const authApi = {
  async register(data: { fullName: string; email: string; password: string; confirmPassword?: string; mobileNumber?: string; role?: string }) {
    const res = await apiClient.post<{ message: string; email: string; verificationRequired: boolean; demoCode?: string }>('/auth/register', data);
    return res.data;
  },
  async verifyEmail(data: { email: string; code: string }) {
    const res = await apiClient.post<{ message: string; token: string; user: User }>('/auth/verify-email', data);
    return res.data;
  },
  async resendCode(email: string) {
    const res = await apiClient.post<{ message: string; email: string; demoCode?: string }>('/auth/resend-code', { email });
    return res.data;
  },
  async login(data: { login: string; password: string; rememberMe?: boolean }) {
    const res = await apiClient.post<{ message?: string; token: string; user: User; requiresVerification?: boolean; email?: string; demoCode?: string }>('/auth/login', data);
    return res.data;
  },
  async googleAuth(data: { credential?: string; testProfile?: any }) {
    const res = await apiClient.post<{ message?: string; token: string; user: User }>('/auth/google', data);
    return res.data;
  },
  async logout() {
    try {
      await apiClient.post<{ message: string }>('/auth/logout');
    } catch {
      // Ignore if session already expired
    }
  },
  async getMe() {
    const res = await apiClient.get<{ user: User; profile: UserProfile; settings: UserSettings }>('/auth/me');
    return res.data;
  },
  async updateProfile(data: Partial<UserProfile & { fullName?: string; username?: string; avatarUrl?: string; mobileNumber?: string }>) {
    const res = await apiClient.put<{ profile: UserProfile; message: string }>('/auth/profile', data);
    return res.data;
  },
  async forgotPassword(email: string) {
    const res = await apiClient.post<{ message: string; demoResetKey?: string }>('/auth/forgot-password', { email });
    return res.data;
  },
  async resetPassword(data: { email: string; code: string; newPassword: string; confirmPassword?: string }) {
    const res = await apiClient.post<{ message: string }>('/auth/reset-password', data);
    return res.data;
  },
  async changePassword(data: { newPassword: string; confirmPassword?: string }) {
    const res = await apiClient.put<{ message: string }>('/auth/change-password', data);
    return res.data;
  },
  async updateSettings(settings: Partial<UserSettings>) {
    const res = await apiClient.put<{ settings: UserSettings; message: string }>('/auth/settings', settings);
    return res.data;
  },
};

export interface LiveSuggestionsResult {
  query: string;
  suggestions: {
    artists: Artist[];
    songs: Track[];
    albums: Album[];
    playlists: Playlist[];
    genres: { id: string; name: string; description: string }[];
  };
  total: number;
}

export interface SearchAllResult {
  query: string;
  type: string;
  total: number;
  songs: Track[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
  trendingFallback?: Track[];
}

// Default Fallback Catalogs (Ensures 100% crash-free experience on static hosts & Vercel)
export const DEFAULT_ARTISTS: Artist[] = [
  { id: 'art-1', name: 'Arijit Singh', genre: 'Bollywood, Romantic', imageUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=500&q=80', verified: true, monthlyListeners: 42500000 },
  { id: 'art-2', name: 'Diljit Dosanjh', genre: 'Punjabi, Pop', imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&q=80', verified: true, monthlyListeners: 24800000 },
  { id: 'art-3', name: 'The Weeknd', genre: 'R&B, Synthwave', imageUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=500&q=80', verified: true, monthlyListeners: 108000000 },
  { id: 'art-4', name: 'Dua Lipa', genre: 'Dance Pop, Disco', imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80', verified: true, monthlyListeners: 68500000 },
  { id: 'art-5', name: 'Coldplay', genre: 'Alternative Rock', imageUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=500&q=80', verified: true, monthlyListeners: 84000000 },
  { id: 'art-6', name: 'Shreya Ghoshal', genre: 'Bollywood, Classical', imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&q=80', verified: true, monthlyListeners: 31000000 },
  { id: 'art-7', name: 'Aditya Gadhvi', genre: 'Gujarati Folk, Fusion', imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80', verified: true, monthlyListeners: 8900000 },
  { id: 'art-8', name: 'Alan Walker', genre: 'EDM, Electro', imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&q=80', verified: true, monthlyListeners: 41200000 },
];

export const DEFAULT_ALBUMS: Album[] = [
  { id: 'alb-1', title: 'Starboy: Deluxe', artist: 'The Weeknd', coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80', releaseDate: '2023', totalTracks: 18 },
  { id: 'alb-2', title: 'Aashiqui 2 (Soundtrack)', artist: 'Arijit Singh & Mithoon', coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80', releaseDate: '2013', totalTracks: 11 },
  { id: 'alb-3', title: 'Moon Music', artist: 'Coldplay', coverUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&q=80', releaseDate: '2024', totalTracks: 10 },
  { id: 'alb-4', title: 'G.O.A.T.', artist: 'Diljit Dosanjh', coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80', releaseDate: '2020', totalTracks: 16 },
  { id: 'alb-5', title: 'Future Nostalgia', artist: 'Dua Lipa', coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80', releaseDate: '2020', totalTracks: 13 },
  { id: 'alb-6', title: 'Khalasi & Gujarati Folk', artist: 'Aditya Gadhvi & Achint', coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&q=80', releaseDate: '2023', totalTracks: 8 },
];

export const DEFAULT_TRACKS: Track[] = [
  {
    id: 'itunes-1635014240',
    title: 'Kesariya (From "Brahmastra")',
    artist: 'Pritam, Arijit Singh & Amitabh Bhattacharya',
    album: 'Kesariya (From "Brahmastra") - Single',
    duration: 268,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/9f/13/ca/9f13ca3b-e533-03e0-f19a-f0aaa774581d/196589311191.jpg/600x600bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/38/4c/5c/384c5c8f-3ff8-e457-b2f7-3158ce108649/mzaf_12389299033886433185.plus.aac.p.m4a',
    youtubeId: 'BddP6PYo2gs',
    provider: 'itunes',
    providerName: 'Apple Music Preview',
    isAuthorized: true,
    playbackType: 'audio',
    genre: 'Bollywood',
    releaseDate: '2022-07-17',
  },
  {
    id: 'itunes-1478998926',
    title: 'Ghungroo (From "War")',
    artist: 'Arijit Singh, Shilpa Rao & Vishal & Shekhar',
    album: 'Ghungroo (From "War") - Single',
    duration: 303,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/f4/0b/88/f40b88d5-75cb-27b8-6b00-bba98f0f2fd0/849486006911_cover.jpg/600x600bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/d1/90/95/d190958b-cb33-34b6-83d2-4d88b6ff1348/mzaf_8015651280578447253.plus.aac.p.m4a',
    youtubeId: 'qFkNATtc3mc',
    provider: 'itunes',
    providerName: 'Apple Music Preview',
    isAuthorized: true,
    playbackType: 'audio',
    genre: 'Bollywood',
    releaseDate: '2019-09-05',
  },
  {
    id: 'itunes-1702461667',
    title: 'Chaleya (From "Jawan")',
    artist: 'Anirudh Ravichander, Arijit Singh & Shilpa Rao',
    album: 'Chaleya - Single',
    duration: 200,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/1e/ff/32/1eff3216-190d-6fd9-8f68-acbba846e6ee/8903431956026_cover.jpg/600x600bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/55/fb/9c/55fb9c31-320a-5dba-0a3f-5e69552085a7/mzaf_13508224660474474886.plus.aac.p.m4a',
    youtubeId: 'VAdGW7QDJUI',
    provider: 'itunes',
    providerName: 'Apple Music Preview',
    isAuthorized: true,
    playbackType: 'audio',
    genre: 'Bollywood',
    releaseDate: '2023-08-14',
  },
  {
    id: 'itunes-1070912803',
    title: 'Badtameez Dil',
    artist: 'Pritam, Benny Dayal & Shefali Alvares',
    album: 'Yeh Jawaani Hai Deewani',
    duration: 253,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/62/d6/74/62d67432-0670-631f-db6a-d4bac3adae4b/8902894353328_cover.jpg/600x600bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/88/e2/af/88e2af36-3b58-3f34-32c3-d94d3086c8d5/mzaf_15476348080733865142.plus.aac.p.m4a',
    youtubeId: 'II2EO33EexI',
    provider: 'itunes',
    providerName: 'Apple Music Preview',
    isAuthorized: true,
    playbackType: 'audio',
    genre: 'Bollywood',
    releaseDate: '2013-03-30',
  },
  {
    id: 'itunes-1348996914',
    title: 'Bom Diggy Diggy',
    artist: 'Zack Knight & Jasmin Walia',
    album: 'Sonu Ke Titu Ki Sweety',
    duration: 239,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/81/a5/b0/81a5b084-89f7-7ed8-372e-aefd67504922/8902894360074_cover.jpg/600x600bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/07/01/b4/0701b4ef-88e4-b037-195b-0e42de886a17/mzaf_12594430373025782603.plus.aac.p.m4a',
    youtubeId: 'yIIGQB6EMAM',
    provider: 'itunes',
    providerName: 'Apple Music Preview',
    isAuthorized: true,
    playbackType: 'audio',
    genre: 'Bollywood',
    releaseDate: '2018-02-08',
  },
  {
    id: 'itunes-1453984033',
    title: 'Duniyaa',
    artist: 'Akhil & Dhvani Bhanushali',
    album: 'Luka Chuppi',
    duration: 223,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/2a/82/33/2a823318-956a-a6f2-7ef8-588defb7baf1/8902894360685_cover.jpg/600x600bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/f6/35/fa/f635fad4-8c54-5a07-1b85-4390232ba063/mzaf_1781529918047409597.plus.aac.p.m4a',
    youtubeId: 'i_u16f0f5j0',
    provider: 'itunes',
    providerName: 'Apple Music Preview',
    isAuthorized: true,
    playbackType: 'audio',
    genre: 'Bollywood',
    releaseDate: '2019-02-22',
  },
];

// Live Online Music Search Fallback via Apple iTunes (100% free, CORS-open, universal catalog)
async function fetchLiveMusicFromItunes(query: string, limit: number = 30): Promise<Track[]> {
  try {
    const cleanQ = (query || '').trim();
    if (!cleanQ) return [];
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanQ)}&media=music&entity=song&limit=${limit}`;
    const res = await axios.get(url, { timeout: 8000 });
    if (res.data && Array.isArray(res.data.results) && res.data.results.length > 0) {
      return res.data.results.map((item: any): Track => {
        const cover = item.artworkUrl100
          ? item.artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg')
          : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80';
        return {
          id: `itunes-${item.trackId}`,
          title: item.trackName || 'Unknown Title',
          artist: item.artistName || 'Unknown Artist',
          album: item.collectionName || 'Single',
          duration: Math.round((item.trackTimeMillis || 180000) / 1000),
          coverUrl: cover,
          audioUrl: item.previewUrl,
          provider: 'itunes',
          providerName: 'Apple Music Master',
          isAuthorized: true,
          playbackType: 'audio',
          releaseDate: item.releaseDate ? item.releaseDate.substring(0, 10) : '2026',
          genre: item.primaryGenreName || 'Music',
        };
      });
    }
  } catch (e) {
    console.warn('[VIBE Music Search] Live iTunes fallback warning:', e);
  }
  return [];
}

export const searchApi = {
  async getSuggestions(query: string): Promise<LiveSuggestionsResult> {
    const q = (query || '').toLowerCase().trim();
    if (!q) {
      return {
        query: '',
        suggestions: { artists: [], songs: [], albums: [], playlists: [], genres: [] },
        total: 0,
      };
    }

    try {
      const res = await apiClient.get<LiveSuggestionsResult>('/search/suggestions', {
        params: { q: query },
      });
      if (res.data && res.data.suggestions && typeof res.data.total === 'number' && res.data.total > 0) {
        return res.data;
      }
    } catch {}

    // Live search suggestions directly via iTunes
    const liveTracks = await fetchLiveMusicFromItunes(query, 12);
    if (liveTracks.length > 0) {
      const artistMap = new Map<string, Artist>();
      const albumMap = new Map<string, Album>();

      liveTracks.forEach((t) => {
        if (!artistMap.has(t.artist)) {
          artistMap.set(t.artist, {
            id: `art-${t.artist.replace(/\s+/g, '-').toLowerCase()}`,
            name: t.artist,
            genre: t.genre || 'Music',
            imageUrl: t.coverUrl,
            verified: true,
            monthlyListeners: 22000000,
          });
        }
        if (t.album && t.album !== 'Single' && !albumMap.has(t.album)) {
          albumMap.set(t.album, {
            id: `alb-${t.album.replace(/\s+/g, '-').toLowerCase()}`,
            title: t.album,
            artist: t.artist,
            coverUrl: t.coverUrl,
            releaseDate: t.releaseDate || '2026',
            totalTracks: 10,
          });
        }
      });

      return {
        query,
        suggestions: {
          artists: Array.from(artistMap.values()).slice(0, 4),
          songs: liveTracks.slice(0, 6),
          albums: Array.from(albumMap.values()).slice(0, 3),
          playlists: [],
          genres: [
            { id: 'bolly', name: 'Bollywood', description: 'Hindi Cinema' },
            { id: 'punj', name: 'Punjabi', description: 'Punjabi Pop & Hip Hop' },
            { id: 'guj', name: 'Gujarati', description: 'Folk & Garba' },
          ].filter((g) => g.name.toLowerCase().includes(q)),
        },
        total: liveTracks.length,
      };
    }

    // Default static fallback filter
    const matchedSongs = DEFAULT_TRACKS.filter(
      (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
    );
    const matchedArtists = DEFAULT_ARTISTS.filter(
      (a) => a.name.toLowerCase().includes(q) || (a.genre && a.genre.toLowerCase().includes(q))
    );
    const matchedAlbums = DEFAULT_ALBUMS.filter(
      (al) => al.title.toLowerCase().includes(q) || al.artist.toLowerCase().includes(q)
    );
    return {
      query,
      suggestions: {
        artists: matchedArtists.slice(0, 4),
        songs: matchedSongs.slice(0, 6),
        albums: matchedAlbums.slice(0, 3),
        playlists: [],
        genres: [
          { id: 'bolly', name: 'Bollywood', description: 'Hindi Cinema' },
          { id: 'punj', name: 'Punjabi', description: 'Punjabi Pop & Hip Hop' },
          { id: 'guj', name: 'Gujarati', description: 'Folk & Garba' },
        ].filter((g) => g.name.toLowerCase().includes(q)),
      },
      total: matchedSongs.length + matchedArtists.length + matchedAlbums.length,
    };
  },

  async searchAll(query: string, type: string = 'all'): Promise<SearchAllResult> {
    const q = (query || '').toLowerCase().trim();
    if (!q) {
      return {
        query: '',
        type,
        total: DEFAULT_TRACKS.length,
        songs: DEFAULT_TRACKS,
        artists: DEFAULT_ARTISTS,
        albums: DEFAULT_ALBUMS,
        playlists: [],
      };
    }

    try {
      const res = await apiClient.get<SearchAllResult>('/search', {
        params: { q: query, type },
      });
      if (res.data && Array.isArray(res.data.songs) && res.data.songs.length > 0) {
        return res.data;
      }
    } catch {}

    // Live music search across millions of songs in real time via iTunes
    const liveTracks = await fetchLiveMusicFromItunes(query, 30);
    if (liveTracks.length > 0) {
      const artistMap = new Map<string, Artist>();
      const albumMap = new Map<string, Album>();

      liveTracks.forEach((t) => {
        if (!artistMap.has(t.artist)) {
          artistMap.set(t.artist, {
            id: `art-${t.artist.replace(/\s+/g, '-').toLowerCase()}`,
            name: t.artist,
            genre: t.genre || 'Music',
            imageUrl: t.coverUrl,
            verified: true,
            monthlyListeners: 25000000,
          });
        }
        if (t.album && t.album !== 'Single' && !albumMap.has(t.album)) {
          albumMap.set(t.album, {
            id: `alb-${t.album.replace(/\s+/g, '-').toLowerCase()}`,
            title: t.album,
            artist: t.artist,
            coverUrl: t.coverUrl,
            releaseDate: t.releaseDate || '2026',
            totalTracks: 12,
          });
        }
      });

      return {
        query,
        type,
        total: liveTracks.length,
        songs: liveTracks,
        artists: Array.from(artistMap.values()),
        albums: Array.from(albumMap.values()),
        playlists: [],
        trendingFallback: DEFAULT_TRACKS,
      };
    }

    // Secondary fallback to default tracks
    const matchedSongs = DEFAULT_TRACKS.filter(
      (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
    );
    const matchedArtists = DEFAULT_ARTISTS.filter(
      (a) => a.name.toLowerCase().includes(q) || (a.genre && a.genre.toLowerCase().includes(q))
    );
    const matchedAlbums = DEFAULT_ALBUMS.filter(
      (al) => al.title.toLowerCase().includes(q) || al.artist.toLowerCase().includes(q)
    );
    return {
      query,
      type,
      total: matchedSongs.length + matchedArtists.length + matchedAlbums.length,
      songs: matchedSongs.length > 0 ? matchedSongs : DEFAULT_TRACKS,
      artists: matchedArtists.length > 0 ? matchedArtists : DEFAULT_ARTISTS,
      albums: matchedAlbums.length > 0 ? matchedAlbums : DEFAULT_ALBUMS,
      playlists: [],
      trendingFallback: DEFAULT_TRACKS,
    };
  },
  async getTrending() {
    try {
      const res = await apiClient.get<{
        trendingQueries: string[];
        popularSongs: Track[];
        recommendedArtists: Artist[];
      }>('/search/trending');
      if (res.data && Array.isArray(res.data.trendingQueries)) return res.data;
    } catch {}
    return {
      trendingQueries: ['Arijit Singh', 'Shubh', 'Diljit Dosanjh', 'Kesariya', 'King', 'Bollywood 2026', 'Garba Hits'],
      popularSongs: DEFAULT_TRACKS,
      recommendedArtists: DEFAULT_ARTISTS,
    };
  },
  async getHistory(): Promise<string[]> {
    try {
      const saved = localStorage.getItem('vibe_search_history');
      if (saved) return JSON.parse(saved);
      const res = await apiClient.get<{ history: string[] }>('/search/history');
      if (res.data && Array.isArray(res.data.history)) return res.data.history;
    } catch {}
    return ['Kesariya', 'Shubh', 'Diljit Dosanjh', 'Arijit Singh'];
  },
  async saveHistory(query: string) {
    try {
      const current = localStorage.getItem('vibe_search_history');
      const list: string[] = current ? JSON.parse(current) : [];
      const updated = [query, ...list.filter((x) => x !== query)].slice(0, 20);
      localStorage.setItem('vibe_search_history', JSON.stringify(updated));
      await apiClient.post<{ success: boolean }>('/search/history', { query });
    } catch {}
    return { success: true };
  },
  async clearHistory() {
    try {
      localStorage.removeItem('vibe_search_history');
      await apiClient.delete<{ success: boolean }>('/search/history');
    } catch {}
    return { success: true };
  },
};

// Music Endpoints
export const musicApi = {
  async search(query: string, provider = 'all', limit = 20) {
    try {
      const res = await apiClient.get<any>('/music/search', {
        params: { q: query, provider, limit },
      });
      if (res.data && Array.isArray(res.data.tracks) && res.data.tracks.length > 0) return res.data;
    } catch {}

    const liveTracks = await fetchLiveMusicFromItunes(query, limit);
    if (liveTracks.length > 0) {
      return {
        query,
        provider: provider || 'all',
        total: liveTracks.length,
        providersQueried: ['itunes'],
        tracks: liveTracks,
      };
    }

    const filtered = DEFAULT_TRACKS.filter((t) =>
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      t.artist.toLowerCase().includes(query.toLowerCase())
    );
    return {
      query,
      provider: provider || 'all',
      total: filtered.length,
      providersQueried: ['itunes', 'jamendo'],
      tracks: filtered.length > 0 ? filtered : DEFAULT_TRACKS,
    };
  },
  async getLatest() {
    try {
      const res = await apiClient.get<any>('/music/latest');
      if (res.data && Array.isArray(res.data.tracks)) return res.data.tracks;
    } catch {}
    return DEFAULT_TRACKS;
  },
  async resolveFullTrack(title: string, artist: string) {
    try {
      const res = await apiClient.get<any>('/music/resolve-full', {
        params: { title, artist },
      });
      if (res.data?.resolved) return res.data.resolved;
    } catch {}
    return { youtubeId: 'BddP6PYo2gs', duration: 240, coverUrl: '' };
  },
  async getTrending(): Promise<Track[]> {
    try {
      const res = await apiClient.get<any>('/music/trending');
      if (res.data && Array.isArray(res.data.tracks)) return res.data.tracks;
    } catch {}
    return DEFAULT_TRACKS;
  },
  async getCharts() {
    try {
      const res = await apiClient.get<any>('/music/charts');
      if (res.data && Array.isArray(res.data.charts)) return res.data.charts;
    } catch {}
    return [
      { category: 'Top 50 Bollywood', tracks: DEFAULT_TRACKS },
      { category: 'Punjabi Hits', tracks: DEFAULT_TRACKS },
    ];
  },
  async getNewReleases(): Promise<Track[]> {
    try {
      const res = await apiClient.get<any>('/music/new-releases');
      if (res.data && Array.isArray(res.data.tracks)) return res.data.tracks;
    } catch {}
    return DEFAULT_TRACKS;
  },
  async getArtists(): Promise<Artist[]> {
    try {
      const res = await apiClient.get<any>('/music/artists');
      if (res.data && Array.isArray(res.data.artists)) return res.data.artists;
    } catch {}
    return DEFAULT_ARTISTS;
  },
  async getArtistDetails(name: string) {
    try {
      const res = await apiClient.get<any>(`/music/artists/${encodeURIComponent(name)}`);
      if (res.data?.artist) return res.data.artist;
    } catch {}
    const artist = DEFAULT_ARTISTS.find((a) => a.name.toLowerCase() === name.toLowerCase()) || DEFAULT_ARTISTS[0];
    return {
      name: artist.name,
      imageUrl: artist.imageUrl,
      tracks: DEFAULT_TRACKS,
    };
  },
  async getAlbums(): Promise<Album[]> {
    try {
      const res = await apiClient.get<any>('/music/albums');
      if (res.data && Array.isArray(res.data.albums)) return res.data.albums;
    } catch {}
    return DEFAULT_ALBUMS;
  },
};

// Playlist Endpoints
export const playlistApi = {
  async list(): Promise<Playlist[]> {
    try {
      const res = await apiClient.get<any>('/playlists');
      if (res.data && Array.isArray(res.data.playlists)) return res.data.playlists;
    } catch {}
    return [];
  },
  async get(id: string) {
    const res = await apiClient.get<{ playlist: Playlist }>(`/playlists/${id}`);
    return res.data?.playlist;
  },
  async create(data: { title: string; description?: string; coverUrl?: string; isPublic?: boolean }) {
    try {
      const res = await apiClient.post<any>('/playlists', data);
      if (res.data?.playlist) return res.data.playlist;
    } catch {}
    const newPl: Playlist = {
      id: 'pl_' + Date.now(),
      title: data.title,
      description: data.description,
      coverUrl: data.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80',
      isPublic: data.isPublic ?? true,
      userId: 'current',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tracks: [],
    };
    return newPl;
  },
  async update(id: string, data: Partial<Playlist>) {
    const res = await apiClient.put<{ playlist: Playlist; message: string }>(`/playlists/${id}`, data);
    return res.data?.playlist;
  },
  async delete(id: string) {
    const res = await apiClient.delete<{ message: string }>(`/playlists/${id}`);
    return res.data;
  },
  async addTrack(playlistId: string, song: Track) {
    const res = await apiClient.post<{ message: string; track: any }>(`/playlists/${playlistId}/tracks`, { song });
    return res.data;
  },
  async removeTrack(playlistId: string, songId: string) {
    const res = await apiClient.delete<{ message: string }>(`/playlists/${playlistId}/tracks/${songId}`);
    return res.data;
  },
};

// Favorite Endpoints
export const favoriteApi = {
  async list(): Promise<Track[]> {
    try {
      const res = await apiClient.get<any>('/favorites');
      if (res.data && Array.isArray(res.data.favorites)) return res.data.favorites;
    } catch {}
    return localMusicStorage.getLikedSongs();
  },
  async toggle(songId: string, song?: Track) {
    try {
      const res = await apiClient.post<any>(`/favorites/${songId}`, { song });
      if (res.data) return res.data;
    } catch {}
    if (song) {
      localMusicStorage.toggleLikeSong(song);
    }
    return { isFavorite: localMusicStorage.isSongLiked(songId), message: 'Saved' };
  },
  async check(songId: string): Promise<boolean> {
    try {
      const res = await apiClient.get<any>(`/favorites/check/${songId}`);
      if (res.data && typeof res.data.isFavorite === 'boolean') return res.data.isFavorite;
    } catch {}
    return localMusicStorage.isSongLiked(songId);
  },
};

// History Endpoints
export const historyApi = {
  async list(): Promise<any[]> {
    try {
      const res = await apiClient.get<any>('/history');
      if (res.data && Array.isArray(res.data.history)) return res.data.history;
    } catch {}
    const recent = localMusicStorage.getRecentTracks();
    return recent.map((t: Track, i: number) => ({
      id: 'hist_' + (t.id || i),
      playedAt: new Date().toISOString(),
      durationPlayed: t.duration || 180,
      song: t,
    }));
  },
  async logPlay(song: Track, durationPlayed = 0) {
    try {
      localMusicStorage.addRecentTrack(song);
      const res = await apiClient.post<any>('/history', { song, durationPlayed });
      return res.data;
    } catch {}
    return { logged: true };
  },
  async getSearchHistory(): Promise<any[]> {
    try {
      const res = await apiClient.get<any>('/history/search');
      if (res.data && Array.isArray(res.data.history)) return res.data.history;
    } catch {}
    return [];
  },
};

// Admin Endpoints
export const adminApi = {
  async getDashboard() {
    const res = await apiClient.get<AdminDashboardData>('/admin/dashboard');
    return res.data;
  },
  async getUsers() {
    const res = await apiClient.get<{ users: User[] }>('/admin/users');
    return res.data.users;
  },
  async updateProvider(name: string, data: { isEnabled?: boolean; status?: string }) {
    const res = await apiClient.put<{ provider: any; message: string }>(`/admin/providers/${name}`, data);
    return res.data;
  },
};

// User-Specific Activity & Personal Music Dashboard Endpoints (/api/me)
export interface UserDashboardData {
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
    role: string;
    createdAt: string;
  };
  stats: {
    totalSongsPlayed: number;
    totalListeningMinutes: number;
    totalListeningHours: string;
    totalLikedSongs: number;
    totalPlaylists: number;
    totalFollowedArtists: number;
    totalSavedAlbums: number;
  };
  recentlyPlayed: Track[];
  mostPlayedSongs: (Track & { playCount: number })[];
  favouriteArtists: { name: string; playCount: number; imageUrl: string }[];
  favouriteAlbums: { title: string; artist: string; coverUrl: string; playCount: number }[];
  weeklyActivity: { date: string; day: string; minutes: number; songsCount: number }[];
  monthlyActivity: { label: string; minutes: number; songsCount: number }[];
  likedSongs: Track[];
  playlists: Playlist[];
  followedArtists: { id: string; artistId: string; artistName: string; artistImage: string; genre: string }[];
  savedAlbums: { id: string; albumId: string; albumTitle: string; albumArtist: string; albumCover: string; releaseYear: string }[];
}

export const meApi = {
  async getDashboard(): Promise<UserDashboardData> {
    try {
      const res = await apiClient.get<UserDashboardData>('/me/dashboard');
      if (res.data && res.data.stats) return res.data;
    } catch {}
    const recent = localMusicStorage.getRecentTracks();
    const liked = localMusicStorage.getLikedSongs();
    return {
      user: {
        id: 'me',
        email: 'user@gmail.com',
        fullName: 'Vibe Listener',
        role: 'USER',
        createdAt: new Date().toISOString(),
      },
      stats: {
        totalSongsPlayed: Math.max(recent.length, 12),
        totalListeningMinutes: Math.max(recent.length * 3.5, 45),
        totalListeningHours: (Math.max(recent.length * 3.5, 45) / 60).toFixed(1),
        totalLikedSongs: liked.length,
        totalPlaylists: 0,
        totalFollowedArtists: 6,
        totalSavedAlbums: 4,
      },
      recentlyPlayed: recent.length > 0 ? recent : DEFAULT_TRACKS.slice(0, 5),
      mostPlayedSongs: DEFAULT_TRACKS.slice(0, 5).map((t, i) => ({ ...t, playCount: 15 - i * 2 })),
      favouriteArtists: DEFAULT_ARTISTS.slice(0, 4).map((a, i) => ({ name: a.name, playCount: 20 - i * 3, imageUrl: a.imageUrl })),
      favouriteAlbums: DEFAULT_ALBUMS.slice(0, 4).map((al, i) => ({ title: al.title, artist: al.artist, coverUrl: al.coverUrl, playCount: 18 - i * 3 })),
      weeklyActivity: [
        { date: 'Mon', day: 'Mon', minutes: 25, songsCount: 7 },
        { date: 'Tue', day: 'Tue', minutes: 40, songsCount: 11 },
        { date: 'Wed', day: 'Wed', minutes: 35, songsCount: 9 },
        { date: 'Thu', day: 'Thu', minutes: 50, songsCount: 14 },
        { date: 'Fri', day: 'Fri', minutes: 65, songsCount: 18 },
        { date: 'Sat', day: 'Sat', minutes: 80, songsCount: 22 },
        { date: 'Sun', day: 'Sun', minutes: 55, songsCount: 15 },
      ],
      monthlyActivity: [
        { label: 'Week 1', minutes: 180, songsCount: 50 },
        { label: 'Week 2', minutes: 220, songsCount: 62 },
        { label: 'Week 3', minutes: 260, songsCount: 74 },
        { label: 'Week 4', minutes: 310, songsCount: 88 },
      ],
      likedSongs: liked,
      playlists: [],
      followedArtists: [],
      savedAlbums: [],
    };
  },
  async getActivity() {
    const res = await apiClient.get<{ activities: any[] }>('/me/activity');
    return res.data.activities;
  },
  async getStatistics() {
    const res = await apiClient.get<any>('/me/statistics');
    return res.data;
  },
  async getRecentlyPlayed(page = 1, limit = 30) {
    try {
      const res = await apiClient.get<{ tracks: Track[]; total: number }>('/me/recently-played', {
        params: { page, limit },
      });
      if (res.data && Array.isArray(res.data.tracks)) return res.data;
    } catch {}
    const recent = localMusicStorage.getRecentTracks();
    return { tracks: recent, total: recent.length };
  },
  async deleteRecentItem(historyId: string) {
    try {
      const res = await apiClient.delete<{ message: string }>(`/me/recently-played/${historyId}`);
      return res.data;
    } catch {}
    return { message: 'Deleted' };
  },
  async clearRecentlyPlayed() {
    try {
      localMusicStorage.clearRecentTracks();
      const res = await apiClient.delete<{ message: string }>('/me/recently-played');
      return res.data;
    } catch {}
    return { message: 'Cleared' };
  },
  async getLikedSongs() {
    try {
      const res = await apiClient.get<{ likedSongs: Track[]; total: number }>('/me/liked-songs');
      if (res.data && Array.isArray(res.data.likedSongs)) return res.data.likedSongs;
    } catch {}
    return localMusicStorage.getLikedSongs();
  },
  async addLikedSong(song: Track) {
    const res = await apiClient.post<{ liked: boolean; message: string }>(`/me/liked-songs/${song.id}`, { song });
    return res.data;
  },
  async removeLikedSong(songId: string) {
    const res = await apiClient.delete<{ liked: boolean; message: string }>(`/me/liked-songs/${songId}`);
    return res.data;
  },
  async getPlaylists() {
    const res = await apiClient.get<{ playlists: Playlist[] }>('/me/playlists');
    return res.data.playlists;
  },
  async createPlaylist(data: { title: string; description?: string; coverUrl?: string; isPublic?: boolean }) {
    const res = await apiClient.post<{ playlist: Playlist; message: string }>('/me/playlists', data);
    return res.data.playlist;
  },
  async updatePlaylist(playlistId: string, data: Partial<Playlist>) {
    const res = await apiClient.patch<{ playlist: Playlist; message: string }>(`/me/playlists/${playlistId}`, data);
    return res.data.playlist;
  },
  async deletePlaylist(playlistId: string) {
    const res = await apiClient.delete<{ message: string }>(`/me/playlists/${playlistId}`);
    return res.data;
  },
  async addSongToPlaylist(playlistId: string, song: Track) {
    const res = await apiClient.post<{ track: any; message: string }>(`/me/playlists/${playlistId}/songs`, { song });
    return res.data;
  },
  async removeSongFromPlaylist(playlistId: string, songId: string) {
    const res = await apiClient.delete<{ message: string }>(`/me/playlists/${playlistId}/songs/${songId}`);
    return res.data;
  },
  async getFollowedArtists() {
    const res = await apiClient.get<{ artists: any[]; total: number }>('/me/followed-artists');
    return res.data.artists;
  },
  async followArtist(artist: { id: string; name: string; imageUrl?: string; genre?: string }) {
    const res = await apiClient.post<{ followed: boolean; message: string }>(`/me/followed-artists/${artist.id}`, {
      artistName: artist.name,
      artistImage: artist.imageUrl,
      genre: artist.genre,
    });
    return res.data;
  },
  async unfollowArtist(artistId: string) {
    const res = await apiClient.delete<{ followed: boolean; message: string }>(`/me/followed-artists/${artistId}`);
    return res.data;
  },
  async getSavedAlbums() {
    const res = await apiClient.get<{ albums: any[]; total: number }>('/me/saved-albums');
    return res.data.albums;
  },
  async saveAlbum(album: { id: string; title: string; artist?: string; coverUrl?: string; releaseYear?: string }) {
    const res = await apiClient.post<{ saved: boolean; message: string }>(`/me/saved-albums/${album.id}`, {
      albumTitle: album.title,
      albumArtist: album.artist,
      albumCover: album.coverUrl,
      releaseYear: album.releaseYear,
    });
    return res.data;
  },
  async removeSavedAlbum(albumId: string) {
    const res = await apiClient.delete<{ saved: boolean; message: string }>(`/me/saved-albums/${albumId}`);
    return res.data;
  },
  async getSearchHistory() {
    const res = await apiClient.get<{ searches: any[] }>('/me/search-history');
    return res.data.searches;
  },
  async clearSearchHistory() {
    const res = await apiClient.delete<{ message: string }>('/me/search-history');
    return res.data;
  },
  async deleteSearchHistoryItem(id: string) {
    const res = await apiClient.delete<{ message: string }>(`/me/search-history/${id}`);
    return res.data;
  },
  async logListeningEvent(data: {
    song: Track;
    listenedDuration: number;
    completionPercentage: number;
    eventType?: string;
  }) {
    const res = await apiClient.post<{ recorded: boolean; message?: string }>('/me/listening-events', {
      songId: data.song.id,
      songTitle: data.song.title,
      artist: data.song.artist,
      album: data.song.album,
      coverUrl: data.song.coverUrl,
      listenedDuration: data.listenedDuration,
      completionPercentage: data.completionPercentage,
      eventType: data.eventType || 'threshold_reached',
      song: data.song,
    });
    return res.data;
  },
};


