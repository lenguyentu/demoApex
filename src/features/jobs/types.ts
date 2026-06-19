/**
 * Enum cho các phase của job - job_phase_enum
 */
export type JobPhase = 
  | 'Open'
  | 'Filled by TDC'
  | 'Cancelled'
  | 'Closed'
  | 'On_Hold';

/**
 * Enum cho loại assignment - job_assignment_type_enum
 */
export type JobAssignmentType = 'Headhunt' | 'CTV' | 'Freelancer';

/**
 * Enum cho cấp độ tiếng Anh
 */
export type EnglishLevel = 
  | 'Native'
  | 'Fluent'
  | 'Business'
  | 'Conversational'
  | 'Basic'
  | 'None';

/**
 * Enum cho TD Job Category
 */
export type TDJobCategory = 'IT' | 'Non-IT' | 'Ecommerce' | 'App/Games';

/**
 * Enum cho Job Rank
 */
export type JobRank = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

/**
 * Enum cho Job Level
 */
export type JobLevel = 
  | 'Intern'
  | 'Fresher'
  | 'Junior'
  | 'Middle'
  | 'Senior'
  | 'Lead'
  | 'Manager'
  | 'Director'
  | 'C-Level';

export interface UrgentInfo {
  tag1?: string;
  tag2?: string;
  note?: string;
}

/**
 * Interface chính cho Job (bảng jobs)
 */
export interface Job {
  id: string;
  job_id?: string | null;
  job_code?: string | null;
  
  // Relationships
  client_id?: string | null;
  hr_contact_id?: string | null;
  owner_id?: string | null;
  
  // Job Info
  position_title?: string | null;
  job_summary?: string | null;
  report_to?: string | null;
  requirements?: string | null;
  number_of_employees?: number | null;
  working_hours?: string | null;
  company_overview?: string | null;
  jd_clear?: string | null;
  
  // Phase
  phase?: JobPhase | null;
  phase_date?: string | null;
  phase_memo?: string | null;
  
  // Categories
  industry_category?: string | null;
  td_job_category?: TDJobCategory | null;
  job_rank?: JobRank | null;
  job_level?: JobLevel | null;
  
  // Salary
  min_monthly_salary?: string | null;
  max_monthly_salary?: string | null;
  min_annual_salary?: string | null;
  max_annual_salary?: string | null;
  
  // Requirements
  lower_age_limit?: number | null;
  upper_age_limit?: number | null;
  english_level?: EnglishLevel | null;
  other_languages?: string[] | null;
  visa_support?: boolean | null;
  
  // Location
  work_location?: string | null;
  work_address?: string | null;
  mrt_station?: string | null;
  
  // Benefits
  insurance?: string | null;
  bonus?: string | null;
  allowance?: string | null;
  annual_leave?: string | null;
  sick_leave?: string | null;
  probation_period?: string | null;
  
  // Interview
  interview_rounds?: number | null;
  
  // Assignment & Fees
  assignment_type?: JobAssignmentType | null;
  headhunt_fee?: string | null;
  ctv_fee?: string | null;
  freelance_fee?: string | null;
  freelance_fee_numeric?: number | null;
  warranty_period_days?: number | null;
  
  // Notes
  internal_memo?: string | null;
  meeting_note?: string | null;
  
  // Watch & Evaluation
  watch_emails?: string[] | null;
  evaluation_criteria?: Record<string, unknown> | null;
  comments_count?: number | null;
  is_urgent?: boolean | null;
  urgent_info?: UrgentInfo | null;
  
  // Audit fields
  created_at: string;
  created_by_id?: string | null;
  updated_at?: string | null;
  updated_by_id?: string | null;
  
  // Joined data (from relations)
  clients?: {
    id: string;
    client_name?: string | null;
  } | null;
  hr_contacts?: {
    id: string;
    name?: string | null;
  } | null;
  owner?: {
    id: string;
    full_name?: string | null;
  } | null;
}

/**
 * Payload để tạo/cập nhật Job
 */
export type JobFormData = Omit<
  Job,
  'id' | 'created_at' | 'updated_at' | 'created_by_id' | 'updated_by_id' | 'clients' | 'hr_contacts' | 'owner'
>;

/**
 * Mode cho JobsPage
 */
export type JobMode = 'open' | 'admin';

/**
 * Interface cho Job Comment (bảng job_comments)
 */
export interface JobComment {
  id: string;
  job_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string;
    email?: string;
    role?: string;
  };
  replies?: JobComment[];
}
