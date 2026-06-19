import type { BDProcess, BDHistory, BDSchedule } from './types';

export const BD_CUSTOMER_SELECT = '*';

let mockCustomers: BDProcess[] = [
  {
    id: 'bd-1',
    client_id: 'client-1',
    owner_id: 'mock-user-123',
    priority: 'Ưu tiên',
    source: 'LinkedIn',
    potential_job_title: 'Senior Frontend',
    potential_job_link: null,
    phase: 'Approach',
    status: 'Research',
    first_contact_date: new Date().toISOString(),
    last_contact_date: new Date().toISOString(),
    memo: 'Công ty đang cần tuyển gấp',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    client: { id: 'client-1', client_name: 'Khách hàng Công nghệ A' },
    owner: { id: 'mock-user-123', email: 'bd@tdconsulting.vn', full_name: 'BD Demo' }
  },
  {
    id: 'bd-2',
    client_id: 'client-2',
    owner_id: 'mock-user-123',
    priority: 'Bình thường',
    source: 'Facebook',
    potential_job_title: 'Project Manager',
    potential_job_link: null,
    phase: 'Follow up',
    status: 'Consulting',
    first_contact_date: new Date(Date.now() - 50000000).toISOString(),
    last_contact_date: new Date(Date.now() - 20000000).toISOString(),
    memo: 'Đã báo giá',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    client: { id: 'client-2', client_name: 'Tập đoàn B' },
    owner: { id: 'mock-user-123', email: 'bd@tdconsulting.vn', full_name: 'BD Demo' }
  }
];

export const getBDCustomersQuery = (baseQuery: any, filters: any) => baseQuery;

export const getBDCustomers = async ({ query }: { query: any }): Promise<{ data: BDProcess[], count: number }> => {
  return { data: mockCustomers, count: mockCustomers.length };
};

export const updateCustomerStatus = async (id: string, status: string, memo?: string) => {
  const customer = mockCustomers.find(c => c.id === id);
  if (customer) {
    customer.status = status as any;
    if (memo) customer.memo = memo;
    customer.updated_at = new Date().toISOString();
  }
  return customer;
};

export const getBDProcessHistory = async (processId: string): Promise<BDHistory[]> => {
  return [
    {
      id: 'history-1',
      process_id: processId,
      actor_id: 'mock-user-123',
      old_status: 'Research',
      new_status: 'Consulting',
      memo: 'Chuyển trạng thái sang tư vấn',
      created_at: new Date().toISOString(),
      actor: { full_name: 'BD Demo' }
    }
  ];
};

export const updateCustomerPriority = async (id: string, priority: string) => {
  const customer = mockCustomers.find(c => c.id === id);
  if (customer) customer.priority = priority as any;
  return customer;
};

export const createBDSchedule = async (payload: any) => {
  return payload;
};