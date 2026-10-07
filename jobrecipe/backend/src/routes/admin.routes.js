import { Router } from 'express';
import { getStats, getAnalytics, getPlacementReport } from '../controllers/admin.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

// All admin routes require admin role
router.use(authenticateToken, requireRole('admin'));

router.get('/stats', getStats);
router.get('/analytics', getAnalytics);
router.get('/reports', getPlacementReport);

export default router;
