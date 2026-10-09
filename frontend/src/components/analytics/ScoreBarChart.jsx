import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ScoreBarChart({ labels, data, colors, title }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-200/90">
      {title && (
        <h3 className="text-base font-bold text-slate-900 mb-4">{title}</h3>
      )}
      <div style={{ height: 280 }}>
        <Bar
          data={{
            labels,
            datasets: [
              {
                label: 'Score %',
                data,
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 0,
                borderRadius: 8,
                barPercentage: 0.6,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: '#1e293b',
                titleColor: '#f8fafc',
                bodyColor: '#cbd5e1',
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                  label: (ctx) => `${ctx.parsed.y}%`,
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                  callback: (val) => `${val}%`,
                  color: '#94a3b8',
                  font: { size: 12 },
                },
                grid: { color: '#f1f5f9' },
                border: { display: false },
              },
              x: {
                ticks: { color: '#64748b', font: { size: 12, weight: 500 } },
                grid: { display: false },
                border: { display: false },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
