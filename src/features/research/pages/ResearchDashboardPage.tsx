import { useState, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { TrendingUp, Users, FileText, MessageSquare, Gift, UserCheck, Loader2, Trophy, Search, Briefcase } from 'lucide-react';
import {
  fetchResearchDashboardStats,
  fetchWorkloadStats,
  fetchResearcherRanking,
  fetchResearchJobBreakdown,
  type ResearcherRankingRow,
  type ResearchJobBreakdownRow,
} from '../api';
import { useAuthStore } from '../../auth/store';
import { supabase } from '../../../lib/supabase';
import { DateRangePicker, type DateRange } from '../../../components/DateRangePicker';

// ─── TYPES ────────────────────────────────────────────────────────────────────
// interface Stats {
//   cv_to_db: number;
//   pending: number;
//   approved: number;
//   interview: number;
//   offer: number;
//   onboard: number;
// }

interface WorkloadRow {
  hh_id: string;
  hh_name: string;
  hh_role: string;
  raw_count: number;
  join_offset: number;
  effective_score: number;
  this_week: number;
  total_pct: number | null;
  joined_at?: string;
  is_next?: boolean;
  excluded?: boolean;
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
const COLOR_MAP: Record<string, { bg: string; text: string; icon: string }> = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   icon: 'text-blue-500' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: 'text-yellow-500' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'text-indigo-500' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-500' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-500' },
  green:  { bg: 'bg-green-50',  text: 'text-green-700',  icon: 'text-green-500' },
};

const STAT_ICONS: Record<string, React.ReactNode> = {
  cv_to_db:  <FileText size={22} />,
  pending:   <MessageSquare size={22} />,
  approved:  <TrendingUp size={22} />,
  interview: <Users size={22} />,
  offer:     <Gift size={22} />,
  onboard:   <UserCheck size={22} />,
};

function StatCard({ id, count, label, color }: { id: string; count: number; label: string; color: string }) {
  const c = COLOR_MAP[color];
  return (
    <div className={`${c.bg} rounded-xl p-5 flex items-center gap-4`}>
      <div className={`${c.icon} shrink-0`}>{STAT_ICONS[id]}</div>
      <div>
        <p className={`text-2xl font-bold ${c.text}`}>{count}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── FUNNEL BAR ───────────────────────────────────────────────────────────────
function FunnelBar({ label, count, pct, color }: { label: string; count: number; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-sm text-gray-600 text-right shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
        <div
          className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        >
          <span className="text-xs font-semibold text-white">{count}</span>
        </div>
      </div>
      <span className="w-12 text-xs text-gray-400 shrink-0">{pct}%</span>
    </div>
  );
}

// ─── RESEARCHER RANKING SECTION ───────────────────────────────────────────────
type RankingMetric = 'cv_to_db' | 'approved' | 'interview' | 'offer' | 'onboard';

const RANKING_METRICS: { key: RankingMetric; label: string; color: string }[] = [
  { key: 'cv_to_db',  label: 'CV to DB',   color: 'text-blue-600' },
  { key: 'approved',  label: 'CV duyệt',   color: 'text-indigo-600' },
  { key: 'interview', label: 'Interview',  color: 'text-purple-600' },
  { key: 'offer',     label: 'Offer',      color: 'text-orange-600' },
  { key: 'onboard',   label: 'Onboard',    color: 'text-green-600' },
];

function ResearcherRankingSection({ rows, loading }: { rows: ResearcherRankingRow[]; loading: boolean }) {
  const [sortBy, setSortBy] = useState<RankingMetric>('cv_to_db');

  // Sort theo metric đã chọn (DESC), tie-break bằng tên
  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const diff = (b[sortBy] ?? 0) - (a[sortBy] ?? 0);
      if (diff !== 0) return diff;
      return a.researcher_name.localeCompare(b.researcher_name);
    });
  }, [rows, sortBy]);

  // Map: metric → giá trị max và min hiện tại (để highlight top/bottom)
  const minMax = useMemo(() => {
    const m: Record<RankingMetric, { max: number; min: number }> = {
      cv_to_db:  { max: 0, min: Infinity },
      approved:  { max: 0, min: Infinity },
      interview: { max: 0, min: Infinity },
      offer:     { max: 0, min: Infinity },
      onboard:   { max: 0, min: Infinity },
    };
    rows.forEach(r => {
      RANKING_METRICS.forEach(({ key }) => {
        const v = r[key] ?? 0;
        if (v > m[key].max) m[key].max = v;
        if (v < m[key].min) m[key].min = v;
      });
    });
    return m;
  }, [rows]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <Trophy size={18} className="text-yellow-500" />
          Xếp hạng Researcher (active)
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Sắp xếp theo:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as RankingMetric)}
            className="border border-gray-300 rounded-lg px-2.5 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          >
            {RANKING_METRICS.map(m => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={22} className="animate-spin text-gray-400" />
        </div>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">Chưa có dữ liệu</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-3 font-medium">#</th>
                <th className="pb-3 font-medium">Researcher</th>
                {RANKING_METRICS.map(m => (
                  <th key={m.key} className="pb-3 font-medium text-center">
                    <button
                      onClick={() => setSortBy(m.key)}
                      className={`hover:text-gray-700 ${sortBy === m.key ? 'font-semibold text-gray-800' : ''}`}
                    >
                      {m.label}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((row, i) => (
                <tr key={row.researcher_id} className="hover:bg-gray-50">
                  <td className="py-3">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      i === 0 ? 'bg-yellow-100 text-yellow-700' :
                      i === 1 ? 'bg-gray-200 text-gray-700' :
                      i === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-3 font-medium text-gray-900">{row.researcher_name}</td>
                  {RANKING_METRICS.map(m => {
                    const v = row[m.key] ?? 0;
                    const isTop    = v === minMax[m.key].max && v > 0 && rows.length > 1;
                    const isBottom = v === minMax[m.key].min && v < minMax[m.key].max && rows.length > 1;
                    return (
                      <td key={m.key} className="py-3 text-center">
                        <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded font-semibold ${
                          isTop    ? 'bg-green-100 text-green-700' :
                          isBottom ? 'bg-red-50 text-red-600' :
                          m.color
                        }`}>
                          {v}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-gray-400 mt-3">
        🏆 Top mỗi chỉ số highlight xanh — Bottom highlight đỏ • Click cột để sort
      </p>
    </div>
  );
}

// ─── JOB BREAKDOWN SECTION ────────────────────────────────────────────────────
interface JobGroup {
  job_id: string;
  job_code: string;
  position_title: string;
  client_id: string | null;
  client_name: string;
  cv_count: number;
  approved_count: number;
  interview_count: number;
  offer_count: number;
  onboard_count: number;
  last_activity: string | null;
  rows: ResearchJobBreakdownRow[];
}

function JobBreakdownSection({ rows, loading }: { rows: ResearchJobBreakdownRow[]; loading: boolean }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Group theo job_id, gộp tổng các chỉ số
  const groups = useMemo<JobGroup[]>(() => {
    const map = new Map<string, JobGroup>();
    for (const r of rows) {
      const g = map.get(r.job_id);
      if (!g) {
        map.set(r.job_id, {
          job_id: r.job_id,
          job_code: r.job_code,
          position_title: r.position_title,
          client_id: r.client_id,
          client_name: r.client_name,
          cv_count: r.cv_count,
          approved_count: r.approved_count,
          interview_count: r.interview_count,
          offer_count: r.offer_count,
          onboard_count: r.onboard_count,
          last_activity: r.last_activity,
          rows: [r],
        });
      } else {
        g.cv_count        += r.cv_count;
        g.approved_count  += r.approved_count;
        g.interview_count += r.interview_count;
        g.offer_count     += r.offer_count;
        g.onboard_count   += r.onboard_count;
        // last_activity = max
        if (r.last_activity && (!g.last_activity || r.last_activity > g.last_activity)) {
          g.last_activity = r.last_activity;
        }
        g.rows.push(r);
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      if (!a.last_activity && !b.last_activity) return 0;
      if (!a.last_activity) return 1;
      if (!b.last_activity) return -1;
      return b.last_activity.localeCompare(a.last_activity);
    });
  }, [rows]);

  // Filter trên groups (search match cả parent + children)
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase();
    return groups
      .map(g => {
        const parentMatch =
          g.position_title.toLowerCase().includes(q) ||
          g.client_name.toLowerCase().includes(q) ||
          g.job_code.toLowerCase().includes(q);
        const childMatches = g.rows.filter(r =>
          r.researcher_name.toLowerCase().includes(q) ||
          r.owner_name.toLowerCase().includes(q)
        );
        // Nếu match parent → giữ tất cả children. Nếu chỉ match child → chỉ hiện child match
        if (parentMatch) return g;
        if (childMatches.length > 0) return { ...g, rows: childMatches };
        return null;
      })
      .filter(Boolean) as JobGroup[];
  }, [groups, searchQuery]);

  // Khi search có kết quả → auto-expand groups match (tiện cho user thấy ngay)
  const autoExpandKeys = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const set = new Set<string>();
    filteredGroups.forEach(g => {
      const childMatch = g.rows.some(r =>
        r.researcher_name.toLowerCase().includes(q) ||
        r.owner_name.toLowerCase().includes(q)
      );
      if (childMatch) set.add(g.job_id);
    });
    return set;
  }, [filteredGroups, searchQuery]);

  const isExpanded = (jobId: string) =>
    autoExpandKeys?.has(jobId) || !!expanded[jobId];

  const toggle = (jobId: string) => {
    setExpanded(prev => ({ ...prev, [jobId]: !prev[jobId] }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    filteredGroups.forEach(g => { next[g.job_id] = true; });
    setExpanded(next);
  };

  const collapseAll = () => setExpanded({});

  const allExpanded = filteredGroups.length > 0 &&
    filteredGroups.every(g => isExpanded(g.job_id));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <Briefcase size={18} className="text-blue-500" />
          Chi tiết theo Job
          <span className="text-xs font-normal text-gray-500">({filteredGroups.length} job)</span>
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={allExpanded ? collapseAll : expandAll}
            disabled={filteredGroups.length === 0}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-50"
          >
            {allExpanded ? 'Đóng tất cả' : 'Mở tất cả'}
          </button>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm vị trí, client, mã job, Researcher, HH..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-72"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={22} className="animate-spin text-gray-400" />
        </div>
      ) : filteredGroups.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">
          {searchQuery ? 'Không tìm thấy job phù hợp' : 'Chưa có dữ liệu'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100 bg-gray-50/50">
                <th className="pb-3 pt-3 pl-3 font-medium w-8"></th>
                <th className="pb-3 pt-3 font-medium">Vị trí</th>
                <th className="pb-3 pt-3 font-medium">Client</th>
                <th className="pb-3 pt-3 font-medium">Researcher</th>
                <th className="pb-3 pt-3 font-medium">HH phụ trách</th>
                <th className="pb-3 pt-3 font-medium text-center">CV gửi</th>
                <th className="pb-3 pt-3 font-medium text-center">Đã duyệt</th>
                <th className="pb-3 pt-3 font-medium text-center">Interview</th>
                <th className="pb-3 pt-3 font-medium text-center">Offer</th>
                <th className="pb-3 pt-3 font-medium text-center pr-3">Onboard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredGroups.map(g => {
                const open = isExpanded(g.job_id);
                const isMulti = g.rows.length > 1;
                return (
                  <FragmentRows
                    key={g.job_id}
                    group={g}
                    open={open}
                    onToggle={() => toggle(g.job_id)}
                    isMulti={isMulti}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-gray-400 mt-3">
        Dòng tổng = 1 job. Click ▶ để xem chi tiết theo Researcher × HH • Đếm dựa trên history "đã từng đạt"
      </p>
    </div>
  );
}

// Helper: render parent row + children rows (collapsible)
function FragmentRows({
  group, open, onToggle, isMulti,
}: { group: JobGroup; open: boolean; onToggle: () => void; isMulti: boolean }) {
  return (
    <>
      {/* Parent row */}
      <tr
        className={`${isMulti ? 'cursor-pointer hover:bg-blue-50/50' : ''} ${open && isMulti ? 'bg-blue-50/30' : 'bg-white'}`}
        onClick={isMulti ? onToggle : undefined}
      >
        <td className="py-3 pl-3 text-gray-400">
          {isMulti && (
            <ChevronRightIcon className={`transition-transform ${open ? 'rotate-90' : ''}`} />
          )}
        </td>
        <td className="py-3">
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900">
              {group.position_title || '—'}
            </span>
            {group.job_code && (
              <a
                href={`/jobs/${group.job_id}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-xs font-mono text-brand-600 hover:underline w-fit"
                title="Mở chi tiết job"
              >
                {group.job_code}
              </a>
            )}
          </div>
        </td>
        <td className="py-3 text-gray-700">
          {group.client_id ? (
            <a
              href={`/tables/clients/new/${group.client_id}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="hover:text-brand-600 hover:underline"
            >
              {group.client_name || '—'}
            </a>
          ) : (group.client_name || '—')}
        </td>
        {/* Researcher / HH cell — show summary on parent row */}
        <td className="py-3 text-gray-500 text-xs">
          {isMulti ? (
            <span className="italic">{group.rows.length} người</span>
          ) : (
            group.rows[0]?.researcher_name || '—'
          )}
        </td>
        <td className="py-3 text-gray-500 text-xs">
          {isMulti ? (
            <span className="italic">{new Set(group.rows.map(r => r.owner_id)).size} HH</span>
          ) : (
            group.rows[0]?.owner_name || '—'
          )}
        </td>
        <td className="py-3 text-center font-bold text-blue-600">{group.cv_count}</td>
        <td className="py-3 text-center font-bold text-indigo-600">{group.approved_count}</td>
        <td className="py-3 text-center font-bold text-purple-600">{group.interview_count}</td>
        <td className="py-3 text-center font-bold text-orange-600">{group.offer_count}</td>
        <td className="py-3 text-center font-bold text-green-600 pr-3">{group.onboard_count}</td>
      </tr>

      {/* Children rows — chỉ render khi open */}
      {open && isMulti && group.rows.map(r => (
        <tr key={`${r.job_id}-${r.researcher_id}-${r.owner_id}`} className="bg-gray-50/40 hover:bg-gray-100/40">
          <td className="py-2.5 pl-3 text-gray-300">└</td>
          <td className="py-2.5 pl-6 text-gray-500 text-xs italic">↳ chi tiết</td>
          <td className="py-2.5"></td>
          <td className="py-2.5 text-gray-700 text-xs">{r.researcher_name || '—'}</td>
          <td className="py-2.5 text-gray-700 text-xs">{r.owner_name || '—'}</td>
          <td className="py-2.5 text-center text-blue-600">{r.cv_count}</td>
          <td className="py-2.5 text-center text-indigo-600">{r.approved_count}</td>
          <td className="py-2.5 text-center text-purple-600">{r.interview_count}</td>
          <td className="py-2.5 text-center text-orange-600">{r.offer_count}</td>
          <td className="py-2.5 text-center text-green-600 pr-3">{r.onboard_count}</td>
        </tr>
      ))}
    </>
  );
}

// Mini chevron (avoid extra import)
function ChevronRightIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`inline-block ${className}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export function ResearchDashboardPage() {
  const { user } = useAuthStore();
  const isAdmin      = user?.role === 'Admin';
  const isResearcher = user?.role === 'Researcher';
  const canSeeWorkload = !isResearcher;

  // Admin có thể lọc theo Researcher cụ thể
  const [selectedResearcherId, setSelectedResearcherId] = useState<string>('all');

  // Date range filter — áp dụng cho cả stats / ranking / job breakdown
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });
  const dateFromIso = dateRange.from ? dateRange.from.toISOString() : null;
  const dateToIso   = dateRange.to   ? dateRange.to.toISOString()   : null;

  // Fetch danh sách Researcher (chỉ Admin cần)
  const { data: researcherList = [] } = useQuery({
    queryKey: ['researchers', 'list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('role', 'Researcher')
        .eq('is_active', true)
        .order('full_name');
      return data ?? [];
    },
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000,
  });

  // Xác định researcherId để fetch stats
  const statsResearcherId = isResearcher
    ? user?.id                                          // Researcher: chỉ bản thân
    : isAdmin && selectedResearcherId !== 'all'
      ? selectedResearcherId                            // Admin lọc theo người
      : undefined;                                      // Admin all / HH: tất cả

  const { data: stats, isFetching: statsFetching } = useQuery({
    queryKey: ['research', 'dashboard', 'stats', statsResearcherId ?? 'all', dateFromIso, dateToIso],
    queryFn: () => fetchResearchDashboardStats(statsResearcherId, dateFromIso, dateToIso),
    staleTime: 2 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  const { data: workloadData, refetch: refetchWorkload } = useQuery({
    queryKey: ['research', 'dashboard', 'workload'],
    queryFn: fetchWorkloadStats,
    staleTime: 2 * 60 * 1000,
    enabled: canSeeWorkload,
    placeholderData: keepPreviousData,
  });

  // Bảng xếp hạng Researcher — ai cũng thấy
  const { data: rankingData = [], isFetching: rankingFetching, isLoading: rankingLoading } = useQuery({
    queryKey: ['research', 'dashboard', 'ranking', dateFromIso, dateToIso],
    queryFn: () => fetchResearcherRanking(dateFromIso, dateToIso),
    staleTime: 2 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  // Job breakdown — ai cũng thấy
  const { data: jobBreakdownData = [], isFetching: jobBreakdownFetching, isLoading: jobBreakdownLoading } = useQuery({
    queryKey: ['research', 'dashboard', 'jobBreakdown', dateFromIso, dateToIso],
    queryFn: () => fetchResearchJobBreakdown(dateFromIso, dateToIso),
    staleTime: 2 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  // Lần đầu chưa có data — show full-page spinner. Sau đó dùng inline indicator
  const initialLoading = !stats && statsFetching;
  // Admin: giữ sort theo effective (để thấy tiếp theo)
  // HH/HH Lead: shuffle để không đoán được thứ tự
  const rawWorkload = (workloadData ?? []) as WorkloadRow[];
  const workload = isAdmin
    ? rawWorkload
    : [...rawWorkload].sort(() => Math.random() - 0.5);

  const handleToggleExclude = async (row: WorkloadRow) => {
    let updatePayload: any = { excluded: !row.excluded };

    // Nếu đang bị loại (muốn Thêm lại vào Pool), đẩy join_offset lên để effective_score bằng min của Pool
    if (row.excluded) {
      const activeUsers = rawWorkload.filter(r => !r.excluded);
      if (activeUsers.length > 0) {
        const minEffective = Math.min(...activeUsers.map(r => r.effective_score));
        const newOffset = Math.max(0, minEffective - row.raw_count);
        updatePayload.join_offset = newOffset;
      }
    }

    const { error } = await supabase
      .from('hh_assignment_offset')
      .update(updatePayload)
      .eq('user_id', row.hh_id);
    if (error) { console.error(error); return; }
    refetchWorkload();
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-gray-400" />
      </div>
    );
  }

  const s = stats ?? { cv_to_db: 0, pending: 0, approved: 0, interview: 0, offer: 0, onboard: 0 };
  const base = s.cv_to_db || 1;

  const STAT_CARDS = [
    { id: 'cv_to_db',  count: s.cv_to_db,  label: 'CV to DB',   color: 'blue' },
    { id: 'pending',   count: s.pending,   label: 'Chờ duyệt',  color: 'yellow' },
    { id: 'approved',  count: s.approved,  label: 'Đã duyệt',   color: 'indigo' },
    { id: 'interview', count: s.interview, label: 'Interview',  color: 'purple' },
    { id: 'offer',     count: s.offer,     label: 'Offer',      color: 'orange' },
    { id: 'onboard',   count: s.onboard,   label: 'Onboard',    color: 'green' },
  ];

  const FUNNEL = [
    { label: 'CV to DB',  count: s.cv_to_db,  pct: 100,                                    color: '#3b82f6' },
    { label: 'Đã duyệt', count: s.approved,  pct: +((s.approved  / base) * 100).toFixed(1), color: '#6366f1' },
    { label: 'Interview', count: s.interview, pct: +((s.interview / base) * 100).toFixed(1), color: '#a855f7' },
    { label: 'Offer',     count: s.offer,     pct: +((s.offer     / base) * 100).toFixed(1), color: '#f97316' },
    { label: 'Onboard',   count: s.onboard,   pct: +((s.onboard   / base) * 100).toFixed(1), color: '#22c55e' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Research Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isResearcher ? 'Thống kê của bạn' : 'Thống kê tỉ lệ chuyển đổi'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date range picker — ai cũng dùng được */}
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder="Toàn bộ thời gian"
          />
          {/* Admin: filter theo Researcher */}
          {isAdmin && (
            <select
              value={selectedResearcherId}
              onChange={e => setSelectedResearcherId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            >
              <option value="all">Tất cả Researcher</option>
              {researcherList.map((r: any) => (
                <option key={r.id} value={r.id}>{r.full_name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 transition-opacity ${statsFetching ? 'opacity-60' : ''}`}>
        {STAT_CARDS.map(card => (
          <StatCard key={card.id} {...card} />
        ))}
      </div>

      {/* Funnel */}
      <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-6 transition-opacity ${statsFetching ? 'opacity-60' : ''}`}>
        <h2 className="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
          Conversion Funnel
          {statsFetching && <Loader2 size={14} className="animate-spin text-gray-400" />}
        </h2>
        <div className="space-y-3">
          {FUNNEL.map(f => (
            <FunnelBar key={f.label} {...f} />
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4">Tỉ lệ tính trên tổng CV to DB</p>
      </div>

      {/* Researcher Ranking — ai cũng thấy */}
      <div className={`transition-opacity ${rankingFetching && !rankingLoading ? 'opacity-70' : ''}`}>
        <ResearcherRankingSection rows={rankingData} loading={rankingLoading} />
      </div>

      {/* Job Breakdown — ai cũng thấy */}
      <div className={`transition-opacity ${jobBreakdownFetching && !jobBreakdownLoading ? 'opacity-70' : ''}`}>
        <JobBreakdownSection rows={jobBreakdownData} loading={jobBreakdownLoading} />
      </div>

      {/* HH Workload — chỉ Admin, HH, HH Lead xem */}
      {canSeeWorkload && (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Workload Headhunter</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-3 font-medium">Headhunter</th>
                <th className="pb-3 font-medium text-center">Role</th>
                <th className="pb-3 font-medium text-center">Tuần này</th>
                <th className="pb-3 font-medium text-center">Tổng nhận</th>
                <th className="pb-3 font-medium text-center">Offset</th>
                <th className="pb-3 font-medium text-center">Effective</th>
                {isAdmin && <th className="pb-3 font-medium text-center">Gia nhập</th>}
                {isAdmin && <th className="pb-3 font-medium text-center">Pool</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {workload.length === 0 ? (
                <tr><td colSpan={isAdmin ? 8 : 6} className="py-8 text-center text-gray-400 text-sm">Chưa có dữ liệu</td></tr>
              ) : workload.map((row, i) => (
                <tr key={row.hh_id}
                  className={`transition ${
                    row.excluded ? 'opacity-40 bg-gray-50' :
                    isAdmin && row.is_next ? 'bg-green-50 border-l-4 border-l-green-500' : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="py-3 font-medium text-gray-900 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold bg-gray-100 text-gray-500">
                      {i + 1}
                    </span>
                    {row.hh_name}
                    {row.excluded && (
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-500">
                        Tạm loại
                      </span>
                    )}
                    {isAdmin && !row.excluded && row.is_next && (
                      <span className="ml-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-green-500 text-white">
                        Tiếp theo ↓
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-center text-gray-500 text-xs">{row.hh_role}</td>
                  <td className="py-3 text-center text-blue-600 font-semibold">{row.this_week}</td>
                  <td className="py-3 text-center text-gray-700">{row.raw_count}</td>
                  <td className="py-3 text-center text-orange-500">{row.join_offset}</td>
                  <td className="py-3 text-center font-semibold text-gray-900">{row.effective_score}</td>
                  {isAdmin && (
                    <td className="py-3 text-center text-xs text-gray-400">
                      {row.joined_at ? new Date(row.joined_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'}
                    </td>
                  )}
                  {isAdmin && (
                    <td className="py-3 text-center">
                      <button
                        onClick={() => handleToggleExclude(row)}
                        className={`px-2 py-1 rounded text-xs font-medium transition ${
                          row.excluded
                            ? 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'
                            : 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-600'
                        }`}
                        title={row.excluded ? 'Thêm vào pool' : 'Loại khỏi pool'}
                      >
                        {row.excluded ? '+ Thêm' : '✓ Active'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-3">Người có effective_score thấp nhất sẽ nhận CV tiếp theo</p>
      </div>
      )}
    </div>
  );
}
