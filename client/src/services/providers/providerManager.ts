import { Track, Artist, Album, Playlist, MusicProviderType } from '../../types/music.js';
import {
  MusicProviderAdapter,
  ProviderDiagnostic,
  UnifiedSearchResults,
  ProviderSearchResult,
} from './types.js';
import { audiusProvider } from './audiusProvider.js';
import { itunesProvider } from './itunesProvider.js';
import { deezerProvider } from './deezerProvider.js';
import { youtubeProvider } from './youtubeProvider.js';
import { jamendoProvider } from './jamendoProvider.js';
import { spotifyProvider } from './spotifyProvider.js';
import { soundcloudProvider } from './soundcloudProvider.js';
import { appleMusicProvider, audiomackProvider, tidalProvider } from './otherProviders.js';

class ProviderManager {
  private providers: Map<MusicProviderType, MusicProviderAdapter> = new Map();

  // In-memory 5-minute search cache
  private searchCache: Map<string, { results: UnifiedSearchResults; timestamp: number }> = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;

  constructor() {
    this.registerProvider(audiusProvider);
    this.registerProvider(itunesProvider);
    this.registerProvider(deezerProvider);
    this.registerProvider(youtubeProvider);
    this.registerProvider(jamendoProvider);
    this.registerProvider(spotifyProvider);
    this.registerProvider(soundcloudProvider);
    this.registerProvider(appleMusicProvider);
    this.registerProvider(audiomackProvider);
    this.registerProvider(tidalProvider);
  }

  registerProvider(provider: MusicProviderAdapter) {
    this.providers.set(provider.id, provider);
  }

  getProvider(id: MusicProviderType): MusicProviderAdapter | undefined {
    return this.providers.get(id);
  }

  getAllDiagnostics(): ProviderDiagnostic[] {
    return Array.from(this.providers.values()).map((p) => p.getDiagnostic());
  }

  async testProvider(id: MusicProviderType) {
    const provider = this.providers.get(id);
    if (!provider) {
      return { success: false, latencyMs: 0, message: `Provider ${id} not found.` };
    }
    return await provider.testConnection();
  }

  /**
   * Unified parallel search across all active providers with deduplication
   */
  async searchAll(query: string, category: string = 'all'): Promise<UnifiedSearchResults> {
    const cleanQuery = (query || '').trim();
    if (!cleanQuery) {
      return {
        tracks: [],
        artists: [],
        albums: [],
        playlists: [],
        videos: [],
        liveMusic: [],
        providerStats: [],
      };
    }

    const cacheKey = `unified_search_${cleanQuery.toLowerCase()}_${category}`;
    const cached = this.searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.results;
    }

    // Active searchable providers
    const searchableProviders: MusicProviderAdapter[] = [
      itunesProvider,
      audiusProvider,
      deezerProvider,
      youtubeProvider,
      jamendoProvider,
    ];

    const stats: UnifiedSearchResults['providerStats'] = [];
    const searchPromises = searchableProviders.map(async (provider) => {
      const start = Date.now();
      try {
        const res = await provider.search(cleanQuery, 15);
        stats.push({
          provider: provider.id,
          count: (res.tracks || []).length,
          success: true,
          durationMs: Date.now() - start,
        });
        return res;
      } catch (err) {
        stats.push({
          provider: provider.id,
          count: 0,
          success: false,
          durationMs: Date.now() - start,
        });
        return { provider: provider.id, tracks: [] };
      }
    });

    const settled = await Promise.allSettled(searchPromises);

    // Merge and deduplicate tracks
    const allTracks: Track[] = [];
    const allArtists: Artist[] = [];
    const allAlbums: Album[] = [];
    const videos: Track[] = [];
    const seenTrackKeys = new Set<string>();
    const seenArtistKeys = new Set<string>();
    const seenAlbumKeys = new Set<string>();

    settled.forEach((outcome) => {
      if (outcome.status === 'fulfilled') {
        const result: ProviderSearchResult = outcome.value;

        // Tracks deduplication
        if (result.tracks && Array.isArray(result.tracks)) {
          result.tracks.forEach((track) => {
            const cleanKey = `${track.title.toLowerCase().replace(/[^a-z0-9]/g, '')}_${track.artist.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
            if (!seenTrackKeys.has(cleanKey)) {
              seenTrackKeys.add(cleanKey);
              allTracks.push(track);

              if (track.provider === 'youtube' || track.playbackType === 'youtube' || track.youtubeId) {
                videos.push(track);
              }
            }
          });
        }

        // Artists deduplication
        if (result.artists && Array.isArray(result.artists)) {
          result.artists.forEach((art) => {
            const cleanKey = art.name.toLowerCase().trim();
            if (!seenArtistKeys.has(cleanKey)) {
              seenArtistKeys.add(cleanKey);
              allArtists.push(art);
            }
          });
        }

        // Albums deduplication
        if (result.albums && Array.isArray(result.albums)) {
          result.albums.forEach((alb) => {
            const cleanKey = alb.title.toLowerCase().trim();
            if (!seenAlbumKeys.has(cleanKey)) {
              seenAlbumKeys.add(cleanKey);
              allAlbums.push(alb);
            }
          });
        }
      }
    });

    const liveMusic = allTracks.filter(
      (t) =>
        t.title.toLowerCase().includes('live') ||
        t.title.toLowerCase().includes('concert') ||
        t.title.toLowerCase().includes('session')
    );

    const finalResults: UnifiedSearchResults = {
      tracks: allTracks,
      artists: allArtists,
      albums: allAlbums,
      playlists: [],
      videos,
      liveMusic,
      providerStats: stats,
    };

    this.searchCache.set(cacheKey, { results: finalResults, timestamp: Date.now() });
    return finalResults;
  }

  /**
   * Language-specific search (Hindi, Punjabi, Gujarati, English, Bollywood)
   */
  async searchByLanguage(lang: 'hindi' | 'punjabi' | 'gujarati' | 'english' | 'bollywood', limit = 16): Promise<Track[]> {
    const queries: Record<string, string> = {
      hindi: 'Latest Hindi Songs 2026',
      punjabi: 'Punjabi Hits 2026',
      gujarati: 'Gujarati Folk Songs 2026',
      english: 'Top Hits English 2026',
      bollywood: 'Bollywood Top Hits 2026',
    };

    const q = queries[lang] || 'Top Songs 2026';
    const res = await this.searchAll(q);
    return res.tracks.slice(0, limit);
  }
}

export const providerManager = new ProviderManager();
