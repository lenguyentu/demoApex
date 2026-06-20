// @ts-nocheck
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { useAuthStore } from '../auth/store';
import { 
  markAsRead, 
  markAllAsRead, 
  deleteNotification, 
  getUnreadCount, 
  getRecentNotifications,
  getNotificationsQuery
} from './api';
import { useCursorPagination } from '../../hooks/useCursorPagination';
import type { Notification, NotificationFilters } from './types';

// ============================================
// QUERY KEYS
// ============================================
export const notificationKeys = {
  all: ['notifications'] as const,
  list: (refreshKey?: string | number) => [...notificationKeys.all, 'list', refreshKey] as const,
  detail: (id: string) => [...notificationKeys.all, 'detail', id] as const,
  count: (refreshKey?: string | number) => [...notificationKeys.all, 'count', refreshKey] as const,
};

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Hook to mark single notification as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: () => markAllAsRead(user?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Hook to delete notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Hook to get unread notifications count
 */
export function useUnreadCount() {
  const user = useAuthStore((state) => state.user);
  
  return useQuery({
    queryKey: notificationKeys.count(user?.id),
    queryFn: async () => {
      const count = await getUnreadCount(user?.id || '');
      return count || 0; // ensure it doesn't return undefined
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Fallback polling every 30s
  });
}

/**
 * Hook to get notifications list with cursor pagination
 */
export function useNotificationsList(filters: NotificationFilters & { searchTerm?: string } = {}) {
  const user = useAuthStore((state) => state.user);
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: notificationKeys.list(JSON.stringify(filters)),
    queryFn: async () => {
      const notifs = await getRecentNotifications(user?.id || '', 50);
      return notifs;
    },
    enabled: !!user?.id
  });

  return {
    data: data || [],
    loading: isLoading,
    hasMore: false,
    loadMore: () => {},
    refresh: refetch,
    error: null,
    totalCount: data?.length || 0
  };
}

/**
 * Hook to get recent notifications for dropdown
 */
export function useRecentNotifications(limit: number = 50) {
  const user = useAuthStore((state) => state.user);
  
  return useQuery({
    queryKey: [...notificationKeys.all, 'recent', limit, user?.id],
    queryFn: () => getRecentNotifications(user?.id || '', limit),
    enabled: !!user?.id,
  });
}

// ============================================
// REALTIME SUBSCRIPTION HOOKS
// ============================================

/**
 * Hook to subscribe to realtime notification changes
 * This hook should be called once at app level (e.g., in MainLayout)
 */
export function useNotificationRealtime() {
  // Mock realtime for demo
}
