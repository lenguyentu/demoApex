import { Users, TrendingUp, Briefcase, AlertTriangle, ArrowUp, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageMeta from '../../../components/common/PageMeta';
import { useAuthStore } from '../../auth/store';
import { ROLES } from '../../auth/constants';
import AssignJobModal from '../components/AssignJobModal';
import {
  useTeamStats,
  useTeamMembersPerformance,
  useTeamJobsAttention,
} from '../hooks';
import type { TeamJobAttention } from '../api';
import { supabase } from '../../../lib/supabase';

// ── Sub Components ────────────────────────────────────────────────────────────
function StatCard({ label, value, target }: { label: string; value: number; target: number }) {
  const pct = target > 0 ? Math.round((value / target) * 100) : 0;
  const color = pct >= 100 ? 'bg-green-500' : pct >= 70 ? 'bg-brand-500' : 'bg-red-400';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-1">Target {target} · tháng này</p>
      <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

function KpiBar({ value, max = 200 }: { value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  const color = value >= 100 ? 'bg-green-400' : value >= 70 ? 'bg-brand-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-semibold w-10 text-right ${value >= 100 ? 'text-green-600' : value >= 70 ? 'text-brand-600' : 'text-red-500'}`}>
        {value}%
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isStreak = status.startsWith('Streak');
  const isReview = status === 'Cần review';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
      isStreak ? 'bg-orange-50 text-orange-600' :
      isReview ? 'bg-red-50 text-red-500' :
      'bg-green-50 text-green-600'
    }`}>
      {isStreak && <TrendingUp size={10} />}
      {isReview && <AlertTriangle size={10} />}
      {!isStreak && !isReview && <ArrowUp size={10} />}
      {status}
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TeamDashboardPage() {
  const user = useAuthStore(s => s.user);
  const isAdmin = user?.role === ROLES.ADMIN;
  const isHHLead = user?.role === ROLES.HH_LEAD;
  const pageTitle = isHHLead ? 'Report tháng team của tôi' : 'Report tháng';

  // Month navigation state
  const [monthOffset, setMonthOffset] = useState(0);

  // Get list of HH Leads (Admin only)
  const { data: hhLeads = [], isLoading: isLoadingLeads } = useQuery({
    queryKey: ['hh-leads'],
    queryFn: async () => {
      if (!isAdmin) return [];
      const { data } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('role', 'HH Lead')
        .eq('is_active', true)
        .order('full_name');
      return data || [];
    },
    enabled: isAdmin,
  });

  // State for selected HH Lead (Admin only)
  // '' = "Tất cả thành viên" (default), specific id = team của HH Lead đó
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');

  // Use selected lead ID for data fetching
  // - Admin chọn "Tất cả thành viên" → null (RPC trả về toàn bộ HH + HH Lead)
  // - Admin chọn 1 HH Lead → id của HH Lead đó
  // - HH Lead → chính họ
  const effectiveLeadId: string | null = isAdmin
    ? (selectedLeadId === '' ? null : selectedLeadId)
    : (user?.id ?? null);

  const selectedLead = isAdmin && selectedLeadId
    ? hhLeads.find(l => l.id === selectedLeadId)
    : null;
  const teamLabel = isAdmin
    ? (selectedLead ? `Team của ${selectedLead.full_name}` : 'Tất cả thành viên')
    : isHHLead 
    ? `Team của ${user?.full_name || 'bạn'}`
    : 'Toàn bộ team';

  // Calculate month start based on offset
  // Tháng = từ ngày 1 → ngày 1 tháng sau (không quan tâm thứ)
  const monthStart = useMemo(() => {
    const now = new Date();
    const targetMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const year = targetMonth.getFullYear();
    const month = String(targetMonth.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  }, [monthOffset]);

  // Month display label
  const monthDisplay = useMemo(() => {
    // Parse ISO date string correctly (avoid timezone issues)
    const [year, month, day] = monthStart.split('-').map(Number);
    const d = new Date(year, month - 1, day); // month is 0-indexed in JS
    const monthName = d.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
    const label = monthOffset === 0 ? 'Tháng này' : monthOffset === -1 ? 'Tháng trước' : `${Math.abs(monthOffset)} tháng trước`;
    return { label, monthName };
  }, [monthStart, monthOffset]);

  // Fetch team data using effectiveLeadId
  const { data: teamStats, isLoading: isLoadingStats } = useTeamStats(effectiveLeadId, monthStart);
  const { data: teamMembers = [], isLoading: isLoadingMembers } = useTeamMembersPerformance(
    effectiveLeadId,
    monthStart
  );
  const { data: teamJobs = [], isLoading: isLoadingJobs } = useTeamJobsAttention(effectiveLeadId, 10);

  const isLoading = isLoadingLeads || isLoadingStats || isLoadingMembers || isLoadingJobs;

  // Modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<{ id: string; title: string } | null>(null);

  const handleAssignClick = (jobId: string, jobTitle: string) => {
    setSelectedJob({ id: jobId, title: jobTitle });
    setAssignModalOpen(true);
  };

  // Format revenue
  const formatRevenue = (amount: number) => {
    if (amount >= 1000000) {
      return `${Math.round(amount / 1000000)}M`;
    }
    if (amount >= 1000) {
      return `${Math.round(amount / 1000)}K`;
    }
    return amount.toString();
  };

  // Calculate job alerts and milestones
  const getJobReminders = (job: TeamJobAttention) => {
    const daysSinceCreated = job.days_since_created;
    const hasCv = job.pipeline_cv_sent > 0;
    const hasInterview = job.pipeline_interview > 0;
    const hasOffer = job.pipeline_offer > 0;
    const hasOnboard = job.pipeline_onboard > 0;
    const hasAnyActivity = hasCv || hasInterview || hasOffer || hasOnboard;

    // Warning reminders (red/orange)
    const warnings = {
      // Red banner: ≥5 days without ANY activity
      showRedBanner: !hasAnyActivity && daysSinceCreated >= 5,
      redBannerText: `${daysSinceCreated} ngày chưa có CV`,
      
      // Yellow border: 3-4 days without ANY activity
      showYellowBorder: !hasAnyActivity && daysSinceCreated >= 3 && daysSinceCreated < 5,
      
      // Interview warning: CV sent but no interview after 7 days
      showInterviewWarning: hasCv && !hasInterview && daysSinceCreated >= 7,
      interviewWarningText: `${daysSinceCreated} ngày chưa có PV`,
    };

    // Milestone reminders (blue/purple/green)
    let milestone: { icon: string; text: string; color: string } | null = null;
    
    if (job.latest_process_status && job.latest_process_updated_at) {
      const updatedAt = new Date(job.latest_process_updated_at);
      const now = new Date();
      const daysSinceUpdate = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
      
      const status = job.latest_process_status;
      
      // CV Submitted → 5 days follow-up
      if (status === 'CV_SUBMITTED_TO_CLIENT' && daysSinceUpdate >= 5) {
        milestone = { icon: '📄', text: `CV Submitted · ${daysSinceUpdate}d`, color: 'text-blue-600' };
      }
      // Interview → 5 days follow-up
      else if (status.includes('INTERVIEW') && daysSinceUpdate >= 5) {
        milestone = { icon: '🎤', text: `Interview · ${daysSinceUpdate}d`, color: 'text-purple-600' };
      }
      // Onboarding → multiple milestones
      else if (status === 'ONBOARDING' || status === 'PLACEMENT_CONFIRMED' || status === 'GUARANTEE_PERIOD') {
        if (daysSinceUpdate === 0) {
          milestone = { icon: '🚀', text: 'Pre-Onboard · 1d', color: 'text-orange-600' };
        } else if (daysSinceUpdate === 1) {
          milestone = { icon: '🌱', text: 'Day-1 Follow · 24h', color: 'text-green-600' };
        } else if (daysSinceUpdate >= 7 && daysSinceUpdate < 30) {
          milestone = { icon: '📞', text: `7-day Follow · ${daysSinceUpdate}d`, color: 'text-teal-600' };
        } else if (daysSinceUpdate >= 30 && daysSinceUpdate < 60) {
          milestone = { icon: '📅', text: `30-day Follow · ${daysSinceUpdate}d`, color: 'text-indigo-600' };
        } else if (daysSinceUpdate >= 60) {
          milestone = { icon: '🏁', text: `60-day Follow · ${daysSinceUpdate}d`, color: 'text-pink-600' };
        }
      }
    }

    return { ...warnings, milestone };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Report tháng" />
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{pageTitle}</h1>
              <p className="text-sm text-gray-400 mt-0.5">{teamMembers.length} thành viên</p>
            </div>
            
            {/* Admin: HH Lead Selector (luôn hiện cho Admin, kể cả khi chưa có HH Lead) */}
            {isAdmin && (
              <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
                <label className="text-sm font-medium text-gray-600 whitespace-nowrap">
                  Xem team của:
                </label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="w-56 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
                >
                  <option value="">Tất cả thành viên</option>
                  {hhLeads.map(lead => (
                    <option key={lead.id} value={lead.id}>
                      {lead.full_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          {/* Month navigation */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setMonthOffset(o => o - 1)}
              className="p-2 hover:bg-white rounded-md transition-colors"
              title="Tháng trước"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="px-3 py-1 text-center min-w-[140px]">
              <div className="text-sm font-bold">{monthDisplay.label}</div>
              <div className="text-[10px] text-gray-500 mt-0.5 capitalize">{monthDisplay.monthName}</div>
            </div>
            <button
              onClick={() => setMonthOffset(o => Math.min(0, o + 1))}
              disabled={monthOffset === 0}
              className="p-2 hover:bg-white rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Tháng sau"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Team label badge */}
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-fit">
          <Users size={14} />
          <span>{teamLabel}</span>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="CV to Client" value={teamStats?.cv_to_client_count || 0} target={teamStats?.cv_to_client_target || 0} />
          <StatCard label="Interview" value={teamStats?.interview_count || 0} target={teamStats?.interview_target || 0} />
          <StatCard label="Offer" value={teamStats?.offer_count || 0} target={teamStats?.offer_target || 0} />
          <StatCard label="Onboard" value={teamStats?.onboard_count || 0} target={teamStats?.onboard_target || 0} />
        </div>

        {/* Team Performance Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Users size={16} className="text-brand-500" />
              Team Performance
            </h2>
            <span className="text-xs text-gray-400">{teamMembers.length} thành viên</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Thành viên</th>
                  <th className="text-center px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Jobs</th>
                  <th className="text-center px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">CV Client</th>
                  <th className="text-center px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Interview</th>
                  <th className="text-center px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Offer</th>
                  <th className="px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider w-36">KPI Tháng</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {teamMembers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-gray-400">
                      Chưa có thành viên nào trong team
                    </td>
                  </tr>
                ) : (
                  teamMembers.map(m => (
                    <tr key={m.user_id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-xs font-bold shrink-0">
                            {m.full_name.split(' ').pop()?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-sm">{m.full_name}</p>
                            <p className="text-xs text-gray-400">{m.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-center font-medium text-gray-700">{m.jobs_count}</td>
                      <td className="px-3 py-3.5 text-center font-semibold text-brand-600">{m.cv_to_client_month}</td>
                      <td className="px-3 py-3.5 text-center text-gray-700">{m.interview_month}</td>
                      <td className="px-3 py-3.5 text-center text-gray-700">{m.offer_month}</td>
                      <td className="px-3 py-3.5"><KpiBar value={m.kpi_month_percent} /></td>
                      <td className="px-3 py-3.5"><StatusBadge status={m.status_label} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Jobs cần chú ý - Table Layout */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Briefcase size={16} className="text-brand-500" />
              Jobs cần chú ý
            </h2>
            <span className="text-xs text-gray-400">{teamJobs.length} jobs</span>
          </div>
          
          {teamJobs.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              Không có job nào cần chú ý
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Job</th>
                    <th className="text-left px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Client</th>
                    <th className="text-center px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Rank</th>
                    <th className="text-center px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">CV</th>
                    <th className="text-center px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">PV</th>
                    <th className="text-center px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Offer</th>
                    <th className="text-center px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">OB</th>
                    <th className="text-left px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Giao cho</th>
                    <th className="text-center px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Ngày</th>
                    <th className="text-left px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Remind</th>
                    <th className="text-center px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {teamJobs.map(job => {
                    const reminders = getJobReminders(job);
                    
                    return (
                      <tr 
                        key={job.job_id} 
                        className={`hover:bg-gray-50/50 transition-colors ${
                          reminders.showRedBanner ? 'bg-red-50/30' : 
                          reminders.showYellowBorder ? 'bg-yellow-50/20' : ''
                        }`}
                      >
                        {/* Job Title */}
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-gray-900 text-sm max-w-xs truncate" title={job.job_title}>
                            {job.job_title}
                          </div>
                        </td>
                        
                        {/* Client */}
                        <td className="px-3 py-3.5">
                          <div className="text-gray-700 text-sm">
                            {job.client_name}
                          </div>
                          {job.client_location && (
                            <div className="text-xs text-gray-400 mt-0.5">{job.client_location}</div>
                          )}
                        </td>
                        
                        {/* Rank */}
                        <td className="px-3 py-3.5 text-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                            {job.job_rank}
                          </span>
                        </td>
                        
                        {/* Pipeline Numbers */}
                        <td className="px-3 py-3.5 text-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold bg-blue-100 text-blue-600">
                            {job.pipeline_cv_sent}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold bg-purple-100 text-purple-600">
                            {job.pipeline_interview}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold bg-orange-100 text-orange-600">
                            {job.pipeline_offer}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold bg-green-100 text-green-600">
                            {job.pipeline_onboard}
                          </span>
                        </td>
                        
                        {/* Assigned To */}
                        <td className="px-3 py-3.5">
                          {job.assigned_to_names ? (
                            <div>
                              <div className="text-xs text-gray-700">{job.assigned_to_names}</div>
                              <div className="text-xs text-brand-600 mt-0.5">{job.assigned_week}</div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Chưa giao</span>
                          )}
                        </td>
                        
                        {/* Days */}
                        <td className="px-3 py-3.5 text-center">
                          <div className={`text-xs font-medium ${
                            reminders.showYellowBorder ? 'text-yellow-600' : 
                            reminders.showRedBanner ? 'text-red-600' : 
                            'text-gray-500'
                          }`}>
                            {job.days_since_created}
                          </div>
                          {job.estimated_revenue > 0 && (
                            <div className="text-xs font-semibold text-gray-700 mt-0.5">
                              {formatRevenue(job.estimated_revenue)}
                            </div>
                          )}
                        </td>
                        
                        {/* Remind (Warnings + Milestones) */}
                        <td className="px-3 py-3.5">
                          {reminders.showRedBanner && (
                            <div className="flex items-center gap-1 text-xs text-red-600 mb-1">
                              <AlertTriangle size={12} />
                              <span>{reminders.redBannerText}</span>
                            </div>
                          )}
                          {reminders.showInterviewWarning && (
                            <div className="flex items-center gap-1 text-xs text-orange-600 mb-1">
                              <AlertTriangle size={12} />
                              <span>{reminders.interviewWarningText}</span>
                            </div>
                          )}
                          {reminders.milestone && (
                            <div className={`flex items-center gap-1 text-xs ${reminders.milestone.color}`}>
                              <span>{reminders.milestone.icon}</span>
                              <span>{reminders.milestone.text}</span>
                            </div>
                          )}
                        </td>
                        
                        {/* Action */}
                        <td className="px-3 py-3.5 text-center">
                          <button
                            onClick={() => handleAssignClick(job.job_id, job.job_title)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-brand-600 hover:text-white hover:bg-brand-600 border border-brand-300 hover:border-brand-600 rounded-lg transition-all"
                          >
                            <UserPlus size={12} />
                            Giao
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Assign Job Modal */}
      {selectedJob && (
        <AssignJobModal
          isOpen={assignModalOpen}
          onClose={() => {
            setAssignModalOpen(false);
            setSelectedJob(null);
          }}
          jobId={selectedJob.id}
          jobTitle={selectedJob.title}
        />
      )}
    </>
  );
}
