import React from 'react';
import { mockPeerComparison, COLORS } from '../../data/analyticsData';
import ComparisonLineChart from './ComparisonLineChart';
import ScoreBarChart from './ScoreBarChart';

export default function PeerComparison({ student }) {
  const data = mockPeerComparison;

  const overallStudent = Math.round(data.reduce((s, d) => s + d.studentScore, 0) / data.length);
  const overallAvg = Math.round(data.reduce((s, d) => s + d.classAverage, 0) / data.length);
  const overallTopper = Math.round(data.reduce((s, d) => s + d.topperScore, 0) / data.length);

  return (
    <section id="peers" className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Peer & Cohort Comparison</h2>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50/70 rounded-2xl p-5 border border-blue-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Your Average</p>
          <p className="text-3xl font-black text-blue-700 mt-1">{overallStudent}%</p>
          <p className="text-xs text-blue-600 font-bold mt-1">
            Rank #{student.rank} out of {student.totalStudents}
          </p>
        </div>
        <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Class Average</p>
          <p className="text-3xl font-black text-slate-700 mt-1">{overallAvg}%</p>
          <p className="text-xs text-slate-500 font-bold mt-1">
            You are {overallStudent - overallAvg > 0 ? '+' : ''}{overallStudent - overallAvg}% above average
          </p>
        </div>
        <div className="bg-purple-50/70 rounded-2xl p-5 border border-purple-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Topper Score</p>
          <p className="text-3xl font-black text-purple-700 mt-1">{overallTopper}%</p>
          <p className="text-xs text-purple-600 font-bold mt-1">
            {overallTopper - overallStudent}% gap to close
          </p>
        </div>
      </div>

      {/* Comparison Chart */}
      <ComparisonLineChart
        title="You vs Peers Across Categories"
        labels={data.map((d) => d.category)}
        datasets={[
          {
            label: 'You',
            data: data.map((d) => d.studentScore),
            color: '#3B82F6',
          },
          {
            label: 'Class Average',
            data: data.map((d) => d.classAverage),
            color: '#94A3B8',
            dashed: true,
          },
          {
            label: 'Topper',
            data: data.map((d) => d.topperScore),
            color: '#8B5CF6',
          },
        ]}
      />

      {/* Detailed Comparison */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-200/90">
        <h3 className="text-base font-bold text-slate-800 mb-4">Category-wise Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/50">
                <th className="text-left py-3 px-4 font-bold text-slate-600 uppercase">Category</th>
                <th className="text-center py-3 px-4 font-bold text-blue-600 uppercase">You</th>
                <th className="text-center py-3 px-4 font-bold text-slate-500 uppercase">Average</th>
                <th className="text-center py-3 px-4 font-bold text-purple-600 uppercase">Topper</th>
                <th className="text-center py-3 px-4 font-bold text-slate-500 uppercase">Median</th>
                <th className="text-center py-3 px-4 font-bold text-slate-600 uppercase">Your Percentile</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => {
                const percentile = Math.round(
                  ((d.studentScore - d.classAverage) / (d.topperScore - d.classAverage)) * 100
                );
                const cappedPercentile = Math.min(99, Math.max(10, percentile));

                return (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-700">{d.category}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full font-extrabold">
                        {d.studentScore}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500 font-semibold">{d.classAverage}%</td>
                    <td className="py-3 px-4 text-center text-purple-600 font-bold">{d.topperScore}%</td>
                    <td className="py-3 px-4 text-center text-slate-400 font-semibold">{d.classMedian}%</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-blue-500"
                            style={{ width: `${cappedPercentile}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-600">~{cappedPercentile}th</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Peer Distribution Bar */}
      <ScoreBarChart
        title="Your Score Distribution"
        labels={data.map((d) => d.category)}
        data={data.map((d) => d.studentScore)}
        colors={[COLORS.aptitude, COLORS.reasoning, COLORS.technical, COLORS.verbal || COLORS.english]}
      />
    </section>
  );
}
