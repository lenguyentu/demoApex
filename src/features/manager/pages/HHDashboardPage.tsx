import React from 'react';
import { AlertTriangle, Briefcase, Clock, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageMeta from '../../../components/common/PageMeta';
import { useAuthStore } from '../../auth/store';
import { useMyJobFocus, useCurrentWeekStart } from '../hooks';

const MOCK_STATS = [
  { label: 'Approaches',    value: 66, target: 150, pct: 44 },
  { label: 'CV to Client',  value: 3,  target: 10,  pct: 30 },
  { label: 'Interview',     value: 3,  target: 2,   pct: 150, over: true },
  { label: 'Offer',         value: 1,  target: 1,   pct: 100, over: true },
];

const WEEK_BARS = [
  { day: 'T2', h: 6.5 }, { day: 'T3', h: 5 }, { day: 'T4', h: 7.5, today: true },
  { day: 'T5', h: 4 }, { day: 'T6', h: 3 }, { day: 'T7', h: 0 }, { day: 'CN', h: 0 },
];

const RANK_STYLE: Record<string, string> = {
  'S+': 'bg-red-100 text-red-600',
  'S':  'bg-purple-100 text-purple-600',
  'A':  'bg-blue-100 text-blue-600',
  'B':  'bg-gray-100 text-gray-500',
};

function StatCard({ label, value, target, pct, over }: any) {
  const color = over ? 'bg-green-500' : pct >= 70 ? 'bg-brand-500' : 'bg-red-400';
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-1">target {target} · {pct}% {over && <span className="text-green-500 font-semibold">✓</span>}</p>
      <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

export default function HHDashboardPage() {
  const user = useAuthStore(s => s.user);
  const now = new Date();
  const weekLabel = `Tuần W02 T${now.getMonth() + 1}/${now.getFullYear()}`;

  // Fetch job focus data
  const { data: weekStartData } = useCurrentWeekStart();
  const { data: jobFocusData = [], isLoading } = useMyJobFocus(weekStartData);

  // Map data thật sang format hiện tại
  const jobs = jobFocusData.map(jf => ({
    title: jf.position_title || 'Untitled',
    client: jf.client_name || 'Unknown',
    rank: 'A', // TODO: lấy từ client_rank hoặc job metadata
    revenue: jf.headhunt_fee || jf.ctv_fee || jf.freelance_fee || '0',
    days: jf.phase_date ? Math.floor((Date.now() - new Date(jf.phase_date).getTime()) / (1000 * 60 * 60 * 24)) : 0,
    pipeline: [2,1,0,0,0], // TODO: tính từ processes table
    status: jf.phase === 'Open' ? 'Critical' : jf.phase === 'Sourcing' ? 'Kẹt 8d' : 'On track',
    statusColor: jf.phase === 'Open' ? 'text-red-600 bg-red-50' : jf.phase === 'Sourcing' ? 'text-orange-600 bg-orange-50' : 'text-green-600 bg-green-50',
    note: jf.note || null,
  }));

  // Pipeline tổng
  const PIPELINE_LABELS = ['CV DB','CV Cl','Intv','Offer','Onboard'];
  const PIPELINE_COLORS = ['bg-blue-500','bg-purple-500','bg-orange-400','bg-green-400','bg-gray-300'];
  
  const pipelineTotals = PIPELINE_LABELS.map((_, i) => 
    jobs.reduce((s, j) => s + (j.pipeline[i] ?? 0), 0)
  );

  return (
    <>
      <PageMeta title="Dashboard" />
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{user?.full_name} · {user?.role}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{weekLabel}</p>
          </div>
        </div>

        {/* Alert */}
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          <AlertTriangle size={16} className="shrink-0" />
          2 process đã quá deadline — mail + bot đã gửi cảnh báo. Xử lý ngay trước 12h.
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {MOCK_STATS.map(s => <StatCard key={s.label} {...s} />)}
        </div>

        {/* Bottom 2 cols — chart + pipeline summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Weekly chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Lịch biểu tuần</h2>
            <div className="flex items-end gap-2 h-28">
              {WEEK_BARS.map(b => (
                <div key={b.day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center" style={{ height: '80px' }}>
                    <div
                      className={`w-full rounded-t-md transition-all ${b.today ? 'bg-brand-500' : b.h > 0 ? 'bg-gray-200' : 'bg-transparent'}`}
                      style={{ height: `${(b.h / 8) * 80}px` }}
                    />
                  </div>
                  <span className={`text-xs ${b.today ? 'text-brand-600 font-bold' : 'text-gray-400'}`}>
                    {b.day}{b.today ? '●' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pipeline tổng */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Pipeline tổng</h2>
            <div className="flex items-end justify-around gap-2" style={{ height: '80px' }}>
              {PIPELINE_LABELS.map((lbl, i) => {
                const total = pipelineTotals[i];
                const max = 30;
                return (
                  <div key={lbl} className="flex flex-col items-center gap-1 flex-1">
                    <span className="text-xs font-bold text-gray-700">{total}</span>
                    <div className="w-full flex items-end justify-center" style={{ height: '48px' }}>
                      <div className={`w-full rounded-t-md ${PIPELINE_COLORS[i]}`}
                        style={{ height: `${Math.max((total / max) * 48, total > 0 ? 6 : 0)}px` }} />
                    </div>
                    <span className="text-[10px] text-gray-400">{lbl}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Job Focus Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Briefcase size={15} className="text-brand-500" /> Job Focus
              <span className="text-xs text-gray-400 font-normal">
                {isLoading ? '...' : `${jobs.length} jobs`}
              </span>
            </h2>
            <Link to="/hh/jobs" className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 font-medium">
              Xem đầy đủ <ExternalLink size={11} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Job / KH</th>
                  <th className="text-center px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Rank</th>
                  <th className="px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Pipeline</th>
                  <th className="text-center px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Ngày</th>
                  <th className="text-right px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Revenue</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-400">
                      Đang tải...
                    </td>
                  </tr>
                )}
                {!isLoading && jobs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-400">
                      Chưa có job nào được giao tuần này
                    </td>
                  </tr>
                )}
                {!isLoading && jobs.map(j => (
                  <React.Fragment key={j.title}>
                    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-800">{j.title}</p>
                        <p className="text-xs text-gray-400">{j.client}</p>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${RANK_STYLE[j.rank] ?? 'bg-gray-100 text-gray-500'}`}>
                          {j.rank}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          {j.pipeline.map((n, i) => (
                            <span key={i} className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold text-white ${PIPELINE_COLORS[i]}`}>{n}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                          <Clock size={11} />{j.days}d
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-gray-700">{j.revenue}</td>
                      <td className="px-3 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${j.statusColor}`}>{j.status}</span>
                      </td>
                    </tr>
                    {j.note && (
                      <tr className="border-b border-gray-50 bg-amber-50/60">
                        <td colSpan={6} className="px-5 py-2">
                          <div className="flex items-start gap-2 text-xs text-amber-700">
                            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                            <span>{j.note}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
}
