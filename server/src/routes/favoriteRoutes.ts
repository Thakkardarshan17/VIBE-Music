import { Router } from 'express';
import { getFavorites, toggleFavorite, checkFavorite } from '../controllers/favoriteController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', getFavorites);
router.post('/:songId', toggleFavorite);
router.get('/check/:songId', checkFavorite);

export default router;

