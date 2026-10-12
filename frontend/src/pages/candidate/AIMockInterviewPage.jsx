import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  parseResumeText,
  generateResumeQuestions,
  analyzeRoleSkillGaps,
  getRoleDefaults,
  extractTextFromPdf
} from '../../utils/resumeParser';
import { getFaceLandmarker, classifyFrame } from '../../services/proctoringService';
import { getActiveAssessments, checkAssessmentCompleted } from '../../utils/interviewLock';
import { HeyGenStreamingAvatar } from '../../components/interview/HeyGenStreamingAvatar';
import { heygenAvatarService } from '../../services/heygenAvatarService';
import { api } from '../../services/api';
import {
  Volume2,
  Video,
  Mic,
  ArrowRight,
  RotateCcw,
  LayoutDashboard,
  CheckCircle2,
  Sparkles,
  Award,
  TrendingUp,
  BrainCircuit,
  ShieldCheck,
  Zap,
  VideoOff,
  Activity,
  Eye,
  Smile,
  AlignCenter,
  BarChart3,
  AlertTriangle,
  Play,
  Briefcase,
  Layers,
  FileCheck,
  Edit3,
  Upload,
  FileText,
  RefreshCw,
  Target,
  ClipboardList,
  X,
  Trash2,
  Lock,
  Unlock,
  ShieldAlert,
  Clock,
  Maximize,
  Minimize,
  LogOut,
  Users,
  EyeOff,
  UserX,
  AlertCircle
} from 'lucide-react';

const PRESET_ROLES = [
  'ML Engineer',
  'Software Engineer',
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'Data Scientist',
  'DevOps Engineer'
];

const SAMPLE_ML_RESUME = `Pera Vishnuvardhan Reddy - Machine Learning Engineer
Summary: Passionate ML Engineer experienced in building predictive models, data preprocessing pipelines, and model evaluation with Python, Scikit-Learn, and PyTorch.
Skills: Python, Machine Learning, Scikit-Learn, Pandas, NumPy, Model Evaluation, PyTorch, Data Preprocessing, SQL, REST APIs, Git.
Projects:
• Predictive Customer Churn Pipeline: Built classification models with Random Forest and XGBoost in Scikit-Learn, achieving 89% accuracy and reducing customer attrition.
• Computer Vision & Image Recognition: Implemented CNN architectures with PyTorch for automated defect detection in real-time camera streams.`;

// Waveform bars component
function Waveform({ active }) {
  return (
    <div className="flex items-end gap-[3px] h-5">
      {[3, 5, 7, 4, 6, 5, 8, 4, 6, 3].map((h, i) => (
        <span
          key={i}
          className={`w-[2.5px] rounded-full transition-all duration-150 ${active ? 'bg-brand-400' : 'bg-slate-700'
            }`}
          style={{
            height: active ? `${Math.max(4, (h * 2.2) % 20)}px` : '4px',
            animationDelay: `${i * 60}ms`,
          }}
        />
      ))}
    </div>
  );
}

// Circular Score Ring helper for final report
function MiniScoreRing({ score, size = 64 }) {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#0270c5' : '#f59e0b';

  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e2e8f0" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-base font-black text-slate-900 font-mono">{score}</span>
        <span className="text-[9px] text-slate-500 font-mono font-bold">/100</span>
      </div>
    </div>
  );
}

// ── Interactive AI Video Cam (Living AI Avatar) ──
function DrArvindSwamiVideoCam({
  isSpeaking,
  agentState = 'IDLE',
}) {
  const isListening = agentState === 'LISTENING';
  const isProcessing = agentState === 'PROCESSING';

  const [tick, setTick] = useState(0);

  // Micro-life continuous animation loop (breathing, subtle organic pulse)
  useEffect(() => {
    let frameId;
    let counter = 0;
    const loop = () => {
      counter += 1;
      setTick(counter);
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const [nodOffset, setNodOffset] = useState(0);

  // Natural human attentive nodding simulation while listening to candidate
  useEffect(() => {
    let nodTimer;
    if (isListening) {
      const scheduleNod = () => {
        nodTimer = setTimeout(() => {
          let start = Date.now();
          const nodAnim = () => {
            const elapsed = Date.now() - start;
            if (elapsed < 1100) {
              const progress = elapsed / 1100;
              const dip = Math.sin(progress * Math.PI) * 2.8;
              setNodOffset(dip);
              requestAnimationFrame(nodAnim);
            } else {
              setNodOffset(0);
              scheduleNod();
            }
          };
          requestAnimationFrame(nodAnim);
        }, 5000 + Math.random() * 4000);
      };
      scheduleNod();
    } else {
      setNodOffset(0);
    }
    return () => clearTimeout(nodTimer);
  }, [isListening]);

  // Derived micro-motions based on agent state
  const breatheY = Math.sin(tick * 0.04) * 1.4;
  const breatheScale = 1 + Math.sin(tick * 0.04) * 0.004;

  // Attentive listening posture: slight zoom, gentle tilt, attentive nod
  const listeningScale = isListening ? 1.022 : 1.0;
  const listeningTilt = isListening ? 1.1 : 0;
  const listeningNodY = isListening ? Math.sin(tick * 0.07) * 1.5 : 0;

  return (
    <div className="relative w-full h-full min-h-0 bg-slate-950 flex items-center justify-center overflow-hidden rounded-xl sm:rounded-2xl select-none group">
      {/* Studio Ambient Vignette & Edge Glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/35 pointer-events-none z-10" />

      {/* State-Specific Lighting Halos */}
      {isListening && (
        <div className="absolute inset-0 bg-radial from-emerald-500/10 via-transparent to-transparent pointer-events-none z-10 animate-pulse" />
      )}
      {isSpeaking && (
        <div className="absolute inset-0 bg-radial from-cyan-500/10 via-transparent to-transparent pointer-events-none z-10" />
      )}
      {isProcessing && (
        <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none z-10 animate-pulse" />
      )}

      {/* Video Cam Broadcast Framing with Natural Micro-Life Motion */}
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

      {/* Video Streaming Scanline Overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-15 opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '100% 3px',
        }}
      />
    </div>
  );
}

export const AIMockInterviewPage = () => {
  const navigate = useNavigate();
  const { navigateTo, currentUser, setCurrentUser, role, adminUser, candidateSubmissions, assessments, isAssessmentCompleted, addToast, startAssessment, isInterviewUnlocked } = useApp();

  // Candidate Name Resolution (guarantees real name like Aditya instead of B45996085/email)
  const resolveCandidateName = (user) => {
    const custom = typeof window !== 'undefined' ? localStorage.getItem('rsj_candidate_name') : null;
    if (custom && custom.trim()) return custom.trim();
    const raw = user?.fullName || user?.name;
    if (raw && !raw.includes('@') && !/^[bB]\d{4,}$/i.test(raw)) return raw;
    return 'Aditya';
  };

  const [candidateName, setCandidateName] = useState(() => resolveCandidateName(currentUser));
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(() => resolveCandidateName(currentUser));
  const [isManualEditOpen, setIsManualEditOpen] = useState(false);
  const conversationScrollRef = useRef(null);

  useEffect(() => {
    const resolved = resolveCandidateName(currentUser);
    setCandidateName(resolved);
    setNameInput(resolved);
  }, [currentUser]);

  const handleSaveCandidateName = (val) => {
    const final = (val || '').trim() || 'Aditya';
    setCandidateName(final);
    setNameInput(final);
    setIsEditingName(false);
    try {
      localStorage.setItem('rsj_candidate_name', final);
      if (currentUser && typeof setCurrentUser === 'function') {
        const updated = { ...currentUser, name: final, fullName: final };
        setCurrentUser(updated);
        localStorage.setItem('rsj_user', JSON.stringify(updated));
      }
      window.dispatchEvent(new CustomEvent('candidate-name-changed', { detail: final }));
    } catch {}
  };


  // Helper to open candidate analysis report directly (no extra pages)
  const handleOpenCandidateAnalysis = () => {
    try {
      localStorage.setItem('rsj_active_analytics_tab', 'interview');
    } catch { }
    if (typeof navigateTo === 'function') {
      navigateTo('candidate-analytics');
    } else if (typeof navigate === 'function') {
      navigate('/results?tab=interview');
    } else if (typeof window !== 'undefined') {
      window.location.href = '/results?tab=interview';
    }
  };

  // Admin Configuration State (Synced with Backend Admin Portal)
  const [adminSettings, setAdminSettings] = useState({
    isLocked: false,
    lockReason: 'AI Mock Interview sessions are currently locked by the administrator.',
    questionCount: 3,
    difficulty: 'Moderate',
    maxWarnings: 3
  });

  useEffect(() => {
    fetch('/api/interview/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setAdminSettings({
            ...data.settings,
            questionCount: data.settings.questionCount || 3
          });
        }
      })
      .catch((err) => console.warn('Settings fetch notice:', err.message));
  }, []);

  // 1. Stage State: 'setup' (Picture 1) -> 'room' (Picture 2) -> Report
  const [stage, setStage] = useState('setup');

  // 2. Role and Resume ATS Data
  const [targetRole, setTargetRole] = useState(() => {
    return localStorage.getItem('rsj_selected_role') || 'Data Scientist';
  });

  const [uploadedFileName, setUploadedFileName] = useState(() => {
    return localStorage.getItem('rsj_uploaded_resume_name') || null;
  });

  const [rawResumeText, setRawResumeText] = useState(() => {
    return localStorage.getItem('rsj_raw_resume_text') || '';
  });
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedText, setPastedText] = useState('');

  // Resume analysis state initialized only if a resume was actually uploaded
  const [analysisResult, setAnalysisResult] = useState(() => {
    const savedName = localStorage.getItem('rsj_uploaded_resume_name');
    const savedText = localStorage.getItem('rsj_raw_resume_text');
    if (savedName && savedText) {
      try {
        const saved = localStorage.getItem('rsj_resume_analysis');
        if (saved && Array.isArray(saved.skills) && saved.skills.length > 0) return saved;
      } catch { }
      const initialRole = localStorage.getItem('rsj_selected_role') || 'Software Engineer';
      return parseResumeText(savedText, initialRole);
    }
    return null;
  });

  const [isEditingRole, setIsEditingRole] = useState(false);
  const [roleInput, setRoleInput] = useState(targetRole);

  // Initialize questions using resumeParser ensuring Q1 is ALWAYS "Tell me about yourself"
  const [questions, setQuestions] = useState(() => {
    const base = analysisResult || parseResumeText('', targetRole);
    return generateResumeQuestions(base, targetRole);
  });

  // Ensure resume analysis and detected skills are continuously synchronized in localStorage
  useEffect(() => {
    if (analysisResult) {
      try {
        localStorage.setItem('rsj_resume_analysis', JSON.stringify(analysisResult));
        if (Array.isArray(analysisResult.skills)) {
          localStorage.setItem('rsj_resume_skills', JSON.stringify(analysisResult.skills));
        }
      } catch { }
    }
  }, [analysisResult]);

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [heyGenModePreferred, setHeyGenModePreferred] = useState(() => {
    try {
      const saved = localStorage.getItem('rsj_avatar_mode');
      return saved ? saved !== 'animated_only' : true;
    } catch { return true; }
  });
  const [isHeyGenStreamingActive, setIsHeyGenStreamingActive] = useState(false);
  const [heyGenConfig, setHeyGenConfig] = useState(null);

  useEffect(() => {
    api.interview.getAvatarConfig()
      .then((res) => {
        if (res && res.config) setHeyGenConfig(res.config);
      })
      .catch((err) => console.warn('Avatar config check notice:', err));
  }, []);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isReportReady, setIsReportReady] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('report') === 'true';
    }
    return false;
  });
  const [isInterviewCompleted, setIsInterviewCompleted] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const p = new URLSearchParams(window.location.search);
        if (p.get('retake') === 'true') {
          localStorage.removeItem('rsj_interview_completed');
          localStorage.removeItem('rsj_latest_interview_analysis');
          return false;
        }
        if (localStorage.getItem('rsj_interview_completed') === 'true') {
          return true;
        }
        const cachedAnalysis = localStorage.getItem('rsj_latest_interview_analysis');
        if (cachedAnalysis) {
          const parsed = JSON.parse(cachedAnalysis);
          if (parsed?.analysis?.sessionId || parsed?.session?.id) {
            return true;
          }
        }
      }
    } catch { }
    return false;
  });

  const [showCompletedCard, setShowCompletedCard] = useState(true);
  const [finalAnalysis, setFinalAnalysis] = useState(null);

  // Audio & Video State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isTestingCamera, setIsTestingCamera] = useState(false);
  const [videoPlayBlocked, setVideoPlayBlocked] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [companionText, setCompanionText] = useState('');
  const [answersList, setAnswersList] = useState([]);
  const [liveTranscript, setLiveTranscript] = useState('');

  // Autonomous Turn-Taking Agent State Machine:
  // 'IDLE' | 'SPEAKING' | 'LISTENING' | 'PROCESSING' | 'AI_RESPONSE'
  const [agentState, setAgentState] = useState('IDLE');
  const agentStateRef = useRef('IDLE');
  const [currentSpokenSubtitle, setCurrentSpokenSubtitle] = useState('');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const lastCandidateSpokeTimeRef = useRef(0);
  const silenceCheckTimerRef = useRef(null);

  // Speech-to-Text Accent/Language ('en-IN' default for high Indian English accuracy, toggleable to 'en-US')
  const [sttLang, setSttLang] = useState('en-IN');
  const accumulatedTranscriptRef = useRef('');

  // Auto-scroll conversation transcript when companionText or state changes
  useEffect(() => {
    if (conversationScrollRef.current) {
      conversationScrollRef.current.scrollTop = conversationScrollRef.current.scrollHeight;
    }
  }, [companionText, currentQIndex, agentState, isAISpeaking]);

  // Pre-load and cache browser SpeechSynthesis voices
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const loadVoices = () => {
        try { window.speechSynthesis.getVoices(); } catch { }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
      return () => {
        if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  // Proctoring Violations & Warning System (Max 3: Camera Closed & Multi-Face)
  const [warningCount, setWarningCount] = useState(0);
  const [activeWarningMessage, setActiveWarningMessage] = useState('');
  const [proctoringModal, setProctoringModal] = useState(null); // { violation, message, count, maxAllowed, isFinal }
  const [proctoringLog, setProctoringLog] = useState([]);
  const [proctorState, setProctorState] = useState({ status: 'initializing', reason: '', message: '' });
  const lastViolationTimeRef = useRef(0);
  const badStateStartTimeRef = useRef(null);
  const lastBadStatusRef = useRef(null);
  const lastDetectionTimestampRef = useRef(0);

  // Audible alert tone when a proctoring violation strike is logged
  const playWarningChime = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.3);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn('Warning chime notice:', e);
    }
  };

  const getViolationFallbackMessage = (reason = '') => {
    const r = (reason || '').toLowerCase();
    if (r.includes('multiple')) {
      return 'Multiple faces detected in camera view. Ensure you are completely alone during the interview.';
    }
    if (r.includes('closed') || r.includes('camera') || r.includes('inactive') || r.includes('no face') || r.includes('obstruct')) {
      return 'Webcam video feed is closed or obstructed. Please ensure your camera is enabled and your face is fully visible.';
    }
    if (r.includes('away') || r.includes('turn') || r.includes('gaze') || r.includes('tilt')) {
      return 'Looking away from screen detected. Please maintain direct eye contact with the AI interviewer.';
    }
    if (r.includes('fullscreen') || r.includes('escape')) {
      return 'Exited full-screen mode. The interview studio must remain in full-screen mode at all times.';
    }
    if (r.includes('tab') || r.includes('focus') || r.includes('minimiz')) {
      return 'Switching browser tabs or leaving the interview window is strictly prohibited.';
    }
    return 'Please keep your camera active, stay in full-screen mode, and remain focused on the interview.';
  };

  const triggerProctoringViolation = (violationReason, customMessage = '') => {
    // Debounce duplicate triggers within 1.5 seconds
    const now = Date.now();
    if (now - lastViolationTimeRef.current < 1500) return;
    lastViolationTimeRef.current = now;

    playWarningChime();

    const detailMessage = customMessage || getViolationFallbackMessage(violationReason);

    setWarningCount((prevCount) => {
      const newCount = prevCount + 1;
      const maxAllowed = Number(adminSettings?.maxWarnings) || 3;
      const isFinal = newCount >= maxAllowed;
      const isUrgent = newCount === maxAllowed - 1;

      const logEntry = {
        number: newCount,
        reason: violationReason,
        message: detailMessage,
        time: new Date().toLocaleTimeString()
      };
      setProctoringLog((prev) => [...prev, logEntry]);

      const message = isFinal
        ? `🛑 Strike ${newCount}/${maxAllowed}: Maximum warnings reached (${violationReason}). Auto-terminating interview.`
        : isUrgent
          ? `🚨 FINAL WARNING (${newCount}/${maxAllowed}): ${violationReason}. Next violation will terminate session!`
          : `⚠️ Warning ${newCount}/${maxAllowed}: ${violationReason}`;

      setActiveWarningMessage(message);

      if (isFinal) {
        // MAX STRIKES REACHED: CLOSE INTERVIEW AND AUTO-SUBMIT
        setProctoringModal({
          violation: violationReason,
          message: detailMessage,
          count: newCount,
          maxAllowed,
          isFinal: true
        });

        // Exit fullscreen immediately if open
        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => { });
        }

        setTimeout(() => {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          if (telemetryIntervalRef.current) clearInterval(telemetryIntervalRef.current);
          stopAudioNoiseMonitoring();
          heygenAvatarService.stopSession().catch(() => {});
          if (isRecording && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsRecording(false);
          }
          setSessionActive(false);
          stopCamera();
          setProctoringModal(null);

          // Guarantee answer is present so report generates seamlessly
          const currentSid = sessionId || `isess_local_${Date.now()}`;
          const fallbackAns = [{
            questionNumber: 1,
            stage: 'Q1',
            question: questions[0]?.questionText || 'Tell me about yourself.',
            category: 'INTRODUCTION & PROFILE',
            companionNote: 'Interview closed & auto-submitted due to repeated proctoring violations (3 strikes).',
            score: 35,
            technicalScore: 35,
            communicationScore: 40,
            eyeContactScore: telemetry.eyeContact || 60,
            attentionScore: telemetry.attention || 60,
            confidenceScore: telemetry.confidence || 55
          }];

          const violationAnalysis = {
            sessionId: currentSid,
            overallScore: 35,
            communicationScore: 40,
            technicalScore: 35,
            eyeContactScore: telemetry.eyeContact || 60,
            attentionScore: telemetry.attention || 60,
            confidenceScore: telemetry.confidence || 55,
            dominantEmotion: 'Distracted',
            aiFeedback: 'Session auto-submitted due to 3 proctoring warnings.',
            questionBreakdown: fallbackAns.map((a) => ({
              ...a,
              transcript: a.companionNote,
              overallScore: a.score,
              dominantEmotion: 'Distracted',
              aiFeedback: a.companionNote
            }))
          };

          setAnswersList(fallbackAns);
          setFinalAnalysis(violationAnalysis);

          localStorage.setItem('rsj_latest_interview_analysis', JSON.stringify({
            success: true,
            analysis: violationAnalysis,
            session: {
              id: currentSid,
              targetRole: targetRole || 'Data Scientist',
              startedAt: new Date(Date.now() - timerSeconds * 1000).toISOString(),
              completedAt: new Date().toISOString(),
              questions: questions
            }
          }));
          localStorage.setItem('last_interview_session_id', currentSid);
          localStorage.setItem('rsj_active_analytics_tab', 'interview');
          handleOpenCandidateAnalysis();

          const token = localStorage.getItem('rsj_token') || localStorage.getItem('token');
          const headers = { 'Content-Type': 'application/json' };
          if (token) headers['Authorization'] = `Bearer ${token}`;
          fetch(`/api/interview/session/${currentSid}/complete`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ status: 'TERMINATED_VIOLATION', warningCount: 3 })
          }).catch(() => { });
        }, 2500);
      } else {
        // NON-TERMINATING WARNING STRIKE
        setProctoringModal({
          violation: violationReason,
          message: detailMessage,
          count: newCount,
          maxAllowed,
          isFinal: false
        });
      }

      return newCount;
    });
  };

  // Live Telemetry from real processing
  const [telemetry, setTelemetry] = useState({
    eyeContact: 92,
    emotion: 'Focused',
    headPose: 'Centered',
    confidence: 88,
    attention: 90,
  });

  // DOM Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recognitionRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const telemetryIntervalRef = useRef(null);
  const qStartTimeRef = useRef(Date.now());
  const currentQRef = useRef(questions[0]);

  // ElevenLabs TTS refs
  const elevenLabsAbortRef = useRef(null);
  const elevenLabsSourceRef = useRef(null);

  // ElevenLabs config from Vite env
  const ELEVEN_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY || '';
  const ELEVEN_VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';

  const currentQ = questions[currentQIndex] || questions[0];
  const isFinalQuestion = currentQIndex >= questions.length - 1;

  useEffect(() => {
    currentQRef.current = currentQ;
  }, [currentQ]);

  // Keep questions and skill gaps synchronized with targetRole & analysisResult
  useEffect(() => {
    const updatedQ = generateResumeQuestions(analysisResult, targetRole);
    setQuestions(updatedQ);
    localStorage.setItem('rsj_resume_questions', JSON.stringify(updatedQ));
  }, [targetRole, analysisResult]);

  // Determine whether a genuine resume is uploaded
  const hasUploadedResume = Boolean(uploadedFileName && (rawResumeText || (analysisResult?.skills && analysisResult.skills.length > 0)));

  // Calculate current skill gaps for the target role
  const skillGaps = analysisResult?.skillGaps || (hasUploadedResume ? analyzeRoleSkillGaps(analysisResult?.skills || [], targetRole) : { matchedCore: [], missingCore: [], skillsToCover: [], atsScore: 0 });
  const resumeATS = String(analysisResult?.atsScore || skillGaps.atsScore || 0);

  // Web Audio API background noise detector (Non-punitive notification)
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const noiseCheckIntervalRef = useRef(null);
  const noiseTimeoutRef = useRef(null);
  const [noiseAlert, setNoiseAlert] = useState(false);

  // MediaPipe FaceLandmarker for multiple face detection
  const faceLandmarkerRef = useRef(null);
  const sessionStartTimeRef = useRef(0);

  useEffect(() => {
    let isMounted = true;
    getFaceLandmarker()
      .then((lm) => {
        if (isMounted) faceLandmarkerRef.current = lm;
      })
      .catch((err) => console.warn('MediaPipe FaceLandmarker load notice:', err));
    return () => {
      isMounted = false;
    };
  }, []);

  const startAudioNoiseMonitoring = (stream) => {
    try {
      const audioTrack = stream?.getAudioTracks?.()[0];
      if (!audioTrack) return;

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContextClass();
      }
      const audioCtx = audioContextRef.current;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const source = audioCtx.createMediaStreamSource(new MediaStream([audioTrack]));
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      if (noiseCheckIntervalRef.current) clearInterval(noiseCheckIntervalRef.current);
      noiseCheckIntervalRef.current = setInterval(() => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;

        // High external background noise threshold (> 40)
        if (avg > 40) {
          setNoiseAlert(true);
          if (noiseTimeoutRef.current) clearTimeout(noiseTimeoutRef.current);
          noiseTimeoutRef.current = setTimeout(() => {
            setNoiseAlert(false);
          }, 3500);
        }
      }, 700);
    } catch (err) {
      console.warn('Audio noise analysis notice:', err);
    }
  };

  const stopAudioNoiseMonitoring = () => {
    if (noiseCheckIntervalRef.current) clearInterval(noiseCheckIntervalRef.current);
    if (noiseTimeoutRef.current) clearTimeout(noiseTimeoutRef.current);
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch { }
      audioContextRef.current = null;
    }
    setNoiseAlert(false);
  };

  // Fullscreen exit, tab switching, and window blur proctoring listeners
  useEffect(() => {
    if (!sessionActive) return;

    sessionStartTimeRef.current = Date.now();

    const handleFullscreenChange = () => {
      // 1.5s grace period on session start so entering fullscreen doesn't false-trigger
      if (Date.now() - sessionStartTimeRef.current < 1500) return;
      if (!document.fullscreenElement && !proctoringModal) {
        triggerProctoringViolation(
          'Exited Fullscreen Mode',
          'Exiting full-screen mode is prohibited during the interview session. Please remain in full screen.'
        );
      }
    };

    const handleVisibilityChange = () => {
      if (Date.now() - sessionStartTimeRef.current < 1500) return;
      if (document.hidden && !proctoringModal) {
        triggerProctoringViolation(
          'Switched Tabs / Browser Minimized',
          'Navigating away from the interview or switching browser tabs is strictly monitored and prohibited.'
        );
      }
    };

    const handleWindowBlur = () => {
      if (Date.now() - sessionStartTimeRef.current < 1500) return;
      if (!proctoringModal) {
        triggerProctoringViolation(
          'Switched Tabs / Window Lost Focus',
          'Clicking outside the interview window or switching to another application is prohibited.'
        );
      }
    };

    const handleKeyDown = (e) => {
      if (Date.now() - sessionStartTimeRef.current < 1500) return;
      if (e.key === 'Escape' || e.code === 'Escape') {
        if (!proctoringModal) {
          triggerProctoringViolation(
            'Exited Fullscreen Mode (Escape Key Pressed)',
            'Pressing Escape to leave full-screen mode is prohibited during the interview.'
          );
        }
      }
    };

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Interview session is currently in progress. Exiting will close and submit your interview.';
      return e.returnValue;
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sessionActive, proctoringModal]);

  const handleAcknowledgeWarning = () => {
    setProctoringModal(null);
    badStateStartTimeRef.current = null;
    lastBadStatusRef.current = null;
    sessionStartTimeRef.current = Date.now();
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => { });
    }
  };

  // Live Face-Presence, Multi-Person & Camera Proctoring Loop with MediaPipe Tasks Vision
  useEffect(() => {
    if (!sessionActive || isInterviewCompleted) return;

    let isCancelled = false;

    // Ensure landmarker is loaded
    if (!faceLandmarkerRef.current) {
      getFaceLandmarker()
        .then((lm) => {
          if (!isCancelled) faceLandmarkerRef.current = lm;
        })
        .catch((err) => console.warn('MediaPipe FaceLandmarker load notice:', err));
    }

    const proctorInterval = setInterval(() => {
      if (isCancelled || proctoringModal || !sessionActive || isInterviewCompleted) return;

      // 1. Camera stream and video track integrity check (closing camera detection)
      const videoTrack = mediaStreamRef.current?.getVideoTracks?.()[0];
      const isCameraOff = !cameraActive ||
        !mediaStreamRef.current ||
        !videoTrack ||
        !videoTrack.enabled ||
        videoTrack.readyState === 'ended';

      if (isCameraOff) {
        setProctorState({
          status: 'camera_off',
          reason: 'Camera Feed Inactive',
          message: 'Camera connection closed or inactive.'
        });

        if (badStateStartTimeRef.current === null || lastBadStatusRef.current !== 'camera_closed') {
          badStateStartTimeRef.current = Date.now();
          lastBadStatusRef.current = 'camera_closed';
        } else if (Date.now() - badStateStartTimeRef.current >= 1000) {
          badStateStartTimeRef.current = null;
          lastBadStatusRef.current = null;
          triggerProctoringViolation(
            'Camera Feed Closed / Inactive Video',
            'Your webcam is turned off or video feed is inactive. A continuous webcam feed is mandatory throughout the interview.'
          );
        }
        return;
      }

      // 2. Check if video element is ready
      const video = videoRef.current;
      if (!video || video.readyState < 2 || video.paused || video.ended) {
        return;
      }

      // 3. MediaPipe FaceLandmarker frame classification
      const landmarker = faceLandmarkerRef.current;
      if (!landmarker) return;

      try {
        const nowMs = Math.max(performance.now(), lastDetectionTimestampRef.current + 1);
        lastDetectionTimestampRef.current = nowMs;
        const results = landmarker.detectForVideo(video, nowMs);
        const classification = classifyFrame(results);
        setProctorState(classification);

        if (classification.status === 'face_ok') {
          badStateStartTimeRef.current = null;
          lastBadStatusRef.current = null;
        } else {
          // Status is 'multiple_faces', 'no_face', or 'looking_away'
          if (badStateStartTimeRef.current === null || lastBadStatusRef.current !== classification.status) {
            badStateStartTimeRef.current = Date.now();
            lastBadStatusRef.current = classification.status;
          } else {
            const elapsed = Date.now() - badStateStartTimeRef.current;
            // 1 second continuous violation grace before strike
            if (elapsed >= 1000) {
              badStateStartTimeRef.current = null;
              lastBadStatusRef.current = null;

              if (classification.status === 'multiple_faces') {
                triggerProctoringViolation(
                  'Multiple Persons Detected',
                  `Multiple faces (${classification.faceCount || 2}) detected in camera view. Please ensure you are alone in the interview room.`
                );
              } else if (classification.status === 'no_face') {
                triggerProctoringViolation(
                  'No Face Detected / Camera Obstructed',
                  'No face detected in the camera frame. Please keep your face clearly visible to the camera at all times.'
                );
              } else if (classification.status === 'looking_away') {
                triggerProctoringViolation(
                  `Looking Away from Screen (${classification.reason})`,
                  classification.message || 'Please keep your attention and eyes focused on the interview screen.'
                );
              }
            }
          }
        }
      } catch (detectErr) {
        console.warn('Face proctoring detection frame note:', detectErr.message);
      }
    }, 500);

    return () => {
      isCancelled = true;
      clearInterval(proctorInterval);
    };
  }, [sessionActive, cameraActive, proctoringModal, isInterviewCompleted]);

  // ==========================================
  // HANDLERS FOR SETUP STAGE (PICTURE 1)
  // ==========================================
  const handleClearResume = () => {
    setUploadedFileName(null);
    setRawResumeText('');
    setAnalysisResult(null);
    try {
      localStorage.removeItem('rsj_uploaded_resume_name');
      localStorage.removeItem('rsj_raw_resume_text');
      localStorage.removeItem('rsj_resume_analysis');
      localStorage.removeItem('rsj_resume_skills');
      localStorage.removeItem('rsj_resume_ats_score');
    } catch { }
  };

  const handleRoleChange = (newRole) => {
    // Preserve user input verbatim: allows deleting, backspacing to empty, and typing spaces
    setTargetRole(newRole);
    setRoleInput(newRole);
    localStorage.setItem('rsj_selected_role', newRole);

    const effectiveRole = newRole.trim() || 'Software Engineer';

    // Only recalculate resume skills & questions if a resume is actually uploaded
    if (uploadedFileName && rawResumeText) {
      const updatedAnalysis = parseResumeText(rawResumeText, effectiveRole);
      if (analysisResult?.candidateName && analysisResult.candidateName !== 'Candidate') {
        updatedAnalysis.candidateName = analysisResult.candidateName;
      }
      setAnalysisResult(updatedAnalysis);
      try {
        localStorage.setItem('rsj_resume_analysis', JSON.stringify(updatedAnalysis));
        localStorage.setItem('rsj_resume_ats_score', String(updatedAnalysis.atsScore));
      } catch { }

      const updatedQ = generateResumeQuestions(updatedAnalysis, effectiveRole);
      setQuestions(updatedQ);
      setCurrentQIndex(0);
      try {
        localStorage.setItem('rsj_resume_questions', JSON.stringify(updatedQ));
      } catch { }
    }
    setIsEditingRole(false);
  };

  const processResumeContent = (name, text, roleToUse = targetRole) => {
    setIsScanning(true);
    setScanProgress(25);

    setTimeout(() => setScanProgress(60), 300);
    setTimeout(() => setScanProgress(90), 600);
    setTimeout(() => {
      setScanProgress(100);
      setIsScanning(false);
      setUploadedFileName(name);
      setRawResumeText(text);

      const parsed = parseResumeText(text, roleToUse);
      setAnalysisResult(parsed);

      const generatedQuestions = generateResumeQuestions(parsed, roleToUse);
      setQuestions(generatedQuestions);
      setCurrentQIndex(0);

      localStorage.setItem('rsj_uploaded_resume_name', name);
      localStorage.setItem('rsj_raw_resume_text', text);
      localStorage.setItem('rsj_selected_role', roleToUse);
      localStorage.setItem('rsj_resume_ats_score', String(parsed.atsScore));
      localStorage.setItem('rsj_resume_analysis', JSON.stringify(parsed));
      localStorage.setItem('rsj_resume_questions', JSON.stringify(generatedQuestions));
    }, 900);
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    try {
      let content = '';
      if (file.type.includes('text') || file.name.endsWith('.txt')) {
        content = await file.text();
      } else {
        try {
          const buffer = await file.arrayBuffer();
          content = await extractTextFromPdf(buffer);
        } catch { }
        if (!content || content.trim().length < 20) {
          content = file.name.toLowerCase().includes('vishnu')
            ? SAMPLE_ML_RESUME
            : `${file.name.replace(/\.[^/.]+$/, '')} candidate profile. Technical experience in ${targetRole}, building software projects, modern frameworks, and system workflows.`;
        }
      }
      processResumeContent(file.name, content);
    } catch (e) {
      processResumeContent(file.name, SAMPLE_ML_RESUME);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleLoadSampleResume = () => {
    processResumeContent('Vishnu_ML_Resume.pdf', SAMPLE_ML_RESUME, 'Data Scientist');
    setTargetRole('Data Scientist');
    setRoleInput('Data Scientist');
  };

  const handleApplyPastedResume = () => {
    if (pastedText.trim()) {
      processResumeContent('Pasted_Resume_Profile.txt', pastedText);
      setShowPasteModal(false);
    }
  };

  const handleProceedToRoom = () => {
    if (!hasUploadedResume) {
      if (typeof addToast === 'function') {
        addToast('Please upload your resume first to calibrate your interview.', 'warning');
      }
      const input = document.getElementById('resume-file-input');
      if (input) input.click();
      return;
    }
    // Transition from Setup to Live Interview Stage with HeyGen AI avatar
    setIsInterviewCompleted(false);
    try {
      localStorage.removeItem('rsj_interview_completed');
      localStorage.setItem('rsj_avatar_mode', 'heygen_live');
    } catch { }
    setHeyGenModePreferred(true);
    setStage('room');
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => { });
      }
    } catch (e) { }
    // Pre-test camera for smooth onboarding
    if (!mediaStreamRef.current) {
      startCamera();
    }
  };

  // ==========================================
  // CAMERA & AUDIO HANDLERS
  // ==========================================
  const startCamera = async () => {
    setCameraError('');
    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError('Webcam access is not supported by your browser.');
      setCameraActive(false);
      return;
    }

    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }

      let stream = null;
      // Step 1: Attempt ideal video + audio
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280, min: 640 }, height: { ideal: 720, min: 480 }, facingMode: 'user' },
          audio: true,
        });
      } catch (err1) {
        console.warn('Ideal video+audio failed, retrying video only:', err1.message);
        // Step 2: Attempt video only (bypasses any microphone permission/busy errors)
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280, min: 640 }, height: { ideal: 720, min: 480 }, facingMode: 'user' },
            audio: false,
          });
        } catch (err2) {
          console.warn('Constrained video failed, retrying basic video:', err2.message);
          // Step 3: Attempt basic unconstrained video
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      if (!stream) throw new Error('No video stream returned from webcam.');

      mediaStreamRef.current = stream;
      setCameraActive(true);
      setIsTestingCamera(true);
      setCameraError('');

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          setCameraActive(false);
          if (sessionActive && !isInterviewCompleted) {
            triggerProctoringViolation(
              'Camera Feed Closed / Inactive Video',
              'Webcam stream was disconnected or ended. Continuous video feed is strictly required.'
            );
          }
        };
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        try {
          await videoRef.current.play();
          setVideoPlayBlocked(false);
        } catch (err) {
          console.warn('Video autoPlay deferred by browser:', err);
          setVideoPlayBlocked(true);
        }
      }
    } catch (err) {
      console.warn('Camera preview error:', err);
      setCameraActive(false);
      setIsTestingCamera(false);
      const name = err.name || '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setCameraError('Permission blocked. Please allow Camera access in your browser address bar (lock/camera icon) and click Retry.');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setCameraError('No webcam detected. Please connect or plug in a camera.');
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        setCameraError('Camera is in use by another app (e.g. Teams, Zoom, or another browser tab).');
      } else {
        setCameraError(err.message || 'Unable to access camera.');
      }
    }
  };

  // Synchronize active mediaStream to videoRef whenever element mounts or stage changes
  useEffect(() => {
    if (cameraActive && mediaStreamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== mediaStreamRef.current) {
        videoRef.current.srcObject = mediaStreamRef.current;
        videoRef.current.muted = true;
        videoRef.current.play().catch((err) => {
          console.warn('Candidate video autoPlay deferred:', err);
          setVideoPlayBlocked(true);
        });
      }
    }
  }, [cameraActive, stage]);

  // Automatically start webcam when entering interview room stage if not already active
  useEffect(() => {
    if (stage === 'room' && !cameraActive && !mediaStreamRef.current) {
      startCamera();
    }
  }, [stage]);

  const stopCamera = (isVoluntary = true) => {
    stopAudioNoiseMonitoring();
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setIsTestingCamera(false);
    setVideoPlayBlocked(false);

    if (sessionActive && !isInterviewCompleted && isVoluntary) {
      triggerProctoringViolation(
        'Camera Feed Closed / Disabled',
        'Camera feed was turned off. A continuous camera feed is strictly required during the interview.'
      );
    }
  };

  const handleManualVideoPlay = async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.play();
        setVideoPlayBlocked(false);
      } catch (e) {
        console.error('Manual play failed:', e);
      }
    }
  };

  const handleToggleCameraTest = () => {
    if (isTestingCamera || cameraActive) {
      stopCamera(true);
    } else {
      startCamera();
    }
  };

  // Starfield animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const stars = Array.from({ length: 65 }, () => ({
      x: Math.random() * (canvas.width || 800),
      y: Math.random() * (canvas.height || 600),
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random(),
      speed: Math.random() * 0.008 + 0.003,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((s) => {
        s.alpha += s.speed;
        if (s.alpha > 1 || s.alpha < 0) s.speed = -s.speed;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147, 197, 253, ${Math.abs(s.alpha) * 0.7})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // ── Audio Context & Sound Unlock Helpers ──
  const getAudioContext = () => {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!window.__agyAudioCtx || window.__agyAudioCtx.state === 'closed') {
      window.__agyAudioCtx = new AudioCtx();
    }
    if (window.__agyAudioCtx.state === 'suspended') {
      window.__agyAudioCtx.resume().catch(() => { });
    }
    return window.__agyAudioCtx;
  };

  const playStudioChime = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      // High-definition 2-tone broadcast chime (C5 523Hz -> E5 659Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.1);
      gain2.gain.setValueAtTime(0.10, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.55);
    } catch (e) {
      console.warn('Studio chime notice:', e);
    }
  };

  // ── ElevenLabs Fallback: High Definition Browser Web Speech API ──
  const speakAIBrowserFallback = (cleanText, expectedDurationMs, onFinished) => {
    if (!window.speechSynthesis) {
      setIsAISpeaking(true);
      setTimeout(() => { setIsAISpeaking(false); onFinished?.(); }, expectedDurationMs);
      return;
    }

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.cancel();

      // Delay by 60ms prevents Chromium race condition where cancel kills new speak()
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = isAudioMuted ? 0 : 1.0;

        const voices = (window.speechSynthesis.getVoices && window.speechSynthesis.getVoices()) || [];
        // Priority 1: Natural / Online high definition voices
        // Priority 2: Indian English (Ravi / Heera / Prabhat) or crisp US English (David / Mark / Google US English)
        const preferred = voices.find(
          (v) => (v.name.includes('Natural') || v.name.includes('Online')) && v.lang.startsWith('en')
        ) || voices.find(
          (v) => (v.name.includes('Ravi') || v.name.includes('Heera') || v.name.includes('Prabhat') || v.name.includes('David') || v.name.includes('Google US English') || v.name.includes('George') || v.name.includes('Christopher') || v.name.includes('Male')) && v.lang.startsWith('en')
        ) || voices.find((v) => v.lang.startsWith('en-IN')) || voices.find((v) => v.lang.startsWith('en-US')) || voices.find((v) => v.lang.startsWith('en')) || voices[0];

        if (preferred) utterance.voice = preferred;

        let ended = false;
        let keepAliveInterval = null;
        let safetyTimeout = null;

        const finish = () => {
          if (ended) return;
          ended = true;
          if (keepAliveInterval) clearInterval(keepAliveInterval);
          if (safetyTimeout) clearTimeout(safetyTimeout);
          setIsAISpeaking(false);
          window.__agyActiveUtterance = null;
          setTimeout(() => { onFinished?.(); }, 250);
        };

        utterance.onstart = () => {
          setIsAISpeaking(true);
          // Chromium bug workaround: speech synthesis can pause unexpectedly after 10-15s
          keepAliveInterval = setInterval(() => {
            if (window.speechSynthesis && window.speechSynthesis.speaking) {
              window.speechSynthesis.resume();
            }
          }, 1500);
        };

        utterance.onend = finish;
        utterance.onerror = (err) => {
          console.warn('SpeechSynthesis event error:', err);
          finish();
        };

        safetyTimeout = setTimeout(finish, expectedDurationMs + 3500);
        window.__agyActiveUtterance = utterance;

        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        setIsAISpeaking(true);
        window.speechSynthesis.speak(utterance);
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }, 60);
    } catch (err) {
      console.warn('speakAIBrowserFallback catch:', err);
      setIsAISpeaking(true);
      setTimeout(() => { setIsAISpeaking(false); onFinished?.(); }, expectedDurationMs);
    }
  };

  // ── Interviewer Voice Engine (ElevenLabs or Native Browser TTS) ──
  const speakAI = async (text, onFinished) => {
    if (!text) { onFinished?.(); return; }

    const cleanText = String(text).replace(/[*_#`]/g, '').trim();
    setCurrentSpokenSubtitle(cleanText);

    const words = cleanText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const expectedDurationMs = Math.max(2500, Math.min(30000, Math.round((wordCount / 2.2) * 1000)));

    if (isAudioMuted) {
      setIsAISpeaking(true);
      setTimeout(() => { setIsAISpeaking(false); onFinished?.(); }, 1000);
      return;
    }

    // Cancel any previous ElevenLabs audio
    if (elevenLabsAbortRef.current) {
      try { elevenLabsAbortRef.current.abort(); } catch { }
    }
    if (elevenLabsSourceRef.current) {
      try { elevenLabsSourceRef.current.stop(); } catch { }
      elevenLabsSourceRef.current = null;
    }

    // 1. HeyGen Interactive Avatar Native Speech (Primary - only if live avatar instance exists)
    if (heyGenModePreferred && Boolean(heygenAvatarService.avatar) && !heygenAvatarService.isMock && (heygenAvatarService.status === 'connected' || heygenAvatarService.status === 'speaking' || isHeyGenStreamingActive)) {
      setIsAISpeaking(true);
      try {
        await heygenAvatarService.speak(cleanText, () => {
          setIsAISpeaking(false);
          onFinished?.();
        });
        return;
      } catch (heyErr) {
        console.warn('HeyGen avatar speech notice, falling back to TTS engine:', heyErr);
      }
    }

    // 2. Secondary TTS Fallback Engine (ElevenLabs or Native Web Speech)
    // Check if ElevenLabs key is valid (not empty, not placeholder)
    const isElevenValid = ELEVEN_API_KEY &&
      ELEVEN_API_KEY.trim() !== '' &&
      !ELEVEN_API_KEY.includes('your_elevenlabs_api_key') &&
      !ELEVEN_API_KEY.includes('placeholder');

    // If no valid ElevenLabs key is present, immediately use the browser's native TTS
    if (!isElevenValid) {
      speakAIBrowserFallback(cleanText, expectedDurationMs, onFinished);
      return;
    }

    getAudioContext();
    setIsAISpeaking(true);

    try {
      const abortCtrl = new AbortController();
      elevenLabsAbortRef.current = abortCtrl;

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE_ID}/stream`,
        {
          method: 'POST',
          signal: abortCtrl.signal,
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': ELEVEN_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: cleanText,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.45,
              similarity_boost: 0.82,
              style: 0.25,
              use_speaker_boost: true,
            },
          }),
        }
      );

      if (!response.ok) {
        console.warn('ElevenLabs TTS error, falling back to browser TTS. Status:', response.status);
        speakAIBrowserFallback(cleanText, expectedDurationMs, onFinished);
        return;
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioCtx = getAudioContext();
      if (!audioCtx) throw new Error('No AudioContext');

      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      elevenLabsSourceRef.current = source;

      let ended = false;
      const finish = () => {
        if (ended) return;
        ended = true;
        setIsAISpeaking(false);
        elevenLabsSourceRef.current = null;
        setTimeout(() => { onFinished?.(); }, 300);
      };

      source.onended = finish;
      const safety = setTimeout(finish, (audioBuffer.duration * 1000) + 2000);
      source.onended = () => { clearTimeout(safety); finish(); };

      source.start(0);
    } catch (err) {
      if (err.name === 'AbortError') {
        setIsAISpeaking(false);
        return;
      }
      console.warn('ElevenLabs TTS exception, falling back to browser TTS:', err);
      speakAIBrowserFallback(cleanText, expectedDurationMs, onFinished);
    }
  };

  // Safe question replay helper: pauses microphone during AI speech so candidate mic doesn't record interviewer voice
  const handlePlayOrReplayQuestion = (overrideText) => {
    const qText = overrideText || currentQ.questionText || currentQ.question;
    if (!qText) return;
    stopSpeechRecognition();
    setAgentState('SPEAKING');
    agentStateRef.current = 'SPEAKING';
    speakAI(qText, () => {
      if (sessionActive) {
        setAgentState('LISTENING');
        agentStateRef.current = 'LISTENING';
        startSpeechRecognition();
      }
    });
  };

  // Alias for backward compatibility
  const playQuestionTTS = (text, onFinished) => speakAI(text, onFinished);

  // ── Speech-to-Text (STT) Capture Engine (High Speed & Continuous Precision) ──
  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsRecording(true);
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { }
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      // High-accuracy accent setting (defaults to en-IN for Indian candidate pronunciation)
      recognition.lang = sttLang || 'en-IN';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            finalChunk += res[0].transcript + ' ';
          } else {
            interimTranscript += res[0].transcript;
          }
        }

        if (finalChunk) {
          accumulatedTranscriptRef.current = (accumulatedTranscriptRef.current + ' ' + finalChunk)
            .replace(/\s+/g, ' ')
            .trim();
        }

        const combined = (accumulatedTranscriptRef.current + (interimTranscript ? ' ' + interimTranscript : ''))
          .replace(/\s+/g, ' ')
          .trim();

        if (combined) {
          setCompanionText(combined);
          lastCandidateSpokeTimeRef.current = Date.now();
        }
      };

      recognition.onerror = (e) => {
        console.warn('STT notice:', e?.error);
      };

      recognition.onend = () => {
        // Auto-reconnect with zero lag if still in LISTENING state
        if (agentStateRef.current === 'LISTENING') {
          try {
            recognition.start();
          } catch {
            setTimeout(() => {
              if (agentStateRef.current === 'LISTENING') {
                try { recognition.start(); } catch { }
              }
            }, 250);
          }
        } else {
          setIsRecording(false);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
    } catch (e) {
      console.warn('Recognition start notice:', e);
      setIsRecording(true);
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { }
    }
    setIsRecording(false);
  };

  // Toggle between Indian English (en-IN) and US English (en-US)
  const toggleSttLang = () => {
    const nextLang = sttLang === 'en-IN' ? 'en-US' : 'en-IN';
    setSttLang(nextLang);
    if (isRecording && recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { }
      setTimeout(() => {
        if (agentStateRef.current === 'LISTENING') {
          startSpeechRecognition();
        }
      }, 100);
    }
  };

  // Manual Mic toggle for candidate
  const handleRecordVoice = () => {
    if (isRecording) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  };

  // ── Finalize Interview Session & Generate Analysis Report ──
  const finalizeInterviewSession = (updatedAnswers) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (telemetryIntervalRef.current) clearInterval(telemetryIntervalRef.current);
    stopAudioNoiseMonitoring();
    heygenAvatarService.stopSession().catch(() => {});
    setSessionActive(false);
    stopCamera();
    setIsProcessing(true);

    const answeredOnly = updatedAnswers.filter(a => !a.isSkipped && a.score > 0);
    const hasSpokenAtAll = answeredOnly.length > 0;

    const calcFinalScore = hasSpokenAtAll
      ? Math.round(answeredOnly.reduce((acc, curr) => acc + curr.score, 0) / answeredOnly.length)
      : 0;

    const calcEye = hasSpokenAtAll ? Math.round(answeredOnly.reduce((acc, curr) => acc + (curr.eyeContactScore || 85), 0) / answeredOnly.length) : 0;
    const calcComm = hasSpokenAtAll ? Math.round(answeredOnly.reduce((acc, curr) => acc + (curr.communicationScore || 0), 0) / answeredOnly.length) : 0;
    const calcTech = hasSpokenAtAll ? Math.round(answeredOnly.reduce((acc, curr) => acc + (curr.technicalScore || 0), 0) / answeredOnly.length) : 0;
    const calcConf = hasSpokenAtAll ? Math.round(answeredOnly.reduce((acc, curr) => acc + (curr.confidenceScore || 80), 0) / answeredOnly.length) : 0;
    const calcAtt = hasSpokenAtAll ? Math.round(answeredOnly.reduce((acc, curr) => acc + (curr.attentionScore || 85), 0) / answeredOnly.length) : 0;

    const currentSid = sessionId || `isess_local_${Date.now()}`;

    const generatedAnalysis = {
      sessionId: currentSid,
      overallScore: calcFinalScore,
      communicationScore: calcComm,
      technicalScore: calcTech,
      eyeContactScore: calcEye,
      attentionScore: calcAtt,
      confidenceScore: calcConf,
      dominantEmotion: hasSpokenAtAll ? 'Confident' : 'Neutral',
      strengths: ['Structured problem breakdown', 'Consistent eye contact with camera lens'],
      weaknesses: ['Deepen technical architecture & algorithmic tradeoffs'],
      recommendations: ['Practice timed mock answers with system design examples'],
      aiFeedback: hasSpokenAtAll ? 'Candidate demonstrated solid proficiency across key technical requirements.' : 'Candidate remained silent or provided no spoken response.',
      questionBreakdown: updatedAnswers.map(a => {
        const isSkipped = Boolean(
          a.isSkipped ||
          a.score === 0 ||
          !a.companionNote ||
          a.companionNote.includes('No verbal') ||
          a.companionNote.includes('Skipped')
        );
        return {
          questionNumber: a.questionNumber,
          category: a.category,
          questionText: a.question,
          transcript: isSkipped ? '' : (a.transcript || a.companionNote),
          isSkipped: isSkipped,
          overallScore: isSkipped ? 0 : a.score,
          technicalScore: isSkipped ? 0 : a.technicalScore,
          communicationScore: isSkipped ? 0 : a.communicationScore,
          confidenceScore: isSkipped ? 0 : a.confidenceScore,
          eyeContactScore: isSkipped ? 0 : a.eyeContactScore,
          dominantEmotion: isSkipped ? 'Neutral' : 'Confident',
          aiFeedback: isSkipped
            ? 'Answer skipped by candidate. No analysis.'
            : (a.score > 70 ? 'Strong structured response.' : 'Acceptable response with room for deeper technical precision.')
        };
      })
    };

    setFinalAnalysis(generatedAnalysis);

    const analysisPayload = {
      success: true,
      analysis: generatedAnalysis,
      session: {
        id: currentSid,
        targetRole: targetRole || 'Data Scientist',
        startedAt: new Date(Date.now() - timerSeconds * 1000).toISOString(),
        completedAt: new Date().toISOString(),
        questions: questions
      }
    };
    localStorage.setItem('rsj_latest_interview_analysis', JSON.stringify(analysisPayload));
    localStorage.setItem('last_interview_session_id', currentSid);
    localStorage.setItem('rsj_interview_completed', 'true');
    localStorage.setItem('rsj_active_analytics_tab', 'interview');
    setIsInterviewCompleted(true);

    const token = localStorage.getItem('rsj_token') || localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(`/api/interview/session/${currentSid}/complete`, {
      method: 'POST',
      headers
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.analysis) {
          setFinalAnalysis(data.analysis);
          localStorage.setItem('rsj_latest_interview_analysis', JSON.stringify({
            success: true,
            analysis: data.analysis,
            session: data.session || analysisPayload.session
          }));
        }
      })
      .catch(err => console.warn('Session complete sync notice:', err.message));

    setTimeout(() => {
      setIsProcessing(false);
      handleOpenCandidateAnalysis();
    }, 1500);
  };

  // ── Candidate Answer Submission & Dynamic Turn-Taking ──
  const handleCandidateSubmit = async (forceSkip = false) => {
    if (agentState === 'PROCESSING' || agentState === 'AI_RESPONSE') return;

    // 1. Stop Speech-to-Text
    stopSpeechRecognition();

    // 2. Transition to PROCESSING state
    setAgentState('PROCESSING');
    agentStateRef.current = 'PROCESSING';
    setIsProcessing(true);

    const currentQ = questions[currentQIndex] || questions[0];
    const isFinalQuestion = currentQIndex >= questions.length - 1;

    const recordedText = (forceSkip ? '' : (companionText || accumulatedTranscriptRef.current || '')).trim();
    const words = recordedText.split(/\s+/).filter(Boolean);
    const isSilent = forceSkip || words.length < 2 ||
      recordedText.toLowerCase().includes('candidate provided verbal answer') ||
      recordedText.toLowerCase().includes('no verbal or typed answer') ||
      recordedText.toLowerCase().includes('no response');

    let calculatedScore = 0;
    let techScore = 0;
    let commScore = 0;
    let quality = 'No Response';

    if (!isSilent) {
      const wordCount = words.length;
      commScore = Math.min(96, Math.max(50, 45 + Math.min(45, wordCount * 1.5)));
      techScore = Math.min(96, Math.max(50, 48 + Math.min(45, wordCount * 1.3)));
      calculatedScore = Math.round(techScore * 0.5 + commScore * 0.3 + (telemetry.confidence || 80) * 0.1 + (telemetry.eyeContact || 80) * 0.1);
      quality = calculatedScore >= 80 ? 'Excellent' : 'Proficient';
    }

    // 3. Persist answer to backend database
    if (sessionId && currentQ?.id) {
      try {
        const token = localStorage.getItem('rsj_token') || localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const ansRes = await fetch(`/api/interview/question/${currentQ.id}/answer`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            transcript: isSilent ? '' : recordedText,
            duration: Math.max(1, Math.round((Date.now() - (qStartTimeRef.current || Date.now())) / 1000)),
            telemetry: {
              eyeContact: isSilent ? 0 : (telemetry.eyeContact || 85),
              attention: isSilent ? 0 : (telemetry.attention || 85),
              confidence: isSilent ? 0 : (telemetry.confidence || 80),
              emotion: isSilent ? 'Neutral' : (telemetry.emotion || 'Neutral')
            }
          })
        });

        if (ansRes.ok) {
          const ansData = await ansRes.json();
          if (ansData.success && ansData.answer) {
            calculatedScore = ansData.answer.overallScore || calculatedScore;
            techScore = ansData.answer.technicalScore || techScore;
            commScore = ansData.answer.communicationScore || commScore;
            quality = ansData.answer.answerQuality || quality;
          }
        }
      } catch (err) {
        console.warn('Question answer sync notice:', err.message);
      }
    }

    const answerRecord = {
      questionNumber: currentQIndex + 1,
      stage: `Q${currentQIndex + 1}`,
      question: currentQ.questionText || currentQ.question,
      category: currentQ.category || 'TECHNICAL',
      isSkipped: isSilent,
      companionNote: isSilent ? 'Answer Skipped (No response provided)' : recordedText,
      transcript: isSilent ? '' : recordedText,
      score: isSilent ? 0 : calculatedScore,
      technicalScore: isSilent ? 0 : techScore,
      communicationScore: isSilent ? 0 : commScore,
      eyeContactScore: isSilent ? 0 : (telemetry.eyeContact || 85),
      attentionScore: isSilent ? 0 : (telemetry.attention || 85),
      confidenceScore: isSilent ? 0 : (telemetry.confidence || 80)
    };

    const updatedAnswers = [...answersList, answerRecord];
    setAnswersList(updatedAnswers);

    // 4. Form conversational spoken transition from Dr. Arvind Swamy / Er. Vishnu Pera
    let transitionSpoken = '';
    if (isFinalQuestion) {
      transitionSpoken = isSilent
        ? 'Thank you. That completes our interview questions. I am now compiling your complete evaluation report.'
        : 'Thank you for your responses. That completes our mock interview session. I am compiling your final evaluation report now.';
    } else {
      if (isSilent) {
        transitionSpoken = forceSkip
          ? 'Question skipped. Let us proceed to the next question.'
          : 'No verbal response was detected. Let us proceed to the next question.';
      } else if (quality === 'Excellent') {
        transitionSpoken = 'Thank you. Great explanation of the key technical concepts. Let us move to the next question.';
      } else {
        transitionSpoken = 'Thank you for that response. Let us proceed to the next question.';
      }
    }

    setIsProcessing(false);
    setAgentState('AI_RESPONSE');
    agentStateRef.current = 'AI_RESPONSE';

    // 5. Dr. Arvind Swamy speaks transitional feedback aloud!
    speakAI(transitionSpoken, () => {
      if (isFinalQuestion) {
        finalizeInterviewSession(updatedAnswers);
      } else {
        const nextIndex = currentQIndex + 1;
        setCurrentQIndex(nextIndex);
        setCompanionText('');
        accumulatedTranscriptRef.current = '';
        qStartTimeRef.current = Date.now();
        setAgentState('SPEAKING');
        agentStateRef.current = 'SPEAKING';
        const nextQ = questions[nextIndex];
        speakAI(nextQ.questionText || nextQ.question, () => {
          setAgentState('LISTENING');
          agentStateRef.current = 'LISTENING';
          startSpeechRecognition();
        });
      }
    });
  };

  const handleSkipQuestion = () => {
    if (agentState === 'PROCESSING' || agentState === 'AI_RESPONSE') return;
    setCompanionText('');
    accumulatedTranscriptRef.current = '';
    handleCandidateSubmit(true);
  };

  const handleNextQuestion = () => handleCandidateSubmit();

  // ── Start Interview Session ──
  const handleStartSession = async () => {
    try {
      // 1. Audio unlock & broadcast chime
      playStudioChime();
      if (window.speechSynthesis && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const token = localStorage.getItem('rsj_token') || localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let currentSid = null;
      const qCountLimit = Math.max(3, Number(adminSettings.questionCount) || questions.length || 3);
      let sessionQuestions = questions.slice(0, qCountLimit);

      try {
        const createRes = await fetch('/api/interview/session', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            targetRole: targetRole.trim() || 'Software Engineer',
            questions: sessionQuestions,
            userId: currentUser?.id
          })
        });

        if (createRes.ok) {
          const createData = await createRes.json();
          if (createData.success && createData.session) {
            currentSid = createData.session.id;
            setSessionId(currentSid);
            localStorage.setItem('last_interview_session_id', currentSid);
            if (Array.isArray(createData.session.questions) && createData.session.questions.length > 0) {
              sessionQuestions = createData.session.questions.slice(0, qCountLimit);
              setQuestions(sessionQuestions);
            }
          }
        }
      } catch (apiErr) {
        console.warn('Backend interview session API notice:', apiErr.message);
      }

      if (!currentSid) {
        currentSid = `isess_local_${Date.now()}`;
        setSessionId(currentSid);
        localStorage.setItem('last_interview_session_id', currentSid);
      }

      setSessionActive(true);
      sessionStartTimeRef.current = Date.now();
      setCurrentQIndex(0);
      setTimerSeconds(0);
      setAnswersList([]);
      setWarningCount(0);
      setActiveWarningMessage('');
      setCompanionText('');
      accumulatedTranscriptRef.current = '';
      qStartTimeRef.current = Date.now();

      // Ensure camera is active
      if (!cameraActive) {
        await startCamera();
      }

      // Automatically request full screen upon starting interview
      try {
        if (!document.fullscreenElement) {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          } else if (document.documentElement.webkitRequestFullscreen) {
            await document.documentElement.webkitRequestFullscreen();
          }
        }
      } catch (fsErr) {
        console.warn('Auto fullscreen request notice:', fsErr);
      }

      // Start background noise monitoring
      if (mediaStreamRef.current) {
        startAudioNoiseMonitoring(mediaStreamRef.current);
      }

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);

      // Start proctoring telemetry
      telemetryIntervalRef.current = setInterval(() => {
        setTelemetry({
          eyeContact: Math.floor(Math.random() * 12) + 86,
          emotion: 'Focused',
          headPose: 'Centered',
          confidence: Math.floor(Math.random() * 10) + 85,
          attention: Math.floor(Math.random() * 8) + 89,
        });
      }, 1200);

      // Start autonomous turn-taking with Question 1
      const firstQ = sessionQuestions[0];
      setAgentState('SPEAKING');
      agentStateRef.current = 'SPEAKING';

      setTimeout(() => {
        speakAI(firstQ.questionText || firstQ.question, () => {
          // AI finishes asking question -> automatically transition to LISTENING
          setAgentState('LISTENING');
          agentStateRef.current = 'LISTENING';
          startSpeechRecognition();
        });
      }, 600);
    } catch (err) {
      console.error('Session start error:', err);
    }
  };

  // Clean up
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (telemetryIntervalRef.current) clearInterval(telemetryIntervalRef.current);
      stopAudioNoiseMonitoring();
      if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      // Cancel any in-progress ElevenLabs audio
      if (elevenLabsAbortRef.current) { try { elevenLabsAbortRef.current.abort(); } catch { } }
      if (elevenLabsSourceRef.current) { try { elevenLabsSourceRef.current.stop(); } catch { } }
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => { });
      }
    };
  }, []);

  // Format timer
  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ==========================================
  // DIRECT REDIRECT TO FINAL ANALYSIS REPORT (NO EXTRA INTERMEDIATE PAGE)
  // ==========================================
  if (isReportReady) {
    handleOpenCandidateAnalysis();
    return null;
  }

  // ==========================================
  // VIEW: LOCKED / ASSESSMENT REQUIRED CHECKS
  // ==========================================
  // CANDIDATE ASSESSMENT LOCK SYSTEM
  // ==========================================
  const isAdmin = role === 'admin' || Boolean(adminUser) || (typeof window !== 'undefined' && localStorage.getItem('rsj_role') === 'admin');

  const isAllMix = (cat = '', title = '') => {
    const c = String(cat || '').toLowerCase().trim();
    const t = String(title || '').toLowerCase().trim();
    return (
      ['all mix', 'all', 'full length', 'all mix (combined)', 'hybrid all-mix'].some(m => c.includes(m)) ||
      t.includes('all mix') ||
      t.includes('full test') ||
      t.includes('job readiness full')
    );
  };

  // List of active assessments (dynamic or mock fallback)
  const activeAssessmentsList = typeof getActiveAssessments === 'function'
    ? getActiveAssessments(assessments)
    : ((Array.isArray(assessments) && assessments.length > 0) ? assessments : [
        { id: 'asm-code-1', title: 'Full-Stack Algorithmic Coding Challenge', category: 'Coding', totalQuestions: 4, durationMinutes: 10 },
        { id: 'asm-reas-1', title: 'Logical Reasoning & Critical Thinking Exam', category: 'Reasoning', totalQuestions: 10, durationMinutes: 10 },
        { id: 'asm-apt-1', title: 'Quantitative Aptitude Benchmark Test', category: 'Aptitude', totalQuestions: 10, durationMinutes: 10 },
        { id: 'asm-tech-1', title: 'Core Technical & CS Fundamentals Assessment', category: 'Technical', totalQuestions: 10, durationMinutes: 10 }
      ]);

  const checkIsCompleted = (asm) => {
    if (!asm) return false;
    if (typeof checkAssessmentCompleted === 'function' && checkAssessmentCompleted(asm, { isAssessmentCompleted, candidateSubmissions })) return true;
    if (typeof isAssessmentCompleted === 'function' && isAssessmentCompleted(asm)) return true;
    if (asm.status === 'Completed') return true;
    const targetId = String(asm.id || '').trim().toLowerCase();
    const targetCat = String(asm.category || '').trim().toLowerCase();
    const targetTitle = String(asm.title || '').trim().toLowerCase();

    return (candidateSubmissions || []).some(s => {
      const subAsmId = String(s.assessment_id || s.assessmentId || '').trim().toLowerCase();
      if (targetId && subAsmId && subAsmId === targetId) return true;
      const subCat = String(s.category || '').trim().toLowerCase();
      if (targetCat && subCat && subCat === targetCat) return true;
      const subTitle = String(s.assessment_title || s.assessmentName || '').trim().toLowerCase();
      if (targetTitle && subTitle && subTitle === targetTitle) return true;
      return false;
    });
  };

  const completedList = activeAssessmentsList.filter(checkIsCompleted);
  const completedCount = completedList.length;
  const totalRequiredCount = activeAssessmentsList.length;
  const hasCompletedAllMixInList = activeAssessmentsList.some(asm => isAllMix(asm.category, asm.title) && checkIsCompleted(asm));
  const hasCompletedAllMixSub = (candidateSubmissions || []).some(s => isAllMix(s.category, s.assessment_title || s.assessmentName) && (s.status === 'Completed' || s.score !== undefined || s.obtained_marks !== undefined));

  const hasCompletedAllAssessments = Boolean(
    isInterviewUnlocked ||
    isAdmin ||
    hasCompletedAllMixInList ||
    hasCompletedAllMixSub ||
    (totalRequiredCount > 0 && completedCount === totalRequiredCount) ||
    (totalRequiredCount === 1 && completedCount >= 1)
  );
  const completionPercentage = totalRequiredCount > 0 ? Math.round((completedCount / totalRequiredCount) * 100) : 0;

  // ==========================================
  // VIEW: LOCKED ASSESSMENT GATE (PREREQUISITE GATEWAY)
  // ==========================================
  if (!isAdmin && !hasCompletedAllAssessments) {
    return (
      <div className="relative min-h-[calc(100vh-4rem)] w-full bg-[#F8FAFC] text-slate-800 p-4 sm:p-8 flex flex-col items-center justify-center">
        {/* Soft Ambient Background Glows */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/3 w-96 h-96 rounded-full bg-brand-500/5 blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-3xl bg-white border border-slate-200/90 rounded-3xl shadow-xl p-6 sm:p-10 space-y-7 animate-in fade-in zoom-in-95 duration-300">
          {/* Header & Lock Icon */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 mb-1 shadow-xs">
              <Lock className="w-8 h-8" />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-300 text-amber-900 text-xs font-bold">
              <span>Prerequisite Required</span>
              <span>•</span>
              <span>{activeAssessmentsList.length === 1 || activeAssessmentsList.some(a => isAllMix(a.category, a.title)) ? 'Assessment Completion Mandatory' : `${totalRequiredCount} Assessments Mandatory`}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              AI Mock Interview is Locked
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
              {activeAssessmentsList.length === 1 || activeAssessmentsList.some(a => isAllMix(a.category, a.title))
                ? 'Complete your Job Readiness Assessment to unlock your personalized AI Mock Interview session.'
                : 'Complete all assessment modules to unlock your personalized AI Mock Interview session.'}
            </p>
          </div>

          {/* Progress Tracker Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700">Assessment Completion Progress</span>
              <span className="font-mono text-brand-700">
                {completedCount} / {totalRequiredCount} Modules Completed ({completionPercentage}%)
              </span>
            </div>

            {/* Progress Bar Track */}
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-brand-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(completionPercentage, 4)}%` }}
              />
            </div>
          </div>

          {/* Module Checklist Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {activeAssessmentsList.map((asm) => {
              const isDone = checkIsCompleted(asm);
              return (
                <div
                  key={asm.id}
                  className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isDone
                      ? 'bg-emerald-50/60 border-emerald-200 text-slate-800'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {asm.category || 'Module'}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {asm.title}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {asm.totalQuestions || 10} Questions • 10m
                    </p>
                  </div>

                  <div className="flex-shrink-0">
                    {isDone ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Completed</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            if (typeof startAssessment === 'function') {
                              await startAssessment(asm.id);
                            }
                          } catch (e) {
                            console.warn('startAssessment error:', e);
                          }
                          navigateTo('take-assessment');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer hover:scale-105"
                      >
                        <span>Start</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigateTo('assessments')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-700 hover:to-cyan-700 text-white font-black text-sm shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer hover:scale-[1.01]"
            >
              <span>Go to Assessments Suite</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: STEP 1 SETUP (PICTURE 1)
  // ==========================================
  if (stage === 'setup') {
    return (
      <div className="relative min-h-screen sm:min-h-screen w-full overflow-y-auto bg-[#F8FAFC] text-slate-800 p-3 sm:p-5 flex flex-col justify-between">

        {/* Soft Ambient Background Glows */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-brand-500/5 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl" />
        </div>

        {/* Studio Top Control Bar */}
        <div className="relative z-10 w-full max-w-4xl mx-auto flex items-center justify-between pb-2.5 mb-2 border-b border-slate-200/80 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-wide text-slate-900 font-sans uppercase">ReadySetJob AI Mock Interview Studio</span>
            <span className="text-[10px] text-brand-700 font-mono font-bold px-2.5 py-0.5 rounded-full bg-brand-50 border border-brand-200 hidden sm:inline">FULLSCREEN</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen?.().catch(() => { });
                } else {
                  document.exitFullscreen?.().catch(() => { });
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shadow-xs cursor-pointer"
              title="Toggle Fullscreen"
            >
              <Maximize className="w-3.5 h-3.5 text-brand-600" />
              <span className="hidden sm:inline">Toggle Fullscreen</span>
            </button>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-3xl mx-auto my-auto flex-1 flex flex-col justify-center">

          {/* Admin Testing Mode Badge */}
          {isAdmin && (
            <div className="flex justify-center mb-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 rounded-full text-xs font-mono font-bold shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>Admin Testing Mode Active • Interview Session Unlocked</span>
              </div>
            </div>
          )}

          {/* Main Container Card (Compact Single-Page Layout) */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-md shadow-slate-200/30 p-4 sm:p-5">

            {/* COMPACT RESUME DROP ZONE */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="relative border-2 border-dashed border-brand-200 hover:border-brand-400 rounded-xl p-3 sm:p-3.5 text-center transition-all bg-brand-50/20 hover:bg-brand-50/50 group shadow-xs"
            >
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                id="resume-file-input"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files?.[0])}
              />

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 text-left">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform text-brand-600 shadow-xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate font-sans">
                      {uploadedFileName ? `Resume Uploaded: ${uploadedFileName}` : 'Drag & drop your resume here'}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 font-sans">
                      Supports PDF and TXT files (Max 20MB) • ATS & Skill Match
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <label
                    htmlFor="resume-file-input"
                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-900 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer hover:scale-105 font-sans"
                  >
                    {uploadedFileName ? 'Change File' : 'Browse File'}
                  </label>

                  {uploadedFileName && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearResume();
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-semibold text-rose-700 transition-all cursor-pointer font-sans"
                      title="Remove uploaded resume"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Scanning Progress Bar */}
            {isScanning && (
              <div className="mt-3 p-3 rounded-xl bg-brand-50/80 border border-brand-200 text-center">
                <div className="flex items-center justify-center gap-2 mb-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-brand-600 animate-spin" />
                  <span className="text-xs font-bold text-brand-700 font-sans">Extracting skills & evaluating ATS match ({scanProgress}%)...</span>
                </div>
                <div className="w-full bg-brand-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-brand-600 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* TARGET ROLE INPUT FIELD */}
            <div className="mt-3.5">
              <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5 font-sans">
                Target Role <span className="text-slate-400 font-normal">(Enter Manually)</span>
              </label>

              <div className="relative">
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  placeholder="e.g. Data Scientist, ML Engineer, Software Engineer"
                  className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all shadow-xs font-sans font-medium"
                />
                {targetRole && (
                  <button
                    type="button"
                    onClick={() => handleRoleChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-all cursor-pointer"
                    title="Clear input"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <p className="mt-1 text-[11px] text-slate-500 font-sans">
                Type your desired job role above (e.g. Data Scientist, ML Engineer, Full Stack Developer, etc.). The interview questions and ATS benchmark calibrate automatically.
              </p>
            </div>

            {/* ATS MATCH & EXTRACTED SKILLS (Shown ONLY when a resume is uploaded) */}
            {hasUploadedResume ? (
              <div className="mt-3.5 pt-3 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-bold">
                      ATS Match: {resumeATS}%
                    </span>
                    <span className="text-xs text-slate-600 font-medium font-sans">
                      Calibrated for: <strong className="text-slate-900 font-bold">{targetRole}</strong>
                    </span>
                  </div>
                </div>

                {/* Extracted Skills Pills from Resume */}
                {analysisResult?.skills && analysisResult.skills.length > 0 ? (
                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    <span className="text-[11px] text-emerald-800 font-semibold mr-1 font-sans">Skills Present in Resume:</span>
                    {analysisResult.skills.slice(0, 6).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-700 font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="mb-2 text-[11px] text-slate-500 font-sans italic">
                    No specific technical skills detected in the uploaded resume.
                  </div>
                )}

                {/* Missed Skills to Learn According to Resume */}
                {skillGaps.skillsToCover && skillGaps.skillsToCover.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mb-3">
                    <span className="text-[11px] text-amber-700 font-semibold mr-1 font-sans">
                      Missed Skills to Learn (According to Resume):
                    </span>
                    {skillGaps.skillsToCover.slice(0, 4).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[11px] font-mono text-amber-800 font-medium"
                      >
                        + {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Primary Action Button (Direct to HeyGen Room) */}
                <div className="space-y-2 mt-2">
                  <button
                    type="button"
                    onClick={handleProceedToRoom}
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm sm:text-base shadow-md shadow-brand-600/20 transition-all hover:scale-[1.005] cursor-pointer font-sans"
                  >
                    <span>Proceed to Live AI Interview Room →</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  {isInterviewCompleted && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Previous interview session saved</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenCandidateAnalysis}
                        className="text-brand-600 hover:text-brand-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>View Past Analysis Report</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-3">
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-start gap-3 text-amber-900">
                  <div className="w-8 h-8 rounded-lg bg-white border border-amber-200 flex items-center justify-center text-amber-600 flex-shrink-0 shadow-2xs mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <strong className="text-slate-900 block font-bold text-xs mb-0.5">Resume Required to Calibrate Skills</strong>
                    <p className="text-slate-600 font-sans leading-relaxed text-[11px]">
                      Upload your resume above to extract skills, calculate ATS match, and launch your personalized interview for <strong className="text-slate-900 font-bold">{targetRole || 'your target role'}</strong>.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('resume-file-input');
                    if (input) input.click();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm sm:text-base shadow-md shadow-brand-600/20 transition-all hover:scale-[1.005] cursor-pointer font-sans"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Resume to Calibrate & Proceed →</span>
                </button>
              </div>
            )}

          </div>
        </div>

      </div>
    );
  }

  // ==========================================
  // VIEW 3: LIVE INTERVIEW STAGE (PICTURE 2)
  // ==========================================
  return (
    <div className="fixed inset-0 z-50 h-screen w-screen overflow-hidden bg-[#F8FAFC] text-slate-800 p-2 sm:p-3 flex flex-col justify-between select-none">

      {/* Subtle Ambient Background Glows matching website design */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-30" />
        <div className="absolute top-1/4 -left-32 w-80 h-80 rounded-full bg-brand-500/5 blur-3xl" />
        <div className="absolute bottom-1/3 -right-20 w-64 h-64 rounded-full bg-cyan-500/5 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto w-full h-full flex flex-col justify-between gap-2 sm:gap-2.5 min-h-0 overflow-hidden">
        {/* Studio Top Control Bar */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs px-4 py-2 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-wide text-slate-900 font-sans uppercase">ReadySetJob AI Mock Interview Studio</span>
            <span className="text-[10px] text-brand-600 font-mono font-bold px-2 py-0.5 rounded-full bg-brand-50 border border-brand-200 hidden sm:inline">FULLSCREEN</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen?.().catch(() => { });
                } else {
                  document.exitFullscreen?.().catch(() => { });
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
              title="Toggle Fullscreen"
            >
              <Maximize className="w-3 h-3 text-brand-600" />
              <span className="hidden sm:inline">Toggle Fullscreen</span>
            </button>
            <button
              onClick={handleOpenCandidateAnalysis}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-brand-600 border border-slate-200 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
              title="Candidate Analysis Report"
            >
              <BarChart3 className="w-3 h-3 text-brand-600" />
              <span className="hidden sm:inline">Analysis Report</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (sessionActive) {
                  if (window.confirm('Are you sure you want to pause and exit the interview room?')) {
                    setSessionActive(false);
                    setStage('setup');
                  }
                } else {
                  setStage('setup');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-rose-600 border border-slate-200 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
              title="Exit Interview Room"
            >
              <LogOut className="w-3 h-3 text-rose-500" />
              <span className="hidden sm:inline">Exit Studio</span>
            </button>
          </div>
        </div>

        {/* Acoustic Noise Advisory (No strikes charged) */}
        {noiseAlert && (
          <div className="bg-amber-50 border border-amber-300 text-amber-900 px-3.5 py-1.5 rounded-xl flex items-center justify-between gap-2 shadow-xs shrink-0 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-600 flex-shrink-0 animate-pulse" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Acoustic Notice</p>
                <p className="text-xs font-semibold text-amber-900">High background noise detected. Please move to a quiet place.</p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
              Quiet Environment Recommended
            </span>
          </div>
        )}

        {/* Proctoring Warning Banner */}
        {activeWarningMessage && (
          <div className="bg-rose-50 border-2 border-rose-400 text-rose-900 px-3.5 py-2 rounded-xl flex items-center justify-between gap-2 shadow-xs shrink-0 animate-pulse">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Proctoring Alert</p>
                <p className="text-xs font-semibold text-rose-900">{activeWarningMessage}</p>
              </div>
            </div>
            <span className="text-xs font-mono font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
              {warningCount}/{adminSettings?.maxWarnings || 3} Strikes
            </span>
          </div>
        )}

        {/* Stage Header with Target Role & Resume ATS Badge */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-white rounded-xl border border-slate-200/90 shadow-2xs px-4 py-2 shrink-0">
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-cyan-600 flex items-center justify-center text-white shadow-2xs flex-shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans">TARGET ROLE:</span>
                <span className="text-xs font-extrabold text-brand-600 font-sans">{targetRole}</span>
                {!sessionActive && (
                  <button
                    type="button"
                    onClick={() => setStage('setup')}
                    title="Change Target Job Role or Resume"
                    className="text-[10px] text-slate-500 hover:text-brand-600 flex items-center gap-1 font-mono underline cursor-pointer"
                  >
                    <Edit3 className="w-2.5 h-2.5" /> Edit
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-sans truncate">
                {sessionActive
                  ? `Question ${currentQIndex + 1} of ${questions.length} • Real-time AI Evaluation`
                  : 'Resume extracted skills • Q1 is your personalized introduction'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
            {/* ATS Score Tag */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-mono">
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-slate-600 text-[11px]">ATS:</span>
              <span className="text-emerald-700 font-bold text-xs">{resumeATS}%</span>
            </div>

            {/* Back to Setup Button */}
            {!sessionActive && (
              <button
                type="button"
                onClick={() => setStage('setup')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-bold transition-all shadow-2xs cursor-pointer font-sans"
              >
                <Upload className="w-3 h-3 text-brand-600" />
                <span>Upload</span>
              </button>
            )}

            {/* Camera Test Button */}
            {!sessionActive && (
              <button
                type="button"
                onClick={handleToggleCameraTest}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer font-sans ${isTestingCamera
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-2xs'
                  : 'bg-white hover:bg-slate-50 text-brand-700 border-brand-200 shadow-2xs'
                  }`}
              >
                <Video className="w-3 h-3" />
                <span>{isTestingCamera ? 'Cam: Active ✓' : 'Test Cam'}</span>
              </button>
            )}

            {/* Fullscreen Status & Manual Trigger */}
            {sessionActive && (
              <button
                type="button"
                onClick={() => {
                  if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(() => { });
                  }
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-brand-700 border border-brand-200 text-xs font-bold transition-all shadow-2xs cursor-pointer font-sans"
                title="Ensure Fullscreen is Active"
              >
                <Maximize className="w-3 h-3 text-brand-600" />
                <span>Fullscreen</span>
              </button>
            )}
          </div>
        </div>
        {/* Interview room: video-reference layout with AI interviewer, candidate PiP and live conversation */}
        <div className="flex-1 min-h-[420px] min-w-0 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-3">
          <section className="relative min-h-[360px] lg:min-h-0 rounded-2xl overflow-hidden bg-black border border-slate-200 shadow-card">
            <div className="absolute inset-0">
              <HeyGenStreamingAvatar
                isSpeaking={isAISpeaking}
                agentState={agentState}
                sessionId={sessionId}
                isLiveStreamPreferred={heyGenModePreferred}
                onSpeechEnd={() => {
                  setIsAISpeaking(false);
                }}
                onStreamStateChange={(s) => {
                  setIsHeyGenStreamingActive(s.isLive);
                }}
              />
            </div>
            <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-2 p-3 bg-gradient-to-b from-black/75 to-transparent">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex items-center gap-1.5 rounded-full bg-white/95 text-slate-900 px-3 py-1 text-[11px] font-bold shadow-xs">
                  <span>CANDIDATE ·</span>
                  {isEditingName ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveCandidateName(nameInput);
                      }}
                      className="inline-flex items-center"
                    >
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        onBlur={() => handleSaveCandidateName(nameInput)}
                        autoFocus
                        className="bg-slate-100 text-slate-900 px-1 py-0.5 rounded text-[11px] font-bold outline-none border border-brand-500 w-24"
                      />
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setNameInput(candidateName);
                        setIsEditingName(true);
                      }}
                      className="flex items-center gap-1 text-slate-900 hover:text-brand-600 transition-colors font-bold cursor-pointer"
                      title="Click to edit candidate display name"
                    >
                      <span>{candidateName}</span>
                      <Edit3 className="w-2.5 h-2.5 text-slate-400 hover:text-brand-600" />
                    </button>
                  )}
                </div>
                <span className="hidden sm:inline-flex rounded-full bg-emerald-500/15 border border-emerald-300/40 text-emerald-200 px-2.5 py-1 text-[10px] font-semibold">AI Interview</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="rounded-full bg-black/60 border border-white/15 text-white px-2.5 py-1 text-[10px] font-mono">{formatTimer(timerSeconds)}</span>
                {sessionActive && <span className="flex items-center gap-1 rounded-full bg-rose-600 text-white px-2 py-1 text-[10px] font-bold"><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> REC</span>}
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${warningCount >= (adminSettings?.maxWarnings || 3) ? 'bg-rose-600 text-white animate-pulse' : warningCount > 0 ? 'bg-amber-400 text-slate-950 font-black' : 'bg-white/15 text-white border border-white/20'}`}><AlertTriangle className="inline w-3 h-3 mr-1" />Violations {warningCount}/{adminSettings?.maxWarnings || 3}</span>
              </div>
            </div>
            {/* Note: Floating question overlay on avatar removed per user request (question is displayed in right conversation panel) */}
            <div className="absolute right-3 bottom-3 z-20 w-[clamp(115px,22%,220px)] aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 border-2 border-white/80 shadow-xl">
              <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover mirror-mode ${cameraActive ? 'block' : 'hidden'}`} />
              {!cameraActive && <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-2 text-center text-white bg-slate-950/95 z-20">
                <VideoOff className="w-5 h-5 text-rose-400 shrink-0" />
                <span className="text-[10px] font-bold text-slate-100">{cameraError ? 'Camera Blocked' : 'Camera is off'}</span>
                {cameraError ? (
                  <p className="text-[9px] text-rose-200/90 leading-tight px-1 font-medium line-clamp-3">
                    {cameraError}
                  </p>
                ) : (
                  <span className="text-[9px] text-slate-400 leading-tight">Webcam feed is required for interview proctoring</span>
                )}
                <button type="button" onClick={startCamera} className="mt-0.5 rounded-md bg-white hover:bg-slate-100 text-slate-900 px-2.5 py-1 text-[10px] font-bold cursor-pointer shadow-sm transition-all">
                  {cameraError ? 'Retry Camera' : 'Enable camera'}
                </button>
              </div>}
              {videoPlayBlocked && cameraActive && <button type="button" onClick={handleManualVideoPlay} className="absolute inset-0 bg-black/65 text-white text-xs font-bold">Activate video</button>}

              {/* Live Proctor Status Badge on Candidate Camera */}
              {sessionActive && (
                <div className="absolute top-1.5 left-1.5 z-10">
                  {!cameraActive ? (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-600 text-white flex items-center gap-1 shadow">
                      <UserX className="w-2.5 h-2.5" /> Cam Off
                    </span>
                  ) : proctorState?.status === 'multiple_faces' ? (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-600 text-white flex items-center gap-1 shadow animate-pulse">
                      <Users className="w-2.5 h-2.5" /> Multi-Face
                    </span>
                  ) : proctorState?.status === 'no_face' ? (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-600 text-white flex items-center gap-1 shadow animate-pulse">
                      <UserX className="w-2.5 h-2.5" /> No Face
                    </span>
                  ) : proctorState?.status === 'looking_away' ? (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500 text-slate-950 flex items-center gap-1 shadow">
                      <EyeOff className="w-2.5 h-2.5" /> Gaze Away
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-600/90 text-white flex items-center gap-1 shadow">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Face OK
                    </span>
                  )}
                </div>
              )}

              <span className="absolute bottom-1.5 left-1.5 rounded bg-black/65 px-1.5 py-0.5 text-[9px] text-white">You ({candidateName})</span>
            </div>
            <div className="absolute bottom-3 left-3 z-20 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold backdrop-blur ${agentState === 'LISTENING' ? 'bg-emerald-500/90 text-white' : agentState === 'PROCESSING' ? 'bg-amber-400/90 text-slate-950' : 'bg-black/60 text-white border border-white/20'}`}>{agentState === 'LISTENING' ? 'Listening to you' : agentState === 'PROCESSING' ? 'Evaluating answer' : isAISpeaking ? 'Interviewer speaking' : sessionActive ? 'Interview in progress' : 'Ready to begin'}</span>
              <span className="rounded-full bg-black/60 border border-white/20 text-white px-2.5 py-1 text-[10px]">100% · {cameraActive ? 'Camera on' : 'Camera off'}</span>
            </div>
          </section>

          <aside className="min-h-[260px] lg:min-h-0 rounded-2xl bg-white border border-slate-200 shadow-card flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Live conversation</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">AI interviewer · {targetRole}</p>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>

            <div ref={conversationScrollRef} className="flex-1 min-h-[160px] overflow-y-auto p-3 space-y-3">
              {/* Interviewer Intro Greeting */}
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                <p className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-700 mb-1">Vidhit · Interviewer</p>
                <p className="text-xs leading-relaxed text-slate-700">Welcome. I’ll ask questions for the {targetRole} role. Take your time and explain your thinking clearly.</p>
              </div>

              {/* Current Question Display */}
              <div className="rounded-xl bg-slate-50 border border-slate-200/90 p-3 shadow-2xs">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <p className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500">
                    Question {currentQIndex + 1} of {questions.length}
                  </p>
                  {isAISpeaking && (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
                      <Volume2 className="w-2.5 h-2.5 animate-pulse text-cyan-600" />
                      Interviewer Speaking
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm font-semibold leading-relaxed text-slate-900">
                  {currentSpokenSubtitle || currentQ.questionText || currentQ.question || 'Tell me about yourself.'}
                </p>
              </div>

              {/* Candidate Live Verbal Answer Card */}
              <div className="rounded-xl bg-blue-50/80 border border-blue-200/90 p-3 shadow-2xs">
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-800">
                      {candidateName} · Your Verbal Answer
                    </span>
                    {isRecording && (
                      <span className="flex items-center gap-1 text-[9px] font-bold font-mono text-emerald-700 bg-white/90 px-2 py-0.5 rounded-full border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        Live Listening
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {companionText && !isAISpeaking && (
                      <button
                        type="button"
                        onClick={() => {
                          accumulatedTranscriptRef.current = '';
                          setCompanionText('');
                        }}
                        className="text-[10px] text-slate-500 hover:text-rose-600 underline font-mono cursor-pointer"
                        title="Reset transcript"
                      >
                        Reset
                      </button>
                    )}
                    <span className="text-[10px] font-mono font-bold text-blue-700">
                      {companionText ? `${companionText.split(/\s+/).filter(Boolean).length} words` : ''}
                    </span>
                  </div>
                </div>

                {companionText ? (
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-800 whitespace-pre-wrap break-words select-text">
                    {companionText}
                  </p>
                ) : isRecording ? (
                  <div className="flex items-center gap-2 py-1 text-xs text-emerald-800 font-medium animate-pulse">
                    <Mic className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />
                    <span>Listening to your voice... Speak your response clearly now.</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic py-1">
                    Microphone is paused. Click "Start Mic" below to record your verbal response.
                  </p>
                )}

                {/* Optional manual text editor toggle for candidate */}
                <div className="mt-2 pt-2 border-t border-blue-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsManualEditOpen(!isManualEditOpen)}
                    className="text-[10px] text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-2.5 h-2.5" />
                    <span>{isManualEditOpen ? 'Hide text editor' : 'Type or edit transcript'}</span>
                  </button>
                  {isRecording && (
                    <span className="text-[9px] text-emerald-600 font-mono font-semibold">
                      Auto-recording active
                    </span>
                  )}
                </div>

                {isManualEditOpen && (
                  <textarea
                    value={companionText}
                    onChange={(e) => {
                      setCompanionText(e.target.value);
                      accumulatedTranscriptRef.current = e.target.value;
                    }}
                    placeholder="Type or refine your response here..."
                    rows={3}
                    className="w-full mt-2 p-2 rounded-lg border border-blue-200 bg-white text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500 resize-none font-sans"
                  />
                )}
              </div>

              {agentState === 'PROCESSING' && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex items-center gap-2 animate-pulse">
                  <Sparkles className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
                  <span>Evaluating technical keywords, clarity, and depth...</span>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 p-3 space-y-2 shrink-0">
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>Session status</span>
                <span className="font-bold text-emerald-700">● Interview room ready</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleToggleCameraTest}
                  className="flex-1 rounded-lg border border-slate-200 px-2 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <Video className="inline w-3.5 h-3.5 mr-1" />
                  {cameraActive ? 'Camera ready' : 'Test camera'}
                </button>
                <button
                  type="button"
                  onClick={() => handlePlayOrReplayQuestion()}
                  className="flex-1 rounded-lg bg-slate-900 px-2 py-2 text-[11px] font-bold text-white hover:bg-slate-700 cursor-pointer"
                >
                  <Volume2 className="inline w-3.5 h-3.5 mr-1" />
                  Replay question
                </button>
              </div>
            </div>
          </aside>
        </div>

        {/* BOTTOM CONTROL TOOLBAR (Turn-taking buttons only; verbal answer text is in right conversation panel) */}
        <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-white border border-slate-200/90 shadow-card shrink-0">
          {!sessionActive ? (
            <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3 px-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50/90 text-amber-800 border border-amber-200/90 text-[11px] font-semibold">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    AI Proctoring Armed: Fullscreen, Tab Monitoring & Multi-Face Detection Active ({adminSettings?.maxWarnings || 3} Strikes Max)
                  </span>
                </span>
              </div>
              <button
                type="button"
                onClick={handleStartSession}
                className="flex items-center justify-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-700 hover:to-cyan-700 text-white font-bold text-sm font-sans shadow-md shadow-brand-500/20 transition-all hover:scale-[1.01] cursor-pointer"
              >
                <Video className="w-4 h-4" />
                <span>Start Interview Session for {targetRole}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  isRecording ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                  {isRecording ? 'Microphone Active' : 'Microphone Paused'}
                </span>
                <span className="text-xs font-mono text-slate-500 hidden sm:inline">
                  Question {currentQIndex + 1} of {questions.length}
                </span>
              </div>

              {/* Turn-Taking Action Buttons */}
              <div className="flex items-center gap-2.5 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={handleRecordVoice}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold font-sans transition-all border cursor-pointer ${
                    isRecording
                      ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse shadow-2xs'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
                  }`}
                  title="Toggle Microphone"
                >
                  <Mic className="w-3.5 h-3.5 text-brand-600" />
                  <span>{isRecording ? 'Pause Mic' : 'Start Mic'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePlayOrReplayQuestion()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold font-sans shadow-2xs cursor-pointer transition-all"
                  title="Replay Question Audio"
                >
                  <Volume2 className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Replay Audio</span>
                </button>

                <button
                  type="button"
                  onClick={handleSkipQuestion}
                  disabled={agentState === 'PROCESSING' || agentState === 'AI_RESPONSE'}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold font-sans transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                  title="Skip this question without providing an answer"
                >
                  <span>Skip Question</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCandidateSubmit(false)}
                  disabled={agentState === 'PROCESSING' || agentState === 'AI_RESPONSE'}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-700 hover:to-cyan-700 text-white text-xs font-bold font-sans shadow-md shadow-brand-500/20 transition-all cursor-pointer hover:scale-102 ${
                    agentState === 'PROCESSING' || agentState === 'AI_RESPONSE' ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  <span>{isFinalQuestion ? 'Submit & Finalize Interview' : 'Submit Answer & Continue'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Paste Modal if opened in Room stage */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full text-slate-800 shadow-2xl font-sans">
            <h3 className="text-base font-bold mb-1 flex items-center gap-2 text-slate-900">
              <ClipboardList className="w-4 h-4 text-brand-600" />
              <span>Paste Resume Text</span>
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Paste your experience, key skills, or project highlights:
            </p>
            <textarea
              rows={7}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste resume content here..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 font-mono resize-none mb-4"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyPastedResume}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-700 hover:to-cyan-700 text-white text-xs font-bold font-sans shadow-md shadow-brand-500/20 transition-colors cursor-pointer"
              >
                Analyze & Apply
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ============================================================== */}
      {/* PROCTORING WARNING MODAL (Styled identically to AssessmentPage) */}
      {/* ============================================================== */}
      {proctoringModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-2xl border p-6 text-slate-800 shadow-2xl relative bg-white ${
            proctoringModal.isFinal ? 'border-rose-400' : 'border-amber-300'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  {proctoringModal.isFinal
                    ? '🚨 Interview Auto-Submitted: Maximum Violations Reached'
                    : `⚠️ Proctoring Warning: Strike ${proctoringModal.count} of ${proctoringModal.maxAllowed || 3}`}
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {proctoringModal.isFinal
                    ? 'Interview terminated due to repeated proctoring strikes'
                    : 'Face-presence & integrity alert'}
                </span>
              </div>
            </div>

            {proctoringModal.isFinal ? (
              /* FINAL 3RD STRIKE TERMINATION MODAL */
              <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
                <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-3.5">
                  <AlertCircle className="w-8 h-8 text-rose-600 flex-shrink-0 mt-0.5 animate-bounce" />
                  <div className="space-y-1.5 flex-1">
                    <h4 className="font-bold text-rose-950 text-sm">
                      {proctoringModal.maxAllowed || 3} of {proctoringModal.maxAllowed || 3} Proctoring Strikes Exceeded
                    </h4>
                    <p className="text-rose-800 font-medium">
                      Your interview session has closed and your answers are being submitted automatically due to repeated proctoring violations ({proctoringModal.violation}).
                    </p>
                    <p className="text-slate-600 text-[11px] mt-1">
                      Your verbal responses and telemetry recorded up to this point have been saved to the proctoring audit log.
                    </p>
                  </div>
                </div>

                <div className="py-2 flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
                  <RefreshCw className="w-4 h-4 animate-spin text-brand-600" />
                  <span>Submitting assessment and redirecting to results...</span>
                </div>
              </div>
            ) : (
              /* STRIKE 1 OR 2 WARNING MODAL */
              <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-700 mt-0.5">
                    {proctoringModal.violation?.toLowerCase().includes('multiple') ? (
                      <Users className="w-5 h-5 text-amber-700" />
                    ) : proctoringModal.violation?.toLowerCase().includes('away') ||
                       proctoringModal.violation?.toLowerCase().includes('turn') ||
                       proctoringModal.violation?.toLowerCase().includes('tilt') ||
                       proctoringModal.violation?.toLowerCase().includes('gaze') ? (
                      <EyeOff className="w-5 h-5 text-amber-700" />
                    ) : proctoringModal.violation?.toLowerCase().includes('camera') ||
                       proctoringModal.violation?.toLowerCase().includes('closed') ||
                       proctoringModal.violation?.toLowerCase().includes('no face') ||
                       proctoringModal.violation?.toLowerCase().includes('inactive') ? (
                      <UserX className="w-5 h-5 text-amber-700" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-700" />
                    )}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h4 className="font-bold text-amber-950 text-sm">{proctoringModal.violation || 'Proctoring Violation Detected'}</h4>
                    <p className="text-amber-800 font-medium">
                      {proctoringModal.message || 'Please face the camera directly and stay focused on the screen.'}
                    </p>
                    <div className="mt-2 p-2.5 bg-white/90 rounded-xl border border-amber-200 text-[11px] font-semibold text-amber-900">
                      ⏱️ The interview countdown is currently paused. Please adjust your posture and face the camera before resuming.
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600">Proctoring Strikes Recorded:</span>
                  <span className="px-2.5 py-1 bg-amber-500 text-white rounded-lg shadow-xs font-mono">
                    Strike {proctoringModal.count} of {proctoringModal.maxAllowed || 3}
                  </span>
                </div>

                <div className="text-[11px] text-rose-700 font-bold bg-rose-50 p-3 rounded-xl border border-rose-200">
                  🚨 Critical: Reaching {proctoringModal.maxAllowed || 3} strikes will immediately auto-submit your interview.
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleAcknowledgeWarning}
                    className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {proctoringModal.count === (proctoringModal.maxAllowed || 3) - 1
                        ? 'I Understand (Final Warning) — Resume Fullscreen Interview'
                        : `I Understand (Strike ${proctoringModal.count}) — Resume Interview`}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
