/**
 * Pre-rendered interview audio generator.
 *
 * The mock interview only ever speaks a fixed set of phrases (3 questions +
 * transition/completion lines). This script renders each phrase to a static
 * MP3 via Sarvam (Bulbul) so the app never needs live TTS for them.
 *
 * Run once (from the backend dir so .env loads), then commit the output:
 *   node scripts/generate_interview_audio.mjs [--force]
 *
 * Env (backend/.env):
 *   SARVAM_API_KEY        (required)
 *   SARVAM_VOICE_ID       (default: shubh)
 *   SARVAM_LANGUAGE_CODE  (default: en-IN)
 *   SARVAM_TTS_MODEL      (default: bulbul:v3)
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import {
  INTERVIEW_AUDIO,
  INTERVIEW_AUDIO_VERSION
} from '../../frontend/src/data/interviewAudioManifest.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(BACKEND_DIR, '..');
const OUTPUT_DIR = path.join(REPO_ROOT, 'frontend', 'public', 'audio', 'interview');

// Prefer backend/.env regardless of the caller's cwd.
dotenv.config({ path: path.join(BACKEND_DIR, '.env') });
dotenv.config();

const API_KEY = process.env.SARVAM_API_KEY;
const VOICE_ID = process.env.SARVAM_VOICE_ID || 'shubh';
const LANGUAGE_CODE = process.env.SARVAM_LANGUAGE_CODE || 'en-IN';
const MODEL = process.env.SARVAM_TTS_MODEL || 'bulbul:v3';
const STREAM_ENDPOINT = 'https://api.sarvam.ai/text-to-speech/stream';
const FORCE = process.argv.includes('--force');

if (!API_KEY) {
  console.error('ERROR: SARVAM_API_KEY is not set (backend/.env).');
  console.error('Create a key at https://dashboard.sarvam.ai and add: SARVAM_API_KEY=...');
  process.exit(1);
}

// Sarvam's docs use both `language_code` and `target_language_code`; try both.
const renderPhrase = async (text, languageParam) => {
  const response = await fetch(STREAM_ENDPOINT, {
    method: 'POST',
    headers: {
      'api-subscription-key': API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg'
    },
    body: JSON.stringify({
      text,
      [languageParam]: LANGUAGE_CODE,
      speaker: VOICE_ID,
      model: MODEL,
      output_audio_codec: 'mp3'
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    const err = new Error(`HTTP ${response.status} ${detail.slice(0, 300)}`);
    err.status = response.status;
    throw err;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length === 0) throw new Error('Empty audio response');
  return buffer;
};

const renderWithFallback = async (text) => {
  try {
    return await renderPhrase(text, 'language_code');
  } catch (err) {
    if (err.status !== 400 && err.status !== 422) throw err;
    return await renderPhrase(text, 'target_language_code');
  }
};

const main = async () => {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`Sarvam TTS -> ${path.relative(REPO_ROOT, OUTPUT_DIR)}`);
  console.log(`voice=${VOICE_ID}  lang=${LANGUAGE_CODE}  model=${MODEL}  version=${INTERVIEW_AUDIO_VERSION}`);

  const keys = Object.keys(INTERVIEW_AUDIO);
  let written = 0;
  let skipped = 0;

  for (const key of keys) {
    const filePath = path.join(OUTPUT_DIR, `${key}.mp3`);
    if (!FORCE && fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
      skipped += 1;
      console.log(`  = ${key}.mp3 (exists; --force to regenerate)`);
      continue;
    }

    try {
      const audio = await renderWithFallback(INTERVIEW_AUDIO[key].text);
      fs.writeFileSync(filePath, audio);
      const hash = crypto.createHash('sha1').update(audio).digest('hex').slice(0, 8);
      written += 1;
      console.log(`  + ${key}.mp3 (${audio.length} bytes, ${hash})`);
    } catch (err) {
      console.error(`  ! ${key}: ${err.message}`);
      process.exitCode = 1;
    }
  }

  console.log(`Done. ${written} written, ${skipped} skipped, ${keys.length} total.`);
  console.log('Served from /audio/interview/. Bump INTERVIEW_AUDIO_VERSION when regenerating.');
};

await main();
