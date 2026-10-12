/**
 * Pre-rendered interview audio manifest.
 *
 * The AI mock interview only ever speaks a fixed, closed set of phrases: the
 * three curated questions and the fixed transition / completion lines. Because
 * nothing spoken is dynamic, these phrases are rendered to static audio clips
 * once (see backend/scripts/generate_interview_audio.mjs) and served from
 * /public/audio/interview/. Playback is resolved by matching the exact phrase
 * text, so any text that is NOT in this manifest transparently falls back to
 * the live TTS proxy / browser speech engine.
 *
 * Keep INTERVIEW_AUDIO texts byte-for-byte identical to the strings used in
 * AIMockInterviewPage.jsx and resumeParser.js. Bump INTERVIEW_AUDIO_VERSION
 * whenever a clip is regenerated so browsers fetch the new file.
 */
export const INTERVIEW_AUDIO_VERSION = '1';
export const INTERVIEW_AUDIO_BASE = '/audio/interview';

export const INTERVIEW_AUDIO = {
  'q-intro-1': {
    text: 'Tell me about yourself.'
  },
  'q-proj-2': {
    text: 'Can you explain one of the projects you have worked on, and what major challenges or difficult situations did you face while developing it?'
  },
  'q-sol-3': {
    text: 'How did you overcome those challenges, and what approach did you take to solve the situation?'
  },
  't-final-silent': {
    text: 'Thank you. That completes our interview questions. I am now compiling your complete evaluation report.'
  },
  't-final-normal': {
    text: 'Thank you for your responses. That completes our mock interview session. I am compiling your final evaluation report now.'
  },
  't-skip': {
    text: 'Question skipped. Let us proceed to the next question.'
  },
  't-no-response': {
    text: 'No verbal response was detected. Let us proceed to the next question.'
  },
  't-excellent': {
    text: 'Thank you. Great explanation of the key technical concepts. Let us move to the next question.'
  },
  't-default': {
    text: 'Thank you for that response. Let us proceed to the next question.'
  }
};

// The three interview question texts, exported so the page can warn (in dev)
// when a generated question drifts away from a pre-rendered clip.
export const INTERVIEW_QUESTION_TEXTS = [
  INTERVIEW_AUDIO['q-intro-1'].text,
  INTERVIEW_AUDIO['q-proj-2'].text,
  INTERVIEW_AUDIO['q-sol-3'].text
];

// Normalize a phrase for matching: lower-case, drop punctuation, collapse spaces.
const normalize = (value) => String(value || '')
  .toLowerCase()
  .replace(/[.,!?;:'"()\-–—]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const TEXT_INDEX = Object.create(null);
Object.keys(INTERVIEW_AUDIO).forEach((key) => {
  TEXT_INDEX[normalize(INTERVIEW_AUDIO[key].text)] = key;
});

/** Resolve a manifest key for a spoken phrase, or null when not pre-rendered. */
export const findInterviewAudioKey = (text) => TEXT_INDEX[normalize(text)] || null;

/** Public URL for a rendered clip (cache-busted by the manifest version). */
export const getInterviewAudioSrc = (key) =>
  `${INTERVIEW_AUDIO_BASE}/${key}.mp3?v=${INTERVIEW_AUDIO_VERSION}`;

/**
 * Resolve a spoken phrase to a playable clip descriptor.
 * @returns {{ key: string, src: string, text: string } | null}
 */
export const getInterviewAudioForText = (text) => {
  const key = findInterviewAudioKey(text);
  if (!key) return null;
  return { key, src: getInterviewAudioSrc(key), text: INTERVIEW_AUDIO[key].text };
};

export default INTERVIEW_AUDIO;
