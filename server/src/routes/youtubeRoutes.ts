import { Router } from 'express';
import { youtubeController } from '../controllers/youtubeController.js';

const router = Router();

// GET /api/youtube/search?q=&filter=&pageToken=&maxResults=
router.get('/search', youtubeController.search);

// GET /api/youtube/trending?regionCode=&pageToken=&maxResults=
router.get('/trending', youtubeController.getTrending);

// GET /api/youtube/video/:videoId
router.get('/video/:videoId', youtubeController.getVideo);

// GET /api/youtube/playlist/:playlistId?pageToken=&maxResults=
router.get('/playlist/:playlistId', youtubeController.getPlaylist);

export default router;
