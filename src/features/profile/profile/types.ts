
export interface Profile {
  id: string;
  email?: string | null;
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  location?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  zalo?: string | null;
  facebook?: string | null;
  positions_confident?: string[] | null; // ARRAY in DB
  cv_url?: string | null;
  role?: string | null;
  address?: string | null;
  bank_account_number?: string | null;
  bank_account_holder?: string | null;
  bank_name?: string | null;
  bank_branch?: string | null;
  cccd_file_path?: string | null;
  cccd_front_path?: string | null;
  cccd_back_path?: string | null;
  discord_id?: string | null;
}

export interface User {
  id: string;
  email?: string;
  full_name?: string;
  role?: string;
}

export interface ProfileWithUser extends Profile {
  user?: User;
}

export type UpdateProfilePayload = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;



export interface ReferralUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  created_at: string;
  avatar_url?: string;
}

export interface UserStats {
  referral_code?: string;
  referred_count: number;
  status: string;
  role: string;
  full_name?: string;
}

