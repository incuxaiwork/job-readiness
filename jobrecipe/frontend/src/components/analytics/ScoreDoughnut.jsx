import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ScoreDoughnut({
  labels,
  data,
  colors,
  title,
  centerLabel,
  centerValue,
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-200/90">
      {title && (
        <h3 className="text-base font-bold text-slate-900 mb-4">{title}</h3>
      )}
      <div className="relative flex justify-center items-center" style={{ height: 260 }}>
        <Doughnut
          data={{
            labels,
            datasets: [
              {
                data,
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 6,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
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
                callbacks: {
                  label: (ctx) => `${ctx.label}: ${ctx.parsed}%`,
                },
              },
            },
          }}
        />
        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {centerValue && (
              <span className="text-2xl font-black text-slate-900">{centerValue}</span>
            )}
            {centerLabel && (
              <span className="text-xs text-slate-500 font-semibold mt-0.5">{centerLabel}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
