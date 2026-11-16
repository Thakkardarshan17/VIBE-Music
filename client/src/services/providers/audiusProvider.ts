import axios from 'axios';
import { audiusApi } from '../audiusApi.js';
import { MusicProviderAdapter, ProviderDiagnostic, ProviderSearchResult } from './types.js';
import { Track } from '../../types/music.js';

export class AudiusProvider implements MusicProviderAdapter {
  id = 'audius' as const;
  name = 'Audius Decentralized Music';

  private lastDiagnostic: ProviderDiagnostic = {
    id: 'audius',
    name: 'Audius',
    category: 'audio',
    status: 'connected',
    searchAvailable: true,
    playbackAvailable: true,
    playbackType: 'audio',
    requiresCredentials: false,
    isConfigured: true,
    lastChecked: Date.now(),
    lastResponseTimeMs: 120,
    notes: 'Official live Audius v1 REST API. Full length studio quality playback enabled.',
    catalogCoverage: ['Electronic', 'Dance', 'Remixes', 'Hip-Hop', 'Underground', 'Global Creators'],
  };

  isAvailable(): boolean {
    return true;
  }

  getDiagnostic(): ProviderDiagnostic {
    return this.lastDiagnostic;
  }

  async search(query: string, limit = 15): Promise<ProviderSearchResult> {
    const start = Date.now();
    try {
      const [tracks, artists] = await Promise.all([
        audiusApi.searchTracks(query, limit),
        audiusApi.searchArtists(query, 6),
      ]);
      this.lastDiagnostic.lastResponseTimeMs = Date.now() - start;
      this.lastDiagnostic.lastChecked = Date.now();
      this.lastDiagnostic.status = 'connected';
      return {
        provider: 'audius',
        tracks,
        artists,
      };
    } catch (err: any) {
      this.lastDiagnostic.lastError = err?.message || 'Audius search failed';
      this.lastDiagnostic.status = 'error';
      return { provider: 'audius', tracks: [] };
    }
  }

  async getTrending(limit = 20): Promise<Track[]> {
    return await audiusApi.getTrendingTracks(limit);
  }

  async getLatestReleases(limit = 20): Promise<Track[]> {
    return await audiusApi.getLatestReleases(limit);
  }

  async testConnection(): Promise<{ success: boolean; latencyMs: number; message: string }> {
    const start = Date.now();
    try {
      const res = await axios.get('https://api.audius.co/v1/tracks/trending?app_name=VIBE_MUSIC&limit=1', { timeout: 6000 });
      const latencyMs = Date.now() - start;
      this.lastDiagnostic.lastResponseTimeMs = latencyMs;
      this.lastDiagnostic.lastChecked = Date.now();
      this.lastDiagnostic.status = 'connected';
      return {
        success: res.status === 200,
        latencyMs,
        message: 'Audius API connected successfully (200 OK)',
      };
    } catch (err: any) {
      this.lastDiagnostic.status = 'error';
      this.lastDiagnostic.lastError = err.message;
      return {
        success: false,
        latencyMs: Date.now() - start,
        message: err.message || 'Connection failed',
      };
    }
  }
}

export const audiusProvider = new AudiusProvider();
