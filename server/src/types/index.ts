export type MusicProviderType = 'jamendo' | 'youtube' | 'spotify' | 'itunes';

export type PlaybackType = 'audio' | 'youtube' | 'preview' | 'external';

export interface NormalizedTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  coverUrl: string;
  audioUrl?: string; // Direct MP3/AAC audio stream
  youtubeId?: string; // YouTube Video ID for iframe player
  spotifyUrl?: string; // Spotify open URL
  provider: MusicProviderType;
  providerName: string;
  isAuthorized: boolean;
  playbackType: PlaybackType;
  popularity?: number;
  genre?: string;
  releaseDate?: string;
}

export interface UserPayload {
  id: string;
  email: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  createdAt?: string;
  role: 'USER' | 'ADMIN';
  sessionId?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    username: string;
    role: 'USER' | 'ADMIN';
    avatarUrl?: string | null;
  };
}

