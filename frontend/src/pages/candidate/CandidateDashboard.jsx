import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { INITIAL_ASSESSMENTS } from '../../data/mockData';
import { ScoreRing } from '../../components/common/ScoreRing';
import { AcademicMarksModal } from '../../components/candidate/AcademicMarksModal';
import { AssessmentReportModal } from '../../components/candidate/AssessmentReportModal';
import {
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  TrendingUp,
  Play,

  Award,
  ChevronRight,
  ClipboardCheck,
  BarChart2,
  Download
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const CandidateDashboard = () => {
  const {
    currentUser,
    assessments,
    startAssessment,
    navigateTo,
    addToast,
    recommendations,
    isAssessmentCompleted,
    candidateSubmissions,
    latestResult
  } = useApp();

  const [targetAsm, setTargetAsm] = useState(null);
  const [isAcademicModalOpen, setIsAcademicModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const handleStartAttempt = (asm) => {
    const isCompleted = isAssessmentCompleted?.(asm) || (candidateSubmissions || []).some(
      s => String(s.assessment_id || s.assessmentId || '').trim().toLowerCase() === String(asm?.id).trim().toLowerCase() ||
           (asm?.title && String(s.assessment_title || s.assessmentName || '').trim().toLowerCase() === String(asm.title).trim().toLowerCase())
    ) || asm?.status === 'Completed';

    if (isCompleted) {
      addToast('Single-Attempt Policy Active: You have already completed this assessment. Retakes are not allowed.', 'info');
      navigateTo('candidate-analytics');
      return;
    }
    setTargetAsm(asm);
    setIsAcademicModalOpen(true);
  };

  const handleProceedAssessment = async () => {
    setIsAcademicModalOpen(false);
    if (targetAsm) {
      await startAssessment(targetAsm.id);
    }
  };

  // Performance Trend Line Chart Data
  const trendData = {
    labels: ['Assessment 1', 'Assessment 2', 'Assessment 3', 'Assessment 4 (Latest)'],
    datasets: [
      {
        label: 'Job Readiness Score (%)',
        data: [62, 69, 74, 78],
        borderColor: '#0e8ce6',
        backgroundColor: 'rgba(14, 140, 230, 0.08)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#0e8ce6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }
    ]
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 10,
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12 },
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context) => `Score: ${context.parsed.y}%`
        }
      }
    },
    scales: {
      y: {
        min: 40,
        max: 100,
        grid: { color: '#f1f5f9' },
        ticks: {
          stepSize: 15,
          font: { size: 11, family: 'Inter' },
          color: '#64748b',
          callback: (val) => `${val}%`
        }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11, family: 'Inter' }, color: '#64748b' }
      }
    }
  };

  const inProgressAssessment = assessments.find(a => a.status === 'In Progress') || assessments[0];

  return (
    <div className="space-y-8 pb-12">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 rounded-3xl text-white p-6 sm:p-8 relative overflow-hidden shadow-lg">
        {/* Subtle Decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-brand-200 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>AI Evaluation Active • Class of {currentUser?.graduationYear || '2026'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {currentUser?.name || 'Candidate'}!
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Continue your journey toward becoming job-ready. Take standardized skill assessments and track your test progress.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="px-4 py-2.5 bg-brand-500 hover:bg-brand-400 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-500/30 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Official Report</span>
            </button>
            <button
              onClick={() => navigateTo('candidate-analytics')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
            >
              <Award className="w-4 h-4 text-brand-300" />
              <span>View Analytics</span>
            </button>
            <button
              onClick={() => navigateTo('assessments')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Assessments</span>
            </button>
          </div>
        </div>
      </div>

      {/* TOP SECTION: Overall Score & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Overall Job Readiness Score Card */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Primary Metric</span>
              <h3 className="text-base font-bold text-slate-900">Job Readiness Score</h3>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              {currentUser?.readinessStatus || 'Good Progress'}
            </span>
          </div>

          <div className="py-2">
            <ScoreRing score={currentUser?.jobReadinessScore || 78} maxScore={100} size={180} />
          </div>

          {/* Subscore Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-4 border-t border-slate-100 text-center">
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-600 block uppercase">Aptitude</span>
              <span className="text-base font-extrabold text-slate-900">{currentUser?.aptitudeScore ?? 0}%</span>
              <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-brand-500 h-full rounded-full" style={{ width: `${currentUser?.aptitudeScore ?? 0}%` }} />
              </div>
            </div>

            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-600 block uppercase">Reasoning</span>
              <span className="text-base font-extrabold text-slate-900">{currentUser?.reasoningScore ?? 0}%</span>
              <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: `${currentUser?.reasoningScore ?? 0}%` }} />
              </div>
            </div>

            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-600 block uppercase">Technical</span>
              <span className="text-base font-extrabold text-slate-900">{currentUser?.technicalScore ?? 0}%</span>
              <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${currentUser?.technicalScore ?? 0}%` }} />
              </div>
            </div>

            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-600 block uppercase">Verbal</span>
              <span className="text-base font-extrabold text-slate-900">{currentUser?.verbalScore ?? 0}%</span>
              <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${currentUser?.verbalScore ?? 0}%` }} />
              </div>
            </div>

            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-semibold text-slate-600 block uppercase">Coding</span>
              <span className="text-base font-extrabold text-slate-900">{currentUser?.codingScore ?? 0}%</span>
              <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${currentUser?.codingScore ?? 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Continue Assessment Active Card & Assessment Suite */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Continue Assessment Hero Card */}
          {inProgressAssessment ? (
            <div className="bg-gradient-to-br from-brand-500 to-brand-700 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-bold rounded-md uppercase tracking-wider">
                    Resume Ongoing Test
                  </span>
                  <h3 className="text-xl font-bold">{inProgressAssessment.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-brand-100 pt-1">
                    <span>Progress: <strong className="text-white">{inProgressAssessment.progress}%</strong></span>
                    <span>•</span>
                    <span>{inProgressAssessment.completedQuestions} / {inProgressAssessment.totalQuestions} completed</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Est. {inProgressAssessment.estimatedTimeMin} min
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleStartAttempt(inProgressAssessment)}
                  className="self-start sm:self-center px-5 py-2.5 bg-white text-brand-700 hover:bg-brand-50 rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center gap-2 group flex-shrink-0"
                >
                  <span>Continue Assessment</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-black/20 h-2 rounded-full mt-5 overflow-hidden">
                <div
                  className="bg-white h-full rounded-full transition-all duration-500"
                  style={{ width: `${inProgressAssessment.progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 text-center space-y-2">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider">Assessment Status</span>
              <h3 className="text-base font-bold text-slate-900">No Active Assessments</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">There are currently no active tests in progress. Published tests created by administrators will appear here.</p>
            </div>
          )}

          {/* Performance Summary Line Chart */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Score History</span>
                <h3 className="text-sm font-bold text-slate-900">Performance Growth Over Recent Tests</h3>
              </div>
              <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> +16% Growth
              </span>
            </div>
            <div className="h-44 w-full">
              <Line data={trendData} options={trendOptions} />
            </div>
          </div>

        </div>

      </div>

      {/* ASSESSMENT CARDS GRID */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Assessment Suite</h3>
            <p className="text-xs text-slate-500">Benchmark your skills across core engineering and reasoning dimensions.</p>
          </div>
          <button
            onClick={() => navigateTo('assessments')}
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 hover:underline"
          >
            View All Tests <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {(() => {
          const displayList = Array.isArray(assessments) ? assessments : [];
          return displayList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-8 text-center">
              <p className="text-xs text-slate-500 font-medium">No assessments currently published.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {displayList.slice(0, 4).map((asm) => {
              const userSub = (candidateSubmissions || []).find(s => {
                const sId = String(s.assessment_id || s.assessmentId || '').trim().toLowerCase();
                const aId = String(asm?.id || '').trim().toLowerCase();
                if (sId && aId && sId === aId) return true;
                const sTitle = String(s.assessment_title || s.assessmentName || '').trim().toLowerCase();
                const aTitle = String(asm?.title || '').trim().toLowerCase();
                if (sTitle && aTitle && sTitle === aTitle) return true;
                return false;
              });
              const isCompleted = !!userSub || isAssessmentCompleted?.(asm) || asm.status === 'Completed';
              const isInProgress = !isCompleted && asm.status === 'In Progress';
              const displayScore = userSub?.score ?? asm.lastScore ?? asm.score ?? 0;
              const obtainedMarks = userSub?.obtained_marks ?? userSub?.obtainedMarks;
              const totalMarks = userSub?.total_marks ?? userSub?.totalMarks ?? asm.total_marks ?? asm.totalMarks ?? 40;

              return (
                <div
                  key={asm.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-5 flex flex-col justify-between hover:border-brand-300 transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase">
                        {asm.category}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isInProgress
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-brand-50 text-brand-700 border border-brand-200'
                      }`}>
                        {isCompleted ? (obtainedMarks != null ? `Completed • ${obtainedMarks}/${totalMarks} Marks (${displayScore}%)` : `Completed • ${displayScore}%`) : isInProgress ? 'In Progress' : 'Available'}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                      {asm.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {asm.description}
                    </p>

                    <div className="grid grid-cols-3 gap-1 my-4 p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs">
                      <div className="px-1">
                        <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-tight">Difficulty</span>
                        <strong className="text-slate-800 font-bold block mt-0.5">{asm.difficulty || 'Medium'}</strong>
                      </div>
                      <div className="px-1 border-x border-slate-200/60">
                        <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-tight">Questions</span>
                        <strong className="text-slate-800 font-bold block mt-0.5">{asm.totalQuestions || asm.total_questions || (asm.category === 'Coding' ? 4 : 10)} Qs</strong>
                      </div>
                      <div className="px-1">
                        <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-tight">Duration</span>
                        <strong className="text-slate-800 font-bold block mt-0.5">{asm.durationMinutes || asm.duration_minutes || 10}m</strong>
                      </div>
                    </div>
                  </div>

                  <div>
                    {isCompleted ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigateTo('candidate-analytics')}
                          className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-xs"
                          title="Single-Attempt Policy Active: View your final score & analysis"
                        >
                          <BarChart2 className="w-3.5 h-3.5" />
                          <span>View Result & Analysis</span>
                        </button>
                        <div
                          className="py-2 px-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-1 border border-emerald-200 cursor-not-allowed select-none"
                          title="Assessment completed (1 attempt limit)"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                      </div>
                    ) : isInProgress ? (
                      <button
                        onClick={() => handleStartAttempt(asm)}
                        className="w-full py-2 px-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Continue</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartAttempt(asm)}
                        className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Start Assessment</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}
      </div>

      {/* Academic Marks Modal */}
      <AcademicMarksModal
        isOpen={isAcademicModalOpen}
        onClose={() => setIsAcademicModalOpen(false)}
        onProceed={handleProceedAssessment}
        assessmentTitle={targetAsm?.title}
      />

      {/* Official Assessment & Job Readiness Report Modal */}
      <AssessmentReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        candidate={currentUser}
        result={{
          ...latestResult,
          score: currentUser?.jobReadinessScore || latestResult?.score || 0,
          accuracy: currentUser?.jobReadinessScore || latestResult?.accuracy || 0,
          categoryScores: {
            aptitude: currentUser?.aptitudeScore ?? 0,
            reasoning: currentUser?.reasoningScore ?? 0,
            technical: currentUser?.technicalScore ?? 0,
            verbal: currentUser?.verbalScore ?? 0,
            coding: currentUser?.codingScore ?? 0
          }
        }}
        studentData={{
          ...currentUser,
          overallScore: currentUser?.jobReadinessScore || 0,
          categoryScores: {
            aptitude: currentUser?.aptitudeScore ?? 0,
            reasoning: currentUser?.reasoningScore ?? 0,
            technical: currentUser?.technicalScore ?? 0,
            verbal: currentUser?.verbalScore ?? 0,
            coding: currentUser?.codingScore ?? 0
          }
        }}
        addToast={addToast}
      />

    </div>
  );
};
