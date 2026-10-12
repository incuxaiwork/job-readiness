import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
  X,
  Download,
  Printer,
  Award,
  CheckCircle2,
  Layers,
  BrainCircuit,
  FileCheck,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Copy,
  Check,
  ShieldCheck
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useApp } from '../../context/AppContext';

// --- Vector SVG Circular Score Ring Component ---
const CircularScoreRing = ({ score, size = 80, strokeWidth = 7, strokeColor = '#0f172a' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl font-black text-slate-900 leading-none">{score}%</span>
        <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-500 mt-0.5">Readiness</span>
      </div>
    </div>
  );
};

export const AssessmentReportModal = ({
  isOpen,
  onClose,
  candidate,
  result,
  studentData,
  addToast
}) => {
  const reportRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [zoomScale, setZoomScale] = useState(0.95);
  const [copiedLink, setCopiedLink] = useState(false);
  const [interviewSession, setInterviewSession] = useState(null);
  const [interviewAnalysis, setInterviewAnalysis] = useState(null);

  // Fetch real AI Interview Session & Analysis from database
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    const fetchInterviewData = async () => {
      try {
        const token = localStorage.getItem('rsj_token') || localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const targetUserId = candidate?.id || studentData?.id;
        const queryParam = targetUserId ? `?userId=${encodeURIComponent(targetUserId)}` : '';

        let sid = localStorage.getItem('last_interview_session_id');
        let url = sid
          ? `/api/interview/session/${sid}/analysis`
          : `/api/interview/session/latest/user${queryParam}`;

        let res = await fetch(url, { headers });
        if (!res.ok) {
          res = await fetch(`/api/interview/session/latest/user${queryParam}`, { headers });
        }

        if (res.ok) {
          const data = await res.json();
          const sessionObj = data.session || data.analysis?.session;
          const analysisObj = data.analysis || data.session?.analysis;
          if (isMounted) {
            if (sessionObj) setInterviewSession(sessionObj);
            if (analysisObj) setInterviewAnalysis(analysisObj);
            return;
          }
        }
      } catch (err) {
        console.warn('API interview fetch notice:', err);
      }

      // Fallback from cache
      try {
        const cached = localStorage.getItem('rsj_latest_interview_analysis');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (isMounted) {
            if (parsed?.session) setInterviewSession(parsed.session);
            if (parsed?.analysis) setInterviewAnalysis(parsed.analysis);
          }
        }
      } catch (e) {}
    };

    fetchInterviewData();
    return () => {
      isMounted = false;
    };
  }, [isOpen, candidate, studentData]);

  // Access app context for direct database submissions
  const appContext = useApp();
  const contextSubmissions = appContext?.candidateSubmissions;

  // Candidate Identity Info
  const candidateName = candidate?.name || candidate?.fullName || studentData?.name || 'Candidate Student';
  const candidateEmail = candidate?.email || studentData?.email || 'candidate@university.edu';
  const candidateId = candidate?.id || studentData?.id || 'RSJ-CAND-2026';

  // Report & Assessment Identifiers
  const reportId = useMemo(() => {
    const rawId = String(result?.assessmentId || result?.id || 'ASM').replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
    return `RSJ-${rawId}-${Date.now().toString(36).toUpperCase()}`;
  }, [result]);

  const issueDate = useMemo(() => {
    return result?.completedAt || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }, [result]);

  const assessmentTitle = result?.assessmentName || result?.title || 'National Job Readiness Assessment';

  // 1. Gather all candidate submissions from all available sources
  const candidateSubmissionsList = useMemo(() => {
    const list = Array.isArray(result?.distinctSubs) && result.distinctSubs.length > 0
      ? result.distinctSubs
      : Array.isArray(contextSubmissions) && contextSubmissions.length > 0
        ? contextSubmissions
        : Array.isArray(studentData?.submissions)
          ? studentData.submissions
          : Array.isArray(candidate?.submissions)
            ? candidate.submissions
            : [];

    const map = new Map();
    list.forEach(s => {
      const key = (s.assessment_id || s.assessmentId || s.category || s.assessment_title || s.title || '').toString().toLowerCase().trim();
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, s);
      } else {
        const prev = map.get(key);
        const prevTime = new Date(prev.created_at || 0).getTime();
        const currTime = new Date(s.created_at || 0).getTime();
        if (currTime > prevTime) map.set(key, s);
      }
    });
    return Array.from(map.values());
  }, [result, contextSubmissions, studentData, candidate]);

  // 2. Resolve section data from real database submissions
  const resolveSectionData = (keys, defaultCategoryName) => {
    // Check if result.sectionScores is provided (e.g. from CandidateAnalyticsPage)
    if (result?.sectionScores) {
      for (const k of keys) {
        if (result.sectionScores[k]) {
          const sec = result.sectionScores[k];
          return {
            category: defaultCategoryName,
            key: keys[0],
            candidateScore: Number(sec.pct ?? 0),
            obtainedMarks: Number(sec.obtained ?? 0),
            totalMarks: Number(sec.total ?? 0),
            isSubmitted: Boolean(sec.isSubmitted)
          };
        }
      }
    }

    // Check distinct candidate submissions from database
    const subMatch = candidateSubmissionsList.find(s => {
      const cat = String(s.category || '').toLowerCase().trim();
      const title = String(s.assessment_title || s.assessmentName || s.title || '').toLowerCase().trim();
      return keys.some(k => cat.includes(k) || title.includes(k));
    });

    if (subMatch) {
      const total = Number(subMatch.total_marks ?? subMatch.totalMarks ?? (subMatch.total_questions ?? subMatch.totalQuestions ?? 5));
      const obtained = Number(subMatch.obtained_marks ?? subMatch.obtainedMarks ?? (subMatch.correct_count ?? subMatch.correctCount ?? 0));
      const pct = total > 0 ? Math.round((obtained / total) * 100) : Number(subMatch.score ?? 0);
      return {
        category: defaultCategoryName,
        key: keys[0],
        candidateScore: pct,
        obtainedMarks: obtained,
        totalMarks: total,
        isSubmitted: true
      };
    }

    // Check studentData.categories (from CandidateAnalyticsPage)
    if (studentData?.categories) {
      for (const k of keys) {
        if (studentData.categories[k]) {
          const c = studentData.categories[k];
          return {
            category: defaultCategoryName,
            key: keys[0],
            candidateScore: Number(c.pct ?? 0),
            obtainedMarks: Number(c.score ?? 0),
            totalMarks: Number(c.maxScore ?? 0),
            isSubmitted: Number(c.maxScore ?? 0) > 0
          };
        }
      }
    }

    // Fallback from categoryScores (percentage only)
    const catScores = result?.categoryScores || studentData?.categoryScores || {};
    for (const k of keys) {
      if (catScores[k] != null && Number(catScores[k]) > 0) {
        const val = Number(catScores[k]);
        return {
          category: defaultCategoryName,
          key: keys[0],
          candidateScore: val,
          obtainedMarks: Math.round((val / 100) * 5),
          totalMarks: 5,
          isSubmitted: true
        };
      }
    }

    // Fallback from candidate profile score
    for (const k of keys) {
      const val = candidate?.[`${k}Score`] || candidate?.[`${k}_score`];
      if (typeof val === 'number' && val > 0) {
        return {
          category: defaultCategoryName,
          key: keys[0],
          candidateScore: val,
          obtainedMarks: Math.round((val / 100) * 5),
          totalMarks: 5,
          isSubmitted: true
        };
      }
    }

    return {
      category: defaultCategoryName,
      key: keys[0],
      candidateScore: 0,
      obtainedMarks: 0,
      totalMarks: 0,
      isSubmitted: false
    };
  };

  // Real AI Interview Score directly from PostgreSQL database (0 if silent or null if no session)
  const originalInterviewScore = useMemo(() => {
    const raw = interviewSession?.overallScore ??
                interviewSession?.interviewScore ??
                interviewAnalysis?.overallScore;
    if (raw != null && !isNaN(Number(raw))) {
      return Math.round(Number(raw));
    }
    if (candidate?.interviewScore != null && !isNaN(Number(candidate.interviewScore))) {
      return Math.round(Number(candidate.interviewScore));
    }
    if (result?.interviewScore != null && !isNaN(Number(result.interviewScore))) {
      return Math.round(Number(result.interviewScore));
    }
    return null;
  }, [interviewSession, interviewAnalysis, candidate, result]);

  // Sectional Competency Breakdown - Dynamically built from real database tests
  const sectionalPillars = useMemo(() => {
    const standardTracks = [
      resolveSectionData(['apt', 'quant', 'aptitude'], 'Quantitative Aptitude'),
      resolveSectionData(['reason', 'logic', 'reasoning'], 'Logical Reasoning'),
      resolveSectionData(['tech', 'technical'], 'Technical Knowledge'),
      resolveSectionData(['verb', 'eng', 'verbal'], 'Verbal Ability'),
      resolveSectionData(['code', 'prog', 'coding'], 'Coding & Algorithms')
    ];

    // Filter to tracks that have real submissions or marks in the database
    const submittedTracks = standardTracks.filter(t => t.isSubmitted || t.totalMarks > 0);

    // If candidate has completed a real AI interview session in the database, append it
    if (originalInterviewScore != null) {
      submittedTracks.push({
        category: 'AI Interview Assessment',
        key: 'interview',
        candidateScore: originalInterviewScore,
        obtainedMarks: originalInterviewScore,
        totalMarks: 100,
        isSubmitted: true,
        isInterview: true
      });
    }

    if (submittedTracks.length > 0) {
      return submittedTracks;
    }

    // Fallback to standard 4 core tracks if no submissions yet
    return standardTracks.slice(0, 4);
  }, [candidateSubmissionsList, result, studentData, candidate, originalInterviewScore]);

  // Aggregate Real Marks across submitted tracks
  const aggregateMarks = useMemo(() => {
    if (result?.obtainedMarks != null && result?.totalMarks != null && Number(result.totalMarks) > 0) {
      return {
        obtained: Number(result.obtainedMarks),
        total: Number(result.totalMarks)
      };
    }
    const nonInterviewPillars = sectionalPillars.filter(p => !p.isInterview);
    const totalObt = nonInterviewPillars.reduce((sum, p) => sum + (p.obtainedMarks || 0), 0);
    const totalPos = nonInterviewPillars.reduce((sum, p) => sum + (p.totalMarks || 0), 0);
    return {
      obtained: totalObt,
      total: totalPos > 0 ? totalPos : 20
    };
  }, [result, sectionalPillars]);

  // Composite Readiness Score
  const score = useMemo(() => {
    if (aggregateMarks.total > 0 && aggregateMarks.obtained != null) {
      return Math.round((aggregateMarks.obtained / aggregateMarks.total) * 100);
    }
    if (result?.score != null && Number(result.score) > 0) return Math.round(Number(result.score));
    if (studentData?.overallScore != null && Number(studentData.overallScore) > 0) return Math.round(Number(studentData.overallScore));
    return 0;
  }, [aggregateMarks, result, studentData]);

  // Accuracy and Solved Questions
  const totalQuestions = Number(
    result?.totalQuestions || aggregateMarks.total || 20
  );
  const correctCount = Number(
    result?.correctCount ?? aggregateMarks.obtained ?? Math.round((score / 100) * totalQuestions)
  );
  const incorrectCount = Number(
    result?.incorrectCount ?? Math.max(0, totalQuestions - correctCount)
  );
  const accuracy = Math.round(
    Number(result?.accuracy ?? ((correctCount + incorrectCount > 0) ? Math.round((correctCount / (correctCount + incorrectCount)) * 100) : score))
  );

  // Readiness Tier
  const getReadinessTier = (s) => {
    if (s >= 85) return { tier: 'Highly Job Ready', badgeBg: 'bg-emerald-500', textColor: 'text-emerald-700', pillBg: 'bg-emerald-50 border-emerald-300', hex: '#10b981' };
    if (s >= 70) return { tier: 'Job Ready', badgeBg: 'bg-blue-600', textColor: 'text-blue-700', pillBg: 'bg-blue-50 border-blue-300', hex: '#2563eb' };
    if (s >= 50) return { tier: 'Developing Competency', badgeBg: 'bg-amber-500', textColor: 'text-amber-700', pillBg: 'bg-amber-50 border-amber-300', hex: '#f59e0b' };
    return { tier: 'Needs Foundational Training', badgeBg: 'bg-rose-500', textColor: 'text-rose-700', pillBg: 'bg-rose-50 border-rose-300', hex: '#f43f5e' };
  };

  const readiness = getReadinessTier(score);

  // Copy Verification Link Handler
  const handleCopyLink = () => {
    const url = `https://readysetjob.com/verify/${reportId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      if (addToast) addToast('Official verification link copied to clipboard!', 'success');
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  // High-Resolution PDF Download
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    try {
      setIsGenerating(true);
      setGenerationProgress(20);
      if (addToast) addToast('Preparing assessment report PDF...', 'info');

      const previousZoom = zoomScale;
      setZoomScale(1.0); // Reset zoom transform so html2canvas captures unscaled, crisp layout

      await new Promise(res => setTimeout(res, 250));

      const pageEl = reportRef.current.querySelector('.pdf-page');
      if (!pageEl) {
        throw new Error('No printable report page found in document viewer.');
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = 210;
      const pdfHeight = 297;

      setGenerationProgress(50);
      const canvas = await html2canvas(pageEl, {
        scale: 2.0,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

      setGenerationProgress(100);
      const safeName = (candidateName || 'Candidate').replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`incuxAi_JobRecipe_Report_${safeName}_${reportId}.pdf`);

      if (addToast) addToast('Assessment Report downloaded successfully!', 'success');
      setZoomScale(previousZoom);
    } catch (err) {
      console.error('PDF generation error:', err);
      if (addToast) addToast('Failed to generate PDF. You can also use the Print button to Save as PDF.', 'error');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  // Direct Browser Native Print
  const handlePrint = () => {
    const previousZoom = zoomScale;
    setZoomScale(1.0);
    setTimeout(() => {
      window.print();
      setZoomScale(previousZoom);
    }, 150);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-700/80 overflow-hidden flex flex-col my-3 print:my-0 print:border-none print:shadow-none print:max-w-none print:bg-white">
        
        {/* ========================================================================= */}
        {/* TOP CONTROLS TOOLBAR (Hidden in Print) */}
        {/* ========================================================================= */}
        <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 text-white flex flex-wrap items-center justify-between gap-3 print:hidden">
          
          {/* Title & Document Badge */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-md">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black tracking-tight text-white">Official Assessment Credential</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-extrabold">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse" />
                  Verified
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Executive Job Readiness Report • {reportId}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-slate-900 rounded-xl border border-slate-800 p-0.5 text-xs text-slate-300">
              <button
                onClick={() => setZoomScale(z => Math.max(0.65, +(z - 0.1).toFixed(2)))}
                className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono text-[11px] font-bold text-slate-400">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                onClick={() => setZoomScale(z => Math.min(1.25, +(z + 0.1).toFixed(2)))}
                className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomScale(0.95)}
                className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-0.5 border-l border-slate-800"
                title="Reset Zoom"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Share Link */}
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{copiedLink ? 'Copied' : 'Share Link'}</span>
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            {/* Download PDF */}
            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGenerating ? `Rendering (${generationProgress}%)...` : 'Download PDF'}</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors ml-1"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DOCUMENT VIEWER: Single Structured A4 Page */}
        {/* ========================================================================= */}
        <div className="p-3 sm:p-6 overflow-y-auto max-h-[85vh] print:max-h-none print:p-0 bg-slate-950/70 print:bg-white flex justify-center">
          <div
            ref={reportRef}
            className="space-y-6 print:space-y-0 transition-transform duration-150 ease-out flex flex-col items-center"
            style={{
              transform: `scale(${zoomScale})`,
              transformOrigin: 'top center',
              width: '794px'
            }}
          >
            
            <div
              className="pdf-page bg-white rounded-2xl border border-slate-300 shadow-xl font-sans text-slate-900 print:shadow-none print:border-none"
              style={{
                width: '794px',
                minHeight: '1123px',
                padding: '36px 40px',
                boxSizing: 'border-box',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Header & Verification Bar */}
              <div className="space-y-3 shrink-0 pb-4 border-b-2 border-slate-200">
                <div className="py-1">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    incuxAi Job Recipe - Job Readiness Asessment
                  </h1>
                </div>

                {/* Candidate & Assessment Meta Strip */}
                <div className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Candidate</span>
                    <strong className="text-sm font-black text-slate-900">{candidateName}</strong>
                    <span className="text-slate-600 text-[10px] block">{candidateEmail}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Assessment</span>
                    <strong className="text-xs font-bold text-slate-900">{assessmentTitle}</strong>
                    <span className="text-slate-600 text-[10px] block">Candidate ID: {candidateId}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Issue Date & Report ID</span>
                    <strong className="text-xs font-mono text-slate-900">{reportId}</strong>
                    <span className="text-slate-600 text-[10px] block">{issueDate}</span>
                  </div>
                </div>
              </div>

              {/* Executive Job Readiness Scorecard & Core KPIs */}
              <div className="space-y-3 mt-6">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-slate-900" />
                    Executive Performance & Key Indicators
                  </h3>
                  <span className="text-[10px] text-slate-500 font-bold">Standardized Benchmark: 65%</span>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {/* Radial Score Gauge Card */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-300 flex items-center justify-center gap-3 shadow-2xs">
                    <CircularScoreRing score={score} size={62} strokeWidth={5.5} strokeColor="#0f172a" />
                    <div className="space-y-0.5 text-left">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Job Readiness</span>
                      <span className="text-xs font-black text-slate-900 block leading-tight">
                        {score >= 70 ? 'Qualified' : 'In Training'}
                      </span>
                      <span className="text-[10px] font-extrabold text-slate-800 block leading-tight">
                        {aggregateMarks.obtained} / {aggregateMarks.total} Marks
                      </span>
                    </div>
                  </div>

                  {/* Real Original AI Interview Score Card */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-300 text-center flex flex-col justify-center shadow-2xs">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block leading-tight">AI Interview Score</span>
                    <span className="text-2xl font-black text-slate-900 my-0.5 leading-none">
                      {originalInterviewScore != null ? `${originalInterviewScore}%` : 'Not Attempted'}
                    </span>
                    <span className="text-[9px] font-semibold text-slate-500">
                      {originalInterviewScore != null ? 'Database Verified' : 'No Session'}
                    </span>
                  </div>

                  {/* Accuracy Card */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-300 text-center flex flex-col justify-center shadow-2xs">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Accuracy</span>
                    <span className="text-2xl font-black text-slate-900 my-0.5 leading-none">{accuracy}%</span>
                    <span className="text-[9px] font-semibold text-slate-500">Precision</span>
                  </div>

                  {/* Solved Questions */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-300 text-center flex flex-col justify-center shadow-2xs">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Solved Qs</span>
                    <span className="text-2xl font-black text-slate-900 my-0.5 leading-none">
                      {correctCount} <span className="text-xs text-slate-500 font-bold">/ {totalQuestions}</span>
                    </span>
                    <span className="text-[9px] font-semibold text-slate-500">{incorrectCount} Incorrect</span>
                  </div>
                </div>
              </div>

              {/* Competency Breakdown Table */}
              <div className="space-y-3 mt-6">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-slate-900" />
                    Competency Matrix
                  </h3>
                  <span className="text-[10px] text-slate-500 font-semibold">Evaluation Domain Performance</span>
                </div>

                <div className="overflow-hidden border border-slate-300 rounded-2xl bg-white shadow-2xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">Evaluation Domain Track</th>
                        <th className="py-3 px-4 text-right">Candidate Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {sectionalPillars.map((p) => (
                        <tr key={p.key} className="hover:bg-slate-50">
                          <td className="py-3.5 px-4">
                            <span className="font-extrabold text-slate-900 block leading-tight text-xs">{p.category}</span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="font-black text-sm text-slate-900">{p.candidateScore}%</span>
                            <span className="text-[10px] font-bold text-slate-500 block leading-tight">
                              {p.isInterview ? 'Database Verified' : `${p.obtainedMarks} / ${p.totalMarks} Marks`}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Page Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 mt-auto shrink-0">
                <span className="font-medium">incuxAi Job Recipe • Document #{reportId}</span>
                <span className="font-bold text-slate-900">Job Readiness Asessment</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
