import { Router } from 'express';
import {
  getLiveSuggestions,
  searchAll,
  getTrendingSearches,
  getSearchHistory,
  saveSearchHistory,
  clearSearchHistory,
} from '../controllers/searchController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/suggestions', getLiveSuggestions);
router.get('/trending', getTrendingSearches);
router.get('/history', optionalAuth, getSearchHistory);
router.post('/history', optionalAuth, saveSearchHistory);
router.delete('/history', optionalAuth, clearSearchHistory);
router.get('/', optionalAuth, searchAll);

export default router;

