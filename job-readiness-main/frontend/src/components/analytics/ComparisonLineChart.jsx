import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function ComparisonLineChart({ labels, datasets, title }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-200/90">
      {title && (
        <h3 className="text-base font-bold text-slate-900 mb-4">{title}</h3>
      )}
      <div style={{ height: 300 }}>
        <Line
          data={{
            labels,
            datasets: datasets.map((ds) => ({
              label: ds.label,
              data: ds.data,
              borderColor: ds.color,
              backgroundColor: 'transparent',
              borderWidth: ds.dashed ? 2 : 3,
              borderDash: ds.dashed ? [6, 4] : undefined,
              tension: 0.3,
              pointRadius: 4,
              pointHoverRadius: 6,
              pointBackgroundColor: ds.color,
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
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
                ticks: { color: '#64748b', font: { size: 12 } },
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
