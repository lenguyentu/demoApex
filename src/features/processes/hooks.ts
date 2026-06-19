import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getProcesses, getProcessesCount, getWeeklyActiveProcesses, type GetProcessesParams } from './api';

export const processKeys = {
  all: ['processes'] as const,
  lists: () => [...processKeys.all, 'list'] as const,
  list: (filters: GetProcessesParams) => [...processKeys.lists(), filters] as const,
  counts: () => [...processKeys.all, 'count'] as const,
  count: (filters: GetProcessesParams) => [...processKeys.counts(), filters] as const,
  weeklyActive: (userId: string, weekStart: string) => [...processKeys.all, 'weeklyActive', userId, weekStart] as const,
};

/**
 * Hook lấy danh sách processes với infinite scroll sử dụng RPC
 */
export function useProcessesList(filters: GetProcessesParams) {
  const pageSize = 20;

  return useInfiniteQuery({
    queryKey: processKeys.list(filters),
    queryFn: ({ pageParam }) => 
      getProcesses({ 
        cursor: pageParam as string | null, 
        limit: pageSize, 
        filters 
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook đếm tổng số processes dựa trên filter
 */
export function useProcessesCount(filters: GetProcessesParams) {
  return useQuery({
    queryKey: processKeys.count(filters),
    queryFn: () => getProcessesCount(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook lấy processes ACTIVE trong tuần (cho Weekly Report)
 */
export function useWeeklyActiveProcesses(userId?: string, weekStart?: string) {
  return useQuery({
    queryKey: processKeys.weeklyActive(userId || '', weekStart || ''),
    queryFn: () => getWeeklyActiveProcesses(userId!, weekStart!),
    enabled: !!userId && !!weekStart,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
