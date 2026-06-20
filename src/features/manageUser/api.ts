// @ts-nocheck
import type { ManageUser } from './types';

export const USER_SELECT = '*, client:clients!users_client_id_fkey(client_name)';

export const getUsersQuery = (
  baseQuery: any,
  filters: any
) => {
  return baseQuery;
};

// Mock Data
export const mockUsers: ManageUser[] = [
  {
    id: 'mock-user-123',
    full_name: 'Admin Demo',
    email: 'admin@tdconsulting.vn',
    role: 'Admin',
    status: 'approved',
    is_active: true,
    created_at: new Date(Date.now() - 90 * 24 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 5000000).toISOString(),
  },
  {
    id: 'other-user',
    full_name: 'Nguyễn Hoàng Long (HH Lead)',
    email: 'hhlead@tdconsulting.vn',
    role: 'HH Lead',
    status: 'approved',
    is_active: true,
    created_at: new Date(Date.now() - 60 * 24 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 8000000).toISOString(),
  },
  {
    id: 'user-3',
    full_name: 'Phạm Thị Minh Anh',
    email: 'minhanh@tdconsulting.vn',
    role: 'Headhunter',
    status: 'approved',
    is_active: true,
    created_at: new Date(Date.now() - 45 * 24 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 2000000).toISOString(),
    assigned_hr_id: 'other-user',
    assigned_hr: { full_name: 'Nguyễn Hoàng Long (HH Lead)', email: 'hhlead@tdconsulting.vn' },
  },
  {
    id: 'user-4',
    full_name: 'Trần Bình Nguyễn',
    email: 'binhnguyen@freelance.com',
    role: 'Freelancer',
    status: 'pending',
    is_active: false,
    created_at: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    registration_notes: 'CTV tuyển dụng IT, 3 năm kinh nghiệm',
  },
  {
    id: 'user-5',
    full_name: 'Lê Minh Khoa (Client)',
    email: 'hr@techcorpvn.com',
    role: 'Client',
    status: 'approved',
    is_active: true,
    client_id: 'client-1',
    client: { client_name: 'TechCorp Vietnam' },
    created_at: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 1000000).toISOString(),
  },
  {
    id: 'user-6',
    full_name: 'Vũ Quang BD',
    email: 'quangbd@tdconsulting.vn',
    role: 'BD',
    status: 'approved',
    is_active: true,
    created_at: new Date(Date.now() - 80 * 24 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 500000).toISOString(),
  },
  {
    id: 'user-7',
    full_name: 'Đinh Thị Lan Anh',
    email: 'lananh@tdconsulting.vn',
    role: 'Researcher',
    status: 'approved',
    is_active: true,
    created_at: new Date(Date.now() - 25 * 24 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 4000000).toISOString(),
  },
  {
    id: 'user-8',
    full_name: 'Hoàng Việt Anh',
    email: 'vietanh.ctv@gmail.com',
    role: 'CTV',
    status: 'pending',
    is_active: false,
    created_at: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
    updated_at: new Date().toISOString(),
    registration_notes: 'Giới thiệu bởi Trần Bình, có 2 năm HH kinh nghiệm',
  },
  {
    id: 'user-9',
    full_name: 'Ngô Thanh Xuân',
    email: 'xuan.hr@fpt.com',
    role: 'HR',
    status: 'approved',
    is_active: true,
    client_id: 'client-2',
    client: { client_name: 'FPT Software' },
    created_at: new Date(Date.now() - 15 * 24 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 200000).toISOString(),
  },
  {
    id: 'user-10',
    full_name: 'Bùi Hữu Phong (HH)',
    email: 'phong.hh@tdconsulting.vn',
    role: 'Headhunter',
    status: 'approved',
    is_active: true,
    assigned_hr_id: 'other-user',
    assigned_hr: { full_name: 'Nguyễn Hoàng Long (HH Lead)', email: 'hhlead@tdconsulting.vn' },
    created_at: new Date(Date.now() - 40 * 24 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 7000000).toISOString(),
  },
  {
    id: 'user-11',
    full_name: 'Mai Thu Hương',
    email: 'huong.bd@tdconsulting.vn',
    role: 'BD',
    status: 'approved',
    is_active: true,
    created_at: new Date(Date.now() - 55 * 24 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 100000).toISOString(),
  },
  {
    id: 'user-12',
    full_name: 'Nguyễn Kiều Trang',
    email: 'trang.freelance@gmail.com',
    role: 'Freelancer',
    status: 'rejected',
    is_active: false,
    created_at: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 50000).toISOString(),
    registration_notes: 'Không đủ điều kiện - thiếu hồ sơ',
  },
];

export const userApi = {
  getUsersCount: async (filters: any) => {
    let count = mockUsers.length;
    if (filters?.activeTab === 'pending') {
      count = mockUsers.filter(u => u.status === 'pending').length;
    }
    return count;
  },
  getPendingCount: async () => {
    return mockUsers.filter(u => u.status === 'pending').length;
  },

  activateUser: async (userId: string) => {
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      user.status = 'approved';
      user.is_active = true;
    }
    return { success: true };
  },

  sendApprovalEmail: async (email: string, fullName: string) => {
    console.log(`[Mock] MOCK SEND EMAIL to ${email}`);
  },

  rejectUser: async (userId: string) => {
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      user.status = 'rejected';
      user.is_active = false;
    }
  },

  deactivateUser: async (userId: string) => {
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      user.status = 'rejected';
      user.is_active = false;
    }
  },

  reactivateUser: async (userId: string) => {
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      user.status = 'approved';
      user.is_active = true;
    }
  }
};
