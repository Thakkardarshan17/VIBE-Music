import { Router } from 'express';
import {
  searchMusic,
  getTrending,
  getCharts,
  getNewReleasesList,
  getFeaturedArtists,
  getArtistDetails,
  getFeaturedAlbums,
  getLatest,
  resolveFullTrackEndpoint,
} from '../controllers/musicController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/search', optionalAuth, searchMusic);
router.get('/latest', getLatest);
router.get('/resolve-full', resolveFullTrackEndpoint);
router.get('/trending', getTrending);
router.get('/charts', getCharts);
router.get('/new-releases', getNewReleasesList);
router.get('/artists', getFeaturedArtists);
router.get('/artists/:name', getArtistDetails);
router.get('/albums', getFeaturedAlbums);

export default router;

