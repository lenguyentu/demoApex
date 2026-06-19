import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyJobFocus,
  getTeamJobFocus,
  getJobFocusWithDetails,
  getJobFocusByJobIds,
  createJobFocusAssignment,
  updateJobFocusAssignment,
  deleteJobFocusAssignment,
  getTeamMembers,
  batchAssignJobFocus,
  getWeekStart,
  getJobFocusPipelineStats,
  getWeeklyReportPipelineStats,
  getWeeklyCvToDb,
  getPipelineStageDetail,
  getWeeklyReport,
  createWeeklyReport,
  updateWeeklyReport,
  upsertWeeklyReport,
  getWeeklyReportData,
  getMonthlyAccumulatedStats,
  updateJobPlan,
} from './api';
import type {
  CreateJobFocusPayload,
  UpdateJobFocusPayload,
  GetJobFocusParams,
  CreateWeeklyReportPayload,
  UpdateWeeklyReportPayload,
  UpdateJobPlanPayload,
} from './types';

/**
 * Hook: Lấy job focus của user hiện tại
 */
export function useMyJobFocus(weekStart?: string) {
  return useQuery({
    queryKey: ['myJobFocus', weekStart],
    queryFn: () => getMyJobFocus(weekStart),
    staleTime: 2 * 60 * 1000, // 2 phút
  });
}

/**
 * Hook: Lấy job focus của toàn team (HH Lead)
 */
export function useTeamJobFocus(weekStart?: string) {
  return useQuery({
    queryKey: ['teamJobFocus', weekStart],
    queryFn: () => getTeamJobFocus(weekStart),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook: Lấy job focus với params tùy chỉnh
 */
export function useJobFocusWithDetails(params: GetJobFocusParams = {}) {
  return useQuery({
    queryKey: ['jobFocusWithDetails', params],
    queryFn: () => getJobFocusWithDetails(params),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook: Lấy danh sách team members (cho dropdown assign)
 */
export function useTeamMembers() {
  return useQuery({
    queryKey: ['teamMembers'],
    queryFn: getTeamMembers,
    staleTime: 5 * 60 * 1000, // 5 phút
  });
}

/**
 * Hook: Lấy Thứ Bảy của tuần hiện tại (rule tuần: T7 → hết T6 sau)
 */
export function useCurrentWeekStart() {
  return useQuery({
    queryKey: ['currentWeekStart'],
    queryFn: () => getWeekStart(),
    staleTime: 60 * 60 * 1000, // 1 giờ
  });
}

/**
 * Hook: Tạo job focus assignment
 */
export function useCreateJobFocus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateJobFocusPayload) => createJobFocusAssignment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myJobFocus'] });
      queryClient.invalidateQueries({ queryKey: ['teamJobFocus'] });
      queryClient.invalidateQueries({ queryKey: ['jobFocusWithDetails'] });
    },
  });
}

/**
 * Hook: Update job focus assignment
 */
export function useUpdateJobFocus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateJobFocusPayload }) =>
      updateJobFocusAssignment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myJobFocus'] });
      queryClient.invalidateQueries({ queryKey: ['teamJobFocus'] });
      queryClient.invalidateQueries({ queryKey: ['jobFocusWithDetails'] });
    },
  });
}

/**
 * Hook: Xóa job focus assignment
 */
export function useDeleteJobFocus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteJobFocusAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myJobFocus'] });
      queryClient.invalidateQueries({ queryKey: ['teamJobFocus'] });
      queryClient.invalidateQueries({ queryKey: ['jobFocusWithDetails'] });
    },
  });
}

/**
 * Hook: Batch assign jobs
 */
export function useBatchAssignJobFocus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jobIds,
      assigneeId,
      weekStart,
      note,
    }: {
      jobIds: string[];
      assigneeId: string;
      weekStart: string;
      note?: string;
    }) => batchAssignJobFocus(jobIds, assigneeId, weekStart, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myJobFocus'] });
      queryClient.invalidateQueries({ queryKey: ['teamJobFocus'] });
      queryClient.invalidateQueries({ queryKey: ['jobFocusWithDetails'] });
    },
  });
}

/**
 * Hook: Lấy pipeline stats thật từ processes table
 * Chỉ fetch khi có assigneeId và weekStart
 */
export function useJobFocusPipelineStats(assigneeId?: string, weekStart?: string) {
  return useQuery({
    queryKey: ['jobFocusPipelineStats', assigneeId, weekStart],
    queryFn: () => getJobFocusPipelineStats(assigneeId!, weekStart!),
    enabled: !!assigneeId && !!weekStart,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook: Lấy pipeline stats cho Weekly Report (dùng process_history)
 * Chỉ fetch khi có assigneeId và weekStart
 */
export function useWeeklyReportPipelineStats(assigneeId?: string, weekStart?: string) {
  return useQuery({
    queryKey: ['weeklyReportPipelineStats', assigneeId, weekStart],
    queryFn: () => getWeeklyReportPipelineStats(assigneeId!, weekStart!),
    enabled: !!assigneeId && !!weekStart,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook: Đếm số CV được tạo trong tuần (CV to DB metric)
 */
export function useWeeklyCvToDb(assigneeId?: string, weekStart?: string) {
  return useQuery({
    queryKey: ['weeklyCvToDb', assigneeId, weekStart],
    queryFn: () => getWeeklyCvToDb(assigneeId!, weekStart!),
    enabled: !!assigneeId && !!weekStart,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook: Lấy carry-over jobs theo danh sách job_ids
 * Enabled khi có assigneeId và jobIds không rỗng
 */
export function useJobFocusByJobIds(assigneeId?: string, jobIds?: string[]) {
  return useQuery({
    queryKey: ['jobFocusByJobIds', assigneeId, jobIds],
    queryFn: () => getJobFocusByJobIds(assigneeId!, jobIds!),
    enabled: !!assigneeId && !!jobIds && jobIds.length > 0,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook: Lấy detail tooltip pipeline (activity-based)
 * Trả về danh sách UV đạt từng stage trong tuần, kèm timeline
 */
export function usePipelineStageDetail(assigneeId?: string, weekStart?: string) {
  return useQuery({
    queryKey: ['pipelineStageDetail', assigneeId, weekStart],
    queryFn: () => getPipelineStageDetail(assigneeId!, weekStart!),
    enabled: !!assigneeId && !!weekStart,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * ============================================================================
 * Weekly Report Hooks
 * ============================================================================
 */

/**
 * Hook: Lấy weekly report của user cho tuần cụ thể
 */
export function useWeeklyReport(userId?: string, weekStart?: string) {
  return useQuery({
    queryKey: ['weeklyReport', userId, weekStart],
    queryFn: () => getWeeklyReport(userId!, weekStart!),
    enabled: !!userId && !!weekStart,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook: Lấy toàn bộ data cho Weekly Report page (1 RPC call)
 * Bao gồm: current week stats, monthly accumulated, targets, approaches
 */
export function useWeeklyReportData(userId?: string, weekStart?: string) {
  return useQuery({
    queryKey: ['weeklyReportData', userId, weekStart],
    queryFn: () => getWeeklyReportData(userId!, weekStart!),
    enabled: !!userId && !!weekStart,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook: Lấy monthly accumulated stats
 */
export function useMonthlyAccumulatedStats(userId?: string, monthStart?: string) {
  return useQuery({
    queryKey: ['monthlyAccumulatedStats', userId, monthStart],
    queryFn: () => getMonthlyAccumulatedStats(userId!, monthStart!),
    enabled: !!userId && !!monthStart,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook: Tạo weekly report mới
 */
export function useCreateWeeklyReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateWeeklyReportPayload) => createWeeklyReport(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeklyReport'] });
      queryClient.invalidateQueries({ queryKey: ['weeklyReportData'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyAccumulatedStats'] });
    },
  });
}

/**
 * Hook: Update weekly report
 */
export function useUpdateWeeklyReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateWeeklyReportPayload }) =>
      updateWeeklyReport(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeklyReport'] });
      queryClient.invalidateQueries({ queryKey: ['weeklyReportData'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyAccumulatedStats'] });
    },
  });
}

/**
 * Hook: Upsert weekly report (tạo mới hoặc update)
 */
export function useUpsertWeeklyReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      weekStart,
      payload,
    }: {
      userId: string;
      weekStart: string;
      payload: Omit<CreateWeeklyReportPayload, 'week_start'>;
    }) => upsertWeeklyReport(userId, weekStart, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeklyReport'] });
      queryClient.invalidateQueries({ queryKey: ['weeklyReportData'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyAccumulatedStats'] });
    },
  });
}

/**
 * Hook: Update job plan (kế hoạch tuần sau cho job)
 */
export function useUpdateJobPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateJobPlanPayload) =>
      updateJobPlan(payload.assignment_id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobFocusWithDetails'] });
      queryClient.invalidateQueries({ queryKey: ['myJobFocus'] });
      queryClient.invalidateQueries({ queryKey: ['teamJobFocus'] });
    },
  });
}


// ============================================================================
// DAILY KPI TRACKER HOOKS
// ============================================================================

import {
  getOrCreateDailyKPI,
  updateDailyKPI,
  getWeeklyKPISummary,
  finalizeDailyKPI,
  getDailyKPIHistory,
} from './api';

/**
 * Hook: Get or create daily KPI for a specific date
 */
export function useDailyKPI(userId?: string, date?: string) {
  return useQuery({
    queryKey: ['dailyKPI', userId, date],
    queryFn: () => getOrCreateDailyKPI(userId!, date!),
    enabled: !!userId && !!date,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook: Update daily KPI
 */
export function useUpdateDailyKPI() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: import('./types').UpdateDailyKPIPayload }) =>
      updateDailyKPI(id, payload),
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['dailyKPI', data.user_id, data.date] });
      queryClient.invalidateQueries({ queryKey: ['weeklyKPISummary', data.user_id] });
      queryClient.invalidateQueries({ queryKey: ['dailyKPIHistory', data.user_id] });
    },
  });
}

/**
 * Hook: Get weekly KPI summary
 */
export function useWeeklyKPISummary(userId?: string, weekStart?: string) {
  return useQuery({
    queryKey: ['weeklyKPISummary', userId, weekStart],
    queryFn: () => getWeeklyKPISummary(userId!, weekStart!),
    enabled: !!userId && !!weekStart,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook: Finalize daily KPI
 */
export function useFinalizeDailyKPI() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, date }: { userId: string; date: string }) =>
      finalizeDailyKPI(userId, date),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dailyKPI', variables.userId, variables.date] });
      queryClient.invalidateQueries({ queryKey: ['weeklyKPISummary', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['dailyKPIHistory', variables.userId] });
    },
  });
}

/**
 * Hook: Get daily KPI history for a week
 */
export function useDailyKPIHistory(userId?: string, weekStart?: string) {
  return useQuery({
    queryKey: ['dailyKPIHistory', userId, weekStart],
    queryFn: () => getDailyKPIHistory(userId!, weekStart!),
    enabled: !!userId && !!weekStart,
    staleTime: 30 * 1000, // 30 seconds
  });
}




// ============================================================================
// TEAM DASHBOARD HOOKS (for HH Lead)
// ============================================================================

import {
  getTeamStats,
  getTeamMembersPerformance,
  getTeamJobsAttention,
} from './api';

/**
 * Hook: Get team statistics for the month
 * @param teamLeadId - undefined = chưa sẵn sàng (skip), null = Admin xem all, string = HH Lead's team
 */
export function useTeamStats(teamLeadId: string | null | undefined, monthStart?: string) {
  return useQuery({
    queryKey: ['teamStats', teamLeadId, monthStart],
    queryFn: () => getTeamStats(teamLeadId ?? null, monthStart!),
    enabled: teamLeadId !== undefined && !!monthStart,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook: Get team members performance
 * @param teamLeadId - undefined = chưa sẵn sàng (skip), null = Admin xem all, string = HH Lead's team
 */
export function useTeamMembersPerformance(
  teamLeadId: string | null | undefined,
  monthStart?: string
) {
  return useQuery({
    queryKey: ['teamMembersPerformance', teamLeadId, monthStart],
    queryFn: () => getTeamMembersPerformance(teamLeadId ?? null, monthStart!),
    enabled: teamLeadId !== undefined && !!monthStart,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook: Get jobs that need attention
 * @param teamLeadId - undefined = chưa sẵn sàng (skip), null = Admin xem all, string = HH Lead's team
 */
export function useTeamJobsAttention(teamLeadId: string | null | undefined, limit: number = 10) {
  return useQuery({
    queryKey: ['teamJobsAttention', teamLeadId, limit],
    queryFn: () => getTeamJobsAttention(teamLeadId ?? null, limit),
    enabled: teamLeadId !== undefined,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
