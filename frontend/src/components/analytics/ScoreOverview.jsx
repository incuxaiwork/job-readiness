import React from 'react';
import { COLORS, getCategoryPercents } from '../../data/analyticsData';

export default function ScoreOverview({ student }) {
  const latestAttempt = student.examAttempts[student.examAttempts.length - 1];
  const prevAttempt = student.examAttempts.length > 1 ? student.examAttempts[student.examAttempts.length - 2] : null;

  const currentPercents = {
    aptitude: student.categoryScores?.aptitude ?? (latestAttempt ? getCategoryPercents(latestAttempt).aptitude : 0),
    reasoning: student.categoryScores?.reasoning ?? (latestAttempt ? getCategoryPercents(latestAttempt).reasoning : 0),
    technical: student.categoryScores?.technical ?? (latestAttempt ? getCategoryPercents(latestAttempt).technical : 0),
    verbal: student.categoryScores?.verbal ?? student.categoryScores?.english ?? (latestAttempt ? getCategoryPercents(latestAttempt).verbal : 0),
    english: student.categoryScores?.verbal ?? student.categoryScores?.english ?? (latestAttempt ? getCategoryPercents(latestAttempt).verbal : 0),
    coding: student.categoryScores?.coding ?? (latestAttempt ? getCategoryPercents(latestAttempt).coding : 0),
  };

  const scoreTrend = student.examAttempts.map((att) => {
    const cats = Object.values(att.categories || {});
    const count = cats.length || 1;
    return {
      date: new Date(att.date).toLocaleDateString('en-US', { month: 'short' }),
      score: Math.round(
        cats.reduce((sum, cat) => sum + (cat.maxScore > 0 ? (cat.score / cat.maxScore) * 100 : 0), 0) / count
      ),
    };
  });

  const change = prevAttempt
    ? Math.round(
      (Object.values(latestAttempt.categories || {}).reduce((s, c) => s + (c.maxScore > 0 ? (c.score / c.maxScore) * 100 : 0), 0) / (Object.values(latestAttempt.categories || {}).length || 1)) -
      (Object.values(prevAttempt.categories || {}).reduce((s, c) => s + (c.maxScore > 0 ? (c.score / c.maxScore) * 100 : 0), 0) / (Object.values(prevAttempt.categories || {}).length || 1))
    )
    : 0;

  const categoryEntries = Object.entries(currentPercents);
  const bestCategoryEntry = categoryEntries.length > 0 
    ? [...categoryEntries].sort((a, b) => b[1] - a[1])[0] 
    : ['Technical', 0];
  const bestCategoryName = bestCategoryEntry[0].charAt(0).toUpperCase() + bestCategoryEntry[0].slice(1);
  const bestCategoryScore = bestCategoryEntry[1];

  const categoryLabels = ['Aptitude', 'Reasoning', 'Technical', 'Verbal', 'Coding'];
  const categoryData = [
    currentPercents.aptitude ?? 0,
    currentPercents.reasoning ?? 0,
    currentPercents.technical ?? 0,
    currentPercents.verbal ?? currentPercents.english ?? 0,
    currentPercents.coding ?? 0,
  ];

  return (
    <section id="overview" className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Score Overview</h2>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Overall Score"
          value={`${student.overallScore}%`}
          change={change}
          color="blue"
        />
        <StatCard
          label="Percentile"
          value={`${student.percentile}th`}
          change={null}
          color="emerald"
        />
        <StatCard
          label="Rank"
          value={`${student.rank}/${student.totalStudents}`}
          change={null}
          color="purple"
        />
        <StatCard
          label="Best Category"
          value={bestCategoryName}
          change={null}
          color="amber"
          subtitle={`${bestCategoryScore}%`}
        />
      </div>

    </section>
  );
}

function StatCard({ label, value, change, color, subtitle }) {
  const colorMap = {
    blue: { bg: 'bg-blue-50/70', text: 'text-blue-700', ring: 'border-blue-200' },
    emerald: { bg: 'bg-emerald-50/70', text: 'text-emerald-700', ring: 'border-emerald-200' },
    purple: { bg: 'bg-purple-50/70', text: 'text-purple-700', ring: 'border-purple-200' },
    amber: { bg: 'bg-amber-50/70', text: 'text-amber-700', ring: 'border-amber-200' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className={`${c.bg} rounded-2xl p-5 border ${c.ring} shadow-xs`}>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-extrabold ${c.text}`}>{value}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">({subtitle})</p>}
      {change !== null && (
        <p className={`text-xs font-bold mt-2 ${change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% from last attempt
        </p>
      )}
    </div>
  );
}
