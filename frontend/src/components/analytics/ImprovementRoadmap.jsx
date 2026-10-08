import React, { useMemo } from 'react';
import { computeImprovements, mockCompanies, COLORS } from '../../data/analyticsData';
import GroupedBarChart from './GroupedBarChart';

export default function ImprovementRoadmap({ student }) {
  const improvements = useMemo(() => computeImprovements(student), [student]);
  const latestAttempt = student.examAttempts[student.examAttempts.length - 1];
  if (!latestAttempt) return null;

  const dreamCompanies = mockCompanies.filter((c) => c.tier === 'dream' || c.tier === 'super_dream');
  const lowestDream = dreamCompanies.reduce(
    (min, c) => (c.cutoffScore < min.cutoffScore ? c : min),
    dreamCompanies[0]
  );

  const highPriority = improvements.filter((a) => a.priority === 'high');
  const mediumPriority = improvements.filter((a) => a.priority === 'medium');
  const totalHours = improvements.reduce((sum, a) => sum + a.estimatedHours, 0);

  const categoryKeys = [
    { key: 'aptitude', label: 'Aptitude' },
    { key: 'reasoning', label: 'Reasoning' },
    { key: 'technical', label: 'Technical' },
    { key: 'verbal', fallbackKey: 'english', label: 'Verbal' },
    { key: 'coding', label: 'Coding' },
  ];
  const currentPercents = categoryKeys.map((c) => {
    const cat = latestAttempt.categories?.[c.key] || (c.fallbackKey ? latestAttempt.categories?.[c.fallbackKey] : null);
    const max = Number(cat?.maxScore) > 0 ? Number(cat.maxScore) : 1;
    return Math.min(100, Math.max(0, Math.round((Number(cat?.score || 0) / max) * 100)));
  });
  const targetPercents = categoryKeys.map((c) => lowestDream?.categories[c.key] ?? lowestDream?.categories[c.fallbackKey] ?? 80);

  return (
    <section id="roadmap" className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Improvement Roadmap</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-5 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-90">High Priority Topics</p>
          <p className="text-3xl font-black mt-1">{highPriority.length}</p>
          <p className="text-xs opacity-80 mt-1">Need immediate attention</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-90">Medium Priority</p>
          <p className="text-3xl font-black mt-1">{mediumPriority.length}</p>
          <p className="text-xs opacity-80 mt-1">Moderate improvement needed</p>
        </div>
        <div className="bg-gradient-to-br from-brand-500 to-indigo-600 rounded-2xl p-5 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-90">Est. Study Hours</p>
          <p className="text-3xl font-black mt-1">{totalHours}h</p>
          <p className="text-xs opacity-80 mt-1">To reach dream company level</p>
        </div>
      </div>

      {/* Current vs Target Chart */}
      {lowestDream && (
        <GroupedBarChart
          title={`Current Score vs ${lowestDream.name} Requirement`}
          labels={categoryKeys.map(c => c.label)}
          datasets={[
            { label: 'Your Score', data: currentPercents, color: COLORS.aptitude },
            { label: `${lowestDream.name} Cutoff`, data: targetPercents, color: '#EF4444' },
          ]}
        />
      )}

      {/* Topic-wise Priority List */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-200/90">
        <h3 className="text-base font-bold text-slate-800 mb-4">Priority-wise Study Plan</h3>

        {highPriority.length > 0 && (
          <div className="mb-5">
            <h4 className="text-xs font-extrabold text-rose-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              High Priority — Start Here
            </h4>
            <div className="space-y-2">
              {highPriority.map((item, i) => (
                <TopicRow key={i} item={item} bgColor="bg-rose-50/70" borderColor="border-rose-100" />
              ))}
            </div>
          </div>
        )}

        {mediumPriority.length > 0 && (
          <div className="mb-5">
            <h4 className="text-xs font-extrabold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Medium Priority
            </h4>
            <div className="space-y-2">
              {mediumPriority.map((item, i) => (
                <TopicRow key={i} item={item} bgColor="bg-amber-50/70" borderColor="border-amber-100" />
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-xs font-extrabold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Low Priority — Review
          </h4>
          <div className="space-y-2">
            {improvements
              .filter((a) => a.priority === 'low')
              .slice(0, 5)
              .map((item, i) => (
                <TopicRow key={i} item={item} bgColor="bg-emerald-50/70" borderColor="border-emerald-100" />
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TopicRow({ item, bgColor, borderColor }) {
  const percent = Math.round((item.currentScore / item.maxScore) * 100);

  return (
    <div className={`flex items-center justify-between ${bgColor} rounded-xl px-4 py-3 border ${borderColor}`}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-xs font-black text-slate-700 shadow-xs border border-slate-200/60">
          {percent}%
        </div>
        <div>
          <p className="text-xs font-bold text-slate-800">{item.topic}</p>
          <p className="text-[10px] text-slate-500 font-medium">{item.category}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs font-bold text-slate-700">{item.estimatedHours}h needed</p>
        <p className="text-[10px] text-slate-500">{item.currentScore}/{item.maxScore}</p>
      </div>
    </div>
  );
}
