import { supabase } from '../../lib/supabase';


export type MetricType = 'INTERVIEW_ACTUAL' | 'CV_QUALIFIED' | 'PLACED';
export type CampaignStatus = 'Draft' | 'Active' | 'Completed' | 'Cancelled';

export interface CampaignRule {
  target_phases?: string[];
  assignment_types?: string[];
}

export interface Campaign {
  id: string;
  title: string;
  subtitle: string | null;
  thumbnail_url: string | null;
  banner_url: string | null;
  metric_type: MetricType;
  rules: CampaignRule;
  reward_amount: number;
  apply_start_date: string;
  apply_end_date: string;
  display_start_date: string;
  display_end_date: string;
  status: CampaignStatus;
  created_at: string;
  updated_at: string;
}

export interface CampaignFormData extends Omit<Campaign, 'id' | 'created_at' | 'updated_at'> {}

export interface CampaignLeaderboardRow {
  freelancer_id: string;
  freelancer_name: string;
  process_count: number;
  total_reward: number;
}

export const getCampaigns = async () => {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data as Campaign[];
};

export const getActiveCampaigns = async () => {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('status', 'Active')
    .lte('display_start_date', new Date().toISOString())
    .gte('display_end_date', new Date().toISOString())
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data as Campaign[];
};

export const createCampaign = async (payload: CampaignFormData) => {
  const { data, error } = await supabase
    .from('campaigns')
    .insert([payload])
    .select()
    .single();
    
  if (error) throw error;
  return data as Campaign;
};

export const updateCampaign = async (id: string, payload: Partial<CampaignFormData>) => {
  const { data, error } = await supabase
    .from('campaigns')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data as Campaign;
};

export const deleteCampaign = async (id: string) => {
  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
  return true;
};

export const fetchCampaignLeaderboard = async (campaignId: string) => {
  const { data, error } = await supabase
    .rpc('get_campaign_leaderboard', { p_campaign_id: campaignId });
    
  if (error) throw error;
  return data as CampaignLeaderboardRow[];
};
