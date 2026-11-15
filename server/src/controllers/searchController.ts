import { Request, Response } from 'express';
import { aggregateSearch, getTrendingTracks } from '../services/searchAggregator.js';
import { db } from '../db/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

// Pre-seeded prominent artists database for instant, lightning-fast suggestion matching
const POPULAR_ARTISTS = [
  { id: 'art-shubh', name: 'Shubh', genre: 'Punjabi, Hip-Hop', imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80', verified: true, monthlyListeners: 18500000 },
  { id: 'art-1', name: 'Arijit Singh', genre: 'Bollywood, Romantic', imageUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=500&q=80', verified: true, monthlyListeners: 42500000 },
  { id: 'art-2', name: 'Diljit Dosanjh', genre: 'Punjabi, Pop', imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&q=80', verified: true, monthlyListeners: 24100000 },
  { id: 'art-3', name: 'Shreya Ghoshal', genre: 'Bollywood, Classical', imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80', verified: true, monthlyListeners: 29800000 },
  { id: 'art-4', name: 'Karan Aujla', genre: 'Punjabi, Hip-Hop', imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&q=80', verified: true, monthlyListeners: 21300000 },
  { id: 'art-5', name: 'Badshah', genre: 'Bollywood, Rap', imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80', verified: true, monthlyListeners: 19400000 },
  { id: 'art-6', name: 'AP Dhillon', genre: 'Punjabi, Wave', imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80', verified: true, monthlyListeners: 16700000 },
  { id: 'art-7', name: 'Sidhu Moose Wala', genre: 'Punjabi, Folk Rap', imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80', verified: true, monthlyListeners: 22000000 },
  { id: 'art-8', name: 'Avicii', genre: 'EDM, Progressive House', imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80', verified: true, monthlyListeners: 36000000 },
  { id: 'art-9', name: 'Taylor Swift', genre: 'Pop, Country', imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80', verified: true, monthlyListeners: 105000000 },
  { id: 'art-10', name: 'Pritam', genre: 'Bollywood, Composer', imageUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=500&q=80', verified: true, monthlyListeners: 35000000 },
  { id: 'art-11', name: 'Atif Aslam', genre: 'Romantic, Pop', imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&q=80', verified: true, monthlyListeners: 28000000 },
  { id: 'art-12', name: 'Neha Kakkar', genre: 'Bollywood, Party', imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80', verified: true, monthlyListeners: 25000000 },
  { id: 'art-13', name: 'Kinjal Dave', genre: 'Gujarati Folk, Garba', imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80', verified: true, monthlyListeners: 8500000 },
  { id: 'art-14', name: 'Geeta Rabari', genre: 'Gujarati Folk, Dayro', imageUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=500&q=80', verified: true, monthlyListeners: 7200000 },
];

const GENRES_LIST = [
  { id: 'gen-1', name: 'Bollywood', description: 'Hindi cinematic romantic & party tracks' },
  { id: 'gen-2', name: 'Punjabi', description: 'Energetic Punjabi beats, Bhangra & Hip-Hop' },
  { id: 'gen-3', name: 'Gujarati', description: 'Authentic Garba, Dandiya & Gujarati Folk' },
  { id: 'gen-4', name: 'EDM', description: 'Electronic Dance Music & Festival Anthems' },
  { id: 'gen-5', name: 'Lo-Fi', description: 'Chill beats, study focus & relaxation' },
  { id: 'gen-6', name: 'Hindi Pop', description: 'Modern indie pop & soulful acoustic' },
  { id: 'gen-7', name: 'Hip-Hop', description: 'Desi Hip-Hop, Urban Rap & Drill' },
  { id: 'gen-8', name: 'Romantic', description: 'Timeless melodies & love ballads' },
];

const POPULAR_ALBUMS = [
  { id: 'alb-1', title: 'Aashiqui 2', artist: 'Arijit Singh & Ankit Tiwari', releaseDate: '2013', coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80' },
  { id: 'alb-2', title: 'Still Rollin', artist: 'Shubh', releaseDate: '2023', coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80' },
  { id: 'alb-3', title: 'Ghost', artist: 'Diljit Dosanjh', releaseDate: '2023', coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80' },
  { id: 'alb-4', title: 'Four Me', artist: 'Karan Aujla', releaseDate: '2024', coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80' },
  { id: 'alb-5', title: 'Yeh Jawaani Hai Deewani', artist: 'Pritam', releaseDate: '2013', coverUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&q=80' },
  { id: 'alb-6', title: 'Kabir Singh', artist: 'Sachet-Parampara & Vishal Mishra', releaseDate: '2019', coverUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80' },
  { id: 'alb-7', title: 'Brahmastra', artist: 'Pritam & Arijit Singh', releaseDate: '2022', coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80' },
  { id: 'alb-8', title: 'True', artist: 'Avicii', releaseDate: '2013', coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80' },
];

export async function getLiveSuggestions(req: Request, res: Response) {
  try {
    const rawQ = (req.query.q as string) || '';
    const q = rawQ.trim().toLowerCase();

    if (!q || q.length < 2) {
      return res.json({
        query: rawQ,
        suggestions: {
          artists: [],
          songs: [],
          albums: [],
          playlists: [],
          genres: [],
        },
        total: 0,
      });
    }

    // 1. Match Artists
    const matchingArtists = POPULAR_ARTISTS.filter(
      (a) => a.name.toLowerCase().includes(q) || (a.genre && a.genre.toLowerCase().includes(q))
    ).slice(0, 3);

    // 2. Match Genres
    const matchingGenres = GENRES_LIST.filter(
      (g) => g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q)
    ).slice(0, 2);

    // 3. Match Albums
    const matchingAlbums = POPULAR_ALBUMS.filter(
      (alb) => alb.title.toLowerCase().includes(q) || alb.artist.toLowerCase().includes(q)
    ).slice(0, 3);

    // 4. Match Playlists from DB
    const allPlaylists = await db.playlist.findMany({
      take: 20,
    });
    const matchingPlaylists = allPlaylists
      .filter((p: any) => p.title.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)))
      .slice(0, 2);

    // 5. Query Real Songs across Providers (limit to top 6 fast suggestions)
    const searchRes = await aggregateSearch(rawQ, { limit: 6 });
    const matchingSongs = searchRes.tracks.slice(0, 6);

    const totalCount =
      matchingArtists.length +
      matchingSongs.length +
      matchingAlbums.length +
      matchingPlaylists.length +
      matchingGenres.length;

    res.json({
      query: rawQ,
      suggestions: {
        artists: matchingArtists,
        songs: matchingSongs,
        albums: matchingAlbums,
        playlists: matchingPlaylists,
        genres: matchingGenres,
      },
      total: totalCount,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch suggestions' });
  }
}

export async function searchAll(req: AuthenticatedRequest, res: Response) {
  try {
    const q = (req.query.q as string) || '';
    const type = (req.query.type as string) || 'all';
    const limit = parseInt((req.query.limit as string) || '25', 10);

    if (!q.trim()) {
      return res.status(400).json({ error: 'Search query parameter "q" is required.' });
    }

    const clean = q.trim().toLowerCase();

    // Log in search history
    db.searchHistory.create({
      data: {
        userId: req.user?.id || null,
        query: q.trim(),
        provider: 'vibe_universal',
        resultCount: 0,
      },
    }).catch(() => {});

    // Parallel aggregate search
    const [songRes, trendingData] = await Promise.all([
      aggregateSearch(q.trim(), { limit }),
      getTrendingTracks(),
    ]);

    // Match Artists
    const matchedArtists = POPULAR_ARTISTS.filter(
      (a) => a.name.toLowerCase().includes(clean) || (a.genre && a.genre.toLowerCase().includes(clean))
    );

    // Match Albums
    const matchedAlbums = POPULAR_ALBUMS.filter(
      (alb) => alb.title.toLowerCase().includes(clean) || alb.artist.toLowerCase().includes(clean)
    );

    // Match Playlists
    const dbPlaylists = await db.playlist.findMany({
      take: 20,
    });
    const matchedPlaylists = dbPlaylists.filter(
      (p: any) => p.title.toLowerCase().includes(clean) || (p.description && p.description.toLowerCase().includes(clean))
    );

    res.json({
      query: q.trim(),
      type,
      total: songRes.total + matchedArtists.length + matchedAlbums.length,
      songs: songRes.tracks,
      artists: matchedArtists,
      albums: matchedAlbums,
      playlists: matchedPlaylists,
      trendingFallback: trendingData.slice(0, 6),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Search execution failed' });
  }
}

export async function getTrendingSearches(req: Request, res: Response) {
  try {
    const trendingQueries = [
      'Shubh',
      'Arijit Singh',
      'Diljit Dosanjh',
      'Karan Aujla',
      'Badshah',
      'AP Dhillon',
      'Sidhu Moose Wala',
      'Avicii',
      'Taylor Swift',
      'Pritam',
      'Atif Aslam',
      'Kinjal Dave',
    ];

    const popularSongs = await getTrendingTracks();

    res.json({
      trendingQueries,
      popularSongs: popularSongs.slice(0, 8),
      recommendedArtists: POPULAR_ARTISTS.slice(0, 8),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch trending searches' });
  }
}

export async function getSearchHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const list = await db.searchHistory.findMany({
      where: req.user ? { userId: req.user.id } : undefined,
      take: 12,
    });

    const uniqueQueries: string[] = [];
    for (const item of list) {
      if (item.query && !uniqueQueries.includes(item.query)) {
        uniqueQueries.push(item.query);
      }
    }

    res.json({ history: uniqueQueries });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch search history' });
  }
}

export async function saveSearchHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const { query } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Query is required.' });
    }

    await db.searchHistory.create({
      data: {
        userId: req.user?.id || null,
        query: query.trim(),
        provider: 'vibe_search',
        resultCount: 1,
      },
    });

    res.json({ success: true, message: 'Search history recorded' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save search history' });
  }
}

export async function clearSearchHistory(req: AuthenticatedRequest, res: Response) {
  try {
    await db.searchHistory.deleteMany({
      where: req.user ? { userId: req.user.id } : undefined,
    });
    res.json({ success: true, message: 'Search history cleared.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to clear search history' });
  }
}
