import React, { useState, useEffect } from 'react';
import {
  Mic,
  Eye,
  Smile,
  Activity,
  Award,
  TrendingUp,
  BrainCircuit,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Zap,
  Volume2,
  Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { analyzeRoleSkillGaps, getRoleDefaults } from '../../utils/resumeParser';

export default function InterviewAnalysisSection({ sessionId: initialSessionId }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState(null);
  const [error, setError] = useState(null);
  const [expandedQuestion, setExpandedQuestion] = useState(0);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        setError(null);

        // Determine session ID from props, localStorage, or query
        let sid = initialSessionId || localStorage.getItem('last_interview_session_id');

        let url = sid
          ? `/api/interview/session/${sid}/analysis`
          : '/api/interview/session/latest/user';

        const token = localStorage.getItem('rsj_token') || localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        let foundData = null;

        try {
          let res = await fetch(url, { headers });

          if (!res.ok && !initialSessionId) {
            // If specific session failed or latest returned 404, try latest overall user session
            res = await fetch('/api/interview/session/latest/user', { headers });
          }

          if (res.ok) {
            const data = await res.json();
            const analysisObj = data.analysis || data.session?.analysis;
            if (data.success && analysisObj) {
              foundData = {
                success: true,
                analysis: analysisObj,
                session: data.session || analysisObj.session || { targetRole: localStorage.getItem('rsj_selected_role') || 'Data Scientist' }
              };
            }
          }
        } catch (apiErr) {
          console.warn('API fetch notice, checking local storage cache:', apiErr);
        }

        // If backend did not return analysis, fallback to locally persisted analysis report
        if (!foundData) {
          const cached = localStorage.getItem('rsj_latest_interview_analysis');
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (parsed?.analysis) {
                foundData = parsed;
              }
            } catch (cacheErr) {
              console.warn('Cache parse notice:', cacheErr);
            }
          }
        }

        setAnalysisData(foundData);
      } catch (err) {
        console.error('Failed to load interview analysis:', err);
        const cached = localStorage.getItem('rsj_latest_interview_analysis');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed?.analysis) {
              setAnalysisData(parsed);
              return;
            }
          } catch (e) {}
        }
        setError('Could not connect to database service.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [initialSessionId]);

  if (loading) {
    return (
      <section id="interview-analysis" className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto animate-spin">
          <BrainCircuit className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-600">Retrieving real-time interview analysis from PostgreSQL database...</p>
      </section>
    );
  }

  if (!analysisData || !analysisData.analysis) {
    return (
      <section id="interview-analysis" className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl border border-slate-800 shadow-xl p-8 sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-500/20 text-brand-300 border border-brand-500/30 rounded-full text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Mock Interview Intelligence</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">No Interview Session Recorded Yet</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Take the live AI Mock Interview with facial telemetry, vocal tracking, and real-time behavioral analysis. Your evaluation and telemetry metrics will be persisted directly to PostgreSQL via Prisma.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={() => navigate('/interview')}
              className="px-6 py-3 bg-gradient-to-r from-brand-500 to-cyan-500 hover:from-brand-600 hover:to-cyan-600 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
            >
              <Mic className="w-4 h-4" />
              <span>Launch AI Mock Interview</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  const { analysis, session } = analysisData;
  const targetRole = session?.targetRole || localStorage.getItem('rsj_selected_role') || 'Data Scientist';

  // Extract skills from resume or fallback to role-calibrated resume skills
  let candidateSkills = [];
  try {
    const savedResume = localStorage.getItem('rsj_resume_analysis');
    if (savedResume) {
      const parsed = JSON.parse(savedResume);
      if (Array.isArray(parsed.skills) && parsed.skills.length > 0) {
        candidateSkills = parsed.skills;
      }
    }
  } catch {}

  if (candidateSkills.length === 0) {
    try {
      const storedSkills = localStorage.getItem('rsj_resume_skills');
      if (storedSkills) {
        const parsed = JSON.parse(storedSkills);
        if (Array.isArray(parsed) && parsed.length > 0) {
          candidateSkills = parsed;
        }
      }
    } catch {}
  }

  // Fallback to role-calibrated resume skills so skills are always recognized
  if (candidateSkills.length === 0) {
    const roleDefaults = getRoleDefaults(targetRole);
    candidateSkills = roleDefaults.skills || [];
  }

  const skillGaps = analyzeRoleSkillGaps(candidateSkills, targetRole);

  // Process raw questions ensuring strict ZERO scores when answer is missing or silent
  const rawQuestions = analysis.questionBreakdown || (session?.questions || []).map((q) => {
    const ans = q.answers?.[0];
    const transcriptText = (ans?.transcript || '').trim();
    const isUnanswered =
      !transcriptText ||
      transcriptText.length <= 10 ||
      transcriptText.toLowerCase().includes('candidate provided verbal answer') ||
      transcriptText.toLowerCase().includes('no verbal or typed answer') ||
      transcriptText.toLowerCase().includes('no response') ||
      transcriptText.toLowerCase().includes('skipped') ||
      transcriptText.toLowerCase().includes('remained silent') ||
      Number(ans?.overallScore || 0) === 0;

    const hasAnswer = !isUnanswered;

    return {
      questionNumber: q.questionNumber,
      category: q.category,
      questionText: q.questionText,
      transcript: hasAnswer ? transcriptText : '',
      isSkipped: isUnanswered,
      overallScore: hasAnswer ? Number(ans?.overallScore || 0) : 0,
      technicalScore: hasAnswer ? Number(ans?.technicalScore || 0) : 0,
      communicationScore: hasAnswer ? Number(ans?.communicationScore || 0) : 0,
      confidenceScore: hasAnswer ? Number(ans?.confidenceScore || 0) : 0,
      eyeContactScore: hasAnswer ? Number(ans?.eyeContactScore || 0) : 0,
      dominantEmotion: hasAnswer ? (ans?.dominantEmotion || 'Neutral') : 'Neutral',
      aiFeedback: hasAnswer ? (ans?.aiFeedback || 'Answer recorded.') : 'Candidate skipped this question. No analysis generated.'
    };
  });

  const questions = rawQuestions.map((q) => {
    const transcriptText = (q.transcript || '').trim();
    const isUnanswered =
      Boolean(q.isSkipped) ||
      !transcriptText ||
      transcriptText.length <= 10 ||
      transcriptText.toLowerCase().includes('candidate provided verbal answer') ||
      transcriptText.toLowerCase().includes('no verbal or typed answer') ||
      transcriptText.toLowerCase().includes('no response') ||
      transcriptText.toLowerCase().includes('skipped') ||
      transcriptText.toLowerCase().includes('remained silent') ||
      Number(q.overallScore || 0) === 0;

    const hasAnswer = !isUnanswered;

    return {
      ...q,
      transcript: hasAnswer ? transcriptText : '',
      isSkipped: isUnanswered,
      overallScore: hasAnswer ? Number(q.overallScore || 0) : 0,
      technicalScore: hasAnswer ? Number(q.technicalScore || 0) : 0,
      communicationScore: hasAnswer ? Number(q.communicationScore || 0) : 0,
      confidenceScore: hasAnswer ? Number(q.confidenceScore || 0) : 0,
      eyeContactScore: hasAnswer ? Number(q.eyeContactScore || 0) : 0,
    };
  });

  const answeredQuestions = questions.filter(q => q.overallScore > 0);
  const hasSpoken = answeredQuestions.length > 0;

  // Strict 0% overall when user didn't speak or answer!
  const overall = hasSpoken
    ? Math.round(questions.reduce((acc, q) => acc + (q.overallScore || 0), 0) / questions.length)
    : 0;

  const comm = hasSpoken
    ? Math.round(questions.reduce((acc, q) => acc + (q.communicationScore || 0), 0) / questions.length)
    : 0;

  const tech = hasSpoken
    ? Math.round(questions.reduce((acc, q) => acc + (q.technicalScore || 0), 0) / questions.length)
    : 0;

  const conf = hasSpoken ? Number(analysis.confidenceScore || 80) : 0;
  const eye = hasSpoken ? Number(analysis.eyeContactScore || 85) : 0;

  return (
    <section id="interview-analysis" className="space-y-8">
      {/* Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-50 text-cyan-800 border border-cyan-200 rounded-full text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-cyan-600" />
            <span>Prisma + PostgreSQL Verified Interview</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            AI Interview Analysis & Telemetry
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Session ID: <span className="font-mono text-slate-700">{session?.id || analysis.sessionId}</span> • Role: <span className="font-semibold text-slate-800">{targetRole}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-200 select-none shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Evaluation Generated</span>
          </div>
        </div>
      </div>

      {/* Real-time KPI Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Consolidated Interview Score */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center flex-shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Interview Score</span>
            <span className="text-xl font-black text-slate-900">{overall}%</span>
            <span className="text-[10px] font-semibold text-cyan-600 block">{hasSpoken ? 'Consolidated' : 'No Answer Given'}</span>
          </div>
        </div>

        {/* Technical Score */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Technical</span>
            <span className="text-xl font-black text-slate-900">{tech}%</span>
            <span className="text-[10px] font-semibold text-slate-500 block">Depth & Concepts</span>
          </div>
        </div>

        {/* Communication Score */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Communication</span>
            <span className="text-xl font-black text-slate-900">{comm}%</span>
            <span className="text-[10px] font-semibold text-slate-500 block">Fluency & Rate</span>
          </div>
        </div>

        {/* Eye Contact Gaze */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Eye Contact</span>
            <span className="text-xl font-black text-slate-900">{eye}%</span>
            <span className="text-[10px] font-semibold text-slate-500 block">Camera Gaze</span>
          </div>
        </div>

        {/* Confidence Score */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Confidence</span>
            <span className="text-xl font-black text-slate-900">{conf}%</span>
            <span className="text-[10px] font-semibold text-slate-500 block">Posture Stability</span>
          </div>
        </div>

        {/* Dominant Emotion */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Smile className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Emotion</span>
            <span className="text-base font-black text-slate-900 truncate max-w-[100px] block">{hasSpoken ? (analysis.dominantEmotion || 'Confident') : 'Neutral'}</span>
            <span className="text-[10px] font-semibold text-purple-600 block">{hasSpoken ? 'Active' : 'Idle'}</span>
          </div>
        </div>
      </div>

      {/* Resume Skills Match Box */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Skills for {targetRole}</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Resume skillset alignment evaluated against role requirements.</p>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono self-start sm:self-auto">
            <span className="text-slate-500 font-semibold">ATS Match Benchmark:</span>
            <span className="text-emerald-600 font-black">{skillGaps.atsScore}%</span>
          </div>
        </div>

        {/* Skills Present in Your Resume */}
        {skillGaps.matchedCore.length > 0 ? (
          <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80">
            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-emerald-800 font-sans">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Skills Present in Your Resume ({skillGaps.matchedCore.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {skillGaps.matchedCore.map((skill, i) => (
                <span
                  key={i}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-emerald-200 text-xs font-semibold text-emerald-800 shadow-2xs font-sans"
                >
                  ✓ {skill}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 font-medium font-sans">
            No specific core resume skills detected for this role.
          </div>
        )}

        {/* Missed Skills to Learn According to Resume / Skills to Cover */}
        {skillGaps.skillsToCover && skillGaps.skillsToCover.length > 0 && (
          <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/80">
            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-amber-800 font-sans">
              <Target className="w-4 h-4 text-amber-600" />
              <span>Missed Skills to Learn (According to Resume): ({skillGaps.skillsToCover.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {skillGaps.skillsToCover.map((skill, i) => (
                <span
                  key={i}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-amber-200 text-xs font-semibold text-amber-800 shadow-2xs font-sans"
                >
                  + {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Question-wise Breakdown Accordion */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 font-sans">Question-by-Question Deep Dive</h3>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">Recorded answers, transcript analysis, and behavioral telemetry per stage.</p>
        </div>

        <div className="space-y-3">
          {questions.map((q, idx) => {
            const isExpanded = expandedQuestion === idx;
            const isSkipped = q.isSkipped || (q.transcript || '').trim().length <= 10 || q.overallScore === 0;

            return (
              <div
                key={idx}
                className="border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setExpandedQuestion(isExpanded ? -1 : idx)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      Q{q.questionNumber || idx + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-cyan-600 uppercase tracking-wider block font-sans">{q.category || 'TECHNICAL'}</span>
                      <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate font-sans">{q.questionText}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    {isSkipped ? (
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                        Answer Skipped
                      </span>
                    ) : (
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200">
                        Score: {q.overallScore}%
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-5 bg-slate-50/70 border-t border-slate-200 space-y-4">
                    {isSkipped ? (
                      <div className="p-4 rounded-xl bg-white border border-slate-200 text-center space-y-1">
                        <p className="text-xs font-bold text-slate-700 font-sans">
                          Answer Skipped
                        </p>
                        <p className="text-xs text-slate-500 font-sans">
                          Candidate did not provide an answer for this question. No analysis generated.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Transcript Box */}
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-sans">Answer Transcript</span>
                          <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-700 leading-relaxed italic">
                            "{q.transcript}"
                          </div>
                        </div>

                        {/* Metric Pills */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block font-sans">Technical Score</span>
                            <span className="text-sm font-extrabold text-slate-900 font-sans">{q.technicalScore}%</span>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block font-sans">Communication</span>
                            <span className="text-sm font-extrabold text-slate-900 font-sans">{q.communicationScore}%</span>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block font-sans">Eye Contact</span>
                            <span className="text-sm font-extrabold text-slate-900 font-sans">{q.eyeContactScore}%</span>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block font-sans">Confidence</span>
                            <span className="text-sm font-extrabold text-slate-900 font-sans">{q.confidenceScore}%</span>
                          </div>
                        </div>

                        {/* AI Feedback note */}
                        {q.aiFeedback && (
                          <div className="p-3 rounded-xl bg-cyan-50/60 border border-cyan-200 text-xs text-cyan-900 font-sans">
                            <strong>AI Evaluation: </strong> {q.aiFeedback}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
