import axios from 'axios';
import { NormalizedTrack } from '../types/index.js';

const ITUNES_BASE_URL = 'https://itunes.apple.com/search';

export async function searchItunes(query: string, limit = 15): Promise<NormalizedTrack[]> {
  try {
    const response = await axios.get(ITUNES_BASE_URL, {
      params: {
        term: query,
        media: 'music',
        entity: 'song',
        limit,
      },
      timeout: 8000,
    });

    if (!response.data || !response.data.results) {
      return [];
    }

    return response.data.results.map((item: any): NormalizedTrack => {
      // Get higher resolution artwork (600x600 instead of 100x100)
      const highResArt = item.artworkUrl100
        ? item.artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg')
        : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80';

      return {
        id: `itunes-${item.trackId}`,
        title: item.trackName || 'Unknown Title',
        artist: item.artistName || 'Unknown Artist',
        album: item.collectionName || 'Single',
        duration: Math.round((item.trackTimeMillis || 180000) / 1000),
        coverUrl: highResArt,
        audioUrl: item.previewUrl, // Real 30-sec official stream!
        provider: 'itunes',
        providerName: 'Apple Music Preview',
        isAuthorized: true,
        playbackType: 'audio',
        releaseDate: item.releaseDate ? item.releaseDate.substring(0, 10) : undefined,
        genre: item.primaryGenreName || 'Music',
      };
    });
  } catch (error: any) {
    console.warn(`[iTunes Service] Search error for "${query}":`, error.message);
    return [];
  }
}

