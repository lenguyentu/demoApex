// @ts-nocheck
import type { UserRole } from '../auth/types';

export type UserStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'inactive';
export type ProfilePosition = string;

export interface ManageUser {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  status: UserStatus | string; // keeping flexible
  registration_source?: string | null;
  assigned_hr_id?: string | null;
  assigned_hr?: { full_name: string | null; email: string | null } | null;
  registration_notes?: string | null;
  referral_code?: string | null;
  referred_by_user_id?: string | null;
  caretaker_id?: string | null;
  client_id?: string | null;
  client?: { client_name: string } | null;
  profile?: { positions_confident: string[] | null } | null;
}

export interface UserFilters {
  role?: UserRole | 'All';
  search?: string;
  status?: string;
}
