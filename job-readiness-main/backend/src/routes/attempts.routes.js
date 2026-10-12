import { Router } from 'express';
import {
  saveAnswer,
  completeSection,
  submitAssessmentAttempt,
  getAttemptStatus
} from '../controllers/sectionsAttempts.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.post('/:attemptId/answers', saveAnswer);
router.post('/:attemptId/section/complete', completeSection);
router.post('/:attemptId/submit', submitAssessmentAttempt);
router.get('/:attemptId/status', getAttemptStatus);

export default router;
