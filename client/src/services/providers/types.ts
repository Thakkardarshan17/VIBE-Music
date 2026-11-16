import { Track, Artist, Album, Playlist, MusicProviderType } from '../../types/music.js';

export type ProviderConnectionStatus =
  | 'connected'
  | 'available'
  | 'pending_credentials'
  | 'restricted'
  | 'error';

export interface ProviderDiagnostic {
  id: MusicProviderType;
  name: string;
  category: 'audio' | 'video' | 'hybrid';
  status: ProviderConnectionStatus;
  searchAvailable: boolean;
  playbackAvailable: boolean;
  playbackType: 'audio' | 'youtube' | 'preview' | 'external';
  requiresCredentials: boolean;
  credentialsEnvVar?: string;
  isConfigured: boolean;
  lastChecked?: number;
  lastResponseTimeMs?: number;
  lastError?: string;
  notes: string;
  setupGuide?: string;
  catalogCoverage: string[];
}

export interface ProviderSearchResult {
  provider: MusicProviderType;
  tracks: Track[];
  artists?: Artist[];
  albums?: Album[];
  playlists?: Playlist[];
}

export interface UnifiedSearchResults {
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
  videos: Track[];
  liveMusic: Track[];
  providerStats: {
    provider: MusicProviderType;
    count: number;
    success: boolean;
    durationMs: number;
  }[];
}

export interface MusicProviderAdapter {
  id: MusicProviderType;
  name: string;
  isAvailable(): boolean;
  getDiagnostic(): ProviderDiagnostic;
  search(query: string, limit?: number): Promise<ProviderSearchResult>;
  getTrending?(limit?: number): Promise<Track[]>;
  getLatestReleases?(limit?: number): Promise<Track[]>;
  testConnection(): Promise<{ success: boolean; latencyMs: number; message: string }>;
}
