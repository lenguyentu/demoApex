import { useQuery } from '@tanstack/react-query';
import { userApi, getUsersQuery, mockUsers } from './api';
import { useCallback } from 'react';
import type { ManageUser } from './types';

export const useUserStatus = () => {
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['users', 'pending-count'],
    queryFn: userApi.getPendingCount,
    refetchInterval: 30000
  });

  return { pendingCount };
};

/**
 * Hook to get users list with cursor pagination
 */
export function useUsersList(filters: {
  activeTab?: 'all' | 'pending';
  selectedRole?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  managedById?: string;
}) {
  useCallback(
    (query: any) => {
      return getUsersQuery(query, filters);
    },
    [filters]
  );

  let filteredUsers = mockUsers;
  if (filters.activeTab === 'pending') {
    filteredUsers = filteredUsers.filter(u => u.status === 'pending');
  } else if (filters.activeTab === 'all') {
    filteredUsers = filteredUsers.filter(u => u.status !== 'pending');
  }

  if (filters.selectedRole && filters.selectedRole !== 'All') {
    filteredUsers = filteredUsers.filter(u => u.role === filters.selectedRole);
  }
  if (filters.search) {
    const s = filters.search.toLowerCase();
    filteredUsers = filteredUsers.filter(u => u.full_name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s));
  }

  return {
    data: filteredUsers,
    loading: false,
    hasMore: false,
    loadMore: () => {},
    refresh: () => {},
    error: null,
    totalCount: filteredUsers.length
  };
}

export const useUserProfiles = (_userIds: string[]) => {
  return useQuery({
    queryKey: ['profiles', 'positions', 'mock'],
    queryFn: async () => [],
    staleTime: 60 * 1000,
  });
};

export const useAssignedHRs = (hrIds: string[]) => {
  return useQuery({
    queryKey: ['users', 'assigned_hrs', hrIds],
    queryFn: async () => {
      // Return mock HR data for demo
      return mockUsers
        .filter(u => hrIds.includes(u.id))
        .map(u => ({ id: u.id, full_name: u.full_name, email: u.email }));
    },
    enabled: hrIds.length > 0,
    staleTime: 60 * 1000,
  });
};
