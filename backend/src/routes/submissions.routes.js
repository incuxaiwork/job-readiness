import { Router } from 'express';
import { 
  submitAssessment, 
  getAllSubmissions, 
  getMySubmissions,
  logProctoringEvent,
  getProctoringEvents
} from '../controllers/submissions.controller.js';
import { authenticateToken, optionalAuthToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

// Proctoring telemetry logs (support active assessment sessions & optional token)
router.post('/proctoring-event', optionalAuthToken, logProctoringEvent);
router.get('/proctoring-events/:attemptId', optionalAuthToken, getProctoringEvents);

// All other submission endpoints require standard authentication
router.use(authenticateToken);

// Candidate / Admin test attempt submission
router.post('/', submitAssessment);
router.get('/my', getMySubmissions);

// Admin-only view all submissions
router.get('/', requireRole('admin'), getAllSubmissions);

export default router;


