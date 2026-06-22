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
    title: 'New Process from Landing Page',
    message: 'Candidate Nguyen Van A just submitted CV for Senior Frontend position.',
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
    title: 'New Job Created',
    message: 'Admin just created Job "Senior Backend Developer". Please start finding candidates.',
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
    title: 'Client Approved CV',
    message: 'Client Tech Company A viewed CV of Tran Thi B and requested interview.',
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
    title: 'Customer Care Schedule',
    message: 'It is time to call client Group B (Deal closing schedule).',
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
    title: 'New User Registration',
    message: 'A new Freelancer account just registered on the system. Please approve.',
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
    title: 'New Message',
    message: 'Client A: We have received the CV.',
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
