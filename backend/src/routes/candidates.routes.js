import { Router } from 'express';
import { 
  getAllCandidates, 
  getCandidateById, 
  updateCandidate, 
  deleteCandidate, 
  getCandidateSubmissions,
  getCompanyEligibilityCriteria,
  updateAcademicMarks,
  resetCandidateAttempt
} from '../controllers/candidates.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { requireSelfOrAdmin } from '../middleware/ownership.js';

const router = Router();

// Company eligibility criteria (public catalog)
router.get('/company-eligibility/criteria', getCompanyEligibilityCriteria);

// All candidate routes below require authentication
router.use(authenticateToken);

// Admin-only roster, deletion & attempt reset
router.get('/', requireRole('admin'), getAllCandidates);
router.delete('/:id', requireRole('admin'), deleteCandidate);
router.post('/:id/reset-attempt', requireRole('admin'), resetCandidateAttempt);

// Candidate details (strictly accessible by profile owner or admin - IDOR guarded)
router.get('/:id', requireSelfOrAdmin, getCandidateById);
router.put('/:id', requireSelfOrAdmin, updateCandidate);
router.put('/:id/academic-marks', requireSelfOrAdmin, updateAcademicMarks);
router.get('/:id/submissions', requireSelfOrAdmin, getCandidateSubmissions);

export default router;

