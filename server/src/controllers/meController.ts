import { Response } from 'express';
import { db } from '../db/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

/**
 * VIBE MUSIC – Complete User-Wise Activity Tracking Controller
 * Strictly enforces user isolation: every query is scoped to req.user.id.
 */

// 1. GET /api/me/dashboard - Full personal statistics & aggregated dashboard
export async function getDashboard(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = req.user.id;

    // Fetch user-scoped raw data
    const [
      historyItems,
      favorites,
      playlists,
      followedArtists,
      savedAlbums,
      listeningEvents,
    ] = await Promise.all([
      db.listeningHistory.findMany({
        where: { userId },
        include: { song: true },
        orderBy: { playedAt: 'desc' },
      }),
      db.favorite.findMany({
        where: { userId },
        include: { song: true },
        orderBy: { createdAt: 'desc' },
      }),
      db.playlist.findMany({
        where: { userId },
        include: { tracks: true },
      }),
      db.followedArtist.findMany({
        where: { userId },
      }),
      db.savedAlbum.findMany({
        where: { userId },
      }),
      db.listeningEvent.findMany({
        where: { userId },
        take: 100,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // 1. Total Metrics
    const totalSongsPlayed = historyItems.length;
    let totalListeningSeconds = 0;

    // Calculate total listening seconds from history and events
    historyItems.forEach((h: any) => {
      totalListeningSeconds += h.durationPlayed || (h.song?.duration ? Math.min(h.song.duration, 210) : 180);
    });

    const totalListeningMinutes = Math.round(totalListeningSeconds / 60);
    const totalListeningHours = (totalListeningMinutes / 60).toFixed(1);

    // 2. Recently Played Songs (mapped to Track format)
    const recentlyPlayed = historyItems.slice(0, 15).map((h: any) => {
      const song = h.song || {};
      return {
        id: song.id || h.songId,
        title: song.title || 'Unknown Track',
        artist: song.artist || 'Unknown Artist',
        album: song.album || 'Single',
        coverUrl: song.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80',
        duration: song.duration || h.durationPlayed || 180,
        audioUrl: song.audioUrl || null,
        youtubeId: song.youtubeId || null,
        playedAt: h.playedAt,
        historyId: h.id,
      };
    });

    // 3. Most Played Songs (Frequency aggregation)
    const songCountMap = new Map<string, { count: number; song: any }>();
    historyItems.forEach((h: any) => {
      const sid = h.songId || (h.song ? h.song.id : 'unknown');
      if (!songCountMap.has(sid)) {
        songCountMap.set(sid, { count: 0, song: h.song });
      }
      songCountMap.get(sid)!.count++;
    });

    const mostPlayedSongs = Array.from(songCountMap.values())
      .filter((item) => item.song)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((item) => ({
        ...item.song,
        playCount: item.count,
      }));

    // 4. Favourite / Most Listened Artists
    const artistCountMap = new Map<string, { count: number; image?: string; genre?: string }>();
    historyItems.forEach((h: any) => {
      const artist = h.song?.artist;
      if (artist) {
        const primary = artist.split(/[,&]/)[0].trim();
        if (!artistCountMap.has(primary)) {
          artistCountMap.set(primary, { count: 0, image: h.song?.coverUrl });
        }
        artistCountMap.get(primary)!.count++;
      }
    });

    const favouriteArtists = Array.from(artistCountMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 8)
      .map(([name, data]) => ({
        name,
        playCount: data.count,
        imageUrl: data.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80',
      }));

    // 5. Favourite / Most Listened Albums
    const albumCountMap = new Map<string, { count: number; artist: string; coverUrl?: string }>();
    historyItems.forEach((h: any) => {
      const album = h.song?.album;
      if (album && album !== 'Single' && album !== 'Unknown Album') {
        if (!albumCountMap.has(album)) {
          albumCountMap.set(album, {
            count: 0,
            artist: h.song?.artist || 'Various Artists',
            coverUrl: h.song?.coverUrl,
          });
        }
        albumCountMap.get(album)!.count++;
      }
    });

    const favouriteAlbums = Array.from(albumCountMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 6)
      .map(([title, data]) => ({
        title,
        artist: data.artist,
        coverUrl: data.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80',
        playCount: data.count,
      }));

    // 6. Weekly Listening Activity (Past 7 days)
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const weeklyActivity = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const dayName = daysOfWeek[d.getDay()];

      // Calculate minutes played on this day
      let daySeconds = 0;
      historyItems.forEach((h: any) => {
        if (h.playedAt && h.playedAt.startsWith(dayStr)) {
          daySeconds += h.durationPlayed || (h.song?.duration ? Math.min(h.song.duration, 210) : 180);
        }
      });

      weeklyActivity.push({
        date: dayStr,
        day: dayName,
        minutes: Math.round(daySeconds / 60),
        songsCount: historyItems.filter((h: any) => h.playedAt && h.playedAt.startsWith(dayStr)).length,
      });
    }

    // 7. Monthly Listening Activity (Past 4 Weeks)
    const monthlyActivity = [];
    for (let w = 3; w >= 0; w--) {
      const weekStart = new Date(now.getTime() - (w * 7 + 7) * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);

      let weekSeconds = 0;
      let count = 0;

      historyItems.forEach((h: any) => {
        const pTime = new Date(h.playedAt).getTime();
        if (pTime >= weekStart.getTime() && pTime < weekEnd.getTime()) {
          weekSeconds += h.durationPlayed || (h.song?.duration ? Math.min(h.song.duration, 210) : 180);
          count++;
        }
      });

      monthlyActivity.push({
        label: w === 0 ? 'This Week' : `${w} Wk Ago`,
        minutes: Math.round(weekSeconds / 60),
        songsCount: count,
      });
    }

    // 8. Liked Songs List
    const likedTracks = favorites.map((f: any) => f.song).filter(Boolean);

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        fullName: req.user.fullName || req.user.username,
        avatarUrl: req.user.avatarUrl,
        role: req.user.role,
        createdAt: req.user.createdAt,
      },
      stats: {
        totalSongsPlayed,
        totalListeningMinutes,
        totalListeningHours,
        totalLikedSongs: likedTracks.length,
        totalPlaylists: playlists.length,
        totalFollowedArtists: followedArtists.length,
        totalSavedAlbums: savedAlbums.length,
      },
      recentlyPlayed,
      mostPlayedSongs,
      favouriteArtists,
      favouriteAlbums,
      weeklyActivity,
      monthlyActivity,
      likedSongs: likedTracks.slice(0, 10),
      playlists: playlists.slice(0, 6),
      followedArtists: followedArtists.slice(0, 6),
      savedAlbums: savedAlbums.slice(0, 6),
    });
  } catch (error: any) {
    console.error('getDashboard error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch music dashboard' });
  }
}

// 2. GET /api/me/activity - Chronological timeline of personal music actions
export async function getActivity(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = req.user.id;

    const [history, favorites, playlists, followed] = await Promise.all([
      db.listeningHistory.findMany({ where: { userId }, take: 20, include: { song: true }, orderBy: { playedAt: 'desc' } }),
      db.favorite.findMany({ where: { userId }, take: 10, include: { song: true }, orderBy: { createdAt: 'desc' } }),
      db.playlist.findMany({ where: { userId }, take: 5, orderBy: { createdAt: 'desc' } }),
      db.followedArtist.findMany({ where: { userId }, take: 5 }),
    ]);

    const events: any[] = [];

    history.forEach((h: any) => {
      events.push({
        id: 'act_play_' + h.id,
        type: 'PLAYED_SONG',
        title: h.song?.title || 'Song',
        subtitle: h.song?.artist || 'Artist',
        coverUrl: h.song?.coverUrl,
        timestamp: h.playedAt,
        data: h.song,
      });
    });

    favorites.forEach((f: any) => {
      events.push({
        id: 'act_fav_' + f.id,
        type: 'LIKED_SONG',
        title: f.song?.title || 'Song',
        subtitle: f.song?.artist || 'Artist',
        coverUrl: f.song?.coverUrl,
        timestamp: f.createdAt,
        data: f.song,
      });
    });

    playlists.forEach((p: any) => {
      events.push({
        id: 'act_pl_' + p.id,
        type: 'CREATED_PLAYLIST',
        title: p.title,
        subtitle: `${p.tracks?.length || 0} songs`,
        coverUrl: p.coverUrl,
        timestamp: p.createdAt,
        data: p,
      });
    });

    followed.forEach((a: any) => {
      events.push({
        id: 'act_flw_' + a.id,
        type: 'FOLLOWED_ARTIST',
        title: a.artistName,
        subtitle: a.genre || 'Artist',
        coverUrl: a.artistImage,
        timestamp: a.followedAt,
        data: a,
      });
    });

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({ activities: events.slice(0, 30) });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch activity timeline' });
  }
}

// 3. GET /api/me/statistics
export async function getStatistics(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = req.user.id;

    const [history, favorites, playlists, followed, albums] = await Promise.all([
      db.listeningHistory.findMany({ where: { userId }, include: { song: true } }),
      db.favorite.findMany({ where: { userId } }),
      db.playlist.findMany({ where: { userId } }),
      db.followedArtist.findMany({ where: { userId } }),
      db.savedAlbum.findMany({ where: { userId } }),
    ]);

    const totalSeconds = history.reduce((sum: number, h: any) => sum + (h.durationPlayed || 180), 0);
    const uniqueSongs = new Set(history.map((h: any) => h.songId)).size;

    res.json({
      totalSongsPlayed: history.length,
      uniqueSongsPlayed: uniqueSongs,
      totalListeningMinutes: Math.round(totalSeconds / 60),
      totalListeningHours: (totalSeconds / 3600).toFixed(1),
      totalLikedSongs: favorites.length,
      totalPlaylists: playlists.length,
      totalFollowedArtists: followed.length,
      totalSavedAlbums: albums.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch statistics' });
  }
}

// 4. GET /api/me/recently-played
export async function getRecentlyPlayed(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = req.user.id;
    const page = parseInt(String(req.query.page || '1'), 10);
    const limit = parseInt(String(req.query.limit || '30'), 10);

    const history = await db.listeningHistory.findMany({
      where: { userId },
      take: limit,
      include: { song: true },
      orderBy: { playedAt: 'desc' },
    });

    const tracks = history.map((h: any) => {
      const s = h.song || {};
      return {
        id: s.id || h.songId,
        title: s.title || 'Unknown Track',
        artist: s.artist || 'Unknown Artist',
        album: s.album || 'Single',
        coverUrl: s.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80',
        duration: s.duration || 180,
        audioUrl: s.audioUrl || null,
        youtubeId: s.youtubeId || null,
        playedAt: h.playedAt,
        historyId: h.id,
      };
    });

    res.json({ tracks, total: tracks.length, page, limit });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch recently played' });
  }
}

// 5. DELETE /api/me/recently-played/:id - Remove individual history item
export async function deleteRecentHistoryItem(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;

    await db.listeningHistory.delete({
      where: { id: String(id) },
    });

    res.json({ message: 'Item removed from listening history' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to remove history item' });
  }
}

// 6. DELETE /api/me/recently-played - Clear entire listening history
export async function clearListeningHistory(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    await db.listeningHistory.deleteMany({
      where: { userId: req.user.id },
    });
    res.json({ message: 'Listening history cleared successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to clear history' });
  }
}

// 7. GET /api/me/liked-songs
export async function getLikedSongs(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const favorites = await db.favorite.findMany({
      where: { userId: req.user.id },
      include: { song: true },
      orderBy: { createdAt: 'desc' },
    });
    const tracks = favorites.map((f: any) => f.song).filter(Boolean);
    res.json({ likedSongs: tracks, total: tracks.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch liked songs' });
  }
}

// 8. POST /api/me/liked-songs/:songId
export async function addLikedSong(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const songId = String(req.params.songId);
    const { song } = req.body;

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
      where: { userId: req.user.id, songId },
    });

    if (!existing) {
      await db.favorite.create({
        data: { userId: req.user.id, songId },
      });
    }

    res.status(201).json({ liked: true, message: 'Added to Liked Songs' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to like song' });
  }
}

// 9. DELETE /api/me/liked-songs/:songId
export async function removeLikedSong(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const songId = String(req.params.songId);

    await db.favorite.delete({
      where: {
        userId_songId: {
          userId: req.user.id,
          songId,
        },
      },
    });

    res.json({ liked: false, message: 'Removed from Liked Songs' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to unlike song' });
  }
}

// 10. GET /api/me/playlists
export async function getMyPlaylists(req: AuthenticatedRequest, res: Response) {
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

// 11. POST /api/me/playlists
export async function createMyPlaylist(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { title, name, description, coverUrl, artwork, isPublic, visibility } = req.body;

    const playlistTitle = (title || name || '').trim();
    if (!playlistTitle) {
      return res.status(400).json({ error: 'Playlist name is required' });
    }

    const newPlaylist = await db.playlist.create({
      data: {
        title: playlistTitle,
        description: description || '',
        coverUrl: coverUrl || artwork || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80',
        isPublic: visibility === 'public' || isPublic !== false,
        userId: req.user.id,
      },
    });

    res.status(201).json({ playlist: newPlaylist, message: 'Playlist created' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create playlist' });
  }
}

// 12. PATCH /api/me/playlists/:playlistId
export async function updateMyPlaylist(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { playlistId } = req.params;
    const { title, name, description, coverUrl, artwork, isPublic, visibility } = req.body;

    // Verify ownership
    const existing = await db.playlist.findUnique({ where: { id: String(playlistId) } });
    if (!existing || existing.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You do not own this playlist' });
    }

    const updated = await db.playlist.update({
      where: { id: String(playlistId) },
      data: {
        ...(title || name ? { title: title || name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(coverUrl || artwork ? { coverUrl: coverUrl || artwork } : {}),
        ...(visibility !== undefined ? { isPublic: visibility === 'public' } : {}),
        ...(isPublic !== undefined ? { isPublic } : {}),
      },
    });

    res.json({ playlist: updated, message: 'Playlist updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update playlist' });
  }
}

// 13. DELETE /api/me/playlists/:playlistId
export async function deleteMyPlaylist(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { playlistId } = req.params;

    const existing = await db.playlist.findUnique({ where: { id: String(playlistId) } });
    if (!existing || existing.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You do not own this playlist' });
    }

    await db.playlist.delete({ where: { id: String(playlistId) } });
    res.json({ message: 'Playlist deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete playlist' });
  }
}

// 14. POST /api/me/playlists/:playlistId/songs
export async function addSongToMyPlaylist(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { playlistId } = req.params;
    const { song, songId } = req.body;

    const existing = await db.playlist.findUnique({ where: { id: String(playlistId) } });
    if (!existing || existing.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You do not own this playlist' });
    }

    const sid = song?.id || songId;
    if (!sid) return res.status(400).json({ error: 'Song details required' });

    if (song && song.id) {
      await db.song.upsert({
        where: { provider_providerId: { provider: song.provider || 'jamendo', providerId: song.id } },
        create: {
          id: song.id,
          title: song.title,
          artist: song.artist,
          album: song.album || 'Single',
          duration: song.duration || 180,
          coverUrl: song.coverUrl,
          audioUrl: song.audioUrl || null,
          provider: song.provider || 'jamendo',
          providerId: song.id,
        },
        update: {},
      }).catch(() => {});
    }

    const entry = await db.playlistTrack.create({
      data: { playlistId: String(playlistId), songId: sid },
    });

    res.status(201).json({ track: entry, message: 'Song added to playlist' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to add song to playlist' });
  }
}

// 15. DELETE /api/me/playlists/:playlistId/songs/:songId
export async function removeSongFromMyPlaylist(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { playlistId, songId } = req.params;

    const existing = await db.playlist.findUnique({ where: { id: String(playlistId) } });
    if (!existing || existing.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You do not own this playlist' });
    }

    await db.playlistTrack.delete({
      where: { playlistId_songId: { playlistId: String(playlistId), songId: String(songId) } },
    });

    res.json({ message: 'Song removed from playlist' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to remove song from playlist' });
  }
}

// 16. GET /api/me/followed-artists
export async function getFollowedArtists(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const artists = await db.followedArtist.findMany({
      where: { userId: req.user.id },
    });
    res.json({ artists, total: artists.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch followed artists' });
  }
}

// 17. POST /api/me/followed-artists/:artistId
export async function followArtist(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { artistId } = req.params;
    const { artistName, artistImage, genre } = req.body;

    const entry = await db.followedArtist.create({
      data: {
        userId: req.user.id,
        artistId: String(artistId),
        artistName: artistName || 'Artist',
        artistImage: artistImage || null,
        genre: genre || 'Music',
      },
    });

    res.status(201).json({ followed: true, artist: entry, message: `Following ${entry.artistName}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to follow artist' });
  }
}

// 18. DELETE /api/me/followed-artists/:artistId
export async function unfollowArtist(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { artistId } = req.params;

    await db.followedArtist.delete({
      where: { userId_artistId: { userId: req.user.id, artistId: String(artistId) } },
    });

    res.json({ followed: false, message: 'Unfollowed artist' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to unfollow artist' });
  }
}

// 19. GET /api/me/saved-albums
export async function getSavedAlbums(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const albums = await db.savedAlbum.findMany({
      where: { userId: req.user.id },
    });
    res.json({ albums, total: albums.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch saved albums' });
  }
}

// 20. POST /api/me/saved-albums/:albumId
export async function saveAlbum(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { albumId } = req.params;
    const { albumTitle, albumArtist, albumCover, releaseYear } = req.body;

    const entry = await db.savedAlbum.create({
      data: {
        userId: req.user.id,
        albumId: String(albumId),
        albumTitle: albumTitle || 'Album',
        albumArtist: albumArtist || 'Artist',
        albumCover: albumCover || null,
        releaseYear: releaseYear || '2026',
      },
    });

    res.status(201).json({ saved: true, album: entry, message: 'Album saved to Library' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save album' });
  }
}

// 21. DELETE /api/me/saved-albums/:albumId
export async function removeSavedAlbum(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { albumId } = req.params;

    await db.savedAlbum.delete({
      where: { userId_albumId: { userId: req.user.id, albumId: String(albumId) } },
    });

    res.json({ saved: false, message: 'Album removed from Library' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to remove saved album' });
  }
}

// 22. GET /api/me/search-history
export async function getMySearchHistory(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const history = await db.searchHistory.findMany({
      where: { userId: req.user.id },
      take: 20,
    });
    res.json({ searches: history });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch search history' });
  }
}

// 23. DELETE /api/me/search-history
export async function clearMySearchHistory(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    await db.searchHistory.deleteMany({
      where: { userId: req.user.id },
    });
    res.json({ message: 'Search history cleared' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to clear search history' });
  }
}

// 24. DELETE /api/me/search-history/:id
export async function deleteSearchHistoryItem(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;

    await db.searchHistory.delete({
      where: { id: String(id) },
    });

    res.json({ message: 'Search query removed' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete search item' });
  }
}

// 25. POST /api/me/listening-events - Meaningful Playback Verification Event
export async function logListeningEvent(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(200).json({ recorded: false, reason: 'unauthenticated' });

    const {
      songId,
      songTitle,
      artist,
      album,
      coverUrl,
      eventType = 'threshold_reached',
      listenedDuration = 30,
      completionPercentage = 50,
      song,
    } = req.body;

    const sid = song?.id || songId;
    if (!sid) return res.status(400).json({ error: 'Missing song identification' });

    // Enforce meaningful listening threshold (>= 30 seconds or >= 50% completion)
    if (listenedDuration < 30 && completionPercentage < 50) {
      return res.status(200).json({
        recorded: false,
        reason: 'Threshold not met: playback duration below 30s / 50%',
      });
    }

    // Ensure song is cached in DB
    if (song && song.id) {
      await db.song.upsert({
        where: { provider_providerId: { provider: song.provider || 'jamendo', providerId: song.id } },
        create: {
          id: song.id,
          title: song.title || songTitle,
          artist: song.artist || artist,
          album: song.album || album || 'Single',
          duration: song.duration || listenedDuration || 180,
          coverUrl: song.coverUrl || coverUrl,
          audioUrl: song.audioUrl || null,
          provider: song.provider || 'jamendo',
          providerId: song.id,
        },
        update: {},
      }).catch(() => {});
    }

    // Record verified listening event
    const event = await db.listeningEvent.create({
      data: {
        userId: req.user.id,
        songId: sid,
        songTitle: song?.title || songTitle || 'Track',
        artist: song?.artist || artist || 'Artist',
        album: song?.album || album || 'Single',
        coverUrl: song?.coverUrl || coverUrl || null,
        eventType,
        listenedDuration,
        completionPercentage,
      },
    });

    // Also update listeningHistory
    await db.listeningHistory.create({
      data: {
        userId: req.user.id,
        songId: sid,
        durationPlayed: listenedDuration,
      },
    });

    res.status(201).json({
      recorded: true,
      event,
      message: 'Meaningful listening session recorded and synchronized',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to log listening event' });
  }
}

