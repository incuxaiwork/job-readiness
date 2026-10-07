import { Router } from 'express';
import {
  createSession,
  getSession,
  getLatestSession,
  getSessionQuestions,
  saveTelemetryBatch,
  saveQuestionAnswer,
  completeInterview,
  getSessionAnalysis,
  analyzeFrame,
  getAdminSessions,
  getInterviewSettings,
  updateInterviewSettings
} from '../controllers/interview.controller.js';
import { optionalAuthToken } from '../middleware/auth.js';

const router = Router();

// Allow authenticated candidate session attribution or guest mode
router.use(optionalAuthToken);

// Session endpoints
router.post('/session', createSession);
router.get('/admin/sessions', getAdminSessions);
router.get('/settings', getInterviewSettings);
router.post('/admin/settings', updateInterviewSettings);
router.get('/session/latest/user', getLatestSession);
router.get('/session/:id', getSession);
router.get('/session/:id/questions', getSessionQuestions);
router.post('/session/:id/telemetry', saveTelemetryBatch);
router.post('/session/:id/complete', completeInterview);
router.get('/session/:id/analysis', getSessionAnalysis);

// Question answer endpoint
router.post('/question/:id/answer', saveQuestionAnswer);

// Real-time frame processing
router.post('/analyze-frame', analyzeFrame);

export default router;
