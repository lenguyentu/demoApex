import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Download, Image, FileDown, Loader2, CalendarRange } from 'lucide-react';
import { getSales } from '../api';
import type { Sale } from '../types';
import toast from 'react-hot-toast';
import { SalesTable } from '../components/SalesTable';
import { SaleModal } from '../components/SaleModal';
import { exportToExcel, exportToPDF, exportToImage } from '../utils/exportUtils';

const MONTHS_SHORT = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];

export default function SalesDataPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [invoiceFilter, setInvoiceFilter] = useState('Invoice');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [exporting, setExporting] = useState(false);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear()); // -1 = tất cả năm
  const [selectedMonth, setSelectedMonth] = useState(-1); // -1 = cả năm

  const handleOpenCreate = () => {
    setSelectedSale(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sale: Sale) => {
    setSelectedSale(sale);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleOpenView = (sale: Sale) => {
    setSelectedSale(sale);
    setModalMode('view');
    setIsModalOpen(true);
  };

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
      toast.error('Unable to load data list');
    } finally {
      setLoading(false);
    }
  };

  // Apply all filters
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      // 1. Filter by year/month
      let matchDate = true;
      if (!s.start_date) {
        matchDate = selectedMonth === -1; // Show no-date entries only in 'all year' view
      } else {
        const d = new Date(s.start_date);
        if (selectedYear !== -1 && d.getFullYear() !== selectedYear) matchDate = false;
        if (selectedMonth !== -1 && d.getMonth() !== selectedMonth) matchDate = false;
      }
      if (!matchDate) return false;

      // 2. Filter by search term
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        const clientName = s.client?.client_name?.toLowerCase() || '';
        const candidateName = s.candidate?.name?.toLowerCase() || '';
        const position = s.job?.position_title?.toLowerCase() || '';
        if (!clientName.includes(lowerSearch) && !candidateName.includes(lowerSearch) && !position.includes(lowerSearch)) {
          return false;
        }
      }

      // 3. Filter by Overall Status
      if (statusFilter !== 'All Statuses') {
        if (s.finance?.overall_status !== statusFilter) return false;
      }

      // 4. Filter by Invoice Status
      if (invoiceFilter !== 'Invoice') {
        if (s.finance?.invoice_status !== invoiceFilter) return false;
      }

      return true;
    });
  }, [sales, selectedYear, selectedMonth, searchTerm, statusFilter, invoiceFilter]);

  // Tính toán các con số tổng quan
  const totalNoVat = filteredSales.reduce((sum: number, sale: Sale) => sum + (sale.offered_monthly_salary || 0) * (sale.rate || 1), 0);
  // Cần TT = tổng p1+p2 chưa thu (balance thực tế)
  const totalDue = filteredSales.reduce((sum: number, sale: Sale) => {
    const f = (sale as any).finance;
    if (!f) return sum;
    const total = (f.p1_amount || 0) + (f.p2_amount || 0);
    const paid = (f.p1_paid_amount || 0) + (f.p2_paid_amount || 0);
    return sum + Math.max(0, total - paid);
  }, 0);

  const exportTitle = `Debt Data — ${selectedMonth !== -1 ? MONTHS_SHORT[selectedMonth] + '/' : ''}${selectedYear}`;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 p-6">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Debt Data List</h1>
          <p className="text-sm text-gray-500">{filteredSales.length} records</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Stat cards */}
          <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden h-[38px]">
            <div className="flex items-center gap-2 px-4 border-r border-gray-100 h-full">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">No VAT</span>
              <span className="text-sm font-bold text-gray-900">{(totalNoVat / 1_000_000).toFixed(1)}M VND</span>
            </div>
            <div className="flex items-center gap-2 px-4 h-full">
              <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider whitespace-nowrap">Due</span>
              <span className="text-sm font-bold text-red-600">{(totalDue / 1_000_000).toFixed(1)}M VND</span>
            </div>
          </div>
          <button 
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-all font-semibold shadow-lg shadow-brand-200"
          >
            <Plus size={20} />
            Tạo công nợ
          </button>
          <button 
            onClick={() => {
              const rows = filteredSales.map((s, i) => ({
                stt: i + 1,
                client: s.client?.client_name || '',
                candidate: s.candidate?.name || '',
                position: s.job?.position_title || '',
                salary: s.offered_monthly_salary || 0,
                rate: s.rate || 1,
                fee_no_vat: (s.offered_monthly_salary || 0) * (s.rate || 1),
                start_date: s.start_date || '',
                bd: s.job_owner?.full_name || '',
                hh: s.candidate_owner?.full_name || '',
              }));
              exportToExcel(rows, [
                { key: 'stt', label: '#' },
                { key: 'client', label: 'Customer' },
                { key: 'candidate', label: 'Candidate' },
                { key: 'position', label: 'Position' },
                { key: 'salary', label: 'Offer Salary' },
                { key: 'rate', label: 'Rate' },
                { key: 'fee_no_vat', label: 'Fee No VAT' },
                { key: 'start_date', label: 'Start Date' },
                { key: 'bd', label: 'BD' },
                { key: 'hh', label: 'HH' },
              ], 'DuLieuCongNo');
            }}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            <Download size={16} /> Excel
          </button>
          <button 
            onClick={() => exportToImage('sales-data-table', 'DuLieuCongNo', setExporting, exportTitle)}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Image size={16} />} Image
          </button>
          <button 
            onClick={() => exportToPDF('sales-data-table', 'DuLieuCongNo', setExporting, exportTitle)}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />} PDF
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search customer, candidate, position..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white text-sm"
          >
            <option value="All Statuses">All Statuses</option>
            <option value="Doing">Doing</option>
            <option value="Done">Done</option>
            <option value="Reject">Reject</option>
          </select>
          <select 
            value={invoiceFilter}
            onChange={(e) => setInvoiceFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white text-sm"
          >
            <option value="Invoice">Invoice</option>
            <option value="Issued">Issued</option>
            <option value="Not Issued">Not Issued</option>
          </select>

          <div className="h-6 w-px bg-gray-200"></div>

          <div className="flex items-center gap-1.5">
            <CalendarRange size={14} className="text-gray-400" />
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg outline-none text-sm font-medium bg-white focus:ring-2 focus:ring-brand-500"
            >
              <option value={-1}>All year</option>
              {MONTHS_SHORT.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg outline-none text-sm font-medium bg-white focus:ring-2 focus:ring-brand-500"
            >
              <option value={-1}>All years</option>
              {[2024, 2025, 2026, 2027, 2028].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div id="sales-data-table" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <SalesTable 
          data={filteredSales} 
          loading={loading}
          onView={handleOpenView}
          onEdit={handleOpenEdit}
         
        />
      </div>

      <SaleModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={loadSales} 
        sale={selectedSale}
        mode={modalMode}
      />
    </div>
  );
}
