import { Router } from 'express';
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { isSarvamConfigured, transcribeAudio } from '../services/sarvamService.js';

const router = Router();

const MAX_AUDIO_BYTES = '15mb';
const LANGUAGE_RE = /^([a-z]{2,3}-[A-Z]{2}|unknown)$/;
const MODE_RE = /^(transcribe|translate|verbatim|translit|codemix)$/;

/**
 * POST /api/stt/transcribe
 *
 * Server-side speech-to-text proxy (Sarvam Saaras). The browser records a short
 * audio segment and PUTs the raw bytes here; the provider key never leaves the
 * server. `language_code` is supplied as a query param (default en-IN).
 *
 * This is the fallback STT path used when the on-device/Web Speech API is not
 * available (e.g. Firefox) or fails.
 */
router.post(
  '/transcribe',
  authenticateToken,
  express.raw({ type: ['audio/*', 'application/octet-stream'], limit: MAX_AUDIO_BYTES }),
  async (req, res) => {
    const audio = Buffer.isBuffer(req.body) ? req.body : null;
    if (!audio || audio.length === 0) {
      return res.status(400).json({ success: false, error: 'Audio data is required.' });
    }

    if (!isSarvamConfigured()) {
      return res.status(503).json({ success: false, error: 'Speech-to-text is not configured.' });
    }

    const requested = typeof req.query.language_code === 'string' ? req.query.language_code.trim() : '';
    const languageCode = LANGUAGE_RE.test(requested) ? requested : 'en-IN';
    const requestedMode = typeof req.query.mode === 'string' ? req.query.mode.trim() : '';
    const mode = MODE_RE.test(requestedMode) ? requestedMode : undefined;
    const mimeType = req.headers['content-type'] || 'audio/webm';

    try {
      const { transcript, languageCode: detected } = await transcribeAudio(audio, { languageCode, mimeType, mode });
      return res.json({ success: true, transcript, languageCode: detected });
    } catch (err) {
      console.error('STT transcribe error:', err.message);
      return res.status(502).json({ success: false, error: 'Speech transcription failed.' });
    }
  }
);

export default router;
