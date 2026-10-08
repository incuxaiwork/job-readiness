import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import ConceptAnalysis from '../../components/analytics/ConceptAnalysis';
import InterviewAnalysisSection from '../../components/analytics/InterviewAnalysisSection';
import CompanyEligibilitySection from '../../components/analytics/CompanyEligibilitySection';
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
  const [activeSection, setActiveSection] = useState('results');
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

  // 1. Get distinct latest submission per assessment from candidateSubmissions
  const distinctSubs = React.useMemo(() => {
    const subs = Array.isArray(candidateSubmissions) ? candidateSubmissions : [];
    const map = new Map();
    subs.forEach(s => {
      const key = (s.assessment_id || s.assessmentId || s.assessment_title || s.assessmentName || '').toString().toLowerCase().trim();
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, s);
      } else {
        const existing = map.get(key);
        const exTime = new Date(existing.created_at || 0).getTime();
        const sTime = new Date(s.created_at || 0).getTime();
        if (sTime > exTime) map.set(key, s);
      }
    });
    return Array.from(map.values());
  }, [candidateSubmissions]);

  // 2. Extract all real topics tested directly from database submissions
  const databaseTopics = React.useMemo(() => {
    const list = [];
    const seen = new Set();
    distinctSubs.forEach(s => {
      let tb = s.topic_breakdown || s.topicBreakdown;
      if (typeof tb === 'string') {
        try { tb = JSON.parse(tb); } catch (e) { tb = []; }
      }
      if (Array.isArray(tb) && tb.length > 0) {
        tb.forEach(item => {
          const name = (item.topic || item.name || 'General').trim();
          const cat = item.category || s.category || s.assessment_title || 'Technical';
          const obt = Number(item.obtainedMarks ?? item.obtained_marks ?? item.score ?? 0);
          const tot = Number(item.totalMarks ?? item.total_marks ?? 1);
          const pct = tot > 0 ? Math.round((obt / tot) * 100) : Number(item.score ?? 0);
          const uniqueKey = `${cat}-${name}`.toLowerCase();
          if (!seen.has(uniqueKey)) {
            seen.add(uniqueKey);
            list.push({
              name,
              topic: name,
              category: cat,
              score: obt,
              obtainedMarks: obt,
              totalMarks: tot,
              maxScore: tot,
              percent: pct,
              status: item.status || (pct >= 80 ? 'Mastered' : pct >= 50 ? 'Average' : 'Weak'),
              correctCount: Number(item.correctCount ?? (pct >= 60 ? 1 : 0)),
              incorrectCount: Number(item.incorrectCount ?? (pct < 60 ? 1 : 0)),
              unansweredCount: Number(item.unansweredCount ?? 0),
              totalQuestions: Number(item.totalQuestions ?? 1)
            });
          }
        });
      }
    });
    return list;
  }, [distinctSubs]);

  // 3. Aggregate Section Scores across distinct submitted candidate assessments
  const sectionScores = React.useMemo(() => {
    const asms = Array.isArray(assessments) ? assessments : [];

    const getScoreForSection = (keys, defaultCatName) => {
      // 1. First check distinct candidateSubmissions
      const match = distinctSubs.find(s => {
        const cat = String(s.category || '').toLowerCase().trim();
        const title = String(s.assessment_title || s.assessmentName || s.title || '').toLowerCase().trim();
        return keys.some(k => cat.includes(k) || title.includes(k));
      });

      if (match) {
        const total = Number(match.total_marks ?? match.totalMarks ?? 40);
        const obtained = Number(match.obtained_marks ?? match.obtainedMarks ?? (typeof match.score === 'number' ? Math.round((match.score / 100) * total) : 0));
        const pct = total > 0 ? Math.round((obtained / total) * 100) : (typeof match.score === 'number' ? match.score : 0);
        return {
          obtained,
          total,
          pct,
          title: match.assessment_title || match.assessmentName || match.title || `${defaultCatName} Assessment`,
          isSubmitted: true,
          submission: match
        };
      }

      // 2. Check assessments array state for completed status
      const asmMatch = asms.find(a => {
        const cat = String(a.category || '').toLowerCase().trim();
        const title = String(a.title || '').toLowerCase().trim();
        return (a.status === 'Completed' || a.progress >= 100) && keys.some(k => cat.includes(k) || title.includes(k));
      });

      if (asmMatch) {
        const pct = Number(asmMatch.lastScore ?? asmMatch.score ?? 0);
        const total = Number(asmMatch.total_marks ?? asmMatch.totalMarks ?? 40);
        const obtained = Math.round((pct / 100) * total);
        return { obtained, total, pct, title: asmMatch.title || `${defaultCatName} Assessment`, isSubmitted: true };
      }

      // 3. Check fallback from candidate profile
      for (const k of keys) {
        const scoreVal = currentUser?.[`${k}Score`];
        if (typeof scoreVal === 'number' && scoreVal > 0) {
          return { obtained: Math.round((scoreVal / 100) * 40), total: 40, pct: scoreVal, title: `${defaultCatName} Assessment`, isSubmitted: false };
        }
      }

      return { obtained: 0, total: 40, pct: 0, title: `${defaultCatName} Assessment`, isSubmitted: false };
    };

    return {
      technical: getScoreForSection(['tech'], 'Technical'),
      aptitude: getScoreForSection(['apt', 'quant'], 'Aptitude'),
      reasoning: getScoreForSection(['reason', 'logic'], 'Reasoning'),
      coding: getScoreForSection(['code', 'prog'], 'Coding'),
      verbal: getScoreForSection(['verb', 'eng'], 'Verbal')
    };
  }, [distinctSubs, assessments, currentUser]);

  // 4. Compute accurate display metrics (total score, accuracy, questions)
  const displayResultMetrics = React.useMemo(() => {
    // Filter by specific module if selected
    if (selectedModuleFilter !== 'ALL') {
      const keys = selectedModuleFilter === 'Technical' ? ['tech']
        : selectedModuleFilter === 'Aptitude' ? ['apt', 'quant']
        : selectedModuleFilter === 'Reasoning' ? ['reason', 'logic']
        : selectedModuleFilter === 'Coding' ? ['code', 'prog']
        : ['verb', 'eng'];

      const secKey = selectedModuleFilter.toLowerCase();
      const secScore = sectionScores[secKey] || sectionScores.technical;

      const selectedSub = distinctSubs.find(s => {
        const cat = String(s.category || '').toLowerCase().trim();
        const title = String(s.assessment_title || s.assessmentName || s.title || '').toLowerCase().trim();
        return keys.some(k => cat.includes(k) || title.includes(k));
      });

      if (selectedSub) {
        const total = Number(selectedSub.total_marks ?? selectedSub.totalMarks ?? secScore.total);
        const obtained = Number(selectedSub.obtained_marks ?? selectedSub.obtainedMarks ?? secScore.obtained);
        const score = total > 0 ? Math.round((obtained / total) * 100) : Number(selectedSub.score ?? secScore.pct);
        const corr = Number(selectedSub.correct_count ?? selectedSub.correctCount ?? 0);
        const incorr = Number(selectedSub.incorrect_count ?? selectedSub.incorrectCount ?? 0);
        const unans = Number(selectedSub.unanswered_count ?? selectedSub.unansweredCount ?? 0);
        const totQ = Number(selectedSub.total_questions ?? selectedSub.totalQuestions ?? ((corr + incorr + unans) || 5));
        const acc = (corr + incorr) > 0 ? Math.round((corr / (corr + incorr)) * 100) : score;

        return {
          title: selectedSub.assessment_title || selectedSub.assessmentName || `${selectedModuleFilter} Assessment`,
          score,
          obtainedMarks: obtained,
          totalMarks: total,
          accuracy: acc,
          correctCount: corr,
          incorrectCount: incorr,
          unansweredCount: unans,
          totalQuestions: totQ,
          timeTaken: selectedSub.time_taken || selectedSub.timeTaken || '10 min',
          isFiltered: true
        };
      }

      return {
        title: `${selectedModuleFilter} Assessment`,
        score: secScore.pct,
        obtainedMarks: secScore.obtained,
        totalMarks: secScore.total,
        accuracy: secScore.pct,
        correctCount: Math.round((secScore.pct / 100) * 10),
        incorrectCount: 10 - Math.round((secScore.pct / 100) * 10),
        unansweredCount: 0,
        totalQuestions: 10,
        timeTaken: '10 min',
        isFiltered: true
      };
    }

    // Default 'ALL': Aggregate across all distinct completed assessments in database
    if (distinctSubs.length > 0) {
      const totalObtained = distinctSubs.reduce((sum, s) => sum + Number(s.obtained_marks ?? s.obtainedMarks ?? 0), 0);
      const totalPossible = distinctSubs.reduce((sum, s) => sum + Number(s.total_marks ?? s.totalMarks ?? 0), 0);
      const compositeScore = totalPossible > 0 ? Math.round((totalObtained / totalPossible) * 100) : 0;

      const totalCorrect = distinctSubs.reduce((sum, s) => sum + Number(s.correct_count ?? s.correctCount ?? 0), 0);
      const totalIncorrect = distinctSubs.reduce((sum, s) => sum + Number(s.incorrect_count ?? s.incorrectCount ?? 0), 0);
      const totalUnanswered = distinctSubs.reduce((sum, s) => sum + Number(s.unanswered_count ?? s.unansweredCount ?? 0), 0);
      const totalQuestions = distinctSubs.reduce((sum, s) => sum + Number(s.total_questions ?? s.totalQuestions ?? 0), 0) || (totalCorrect + totalIncorrect + totalUnanswered) || 20;
      const avgAccuracy = (totalCorrect + totalIncorrect) > 0 ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100) : compositeScore;

      return {
        title: 'Job Readiness Overall Assessment',
        score: compositeScore,
        obtainedMarks: totalObtained,
        totalMarks: totalPossible,
        accuracy: avgAccuracy,
        correctCount: totalCorrect,
        incorrectCount: totalIncorrect,
        unansweredCount: totalUnanswered,
        totalQuestions,
        timeTaken: `${distinctSubs.length * 10} min`,
        isFiltered: false
      };
    }

    return {
      title: 'Job Readiness Overall Assessment',
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
  }, [distinctSubs, sectionScores, selectedModuleFilter, currentUser]);

  // Build dynamic candidate analytics profile from real assessment submissions
  const studentData = React.useMemo(() => {
    const defaultData = { ...mockStudent };
    const name = currentUser?.name || currentUser?.fullName || mockStudent.name;
    const email = currentUser?.email || mockStudent.email;

    // Academic marks from candidate profile
    const tenthMarks = Number(currentUser?.tenthMarks ?? currentUser?.tenth_marks ?? 0);
    const twelfthDiplomaMarks = Number(currentUser?.twelfthDiplomaMarks ?? currentUser?.twelfth_diploma_marks ?? 0);
    const graduationPercentage = Number(currentUser?.graduationPercentage ?? currentUser?.graduation_percentage ?? 0);
    const backlogs = Number(currentUser?.backlogs ?? 0);

    const aptScore = sectionScores.aptitude.pct;
    const reasonScore = sectionScores.reasoning.pct;
    const techScore = sectionScores.technical.pct;
    const verbScore = sectionScores.verbal.pct;
    const codeScore = sectionScores.coding.pct;

    const calculatedOverall = displayResultMetrics.score;

    const normalizeCatKey = (c) => {
      const str = String(c || '').toLowerCase();
      if (str.includes('apt') || str.includes('quant')) return 'aptitude';
      if (str.includes('reason') || str.includes('logic')) return 'reasoning';
      if (str.includes('tech')) return 'technical';
      if (str.includes('verb') || str.includes('eng')) return 'verbal';
      if (str.includes('code') || str.includes('prog')) return 'coding';
      return 'technical';
    };

    const categories = {
      aptitude: {
        score: sectionScores.aptitude.obtained,
        maxScore: sectionScores.aptitude.total,
        pct: aptScore,
        topics: databaseTopics.filter(t => normalizeCatKey(t.category) === 'aptitude')
      },
      reasoning: {
        score: sectionScores.reasoning.obtained,
        maxScore: sectionScores.reasoning.total,
        pct: reasonScore,
        topics: databaseTopics.filter(t => normalizeCatKey(t.category) === 'reasoning')
      },
      technical: {
        score: sectionScores.technical.obtained,
        maxScore: sectionScores.technical.total,
        pct: techScore,
        topics: databaseTopics.filter(t => normalizeCatKey(t.category) === 'technical')
      },
      verbal: {
        score: sectionScores.verbal.obtained,
        maxScore: sectionScores.verbal.total,
        pct: verbScore,
        topics: databaseTopics.filter(t => normalizeCatKey(t.category) === 'verbal')
      },
      english: {
        score: sectionScores.verbal.obtained,
        maxScore: sectionScores.verbal.total,
        pct: verbScore,
        topics: databaseTopics.filter(t => normalizeCatKey(t.category) === 'verbal')
      },
      coding: {
        score: sectionScores.coding.obtained,
        maxScore: sectionScores.coding.total,
        pct: codeScore,
        topics: databaseTopics.filter(t => normalizeCatKey(t.category) === 'coding')
      },
    };

    const currentAttempt = {
      id: latestResult?.assessmentId || 'ATT-DB-VERIFIED',
      date: latestResult?.completedAt || new Date().toISOString().split('T')[0],
      totalScore: calculatedOverall,
      categories,
    };

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
      databaseTopics,
      examAttempts: [currentAttempt],
    };
  }, [currentUser, sectionScores, displayResultMetrics, databaseTopics, latestResult]);

  const sectionRefs = {
    results: useRef(null),
    concepts: useRef(null),
    interview: useRef(null),
    eligibility: useRef(null),
  };

  const handleNavigate = (section) => {
    setActiveSection(section);
    sectionRefs[section]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const tabs = [
    ...(latestResult ? [{ id: 'results', label: 'Test Results & Summary' }] : []),
    { id: 'concepts', label: 'Concept Analysis' },
    { id: 'interview', label: 'Interview Analysis' },
    { id: 'eligibility', label: 'Company Eligibility' },
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
                  {['Technical', 'Aptitude', 'Reasoning', 'Coding', 'Verbal'].map(cat => (
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

            {/* Quick Metrics (4 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  {(sectionScores.verbal.isSubmitted || sectionScores.verbal.total > 0 || selectedModuleFilter === 'Verbal') && (
                    <div className={`p-3 rounded-xl border space-y-1 transition-all ${selectedModuleFilter === 'Verbal' ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-400/30' : 'bg-slate-50 border-slate-100'}`}>
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

        <section ref={sectionRefs.concepts}>
          <ConceptAnalysis student={studentData} />
        </section>

        <hr className="border-slate-200/80" />

        <section ref={sectionRefs.interview}>
          <InterviewAnalysisSection />
        </section>

        <hr className="border-slate-200/80" />

        <section ref={sectionRefs.eligibility}>
          <CompanyEligibilitySection
            currentUser={currentUser}
            sectionScores={sectionScores}
            displayResultMetrics={displayResultMetrics}
            studentData={studentData}
          />
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
          score: displayResultMetrics.score ?? studentData.overallScore,
          totalMarks: displayResultMetrics.totalMarks,
          obtainedMarks: displayResultMetrics.obtainedMarks,
          accuracy: displayResultMetrics.accuracy ?? studentData.overallScore,
          correctCount: displayResultMetrics.correctCount ?? 0,
          incorrectCount: displayResultMetrics.incorrectCount ?? 0,
          unansweredCount: displayResultMetrics.unansweredCount ?? 0,
          totalQuestions: displayResultMetrics.totalQuestions ?? 20,
          timeTaken: displayResultMetrics.timeTaken || '28 min',
          completedAt: latestResult?.completedAt || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          assessmentName: displayResultMetrics.title || 'Comprehensive Job Readiness Assessment',
          categoryScores: studentData.categoryScores,
          sectionScores: sectionScores,
          distinctSubs: distinctSubs,
          topicBreakdown: latestResult?.topicBreakdown || studentData.topicBreakdown || []
        }}
        studentData={studentData}
        addToast={addToast}
      />
    </div>
  );
}
