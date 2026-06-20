// @ts-nocheck
import { supabase } from '../../lib/supabase';
import type { Process } from './types';

// ============================================
// PROCESSES API
// ============================================

export interface GetProcessesParams {
  searchTerm?: string | null;
  statusFilter?: string | null;
  clientFilter?: string | null;
  jobIdFilter?: string | null;
  ownerIdFilter?: string | null;
  ownerRoleFilter?: string | null;
  myTeamHrId?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  isResearchView?: boolean;
}

/**
 * Transform kết quả từ RPC search_processes sang định dạng Process của UI
 */
export function transformProcessRPC(item: any): Process {
  return {
    id: item.id,
    candidate_id: item.candidate_id,
    job_id: item.job_id,
    client_id: item.client_id,
    owner_id: item.owner_id,
    process_status: item.process_status,
    application_reason: item.application_reason,
    process_memo: item.process_memo,
    process_note: item.process_note,
    chance_of_placement: item.chance_of_placement,
    process_end_reason: item.process_end_reason,
    created_at: item.created_at,
    updated_at: item.updated_at,
    candidate: {
      id: item.candidate_id,
      name: item.candidate_name,
      email: item.candidate_email,
      cv_link: item.candidate_cv_link,
      phone: item.candidate_phone,
      evaluation_file_path: item.candidate_evaluation_file_path,
    },
    evaluation_brief: item.evaluation_brief,
    job: {
      id: item.job_id,
      position_title: item.job_position_title,
      job_id: item.job_job_id,
    },
    client: {
      id: item.client_id,
      client_name: item.client_name,
    },
    owner: {
      id: item.owner_id,
      full_name: item.owner_full_name,
      email: item.owner_email,
      role: item.owner_role,
    },
    client_portal_user_count: item.client_portal_user_count,
    unread_comment_count: item.unread_comment_count,
  };
}

/**
 * Lấy danh sách processes sử dụng RPC tối ưu
 */
export const getProcesses = async ({
  cursor,
  limit = 20,
  filters,
}: {
  cursor?: string | null;
  limit?: number;
  filters?: GetProcessesParams;
}) => {
  const { MOCK_PROCESSES } = await import('../../mocks/processes');
  let data = [...MOCK_PROCESSES] as Process[];
  if (filters?.searchTerm) {
    data = data.filter(p => 
      p.candidate?.name?.toLowerCase().includes(filters.searchTerm!.toLowerCase()) || 
      p.job?.position_title?.toLowerCase().includes(filters.searchTerm!.toLowerCase())
    );
  }
  if (filters?.ownerIdFilter) {
    data = data.filter(p => p.owner_id === filters.ownerIdFilter);
  }
  if (filters?.myTeamHrId) {
    data = data.filter(p => p.owner_id === filters.myTeamHrId);
  }
  return {
    data: data.slice(0, limit),
    nextCursor: null,
  };
};

/**
 * Đếm tổng số processes dựa trên bộ lọc (gọi RPC count_processes)
 */
export const getProcessesCount = async (filters: GetProcessesParams) => {
  const { MOCK_PROCESSES } = await import('../../mocks/processes');
  let data = [...MOCK_PROCESSES];
  if (filters?.searchTerm) {
    data = data.filter(p => 
      p.candidate?.name?.toLowerCase().includes(filters.searchTerm!.toLowerCase()) || 
      p.job?.position_title?.toLowerCase().includes(filters.searchTerm!.toLowerCase())
    );
  }
  if (filters?.ownerIdFilter) {
    data = data.filter(p => p.owner_id === filters.ownerIdFilter);
  }
  if (filters?.myTeamHrId) {
    data = data.filter(p => p.owner_id === filters.myTeamHrId);
  }
  return data.length;
};

export const updateProcess = async (id: string, updates: Partial<Process>) => {
  const { data, error } = await supabase
    .from('processes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteProcess = async (processId: string) => {
  const { error } = await supabase
    .from('processes')
    .delete()
    .eq('id', processId);

  if (error) throw error;
};

// ============================================
// HISTORY API
// ============================================

export const getProcessHistory = async (processId: string) => {
  // TỐI ƯU: Bỏ try-catch retry. Hãy đảm bảo tên Foreign Key trong DB đúng.
  // Nếu không biết tên FK, hãy dùng tool DB để check hoặc đặt tên rõ ràng.
  // Giả sử tên default là 'users'
  const { data, error } = await supabase
    .from('process_history')
    .select(`
      *,
      changed_by_user:users(id, full_name, email)
    `)
    .eq('process_id', processId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// ============================================
// EVENTS API
// ============================================

export const createInterviewEvent = async ({
  processId,
  title,
  startTime,
  endTime,
  description,
  jobId,
  level,
  clientId,
}: {
  processId: string;
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  jobId?: string;
  level?: string;
  clientId?: string;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('company_events')
    .insert({
      process_id: processId,
      title,
      start_time: startTime,
      end_time: endTime,
      description,
      job_id: jobId,
      client_id: clientId,
      level: level,
      created_by: user.id,
      participants: [user.id], // Đảm bảo cột này là JSONB hoặc Array
      reminder_minutes: [10, 60, 1440],
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateInterviewEvent = async (id: string, updates: {
  title?: string;
  start_time?: string;
  end_time?: string;
  description?: string;
  level?: string;
}) => {
  const { data, error } = await supabase
    .from('company_events')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) {
    console.error('Update event error:', error);
    throw new Error(`Không thể cập nhật lịch: ${error.message}`);
  }
  
  if (!data || data.length === 0) {
    throw new Error('Không tìm thấy lịch phỏng vấn hoặc bạn không có quyền chỉnh sửa.');
  }
  
  return data[0];
};

export const getClientEvents = async (clientId: string, jobId?: string) => {
  let query = supabase
    .from('company_events')
    .select(`
      *,
      process:processes(id, candidate:candidates(name))
    `)
    .eq('client_id', clientId)
    .order('start_time', { ascending: true });

  if (jobId) {
    query = query.eq('job_id', jobId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// ============================================
// COMMENTS API
// ============================================

// ============================================
// COMMENTS API (FIXED)
// ============================================

export const getProcessComments = async (processId: string) => {
  // Sử dụng tên Constraint chính xác từ Schema: process_comments_user_id_fkey
  const { data, error } = await supabase
    .from('process_comments')
    .select(`
      id,
      content,
      user_id,
      created_at,
      updated_at,
      is_edited,
      user:users!process_comments_user_id_fkey(id, full_name, email, role)
    `)
    .eq('process_id', processId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  
  // Xử lý data trả về (đảm bảo user là object chứ không phải array)
  return (data || []).map((item: any) => ({
      ...item,
      user: Array.isArray(item.user) ? item.user[0] : item.user
  }));
};

export const createProcessComment = async (processId: string, content: string, parentCommentId?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  if (!content || content.trim() === '') throw new Error('Content cannot be empty');

  const { data, error } = await supabase
    .from('process_comments')
    .insert({
      process_id: processId,
      user_id: user.id,
      content,
      parent_comment_id: parentCommentId,
    })
    // Select lại cũng cần chỉ định rõ Constraint
    .select(`
      *,
      user:users!process_comments_user_id_fkey(id, full_name, role)
    `)
    .single();

  if (error) throw error;
  
  const result: any = { ...data };
  if (Array.isArray(result.user)) result.user = result.user[0];
  
  return result;
};
export const updateProcessComment = async (commentId: string, content: string) => {
  const { data, error } = await supabase
    .from('process_comments')
    .update({
      content,
      is_edited: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteProcessComment = async (commentId: string) => {
  const { error } = await supabase
    .from('process_comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;
};

export const markProcessCommentsAsRead = async (processId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // 1. Chỉ lấy những comment chưa được đọc (Cần logic phức tạp hơn với subquery, 
  // nhưng để đơn giản ta lấy những comment KHÔNG phải của mình tạo ra)
  
  // TỐI ƯU: Không fetch data thừa, chỉ lấy ID
  // Thêm limit để tránh crash nếu process quá cũ có cả nghìn comment
  const { data: comments, error: fetchError } = await supabase
    .from('process_comments')
    .select('id')
    .eq('process_id', processId)
    .neq('user_id', user.id)
    .order('created_at', { ascending: false }) // Ưu tiên comment mới nhất
    .limit(100); // Giới hạn 100 comment gần nhất để tối ưu hiệu năng

  if (fetchError || !comments || comments.length === 0) return;

  // 2. Chuẩn bị data upsert
  const readRecords = comments.map(comment => ({
    comment_id: comment.id,
    user_id: user.id,
    read_at: new Date().toISOString() // Thêm thời gian đọc nếu bảng hỗ trợ
  }));

  // 3. Upsert (ignore duplicates)
  const { error } = await supabase
    .from('process_comment_reads')
    .upsert(readRecords, { 
      onConflict: 'comment_id,user_id',
      ignoreDuplicates: true // Quan trọng: Nếu đã đọc rồi thì bỏ qua, không cần update lại
    });

  if (error) console.error('Error marking comments as read:', error);
};

// ============================================
// WEEKLY REPORT - ACTIVE PROCESSES
// ============================================

/**
 * Lấy processes ACTIVE trong tuần (cho Weekly Report)
 * - Chỉ lấy từ CV_SUBMITTED_TO_CLIENT trở đi
 * - Được tạo HOẶC cập nhật trong tuần này
 */
export const getWeeklyActiveProcesses = async (userId: string, weekStart: string) => {
  const toVnDate = (value: string) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(value));

  const addDays = (baseDate: string, days: number) => {
    const [year, month, day] = baseDate.split('-').map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day));
    utcDate.setUTCDate(utcDate.getUTCDate() + days);
    return utcDate.toISOString().split('T')[0];
  };

  // Tính ngày cuối tuần (weekStart + 7 days)
  const weekEnd = addDays(weekStart, 7);

  console.log('🔍 Weekly Active Processes Query:', {
    userId,
    weekStart,
    weekEnd,
  });

  // Các stage từ CV_SUBMITTED_TO_CLIENT trở đi
  const activeStages = [
    'CV_SUBMITTED_TO_CLIENT',
    'INTERVIEW_SCHEDULED_1ST',
    'INTERVIEW_COMPLETED_1ST',
    'INTERVIEW_SCHEDULED_2ND',
    'INTERVIEW_COMPLETED_2ND',
    'INTERVIEW_SCHEDULED_FINAL',
    'INTERVIEW_COMPLETED_FINAL',
    'INTERVIEW_SCHEDULED_4TH',
    'INTERVIEW_COMPLETED_4TH',
    'TEST_ASSIGNED',
    'TEST_COMPLETED',
    'REFERENCE_CHECK_IN_PROGRESS',
    'REFERENCE_CHECK_COMPLETED',
    'OFFER_EXTENDED',
    'OFFER_ACCEPTED_BY_CANDIDATE',
    'ONBOARDING',  // ← THÊM stage này
    'GUARANTEE_PERIOD',  // ← THÊM stage này
  ];

  // Query đơn giản hơn: Lấy TẤT CẢ processes của user với stage phù hợp
  // Sau đó filter trong JS
  const { data, error } = await supabase
    .from('processes')
    .select(`
      id,
      process_status,
      process_note,
      updated_at,
      created_at,
      chance_of_placement,
      expected_closing_date,
      candidate:candidates(id, name),
      job:jobs(id, job_id, position_title, clients(id, client_name))
    `)
    .eq('owner_id', userId)
    .in('process_status', activeStages)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching processes:', error);
    throw error;
  }

  console.log('📦 Raw processes from DB:', data?.length || 0);

  // Filter trong JS để dễ debug
  const filtered = (data || []).filter(process => {
    // So sánh theo timezone Việt Nam (UTC+7)
    const createdDate = toVnDate(process.created_at);
    const updatedDate = toVnDate(process.updated_at || process.created_at);

    const createdInWeek = createdDate >= weekStart && createdDate < weekEnd;
    const updatedInWeek = updatedDate >= weekStart && updatedDate < weekEnd;

    const shouldInclude = createdInWeek || updatedInWeek;

    console.log('🔎 Checking process:', {
      id: process.id,
      candidate: Array.isArray(process.candidate) ? process.candidate[0]?.name : (process.candidate as any)?.name,
      created_at: process.created_at,
      createdDate,
      updated_at: process.updated_at,
      updatedDate,
      weekStart,
      weekEnd,
      createdInWeek,
      updatedInWeek,
      shouldInclude,
    });

    return shouldInclude;
  });

  console.log('✅ Filtered processes:', filtered.length);

  // Sort: Processes có update trong tuần này lên TRÊN
  filtered.sort((a, b) => {
    const aUpdatedDate = toVnDate(a.updated_at || a.created_at);
    const bUpdatedDate = toVnDate(b.updated_at || b.created_at);
    
    const aUpdatedInWeek = aUpdatedDate >= weekStart && aUpdatedDate < weekEnd;
    const bUpdatedInWeek = bUpdatedDate >= weekStart && bUpdatedDate < weekEnd;
    
    // Processes updated trong tuần lên trên
    if (aUpdatedInWeek && !bUpdatedInWeek) return -1;
    if (!aUpdatedInWeek && bUpdatedInWeek) return 1;
    
    // Cùng group thì sort theo updated_at mới nhất
    return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
  });

  return filtered;
};
