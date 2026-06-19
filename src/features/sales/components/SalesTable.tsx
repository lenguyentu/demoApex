import { Eye, Edit2 } from 'lucide-react';
import type { Sale, OverallAccountingStatus, InvoiceStatus } from '../types';


interface SalesTableProps {
  data: Sale[];
  loading: boolean;
  onView?: (sale: Sale) => void;
  onEdit?: (sale: Sale) => void;
}

const STATUS_STLYES: Record<OverallAccountingStatus, string> = {
  'Doing': 'bg-blue-50 text-blue-700 border-blue-200',
  'Done': 'bg-green-50 text-green-700 border-green-200',
  'Reject': 'bg-red-50 text-red-700 border-red-200',
};

const INVOICE_STYLES: Record<InvoiceStatus, string> = {
  'Đã xuất': 'bg-green-100 text-green-800',
  'Chưa xuất': 'bg-yellow-100 text-yellow-800',
};

export function SalesTable({ data, loading, onView, onEdit }: SalesTableProps) {
  if (loading && data.length === 0) {
    return (
      <div className="p-8 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 animate-pulse rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-20 text-center text-gray-500">
        Chưa có dữ liệu công nợ nào. Hãy nhấn "Thêm mới" để bắt đầu.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-xs text-left">
        <thead className="bg-gray-50/50">
          <tr>
            <th className="px-4 py-3 font-semibold text-gray-500 uppercase tracking-wider w-8 text-center text-[10px]">#</th>
            <th className="px-4 py-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Ngày offer</th>
            <th className="px-4 py-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Khách hàng</th>
            <th className="px-4 py-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Ứng viên</th>
            <th className="px-4 py-3 font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Vị trí</th>
            <th className="px-4 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right text-[10px]">No VAT</th>
            <th className="px-4 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right text-[10px]">VAT</th>
            <th className="px-4 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right text-[10px]">Cần TT</th>
            <th className="px-4 py-3 font-semibold text-gray-500 uppercase tracking-wider text-center text-[10px]">Trạng thái</th>
            <th className="px-4 py-3 font-semibold text-gray-500 uppercase tracking-wider text-center text-[10px]">Hóa đơn</th>
            <th className="px-4 py-3 font-semibold text-gray-500 uppercase tracking-wider text-center text-[10px]">Thao tác</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {data.map((sale, index) => {
            const noVat = (sale.offered_monthly_salary || 0) * (sale.rate || 1);
            const hasVat = sale.finance?.contract_type === 'Công ty' ? noVat * 1.08 : noVat;
            const totalPaid = (sale.finance?.p1_paid_amount || 0) + (sale.finance?.p2_paid_amount || 0);
            const balanceDue = hasVat - totalPaid + (sale.finance?.refund_amount || 0);

            return (
              <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-4 py-3 text-center text-gray-400 font-medium">{index + 1}</td>
                <td className="px-4 py-3 text-gray-600 font-medium">
                  {sale.offer_date ? new Date(sale.offer_date).toLocaleDateString('vi-VN') : '-'}
                </td>
                <td className="px-4 py-3 text-gray-900 font-bold uppercase tracking-tight">
                  {sale.client?.client_name || 'N/A'}
                </td>
                <td className="px-4 py-3 font-semibold text-brand-700">
                  {sale.candidate?.name || 'N/A'}
                </td>
                <td className="px-4 py-3 text-gray-500 italic max-w-[150px] truncate">
                  {sale.job?.position_title || 'N/A'}
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">
                  {noVat.toLocaleString()} đ
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">
                  {hasVat.toLocaleString()} đ
                </td>
                <td className="px-4 py-3 text-right font-bold text-red-600">
                  {balanceDue.toLocaleString()} đ
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_STLYES[sale.finance?.overall_status || 'Doing']}`}>
                    {sale.finance?.overall_status || 'Doing'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${INVOICE_STYLES[sale.finance?.invoice_status || 'Chưa xuất']}`}>
                    {sale.finance?.invoice_status || 'Chưa xuất'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 opacity-100 transition-opacity">
                    <button 
                      onClick={() => onView?.(sale)}
                      className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                    >
                      <Eye size={14} />
                    </button>
                    <button 
                      onClick={() => onEdit?.(sale)}
                      className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
