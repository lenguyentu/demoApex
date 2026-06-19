
export type ProcessStatus =
  | 'APPLIED'
  | 'REVIEW_CV_BY_TDC'
  | 'CV_SUBMITTED_TO_CLIENT'
  | 'INTERVIEW_SCHEDULED_1ST'
  | 'INTERVIEW_COMPLETED_1ST'
  | 'INTERVIEW_SCHEDULED_2ND'
  | 'INTERVIEW_COMPLETED_2ND'
  | 'INTERVIEW_SCHEDULED_FINAL'
  | 'INTERVIEW_COMPLETED_FINAL'
  | 'INTERVIEW_SCHEDULED_4TH'
  | 'INTERVIEW_COMPLETED_4TH'
  | 'TEST_ASSIGNED'
  | 'TEST_COMPLETED'
  | 'REFERENCE_CHECK_IN_PROGRESS'
  | 'REFERENCE_CHECK_COMPLETED'
  | 'OFFER_EXTENDED'
  | 'OFFER_ACCEPTED_BY_CANDIDATE'
  | 'OFFER_DECLINED_BY_CANDIDATE'
  | 'REJECTED_BY_CLIENT'
  | 'CANDIDATE_WITHDREW'
  | 'PLACEMENT_CONFIRMED'
  | 'ONBOARDING'
  | 'GUARANTEE_PERIOD'
  | 'FAILED_PROBATION'
  | 'PASSED_PROBATION'
  | 'PROCESS_ON_HOLD'
  | 'PROCESS_CANCELLED'
  | 'REJECT_BY_ADMIN'
  | 'PAYMENT_RECEIVED';

export type ChanceOfPlacement = 'High' | 'Medium' | 'Low' | 'Very_High' | 'Very_Low';

export type ProcessEndReason =
  | 'PLACEMENT_SUCCESSFUL'
  | 'CANDIDATE_DECLINED_OFFER'
  | 'CLIENT_REJECTED_CANDIDATE_CV'
  | 'CLIENT_REJECTED_CANDIDATE_INTERVIEW'
  | 'CANDIDATE_WITHDREW_APPLICATION'
  | 'JOB_FILLED_INTERNALLY_BY_CLIENT'
  | 'JOB_CANCELLED_BY_CLIENT'
  | 'JOB_ON_HOLD_BY_CLIENT'
  | 'NO_SUITABLE_CANDIDATES_FOUND'
  | 'CANDIDATE_FAILED_BACKGROUND_CHECK'
  | 'SALARY_EXPECTATION_MISMATCH'
  | 'CONSULTANT_DECISION_TO_DROP'
  | 'OTHER';

export interface Process {
  id: string;
  candidate_id: string;
  job_id: string;
  client_id?: string | null;
  hr_contact_id?: string | null;
  candidate_phone?: string | null;
  candidate_email?: string | null;
  employment_type?: string | null;
  process_status?: ProcessStatus | null;
  status_update_date?: string | null;
  process_memo?: string | null;
  estimated_fee?: number | null;
  expected_closing_date?: string | null;
  owner_id?: string | null;
  chance_of_placement?: ChanceOfPlacement | null;
  process_end?: boolean | null;
  process_end_reason?: ProcessEndReason | null;
  follow_up?: string[] | null;
  created_at: string;
  created_by_id?: string | null;
  updated_at?: string | null;
  updated_by_id?: string | null;
  application_reason?: string | null;
  evaluation_file_path?: string | null;
  process_note?: string | null;
  onboarding_date?: string | null;
  offer_date?: string | null;
  evaluation_data?: Record<string, any> | null;
  evaluation_brief?: string | null;

  // Joined fields
  candidate?: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    cv_link?: string | null;
    evaluation_file_path?: string | null;
  };
  job?: {
    id: string;
    position_title?: string | null;
    job_id?: string | null;
  };
  client?: {
    id: string;
    client_name: string;
  };
  owner?: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  };
  client_portal_user_count?: number;
  unread_comment_count?: number;
}
