import { Response } from 'express';
import { db } from '../db/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function getUserPlaylists(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const playlists = await db.playlist.findMany({
      where: { userId: req.user.id },
      include: { tracks: true },
    });

    res.json({ playlists });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch playlists' });
  }
}

export async function getPlaylistById(req: AuthenticatedRequest, res: Response) {
  try {
    const id = String(req.params.id);
    const playlist = await db.playlist.findUnique({
      where: { id },
      include: { tracks: true },
    });

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    res.json({ playlist });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch playlist' });
  }
}

export async function createPlaylist(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { title, description, coverUrl, isPublic } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Playlist title is required' });
    }

    const playlist = await db.playlist.create({
      data: {
        title,
        description: description || '',
        coverUrl: coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80',
        isPublic: isPublic ?? true,
        userId: req.user.id,
      },
    });

    res.status(201).json({ playlist, message: 'Playlist created successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create playlist' });
  }
}

export async function updatePlaylist(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const id = String(req.params.id);
    const { title, description, coverUrl, isPublic } = req.body;

    const existing = await db.playlist.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Playlist not found' });
    if (existing.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden. You do not own this playlist.' });
    }

    const updated = await db.playlist.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(coverUrl && { coverUrl }),
        ...(isPublic !== undefined && { isPublic }),
      },
    });

    res.json({ playlist: updated, message: 'Playlist updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update playlist' });
  }
}

export async function deletePlaylist(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const id = String(req.params.id);

    const existing = await db.playlist.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Playlist not found' });
    if (existing.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await db.playlist.delete({ where: { id } });
    res.json({ message: 'Playlist deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete playlist' });
  }
}

export async function addTrackToPlaylist(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const id = String(req.params.id);
    const { song } = req.body;

    if (!song || !song.id) {
      return res.status(400).json({ error: 'Song details with valid id are required.' });
    }

    const playlist = await db.playlist.findUnique({ where: { id } });
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    if (playlist.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
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
    });

    const item = await db.playlistTrack.create({
      data: {
        playlistId: id,
        songId: song.id,
      },
    });

    res.status(201).json({ message: 'Song added to playlist', track: item });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to add track to playlist' });
  }
}

export async function removeTrackFromPlaylist(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const id = String(req.params.id);
    const songId = String(req.params.songId);

    const playlist = await db.playlist.findUnique({ where: { id } });
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    if (playlist.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await db.playlistTrack.delete({
      where: {
        playlistId_songId: {
          playlistId: id,
          songId,
        },
      },
    });

    res.json({ message: 'Song removed from playlist' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to remove track' });
  }
}
