/**
 * Enum cho các trạng thái ứng viên (Phase)
 */
/**
 * Enum cho các trạng thái ứng viên (Phase)
 */
export type CandidatePhase = 
  | 'New_Lead'
  | 'Contacted'
  | 'Screening'
  | 'Qualified'
  | 'Submitted_To_Client'
  | 'Interview_Process'
  | 'Offer_Stage'
  | 'Placed'
  | 'Archived_Not_Suitable'
  | 'Archived_Not_Interested';

/**
 * Enum cho xếp hạng ứng viên
 */
export type CandidateRank = 'A' | 'B' | 'C' | 'D';

/**
 * Enum cho loại visa
 */
export type VisaStatus = 'Citizen' | 'Permanent_Resident' | 'Work_Permit_Holder' | 'Dependent_Pass_Holder' | 'Student_Pass_Holder' | 'Requires_Sponsorship' | 'Not_Applicable';

/**
 * Enum cho giới tính
 */
export type Gender = 'Male' | 'Female' | 'Other';

/**
 * Enum cho loại hình làm việc
 */
export type EmploymentType = 'Full_Time_Permanent' | 'Part_Time_Permanent' | 'Contract' | 'Temporary' | 'Freelance' | 'Internship';

/**
 * Interface lịch sử nghề nghiệp
 */
export interface ProfessionalHistoryItem {
  position?: string;
  companyName?: string;
  company?: string; // Legacy field, prefer companyName
  duration?: string;
  period?: string; // Legacy field, prefer duration
  description?: string;
}

/**
 * Base interface chứa các trường chung giữa Candidate và DatabaseCandidate
 */
export interface BaseCandidate {
  id: string;
  name: string;
  gender?: Gender | null;
  date_of_birth?: string | null;
  email?: string | null;
  photo_url?: string | null;
  visa_status?: VisaStatus | null;
  ic_passport_no?: string | null;
  caution?: boolean | null;
  linkedin?: string | null;
  facebook?: string | null;
  address?: string | null;
  phase?: CandidatePhase | null;
  phase_date?: string | null;
  phase_memo?: string | null;
  is_potential?: boolean | null;
  cdd_rank?: CandidateRank | null;
  entry_route?: string | null;
  preferred_industry?: string | null;
  preferred_job?: string | null;
  expected_monthly_salary?: string | null;
  expected_annual_salary?: string | null;
  preferred_location?: string | null;
  preferred_mrt?: string | null;
  notice_period?: string | null;
  employment_start_date?: string | null;
  employment_type?: EmploymentType | null;
  experienced_industry?: string | null;
  experienced_job?: string | null;
  professional_summary?: string | null;
  professional_history?: ProfessionalHistoryItem[] | null;
  current_employment_status?: string | null;
  current_monthly_salary?: string | null;
  current_salary_allowance?: string | null;
  highest_education?: string | null;
  course_training?: string | null;
  education_details?: string | null;
  english_level?: string | null;
  other_languages?: string[] | null;
  cv_link?: string | null;
  phone?: string | null;
  applied_position?: string | null;
  major?: string | null;
  school_name?: string | null;
  education_period?: string | null;
  gpa?: string | null;
  professional_certifications?: string | null;
  technical_skills?: string[] | null;
  soft_skills?: string[] | null;
  career_goals?: string | null;
  key_strengths?: string | null;
  evaluation_file_path?: string | null;
  cdd_code?: string | null;
  created_at: string;
  updated_at?: string | null;
}

/**
 * Interface cho Candidate (bảng candidates - My Candidates)
 * Extends BaseCandidate với các trường riêng cho owner
 */
export interface Candidate extends BaseCandidate {
  owner_id?: string | null;
  created_by_id?: string | null;
  updated_by_id?: string | null;
  current_salary_normalized_vnd?: number | null;
  expected_salary_normalized_vnd?: number | null;
  location?: string | null;
  portfolio?: string | null;
}

/**
 * Interface cho DatabaseCandidate (bảng database_candidates - Database Candidates)
 * Extends BaseCandidate, không có owner_id
 */
export interface DatabaseCandidate extends BaseCandidate {
  current_salary_normalized_vnd?: number | null;
  expected_salary_normalized_vnd?: number | null;
  location?: string | null;
}

/**
 * Union type cho cả hai loại candidate
 */
export type AnyCandidate = Candidate | DatabaseCandidate;

/**
 * Payload để tạo/cập nhật Candidate
 */
export type CandidateFormData = Omit<
  Candidate,
  'id' | 'created_at' | 'updated_at' | 'created_by_id' | 'updated_by_id'
>;

/**
 * Các cột hiển thị trong bảng
 */
export interface CandidateTableRow {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  phase?: CandidatePhase | null;
  expected_salary?: string | null;
}
