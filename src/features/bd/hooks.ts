import { useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useCursorPagination } from '../../hooks/useCursorPagination';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { 
  updateCustomerStatus, 
  updateCustomerPriority, 
  getBDCustomersQuery, 
  BD_CUSTOMER_SELECT 
} from './api';
import type { BDCustomer, ScheduleItem } from './types';
import toast from 'react-hot-toast';
import { useAuthStore } from '../auth/store';

interface UseBDCustomersProps {
  filters?: {
    search?: string;
    status?: string;
    priority?: string;
    owner_id?: string;
    domain?: string;
    clientId?: string;
    [key: string]: any;
  };
  pageSize?: number;
}

export const useBDCustomers = ({ filters, pageSize = 20 }: UseBDCustomersProps = {}) => {
  const { user } = useAuthStore();
  // Tạo refreshKey string dựa trên filters để reset list khi filter đổi
  const refreshKey = useMemo(() => JSON.stringify({ ...filters, role: user?.role, uid: user?.id }), [filters, user]);
  // ...
  // Removed hardcoded permission check to allow flexible filtering
  // ...

  const applyFilters = useCallback((query: any) => {
    return getBDCustomersQuery(query, filters || {});
  }, [filters]);

  const { data, loading, hasMore, loadMore, refresh, error, totalCount } = useCursorPagination<BDCustomer>({
    supabaseClient: supabase,
    tableName: 'bd_processes',
    select: BD_CUSTOMER_SELECT,
    pageSize, // Use the passed pageSize
    applyFilters,
    refreshKey,
    enableTotalCount: true
  });

  return {
    customers: data,
    isLoading: loading,
    hasMore,
    loadMore,
    refresh,
    error,
    totalCount
  };
};

export const useUpdateBDStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, memo }: { id: string; status: string; memo?: string }) =>
      updateCustomerStatus(id, status, memo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bd_processes'] });
      queryClient.invalidateQueries({ queryKey: ['bd_schedules'] });
      toast.success('Cập nhật trạng thái thành công');
    },
    onError: (error: any) => {
      toast.error('Lỗi cập nhật trạng thái: ' + error.message);
    }
  });
};

export const useUpdateBDPriority = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, priority }: { id: string; priority: string }) =>
      updateCustomerPriority(id, priority),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bd_processes'] });
      queryClient.invalidateQueries({ queryKey: ['bd_schedules'] });
      toast.success('Cập nhật mức độ ưu tiên thành công');
    },
    onError: (error: any) => {
      toast.error('Lỗi cập nhật mức độ ưu tiên: ' + error.message);
    }
  });
};

export const useCreateBDSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      process_id: string;
      owner_id: string;
      title: string;
      scheduled_date: string;
      reminder_type: string;
      description?: string;
    }) => {
       // @ts-ignore
       return import('./api').then(api => api.createBDSchedule(payload));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bd_processes'] });
      queryClient.invalidateQueries({ queryKey: ['bd_schedules'] });
      queryClient.invalidateQueries({ queryKey: ['bd_schedule_stats'] });
      queryClient.invalidateQueries({ queryKey: ['bd_custom_scheduled_data'] });
      toast.success('Đã tạo lịch nhắc mới');
    },
    onError: (error: any) => {
      toast.error('Lỗi tạo lịch nhắc: ' + error.message);
    }
  });
};

// Hook để lấy nhanh danh sách lịch custom sắp tới (cho CustomerTable)
export const useCustomScheduledSchedules = () => {
  return useQuery({
    queryKey: ['bd_custom_scheduled_data'],
    queryFn: async () => {
      // Lấy tất cả lịch Pending, sắp xếp theo ngày gần nhất
      let q = supabase
        .from('bd_schedules')
        .select('process_id, scheduled_date, reminder_type, title')
        .eq('status', 'Pending')
        .order('scheduled_date', { ascending: false });
        
      const { data, error } = await q;
      if (error) throw error;
      
      const scheduleMap = new Map<string, { dueDate: string, type: string, title: string }>();
      (data || []).forEach((r: any) => {
        // Chỉ lưu lịch gần nhất cho mỗi process_id (do đã order by)
        if (!scheduleMap.has(r.process_id)) {
          scheduleMap.set(r.process_id, {
            dueDate: new Date(r.scheduled_date).toISOString().split('T')[0],
            type: r.reminder_type,
            title: r.title
          });
        }
      });
      return scheduleMap;
    },
    staleTime: 1000 * 60 * 2,
    enabled: true
  });
};

// Hook for BD Schedule Management

interface UseBDSchedulesProps {
  filters?: {
    search?: string;
    reminderType?: string; // Changed from 7 | 15 | 30 | 'all' to string
    statusFilter?: 'all' | 'overdue' | 'today' | 'upcoming';
    dateFrom?: string;
    dateTo?: string;
    owner_id?: string;
  };
  pagination?: {
    page: number;
    pageSize: number;
  };
  enabled?: boolean;
}

export const useBDSchedules = ({ filters, pagination = { page: 1, pageSize: 20 }, enabled = true }: UseBDSchedulesProps = {}) => {
  const { user } = useAuthStore();

  const fetchSchedules = useCallback(async () => {
    // Mapping params cho RPC
    // RPC params: p_owner_id, p_search, p_page, p_page_size, p_status_filter, p_reminder_filter

    const rpcParams = {
      p_owner_id: filters?.owner_id || null,
      p_search: filters?.search || '',
      p_page: pagination.page,
      p_page_size: pagination.pageSize,
      p_status_filter: filters?.statusFilter || 'all',
      p_reminder_filter: filters?.reminderType || 'all', // Đổi: không dùng null, luôn gửi string
      p_date_from: filters?.dateFrom || null,
      p_date_to: filters?.dateTo || null
    };

    const { data, error } = await supabase
      .rpc('get_bd_schedules', rpcParams);

    if (error) throw error;

    // Data trả về từ RPC đã đúng cấu trúc, ta chỉ cần map lại tên trường cho khớp ScheduleItem
    // RPC returns: process_id, client_id, client_name, owner_name, bd_process_status, last_contact_date, reminder_type, due_date, overdue_days, priority, source, client_industry, total_count

    const schedules: ScheduleItem[] = (data || []).map((item: any) => ({
      id: `${item.process_id}-${item.reminder_type}`,
      processId: item.process_id,
      clientId: item.client_id,
      clientName: item.client_name || 'Unknown',
      clientIndustry: item.client_industry,
      reminderType: item.reminder_type,
      status: item.bd_process_status,
      startDate: item.last_contact_date, // or anchor date
      dueDate: item.due_date,
      bdOwner: item.owner_name || 'Unassigned',
      bdOwnerId: '', // RPC chưa trả về owner_id, tạm thời để trống hoặc update RPC nếu cần thiết (nhưng UI chưa dùng nhiều)
      overdueDays: item.overdue_days,
      priority: item.priority,
      source: item.source,
      industry: item.client_industry
    }));

    // Lấy total count từ bản ghi đầu tiên (vì window function count(*) over() trả về giống nhau cho mọi row)
    const totalCount = data && data.length > 0 ? Number(data[0].total_count) : 0;

    return { schedules, totalCount };
  }, [filters, pagination.page, pagination.pageSize, user]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['bd_schedules', filters, pagination.page, pagination.pageSize, user?.id],
    queryFn: fetchSchedules,
    enabled: enabled && !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new page
  });

  // Fetch stats separately (independent of pagination)
  const fetchStats = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_bd_schedule_stats', {
      p_owner_id: filters?.owner_id || null,
      p_search: filters?.search || '',
      p_reminder_filter: filters?.reminderType || 'all', // Đổi: luôn gửi string, không dùng null
      p_date_from: filters?.dateFrom || null,
      p_date_to: filters?.dateTo || null
    });

    if (error) throw error;

    return data && data.length > 0 ? {
      total: Number(data[0].total_schedules),
      overdue: Number(data[0].overdue_count),
      today: Number(data[0].today_count),
      upcoming: Number(data[0].upcoming_count)
    } : { total: 0, overdue: 0, today: 0, upcoming: 0 };
  }, [filters?.owner_id, filters?.search, filters?.reminderType, filters?.dateFrom, filters?.dateTo]);

  const { data: statsData } = useQuery({
    queryKey: ['bd_schedule_stats', filters?.owner_id, filters?.search, filters?.reminderType, filters?.dateFrom, filters?.dateTo, user?.id],
    queryFn: fetchStats,
    enabled: enabled && !!user,
    staleTime: 1000 * 60 * 5,
  });

  const stats = statsData || { total: 0, overdue: 0, today: 0, upcoming: 0 };

  return {
    schedules: data?.schedules || [],
    totalCount: data?.totalCount || 0,
    stats, // Lưu ý: Stats hiện tại chỉ có Total là đúng, còn lại cần update thêm sau
    isLoading,
    error,
    refresh: refetch
  };
};

export interface UseBDStatisticsProps {
  filters?: {
    owner_id?: string;
    dateFrom?: string; // ISO String
    dateTo?: string;   // ISO String
  };
}

export const useBDStatistics = ({ filters }: UseBDStatisticsProps = {}) => {
  const { user } = useAuthStore();

  const fetchStatistics = useCallback(async () => {
    // Mock for demo
    const mockData = {
      total_processes: 120,
      report: {
        coldLead: { count: 45, clients: ['Cty A', 'Cty B'] },
        formerClientApproaches: { count: 12, clients: ['Tập đoàn C'] },
        newClientApproaches: { count: 28, clients: ['StartUp D'] },
        clientMeeting: { count: 15, clients: ['Cty Tech X'] },
        newContract: { count: 8, clients: ['Ngân hàng Y'] },
        newJD: { count: 12, clients: ['Công ty Z'] }
      },
      status_counts: {
        'Research': 20,
        'Addfriend/Connect': 15,
        'Approach': 25,
        'Follow up': 18,
        'Consulting': 10,
        'Demo contract': 5,
        'Meeting Clear JD': 8,
        'Signing': 4,
        'Signed': 10,
        'Take care': 5
      },
      source_counts: [
        { source: 'LinkedIn', count: 50 },
        { source: 'Facebook', count: 30 },
        { source: 'Referral', count: 40 }
      ],
      loyal_customers: [
        { client_name: 'Khách hàng Công nghệ A', sector: 'IT', won_deals: 5 },
        { client_name: 'Tập đoàn B', sector: 'Finance', won_deals: 3 }
      ],
      sales_cycle_avg_days: 14.5,
      sales_cycle_distribution: [
        { range: '0-7', count: 10 },
        { range: '8-14', count: 5 }
      ],
      industry_deal_counts: [
        { industry: 'IT', count: 20 },
        { industry: 'Finance', count: 15 }
      ]
    };

    const stats = mockData as any;

    // --- Post-process / Normalize for UI ---

    // Domain Stats (Deal Ratio)
    const normalizeIndustry = (raw: string): string => {
      const cleaned = (raw || '').trim().toLowerCase();
      if (cleaned.includes('information technology') || cleaned === 'it' || cleaned === 'tech' || cleaned.includes('software')) return 'Information Technology (IT)';
      if (cleaned.includes('e-commerce') || cleaned.includes('tmđt') || cleaned.includes('retail')) return 'Retail & E-commerce';
      if (cleaned.includes('finance') || cleaned.includes('banking') || cleaned.includes('fintech')) return 'Finance & Banking';
      if (cleaned.includes('healthcare') || cleaned.includes('medical')) return 'Healthcare & Medical';
      if (cleaned.includes('education') || cleaned.includes('training')) return 'Education & Training';
      if (cleaned.includes('game') || cleaned.includes('media') || cleaned.includes('entertainment')) return 'Media & Entertainment';
      if (cleaned.includes('manufacturing') || cleaned.includes('production')) return 'Manufacturing & Production';
      if (cleaned.includes('real estate') || cleaned.includes('bđs')) return 'Real Estate';
      if (cleaned.includes('logistics') || cleaned.includes('supply chain')) return 'Logistics & Supply Chain';
      if (cleaned.includes('travel') || cleaned.includes('hospitality')) return 'Travel & Hospitality';
      if (!cleaned || cleaned === 'other' || cleaned === 'non-it') return 'Other';
    };

    // Calculate Deal Rate per Domain
    const domainStats: Record<string, { total: number, signed: number, color?: string }> = {};
    const colors = ['#22c55e', '#3b82f6', '#eab308', '#a855f7', '#f43f5e', '#06b6d4', '#8b5cf6', '#ec4899'];
    let colorIdx = 0;

    (stats.dealDomainData || []).forEach((p: any) => {
      const domain = normalizeIndustry(p.name);
      if (!domainStats[domain]) {
        domainStats[domain] = { total: 0, signed: 0, color: colors[colorIdx++ % colors.length] };
      }
      domainStats[domain].total += p.total;
      domainStats[domain].signed += p.signed;
    });

    const dealDomainData = Object.entries(domainStats)
      .map(([name, stats]) => ({
        name,
        value: stats.total > 0 ? Math.round((stats.signed / stats.total) * 100) : 0,
        ...stats
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Final result structure
    return {
      report: stats.report || {
        coldLead: { count: 0, clients: [] },
        formerClientApproaches: { count: 0, clients: [] },
        newClientApproaches: { count: 0, clients: [] },
        clientMeeting: { count: 0, clients: [] },
        newContract: { count: 0, clients: [] },
        newJD: { count: 0, clients: [] }
      },
      statusCounts: stats.status_counts || {},
      sourceCounts: stats.source_counts || [],
      dealDomainData,
      loyalCustomers: stats.loyal_customers || [],
      avgSalesCycle: stats.avgSalesCycle || 0,
      salesCycleData: [
        { name: 'Research', value: 30, color: '#3b82f6' },
        { name: 'Approach', value: 40, color: '#22c55e' },
        { name: 'Closing', value: 30, color: '#eab308' },
      ],
      totalProcesses: stats.total_processes || 0
    };
  }, [filters, user]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['bd_statistics', filters, user?.id],
    queryFn: fetchStatistics,
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 min cache
  });

  return {
    stats: data,
    isLoading,
    error,
    refresh: refetch
  };
};
