import { Router } from 'express';
import { 
  submitAssessment, 
  getAllSubmissions, 
  getMySubmissions,
  logProctoringEvent,
  getProctoringEvents
} from '../controllers/submissions.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

// Proctoring telemetry: authenticated candidates only (owner or authorized admin reads;
// object-level scoping is enforced inside getProctoringEvents).
router.post('/proctoring-event', authenticateToken, logProctoringEvent);
router.get('/proctoring-events/:attemptId', authenticateToken, getProctoringEvents);

// All other submission endpoints require standard authentication
router.use(authenticateToken);

// Candidate / Admin test attempt submission
router.post('/', submitAssessment);
router.get('/my', getMySubmissions);

// Admin-only view all submissions
router.get('/', requireRole('admin'), getAllSubmissions);

export default router;


