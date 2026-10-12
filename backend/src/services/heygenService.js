/**
 * HeyGen Interactive Streaming Avatar Service
 * 
 * Handles secure server-side HeyGen session token creation,
 * avatar configuration curation, and concurrency tracking.
 * Permanent API keys are kept strictly on the backend.
 */

// In-memory active session tracker for concurrency auditing
const activeStreamingSessions = new Map();

// Curated avatar & voice presets for JobRecipe AI Interviewer
export const AVATAR_PRESETS = [
  {
    id: 'josh_lite3_20230714',
    name: 'Josh - Senior Tech Lead',
    gender: 'Male',
    previewImage: '/avatars/interviewer_primary.jpg',
    defaultVoiceId: '1bd001e7e50f421d837fb814d45444c1',
    description: 'Calm, authoritative senior engineering interviewer'
  },
  {
    id: 'ann_doctor_standing_up_20240124',
    name: 'Ann - HR & Behavioral Specialist',
    gender: 'Female',
    previewImage: '/avatars/interviewer_primary.jpg',
    defaultVoiceId: '2d5b7986a9d24240ac2b5f7b49466548',
    description: 'Clear, encouraging behavioral and cultural fit interviewer'
  },
  {
    id: 'Wayne_20240711',
    name: 'Wayne - Systems Architect',
    gender: 'Male',
    previewImage: '/avatars/interviewer_primary.jpg',
    defaultVoiceId: '1bd001e7e50f421d837fb814d45444c1',
    description: 'In-depth system design & problem solving interviewer'
  }
];

/**
 * Get public avatar configuration and available interviewer personas.
 */
export const getAvatarConfig = () => {
  const customAvatarId = process.env.HEYGEN_AVATAR_ID || 'josh_lite3_20230714';
  const customVoiceId = process.env.HEYGEN_VOICE_ID || '1bd001e7e50f421d837fb814d45444c1';
  const hasLiveApiKey = Boolean(
    process.env.HEYGEN_API_KEY &&
    process.env.HEYGEN_API_KEY.trim() !== '' &&
    !process.env.HEYGEN_API_KEY.includes('your_heygen_api_key')
  );

  return {
    isConfigured: hasLiveApiKey,
    defaultAvatarId: customAvatarId,
    defaultVoiceId: customVoiceId,
    quality: 'medium', // 'low' | 'medium' | 'high'
    knowledgeEnabled: false,
    sttProvider: 'deepgram',
    presets: AVATAR_PRESETS,
    activeSessionsCount: activeStreamingSessions.size
  };
};

/**
 * Create a secure short-lived HeyGen session token.
 * Calls HeyGen API: POST https://api.heygen.com/v1/streaming.create_token
 *
 * @param {Object} options
 * @param {string} [options.userId] Candidate user ID
 * @param {string} [options.sessionId] Interview session ID
 * @param {boolean} [options.allowMock] Whether mock token is permitted if key is unset
 * @returns {Promise<{success: boolean, token?: string, error?: string, fallbackMode?: boolean, isMock?: boolean}>}
 */
export const createStreamingToken = async ({ userId = 'guest', sessionId = 'session', allowMock = false } = {}) => {
  const apiKey = (process.env.HEYGEN_API_KEY || '').trim();

  // If no API key is configured or it's a placeholder:
  const isKeyPresent = apiKey && !apiKey.includes('your_heygen_api_key') && !apiKey.includes('placeholder');

  if (!isKeyPresent) {
    // If mock mode is explicitly requested or enabled for automated testing / dry-runs:
    if (allowMock || process.env.ALLOW_MOCK_AVATAR === 'true' || process.env.NODE_ENV === 'test') {
      const mockToken = `mock_heygen_token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      activeStreamingSessions.set(sessionId, {
        token: mockToken,
        userId,
        createdAt: Date.now(),
        isMock: true
      });
      return {
        success: true,
        token: mockToken,
        isMock: true,
        avatarId: process.env.HEYGEN_AVATAR_ID || 'josh_lite3_20230714',
        voiceId: process.env.HEYGEN_VOICE_ID || '1bd001e7e50f421d837fb814d45444c1',
        warning: 'Running in simulated avatar token mode (HEYGEN_API_KEY not configured on server).'
      };
    }

    return {
      success: false,
      fallbackMode: true,
      error: 'HeyGen API key is not configured on the server. The interview will proceed seamlessly using the Interactive Animated Avatar and TTS engine.'
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch('https://api.heygen.com/v1/streaming.create_token', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      let parsedError = errorText;
      try {
        const errJson = JSON.parse(errorText);
        parsedError = errJson.message || errJson.error || errorText;
      } catch { }

      console.warn(`[HeyGen Service] create_token failed HTTP ${response.status}:`, parsedError);

      return {
        success: false,
        fallbackMode: true,
        statusCode: response.status,
        error: `HeyGen streaming token creation failed (${response.status}): ${parsedError}. Falling back to animated avatar.`
      };
    }

    const payload = await response.json();
    // HeyGen response structure: { code: 100, data: { token: "..." } }
    const token = payload?.data?.token || payload?.token;

    if (!token) {
      console.warn('[HeyGen Service] Invalid response payload from HeyGen:', payload);
      return {
        success: false,
        fallbackMode: true,
        error: 'HeyGen did not return a valid session token. Falling back to animated avatar.'
      };
    }

    // Register active session for tracking
    activeStreamingSessions.set(sessionId, {
      token,
      userId,
      createdAt: Date.now(),
      isMock: false
    });

    return {
      success: true,
      token,
      isMock: false,
      avatarId: process.env.HEYGEN_AVATAR_ID || 'josh_lite3_20230714',
      voiceId: process.env.HEYGEN_VOICE_ID || '1bd001e7e50f421d837fb814d45444c1'
    };
  } catch (err) {
    console.error('[HeyGen Service] Exception during createStreamingToken:', err.message);
    return {
      success: false,
      fallbackMode: true,
      error: `Network error connecting to HeyGen API: ${err.message}. Falling back to animated avatar.`
    };
  }
};

/**
 * Release an active streaming session from internal tracking when closed.
 */
export const releaseStreamingSession = (sessionId) => {
  if (activeStreamingSessions.has(sessionId)) {
    activeStreamingSessions.delete(sessionId);
    return true;
  }
  return false;
};
