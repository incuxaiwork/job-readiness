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
import { requireSelfOrAdmin, requireCandidateReadAccess } from '../middleware/ownership.js';

const router = Router();

// Company eligibility criteria (public catalog)
router.get('/company-eligibility/criteria', getCompanyEligibilityCriteria);

// All candidate routes below require authentication
router.use(authenticateToken);

// Admin + college-admin roster (scoped in controller); deletion & reset stay super-admin only
router.get('/', requireRole('admin', 'college_admin'), getAllCandidates);
router.delete('/:id', requireRole('admin'), deleteCandidate);
router.post('/:id/reset-attempt', requireRole('admin'), resetCandidateAttempt);

// Candidate details (owner, platform admin, or same-college admin - IDOR guarded)
router.get('/:id', requireCandidateReadAccess, getCandidateById);
router.put('/:id', requireSelfOrAdmin, updateCandidate);
router.put('/:id/academic-marks', requireSelfOrAdmin, updateAcademicMarks);
router.get('/:id/submissions', requireCandidateReadAccess, getCandidateSubmissions);

export default router;

