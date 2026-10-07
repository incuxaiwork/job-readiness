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

export default function GroupedBarChart({ labels, datasets, title }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-200/90">
      {title && (
        <h3 className="text-base font-bold text-slate-900 mb-4">{title}</h3>
      )}
      <div style={{ height: 300 }}>
        <Bar
          data={{
            labels,
            datasets: datasets.map((ds) => ({
              label: ds.label,
              data: ds.data,
              backgroundColor: ds.color,
              borderWidth: 0,
              borderRadius: 6,
              barPercentage: 0.7,
              categoryPercentage: 0.8,
            })),
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  usePointStyle: true,
                  pointStyle: 'circle',
                  padding: 16,
                  font: { size: 12 },
                },
              },
              tooltip: {
                backgroundColor: '#1e293b',
                titleColor: '#f8fafc',
                bodyColor: '#cbd5e1',
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                  label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}%`,
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
