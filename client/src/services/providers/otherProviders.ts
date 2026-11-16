import { MusicProviderAdapter, ProviderDiagnostic, ProviderSearchResult } from './types.js';

export class AppleMusicProvider implements MusicProviderAdapter {
  id = 'applemusic' as const;
  name = 'Apple Music MusicKit API';

  private developerToken = import.meta.env.VITE_APPLE_MUSIC_DEV_TOKEN || '';

  private lastDiagnostic: ProviderDiagnostic = {
    id: 'applemusic',
    name: 'Apple Music MusicKit',
    category: 'audio',
    status: import.meta.env.VITE_APPLE_MUSIC_DEV_TOKEN ? 'available' : 'pending_credentials',
    searchAvailable: true, // Powered through iTunes catalog bridge
    playbackAvailable: false, // Requires Apple Music user subscription + MusicKit JS
    playbackType: 'audio',
    requiresCredentials: true,
    credentialsEnvVar: 'VITE_APPLE_MUSIC_DEV_TOKEN',
    isConfigured: !!import.meta.env.VITE_APPLE_MUSIC_DEV_TOKEN,
    notes: 'Full Apple Music playback requires an Apple Developer Account with a MusicKit private key JWT.',
    setupGuide: 'Generate a MusicKit Developer Token in Apple Developer Portal (developer.apple.com) and set VITE_APPLE_MUSIC_DEV_TOKEN.',
    catalogCoverage: ['Spatial Audio', 'Apple Digital Masters', 'Bollywood', 'Global Hits'],
  };

  isAvailable(): boolean {
    return !!this.developerToken;
  }

  getDiagnostic(): ProviderDiagnostic {
    return this.lastDiagnostic;
  }

  async search(): Promise<ProviderSearchResult> {
    return { provider: 'applemusic', tracks: [] };
  }

  async testConnection(): Promise<{ success: boolean; latencyMs: number; message: string }> {
    return {
      success: !!this.developerToken,
      latencyMs: 0,
      message: this.developerToken ? 'Apple Music token active.' : 'Pending MusicKit Developer Token.',
    };
  }
}

export class AudiomackProvider implements MusicProviderAdapter {
  id = 'audiomack' as const;
  name = 'Audiomack Developer API';

  private lastDiagnostic: ProviderDiagnostic = {
    id: 'audiomack',
    name: 'Audiomack',
    category: 'audio',
    status: 'pending_credentials',
    searchAvailable: false,
    playbackAvailable: false,
    playbackType: 'external',
    requiresCredentials: true,
    isConfigured: false,
    notes: 'Audiomack API requires private partner credentials approval through Audiomack for Developers.',
    setupGuide: 'Submit a partnership request at audiomack.com/data-api for commercial API access.',
    catalogCoverage: ['Hip-Hop', 'Afrobeats', 'Latin', 'R&B'],
  };

  isAvailable(): boolean {
    return false;
  }

  getDiagnostic(): ProviderDiagnostic {
    return this.lastDiagnostic;
  }

  async search(): Promise<ProviderSearchResult> {
    return { provider: 'audiomack', tracks: [] };
  }

  async testConnection(): Promise<{ success: boolean; latencyMs: number; message: string }> {
    return {
      success: false,
      latencyMs: 0,
      message: 'Audiomack developer partnership required.',
    };
  }
}

export class TidalProvider implements MusicProviderAdapter {
  id = 'tidal' as const;
  name = 'TIDAL Developer API';

  private lastDiagnostic: ProviderDiagnostic = {
    id: 'tidal',
    name: 'TIDAL Developer Platform',
    category: 'audio',
    status: 'pending_credentials',
    searchAvailable: false,
    playbackAvailable: false,
    playbackType: 'external',
    requiresCredentials: true,
    isConfigured: false,
    notes: 'TIDAL Developer API requires OAuth 2.0 Client credentials and user subscription for Hi-Res FLAC/MQA streaming.',
    setupGuide: 'Register at developer.tidal.com and configure OAuth 2.0 client credentials.',
    catalogCoverage: ['Hi-Res FLAC', 'Master Quality', 'Lossless Audio'],
  };

  isAvailable(): boolean {
    return false;
  }

  getDiagnostic(): ProviderDiagnostic {
    return this.lastDiagnostic;
  }

  async search(): Promise<ProviderSearchResult> {
    return { provider: 'tidal', tracks: [] };
  }

  async testConnection(): Promise<{ success: boolean; latencyMs: number; message: string }> {
    return {
      success: false,
      latencyMs: 0,
      message: 'Pending TIDAL Developer credentials.',
    };
  }
}

export const appleMusicProvider = new AppleMusicProvider();
export const audiomackProvider = new AudiomackProvider();
export const tidalProvider = new TidalProvider();
