import { Router } from 'express';
import { getAdminDashboard, getAllUsers, updateProviderStatus } from '../controllers/adminController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/dashboard', getAdminDashboard);
router.get('/users', getAllUsers);
router.put('/providers/:name', updateProviderStatus);

export default router;

