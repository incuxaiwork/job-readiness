import React, { useEffect, useRef, useState } from 'react';
import {
  Video,
  VideoOff,
  Wifi,
  WifiOff,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Volume2,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { heygenAvatarService } from '../../services/heygenAvatarService';

/**
 * Fallback animated video camera for the AI Interviewer
 * Uses micro-movements (breathing, attentive nod) when live stream is inactive.
 */
export const FallbackAnimatedAvatar = ({ isSpeaking, agentState }) => {
  const [tick, setTick] = useState(0);
  const [nodOffset, setNodOffset] = useState(0);

  const isListening = agentState === 'LISTENING';
  const isProcessing = agentState === 'PROCESSING';

  useEffect(() => {
    let animId;
    const loop = () => {
      setTick((t) => t + 1);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  useEffect(() => {
    let nodTimer;
    if (isListening) {
      const scheduleNod = () => {
        nodTimer = setTimeout(() => {
          setNodOffset(3.2);
          setTimeout(() => setNodOffset(0), 400);
          scheduleNod();
        }, 3200 + Math.random() * 2000);
      };
      scheduleNod();
    } else {
      setNodOffset(0);
    }
    return () => clearTimeout(nodTimer);
  }, [isListening]);

  const breatheY = Math.sin(tick * 0.04) * 1.4;
  const breatheScale = 1 + Math.sin(tick * 0.04) * 0.004;
  const listeningScale = isListening ? 1.022 : 1.0;
  const listeningTilt = isListening ? 1.1 : 0;
  const listeningNodY = isListening ? Math.sin(tick * 0.07) * 1.5 : 0;

  return (
    <div className="relative w-full h-full min-h-0 bg-slate-950 flex items-center justify-center overflow-hidden rounded-xl sm:rounded-2xl select-none group">
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/35 pointer-events-none z-10" />

      {isListening && (
        <div className="absolute inset-0 bg-radial from-emerald-500/10 via-transparent to-transparent pointer-events-none z-10 animate-pulse" />
      )}
      {isSpeaking && (
        <div className="absolute inset-0 bg-radial from-cyan-500/10 via-transparent to-transparent pointer-events-none z-10" />
      )}
      {isProcessing && (
        <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none z-10 animate-pulse" />
      )}

      <div
        className="relative h-full aspect-[890/1024] max-w-full max-h-full flex items-center justify-center transition-transform duration-150 ease-out"
        style={{
          transform: `translateY(${breatheY + listeningNodY + nodOffset}px) scale(${breatheScale * listeningScale}) rotate(${listeningTilt}deg)`,
        }}
      >
        <img
          src="/avatars/interviewer_primary.jpg?v=7"
          alt="AI Avatar"
          className="w-full h-full object-cover filter brightness-[0.99] contrast-[1.02] select-none rounded-lg"
        />
      </div>

      <div
        className="absolute inset-0 pointer-events-none z-15 opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '100% 3px',
        }}
      />
    </div>
  );
};

/**
 * HeyGenStreamingAvatar Component
 * 
 * Embeds HeyGen WebRTC live video stream with automatic fallback,
 * connection status indicator, and mode switcher.
 */
export const HeyGenStreamingAvatar = ({
  isSpeaking = false,
  agentState = 'IDLE',
  sessionId = null,
  isLiveStreamPreferred = true,
  onSpeechEnd = null,
  onStreamStateChange = null
}) => {
  const videoRef = useRef(null);
  const [streamStatus, setStreamStatus] = useState('idle'); // 'idle' | 'connecting' | 'connected' | 'speaking' | 'fallback' | 'error'
  const [statusDetail, setStatusDetail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [hasWebRTCStream, setHasWebRTCStream] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // Bind service events
  useEffect(() => {
    const unsubStream = heygenAvatarService.on('stream_ready', (stream) => {
      console.log('[HeyGen Component] Stream ready received in component');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => {
          console.warn('[HeyGen Component] Auto-play prevented:', err);
        });
      }
      setHasWebRTCStream(true);
      setStreamStatus('connected');
      onStreamStateChange?.({ isLive: true, status: 'connected' });
    });

    const unsubStartTalk = heygenAvatarService.on('start_talking', () => {
      setStreamStatus('speaking');
    });

    const unsubStopTalk = heygenAvatarService.on('stop_talking', () => {
      setStreamStatus('connected');
      onSpeechEnd?.();
    });

    const unsubStatus = heygenAvatarService.on('status_change', ({ status, detail }) => {
      setStreamStatus(status);
      if (detail) setStatusDetail(detail);
      onStreamStateChange?.({ isLive: status === 'connected' || status === 'speaking', status });
    });

    const unsubError = heygenAvatarService.on('error', (err) => {
      setErrorMessage(err.message || 'Stream connection issue');
      setStreamStatus('fallback');
      onStreamStateChange?.({ isLive: false, status: 'fallback', error: err.message });
    });

    const unsubDisconnected = heygenAvatarService.on('disconnected', () => {
      setHasWebRTCStream(false);
      setStreamStatus('fallback');
      onStreamStateChange?.({ isLive: false, status: 'fallback' });
    });

    return () => {
      unsubStream();
      unsubStartTalk();
      unsubStopTalk();
      unsubStatus();
      unsubError();
      unsubDisconnected();
    };
  }, [onSpeechEnd, onStreamStateChange]);

  // Connect HeyGen session on mount or when enabled
  const connectHeyGen = async () => {
    setErrorMessage('');
    setStreamStatus('connecting');
    const result = await heygenAvatarService.startSession({
      sessionId: sessionId || `session_${Date.now()}`,
      allowMock: false
    });

    if (!result.success) {
      setStreamStatus('fallback');
      if (result.error) setErrorMessage(result.error);
    }
  };

  useEffect(() => {
    if (isLiveStreamPreferred) {
      connectHeyGen();
    } else {
      setStreamStatus('fallback');
    }

    return () => {
      // Clean up avatar session when component unmounts
      heygenAvatarService.stopSession().catch(() => {});
    };
  }, [isLiveStreamPreferred]);

  // Re-attach mediaStream to video ref if state restored
  useEffect(() => {
    if (hasWebRTCStream && heygenAvatarService.mediaStream && videoRef.current) {
      if (videoRef.current.srcObject !== heygenAvatarService.mediaStream) {
        videoRef.current.srcObject = heygenAvatarService.mediaStream;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [hasWebRTCStream]);

  const isLiveConnected = hasWebRTCStream && (streamStatus === 'connected' || streamStatus === 'speaking');

  return (
    <div className="relative w-full h-full min-h-0 bg-slate-950 flex items-center justify-center overflow-hidden rounded-xl sm:rounded-2xl select-none group">
      {/* 1. Live WebRTC Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isAudioMuted}
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          isLiveConnected ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none absolute'
        }`}
      />

      {/* 2. Fallback Animated Avatar when not connected */}
      {!isLiveConnected && (
        <div className="absolute inset-0">
          <FallbackAnimatedAvatar isSpeaking={isSpeaking} agentState={agentState} />
        </div>
      )}

      {/* 3. Top Mode / Health Status Badges */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
        {isLiveConnected ? (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 px-2.5 py-1 text-[10px] font-mono font-bold shadow-lg backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            HeyGen Live WebRTC
          </span>
        ) : streamStatus === 'connecting' ? (
          <span className="flex items-center gap-1.5 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 px-2.5 py-1 text-[10px] font-mono font-bold shadow-lg backdrop-blur-md">
            <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
            Connecting HeyGen Stream...
          </span>
        ) : (
          <span className="flex items-center gap-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-slate-300 px-2.5 py-1 text-[10px] font-mono shadow-lg backdrop-blur-md">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Interactive Animated Avatar (Active)
          </span>
        )}

        {streamStatus === 'speaking' && (
          <span className="flex items-center gap-1 rounded-full bg-cyan-950/80 border border-cyan-400/60 text-cyan-300 px-2 py-0.5 text-[9px] font-bold animate-pulse backdrop-blur-md">
            <Volume2 className="w-3 h-3" />
            Speaking
          </span>
        )}
      </div>

      {/* 4. Connecting Overlay Banner */}
      {streamStatus === 'connecting' && !hasWebRTCStream && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 text-center">
          <div className="w-12 h-12 rounded-full border-3 border-emerald-400/30 border-t-emerald-400 animate-spin mb-3" />
          <h4 className="text-white font-bold text-sm">Initializing HeyGen Video Stream</h4>
          <p className="text-slate-300 text-xs mt-1 max-w-xs">{statusDetail || 'Connecting to secure streaming session...'}</p>
          <button
            type="button"
            onClick={() => setStreamStatus('fallback')}
            className="mt-4 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all cursor-pointer"
          >
            Continue with Animated Avatar
          </button>
        </div>
      )}

      {/* 5. Ambient Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none z-15" />
    </div>
  );
};

export default HeyGenStreamingAvatar;
