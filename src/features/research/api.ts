import { updateProcess } from '../processes/api';

export type ResearchQueueStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export interface ResearchQueueItem {
  id: string;
  candidate_id: string;
  job_id: string;
  job_code: string | null;
  owner_id: string;
  created_by_id: string;
  process_status: string;
  application_reason: string | null;
  created_at: string;
  updated_at: string;
  candidate_name: string;
  candidate_email: string | null;
  candidate_phone: string | null;
  candidate_cv_link: string | null;
  job_position_title: string;
  job_client_name: string;
  job_client_id: string | null;
  owner_name: string;
  owner_role: string;
  created_by_name: string;
  created_by_discord_id: string | null;
  evaluation_file_path: string | null;
  evaluation_brief: string | null;
}

export function toQueueStatus(processStatus: string): ResearchQueueStatus {
  if (processStatus === 'APPLIED') return 'PENDING_REVIEW';
  if (processStatus === 'REJECT_BY_ADMIN') return 'REJECTED';
  return 'APPROVED';
}

const mockQueueData: ResearchQueueItem[] = [
  {
    id: 'process-1',
    candidate_id: 'cand-1',
    job_id: 'job-1',
    job_code: 'TDC-001',
    owner_id: 'owner-1',
    created_by_id: 'creator-1',
    process_status: 'APPLIED',
    application_reason: 'Phù hợp JD',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    candidate_name: 'Nguyễn Văn Research',
    candidate_email: 'research@example.com',
    candidate_phone: '0901234567',
    candidate_cv_link: null,
    job_position_title: 'Senior Frontend',
    job_client_name: 'Tech Corp',
    job_client_id: 'client-1',
    owner_name: 'HH Lead Demo',
    owner_role: 'HH Lead',
    created_by_name: 'Researcher Demo',
    created_by_discord_id: null,
    evaluation_file_path: null,
    evaluation_brief: null,
  }
];

export async function fetchResearchQueue(userId: string, userRole: string) {
  return mockQueueData;
}

export async function approveQueueItem(
  processId: string,
  payload: {
    status: string;
    evaluationFile?: File;
    evaluationBrief?: string;
  }
) {
  const item = mockQueueData.find(q => q.id === processId);
  if (item) item.process_status = payload.status;
}

export async function rejectQueueItem(processId: string, payload: { note: string; brief?: string }) {
  const item = mockQueueData.find(q => q.id === processId);
  if (item) item.process_status = 'REJECT_BY_ADMIN';
}

export async function fetchResearchDashboardStats(
  timeRange: 'today' | 'week' | 'month' | 'all' = 'month',
  userId?: string,
  userRole?: string
) {
  return {
    totalSent: 15,
    approved: 10,
    rejected: 5,
    approvalRate: 66.67
  };
}

export async function fetchWorkloadStats() {
  return [
    { user_id: 'u1', full_name: 'Research 1', today_count: 5, weekly_count: 20 },
    { user_id: 'u2', full_name: 'Research 2', today_count: 2, weekly_count: 15 }
  ];
}

export interface ResearcherRankingRow {
  user_id: string;
  full_name: string;
  total_sent: number;
  total_approved: number;
  total_rejected: number;
  total_pending: number;
  approval_rate: number;
}

export async function fetchResearcherRanking(
  timeRange: 'today' | 'week' | 'month' | 'all'
): Promise<ResearcherRankingRow[]> {
  return [
    {
      user_id: 'u1',
      full_name: 'Researcher Demo 1',
      total_sent: 10,
      total_approved: 8,
      total_rejected: 2,
      total_pending: 0,
      approval_rate: 80
    }
  ];
}

export interface ResearchJobBreakdownRow {
  job_id: string;
  position_title: string;
  client_name: string;
  total_sent: number;
  total_approved: number;
  total_rejected: number;
  total_pending: number;
}

export async function fetchResearchJobBreakdown(
  timeRange: 'today' | 'week' | 'month' | 'all'
): Promise<ResearchJobBreakdownRow[]> {
  return [
    {
      job_id: 'job-1',
      position_title: 'Frontend',
      client_name: 'Tech Corp',
      total_sent: 5,
      total_approved: 4,
      total_rejected: 1,
      total_pending: 0
    }
  ];
}
