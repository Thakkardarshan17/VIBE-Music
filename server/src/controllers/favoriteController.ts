import { Response } from 'express';
import { db } from '../db/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function getFavorites(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const favorites = await db.favorite.findMany({
      where: { userId: req.user.id },
      include: { song: true },
      orderBy: { createdAt: 'desc' },
    });

    const tracks = favorites.map((f: any) => f.song).filter(Boolean);
    res.json({ favorites: tracks, total: tracks.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch favorites' });
  }
}

export async function toggleFavorite(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const songId = String(req.params.songId);
    const { song } = req.body; // Full song payload for caching

    // Cache song if sent
    if (song && song.id) {
      await db.song.upsert({
        where: {
          provider_providerId: {
            provider: song.provider || 'jamendo',
            providerId: song.id,
          },
        },
        create: {
          id: song.id,
          title: song.title,
          artist: song.artist,
          album: song.album || 'Single',
          duration: song.duration || 180,
          coverUrl: song.coverUrl,
          audioUrl: song.audioUrl || (song.youtubeId ? `https://www.youtube.com/watch?v=${song.youtubeId}` : null),
          provider: song.provider || 'jamendo',
          providerId: song.id,
          isAuthorized: song.isAuthorized ?? true,
        },
        update: {
          coverUrl: song.coverUrl,
        },
      }).catch(() => {});
    }

    const existing = await db.favorite.findFirst({
      where: {
        userId: req.user.id,
        songId,
      },
    });

    if (existing) {
      await db.favorite.delete({
        where: {
          userId_songId: {
            userId: req.user.id,
            songId,
          },
        },
      });
      return res.json({ isFavorite: false, message: 'Removed from Liked Songs' });
    } else {
      await db.favorite.create({
        data: {
          userId: req.user.id,
          songId,
        },
      });
      return res.json({ isFavorite: true, message: 'Added to Liked Songs' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to toggle favorite' });
  }
}

export async function checkFavorite(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.json({ isFavorite: false });
    const songId = String(req.params.songId);

    const existing = await db.favorite.findFirst({
      where: {
        userId: req.user.id,
        songId,
      },
    });

    res.json({ isFavorite: !!existing });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to check favorite' });
  }
}
