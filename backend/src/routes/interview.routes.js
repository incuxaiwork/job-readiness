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
  updateInterviewSettings,
  createAvatarToken,
  getAvatarSettings,
  releaseAvatarSession
} from '../controllers/interview.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

// Public, non-sensitive: interview configuration (lock state, question count).
router.get('/settings', getInterviewSettings);

// Every other interview endpoint returns or mutates candidate interview data and
// therefore requires authentication. Admin endpoints additionally require the
// platform super-admin role.
router.use(authenticateToken);

// Session endpoints
router.post('/session', createSession);
// Platform super-admin only — exposes every candidate's interview session across all colleges
router.get('/admin/sessions', requireRole('admin'), getAdminSessions);
router.post('/admin/settings', requireRole('admin'), updateInterviewSettings);
router.get('/session/latest/user', getLatestSession);
router.get('/session/:id', getSession);
router.get('/session/:id/questions', getSessionQuestions);
router.post('/session/:id/telemetry', saveTelemetryBatch);
router.post('/session/:id/complete', completeInterview);
router.get('/session/:id/analysis', getSessionAnalysis);

// Question answer endpoint
router.post('/question/:id/answer', saveQuestionAnswer);

// HeyGen streaming AI avatar endpoints (token is minted server-side; key never leaves backend)
router.post('/avatar/token', createAvatarToken);
router.get('/avatar/config', getAvatarSettings);
router.post('/avatar/release', releaseAvatarSession);

// Real-time frame processing
router.post('/analyze-frame', analyzeFrame);

export default router;
