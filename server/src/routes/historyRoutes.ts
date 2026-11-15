import { Router } from 'express';
import { getListeningHistory, logTrackPlay, getSearchHistory } from '../controllers/historyController.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, getListeningHistory);
router.post('/', optionalAuth, logTrackPlay);
router.get('/search', optionalAuth, getSearchHistory);

export default router;

