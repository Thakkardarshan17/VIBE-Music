import axios from 'axios';
import { MusicProviderAdapter, ProviderDiagnostic, ProviderSearchResult } from './types.js';
import { Track, Artist, Album } from '../../types/music.js';

export class ITunesProvider implements MusicProviderAdapter {
  id = 'itunes' as const;
  name = 'Apple iTunes & Apple Music Catalog';

  private lastDiagnostic: ProviderDiagnostic = {
    id: 'itunes',
    name: 'Apple iTunes Catalog',
    category: 'audio',
    status: 'connected',
    searchAvailable: true,
    playbackAvailable: true,
    playbackType: 'audio',
    requiresCredentials: false,
    isConfigured: true,
    lastChecked: Date.now(),
    lastResponseTimeMs: 140,
    notes: 'Official live Apple iTunes Search API. High-fidelity audio previews with extensive Hindi, Punjabi, Gujarati and Bollywood coverage.',
    catalogCoverage: ['Bollywood', 'Hindi Hits', 'Punjabi', 'Gujarati Folk', 'Pop', 'International'],
  };

  isAvailable(): boolean {
    return true;
  }

  getDiagnostic(): ProviderDiagnostic {
    return this.lastDiagnostic;
  }

  async search(query: string, limit = 20): Promise<ProviderSearchResult> {
    const start = Date.now();
    const q = (query || '').trim();
    if (!q) return { provider: 'itunes', tracks: [] };

    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=${limit}`;
      const res = await axios.get(url, { timeout: 8000 });
      this.lastDiagnostic.lastResponseTimeMs = Date.now() - start;
      this.lastDiagnostic.lastChecked = Date.now();
      this.lastDiagnostic.status = 'connected';

      const tracks: Track[] = [];
      const artistMap = new Map<string, Artist>();
      const albumMap = new Map<string, Album>();

      if (res.data?.results && Array.isArray(res.data.results)) {
        res.data.results.forEach((item: any) => {
          if (!item.trackName || !item.previewUrl) return;

          const highResArt = (item.artworkUrl100 || '').replace('100x100bb', '600x600bb');
          const releaseDate = item.releaseDate ? item.releaseDate.substring(0, 10) : '';

          tracks.push({
            id: `itunes-${item.trackId}`,
            title: item.trackName,
            artist: item.artistName || 'Unknown Artist',
            album: item.collectionName || 'Single',
            duration: Math.round((item.trackTimeMillis || 180000) / 1000),
            coverUrl: highResArt || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80',
            audioUrl: item.previewUrl,
            provider: 'itunes',
            providerName: 'Apple Music / iTunes',
            isAuthorized: true,
            playbackType: 'audio',
            genre: item.primaryGenreName || 'Music',
            releaseDate,
          });

          // Aggregate artists
          if (item.artistName && !artistMap.has(item.artistName)) {
            artistMap.set(item.artistName, {
              id: `art-itunes-${item.artistId || item.artistName}`,
              name: item.artistName,
              genre: item.primaryGenreName || 'Artist',
              imageUrl: highResArt,
              verified: true,
              monthlyListeners: 2500000,
            });
          }

          // Aggregate albums
          if (item.collectionName && !albumMap.has(item.collectionName)) {
            albumMap.set(item.collectionName, {
              id: `alb-itunes-${item.collectionId || item.collectionName}`,
              title: item.collectionName,
              artist: item.artistName,
              coverUrl: highResArt,
              releaseDate: releaseDate || '2026',
              totalTracks: item.trackCount || 1,
            });
          }
        });
      }

      return {
        provider: 'itunes',
        tracks,
        artists: Array.from(artistMap.values()).slice(0, 6),
        albums: Array.from(albumMap.values()).slice(0, 6),
      };
    } catch (err: any) {
      this.lastDiagnostic.lastError = err?.message;
      this.lastDiagnostic.status = 'error';
      return { provider: 'itunes', tracks: [] };
    }
  }

  async getLatestReleases(limit = 20): Promise<Track[]> {
    const res = await this.search('Bollywood Latest 2026', limit);
    return res.tracks;
  }

  async getTrending(limit = 20): Promise<Track[]> {
    const res = await this.search('Top Hits 2026', limit);
    return res.tracks;
  }

  async testConnection(): Promise<{ success: boolean; latencyMs: number; message: string }> {
    const start = Date.now();
    try {
      const res = await axios.get('https://itunes.apple.com/search?term=Arijit+Singh&limit=1', { timeout: 6000 });
      const latencyMs = Date.now() - start;
      this.lastDiagnostic.lastResponseTimeMs = latencyMs;
      this.lastDiagnostic.lastChecked = Date.now();
      this.lastDiagnostic.status = 'connected';
      return {
        success: res.status === 200,
        latencyMs,
        message: 'iTunes API connected successfully (200 OK)',
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

export const itunesProvider = new ITunesProvider();
