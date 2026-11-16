import { MusicProviderAdapter, ProviderDiagnostic, ProviderSearchResult } from './types.js';
import { Track } from '../../types/music.js';
import { youtubeApi } from '../youtubeApi.js';

export class YouTubeProvider implements MusicProviderAdapter {
  id = 'youtube' as const;
  name = 'YouTube Music & Official Videos';

  private lastDiagnostic: ProviderDiagnostic = {
    id: 'youtube',
    name: 'YouTube Data API v3 & IFrame Player',
    category: 'video',
    status: 'connected',
    searchAvailable: true,
    playbackAvailable: true,
    playbackType: 'youtube',
    requiresCredentials: true,
    credentialsEnvVar: 'YOUTUBE_API_KEY / VITE_YOUTUBE_API_KEY',
    isConfigured: true,
    notes: 'Official YouTube Data API v3 and IFrame Player integration with full HD video playback and search filters.',
    setupGuide: 'Obtain a YouTube Data API v3 key from Google Cloud Console and set YOUTUBE_API_KEY in your .env file.',
    catalogCoverage: ['Music Videos', 'Live Performances', 'Official Audio', 'Bollywood', 'Global Hits'],
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
    if (!q) return { provider: 'youtube', tracks: [] };

    try {
      const res = await youtubeApi.search(q, 'all', undefined, limit);
      this.lastDiagnostic.lastResponseTimeMs = Date.now() - start;
      this.lastDiagnostic.status = 'connected';

      const tracks: Track[] = res.items.map((item) => ({
        id: `youtube-${item.id}`,
        title: item.title,
        artist: item.channelTitle || 'YouTube Artist',
        album: 'YouTube Music Video',
        duration: item.duration || 240,
        coverUrl: item.thumbnail,
        youtubeId: item.id,
        provider: 'youtube',
        providerName: 'YouTube Official Video',
        isAuthorized: true,
        playbackType: 'youtube',
        releaseDate: item.publishedAt,
      }));

      return { provider: 'youtube', tracks };
    } catch (err: any) {
      this.lastDiagnostic.lastError = err?.message;
      return { provider: 'youtube', tracks: [] };
    }
  }

  async getTrendingMusicVideos(limit = 12): Promise<Track[]> {
    try {
      const res = await youtubeApi.getTrending('IN', limit);
      return res.items.map((item) => ({
        id: `youtube-${item.id}`,
        title: item.title,
        artist: item.channelTitle || 'YouTube Artist',
        album: 'YouTube Trending Video',
        duration: item.duration || 240,
        coverUrl: item.thumbnail,
        youtubeId: item.id,
        provider: 'youtube',
        providerName: 'YouTube Official Video',
        isAuthorized: true,
        playbackType: 'youtube',
        releaseDate: item.publishedAt,
      }));
    } catch {
      return [];
    }
  }

  async testConnection(): Promise<{ success: boolean; latencyMs: number; message: string }> {
    const start = Date.now();
    try {
      const res = await youtubeApi.search('Arijit Singh', 'all', undefined, 1);
      const latencyMs = Date.now() - start;
      this.lastDiagnostic.lastResponseTimeMs = latencyMs;
      this.lastDiagnostic.status = 'connected';
      return {
        success: res.items.length > 0,
        latencyMs,
        message: 'YouTube API search & player connection verified.',
      };
    } catch (err: any) {
      return {
        success: false,
        latencyMs: Date.now() - start,
        message: err.message || 'YouTube connection test failed',
      };
    }
  }
}

export const youtubeProvider = new YouTubeProvider();
