import { Router } from 'express';
import { getAllQuestions, createQuestion, updateQuestion, deleteQuestion } from '../controllers/questions.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

// All question endpoints require authentication
router.use(authenticateToken);

// Candidate & Admin can read questions
router.get('/', getAllQuestions);

// Admin-only question bank mutations
router.post('/', requireRole('admin'), createQuestion);
router.put('/:id', requireRole('admin'), updateQuestion);
router.delete('/:id', requireRole('admin'), deleteQuestion);

export default router;

