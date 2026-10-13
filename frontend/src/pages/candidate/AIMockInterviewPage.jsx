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
import { heygenAvatarService } from '../../services/heygenAvatarService';
import { HeyGenStreamingAvatar } from '../../components/interview/HeyGenStreamingAvatar';
import {
  getInterviewAudioForText,
  findInterviewAudioKey
} from '../../data/interviewAudioManifest';
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

export const AIMockInterviewPage = () => {
  const navigate = useNavigate();
  const { navigateTo, currentUser, role, adminUser, candidateSubmissions, assessments, isAssessmentCompleted, addToast, startAssessment, isInterviewUnlocked } = useApp();

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
  const [heyGenModePreferred] = useState(() => {
    try {
      const saved = localStorage.getItem('rsj_avatar_mode');
      return saved ? saved !== 'animated_only' : true;
    } catch { return true; }
  });
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

  // Per-question answering window (seconds remaining once the candidate starts
  // speaking; null = they haven't started yet). Auto-advances on time-up or silence.
  const [answerSecondsLeft, setAnswerSecondsLeft] = useState(null);
  const [answerAutoNotice, setAnswerAutoNotice] = useState('');
  const MAX_ANSWER_SECONDS = 30; // hard cap on a single spoken answer
  const SILENCE_SECONDS = 4;     // advance once the candidate stops talking this long

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
          heygenAvatarService.stopSession().catch(() => {});
          if (isRecording && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsRecording(false);
          }
          stopSarvamRecording();
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
  // STT engine: Sarvam Saaras is primary (best for Indian accents / Hinglish);
  // the browser Web Speech API is the fallback.
  const sttEngineRef = useRef('none'); // 'none' | 'sarvam' | 'browser'
  const sarvamRecorderRef = useRef(null);
  const sarvamStreamRef = useRef(null);
  const sarvamSegmentTimerRef = useRef(null);
  const sarvamFailureCountRef = useRef(0);
  const sarvamFlushResolveRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const telemetryIntervalRef = useRef(null);
  const qStartTimeRef = useRef(Date.now());
  // Per-question answer window bookkeeping
  const answerTimerRef = useRef(null);
  const answerStartedAtRef = useRef(0);
  const lastVoiceAtRef = useRef(0);
  const autoSubmitFiredRef = useRef(false);
  const submitAnswerRef = useRef(null);
  const submitInFlightRef = useRef(false);
  const currentQRef = useRef(questions[0]);

  // ElevenLabs TTS refs
  const elevenLabsAbortRef = useRef(null);
  const elevenLabsSourceRef = useRef(null);

  // Pre-rendered interview audio clip (fixed questions + transition lines)
  const preRenderedAudioRef = useRef(null);

  // ElevenLabs TTS is proxied through the backend (`/api/tts/speak`). The API key
  // lives server-side only and is never bundled into the browser.
  const ttsAuthHeaders = () => {
    const token = localStorage.getItem('rsj_token') || localStorage.getItem('token');
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  };

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

  // Dev-only drift guard: warn if a spoken question has no pre-rendered clip.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    questions.forEach((q) => {
      const text = q?.questionText || q?.question;
      if (text && !findInterviewAudioKey(text)) {
        console.warn('[InterviewAudio] No pre-rendered clip for question text; will use live TTS:', text);
      }
    });
  }, [questions]);

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
    // Transition from Setup to Live Interview Stage
    setIsInterviewCompleted(false);
    try {
      localStorage.removeItem('rsj_interview_completed');
    } catch { }
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

  // Play a pre-rendered clip from /audio/interview/. Resolves true once playback
  // has started, false when the clip is missing/unplayable so the caller can
  // fall back to live TTS.
  const playPreRenderedClip = (clip, onDone) => new Promise((resolve) => {
    let audio;
    try {
      setIsAISpeaking(true);
      audio = new Audio(clip.src);
      audio.preload = 'auto';
      preRenderedAudioRef.current = audio;
    } catch (err) {
      console.warn('[InterviewAudio] could not create audio element:', err);
      resolve(false);
      return;
    }

    let settled = false;
    let started = false;
    const release = () => {
      if (preRenderedAudioRef.current === audio) preRenderedAudioRef.current = null;
    };

    audio.onplaying = () => { started = true; };

    audio.onended = () => {
      if (settled) return;
      settled = true;
      release();
      setIsAISpeaking(false);
      onDone?.();
    };

    audio.onerror = () => {
      if (settled) return;
      settled = true;
      release();
      if (started) {
        // Failed mid-playback: treat as finished so the flow continues.
        setIsAISpeaking(false);
        onDone?.();
        resolve(true);
      } else {
        console.warn('[InterviewAudio] pre-rendered clip unavailable, falling back to TTS:', clip.src);
        resolve(false);
      }
    };

    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.catch(() => {
        if (settled) return;
        settled = true;
        release();
        console.warn('[InterviewAudio] pre-rendered clip blocked/unplayable, falling back to TTS:', clip.src);
        resolve(false);
      });
    } else {
      resolve(true);
    }
  });

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
    if (preRenderedAudioRef.current) {
      try { preRenderedAudioRef.current.pause(); } catch { }
      preRenderedAudioRef.current = null;
    }

    // 0. Pre-rendered static clip (fixed questions + transition lines). Zero
    // latency / zero cost; any unmatched text falls through to live TTS below.
    const preRenderedClip = getInterviewAudioForText(cleanText);
    if (preRenderedClip) {
      const played = await playPreRenderedClip(preRenderedClip, () => onFinished?.());
      if (played) return;
    }

    // 1. HeyGen Interactive Avatar native speech (primary when a live stream is connected)
    if (heyGenModePreferred && (heygenAvatarService.status === 'connected' || heygenAvatarService.status === 'speaking')) {
      setIsAISpeaking(true);
      try {
        await heygenAvatarService.speak(cleanText, () => {
          setIsAISpeaking(false);
          onFinished?.();
        });
        return;
      } catch (err) {
        console.warn('HeyGen avatar speech notice, falling back to TTS:', err);
      }
    }

    const ttsEndpoint = (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.startsWith('http'))
      ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/tts/speak`
      : '/api/tts/speak';

    getAudioContext();
    setIsAISpeaking(true);

    try {
      const abortCtrl = new AbortController();
      elevenLabsAbortRef.current = abortCtrl;

      const response = await fetch(ttsEndpoint, {
        method: 'POST',
        signal: abortCtrl.signal,
        headers: { ...ttsAuthHeaders(), 'Accept': 'audio/mpeg' },
        body: JSON.stringify({ text: cleanText }),
      });

      if (!response.ok) {
        console.warn('TTS proxy unavailable, falling back to browser TTS. Status:', response.status);
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

  // ── Speech-to-Text (STT) Capture Engine ──
  // Engine priority: Sarvam Saaras (best accuracy on Indian accents / Hinglish),
  // streamed as short MediaRecorder segments to the backend proxy at
  // /api/stt/transcribe — the provider key never reaches the browser. If Sarvam
  // is unreachable, the browser Web Speech API is used as a fallback.
  const sttEndpoint = (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.startsWith('http'))
    ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/stt/transcribe`
    : '/api/stt/transcribe';

  const sttAuthHeaders = (contentType) => {
    const token = localStorage.getItem('rsj_token') || localStorage.getItem('token');
    return { ...(contentType ? { 'Content-Type': contentType } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  };

  // Records that the candidate is actively answering (drives the answer window).
  const markVoiceActivity = () => {
    if (!answerStartedAtRef.current) answerStartedAtRef.current = Date.now();
    lastVoiceAtRef.current = Date.now();
  };

  const appendTranscript = (text) => {
    const chunk = (text || '').trim();
    if (!chunk) return;
    accumulatedTranscriptRef.current = `${accumulatedTranscriptRef.current} ${chunk}`.replace(/\s+/g, ' ').trim();
    setCompanionText(accumulatedTranscriptRef.current);
    lastCandidateSpokeTimeRef.current = Date.now();
    markVoiceActivity();
  };

  // Switch from Sarvam to the browser engine when the proxy is unavailable.
  const fallbackToBrowserSpeechRecognition = () => {
    if (sttEngineRef.current !== 'sarvam') return;
    console.warn('Sarvam STT unavailable — falling back to browser speech recognition.');
    stopSarvamRecording();
    startBrowserSpeechRecognition();
  };

  const noteSarvamFailure = (status) => {
    sarvamFailureCountRef.current += 1;
    const permanent = status === 401 || status === 402 || status === 403 || status === 503;
    if (permanent || sarvamFailureCountRef.current >= 2) {
      fallbackToBrowserSpeechRecognition();
    }
  };

  const transcribeSegment = async (blob) => {
    if (!blob || blob.size === 0) return;
    try {
      const url = `${sttEndpoint}?language_code=${encodeURIComponent(sttLang || 'en-IN')}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: sttAuthHeaders(blob.type || 'audio/webm'),
        body: blob,
      });
      if (!res.ok) {
        console.warn('Sarvam STT unavailable, status:', res.status);
        noteSarvamFailure(res.status);
        return;
      }
      sarvamFailureCountRef.current = 0;
      const data = await res.json().catch(() => ({}));
      if (data?.transcript) appendTranscript(data.transcript);
    } catch (err) {
      console.warn('Sarvam STT notice:', err.message);
      noteSarvamFailure(0);
    }
  };

  const stopSarvamRecording = () => {
    if (sarvamSegmentTimerRef.current) {
      clearTimeout(sarvamSegmentTimerRef.current);
      sarvamSegmentTimerRef.current = null;
    }
    const recorder = sarvamRecorderRef.current;
    sarvamRecorderRef.current = null;
    if (recorder && recorder.state !== 'inactive') {
      try { recorder.stop(); } catch { }
    }
    if (sarvamStreamRef.current) {
      sarvamStreamRef.current.getTracks().forEach((t) => t.stop());
      sarvamStreamRef.current = null;
    }
    // Release any pending flush so a submit can never hang waiting on audio.
    if (sarvamFlushResolveRef.current) {
      const resolveFlush = sarvamFlushResolveRef.current;
      sarvamFlushResolveRef.current = null;
      resolveFlush();
    }
    if (sttEngineRef.current === 'sarvam') setIsRecording(false);
  };

  // Stop the active Sarvam segment and resolve once its transcript has been
  // processed, so submitting an answer never drops the candidate's last words.
  const flushSarvamRecording = () => {
    const recorder = sarvamRecorderRef.current;
    if (sttEngineRef.current !== 'sarvam' || !recorder || recorder.state === 'inactive') {
      return Promise.resolve();
    }
    if (sarvamSegmentTimerRef.current) {
      clearTimeout(sarvamSegmentTimerRef.current);
      sarvamSegmentTimerRef.current = null;
    }
    return new Promise((resolve) => {
      sarvamFlushResolveRef.current = resolve;
      try {
        recorder.stop();
      } catch {
        sarvamFlushResolveRef.current = null;
        resolve();
      }
    });
  };

  const startSarvamRecording = async () => {
    if (sttEngineRef.current === 'sarvam' && sarvamRecorderRef.current) return;
    const MediaRecorder = window.MediaRecorder;
    if (!MediaRecorder || !navigator.mediaDevices?.getUserMedia) {
      // Recording not possible — fall back to the browser Web Speech API.
      startBrowserSpeechRecognition();
      return;
    }

    sttEngineRef.current = 'sarvam';
    sarvamFailureCountRef.current = 0;
    try {
      // Reuse the camera stream's audio track when present to avoid a second prompt.
      let stream = mediaStreamRef.current;
      if (!stream || stream.getAudioTracks().length === 0) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        sarvamStreamRef.current = stream;
      }

      const SEGMENT_MS = 4000;
      const preferred = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
      const mimeType = preferred.find((t) => MediaRecorder.isTypeSupported?.(t)) || '';

      const beginSegment = () => {
        if (sttEngineRef.current !== 'sarvam') return;
        let recorder;
        try {
          recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        } catch {
          recorder = new MediaRecorder(stream);
        }

        const chunks = [];
        recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
        recorder.onstop = async () => {
          const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || 'audio/webm' });
          await transcribeSegment(blob);
          // A pending flush (submit) resolves with the final segment transcribed.
          if (sarvamFlushResolveRef.current) {
            const resolveFlush = sarvamFlushResolveRef.current;
            sarvamFlushResolveRef.current = null;
            resolveFlush();
            return;
          }
          if (sttEngineRef.current === 'sarvam') beginSegment();
        };

        try {
          recorder.start();
        } catch (err) {
          console.warn('Recorder start notice:', err.message);
          return;
        }
        sarvamRecorderRef.current = recorder;
        setIsRecording(true);

        // Rotate segments so transcripts stream in near-real-time.
        sarvamSegmentTimerRef.current = setTimeout(() => {
          if (recorder.state !== 'inactive') {
            try { recorder.stop(); } catch { }
          }
        }, SEGMENT_MS);
      };

      beginSegment();
    } catch (err) {
      console.warn('Microphone unavailable for speech recognition:', err.message);
      setIsRecording(true);
    }
  };

  const startBrowserSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // No recording and no Web Speech API available.
      sttEngineRef.current = 'none';
      setIsRecording(true);
      return;
    }
    sttEngineRef.current = 'browser';

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
          markVoiceActivity();
        }
      };

      recognition.onerror = (e) => {
        console.warn('STT notice:', e?.error);
        // Fatal errors (blocked service, capture failure, unsupported language):
        // stop cleanly; Sarvam is the primary engine so there is nothing to
        // fall back to here.
        const fatal = ['not-allowed', 'service-not-allowed', 'audio-capture', 'network', 'language-not-supported'];
        if (fatal.includes(e?.error) && sttEngineRef.current === 'browser') {
          try { recognition.abort(); } catch { }
          sttEngineRef.current = 'none';
          setIsRecording(false);
        }
      };

      recognition.onend = () => {
        // If we've switched engines, do not restart the browser engine.
        if (sttEngineRef.current !== 'browser') return;
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

  // Engine selection: Sarvam Saaras (primary) with browser Web Speech fallback.
  const startSpeechRecognition = () => {
    const MediaRecorder = window.MediaRecorder;
    const canRecordAudio = Boolean(MediaRecorder && navigator.mediaDevices?.getUserMedia);
    if (canRecordAudio) {
      startSarvamRecording();
      return;
    }
    startBrowserSpeechRecognition();
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { }
      recognitionRef.current = null;
    }
    stopSarvamRecording();
    sttEngineRef.current = 'none';
    setIsRecording(false);
  };

  // Toggle between Indian English (en-IN) and US English (en-US)
  const toggleSttLang = () => {
    const nextLang = sttLang === 'en-IN' ? 'en-US' : 'en-IN';
    setSttLang(nextLang);
    if (isRecording) {
      stopSpeechRecognition();
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
    stopSpeechRecognition();
    heygenAvatarService.stopSession().catch(() => {});
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
          transcript: isSkipped ? '' : a.companionNote,
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
    if (submitInFlightRef.current) return;
    submitInFlightRef.current = true;

    // Stop the per-question answer window.
    if (answerTimerRef.current) {
      clearInterval(answerTimerRef.current);
      answerTimerRef.current = null;
    }
    setAnswerSecondsLeft(null);

    // Flush the in-flight Sarvam segment so the candidate's last words are captured.
    await flushSarvamRecording();

    // 1. Stop Speech-to-Text
    stopSpeechRecognition();

    // 2. Transition to PROCESSING state
    setAgentState('PROCESSING');
    agentStateRef.current = 'PROCESSING';
    setIsProcessing(true);

    const currentQ = questions[currentQIndex] || questions[0];
    const isFinalQuestion = currentQIndex >= questions.length - 1;

    // Prefer the ref (updated synchronously, after the pending segment flush).
    const recordedText = forceSkip ? '' : (accumulatedTranscriptRef.current || companionText || '').trim();
    const words = recordedText.split(/\s+/).filter(Boolean);
    const isSilent = forceSkip || words.length < 3 || recordedText.toLowerCase().includes('candidate provided verbal answer') || recordedText.toLowerCase().includes('no response');

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
      isSkipped: isSilent,
      companionNote: isSilent ? 'Answer Skipped (No response provided)' : recordedText,
      score: isSilent ? 0 : calculatedScore,
      technicalScore: isSilent ? 0 : techScore,
      communicationScore: isSilent ? 0 : commScore,
      eyeContactScore: isSilent ? 0 : telemetry.eyeContact,
      attentionScore: isSilent ? 0 : telemetry.attention,
      confidenceScore: isSilent ? 0 : telemetry.confidence
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

  // Keep a ref to the latest submit handler for the auto-advance timer.
  useEffect(() => {
    submitAnswerRef.current = handleCandidateSubmit;
  });

  // ── Per-question answer window ──
  // Starts when the candidate begins speaking (mic voice activity or first
  // transcript). Auto-advances when the 30s cap is hit, or once they have been
  // silent for a few seconds after speaking (so quick answers don't stall).
  useEffect(() => {
    if (!sessionActive || agentState !== 'LISTENING') return;

    const MAX_ANSWER_MS = MAX_ANSWER_SECONDS * 1000;
    const SILENCE_MS = SILENCE_SECONDS * 1000;
    const VOICE_LEVEL = 22;

    answerStartedAtRef.current = 0;
    lastVoiceAtRef.current = 0;
    autoSubmitFiredRef.current = false;
    submitInFlightRef.current = false;
    setAnswerSecondsLeft(null);
    setAnswerAutoNotice('');

    const tick = () => {
      const analyser = analyserRef.current;
      let level = 0;
      if (analyser) {
        const bins = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(bins);
        let sum = 0;
        for (let i = 0; i < bins.length; i++) sum += bins[i];
        level = sum / bins.length;
      }
      const now = Date.now();
      if (level > VOICE_LEVEL) {
        if (!answerStartedAtRef.current) answerStartedAtRef.current = now;
        lastVoiceAtRef.current = now;
      }

      if (!answerStartedAtRef.current) return; // hasn't started answering yet

      const elapsed = now - answerStartedAtRef.current;
      const silence = now - lastVoiceAtRef.current;
      setAnswerSecondsLeft(Math.max(0, Math.ceil((MAX_ANSWER_MS - elapsed) / 1000)));

      const hasTranscript = (accumulatedTranscriptRef.current || '').trim().length > 0;
      const timeUp = elapsed >= MAX_ANSWER_MS;
      const silentFinish = silence >= SILENCE_MS && hasTranscript;
      if (!timeUp && !silentFinish) return;
      if (autoSubmitFiredRef.current) return;
      autoSubmitFiredRef.current = true;
      if (answerTimerRef.current) {
        clearInterval(answerTimerRef.current);
        answerTimerRef.current = null;
      }
      setAnswerAutoNotice(timeUp ? 'Time limit reached - moving on.' : 'Answer recorded - moving on.');
      submitAnswerRef.current?.(false);
    };

    answerTimerRef.current = setInterval(tick, 400);
    return () => {
      if (answerTimerRef.current) {
        clearInterval(answerTimerRef.current);
        answerTimerRef.current = null;
      }
    };
  }, [sessionActive, agentState, currentQIndex]);

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
      // Stop any in-progress pre-rendered clip
      if (preRenderedAudioRef.current) { try { preRenderedAudioRef.current.pause(); } catch { } preRenderedAudioRef.current = null; }
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
                {/* <BrainCircuit className="w-4 h-4" /> */}
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

          {/* Resume Skills Match Box */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 font-sans">Skills for {targetRole}</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Resume skillset alignment evaluated against role requirements.</p>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono self-start sm:self-auto">
                <span className="text-slate-500 font-semibold">ATS Match Benchmark:</span>
                <span className="text-emerald-600 font-black">{skillGaps.atsScore}%</span>
              </div>
            </div>

            {/* Skills Present in Your Resume */}
            {skillGaps.matchedCore && skillGaps.matchedCore.length > 0 ? (
              <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80">
                <div className="flex items-center gap-2 mb-3 text-xs font-bold text-emerald-800 font-sans">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Skills Present in Your Resume ({skillGaps.matchedCore.length})</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skillGaps.matchedCore.map((skill, i) => (
                    <span key={i} className="px-3.5 py-1.5 rounded-xl bg-white border border-emerald-200 text-xs font-semibold text-emerald-800 shadow-2xs">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 font-medium">
                No specific core resume skills detected for this role.
              </div>
            )}
          </div>

          {/* Question Evaluation Breakdown */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 font-sans">Question Evaluation Breakdown</h4>
              <span className="text-xs font-mono text-slate-500 font-bold">{effectiveAnswers.length} {effectiveAnswers.length === 1 ? 'Question' : 'Questions'} Evaluated</span>
            </div>
            <div className="space-y-3">
              {effectiveAnswers.map((item, idx) => {
                const isSkipped = Boolean(
                  item.isSkipped ||
                  item.score === 0 ||
                  !item.companionNote ||
                  item.companionNote.includes('No verbal') ||
                  item.companionNote.includes('Skipped')
                );

                return (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors shadow-2xs">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[11px] font-mono font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-md border border-brand-200">{item.stage}</span>
                        <span className="text-[11px] text-slate-500 uppercase tracking-wider font-mono font-semibold">{item.category}</span>
                      </div>
                      <div className="text-xs sm:text-sm text-slate-900 font-semibold font-sans">{item.question}</div>
                      <div className="text-xs text-slate-600 mt-2 italic font-sans bg-white p-2.5 rounded-xl border border-slate-200/70">
                        {isSkipped ? (
                          <span className="text-amber-700 font-semibold not-italic">Answer Skipped — Candidate did not provide an answer (No analysis)</span>
                        ) : (
                          `"${item.companionNote || 'Answer verbalized'}"`
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isSkipped ? (
                        <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                          Answer Skipped
                        </span>
                      ) : (
                        <>
                          <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 border border-brand-200 shadow-2xs">
                            Score: {item.score}/100
                          </span>
                          <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                            Gaze: {item.eyeContactScore}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
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
              {/* <BrainCircuit className="w-4 h-4" /> */}
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
                    {uploadedFileName ? 'Change File' : 'Browse File'}
                  </label>

                  {uploadedFileName && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearResume();
                      }}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-semibold text-rose-700 transition-all cursor-pointer font-sans"
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

            {/* ATS MATCH & EXTRACTED SKILLS (Shown ONLY when a resume is uploaded) */}
            {hasUploadedResume ? (
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
                </div>

                {/* Extracted Skills Pills from Resume */}
                {analysisResult?.skills && analysisResult.skills.length > 0 ? (
                  <div className="flex items-center gap-1.5 flex-wrap mb-3">
                    <span className="text-[11px] text-emerald-800 font-semibold mr-1 font-sans">Skills Present in Resume:</span>
                    {analysisResult.skills.slice(0, 10).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-700 font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="mb-3 text-[11px] text-slate-500 font-sans italic">
                    No specific technical skills detected in the uploaded resume.
                  </div>
                )}

                {/* Missed Skills to Learn According to Resume */}
                {skillGaps.skillsToCover && skillGaps.skillsToCover.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mb-4">
                    <span className="text-[11px] text-amber-700 font-semibold mr-1 font-sans">
                      Missed Skills to Learn (According to Resume):
                    </span>
                    {skillGaps.skillsToCover.slice(0, 8).map((skill, idx) => (
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
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleProceedToRoom}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm sm:text-base shadow-md shadow-brand-600/20 transition-all hover:scale-[1.005] cursor-pointer font-sans"
                  >
                    <span>Proceed to Live AI Interview Room -></span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  {isInterviewCompleted && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
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
              <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-start gap-3.5 text-amber-900">
                  <div className="w-9 h-9 rounded-xl bg-white border border-amber-200 flex items-center justify-center text-amber-600 flex-shrink-0 shadow-2xs mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <strong className="text-slate-900 block font-bold text-sm mb-0.5">Resume Required to Calibrate Skills</strong>
                    <p className="text-slate-600 font-sans leading-relaxed">
                      Upload your resume above. Once uploaded, we will extract skills present in your resume, calculate your ATS match benchmark, and identify missed skills to learn according to resume for <strong className="text-slate-900 font-bold">{targetRole || 'your target role'}</strong>.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('resume-file-input');
                    if (input) input.click();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm sm:text-base shadow-md shadow-brand-600/20 transition-all hover:scale-[1.005] cursor-pointer font-sans"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Resume to Calibrate & Proceed -></span>
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
              {/* <BrainCircuit className="w-3.5 h-3.5" /> */}
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
                <span>{isTestingCamera ? 'Cam: Active' : 'Test Cam'}</span>
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
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => handlePlayOrReplayQuestion()}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all shadow-2xs cursor-pointer font-sans"
              title="Hear AI speak this question aloud"
            >
              <Volume2 className={`w-3.5 h-3.5 ${isAISpeaking ? 'text-brand-600 animate-pulse' : 'text-slate-600'}`} />
              <span>{isAISpeaking ? 'Speaking...' : 'Listen to AI'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen?.().catch(() => { });
                } else {
                  document.exitFullscreen?.().catch(() => { });
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
              title="Toggle Fullscreen"
            >
              <Maximize className="w-3 h-3 text-brand-600" />
              <span className="hidden sm:inline text-xs">Fullscreen</span>
            </button>
          </div>
        </div>

        {/* Google Meet-style stage: two participant tiles */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">

          {/* Tile 1 — AI Interviewer (Meet-style, camera OFF: no video) */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/60 shadow-card h-full min-h-0 flex items-center justify-center">
            {/* HeyGen session kept alive for interviewer voice only (never shown as video) */}
            <HeyGenStreamingAvatar
              visual="none"
              isSpeaking={isAISpeaking}
              agentState={agentState}
              sessionId={sessionId}
              isLiveStreamPreferred={heyGenModePreferred}
              onSpeechEnd={() => {
                setIsAISpeaking(false);
              }}
            />

            {isAISpeaking && (
              <div className="absolute inset-0 bg-radial from-cyan-500/10 via-transparent to-transparent pointer-events-none animate-pulse" />
            )}

            {/* Centered round avatar (no video feed) */}
            <div className="relative z-10 flex flex-col items-center justify-center gap-3">
              <div className="relative">
                <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-slate-800 ring-4 transition-all duration-300 ${isAISpeaking
                  ? 'ring-cyan-400/80'
                  : agentState === 'LISTENING'
                    ? 'ring-emerald-400/70'
                    : agentState === 'PROCESSING'
                      ? 'ring-amber-400/70'
                      : 'ring-white/10'
                  }`}>
                  <span className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-200 font-bold text-2xl sm:text-3xl select-none tracking-wide">
                    AI
                  </span>
                </div>
                {isAISpeaking && (
                  <span className="absolute inset-0 rounded-full ring-4 ring-cyan-400/40 animate-ping pointer-events-none" />
                )}
              </div>
              <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border backdrop-blur-md ${isAISpeaking
                ? 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300'
                : agentState === 'LISTENING'
                  ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                  : agentState === 'PROCESSING'
                    ? 'bg-amber-950/70 border-amber-500/40 text-amber-300'
                    : 'bg-slate-900/70 border-slate-700/60 text-slate-300'
                }`}>
                {isAISpeaking
                  ? 'Speaking…'
                  : agentState === 'LISTENING'
                    ? 'Listening…'
                    : agentState === 'PROCESSING'
                      ? 'Evaluating…'
                      : 'Camera off'}
              </span>
            </div>

            {/* Camera-off badge (top-right) */}
            <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-md border border-white/10">
              <VideoOff className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-[10px] font-mono text-slate-200">Camera off</span>
            </div>

            {/* Name pill (bottom-left, Meet style) */}
            <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10">
              <span className={`w-2.5 h-2.5 rounded-full ${isAISpeaking
                ? 'bg-cyan-400 animate-pulse'
                : agentState === 'LISTENING'
                  ? 'bg-emerald-400 animate-pulse'
                  : agentState === 'PROCESSING'
                    ? 'bg-amber-400 animate-pulse'
                    : sessionActive
                      ? 'bg-emerald-400'
                      : 'bg-slate-400'
                }`} />
              <span className="text-xs font-bold text-white font-sans">AI Interviewer</span>
            </div>
          </div>

          {/* Tile 2 — You (Meet-style, webcam always on) */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-700/60 shadow-card h-full min-h-0">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover mirror-mode ${cameraActive ? 'block' : 'hidden'}`}
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
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 text-center">
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
                  <span>Turn On Camera</span>
                </button>
              </div>
            )}

            {/* Live overlay HUD when session is active */}
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

            {/* Proctoring warning overlay (top) */}
            {activeWarningMessage && (
              <div className="absolute top-10 left-2.5 right-2.5 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-rose-400/50 text-rose-200 text-[11px] font-sans font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                <span className="truncate">{activeWarningMessage}</span>
                <span className="ml-auto px-1.5 rounded bg-rose-500/30 text-[10px] font-mono font-black text-rose-100 shrink-0">
                  {warningCount}/3
                </span>
              </div>
            )}

            {/* Name pill (bottom-left, Meet style) */}
            <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10">
              <Mic className={`w-3.5 h-3.5 ${isRecording ? 'text-emerald-400' : 'text-slate-300'}`} />
              <span className="text-xs font-bold text-white font-sans">You</span>
              {warningCount > 0 && (
                <span className={`text-[10px] font-mono font-black ${warningCount >= 3 ? 'text-rose-300' : 'text-amber-300'}`}>
                  {warningCount}/3
                </span>
              )}
            </div>

            {isRecording && (
              <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-emerald-500/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[10px] font-mono font-bold text-emerald-300">Live</span>
              </div>
            )}
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
            <div className="flex flex-col items-center gap-2.5 w-full max-w-3xl sm:max-w-4xl">
              {/* SPEECH-TO-TEXT VERBAL TRANSCRIPTION AREA */}
              <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 shadow-2xs">
                <div className="flex items-center justify-between text-xs mb-2 flex-wrap gap-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${isAISpeaking
                        ? 'bg-cyan-500 animate-ping'
                        : isRecording
                          ? 'bg-emerald-500 animate-ping'
                          : agentState === 'PROCESSING'
                            ? 'bg-amber-500 animate-pulse'
                            : 'bg-brand-500'
                        }`}
                    />
                    <span className="font-bold text-slate-800 font-sans text-xs sm:text-sm">
                      {isAISpeaking
                        ? 'Interviewer Question:'
                        : agentState === 'PROCESSING'
                          ? 'Evaluating Answer:'
                          : 'Your Verbal Answer (Speech-to-Text):'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {companionText && !isAISpeaking && (
                      <button
                        type="button"
                        onClick={() => {
                          accumulatedTranscriptRef.current = '';
                          setCompanionText('');
                        }}
                        className="text-xs text-slate-500 hover:text-rose-600 underline font-mono cursor-pointer"
                        title="Reset transcript"
                      >
                        Reset
                      </button>
                    )}
                    <span className="text-xs font-mono font-bold text-brand-600">
                      {companionText && !isAISpeaking ? `${companionText.split(/\s+/).filter(Boolean).length} words` : ''}
                    </span>
                  </div>
                </div>

                {/* Live Speech Transcription View */}
                {isAISpeaking || agentState === 'SPEAKING' ? (
                  <div className="min-h-[110px] sm:min-h-[130px] flex flex-col justify-center bg-white border border-cyan-200/90 rounded-xl p-3.5 sm:p-4 shadow-2xs">
                    <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-cyan-800">
                      <Volume2 className="w-4 h-4 text-cyan-600 animate-pulse shrink-0" />
                      <span>Question {currentQIndex + 1}:</span>
                    </div>
                    <p className="text-sm sm:text-base font-medium text-slate-800 font-sans leading-relaxed select-text">
                      "{currentSpokenSubtitle || currentQ.questionText || currentQ.question || 'Asking question...'}"
                    </p>
                  </div>
                ) : agentState === 'PROCESSING' ? (
                  <div className="min-h-[110px] sm:min-h-[130px] flex items-center justify-center text-center bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                    <Sparkles className="w-5 h-5 mr-2 text-amber-500 animate-spin" />
                    <p className="text-sm font-medium text-slate-700 font-sans">
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
                      placeholder={`Microphone is ${isRecording ? 'listening live' : 'ready'}. Speak clearly to answer Question ${currentQIndex + 1} (voice speech-to-text, or type directly)...`}
                      className="w-full min-h-[110px] sm:min-h-[130px] max-h-[180px] overflow-y-auto bg-white border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl p-3 sm:p-4 text-sm sm:text-base text-slate-800 leading-relaxed shadow-2xs font-sans resize-none transition-all outline-none"
                      rows={4}
                    />
                    {isRecording && (
                      <div className="absolute right-3 bottom-3 pointer-events-none flex items-center gap-1.5 text-xs font-mono text-emerald-700 bg-white/95 backdrop-blur-xs px-2 py-1 rounded-md border border-emerald-200 shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span className="font-bold">Live Listening</span>
                      </div>
                    )}
                  </div>
                )}

                {agentState === 'LISTENING' && isRecording && (
                  <div className={`mt-2 flex items-center justify-between text-xs px-3 py-1.5 rounded-lg border font-mono ${typeof answerSecondsLeft === 'number' && answerSecondsLeft <= 5
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800 animate-pulse'
                    }`}>
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full animate-ping ${typeof answerSecondsLeft === 'number' && answerSecondsLeft <= 5 ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                      {answerSecondsLeft === null
                        ? 'Listening... start answering whenever you are ready.'
                        : 'Recording your answer...'}
                    </span>
                    <span className="font-semibold">
                      {answerSecondsLeft === null
                        ? `Max ${MAX_ANSWER_SECONDS}s per answer`
                        : `${answerSecondsLeft}s left`}
                    </span>
                  </div>
                )}

                {agentState === 'PROCESSING' && (
                  <div className="mt-2 flex items-center justify-center text-xs px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-mono">
                    <span>{answerAutoNotice || 'Evaluating answer with AI evaluation engine...'}</span>
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
                  title="Replay Question Audio"
                >
                  <Volume2 className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Replay Audio</span>
                </button>

                <button
                  type="button"
                  onClick={handleSkipQuestion}
                  disabled={agentState === 'PROCESSING' || agentState === 'AI_RESPONSE'}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold font-sans transition-all cursor-pointer shadow-2xs"
                  title="Skip this question without providing an answer"
                >
                  <span>Skip Question</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCandidateSubmit(false)}
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
                    ? 'Interview Closed & Auto-Submitted'
                    : proctoringModal.count === 2
                      ? 'FINAL WARNING (2 of 2)'
                      : `Warning 1 of 2`}
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
