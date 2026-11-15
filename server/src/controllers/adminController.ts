import { Response } from 'express';
import { db } from '../db/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ENV } from '../config/env.js';

export async function getAdminDashboard(req: AuthenticatedRequest, res: Response) {
  try {
    const [totalUsers, totalPlaylists, totalSongs, totalPlays, dbHealth] = await Promise.all([
      db.user.count(),
      db.playlist.count(),
      db.song.count(),
      db.listeningHistory.count(),
      db.checkHealth(),
    ]);

    const providers = await db.musicProvider.findMany();
    const recentUsers = await db.user.findMany({ take: 10 });

    const systemInfo = {
      nodeVersion: process.version,
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      environment: ENV.NODE_ENV,
      port: ENV.PORT,
    };

    res.json({
      stats: {
        totalUsers,
        totalPlaylists,
        totalIndexedTracks: totalSongs,
        totalPlays,
      },
      providers: providers.map((p: any) => ({
        ...p,
        configured:
          p.name === 'jamendo' ? !!ENV.JAMENDO_CLIENT_ID :
          p.name === 'youtube' ? (ENV.YOUTUBE_API_KEY ? 'API Key Configured' : 'Public & IFrame Player Ready') :
          p.name === 'spotify' ? (ENV.SPOTIFY_CLIENT_ID ? 'Configured' : 'Awaiting Client Secret') :
          'Active (Zero-Config Global CDN)',
      })),
      database: dbHealth,
      system: systemInfo,
      recentUsers: recentUsers.slice(0, 8),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch admin analytics' });
  }
}

export async function getAllUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const users = await db.user.findMany();
    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to list users' });
  }
}

export async function updateProviderStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const name = String(req.params.name);
    const { isEnabled, status } = req.body;

    const updated = await db.musicProvider.update({
      where: { name },
      data: {
        ...(isEnabled !== undefined && { isEnabled }),
        ...(status && { status }),
      },
    });

    res.json({ provider: updated, message: `Provider ${name} updated.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update provider' });
  }
}
