export type MusicProviderType = 'jamendo' | 'youtube' | 'spotify' | 'itunes';

export type PlaybackType = 'audio' | 'youtube' | 'preview' | 'external';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  coverUrl: string;
  audioUrl?: string; // Direct audio stream or 30-sec preview
  youtubeId?: string; // YouTube Video ID for IFrame player
  spotifyUrl?: string;
  provider: MusicProviderType;
  providerName: string;
  isAuthorized: boolean;
  playbackType: PlaybackType;
  popularity?: number;
  genre?: string;
  releaseDate?: string;
}

export interface PlaylistTrack {
  id: string;
  playlistId: string;
  songId: string;
  orderIndex: number;
  addedAt: string;
  song?: Track;
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  coverUrl?: string;
  isPublic: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  tracks?: PlaylistTrack[];
}

export interface User {
  id: string;
  email: string;
  username: string;
  fullName?: string;
  mobileNumber?: string | null;
  role: 'USER' | 'ADMIN';
  avatarUrl?: string | null;
  emailVerified?: boolean;
  googleId?: string | null;
}

export interface UserProfile {
  id: string;
  userId: string;
  bio?: string;
  location?: string;
  favoriteGenres?: string;
  website?: string;
}

export interface UserSettings {
  theme: string;
  audioQuality: string;
  volume: number;
  autoplay: boolean;
  notificationsEnabled: boolean;
}

export interface Artist {
  id: string;
  name: string;
  genre?: string;
  imageUrl: string;
  verified?: boolean;
  monthlyListeners?: number;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  releaseDate: string;
  totalTracks: number;
}

export interface AdminDashboardData {
  stats: {
    totalUsers: number;
    totalPlaylists: number;
    totalIndexedTracks: number;
    totalPlays: number;
  };
  providers: {
    id: string;
    name: string;
    isEnabled: boolean;
    apiEndpoint: string;
    authType: string;
    status: string;
    totalRequests: number;
    lastChecked: string;
    configured: string;
  }[];
  database: {
    status: string;
    engine: string;
    connected: boolean;
    timestamp: string;
  };
  system: {
    nodeVersion: string;
    uptimeSeconds: number;
    memoryUsageMB: number;
    environment: string;
    port: number;
  };
  recentUsers: User[];
}

