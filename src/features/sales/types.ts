
export type ContractType = 'Cá nhân' | 'Công ty';
export type CandidateType = 'Nội bộ' | 'CTV' | 'Intern' | 'Freelancer';
export type CTVPaymentStatus = 'Pending' | 'Doing' | 'Done' | 'Reject';
export type InvoiceStatus = 'Issued' | 'Not Issued';
export type OverallAccountingStatus = 'Doing' | 'Done' | 'Reject';
export type GuaranteePeriod = '30_Days' | '60_Days' | '90_Days' | 'None' | 'Other';

export interface Sale {
  id: string;
  process_id: string;
  client_id?: string | null;
  hr_contact_id?: string | null;
  job_id?: string | null;
  candidate_id?: string | null;
  job_owner_id?: string | null;
  candidate_owner_id?: string | null;
  handled_by_id?: string | null; // Headhunter phụ trách
  entry_route?: string | null;
  visa_type?: string[] | null;
  offered_monthly_salary?: number | null;
  fee_percent?: number | null;
  rate?: number | null; // Hệ số phí (mặc định 1)
  guarantee_period?: GuaranteePeriod | null;
  guarantee_days?: number | null; // Số ngày bảo hành
  start_date?: string | null;
  payment_due_date?: string | null;
  guarantee_end_date?: string | null;
  offer_date?: string | null;
  fee_for_saler?: string | null;
  note?: string | null; // Ghi chú linh hoạt (ví dụ: Intern - HH Lead info)
  created_at: string;
  created_by_id?: string | null;
  updated_at?: string | null;
  updated_by_id?: string | null;

  // Joined fields (optional)
  client?: { id: string; client_name: string };
  job?: { id: string; position_title: string; job_id: string };
  candidate?: { id: string; name: string };
  job_owner?: { id: string; full_name: string };
  candidate_owner?: { id: string; full_name: string };
  finance?: SaleFinance | null;
}

export interface SaleFinance {
  sales_id: string;
  contract_type: ContractType;
  candidate_type: CandidateType;
  
  // Installments
  p1_days: number;
  p1_amount: number;
  p1_due_date?: string | null;
  p1_paid_amount: number;
  
  p2_days: number;
  p2_amount: number;
  p2_due_date?: string | null;
  p2_paid_amount: number;
  
  // Commission Rates (% or Fixed)
  rate_bd: number;
  rate_ctv: number;
  rate_internal: number; // % HH / Nội bộ
  rate_intern: number; // HH Intern Fixed
  rate_freelancer: number; // HH Freelancer Fixed
  
  // Statuses
  overall_status: OverallAccountingStatus;
  invoice_status: InvoiceStatus;
  ctv_status: CTVPaymentStatus;
  ctv_pay_date?: string | null;
  
  refund_amount: number;
  is_manual_override: boolean;
  note?: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface KPITarget {
  id: string;
  user_id: string;
  target_amount: number;
  target_month: string;
  created_at: string;
  updated_at: string;
}

export type KPIRole = 'BD' | 'Headhunter' | 'Admin';
export type KPIPeriodType = 'month' | 'quarter';

export interface KPIPolicy {
  id: string;
  role_key: KPIRole;
  period_type: KPIPeriodType;
  base_metric: 'salary';
  multiplier: number;
  rule_params: Record<string, unknown>;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface KPIPolicyPreset {
  id: string;
  preset_code: string;
  preset_name: string;
  month_multiplier: number;
  quarter_multiplier: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface KPIInternalUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  kpi_role: KPIRole | null;
}

export interface EmployeeSalaryHistory {
  id: string;
  user_id: string;
  base_salary: number;
  effective_from: string;
  effective_to: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommissionSetting {
  id: string;
  user_id: string;
  role_key: 'BD' | 'Headhunter';
  kpi_amount: number;
  commission_rate: number;
  hot_bonus_per_case: number;
  created_at: string;
  updated_at: string;
}

export interface KPITargetSnapshot {
  id: string;
  user_id: string;
  role_key: KPIRole;
  period_type: KPIPeriodType;
  period_start: string;
  period_end: string;
  base_salary_at_calc: number;
  multiplier_at_calc: number;
  target_amount: number;
  source_policy_id: string | null;
  calculated_at: string;
  created_at: string;
  updated_at: string;
  user?: { id: string; full_name: string };
}
