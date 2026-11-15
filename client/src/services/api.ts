import axios from 'axios';
import { Track, Playlist, User, UserProfile, UserSettings, Artist, Album, AdminDashboardData } from '../types/music.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

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

export const searchApi = {
  async getSuggestions(query: string) {
    const res = await apiClient.get<LiveSuggestionsResult>('/search/suggestions', {
      params: { q: query },
    });
    return res.data;
  },
  async searchAll(query: string, type: string = 'all') {
    const res = await apiClient.get<SearchAllResult>('/search', {
      params: { q: query, type },
    });
    return res.data;
  },
  async getTrending() {
    const res = await apiClient.get<{
      trendingQueries: string[];
      popularSongs: Track[];
      recommendedArtists: Artist[];
    }>('/search/trending');
    return res.data;
  },
  async getHistory() {
    const res = await apiClient.get<{ history: string[] }>('/search/history');
    return res.data.history;
  },
  async saveHistory(query: string) {
    const res = await apiClient.post<{ success: boolean }>('/search/history', { query });
    return res.data;
  },
  async clearHistory() {
    const res = await apiClient.delete<{ success: boolean }>('/search/history');
    return res.data;
  },
};

// Music Endpoints
export const musicApi = {
  async search(query: string, provider = 'all', limit = 20) {
    const res = await apiClient.get<{
      query: string;
      provider: string;
      total: number;
      providersQueried: string[];
      tracks: Track[];
    }>('/music/search', {
      params: { q: query, provider, limit },
    });
    return res.data;
  },
  async getLatest() {
    const res = await apiClient.get<{ tracks: Track[]; total: number }>('/music/latest');
    return res.data.tracks;
  },
  async resolveFullTrack(title: string, artist: string) {
    const res = await apiClient.get<{
      resolved: { youtubeId: string; duration: number; coverUrl: string };
      success: boolean;
    }>('/music/resolve-full', {
      params: { title, artist },
    });
    return res.data.resolved;
  },
  async getTrending() {
    const res = await apiClient.get<{ tracks: Track[]; total: number }>('/music/trending');
    return res.data.tracks;
  },
  async getCharts() {
    const res = await apiClient.get<{ charts: { category: string; tracks: Track[] }[] }>('/music/charts');
    return res.data.charts;
  },
  async getNewReleases() {
    const res = await apiClient.get<{ tracks: Track[]; total: number }>('/music/new-releases');
    return res.data.tracks;
  },
  async getArtists() {
    const res = await apiClient.get<{ artists: Artist[] }>('/music/artists');
    return res.data.artists;
  },
  async getArtistDetails(name: string) {
    const res = await apiClient.get<{ artist: { name: string; imageUrl: string; tracks: Track[] } }>(`/music/artists/${encodeURIComponent(name)}`);
    return res.data.artist;
  },
  async getAlbums() {
    const res = await apiClient.get<{ albums: Album[] }>('/music/albums');
    return res.data.albums;
  },
};

// Playlist Endpoints
export const playlistApi = {
  async list() {
    const res = await apiClient.get<{ playlists: Playlist[] }>('/playlists');
    return res.data.playlists;
  },
  async get(id: string) {
    const res = await apiClient.get<{ playlist: Playlist }>(`/playlists/${id}`);
    return res.data.playlist;
  },
  async create(data: { title: string; description?: string; coverUrl?: string; isPublic?: boolean }) {
    const res = await apiClient.post<{ playlist: Playlist; message: string }>('/playlists', data);
    return res.data.playlist;
  },
  async update(id: string, data: Partial<Playlist>) {
    const res = await apiClient.put<{ playlist: Playlist; message: string }>(`/playlists/${id}`, data);
    return res.data.playlist;
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
  async list() {
    const res = await apiClient.get<{ favorites: Track[]; total: number }>('/favorites');
    return res.data.favorites;
  },
  async toggle(songId: string, song?: Track) {
    const res = await apiClient.post<{ isFavorite: boolean; message: string }>(`/favorites/${songId}`, { song });
    return res.data;
  },
  async check(songId: string) {
    const res = await apiClient.get<{ isFavorite: boolean }>(`/favorites/check/${songId}`);
    return res.data.isFavorite;
  },
};

// History Endpoints
export const historyApi = {
  async list() {
    const res = await apiClient.get<{ history: { id: string; playedAt: string; durationPlayed: number; song: Track }[] }>('/history');
    return res.data.history;
  },
  async logPlay(song: Track, durationPlayed = 0) {
    const res = await apiClient.post<{ logged: boolean }>('/history', { song, durationPlayed });
    return res.data;
  },
  async getSearchHistory() {
    const res = await apiClient.get<{ history: { query: string; provider: string; searchedAt: string; resultCount: number }[] }>('/history/search');
    return res.data.history;
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
  async getDashboard() {
    const res = await apiClient.get<UserDashboardData>('/me/dashboard');
    return res.data;
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
    const res = await apiClient.get<{ tracks: Track[]; total: number }>('/me/recently-played', {
      params: { page, limit },
    });
    return res.data;
  },
  async deleteRecentItem(historyId: string) {
    const res = await apiClient.delete<{ message: string }>(`/me/recently-played/${historyId}`);
    return res.data;
  },
  async clearRecentlyPlayed() {
    const res = await apiClient.delete<{ message: string }>('/me/recently-played');
    return res.data;
  },
  async getLikedSongs() {
    const res = await apiClient.get<{ likedSongs: Track[]; total: number }>('/me/liked-songs');
    return res.data.likedSongs;
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


