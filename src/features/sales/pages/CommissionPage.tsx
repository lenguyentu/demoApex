import { useState, useEffect, useMemo } from 'react';
import { Search, Download, Eye, X, Loader2, TrendingUp, Briefcase, Users, Save } from 'lucide-react';
import { getSales, getCommissionSettings, upsertCommissionSetting, getKPITargetSnapshots, getCurrentEmployeeSalaryHistory } from '../api';
import type { Sale, CommissionSetting, KPITargetSnapshot, EmployeeSalaryHistory } from '../types';
import toast from 'react-hot-toast';
import { exportToExcel } from '../utils/exportUtils';
import { MoneyInput } from '../components/MoneyInput';

const MONTHS_SHORT = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];
const QUARTERS = ['Q1','Q2','Q3','Q4'];
const WORK_DAYS_STANDARD = 22;
const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n));

interface CaseItem {
  saleId: string;
  client: string;
  candidate: string;
  position: string;
  share: number;
}

interface PersonRow {
  key: string;
  userId: string;
  name: string;
  role: 'BD' | 'Headhunter';
  totalRevenue: number;
  cases: CaseItem[];
  kpi: number;
  baseSalary: number;
  commissionRate: number;
  hotBonusPerCase: number;
}

export default function CommissionPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [snapshots, setSnapshots] = useState<KPITargetSnapshot[]>([]);
  const [salaryHistory, setSalaryHistory] = useState<EmployeeSalaryHistory[]>([]);
  const [commissionSettings, setCommissionSettings] = useState<CommissionSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const [periodType, setPeriodType] = useState<'month' | 'quarter'>('month');
  const [selectedQuarter, setSelectedQuarter] = useState(() => Math.floor(new Date().getMonth() / 3));
  const [searchTerm, setSearchTerm] = useState('');

  // Detail modal state
  const [detailPerson, setDetailPerson] = useState<PersonRow | null>(null);
  const [modalWorkDays, setModalWorkDays] = useState(WORK_DAYS_STANDARD);
  const [modalRate, setModalRate] = useState(0);
  const [modalCaseHotBonus, setModalCaseHotBonus] = useState<Record<string, number>>({});
  const [modalDefaultHotBonus, setModalDefaultHotBonus] = useState(0);
  const [savingModal, setSavingModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadSnapshots();
  }, [selectedYear, periodType]);

  const loadSnapshots = async () => {
    try {
      const snapshotData = await getKPITargetSnapshots(selectedYear, periodType);
      setSnapshots(snapshotData);
    } catch {
      // silently fail — snapshots may not exist for all years
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [salesData, settingsData, snapshotData, salaryData] = await Promise.all([
        getSales(),
        getCommissionSettings(),
        getKPITargetSnapshots(selectedYear, periodType),
        getCurrentEmployeeSalaryHistory(),
      ]);
      setSales(salesData);
      setCommissionSettings(settingsData);
      setSnapshots(snapshotData);
      setSalaryHistory(salaryData);
    } catch {
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // Build period start date for snapshot lookup
  const periodStart = useMemo(() => {
    if (periodType === 'quarter') {
      const m = String(selectedQuarter * 3 + 1).padStart(2, '0');
      return `${selectedYear}-${m}-01`;
    }
    const m = String(selectedMonth + 1).padStart(2, '0');
    return `${selectedYear}-${m}-01`;
  }, [selectedYear, selectedMonth, selectedQuarter, periodType]);

  const commissionData = useMemo((): PersonRow[] => {
    const personMap = new Map<string, PersonRow>();

    sales.forEach(sale => {
      if (!sale.start_date) return;
      const d = new Date(sale.start_date);
      if (d.getFullYear() !== selectedYear) return;

      if (periodType === 'month') {
        if (d.getMonth() !== selectedMonth) return;
      } else {
        if (Math.floor(d.getMonth() / 3) !== selectedQuarter) return;
      }

      const noVat = (sale.offered_monthly_salary || 0) * (sale.rate || 1);
      const baseAmount = sale.finance?.contract_type === 'Công ty' ? noVat * 1.08 : noVat;

      const addPerson = (
        key: string,
        userId: string,
        name: string,
        role: 'BD' | 'Headhunter',
        share: number,
      ) => {
        const roleKey = role === 'BD' ? 'BD' : 'Headhunter';
        const setting = commissionSettings.find(s => s.user_id === userId && s.role_key === roleKey);
        const salary = salaryHistory.find(s => s.user_id === userId);
        // Find snapshot for this user + month
        const snap = snapshots.find(
          s => s.user_id === userId && s.period_start === periodStart && s.period_type === periodType
        );

        const caseItem: CaseItem = {
          saleId: sale.id,
          client: sale.client?.client_name || 'N/A',
          candidate: sale.candidate?.name || 'N/A',
          position: sale.job?.position_title || 'N/A',
          share,
        };

        if (personMap.has(key)) {
          const p = personMap.get(key)!;
          p.totalRevenue += share;
          p.cases.push(caseItem);
        } else {
          personMap.set(key, {
            key,
            userId,
            name,
            role,
            totalRevenue: share,
            cases: [caseItem],
            kpi: snap?.target_amount ?? 0,
            baseSalary: salary?.base_salary ?? 0,
            commissionRate: setting?.commission_rate ?? 0,
            hotBonusPerCase: setting?.hot_bonus_per_case ?? 0,
          });
        }
      };

      if (sale.job_owner_id && sale.job_owner?.full_name) {
        const share = baseAmount * (sale.finance?.rate_bd || 0) / 100;
        addPerson(`bd-${sale.job_owner_id}`, sale.job_owner_id, sale.job_owner.full_name, 'BD', share);
      }
      if (sale.candidate_owner_id && sale.candidate_owner?.full_name) {
        const share = baseAmount * (sale.finance?.rate_internal || 0) / 100;
        addPerson(`hh-${sale.candidate_owner_id}`, sale.candidate_owner_id, sale.candidate_owner.full_name, 'Headhunter', share);
      }
    });

    let result = Array.from(personMap.values());
    if (searchTerm.trim()) {
      const t = searchTerm.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(t));
    }
    return result.sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [sales, selectedYear, selectedMonth, selectedQuarter, periodType, commissionSettings, salaryHistory, snapshots, periodStart, searchTerm]);

  const openDetail = (person: PersonRow) => {
    setDetailPerson(person);
    setModalWorkDays(WORK_DAYS_STANDARD);
    setModalRate(person.commissionRate);
    setModalDefaultHotBonus(person.hotBonusPerCase);
    const bonusMap: Record<string, number> = {};
    person.cases.forEach(c => { bonusMap[c.saleId] = person.hotBonusPerCase; });
    setModalCaseHotBonus(bonusMap);
  };

  const closeDetail = () => setDetailPerson(null);

  const saveModal = async () => {
    if (!detailPerson) return;
    setSavingModal(true);
    try {
      await upsertCommissionSetting({
        user_id: detailPerson.userId,
        role_key: detailPerson.role === 'BD' ? 'BD' : 'Headhunter',
        kpi_amount: 0,
        commission_rate: modalRate,
        hot_bonus_per_case: modalDefaultHotBonus,
      });
      // Update local settings cache
      setCommissionSettings(prev => {
        const filtered = prev.filter(
          s => !(s.user_id === detailPerson.userId && s.role_key === detailPerson.role)
        );
        return [
          ...filtered,
          {
            id: '',
            user_id: detailPerson.userId,
            role_key: detailPerson.role,
            kpi_amount: 0,
            commission_rate: modalRate,
            hot_bonus_per_case: modalDefaultHotBonus,
            created_at: '',
            updated_at: '',
          } as CommissionSetting,
        ];
      });
      toast.success('Đã lưu cấu hình hoa hồng');
      closeDetail();
    } catch {
      toast.error('Không thể lưu cấu hình');
    } finally {
      setSavingModal(false);
    }
  };

  const periodLabel = periodType === 'quarter'
    ? `${QUARTERS[selectedQuarter]}/${selectedYear}`
    : `${MONTHS_SHORT[selectedMonth]}/${selectedYear}`;

  const handleExportExcel = () => {
    const rows: Record<string, unknown>[] = [];
    commissionData.forEach((p, idx) => {
      const overKpi = Math.max(p.totalRevenue - p.kpi, 0);
      const bonusCN = overKpi * p.commissionRate / 100;
      const totalHot = p.cases.reduce((sum, c) => sum + (modalCaseHotBonus[c.saleId] ?? p.hotBonusPerCase), 0);
      const estimatedSalary = p.baseSalary / WORK_DAYS_STANDARD * WORK_DAYS_STANDARD;
      const total = estimatedSalary + bonusCN + totalHot;
      rows.push({
        stt: idx + 1,
        name: p.name,
        role: p.role,
        kpi: p.kpi,
        revenue: p.totalRevenue,
        kpi_pct: p.kpi > 0 ? `${((p.totalRevenue / p.kpi) * 100).toFixed(0)}%` : '—',
        bonus_cn: bonusCN,
        bonus_hot: totalHot,
        total,
      });
    });
    exportToExcel(rows, [
      { key: 'stt', label: '#' },
      { key: 'name', label: 'Nhân sự' },
      { key: 'role', label: 'Vai trò' },
      { key: 'kpi', label: 'KPI tháng' },
      { key: 'revenue', label: 'Doanh số' },
      { key: 'kpi_pct', label: '% KPI' },
      { key: 'bonus_cn', label: 'Thưởng CN' },
      { key: 'bonus_hot', label: 'Thưởng nóng' },
      { key: 'total', label: 'Tổng nhận' },
    ], `HoaHong_${periodLabel.replace('/', '_')}`);
  };

  // Modal calculations
  const modalCalc = useMemo(() => {
    if (!detailPerson) return null;
    const estimatedSalary = detailPerson.baseSalary / WORK_DAYS_STANDARD * modalWorkDays;
    const overKpi = Math.max(detailPerson.totalRevenue - detailPerson.kpi, 0);
    const bonusCN = overKpi * modalRate / 100;
    const totalHot = detailPerson.cases.reduce(
      (sum, c) => sum + (modalCaseHotBonus[c.saleId] ?? modalDefaultHotBonus),
      0
    );
    const total = estimatedSalary + bonusCN + totalHot;
    return { estimatedSalary, overKpi, bonusCN, totalHot, total };
  }, [detailPerson, modalWorkDays, modalRate, modalCaseHotBonus, modalDefaultHotBonus]);

  if (loading) return (
    <div className="p-20 flex flex-col items-center gap-4">
      <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      <p className="text-sm text-gray-500">Đang tải dữ liệu hoa hồng...</p>
    </div>
  );

  return (
    <div className="p-6 space-y-5 text-gray-700">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Phiếu hoa hồng nhân sự</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Tổng nhận = Lương ước tính + Thưởng CN + Thưởng nóng
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Year */}
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium bg-white outline-none focus:ring-2 focus:ring-brand-500"
          >
            {[2024, 2025, 2026, 2027, 2028].map(y => (
              <option key={y} value={y}>Năm {y}</option>
            ))}
          </select>
          {/* Period type toggle */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200 text-xs font-bold">
            <button
              onClick={() => setPeriodType('month')}
              className={`px-3 py-2 transition-colors ${periodType === 'month' ? 'bg-brand-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            >Tháng</button>
            <button
              onClick={() => setPeriodType('quarter')}
              className={`px-3 py-2 transition-colors ${periodType === 'quarter' ? 'bg-brand-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            >Quý</button>
          </div>
          {/* Month / Quarter pills */}
          <div className="flex items-center gap-0.5 bg-white px-2 py-1.5 border border-gray-200 rounded-lg">
            {periodType === 'month'
              ? MONTHS_SHORT.map((m, i) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMonth(i)}
                    className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${
                      selectedMonth === i
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {m}
                  </button>
                ))
              : QUARTERS.map((q, i) => (
                  <button
                    key={q}
                    onClick={() => setSelectedQuarter(i)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                      selectedQuarter === i
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {q}
                  </button>
                ))
            }
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Tìm nhân sự..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500 w-40"
            />
          </div>
          {/* Export */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium bg-white hover:bg-gray-50 transition-colors"
          >
            <Download size={14} /> Excel
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nhân sự</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">KPI {periodType === 'quarter' ? 'quý' : 'tháng'}</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Doanh số</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">% KPI</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Thưởng CN</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Thưởng nóng</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng nhận</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {commissionData.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-16 text-center text-gray-400 text-sm">
                  Không có dữ liệu cho {periodLabel}
                </td>
              </tr>
            ) : commissionData.map((person, idx) => {
              const overKpi = Math.max(person.totalRevenue - person.kpi, 0);
              const bonusCN = overKpi * person.commissionRate / 100;
              const totalHot = person.cases.reduce((sum, _c) => sum + person.hotBonusPerCase, 0);
              const estimatedSalary = person.baseSalary / WORK_DAYS_STANDARD * WORK_DAYS_STANDARD;
              const total = estimatedSalary + bonusCN + totalHot;
              const kpiPct = person.kpi > 0 ? (person.totalRevenue / person.kpi) * 100 : 0;

              return (
                <tr key={person.key} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3.5 text-gray-400 text-xs font-medium">{idx + 1}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-brand-700">
                          {person.name.split(' ').pop()?.charAt(0) ?? '?'}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{person.name}</div>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold mt-0.5 ${
                          person.role === 'BD'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-purple-50 text-purple-600'
                        }`}>
                          {person.role === 'BD' ? <Briefcase size={9} /> : <Users size={9} />}
                          {person.role}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right text-gray-600 tabular-nums">
                    {person.kpi > 0 ? `${fmt(person.kpi)} đ` : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-gray-900 tabular-nums">
                    {fmt(person.totalRevenue)} đ
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums">
                    {person.kpi > 0 ? (
                      <span className={`font-bold ${
                        kpiPct >= 100 ? 'text-green-600' : kpiPct >= 70 ? 'text-orange-500' : 'text-red-500'
                      }`}>
                        {kpiPct.toFixed(0)}%
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right text-green-600 font-semibold tabular-nums">
                    {bonusCN > 0 ? `${fmt(bonusCN)} đ` : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-right text-orange-500 font-semibold tabular-nums">
                    {totalHot > 0 ? `${fmt(totalHot)} đ` : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-gray-900 tabular-nums">
                    {fmt(total)} đ
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <button
                      onClick={() => openDetail(person)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      title="Xem chi tiết"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Detail Modal ── */}
      {detailPerson && modalCalc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal header */}
            <div className="px-6 py-4 bg-brand-600 text-white flex items-start justify-between shrink-0">
              <div>
                <div className="font-bold text-lg">{detailPerson.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    detailPerson.role === 'BD'
                      ? 'bg-emerald-500/20 text-emerald-100'
                      : 'bg-purple-500/20 text-purple-100'
                  }`}>
                    {detailPerson.role === 'BD' ? <Briefcase size={9} /> : <Users size={9} />}
                    {detailPerson.role}
                  </span>
                  <span className="text-white/60 text-xs">Kỳ: {periodLabel}</span>
                </div>
              </div>
              <button onClick={closeDetail} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Modal body — scrollable */}
            <div className="overflow-y-auto flex-1 p-6 space-y-5">

              {/* Section 1: Lương ước tính */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lương ước tính</span>
                </div>
                <div className="p-4 flex items-center gap-6">
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">Lương cơ bản</div>
                    <div className="font-semibold text-gray-900">{fmt(detailPerson.baseSalary)} đ</div>
                  </div>
                  <div className="text-gray-300 text-lg">÷</div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">Ngày công chuẩn</div>
                    <div className="font-semibold text-gray-900">{WORK_DAYS_STANDARD} ngày</div>
                  </div>
                  <div className="text-gray-300 text-lg">×</div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">Ngày công thực tế</label>
                    <input
                      type="number"
                      min={0}
                      max={31}
                      value={modalWorkDays}
                      onChange={e => setModalWorkDays(Number(e.target.value))}
                      onFocus={e => e.target.select()}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div className="text-gray-300 text-lg">=</div>
                  <div className="flex-1 text-right">
                    <div className="text-xs text-gray-500 mb-1">Lương ước tính</div>
                    <div className="font-bold text-brand-600">{fmt(modalCalc.estimatedSalary)} đ</div>
                  </div>
                </div>
              </div>

              {/* Section 2: Case list */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Danh sách case ({detailPerson.cases.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Thưởng nóng mặc định:</span>
                    <div className="w-36">
                      <MoneyInput
                        value={modalDefaultHotBonus}
                        onChange={v => {
                          setModalDefaultHotBonus(v);
                          const updated: Record<string, number> = {};
                          detailPerson.cases.forEach(c => { updated[c.saleId] = v; });
                          setModalCaseHotBonus(updated);
                        }}
                      />
                    </div>
                  </div>
                </div>
                {detailPerson.cases.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-sm">Không có case trong kỳ này</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">#</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Khách hàng</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Ứng viên</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Vị trí</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-400">Doanh số</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-400">Thưởng nóng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {detailPerson.cases.map((c, i) => (
                        <tr key={c.saleId} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                          <td className="px-4 py-2.5 font-medium text-gray-800 text-xs">{c.client}</td>
                          <td className="px-4 py-2.5 text-gray-600 text-xs">{c.candidate}</td>
                          <td className="px-4 py-2.5 text-gray-600 text-xs">{c.position}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-gray-900 tabular-nums text-xs">
                            {fmt(c.share)} đ
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="w-32 ml-auto">
                              <MoneyInput
                                value={modalCaseHotBonus[c.saleId] ?? modalDefaultHotBonus}
                                onChange={v => setModalCaseHotBonus(prev => ({ ...prev, [c.saleId]: v }))}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Section 3: Tỷ lệ thưởng CN */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tỷ lệ thưởng CN (%)</span>
                </div>
                <div className="p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-2">
                      Thưởng CN = Vượt KPI × Tỷ lệ%
                    </p>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={modalRate}
                      onChange={e => setModalRate(Number(e.target.value))}
                      onFocus={e => e.target.select()}
                      className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <span className="ml-2 text-sm text-gray-500">%</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 mb-1">Vượt KPI</div>
                    <div className="font-semibold text-gray-700">{fmt(modalCalc.overKpi)} đ</div>
                  </div>
                </div>
              </div>

              {/* Section 4: Calculation summary */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tổng kết</span>
                </div>
                <div className="divide-y divide-gray-100">
                  <div className="px-4 py-3 flex justify-between text-sm">
                    <span className="text-gray-500">Lương cơ bản</span>
                    <span className="font-medium text-gray-700 tabular-nums">{fmt(detailPerson.baseSalary)} đ</span>
                  </div>
                  <div className="px-4 py-3 flex justify-between text-sm">
                    <span className="text-gray-500">
                      Lương ước tính ({detailPerson.baseSalary > 0 ? `${fmt(detailPerson.baseSalary)} ÷ ${WORK_DAYS_STANDARD} × ${modalWorkDays}` : '—'})
                    </span>
                    <span className="font-medium text-brand-600 tabular-nums">{fmt(modalCalc.estimatedSalary)} đ</span>
                  </div>
                  <div className="px-4 py-3 flex justify-between text-sm">
                    <span className="text-gray-500">
                      Vượt KPI (max({fmt(detailPerson.totalRevenue)} − {fmt(detailPerson.kpi)}, 0))
                    </span>
                    <span className="font-medium text-gray-700 tabular-nums">{fmt(modalCalc.overKpi)} đ</span>
                  </div>
                  <div className="px-4 py-3 flex justify-between text-sm">
                    <span className="text-gray-500">
                      Thưởng CN ({fmt(modalCalc.overKpi)} × {modalRate}%)
                    </span>
                    <span className="font-semibold text-green-600 tabular-nums">{fmt(modalCalc.bonusCN)} đ</span>
                  </div>
                  <div className="px-4 py-3 flex justify-between text-sm">
                    <span className="text-gray-500">
                      Thưởng nóng ({detailPerson.cases.length} case)
                    </span>
                    <span className="font-semibold text-orange-500 tabular-nums">{fmt(modalCalc.totalHot)} đ</span>
                  </div>
                  <div className="px-5 py-4 flex justify-between items-center bg-gray-900 text-white">
                    <span className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp size={14} /> Tổng nhận
                    </span>
                    <span className="text-xl font-black tabular-nums">{fmt(modalCalc.total)} đ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
              <button
                onClick={closeDetail}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={saveModal}
                disabled={savingModal}
                className="px-5 py-2 text-sm font-bold text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
              >
                {savingModal ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
