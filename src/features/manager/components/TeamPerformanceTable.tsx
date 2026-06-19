// import React from 'react';

type MemberStatus = 'on_track' | 'streak' | 'review';

interface TeamMember {
  name: string;
  role: string;
  jobs: number;
  cvClient: number;
  interview: number;
  offer: number;
  kpiWeek: number;
  kpiMonth: number;
  status: MemberStatus;
  streakDays?: number;
}

const TEAM_DATA: TeamMember[] = [
  { name: 'Nguyễn Thị A', role: 'Headhunter', jobs: 7, cvClient: 6, interview: 3, offer: 1, kpiWeek: 78, kpiMonth: 62, status: 'streak', streakDays: 3 },
  { name: 'Trần Văn B', role: 'Headhunter', jobs: 5, cvClient: 9, interview: 5, offer: 2, kpiWeek: 95, kpiMonth: 88, status: 'on_track' },
  { name: 'Lê Thị C', role: 'Senior HH', jobs: 4, cvClient: 2, interview: 1, offer: 0, kpiWeek: 42, kpiMonth: 48, status: 'review' },
  { name: 'Phạm Văn D', role: 'Headhunter', jobs: 9, cvClient: 14, interview: 7, offer: 3, kpiWeek: 159, kpiMonth: 183, status: 'streak', streakDays: 12 },
];

function StatusBadge({ status, streakDays }: { status: MemberStatus; streakDays?: number }) {
  if (status === 'on_track') return <span className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">On track</span>;
  if (status === 'streak') return <span className="bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">Streak {streakDays}d</span>;
  return <span className="bg-red-50 text-red-600 text-xs px-2 py-0.5 rounded-full font-medium">Cần review</span>;
}

function KpiBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-600 w-8 text-right">{value}%</span>
    </div>
  );
}

export function TeamPerformanceTable() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">Team Performance</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['Thành viên', 'Jobs', 'CV Client', 'Interview', 'Offer', 'KPI Tuần', 'KPI Tháng', 'Trạng thái'].map(h => (
                <th key={h} className="text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 text-left whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {TEAM_DATA.map((m) => (
              <tr key={m.name} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{m.name}</div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{m.role}</span>
                </td>
                <td className="px-4 py-3 text-gray-700 font-medium">{m.jobs}</td>
                <td className="px-4 py-3 text-gray-700">{m.cvClient}</td>
                <td className="px-4 py-3 text-gray-700">{m.interview}</td>
                <td className="px-4 py-3 text-gray-700">{m.offer}</td>
                <td className="px-4 py-3"><KpiBar value={m.kpiWeek} max={100} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <KpiBar value={Math.min(m.kpiMonth, 100)} max={100} />
                    <span className="text-xs text-gray-500">{m.kpiMonth}%</span>
                  </div>
                </td>
                <td className="px-4 py-3"><StatusBadge status={m.status} streakDays={m.streakDays} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
