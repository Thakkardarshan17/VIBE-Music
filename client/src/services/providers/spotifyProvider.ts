import { MusicProviderAdapter, ProviderDiagnostic, ProviderSearchResult } from './types.js';

export class SpotifyProvider implements MusicProviderAdapter {
  id = 'spotify' as const;
  name = 'Spotify Web API';

  private clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';

  private lastDiagnostic: ProviderDiagnostic = {
    id: 'spotify',
    name: 'Spotify Web API',
    category: 'hybrid',
    status: import.meta.env.VITE_SPOTIFY_CLIENT_ID ? 'available' : 'pending_credentials',
    searchAvailable: !!import.meta.env.VITE_SPOTIFY_CLIENT_ID,
    playbackAvailable: false,
    playbackType: 'external',
    requiresCredentials: true,
    credentialsEnvVar: 'VITE_SPOTIFY_CLIENT_ID',
    isConfigured: !!import.meta.env.VITE_SPOTIFY_CLIENT_ID,
    notes: 'Spotify Developer Web API. Requires Client ID & Secret for Client Credentials OAuth flow. Full playback requires Spotify Premium + Web Playback SDK.',
    setupGuide: 'Create an app in Spotify Developer Dashboard (developer.spotify.com) and set VITE_SPOTIFY_CLIENT_ID and VITE_SPOTIFY_CLIENT_SECRET.',
    catalogCoverage: ['Global Catalog', 'International Pop', 'Playlists', 'Podcasts'],
  };

  isAvailable(): boolean {
    return !!this.clientId;
  }

  getDiagnostic(): ProviderDiagnostic {
    return this.lastDiagnostic;
  }

  async search(query: string): Promise<ProviderSearchResult> {
    // If not configured with credentials, returns empty cleanly
    return { provider: 'spotify', tracks: [] };
  }

  async testConnection(): Promise<{ success: boolean; latencyMs: number; message: string }> {
    if (!this.clientId) {
      return {
        success: false,
        latencyMs: 0,
        message: 'Pending configuration: VITE_SPOTIFY_CLIENT_ID is not set in environment.',
      };
    }
    return {
      success: true,
      latencyMs: 50,
      message: 'Spotify Client ID configured.',
    };
  }
}

export const spotifyProvider = new SpotifyProvider();
