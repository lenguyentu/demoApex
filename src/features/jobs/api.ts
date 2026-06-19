import { supabase } from '../../lib/supabase';
import type { Job, JobFormData } from './types';

// Select gọn cho danh sách (Table/Grid) - Tránh các cột text dài
export const JOB_SUMMARY_SELECT = `
  id,
  job_id,
  job_code,
  client_id,
  hr_contact_id,
  owner_id,
  position_title,
  job_summary,
  number_of_employees,
  phase,
  phase_date,
  job_category,
  td_job_category,
  job_rank,
  job_level,
  min_monthly_salary,
  max_monthly_salary,
  work_location,
  assignment_type,
  interview_rounds,
  warranty_period_days,
  comments_count,
  is_urgent,
  urgent_info,
  created_at,
  updated_at,
  created_by_id,
  clients!inner(
    id, 
    client_name, 
    client_rank, 
    website_url, 
    owner_id,
    owner:users!owner_id(id, full_name)
  ),
  hr_contacts:hr_contact_id(id, name),
  created_by_details:created_by_id(id, full_name),
  job_internal_data(original_jd_url)
`;

// Select đầy đủ cho màn hình Detail/Edit
export const JOB_DETAIL_SELECT = `
  *,
  clients:client_id(id, client_name),
  hr_contacts:hr_contact_id(id, name),
  owner:owner_id(id, full_name),
  created_by_details:created_by_id(id, full_name)
`;

export interface GetJobsParams {
  mode?: 'open' | 'admin';
  search?: string;
  category?: string;
  clientId?: string;
  assignmentType?: string;
  phase?: string;
  jobRank?: string;
  jobLevel?: string;
  tdJobCategory?: string;
  clientOwnerId?: string;
  isUrgent?: string;
}

/**
 * Lấy chi tiết 1 job
 */
export async function getJobById(id: string) {
  const { data, error } = await supabase
    .from('jobs')
    .select(JOB_DETAIL_SELECT)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as unknown as Job;
}

/**
 * Tạo mới Job
 */
export async function createJob(
  payload: JobFormData,
  userId: string
) {
  const { data, error } = await supabase
    .from('jobs')
    .insert({
      ...payload,
      owner_id: userId,
      created_by_id: userId,
    })
    .select(JOB_DETAIL_SELECT)
    .single();

  if (error) throw error;
  return data as unknown as Job;
}

/**
 * Cập nhật Job
 */
export async function updateJob(
  id: string,
  payload: Partial<JobFormData>,
  userId: string
) {
  const { data, error } = await supabase
    .from('jobs')
    .update({
      ...payload,
      updated_by_id: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(JOB_DETAIL_SELECT)
    .single();

  if (error) throw error;
  return data as unknown as Job;
}

/**
 * Cập nhật is_urgent cho Job
 */
export async function toggleUrgentJob(id: string, is_urgent: boolean) {
  const { data, error } = await supabase
    .from('jobs')
    .update({ is_urgent })
    .eq('id', id)
    .select('id, is_urgent')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Xóa Job
 */
export async function deleteJob(id: string) {
  const { error } = await supabase.from('jobs').delete().eq('id', id);

  if (error) throw error;
  return true;
}

// ==========================================
// URGENT JOB SETTINGS
// ==========================================
export const getUrgentJobTitle = async (): Promise<string> => {
  const { data, error } = await supabase
    .from('urgent_job_settings')
    .select('title')
    .eq('id', 1)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching urgent job title:', error);
    return 'HOT JOB TUẦN NÀY - PROCESS NHANH';
  }
  return data?.title || 'HOT JOB TUẦN NÀY - PROCESS NHANH';
};

export const updateUrgentJobTitle = async (title: string): Promise<void> => {
  const { error } = await supabase
    .from('urgent_job_settings')
    .upsert({ id: 1, title, updated_at: new Date().toISOString() });
    
  if (error) throw error;
};

export const updateUrgentJobsSetup = async (
  title: string,
  selectedJobs: Array<{ id: string; urgent_info: any }>
): Promise<void> => {
  // Update global title
  await updateUrgentJobTitle(title);

  // Get current urgent jobs
  const { data: currentUrgent, error: fetchError } = await supabase
    .from('jobs')
    .select('id')
    .eq('is_urgent', true);
    
  if (fetchError) throw fetchError;

  const currentIds = currentUrgent?.map(j => j.id) || [];
  const selectedIds = selectedJobs.map(j => j.id);
  const toRemove = currentIds.filter(id => !selectedIds.includes(id));

  // Remove urgency from unselected jobs
  if (toRemove.length > 0) {
    const { error } = await supabase
      .from('jobs')
      .update({ is_urgent: false, urgent_info: null })
      .in('id', toRemove);
    if (error) throw error;
  }

  // Update selected jobs one by one (since each has different urgent_info)
  // We can do this in parallel
  await Promise.all(selectedJobs.map(async (job) => {
    const { error } = await supabase
      .from('jobs')
      .update({ is_urgent: true, urgent_info: job.urgent_info })
      .eq('id', job.id);
    if (error) throw error;
  }));
};

/**
 * Count jobs với filters (sử dụng RPC để support nested filter)
 */
export async function countJobsByFilters(params: GetJobsParams): Promise<number> {
  const { data, error } = await supabase.rpc('count_jobs_by_filters', {
    p_mode: params.mode || null,
    p_client_id: params.clientId || null,
    p_assignment_type: params.assignmentType || null,
    p_phase: params.phase || null,
    p_job_rank: params.jobRank || null,
    p_job_level: params.jobLevel || null,
    p_td_job_category: params.tdJobCategory || null,
    p_client_owner_id: params.clientOwnerId || null,
    p_search: params.search || null,
  });

  if (error) throw error;
  return data as number;
}

/**
 * Hàm chung để áp dụng bộ lọc cho query Jobs
 */
export const getJobsQuery = (
  baseQuery: any,
  params: GetJobsParams
) => {
  let query = baseQuery;

  // Mode filter
  if (params.mode === 'open') {
    query = query.eq('phase', 'Open');
  }

  // Category filter
  if (params.category) {
    query = query.eq('job_category', params.category);
  }

  // Client filter
  if (params.clientId) {
    query = query.eq('client_id', params.clientId);
  }

  // Assignment Type filter
  if (params.assignmentType) {
    query = query.eq('assignment_type', params.assignmentType);
  }

  // Phase filter
  if (params.phase) {
    query = query.eq('phase', params.phase);
  }

  // isUrgent filter
  if (params.isUrgent === 'true') {
    query = query.eq('is_urgent', true);
  } else if (params.isUrgent === 'false') {
    query = query.eq('is_urgent', false);
  }

  // Job Rank filter
  if (params.jobRank) {
    query = query.eq('job_rank', params.jobRank);
  }

  // Job Level filter
  if (params.jobLevel) {
    query = query.eq('job_level', params.jobLevel);
  }

  // TD Job Category (Domain) filter
  if (params.tdJobCategory) {
    query = query.eq('td_job_category', params.tdJobCategory);
  }

  // Client Owner (BD) filter - filter trực tiếp trên bảng clients
  // Vì đã dùng clients!inner, filter này sẽ hoạt động
  if (params.clientOwnerId) {
    query = query.eq('clients.owner_id', params.clientOwnerId);
  }

  // Search filter
  if (params.search) {
    query = query.or(
      `position_title.ilike.%${params.search}%,job_code.ilike.%${params.search}%,job_id.ilike.%${params.search}%`
    );
  }

  return query;
};

/**
 * Lưu chi tiết các vòng phỏng vấn
 */
export async function saveJobInterviewRounds(
  jobId: string,
  rounds: { round_number: number; round_name: string; interviewer_name: string; description: string }[]
) {
  // Xóa các vòng cũ nếu có
  await supabase.from('job_interview_rounds').delete().eq('job_id', jobId);

  // Chỉ insert nếu có rounds
  if (rounds.length === 0) return;

  const { error } = await supabase.from('job_interview_rounds').insert(
    rounds.map((r) => ({
      job_id: jobId,
      round_number: r.round_number,
      round_name: r.round_name,
      interviewer_name: r.interviewer_name,
      description: r.description,
    }))
  );

  if (error) throw error;
}

/**
 * Lấy thông tin nội bộ của job (chỉ internal staff được xem)
 */
export async function getJobInternalData(jobId: string) {
  const { data, error } = await supabase
    .from('job_internal_data')
    .select('*')
    .eq('job_id', jobId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Lưu/cập nhật thông tin nội bộ của job (upsert)
 */
export async function saveJobInternalData(
  jobId: string,
  internalData: {
    original_jd_url?: string;
    internal_notes?: string;
  }
) {
  const { data, error } = await supabase
    .from('job_internal_data')
    .upsert(
      {
        job_id: jobId,
        original_jd_url: internalData.original_jd_url || null,
        internal_notes: internalData.internal_notes || null,
      },
      {
        onConflict: 'job_id',
      }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ==================== JOB COMMENTS API ====================

const JOB_COMMENT_SELECT = `
  *,
  user:user_id(id, full_name, email, role)
`;

/**
 * Lấy danh sách comments của job (bao gồm replies)
 * Tối ưu: Lấy replies trong cùng 1 query (Nested Select) để tránh N+1
 */
export async function fetchJobComments(jobId: string) {
  const { data, error } = await supabase
    .from('job_comments')
    .select(`
      *,
      user:user_id(id, full_name, email, role),
      replies:job_comments(
        *,
        user:user_id(id, full_name, email, role)
      )
    `)
    .eq('job_id', jobId)
    .is('parent_comment_id', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Tạo comment mới
 */
export async function createJobComment(
  jobId: string,
  content: string,
  parentCommentId?: string
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('job_comments')
    .insert({
      job_id: jobId,
      user_id: user.id,
      content: content.trim(),
      parent_comment_id: parentCommentId || null,
    })
    .select(JOB_COMMENT_SELECT)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Cập nhật comment
 */
export async function updateJobComment(commentId: string, content: string) {
  const { data, error } = await supabase
    .from('job_comments')
    .update({ content: content.trim(), is_edited: true })
    .eq('id', commentId)
    .select(JOB_COMMENT_SELECT)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Xóa comment
 */
export async function deleteJobComment(commentId: string) {
  const { error } = await supabase
    .from('job_comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;
}
