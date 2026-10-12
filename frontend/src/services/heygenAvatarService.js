import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskType,
  TaskMode
} from '@heygen/streaming-avatar';
import { api } from './api';

/**
 * HeyGen Interactive Streaming Avatar Client Service
 * 
 * Manages the WebRTC connection lifecycle, event binding, speech dispatch,
 * and graceful fallback handling for the AI interviewer.
 */

class HeyGenAvatarService {
  constructor() {
    this.avatar = null;
    this.mediaStream = null;
    this.sessionId = null;
    this.status = 'idle'; // 'idle' | 'connecting' | 'connected' | 'speaking' | 'error' | 'disconnected'
    this.isConnecting = false;
    this.listeners = new Map();
  }

  /**
   * Subscribe to avatar service events
   * Supported: 'stream_ready', 'start_talking', 'stop_talking', 'disconnected', 'status_change', 'error'
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => {
        try { cb(data); } catch (e) { console.warn(`Error in listener for ${event}:`, e); }
      });
    }
  }

  setStatus(newStatus, detail = null) {
    this.status = newStatus;
    this.emit('status_change', { status: newStatus, detail });
  }

  /**
   * Initialize and start a streaming avatar session
   */
  async startSession({
    sessionId = null,
    avatarId = null,
    voiceId = null,
    quality = AvatarQuality.Medium,
    allowMock = false
  } = {}) {
    // Prevent duplicate concurrent initialization
    if (this.isConnecting) {
      console.warn('[HeyGen Service] Already connecting, ignoring duplicate start request.');
      return { success: false, reason: 'ALREADY_CONNECTING' };
    }

    if (this.status === 'connected' && this.avatar) {
      console.log('[HeyGen Service] Session is already active and connected.');
      return { success: true, alreadyConnected: true, mediaStream: this.mediaStream };
    }

    this.isConnecting = true;
    this.setStatus('connecting', 'Requesting secure session token...');

    try {
      // 1. Request temporary short-lived session token from backend
      const res = await api.interview.getAvatarToken({
        sessionId: sessionId || `isess_${Date.now()}`,
        allowMock
      });

      if (!res.ok && !res.success) {
        throw new Error(res.error || 'Failed to obtain session token from backend.');
      }

      if (res.fallbackMode) {
        this.setStatus('fallback', res.error || 'HeyGen API key not configured.');
        this.isConnecting = false;
        return {
          success: false,
          fallbackMode: true,
          error: res.error
        };
      }

      const token = res.token || res.data?.token;
      if (!token) {
        throw new Error('No streaming token returned by server.');
      }

      // If mock token returned (e.g. testing mode)
      if (res.isMock) {
        console.info('[HeyGen Service] Mock token detected. Falling back to animated avatar & browser speech.');
        this.sessionId = sessionId;
        this.isMock = true;
        this.avatar = null;
        this.status = 'fallback';
        this.isConnecting = false;
        this.setStatus('fallback', 'Mock Mode (Using Animated Avatar & Browser Voice)');
        return {
          success: false,
          fallbackMode: true,
          isMock: true,
          token
        };
      }

      // 2. Instantiate HeyGen StreamingAvatar SDK
      this.setStatus('connecting', 'Establishing WebRTC stream with HeyGen...');
      const avatarInstance = new StreamingAvatar({ token });
      this.avatar = avatarInstance;
      this.sessionId = sessionId;

      // 3. Register SDK event listeners
      avatarInstance.on(StreamingEvents.STREAM_READY, (event) => {
        console.log('[HeyGen Service] STREAM_READY event received:', event.detail);
        this.mediaStream = event.detail;
        this.setStatus('connected', 'WebRTC stream connected and ready');
        this.emit('stream_ready', event.detail);
      });

      avatarInstance.on(StreamingEvents.AVATAR_START_TALKING, (event) => {
        this.setStatus('speaking');
        this.emit('start_talking', event);
      });

      avatarInstance.on(StreamingEvents.AVATAR_STOP_TALKING, (event) => {
        this.setStatus('connected');
        this.emit('stop_talking', event);
      });

      avatarInstance.on(StreamingEvents.STREAM_DISCONNECTED, (event) => {
        console.warn('[HeyGen Service] STREAM_DISCONNECTED event received');
        this.setStatus('disconnected', 'Stream disconnected from server');
        this.emit('disconnected', event);
        this.cleanup();
      });

      // 4. Start avatar stream with parameters
      const resolvedAvatarId = avatarId || res.avatarId || 'josh_lite3_20230714';
      const resolvedVoiceId = voiceId || res.voiceId || '1bd001e7e50f421d837fb814d45444c1';

      const sessionInfo = await avatarInstance.createStartAvatar({
        quality: quality || AvatarQuality.Medium,
        avatarName: resolvedAvatarId,
        voice: {
          voiceId: resolvedVoiceId,
          rate: 1.0
        },
        language: 'en'
      });

      this.isConnecting = false;
      return {
        success: true,
        sessionInfo,
        avatarId: resolvedAvatarId,
        voiceId: resolvedVoiceId
      };
    } catch (err) {
      console.error('[HeyGen Service] Failed to initialize streaming avatar:', err);
      this.isConnecting = false;
      this.setStatus('error', err.message || 'Stream connection failed');
      this.emit('error', err);
      this.cleanup();

      return {
        success: false,
        error: err.message || 'Failed to connect to HeyGen avatar service.',
        fallbackMode: true
      };
    }
  }

  /**
   * Speak text through the avatar
   */
  async speak(text, onFinished = null) {
    if (!text || !text.trim()) {
      onFinished?.();
      return;
    }

    if (!this.avatar || (this.status !== 'connected' && this.status !== 'speaking')) {
      console.warn('[HeyGen Service] speak() called but avatar is not connected. Throwing for TTS fallback.');
      throw new Error('HeyGen avatar is not connected or active');
    }

    try {
      let finishedCalled = false;
      const handleStop = () => {
        if (!finishedCalled) {
          finishedCalled = true;
          this.off('stop_talking', handleStop);
          onFinished?.();
        }
      };

      this.on('stop_talking', handleStop);

      // Safety timeout in case stop_talking event is missed
      const words = text.trim().split(/\s+/).length;
      const estimatedMs = Math.max(3000, Math.min(45000, Math.round((words / 2.2) * 1000) + 2000));
      setTimeout(() => {
        if (!finishedCalled) {
          finishedCalled = true;
          this.off('stop_talking', handleStop);
          onFinished?.();
        }
      }, estimatedMs);

      await this.avatar.speak({
        text: text.trim(),
        task_type: TaskType.REPEAT,
        taskMode: TaskMode.SYNC
      });
    } catch (err) {
      console.error('[HeyGen Service] Error speaking text:', err);
      onFinished?.();
    }
  }

  /**
   * Interrupt current avatar speech
   */
  async interrupt() {
    if (this.avatar) {
      try {
        await this.avatar.interrupt();
        this.setStatus('connected');
      } catch (err) {
        console.warn('[HeyGen Service] Interrupt failed:', err.message);
      }
    }
  }

  /**
   * Gracefully stop the avatar session and free media tracks
   */
  async stopSession() {
    if (!this.avatar) {
      this.cleanup();
      return;
    }

    try {
      this.setStatus('disconnecting');
      await this.avatar.stopAvatar();
    } catch (err) {
      console.warn('[HeyGen Service] Error during stopAvatar:', err.message);
    } finally {
      if (this.sessionId) {
        api.interview.releaseAvatarSession({ sessionId: this.sessionId }).catch(() => {});
      }
      this.cleanup();
      this.setStatus('idle');
    }
  }

  cleanup() {
    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach((track) => track.stop());
      } catch {}
      this.mediaStream = null;
    }
    this.avatar = null;
    this.isConnecting = false;
  }
}

// Singleton instance for the application
export const heygenAvatarService = new HeyGenAvatarService();
export default heygenAvatarService;
