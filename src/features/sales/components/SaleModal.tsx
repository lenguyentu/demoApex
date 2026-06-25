import { useState, useEffect, useMemo, useRef } from 'react';
import { X, Calculator, Info, User, Save, Search, ChevronDown, AlertTriangle } from 'lucide-react';
import { createSaleWithFinance, updateSale, updateSaleFinance, getSales } from '../api';
import type { Sale, CandidateType, ContractType, OverallAccountingStatus, InvoiceStatus, CTVPaymentStatus } from '../types';
import { useAuthStore } from '../../auth/store';
import toast from 'react-hot-toast';
import { MoneyInput, formatMoney } from './MoneyInput';
import { useActiveInternalUsers } from '../../auth/hooks';
// import { updateClientOwner } from '../../clients/api';
import { getProcesses } from '../../processes/api';
import { ClientSelect } from '../../../components/ClientSelect';
import { OwnerSelect } from '../../../components/OwnerSelect';
import { useDebounce } from '../../../hooks';
import { ROLE_OPTIONS } from '../../processes/constants';

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sale?: Sale | null;
  mode?: 'create' | 'edit' | 'view';
}

export function SaleModal({ isOpen, onClose, onSuccess, sale, mode = 'create' }: SaleModalProps) {
  const user = useAuthStore(state => state.user);
  const { data: internalUsers = [] } = useActiveInternalUsers();
  const [step, setStep] = useState(1);
  const [processes, setProcesses] = useState<any[]>([]);
  const [existingSaleProcessIds, setExistingSaleProcessIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const assigneeRef = useRef<HTMLDivElement>(null);
  const [hhAssigneeDropdownOpen, setHhAssigneeDropdownOpen] = useState(false);
  const [hhAssigneeSearch, setHhAssigneeSearch] = useState('');
  const hhAssigneeRef = useRef<HTMLDivElement>(null);
  
  // Step 1 filters - sử dụng component có sẵn
  const [candidateSearch, setCandidateSearch] = useState(''); // Tìm theo tên/email ứng viên
  const [clientFilter, setClientFilter] = useState(''); // Client ID từ ClientSelect
  const [ownerFilter, setOwnerFilter] = useState(''); // Owner ID từ OwnerSelect
  const [roleFilter, setRoleFilter] = useState(''); // Role filter - empty string = all
  const debouncedCandidateSearch = useDebounce(candidateSearch, 500);

  const isEdit = mode === 'edit';
  const isView = mode === 'view';
  const isCreate = mode === 'create';

  // Form State - Deal Info
  const [selectedProcessId, setSelectedProcessId] = useState('');
  const [offerDate, setOfferDate] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [salary, setSalary] = useState(0);
  const [feePercent, setFeePercent] = useState(20);
  const [rate, setRate] = useState(1);
  const [contractType, setContractType] = useState<ContractType>('Công ty');
  
  // Form State - Persons
  const [bdOwnerId, setBdOwnerId] = useState('');
  const [hhOwnerId, setHhOwnerId] = useState('');
  const [hhOwnerRole, setHhOwnerRole] = useState<string>('');
  const [bdName, setBdName] = useState('');
  const [bdEmail, setBdEmail] = useState('');
  const [hhName, setHhName] = useState('');
  const [hhEmail, setHhEmail] = useState('');
  const [candidateType, setCandidateType] = useState<CandidateType>('Nội bộ');
  const [assignedUserId, setAssignedUserId] = useState(''); // Người được gán (internal users only)

  // Form State - Commissions
  const [commissionRates, setCommissionRates] = useState({
    bd: 20,
    headhunter: 80,
    ctv: 5
  });
  const [fixedCommissions, setFixedCommissions] = useState({
    intern: 0,
    freelancer: 0,
    internal: 0
  });
  // Toggle: CTV hoa hồng theo % hay VNĐ cố định
  const [ctvCommissionMode, setCtvCommissionMode] = useState<'percent' | 'fixed'>('percent');

  // Form State - Terms
  const [p1Days, setP1Days] = useState(30);
  const [p2Days, setP2Days] = useState(60);
  const [guaranteeDays, setGuaranteeDays] = useState(60);
  // Phân bổ đợt 1: % hoặc VNĐ cố định — đợt 2 = phần còn lại
  const [p1Mode, setP1Mode] = useState<'percent' | 'fixed'>('percent');
  const [p1Percent, setP1Percent] = useState(50); // % của tổng VAT
  const [p1FixedAmount, setP1FixedAmount] = useState(0); // VNĐ cố định

  // Form State - Statuses
  const [status, setStatus] = useState({
    overall: 'Doing' as OverallAccountingStatus,
    invoice: 'Chưa xuất' as InvoiceStatus,
    ctv: 'Pending' as CTVPaymentStatus
  });

  // Form State - Note
  const [saleNote, setSaleNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Load existing sales process IDs để check duplicate
      getSales().then(data => {
        setExistingSaleProcessIds(new Set(data.map(s => s.process_id).filter(Boolean)));
      }).catch(() => {});

      if (sale) {
        // Initialize from existing sale
        setStep(2);
        setSelectedProcessId(sale.process_id);
        setOfferDate(sale.offer_date?.split('T')[0] || '');
        setStartDate(sale.start_date?.split('T')[0] || '');
        setSalary(sale.offered_monthly_salary || 0);
        setFeePercent(sale.fee_percent || 0);
        setRate(sale.rate || 1);
        setGuaranteeDays(sale.guarantee_days || 60);
        setSaleNote(sale.note || ''); // Load note
        
        setBdOwnerId(sale.job_owner_id || '');
        setBdName(sale.job_owner?.full_name || '');
        setHhOwnerId(sale.candidate_owner_id || '');
        setHhName(sale.candidate_owner?.full_name || '');
        setAssignedUserId(sale.handled_by_id || ''); // Load assigned user
        
        if (sale.finance) {
          setContractType(sale.finance.contract_type);
          setCandidateType(sale.finance.candidate_type);
          setP1Days(sale.finance.p1_days);
          setP2Days(sale.finance.p2_days);
          // Tính ngược p1Percent từ p1_amount
          const total = sale.finance.p1_amount + sale.finance.p2_amount;
          if (total > 0) {
            setP1Mode('fixed');
            setP1FixedAmount(sale.finance.p1_amount);
          }
          setCommissionRates({
            bd: sale.finance.rate_bd,
            headhunter: sale.finance.rate_internal,
            ctv: sale.finance.rate_ctv
          });
          setFixedCommissions({
            intern: sale.finance.rate_intern,
            freelancer: sale.finance.rate_freelancer,
            internal: 0 // Placeholder
          });
          setStatus({
            overall: sale.finance.overall_status,
            invoice: sale.finance.invoice_status,
            ctv: sale.finance.ctv_status
          });
        }
      } else {
        // Reset for create mode
        setStep(1);
        setSelectedProcessId('');
        setCandidateSearch('');
        setClientFilter('');
        setOwnerFilter('');
        setRoleFilter('');
        setProcesses([]); // Clear processes - không load ban đầu
        resetForm();
      }
    }
  }, [isOpen, sale]);

  const resetForm = () => {
    setOfferDate('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setSalary(0);
    setFeePercent(20);
    setRate(1);
    setContractType('Công ty');
    setBdOwnerId('');
    setHhOwnerId('');
    setBdName('');
    setHhName('');
    setCandidateType('Nội bộ');
    setAssignedUserId(''); // Reset assigned user
    setCommissionRates({ bd: 20, headhunter: 80, ctv: 5 });
    setFixedCommissions({ intern: 0, freelancer: 0, internal: 0 });
    setP1Days(30);
    setP2Days(60);
    setGuaranteeDays(60);
    setP1Mode('percent');
    setP1Percent(50);
    setP1FixedAmount(0);
    setStatus({ overall: 'Doing', invoice: 'Not Issued', ctv: 'Pending' });
    setSaleNote(''); // Reset note
  };

  // Close assignee dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (assigneeRef.current && !assigneeRef.current.contains(e.target as Node)) {
        setAssigneeDropdownOpen(false);
        setAssigneeSearch('');
      }
      if (hhAssigneeRef.current && !hhAssigneeRef.current.contains(e.target as Node)) {
        setHhAssigneeDropdownOpen(false);
        setHhAssigneeSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Load processes by default
  useEffect(() => {
    if (isOpen && step === 1) {
      loadProcesses();
    }
  }, [isOpen, step, debouncedCandidateSearch, clientFilter, ownerFilter, roleFilter]);

  // Auto-fill note when Intern is selected
  useEffect(() => {
    if (candidateType === 'Intern' && hhName && assignedUserId && !saleNote && internalUsers.length > 0) {
      const hhLeadName = internalUsers.find(u => u.id === assignedUserId)?.full_name || '';
      if (hhLeadName) {
        setSaleNote(`Intern: ${hhName} - HH Lead: ${hhLeadName}`);
      }
    }
  }, [candidateType, hhName, assignedUserId, internalUsers, saleNote]);

  const loadProcesses = async () => {
    try {
      setLoading(true);
      
      const result = await getProcesses({
        limit: 100,
        filters: {
          searchTerm: debouncedCandidateSearch || null,
          clientFilter: clientFilter || null,
          ownerIdFilter: ownerFilter || null,
          ownerRoleFilter: roleFilter || null, // Truyền trực tiếp role value
        }
      });
      setProcesses(result.data);
    } catch (error) {
      toast.error('Unable to load process list');
    } finally {
      setLoading(false);
    }
  };

  const filteredProcesses = useMemo(() => {
    // Không cần filter nữa vì đã filter ở API level
    return processes;
  }, [processes]);

  const handleProcessSelect = (processId: string) => {
    setSelectedProcessId(processId);
    const process = processes.find(p => p.id === processId);
    if (process) {
      setSalary(process.estimated_fee || 0);
      
      // RPC trả về process.owner = candidate owner (recruiter)
      // process.candidate?.owner cũng là cùng data (từ getAllProcessesForSale cũ)
      // Hỗ trợ cả 2 cấu trúc để tương thích
      const candidateOwner = process.candidate?.owner || process.owner;
      const ownerRole = candidateOwner?.role;

      // BD: lấy từ client owner nếu có (getAllProcessesForSale), 
      // RPC không trả về client owner nên để trống - user tự chọn
      const clientOwner = process.client?.owner;
      setBdOwnerId(clientOwner?.id || process.client?.owner_id || '');
      setBdName(clientOwner?.full_name || '');
      setBdEmail(clientOwner?.email || '');
      
      // Rec: lấy từ candidate owner
      setHhOwnerId(process.candidate?.owner_id || process.owner_id || '');
      setHhName(candidateOwner?.full_name || '');
      setHhEmail(candidateOwner?.email || '');
      setHhOwnerRole(ownerRole || '');
      
      // Mặc định gán cho BD owner (nếu không phải Freelancer/CTV)
      if (clientOwner?.role !== 'Freelancer' && clientOwner?.role !== 'CTV') {
        setAssignedUserId(clientOwner?.id || '');
      }
      
      // Auto-set candidate type và commission rate dựa trên role
      if (ownerRole === 'CTV' || ownerRole === 'Freelancer') {
        setCandidateType('CTV');
        setCommissionRates(prev => ({ ...prev, ctv: 5 }));
      } else {
        setCandidateType('Nội bộ');
        setCommissionRates(prev => ({ ...prev, headhunter: 80 }));
      }
      
      setGuaranteeDays(process.job?.warranty_period_days || 60);

      // Tự động điền ngày từ quy trình
      if (process.onboarding_date) setStartDate(process.onboarding_date.split('T')[0]);
      if (process.offer_date) setOfferDate(process.offer_date.split('T')[0]);

      setStep(2);
    }
  };

  // Calculations
  const totalFeeNoVat = salary * rate;
  const totalFeeWithVat = contractType === 'Công ty' ? totalFeeNoVat * 1.08 : totalFeeNoVat;

  // Helper function to get status badge styling
  const getStatusBadgeClass = (status: string) => {
    const statusLower = status.toLowerCase();
    
    // Red statuses (rejected)
    if (statusLower.includes('reject')) {
      return 'px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-[11px] font-semibold';
    }
    
    // Green statuses (success/accepted)
    if (statusLower.includes('accepted') || statusLower.includes('passed') || statusLower.includes('onboarding')) {
      return 'px-3 py-1.5 bg-green-50 text-green-600 border border-green-200 rounded-lg text-[11px] font-semibold';
    }
    
    // Blue statuses (in progress)
    if (statusLower.includes('submit') || statusLower.includes('applied') || statusLower.includes('interview')) {
      return 'px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-[11px] font-semibold';
    }
    
    // Default gray
    return 'px-3 py-1.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-[11px] font-semibold';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isView) return;
    
    if (!user) {
      toast.error('You must be logged in to perform this action');
      return;
    }

    if (!offerDate || !startDate) {
      toast.error('Please enter both Offer Date and Start Date');
      return;
    }

    if (!assignedUserId) {
      toast.error('Please select an assignee to handle the debt');
      return;
    }

    const process = processes.find(p => p.id === selectedProcessId);

    setSubmitting(true);
    try {
      const salePayload = {
        process_id: selectedProcessId,
        client_id: process?.client?.id || (Array.isArray(process?.client) ? process?.client[0]?.id : null) || sale?.client_id || null,
        job_id: process?.job?.id || (Array.isArray(process?.job) ? process?.job[0]?.id : null) || sale?.job_id || null,
        candidate_id: process?.candidate?.id || (Array.isArray(process?.candidate) ? process?.candidate[0]?.id : null) || sale?.candidate_id || null,
        job_owner_id: bdOwnerId,
        candidate_owner_id: hhOwnerId,
        handled_by_id: assignedUserId || hhOwnerId, // Người được gán hoặc fallback về HH owner
        offer_date: offerDate || null,
        start_date: startDate || null,
        offered_monthly_salary: salary,
        fee_percent: feePercent,
        rate: rate,
        guarantee_days: guaranteeDays,
        note: saleNote || null, // Add note
        updated_by_id: user.id
      };

      const p1Amt = p1Mode === 'percent'
        ? Math.round(totalFeeWithVat * p1Percent / 100)
        : p1FixedAmount;
      const p2Amt = Math.max(0, Math.round(totalFeeWithVat - p1Amt));

      // Tính due date từ start_date + số ngày
      const calcDueDate = (base: string | null, days: number): string | null => {
        if (!base || days <= 0) return null;
        const d = new Date(base);
        d.setDate(d.getDate() + days);
        return d.toISOString().split('T')[0];
      };
      const p1DueDate = calcDueDate(startDate, p1Days);
      const p2DueDate = calcDueDate(startDate, p2Days);

      const financePayload = {
        contract_type: contractType,
        candidate_type: candidateType,
        p1_days: p1Days,
        p1_amount: p1Amt,
        p1_due_date: p1DueDate,
        p2_days: p2Days,
        p2_amount: p2Amt,
        p2_due_date: p2DueDate,
        rate_bd: commissionRates.bd,
        rate_internal: (candidateType === 'CTV' || candidateType === 'Freelancer') ? 0 : commissionRates.headhunter,
        rate_ctv: ctvCommissionMode === 'percent' ? commissionRates.ctv : 0,
        rate_intern: fixedCommissions.intern,
        rate_freelancer: ctvCommissionMode === 'fixed' ? fixedCommissions.freelancer : 0,
        overall_status: status.overall,
        invoice_status: status.invoice,
        ctv_status: status.ctv,
        updated_at: new Date().toISOString()
      };

      console.log('>>> DEBUG: Sending Sale Payload:', { salePayload, financePayload });

      if (isEdit && sale) {
        await updateSale(sale.id, salePayload);
        await updateSaleFinance(sale.id, {
          ...financePayload,
          ...(status.overall === 'Done' && (sale.finance?.p1_paid_amount ?? 0) === 0 && {
            p1_paid_amount: p1Amt,
            p2_paid_amount: p2Amt,
          })
        });
        toast.success('Debt updated successfully (Mock - F5 to reset)');
      } else {
        await createSaleWithFinance(
          { ...salePayload, created_by_id: user.id },
          { 
            ...financePayload, 
            sales_id: '', 
            p1_paid_amount: status.overall === 'Done' ? p1Amt : 0, 
            p2_paid_amount: status.overall === 'Done' ? p2Amt : 0, 
            refund_amount: 0, 
            is_manual_override: false,
            created_at: new Date().toISOString()
          }
        );
        toast.success('Debt accounted successfully (Mock - F5 to reset)');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.message || 'Error saving data');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 text-gray-700">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className={`px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-brand-600 text-white`}>
          <div className="flex items-center gap-3">
            <Calculator size={22} />
            <div>
              <h3 className="text-xl font-bold">
                {isView ? 'Debt Details' : isEdit ? 'Update Debt' : 'Add New Debt'}
              </h3>
              <p className="text-xs opacity-80">
                {isCreate && step === 1 ? 'Step 1: Select Closed Deal Process' : 'Finance & Commission Configuration'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-md transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isCreate && step === 1 ? (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3 text-blue-900">
                <Info size={20} className="shrink-0 text-blue-600" />
                <div className="text-sm">
                  <p className="font-semibold mb-1">Search Process:</p>
                  <p className="opacity-90">Enter candidate name/email, select customer or recruiter to search for process. Results will load automatically.</p>
                </div>
              </div>

              {/* Search Filters - Sử dụng component có sẵn */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Candidate Search - Text input */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                  <input
                    type="text"
                    placeholder="Candidate Name/Email..."
                    value={candidateSearch}
                    onChange={e => setCandidateSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                
                {/* Client Filter - ClientSelect component */}
                <ClientSelect
                  value={clientFilter}
                  onChange={setClientFilter}
                  placeholder="Select customer..."
                />
                
                {/* Owner Filter - OwnerSelect component */}
                <OwnerSelect
                  value={ownerFilter}
                  onChange={setOwnerFilter}
                  placeholder="Select recruiter..."
                />
                
                {/* Role Filter - Dropdown */}
                <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {ROLE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center p-20 gap-3">
                  <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-gray-500">Searching...</p>
                </div>
              ) : processes.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-gray-500">No matching processes found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProcesses.map(p => {
                    const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
                    return (
                    <button
                      key={p.id}
                      onClick={() => handleProcessSelect(p.id)}
                      className={`group flex flex-col gap-3 p-5 border rounded-lg transition-all text-left ${
                        existingSaleProcessIds.has(p.id)
                          ? 'border-amber-300 bg-amber-50/50 hover:border-amber-400'
                          : 'border-gray-200 hover:border-brand-500 hover:bg-brand-50/30'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                          existingSaleProcessIds.has(p.id)
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-gray-100 text-gray-500 group-hover:bg-brand-100 group-hover:text-brand-600'
                        }`}>
                          <User size={20} />
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          {existingSaleProcessIds.has(p.id) && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 border border-amber-300 rounded text-[10px] font-bold">
                              <AlertTriangle size={10} /> Has Debt
                            </span>
                          )}
                          <span className={getStatusBadgeClass(p.process_status)}>{p.process_status}</span>
                          <p className="text-base font-bold text-gray-900">{(p.estimated_fee || 0).toLocaleString()} <small className="text-[10px] font-normal text-gray-500">VND</small></p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-brand-600 mb-0.5">{p.client?.client_name}</p>
                        <h4 className="text-base font-bold text-gray-900 group-hover:text-brand-600">{p.candidate?.name}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          <p className="text-sm text-gray-500">{p.job?.position_title}</p>
                          {(() => {
                            const ownerRole = p.candidate?.owner?.role || p.owner?.role;
                            if (!ownerRole) return null;
                            return (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                ownerRole === 'CTV' ? 'bg-orange-50 text-orange-600' :
                                ownerRole === 'Freelancer' ? 'bg-purple-50 text-purple-600' :
                                'bg-emerald-50 text-emerald-600'
                              }`}>
                                {ownerRole}
                              </span>
                            );
                          })()}
                          {(p.candidate?.owner?.full_name || p.owner?.full_name) && (
                            <span className="text-[11px] text-gray-500">
                              👤 {p.candidate?.owner?.full_name || p.owner?.full_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 pt-2 border-t border-gray-100 text-[11px] text-gray-400">
                        <span title="Process created date">🕐 Created: <span className="font-medium text-gray-600">{fmtDate(p.created_at)}</span></span>
                        <span className="text-gray-200">|</span>
                        <span title="Last updated">🔄 Updated: <span className="font-medium text-gray-600">{fmtDate(p.updated_at)}</span></span>
                      </div>
                    </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Summary View */}
              {(() => {
                const p1Amount = p1Mode === 'percent'
                  ? Math.round(totalFeeWithVat * p1Percent / 100)
                  : p1FixedAmount;
                const p2Amount = Math.max(0, Math.round(totalFeeWithVat - p1Amount));
                const bdRevenue = totalFeeNoVat * commissionRates.bd / 100;
                const hhRevenue = candidateType === 'CTV' || candidateType === 'Freelancer'
                  ? ctvCommissionMode === 'percent'
                    ? totalFeeNoVat * commissionRates.ctv / 100
                    : fixedCommissions.freelancer
                  : totalFeeNoVat * commissionRates.headhunter / 100;
                const guaranteeEndDate = startDate && guaranteeDays > 0 ? (() => {
                  const d = new Date(startDate);
                  d.setDate(d.getDate() + guaranteeDays);
                  return d.toLocaleDateString('vi-VN');
                })() : null;

                return (
                  <div className="space-y-4">
                    {/* Row 1: Main stats */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 grid grid-cols-2 lg:grid-cols-4 gap-6 shadow-sm">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Revenue (Base)</span>
                        <p className="text-xl font-bold text-slate-900">{formatMoney(totalFeeNoVat)} <span className="text-xs font-normal text-slate-400">VND</span></p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-brand-600 uppercase font-black tracking-wider">Customer pays {contractType === 'Công ty' ? '(+8% VAT)' : '(Individual)'}</span>
                        <p className="text-2xl font-black text-brand-600">{formatMoney(Math.round(totalFeeWithVat))} <span className="text-sm font-normal text-brand-400">VND</span></p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Guarantee</span>
                        <p className="text-lg font-bold text-slate-800">{guaranteeDays} Days</p>
                        {guaranteeEndDate && <p className="text-[10px] text-orange-500 font-medium">Expires: {guaranteeEndDate}</p>}
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Assignee</span>
                        <div className="flex flex-col gap-0.5 text-sm font-semibold text-slate-800">
                          <span title={bdEmail ? `BD Email: ${bdEmail}` : undefined} className="cursor-help">
                            <span className="text-[10px] font-black text-slate-400 uppercase mr-1">BD</span>
                            {bdName || '—'}
                          </span>
                          <span title={hhEmail ? `Rec Email: ${hhEmail}` : undefined} className="cursor-help">
                            <span className="text-[10px] font-black text-slate-400 uppercase mr-1">Rec</span>
                            {hhName || '—'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Breakdown */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* P1 */}
                      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                        <span className="text-[10px] text-blue-500 uppercase font-bold tracking-wider">Phase 1 ({p1Days} days)</span>
                        <p className="text-sm font-bold text-blue-800">{formatMoney(Math.round(p1Amount))} VND</p>
                        {startDate && p1Days > 0 && (
                          <p className="text-[10px] text-blue-400 mt-0.5">Due: {(() => { const d = new Date(startDate); d.setDate(d.getDate() + p1Days); return d.toLocaleDateString('vi-VN'); })()}</p>
                        )}
                      </div>
                      {/* P2 */}
                      <div className="bg-purple-50 border border-purple-100 rounded-lg px-4 py-3">
                        <span className="text-[10px] text-purple-500 uppercase font-bold tracking-wider">Phase 2 ({p2Days} days)</span>
                        <p className="text-sm font-bold text-purple-800">{p2Days > 0 ? `${formatMoney(Math.round(p2Amount))} VND` : 'None'}</p>
                        {startDate && p2Days > 0 && (
                          <p className="text-[10px] text-purple-400 mt-0.5">Due: {(() => { const d = new Date(startDate); d.setDate(d.getDate() + p2Days); return d.toLocaleDateString('vi-VN'); })()}</p>
                        )}
                      </div>
                      {/* BD Revenue */}
                      <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-3">
                        <span className="text-[10px] text-green-500 uppercase font-bold tracking-wider">BD ({commissionRates.bd}%)</span>
                        <p className="text-sm font-bold text-green-800">{formatMoney(Math.round(bdRevenue))} VND</p>
                        <p className="text-[10px] text-green-400 mt-0.5">{bdName || '...'}</p>
                      </div>
                      {/* HH / CTV Revenue */}
                      <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
                        <span className="text-[10px] text-amber-500 uppercase font-bold tracking-wider">
                          {candidateType === 'CTV' || candidateType === 'Freelancer'
                            ? ctvCommissionMode === 'percent'
                              ? `CTV/Freelancer (${commissionRates.ctv}%)`
                              : `CTV/Freelancer (fixed)`
                            : `HH (${commissionRates.headhunter}%)`}
                        </span>
                        <p className="text-sm font-bold text-amber-800">{formatMoney(Math.round(hhRevenue))} VND</p>
                        <p className="text-[10px] text-amber-400 mt-0.5">{hhName || '...'}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Form Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Column 1: Deal Details */}
                <div className="space-y-6">
                  <h5 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Deal Information</h5>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Offer Date <span className="text-red-500">*</span>
                            </label>
                            <input 
                                type="date" 
                                value={offerDate} 
                                onChange={e => setOfferDate(e.target.value)} 
                                required
                                disabled={isView}
                                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-brand-500 outline-none text-sm disabled:bg-gray-50 focus:border-brand-500" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Start Date <span className="text-red-500">*</span>
                            </label>
                            <input 
                                type="date" 
                                value={startDate} 
                                onChange={e => setStartDate(e.target.value)} 
                                required
                                disabled={isView}
                                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-brand-500 outline-none text-sm disabled:bg-gray-50 focus:border-brand-500" 
                            />
                        </div>
                    </div>
                    <MoneyInput 
                      label="Actual Salary (Onboard)"
                      value={salary}
                      onChange={setSalary}
                      disabled={isView}
                      className="font-semibold py-2.5"
                    />
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Rate Multiplier </label>
                        <input 
                            type="number" 
                            step="0.1" 
                            value={rate} 
                            onChange={e => setRate(Number(e.target.value))} 
                            disabled={isView}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm disabled:bg-gray-50 font-semibold" 
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Contract Type</label>
                            <select 
                                value={contractType} 
                                onChange={e => setContractType(e.target.value as ContractType)} 
                                disabled={isView}
                                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none disabled:bg-gray-50"
                            >
                                <option value="Công ty">Company (VAT)</option>
                                <option value="Cá nhân">Individual</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Candidate Type</label>
                            <select 
                                value={candidateType} 
                                onChange={e => setCandidateType(e.target.value as CandidateType)} 
                                disabled={isView}
                                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none disabled:bg-gray-50"
                            >
                              {/* Nếu owner là CTV/Freelancer → chỉ cho chọn CTV */}
                              {(hhOwnerRole === 'CTV' || hhOwnerRole === 'Freelancer') ? (
                                <option value="CTV">CTV / Freelancer</option>
                              ) : (
                                <>
                                  <option value="Nội bộ">Internal (HH)</option>
                                  <option value="Intern">Internal (Intern)</option>
                                </>
                              )}
                            </select>
                        </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Commissions */}
                <div className="space-y-6">
                  <h5 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Commission & Allocation</h5>
                  <div className="space-y-4">
                    {/* Gán BD */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Assign BD</label>
                      <div className="relative" ref={assigneeRef}>
                        <button
                          type="button"
                          onClick={() => { setAssigneeDropdownOpen(v => !v); setAssigneeSearch(''); }}
                          disabled={isView}
                          className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg text-sm text-left hover:border-brand-400 transition-colors disabled:bg-gray-50 disabled:cursor-default"
                        >
                          <span className={assignedUserId ? 'text-gray-800 font-medium' : 'text-gray-400'}>
                            {assignedUserId
                              ? internalUsers.find(u => u.id === assignedUserId)?.full_name || '...'
                              : `${bdName || 'Select handler...'}`}
                          </span>
                          {!isView && <ChevronDown size={14} className={`text-gray-400 transition-transform shrink-0 ${assigneeDropdownOpen ? 'rotate-180' : ''}`} />}
                        </button>
                        {assigneeDropdownOpen && (
                          <div className="absolute z-[9999] top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                            <div className="p-2 border-b border-gray-100">
                              <input
                                autoFocus
                                type="text"
                                value={assigneeSearch}
                                onChange={e => setAssigneeSearch(e.target.value)}
                                placeholder="Search person..."
                                className="w-full px-2 py-1 text-xs border border-gray-200 rounded outline-none focus:ring-1 focus:ring-brand-400"
                              />
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                              {internalUsers
                                .filter(u => u.full_name.toLowerCase().includes(assigneeSearch.toLowerCase()))
                                .map(u => (
                                  <button
                                    key={u.id}
                                    type="button"
                                    onClick={() => { 
                                      setAssignedUserId(u.id); 
                                      setBdOwnerId(u.id);
                                      setBdName(u.full_name);
                                      setBdEmail(u.email);
                                      setAssigneeDropdownOpen(false); 
                                      setAssigneeSearch(''); 
                                    }}
                                    className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-50 transition-colors ${u.id === assignedUserId ? 'bg-brand-50 text-brand-600 font-semibold' : 'text-gray-700'}`}
                                  >
                                    <p className="font-medium">{u.full_name}</p>
                                    <p className="text-gray-400 text-[10px]">{u.email}</p>
                                  </button>
                                ))
                              }
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Gán Headhunt */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Assign Headhunter</label>
                      <div className="relative" ref={hhAssigneeRef}>
                        <button
                          type="button"
                          onClick={() => { setHhAssigneeDropdownOpen(v => !v); setHhAssigneeSearch(''); }}
                          disabled={isView}
                          className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg text-sm text-left hover:border-brand-400 transition-colors disabled:bg-gray-50 disabled:cursor-default"
                        >
                          <span className={hhOwnerId ? 'text-gray-800 font-medium' : 'text-gray-400'}>
                            {hhOwnerId
                              ? internalUsers.find(u => u.id === hhOwnerId)?.full_name || hhName || '...'
                              : `${hhName || 'Select headhunter...'}`}
                          </span>
                          {!isView && <ChevronDown size={14} className={`text-gray-400 transition-transform shrink-0 ${hhAssigneeDropdownOpen ? 'rotate-180' : ''}`} />}
                        </button>
                        {hhAssigneeDropdownOpen && (
                          <div className="absolute z-[9999] top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                            <div className="p-2 border-b border-gray-100">
                              <input
                                autoFocus
                                type="text"
                                value={hhAssigneeSearch}
                                onChange={e => setHhAssigneeSearch(e.target.value)}
                                placeholder="Tìm người..."
                                className="w-full px-2 py-1 text-xs border border-gray-200 rounded outline-none focus:ring-1 focus:ring-brand-400"
                              />
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                              {internalUsers
                                .filter(u => u.full_name.toLowerCase().includes(hhAssigneeSearch.toLowerCase()))
                                .map(u => (
                                  <button
                                    key={u.id}
                                    type="button"
                                    onClick={() => { 
                                      setHhOwnerId(u.id);
                                      setHhName(u.full_name);
                                      setHhEmail(u.email);
                                      setHhOwnerRole((u as any).role || '');
                                      setHhAssigneeDropdownOpen(false); 
                                      setHhAssigneeSearch(''); 
                                    }}
                                    className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-50 transition-colors ${u.id === hhOwnerId ? 'bg-brand-50 text-brand-600 font-semibold' : 'text-gray-700'}`}
                                  >
                                    <p className="font-medium">{u.full_name}</p>
                                    <p className="text-gray-400 text-[10px]">{u.email}</p>
                                  </button>
                                ))
                              }
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* BD luôn hiện */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">BD (%)</label>
                      <input
                        type="number"
                        value={commissionRates.bd}
                        onChange={e => setCommissionRates({...commissionRates, bd: Number(e.target.value)})}
                        disabled={isView}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm font-medium disabled:bg-gray-50"
                      />
                    </div>

                    {/* HH — chỉ hiện khi Nội bộ */}
                    {(candidateType === 'Nội bộ') && (
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">HH (%)</label>
                        <input
                          type="number"
                          value={commissionRates.headhunter}
                          onChange={e => setCommissionRates({...commissionRates, headhunter: Number(e.target.value)})}
                          disabled={isView}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm font-medium disabled:bg-gray-50"
                        />
                      </div>
                    )}

                    {/* Intern — chỉ hiện khi Intern */}
                    {candidateType === 'Intern' && (
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Intern (Fixed VND)</label>
                        <input
                          type="text"
                          value={formatMoney(fixedCommissions.intern)}
                          onChange={e => {
                            const val = Number(e.target.value.replace(/\D/g, ''));
                            setFixedCommissions({...fixedCommissions, intern: val});
                          }}
                          onFocus={e => e.target.select()}
                          disabled={isView}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm font-medium disabled:bg-gray-50"
                          placeholder="0 VNĐ"
                        />
                      </div>
                    )}

                    {/* CTV/Freelancer — toggle % hoặc VNĐ */}
                    {(candidateType === 'CTV' || candidateType === 'Freelancer') && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">CTV/Freelancer</label>
                          <div className="flex rounded overflow-hidden border border-gray-200 text-[10px]">
                            <button
                              type="button"
                              onClick={() => setCtvCommissionMode('percent')}
                              className={`px-2 py-0.5 font-semibold transition-colors ${ctvCommissionMode === 'percent' ? 'bg-brand-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                            >%</button>
                            <button
                              type="button"
                              onClick={() => setCtvCommissionMode('fixed')}
                              className={`px-2 py-0.5 font-semibold transition-colors ${ctvCommissionMode === 'fixed' ? 'bg-brand-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                            >VND</button>
                          </div>
                        </div>
                        {ctvCommissionMode === 'percent' ? (
                          <input
                            type="number"
                            value={commissionRates.ctv}
                            onChange={e => setCommissionRates({...commissionRates, ctv: Number(e.target.value)})}
                            disabled={isView}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm font-medium disabled:bg-gray-50"
                          />
                        ) : (
                          <input
                            type="text"
                            value={formatMoney(fixedCommissions.freelancer)}
                            onChange={e => {
                              const val = Number(e.target.value.replace(/\D/g, ''));
                              setFixedCommissions({...fixedCommissions, freelancer: val});
                            }}
                            onFocus={e => e.target.select()}
                            disabled={isView}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm font-medium disabled:bg-gray-50"
                            placeholder="0 VNĐ"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 3: Terms & Status */}
                <div className="space-y-6">
                  <h5 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Terms & Status</h5>
                  <div className="space-y-4">
                    {/* Phân bổ đợt 1 */}
                    <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-blue-700 uppercase tracking-wide">Phase 1 — Expected</label>
                        <div className="flex rounded overflow-hidden border border-blue-200 text-[10px]">
                          <button type="button" onClick={() => setP1Mode('percent')}
                            className={`px-2 py-0.5 font-bold transition-colors ${p1Mode === 'percent' ? 'bg-blue-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                            %
                          </button>
                          <button type="button" onClick={() => setP1Mode('fixed')}
                            className={`px-2 py-0.5 font-bold transition-colors ${p1Mode === 'fixed' ? 'bg-blue-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                            VNĐ
                          </button>
                        </div>
                      </div>
                      {p1Mode === 'percent' ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number" min={0} max={100} step={5}
                            value={p1Percent}
                            onChange={e => setP1Percent(Number(e.target.value))}
                            disabled={isView}
                            className="w-20 px-2 py-1.5 border border-blue-200 rounded text-sm font-bold text-blue-800 bg-white outline-none focus:ring-1 focus:ring-blue-400"
                          />
                          <span className="text-xs text-blue-600 font-semibold">%</span>
                          <span className="text-xs text-blue-500 ml-auto">
                            ≈ {formatMoney(Math.round(totalFeeWithVat * p1Percent / 100))} VND
                          </span>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={formatMoney(p1FixedAmount)}
                          onChange={e => setP1FixedAmount(Number(e.target.value.replace(/\D/g, '')))}
                          onFocus={e => e.target.select()}
                          disabled={isView}
                          className="w-full px-2 py-1.5 border border-blue-200 rounded text-sm font-bold text-blue-800 bg-white outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      )}
                    </div>

                    {/* Đợt 2 — tự tính */}
                    <div className="bg-purple-50/50 border border-purple-100 rounded-lg p-3 space-y-1">
                      <label className="text-xs font-bold text-purple-700 uppercase tracking-wide">Phase 2 — Remaining</label>
                      <p className="text-sm font-bold text-purple-800">
                        {formatMoney(Math.max(0, Math.round(totalFeeWithVat - (p1Mode === 'percent' ? totalFeeWithVat * p1Percent / 100 : p1FixedAmount))))} VND
                      </p>
                      <p className="text-[10px] text-purple-400">Auto = Total VAT − Phase 1</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Phase 1 Term (Days)</label>
                            <input 
                                type="number" 
                                value={p1Days} 
                                onChange={e => setP1Days(Number(e.target.value))} 
                                disabled={isView}
                                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm disabled:bg-gray-50" 
                            />
                            {startDate && p1Days > 0 && (
                              <p className="mt-1 text-[10px] text-brand-600 font-medium italic">
                                Expected: {(() => {
                                  const d = new Date(startDate);
                                  d.setDate(d.getDate() + p1Days);
                                  return d.toLocaleDateString('vi-VN');
                                })()}
                              </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Phase 2 Term (Days)</label>
                            <input 
                                type="number" 
                                value={p2Days} 
                                onChange={e => setP2Days(Number(e.target.value))} 
                                disabled={isView}
                                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm disabled:bg-gray-50" 
                            />
                            {startDate && p2Days > 0 && (
                              <p className="mt-1 text-[10px] text-blue-600 font-medium italic">
                                Expected: {(() => {
                                  const d = new Date(startDate);
                                  d.setDate(d.getDate() + p2Days);
                                  return d.toLocaleDateString('vi-VN');
                                })()}
                              </p>
                            )}
                        </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Status & Guarantee Row - 3 fields in 1 row */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Trạng thái tổng */}
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Overall Status</label>
                    <select 
                        value={status.overall} 
                        onChange={e => setStatus({...status, overall: e.target.value as OverallAccountingStatus})} 
                        disabled={isView}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 font-semibold"
                    >
                        <option value="Doing">Doing</option>
                        <option value="Done">Done</option>
                        <option value="Reject">Reject</option>
                    </select>
                </div>

                {/* Trạng thái hóa đơn */}
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Invoice Status</label>
                    <select 
                        value={status.invoice} 
                        onChange={e => setStatus({...status, invoice: e.target.value as InvoiceStatus})} 
                        disabled={isView}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 font-semibold"
                    >
                        <option value="Not Issued">Not Issued</option>
                        <option value="Issued">Issued</option>
                    </select>
                </div>

                {/* Số ngày bảo hành */}
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Guarantee Days</label>
                    <input 
                        type="number" 
                        value={guaranteeDays} 
                        onChange={e => setGuaranteeDays(Number(e.target.value))} 
                        disabled={isView}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold bg-gray-50 disabled:opacity-70" 
                    />
                    {startDate && guaranteeDays > 0 && (
                      <p className="mt-1 text-[10px] text-orange-500 font-medium italic">
                        Expires: {(() => {
                          const d = new Date(startDate);
                          d.setDate(d.getDate() + guaranteeDays);
                          return d.toLocaleDateString('vi-VN');
                        })()}
                      </p>
                    )}
                </div>
              </div>

              {/* Note Section - 2 columns grid with TT CTV */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Ghi chú - spans 2 columns or 3 columns if not CTV/Freelancer */}
                <div className={candidateType === 'CTV' || candidateType === 'Freelancer' ? 'lg:col-span-2' : 'lg:col-span-3'}>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Notes</label>
                  <textarea
                      value={saleNote}
                      onChange={e => setSaleNote(e.target.value)}
                      disabled={isView}
                      placeholder={
                        candidateType === 'Intern' && hhName && assignedUserId
                          ? `Intern: ${hhName} - HH Lead: ${internalUsers.find(u => u.id === assignedUserId)?.full_name || '...'}`
                          : 'Flexible notes: Intern/HH Lead, special info, payment terms, etc.'
                      }
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 resize-none focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                  <p className="mt-1 text-[10px] text-gray-400 italic">
                    {candidateType === 'Intern' 
                      ? '💡 Tip: Placeholder auto-fills Intern and HH Lead info' 
                      : 'Notes will help tracking special info of this debt'}
                  </p>
                </div>

                {/* TT CTV - column 3 - Only show for CTV/Freelancer */}
                {(candidateType === 'CTV' || candidateType === 'Freelancer') && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">CTV Status</label>
                    <select 
                        value={status.ctv} 
                        onChange={e => setStatus({...status, ctv: e.target.value as CTVPaymentStatus})} 
                        disabled={isView}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 font-semibold"
                    >
                        <option value="Pending">Pending</option>
                        <option value="Doing">Doing</option>
                        <option value="Done">Done</option>
                        <option value="Reject">Reject</option>
                    </select>
                    <p className="mt-1 text-[10px] text-gray-400 italic">CTV/Freelancer payment status</p>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
            {isCreate && step === 2 && (
              <button onClick={() => setStep(1)} className="text-sm font-medium text-gray-500 hover:text-gray-700">
                &larr; Back to select Deal
              </button>
            )}
            <div className="ml-auto flex gap-4">
              <button onClick={onClose} className="px-6 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-all">Close</button>
              {!isView && (step === 2 || isEdit) && (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-8 py-2 flex items-center gap-2 text-white rounded-md transition-all font-semibold text-sm shadow-sm disabled:opacity-50 bg-brand-600 hover:bg-brand-700"
                >
                  {submitting ? 'Saving...' : isEdit ? <><Save size={16} /> Update Debt</> : 'Create Debt'}
                </button>
              )}
            </div>
        </div>
      </div>
    </div>
  );
}
