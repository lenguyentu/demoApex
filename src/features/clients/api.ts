// @ts-nocheck
import { supabase } from '../../lib/supabase';
import type {
  Client,
  ClientFilters,
  ClientFormData,
  BDProcess,
  BDProcessHistory,
  UpdateBDProcessPayload,
  ClientJob
} from './types';

// ============================================
// SELECT CONSTANTS
// ============================================

const CLIENT_SELECT = `
  id,
  client_name,
  client_rank,
  location,
  client_industry,
  owner_id,
  user_id,
  tax_id,
  address,
  website_url,
  contract_rate,
  warranty_period,
  notes,
  created_at,
  updated_at,
  owner:owner_id(id, full_name, email),
  bd_processes(id, phase, status, memo, first_contact_date, last_contact_date)
`;

const CLIENT_LIST_SELECT = `
  id,
  client_name,
  client_rank,
  location,
  client_industry,
  owner_id,
  user_id,
  tax_id,
  address,
  website_url,
  created_at,
  updated_at,
  owner:owner_id(id, full_name),
  bd_processes(id, phase, status, first_contact_date, last_contact_date)
`;

export const CLIENT_GRID_SELECT = `
  id,
  client_name,
  client_rank,
  location,
  client_industry,
  owner_id,
  created_at,
  owner:owner_id(id, full_name),
  bd_processes(id, phase, status, first_contact_date, last_contact_date)
`;

const BD_PROCESS_SELECT = `
  id,
  client_id,
  phase,
  status,
  memo,
  first_contact_date,
  last_contact_date,
  created_at,
  updated_at,
  clients:client_id(id, client_name),
  users:owner_id(id, full_name)
`;

const BD_HISTORY_SELECT = `
  id,
  process_id,
  old_phase,
  new_phase,
  old_status,
  new_status,
  memo,
  changed_by,
  created_at,
  changed_by_user:changed_by(id, full_name)
`;

// ============================================
// CLIENTS API
// ============================================

/**
 * Hàm chung để áp dụng bộ lọc cho query Clients
 */
export const getClientsQuery = (
  baseQuery: any,
  filters: ClientFilters
) => {
  let query = baseQuery;

  // TỐI ƯU: Nếu filter theo Phase, sử dụng !inner join để chính xác và nhanh hơn
  if (filters?.phase) {
    // Lưu ý: logic này cần cẩn thận khi dùng với useCursorPagination vì select string đã được định nghĩa sẵn
    // Tuy nhiên, đối với Supabase, ta có thể filter trên relation mà không cần !inner nếu không cần hard filter
  }

  if (filters?.id) {
    query = query.eq('id', filters.id);
  }
  if (filters?.client_name) {
    query = query.ilike('client_name', `%${filters.client_name}%`);
  }
  if (filters?.client_rank) {
    query = query.eq('client_rank', filters.client_rank);
  }
  if (filters?.owner_id) {
    query = query.eq('owner_id', filters.owner_id);
  }
  if (filters?.location) {
    query = query.ilike('location', `%${filters.location}%`);
  }
  if (filters?.client_industry) {
    const industries = filters.client_industry.split(',').filter(Boolean);
    if (industries.length > 0) {
      query = query.in('client_industry', industries);
    }
  }

  // Status filter (aliased as "phase" in interface) applied to relation
  if (filters?.phase) {
    query = query.eq('bd_processes.status', filters.phase);
  }

  return query;
};

/**
 * Lấy danh sách clients với filters và pagination (Offset-based)
 * @deprecated Nên chuyển sang useClientsList (hook) sử dụng Cursor Pagination
 */
export async function getClients(
  page: number = 1,
  pageSize: number = 20,
  filters?: ClientFilters
): Promise<{ data: Client[]; count: number }> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('clients')
    .select(CLIENT_GRID_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filters) {
    query = getClientsQuery(query, filters);
  }

  const { data, error, count } = await query;

  if (error) throw error;
  return {
    data: (data as unknown as Client[]) || [],
    count: count ?? 0
  };
}

/**
 * Tìm kiếm clients cho dropdown (chỉ lấy id, name)
 */
export async function searchClients(term: string): Promise<{ id: string; client_name: string }[]> {
  let query = supabase
    .from('clients')
    .select('id, client_name')
    .order('created_at', { ascending: false })
    .limit(20);

  if (term) {
    query = query.ilike('client_name', `%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Lấy chi tiết 1 client
 */
export async function getClientById(id: string): Promise<Client> {
  const { MOCK_CLIENTS } = await import('../../mocks/clients');
  const found = MOCK_CLIENTS.find(c => c.id === id);
  if (!found) throw new Error('Not found');
  return found as unknown as Client;
}

/**
 * Tạo mới client
 */
export async function createClient(payload: ClientFormData): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .insert(payload)
    .select(CLIENT_SELECT)
    .single();

  if (error) throw error;
  return data as unknown as Client;
}

/**
 * Cập nhật client
 */
export async function updateClient(
  id: string,
  payload: Partial<ClientFormData>
): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(CLIENT_SELECT)
    .single();

  if (error) throw error;
  return data as unknown as Client;
}

/**
 * Xóa client
 */
export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Cập nhật owner của client
 */
export async function updateClientOwner(
  clientId: string,
  ownerId: string | null
): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .update({
      owner_id: ownerId,
      updated_at: new Date().toISOString()
    })
    .eq('id', clientId)
    .select(CLIENT_SELECT)
    .single();

  if (error) throw error;
  return data as unknown as Client;
}

// ============================================
// BD PROCESSES API
// ============================================

/**
 * Lấy BD Process của client
 */
export async function getBDProcessByClientId(clientId: string): Promise<BDProcess | null> {
  const { data, error } = await supabase
    .from('bd_processes')
    .select(BD_PROCESS_SELECT)
    .eq('client_id', clientId)
    .single();

  if (error) {
    // Có thể chưa có process
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as unknown as BDProcess;
}

/**
 * Cập nhật BD Process (phase, status, memo)
 */
export async function updateBDProcess(
  processId: string,
  payload: UpdateBDProcessPayload
): Promise<BDProcess> {
  const updateData: Record<string, unknown> = {
    ...payload,
    updated_at: new Date().toISOString(),
  };

  // Auto-update last_contact_date
  if (!payload.last_contact_date) {
    updateData.last_contact_date = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('bd_processes')
    .update(updateData)
    .eq('id', processId)
    .select(BD_PROCESS_SELECT)
    .single();

  if (error) throw error;
  return data as unknown as BDProcess;
}

/**
 * Lấy lịch sử thay đổi của BD Process
 */
export async function getBDProcessHistory(processId: string): Promise<BDProcessHistory[]> {
  const { data, error } = await supabase
    .from('bd_process_history')
    .select(BD_HISTORY_SELECT)
    .eq('process_id', processId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as unknown as BDProcessHistory[]) || [];
}

// ============================================
// JOBS API (for ClientJobsModal)
// ============================================

/**
 * Lấy danh sách jobs của client
 */
export async function getJobsByClientId(clientId: string): Promise<ClientJob[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('id, job_id, position_title, phase')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as ClientJob[]) || [];
}

// ============================================
// HR CONTACTS API (for filters)
// ============================================

/**
 * Lấy clients theo HR email/phone filter
 */
export async function getClientsByHRContact(
  page: number = 1,
  pageSize: number = 20,
  filters: { hr_email?: string; hr_phone?: string }
): Promise<{ data: Client[]; count: number }> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Query trực tiếp từ bảng clients
  // Dùng hr_contacts!inner để chỉ lấy những client có HR thỏa mãn điều kiện
  let query = supabase
    .from('clients')
    .select(`${CLIENT_LIST_SELECT}, hr_contacts!inner(id)`, { count: 'exact' }) // Không cần lấy field của HR, chỉ cần check tồn tại
    .range(from, to);

  if (filters.hr_email) {
    // Filter trên bảng quan hệ
    query = query.ilike('hr_contacts.email', `%${filters.hr_email}%`);
  }
  if (filters.hr_phone) {
    query = query.ilike('hr_contacts.phone', `%${filters.hr_phone}%`);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  // Data trả về chính là Client luôn, không cần map ngược
  return {
    data: (data as unknown as Client[]) || [],
    count: count ?? 0
  };
}

// ============================================
// DROPDOWN OPTIONS API
// ============================================

/**
 * Lấy danh sách locations cho dropdown
 */
export async function getLocations(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Lấy danh sách industries cho dropdown
 */
export async function getIndustries(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from('industry_clients')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) throw error;

  // Sort with "Other" at the end
  const sorted = (data || []).sort((a, b) => {
    if (a.name === 'Other') return 1;
    if (b.name === 'Other') return -1;
    return a.name.localeCompare(b.name);
  });

  return sorted;
}

/**
 * Lấy danh sách users cho owner dropdown
 */
export async function getUsersForDropdown(): Promise<{ id: string; full_name: string }[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name')
    .in('role', ['Admin', 'BD'])
    .order('full_name', { ascending: true });

  if (error) throw error;
  return data || [];
}

// ============================================
// CLIENT PROVISIONING API
// ============================================

/**
 * Tạo tài khoản portal cho client
 */
export async function provisionClientUser(payload: {
  email: string;
  full_name: string;
  client_id: string;
  role: string;
}): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Vui lòng đăng nhập lại');

  const { data, error } = await supabase.functions.invoke('invite-user', {
    body: payload,
    headers: {
      Authorization: `Bearer ${session.access_token}`
    }
  });

  if (error) throw error;
  return data;
}
