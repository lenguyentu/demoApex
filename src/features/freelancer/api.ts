
import { supabase } from '../../lib/supabase';

// Reuse types from profile and processes
import type { Profile } from '../profile/types';
import type { Candidate } from '../candidates/types';

export interface FreelancerProfile extends Profile {
  email: string; // from user
}

export interface FreelancerPerformanceParams {
  startDate?: string | null;
  endDate?: string | null;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

export const getFreelancers = async () => {
    // Query directly from 'users' table which is the source of truth
    const { data: usersData, error } = await supabase
        .from('users')
        .select('id, full_name, role, email, status') // Removed phone as it might not be in users table
        .eq('role', 'Freelancer')
        // Optional: Filter by status if needed, e.g., only active freelancers
        // .eq('status', 'active') 
        ;

    if (error) throw error;
    if (!usersData || usersData.length === 0) return [];

    // Fetch phone numbers from profiles separately (since profiles usually has phone)
    const userIds = usersData.map(u => u.id);
    const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, phone')
        .in('id', userIds);

    const phoneMap = new Map(profilesData?.map(p => [p.id, p.phone]) || []);

    return usersData.map(u => ({
        id: u.id,
        full_name: u.full_name,
        phone: phoneMap.get(u.id) || '',
        role: u.role,
        email: u.email || ''
    }));
};

// Fetch simplified candidates for stats
export const getFreelancerCandidates = async (freelancerIds: string[], startDate?: Date) => {
    let query = supabase
        .from('candidates')
        .select('id, created_by_id, created_at')
        .in('created_by_id', freelancerIds);
    
    if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Partial<Candidate>[];
};

// Fetch simplified processes for stats
export const getFreelancerProcesses = async (freelancerIds: string[], startDate?: Date) => {
    let query = supabase
        .from('processes')
        .select(`
            id, 
            process_status, 
            owner_id, 
            created_at,
            process_history (
                status,
                created_at
            )
        `)
        .in('owner_id', freelancerIds);

    if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as any[]; // Typed loosely to allow join
};

export const getFreelancerCVDetails = async (freelancerId: string, includeHistory: boolean = false) => {
    let selectQuery = `
            id,
            created_at,
            process_status,
            candidate:candidates!inner(id, name),
            job:jobs!inner(
                id,
                position_title,
                client:clients!inner(client_name)
            )
    `;

    if (includeHistory) {
        selectQuery += `,
            process_history (
                status,
                change_memo,
                created_at
            )
        `;
    }

    const { data, error } = await supabase
        .from('processes')
        .select(selectQuery)
        .eq('owner_id', freelancerId)
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
};
/**
 * Gọi RPC lấy hiệu suất Freelancer (dùng cho cả list và stats)
 */
export const getFreelancerPerformance = async ({
    startDate,
    endDate,
    searchTerm = '',
    limit = 15,
    offset = 0
}: FreelancerPerformanceParams) => {
    const { data, error } = await supabase.rpc('get_freelancer_performance', {
        p_start_date: startDate || null,
        p_end_date: endDate || null,
        p_search_term: searchTerm,
        p_limit: limit,
        p_offset: offset
    });

    if (error) throw error;
    return data;
};

/**
 * Lấy stats tổng hợp cho toàn bộ Freelancers dựa trên ngày
 */
export const getFreelancerGlobalStats = async (startDate?: string | null, endDate?: string | null) => {
    const data = await getFreelancerPerformance({
        startDate,
        endDate,
        searchTerm: '',
        limit: 1000, 
        offset: 0
    });

    const statsList = data as any[];
    const totalCVToTDC = statsList.reduce((acc, curr) => acc + (Number(curr.cv_to_tdc) || 0), 0);
    const totalOnboarding = statsList.reduce((acc, curr) => acc + (Number(curr.onboarding) || 0), 0);
    const overallConversionRate = totalCVToTDC > 0 
        ? ((totalOnboarding / totalCVToTDC) * 100).toFixed(1) 
        : '0.0';

    return {
        totalCVToTDC,
        totalOnboarding,
        overallConversionRate
    };
};

/**
 * Láy top jobs có nhiều CV nhất dựa trên ngày
 */
export const getTopJobsByCVCount = async (startDate?: string | null, endDate?: string | null, limit: number = 10) => {
    const { data, error } = await supabase.rpc('get_top_jobs_by_cv_count', {
        p_start_date: startDate || null,
        p_end_date: endDate || null,
        p_limit: limit
    });

    if (error) throw error;
    return data as any[];
};

/**
 * Lấy xếp hạng nhân viên theo số lượng người mời (referrals)
 */
export const getHRRankByRefCount = async (startDate?: string | null, endDate?: string | null, limit: number = 5) => {
    const { data, error } = await supabase.rpc('get_hr_rank_by_ref_count', {
        p_start_date: startDate || null,
        p_end_date: endDate || null,
        p_limit: limit
    });

    if (error) throw error;
    return data as any[];
};

/**
 * Lấy chi tiết các user được một nhân viên mời trong khoảng thời gian
 */
export const getHRReferralDetails = async (hrId: string, startDate?: string | null, endDate?: string | null) => {
    const { data, error } = await supabase.rpc('get_hr_referral_details', {
        p_hr_id: hrId,
        p_start_date: startDate || null,
        p_end_date: endDate || null
    });

    if (error) throw error;
    return data as any[];
};
