import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import ScoreOverview from '../../components/analytics/ScoreOverview';
import ConceptAnalysis from '../../components/analytics/ConceptAnalysis';
import CompanyEligibility from '../../components/analytics/CompanyEligibility';
import ImprovementRoadmap from '../../components/analytics/ImprovementRoadmap';
import InterviewAnalysisSection from '../../components/analytics/InterviewAnalysisSection';
import { ScoreRing } from '../../components/common/ScoreRing';
import confetti from 'canvas-confetti';
import { mockStudent } from '../../data/analyticsData';
import { AssessmentReportModal } from '../../components/candidate/AssessmentReportModal';
import {
  Award,
  Target,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Sparkles,
  ClipboardCheck,
  TrendingUp,
  Layers,
  BookOpen,
  Download,
  Code2,
  Mic
} from 'lucide-react';

export default function CandidateAnalyticsPage() {
  const { currentUser, latestResult, candidateSubmissions, assessments, startAssessment, addToast } = useApp();
  const [activeSection, setActiveSection] = useState((latestResult || (candidateSubmissions && candidateSubmissions.length > 0)) ? 'results' : 'overview');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('ALL');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    // Launch celebratory confetti if score >= 60
    try {
      const s = latestResult?.score ?? currentUser?.jobReadinessScore ?? 75;
      if (s >= 60) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (e) { }
  }, [latestResult, currentUser]);

  useEffect(() => {
    // Check if candidate navigated directly after submitting an AI Mock Interview
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const storedTab = localStorage.getItem('rsj_active_analytics_tab');

    if (tabParam === 'interview' || storedTab === 'interview') {
      localStorage.removeItem('rsj_active_analytics_tab');
      setActiveSection('interview');
      setTimeout(() => {
        sectionRefs.interview?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    }
  }, []);

  // Aggregate Section Scores across ALL submitted candidate assessments
  const sectionScores = React.useMemo(() => {
    const subs = Array.isArray(candidateSubmissions) ? candidateSubmissions : [];
    const asms = Array.isArray(assessments) ? assessments : [];

    const getScoreForSection = (keys, asmCategoryName) => {
      // 1. First check candidateSubmissions
      const match = subs.find(s => {
        const cat = String(s.category || '').toLowerCase().trim();
        const title = String(s.assessment_title || s.assessmentName || s.title || '').toLowerCase().trim();
        return keys.some(k => cat.includes(k) || title.includes(k));
      });

      if (match) {
        const obtained = Number(match.obtained_marks ?? match.obtainedMarks ?? (typeof match.score === 'number' ? Math.round((match.score / 100) * 40) : 0));
        const total = Number(match.total_marks ?? match.totalMarks ?? 40);
        const pct = typeof match.score === 'number' ? match.score : (total > 0 ? Math.round((obtained / total) * 100) : 0);
        return { obtained, total, pct, title: match.assessment_title || match.assessmentName || match.title || '', isSubmitted: true };
      }

      // 2. Check assessments array state for completed status
      const asmMatch = asms.find(a => {
        const cat = String(a.category || '').toLowerCase().trim();
        const title = String(a.title || '').toLowerCase().trim();
        return (a.status === 'Completed' || a.progress >= 100) && keys.some(k => cat.includes(k) || title.includes(k));
      });

      if (asmMatch) {
        const pct = Number(asmMatch.lastScore ?? asmMatch.score ?? 100);
        const total = Number(asmMatch.total_marks ?? asmMatch.totalMarks ?? 40);
        const obtained = Math.round((pct / 100) * total);
        return { obtained, total, pct, title: asmMatch.title || '', isSubmitted: true };
      }

      // 3. Check latestResult
      const latestCat = String(latestResult?.category || '').toLowerCase();
      const latestTitle = String(latestResult?.assessmentName || '').toLowerCase();
      if (keys.some(k => latestCat.includes(k) || latestTitle.includes(k))) {
        const obtained = Number(latestResult.obtainedMarks ?? Math.round((latestResult.score / 100) * 40));
        const total = Number(latestResult.totalMarks ?? 40);
        const pct = latestResult.score ?? 0;
        return { obtained, total, pct, title: latestResult.assessmentName || '', isSubmitted: true };
      }

      // 4. Fallback to currentUser specific score
      for (const k of keys) {
        const scoreVal = currentUser?.[`${k}Score`];
        if (typeof scoreVal === 'number' && scoreVal > 0) {
          return { obtained: Math.round((scoreVal / 100) * 40), total: 40, pct: scoreVal, title: '', isSubmitted: false };
        }
      }

      return { obtained: 0, total: 40, pct: 0, title: '', isSubmitted: false };
    };

    return {
      technical: getScoreForSection(['tech'], 'Technical'),
      aptitude: getScoreForSection(['apt', 'quant'], 'Aptitude'),
      reasoning: getScoreForSection(['reason', 'logic'], 'Reasoning'),
      coding: getScoreForSection(['code', 'prog'], 'Coding'),
      verbal: getScoreForSection(['verb', 'eng'], 'Verbal')
    };
  }, [candidateSubmissions, assessments, latestResult, currentUser]);

  const displayResultMetrics = React.useMemo(() => {
    const subs = Array.isArray(candidateSubmissions) ? candidateSubmissions : [];

    // Filter by specific module if selected
    if (selectedModuleFilter !== 'ALL') {
      const keys = selectedModuleFilter === 'Technical' ? ['tech']
        : selectedModuleFilter === 'Aptitude' ? ['apt', 'quant']
        : selectedModuleFilter === 'Reasoning' ? ['reason', 'logic']
        : selectedModuleFilter === 'Coding' ? ['code', 'prog']
        : ['verb', 'eng'];

      const selectedSub = subs.find(s => {
        const cat = String(s.category || '').toLowerCase().trim();
        const title = String(s.assessment_title || s.assessmentName || s.title || '').toLowerCase().trim();
        return keys.some(k => cat.includes(k) || title.includes(k));
      }) || (
        keys.some(k => String(latestResult?.category || '').toLowerCase().includes(k) || String(latestResult?.assessmentName || '').toLowerCase().includes(k))
          ? latestResult
          : null
      );

      if (selectedSub) {
        const score = Number(selectedSub.score ?? 0);
        const obtained = Number(selectedSub.obtained_marks ?? selectedSub.obtainedMarks ?? Math.round((score / 100) * 40));
        const total = Number(selectedSub.total_marks ?? selectedSub.totalMarks ?? 40);
        return {
          title: selectedSub.assessment_title || selectedSub.assessmentName || selectedSub.title || `${selectedModuleFilter} Assessment`,
          score: score,
          obtainedMarks: obtained,
          totalMarks: total,
          accuracy: Number(selectedSub.accuracy ?? score),
          correctCount: Number(selectedSub.correct_count ?? selectedSub.correctCount ?? Math.round((score / 100) * (selectedModuleFilter === 'Coding' ? 4 : 10))),
          incorrectCount: Number(selectedSub.incorrect_count ?? selectedSub.incorrectCount ?? 0),
          unansweredCount: Number(selectedSub.unanswered_count ?? selectedSub.unansweredCount ?? 0),
          totalQuestions: Number(selectedSub.total_questions ?? selectedSub.totalQuestions ?? (selectedModuleFilter === 'Coding' ? 4 : 10)),
          timeTaken: selectedSub.time_taken || selectedSub.timeTaken || '10 min',
          isFiltered: true
        };
      }

      // If no sub found for filtered module, fallback to sectionScores entry
      const secKey = selectedModuleFilter.toLowerCase();
      const sec = sectionScores[secKey] || sectionScores.technical;
      return {
        title: `${selectedModuleFilter} Assessment`,
        score: sec.pct,
        obtainedMarks: sec.obtained,
        totalMarks: sec.total,
        accuracy: sec.pct,
        correctCount: Math.round((sec.pct / 100) * (selectedModuleFilter === 'Coding' ? 4 : 10)),
        incorrectCount: (selectedModuleFilter === 'Coding' ? 4 : 10) - Math.round((sec.pct / 100) * (selectedModuleFilter === 'Coding' ? 4 : 10)),
        unansweredCount: 0,
        totalQuestions: selectedModuleFilter === 'Coding' ? 4 : 10,
        timeTaken: '10 min',
        isFiltered: true
      };
    }

    // Default 'ALL': Aggregate across all completed assessments
    const completedSections = Object.values(sectionScores).filter(s => s.obtained > 0 || s.isSubmitted);
    if (completedSections.length > 0 || subs.length > 0) {
      const totalObtained = completedSections.reduce((sum, s) => sum + s.obtained, 0);
      const totalPossible = completedSections.reduce((sum, s) => sum + s.total, 0);
      const compositeScore = totalPossible > 0 ? Math.round((totalObtained / totalPossible) * 100) : 0;

      const totalCorrect = subs.reduce((sum, s) => sum + Number(s.correct_count ?? s.correctCount ?? 0), 0) || completedSections.reduce((sum, s) => sum + Math.round((s.pct / 100) * (s.total / 4)), 0);
      const totalQuestions = subs.reduce((sum, s) => sum + Number(s.total_questions ?? s.totalQuestions ?? 10), 0) || (completedSections.length * 10);
      const totalIncorrect = subs.reduce((sum, s) => sum + Number(s.incorrect_count ?? s.incorrectCount ?? 0), 0);
      const totalUnanswered = subs.reduce((sum, s) => sum + Number(s.unanswered_count ?? s.unansweredCount ?? 0), 0);
      const avgAccuracy = (totalCorrect + totalIncorrect) > 0 ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100) : compositeScore;

      return {
        title: 'Job Readiness Overall Assessment',
        score: compositeScore,
        obtainedMarks: totalObtained,
        totalMarks: totalPossible,
        accuracy: avgAccuracy,
        correctCount: totalCorrect,
        totalQuestions: totalQuestions,
        incorrectCount: totalIncorrect,
        unansweredCount: totalUnanswered,
        timeTaken: `${Math.max(1, subs.length || completedSections.length) * 10} min`,
        isFiltered: false
      };
    }

    if (latestResult) {
      return {
        title: latestResult.assessmentName || 'Technical Assessment',
        score: latestResult.score ?? 0,
        obtainedMarks: latestResult.obtainedMarks ?? 0,
        totalMarks: latestResult.totalMarks ?? 40,
        accuracy: latestResult.accuracy ?? 0,
        correctCount: latestResult.correctCount ?? 0,
        totalQuestions: latestResult.totalQuestions ?? 10,
        incorrectCount: latestResult.incorrectCount ?? 0,
        unansweredCount: latestResult.unansweredCount ?? 0,
        timeTaken: latestResult.timeTaken || '28 min',
        isFiltered: false
      };
    }

    return {
      title: 'Assessment',
      score: currentUser?.jobReadinessScore ?? 0,
      obtainedMarks: 0,
      totalMarks: 40,
      accuracy: 0,
      correctCount: 0,
      totalQuestions: 10,
      incorrectCount: 0,
      unansweredCount: 0,
      timeTaken: '0 min',
      isFiltered: false
    };
  }, [candidateSubmissions, latestResult, currentUser, selectedModuleFilter, sectionScores]);

  // Build dynamic candidate analytics profile from their real assessment submissions
  const studentData = React.useMemo(() => {
    const defaultData = { ...mockStudent };
    const name = currentUser?.name || currentUser?.fullName || mockStudent.name;
    const email = currentUser?.email || mockStudent.email;

    // Academic marks from candidate profile
    const tenthMarks = Number(currentUser?.tenthMarks ?? currentUser?.tenth_marks ?? 0);
    const twelfthDiplomaMarks = Number(currentUser?.twelfthDiplomaMarks ?? currentUser?.twelfth_diploma_marks ?? 0);
    const graduationPercentage = Number(currentUser?.graduationPercentage ?? currentUser?.graduation_percentage ?? 0);
    const backlogs = Number(currentUser?.backlogs ?? 0);

    const aptScore = sectionScores.aptitude.isSubmitted ? sectionScores.aptitude.pct : Number(currentUser?.aptitudeScore || 0);
    const reasonScore = sectionScores.reasoning.isSubmitted ? sectionScores.reasoning.pct : Number(currentUser?.reasoningScore || 0);
    const techScore = sectionScores.technical.isSubmitted ? sectionScores.technical.pct : Number(currentUser?.technicalScore || 0);
    const verbScore = sectionScores.verbal.isSubmitted ? sectionScores.verbal.pct : Number(currentUser?.verbalScore || 0);
    const codeScore = sectionScores.coding.isSubmitted ? sectionScores.coding.pct : Number(currentUser?.codingScore || 0);

    const attemptedPillars = [
      sectionScores.aptitude.isSubmitted ? aptScore : null,
      sectionScores.reasoning.isSubmitted ? reasonScore : null,
      sectionScores.technical.isSubmitted ? techScore : null,
      sectionScores.coding.isSubmitted ? codeScore : null,
      sectionScores.verbal.isSubmitted ? verbScore : null,
    ].filter(v => v !== null);

    const calculatedOverall = displayResultMetrics.score || (
      attemptedPillars.length > 0
        ? Math.round(attemptedPillars.reduce((a, b) => a + b, 0) / attemptedPillars.length)
        : Number(currentUser?.jobReadinessScore || 0)
    );

    // Determine actual score from displayResultMetrics
    const score = calculatedOverall;
    const percentile = Math.min(99, Math.max(15, Math.round(score * 0.95 + 10)));
    const totalStudents = 280;
    const rank = Math.max(1, Math.round(totalStudents * (1 - percentile / 100)));

    const categories = {
      aptitude: { score: Math.round((aptScore / 100) * 25), maxScore: 25, topics: [] },
      reasoning: { score: Math.round((reasonScore / 100) * 25), maxScore: 25, topics: [] },
      technical: { score: Math.round((techScore / 100) * 25), maxScore: 25, topics: [] },
      english: { score: Math.round((verbScore / 100) * 25), maxScore: 25, topics: [] },
      verbal: { score: Math.round((verbScore / 100) * 25), maxScore: 25, topics: [] },
      coding: { score: Math.round((codeScore / 100) * 25), maxScore: 25, topics: [] },
    };

    const currentAttempt = {
      id: latestResult?.assessmentId || 'ATT-LATEST',
      date: latestResult?.completedAt || new Date().toISOString().split('T')[0],
      totalScore: calculatedOverall,
      categories,
    };

    const prevAttempts = defaultData.examAttempts.slice(0, -1);

    return {
      ...defaultData,
      name,
      email,
      tenthMarks,
      twelfthDiplomaMarks,
      graduationPercentage,
      backlogs,
      overallScore: calculatedOverall,
      jobReadinessScore: calculatedOverall,
      categoryScores: {
        aptitude: aptScore,
        reasoning: reasonScore,
        technical: techScore,
        verbal: verbScore,
        english: verbScore,
        coding: codeScore,
      },
      percentile,
      rank,
      examAttempts: [...prevAttempts, currentAttempt],
    };
  }, [currentUser, latestResult, sectionScores, displayResultMetrics]);

  const sectionRefs = {
    results: useRef(null),
    overview: useRef(null),
    concepts: useRef(null),
    interview: useRef(null),
    companies: useRef(null),
    roadmap: useRef(null),
  };

  const handleNavigate = (section) => {
    setActiveSection(section);
    sectionRefs[section]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const tabs = [
    ...(latestResult ? [{ id: 'results', label: 'Test Results & Summary' }] : []),
    { id: 'overview', label: 'Score Overview' },
    { id: 'concepts', label: 'Concept Analysis' },
    { id: 'interview', label: 'Interview Analysis' },
    { id: 'companies', label: 'Company Eligibility' },
    { id: 'roadmap', label: 'Improvement Roadmap' },
  ];

  const getStatusBadge = (s) => {
    if (s >= 85) return { label: 'Highly Job Ready', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (s >= 70) return { label: 'Job Ready', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (s >= 50) return { label: 'Developing Competency', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: 'Needs Training', color: 'bg-rose-50 text-rose-700 border-rose-200' };
  };

  const statusBadge = getStatusBadge(studentData.overallScore);

  return (
    <div className="space-y-8">

      {/* Sticky Tab Sub-Header */}
      <div className="sticky top-16 z-20 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-1.5 shadow-subtle flex items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleNavigate(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeSection === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsReportModalOpen(true)}
          className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Report</span>
        </button>
      </div>

      {/* Main Content Sections */}
      <div className="space-y-12">

        {/* LATEST & AGGREGATED ASSESSMENT RESULTS */}
        {(latestResult || (candidateSubmissions && candidateSubmissions.length > 0)) && (
          <section ref={sectionRefs.results} className="space-y-6">
            {/* Assessment Header Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    {candidateSubmissions && candidateSubmissions.length > 0
                      ? `${candidateSubmissions.length} Assessment Modules Submitted & Verified`
                      : 'Assessment Completed & Verified'}
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {displayResultMetrics.title} Results
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Module Selector Filter */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                  <button
                    onClick={() => setSelectedModuleFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${selectedModuleFilter === 'ALL'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    All Modules Summary
                  </button>
                  {['Technical', 'Aptitude', 'Reasoning', 'Coding'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedModuleFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg transition-all ${selectedModuleFilter === cat
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 transition-all flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Official Report (PDF)</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics (5 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Total Score & Marks */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-card flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Score</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900">{displayResultMetrics.score}%</span>
                    <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                      {`${displayResultMetrics.obtainedMarks} / ${displayResultMetrics.totalMarks} Marks`}
                    </span>
                  </div>
                  <span className="block text-xs font-semibold text-slate-600 mt-0.5">
                    {`Marks: ${displayResultMetrics.obtainedMarks} out of ${displayResultMetrics.totalMarks}`}
                  </span>
                </div>
              </div>

              {/* Accuracy */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-card flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Accuracy</span>
                  <span className="text-2xl font-black text-slate-900">{displayResultMetrics.accuracy}%</span>
                  <span className="block text-[11px] text-slate-400 font-medium">Attempted accuracy</span>
                </div>
              </div>

              {/* Correct */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-card flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Correct</span>
                  <span className="text-2xl font-black text-emerald-600">{displayResultMetrics.correctCount} Qs</span>
                  <span className="block text-[11px] text-slate-400 font-medium">Out of {displayResultMetrics.totalQuestions} Qs</span>
                </div>
              </div>

              {/* Incorrect */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-card flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Incorrect</span>
                  <span className="text-2xl font-black text-rose-600">{displayResultMetrics.incorrectCount} Qs</span>
                  <span className="block text-[11px] text-slate-400 font-medium">{displayResultMetrics.unansweredCount || 0} unanswered</span>
                </div>
              </div>

              {/* Time Taken */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-card flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Time Taken</span>
                  <span className="text-2xl font-black text-slate-900">{displayResultMetrics.timeTaken}</span>
                  <span className="block text-[11px] text-slate-400 font-medium">Exam duration</span>
                </div>
              </div>
            </div>

            {/* Performance Ring & Section Scores */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Score</span>
                  <h3 className="text-base font-bold text-slate-900">Job Readiness Score</h3>
                </div>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${statusBadge.color}`}>
                  {statusBadge.label}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-4 py-2 flex justify-center">
                  <ScoreRing score={displayResultMetrics.score} maxScore={100} size={190} />
                </div>

                <div className="md:col-span-8 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Section Score Breakdown (All Submitted Assessments)</h4>

                  {/* Technical CS Fundamentals */}
                  <div className={`p-3 rounded-xl border space-y-1 transition-all ${selectedModuleFilter === 'Technical' ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/30' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800 flex items-center gap-1.5">
                        <span>Technical CS Fundamentals (OS, Networks, DBMS, OOP)</span>
                      </span>
                      <span className="text-amber-600 font-bold">
                        {sectionScores.technical.obtained} / {sectionScores.technical.total} Marks ({sectionScores.technical.pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${sectionScores.technical.pct}%` }} />
                    </div>
                  </div>

                  {/* Aptitude */}
                  <div className={`p-3 rounded-xl border space-y-1 transition-all ${selectedModuleFilter === 'Aptitude' ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-400/30' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">Aptitude & Quantitative Ability</span>
                      <span className="text-blue-600 font-bold">
                        {sectionScores.aptitude.obtained} / {sectionScores.aptitude.total} Marks ({sectionScores.aptitude.pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${sectionScores.aptitude.pct}%` }} />
                    </div>
                  </div>

                  {/* Reasoning */}
                  <div className={`p-3 rounded-xl border space-y-1 transition-all ${selectedModuleFilter === 'Reasoning' ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/30' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">Logical & Analytical Reasoning</span>
                      <span className="text-emerald-600 font-bold">
                        {sectionScores.reasoning.obtained} / {sectionScores.reasoning.total} Marks ({sectionScores.reasoning.pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${sectionScores.reasoning.pct}%` }} />
                    </div>
                  </div>

                  {/* Coding */}
                  <div className={`p-3 rounded-xl border space-y-1 transition-all ${selectedModuleFilter === 'Coding' ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-400/30' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800 flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Coding & Algorithmic Problem Solving</span>
                      </span>
                      <span className="text-indigo-600 font-bold">
                        {sectionScores.coding.obtained} / {sectionScores.coding.total} Marks ({sectionScores.coding.pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${sectionScores.coding.pct}%` }} />
                    </div>
                  </div>

                  {/* Verbal */}
                  {sectionScores.verbal.obtained > 0 && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-800">Verbal & Communication</span>
                        <span className="text-purple-600 font-bold">
                          {sectionScores.verbal.obtained} / {sectionScores.verbal.total} Marks ({sectionScores.verbal.pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${sectionScores.verbal.pct}%` }} />
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
            <hr className="border-slate-200/80" />
          </section>
        )}

        <section ref={sectionRefs.overview}>
          <ScoreOverview student={studentData} />
        </section>

        <hr className="border-slate-200/80" />

        <section ref={sectionRefs.concepts}>
          <ConceptAnalysis student={studentData} />
        </section>

        <hr className="border-slate-200/80" />

        <section ref={sectionRefs.interview}>
          <InterviewAnalysisSection />
        </section>

        <hr className="border-slate-200/80" />

        <section ref={sectionRefs.companies}>
          <CompanyEligibility student={studentData} />
        </section>

        <hr className="border-slate-200/80" />

        <section ref={sectionRefs.roadmap}>
          <ImprovementRoadmap student={studentData} />
        </section>
      </div>

      <footer className="text-center py-6 text-xs text-slate-400 border-t border-slate-200/60 font-medium">
        IncuxAI Candidate Analytics Portal • ReadySetJob Platform
      </footer>

      {/* Downloadable Official Candidate Assessment Report Modal */}
      <AssessmentReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        candidate={currentUser}
        result={{
          ...latestResult,
          score: displayResultMetrics.score || studentData.overallScore,
          totalMarks: displayResultMetrics.totalMarks || 100,
          obtainedMarks: displayResultMetrics.obtainedMarks || studentData.overallScore,
          accuracy: displayResultMetrics.accuracy || studentData.overallScore,
          correctCount: displayResultMetrics.correctCount || 0,
          incorrectCount: displayResultMetrics.incorrectCount || 0,
          unansweredCount: displayResultMetrics.unansweredCount || 0,
          totalQuestions: displayResultMetrics.totalQuestions || 20,
          timeTaken: displayResultMetrics.timeTaken || '28 min',
          completedAt: latestResult?.completedAt || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          assessmentName: displayResultMetrics.title || 'Comprehensive Job Readiness Assessment',
          categoryScores: studentData.categoryScores,
          topicBreakdown: latestResult?.topicBreakdown || studentData.topicBreakdown || []
        }}
        studentData={studentData}
        addToast={addToast}
      />
    </div>
  );
}
