import axios from 'axios';
import { ENV } from '../config/env.js';
import { NormalizedTrack } from '../types/index.js';

export async function searchYouTube(query: string, limit = 15): Promise<NormalizedTrack[]> {
  // If YouTube API Key is provided, try YouTube Data API v3 first
  if (ENV.YOUTUBE_API_KEY) {
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          type: 'video',
          videoCategoryId: '10', // Category 10 is Music
          maxResults: limit,
          q: `${query} music song`,
          key: ENV.YOUTUBE_API_KEY,
        },
        timeout: 8000,
      });

      if (response.data && response.data.items && response.data.items.length > 0) {
        return response.data.items.map((item: any): NormalizedTrack => {
          const videoId = item.id?.videoId;
          return {
            id: `youtube-${videoId}`,
            title: item.snippet?.title?.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"') || 'YouTube Track',
            artist: item.snippet?.channelTitle || 'Official Artist',
            album: 'Official Full Track',
            duration: 240,
            coverUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url,
            youtubeId: videoId,
            provider: 'youtube',
            providerName: 'YouTube (Full Song)',
            isAuthorized: true,
            playbackType: 'youtube',
            releaseDate: item.snippet?.publishedAt?.substring(0, 10) || '2026',
          };
        });
      }
    } catch (error: any) {
      console.warn(`[YouTube Service] Data API error for "${query}":`, error.message);
    }
  }

  // High-accuracy YouTube Web Search parser for full-length tracks
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' song official')}`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 8000,
    });

    const html = response.data;
    const match = html.match(/var ytInitialData\s*=\s*({.+?});<\/script>/s) || html.match(/ytInitialData\s*=\s*({.+?});/s);

    if (match) {
      try {
        const data = JSON.parse(match[1]);
        const contents =
          data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];

        const results: NormalizedTrack[] = [];
        const seen = new Set<string>();

        for (const item of contents) {
          const v = item.videoRenderer;
          if (v && v.videoId && !seen.has(v.videoId)) {
            seen.add(v.videoId);

            const title = (v.title?.runs?.map((r: any) => r.text).join('') || `${query} Full Song`)
              .replace(/&amp;/g, '&')
              .replace(/&#39;/g, "'")
              .replace(/&quot;/g, '"');

            const artist = v.ownerText?.runs?.[0]?.text || 'Official Artist';
            const durationStr = v.lengthText?.simpleText || '3:30';
            const parts = durationStr.split(':').map((p: string) => parseInt(p, 10));
            const duration = parts.length === 2 ? parts[0] * 60 + parts[1] : 210;

            const coverUrl =
              v.thumbnail?.thumbnails?.slice(-1)[0]?.url || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;

            results.push({
              id: `youtube-${v.videoId}`,
              title,
              artist,
              album: 'Official Full Track',
              duration,
              coverUrl,
              youtubeId: v.videoId,
              provider: 'youtube',
              providerName: 'YouTube (Full Song)',
              isAuthorized: true,
              playbackType: 'youtube',
              releaseDate: '2026',
            });

            if (results.length >= limit) break;
          }
        }

        if (results.length > 0) {
          return results;
        }
      } catch (jsonErr) {
        console.warn('[YouTube Service] JSON parse fallback error:', jsonErr);
      }
    }

    // Secondary regex fallback for video IDs
    const videoMatches = [...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)];
    const titleMatches = [...html.matchAll(/"title":\{"runs":\[\{"text":"([^"]+)"\}\]/g)];

    const regexResults: NormalizedTrack[] = [];
    const seenRegex = new Set<string>();

    for (let i = 0; i < Math.min(videoMatches.length, limit * 2); i++) {
      const vid = videoMatches[i]?.[1];
      if (!vid || seenRegex.has(vid)) continue;
      seenRegex.add(vid);

      const title = titleMatches[i]?.[1] || `${query} (Official Music)`;
      regexResults.push({
        id: `youtube-${vid}`,
        title: title.replace(/&amp;/g, '&').replace(/&#39;/g, "'"),
        artist: 'Official Music Artist',
        album: 'YouTube Full Song',
        duration: 235,
        coverUrl: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
        youtubeId: vid,
        provider: 'youtube',
        providerName: 'YouTube (Full Song)',
        isAuthorized: true,
        playbackType: 'youtube',
        releaseDate: '2026',
      });

      if (regexResults.length >= limit) break;
    }

    if (regexResults.length > 0) return regexResults;
  } catch (error: any) {
    console.warn(`[YouTube Service] Public search error:`, error.message);
  }

  return [];
}

// Fast Resolver: Finds full song YouTube video ID for any track title + artist
export async function resolveFullSong(title: string, artist: string): Promise<{ youtubeId: string; duration: number; coverUrl: string } | null> {
  try {
    const q = `${title} ${artist} full song official`;
    const tracks = await searchYouTube(q, 3);
    if (tracks.length > 0 && tracks[0].youtubeId) {
      return {
        youtubeId: tracks[0].youtubeId,
        duration: tracks[0].duration || 220,
        coverUrl: tracks[0].coverUrl,
      };
    }
  } catch (err: any) {
    console.warn('[YouTube Resolver] Error resolving full track:', err.message);
  }
  return null;
}
