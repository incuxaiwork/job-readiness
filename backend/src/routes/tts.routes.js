import { Router } from 'express';
import { Readable } from 'stream';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1/text-to-speech';
const DEFAULT_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';
const MAX_TEXT_LEN = 1200;

/**
 * POST /api/tts/speak
 *
 * Server-side proxy for ElevenLabs text-to-speech. The API key lives ONLY in the
 * server environment (ELEVENLABS_API_KEY) and is never shipped to the browser.
 * Returns an audio/mpeg stream. When no key is configured the route responds 503
 * so the frontend can fall back to the browser Web Speech API.
 */
router.post('/speak', authenticateToken, async (req, res) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ success: false, error: 'Text-to-speech is not configured.' });
  }

  const { text, voiceId } = req.body || {};
  if (typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ success: false, error: 'text is required.' });
  }
  if (text.length > MAX_TEXT_LEN) {
    return res.status(400).json({ success: false, error: 'text is too long.' });
  }

  // Strict voice-id allowlist to prevent URL/path injection into the upstream URL.
  const voice = (typeof voiceId === 'string' && voiceId.trim()) ? voiceId.trim() : DEFAULT_VOICE_ID;
  if (!/^[A-Za-z0-9]{10,40}$/.test(voice)) {
    return res.status(400).json({ success: false, error: 'Invalid voice id.' });
  }

  try {
    const upstream = await fetch(`${ELEVENLABS_BASE}/${voice}/stream`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.82,
          style: 0.25,
          use_speaker_boost: true,
        },
      }),
    });

    if (!upstream.ok || !upstream.body) {
      return res.status(502).json({ success: false, error: 'Speech synthesis failed.' });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    Readable.fromWeb(upstream.body).pipe(res);
  } catch (err) {
    console.error('TTS proxy error:', err.message);
    return res.status(502).json({ success: false, error: 'Speech synthesis unavailable.' });
  }
});

export default router;
