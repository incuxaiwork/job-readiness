import React from 'react';
import { COLORS } from '../../data/analyticsData';
import ScoreRadar from './ScoreRadar';
import { BookOpen, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';

export default function ConceptAnalysis({ student }) {
  const latestAttempt = student?.examAttempts?.[student.examAttempts.length - 1];
  const dbTopics = student?.databaseTopics || [];

  const categories = [
    { key: 'aptitude', label: 'Aptitude', color: COLORS.aptitude },
    { key: 'reasoning', label: 'Reasoning', color: COLORS.reasoning },
    { key: 'technical', label: 'Technical', color: COLORS.technical },
    { key: 'verbal', fallbackKey: 'english', label: 'Verbal', color: COLORS.verbal || COLORS.english },
    { key: 'coding', label: 'Coding', color: COLORS.coding || '#6366F1' },
  ];

  return (
    <section id="concepts" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Concept Analysis</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified topic-level understanding and multi-pillar competency evaluated from your assessment submissions.
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1 bg-brand-50 text-brand-700 rounded-full border border-brand-200 self-start sm:self-auto">
          {dbTopics.length} Concepts Assessed
        </span>
      </div>

      {/* Radar Chart */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6">
        <div className="max-w-2xl mx-auto w-full">
          <ScoreRadar
            title="Performance Radar (Verified Module Scores)"
            labels={categories.map((c) => c.label)}
            datasets={[
              {
                label: 'Your Score',
                data: categories.map((c) => {
                  const catData = latestAttempt?.categories?.[c.key] || (c.fallbackKey ? latestAttempt?.categories?.[c.fallbackKey] : null);
                  if (typeof catData?.pct === 'number') return catData.pct;
                  const max = Number(catData?.maxScore) > 0 ? Number(catData.maxScore) : 1;
                  const scorePct = Math.min(100, Math.max(0, Math.round((Number(catData?.score || 0) / max) * 100)));
                  if (scorePct > 0) return scorePct;
                  return student?.categoryScores?.[c.key] ?? student?.[`${c.key}Score`] ?? 0;
                }),
                color: '#3B82F6',
                filled: true,
              },
              {
                label: 'Benchmark Target (80%)',
                data: categories.map(() => 80),
                color: '#EF4444',
                filled: false,
              },
            ]}
          />
        </div>
      </div>

      {/* Verified Concept & Topic Mastery Breakdown */}
      {dbTopics.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Database Records</span>
              <h3 className="text-base font-bold text-slate-900">Topic-Level Concept Mastery</h3>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {dbTopics.length} Verified Topics
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dbTopics.map((topicItem, idx) => {
              const pct = typeof topicItem.percent === 'number' ? topicItem.percent : (topicItem.maxScore > 0 ? Math.round((topicItem.score / topicItem.maxScore) * 100) : 0);
              const isMastered = pct >= 80;
              const isModerate = pct >= 50 && pct < 80;

              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-slate-200 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200/80 uppercase tracking-tight">
                          {topicItem.category}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isMastered ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : isModerate ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                          {isMastered ? 'Mastered' : isModerate ? 'Developing' : 'Needs Practice'}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 mt-1">
                        {topicItem.topic || topicItem.name}
                      </h4>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-base font-black text-slate-900">{pct}%</span>
                      <span className="block text-[10px] font-semibold text-slate-500">
                        {topicItem.obtainedMarks ?? topicItem.score} / {topicItem.totalMarks ?? topicItem.maxScore} Marks
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isMastered ? 'bg-emerald-500' : isModerate ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-8 text-center space-y-3">
          <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Assessment Concepts Assessed Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Take assessments to generate verified topic-level concept mastery analysis across Technical, Aptitude, Reasoning, Verbal, and Coding pillars.
          </p>
        </div>
      )}
    </section>
  );
}
