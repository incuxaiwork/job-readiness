import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { INITIAL_QUESTION_BANK } from '../../data/mockData';
import { Modal } from '../../components/common/Modal';
import { MediaPreviewWidget } from '../../components/candidate/MediaPreviewWidget';
import { CodingWorkspace } from '../../components/candidate/CodingWorkspace';
import {
  getFaceLandmarker,
  classifyFrame,
  GRACE_PERIOD_MS,
  DETECTION_INTERVAL_MS,
  MAX_ALLOWED_STRIKES
} from '../../services/proctoringService';
import {
  Clock,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  BrainCircuit,
  Flag,
  RotateCcw,
  CheckSquare,
  HelpCircle,
  Copy,
  Check,
  Code2,
  Camera,
  VideoOff,
  ShieldAlert,
  EyeOff,
  UserX,
  Users,
  RefreshCw,
  AlertTriangle,
  Lock,
  BarChart2
} from 'lucide-react';

export const AssessmentPage = () => {
  const {
    activeAssessment,
    setActiveAssessment,
    assessments,
    startAssessment,
    mediaStream,
    setMediaStream,
    stopMediaStream,
    currentUser,
    questionBank,
    assessmentAnswers,
    setAssessmentAnswers,
    markedForReview,
    setMarkedForReview,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    timeRemainingSeconds,
    setTimeRemainingSeconds,
    submitAssessment,
    navigateTo,
    addToast,
    role,
    isAssessmentCompleted,
    candidateSubmissions
  } = useApp();

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [showEnterFullscreenModal, setShowEnterFullscreenModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Proctoring & Camera States
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraDenied, setCameraDenied] = useState(false);
  const [isRequestingCamera, setIsRequestingCamera] = useState(false);
  const [proctorState, setProctorState] = useState({ status: 'initializing', reason: '', message: '' });
  const [violationCount, setViolationCount] = useState(0);
  const [isPausedForWarning, setIsPausedForWarning] = useState(false);
  const [warningModalData, setWarningModalData] = useState({
    isOpen: false,
    violationNumber: 0,
    reason: '',
    message: '',
    isFinal: false
  });

  const videoElementRef = useRef(null);
  const violationCountRef = useRef(0);
  const badStateStartTimeRef = useRef(null);
  const lastBadStatusRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const attemptIdRef = useRef(`att-${activeAssessment?.id || 'asm'}-${currentUser?.id || 'cand'}-${Date.now()}`);

  const fullscreenExitCountRef = useRef(0);
  const isSubmittedRef = useRef(false);
  const timerRef = useRef(null);
  const hasRedirectedRef = useRef(false);

  // Single Attempt Policy: Prevent candidate from taking an already completed assessment
  useEffect(() => {
    if (role === 'admin') return;

    if (activeAssessment && isAssessmentCompleted && isAssessmentCompleted(activeAssessment)) {
      if (!hasRedirectedRef.current) {
        hasRedirectedRef.current = true;
        addToast('Single-Attempt Policy Active: You have already completed this assessment. Retakes are not allowed.', 'warning');
        navigateTo('candidate-analytics');
      }
      return;
    }

    if (!activeAssessment && assessments && assessments.length > 0) {
      const firstAvailable = assessments.find(a => !isAssessmentCompleted(a));
      if (firstAvailable) {
        startAssessment(firstAvailable.id);
      } else {
        if (!hasRedirectedRef.current) {
          hasRedirectedRef.current = true;
          addToast('All assessments completed! Single-attempt policy is active.', 'info');
          navigateTo('candidate-analytics');
        }
      }
    }
  }, [activeAssessment?.id, assessments?.length, role]);

  // Ensure questions for the active assessment are fully loaded from the database API
  useEffect(() => {
    let isMounted = true;
    const ensureQuestions = async () => {
      const targetId = activeAssessment?.id;
      if (!targetId) return;

      if (!activeAssessment.questions || activeAssessment.questions.length === 0) {
        setLoadingQuestions(true);
        try {
          const res = await api.assessments.getQuestions(targetId);
          if (!res.ok && (res.status === 403 || res.data?.alreadyCompleted)) {
            addToast(res.error || 'Single-Attempt Policy Active: You have already completed this assessment. Retakes are not allowed.', 'warning');
            navigateTo('candidate-analytics');
            return;
          }
          const list = Array.isArray(res?.data?.data)
            ? res.data.data
            : (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
          let mapped = [];
          if (list.length > 0) {
            mapped = list.map(q => ({
              ...q,
              id: q.question_id || q.id,
              questionId: q.question_id || q.id,
              question: q.question,
              type: q.type || (q.category === 'Coding' ? 'Coding' : 'Single Choice'),
              category: q.category || activeAssessment.category,
              topic: q.topic || 'General',
              difficulty: q.difficulty || activeAssessment.difficulty || 'Medium',
              marks: Number(q.marks) > 0 ? Number(q.marks) : 4,
              options: typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []),
              test_cases: typeof q.test_cases === 'string' ? JSON.parse(q.test_cases) : (q.test_cases || []),
              starter_templates: typeof q.starter_templates === 'string' ? JSON.parse(q.starter_templates) : (q.starter_templates || null),
              constraints: q.constraints || null
            }));
          } else {
            const cat = activeAssessment?.category || 'Technical';
            const fallback = INITIAL_QUESTION_BANK.filter(q => q.category && q.category.toLowerCase() === cat.toLowerCase());
            mapped = fallback.length > 0 ? fallback : INITIAL_QUESTION_BANK.slice(0, 10);
          }

          if (isMounted && mapped.length > 0 && setActiveAssessment) {
            setActiveAssessment(prev => ({
              ...(prev || activeAssessment),
              questions: mapped,
              totalQuestions: mapped.length
            }));
          }
        } catch (err) {
          console.error('Failed to load assessment questions in AssessmentPage:', err);
          if (isMounted && setActiveAssessment) {
            const cat = activeAssessment?.category || 'Technical';
            const fallback = INITIAL_QUESTION_BANK.filter(q => q.category && q.category.toLowerCase() === cat.toLowerCase());
            const mapped = fallback.length > 0 ? fallback : INITIAL_QUESTION_BANK.slice(0, 10);
            setActiveAssessment(prev => ({
              ...(prev || activeAssessment),
              questions: mapped,
              totalQuestions: mapped.length
            }));
          }

        } finally {
          if (isMounted) setLoadingQuestions(false);
        }
      }
    };

    ensureQuestions();
    return () => { isMounted = false; };
  }, [activeAssessment?.id]);

  // Fullscreen Request Helper
  const requestExamFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => { });
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
    setShowEnterFullscreenModal(false);
    setShowFullscreenWarning(false);
  };

  const exitExamFullscreenAndStopMedia = () => {
    if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
      try {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => { });
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      } catch (e) { }
    }
    stopMediaStream();
  };

  // Camera Gating: Request webcam access for proctoring
  const requestCamera = async () => {
    setIsRequestingCamera(true);
    setCameraDenied(false);
    try {
      if (mediaStream && mediaStream.getVideoTracks().some(t => t.readyState === 'live')) {
        setCameraReady(true);
        setIsRequestingCamera(false);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      });
      setMediaStream(stream);
      setCameraReady(true);
      setCameraDenied(false);
    } catch (err) {
      console.error('Camera access denied or unavailable:', err);
      setCameraDenied(true);
      setCameraReady(false);
    } finally {
      setIsRequestingCamera(false);
    }
  };

  useEffect(() => {
    requestCamera();
  }, []);

  // Helper to ensure any written coding solutions are authoritatively graded before submission
  const evaluatePendingCodingAnswers = async (currentAnswers) => {
    const questionsList = (activeAssessment?.questions && activeAssessment.questions.length > 0)
      ? activeAssessment.questions
      : questionBank;
    let finalAnswers = { ...currentAnswers };
    const codingQuestions = (questionsList || []).filter(q => q.type === 'Coding');

    for (const cq of codingQuestions) {
      const userAns = finalAnswers[cq.id];
      if (userAns && userAns.code && (userAns.score === undefined || userAns.score === null || userAns.passedTests === undefined)) {
        try {
          let baseTestCases = [];
          if (cq.test_cases) {
            baseTestCases = typeof cq.test_cases === 'string' ? JSON.parse(cq.test_cases) : cq.test_cases;
          }
          const evalRes = await api.post('/api/code/submit', {
            questionId: cq.id,
            question_id: cq.question_id,
            assessmentQuestionId: cq.id,
            language: userAns.language || cq.language || 'python',
            sourceCode: userAns.code,
            testCases: baseTestCases
          });
          if (evalRes && evalRes.success && evalRes.evaluation) {
            finalAnswers[cq.id] = {
              ...userAns,
              score: evalRes.evaluation.score,
              passedTests: evalRes.evaluation.passedTests,
              totalTests: evalRes.evaluation.totalTests,
              samplePassed: evalRes.summary?.samplePassed ?? evalRes.evaluation.testResults?.filter(t => !t.isHidden && t.passed).length ?? 0,
              sampleTotal: evalRes.summary?.sampleTotal ?? evalRes.evaluation.testResults?.filter(t => !t.isHidden).length ?? 0,
              hiddenPassed: evalRes.summary?.hiddenPassed ?? evalRes.evaluation.testResults?.filter(t => t.isHidden && t.passed).length ?? 0,
              hiddenTotal: evalRes.summary?.hiddenTotal ?? evalRes.evaluation.testResults?.filter(t => t.isHidden).length ?? 0,
              verdict: evalRes.evaluation.verdict
            };
          }
        } catch (err) {
          console.warn('Auto-evaluation of coding question skipped/failed:', err);
        }
      }
    }
    return finalAnswers;
  };

  const handleAutoSubmit = async (reason) => {
    if (isSubmittedRef.current || isSubmitting || totalQuestions === 0 || loadingQuestions) return;
    isSubmittedRef.current = true;
    setIsSubmitting(true);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    exitExamFullscreenAndStopMedia();

    try {
      const finalAnswers = await evaluatePendingCodingAnswers(assessmentAnswers);
      const durationSec = ((activeAssessment?.durationMinutes || 10) * 60) - timeRemainingSeconds;
      const timeSpentMin = Math.max(1, Math.round(durationSec / 60));
      const res = await submitAssessment(finalAnswers, timeSpentMin, {
        proctoringViolations: violationCountRef.current,
        autoSubmitted: true,
        autoSubmitReason: reason || 'proctoring_violations'
      });
      if (res && !res.ok) {
        if (res.status === 409) {
          addToast?.('This assessment has already been submitted.', 'info');
        } else if (res.status === 429) {
          addToast?.('Submission rate limit reached. Please wait a moment.', 'warning');
        }
      }
    } catch (err) {
      console.warn('Auto-submit error:', err);
    } finally {
      setIsSubmitting(false);
      navigateTo('candidate-analytics');
    }
  };

  const handleSubmit = async () => {
    if (isSubmittedRef.current || isSubmitting) return;
    setIsSubmitting(true);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    try {
      const finalAnswers = await evaluatePendingCodingAnswers(assessmentAnswers);
      const durationSec = ((activeAssessment?.durationMinutes || 10) * 60) - timeRemainingSeconds;
      const timeSpentMin = Math.max(1, Math.round(durationSec / 60));
      const res = await submitAssessment(finalAnswers, timeSpentMin, {
        proctoringViolations: violationCountRef.current,
        autoSubmitted: false,
        autoSubmitReason: null
      });

      if (res && !res.ok) {
        if (res.status === 409) {
          addToast?.('This assessment has already been submitted and recorded.', 'info');
        } else if (res.status === 429) {
          addToast?.('Too many requests. Please wait a moment before submitting.', 'warning');
        } else {
          addToast?.(res.error || 'Submission encountered an error.', 'error');
        }
      }

      isSubmittedRef.current = true;
      setShowSubmitModal(false);
      try {
        localStorage.setItem('rsj_assessment_completed', 'true');
        localStorage.setItem('rsj_interview_unlocked_by_test', 'true');
        if (activeAssessment?.title) {
          localStorage.setItem('rsj_last_completed_assessment', activeAssessment.title);
        }
      } catch (e) { }
      exitExamFullscreenAndStopMedia();
      navigateTo('candidate-analytics');
    } catch (err) {
      addToast?.('Failed to submit assessment. Please try again.', 'error');
      setIsSubmitting(false);
    }
  };

  // Live Face-Presence Proctoring Loop with MediaPipe Tasks Vision
  useEffect(() => {
    if (!cameraReady || !mediaStream || isSubmitting || isSubmittedRef.current) {
      return;
    }

    let landmarker = null;
    let isCancelled = false;

    const startProctoringLoop = async () => {
      try {
        landmarker = await getFaceLandmarker();
        if (isCancelled) return;

        detectionIntervalRef.current = setInterval(() => {
          if (isCancelled || isSubmittedRef.current || isPausedForWarning || !videoElementRef.current) {
            return;
          }

          const video = videoElementRef.current;
          if (video.readyState < 2 || video.paused || video.ended) {
            return;
          }

          try {
            const results = landmarker.detectForVideo(video, performance.now());
            const classification = classifyFrame(results);
            setProctorState(classification);

            if (classification.status === 'face_ok') {
              badStateStartTimeRef.current = null;
              lastBadStatusRef.current = null;
            } else {
              // Non face_ok state (no_face, looking_away, multiple_faces)
              if (badStateStartTimeRef.current === null) {
                badStateStartTimeRef.current = Date.now();
                lastBadStatusRef.current = classification.status;
              } else {
                const elapsed = Date.now() - badStateStartTimeRef.current;
                if (elapsed >= GRACE_PERIOD_MS) {
                  // Confirmed violation after grace period
                  badStateStartTimeRef.current = null;
                  const nextCount = violationCountRef.current + 1;
                  violationCountRef.current = nextCount;
                  setViolationCount(nextCount);

                  const isEyeGaze = classification.gazeDirection &&
                    classification.gazeDirection !== 'head_turned' &&
                    classification.gazeDirection !== 'none' &&
                    classification.gazeDirection !== 'center';

                  const violationType = classification.status === 'no_face'
                    ? 'NO_FACE'
                    : classification.status === 'multiple_faces'
                      ? 'MULTIPLE_FACES'
                      : isEyeGaze
                        ? 'EYE_GAZE_DIVERTED'
                        : 'LOOKING_AWAY';

                  api.submissions.logProctoringEvent({
                    attemptId: attemptIdRef.current,
                    candidateId: currentUser?.id,
                    assessmentId: activeAssessment?.id,
                    type: violationType,
                    timestamp: new Date().toISOString(),
                    details: {
                      reason: classification.reason,
                      message: classification.message,
                      yaw: classification.yaw,
                      pitch: classification.pitch,
                      gazeDirection: classification.gazeDirection || null,
                      gazeScores: classification.gazeScores || null,
                      strikeNumber: nextCount,
                      elapsedMs: elapsed
                    }
                  }).catch(e => console.warn('Failed to log proctoring event:', e));

                  if (nextCount < MAX_ALLOWED_STRIKES) {
                    setIsPausedForWarning(true);
                    setWarningModalData({
                      isOpen: true,
                      violationNumber: nextCount,
                      reason: classification.reason,
                      message: classification.message,
                      isFinal: false
                    });
                  } else {
                    setIsPausedForWarning(true);
                    setWarningModalData({
                      isOpen: true,
                      violationNumber: 3,
                      reason: 'Maximum proctoring violations reached (3 of 3 strikes)',
                      message: 'Assessment auto-submitted due to repeated proctoring violations.',
                      isFinal: true
                    });
                    setTimeout(() => {
                      handleAutoSubmit('proctoring_violations');
                    }, 1500);
                  }
                }
              }
            }
          } catch (detectErr) {
            console.warn('Proctoring detection tick error:', detectErr);
          }
        }, DETECTION_INTERVAL_MS);
      } catch (err) {
        console.warn('FaceLandmarker load error:', err);
      }
    };

    startProctoringLoop();

    return () => {
      isCancelled = true;
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [cameraReady, mediaStream, isPausedForWarning, isSubmitting]);

  // Fullscreen, Keydown & Tab Switch Violation Listeners
  useEffect(() => {
    requestExamFullscreen();

    const checkTimer = setTimeout(() => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        setShowEnterFullscreenModal(true);
      }
    }, 400);

    const handleFullscreenChange = () => {
      const isFS = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );

      if (!isFS && !isSubmittedRef.current && !showEnterFullscreenModal && totalQuestions > 0 && !loadingQuestions) {
        if (fullscreenExitCountRef.current === 0) {
          fullscreenExitCountRef.current = 1;
          setShowFullscreenWarning(true);
          if (addToast) addToast('⚠️ Warning: Fullscreen mode exited! Exiting once more will auto-submit your exam.', 'warning');
        } else {
          if (addToast) addToast('🚨 Exam Auto-Submitted due to repeated fullscreen exit violation!', 'error');
          handleAutoSubmit('fullscreen_violation');
        }
      }
    };

    const handleVisibilityChange = () => {
      if ((document.hidden || document.visibilityState === 'hidden') && !isSubmittedRef.current && totalQuestions > 0 && !loadingQuestions) {
        if (addToast) addToast('🚨 Exam Auto-Submitted due to tab switching violation!', 'error');
        handleAutoSubmit('tab_switch_violation');
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.code === 'Escape') {
        if (!isSubmittedRef.current && totalQuestions > 0 && !loadingQuestions) {
          if (fullscreenExitCountRef.current === 0) {
            fullscreenExitCountRef.current = 1;
            setShowFullscreenWarning(true);
            if (addToast) addToast('⚠️ Warning: Escape pressed / Fullscreen exit detected! Exiting once more will auto-submit your exam.', 'warning');
          } else {
            if (addToast) addToast('🚨 Exam Auto-Submitted due to Escape key violation!', 'error');
            handleAutoSubmit('fullscreen_violation');
          }
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(checkTimer);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Live Timer Countdown (Pauses during camera blocking or proctoring warning modal)
  useEffect(() => {
    if (cameraDenied || isPausedForWarning || isSubmitting) {
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cameraDenied, isPausedForWarning, isSubmitting]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const questions = (activeAssessment?.questions && activeAssessment.questions.length > 0)
    ? activeAssessment.questions
    : questionBank;
  const currentQuestion = questions[currentQuestionIndex] || questions[0];
  const totalQuestions = questions.length;

  const handleSelectOption = (optionId) => {
    setAssessmentAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionId
    }));
  };

  const handleToggleReview = () => {
    if (markedForReview.includes(currentQuestion.id)) {
      setMarkedForReview(prev => prev.filter(id => id !== currentQuestion.id));
    } else {
      setMarkedForReview(prev => [...prev, currentQuestion.id]);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const answeredCount = Object.keys(assessmentAnswers).length;
  const unansweredCount = totalQuestions - answeredCount;
  const reviewCount = markedForReview.length;

  const isMarked = markedForReview.includes(currentQuestion?.id);
  const selectedOption = assessmentAnswers[currentQuestion?.id];

  // Single-Attempt Policy Enforcement
  const isAlreadySubmitted = role !== 'admin' && activeAssessment && (
    isAssessmentCompleted?.(activeAssessment) ||
    (candidateSubmissions || []).some(
      s => String(s.assessment_id || s.assessmentId || '').trim().toLowerCase() === String(activeAssessment.id).trim().toLowerCase() ||
        (activeAssessment.title && String(s.assessment_title || s.assessmentName || '').trim().toLowerCase() === String(activeAssessment.title).trim().toLowerCase())
    ) || activeAssessment?.status === 'Completed'
  );

  if (isAlreadySubmitted) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-800/90 border border-slate-700/80 rounded-3xl p-8 text-center shadow-2xl space-y-6">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <span className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-full text-xs font-bold mb-3 uppercase tracking-wider">
              Single-Attempt Policy Active
            </span>
            <h2 className="text-xl font-extrabold text-white">
              Exam Already Completed
            </h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              You have already completed and submitted your attempt for <strong className="text-white">{activeAssessment?.title || 'this assessment'}</strong>.
            </p>
            <p className="text-[11px] text-amber-300/90 mt-3 bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/40 text-left">
              🔒 <strong>Candidate Retake Policy:</strong> Self-retakes are disabled. Only an administrator can unlock this assessment. If you need a re-examination, please contact your portal administrator.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 pt-2">
            <button
              onClick={() => navigateTo('candidate-analytics')}
              className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2"
            >
              <BarChart2 className="w-4 h-4" />
              <span>View Analysis & Score</span>
            </button>
            <button
              onClick={() => navigateTo('assessments')}
              className="w-full py-2.5 bg-slate-700 hover:bg-slate-650 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-600"
            >
              Return to Assessments
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 pb-16">

      {/* DISTRACTION-FREE TOPBAR */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Title & Assessment Info */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {/* <BrainCircuit className="w-4 h-4" /> */}
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  {activeAssessment?.title || 'Technical Assessment'}
                </h1>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
                  <span>•</span>
                  <span className="font-semibold text-brand-600">{currentQuestion?.category} / {currentQuestion?.topic}</span>
                </div>
              </div>
            </div>

            {/* Live Countdown Timer & Submit Button */}
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono text-sm font-bold shadow-2xs ${timeRemainingSeconds < 300
                ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse'
                : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                <Clock className="w-4 h-4 text-slate-500" />
                <span>{formatTime(timeRemainingSeconds)}</span>
              </div>

              <button
                onClick={() => setShowSubmitModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                Submit Assessment
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      {loadingQuestions || totalQuestions === 0 ? (
        <div className="max-w-xl mx-auto my-20 p-8 bg-white rounded-2xl border border-slate-200/90 shadow-card text-center space-y-4">
          <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-base font-bold text-slate-800">Preparing Assessment Questions...</h2>
          <p className="text-xs text-slate-500">Loading module questions, options, and test environments from the server.</p>
        </div>
      ) : (
        <div className="w-full px-4 sm:px-6 lg:px-8 mt-5 transition-all duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* MAIN QUESTION CARD / CODING WORKSPACE */}
            <div className={`${currentQuestion?.type === 'Coding' ? 'lg:col-span-9' : 'lg:col-span-8'} flex flex-col justify-between space-y-6`}>
              {currentQuestion?.type === 'Coding' ? (
                <CodingWorkspace
                  question={currentQuestion}
                  savedAnswer={assessmentAnswers[currentQuestion?.id]}
                  onSaveAnswer={(ans) => setAssessmentAnswers(prev => ({ ...prev, [currentQuestion?.id]: ans }))}
                  onSubmitAssessment={() => setShowSubmitModal(true)}
                  addToast={addToast}
                />
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 sm:p-8 space-y-6">

                  {/* Question Meta Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 bg-brand-50 text-brand-700 border border-brand-200 rounded-lg text-xs font-bold">
                        Question {currentQuestionIndex + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {currentQuestion?.type || 'Single Choice'}
                      </span>
                      <span className="text-xs text-slate-400">• {currentQuestion?.marks || 4} Marks</span>
                    </div>

                    <button
                      onClick={handleToggleReview}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${isMarked
                        ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                      <Flag className={`w-3.5 h-3.5 ${isMarked ? 'fill-amber-500 text-amber-500' : ''}`} />
                      <span>{isMarked ? 'Marked for Review' : 'Mark for Review'}</span>
                    </button>
                  </div>

                  {/* Question Text */}
                  <div className="space-y-4">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                      {currentQuestion?.question || currentQuestion?.text || currentQuestion?.title}
                    </h2>

                    {/* Code Snippet if applicable */}
                    {currentQuestion?.codeSnippet && (
                      <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900 text-slate-100 my-4 shadow-md font-mono text-xs sm:text-sm">
                        <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800 text-[11px] text-slate-400">
                          <span className="capitalize">{currentQuestion.language || 'javascript'}</span>
                          <button
                            onClick={() => handleCopyCode(currentQuestion.codeSnippet)}
                            className="hover:text-white flex items-center gap-1 transition-colors"
                          >
                            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <pre className="p-4 overflow-x-auto leading-relaxed text-emerald-300">
                          <code>{currentQuestion.codeSnippet}</code>
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Options List */}
                  <div className="space-y-3 pt-2">
                    {currentQuestion?.options?.map((opt, idx) => {
                      const optId = typeof opt === 'object' && opt !== null ? (opt.id || String.fromCharCode(65 + idx)) : String.fromCharCode(65 + idx);
                      const optText = typeof opt === 'object' && opt !== null ? (opt.text || opt.label || String(opt)) : String(opt);
                      const isSelected = selectedOption === optId;

                      return (
                        <div
                          key={optId || idx}
                          onClick={() => handleSelectOption(optId)}
                          className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${isSelected
                            ? 'bg-brand-50/80 border-brand-500 text-brand-950 shadow-xs ring-1 ring-brand-500'
                            : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200/80 text-slate-800'
                            }`}
                        >
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${isSelected
                            ? 'bg-brand-600 text-white'
                            : 'bg-white border border-slate-300 text-slate-600'
                            }`}>
                            {optId}
                          </div>
                          <span className="text-xs sm:text-sm font-medium leading-relaxed pt-0.5">
                            {optText}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                </div>
              )}

              {/* ACTION BAR: Previous, Next, Clear Selection */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-4 flex items-center justify-between">
                <button
                  onClick={handlePrev}
                  disabled={currentQuestionIndex === 0}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {currentQuestion?.type !== 'Coding' ? (
                  <button
                    onClick={() => {
                      setAssessmentAnswers(prev => {
                        const copy = { ...prev };
                        delete copy[currentQuestion.id];
                        return copy;
                      });
                    }}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                  >
                    Clear Selection
                  </button>
                ) : (
                  (() => {
                    const ans = assessmentAnswers[currentQuestion?.id];
                    if (!ans?.code) {
                      return <span className="text-xs font-semibold text-slate-400">Write &amp; Test Code</span>;
                    }
                    return (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Submitted ({ans.passedTests ?? 0}/{ans.totalTests ?? 0} Total)</span>
                        </span>
                        {ans.hiddenTotal !== undefined && (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${(ans.hiddenPassed ?? 0) === (ans.hiddenTotal ?? 0)
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                            <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Hidden: {ans.hiddenPassed ?? 0}/{ans.hiddenTotal ?? 0} Passed</span>
                          </span>
                        )}
                      </div>
                    );
                  })()
                )}

                <button
                  onClick={handleNext}
                  disabled={currentQuestionIndex === totalQuestions - 1}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* RIGHT SIDEBAR: CAMERA PREVIEW & QUESTION PALETTE */}
            <div className={`${currentQuestion?.type === 'Coding' ? 'lg:col-span-3' : 'lg:col-span-4'} space-y-4`}>

              {/* Live Camera & Proctoring Status Widget */}
              {mediaStream && (
                <div className="flex justify-end lg:justify-start">
                  <MediaPreviewWidget
                    stream={mediaStream}
                    videoRef={videoElementRef}
                    proctorState={proctorState}
                    violationCount={violationCount}
                    isDetecting={cameraReady && !isSubmitting && !isPausedForWarning}
                  />
                </div>
              )}

              {/* Question Palette Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Question Navigator</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Click any number to jump directly to the question.</p>
                </div>

                {/* Status Legend */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-emerald-500" />
                    <span>Answered ({answeredCount})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-slate-200" />
                    <span>Unanswered ({unansweredCount})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-amber-400" />
                    <span>Marked ({reviewCount})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded ring-2 ring-brand-500 bg-white" />
                    <span>Current</span>
                  </div>
                </div>

                {/* Question Number Grid */}
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, idx) => {
                    const isAns = !!assessmentAnswers[q.id];
                    const isRev = markedForReview.includes(q.id);
                    const isCur = idx === currentQuestionIndex;
                    const isCodingQ = q.type === 'Coding';

                    let bgClass = 'bg-slate-100 text-slate-700 hover:bg-slate-200';

                    if (isRev) {
                      bgClass = 'bg-amber-400 text-amber-950 font-bold';
                    } else if (isAns) {
                      bgClass = 'bg-emerald-500 text-white font-bold';
                    }

                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`h-10 rounded-xl text-xs font-bold flex items-center justify-center transition-all relative ${bgClass} ${isCur ? 'ring-2 ring-brand-600 ring-offset-2 scale-105' : ''
                          }`}
                        title={isCodingQ ? `Q${idx + 1}: Coding Challenge` : `Q${idx + 1}`}
                      >
                        {isCodingQ && <Code2 className="w-2.5 h-2.5 mr-0.5 opacity-80" />}
                        <span>{idx + 1}</span>
                        {isRev && (
                          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-600 rounded-full ring-1 ring-white" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Summary Metrics */}
                <div className="border-t border-slate-100 pt-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Total Questions:</span>
                    <strong className="text-slate-800">{totalQuestions}</strong>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Total Time:</span>
                    <strong className="text-slate-800">{activeAssessment?.durationMinutes || 10} mins</strong>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Passing Mark:</span>
                    <strong className="text-slate-800">{activeAssessment?.passingScore || 65}%</strong>
                  </div>
                </div>

                {/* Submit CTA */}
                <button
                  onClick={() => setShowSubmitModal(true)}
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting Assessment...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Submit & next section</span>
                    </>
                  )}
                </button>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* SUBMISSION CONFIRMATION MODAL */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => !isSubmitting && setShowSubmitModal(false)}
        title="Confirm Assessment Submission"
        subtitle="Review your responses before finalizing AI evaluation"
      >
        <div className="space-y-5">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Are you sure you want to finish and submit the <strong>{activeAssessment?.title || 'Technical Assessment'}</strong>? Once submitted, your answers will be locked and processed by the AI evaluation engine.
          </p>

          {/* Submission Summary Table */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <div className="p-2 bg-white rounded-lg border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 block">Answered</span>
              <span className="text-lg font-bold text-emerald-600">{answeredCount}</span>
            </div>
            <div className="p-2 bg-white rounded-lg border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 block">Unanswered</span>
              <span className="text-lg font-bold text-slate-700">{unansweredCount}</span>
            </div>
            <div className="p-2 bg-white rounded-lg border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 block">Marked Review</span>
              <span className="text-lg font-bold text-amber-600">{reviewCount}</span>
            </div>
          </div>

          {unansweredCount > 0 && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>You still have {unansweredCount} unanswered questions. You can go back to answer them or submit now.</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setShowSubmitModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 transition-colors"
            >
              Resume Assessment
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Submit</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* FULLSCREEN REQUIRED ENTER MODAL */}
      <Modal
        isOpen={showEnterFullscreenModal}
        onClose={() => { }}
        title="🔒 Full-Screen Exam Environment Required"
        subtitle="Anti-cheating & proctoring controls active"
      >
        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <div className="p-4 bg-brand-50 border border-brand-200 rounded-2xl flex items-start gap-3">
            {/* <BrainCircuit className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" /> */}
            <div>
              <h4 className="font-bold text-brand-900 text-sm">Exam Environment Rules</h4>
              <p className="text-slate-600 mt-1">
                To guarantee test integrity, this exam requires full-screen mode.
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-slate-700 font-semibold">
                <li>Exiting full screen will issue a final warning. Exiting twice auto-submits the test.</li>
                <li>Switching tabs or minimizing the browser will immediately auto-submit the exam.</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={requestExamFullscreen}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Enter Full Screen & Start Exam</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* FULLSCREEN EXIT WARNING MODAL (1ST VIOLATION) */}
      <Modal
        isOpen={showFullscreenWarning}
        onClose={() => { }}
        title="⚠️ WARNING: Fullscreen Mode Exited!"
        subtitle="First proctoring violation warning"
      >
        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5 animate-bounce" />
            <div>
              <h4 className="font-bold text-rose-900 text-sm">Proctoring Violation Warning!</h4>
              <p className="text-rose-700 mt-1 font-medium">
                You exited full-screen mode during an active assessment.
              </p>
              <div className="mt-3 p-3 bg-white/80 border border-rose-200 rounded-xl font-bold text-rose-800">
                🚨 CRITICAL: Exiting full screen one more time will immediately auto-submit your test and grade your current answers!
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={requestExamFullscreen}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Re-Enter Full Screen & Resume Exam</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* CAMERA ACCESS BLOCKING GATE */}
      {cameraDenied && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-200 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto text-rose-600 shadow-inner">
              <VideoOff className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900">Webcam Access Required</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Continuous face-presence proctoring is strictly required for this assessment to ensure testing integrity. You cannot begin the test without camera access.
              </p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-left text-xs text-amber-800 space-y-1.5 font-medium">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Privacy & Transparency Guarantee:</span>
              </div>
              <p>Face detection is processed 100% locally in your browser using MediaPipe. No webcam video or photos are ever saved or uploaded to the server.</p>
            </div>

            <button
              onClick={requestCamera}
              disabled={isRequestingCamera}
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRequestingCamera ? 'animate-spin' : ''}`} />
              <span>{isRequestingCamera ? 'Requesting Access...' : 'Allow Camera & Start Assessment'}</span>
            </button>
          </div>
        </div>
      )}

      {/* PROCTORING WARNING MODAL (STRIKE 1 OR 2) */}
      <Modal
        isOpen={warningModalData.isOpen && !warningModalData.isFinal}
        onClose={() => { }}
        title={`⚠️ Proctoring Warning: Strike ${warningModalData.violationNumber} of 3`}
        subtitle="Face-presence integrity alert"
      >
        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-700 mt-0.5">
              {warningModalData.reason?.includes('Multiple') ? (
                <Users className="w-5 h-5" />
              ) : warningModalData.reason?.includes('away') || warningModalData.reason?.includes('turn') || warningModalData.reason?.includes('tilt') ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <UserX className="w-5 h-5" />
              )}
            </div>
            <div className="space-y-1.5 flex-1">
              <h4 className="font-bold text-amber-950 text-sm">{warningModalData.reason || 'Proctoring Violation Detected'}</h4>
              <p className="text-amber-800 font-medium">
                {warningModalData.message || 'Please face the camera directly and stay focused on the screen.'}
              </p>
              <div className="mt-2 p-2.5 bg-white/90 rounded-xl border border-amber-200 text-[11px] font-semibold text-amber-900">
                ⏱️ The exam countdown timer is currently paused. Please adjust your posture and face the camera before resuming.
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-bold">
            <span className="text-slate-600">Proctoring Strikes Recorded:</span>
            <span className="px-2.5 py-1 bg-amber-500 text-white rounded-lg shadow-xs">
              Strike {warningModalData.violationNumber} of 3
            </span>
          </div>

          <div className="text-[11px] text-rose-700 font-bold bg-rose-50 p-3 rounded-xl border border-rose-200">
            🚨 Critical: Reaching 3 strikes will immediately auto-submit your assessment.
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                setWarningModalData(prev => ({ ...prev, isOpen: false }));
                setIsPausedForWarning(false);
              }}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>I Understand — Resume Exam</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* PROCTORING 3RD STRIKE AUTO-SUBMIT MODAL */}
      <Modal
        isOpen={warningModalData.isOpen && warningModalData.isFinal}
        onClose={() => { }}
        title="🚨 Exam Auto-Submitted: Maximum Violations Reached"
        subtitle="Assessment terminated due to repeated proctoring strikes"
      >
        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-3.5">
            <AlertCircle className="w-8 h-8 text-rose-600 flex-shrink-0 mt-0.5 animate-bounce" />
            <div className="space-y-1.5">
              <h4 className="font-bold text-rose-950 text-sm">3 of 3 Proctoring Strikes Exceeded</h4>
              <p className="text-rose-800 font-medium">
                Your assessment has been automatically submitted due to repeated face-presence violations.
              </p>
              <p className="text-slate-600 text-[11px] mt-1">
                Your answers recorded up to this point are being evaluated and saved to the proctoring audit log.
              </p>
            </div>
          </div>

          <div className="py-2 flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
            <RefreshCw className="w-4 h-4 animate-spin text-brand-600" />
            <span>Submitting assessment and redirecting...</span>
          </div>
        </div>
      </Modal>

    </div>
  );
};
