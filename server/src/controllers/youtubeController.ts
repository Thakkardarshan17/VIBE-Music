import { Request, Response } from 'express';
import { youtubeService } from '../services/youtubeService.js';

export const youtubeController = {
  /**
   * GET /api/youtube/search?q=&filter=&pageToken=&maxResults=
   */
  async search(req: Request, res: Response) {
    try {
      const q = req.query.q as string;
      const filter = (req.query.filter as string) || 'all';
      const pageToken = req.query.pageToken as string | undefined;
      const maxResults = req.query.maxResults ? parseInt(req.query.maxResults as string, 10) : 25;

      if (!q || !q.trim()) {
        return res.status(400).json({ error: 'Search query parameter "q" is required.' });
      }

      const results = await youtubeService.search(q.trim(), filter, pageToken, maxResults);
      return res.json(results);
    } catch (err: any) {
      console.error('[YouTube Controller] search error:', err?.message);
      return res.status(500).json({
        error: err?.message || 'Failed to search YouTube.',
        quotaExceeded: err?.message?.includes('quota') || err?.response?.data?.error?.code === 403,
      });
    }
  },

  /**
   * GET /api/youtube/video/:videoId
   */
  async getVideo(req: Request, res: Response) {
    try {
      const videoId = String(req.params.videoId || '');
      if (!videoId) {
        return res.status(400).json({ error: 'Parameter "videoId" is required.' });
      }

      const video = await youtubeService.getVideoDetails(videoId);
      if (!video) {
        return res.status(404).json({ error: `Video with ID ${videoId} not found.` });
      }

      return res.json(video);
    } catch (err: any) {
      console.error('[YouTube Controller] getVideo error:', err?.message);
      return res.status(500).json({ error: err?.message || 'Failed to get video details.' });
    }
  },

  /**
   * GET /api/youtube/trending?regionCode=&pageToken=&maxResults=
   */
  async getTrending(req: Request, res: Response) {
    try {
      const regionCode = (req.query.regionCode as string) || 'IN';
      const pageToken = req.query.pageToken as string | undefined;
      const maxResults = req.query.maxResults ? parseInt(req.query.maxResults as string, 10) : 25;

      const results = await youtubeService.getTrending(regionCode, maxResults, pageToken);
      return res.json(results);
    } catch (err: any) {
      console.error('[YouTube Controller] getTrending error:', err?.message);
      return res.status(500).json({ error: err?.message || 'Failed to get trending YouTube videos.' });
    }
  },

  /**
   * GET /api/youtube/playlist/:playlistId?pageToken=&maxResults=
   */
  async getPlaylist(req: Request, res: Response) {
    try {
      const playlistId = String(req.params.playlistId || '');
      const pageToken = req.query.pageToken as string | undefined;
      const maxResults = req.query.maxResults ? parseInt(req.query.maxResults as string, 10) : 25;

      if (!playlistId) {
        return res.status(400).json({ error: 'Parameter "playlistId" is required.' });
      }

      const results = await youtubeService.getPlaylistVideos(playlistId, pageToken, maxResults);
      return res.json(results);
    } catch (err: any) {
      console.error('[YouTube Controller] getPlaylist error:', err?.message);
      return res.status(500).json({ error: err?.message || 'Failed to get playlist videos.' });
    }
  },
};
