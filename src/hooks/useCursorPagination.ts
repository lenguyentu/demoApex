import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

// Xóa interface Cursor vì không còn dùng cứng nhắc nữa
// interface Cursor { ... } 

/**
 * Props cho useCursorPagination
 */
interface UseCursorPaginationProps {
  supabaseClient: SupabaseClient;
  tableName: string;
  select?: string;
  pageSize?: number;
  /** Callback để apply các filter. Phải được wrap bằng useCallback ở component cha. */
  applyFilters?: (query: any) => any;
  /** Khi giá trị này thay đổi, hook sẽ tự động refresh. Dùng useMemo để tránh re-render loop. */
  refreshKey?: string | number;
  /** Có fetch tổng số bản ghi không (tốn resource hơn) */
  enableTotalCount?: boolean;
  /** Custom count function (thay thế count mặc định) */
  customCountFn?: () => Promise<number>;
}

interface UseCursorPaginationResult<T> {
  data: T[];
  loading: boolean;
  error: unknown;
  hasMore: boolean;
  totalCount: number | null;
  loadMore: () => void;
  refresh: () => void;
}

/**
 * Hook phân trang theo cursor (keyset pagination) - tối ưu cho danh sách lớn.
 * Refactored to use useInfiniteQuery for caching.
 * Supports dynamic sort column (default: created_at)
 */
export function useCursorPagination<T extends { id: string, [key: string]: any }>({
  supabaseClient,
  tableName,
  select = '*',
  pageSize = 20,
  applyFilters,
  sortColumn = 'created_at',
  refreshKey,
  enableTotalCount = false,
  countRpcName,
  customCountFn,
  enabled = true,
}: UseCursorPaginationProps & { countRpcName?: string, sortColumn?: string, enabled?: boolean }): UseCursorPaginationResult<T> {
  
  // 1. Query lấy Total Count (nếu cần)
  const { data: totalCount = null } = useQuery({
    queryKey: [tableName, 'count', refreshKey, countRpcName],
    queryFn: async () => {
      // Nếu có custom count function -> dùng nó
      if (customCountFn) {
        return customCountFn();
      }

      // Nếu có RPC name -> dùng RPC để count nhanh
      if (countRpcName) {
        const { data, error } = await supabaseClient.rpc(countRpcName);
        if (error) throw error;
        return data as number;
      }

      // Fallback: Count thường
      let countQuery = supabaseClient
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (applyFilters) {
        countQuery = applyFilters(countQuery);
      }
      
      const { count, error } = await countQuery;
      if (error) throw error;
      return count;
    },
    enabled: enableTotalCount && enabled,
    staleTime: 60 * 1000,
  });

  // 2. Infinite Query lấy Data
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetching,
    error,
    refetch,
  } = useInfiniteQuery<T[]>({
    queryKey: [tableName, 'list', refreshKey, sortColumn],
    queryFn: async ({ pageParam }) => {
      let query = supabaseClient
        .from(tableName)
        .select(select)
        .order(sortColumn, { ascending: false })
        .order('id', { ascending: false })
        .limit(pageSize);

      // Apply Filters
      if (applyFilters) {
        query = applyFilters(query);
      }

      // Apply Cursor
      if (pageParam) {
        // Ép kiểu any cho cursor object vì key sortColumn là dynamic
        const cursor = pageParam as any; 
        const cursorValue = cursor[sortColumn];
        const cursorId = cursor.id;
        
        // Hỗ trợ cả trường hợp giá trị sortColumn là chuỗi hoặc số
        // Cần đảm bảo cú pháp Filter của PostgREST đúng
        query = query.or(
          `${sortColumn}.lt.${cursorValue},and(${sortColumn}.eq.${cursorValue},id.lt.${cursorId})`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return data as unknown as T[];
    },
    enabled: enabled,
    initialPageParam: null, 
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length < pageSize) return null;
      const lastItem = lastPage[lastPage.length - 1];
      return {
        [sortColumn]: lastItem[sortColumn],
        id: lastItem.id,
      };
    },
    staleTime: 60 * 1000 * 3, // Cache 3 phút
  });

  // Flatten data from pages
  const flattenData = useMemo(() => {
    return infiniteData?.pages.flat() || [];
  }, [infiniteData]);

  return {
    data: flattenData,
    loading: isFetching,
    error,
    hasMore: !!hasNextPage,
    totalCount: totalCount ?? null,
    loadMore: fetchNextPage,
    refresh: refetch,
  };
}
