import { supabase } from '../../lib/supabase';
import type {
  JobFocusAssignment,
  JobFocusWithDetails,
  JobPipelineStats,
  PipelineStageDetail,
  PipelineStageCandidate,
  CreateJobFocusPayload,
  UpdateJobFocusPayload,
  GetJobFocusParams,
  WeeklyReport,
  CreateWeeklyReportPayload,
  UpdateWeeklyReportPayload,
  WeeklyReportData,
  MonthlyAccumulatedStats,
  UpdateJobPlanPayload,
} from './types';

/**
 * Helper: Lấy Thứ Bảy của tuần chứa ngày bất kỳ (rule tuần: T7 → hết T6 sau)
 * Dùng function get_week_start() từ DB
 */
export async function getWeekStart(date: Date = new Date()): Promise<string> {
  const vnDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

  const { data, error } = await supabase.rpc('get_week_start', {
    d: vnDate,
  });

  if (error) throw error;
  return data as string;
}

/**
 * Lấy danh sách job focus assignments (raw table)
 */
export async function getJobFocusAssignments(params: GetJobFocusParams = {}) {
  let query = supabase
    .from('job_focus_assignments')
    .select('*')
    .order('week_start', { ascending: false })
    .order('created_at', { ascending: false });

  if (params.assignee_id) {
    query = query.eq('assignee_id', params.assignee_id);
  }

  if (params.week_start) {
    query = query.eq('week_start', params.week_start);
  }

  if (params.assigned_by) {
    query = query.eq('assigned_by', params.assigned_by);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as JobFocusAssignment[];
}

/**
 * Lấy job focus với thông tin đầy đủ (từ view)
 * Dùng cho HH Dashboard / Job Focus Page
 */
export async function getJobFocusWithDetails(params: GetJobFocusParams = {}) {
  let query = supabase
    .from('job_focus_with_details')
    .select('*')
    .order('week_start', { ascending: false })
    .order('created_at', { ascending: false });

  if (params.assignee_id) {
    query = query.eq('assignee_id', params.assignee_id);
  }

  if (params.week_start) {
    query = query.eq('week_start', params.week_start);
  }

  if (params.assigned_by) {
    query = query.eq('assigned_by_id', params.assigned_by);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as JobFocusWithDetails[];
}

/**
 * Lấy job focus của user hiện tại cho tuần cụ thể
 */
export async function getMyJobFocus(weekStart?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const week = weekStart || await getWeekStart();

  return getJobFocusWithDetails({
    assignee_id: user.id,
    week_start: week,
  });
}

/**
 * Lấy job focus của toàn team (cho HH Lead)
 * Lọc theo users có managed_by_id = current user
 */
export async function getTeamJobFocus(weekStart?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const week = weekStart || await getWeekStart();

  // Lấy danh sách user trong team
  const { data: teamMembers, error: teamError } = await supabase
    .from('users')
    .select('id')
    .eq('managed_by_id', user.id);

  if (teamError) throw teamError;

  const memberIds = teamMembers?.map(m => m.id) || [];

  if (memberIds.length === 0) {
    return []; // Không có team member
  }

  // Lấy job focus của team
  const { data, error } = await supabase
    .from('job_focus_with_details')
    .select('*')
    .eq('week_start', week)
    .in('assignee_id', memberIds)
    .order('assignee_name', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as JobFocusWithDetails[];
}

/**
 * Tạo job focus assignment mới
 */
export async function createJobFocusAssignment(payload: CreateJobFocusPayload) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('job_focus_assignments')
    .insert({
      ...payload,
      assigned_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as JobFocusAssignment;
}

/**
 * Cập nhật job focus assignment
 */
export async function updateJobFocusAssignment(
  id: string,
  payload: UpdateJobFocusPayload
) {
  const { data, error } = await supabase
    .from('job_focus_assignments')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as JobFocusAssignment;
}

/**
 * Xóa job focus assignment
 */
export async function deleteJobFocusAssignment(id: string) {
  const { error } = await supabase
    .from('job_focus_assignments')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

/**
 * Lấy danh sách team members (cho HH Lead và Admin)
 * - HH Lead: Chỉ lấy Headhunter có managed_by_id = current user
 * - Admin: Lấy tất cả Headhunter active
 * Dùng để populate dropdown khi assign job hoặc xem KPI/Report
 */
export async function getTeamMembers() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get current user's role
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = currentUser?.role === 'Admin';

  let query = supabase
    .from('users')
    .select('id, full_name, email, role')
    .eq('role', 'Headhunter')
    .eq('is_active', true)
    .order('full_name', { ascending: true });

  // HH Lead: only their team members
  if (!isAdmin) {
    query = query.eq('managed_by_id', user.id);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Batch assign: giao nhiều jobs cho 1 HH cùng lúc
 */
export async function batchAssignJobFocus(
  jobIds: string[],
  assigneeId: string,
  weekStart: string,
  note?: string
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const assignments = jobIds.map(jobId => ({
    job_id: jobId,
    assignee_id: assigneeId,
    assigned_by: user.id,
    week_start: weekStart,
    note: note || null,
  }));

  const { data, error } = await supabase
    .from('job_focus_assignments')
    .insert(assignments)
    .select();

  if (error) throw error;
  return data as JobFocusAssignment[];
}

/**
 * Lấy pipeline stats thật từ processes table
 * Dùng RPC get_job_focus_pipeline_stats (cho Job Focus Page)
 */
export async function getJobFocusPipelineStats(
  assigneeId: string,
  weekStart: string
): Promise<JobPipelineStats[]> {
  const { data, error } = await supabase.rpc('get_job_focus_pipeline_stats', {
    p_assignee_id: assigneeId,
    p_week_start: weekStart,
  });

  if (error) throw error;

  // Map r_ prefix columns về đúng interface
  return ((data || []) as any[]).map(row => ({
    job_id: row.r_job_id,
    cv_client: row.r_cv_client,
    interview: row.r_interview,
    offer: row.r_offer,
    onboard: row.r_onboard,
    conversion_rate: row.r_conversion_rate,
  })) as JobPipelineStats[];
}

/**
 * Lấy pipeline stats cho Weekly Report (dùng process_history)
 * Dùng RPC get_weekly_report_pipeline_stats
 */
export async function getWeeklyReportPipelineStats(
  assigneeId: string,
  weekStart: string
): Promise<JobPipelineStats[]> {
  const { data, error } = await supabase.rpc('get_weekly_report_pipeline_stats', {
    p_assignee_id: assigneeId,
    p_week_start: weekStart,
  });

  if (error) throw error;

  // Map r_ prefix columns về đúng interface (bao gồm cả interview_scheduled và interview_completed)
  return ((data || []) as any[]).map(row => ({
    job_id: row.r_job_id,
    cv_client: row.r_cv_client,
    interview: row.r_interview,
    interview_scheduled: row.r_interview_scheduled,
    interview_completed: row.r_interview_completed,
    offer: row.r_offer,
    onboard: row.r_onboard,
    conversion_rate: row.r_conversion_rate,
  })) as JobPipelineStats[];
}

/**
 * Lấy job focus assignments của HH cho danh sách job_ids cụ thể
 * Dùng để fetch carry-over jobs (giao tuần trước, có activity tuần này)
 */
export async function getJobFocusByJobIds(
  assigneeId: string,
  jobIds: string[]
): Promise<JobFocusWithDetails[]> {
  if (jobIds.length === 0) return [];

  const { data, error } = await supabase
    .from('job_focus_with_details')
    .select('*')
    .eq('assignee_id', assigneeId)
    .in('job_id', jobIds)
    .order('week_start', { ascending: false });

  if (error) throw error;

  // Chỉ lấy bản ghi mới nhất cho mỗi job_id
  const seen = new Set<string>();
  const result: JobFocusWithDetails[] = [];
  for (const row of (data || []) as JobFocusWithDetails[]) {
    if (!seen.has(row.job_id)) {
      seen.add(row.job_id);
      result.push(row);
    }
  }
  return result;
}

/**
 * Lấy detail tooltip cho pipeline (activity-based)
 * Trả về danh sách UV đạt từng stage TRONG tuần, kèm timeline đầy đủ
 */
export async function getPipelineStageDetail(
  assigneeId: string,
  weekStart: string
): Promise<PipelineStageDetail[]> {
  const { data, error } = await supabase.rpc('get_pipeline_stage_detail', {
    p_assignee_id: assigneeId,
    p_week_start: weekStart,
  });

  if (error) throw error;

  // Group theo stage
  const stageMap = new Map<string, PipelineStageCandidate[]>();
  const stages = ['cv_client', 'interview', 'offer', 'onboard'] as const;
  stages.forEach(s => stageMap.set(s, []));

  for (const row of (data || []) as any[]) {
    const stage = row.r_stage as string;
    if (!stageMap.has(stage)) continue;
    stageMap.get(stage)!.push({
      process_id: row.r_process_id,
      job_id: row.r_job_id,
      candidate_name: row.r_candidate_name,
      stage_reached_at: row.r_stage_reached_at,
      cv_submitted_at: row.r_cv_submitted_at ?? null,
      interview_at: row.r_interview_at ?? null,
      offer_at: row.r_offer_at ?? null,
      onboard_at: row.r_onboard_at ?? null,
      assigned_week_start: row.r_assigned_week_start,
    });
  }

  return stages.map(stage => ({
    stage,
    candidates: stageMap.get(stage) || [],
  }));
}
export async function getWeeklyCvToDb(
  assigneeId: string,
  weekStart: string
): Promise<number> {
  const { data, error } = await supabase.rpc('count_cv_to_db_weekly', {
    p_assignee_id: assigneeId,
    p_week_start: weekStart,
  });

  if (error) throw error;
  return (data as number) || 0;
}

/**
 * ============================================================================
 * Weekly Report APIs
 * ============================================================================
 */

/**
 * Lấy weekly report của user cho tuần cụ thể
 */
export async function getWeeklyReport(userId: string, weekStart: string) {
  const { data, error } = await supabase
    .from('weekly_reports')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .maybeSingle();

  if (error) throw error;
  return data as WeeklyReport | null;
}

/**
 * Tạo weekly report mới
 */
export async function createWeeklyReport(payload: CreateWeeklyReportPayload) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('weekly_reports')
    .insert({
      user_id: user.id,
      ...payload,
    })
    .select()
    .single();

  if (error) throw error;
  return data as WeeklyReport;
}

/**
 * Cập nhật weekly report
 */
export async function updateWeeklyReport(
  id: string,
  payload: UpdateWeeklyReportPayload
) {
  const { data, error } = await supabase
    .from('weekly_reports')
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as WeeklyReport;
}

/**
 * Upsert weekly report (tạo mới hoặc update nếu đã tồn tại)
 */
export async function upsertWeeklyReport(
  userId: string,
  weekStart: string,
  payload: Omit<CreateWeeklyReportPayload, 'week_start'>
) {
  const { data, error } = await supabase
    .from('weekly_reports')
    .upsert(
      {
        user_id: userId,
        week_start: weekStart,
        ...payload,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,week_start',
      }
    )
    .select()
    .single();

  if (error) throw error;
  return data as WeeklyReport;
}

/**
 * Lấy toàn bộ data cho Weekly Report page (1 RPC call)
 */
export async function getWeeklyReportData(
  userId: string,
  weekStart: string
): Promise<WeeklyReportData> {
  const { data, error } = await supabase.rpc('get_weekly_report_data', {
    p_user_id: userId,
    p_week_start: weekStart,
  });

  if (error) throw error;
  return data as WeeklyReportData;
}

export interface WeeklyReportDigestTestResult {
  ok?: boolean;
  dry_run?: boolean;
  to?: string | string[];
  subject?: string;
  week_start?: string;
  member_count?: number;
  xlsx_bytes?: number;
  filename?: string;
  xlsx_base64?: string;
  hint?: string;
  error?: string;
}

export interface WeeklyReportReminderTestResult {
  ok?: boolean;
  dry_run?: boolean;
  test_to?: string;
  message?: string;
  resend_id?: string;
  week_start?: string;
  week_range_label?: string;
  recipient_count?: number;
  sent_count?: number;
  sent?: string[];
  failed?: { email: string; error: string }[];
  error?: string;
}

async function parseEdgeFunctionError(error: unknown, fnName: string): Promise<string> {
  if (!error || typeof error !== 'object') {
    return `Edge Function ${fnName} thất bại`;
  }

  const err = error as {
    message?: string;
    context?: Response;
  };

  if (err.context && typeof err.context.json === 'function') {
    try {
      const body = await err.context.json();
      if (typeof body?.error === 'string') return body.error;
      if (body?.hint) return `${body.error ?? err.message} — ${body.hint}`;
      if (body) return JSON.stringify(body);
    } catch {
      /* use fallback */
    }
  }

  return err.message || `Edge Function ${fnName} thất bại`;
}

/**
 * Admin: test nhắc 10:00 T7 — weekly-report-reminder
 */
export async function sendWeeklyReportReminderTest(params: {
  week_start?: string;
  dry_run?: boolean;
  test_to?: string;
}): Promise<WeeklyReportReminderTestResult> {
  const { data, error } = await supabase.functions.invoke('weekly-report-reminder', {
    body: {
      week_start: params.week_start || null,
      dry_run: Boolean(params.dry_run),
      test_to: params.test_to?.trim() || null,
    },
  });

  const result = (data ?? {}) as WeeklyReportReminderTestResult;

  if (error) {
    throw new Error(await parseEdgeFunctionError(error, 'weekly-report-reminder'));
  }

  if (result.error) {
    throw new Error(
      typeof result.error === 'string' ? result.error : JSON.stringify(result.error)
    );
  }

  return result;
}

/**
 * Admin: test digest 12:00 T7 — weekly-report-digest
 */
export async function sendWeeklyReportDigestTest(params: {
  to: string;
  week_start?: string;
  only_saved_reports?: boolean;
  dry_run?: boolean;
  return_file?: boolean;
}): Promise<WeeklyReportDigestTestResult> {
  const { data, error } = await supabase.functions.invoke('weekly-report-digest', {
    body: {
      to: params.to.trim(),
      week_start: params.week_start || null,
      only_saved_reports: params.only_saved_reports ?? true,
      test_mode: true,
      dry_run: Boolean(params.dry_run),
      return_file: Boolean(params.return_file),
    },
  });

  const result = (data ?? {}) as WeeklyReportDigestTestResult;

  if (error) {
    throw new Error(await parseEdgeFunctionError(error, 'weekly-report-digest'));
  }

  if (result.error) {
    throw new Error(
      typeof result.error === 'string' ? result.error : JSON.stringify(result.error)
    );
  }

  return result;
}

/**
 * Lấy monthly accumulated stats
 */
export async function getMonthlyAccumulatedStats(
  userId: string,
  monthStart: string
): Promise<MonthlyAccumulatedStats> {
  const { data, error } = await supabase.rpc('get_monthly_accumulated_stats', {
    p_user_id: userId,
    p_month_start: monthStart,
  });

  if (error) throw error;

  // Map r_ prefix columns
  const row = (data as any[])?.[0];
  if (!row) {
    return {
      cv_client: 0,
      interview: 0,
      offer: 0,
      onboard: 0,
      approaches: 0,
    };
  }

  return {
    cv_client: row.r_cv_client || 0,
    interview: row.r_interview || 0,
    offer: row.r_offer || 0,
    onboard: row.r_onboard || 0,
    approaches: row.r_approaches || 0,
  };
}

/**
 * Cập nhật job plan (kế hoạch tuần sau cho job)
 */
export async function updateJobPlan(
  assignmentId: string,
  payload: Omit<UpdateJobPlanPayload, 'assignment_id'>
) {
  const { data, error } = await supabase
    .from('job_focus_assignments')
    .update({
      plan_cv_count: payload.plan_cv_count,
      plan_deadline: payload.plan_deadline,
      plan_priority_percent: payload.plan_priority_percent,
      plan_note: payload.plan_note,
      updated_at: new Date().toISOString(),
    })
    .eq('id', assignmentId)
    .select()
    .single();

  if (error) throw error;
  return data as JobFocusAssignment;
}


// ============================================================================
// DAILY KPI TRACKER API
// ============================================================================

/**
 * Get or create daily KPI snapshot for a specific date
 */
export async function getOrCreateDailyKPI(userId: string, date: string) {
  const { data, error } = await supabase.rpc('get_or_create_daily_kpi', {
    p_user_id: userId,
    p_date: date,
  });

  if (error) throw error;
  return data?.[0] || null;
}

/**
 * Update daily KPI snapshot
 */
export async function updateDailyKPI(
  id: string,
  payload: import('./types').UpdateDailyKPIPayload
) {
  const { data, error } = await supabase
    .from('daily_kpi_snapshots')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get weekly KPI summary (for Weekly Report)
 */
export async function getWeeklyKPISummary(userId: string, weekStart: string) {
  const { data, error } = await supabase.rpc('get_weekly_kpi_summary', {
    p_user_id: userId,
    p_week_start: weekStart,
  });

  if (error) throw error;
  return data?.[0] || null;
}

/**
 * Finalize daily KPI (called at 17:30)
 */
export async function finalizeDailyKPI(userId: string, date: string) {
  const { data, error } = await supabase.rpc('finalize_daily_kpi', {
    p_user_id: userId,
    p_date: date,
  });

  if (error) throw error;
  return data;
}

/**
 * Get daily KPI history for a week
 */
export async function getDailyKPIHistory(userId: string, weekStart: string) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('daily_kpi_snapshots')
    .select('*')
    .eq('user_id', userId)
    .gte('date', weekStart)
    .lt('date', weekEndStr)
    .order('date', { ascending: true });

  if (error) throw error;
  return data || [];
}


/**
 * ============================================
 * DAILY KPI TRACKER API (FROM PROCESSES)
 * ============================================
 */

/**
 * Lấy KPI hàng ngày (tự động từ processes + manual approaches)
 */
export const getDailyKPIFromProcesses = async (userId: string, date: string) => {
  const { data, error } = await supabase.rpc('get_daily_kpi_from_processes', {
    p_user_id: userId,
    p_date: date,
  });

  if (error) throw error;
  return data?.[0] || null;
};

/**
 * Lấy KPI tuần (7 ngày)
 */
export const getWeeklyKPIFromProcesses = async (userId: string, weekStart: string) => {
  const { data, error } = await supabase.rpc('get_weekly_kpi_from_processes', {
    p_user_id: userId,
    p_week_start: weekStart,
  });

  if (error) throw error;
  return data || [];
};

/**
 * Lưu số Approaches hàng ngày
 */
export const upsertDailyApproaches = async (userId: string, date: string, approaches: number, note?: string) => {
  const { data, error } = await supabase.rpc('upsert_daily_approaches', {
    p_user_id: userId,
    p_date: date,
    p_approaches: approaches,
    p_note: note || null,
  });

  if (error) throw error;
  return data;
};

// ============================================================================
// TEAM DASHBOARD API (for HH Lead)
// ============================================================================

export interface TeamStats {
  cv_to_client_count: number;
  cv_to_client_target: number;
  interview_count: number;
  interview_target: number;
  offer_count: number;
  offer_target: number;
  onboard_count: number;
  onboard_target: number;
}

export interface TeamMemberPerformance {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  jobs_count: number;
  cv_to_client_month: number;
  interview_month: number;
  offer_month: number;
  kpi_month_percent: number;
  status_label: string;
}

export interface TeamJobAttention {
  job_id: string;
  job_title: string;
  client_name: string;
  client_location: string;
  job_rank: string;
  pipeline_cv_sent: number;
  pipeline_interview: number;
  pipeline_offer: number;
  pipeline_onboard: number;
  days_since_created: number;
  estimated_revenue: number;
  status_label: string;
  status_color: string;
  assigned_week: string | null;
  assigned_to_names: string | null;
  latest_process_status: string | null;
  latest_process_updated_at: string | null;
}

/**
 * Get team statistics for the month
 * @param teamLeadId - HH Lead's user_id, or null = Admin xem all
 */
export async function getTeamStats(
  teamLeadId: string | null,
  monthStart: string
): Promise<TeamStats> {
  const { data, error } = await supabase.rpc('get_team_stats', {
    p_team_lead_id: teamLeadId,
    p_month_start: monthStart,
  });

  if (error) throw error;
  
  const row = (data as any[])?.[0];
  if (!row) {
    return {
      cv_to_client_count: 0,
      cv_to_client_target: 0,
      interview_count: 0,
      interview_target: 0,
      offer_count: 0,
      offer_target: 0,
      onboard_count: 0,
      onboard_target: 0,
    };
  }

  return row as TeamStats;
}

/**
 * Get team members performance
 * @param teamLeadId - HH Lead's user_id, or null = Admin xem all
 */
export async function getTeamMembersPerformance(
  teamLeadId: string | null,
  monthStart: string
): Promise<TeamMemberPerformance[]> {
  const { data, error } = await supabase.rpc('get_team_members_performance', {
    p_team_lead_id: teamLeadId,
    p_month_start: monthStart,
  });

  if (error) throw error;
  return (data || []) as TeamMemberPerformance[];
}

/**
 * Get jobs that need attention from the team
 * @param teamLeadId - HH Lead's user_id, or null = Admin xem all
 */
export async function getTeamJobsAttention(
  teamLeadId: string | null,
  limit: number = 10
): Promise<TeamJobAttention[]> {
  const { data, error } = await supabase.rpc('get_team_jobs_attention', {
    p_team_lead_id: teamLeadId,
    p_limit: limit,
  });

  if (error) throw error;
  return (data || []) as TeamJobAttention[];
}
