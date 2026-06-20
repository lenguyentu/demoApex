import { useState, useEffect, useMemo } from 'react';
import { Download, Search, X, Image, FileDown, Loader2 } from 'lucide-react';
import { getSales } from '../api';
import type { Sale } from '../types';
import toast from 'react-hot-toast';
import { DebtTable } from '../components/DebtTable';
import { DebtCollectionModal } from '../components/DebtCollectionModal';
import { DebtHistoryModal } from '../components/DebtHistoryModal';
import { processCashflowData, getMonthKey, type ClientDebtItem } from '../utils';
import { exportToPDF, exportToImage, exportToDebtExcel } from '../utils/exportUtils';

// Helper to get next N months starting from a Date
const getNextMonths = (startDate: Date, count: number) => {
  const keys = [];
  const current = new Date(startDate);
  for (let i = 0; i < count; i++) {
    keys.push(getMonthKey(current.toISOString()));
    current.setMonth(current.getMonth() + 1);
  }
  return keys;
};

export default function DebtTrackingPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal Collection State
  const [isCollectionOpen, setIsCollectionOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedDebtItem, setSelectedDebtItem] = useState<ClientDebtItem | null>(null);
  const [exporting, setExporting] = useState(false);

  // Lọc theo 3 tháng
  const [baseDate, setBaseDate] = useState(() => {
    // Current date logic, e.g. using 2026-04 as the UI demo implies April
    // But realistically use today's date
    const d = new Date();
    d.setDate(1); // Set to 1st of month to avoid overflow issues
    return d;
  });

  useEffect(() => {
    loadSales();
  }, []);

  async function loadSales() {
    try {
      setLoading(true);
      const data = await getSales();
      setSales(data);
    } catch (error) {
      console.error('Error loading sales:', error);
      toast.error('Không thể tải danh sách dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // Generate the 3 month keys based on baseDate
  const monthKeys = useMemo(() => getNextMonths(baseDate, 3), [baseDate]);

  // Handle Search & Status Filtering
  const [statusFilter, setStatusFilter] = useState<'all' | 'Doing' | 'Done' | 'Reject' | 'Cancel'>('all');

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const term = searchTerm.toLowerCase().trim();
      if (term) {
        const clientMatch = s.client?.client_name?.toLowerCase().includes(term);
        const candMatch = s.candidate?.name?.toLowerCase().includes(term);
        const jobMatch = s.job?.position_title?.toLowerCase().includes(term);
        if (!clientMatch && !candMatch && !jobMatch) return false;
      }
      if (statusFilter !== 'all' && s.finance?.overall_status !== statusFilter) return false;
      return true;
    });
  }, [sales, searchTerm, statusFilter]);

  // Aggregate Data
  const groupedData = useMemo(() => {
    return processCashflowData(filteredSales, monthKeys);
  }, [filteredSales, monthKeys]);

  // Calculate top-level KPIs
  const totalIncurredDebt = groupedData.reduce((sum, g) => sum + g.total_incurred_debt, 0);
  const totalPaid = groupedData.reduce((sum, g) => sum + g.total_paid, 0);
  const balanceDebt = groupedData.reduce((sum, g) => sum + g.balance, 0);
  const totalClients = groupedData.length;

  // Export title — 3 tháng liên tiếp
  const exportTitle = (() => {
    const m1 = parseInt(monthKeys[0].split('-')[1]);
    const m2 = parseInt(monthKeys[1].split('-')[1]);
    const m3 = parseInt(monthKeys[2].split('-')[1]);
    const year = monthKeys[0].split('-')[0];
    return `Công nợ T${m1}-T${m2}-T${m3}/${year}`;
  })();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 p-6">
      {/* Header & Stats */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 border-b border-gray-100 pb-4 xl:border-0 xl:pb-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Công nợ</h1>
            <p className="text-sm text-gray-500">{totalClients} khách hàng</p>
          </div>
          
          <div className="h-10 w-px bg-gray-200 hidden sm:block mx-2"></div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2 bg-gray-50 rounded-full border border-gray-200 flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Nợ phát sinh:</span>
              <span className="text-sm font-black text-gray-900">{totalIncurredDebt.toLocaleString()}</span>
            </div>
            <div className="px-4 py-2 bg-green-50 rounded-full border border-green-200 flex items-center gap-2">
              <span className="text-xs text-green-700 font-medium">Đã TT:</span>
              <span className="text-sm font-black text-green-700">{totalPaid.toLocaleString()}</span>
            </div>
            <div className="px-4 py-2 bg-red-50 rounded-full border border-red-200 flex items-center gap-2 shadow-sm shadow-red-100">
              <span className="text-xs text-red-600 font-medium">Dư cuối kỳ:</span>
              <span className="text-sm font-black text-red-600">{balanceDebt.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              const monthLabels = monthKeys.map(mKey => {
                const [year, month] = mKey.split('-');
                return `Tháng ${parseInt(month)}/${year}`;
              });

              // Title gồm 3 tháng liên tiếp — dùng exportTitle từ component level
              const exportRows: any[] = [];
              groupedData.forEach((g) => {
                // Client Row
                exportRows.push({
                  name: g.client_name.toUpperCase(),
                  cases: g.total_cases,
                  incurred: g.total_incurred_debt,
                  paid: g.total_paid,
                  status: '',
                  months: monthKeys.map(mKey => {
                    const proj = g.total_monthly_projections[mKey];
                    return { amount: proj?.paid || 0, date: '' };
                  })
                });

                // Case Rows
                g.items.forEach(item => {
                  const bdAmt = item.finance?.rate_bd > 0 ? Math.round(item.incurred_debt * item.finance.rate_bd / 100 / 1.08) : 0;
                  const hhAmt = item.finance?.rate_internal > 0 ? Math.round(item.incurred_debt * item.finance.rate_internal / 100 / 1.08) : 0;
                  const ctvAmt = item.finance?.rate_ctv > 0 ? Math.round(item.incurred_debt * item.finance.rate_ctv / 100 / 1.08) : (item.finance?.rate_freelancer || 0);
                  const internAmt = item.finance?.rate_intern || 0;
                  const commissionNote = [
                    bdAmt > 0 ? `BD ${item.finance?.rate_bd}%: ${bdAmt.toLocaleString()}` : '',
                    hhAmt > 0 ? `HH ${item.finance?.rate_internal}%: ${hhAmt.toLocaleString()}` : '',
                    ctvAmt > 0 ? `CTV: ${ctvAmt.toLocaleString()}` : '',
                    internAmt > 0 ? `Intern: ${internAmt.toLocaleString()}` : '',
                  ].filter(Boolean).join(' | ');

                  exportRows.push({
                    name: `  • ${item.job_title} - ${item.candidate_name}`,
                    cases: '',
                    incurred: item.incurred_debt,
                    paid: item.paid_amount,
                    commission: commissionNote,
                    status: item.overall_status,
                    months: monthKeys.map(mKey => {
                      const proj = item.monthly_projections[mKey];
                      return { 
                        amount: proj ? (proj.paid_amount > 0 ? proj.paid_amount : proj.expected_amount) : 0, 
                        date: proj ? proj.expected_date.split(' & ')[0] : '' 
                      };
                    })
                  });
                });
              });

              const grandTotal = {
                incurred: totalIncurredDebt,
                paid: totalPaid,
                months: monthKeys.map(mKey => {
                  const proj = groupedData.reduce((acc, g) => acc + (g.total_monthly_projections[mKey]?.paid || 0), 0);
                  return { amount: proj };
                })
              };

              exportToDebtExcel({
                monthHeaders: monthLabels,
                rows: exportRows,
                grandTotal
              }, `CongNo_${exportTitle}_${new Date().toISOString().split('T')[0]}`);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all font-semibold shadow-sm text-sm"
          >
            <Download size={18} className="text-brand-600" />
            Excel
          </button>

          <button 
            onClick={() => {
              exportToImage('debt-tracking-table', 'CongNo', setExporting, exportTitle);
            }}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium disabled:opacity-50"
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Image size={16} />} Ảnh
          </button>
          <button 
            onClick={() => {
              exportToPDF('debt-tracking-table', 'CongNo', setExporting, exportTitle);
            }}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium disabled:opacity-50"
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />} PDF
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col xl:flex-row gap-4 items-center bg-white p-2 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Tìm khách hàng, vị trí, nhân viên..."
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-1 shrink-0">
          {([['all', 'Tất cả'], ['Doing', 'Đang thu'], ['Done', 'Hoàn thành'], ['Reject', 'Reject']] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setStatusFilter(val)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                statusFilter === val
                  ? val === 'Done' ? 'bg-green-500 text-white'
                  : val === 'Reject' ? 'bg-red-400 text-white'
                  : val === 'Doing' ? 'bg-brand-500 text-white'
                  : 'bg-white text-gray-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-3 flex-wrap xl:flex-nowrap w-full xl:w-auto">
          <span className="text-sm font-medium text-gray-500 shrink-0">Chọn tháng bắt đầu:</span>
          
          <div className="flex items-center gap-2">
            {/* Month Selector */}
            <select 
              value={baseDate.getMonth()} 
              onChange={(e) => {
                const newDate = new Date(baseDate);
                newDate.setMonth(parseInt(e.target.value));
                setBaseDate(newDate);
              }}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none text-sm font-medium text-gray-700 focus:ring-2 focus:ring-brand-500"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i} value={i}>Tháng {i + 1}</option>
              ))}
            </select>

            {/* Year Selector */}
            <select 
              value={baseDate.getFullYear()} 
              onChange={(e) => {
                const newDate = new Date(baseDate);
                newDate.setFullYear(parseInt(e.target.value));
                setBaseDate(newDate);
              }}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none text-sm font-medium text-gray-700 focus:ring-2 focus:ring-brand-500"
            >
              {[2024, 2025, 2026, 2027, 2028].map(year => (
                <option key={year} value={year}>Năm {year}</option>
              ))}
            </select>
          </div>
          
          <button 
             onClick={() => {
                const cur = new Date(); cur.setDate(1); setBaseDate(cur);
             }}
             className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-lg transition-colors ml-auto"
          >
            <X size={16} /> Mặc định
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div id="debt-tracking-table">
      <DebtTable 
        groups={groupedData} 
        monthKeys={monthKeys} 
        loading={loading}
        onEditItem={(item) => {
          setSelectedDebtItem(item);
          setIsCollectionOpen(true);
        }}
        onHistoryItem={(item) => {
          setSelectedDebtItem(item);
          setIsHistoryOpen(true);
        }}
      />
      </div>

      <DebtCollectionModal
        isOpen={isCollectionOpen}
        onClose={() => setIsCollectionOpen(false)}
        onSuccess={() => {
           // Reload to fetch the newly input payment amount & notes
           loadSales();
        }}
        item={selectedDebtItem}
      />

      <DebtHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        item={selectedDebtItem}
      />
    </div>
  );
}
