import type { ReferralUser, UserStats } from './types';

export async function getReferrals(_currentUserId: string): Promise<ReferralUser[]> {
  return [];
}

export async function getUserStats(_currentUserId: string): Promise<UserStats> {
  return {
    referral_code: 'DEMO123',
    status: 'approved',
    role: 'Admin',
    full_name: 'Admin Demo',
    total_referrals: 0
  } as any;
}
