/**
 * Job Focus Assignment Types
 */

export interface JobFocusAssignment {
  id: string;
  job_id: string;
  week_start: string; // ISO date string (Saturday — start of T7→T6 week)
  assigned_by: string;
  note?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Daily KPI Tracker Types
 */

export interface DailyKPISnapshot {
  id: string;
  user_id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  
  // KPI Metrics
  approaches: number;
  cv_to_db: number;
  cv_to_client: number;
  setup_interview: number;
  actual_interview: number;
  offer: number;
  
  // Daily Targets
  target_approaches: number;
  target_cv_db: number;
  target_cv_client: number;
  target_setup_interview: number;
  target_actual_interview: number;
  target_offer: number;
  
  // Note
  note?: string | null;
  
  // Finalization
  is_finalized: boolean;
  finalized_at?: string | null;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface UpdateDailyKPIPayload {
  approaches?: number;
  cv_to_db?: number;
  cv_to_client?: number;
  setup_interview?: number;
  actual_interview?: number;
  offer?: number;
  note?: string;
}

export interface WeeklyKPISummary {
  week_start: string;
  total_approaches: number;
  total_cv_to_db: number;
  total_cv_to_client: number;
  total_setup_interview: number;
  total_actual_interview: number;
  total_offer: number;
  target_approaches: number;
  target_cv_db: number;
  target_cv_client: number;
  target_setup_interview: number;
  target_actual_interview: number;
  target_offer: number;
  days_with_data: number;
  daily_breakdown: Array<{
    date: string;
    approaches: number;
    cv_to_db: number;
    cv_to_client: number;
    setup_interview: number;
    actual_interview: number;
    offer: number;
    note?: string;
    is_finalized: boolean;
  }>;
}

/**
 * Job Focus với thông tin đầy đủ (từ view job_focus_with_details)
 */
export interface JobFocusWithDetails {
  id: string;
  week_start: string;
  note?: string | null;
  created_at: string;

  // Plan fields (kế hoạch tuần sau)
  plan_cv_count?: number | null;
  plan_deadline?: string | null;
  plan_priority_percent?: number | null;
  plan_note?: string | null;

  // Job info
  job_id: string;        // UUID của job
  job_code?: string | null; // Mã TDC00X
  position_title?: string | null;
  phase?: string | null;
  phase_date?: string | null;
  headhunt_fee?: string | null;
  ctv_fee?: string | null;
  freelance_fee?: string | null;
  td_job_category?: string | null;
  work_location?: string | null;
  number_of_employees?: number | null;
  interview_rounds?: number | null;
  warranty_period_days?: number | null;
  min_monthly_salary?: string | null;
  max_monthly_salary?: string | null;

  // Client info
  client_id?: string | null;
  client_name?: string | null;
  client_rank?: string | null;

  // Assignee (HH)
  assignee_id: string;
  assignee_name?: string | null;
  assignee_role?: string | null;

  // Assigned by (HH Lead / Admin)
  assigned_by_id: string;
  assigned_by_name?: string | null;
}

/**
 * Payload để tạo assignment mới
 */
export interface CreateJobFocusPayload {
  job_id: string;
  assignee_id: string;
  week_start: string; // ISO date string (Saturday — start of T7→T6 week)
  note?: string;
}

/**
 * Payload để update assignment
 */
export interface UpdateJobFocusPayload {
  note?: string;
}

/**
 * Params để query job focus
 */
export interface GetJobFocusParams {
  assignee_id?: string;
  week_start?: string;
  assigned_by?: string;
}

/**
 * Pipeline stats cho 1 job (data thật từ processes table)
 */
export interface JobPipelineStats {
  job_id: string;
  cv_client: number;
  interview: number;
  interview_scheduled?: number;  // NEW: Chỉ dùng cho Weekly Report
  interview_completed?: number;  // NEW: Chỉ dùng cho Weekly Report
  offer: number;
  onboard: number;
  conversion_rate: number;
}

/**
 * 1 ứng viên trong tooltip của pipeline stage
 */
export interface PipelineStageCandidate {
  process_id: string;
  job_id: string;              // để frontend merge carry-over job vào danh sách
  candidate_name: string;
  stage_reached_at: string;
  cv_submitted_at?: string | null;
  interview_at?: string | null;
  offer_at?: string | null;
  onboard_at?: string | null;
  assigned_week_start: string; // tuần job được giao gần nhất → detect carry-over
}

/**
 * Detail tooltip cho từng stage của pipeline (activity-based)
 */
export interface PipelineStageDetail {
  stage: 'cv_client' | 'interview' | 'offer' | 'onboard';
  candidates: PipelineStageCandidate[];
}

/**
 * Weekly Report Types
 */

/**
 * Candidate Tracker Data - Editable fields per process
 */
export interface CandidateTrackerData {
  next_step?: string;
  deadline?: string; // ISO date string
  risk_note?: string;
}

/**
 * Sourcing Channel Data - Multi-channel tracking
 */
export interface SourcingChannelData {
  name: string;  // Facebook, LinkedIn, Indeed, etc.
  followers_start: number;
  followers_end: number;
  cv_received: number;
  posts_count: number;
  note?: string;
}

/** Section 7 — Revenue Tracker row */
export interface WeeklyReportRevenueRow {
  id: number;
  candidate: string;
  position: string;
  client: string;
  salary: number;
  rate: number;
  bill: number;
}

export interface WeeklyReport {
  id: string;
  user_id: string;
  week_start: string; // ISO date string (Saturday — start of T7→T6 week)
  
  // 1. KPI Funnel - Manual inputs
  approaches_count: number;
  target_approaches: number;
  target_cv_db: number;
  target_cv_client: number;
  target_setup_interview: number;
  target_interview: number;
  target_offer: number;
  target_placement: number;
  
  // 3. Candidate Tracker - Editable fields
  candidate_tracker?: Record<string, CandidateTrackerData>; // { "process_id": { next_step, deadline, risk_note } }
  
  // 4. Sourcing Channel (multi-channel tracking)
  sourcing_channels?: SourcingChannelData[];  // Array of channels
  sourcing_note?: string | null;  // Ghi chú chung
  
  // 5. Issues (simplified)
  week_note?: string | null;

  // 7. Revenue Tracker
  revenue_tracker?: WeeklyReportRevenueRow[];
  
  // 8. Self-review
  self_review_score?: number | null;
  self_review_lessons?: string | null;
  self_review_support_needed?: string | null;
  
  // Metadata
  submitted_at?: string | null;
  is_submitted: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateWeeklyReportPayload {
  week_start: string;
  approaches_count?: number;
  target_approaches?: number;
  target_cv_db?: number;
  target_cv_client?: number;
  target_setup_interview?: number;
  target_interview?: number;
  target_offer?: number;
  target_placement?: number;
  candidate_tracker?: Record<string, CandidateTrackerData>;
  sourcing_channels?: SourcingChannelData[];
  sourcing_note?: string;
  week_note?: string;
  revenue_tracker?: WeeklyReportRevenueRow[];
  self_review_score?: number;
  self_review_lessons?: string;
  self_review_support_needed?: string;
}

export interface UpdateWeeklyReportPayload {
  approaches_count?: number;
  target_approaches?: number;
  target_cv_db?: number;
  target_cv_client?: number;
  target_setup_interview?: number;
  target_interview?: number;
  target_offer?: number;
  target_placement?: number;
  candidate_tracker?: Record<string, CandidateTrackerData>;
  sourcing_channels?: SourcingChannelData[];
  sourcing_note?: string;
  week_note?: string;
  revenue_tracker?: WeeklyReportRevenueRow[];
  self_review_score?: number;
  self_review_lessons?: string;
  self_review_support_needed?: string;
}


/**
 * Weekly Report Data (từ RPC get_weekly_report_data)
 */
export interface WeeklyReportData {
  week_start: string;
  month_start: string;
  current_week: {
    cv_to_db: number;
    cv_client: number;
    interview: number;
    offer: number;
    onboard: number;
  };
  monthly_accumulated: {
    cv_client: number;
    interview: number;
    offer: number;
    onboard: number;
    approaches: number;
  };
  targets: {
    cv_client: number;
    interview: number;
    offer: number;
    placement: number;
  };
  approaches_count: number;
  candidate_tracker?: Record<string, CandidateTrackerData>;
  week_note?: string | null;
  sourcing_channels?: SourcingChannelData[];
  sourcing_note?: string | null;
  revenue_tracker?: WeeklyReportRevenueRow[];
  self_review_score?: number | null;
  self_review_lessons?: string | null;
  self_review_support_needed?: string | null;
  report_exists: boolean;
}

/**
 * Monthly Accumulated Stats (từ RPC get_monthly_accumulated_stats)
 */
export interface MonthlyAccumulatedStats {
  cv_client: number;
  interview: number;
  offer: number;
  onboard: number;
  approaches: number;
}

/**
 * Job Plan (kế hoạch tuần sau cho từng job)
 * Lưu trong job_focus_assignments
 */
export interface JobPlan {
  plan_cv_count?: number | null;
  plan_deadline?: string | null; // ISO date
  plan_priority_percent?: number | null; // 0-100%
  plan_note?: string | null;
}

export interface UpdateJobPlanPayload {
  assignment_id: string;
  plan_cv_count?: number;
  plan_deadline?: string;
  plan_priority_percent?: number;
  plan_note?: string;
}


/**
 * ============================================
 * DAILY KPI TRACKER TYPES
 * ============================================
 */

export interface DailyKPI {
  id: string;
  user_id: string;
  date: string; // ISO date string
  
  // KPI metrics
  approaches: number;
  cv_to_db: number;
  cv_to_client: number;
  setup_interview: number;
  actual_interview: number;
  offer: number;
  
  // Targets
  target_approaches: number;
  target_cv_db: number;
  target_cv_client: number;
  
  // Note
  note?: string | null;
  
  // Finalization
  is_finalized: boolean;
  finalized_at?: string | null;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface WeeklyKPIHistoryRow {
  date: string;
  day_of_week: string; // "T2 07/04"
  approaches: number;
  cv_to_db: number;
  cv_to_client: number;
  setup_interview: number;
  actual_interview: number;
  offer: number;
  note: string;
  is_finalized: boolean;
  is_today: boolean;
}

export interface UpsertDailyKPIPayload {
  userId: string;
  date: string; // ISO date string
  approaches: number;
  cvToDb: number;
  cvToClient: number;
  setupInterview: number;
  actualInterview: number;
  offer: number;
  note?: string;
}
