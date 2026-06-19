import type { Sale } from './types';

export interface MonthlyProjection {
  expected_amount: number;
  paid_amount: number;
  expected_date: string;
}

export interface ClientDebtItem {
  sale_id: string;
  candidate_name: string;
  job_title: string;
  incurred_debt: number; // Nợ phát sinh (total_amount with VAT from P1 + P2)
  paid_amount: number; // Đã thanh toán (p1_paid_amount + p2_paid_amount)
  monthly_projections: Record<string, MonthlyProjection>;
  start_date?: string; // Ngày ứng viên đi làm
  // For interaction/editing:
  finance: any;
  note?: string;
  overall_status?: string;
  bd_owner_name?: string | null;
  hh_owner_name?: string | null;
}

export interface ClientDebtGroup {
  client_id: string;
  client_name: string;
  total_cases: number;
  total_incurred_debt: number;
  total_paid: number;
  balance: number;
  items: ClientDebtItem[];
  total_monthly_projections: Record<string, { expected: number; paid: number }>;
}

/**
 * Thêm số ngày vào một ngày cụ thể
 */
export const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

/**
 * Lấy key tháng định dạng 'YYYY-MM' từ ngày
 */
export const getMonthKey = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Gom nhóm danh sách Sales theo Khách hàng và dự phóng dòng tiền
 */
export const processCashflowData = (sales: Sale[], monthKeys: string[]): ClientDebtGroup[] => {
  const groupMap: Record<string, ClientDebtGroup> = {};

  sales.forEach(sale => {
    // Chỉ xử lý những deal có cấu hình tài chính và có khách hàng
    if (!sale.finance || !sale.client_id || !sale.client?.client_name) return;

    const clientId = sale.client_id;
    const clientName = sale.client.client_name;

    if (!groupMap[clientId]) {
      groupMap[clientId] = {
        client_id: clientId,
        client_name: clientName,
        total_cases: 0,
        total_incurred_debt: 0,
        total_paid: 0,
        balance: 0,
        items: [],
        total_monthly_projections: {}
      };
      
      // Initialize zero values for all requested months
      monthKeys.forEach(mKey => {
        groupMap[clientId].total_monthly_projections[mKey] = { expected: 0, paid: 0 };
      });
    }

    const start_date = sale.start_date?.split('T')[0];
    const finance = sale.finance;
    
    // Tổng đã thanh toán
    const paid = (finance.p1_paid_amount || 0) + (finance.p2_paid_amount || 0);
    // Tổng phát sinh = Phí mong đợi của P1 + P2
    const amountP1 = finance.p1_amount || 0;
    const amountP2 = finance.p2_amount || 0;
    const totalIncurred = amountP1 + amountP2;
    // Nếu status Done nhưng paid = 0 → coi như đã thu đủ
    const effectivePaid = (finance.overall_status === 'Done' && paid === 0) ? totalIncurred : paid;
    // Dư cuối kỳ = (Phát sinh - Đã TT)
    // Coi số tiền refund là giảm nợ
    const refund = finance.refund_amount || 0;
    const balance = totalIncurred - effectivePaid - refund;

    const monthly_projections: Record<string, MonthlyProjection> = {};

    // KẾT HỢP OVERRIDE: Nếu DB có sẵn do Kế Toán tự chọn -> Xài. Nếu Null -> Bấm máy tính bằng start_date + p_days.
    let p1DueDate = finance.p1_due_date ? finance.p1_due_date.split('T')[0] : null;
    if (!p1DueDate && start_date && finance.p1_days > 0) {
       p1DueDate = addDays(start_date, finance.p1_days);
    }

    let p2DueDate = finance.p2_due_date ? finance.p2_due_date.split('T')[0] : null;
    if (!p2DueDate && start_date && finance.p2_days > 0) {
       p2DueDate = addDays(start_date, finance.p2_days);
    }

    // Logic trừ nợ thông minh: Lấy tổng tiền đã thu để trừ dần qua các đợt
    let unpaidAmount = effectivePaid;

    // Tính toán cho Đợt 1
    const deductionP1 = Math.min(amountP1, unpaidAmount);
    unpaidAmount -= deductionP1;

    // Tính toán cho Đợt 2
    const deductionP2 = Math.min(amountP2, unpaidAmount);

    // Map P1 vào dòng tiền
    if (p1DueDate && amountP1 > 0) {
      const p1MonthKey = getMonthKey(p1DueDate);
      const paidP1 = deductionP1;
      
      if (p1MonthKey && monthKeys.includes(p1MonthKey)) {
        monthly_projections[p1MonthKey] = {
          expected_amount: amountP1,
          paid_amount: paidP1,
          expected_date: p1DueDate
        };
        groupMap[clientId].total_monthly_projections[p1MonthKey].expected += amountP1;
        groupMap[clientId].total_monthly_projections[p1MonthKey].paid += paidP1;
      }
    }

    // Map P2 vào dòng tiền
    if (p2DueDate && amountP2 > 0) {
      const p2MonthKey = getMonthKey(p2DueDate);
      const paidP2 = deductionP2;
      
      if (p2MonthKey && monthKeys.includes(p2MonthKey)) {
        if (monthly_projections[p2MonthKey]) {
           monthly_projections[p2MonthKey].expected_amount += amountP2;
           monthly_projections[p2MonthKey].paid_amount += paidP2;
           monthly_projections[p2MonthKey].expected_date += ` & ${p2DueDate}`;
        } else {
           monthly_projections[p2MonthKey] = {
             expected_amount: amountP2,
             paid_amount: paidP2,
             expected_date: p2DueDate
           };
        }
        
        groupMap[clientId].total_monthly_projections[p2MonthKey].expected += amountP2;
        groupMap[clientId].total_monthly_projections[p2MonthKey].paid += paidP2;
      }
    }

    // Tự động xác định trạng thái hiển thị dựa trên số tiền
    // Ưu tiên: Reject/Cancel từ DB không bị override
    let displayStatus: string = finance.overall_status || 'Doing';
    if (displayStatus !== 'Reject' && displayStatus !== 'Cancel') {
      if (totalIncurred > 0 && paid >= totalIncurred) {
        displayStatus = 'Done';
      }
    }

    groupMap[clientId].total_cases += 1;
    groupMap[clientId].total_incurred_debt += totalIncurred;
    groupMap[clientId].total_paid += paid;
    groupMap[clientId].balance += balance;

    groupMap[clientId].items.push({
      sale_id: sale.id,
      candidate_name: sale.candidate?.name || 'Unknown',
      job_title: sale.job?.position_title || 'Unknown',
      incurred_debt: totalIncurred,
      paid_amount: paid,
      monthly_projections,
      start_date: sale.start_date?.split('T')[0],
      finance: { ...finance, start_date: sale.start_date },
      note: finance.note || undefined, 
      overall_status: displayStatus,
      bd_owner_name: (sale as any).job_owner?.full_name || null,
      hh_owner_name: (sale as any).candidate_owner?.full_name || null,
    });
  });

  // Chuyển Object thành mảng và sắp xếp theo số lượng case giảm dần hoặc nợ giảm dần
  return Object.values(groupMap).sort((a, b) => b.total_incurred_debt - a.total_incurred_debt);
};
