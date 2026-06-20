// @ts-nocheck
import { NOTIFICATION_TYPE_GROUPS, type Notification, type NotificationFilters } from './types';

export const getNotificationsQuery = (
  baseQuery: any,
  filters: NotificationFilters & { searchTerm?: string; userId?: string }
) => {
  return baseQuery;
};

// Mock Data
let mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    user_id_receiver: 'mock-user-123',
    created_by_id: 'system',
    type: 'new_process_admin',
    title: 'Process mới từ Landing Page',
    message: 'Ứng viên Nguyễn Văn A vừa nộp CV ứng tuyển vị trí Senior Frontend.',
    read: false,
    created_at: new Date(Date.now() - 1000000).toISOString(),
    updated_at: new Date().toISOString(),
    link: '/processes'
  },
  {
    id: 'notif-2',
    user_id_receiver: 'mock-user-123',
    created_by_id: 'admin',
    type: 'job_open_created',
    title: 'Job mới vừa được tạo',
    message: 'Admin vừa tạo Job "Senior Backend Developer". Hãy bắt đầu tìm ứng viên.',
    read: true,
    created_at: new Date(Date.now() - 8000000).toISOString(),
    updated_at: new Date().toISOString(),
    link: '/jobs'
  },
  {
    id: 'notif-3',
    user_id_receiver: 'mock-user-123',
    created_by_id: 'client',
    type: 'process_status_update',
    title: 'Khách hàng duyệt CV',
    message: 'Khách hàng Công ty Công nghệ A đã xem CV của Trần Thị B và yêu cầu phỏng vấn.',
    read: false,
    created_at: new Date(Date.now() - 15000000).toISOString(),
    updated_at: new Date().toISOString(),
    link: '/processes'
  },
  {
    id: 'notif-4',
    user_id_receiver: 'mock-user-123',
    created_by_id: 'system',
    type: 'bd_reminder',
    title: 'Lịch chăm sóc khách hàng',
    message: 'Đã đến lịch gọi điện hỏi thăm khách hàng Tập đoàn B (Lịch chốt Deal).',
    read: false,
    created_at: new Date(Date.now() - 2000000).toISOString(),
    updated_at: new Date().toISOString(),
    link: '/bd/schedule'
  },
  {
    id: 'notif-5',
    user_id_receiver: 'mock-user-123',
    created_by_id: 'system',
    type: 'new_user_registration',
    title: 'Có user mới đăng ký',
    message: 'Một tài khoản CTV mới vừa đăng ký vào hệ thống. Vui lòng phê duyệt.',
    read: false,
    created_at: new Date(Date.now() - 5000000).toISOString(),
    updated_at: new Date().toISOString(),
    link: '/users'
  },
  {
    id: 'notif-6',
    user_id_receiver: 'mock-user-123',
    created_by_id: 'system',
    type: 'chat_message',
    title: 'Tin nhắn mới',
    message: 'Khách hàng A: Bên mình đã nhận được CV nhé.',
    read: true,
    created_at: new Date(Date.now() - 25000000).toISOString(),
    updated_at: new Date().toISOString(),
    link: '/chat'
  }
];

export async function getNotificationById(id: string): Promise<Notification> {
  const notif = mockNotifications.find(n => n.id === id);
  if (!notif) throw new Error('Not found');
  return notif;
}

export async function markAsRead(id: string): Promise<void> {
  const notif = mockNotifications.find(n => n.id === id);
  if (notif) notif.read = true;
}

export async function markAllAsRead(userId: string): Promise<void> {
  mockNotifications.forEach(n => n.read = true);
}

export async function deleteNotification(id: string): Promise<void> {
  mockNotifications = mockNotifications.filter(n => n.id !== id);
}

export async function getUnreadCount(userId: string): Promise<number> {
  return mockNotifications.filter(n => !n.read).length;
}

export async function getRecentNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
  return [...mockNotifications].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, limit);
}
