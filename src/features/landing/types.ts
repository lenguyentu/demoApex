export type LandingTab = 'setup' | 'queue';

export interface HeadhunterLandingPage {
  id: string;
  user_id: string;
  subdomain_slug: string;
  landing_config: Record<string, unknown>;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export type CvIntakeStatus = 'pending' | 'promoted' | 'rejected' | 'expired';
export type CvIntakeApplyType = 'job' | 'advice';

export interface CvIntakeSubmission {
  id: string;
  created_at: string;
  storage_path: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  reason: string | null;
  job_ref: string | null;
  job_title: string | null;
  apply_type: CvIntakeApplyType;
  context_job_ref: string | null;
  context_job_title: string | null;
  team_slug: string | null;
  status: CvIntakeStatus;
}

/** Row queue + signed URL tải CV (1 lần / row). */
export interface CvIntakeQueueItem extends CvIntakeSubmission {
  cvSignedUrl: string | null;
}
