import React, { useMemo } from 'react';

export default function ImprovementRoadmap({ student }) {
  const improvements = useMemo(() => {
    const dbTopics = student?.databaseTopics || [];
    if (dbTopics.length > 0) {
      return dbTopics.map((t) => {
        const pct = typeof t.percent === 'number' ? t.percent : (t.maxScore > 0 ? Math.round((t.score / t.maxScore) * 100) : 0);
        let priority = 'low';
        let estimatedHours = 2;

        if (pct < 50) {
          priority = 'high';
          estimatedHours = 6;
        } else if (pct < 70) {
          priority = 'medium';
          estimatedHours = 3;
        }

        return {
          category: t.category || 'General',
          topic: t.topic || t.name,
          currentScore: t.obtainedMarks ?? t.score ?? 0,
          maxScore: t.totalMarks ?? t.maxScore ?? 1,
          percent: pct,
          priority,
          estimatedHours,
        };
      }).sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return a.percent - b.percent;
      });
    }

    return [];
  }, [student]);

  const highPriority = improvements.filter((a) => a.priority === 'high');
  const mediumPriority = improvements.filter((a) => a.priority === 'medium');
  const lowPriority = improvements.filter((a) => a.priority === 'low');
  const totalHours = improvements.reduce((sum, a) => sum + a.estimatedHours, 0);

  return (
    <section id="roadmap" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Improvement Roadmap</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Personalized study priorities generated from your verified assessment marks &amp; topics.
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1 bg-brand-50 text-brand-700 rounded-full border border-brand-200 self-start sm:self-auto">
          {improvements.length} Topics Analyzed
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-5 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-90">High Priority Topics</p>
          <p className="text-3xl font-black mt-1">{highPriority.length}</p>
          <p className="text-xs opacity-80 mt-1">Scored under 50% — Urgent review</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-90">Medium Priority</p>
          <p className="text-3xl font-black mt-1">{mediumPriority.length}</p>
          <p className="text-xs opacity-80 mt-1">Scored 50% - 69% — Practice recommended</p>
        </div>
        <div className="bg-gradient-to-br from-brand-500 to-indigo-600 rounded-2xl p-5 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-90">Est. Study Hours</p>
          <p className="text-3xl font-black mt-1">{totalHours}h</p>
          <p className="text-xs opacity-80 mt-1">Target preparation time for mastery</p>
        </div>
      </div>

      {/* Topic-wise Priority List */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-200/90">
        <h3 className="text-base font-bold text-slate-800 mb-4">Priority-wise Study Plan</h3>

        {highPriority.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-extrabold text-rose-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              High Priority — Start Here (&lt; 50%)
            </h4>
            <div className="space-y-2">
              {highPriority.map((item, i) => (
                <TopicRow key={i} item={item} bgColor="bg-rose-50/70" borderColor="border-rose-100" />
              ))}
            </div>
          </div>
        )}

        {mediumPriority.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-extrabold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Medium Priority (50% - 69%)
            </h4>
            <div className="space-y-2">
              {mediumPriority.map((item, i) => (
                <TopicRow key={i} item={item} bgColor="bg-amber-50/70" borderColor="border-amber-100" />
              ))}
            </div>
          </div>
        )}

        {lowPriority.length > 0 && (
          <div>
            <h4 className="text-xs font-extrabold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Mastered &amp; Review (&ge; 70%)
            </h4>
            <div className="space-y-2">
              {lowPriority.map((item, i) => (
                <TopicRow key={i} item={item} bgColor="bg-emerald-50/70" borderColor="border-emerald-100" />
              ))}
            </div>
          </div>
        )}

        {improvements.length === 0 && (
          <p className="text-xs text-slate-500 italic py-4 text-center">
            No topic test data found. Complete modules to populate your personalized roadmap.
          </p>
        )}
      </div>
    </section>
  );
}

function TopicRow({ item, bgColor, borderColor }) {
  const percent = item.percent ?? (item.maxScore > 0 ? Math.round((item.currentScore / item.maxScore) * 100) : 0);

  return (
    <div className={`flex items-center justify-between ${bgColor} rounded-xl px-4 py-3 border ${borderColor}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-xs font-black text-slate-800 shadow-xs border border-slate-200/60">
          {percent}%
        </div>
        <div>
          <p className="text-xs font-bold text-slate-800">{item.topic}</p>
          <p className="text-[10px] text-slate-500 font-medium">
            {item.category} • {item.currentScore} / {item.maxScore} Marks
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs font-bold text-slate-700">{item.estimatedHours}h study needed</p>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${percent >= 70 ? 'bg-emerald-100 text-emerald-700' : percent >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
          {percent >= 70 ? 'Mastered' : percent >= 50 ? 'Moderate' : 'Needs Practice'}
        </span>
      </div>
    </div>
  );
}
