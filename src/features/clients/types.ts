/**
 * BD Process Phases - align with BD CRM
 */
export type BDPhase = 'Connect' | 'Follow up' | 'Approach' | 'Nurturing' | 'Proposal' | 'Negotiation' | 'Closing' | 'Lost';

/**
 * BD Process Status - granular statuses from BD CRM
 */
export type BDStatus = 
  | 'Working' | 'Hiring' | 'Pending' | 'Closed' | 'Reject'
  | 'Research' | 'Addfriend/Connect' | 'Approach' | 'Follow up' | 'Consulting'
  | 'Demo contract' | 'Signing' | 'Signed' | 'Meeting Clear JD' | 'Hunting'
  | 'Take care' | 'No current need' | 'Excluded';

/**
 * Client Rank - A, B, C, D, F, Z
 */
export type ClientRank = 'A' | 'B' | 'C' | 'D' | 'F' | 'Z';

/**
 * Interface chính cho Client (bảng clients)
 */
export interface Client {
  id: string;
  client_name: string;
  client_rank?: ClientRank | null;
  location?: string | null;
  client_industry?: string | null;
  owner_id?: string | null;
  user_id?: string | null;
  tax_id?: string | null;
  address?: string | null;
  website_url?: string | null;
  
  // Audit fields
  created_at: string;
  updated_at?: string | null;
  
  // Joined data
  owner?: {
    id: string;
    full_name?: string | null;
    email?: string | null;
  } | null;
  
  // BD Process (từ join)
  bd_processes?: BDProcess[] | BDProcess | null;
  
  contract_rate?: number | null;
  warranty_period?: number | null;
  notes?: string | null;
}

/**
 * Interface cho BD Process (bảng bd_processes)
 */
export interface BDProcess {
  id: string;
  client_id: string;
  phase: BDPhase;
  status: BDStatus;
  memo?: string | null;
  first_contact_date?: string | null;
  last_contact_date?: string | null;
  created_at: string;
  updated_at?: string | null;
  
  // Joined data
  clients?: {
    id: string;
    client_name: string;
  } | null;
  users?: {
    id: string;
    full_name?: string | null;
  } | null;
}

/**
 * Interface cho BD Process History (bảng bd_process_history)
 */
export interface BDProcessHistory {
  id: string;
  process_id: string;
  old_phase?: string | null;
  new_phase?: string | null;
  old_status?: string | null;
  new_status?: string | null;
  status?: string | null;
  memo?: string | null;
  changed_by?: string | null;
  change_date: string;
  
  // Joined data
  changed_by_user?: {
    id: string;
    full_name?: string | null;
  } | null;
}

/**
 * Filter options cho getClients
 */
export interface ClientFilters {
  id?: string;
  client_name?: string;
  client_rank?: string;
  phase?: string;
  owner_id?: string;
  location?: string;
  client_industry?: string;
  hr_email?: string;
  hr_phone?: string;
}

/**
 * Payload để tạo/cập nhật Client
 */
export type ClientFormData = Omit<
  Client, 
  'id' | 'created_at' | 'updated_at' | 'owner' | 'bd_processes'
>;

/**
 * Payload để cập nhật BD Process
 */
export interface UpdateBDProcessPayload {
  phase?: BDPhase;
  status?: BDStatus;
  memo?: string;
  first_contact_date?: string;
  last_contact_date?: string;
}

/**
 * Job đơn giản (cho ClientJobsModal)
 */
export interface ClientJob {
  id: string;
  job_id?: string | null;
  position_title?: string | null;
  phase?: string | null;
}

export interface HrContactData {
  id?: string;
  client_id?: string;
  name: string;
  position_title: string;
  zip_code?: string;
  address?: string;
  phone_1?: string;
  phone_2?: string;
  email_1?: string;
  email_2?: string;
  division?: string;
  newsletter?: string[];
  key_person?: boolean;
  memo?: string;
}

export interface NewClientData {
    id?: string;
    client_name: string;
    owner_id: string | null;
    client_rank: ClientRank | null;
    client_industry: string;
    website_url: string;
    tax_id: string;
    location: string;
    address: string;
    business_overview: string;
    working_hours: string;
    insurance: string;
    medical_expense: string;
    bonus: string;
    allowance: string;
    sick_leave: string;
    annual_leave: string;
    probation_period: string;
    other_benefits: string;
    user_id?: string;
    contract_rate?: number | null;
    warranty_period?: number | null;
    notes?: string;
}
