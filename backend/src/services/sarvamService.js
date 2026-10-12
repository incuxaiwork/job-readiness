/**
 * Sarvam AI service — Bulbul text-to-speech and Saaras speech-to-text.
 *
 * The SARVAM_API_KEY lives ONLY in the server environment and is never exposed
 * to the browser: the frontend talks to our own /api/tts and /api/stt proxies.
 *
 * Env (backend/.env):
 *   SARVAM_API_KEY        (required to enable)
 *   SARVAM_VOICE_ID       (TTS speaker; default: shubh)
 *   SARVAM_LANGUAGE_CODE  (BCP-47; default: en-IN)
 *   SARVAM_TTS_MODEL      (default: bulbul:v3)
 *   SARVAM_STT_MODEL      (optional; omit to use Sarvam's default Saaras model)
 */
const TTS_ENDPOINT = 'https://api.sarvam.ai/text-to-speech/stream';
const STT_ENDPOINT = 'https://api.sarvam.ai/speech-to-text';

const DEFAULT_VOICE_ID = 'shubh';
const DEFAULT_LANGUAGE_CODE = 'en-IN';
const DEFAULT_TTS_MODEL = 'bulbul:v3';

const apiKey = () => process.env.SARVAM_API_KEY;
const voiceId = () => process.env.SARVAM_VOICE_ID || DEFAULT_VOICE_ID;
const ttsModel = () => process.env.SARVAM_TTS_MODEL || DEFAULT_TTS_MODEL;
const defaultLanguageCode = () => process.env.SARVAM_LANGUAGE_CODE || DEFAULT_LANGUAGE_CODE;

const EXT_BY_MIME = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mp4': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/aac': 'aac',
  'audio/flac': 'flac',
};

export const isSarvamConfigured = () => Boolean(apiKey());

const notConfigured = () => {
  const err = new Error('Sarvam is not configured.');
  err.code = 'NOT_CONFIGURED';
  return err;
};

/**
 * Synthesize speech via Sarvam Bulbul.
 * Returns { audio: Buffer, contentType: 'audio/mpeg' }.
 */
export const synthesizeSpeech = async (text, { languageCode } = {}) => {
  if (!apiKey()) throw notConfigured();

  const lang = languageCode || defaultLanguageCode();
  const payload = (languageField) => JSON.stringify({
    text,
    [languageField]: lang,
    speaker: voiceId(),
    model: ttsModel(),
    output_audio_codec: 'mp3',
  });

  const request = (languageField) => fetch(TTS_ENDPOINT, {
    method: 'POST',
    headers: {
      'api-subscription-key': apiKey(),
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: payload(languageField),
  });

  // Sarvam's docs use both `language_code` and `target_language_code`.
  let response = await request('language_code');
  if (response.status === 400 || response.status === 422) {
    response = await request('target_language_code');
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    const err = new Error(`Sarvam TTS failed (${response.status}): ${detail.slice(0, 300)}`);
    err.status = response.status;
    throw err;
  }

  const arrayBuffer = await response.arrayBuffer();
  return { audio: Buffer.from(arrayBuffer), contentType: 'audio/mpeg' };
};

/**
 * Transcribe a short audio clip via Sarvam Saaras.
 * `audio` is a Buffer; pass the original MIME type so Sarvam decodes it.
 * Returns { transcript, languageCode }.
 */
export const transcribeAudio = async (audio, { languageCode, mimeType = 'audio/webm', filename } = {}) => {
  if (!apiKey()) throw notConfigured();

  const lang = languageCode || defaultLanguageCode();
  const type = String(mimeType).split(';')[0].trim() || 'audio/webm';
  const name = filename || `audio.${EXT_BY_MIME[type] || 'webm'}`;

  const form = new FormData();
  form.append('file', new Blob([audio], { type }), name);
  form.append('language_code', lang);
  if (process.env.SARVAM_STT_MODEL) form.append('model', process.env.SARVAM_STT_MODEL);

  const response = await fetch(STT_ENDPOINT, {
    method: 'POST',
    headers: {
      'api-subscription-key': apiKey(),
      'Accept': 'application/json',
    },
    body: form,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    const err = new Error(`Sarvam STT failed (${response.status}): ${detail.slice(0, 300)}`);
    err.status = response.status;
    throw err;
  }

  const data = await response.json().catch(() => ({}));
  return {
    transcript: typeof data.transcript === 'string' ? data.transcript.trim() : '',
    languageCode: data.language_code || lang,
  };
};
