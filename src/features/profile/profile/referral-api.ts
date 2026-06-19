
import { supabase } from '../../lib/supabase';
import type { ReferralUser, UserStats } from './types';

// Fetch users where assigned_hr_id is the current user (per user request)
export async function getReferrals(currentUserId: string): Promise<ReferralUser[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, role, status, created_at')
    .eq('assigned_hr_id', currentUserId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Note: If avatar_url is essentially distinct (in profiles), we might need a join. 
  // But strictly per schema provided, users table has minimal fields. 
  // Let's assume for now we render what we have. 
  // The user schema provided: 
  // id, email, full_name, role, is_active, created_at, updated_at, status, registration_source, 
  // assigned_hr_id, registration_notes, referral_code, referred_by_user_id, caretaker_id, client_id.
  // No avatar_url in users table explicitly in the provided CREATE TABLE snippet, 
  // but it's common to join. For now I'll just map what's available.

  return (data || []) as unknown as ReferralUser[];
}

// Fetch stats: referral code, self status, and count of users referred (or assigned)
export async function getUserStats(currentUserId: string): Promise<UserStats> {
  // Get current user details for referral code and status
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('referral_code, status, role, full_name')
    .eq('id', currentUserId)
    .single();

  if (userError) throw userError;

  // Count referrals (assigned_hr_id)
  const { count, error: countError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_hr_id', currentUserId);

  if (countError) throw countError;

  return {
    referral_code: userData.referral_code,
    status: userData.status,
    role: userData.role,
    full_name: userData.full_name,
    referred_count: count || 0
  };
}
