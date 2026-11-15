import { searchJamendo, getJamendoTrending } from './jamendoService.js';
import { searchItunes } from './itunesService.js';
import { searchYouTube, resolveFullSong } from './youtubeService.js';
import { searchSpotify } from './spotifyService.js';
import { NormalizedTrack } from '../types/index.js';
import { db } from '../db/prisma.js';

export async function aggregateSearch(query: string, options?: { provider?: string; limit?: number }): Promise<{
  tracks: NormalizedTrack[];
  total: number;
  providersQueried: string[];
}> {
  const cleanQuery = (query || '').trim();
  if (!cleanQuery) {
    return { tracks: [], total: 0, providersQueried: [] };
  }

  const limitPerProvider = options?.limit || 15;
  const requestedProvider = options?.provider?.toLowerCase();

  const providersQueried: string[] = [];
  const searchPromises: Promise<NormalizedTrack[]>[] = [];

  // YouTube is queried FIRST for full-song playback!
  if (!requestedProvider || requestedProvider === 'all' || requestedProvider === 'youtube') {
    providersQueried.push('youtube');
    searchPromises.push(searchYouTube(cleanQuery, limitPerProvider));
  }

  if (!requestedProvider || requestedProvider === 'all' || requestedProvider === 'itunes') {
    providersQueried.push('itunes');
    searchPromises.push(searchItunes(cleanQuery, limitPerProvider));
  }

  if (!requestedProvider || requestedProvider === 'all' || requestedProvider === 'jamendo') {
    providersQueried.push('jamendo');
    searchPromises.push(searchJamendo(cleanQuery, limitPerProvider));
  }

  if (!requestedProvider || requestedProvider === 'all' || requestedProvider === 'spotify') {
    providersQueried.push('spotify');
    searchPromises.push(searchSpotify(cleanQuery, limitPerProvider));
  }

  const results = await Promise.allSettled(searchPromises);
  const rawTracks: NormalizedTrack[] = [];

  for (const res of results) {
    if (res.status === 'fulfilled' && Array.isArray(res.value)) {
      rawTracks.push(...res.value);
    }
  }

  // Deduplication based on lowercase artist + title
  const seen = new Set<string>();
  const normalizedTracks: NormalizedTrack[] = [];

  // Group: Put full-length YouTube tracks and full Jamendo tracks first so users immediately get FULL SONG playback!
  const fullTracks = rawTracks.filter((t) => t.provider === 'youtube' || t.playbackType === 'youtube' || t.provider === 'jamendo');
  const otherTracks = rawTracks.filter((t) => t.provider !== 'youtube' && t.playbackType !== 'youtube' && t.provider !== 'jamendo');

  const orderedTracks = [...fullTracks, ...otherTracks];

  for (const track of orderedTracks) {
    const simplifiedKey = `${track.title.toLowerCase().replace(/[^a-z0-9]/g, '')}_${track.artist.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    if (!seen.has(simplifiedKey)) {
      seen.add(simplifiedKey);
      normalizedTracks.push(track);

      // Async cache song to DB
      db.song.upsert({
        where: {
          provider_providerId: {
            provider: track.provider,
            providerId: track.id,
          },
        },
        create: {
          id: track.id,
          title: track.title,
          artist: track.artist,
          album: track.album,
          duration: track.duration,
          coverUrl: track.coverUrl,
          audioUrl: track.audioUrl || (track.youtubeId ? `https://www.youtube.com/watch?v=${track.youtubeId}` : null),
          provider: track.provider,
          providerId: track.id,
          isAuthorized: track.isAuthorized,
        },
        update: {
          coverUrl: track.coverUrl,
          audioUrl: track.audioUrl || (track.youtubeId ? `https://www.youtube.com/watch?v=${track.youtubeId}` : null),
        },
      }).catch(() => {});
    }
  }

  return {
    tracks: normalizedTracks,
    total: normalizedTracks.length,
    providersQueried,
  };
}

// Latest Music & Trending 2026 across Bollywood, Punjabi, Gujarati, and Global hits
export async function getLatestMusic(): Promise<NormalizedTrack[]> {
  const [latestHindi, latestPunjabi, latestGlobal, latestJamendo] = await Promise.allSettled([
    searchYouTube('Bollywood Hindi Latest Songs 2026 Official', 8),
    searchYouTube('Punjabi Latest Hits 2026 Official', 6),
    searchYouTube('Global Pop Top Hits 2026 Official', 6),
    getJamendoTrending(6),
  ]);

  const combined: NormalizedTrack[] = [];
  if (latestHindi.status === 'fulfilled') combined.push(...latestHindi.value);
  if (latestPunjabi.status === 'fulfilled') combined.push(...latestPunjabi.value);
  if (latestGlobal.status === 'fulfilled') combined.push(...latestGlobal.value);
  if (latestJamendo.status === 'fulfilled') combined.push(...latestJamendo.value);

  const seen = new Set<string>();
  return combined.filter((t) => {
    const key = t.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Curated Trending Tracks
export async function getTrendingTracks(): Promise<NormalizedTrack[]> {
  const [ytTrending, itunesHindi, jamendoTracks] = await Promise.allSettled([
    searchYouTube('Top Trending Music Videos 2026', 10),
    searchItunes('Bollywood Hindi Trending Hits 2026', 8),
    getJamendoTrending(6),
  ]);

  const combined: NormalizedTrack[] = [];
  if (ytTrending.status === 'fulfilled') combined.push(...ytTrending.value);
  if (itunesHindi.status === 'fulfilled') combined.push(...itunesHindi.value);
  if (jamendoTracks.status === 'fulfilled') combined.push(...jamendoTracks.value);

  const seen = new Set<string>();
  return combined.filter((t) => {
    const key = `${t.title.toLowerCase()}_${t.artist.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Curated Top Charts
export async function getTopCharts(): Promise<{ category: string; tracks: NormalizedTrack[] }[]> {
  const [global, bollywood, punjabi, edm] = await Promise.allSettled([
    searchYouTube('Global Top 50 Songs Official', 8),
    searchYouTube('Arijit Singh Best Songs 2026 Official', 8),
    searchYouTube('Punjabi Top Songs Sidhu Diljit Official', 8),
    searchYouTube('EDM Festival Music 2026 Official', 8),
  ]);

  return [
    { category: 'Global Top 50 (Full Songs)', tracks: global.status === 'fulfilled' ? global.value : [] },
    { category: 'Bollywood & Hindi Charts (Full Songs)', tracks: bollywood.status === 'fulfilled' ? bollywood.value : [] },
    { category: 'Punjabi Vibes (Full Songs)', tracks: punjabi.status === 'fulfilled' ? punjabi.value : [] },
    { category: 'EDM & Electronic Beats (Full Songs)', tracks: edm.status === 'fulfilled' ? edm.value : [] },
  ];
}

// Curated New Releases
export async function getNewReleases(): Promise<NormalizedTrack[]> {
  const res = await searchYouTube('New Releases 2026 Official Music Video', 16);
  if (res.length > 0) return res;
  return getJamendoTrending(16);
}
