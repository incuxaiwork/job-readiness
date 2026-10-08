import React from 'react';
import { COLORS } from '../../data/analyticsData';
import ScoreRadar from './ScoreRadar';

export default function ConceptAnalysis({ student }) {
  const latestAttempt = student.examAttempts[student.examAttempts.length - 1];
  if (!latestAttempt) return null;

  const categories = [
    { key: 'aptitude', label: 'Aptitude', color: COLORS.aptitude },
    { key: 'reasoning', label: 'Reasoning', color: COLORS.reasoning },
    { key: 'technical', label: 'Technical', color: COLORS.technical },
    { key: 'verbal', fallbackKey: 'english', label: 'Verbal', color: COLORS.verbal || COLORS.english },
    { key: 'coding', label: 'Coding', color: COLORS.coding || '#6366F1' },
  ];

  const allTopics = [];

  categories.forEach((cat) => {
    const catData = latestAttempt.categories[cat.key] || (cat.fallbackKey ? latestAttempt.categories[cat.fallbackKey] : null);
    if (!catData || !Array.isArray(catData.topics)) return;
    catData.topics.forEach((topic) => {
      const maxScore = Number(topic.maxScore) > 0 ? Number(topic.maxScore) : 1;
      const score = Number(topic.score || 0);
      const percent = Math.min(100, Math.max(0, Math.round((score / maxScore) * 100)));
      allTopics.push({
        category: cat.label,
        topic: topic.name,
        score,
        maxScore,
        percent,
      });
    });
  });

  const strengths = allTopics.filter((t) => t.percent >= 80);
  const weaknesses = allTopics.filter((t) => t.percent < 60).sort((a, b) => a.percent - b.percent);
  const needsWork = allTopics.filter((t) => t.percent >= 60 && t.percent < 80);

  return (
    <section id="concepts" className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Concept Analysis</h2>

      {/* Radar Chart */}
      <div className="max-w-2xl mx-auto w-full">
        <ScoreRadar
          title="Performance Radar"
          labels={categories.map((c) => c.label)}
          datasets={[
            {
              label: 'Your Score',
              data: categories.map((c) => {
                const catData = latestAttempt.categories[c.key] || (c.fallbackKey ? latestAttempt.categories[c.fallbackKey] : null);
                const max = Number(catData?.maxScore) > 0 ? Number(catData.maxScore) : 25;
                const scorePct = Math.min(100, Math.max(0, Math.round((Number(catData?.score || 0) / max) * 100)));
                if (scorePct > 0) return scorePct;
                return student.categoryScores?.[c.key] ?? student[`${c.key}Score`] ?? 0;
              }),
              color: '#3B82F6',
              filled: true,
            },
            {
              label: 'Target (80%)',
              data: categories.map(() => 80),
              color: '#EF4444',
              filled: false,
            },
          ]}
        />
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Strengths */}
        <div className="bg-emerald-50/70 rounded-2xl p-5 border border-emerald-100">
          <h3 className="text-base font-bold text-emerald-900 mb-3 flex items-center gap-2">
            <span className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">✓</span>
            Strengths (≥ 80%)
          </h3>
          {strengths.length > 0 ? (
            <div className="space-y-2">
              {strengths.map((t, i) => (
                <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-emerald-100 shadow-xs">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{t.topic}</p>
                    <p className="text-[10px] text-slate-500">{t.category} • {t.score}/{t.maxScore} marks</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">{t.percent}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-emerald-600 italic">Keep practicing to build strengths!</p>
          )}
        </div>

        {/* Needs Improvement */}
        <div className="bg-amber-50/70 rounded-2xl p-5 border border-amber-100">
          <h3 className="text-base font-bold text-amber-900 mb-3 flex items-center gap-2">
            <span className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold">!</span>
            Needs Work (60% - 79%)
          </h3>
          {needsWork.length > 0 ? (
            <div className="space-y-2">
              {needsWork.map((t, i) => (
                <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-amber-100 shadow-xs">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{t.topic}</p>
                    <p className="text-[10px] text-slate-500">{t.category} • {t.score}/{t.maxScore} marks</p>
                  </div>
                  <span className="text-xs font-bold text-amber-600">{t.percent}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-amber-600">Great job! No topics in this range.</p>
          )}
        </div>

        {/* Weaknesses */}
        <div className="bg-rose-50/70 rounded-2xl p-5 border border-rose-100">
          <h3 className="text-base font-bold text-rose-900 mb-3 flex items-center gap-2">
            <span className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-white text-xs font-bold">✗</span>
            Weak Areas (&lt; 60%)
          </h3>
          {weaknesses.length > 0 ? (
            <div className="space-y-2">
              {weaknesses.map((t, i) => (
                <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-rose-100 shadow-xs">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{t.topic}</p>
                    <p className="text-[10px] text-slate-500">{t.category} • {t.score}/{t.maxScore} marks</p>
                  </div>
                  <span className="text-xs font-bold text-rose-600">{t.percent}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-rose-600">No weak areas detected!</p>
          )}
        </div>
      </div>
    </section>
  );
}
