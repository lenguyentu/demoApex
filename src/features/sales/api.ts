import type { Sale, SaleFinance, KPITarget, CommissionSetting, KPIPeriodType } from './types';

const makeFinance = (salesId: string, contractType: 'Cá nhân' | 'Công ty', candidateType: 'Nội bộ' | 'CTV' | 'Intern' | 'Freelancer', p1Amount: number, paidAmount: number): SaleFinance => ({
  sales_id: salesId,
  contract_type: contractType,
  candidate_type: candidateType,
  p1_days: 30,
  p1_amount: p1Amount,
  p1_due_date: new Date(Date.now() + 50000000).toISOString(),
  p1_paid_amount: paidAmount,
  p2_days: 60,
  p2_amount: 0,
  p2_due_date: null,
  p2_paid_amount: 0,
  rate_bd: 30,
  rate_ctv: 0,
  rate_internal: 50,
  rate_intern: 0,
  rate_freelancer: 0,
  overall_status: paidAmount >= p1Amount ? 'Done' : 'Doing',
  invoice_status: paidAmount >= p1Amount ? 'Đã xuất' : 'Chưa xuất',
  ctv_status: 'Pending',
  ctv_pay_date: null,
  refund_amount: 0,
  is_manual_override: false,
  note: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

let mockSales: Sale[] = [
  {
    id: 'sale-1',
    process_id: 'process-1',
    client_id: 'client-1',
    candidate_id: 'cand-1',
    job_id: 'job-1',
    job_owner_id: 'mock-user-123',
    candidate_owner_id: 'other-user',
    offered_monthly_salary: 2000,
    fee_percent: 20,
    rate: 1,
    start_date: new Date().toISOString(),
    created_at: new Date(Date.now() - 10000000).toISOString(),
    client: { id: 'client-1', client_name: 'Khách hàng Công nghệ A' },
    job: { id: 'job-1', position_title: 'Senior Frontend', job_id: 'JOB-001' },
    candidate: { id: 'cand-1', name: 'Nguyễn Văn A' },
    job_owner: { id: 'mock-user-123', full_name: 'Admin Demo' },
    candidate_owner: { id: 'other-user', full_name: 'HH Lead Demo' },
    finance: makeFinance('sale-1', 'Công ty', 'Nội bộ', 400, 0),
  },
  {
    id: 'sale-2',
    process_id: 'process-2',
    client_id: 'client-2',
    candidate_id: 'cand-2',
    job_id: 'job-2',
    job_owner_id: 'mock-user-123',
    candidate_owner_id: 'other-user',
    offered_monthly_salary: 3000,
    fee_percent: 25,
    rate: 1,
    start_date: new Date(Date.now() - 60000000).toISOString(),
    created_at: new Date(Date.now() - 80000000).toISOString(),
    client: { id: 'client-2', client_name: 'Tập đoàn B' },
    job: { id: 'job-2', position_title: 'Project Manager', job_id: 'JOB-002' },
    candidate: { id: 'cand-2', name: 'Trần Thị B' },
    job_owner: { id: 'mock-user-123', full_name: 'Admin Demo' },
    candidate_owner: { id: 'other-user', full_name: 'HH Lead Demo' },
    finance: makeFinance('sale-2', 'Công ty', 'Freelancer', 750, 750),
  },
  {
    id: 'sale-3',
    process_id: 'process-3',
    client_id: 'client-3',
    candidate_id: 'cand-3',
    job_id: 'job-3',
    job_owner_id: 'mock-user-123',
    candidate_owner_id: 'other-user',
    offered_monthly_salary: 1500,
    fee_percent: 15,
    rate: 1,
    start_date: new Date(Date.now() + 10000000).toISOString(),
    created_at: new Date(Date.now() - 20000000).toISOString(),
    client: { id: 'client-3', client_name: 'FPT Software' },
    job: { id: 'job-3', position_title: 'Java Developer', job_id: 'JOB-003' },
    candidate: { id: 'cand-3', name: 'Lê Văn C' },
    job_owner: { id: 'mock-user-123', full_name: 'Admin Demo' },
    candidate_owner: { id: 'other-user', full_name: 'HH Lead Demo' },
    finance: makeFinance('sale-3', 'Cá nhân', 'Nội bộ', 225, 0),
  },
  {
    id: 'sale-4',
    process_id: 'process-4',
    client_id: 'client-4',
    candidate_id: 'cand-4',
    job_id: 'job-4',
    job_owner_id: 'mock-user-123',
    candidate_owner_id: 'other-user',
    offered_monthly_salary: 5000,
    fee_percent: 30,
    rate: 1,
    start_date: new Date(Date.now() - 30000000).toISOString(),
    created_at: new Date(Date.now() - 40000000).toISOString(),
    client: { id: 'client-4', client_name: 'VNG Corporation' },
    job: { id: 'job-4', position_title: 'Engineering Manager', job_id: 'JOB-004' },
    candidate: { id: 'cand-4', name: 'Phạm Thị D' },
    job_owner: { id: 'mock-user-123', full_name: 'Admin Demo' },
    candidate_owner: { id: 'other-user', full_name: 'HH Lead Demo' },
    finance: makeFinance('sale-4', 'Công ty', 'Nội bộ', 1500, 500),
  },
  {
    id: 'sale-5',
    process_id: 'process-5',
    client_id: 'client-5',
    candidate_id: 'cand-5',
    job_id: 'job-5',
    job_owner_id: 'mock-user-123',
    candidate_owner_id: 'other-user',
    offered_monthly_salary: 1000,
    fee_percent: 15,
    rate: 1,
    start_date: new Date(Date.now() - 100000000).toISOString(),
    created_at: new Date(Date.now() - 120000000).toISOString(),
    client: { id: 'client-5', client_name: 'StartUp Tech' },
    job: { id: 'job-5', position_title: 'Junior QA', job_id: 'JOB-005' },
    candidate: { id: 'cand-5', name: 'Vũ Đức E' },
    job_owner: { id: 'mock-user-123', full_name: 'Admin Demo' },
    candidate_owner: { id: 'other-user', full_name: 'HH Lead Demo' },
    finance: makeFinance('sale-5', 'Công ty', 'Intern', 150, 100),
  },
];

export const getSales = async (): Promise<Sale[]> => mockSales;
export const getAllProcessesForSale = async () => [];
export const getEligibleProcesses = async () => [];
export const createSaleWithFinance = async (..._args: any[]) => mockSales[0];
export const updateSale = async (id: string, updates: Partial<Sale>) => {
  const sale = mockSales.find(s => s.id === id);
  if (sale) Object.assign(sale, updates);
  return sale;
};
export const updateSaleFinance = async (salesId: string, updates: Partial<SaleFinance>) => {
  const sale = mockSales.find(s => s.id === salesId);
  if (sale && sale.finance) Object.assign(sale.finance, updates);
  return sale?.finance;
};
export const getKPITargets = async (_month?: string) => [];
export const getKPITargetsByYear = async (_year: number) => [];
export const upsertKPITarget = async (target: Partial<KPITarget>) => target;
export const getKPIPolicyPresets = async () => [];
export const getActiveKPIPolicies = async () => [];
export const setKPIPolicyForRoles = async (_params: any) => {};
export const rebuildKPISnapshots = async (..._args: any[]) => {};
export const getInternalUsersForKPI = async () => [];
export const getCurrentEmployeeSalaryHistory = async () => [];
export const getSalaryHistoryByUser = async (_userId: string) => [];
export const getKPISnapshotsByUser = async (_userId: string) => [];
export const upsertEmployeeSalary = async (..._args: any[]) => {};
export const getKPITargetSnapshots = async (_year: number, periodType: KPIPeriodType) => {
  const isMonth = periodType === 'month';
  const labels = isMonth ? ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'] : ['Q1', 'Q2', 'Q3', 'Q4'];
  return labels.map((label, i) => ({
    id: `snap-${i}`,
    user_id: 'mock-user-123',
    role_key: 'BD' as const,
    period_type: periodType,
    period_start: `2026-${String(i + 1).padStart(2, '0')}-01`,
    period_end: `2026-${String(i + 1).padStart(2, '0')}-31`,
    base_salary_at_calc: 15000000,
    multiplier_at_calc: 1.5,
    target_amount: Math.floor(Math.random() * 50000000) + 10000000,
    source_policy_id: null,
    calculated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
};
export const getCommissionSettings = async (): Promise<CommissionSetting[]> => [];
export const upsertCommissionSetting = async (_settings: any) => _settings;
export const getSalesFinanceHistory = async (_financeId: string) => [];
