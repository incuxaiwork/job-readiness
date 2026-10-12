import { Router } from 'express';
import { getStats, getAnalytics, getPlacementReport, exportResultsCsv } from '../controllers/admin.controller.js';
import {
  listColleges, createCollege, updateCollege,
  listCollegeAdmins, createCollegeAdmin, updateCollegeAdmin,
} from '../controllers/colleges.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

// Admin + college-admin routes. Individual routes below may tighten to 'admin'.
// Tenant scoping is applied inside the controllers via resolveCollegeScope().
router.use(authenticateToken, requireRole('admin', 'college_admin'));

router.get('/stats', getStats);
router.get('/analytics', getAnalytics);
router.get('/reports', getPlacementReport);
router.get('/reports/export', exportResultsCsv);

// College onboarding & credential management — platform super-admin only
router.get('/colleges', requireRole('admin'), listColleges);
router.post('/colleges', requireRole('admin'), createCollege);
router.patch('/colleges/:id', requireRole('admin'), updateCollege);
router.get('/colleges/:id/admins', requireRole('admin'), listCollegeAdmins);
router.post('/colleges/:id/admins', requireRole('admin'), createCollegeAdmin);
router.patch('/colleges/:id/admins/:userId', requireRole('admin'), updateCollegeAdmin);

export default router;
