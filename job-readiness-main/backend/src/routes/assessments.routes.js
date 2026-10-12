import { Router } from 'express';
import { 
  getAllAssessments, 
  getAssessmentById, 
  createAssessment, 
  updateAssessment, 
  deleteAssessment,
  getAssessmentQuestions,
  addQuestionsToAssessment,
  removeQuestionFromAssessment
} from '../controllers/assessments.controller.js';
import {
  getAssessmentSections,
  replaceAssessmentSections,
  startAssessmentAttempt
} from '../controllers/sectionsAttempts.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

// All assessment endpoints require authentication
router.use(authenticateToken);

// Candidate & Admin can view assessments
router.get('/', getAllAssessments);
router.get('/:id', getAssessmentById);
router.get('/:id/questions', getAssessmentQuestions);
router.get('/:id/sections', getAssessmentSections);
router.post('/:id/attempt/start', startAssessmentAttempt);

// Admin-only management endpoints
router.post('/', requireRole('admin'), createAssessment);
router.put('/:id', requireRole('admin'), updateAssessment);
router.delete('/:id', requireRole('admin'), deleteAssessment);

// Manage questions linked to an assessment
router.post('/:id/questions', requireRole('admin'), addQuestionsToAssessment);
router.delete('/:id/questions/:questionId', requireRole('admin'), removeQuestionFromAssessment);

// Admin: define sections (replace-all upsert with question assignments)
router.put('/:id/sections', requireRole('admin'), replaceAssessmentSections);

export default router;

