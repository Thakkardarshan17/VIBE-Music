import axios from 'axios';
import { MusicProviderAdapter, ProviderDiagnostic, ProviderSearchResult } from './types.js';
import { Track } from '../../types/music.js';

export class JamendoProvider implements MusicProviderAdapter {
  id = 'jamendo' as const;
  name = 'Jamendo Free Music Licensing';

  private clientId = 'cba31f51'; // Jamendo demo client id

  private lastDiagnostic: ProviderDiagnostic = {
    id: 'jamendo',
    name: 'Jamendo Music API',
    category: 'audio',
    status: 'connected',
    searchAvailable: true,
    playbackAvailable: true,
    playbackType: 'audio',
    requiresCredentials: false,
    isConfigured: true,
    lastChecked: Date.now(),
    notes: 'Creative Commons and royalty-free independent audio streaming.',
    catalogCoverage: ['Indie', 'Acoustic', 'Rock', 'Ambient', 'Instrumental'],
  };

  isAvailable(): boolean {
    return true;
  }

  getDiagnostic(): ProviderDiagnostic {
    return this.lastDiagnostic;
  }

  async search(query: string, limit = 10): Promise<ProviderSearchResult> {
    const q = (query || '').trim();
    if (!q) return { provider: 'jamendo', tracks: [] };

    try {
      const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${this.clientId}&format=json&limit=${limit}&namesearch=${encodeURIComponent(q)}&audioformat=mp32`;
      const res = await axios.get(url, { timeout: 7000 });
      const tracks: Track[] = [];

      if (res.data?.results && Array.isArray(res.data.results)) {
        res.data.results.forEach((item: any) => {
          if (!item.name || !item.audio) return;
          tracks.push({
            id: `jamendo-${item.id}`,
            title: item.name,
            artist: item.artist_name || 'Jamendo Artist',
            album: item.album_name || 'Independent Single',
            duration: item.duration || 180,
            coverUrl: item.image || item.album_image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80',
            audioUrl: item.audio,
            provider: 'jamendo',
            providerName: 'Jamendo Indie Audio',
            isAuthorized: true,
            playbackType: 'audio',
            genre: 'Indie',
          });
        });
      }
      return { provider: 'jamendo', tracks };
    } catch (err: any) {
      return { provider: 'jamendo', tracks: [] };
    }
  }

  async testConnection(): Promise<{ success: boolean; latencyMs: number; message: string }> {
    const start = Date.now();
    try {
      const res = await axios.get(`https://api.jamendo.com/v3.0/tracks/?client_id=${this.clientId}&format=json&limit=1`, { timeout: 6000 });
      return {
        success: res.status === 200,
        latencyMs: Date.now() - start,
        message: 'Jamendo API connected successfully (200 OK)',
      };
    } catch (err: any) {
      return {
        success: false,
        latencyMs: Date.now() - start,
        message: err.message || 'Jamendo connection failed',
      };
    }
  }
}

export const jamendoProvider = new JamendoProvider();
