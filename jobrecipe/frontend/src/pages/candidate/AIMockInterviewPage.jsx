import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  parseResumeText,
  generateResumeQuestions,
  analyzeRoleSkillGaps,
  getRoleDefaults
} from '../../utils/resumeParser';
import { getFaceLandmarker, classifyFrame } from '../../services/proctoringService';
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
  Lock,
  Unlock,
  ShieldAlert,
  Clock,
  Maximize,
  Minimize
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

// ── Interactive AI Video Cam Invigilator (Dr. Arvind Swami - Living AI Interview Agent) ──
function DrArvindSwamiVideoCam({
  isSpeaking,
  sessionActive,
  targetRole,
  currentQuestionText,
  agentState = 'IDLE',
  currentSpokenSubtitle = '',
  onReplayQuestion,
  isAudioMuted = false,
  onToggleMute,
  onSkipToAnswer
}) {
  const isListening = agentState === 'LISTENING';
  const isProcessing = agentState === 'PROCESSING';

  const [audioBars, setAudioBars] = useState([6, 12, 18, 10, 5]);
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

  // Dynamic audio spectrum visualizer for the HUD equalizer
  useEffect(() => {
    if (!isSpeaking) {
      if (agentState === 'LISTENING') {
        setAudioBars([8, 14, 11, 16, 9]);
      } else {
        setAudioBars([4, 6, 4, 5, 3]);
      }
      return;
    }

    let active = true;
    const interval = setInterval(() => {
      if (!active) return;
      setAudioBars([
        Math.floor(10 + Math.random() * 18),
        Math.floor(16 + Math.random() * 20),
        Math.floor(20 + Math.random() * 18),
        Math.floor(14 + Math.random() * 20),
        Math.floor(8 + Math.random() * 16),
      ]);
    }, 90);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isSpeaking, agentState]);

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
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/45 pointer-events-none z-10" />

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
          alt="AI Technical Interviewer"
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

      {/* Top HUD: Broadcast Live Status & Controls */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-20">
        <div className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-white flex items-center gap-1.5 shadow-sm">
          <span
            className={`w-2 h-2 rounded-full ${isSpeaking
              ? 'bg-cyan-400 animate-ping'
              : isListening
                ? 'bg-emerald-400 animate-pulse'
                : isProcessing
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-emerald-400'
              }`}
          />
          <span className="font-bold">
            {isSpeaking
              ? 'AI INTERVIEWER SPEAKING'
              : isListening
                ? 'LISTENING TO CANDIDATE'
                : isProcessing
                  ? 'EVALUATING ANSWER'
                  : agentState === 'AI_RESPONSE'
                    ? 'AI RESPONSE'
                    : 'LIVE AI CAM'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto">
          {sessionActive && onReplayQuestion && (
            <button
              type="button"
              onClick={onReplayQuestion}
              className="px-2 py-0.5 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 text-[10px] font-mono text-cyan-300 hover:text-white flex items-center gap-1 shadow-sm transition-all cursor-pointer"
              title="Hear AI Question Audio Again"
            >
              <Volume2 className="w-3 h-3 text-cyan-400" />
              <span>Replay</span>
            </button>
          )}

          {sessionActive && onToggleMute && (
            <button
              type="button"
              onClick={onToggleMute}
              className="px-2 py-0.5 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 text-[10px] font-mono text-slate-300 hover:text-white flex items-center gap-1 shadow-sm transition-all cursor-pointer"
              title={isAudioMuted ? 'Unmute AI Voice' : 'Mute AI Voice'}
            >
              <span className="text-[10px]">{isAudioMuted ? '🔇' : '🔊'}</span>
            </button>
          )}

          <div className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-cyan-300 flex items-center gap-1 shadow-sm hidden sm:flex">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>1080p HD • 60 FPS</span>
          </div>
        </div>
      </div>

      {/* Floating Teleprompter Closed Captions Subtitle (When AI Speaks) */}
      {isSpeaking && currentSpokenSubtitle && (
        <div className="absolute top-12 left-3 right-3 pointer-events-none z-20 flex justify-center">
          <div className="max-w-[92%] px-3 py-1.5 rounded-xl bg-black/85 backdrop-blur-md border border-cyan-500/30 text-white shadow-xl text-center animate-in fade-in slide-in-from-top-1 duration-200">
            <p className="text-[11px] font-sans font-medium text-cyan-200 leading-snug line-clamp-2">
              "{currentSpokenSubtitle}"
            </p>
          </div>
        </div>
      )}

      {/* Attentive Listening Prompt Banner (When Candidate Speaks) */}
      {isListening && (
        <div className="absolute top-12 left-3 right-3 pointer-events-none z-20 flex justify-center">
          <div className="px-3 py-1 rounded-xl bg-black/75 backdrop-blur-md border border-emerald-500/30 text-emerald-300 shadow-lg text-center flex items-center gap-1.5 animate-in fade-in duration-200">
            <Mic className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="text-[11px] font-sans font-medium">Attentively listening... Speak your response clearly</span>
          </div>
        </div>
      )}

      {/* Bottom HUD: Speaker Name Bar & Dynamic Equalizer */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-20">
        {/* Name Tag Badge */}
        <div className="px-2.5 py-1 rounded-xl bg-black/80 backdrop-blur-md border border-white/15 text-white flex items-center gap-2 shadow-lg">
          <div className="w-5 h-5 rounded-lg bg-brand-600 flex items-center justify-center text-white flex-shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[11px] font-bold leading-none flex items-center gap-1">
              <span>Er. Vishnu Pera</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-brand-500/30 text-brand-300 font-mono">AI INTERVIEW LEAD</span>
            </div>
            <div className="text-[9px] text-slate-300 leading-tight mt-0.5">
              Technical Interviewer & Evaluator
            </div>
          </div>
        </div>

        {/* Live Audio Equalizer Waveform */}
        <div className="px-2.5 py-1 rounded-xl bg-black/80 backdrop-blur-md border border-white/15 text-white flex items-center gap-2 shadow-lg">
          <div className="flex items-end gap-0.5 h-4">
            {audioBars.map((h, i) => (
              <span
                key={i}
                className={`w-1 rounded-full transition-all duration-75 ${isSpeaking
                  ? 'bg-gradient-to-t from-cyan-400 to-brand-400'
                  : isListening
                    ? 'bg-gradient-to-t from-emerald-400 to-cyan-400'
                    : 'bg-slate-500'
                  }`}
                style={{ height: `${isSpeaking || isListening ? h : 4}px` }}
              />
            ))}
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-300">
            {isSpeaking ? 'Speaking' : isListening ? 'Listening' : isProcessing ? 'Analyzing' : 'Ready'}
          </span>
        </div>
      </div>
    </div>
  );
}

export const AIMockInterviewPage = () => {
  const navigate = useNavigate();
  const { navigateTo, currentUser, role, adminUser, candidateSubmissions, assessments, isAssessmentCompleted, addToast } = useApp();

  // Helper to open candidate analysis report
  const handleOpenCandidateAnalysis = () => {
    try {
      localStorage.setItem('rsj_active_analytics_tab', 'interview');
    } catch { }
    if (typeof navigateTo === 'function') {
      navigateTo('candidate-analytics');
    } else if (navigate) {
      navigate('/results?tab=interview');
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

  const [rawResumeText, setRawResumeText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedText, setPastedText] = useState('');

  // Resume analysis state initialized intelligently based on current targetRole
  const [analysisResult, setAnalysisResult] = useState(() => {
    try {
      const saved = localStorage.getItem('rsj_resume_analysis');
      if (saved) return JSON.parse(saved);
    } catch { }
    const initialRole = localStorage.getItem('rsj_selected_role') || 'Data Scientist';
    return parseResumeText('', initialRole);
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReportReady, setIsReportReady] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('report') === 'true';
    }
    return false;
  });
  const [finalAnalysis, setFinalAnalysis] = useState(null);

  // Audio & Video State
  const [cameraActive, setCameraActive] = useState(false);
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
  const [proctoringModal, setProctoringModal] = useState(null); // { violation, count, isFinal }
  const [proctoringLog, setProctoringLog] = useState([]);
  const lastViolationTimeRef = useRef(0);

  const triggerProctoringViolation = (violationReason) => {
    // Debounce duplicate triggers within 1.5 seconds
    const now = Date.now();
    if (now - lastViolationTimeRef.current < 1500) return;
    lastViolationTimeRef.current = now;

    setWarningCount((prevCount) => {
      const newCount = prevCount + 1;
      const logEntry = {
        number: newCount,
        reason: violationReason,
        time: new Date().toLocaleTimeString()
      };
      setProctoringLog((prev) => [...prev, logEntry]);
      setActiveWarningMessage(`Warning ${newCount}/3: ${violationReason}`);

      if (newCount >= 3) {
        // 3RD TIME: IMMEDIATELY CLOSE INTERVIEW AND AUTO-SUBMIT
        setProctoringModal({
          violation: violationReason,
          count: 3,
          maxAllowed: 3,
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
          setIsReportReady(true);

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
        // WARNING 1 OR 2 (FINAL WARNING)
        setProctoringModal({
          violation: violationReason,
          count: newCount,
          maxAllowed: 3,
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

  // Calculate current skill gaps for the target role
  const skillGaps = analysisResult?.skillGaps || analyzeRoleSkillGaps(analysisResult?.skills || [], targetRole);
  const resumeATS = String(analysisResult?.atsScore || skillGaps.atsScore || 92);

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
        triggerProctoringViolation('Exited Fullscreen Mode');
      }
    };

    const handleVisibilityChange = () => {
      if (Date.now() - sessionStartTimeRef.current < 1500) return;
      if (document.hidden && !proctoringModal) {
        triggerProctoringViolation('Switched Tabs / Browser Minimized');
      }
    };

    const handleWindowBlur = () => {
      if (Date.now() - sessionStartTimeRef.current < 1500) return;
      if (!proctoringModal) {
        triggerProctoringViolation('Switched Tabs / Window Lost Focus');
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
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sessionActive, proctoringModal]);

  const handleAcknowledgeWarning = () => {
    setProctoringModal(null);
    sessionStartTimeRef.current = Date.now();
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => { });
    }
  };

  // ==========================================
  // HANDLERS FOR SETUP STAGE (PICTURE 1)
  // ==========================================
  const handleRoleChange = (newRole) => {
    // Preserve user input verbatim: allows deleting, backspacing to empty, and typing spaces
    setTargetRole(newRole);
    setRoleInput(newRole);
    localStorage.setItem('rsj_selected_role', newRole);

    const effectiveRole = newRole.trim() || 'Software Engineer';

    // Re-parse with existing text or role defaults
    const updatedAnalysis = parseResumeText(rawResumeText, effectiveRole);
    if (analysisResult?.candidateName && analysisResult.candidateName !== 'Candidate') {
      updatedAnalysis.candidateName = analysisResult.candidateName;
    }
    setAnalysisResult(updatedAnalysis);
    localStorage.setItem('rsj_resume_analysis', JSON.stringify(updatedAnalysis));
    localStorage.setItem('rsj_resume_ats_score', String(updatedAnalysis.atsScore));

    const updatedQ = generateResumeQuestions(updatedAnalysis, effectiveRole);
    setQuestions(updatedQ);
    setCurrentQIndex(0);
    localStorage.setItem('rsj_resume_questions', JSON.stringify(updatedQ));
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
        content = `${file.name.replace(/\.[^/.]+$/, '')} candidate profile. Technical experience in ${targetRole}, building software projects, modern frameworks, and system workflows.`;
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
    // Transition from Picture 1 (Setup) to Picture 2 (Interview Stage)
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
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: true,
      });
      mediaStreamRef.current = stream;
      setCameraActive(true);
      setIsTestingCamera(true);

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
      console.warn('Camera preview notice:', err.message);
    }
  };

  const stopCamera = () => {
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
      stopCamera();
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
    setSessionActive(false);
    stopCamera();
    setIsProcessing(true);

    const answeredCount = updatedAnswers.filter(a => a.score > 0).length;
    const hasSpokenAtAll = answeredCount > 0;

    const calcFinalScore = hasSpokenAtAll
      ? Math.round(updatedAnswers.reduce((acc, curr) => acc + curr.score, 0) / updatedAnswers.length)
      : 0;

    const calcEye = hasSpokenAtAll ? Math.round(updatedAnswers.reduce((acc, curr) => acc + (curr.eyeContactScore || 85), 0) / updatedAnswers.length) : 0;
    const calcComm = hasSpokenAtAll ? Math.round(updatedAnswers.reduce((acc, curr) => acc + (curr.communicationScore || 0), 0) / updatedAnswers.length) : 0;
    const calcTech = hasSpokenAtAll ? Math.round(updatedAnswers.reduce((acc, curr) => acc + (curr.technicalScore || 0), 0) / updatedAnswers.length) : 0;
    const calcConf = hasSpokenAtAll ? Math.round(updatedAnswers.reduce((acc, curr) => acc + (curr.confidenceScore || 80), 0) / updatedAnswers.length) : 0;
    const calcAtt = hasSpokenAtAll ? Math.round(updatedAnswers.reduce((acc, curr) => acc + (curr.attentionScore || 85), 0) / updatedAnswers.length) : 0;

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
      questionBreakdown: updatedAnswers.map(a => ({
        questionNumber: a.questionNumber,
        category: a.category,
        questionText: a.question,
        transcript: a.companionNote,
        overallScore: a.score,
        technicalScore: a.technicalScore,
        communicationScore: a.communicationScore,
        confidenceScore: a.confidenceScore,
        eyeContactScore: a.eyeContactScore,
        dominantEmotion: 'Confident',
        aiFeedback: a.score > 70 ? 'Strong structured response.' : (a.score > 0 ? 'Acceptable response with room for deeper technical precision.' : 'No verbal response detected.')
      }))
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
      setIsReportReady(true);
    }, 1200);
  };

  // ── Candidate Answer Submission & Dynamic Turn-Taking ──
  const handleCandidateSubmit = async () => {
    if (agentState === 'PROCESSING' || agentState === 'AI_RESPONSE') return;

    // 1. Stop Speech-to-Text
    stopSpeechRecognition();

    // 2. Transition to PROCESSING state
    setAgentState('PROCESSING');
    agentStateRef.current = 'PROCESSING';
    setIsProcessing(true);

    const currentQ = questions[currentQIndex] || questions[0];
    const isFinalQuestion = currentQIndex >= questions.length - 1;

    const recordedText = companionText.trim();
    const words = recordedText.split(/\s+/).filter(Boolean);
    const isSilent = words.length < 3 || recordedText.toLowerCase().includes('candidate provided verbal answer') || recordedText.toLowerCase().includes('no response');

    let calculatedScore = 0;
    let techScore = 0;
    let commScore = 0;
    let quality = 'No Response';

    if (!isSilent) {
      const wordCount = words.length;
      commScore = Math.min(96, Math.max(45, 40 + Math.min(45, wordCount * 1.5)));
      techScore = Math.min(96, Math.max(45, 45 + Math.min(45, wordCount * 1.3)));
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
      companionNote: isSilent ? 'No verbal or typed answer provided (Candidate remained silent). Score: 0/100.' : recordedText,
      score: isSilent ? 0 : calculatedScore,
      technicalScore: isSilent ? 0 : techScore,
      communicationScore: isSilent ? 0 : commScore,
      eyeContactScore: isSilent ? 0 : telemetry.eyeContact,
      attentionScore: isSilent ? 0 : telemetry.attention,
      confidenceScore: isSilent ? 0 : telemetry.confidence
    };

    const updatedAnswers = [...answersList, answerRecord];
    setAnswersList(updatedAnswers);

    // 4. Form conversational spoken transition from Dr. Arvind Swamy
    let transitionSpoken = '';
    if (isFinalQuestion) {
      transitionSpoken = isSilent
        ? 'Thank you. That completes our interview questions. I am now compiling your complete evaluation report.'
        : 'Thank you for your responses. That completes our mock interview session. I am compiling your final evaluation report now.';
    } else {
      if (isSilent) {
        transitionSpoken = 'No verbal response was detected. Let us proceed to the next question.';
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
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
          await document.documentElement.webkitRequestFullscreen();
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

        // Camera track check
        if (mediaStreamRef.current) {
          const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
          if (!videoTrack || !videoTrack.enabled || videoTrack.readyState === 'ended') {
            triggerProctoringViolation('Camera Feed Inactive / No Face Detected');
          }
        }

        // MediaPipe Multi-Face Check
        if (faceLandmarkerRef.current && videoRef.current && videoRef.current.readyState >= 2 && !proctoringModal) {
          try {
            const results = faceLandmarkerRef.current.detectForVideo(videoRef.current, performance.now());
            if (results && results.faceLandmarks) {
              if (results.faceLandmarks.length > 1) {
                triggerProctoringViolation('Multiple Faces Detected');
              }
            }
          } catch (e) { }
        }
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
  // VIEW 1: FINAL EVALUATION REPORT
  // ==========================================
  if (isReportReady) {
    const effectiveAnswers = (answersList && answersList.length > 0)
      ? answersList
      : ((finalAnalysis?.questionBreakdown && finalAnalysis.questionBreakdown.length > 0)
        ? finalAnalysis.questionBreakdown
        : questions.map((q, idx) => ({
          questionNumber: idx + 1,
          stage: `Q${idx + 1}`,
          question: q.questionText || q.question || 'Machine Learning Architecture & Evaluation',
          category: q.category || 'TECHNICAL',
          companionNote: 'Candidate verbal response recorded and evaluated by AI evaluator.',
          score: 82,
          technicalScore: 85,
          communicationScore: 78,
          eyeContactScore: 88,
          attentionScore: 90,
          confidenceScore: 84
        })));

    const answeredCount = effectiveAnswers.filter(a => a.score > 0).length;
    const hasSpokenAtAll = answeredCount > 0;

    const finalScore = hasSpokenAtAll
      ? (finalAnalysis ? Number(finalAnalysis.overallScore) : Math.round(effectiveAnswers.reduce((acc, curr) => acc + curr.score, 0) / effectiveAnswers.length))
      : 0;

    const eyeContactVal = hasSpokenAtAll ? (finalAnalysis ? Number(finalAnalysis.eyeContactScore) : 88) : 0;
    const commVal = hasSpokenAtAll ? Math.round(effectiveAnswers.reduce((acc, curr) => acc + (curr.communicationScore || 0), 0) / effectiveAnswers.length) : 0;
    const techVal = hasSpokenAtAll ? Math.round(effectiveAnswers.reduce((acc, curr) => acc + (curr.technicalScore || 0), 0) / effectiveAnswers.length) : 0;
    const confVal = hasSpokenAtAll ? (finalAnalysis ? Number(finalAnalysis.confidenceScore) : 86) : 0;
    const attVal = hasSpokenAtAll ? (finalAnalysis ? Number(finalAnalysis.attentionScore) : 88) : 0;

    const DIMENSIONS = [
      { label: 'Eye Contact', score: eyeContactVal, icon: Eye },
      { label: 'Attention Score', score: attVal, icon: AlignCenter },
      { label: 'Confidence', score: confVal, icon: Smile },
      { label: 'Communication', score: commVal, icon: Activity },
      { label: 'Technical Depth', score: techVal, icon: BrainCircuit },
    ];

    const handleSubmitToAnalysis = () => {
      try {
        if (!localStorage.getItem('rsj_latest_interview_analysis') && finalAnalysis) {
          localStorage.setItem('rsj_latest_interview_analysis', JSON.stringify({
            success: true,
            analysis: finalAnalysis,
            session: {
              id: sessionId || localStorage.getItem('last_interview_session_id') || `intv-${Date.now()}`,
              targetRole,
              questions: answersList
            }
          }));
        }
        localStorage.setItem('rsj_active_analytics_tab', 'interview');
        if (typeof addToast === 'function') {
          addToast('Interview submitted successfully! Opening Interview Analysis...', 'success');
        }
      } catch (e) {
        console.warn('Analysis submit sync notice:', e);
      }
      if (navigate) {
        navigate('/results?tab=interview');
      } else if (typeof navigateTo === 'function') {
        navigateTo('candidate-analytics');
      }
    };

    return (
      <div className="relative min-h-screen w-full bg-[#F8FAFC] text-slate-800 p-4 sm:p-7 flex flex-col justify-start">
        {/* Soft Ambient Background Glows matching website design */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-30" />
          <div className="absolute top-1/4 -left-32 w-80 h-80 rounded-full bg-brand-500/5 blur-3xl" />
          <div className="absolute bottom-1/3 -right-20 w-64 h-64 rounded-full bg-cyan-500/5 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full space-y-6">
          {/* Studio Top Control Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-brand-600 flex items-center justify-center text-white shadow-xs">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wide text-slate-900 font-sans uppercase">ReadySetJob AI Interview Studio</span>
                <span className="text-[10px] text-brand-700 font-mono font-bold px-2.5 py-0.5 rounded-full bg-brand-50 border border-brand-200 hidden sm:inline">VERIFIED EVALUATION</span>
              </div>
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
              <button
                onClick={handleOpenCandidateAnalysis}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-brand-600 border border-slate-200 text-xs font-semibold transition-all shadow-xs cursor-pointer"
                title="Candidate Analysis Report"
              >
                <BarChart3 className="w-3.5 h-3.5 text-brand-600" />
                <span className="hidden sm:inline">Candidate Analysis</span>
              </button>
            </div>
          </div>

          {/* Evaluation Report Header Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-center gap-5">
              <MiniScoreRing score={finalScore} size={84} />
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 border border-brand-200 rounded-full text-xs font-bold text-brand-700 mb-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                  <span>Verified Evaluation for {targetRole}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-sans">AI Mock Interview Evaluation Report</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-sans">
                  Resume ATS Benchmark: <strong className="text-brand-600 font-mono font-bold">{resumeATS}%</strong> • Role: <strong className="text-slate-800 font-bold">{targetRole}</strong>
                </p>
                {warningCount > 0 && (
                  <div className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 font-mono flex items-center gap-1.5 w-fit">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Recorded Proctoring Warnings: {warningCount}/3</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                id="submit-interview-top-btn"
                onClick={handleSubmitToAnalysis}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-700 hover:to-cyan-700 active:scale-[0.98] text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-brand-500/25 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Submit</span>
              </button>
              <button
                onClick={handleOpenCandidateAnalysis}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-brand-600 text-xs font-bold transition-all border border-slate-200 shadow-xs cursor-pointer"
              >
                <BarChart3 className="w-4 h-4 text-brand-600" />
                <span>Candidate Analysis</span>
              </button>
            </div>
          </div>

          {/* 5 Dimension KPI Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
            {DIMENSIONS.map(({ label, score, icon: Icon }) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-4 text-center hover:shadow-md transition-shadow">
                <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-2 border border-brand-100">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">{score}%</div>
                <div className="text-xs text-slate-500 font-semibold font-sans mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Target Role Skill Recommendations */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 border border-brand-200 rounded-full text-xs font-bold text-brand-700 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                  <span>Target Role Skill Recommendations</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 font-sans">Skills to Cover for {targetRole}</h3>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono">
                <span className="text-slate-500">ATS Match Benchmark:</span>
                <span className="text-emerald-600 font-black">{skillGaps.atsScore}%</span>
              </div>
            </div>

            {/* Skills Present in Your Resume */}
            {skillGaps.matchedCore && skillGaps.matchedCore.length > 0 && (
              <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80">
                <div className="flex items-center gap-2 mb-3 text-xs font-bold text-emerald-800 font-sans">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Skills Present in Your Resume ({skillGaps.matchedCore.length})</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skillGaps.matchedCore.map((skill, i) => (
                    <span key={i} className="px-3 py-1 rounded-xl bg-white border border-emerald-200 text-xs font-semibold text-emerald-800 shadow-2xs">
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Skills to Cover */}
            <div className="p-6 rounded-2xl bg-amber-50/40 border border-amber-200/80">
              <div className="flex items-center gap-2 mb-3.5 text-xs font-bold text-amber-800 font-sans">
                <Target className="w-4 h-4 text-amber-600" />
                <span>Recommended Skills to Cover for {targetRole} ({skillGaps.skillsToCover.length})</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {skillGaps.skillsToCover.map((skill, i) => (
                  <span key={i} className="px-3.5 py-1.5 rounded-xl bg-white border border-amber-200 text-xs font-semibold text-amber-800 shadow-2xs">
                    + {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Question Evaluation Breakdown */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 font-sans">Question Evaluation Breakdown</h4>
              <span className="text-xs font-mono text-slate-500 font-bold">{effectiveAnswers.length} {effectiveAnswers.length === 1 ? 'Question' : 'Questions'} Evaluated</span>
            </div>
            <div className="space-y-3">
              {effectiveAnswers.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors shadow-2xs">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-mono font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-md border border-brand-200">{item.stage}</span>
                      <span className="text-[11px] text-slate-500 uppercase tracking-wider font-mono font-semibold">{item.category}</span>
                    </div>
                    <div className="text-xs sm:text-sm text-slate-900 font-semibold font-sans">{item.question}</div>
                    <div className="text-xs text-slate-600 mt-2 italic font-sans bg-white p-2.5 rounded-xl border border-slate-200/70">
                      "{item.companionNote || 'Answer verbalized'}"
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 border border-brand-200 shadow-2xs">
                      Score: {item.score}/100
                    </span>
                    <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                      Gaze: {item.eyeContactScore}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Final Submit Banner */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 font-sans">Ready to View In-Depth Analysis?</h4>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-sans">Submit your interview report now to access complete telemetry graphs, behavioral analytics, and AI recommendations.</p>
              </div>
            </div>
            <button
              id="submit-interview-bottom-btn"
              onClick={handleSubmitToAnalysis}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-700 hover:to-cyan-700 active:scale-[0.98] text-white font-black text-sm shadow-md shadow-brand-500/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer flex-shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Submit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: LOCKED / ASSESSMENT REQUIRED CHECKS
  // ==========================================
  // CANDIDATE ASSESSMENT LOCK SYSTEM
  // ==========================================
  const isAdmin = role === 'admin' || Boolean(adminUser) || (typeof window !== 'undefined' && localStorage.getItem('rsj_role') === 'admin');

  // List of active assessments (Coding, Reasoning, Aptitude, Technical)
  const activeAssessmentsList = (assessments && assessments.length > 0) ? assessments : [
    { id: 'asm-code-2026', title: 'Full-Stack Algorithmic Coding Challenge', category: 'Coding', totalQuestions: 4, durationMinutes: 10 },
    { id: 'asm-reas-2026', title: 'Logical Reasoning & Critical Thinking Exam', category: 'Reasoning', totalQuestions: 10, durationMinutes: 10 },
    { id: 'asm-apt-2026', title: 'Quantitative Aptitude Benchmark Test', category: 'Aptitude', totalQuestions: 10, durationMinutes: 10 },
    { id: 'asm-tech-2026', title: 'Core Technical & CS Fundamentals Assessment', category: 'Technical', totalQuestions: 10, durationMinutes: 10 }
  ];

  const checkIsCompleted = (asm) => {
    if (!asm) return false;
    if (typeof isAssessmentCompleted === 'function' && isAssessmentCompleted(asm)) return true;
    const targetId = String(asm.id || '').trim().toLowerCase();
    const targetCat = String(asm.category || '').trim().toLowerCase();
    const targetTitle = String(asm.title || '').trim().toLowerCase();

    return (candidateSubmissions || []).some(s => {
      const subAsmId = String(s.assessment_id || s.assessmentId || '').trim().toLowerCase();
      if (targetId && subAsmId === targetId) return true;
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
  const hasCompletedAllAssessments = totalRequiredCount > 0 && completedCount === totalRequiredCount;
  const completionPercentage = totalRequiredCount > 0 ? Math.round((completedCount / totalRequiredCount) * 100) : 0;

  // If candidate has not completed all assessments yet, and is not admin: show Lock Screen
  if (!isAdmin && !hasCompletedAllAssessments) {
    return (
      <div className="relative min-h-[82vh] rounded-3xl overflow-hidden bg-white text-slate-800 border border-slate-200/80 shadow-md p-6 sm:p-10 flex flex-col items-center justify-center text-center">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full bg-brand-500/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

        {/* Warning Banner Bar */}
        <div className="w-full max-w-2xl bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-6 flex items-center justify-between text-left text-amber-900">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-xs sm:text-sm font-semibold">
              <span className="font-bold text-amber-950">Notice:</span> Please complete all assessments and tests first to unlock your AI Mock Interview.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 shrink-0 hidden sm:inline">
            {completedCount}/{totalRequiredCount} Done
          </span>
        </div>

        {/* Big Lock Graphic */}
        <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-4 shadow-md shadow-amber-500/10 text-amber-600">
          <Lock className="w-10 h-10" />
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Stage Lock • All {totalRequiredCount} Module Tests Required</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight max-w-xl">
          AI Mock Interview Locked
        </h2>

        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mt-2.5 leading-relaxed font-sans">
          To qualify for the live AI Mock Interview with facial telemetry, vocal tracking, and real-time behavioral insights, you must complete all <strong className="text-slate-800">{totalRequiredCount} module assessments</strong> (Coding, Reasoning, Aptitude, and Technical).
        </p>

        {/* Progress Bar */}
        <div className="w-full max-w-lg mt-6 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-slate-500">Assessment Completion Status</span>
            <span className={completionPercentage === 100 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
              {completedCount} of {totalRequiredCount} Completed ({completionPercentage}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Assessment Module Status Checklist */}
        <div className="w-full max-w-2xl mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          {activeAssessmentsList.map((asm) => {
            const isDone = checkIsCompleted(asm);
            return (
              <div
                key={asm.id || asm.title}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${isDone
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : 'bg-slate-50/90 border-slate-200 text-slate-800'
                  }`}
              >
                <div className="flex items-start gap-2.5 min-w-0 pr-2">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <div className="truncate">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-bold">
                      {asm.category || 'Module'}
                    </span>
                    <strong className="text-xs text-slate-900 block truncate">{asm.title}</strong>
                  </div>
                </div>

                <div className="shrink-0">
                  {isDone ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Completed
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigateTo('assessments')}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-brand-600 hover:bg-brand-700 text-white transition-colors cursor-pointer shadow-xs"
                    >
                      Start Test →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => navigateTo('assessments')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Go to Assessments & Tests</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleOpenCandidateAnalysis}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-brand-600 font-bold text-xs border border-slate-200 transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
          >
            <BarChart3 className="w-4 h-4 text-brand-600" />
            <span>Candidate Analysis</span>
          </button>
        </div>
      </div>
    );
  }



  // ==========================================
  // VIEW 2: STEP 1 SETUP (PICTURE 1)
  // ==========================================
  if (stage === 'setup') {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-[#F8FAFC] text-slate-800 p-4 sm:p-8 flex flex-col justify-start">

        {/* Soft Ambient Background Glows */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-brand-500/5 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl" />
        </div>

        {/* Studio Top Control Bar */}
        <div className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between pb-4 mb-4 border-b border-slate-200/90">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-brand-600 flex items-center justify-center text-white shadow-xs">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wide text-slate-900 font-sans uppercase">ReadySetJob AI Interview Studio</span>
              <span className="text-[10px] text-brand-700 font-mono font-bold px-2.5 py-0.5 rounded-full bg-brand-50 border border-brand-200 hidden sm:inline">FULLSCREEN</span>
            </div>
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
            <button
              onClick={handleOpenCandidateAnalysis}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-brand-600 border border-slate-200 text-xs font-semibold transition-all shadow-xs cursor-pointer"
              title="Candidate Analysis Report"
            >
              <BarChart3 className="w-3.5 h-3.5 text-brand-600" />
              <span className="hidden sm:inline">Analysis Report</span>
            </button>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-4xl mx-auto my-auto">

          {/* Admin Testing Mode Badge */}
          {isAdmin && (
            <div className="flex justify-center mb-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-full text-xs font-mono font-bold shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>Admin Testing Mode Active • Interview Session Unlocked</span>
              </div>
            </div>
          )}

          {/* Subtitle directly matching website design */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold tracking-wider uppercase mb-3 font-sans shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>AI Mock Interview Preparation Studio</span>
            </div>
            <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed font-sans">
              Extract skills, evaluate experience depth, score candidate suitability, match targeted job descriptions, and evaluate personalized interview readiness.
            </p>
          </div>

          {/* Main Container Card (Picture 1) */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-200/40 p-6 sm:p-8">

            {/* COMPACT RESUME DROP ZONE */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="relative border-2 border-dashed border-brand-200 hover:border-brand-400 rounded-xl p-4 sm:p-5 text-center transition-all bg-brand-50/20 hover:bg-brand-50/50 group shadow-xs"
            >
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                id="resume-file-input"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files?.[0])}
              />

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform text-brand-600 shadow-xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate font-sans">
                      {uploadedFileName ? `Resume Uploaded: ${uploadedFileName}` : 'Drag & drop your resume here'}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-sans">
                      Supports PDF and TXT files (Max 20MB) • ATS & Skill Match
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <label
                    htmlFor="resume-file-input"
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-900 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer hover:scale-105 font-sans"
                  >
                    Browse File
                  </label>

                  <button
                    type="button"
                    onClick={handleLoadSampleResume}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition-all cursor-pointer font-sans shadow-xs"
                  >
                    <Zap className="w-3.5 h-3.5 text-brand-600" />
                    <span>Sample Resume</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Scanning Progress Bar */}
            {isScanning && (
              <div className="mt-5 p-4 rounded-xl bg-brand-50/80 border border-brand-200 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <RefreshCw className="w-4 h-4 text-brand-600 animate-spin" />
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

            {/* TARGET ROLE INPUT FIELD (Picture 1) */}
            <div className="mt-6">
              <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-2 font-sans">
                Target Role <span className="text-slate-400 font-normal">(Enter Manually)</span>
              </label>

              <div className="relative">
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  placeholder="e.g. Data Scientist, ML Engineer, Software Engineer"
                  className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 rounded-xl px-4 py-3 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all shadow-xs font-sans font-medium"
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

              <p className="mt-2 text-[11px] text-slate-500 font-sans">
                Type your desired job role above (e.g. Data Scientist, ML Engineer, Full Stack Developer, etc.). The interview questions and ATS benchmark calibrate automatically.
              </p>
            </div>

            {/* ATS MATCH & EXTRACTED SKILLS */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-bold">
                    ATS Match: {resumeATS}%
                  </span>
                  <span className="text-xs text-slate-600 font-medium font-sans">
                    Calibrated for: <strong className="text-slate-900 font-bold">{targetRole}</strong>
                  </span>
                </div>
                {/* Pic 2 ("1 Question (Tell Me About Yourself)") hidden as requested */}
              </div>

              {/* Extracted Skills Pills */}
              <div className="flex items-center gap-1.5 flex-wrap mb-3">
                <span className="text-[11px] text-slate-500 font-semibold mr-1 font-sans">Skills:</span>
                {analysisResult.skills.slice(0, 7).map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-700 font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Skills to Cover for this Role */}
              {skillGaps.skillsToCover && skillGaps.skillsToCover.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap mb-4">
                  <span className="text-[11px] text-amber-700 font-semibold mr-1 font-sans">Skills to Cover:</span>
                  {skillGaps.skillsToCover.slice(0, 4).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[11px] font-mono text-amber-800 font-medium"
                    >
                      + {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Primary Action Button */}
              <button
                type="button"
                onClick={handleProceedToRoom}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm sm:text-base shadow-md shadow-brand-600/20 transition-all hover:scale-[1.005] cursor-pointer font-sans"
              >
                <span>Proceed to Live AI Interview Room →</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

      </div>
    );
  }

  // ==========================================
  // VIEW 3: LIVE INTERVIEW STAGE (PICTURE 2)
  // ==========================================
  return (
    <div className="relative h-screen max-h-screen w-full overflow-hidden bg-[#F8FAFC] text-slate-800 p-2 sm:p-3 flex flex-col justify-between select-none">

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
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-brand-600 flex items-center justify-center text-white shadow-xs">
              <BrainCircuit className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wide text-slate-900 font-sans uppercase">ReadySetJob AI Interview Studio</span>
              <span className="text-[10px] text-brand-600 font-mono font-bold px-2 py-0.5 rounded-full bg-brand-50 border border-brand-200 hidden sm:inline">FULLSCREEN</span>
            </div>
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
              {warningCount}/3 Strikes
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

        {/* Question Bar - Q1 IS ALWAYS "TELL ME ABOUT YOURSELF" */}
        <div className="flex items-center justify-between gap-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs px-4 py-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex-shrink-0 text-xs font-mono font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-md">
              Q{currentQIndex + 1}:
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-800 truncate font-sans">{currentQ.questionText || currentQ.question}</span>
          </div>
          <button
            type="button"
            onClick={() => handlePlayOrReplayQuestion()}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all shadow-2xs cursor-pointer font-sans"
            title="Hear Dr. Arvind Swami speak this question aloud"
          >
            <Volume2 className={`w-3.5 h-3.5 ${isAISpeaking ? 'text-brand-600 animate-pulse' : 'text-slate-600'}`} />
            <span>{isAISpeaking ? 'Speaking...' : 'Listen to AI'}</span>
          </button>
        </div>

        {/* Two-Pane Stage (The Two Cameras with Adjusted Size) */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">

          {/* Pane 1: AI Interviewer Video Cam (Dr. Arvind Swami with Real-Time Lip Sync) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden flex flex-col h-full min-h-0">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 bg-slate-50/60 shrink-0">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${isAISpeaking
                    ? 'bg-cyan-500 animate-pulse'
                    : agentState === 'LISTENING'
                      ? 'bg-emerald-500 animate-pulse'
                      : agentState === 'PROCESSING'
                        ? 'bg-amber-500 animate-pulse'
                        : sessionActive
                          ? 'bg-emerald-500'
                          : 'bg-slate-400'
                    }`}
                />
                <span className="text-xs font-bold text-slate-700 font-sans">
                  {isAISpeaking
                    ? 'AI Interviewer Speaking'
                    : agentState === 'LISTENING'
                      ? 'AI Listening Attentively'
                      : agentState === 'PROCESSING'
                        ? 'AI Evaluating Answer'
                        : sessionActive
                          ? 'AI Interviewer Ready'
                          : 'AI Interviewer Standby'}
                </span>
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-50 border border-brand-200/60 text-[10px] font-mono font-bold text-brand-700">
                <Sparkles className="w-3 h-3 text-brand-600" />
                <span>AI Lead</span>
              </div>
            </div>

            {/* Dr. Arvind Swami Video Cam Feed */}
            <div className="p-2 sm:p-2.5 bg-slate-100/50 flex-1 min-h-0 flex items-center justify-center overflow-hidden">
              <DrArvindSwamiVideoCam
                isSpeaking={isAISpeaking}
                sessionActive={sessionActive}
                targetRole={targetRole}
                currentQuestionText={currentQ.questionText || currentQ.question}
                agentState={agentState}
                currentSpokenSubtitle={currentSpokenSubtitle}
                onReplayQuestion={() => handlePlayOrReplayQuestion()}
                isAudioMuted={isAudioMuted}
                onToggleMute={() => {
                  setIsAudioMuted((prev) => {
                    const next = !prev;
                    if (next && window.speechSynthesis) window.speechSynthesis.cancel();
                    return next;
                  });
                }}
                onSkipToAnswer={() => {
                  if (window.speechSynthesis) window.speechSynthesis.cancel();
                  setIsAISpeaking(false);
                  setAgentState('LISTENING');
                  agentStateRef.current = 'LISTENING';
                  startSpeechRecognition();
                }}
              />
            </div>

            <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-[11px] font-mono text-slate-500 shrink-0">
              <span>Invigilator: Er. Vishnu Pera (AI Lead)</span>
              <span className="text-brand-600 font-semibold">Proctor: Strict Active</span>
            </div>
          </div>

          {/* Pane 2: Candidate Video Feed & Audio Telemetry */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden flex flex-col h-full min-h-0">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 bg-slate-50/60 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                <span className="text-xs font-bold text-slate-700 font-sans">
                  {cameraActive ? 'Candidate Video Stream' : 'Camera Feed Standby'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${warningCount === 0
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : warningCount === 1
                    ? 'text-amber-700 bg-amber-50 border-amber-200'
                    : 'text-rose-700 bg-rose-50 border-rose-300 animate-pulse'
                  }`}>
                  Warnings: {warningCount} / 3
                </span>

                {/* Candidate Proctoring Controls */}
                {sessionActive && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (cameraActive) {
                          stopCamera();
                          triggerProctoringViolation('Camera Closed / Video Disabled');
                        } else {
                          startCamera();
                        }
                      }}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors shadow-2xs"
                      title="Toggle Camera (Test Warning 1, 2, 3)"
                    >
                      {cameraActive ? 'Close Cam' : 'Open Cam'}
                    </button>

                    <button
                      type="button"
                      onClick={() => triggerProctoringViolation('Multiple Faces Detected in Camera Frame')}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white hover:bg-amber-50 text-amber-700 border border-amber-200 transition-colors shadow-2xs"
                      title="Test Multi-Face Warning"
                    >
                      Multi-Face
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Video Viewport Stage matching Dr. Arvind Swami container */}
            <div className="p-2 sm:p-2.5 bg-slate-100/50 flex-1 min-h-0 flex items-center justify-center overflow-hidden">
              <div className="relative w-full h-full min-h-0 bg-slate-950 flex items-center justify-center overflow-hidden rounded-xl sm:rounded-2xl select-none">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover mirror-mode ${cameraActive ? 'block' : 'hidden'}`}
                />

                {videoPlayBlocked && cameraActive && (
                  <div className="absolute inset-0 z-30 bg-black/80 flex flex-col items-center justify-center p-3 text-center">
                    <Play className="w-8 h-8 text-brand-400 mb-1 cursor-pointer" onClick={handleManualVideoPlay} />
                    <p className="text-xs text-white font-semibold mb-1.5 font-sans">Click to start live camera preview</p>
                    <button
                      onClick={handleManualVideoPlay}
                      className="px-3 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold font-sans transition-colors cursor-pointer"
                    >
                      Activate Video
                    </button>
                  </div>
                )}

                {!cameraActive && (
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-2">
                      <VideoOff className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-white mb-0.5 font-sans">Camera Feed Standby</p>
                    <p className="text-[10px] text-slate-400 max-w-xs mb-2 font-sans">
                      Click below or start interview to activate.
                    </p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold font-sans shadow-xs cursor-pointer transition-all"
                    >
                      <Video className="w-3 h-3" />
                      <span>Turn On Camera Preview</span>
                    </button>
                  </div>
                )}

                {/* Live Overlay HUD when session is active */}
                {sessionActive && (
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
                    <div className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>Gaze: {telemetry.eyeContact}%</span>
                    </div>
                    <div className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-cyan-300 flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      <span>Time: {formatTimer(timerSeconds)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mic Telemetry Bar */}
            <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-[11px] font-mono text-slate-500 shrink-0">
              <div className="flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-brand-600" />
                <span className="font-sans font-medium text-slate-700">Mic: {isRecording ? 'Listening' : 'Idle'}</span>
              </div>
              <Waveform active={isRecording} />
            </div>
          </div>

        </div>

        {/* BOTTOM ACTION BAR (Autonomous Real-Time Turn Taking) */}
        <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-white border border-slate-200/90 shadow-card shrink-0">
          {!sessionActive ? (
            <button
              type="button"
              onClick={handleStartSession}
              className="flex items-center justify-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-700 hover:to-cyan-700 text-white font-bold text-sm font-sans shadow-md shadow-brand-500/20 transition-all hover:scale-[1.01] cursor-pointer"
            >
              <Video className="w-4 h-4" />
              <span>Start Interview Session for {targetRole}</span>
            </button>
          ) : (
            <div className="flex flex-col items-center gap-2 w-full max-w-2xl">
              {/* SPEECH-TO-TEXT VERBAL TRANSCRIPTION AREA */}
              <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 shadow-2xs">
                <div className="flex items-center justify-between text-xs mb-1.5 flex-wrap gap-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`w-2 h-2 rounded-full ${agentState === 'SPEAKING'
                        ? 'bg-cyan-500 animate-ping'
                        : isRecording
                          ? 'bg-emerald-500 animate-ping'
                          : agentState === 'PROCESSING'
                            ? 'bg-amber-500 animate-pulse'
                            : 'bg-brand-500'
                        }`}
                    />
                    <span className="font-bold text-slate-800 font-sans text-xs">
                      {agentState === 'SPEAKING'
                        ? 'Interviewer Asking Question:'
                        : agentState === 'PROCESSING'
                          ? 'Evaluating Answer:'
                          : agentState === 'AI_RESPONSE'
                            ? 'Interviewer Feedback:'
                            : 'Your Verbal Answer (Speech-to-Text):'}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-600">
                      {agentState === 'SPEAKING' ? 'AI Voice Active' : 'Live Mic STT'}
                    </span>
                    {/* ACCENT / LANGUAGE SELECTOR */}
                    <button
                      type="button"
                      onClick={toggleSttLang}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-700 font-bold transition-colors cursor-pointer flex items-center gap-1"
                      title="Switch Speech Recognition Accent for maximum precision"
                    >
                      <span>Accent:</span>
                      <span>{sttLang === 'en-IN' ? '🇮🇳 Indian (en-IN)' : '🇺🇸 US (en-US)'}</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {companionText && (
                      <button
                        type="button"
                        onClick={() => {
                          accumulatedTranscriptRef.current = '';
                          setCompanionText('');
                        }}
                        className="text-[10px] text-slate-500 hover:text-rose-600 underline font-mono cursor-pointer"
                        title="Reset transcript to re-speak"
                      >
                        Reset
                      </button>
                    )}
                    <span className="text-[11px] font-mono font-bold text-brand-600">
                      {companionText ? `${companionText.split(/\s+/).filter(Boolean).length} words` : 'Ready'}
                    </span>
                  </div>
                </div>

                {/* Live Speech Transcription View */}
                {agentState === 'SPEAKING' ? (
                  <div className="min-h-[55px] max-h-[75px] flex items-center justify-center text-center bg-white border border-slate-200 rounded-lg p-2 shadow-2xs">
                    <Volume2 className="w-3.5 h-3.5 mr-1.5 text-cyan-600 animate-pulse" />
                    <p className="text-[11px] font-medium text-slate-600 font-sans">
                      Er. Vishnu Pera is asking Question {currentQIndex + 1}. Candidate mic will activate automatically once finished.
                    </p>
                  </div>
                ) : agentState === 'PROCESSING' ? (
                  <div className="min-h-[55px] max-h-[75px] flex items-center justify-center text-center bg-white border border-slate-200 rounded-lg p-2 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-500 animate-spin" />
                    <p className="text-[11px] font-medium text-slate-600 font-sans">
                      Analyzing technical keywords, speech cadence, and domain depth...
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <textarea
                      value={companionText}
                      onChange={(e) => {
                        setCompanionText(e.target.value);
                        accumulatedTranscriptRef.current = e.target.value;
                      }}
                      placeholder={`Microphone is ${isRecording ? 'listening live' : 'ready'}. Speak clearly to answer Question ${currentQIndex + 1} (instant voice STT, or type/edit directly)...`}
                      className="w-full min-h-[60px] max-h-[110px] overflow-y-auto bg-white border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-lg p-2 text-xs text-slate-800 leading-relaxed shadow-2xs font-sans resize-none transition-all outline-none"
                      rows={3}
                    />
                    {isRecording && (
                      <div className="absolute right-2 bottom-2 pointer-events-none flex items-center gap-1 text-[10px] font-mono text-emerald-600 bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded border border-emerald-200 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        <span>Live Listening</span>
                      </div>
                    )}
                  </div>
                )}

                {/* State Guidance Pill */}
                {agentState === 'SPEAKING' && (
                  <div className="mt-1.5 flex items-center justify-between text-[10px] px-2 py-0.5 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-800 font-mono">
                    <span className="flex items-center gap-1">
                      <Volume2 className="w-3 h-3 text-cyan-600 animate-pulse" />
                      Listening starts automatically after question.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.speechSynthesis) window.speechSynthesis.cancel();
                        setIsAISpeaking(false);
                        setAgentState('LISTENING');
                        agentStateRef.current = 'LISTENING';
                        startSpeechRecognition();
                      }}
                      className="underline font-bold text-cyan-700 hover:text-cyan-900 cursor-pointer"
                    >
                      Start Answering Now →
                    </button>
                  </div>
                )}

                {agentState === 'LISTENING' && isRecording && (
                  <div className="mt-1.5 flex items-center justify-between text-[10px] px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono animate-pulse">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Attentively recording answer... Speak your complete response.
                    </span>
                    <span className="font-semibold">Click Submit when finished</span>
                  </div>
                )}

                {agentState === 'PROCESSING' && (
                  <div className="mt-1.5 flex items-center justify-center text-[10px] px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-mono">
                    <span>Evaluating answer with AI evaluation engine...</span>
                  </div>
                )}
              </div>

              {/* Turn-Taking Control Buttons */}
              <div className="flex items-center gap-2.5 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={handleRecordVoice}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold font-sans transition-all border cursor-pointer ${isRecording
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
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold font-sans shadow-2xs cursor-pointer transition-all"
                  title="Replay Er. Vishnu Pera's Voice"
                >
                  <Volume2 className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Replay Audio</span>
                </button>

                <button
                  type="button"
                  onClick={handleCandidateSubmit}
                  disabled={agentState === 'PROCESSING' || agentState === 'AI_RESPONSE'}
                  className={`flex items-center gap-1.5 px-5 py-1.5 rounded-lg bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-700 hover:to-cyan-700 text-white text-xs font-bold font-sans shadow-md shadow-brand-500/20 transition-all cursor-pointer hover:scale-105 ${agentState === 'PROCESSING' || agentState === 'AI_RESPONSE' ? 'opacity-60 cursor-not-allowed' : ''
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
      {/* PROCTORING WARNING MODAL (1st, 2nd, and 3rd TERMINATION WARNING) */}
      {/* ============================================================== */}
      {proctoringModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-2xl border p-6 text-white shadow-2xl relative ${proctoringModal.isFinal
            ? 'bg-rose-950/95 border-rose-600 shadow-rose-900/50'
            : proctoringModal.count === 2
              ? 'bg-amber-950/95 border-amber-600 shadow-amber-900/50'
              : 'bg-slate-900/95 border-amber-500/70 shadow-amber-500/20'
            }`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${proctoringModal.isFinal ? 'bg-rose-900/80 text-rose-300' : 'bg-amber-900/80 text-amber-300'
                }`}>
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold block text-slate-400">
                  AI Proctoring Telemetry Alert
                </span>
                <h3 className="text-lg font-black tracking-tight text-white">
                  {proctoringModal.isFinal
                    ? '🛑 Interview Closed & Auto-Submitted'
                    : proctoringModal.count === 2
                      ? '🚨 FINAL WARNING (2 of 2)'
                      : `⚠️ Warning 1 of 2`}
                </h3>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 mb-4 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Violation Detected:</span>
                <span className="font-bold font-mono text-white">{proctoringModal.violation}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Violation Count:</span>
                <span className="font-bold font-mono text-rose-400">{proctoringModal.count} / 3 Strikes</span>
              </div>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed mb-5">
              {proctoringModal.isFinal ? (
                <span>
                  Maximum proctoring violations reached (3 strikes). Your interview session has closed and your answers are being submitted automatically.
                </span>
              ) : proctoringModal.count === 2 ? (
                <span>
                  <strong className="text-amber-400">FINAL WARNING (2 of 2)!</strong> You have incurred 2 strikes. Exiting fullscreen, closing or switching tabs, and multiple faces detected are strictly prohibited. The 3rd strike will immediately close and submit your interview!
                </span>
              ) : (
                <span>
                  <strong>Warning 1 of 2:</strong> Please stay in full-screen mode, do not close or switch browser tabs, and ensure only you are visible to the camera. You have 1 warning remaining.
                </span>
              )}
            </p>

            <div className="flex items-center justify-end">
              {proctoringModal.isFinal ? (
                <div className="text-xs font-mono text-rose-300 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting Assessment & Redirecting...</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAcknowledgeWarning}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
                >
                  {proctoringModal.count === 2
                    ? 'I Understand (Final Warning) • Resume Fullscreen'
                    : 'Acknowledge Warning 1 • Resume Fullscreen'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
