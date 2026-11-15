import axios from 'axios';
import { ENV } from '../config/env.js';
import { NormalizedTrack } from '../types/index.js';

let spotifyToken: string | null = null;
let tokenExpiresAt = 0;

async function getSpotifyToken(): Promise<string | null> {
  if (!ENV.SPOTIFY_CLIENT_ID || !ENV.SPOTIFY_CLIENT_SECRET) {
    return null;
  }

  if (spotifyToken && Date.now() < tokenExpiresAt) {
    return spotifyToken;
  }

  try {
    const authString = Buffer.from(`${ENV.SPOTIFY_CLIENT_ID}:${ENV.SPOTIFY_CLIENT_SECRET}`).toString('base64');
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${authString}`,
        },
        timeout: 6000,
      }
    );

    if (response.data?.access_token) {
      spotifyToken = response.data.access_token;
      tokenExpiresAt = Date.now() + (response.data.expires_in - 60) * 1000;
      return spotifyToken;
    }
  } catch (err: any) {
    console.warn('[Spotify Service] Token authorization failed:', err.message);
  }
  return null;
}

export async function searchSpotify(query: string, limit = 10): Promise<NormalizedTrack[]> {
  const token = await getSpotifyToken();
  if (!token) {
    return [];
  }

  try {
    const response = await axios.get('https://api.spotify.com/v1/search', {
      params: {
        q: query,
        type: 'track',
        limit,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 8000,
    });

    const items = response.data?.tracks?.items || [];
    return items.map((item: any): NormalizedTrack => ({
      id: `spotify-${item.id}`,
      title: item.name,
      artist: item.artists?.map((a: any) => a.name).join(', ') || 'Spotify Artist',
      album: item.album?.name || 'Single',
      duration: Math.round((item.duration_ms || 180000) / 1000),
      coverUrl: item.album?.images?.[0]?.url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80',
      audioUrl: item.preview_url, // Official 30-sec preview where available
      spotifyUrl: item.external_urls?.spotify,
      provider: 'spotify',
      providerName: 'Spotify',
      isAuthorized: !!item.preview_url,
      playbackType: item.preview_url ? 'audio' : 'external',
      popularity: item.popularity,
    }));
  } catch (error: any) {
    console.warn(`[Spotify Service] Search error for "${query}":`, error.message);
    return [];
  }
}

