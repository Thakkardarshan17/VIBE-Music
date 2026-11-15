import { Request, Response } from 'express';
import { aggregateSearch, getTrendingTracks, getTopCharts, getNewReleases, getLatestMusic } from '../services/searchAggregator.js';
import { resolveFullSong } from '../services/youtubeService.js';
import { searchItunes } from '../services/itunesService.js';
import { db } from '../db/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function getLatest(req: Request, res: Response) {
  try {
    const tracks = await getLatestMusic();
    res.json({ tracks, total: tracks.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch latest music' });
  }
}

export async function resolveFullTrackEndpoint(req: Request, res: Response) {
  try {
    const title = (req.query.title as string) || '';
    const artist = (req.query.artist as string) || '';

    if (!title) {
      return res.status(400).json({ error: 'Title is required to resolve full track' });
    }

    const resolved = await resolveFullSong(title, artist);
    if (resolved) {
      return res.json({ resolved, success: true });
    }
    return res.status(404).json({ error: 'Could not resolve full track', success: false });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Resolution failed' });
  }
}

export async function searchMusic(req: AuthenticatedRequest, res: Response) {
  try {
    const q = (req.query.q as string) || '';
    const provider = req.query.provider as string;
    const limit = parseInt(req.query.limit as string || '20', 10);

    if (!q.trim()) {
      return res.status(400).json({ error: 'Search query parameter "q" is required.' });
    }

    const searchResult = await aggregateSearch(q, { provider, limit });

    // Track search history if user is authenticated or anonymous
    db.searchHistory.create({
      data: {
        userId: req.user?.id || null,
        query: q,
        provider: provider || 'all',
        resultCount: searchResult.total,
      },
    }).catch(() => {});

    res.json({
      query: q,
      provider: provider || 'all',
      total: searchResult.total,
      providersQueried: searchResult.providersQueried,
      tracks: searchResult.tracks,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Music search failed' });
  }
}

export async function getTrending(req: Request, res: Response) {
  try {
    const tracks = await getTrendingTracks();
    res.json({ tracks, total: tracks.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch trending music' });
  }
}

export async function getCharts(req: Request, res: Response) {
  try {
    const charts = await getTopCharts();
    res.json({ charts });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch charts' });
  }
}

export async function getNewReleasesList(req: Request, res: Response) {
  try {
    const tracks = await getNewReleases();
    res.json({ tracks, total: tracks.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch new releases' });
  }
}

export async function getFeaturedArtists(req: Request, res: Response) {
  try {
    const artists = [
      { id: 'art-1', name: 'Arijit Singh', genre: 'Bollywood, Romantic', imageUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=500&q=80', verified: true, monthlyListeners: 42500000 },
      { id: 'art-2', name: 'Diljit Dosanjh', genre: 'Punjabi, Pop', imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&q=80', verified: true, monthlyListeners: 24800000 },
      { id: 'art-3', name: 'The Weeknd', genre: 'R&B, Synthwave', imageUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=500&q=80', verified: true, monthlyListeners: 108000000 },
      { id: 'art-4', name: 'Dua Lipa', genre: 'Dance Pop, Disco', imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80', verified: true, monthlyListeners: 68500000 },
      { id: 'art-5', name: 'Coldplay', genre: 'Alternative Rock', imageUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=500&q=80', verified: true, monthlyListeners: 84000000 },
      { id: 'art-6', name: 'Shreya Ghoshal', genre: 'Bollywood, Classical', imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&q=80', verified: true, monthlyListeners: 31000000 },
      { id: 'art-7', name: 'Aditya Gadhvi', genre: 'Gujarati Folk, Fusion', imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80', verified: true, monthlyListeners: 8900000 },
      { id: 'art-8', name: 'Alan Walker', genre: 'EDM, Electro', imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&q=80', verified: true, monthlyListeners: 41200000 },
    ];
    res.json({ artists });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch artists' });
  }
}

export async function getArtistDetails(req: Request, res: Response) {
  try {
    const artistName = String(req.params.name);
    const tracks = await searchItunes(artistName, 15);
    res.json({
      artist: {
        name: artistName,
        imageUrl: tracks[0]?.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80',
        tracks,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch artist details' });
  }
}

export async function getFeaturedAlbums(req: Request, res: Response) {
  try {
    const albums = [
      { id: 'alb-1', title: 'Starboy: Deluxe', artist: 'The Weeknd', coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80', releaseDate: '2023', totalTracks: 18 },
      { id: 'alb-2', title: 'Aashiqui 2 (Original Motion Picture Soundtrack)', artist: 'Arijit Singh & Mithoon', coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80', releaseDate: '2013', totalTracks: 11 },
      { id: 'alb-3', title: 'Moon Music', artist: 'Coldplay', coverUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&q=80', releaseDate: '2024', totalTracks: 10 },
      { id: 'alb-4', title: 'G.O.A.T.', artist: 'Diljit Dosanjh', coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80', releaseDate: '2020', totalTracks: 16 },
      { id: 'alb-5', title: 'Future Nostalgia', artist: 'Dua Lipa', coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80', releaseDate: '2020', totalTracks: 13 },
      { id: 'alb-6', title: 'Khalasi & Gujarati Folk Vibes', artist: 'Aditya Gadhvi & Achint', coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&q=80', releaseDate: '2023', totalTracks: 8 },
    ];
    res.json({ albums });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch albums' });
  }
}
