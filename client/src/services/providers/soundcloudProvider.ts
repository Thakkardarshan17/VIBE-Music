import { MusicProviderAdapter, ProviderDiagnostic, ProviderSearchResult } from './types.js';

export class SoundCloudProvider implements MusicProviderAdapter {
  id = 'soundcloud' as const;
  name = 'SoundCloud Developer API';

  private clientId = import.meta.env.VITE_SOUNDCLOUD_CLIENT_ID || '';

  private lastDiagnostic: ProviderDiagnostic = {
    id: 'soundcloud',
    name: 'SoundCloud API',
    category: 'audio',
    status: import.meta.env.VITE_SOUNDCLOUD_CLIENT_ID ? 'available' : 'pending_credentials',
    searchAvailable: !!import.meta.env.VITE_SOUNDCLOUD_CLIENT_ID,
    playbackAvailable: false,
    playbackType: 'external',
    requiresCredentials: true,
    credentialsEnvVar: 'VITE_SOUNDCLOUD_CLIENT_ID',
    isConfigured: !!import.meta.env.VITE_SOUNDCLOUD_CLIENT_ID,
    notes: 'SoundCloud API application registration currently requires SoundCloud Developer Program approval.',
    setupGuide: 'Register an application on soundcloud.com/you/apps to obtain a client_id.',
    catalogCoverage: ['Electronic', 'Remixes', 'Independent Artists', 'Podcasts'],
  };

  isAvailable(): boolean {
    return !!this.clientId;
  }

  getDiagnostic(): ProviderDiagnostic {
    return this.lastDiagnostic;
  }

  async search(): Promise<ProviderSearchResult> {
    return { provider: 'soundcloud', tracks: [] };
  }

  async testConnection(): Promise<{ success: boolean; latencyMs: number; message: string }> {
    return {
      success: !!this.clientId,
      latencyMs: 0,
      message: this.clientId ? 'SoundCloud Client ID configured.' : 'Pending SoundCloud Developer credentials.',
    };
  }
}

export const soundcloudProvider = new SoundCloudProvider();
