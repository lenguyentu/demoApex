// import React from 'react';

interface JobWatch {
  job: string;
  client: string;
  rank: string;
  cvBR: number;
  cvCL: number;
  interview: number;
  offer: number;
  onboard: number;
  days: number;
  revenue: string;
  status: string;
}

const JOBS_DATA: JobWatch[] = [
  { job: 'Engineering Manager', client: 'Synergix', rank: 'A', cvBR: 5, cvCL: 3, interview: 1, offer: 0, onboard: 0, days: 8, revenue: '45M', status: 'Kết BD CV' },
  { job: 'CTO', client: 'Fintech', rank: 'S+', cvBR: 2, cvCL: 1, interview: 0, offer: 0, onboard: 0, days: 3, revenue: '126M', status: 'Critical' },
  { job: 'Pentost Manager', client: 'CyberSec', rank: 'B', cvBR: 3, cvCL: 2, interview: 0, offer: 0, onboard: 0, days: 12, revenue: '35M', status: 'Kết Interview' },
];

function RankBadge({ rank }: { rank: string }) {
  const cls =
    rank === 'S+' ? 'bg-purple-100 text-purple-700' :
    rank === 'A'  ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600';
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cls}`}>{rank}</span>;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'Critical') return <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">{status}</span>;
  return <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{status}</span>;
}

function PipelineBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span className={`inline-flex flex-col items-center text-xs font-medium px-2 py-0.5 rounded-lg ${color}`}>
      <span className="font-bold">{value}</span>
      <span className="text-[10px] opacity-70">{label}</span>
    </span>
  );
}

export function JobsWatchTable() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">Jobs cần chú ý</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['Job/KH', 'Rank', 'Pipeline', 'Ngày', 'Revenue', 'Status'].map(h => (
                <th key={h} className="text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 text-left whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {JOBS_DATA.map((j) => (
              <tr key={`${j.job}-${j.client}`} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{j.job}</div>
                  <div className="text-xs text-gray-400">{j.client}</div>
                </td>
                <td className="px-4 py-3"><RankBadge rank={j.rank} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <PipelineBadge label="CV BR" value={j.cvBR} color="bg-gray-100 text-gray-600" />
                    <PipelineBadge label="CV CL" value={j.cvCL} color="bg-blue-50 text-blue-700" />
                    <PipelineBadge label="Intv" value={j.interview} color="bg-purple-50 text-purple-700" />
                    <PipelineBadge label="Offer" value={j.offer} color="bg-orange-50 text-orange-700" />
                    <PipelineBadge label="Onboard" value={j.onboard} color="bg-green-50 text-green-700" />
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{j.days}d</td>
                <td className="px-4 py-3 font-semibold text-gray-900">{j.revenue}</td>
                <td className="px-4 py-3"><StatusBadge status={j.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
