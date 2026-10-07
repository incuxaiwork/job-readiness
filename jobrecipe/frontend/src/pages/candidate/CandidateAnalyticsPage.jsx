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
  const { currentUser, latestResult, startAssessment, addToast } = useApp();
  const [activeSection, setActiveSection] = useState(latestResult ? 'results' : 'overview');
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

  // Build dynamic candidate analytics profile from their real assessment submissions
  const studentData = React.useMemo(() => {
    const defaultData = { ...mockStudent };
    const name = currentUser?.name || mockStudent.name;
    const email = currentUser?.email || mockStudent.email;

    // Academic marks from candidate profile
    const tenthMarks = currentUser?.tenthMarks ?? currentUser?.tenth_marks ?? 0;
    const twelfthDiplomaMarks = currentUser?.twelfthDiplomaMarks ?? currentUser?.twelfth_diploma_marks ?? 0;
    const graduationPercentage = currentUser?.graduationPercentage ?? currentUser?.graduation_percentage ?? 0;
    const backlogs = currentUser?.backlogs ?? 0;

    if (!latestResult) {
      return {
        ...defaultData,
        name,
        email,
        tenthMarks,
        twelfthDiplomaMarks,
        graduationPercentage,
        backlogs,
        overallScore: Number(currentUser?.jobReadinessScore ?? defaultData.overallScore),
        jobReadinessScore: Number(currentUser?.jobReadinessScore ?? defaultData.overallScore),
        categoryScores: {
          aptitude: Number(currentUser?.aptitudeScore ?? 0),
          reasoning: Number(currentUser?.reasoningScore ?? 0),
          technical: Number(currentUser?.technicalScore ?? 0),
          verbal: Number(currentUser?.verbalScore ?? 0),
          coding: Number(currentUser?.codingScore ?? 0),
        },
      };
    }

    // Determine actual score from latest test submission
    const score = Number(latestResult.score ?? currentUser?.jobReadinessScore ?? defaultData.overallScore);

    // Estimate percentile and rank dynamically based on score
    const percentile = Math.min(99, Math.max(15, Math.round(score * 0.95 + 10)));
    const totalStudents = 280;
    const rank = Math.max(1, Math.round(totalStudents * (1 - percentile / 100)));

    // Categorize topic breakdown from DB submission
    const catScores = latestResult.categoryScores || {};
    const topics = Array.isArray(latestResult.topicBreakdown) ? latestResult.topicBreakdown : [];

    // Group topics by category
    const categorizedTopics = {
      aptitude: [],
      reasoning: [],
      technical: [],
      verbal: [],
      english: [],
      coding: [],
    };

    topics.forEach((t) => {
      const catKey = (t.category || '').toLowerCase().trim();
      const topicItem = {
        name: t.topic || 'General',
        score: Number(t.obtainedMarks ?? (t.score != null ? Math.round((t.score / 100) * (t.totalMarks || 5)) : 0)),
        maxScore: Number(t.totalMarks ?? 5) > 0 ? Number(t.totalMarks ?? 5) : 5,
        percent: t.score != null ? Math.round(t.score) : 0,
        correctCount: t.correctCount ?? 0,
        totalQuestions: t.totalQuestions ?? 0,
      };

      if (catKey.includes('code') || catKey.includes('prog')) {
        categorizedTopics.coding.push(topicItem);
      } else if (catKey.includes('apt') || catKey.includes('quant') || catKey.includes('math')) {
        categorizedTopics.aptitude.push(topicItem);
      } else if (catKey.includes('reason') || catKey.includes('logic')) {
        categorizedTopics.reasoning.push(topicItem);
      } else if (catKey.includes('verbal') || catKey.includes('eng')) {
        categorizedTopics.verbal.push(topicItem);
        categorizedTopics.english.push(topicItem);
      } else {
        categorizedTopics.technical.push(topicItem);
      }
    });

    const fallbackAttempts = defaultData.examAttempts[defaultData.examAttempts.length - 1]?.categories || {};

    const buildCategory = (key, defaultFallback) => {
      const customTopics = categorizedTopics[key] || [];
      if (customTopics.length > 0) {
        const totalCatScore = customTopics.reduce((s, item) => s + item.score, 0);
        const totalCatMax = customTopics.reduce((s, item) => s + item.maxScore, 0);
        return {
          score: totalCatScore,
          maxScore: totalCatMax > 0 ? totalCatMax : 25,
          topics: customTopics,
        };
      }

      // If the candidate's assessment had topics in another category, only use fallback if no assessment was taken at all
      if (topics.length > 0) {
        return {
          score: 0,
          maxScore: 0,
          topics: [],
        };
      }

      // If no assessment has been taken yet, use mock fallback
      const pct = catScores[key] ?? catScores[key === 'verbal' ? 'english' : (key === 'english' ? 'verbal' : key)] ?? (key === 'technical' ? score : (currentUser?.[`${key}Score`] ?? 0));
      const maxScore = defaultFallback?.maxScore || 25;
      const calcScore = Math.round((pct / 100) * maxScore);
      return {
        score: calcScore,
        maxScore: maxScore,
        topics: defaultFallback?.topics || [],
      };
    };

    const categories = {
      aptitude: buildCategory('aptitude', fallbackAttempts.aptitude || { score: 0, maxScore: 25, topics: [] }),
      reasoning: buildCategory('reasoning', fallbackAttempts.reasoning || { score: 0, maxScore: 25, topics: [] }),
      technical: buildCategory('technical', fallbackAttempts.technical || { score: 0, maxScore: 25, topics: [] }),
      english: buildCategory('english', fallbackAttempts.english || { score: 0, maxScore: 25, topics: [] }),
      verbal: buildCategory('verbal', fallbackAttempts.english || { score: 0, maxScore: 25, topics: [] }),
      coding: buildCategory('coding', fallbackAttempts.coding || { score: 0, maxScore: 25, topics: [] }),
    };

    const currentAttempt = {
      id: latestResult.assessmentId || 'ATT-LATEST',
      date: latestResult.completedAt || new Date().toISOString().split('T')[0],
      totalScore: score,
      categories,
    };

    // Keep history attempts but update the latest attempt with authoritative database results
    const prevAttempts = defaultData.examAttempts.slice(0, -1);

    return {
      ...defaultData,
      name,
      email,
      tenthMarks,
      twelfthDiplomaMarks,
      graduationPercentage,
      backlogs,
      overallScore: score,
      jobReadinessScore: score,
      categoryScores: {
        aptitude: Number(catScores.aptitude ?? currentUser?.aptitudeScore ?? 0),
        reasoning: Number(catScores.reasoning ?? currentUser?.reasoningScore ?? 0),
        technical: Number(catScores.technical ?? currentUser?.technicalScore ?? 0),
        verbal: Number(catScores.verbal ?? catScores.english ?? currentUser?.verbalScore ?? 0),
        coding: Number(catScores.coding ?? currentUser?.codingScore ?? 0),
      },
      percentile,
      rank,
      examAttempts: [...prevAttempts, currentAttempt],
    };
  }, [currentUser, latestResult]);

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

        {/* LATEST ASSESSMENT RESULTS & ACCURATE SECTION MARKS */}
        {latestResult && (
          <section ref={sectionRefs.results} className="space-y-6">
            {/* Assessment Header Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Assessment Completed & Verified</span>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {latestResult.assessmentName || 'Assessment'} Results
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 transition-all flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Official Report (PDF)</span>
                </button>

                <div className="px-3.5 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-200 select-none shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Attempt Complete (1 of 1 Attempt Used)</span>
                </div>
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
                    <span className="text-2xl font-black text-slate-900">{latestResult.score}%</span>
                    <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                      {latestResult.obtainedMarks != null && latestResult.totalMarks != null
                        ? `${latestResult.obtainedMarks} / ${latestResult.totalMarks} Marks`
                        : `${latestResult.correctCount} / ${latestResult.totalQuestions} Qs`}
                    </span>
                  </div>
                  <span className="block text-xs font-semibold text-slate-600 mt-0.5">
                    {latestResult.obtainedMarks != null && latestResult.totalMarks != null
                      ? `Marks: ${latestResult.obtainedMarks} out of ${latestResult.totalMarks}`
                      : `${latestResult.correctCount} of ${latestResult.totalQuestions} Questions`}
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
                  <span className="text-2xl font-black text-slate-900">{latestResult.accuracy}%</span>
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
                  <span className="text-2xl font-black text-emerald-600">{latestResult.correctCount} Qs</span>
                  <span className="block text-[11px] text-slate-400 font-medium">Out of {latestResult.totalQuestions || 10}</span>
                </div>
              </div>

              {/* Incorrect */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-card flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Incorrect</span>
                  <span className="text-2xl font-black text-rose-600">{latestResult.incorrectCount} Qs</span>
                  <span className="block text-[11px] text-slate-400 font-medium">{latestResult.unansweredCount || 0} unanswered</span>
                </div>
              </div>

              {/* Time Taken */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-card flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Time Taken</span>
                  <span className="text-2xl font-black text-slate-900">{latestResult.timeTaken || '28 min'}</span>
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
                  <ScoreRing score={latestResult.score} maxScore={100} size={190} />
                </div>

                <div className="md:col-span-8 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Section Score Breakdown</h4>

                  {/* Aptitude */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">Aptitude</span>
                      <span className="text-blue-600">
                        {Math.round(((latestResult.categoryScores?.aptitude ?? 0) / 100) * 40)} / 40 Marks ({latestResult.categoryScores?.aptitude ?? 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${latestResult.categoryScores?.aptitude ?? 0}%` }} />
                    </div>
                  </div>

                  {/* Reasoning */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">Reasoning</span>
                      <span className="text-emerald-600">
                        {Math.round(((latestResult.categoryScores?.reasoning ?? 0) / 100) * 40)} / 40 Marks ({latestResult.categoryScores?.reasoning ?? 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${latestResult.categoryScores?.reasoning ?? 0}%` }} />
                    </div>
                  </div>

                  {/* Technical */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">Technical</span>
                      <span className="text-amber-600">
                        {Math.round(((latestResult.categoryScores?.technical ?? 0) / 100) * 40)} / 40 Marks ({latestResult.categoryScores?.technical ?? 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${latestResult.categoryScores?.technical ?? 0}%` }} />
                    </div>
                  </div>

                  {/* Verbal */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">Verbal</span>
                      <span className="text-purple-600">
                        {Math.round(((latestResult.categoryScores?.verbal ?? latestResult.categoryScores?.english ?? 0) / 100) * 40)} / 40 Marks ({latestResult.categoryScores?.verbal ?? latestResult.categoryScores?.english ?? 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${latestResult.categoryScores?.verbal ?? latestResult.categoryScores?.english ?? 0}%` }} />
                    </div>
                  </div>

                  {/* Coding */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800 flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Coding</span>
                      </span>
                      <span className="text-indigo-600">
                        {Math.round(((latestResult.categoryScores?.coding ?? currentUser?.codingScore ?? 0) / 100) * 40)} / 40 Marks ({latestResult.categoryScores?.coding ?? currentUser?.codingScore ?? 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${latestResult.categoryScores?.coding ?? currentUser?.codingScore ?? 0}%` }} />
                    </div>
                  </div>
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
        result={latestResult || {
          score: studentData.overallScore,
          totalMarks: 100,
          obtainedMarks: studentData.overallScore,
          accuracy: studentData.overallScore,
          correctCount: Math.round((studentData.overallScore / 100) * 20),
          incorrectCount: 20 - Math.round((studentData.overallScore / 100) * 20),
          unansweredCount: 0,
          totalQuestions: 20,
          timeTaken: '28 min',
          completedAt: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          assessmentName: 'Comprehensive Job Readiness Assessment',
          categoryScores: studentData.categoryScores,
          topicBreakdown: studentData.examAttempts?.[studentData.examAttempts.length - 1]?.categories?.technical?.topics || []
        }}
        studentData={studentData}
        addToast={addToast}
      />
    </div>
  );
}
