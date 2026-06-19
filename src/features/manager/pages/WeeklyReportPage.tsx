import { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Save, FileText } from 'lucide-react';
import PageMeta from '../../../components/common/PageMeta';
import { useAuthStore } from '../../auth/store';
import { supabase } from '../../../lib/supabase';
import {
  useCurrentWeekStart,
  useWeeklyReportData,
  useJobFocusWithDetails,
  useWeeklyReportPipelineStats,
  useUpsertWeeklyReport,
} from '../hooks';
import toast from 'react-hot-toast';
import { TeamMemberSelect } from '../../../components/TeamMemberSelect';
import { ROLES } from '../../auth/constants';

// Import section components
import KPIFunnelSection from '../components/weeklyReport/KPIFunnelSection.tsx';
import PipelineSection from '../components/weeklyReport/PipelineSection.tsx';
import CandidateTrackerSection from '../components/weeklyReport/CandidateTrackerSection.tsx';
import SourcingChannelSection from '../components/weeklyReport/SourcingChannelSection.tsx';
import IssuesSection from '../components/weeklyReport/IssuesSection.tsx';
import PlanSection from '../components/weeklyReport/PlanSection.tsx';
import RevenueSection from '../components/weeklyReport/RevenueSection.tsx';
import SelfReviewSection from '../components/weeklyReport/SelfReviewSection.tsx';
// import WeeklyReportEmailTestPanel from '../components/weeklyReport/WeeklyReportEmailTestPanel.tsx';
import {
  addDaysToDateString,
  getReportingWeekStart,
  getWeeklyReportSchedule,
} from '../utils/weeklyReportSchedule';
import {
  EMPTY_REVENUE_ROW,
  parseRevenueTracker,
  serializeRevenueTracker,
  type WeeklyReportRevenueRow,
} from '../utils/weeklyReportRevenue';

export default function WeeklyReportPage() {
  const user = useAuthStore((state) => state.user);
  const [weekOffset, setWeekOffset] = useState(0);
  const { mutate: saveReport, isPending: isSaving } = useUpsertWeeklyReport();

  // User selection (for HH Lead and Admin)
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(user?.id);
  const isHHLead = user?.role === ROLES.HH_LEAD;
  const isAdmin = user?.role === ROLES.ADMIN;
  const canViewOthers = isHHLead || isAdmin;

  const { data: currentWeekStart } = useCurrentWeekStart();

  const reportingBaseWeekStart = useMemo(() => {
    if (!currentWeekStart) return undefined;
    return getReportingWeekStart(currentWeekStart);
  }, [currentWeekStart]);

  const weekStart = useMemo(() => {
    if (!reportingBaseWeekStart) return undefined;
    if (weekOffset === 0) return reportingBaseWeekStart;
    return addDaysToDateString(reportingBaseWeekStart, weekOffset * 7);
  }, [reportingBaseWeekStart, weekOffset]);

  const schedule = useMemo(() => {
    if (!weekStart) return null;
    return getWeeklyReportSchedule(weekStart);
  }, [weekStart]);

  // Use selectedUserId for queries
  const effectiveUserId = selectedUserId || user?.id;
  const isViewingOwnData = effectiveUserId === user?.id;

  const { data: reportData, isLoading: isLoadingReport } = useWeeklyReportData(effectiveUserId, weekStart);
  const { data: jobs = [], isLoading: isLoadingJobs } = useJobFocusWithDetails({
    assignee_id: effectiveUserId,
    week_start: weekStart,
  });
  const { data: pipelineStats = [], isLoading: isLoadingPipeline } = useWeeklyReportPipelineStats(effectiveUserId, weekStart);

  // Combine all loading states
  const isLoading = isLoadingReport || isLoadingJobs || isLoadingPipeline;

  // ============================================================================
  // CENTRALIZED STATE - All sections data
  // ============================================================================
  const [formData, setFormData] = useState({
    approaches_count: 0,
    candidate_tracker: {} as Record<string, { next_step?: string; deadline?: string; risk_note?: string }>,
    sourcing_channels: [] as Array<{ name: string; followers_start: number; followers_end: number; cv_received: number; posts_count: number; note?: string }>,
    sourcing_note: '',
    week_note: '',
    job_plans: {} as Record<string, any>,
    selected_jobs: [] as string[],
    revenues: [{ ...EMPTY_REVENUE_ROW }] as WeeklyReportRevenueRow[],
    self_review_score: 5,
    self_review_lessons: '',
    self_review_support_needed: '',
  });

  // Sync formData when reportData changes
  useEffect(() => {
    if (reportData) {
      setFormData(prev => ({
        ...prev,
        approaches_count: reportData.approaches_count || 0,
        candidate_tracker: reportData.candidate_tracker || {},
        sourcing_channels: reportData.sourcing_channels || [],
        sourcing_note: reportData.sourcing_note || '',
        week_note: reportData.week_note || '',
        self_review_score: reportData.self_review_score || 5,
        self_review_lessons: reportData.self_review_lessons || '',
        self_review_support_needed: reportData.self_review_support_needed || '',
        revenues: parseRevenueTracker(reportData.revenue_tracker),
      }));
    }
  }, [reportData]);

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // ============================================================================
  // SAVE ALL - Main save handler
  // ============================================================================
  const handleSaveAll = async () => {
    if (!user?.id || !weekStart) return;

    try {
      await saveReport(
        {
          userId: user.id,
          weekStart,
          payload: {
            candidate_tracker: formData.candidate_tracker,
            sourcing_channels: formData.sourcing_channels,
            sourcing_note: formData.sourcing_note,
            week_note: formData.week_note,
            self_review_score: formData.self_review_score,
            self_review_lessons: formData.self_review_lessons,
            self_review_support_needed: formData.self_review_support_needed,
            revenue_tracker: serializeRevenueTracker(formData.revenues),
          },
        },
        {
          onSuccess: async () => {
            // Create job focus assignments for next week
            const nextWeekDate = new Date(weekStart);
            nextWeekDate.setDate(nextWeekDate.getDate() + 7);
            const nextWeekStart = nextWeekDate.toISOString().split('T')[0];

            if (formData.selected_jobs.length > 0) {
              const assignments = formData.selected_jobs.map((jobId: string) => ({
                job_id: jobId,
                assignee_id: user.id,
                assigned_by: user.id,
                week_start: nextWeekStart,
                note: (formData.job_plans as any)[jobId]?.note || '',
                plan_cv_count: (formData.job_plans as any)[jobId]?.cv_target || 0,
                plan_priority_percent: (formData.job_plans as any)[jobId]?.priority || 0,
              }));

              const { error: assignError } = await supabase
                .from('job_focus_assignments')
                .upsert(assignments, {
                  onConflict: 'job_id,assignee_id,week_start',
                });

              if (assignError) {
                console.error('Error creating job assignments:', assignError);
                toast.error('Lưu báo cáo thành công nhưng không thể gán job focus');
                return;
              }

              // Xóa các job đã bị loại bỏ khỏi kế hoạch
              await supabase
                .from('job_focus_assignments')
                .delete()
                .eq('assignee_id', user.id)
                .eq('week_start', nextWeekStart)
                .not('job_id', 'in', `(${formData.selected_jobs.join(',')})`);
            } else {
              // Nếu danh sách trống, xóa toàn bộ kế hoạch tuần sau
              await supabase
                .from('job_focus_assignments')
                .delete()
                .eq('assignee_id', user.id)
                .eq('week_start', nextWeekStart);
            }

            toast.success('Đã lưu báo cáo tuần thành công! 🎉');
          },
          onError: (error) => {
            console.error('Save error:', error);
            toast.error('Lỗi khi lưu báo cáo');
          },
        }
      );
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Lỗi khi lưu báo cáo');
    }
  };

  const weekLabel =
    weekOffset === 0
      ? 'Tuần này'
      : weekOffset === -1
      ? 'Tuần trước'
      : `${Math.abs(weekOffset)} tuần trước`;

  // Skeleton Loading Component
  const SkeletonCard = () => (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
      <div className="px-5 py-3 bg-gray-100 border-b border-gray-200">
        <div className="h-5 bg-gray-200 rounded w-1/3"></div>
      </div>
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>
  );

  return (
    <>
      <PageMeta title="Báo cáo tuần" />
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header with Week Navigation */}
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="text-brand-600" size={28} />
                  Báo cáo tuần
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  Chỉ số chốt 00:00 Thứ 7 (sau Thứ 6) · Nộp báo cáo trước 12:00 Thứ 7
                </p>
              </div>

              {/* User Selector for HH Lead and Admin */}
              {canViewOthers && (
                <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
                  <span className="text-sm font-medium text-gray-600 whitespace-nowrap">Xem báo cáo của:</span>
                  <div className="w-56">
                    <TeamMemberSelect
                      value={selectedUserId || ''}
                      onChange={setSelectedUserId}
                      placeholder="Chọn thành viên..."
                      includeSelf={true}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Week navigation */}
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-1">
                <button
                  onClick={() => setWeekOffset((o) => o - 1)}
                  className="p-2 hover:bg-white rounded-md transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="px-3 py-1 text-center">
                  <div className="text-sm font-bold">{weekLabel}</div>
                  {weekStart && (() => {
                    const [year, month, day] = weekStart.split('-').map(Number);
                    const startDate = new Date(Date.UTC(year, month - 1, day));
                    const endDate = new Date(startDate);
                    endDate.setUTCDate(endDate.getUTCDate() + 6);
                    const startStr = startDate.toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      timeZone: 'Asia/Ho_Chi_Minh',
                    });
                    const endStr = endDate.toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      timeZone: 'Asia/Ho_Chi_Minh',
                    });
                    return (
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        Tuần T7-T6 · {startStr} - {endStr}
                      </div>
                    );
                  })()}
                </div>
                <button
                  onClick={() => setWeekOffset((o) => Math.min(0, o + 1))}
                  disabled={weekOffset === 0}
                  className="p-2 hover:bg-white rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Save Button - Only show when viewing own data */}
              {isViewingOwnData && (
                <button
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-all flex items-center gap-2 font-semibold shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Lưu báo cáo
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* {isAdmin && <WeeklyReportEmailTestPanel defaultWeekStart={weekStart} />} */}

        {schedule && (
          <div
            className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
              schedule.phase === 'report_window'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : schedule.phase === 'closed'
                ? 'bg-gray-100 border-gray-200 text-gray-600'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            <p>{schedule.bannerMessage}</p>
            {schedule.metricsLocked && schedule.canSaveReport && (
              <p className="text-xs mt-1 opacity-80">
                Chỉ <strong>KPI Funnel</strong> và <strong>Pipeline</strong> là số tự động (đã chốt đến{' '}
                {schedule.metricsCutoffLabel}). Các mục Candidate Tracker, Sourcing, Plan, Self-review… vẫn
                chỉnh sửa và lưu đến {schedule.reportDeadlineLabel}.
              </p>
            )}
          </div>
        )}

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {isLoading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              <>
                {/* 1. KPI Funnel */}
                <KPIFunnelSection 
                  reportData={reportData}
                  metricsLocked={schedule?.metricsLocked}
                  metricsCutoffLabel={schedule?.metricsCutoffLabel}
                  approaches={formData.approaches_count}
                />

                {/* 2. Pipeline theo Job */}
                <PipelineSection jobs={jobs} stats={pipelineStats} />

                {/* 4. Sourcing Channel */}
                <SourcingChannelSection 
                  data={{
                    channels: formData.sourcing_channels,
                    note: formData.sourcing_note,
                  }}
                  setData={(updates: { channels: any[]; note: string }) => updateFormData({
                    sourcing_channels: updates.channels,
                    sourcing_note: updates.note,
                  })}
                />

                {/* 7. Revenue Tracker */}
                <RevenueSection
                  revenues={
                    Array.isArray(formData.revenues)
                      ? formData.revenues
                      : [{ ...EMPTY_REVENUE_ROW }]
                  }
                  setRevenues={(val) => {
                    const base = Array.isArray(formData.revenues)
                      ? formData.revenues
                      : [{ ...EMPTY_REVENUE_ROW }];
                    const next = typeof val === 'function' ? val(base) : val;
                    updateFormData({ revenues: next });
                  }}
                />
              </>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {isLoading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              <>
                {/* 3. Candidate Tracker */}
                <CandidateTrackerSection 
                  userId={user?.id} 
                  weekStart={weekStart}
                  candidateTracker={formData.candidate_tracker}
                  setCandidateTracker={(val: any) => updateFormData({ candidate_tracker: val })}
                  parentLoading={isLoading}
                />

                {/* 5. Vấn đề & Hành động */}
                <IssuesSection 
                  issues={formData.week_note}
                  setIssues={(val: string) => updateFormData({ week_note: val })}
                />

                {/* 6. Kế hoạch tuần sau */}
                <PlanSection
                  weekStart={weekStart}
                  userId={effectiveUserId}
                  selectedJobs={formData.selected_jobs}
                  jobPlans={formData.job_plans}
                  setSelectedJobs={(val: string[]) => updateFormData({ selected_jobs: val })}
                  setJobPlans={(val: Record<string, { cv_target?: number; priority?: number; note?: string }>) =>
                    updateFormData({ job_plans: val })
                  }
                />

                {/* 8. Self-review */}
                <SelfReviewSection 
                  data={{
                    score: formData.self_review_score,
                    lessons: formData.self_review_lessons,
                    support: formData.self_review_support_needed,
                  }}
                  setData={(updates: { score: number; lessons: string; support: string }) => updateFormData({
                    self_review_score: updates.score,
                    self_review_lessons: updates.lessons,
                    self_review_support_needed: updates.support,
                  })}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
