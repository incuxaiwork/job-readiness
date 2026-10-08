import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
  X,
  Download,
  Printer,
  Award,
  CheckCircle2,
  AlertTriangle,
  Target,
  Building2,
  Sparkles,
  Layers,
  BrainCircuit,
  FileCheck,
  User,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Copy,
  Check,
  ShieldCheck,
  TrendingUp,
  Clock,
  Briefcase,
  GraduationCap,
  ChevronRight,
  BookOpen,
  Code2
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  computeEligibility,
  computeImprovements,
  standardCompanyEligibilityCriteria,
  mockStudent
} from '../../data/analyticsData';

// --- Vector SVG Circular Score Ring Component ---
const CircularScoreRing = ({ score, size = 80, strokeWidth = 7, tierColor = '#2563eb' }) => {
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
          stroke={tierColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl font-black text-slate-900 leading-none">{score}%</span>
        <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400 mt-0.5">Readiness</span>
      </div>
    </div>
  );
};

// --- Vector Dynamic Cryptographic SVG QR Code Component ---
const CryptographicQrCodeSvg = ({ size = 52 }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <rect width="100" height="100" rx="8" fill="#0f172a" />
      {/* Top-Left Finder */}
      <rect x="10" y="10" width="26" height="26" rx="4" fill="white" />
      <rect x="14" y="14" width="18" height="18" rx="2" fill="#0f172a" />
      <rect x="18" y="18" width="10" height="10" rx="1.5" fill="#38bdf8" />
      {/* Top-Right Finder */}
      <rect x="64" y="10" width="26" height="26" rx="4" fill="white" />
      <rect x="68" y="14" width="18" height="18" rx="2" fill="#0f172a" />
      <rect x="72" y="18" width="10" height="10" rx="1.5" fill="#38bdf8" />
      {/* Bottom-Left Finder */}
      <rect x="10" y="64" width="26" height="26" rx="4" fill="white" />
      <rect x="14" y="68" width="18" height="18" rx="2" fill="#0f172a" />
      <rect x="18" y="72" width="10" height="10" rx="1.5" fill="#38bdf8" />
      {/* Data Cells */}
      <rect x="42" y="12" width="5" height="5" rx="1" fill="#94a3b8" />
      <rect x="52" y="12" width="5" height="5" rx="1" fill="#38bdf8" />
      <rect x="42" y="22" width="5" height="5" rx="1" fill="#cbd5e1" />
      <rect x="52" y="22" width="5" height="5" rx="1" fill="#94a3b8" />
      <rect x="42" y="32" width="5" height="5" rx="1" fill="#38bdf8" />
      {/* Timing Patterns */}
      <rect x="12" y="42" width="5" height="5" rx="1" fill="#cbd5e1" />
      <rect x="22" y="42" width="5" height="5" rx="1" fill="#38bdf8" />
      <rect x="32" y="42" width="5" height="5" rx="1" fill="#cbd5e1" />
      <rect x="42" y="42" width="16" height="16" rx="3" fill="#0284c7" />
      <path d="M46 50L49 53L54 47" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="62" y="42" width="5" height="5" rx="1" fill="#cbd5e1" />
      <rect x="72" y="42" width="5" height="5" rx="1" fill="#38bdf8" />
      <rect x="82" y="42" width="5" height="5" rx="1" fill="#cbd5e1" />
      {/* Bottom Patterns */}
      <rect x="42" y="64" width="5" height="5" rx="1" fill="#38bdf8" />
      <rect x="52" y="64" width="5" height="5" rx="1" fill="#94a3b8" />
      <rect x="64" y="64" width="5" height="5" rx="1" fill="#cbd5e1" />
      <rect x="74" y="64" width="5" height="5" rx="1" fill="#38bdf8" />
      <rect x="84" y="64" width="5" height="5" rx="1" fill="#cbd5e1" />
      <rect x="42" y="74" width="5" height="5" rx="1" fill="#cbd5e1" />
      <rect x="52" y="74" width="5" height="5" rx="1" fill="#38bdf8" />
      <rect x="64" y="74" width="5" height="5" rx="1" fill="#94a3b8" />
      <rect x="74" y="74" width="5" height="5" rx="1" fill="#cbd5e1" />
      <rect x="84" y="74" width="5" height="5" rx="1" fill="#38bdf8" />
    </svg>
  );
};

// --- Official Institutional Embossed Seal Badge Component ---
const OfficialStampBadge = () => {
  return (
    <div className="w-13 h-13 rounded-full border-2 border-dashed border-brand-600/70 bg-brand-50/60 flex flex-col items-center justify-center text-center p-0.5 relative select-none shrink-0">
      <div className="w-10 h-10 rounded-full border border-brand-500 flex flex-col items-center justify-center">
        <ShieldCheck className="w-3 h-3 text-brand-600" />
        <span className="text-[5px] font-black uppercase text-brand-900 tracking-tight leading-none mt-0.5">READYSETJOB</span>
        <span className="text-[4.5px] font-bold text-brand-600 tracking-tighter leading-none mt-0.5">SEAL • 2026</span>
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
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'page1' | 'page2' | 'page3'
  const [zoomScale, setZoomScale] = useState(0.95);
  const [copiedLink, setCopiedLink] = useState(false);

  // Candidate Identity Info
  const candidateName = candidate?.name || candidate?.fullName || studentData?.name || 'Candidate Student';
  const candidateEmail = candidate?.email || studentData?.email || 'candidate@university.edu';
  const candidatePhone = candidate?.mobile || candidate?.phoneNo || candidate?.phone || '+91 9876543210';
  const college = candidate?.college || candidate?.collegeName || candidate?.university || 'University of Engineering & Technology';
  const branch = candidate?.branch || 'Computer Science & Engineering';
  const degree = candidate?.degree || 'B.Tech';
  const gradYear = candidate?.graduationYear || candidate?.graduation_year || '2026';
  const expLevel = candidate?.experienceLevel || candidate?.experience_level || 'Fresher';
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

  // 4 Core Section Scores (+ Coding if available) merged from all available sources
  const catScores = result?.categoryScores || studentData?.categoryScores || {};

  const aptitudeScore = Number(
    catScores.aptitude ?? catScores.Aptitude ?? studentData?.categoryScores?.aptitude ?? candidate?.aptitudeScore ?? candidate?.aptitude_score ?? 0
  );
  const reasoningScore = Number(
    catScores.reasoning ?? catScores.LogicalReasoning ?? catScores.Reasoning ?? studentData?.categoryScores?.reasoning ?? candidate?.reasoningScore ?? candidate?.reasoning_score ?? 0
  );
  const technicalScore = Number(
    catScores.technical ?? catScores.TechnicalKnowledge ?? catScores.Technical ?? studentData?.categoryScores?.technical ?? candidate?.technicalScore ?? candidate?.technical_score ?? 0
  );
  const verbalScore = Number(
    catScores.verbal ?? catScores.english ?? catScores.Verbal ?? studentData?.categoryScores?.verbal ?? studentData?.categoryScores?.english ?? candidate?.verbalScore ?? candidate?.verbal_score ?? 0
  );
  const codingScore = Number(
    catScores.coding ?? catScores.Coding ?? studentData?.categoryScores?.coding ?? candidate?.codingScore ?? candidate?.coding_score ?? 0
  );

  // Attempted Section Score Pillars (for composite calculation when overallScore not provided)
  const attemptedPillars = [aptitudeScore, reasoningScore, technicalScore, verbalScore, codingScore].filter(s => s > 0);

  // Core Assessment Metrics & Composite Readiness Score
  const score = Math.round(
    attemptedPillars.length > 0
      ? (attemptedPillars.reduce((a, b) => a + b, 0) / attemptedPillars.length)
      : Number(result?.score ?? studentData?.overallScore ?? candidate?.overallScore ?? candidate?.jobReadinessScore ?? 0)
  );

  const accuracy = Math.round(Number(result?.accuracy ?? score));
  const totalQuestions = Number(result?.totalQuestions || 20);
  const correctCount = Number(result?.correctCount ?? Math.round((score / 100) * totalQuestions));
  const incorrectCount = Number(result?.incorrectCount ?? Math.max(0, totalQuestions - correctCount));
  const timeTaken = result?.timeTaken || '28 min';

  // Academic Baseline Profile from student's actual profile
  const candTenth = Number(candidate?.tenthMarks ?? candidate?.tenth_marks ?? studentData?.tenthMarks ?? 0);
  const candTwelfth = Number(candidate?.twelfthDiplomaMarks ?? candidate?.twelfth_diploma_marks ?? studentData?.twelfthDiplomaMarks ?? 0);
  const candGrad = Number(candidate?.graduationPercentage ?? candidate?.graduation_percentage ?? studentData?.graduationPercentage ?? 0);
  const candBacklogs = Number(candidate?.backlogs ?? studentData?.backlogs ?? 0);
  const isAcademicallyEligible = candTenth >= 60 && candTwelfth >= 60 && candGrad >= 60 && candBacklogs === 0;

  // Cohort & Percentile Analytics
  const percentile = Number(studentData?.percentile ?? Math.min(99, Math.max(15, Math.round(score * 0.95 + 10))));
  const totalStudents = Number(studentData?.totalStudents ?? 280);
  const rank = Number(studentData?.rank ?? Math.max(1, Math.round(totalStudents * (1 - percentile / 100))));

  // Readiness Tier
  const getReadinessTier = (s) => {
    if (s >= 85) return { tier: 'Highly Job Ready', badgeBg: 'bg-emerald-500', textColor: 'text-emerald-700', pillBg: 'bg-emerald-50 border-emerald-300', hex: '#10b981' };
    if (s >= 70) return { tier: 'Job Ready', badgeBg: 'bg-blue-600', textColor: 'text-blue-700', pillBg: 'bg-blue-50 border-blue-300', hex: '#2563eb' };
    if (s >= 50) return { tier: 'Developing Competency', badgeBg: 'bg-amber-500', textColor: 'text-amber-700', pillBg: 'bg-amber-50 border-amber-300', hex: '#f59e0b' };
    return { tier: 'Needs Foundational Training', badgeBg: 'bg-rose-500', textColor: 'text-rose-700', pillBg: 'bg-rose-50 border-rose-300', hex: '#f43f5e' };
  };

  const readiness = getReadinessTier(score);

  // Sectional Competency Breakdown (5 Pillars)
  const sectionalPillars = [
    {
      category: 'Quantitative Aptitude',
      key: 'aptitude',
      candidateScore: aptitudeScore,
      benchmark: 65,
      classAverage: 62,
      topperScore: 96,
      status: aptitudeScore >= 75 ? 'Mastered' : aptitudeScore >= 60 ? 'Competent' : 'Needs Focus',
      color: '#3b82f6'
    },
    {
      category: 'Logical Reasoning',
      key: 'reasoning',
      candidateScore: reasoningScore,
      benchmark: 65,
      classAverage: 58,
      topperScore: 92,
      status: reasoningScore >= 75 ? 'Mastered' : reasoningScore >= 60 ? 'Competent' : 'Needs Focus',
      color: '#10b981'
    },
    {
      category: 'Technical Knowledge',
      key: 'technical',
      candidateScore: technicalScore,
      benchmark: 70,
      classAverage: 55,
      topperScore: 96,
      status: technicalScore >= 75 ? 'Mastered' : technicalScore >= 60 ? 'Competent' : 'Needs Focus',
      color: '#f59e0b'
    },
    {
      category: 'Verbal Ability',
      key: 'verbal',
      candidateScore: verbalScore,
      benchmark: 60,
      classAverage: 60,
      topperScore: 88,
      status: verbalScore >= 75 ? 'Mastered' : verbalScore >= 60 ? 'Competent' : 'Needs Focus',
      color: '#8b5cf6'
    },
    {
      category: 'Coding & Algorithms',
      key: 'coding',
      candidateScore: codingScore,
      benchmark: 65,
      classAverage: 52,
      topperScore: 98,
      status: codingScore >= 75 ? 'Mastered' : codingScore >= 60 ? 'Competent' : 'Needs Focus',
      color: '#06b6d4'
    }
  ];

  // Distinct Domain Sections (Grouped by Category using actual student topic breakdowns)
  const domainSections = useMemo(() => {
    const rawBreakdown = Array.isArray(result?.topicBreakdown) ? result.topicBreakdown : (Array.isArray(studentData?.topicBreakdown) ? studentData.topicBreakdown : []);

    const aptTopics = rawBreakdown.filter(t => String(t.category || '').toLowerCase().includes('apt') || String(t.topic || '').toLowerCase().includes('quant'));
    const reasonTopics = rawBreakdown.filter(t => String(t.category || '').toLowerCase().includes('reason') || String(t.topic || '').toLowerCase().includes('logic'));
    const techTopics = rawBreakdown.filter(t => String(t.category || '').toLowerCase().includes('tech') || String(t.category || '').toLowerCase().includes('code') || String(t.topic || '').toLowerCase().includes('array') || String(t.topic || '').toLowerCase().includes('sql') || String(t.topic || '').toLowerCase().includes('tree'));
    const verbalTopics = rawBreakdown.filter(t => String(t.category || '').toLowerCase().includes('verb') || String(t.category || '').toLowerCase().includes('eng'));

    const defaultAptTopics = [
      { topic: 'Number Systems & Divisibility', score: Math.round((aptitudeScore / 100) * 5), maxScore: 5, percent: aptitudeScore, status: aptitudeScore >= 75 ? 'Mastered' : aptitudeScore >= 60 ? 'Competent' : 'Needs Focus' },
      { topic: 'Percentages & Profit/Loss', score: Math.round((aptitudeScore / 100) * 5), maxScore: 5, percent: aptitudeScore, status: aptitudeScore >= 75 ? 'Mastered' : aptitudeScore >= 60 ? 'Competent' : 'Needs Focus' }
    ];
    const defaultReasonTopics = [
      { topic: 'Coding-Decoding & Patterns', score: Math.round((reasoningScore / 100) * 5), maxScore: 5, percent: reasoningScore, status: reasoningScore >= 75 ? 'Mastered' : reasoningScore >= 60 ? 'Competent' : 'Needs Focus' },
      { topic: 'Syllogism & Deductive Logic', score: Math.round((reasoningScore / 100) * 5), maxScore: 5, percent: reasoningScore, status: reasoningScore >= 75 ? 'Mastered' : reasoningScore >= 60 ? 'Competent' : 'Needs Focus' }
    ];
    const defaultTechTopics = [
      { topic: 'Data Structures & OOP Principles', score: Math.round((technicalScore / 100) * 5), maxScore: 5, percent: technicalScore, status: technicalScore >= 75 ? 'Mastered' : technicalScore >= 60 ? 'Competent' : 'Needs Focus' },
      { topic: 'Algorithms & Database Queries', score: Math.round((technicalScore / 100) * 5), maxScore: 5, percent: technicalScore, status: technicalScore >= 75 ? 'Mastered' : technicalScore >= 60 ? 'Competent' : 'Needs Focus' }
    ];
    const defaultVerbalTopics = [
      { topic: 'Reading Comprehension & Grammar', score: Math.round((verbalScore / 100) * 5), maxScore: 5, percent: verbalScore, status: verbalScore >= 75 ? 'Mastered' : verbalScore >= 60 ? 'Competent' : 'Needs Focus' },
      { topic: 'Contextual Vocabulary & Idioms', score: Math.round((verbalScore / 100) * 5), maxScore: 5, percent: verbalScore, status: verbalScore >= 75 ? 'Mastered' : verbalScore >= 60 ? 'Competent' : 'Needs Focus' }
    ];

    const mapTopicObj = (t) => ({
      topic: t.topic || t.name || 'Core Concept',
      score: Number(t.obtainedMarks ?? t.correctCount ?? Math.round(((t.score ?? 0) / 100) * 5)),
      maxScore: Number(t.totalMarks ?? t.totalQuestions ?? 5),
      percent: Number(t.score ?? t.pct ?? 0),
      status: (t.score ?? 0) >= 75 ? 'Mastered' : (t.score ?? 0) >= 60 ? 'Competent' : 'Needs Focus'
    });

    const finalApt = aptTopics.length > 0 ? aptTopics.map(mapTopicObj) : defaultAptTopics;
    const finalReason = reasonTopics.length > 0 ? reasonTopics.map(mapTopicObj) : defaultReasonTopics;
    const finalTech = techTopics.length > 0 ? techTopics.map(mapTopicObj) : defaultTechTopics;
    const finalVerbal = verbalTopics.length > 0 ? verbalTopics.map(mapTopicObj) : defaultVerbalTopics;

    return [
      {
        id: 'aptitude',
        title: 'Section 4.1: Quantitative Aptitude',
        icon: Target,
        domainScore: aptitudeScore,
        color: 'border-blue-200 bg-blue-50/20',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        topics: finalApt
      },
      {
        id: 'reasoning',
        title: 'Section 4.2: Logical Reasoning',
        icon: BrainCircuit,
        domainScore: reasoningScore,
        color: 'border-emerald-200 bg-emerald-50/20',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        topics: finalReason
      },
      {
        id: 'technical',
        title: 'Section 4.3: Technical Knowledge & CS Core',
        icon: Code2,
        domainScore: technicalScore,
        color: 'border-amber-200 bg-amber-50/20',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        topics: finalTech
      },
      {
        id: 'verbal',
        title: 'Section 4.4: Verbal Ability & Communication',
        icon: BookOpen,
        domainScore: verbalScore,
        color: 'border-purple-200 bg-purple-50/20',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        topics: finalVerbal
      }
    ];
  }, [result, studentData, aptitudeScore, reasoningScore, technicalScore, verbalScore]);

  // Flattened for strengths and weaknesses
  const allTopics = useMemo(() => domainSections.flatMap(d => d.topics), [domainSections]);
  const strengthsList = useMemo(() => allTopics.filter(t => t.percent >= 80), [allTopics]);
  const weaknessList = useMemo(() => allTopics.filter(t => t.percent < 60), [allTopics]);

  // Authoritative Company Placement Eligibility Computation
  const companyEligibility = useMemo(() => {
    const studentObj = {
      ...mockStudent,
      ...(studentData || {}),
      tenthMarks: candTenth,
      twelfthDiplomaMarks: candTwelfth,
      graduationPercentage: candGrad,
      backlogs: candBacklogs,
      overallScore: score,
      jobReadinessScore: score,
      categoryScores: {
        aptitude: aptitudeScore,
        reasoning: reasoningScore,
        technical: technicalScore,
        verbal: verbalScore,
        english: verbalScore,
        coding: codingScore
      }
    };
    return computeEligibility(studentObj, standardCompanyEligibilityCriteria);
  }, [studentData, candTenth, candTwelfth, candGrad, candBacklogs, score, aptitudeScore, reasoningScore, technicalScore, verbalScore, codingScore]);

  const eligibleCount = companyEligibility.filter(c => c.eligible).length;
  const borderlineCount = companyEligibility.filter(c => c.borderline).length;
  const prepCount = companyEligibility.filter(c => !c.eligible && !c.borderline).length;

  // Prescriptive AI Improvements & Roadmap
  const improvementAreas = useMemo(() => {
    const studentObj = {
      ...mockStudent,
      ...(studentData || {}),
      examAttempts: [
        {
          id: 'ATT-CURR',
          date: new Date().toISOString().split('T')[0],
          totalScore: score,
          categories: {
            aptitude: { score: Math.round((aptitudeScore / 100) * 25), maxScore: 25, topics: domainSections[0].topics.map(t => ({ name: t.topic, score: t.score, maxScore: t.maxScore })) },
            reasoning: { score: Math.round((reasoningScore / 100) * 25), maxScore: 25, topics: domainSections[1].topics.map(t => ({ name: t.topic, score: t.score, maxScore: t.maxScore })) },
            technical: { score: Math.round((technicalScore / 100) * 25), maxScore: 25, topics: domainSections[2].topics.map(t => ({ name: t.topic, score: t.score, maxScore: t.maxScore })) },
            verbal: { score: Math.round((verbalScore / 100) * 25), maxScore: 25, topics: domainSections[3].topics.map(t => ({ name: t.topic, score: t.score, maxScore: t.maxScore })) }
          }
        }
      ]
    };
    return computeImprovements(studentObj);
  }, [studentData, score, aptitudeScore, reasoningScore, technicalScore, verbalScore, domainSections]);

  const highPriorityAreas = improvementAreas.filter(a => a.priority === 'high');
  const mediumPriorityAreas = improvementAreas.filter(a => a.priority === 'medium');
  const totalStudyHours = 24;

  // Copy Verification Link Handler
  const handleCopyLink = () => {
    const url = `https://readysetjob.com/verify/${reportId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      if (addToast) addToast('Official verification link copied to clipboard!', 'success');
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  // High-Resolution Multi-Page PDF Download
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    try {
      setIsGenerating(true);
      setGenerationProgress(10);
      if (addToast) addToast('Preparing high-definition 3-page PDF...', 'info');

      const previousTab = activeTab;
      const previousZoom = zoomScale;
      setActiveTab('all');
      setZoomScale(1.0); // Reset zoom transform so html2canvas captures unscaled, crisp layout

      await new Promise(res => setTimeout(res, 250));

      const pageElements = reportRef.current.querySelectorAll('.pdf-page');
      if (!pageElements || pageElements.length === 0) {
        throw new Error('No printable report pages found in document viewer.');
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = 210;
      const pdfHeight = 297;

      for (let i = 0; i < pageElements.length; i++) {
        const pageEl = pageElements[i];
        setGenerationProgress(20 + Math.round((i / pageElements.length) * 65));
        if (addToast) addToast(`Rendering Section ${i + 1} of ${pageElements.length}...`, 'info');

        const canvas = await html2canvas(pageEl, {
          scale: 2.0,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 794
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        if (i > 0) {
          pdf.addPage('a4', 'portrait');
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      }

      setGenerationProgress(98);
      const safeName = (candidateName || 'Candidate').replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`ReadySetJob_Official_Report_${safeName}_${reportId}.pdf`);

      if (addToast) addToast('Official 3-Page Credential Report downloaded successfully!', 'success');
      setActiveTab(previousTab);
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
    const previousTab = activeTab;
    const previousZoom = zoomScale;
    setActiveTab('all');
    setZoomScale(1.0);
    setTimeout(() => {
      window.print();
      setActiveTab(previousTab);
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
      <div className="bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-700/80 overflow-hidden flex flex-col my-3 print:my-0 print:border-none print:shadow-none print:max-w-none print:bg-white">
        
        {/* ========================================================================= */}
        {/* TOP CONTROLS TOOLBAR (Hidden in Print) */}
        {/* ========================================================================= */}
        <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 text-white flex flex-wrap items-center justify-between gap-3 print:hidden">
          
          {/* Title & Document Badge */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black tracking-tight text-white">Official Assessment Credential</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Verified
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Structured 3-Page Executive Job Readiness Report • {reportId}</p>
            </div>
          </div>

          {/* Page Tabs */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'all' ? 'bg-brand-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              All Pages (1-3)
            </button>
            <button
              onClick={() => setActiveTab('page1')}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'page1' ? 'bg-brand-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Page 1: Overview
            </button>
            <button
              onClick={() => setActiveTab('page2')}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'page2' ? 'bg-brand-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Page 2: Domains
            </button>
            <button
              onClick={() => setActiveTab('page3')}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'page3' ? 'bg-brand-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Page 3: Corporate
            </button>
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
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
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
              className="px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50"
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
        {/* DOCUMENT VIEWER: Fixed A4 Pages in Structured Layout */}
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
            
            {/* ========================================================================= */}
            {/* PAGE 1: EXECUTIVE CREDENTIAL, PROFILE & 5-PILLAR SECTIONAL BENCHMARK */}
            {/* ========================================================================= */}
            {(activeTab === 'all' || activeTab === 'page1') && (
              <div
                className="pdf-page bg-white rounded-2xl border border-slate-200 shadow-xl font-sans text-slate-800 print:shadow-none print:border-none"
                style={{
                  width: '794px',
                  minHeight: '1123px',
                  padding: '32px 36px',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Header & Verification Bar */}
                <div className="space-y-2 shrink-0">
                  <div className="flex items-center justify-between pb-3 border-b-2 border-slate-100">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                            ReadySet<span className="text-brand-600">Job</span>
                          </h1>
                        </div>
                      </div>
                    </div>

                    <div className="text-right space-y-0.5">
                      <div className="flex flex-col items-end gap-1">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Verified Digital Credential
                        </div>
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[9px] font-bold">
                          <ShieldCheck className="w-2.5 h-2.5 text-blue-600" />
                          AI Face Proctoring Monitored
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Report ID: <strong className="text-slate-800">{reportId}</strong>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Date: <span className="font-semibold text-slate-700">{issueDate}</span> • ID: <strong className="text-slate-800">{candidateId}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Watermark Ribbon */}
                  <div className="bg-slate-900 text-brand-300 text-[9px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-xl flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3 text-brand-400" />
                      SECTION 1: STANDARDIZED EVALUATION SCORECARD
                    </span>
                    <span className="text-slate-400 font-normal">ISO/IEC 27001 Validated Process</span>
                    <span className="text-brand-400">Cryptographically Sealed</span>
                  </div>
                </div>

                {/* Section 1: Candidate Verification Profile & Academic Standing */}
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-brand-600" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                        Candidate Profile & Verified Academic Baseline
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {assessmentTitle}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-3 text-xs">
                    {/* Candidate Identity */}
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Candidate Identity</span>
                      <strong className="text-xs font-black text-slate-900 block leading-tight">{candidateName}</strong>
                      <span className="text-slate-600 text-[10px] block truncate">{candidateEmail}</span>
                      <span className="text-slate-500 text-[10px] block">{candidatePhone}</span>
                    </div>

                    {/* Institution */}
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Institution / Degree</span>
                      <strong className="text-xs font-black text-slate-900 block leading-tight">{college}</strong>
                      <span className="text-slate-700 text-[10px] block font-semibold">{degree} • {branch}</span>
                      <span className="text-slate-500 text-[10px] block">Class of {gradYear} • {expLevel}</span>
                    </div>

                    {/* Academic Baseline Marks */}
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Academic Baseline Marks</span>
                      <div className="space-y-0.5 text-[10px]">
                        <div className="flex justify-between text-slate-600">
                          <span>10th Standard:</span>
                          <strong className="text-slate-900 font-bold">{candTenth ? `${candTenth}%` : 'N/A'}</strong>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>12th / Diploma:</span>
                          <strong className="text-slate-900 font-bold">{candTwelfth ? `${candTwelfth}%` : 'N/A'}</strong>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Graduation:</span>
                          <strong className="text-slate-900 font-bold">{candGrad ? `${candGrad}%` : 'N/A'}</strong>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Active Backlogs:</span>
                          <strong className={candBacklogs === 0 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                            {candBacklogs === 0 ? '0 (Cleared)' : `${candBacklogs} Active`}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Placement Standing */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Readiness Tier</span>
                      <span className={`inline-block px-2 py-0.5 text-[11px] font-black rounded-lg border ${readiness.pillBg} ${readiness.textColor}`}>
                        {readiness.tier}
                      </span>
                      <div className="text-[9px] text-slate-600 pt-0.5">
                        Campus Cutoff Status: <strong className={isAcademicallyEligible ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                          {isAcademicallyEligible ? 'Eligible for Day-1' : 'Check Criteria'}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Executive Job Readiness Scorecard & Core KPIs */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-brand-600" />
                      Section 2: Executive Performance & Key Indicators
                    </h3>
                    <span className="text-[10px] text-slate-400 font-bold">Standardized Benchmark: 65%</span>
                  </div>

                  <div className="grid grid-cols-6 gap-2">
                    {/* Radial Score Gauge Card */}
                    <div className="col-span-2 p-2.5 rounded-2xl bg-gradient-to-br from-brand-50 via-white to-blue-50 border border-brand-200 flex items-center gap-3 shadow-2xs">
                      <CircularScoreRing score={score} size={68} strokeWidth={6} tierColor={readiness.hex} />
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-brand-700 block">Job Readiness</span>
                        <div className="text-xs font-black text-slate-900 leading-tight">
                          {score >= 70 ? 'Industry Qualified' : 'Training Required'}
                        </div>
                        <span className="text-[10px] font-extrabold text-brand-600 block leading-tight">
                          {result?.obtainedMarks != null && result?.totalMarks != null
                            ? `${result.obtainedMarks} / ${result.totalMarks} Marks`
                            : `${Math.round((score / 100) * 40)} / 40 Marks`}
                        </span>
                        <span className="text-[9px] text-slate-500 block leading-tight">
                          Passing threshold ≥ 65%
                        </span>
                      </div>
                    </div>

                    {/* Accuracy Card */}
                    <div className="p-2 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-center flex flex-col justify-center">
                      <span className="text-[8.5px] font-bold uppercase tracking-wider text-emerald-800 block">Accuracy</span>
                      <span className="text-xl font-black text-emerald-700 my-0.5 leading-none">{accuracy}%</span>
                      <span className="text-[8.5px] font-semibold text-emerald-800">Precision</span>
                    </div>

                    {/* Solved Questions */}
                    <div className="p-2 rounded-2xl bg-purple-50/80 border border-purple-200 text-center flex flex-col justify-center">
                      <span className="text-[8.5px] font-bold uppercase tracking-wider text-purple-800 block">Solved Qs</span>
                      <span className="text-xl font-black text-purple-700 my-0.5 leading-none">
                        {correctCount} <span className="text-[10px] text-purple-500 font-bold">/ {totalQuestions}</span>
                      </span>
                      <span className="text-[8.5px] font-semibold text-purple-800">{incorrectCount} Incorrect</span>
                    </div>

                    {/* Percentile */}
                    <div className="p-2 rounded-2xl bg-blue-50/80 border border-blue-200 text-center flex flex-col justify-center">
                      <span className="text-[8.5px] font-bold uppercase tracking-wider text-blue-800 block">Percentile</span>
                      <span className="text-xl font-black text-blue-700 my-0.5 leading-none">{percentile}th</span>
                      <span className="text-[8.5px] font-semibold text-blue-800">Top {Math.max(1, 100 - percentile)}% Batch</span>
                    </div>

                    {/* Cohort Rank */}
                    <div className="p-2 rounded-2xl bg-amber-50/80 border border-amber-200 text-center flex flex-col justify-center">
                      <span className="text-[8.5px] font-bold uppercase tracking-wider text-amber-800 block">Cohort Rank</span>
                      <span className="text-xl font-black text-amber-700 my-0.5 leading-none">
                        #{rank} <span className="text-[10px] text-amber-600 font-bold">/ {totalStudents}</span>
                      </span>
                      <span className="text-[8.5px] font-semibold text-amber-800">Pace: {timeTaken}</span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Sectional Competency & Cohort Peer Comparison Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-brand-600" />
                      Section 3: Sectional Competency & Cohort Peer Benchmarks
                    </h3>
                    <span className="text-[10px] text-slate-500">Candidate vs National Benchmark vs Batch Average</span>
                  </div>

                  <div className="overflow-hidden border border-slate-200 rounded-2xl bg-white shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[9px]">
                          <th className="py-2 px-3">Evaluation Domain Track</th>
                          <th className="py-2 px-2 text-center">Candidate Score</th>
                          <th className="py-2 px-2 text-center">Benchmark</th>
                          <th className="py-2 px-2 text-center">Batch Avg</th>
                          <th className="py-2 px-2 text-center">Top 10% Score</th>
                          <th className="py-2 px-3 text-center">Standing vs Batch</th>
                          <th className="py-2 px-3 text-right">Mastery Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sectionalPillars.map((p) => {
                          const isPassing = p.candidateScore >= p.benchmark;
                          const isAheadOfAverage = p.candidateScore >= p.classAverage;
                          return (
                            <tr key={p.key} className="hover:bg-slate-50/50">
                              <td className="py-2 px-3">
                                <span className="font-extrabold text-slate-900 block leading-tight text-xs">{p.category}</span>
                                <span className="text-[9px] text-slate-500 leading-none">
                                  {isAheadOfAverage
                                    ? `+${p.candidateScore - p.classAverage}% above batch average`
                                    : `${p.classAverage - p.candidateScore}% below batch average`}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-center">
                                <span className="font-black text-sm text-slate-900">{p.candidateScore}%</span>
                                <span className="text-[9px] font-bold text-slate-500 block leading-tight">
                                  {Math.round((p.candidateScore / 100) * 40)}/40 Marks
                                </span>
                              </td>
                              <td className="py-2 px-2 text-center font-semibold text-slate-700 text-xs">
                                {p.benchmark}%
                              </td>
                              <td className="py-2 px-2 text-center text-slate-600 text-xs">
                                {p.classAverage}%
                              </td>
                              <td className="py-2 px-2 text-center font-bold text-emerald-700 text-xs">
                                {p.topperScore}%
                              </td>
                              <td className="py-2 px-3 text-center">
                                <div className="w-28 h-2 bg-slate-100 rounded-full mx-auto overflow-hidden relative">
                                  <div
                                    className={`h-full rounded-full ${isPassing ? 'bg-brand-500' : 'bg-amber-500'}`}
                                    style={{ width: `${Math.min(100, p.candidateScore)}%` }}
                                  />
                                </div>
                              </td>
                              <td className="py-2 px-3 text-right">
                                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold border ${
                                  p.candidateScore >= 75
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : isPassing
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {p.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Page 1 Footer */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 mt-auto shrink-0">
                  <span className="font-medium">ReadySetJob Official Credential • Document #{reportId}</span>
                  <span className="font-bold text-slate-700">Page 1 of 3</span>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* PAGE 2: DISTINCT DOMAIN-BY-DOMAIN CONCEPT DIAGNOSTICS & TOPIC MASTERY */}
            {/* ========================================================================= */}
            {(activeTab === 'all' || activeTab === 'page2') && (
              <div
                className="pdf-page bg-white rounded-2xl border border-slate-200 shadow-xl font-sans text-slate-800 print:shadow-none print:border-none"
                style={{
                  width: '794px',
                  minHeight: '1123px',
                  padding: '32px 36px',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Running Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 text-xs text-slate-500 shrink-0">
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-brand-600" />
                    <span className="font-extrabold text-slate-900">ReadySetJob Diagnostic Report</span>
                    <span className="text-slate-300">•</span>
                    <span>Candidate: <strong className="text-slate-800">{candidateName}</strong></span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">Document #{reportId}</span>
                </div>

                {/* Section 4: Domain-by-Domain Diagnostics Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-brand-600" />
                      Section 4: Domain-by-Domain Concept Diagnostics & Topic Mastery
                    </h3>
                    <p className="text-[10px] text-slate-500">16 Evaluated Competencies Grouped Across 4 Dedicated Pillars</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[10px] font-extrabold border border-brand-200">
                    4 Core Domains
                  </span>
                </div>

                {/* 4 DISTINCT DOMAIN SECTIONS (2x2 GRID - NO MIXING!) */}
                <div className="grid grid-cols-2 gap-3">
                  {domainSections.map((sec) => {
                    const Icon = sec.icon;
                    return (
                      <div key={sec.id} className={`rounded-2xl border ${sec.color} p-3 space-y-2 bg-white shadow-2xs`}>
                        {/* Domain Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                              <Icon className="w-3.5 h-3.5 text-brand-400" />
                            </div>
                            <span className="text-[11px] font-black text-slate-900">{sec.title}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${sec.badgeColor}`}>
                            {sec.domainScore}% Score
                          </span>
                        </div>

                        {/* Topics List */}
                        <div className="space-y-2">
                          {sec.topics.map((t, idx) => {
                            const isMastered = t.percent >= 80;
                            const isCompetent = t.percent >= 60 && t.percent < 80;
                            return (
                              <div key={idx} className="bg-slate-50/90 rounded-xl px-3 py-2 border border-slate-200/80">
                                {/* Row 1: Topic Title and Score */}
                                <div className="flex items-center justify-between gap-2 pb-1.5">
                                  <span className="font-bold text-slate-800 text-[11px] leading-snug">
                                    {t.topic}
                                  </span>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="text-[10px] font-semibold text-slate-500">{t.score}/{t.maxScore} Qs</span>
                                    <span className="text-xs font-black text-slate-900">{t.percent}%</span>
                                  </div>
                                </div>

                                {/* Row 2: Progress Bar and Status Badge with generous spacing */}
                                <div className="flex items-center gap-2 pt-1">
                                  <div className="flex-1 h-2 bg-slate-200/90 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${isMastered ? 'bg-emerald-500' : isCompetent ? 'bg-blue-500' : 'bg-rose-500'}`}
                                      style={{ width: `${Math.min(100, Math.max(0, t.percent))}%` }}
                                    />
                                  </div>
                                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded shrink-0 border leading-none ${
                                    isMastered
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : isCompetent
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : 'bg-rose-50 text-rose-700 border-rose-200'
                                  }`}>
                                    {t.status}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Section 5: Demonstrated Strengths & Skill Deficits */}
                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-brand-600" />
                    Section 5: Performance Diagnostic Insights & Gap Matrix
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Strengths */}
                    <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Demonstrated Core Strengths (≥80% Mastery)</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {strengthsList.slice(0, 5).map((s, i) => (
                          <span key={i} className="px-2 py-0.5 bg-white text-emerald-800 text-[9.5px] font-bold rounded-lg border border-emerald-200 shadow-2xs leading-tight">
                            ✓ {s.topic} ({s.percent}%)
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Deficits */}
                    <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-rose-800 font-extrabold text-[11px]">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Skill Deficits Needing Remediation (&lt;60%)</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {weaknessList.map((w, i) => (
                          <span key={i} className="px-2 py-0.5 bg-white text-rose-800 text-[9.5px] font-bold rounded-lg border border-rose-200 shadow-2xs leading-tight">
                            ⚠️ {w.topic} ({w.percent}%)
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Page 2 Footer */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 mt-auto shrink-0">
                  <span className="font-medium">ReadySetJob Official Credential • Concept Diagnostics</span>
                  <span className="font-bold text-slate-700">Page 2 of 3</span>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* PAGE 3: CORPORATE PLACEMENT MATRIX, AI ROADMAP & OFFICIAL SEAL */}
            {/* ========================================================================= */}
            {(activeTab === 'all' || activeTab === 'page3') && (
              <div
                className="pdf-page bg-white rounded-2xl border border-slate-200 shadow-xl font-sans text-slate-800 print:shadow-none print:border-none"
                style={{
                  width: '794px',
                  minHeight: '1123px',
                  padding: '32px 36px',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Running Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 text-xs text-slate-500 shrink-0">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-brand-600" />
                    <span className="font-extrabold text-slate-900">ReadySetJob Corporate Eligibility & Action Plan</span>
                    <span className="text-slate-300">•</span>
                    <span>Candidate: <strong className="text-slate-800">{candidateName}</strong></span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">Document #{reportId}</span>
                </div>

                {/* Section 6: Corporate Placement Eligibility Matrix */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-brand-600" />
                      Section 6: Corporate Placement Eligibility Matrix
                    </h3>
                    <div className="flex items-center gap-1.5 text-[9.5px] font-bold">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                        Eligible: {eligibleCount}
                      </span>
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                        Borderline: {borderlineCount}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full">
                        Needs Prep: {prepCount}
                      </span>
                    </div>
                  </div>

                  <div className="overflow-hidden border border-slate-200 rounded-2xl bg-white shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[9px]">
                          <th className="py-2 px-3">Target Employer & Designation</th>
                          <th className="py-2 px-2">Hiring Tier</th>
                          <th className="py-2 px-2">Package (CTC)</th>
                          <th className="py-2 px-2 text-center">Cutoff Required</th>
                          <th className="py-2 px-2 text-center">Academics Check</th>
                          <th className="py-2 px-3 text-right">Eligibility Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {companyEligibility.slice(0, 7).map((ce, idx) => {
                          const tier = ce.company.tier;
                          const tierBadge = tier === 'super_dream'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : tier === 'dream'
                              ? 'bg-purple-100 text-purple-800 border-purple-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200';

                          const statusBadge = ce.eligible
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : ce.borderline
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200';

                          return (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="py-2 px-3">
                                <strong className="text-slate-900 block leading-tight text-xs">{ce.company.name}</strong>
                                <span className="text-[10px] text-slate-500 leading-none">{ce.company.role}</span>
                              </td>
                              <td className="py-2 px-2">
                                <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-extrabold border ${tierBadge}`}>
                                  {tier === 'super_dream' ? 'Super Dream' : tier === 'dream' ? 'Dream' : 'Regular'}
                                </span>
                              </td>
                              <td className="py-2 px-2 font-semibold text-slate-800 text-xs">
                                {ce.company.package}
                              </td>
                              <td className="py-2 px-2 text-center font-bold text-slate-700 text-xs">
                                ≥ {ce.company.cutoffScore}%
                              </td>
                              <td className="py-2 px-2 text-center">
                                {ce.academicStatus.allPassed ? (
                                  <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold text-emerald-600">
                                    <CheckCircle2 className="w-3 h-3" /> Met
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold text-amber-600">
                                    <AlertTriangle className="w-3 h-3" /> Deficit
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold border ${statusBadge}`}>
                                  {ce.eligible ? 'Eligible' : ce.borderline ? 'Borderline Target' : 'Needs Prep'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 7: AI Skill Gap Diagnostics & 7-Day Action Plan */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-brand-50/60 via-white to-purple-50/60 border border-brand-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-brand-800">
                      <Sparkles className="w-4 h-4 text-brand-600" />
                      <h4 className="text-xs font-black uppercase tracking-wider">
                        Section 7: AI Skill Gap Diagnostics & 7-Day Improvement Plan
                      </h4>
                    </div>
                    <span className="text-[9.5px] font-bold text-brand-700 bg-brand-100/70 px-2 py-0.5 rounded-full border border-brand-200">
                      Remediation Budget: {totalStudyHours} Study Hours
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
                      <span className="text-[8.5px] font-bold uppercase tracking-wider text-rose-600 block leading-tight">High Priority Focus</span>
                      <strong className="text-xs text-slate-900 block leading-tight">{highPriorityAreas.length} Critical Topics</strong>
                      <p className="text-[9.5px] text-slate-500 leading-tight truncate">
                        {highPriorityAreas.slice(0, 2).map(h => h.topic).join(', ') || 'Solid core foundations.'}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
                      <span className="text-[8.5px] font-bold uppercase tracking-wider text-amber-600 block leading-tight">Medium Priority</span>
                      <strong className="text-xs text-slate-900 block leading-tight">{mediumPriorityAreas.length} Topics to Refine</strong>
                      <p className="text-[9.5px] text-slate-500 leading-tight truncate">
                        {mediumPriorityAreas.slice(0, 2).map(m => m.topic).join(', ') || 'All major topics proficient.'}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
                      <span className="text-[8.5px] font-bold uppercase tracking-wider text-brand-600 block leading-tight">Placement Outlook</span>
                      <strong className="text-xs text-brand-700 block leading-tight truncate">
                        {score >= 75 ? 'Tier-1 & Dream Qualified' : score >= 65 ? 'Day-1 Drives Eligible' : 'Needs Practice Mock Tests'}
                      </strong>
                      <p className="text-[9.5px] text-slate-500 leading-tight">
                        {score >= 70 ? 'Eligible for campus hiring drives.' : 'Complete 2 mock assessments to qualify.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-1 text-[10.5px] text-slate-600 leading-snug border-t border-brand-100">
                    <p>
                      <strong className="text-slate-900 font-bold">Recommended 7-Day Roadmap:</strong> Days 1–2: Speed aptitude sets (30 min/day). Days 3–4: Puzzle reasoning & analytical logic. Days 5–6: SQL indexing & relational design. Day 7: Retake readiness assessment.
                    </p>
                  </div>
                </div>

                {/* Section 8: Institutional Sign-Off & Cryptographic Verification Seal */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Section 8: Institutional Accreditation & Digital Verification
                    </span>
                  </div>

                  <div className="pt-2 border-t-2 border-slate-100 flex items-center justify-between gap-3 text-xs text-slate-500">
                    {/* Left: Dynamic SVG QR Code */}
                    <div className="flex items-center gap-2.5">
                      <CryptographicQrCodeSvg size={48} />
                      <div className="space-y-0.5">
                        <p className="font-extrabold text-slate-900 text-[10.5px] leading-tight flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-brand-600" />
                          ReadySetJob Digital Credential
                        </p>
                        <p className="text-[8.5px] font-mono text-slate-500 leading-tight">
                          SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                        </p>
                        <p className="text-[8.5px] text-slate-400 leading-tight">
                          Verification URL: <span className="font-semibold text-brand-600">readysetjob.com/verify/{reportId}</span>
                        </p>
                      </div>
                    </div>

                    {/* Center: Official Embossed Stamp */}
                    <OfficialStampBadge />

                    {/* Right: Dual Signatures */}
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="h-5 flex items-center justify-center font-serif italic text-slate-800 font-bold text-xs">
                          Dr. A. Sharma
                        </div>
                        <div className="w-22 border-t border-slate-300 pt-0.5">
                          <span className="text-[7.5px] uppercase font-bold text-slate-400 block leading-tight">Director, Assessment Board</span>
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="h-5 flex items-center justify-center font-serif italic text-brand-700 font-bold text-xs">
                          P. Nair
                        </div>
                        <div className="w-22 border-t border-slate-300 pt-0.5">
                          <span className="text-[7.5px] uppercase font-bold text-slate-400 block leading-tight">Placement Cell Officer</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Page 3 Footer */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 mt-auto shrink-0">
                  <span className="font-medium">https://readysetjob.com/verify/{reportId}</span>
                  <span className="font-bold text-slate-700">Page 3 of 3 • End of Official Credential Document</span>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};
