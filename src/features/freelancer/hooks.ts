import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getFreelancerPerformance, getFreelancerGlobalStats, getTopJobsByCVCount, getHRRankByRefCount, getHRReferralDetails } from './api';

export interface FreelancerStats {
  id: string; 
  name: string;
  email: string;
  phone?: string;
  
  // Columns from RPC (snake_case)
  cv_to_tdc: number;       
  cv_to_client: number;    
  interviews: number;
  offers: number;
  onboarding: number;    
  rejected: number;      
  conversion_rate: number;
  total_count: number;

  // Compatibility (camelCase) - These are mapped in the hook
  cvToTDC: number;
  cvToClient: number;
  onboardingCount?: number;
  conversionRate: number;
}

export interface JobStats {
  job_id: string;
  position_title: string;
  client_name: string;
  cv_count: number;
}

export interface HRRank {
  hr_id: string;
  hr_name: string;
  hr_email: string;
  ref_count: number;
}

export interface ReferralUser {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

type DateRange = {
  from: Date | null;
  to: Date | null;
};

const PAGE_SIZE = 15;

/**
 * Hook cho danh sách Freelancer sử dụng RPC để hỗ trợ lọc ngày chính xác
 */
export const useFreelancerPerformanceStats = (searchTerm: string = '', dateRange: DateRange) => {
  const query = useInfiniteQuery({
    queryKey: ['freelancer-performance-rpc', searchTerm, dateRange.from?.toISOString(), dateRange.to?.toISOString()],
    queryFn: ({ pageParam = 0 }) => 
      getFreelancerPerformance({
        startDate: dateRange.from?.toISOString() || null,
        endDate: dateRange.to?.toISOString() || null,
        searchTerm,
        limit: PAGE_SIZE,
        offset: pageParam as number
      }).then(data => data as FreelancerStats[]),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
  });

  const flattenData = useMemo(() => {
    const rawData = query.data?.pages.flat() || [];
    return rawData.map(item => ({
        ...item,
        cvToTDC: item.cv_to_tdc,
        cvToClient: item.cv_to_client,
        onboarding: item.onboarding,
        offers: item.offers,
        interviews: item.interviews,
        rejected: item.rejected,
        conversionRate: item.conversion_rate
    }));
  }, [query.data]);

  const totalCount = query.data?.pages[0]?.[0]?.total_count || 0;

  return {
    ...query,
    data: flattenData,
    totalCount,
    hasMore: !!query.hasNextPage,
    loadMore: query.fetchNextPage,
    loading: query.isFetching,
    error: query.error ? (query.error as Error).message : null,
    refresh: query.refetch
  };
};

/**
 * Hook cho các thẻ Stats tổng quát (Cards) sử dụng cùng RPC nhưng không phân trang (limit lớn)
 */
export const useFreelancerGlobalStats = (dateRange: DateRange) => {
    return useQuery({
        queryKey: ['freelancer-global-stats-rpc', dateRange.from?.toISOString(), dateRange.to?.toISOString()],
        queryFn: () => getFreelancerGlobalStats(
            dateRange.from?.toISOString() || null,
            dateRange.to?.toISOString() || null
        ),
        staleTime: 5 * 60 * 1000
    });
};

/**
 * Hook cho top jobs có nhiều CV nhất
 */
export const useTopJobsByCVCount = (dateRange: DateRange, limit: number = 5) => {
    return useQuery({
        queryKey: ['top-jobs-cv-count', dateRange.from?.toISOString(), dateRange.to?.toISOString(), limit],
        queryFn: () => getTopJobsByCVCount(
            dateRange.from?.toISOString() || null,
            dateRange.to?.toISOString() || null,
            limit
        ),
        staleTime: 5 * 60 * 1000
    });
};

/**
 * Hook cho xếp hạng nhân viên theo số lượng người mời
 */
export const useHRRankByRefCount = (dateRange: DateRange, limit: number = 5) => {
    return useQuery({
        queryKey: ['hr-rank-ref-count', dateRange.from?.toISOString(), dateRange.to?.toISOString(), limit],
        queryFn: () => getHRRankByRefCount(
            dateRange.from?.toISOString() || null,
            dateRange.to?.toISOString() || null,
            limit
        ),
        staleTime: 5 * 60 * 1000
    });
};

/**
 * Hook lấy chi tiết referral của một nhân viên
 */
export const useHRReferralDetails = (hrId: string | null, dateRange: DateRange) => {
    return useQuery({
        queryKey: ['hr-referral-details', hrId, dateRange.from?.toISOString(), dateRange.to?.toISOString()],
        queryFn: () => hrId ? getHRReferralDetails(
            hrId,
            dateRange.from?.toISOString() || null,
            dateRange.to?.toISOString() || null
        ) : Promise.resolve([]),
        enabled: !!hrId,
        staleTime: 5 * 60 * 1000
    });
};


