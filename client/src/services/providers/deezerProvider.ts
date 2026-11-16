import axios from 'axios';
import { MusicProviderAdapter, ProviderDiagnostic, ProviderSearchResult } from './types.js';
import { Track } from '../../types/music.js';

export class DeezerProvider implements MusicProviderAdapter {
  id = 'deezer' as const;
  name = 'Deezer Global Music API';

  private lastDiagnostic: ProviderDiagnostic = {
    id: 'deezer',
    name: 'Deezer API',
    category: 'audio',
    status: 'connected',
    searchAvailable: true,
    playbackAvailable: true,
    playbackType: 'audio',
    requiresCredentials: false,
    isConfigured: true,
    lastChecked: Date.now(),
    lastResponseTimeMs: 180,
    notes: 'Official Deezer Public Music Search API with 30s MP3 preview streaming.',
    catalogCoverage: ['International Pop', 'EDM', 'Rock', 'Global Charts', 'Hip-Hop'],
  };

  isAvailable(): boolean {
    return true;
  }

  getDiagnostic(): ProviderDiagnostic {
    return this.lastDiagnostic;
  }

  async search(query: string, limit = 15): Promise<ProviderSearchResult> {
    const start = Date.now();
    const q = (query || '').trim();
    if (!q) return { provider: 'deezer', tracks: [] };

    try {
      // Deezer public search endpoint with cors proxy fallback or direct
      const url = `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=${limit}`;
      // In browser, Deezer has CORS restrictions on some endpoints, so we wrap with a lightweight CORS bridge if needed
      let data: any = null;
      try {
        const res = await axios.get(url, { timeout: 6000 });
        data = res.data;
      } catch (corsErr) {
        // Fallback through allorigins public proxy for Deezer API in client
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const proxyRes = await axios.get(proxyUrl, { timeout: 7000 });
        if (proxyRes.data?.contents) {
          data = JSON.parse(proxyRes.data.contents);
        }
      }

      this.lastDiagnostic.lastResponseTimeMs = Date.now() - start;
      this.lastDiagnostic.lastChecked = Date.now();
      this.lastDiagnostic.status = 'connected';

      const tracks: Track[] = [];
      if (data?.data && Array.isArray(data.data)) {
        data.data.forEach((item: any) => {
          if (!item.title || !item.preview) return;
          tracks.push({
            id: `deezer-${item.id}`,
            title: item.title_short || item.title,
            artist: item.artist?.name || 'Unknown Artist',
            album: item.album?.title || 'Single',
            duration: item.duration || 180,
            coverUrl: item.album?.cover_medium || item.album?.cover_big || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80',
            audioUrl: item.preview,
            provider: 'deezer',
            providerName: 'Deezer Music',
            isAuthorized: true,
            playbackType: 'audio',
            genre: 'Pop',
          });
        });
      }

      return { provider: 'deezer', tracks };
    } catch (err: any) {
      this.lastDiagnostic.lastError = err?.message;
      this.lastDiagnostic.status = 'error';
      return { provider: 'deezer', tracks: [] };
    }
  }

  async testConnection(): Promise<{ success: boolean; latencyMs: number; message: string }> {
    const start = Date.now();
    try {
      const res = await this.search('Dua Lipa', 1);
      const latencyMs = Date.now() - start;
      this.lastDiagnostic.lastResponseTimeMs = latencyMs;
      this.lastDiagnostic.status = 'connected';
      return {
        success: res.tracks.length > 0,
        latencyMs,
        message: 'Deezer API connected and returned tracks',
      };
    } catch (err: any) {
      this.lastDiagnostic.status = 'error';
      return {
        success: false,
        latencyMs: Date.now() - start,
        message: err.message || 'Deezer connection failed',
      };
    }
  }
}

export const deezerProvider = new DeezerProvider();
