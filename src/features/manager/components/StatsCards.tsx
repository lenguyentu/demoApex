// import React from 'react';

interface StatCard {
  label: string;
  value: number;
  target: number;
}

const STATS: StatCard[] = [
  { label: 'CV to Client', value: 31, target: 40 },
  { label: 'Interview', value: 16, target: 20 },
  { label: 'Offer', value: 6, target: 10 },
  { label: 'Onboard', value: 2, target: 5 },
];

export function StatsCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {STATS.map((stat) => {
        const pct = Math.min(Math.round((stat.value / stat.target) * 100), 100);
        return (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">Target: {stat.target}</p>
            <div className="mt-3 bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-brand-500 h-1.5 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{pct}%</p>
          </div>
        );
      })}
    </div>
  );
}
