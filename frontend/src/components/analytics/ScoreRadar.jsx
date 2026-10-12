import React from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function ScoreRadar({ labels, datasets, title }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-200/90">
      {title && (
        <h3 className="text-base font-bold text-slate-900 mb-4">{title}</h3>
      )}
      <div className="flex justify-center" style={{ height: 320 }}>
        <Radar
          data={{
            labels,
            datasets: datasets.map((ds) => ({
              label: ds.label,
              data: ds.data,
              borderColor: ds.color,
              backgroundColor: ds.filled ? `${ds.color}25` : 'transparent',
              borderWidth: 2,
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
                position: 'bottom',
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
              r: {
                beginAtZero: true,
                max: 100,
                ticks: {
                  stepSize: 20,
                  color: '#94a3b8',
                  backdropColor: 'transparent',
                  font: { size: 10 },
                },
                pointLabels: {
                  color: '#475569',
                  font: { size: 12, weight: 'bold' },
                },
                grid: { color: '#e2e8f0' },
                angleLines: { color: '#e2e8f0' },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
