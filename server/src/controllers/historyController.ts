import { Response } from 'express';
import { db } from '../db/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function getListeningHistory(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const history = await db.listeningHistory.findMany({
      where: { userId: req.user.id },
      take: 40,
      include: { song: true },
      orderBy: { playedAt: 'desc' },
    });

    res.json({ history });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch history' });
  }
}

export async function logTrackPlay(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(200).json({ logged: false, reason: 'anonymous' });
    const { song, durationPlayed } = req.body;

    if (!song || !song.id) {
      return res.status(400).json({ error: 'Song details required' });
    }

    // Ensure song is cached in DB
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

    await db.listeningHistory.create({
      data: {
        userId: req.user.id,
        songId: song.id,
        durationPlayed: durationPlayed || 0,
      },
    });

    res.status(201).json({ logged: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to record history' });
  }
}

export async function getSearchHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const history = await db.searchHistory.findMany({
      where: req.user ? { userId: req.user.id } : undefined,
      take: 15,
      orderBy: { searchedAt: 'desc' },
    });

    res.json({ history });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch search history' });
  }
}

