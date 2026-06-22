import { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  Check, 
  AlertCircle, 
  CalendarRange, 
  Target, 
  LayoutGrid,
  Users,
  Save,
  Download,
  Image,
  FileDown,
  Loader2,
  Shield,
  RefreshCw,
  Settings,
  History,
  X,
  TrendingDown,
} from 'lucide-react';
import { getSales, getKPITargetsByYear, upsertKPITarget, getKPIPolicyPresets, getActiveKPIPolicies, rebuildKPISnapshots, setKPIPolicyForRoles, getInternalUsersForKPI, getCurrentEmployeeSalaryHistory, upsertEmployeeSalary, getKPITargetSnapshots, getSalaryHistoryByUser, getKPISnapshotsByUser } from '../api';
import type { EmployeeSalaryHistory, KPIInternalUser, KPIPolicy, KPIPolicyPreset, KPIPeriodType, KPIRole, Sale, KPITargetSnapshot } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../auth/store';
import { exportToExcel, exportToPDF, exportToImage } from '../utils/exportUtils';
import { MoneyInput } from '../components/MoneyInput';

const MONTHS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const DEFAULT_KPI_AMOUNT = 0;
const KPI_POLICY_ROLES: KPIRole[] = ['BD', 'Headhunter'];

// Returns the period index (0-based) for the current date
function getCurrentPeriodIndex(type: KPIPeriodType): number {
  const now = new Date();
  return type === 'month' ? now.getMonth() : Math.floor(now.getMonth() / 3);
}

export default function RevenueDashboardPage() {
  const user = useAuthStore(state => state.user);
  const isAdmin = user?.role === 'Admin';
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonthForBreakdown, setSelectedMonthForBreakdown] = useState<number | null>(null); // null = all months
  const [periodType, setPeriodType] = useState<KPIPeriodType>('month');
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState<number>(() => getCurrentPeriodIndex('month'));
  const [activeMainTab, setActiveMainTab] = useState<'dashboard' | 'setup'>('dashboard');
  const [activeTab, setActiveTab] = useState<'overview' | 'bd' | 'hh'>('overview');
  
  // KPI State
  const [monthlyKpi, setMonthlyKpi] = useState<number | null>(null); // null = chưa có KPI
  const [allMonthlyKpis, setAllMonthlyKpis] = useState<Array<{month: number, kpi: any}>>([]);
  const [kpiInput, setKpiInput] = useState(DEFAULT_KPI_AMOUNT);
  const [savingKpi, setSavingKpi] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [policyPresets, setPolicyPresets] = useState<KPIPolicyPreset[]>([]);
  const [activePolicies, setActivePolicies] = useState<KPIPolicy[]>([]);
  const [selectedPresetCode, setSelectedPresetCode] = useState<string>('custom');
  const [monthMultiplierInput, setMonthMultiplierInput] = useState(3);
  const [quarterMultiplierInput, setQuarterMultiplierInput] = useState(9);
  const [effectiveFrom, setEffectiveFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedRoles, setSelectedRoles] = useState<Record<KPIRole, boolean>>({
    BD: true,
    Headhunter: true,
    Admin: false,
  });
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [rebuildingSnapshots, setRebuildingSnapshots] = useState(false);
  const [internalUsers, setInternalUsers] = useState<KPIInternalUser[]>([]);
  const [currentSalaries, setCurrentSalaries] = useState<EmployeeSalaryHistory[]>([]);
  const [kpiSnapshots, setKpiSnapshots] = useState<KPITargetSnapshot[]>([]);
  const [salaryInputs, setSalaryInputs] = useState<Record<string, number>>({});
  const [salaryEffectiveDates, setSalaryEffectiveDates] = useState<Record<string, string>>({});
  const [savingSalaryUserId, setSavingSalaryUserId] = useState<string | null>(null);

  // Salary history modal
  const [salaryHistoryUser, setSalaryHistoryUser] = useState<KPIInternalUser | null>(null);
  const [salaryHistoryData, setSalaryHistoryData] = useState<EmployeeSalaryHistory[]>([]);
  const [kpiSnapshotHistoryData, setKpiSnapshotHistoryData] = useState<KPITargetSnapshot[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedYear, isAdmin, periodType]);

  async function loadData() {
    try {
      setLoading(true);
      
      // Chạy song song tất cả các API calls cơ bản
      const basePromises: Promise<any>[] = [
        getSales(),
        getKPITargetSnapshots(selectedYear, periodType).catch(() => []),
        getKPITargetsByYear(selectedYear).catch(() => []),
      ];

      const adminPromises: Promise<any>[] = isAdmin ? [
        getKPIPolicyPresets(),
        getActiveKPIPolicies(),
        getInternalUsersForKPI(),
        getCurrentEmployeeSalaryHistory(),
      ] : [];

      const [salesData, snapshots, allYearKpis, ...adminResults] = await Promise.all([
        ...basePromises,
        ...adminPromises,
      ]);

      setSales(salesData);
      setKpiSnapshots(snapshots);

      // Process KPI targets cho năm
      const allKpis: Array<{month: number, kpi: any}> = [];
      (allYearKpis as any[]).forEach(kpi => {
        const date = new Date(kpi.target_month);
        allKpis.push({ month: date.getMonth(), kpi });
      });
      setAllMonthlyKpis(allKpis);

      // Set KPI tháng hiện tại cho banner
      const now = new Date();
      const currentMonthKpi = allKpis.find(item => item.month === now.getMonth());
      if (currentMonthKpi) {
        setMonthlyKpi(currentMonthKpi.kpi.target_amount);
        setKpiInput(currentMonthKpi.kpi.target_amount);
      } else {
        setMonthlyKpi(null);
      }

      if (isAdmin && adminResults.length === 4) {
        const [presets, policies, usersForKpi, salaryHistory] = adminResults;
        setPolicyPresets(presets);
        setActivePolicies(policies);
        setInternalUsers(usersForKpi);
        setCurrentSalaries(salaryHistory);

        const salaryMap = new Map(salaryHistory.map((item: any) => [item.user_id, item]));
        const defaultDate = new Date().toISOString().slice(0, 10);
        const nextSalaryInputs: Record<string, number> = {};
        const nextSalaryDates: Record<string, string> = {};

        usersForKpi.forEach((internalUser: any) => {
          const currentSalary = salaryMap.get(internalUser.id) as any;
          nextSalaryInputs[internalUser.id] = currentSalary?.base_salary ?? 0;
          nextSalaryDates[internalUser.id] = defaultDate;
        });

        setSalaryInputs(nextSalaryInputs);
        setSalaryEffectiveDates(nextSalaryDates);

        const defaultPreset = presets.find((preset: any) => preset.is_default) ?? presets[0];
        if (defaultPreset) {
          setSelectedPresetCode(defaultPreset.preset_code);
          setMonthMultiplierInput(defaultPreset.month_multiplier);
          setQuarterMultiplierInput(defaultPreset.quarter_multiplier);
        }
      }
    } catch (error) {
      toast.error('Unable to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  const handleSetKpi = async () => {
    if (!user || kpiInput <= 0) {
      toast.error('Please enter a valid KPI amount');
      return;
    }

    setSavingKpi(true);
    try {
      const now = new Date();
      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      
      await upsertKPITarget({
        user_id: user.id,
        target_month: currentMonthKey,
        target_amount: kpiInput
      });
      
      setMonthlyKpi(kpiInput);
      toast.success(`KPI set: ${kpiInput.toLocaleString()} VND/month`);
    } catch (error) {
      toast.error('Unable to save KPI');
    } finally {
      setSavingKpi(false);
    }
  };

  const handlePresetChange = (presetCode: string) => {
    setSelectedPresetCode(presetCode);
    const preset = policyPresets.find((item) => item.preset_code === presetCode);
    if (!preset) return;
    setMonthMultiplierInput(preset.month_multiplier);
    setQuarterMultiplierInput(preset.quarter_multiplier);
  };

  const handleApplyPolicy = async () => {
    const roles = KPI_POLICY_ROLES.filter((role) => selectedRoles[role]);
    if (!roles.length) {
      toast.error('Please select at least one role');
      return;
    }

    if (!effectiveFrom) {
      toast.error('Please select an effective date');
      return;
    }

    if (monthMultiplierInput <= 0 || quarterMultiplierInput <= 0) {
      toast.error('KPI multiplier must be greater than 0');
      return;
    }

    setSavingPolicy(true);
    try {
      await setKPIPolicyForRoles({
        roles,
        effectiveFrom,
        monthMultiplier: monthMultiplierInput,
        quarterMultiplier: quarterMultiplierInput,
        presetCode: selectedPresetCode === 'custom' ? null : selectedPresetCode,
      });

      const policies = await getActiveKPIPolicies();
      setActivePolicies(policies);
      toast.success('KPI policy updated successfully');
    } catch {
      toast.error('Unable to update KPI policy');
    } finally {
      setSavingPolicy(false);
    }
  };

  const handleRebuildSnapshots = async () => {
    const fromDate = `${selectedYear}-01-01`;
    const toDate = `${selectedYear}-12-31`;

    setRebuildingSnapshots(true);
    try {
      await rebuildKPISnapshots(fromDate, toDate, true);
      toast.success(`Backfilled KPI snapshots for year ${selectedYear}`);
    } catch {
      toast.error('Unable to backfill KPI snapshots');
    } finally {
      setRebuildingSnapshots(false);
    }
  };

  const handleSaveSalary = async (userId: string) => {
    const salary = salaryInputs[userId] ?? 0;
    const effectiveDate = salaryEffectiveDates[userId];

    if (salary <= 0) {
      toast.error('Salary must be greater than 0');
      return;
    }

    if (!effectiveDate) {
      toast.error('Please select salary effective date');
      return;
    }

    setSavingSalaryUserId(userId);
    try {
      await upsertEmployeeSalary(userId, salary, effectiveDate);
      const salaryHistory = await getCurrentEmployeeSalaryHistory();
      setCurrentSalaries(salaryHistory);

      // Auto-rebuild snapshots for the affected year so KPI reflects new salary immediately
      const affectedYear = new Date(effectiveDate).getFullYear();
      await rebuildKPISnapshots(`${affectedYear}-01-01`, `${affectedYear}-12-31`, true);

      // Also rebuild current year if different (e.g. effective date is in a past year)
      const currentYear = new Date().getFullYear();
      if (affectedYear !== currentYear) {
        await rebuildKPISnapshots(`${currentYear}-01-01`, `${currentYear}-12-31`, true);
      }

      // Refresh snapshots shown in dashboard
      try {
        const snapshots = await getKPITargetSnapshots(selectedYear, periodType);
        setKpiSnapshots(snapshots);
      } catch {
        // non-critical
      }

      toast.success('Updated salary and rebuilt KPI snapshots');
    } catch {
      toast.error('Unable to update salary');
    } finally {
      setSavingSalaryUserId(null);
    }
  };

  const handleViewSalaryHistory = async (internalUser: KPIInternalUser) => {
    setSalaryHistoryUser(internalUser);
    setLoadingHistory(true);
    try {
      const [salaryHistory, kpiSnapshots] = await Promise.all([
        getSalaryHistoryByUser(internalUser.id),
        getKPISnapshotsByUser(internalUser.id),
      ]);
      setSalaryHistoryData(salaryHistory);
      setKpiSnapshotHistoryData(kpiSnapshots);
    } catch {
      toast.error('Unable to load salary history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const periodLabels = periodType === 'month' ? MONTHS : QUARTERS;
  const periodsCount = periodLabels.length;

  const kpiTargetByPeriodIndex = useMemo(() => {
    const map = new Map<number, number>();
    // Overview tab: dùng KPI công ty từ allMonthlyKpis
    // Các tab BD/HH: dùng KPI cá nhân từ kpiSnapshots
    if (activeTab !== 'overview') {
      kpiSnapshots.forEach((snapshot) => {
        const date = new Date(snapshot.period_start);
        const index = periodType === 'month' ? date.getMonth() : Math.floor(date.getMonth() / 3);
        map.set(index, (map.get(index) ?? 0) + snapshot.target_amount);
      });
    } else {
      // KPI công ty: set cho tất cả tháng có KPI
      allMonthlyKpis.forEach(({ month, kpi }) => {
        if (periodType === 'month') {
          map.set(month, kpi.target_amount);
        } else {
          // Quarter mode: group months into quarters
          const quarterIndex = Math.floor(month / 3);
          map.set(quarterIndex, (map.get(quarterIndex) ?? 0) + kpi.target_amount);
        }
      });
    }
    return map;
  }, [kpiSnapshots, periodType, activeTab, allMonthlyKpis]);

  const kpiTargetByUserIdAndPeriodIndex = useMemo(() => {
    const map = new Map<string, number>();
    kpiSnapshots.forEach((snapshot) => {
      const date = new Date(snapshot.period_start);
      const index = periodType === 'month' ? date.getMonth() : Math.floor(date.getMonth() / 3);
      const key = `${snapshot.user_id}_${index}`;
      map.set(key, (map.get(key) ?? 0) + snapshot.target_amount);
    });
    return map;
  }, [kpiSnapshots, periodType]);

  // Process data for the chart and table
  const dashboardData = useMemo(() => {
    if (activeTab === 'overview') {
      const periodData = periodLabels.map((name, idx) => ({
        name,
        invoiced: 0,
        notInvoiced: 0,
        total: 0,
        kpi: kpiTargetByPeriodIndex.get(idx) ?? 0,
      }));

      sales.forEach(sale => {
        if (!sale.start_date) return;

        const date = new Date(sale.start_date);
        if (date.getFullYear() !== selectedYear) return;

        const periodIdx = periodType === 'month' ? date.getMonth() : Math.floor(date.getMonth() / 3);
        const noVat = (sale.offered_monthly_salary || 0) * (sale.rate || 1);
        const amount = sale.finance?.contract_type === 'Công ty' ? noVat * 1.08 : noVat;

        if (sale.finance?.invoice_status === 'Issued') {
          periodData[periodIdx].invoiced += amount;
        } else {
          periodData[periodIdx].notInvoiced += amount;
        }
        periodData[periodIdx].total += amount;
      });

      return periodData;
    }

    const personMap = new Map<string, {
      id: string;
      name: string;
      invoiced: number;
      notInvoiced: number;
      total: number;
      kpi: number;        // KPI for selected period only
      kpiYear: number;    // KPI for full year (kept for reference)
    }>();

    const targetRole = activeTab === 'bd' ? 'BD' : 'Headhunter';

    // Seed users from KPI snapshots
    // Include Admin role because Admin can act as BD or HH
    kpiSnapshots
      .filter((snapshot) => {
        // Accept target role (BD/Headhunter) OR Admin (who can act as both)
        if (snapshot.role_key !== targetRole && snapshot.role_key !== 'Admin') return false;
        
        // For BD/HH tabs: if a specific period is selected, show only that period's KPI
        // If "Tất cả tháng/quý" is selected, show all periods' KPI
        if (selectedMonthForBreakdown !== null) {
          const date = new Date(snapshot.period_start);
          if (periodType === 'month') {
            // Month mode: filter by specific month
            return date.getMonth() === selectedMonthForBreakdown;
          } else {
            // Quarter mode: filter by specific quarter
            const snapshotQuarter = Math.floor(date.getMonth() / 3);
            return snapshotQuarter === selectedMonthForBreakdown;
          }
        }
        
        // "Tất cả tháng/quý" - include all snapshots for the year
        return true;
      })
      .forEach((snapshot) => {
        const id = snapshot.user_id;
        if (!personMap.has(id)) {
          personMap.set(id, {
            id,
            name: snapshot.user?.full_name || 'Unknown Name',
            invoiced: 0,
            notInvoiced: 0,
            total: 0,
            kpi: 0,
            kpiYear: 0,
          });
        }
        // Accumulate KPI across all included periods
        const person = personMap.get(id)!;
        person.kpi += snapshot.target_amount;
      });

    sales.forEach(sale => {
      if (!sale.start_date) return;

      const date = new Date(sale.start_date);
      if (date.getFullYear() !== selectedYear) return;

      // For BD/HH tabs: filter by selectedMonthForBreakdown if set
      if (selectedMonthForBreakdown !== null) {
        if (periodType === 'month') {
          // Month mode: filter by specific month
          if (date.getMonth() !== selectedMonthForBreakdown) return;
        } else {
          // Quarter mode: filter by specific quarter
          const saleQuarter = Math.floor(date.getMonth() / 3);
          if (saleQuarter !== selectedMonthForBreakdown) return;
        }
      }
      // else: "Tất cả tháng/quý" selected - show all periods in the year

      const noVat = (sale.offered_monthly_salary || 0) * (sale.rate || 1);
      const baseAmount = sale.finance?.contract_type === 'Công ty' ? noVat * 1.08 : noVat;

      let targetPersonId = '';
      let targetPersonName = '';
      let amount = 0;

      if (activeTab === 'bd') {
        targetPersonId = sale.job_owner?.id || `bd_${sale.job_owner?.full_name || 'unknown'}`;
        targetPersonName = sale.job_owner?.full_name || 'Unassigned BD';
        const bdRate = sale.finance?.rate_bd || 0;
        amount = baseAmount * (bdRate / 100);
      } else {
        targetPersonId = sale.candidate_owner?.id || `hh_${sale.candidate_owner?.full_name || 'unknown'}`;
        targetPersonName = sale.candidate_owner?.full_name || 'Unassigned HH';
        const hhRate = sale.finance?.rate_internal || 0;
        amount = baseAmount * (hhRate / 100);
      }

      if (!personMap.has(targetPersonId)) {
        // Calculate KPI for this person based on the period filter
        let personKpi = 0;
        if (selectedMonthForBreakdown !== null) {
          if (periodType === 'month') {
            // Specific month selected - use that month's KPI
            personKpi = kpiTargetByUserIdAndPeriodIndex.get(`${targetPersonId}_${selectedMonthForBreakdown}`) ?? 0;
          } else {
            // Specific quarter selected - sum KPI for all 3 months in that quarter
            const quarterStartMonth = selectedMonthForBreakdown * 3;
            for (let i = 0; i < 3; i++) {
              personKpi += kpiTargetByUserIdAndPeriodIndex.get(`${targetPersonId}_${quarterStartMonth + i}`) ?? 0;
            }
          }
        } else {
          // "Tất cả tháng/quý" - sum KPI across all months in the year
          for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
            personKpi += kpiTargetByUserIdAndPeriodIndex.get(`${targetPersonId}_${monthIdx}`) ?? 0;
          }
        }
        
        personMap.set(targetPersonId, {
          id: targetPersonId,
          name: targetPersonName,
          invoiced: 0,
          notInvoiced: 0,
          total: 0,
          kpi: personKpi,
          kpiYear: 0,
        });
      }

      const person = personMap.get(targetPersonId)!;
      if (amount > 0) {
        if (sale.finance?.invoice_status === 'Issued') {
          person.invoiced += amount;
        } else {
          person.notInvoiced += amount;
        }
        person.total += amount;
      }
    });

    return Array.from(personMap.values())
      .filter(person => person.total > 0) // Only show users with revenue
      .sort((a, b) => b.total - a.total);
  }, [activeTab, kpiTargetByPeriodIndex, kpiTargetByUserIdAndPeriodIndex, periodLabels, periodType, periodsCount, sales, selectedYear, selectedPeriodIndex, kpiSnapshots, selectedMonthForBreakdown]);

  const activePolicyByRole = useMemo(() => {
    const grouped = new Map<KPIRole, { month?: KPIPolicy; quarter?: KPIPolicy }>();
    KPI_POLICY_ROLES.forEach((role) => grouped.set(role, {}));

    activePolicies.forEach((policy) => {
      const roleGroup = grouped.get(policy.role_key);
      if (!roleGroup) return;

      if (policy.period_type === 'month' && !roleGroup.month) {
        roleGroup.month = policy;
      }
      if (policy.period_type === 'quarter' && !roleGroup.quarter) {
        roleGroup.quarter = policy;
      }
    });

    return grouped;
  }, [activePolicies]);

  const currentSalaryByUserId = useMemo(() => {
    return new Map(currentSalaries.map((item) => [item.user_id, item]));
  }, [currentSalaries]);

  // Aggregated Stats
  const totalRevenue = dashboardData.reduce((sum, d) => sum + d.total, 0);
  const totalInvoiced = dashboardData.reduce((sum, d) => sum + d.invoiced, 0);
  const totalNotInvoiced = dashboardData.reduce((sum, d) => sum + d.notInvoiced, 0);
  const totalKPI = dashboardData.reduce((sum, d) => sum + (d.kpi || 0), 0);
  const achievementRate = totalKPI > 0 ? (totalRevenue / totalKPI) * 100 : 0;

  if (loading) {
    return (
      <div className="p-20 flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <>
    <div className="p-6 space-y-8 text-gray-700">
    <div id="revenue-dashboard-content">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Revenue Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track real-time revenue and detailed KPI</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              KPI {periodType === 'month' ? MONTHS[selectedPeriodIndex] : QUARTERS[selectedPeriodIndex]} — {selectedYear}
            </span>
            <div className="flex items-center gap-2 text-brand-600 font-black">
              <Target size={16} />
              <span className="text-lg">{totalKPI.toLocaleString()} VND</span>
            </div>
          </div>
          
          <div className="h-8 w-px bg-gray-200"></div>

          <div className="flex items-center gap-2 bg-white px-3 py-2 border border-gray-100 rounded-xl shadow-sm">
            <CalendarRange size={16} className="text-gray-400" />
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-sm font-bold bg-transparent outline-none cursor-pointer"
            >
              {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-2 border border-gray-100 rounded-xl shadow-sm">
            <select
              value={periodType}
              onChange={(e) => {
                const newType = e.target.value as KPIPeriodType;
                setPeriodType(newType);
                setSelectedPeriodIndex(getCurrentPeriodIndex(newType));
                // Reset breakdown filter when switching between month/quarter
                setSelectedMonthForBreakdown(null);
              }}
              className="text-sm font-bold bg-transparent outline-none cursor-pointer"
            >
              <option value="month">By month</option>
              <option value="quarter">By quarter</option>
            </select>
          </div>

          {/* Period selector: T1-T12 or Q1-Q4 */}
          {/* <div className="flex items-center gap-1 bg-white px-2 py-1.5 border border-gray-100 rounded-xl shadow-sm">
            {(periodType === 'month' ? MONTHS : QUARTERS).map((label, idx) => (
              <button
                key={label}
                onClick={() => setSelectedPeriodIndex(idx)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedPeriodIndex === idx
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div> */}

          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                const rows = dashboardData.map((d) => ({
                  name: d.name,
                  kpi: d.kpi || 0,
                  total: d.total,
                  invoiced: d.invoiced,
                  notInvoiced: d.notInvoiced,
                  rate: (d.kpi || 0) > 0 ? `${((d.total / (d.kpi || 0)) * 100).toFixed(0)}%` : '0%',
                }));
                exportToExcel(rows, [
                  { key: 'name', label: activeTab === 'overview' ? 'Month' : 'Personnel Name' },
                  { key: 'kpi', label: 'KPI' },
                  { key: 'total', label: 'Revenue' },
                  { key: 'invoiced', label: 'Invoiced' },
                  { key: 'notInvoiced', label: 'Not Invoiced' },
                  { key: 'rate', label: '% KPI' },
                ], `Revenue_${activeTab}_${selectedYear}`);
              }}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-100 rounded-xl text-sm font-medium bg-white hover:bg-gray-50 shadow-sm"
            >
              <Download size={14} /> Excel
            </button>
            <button 
              onClick={() => exportToImage('revenue-dashboard-content', `Revenue_${selectedYear}`, setExporting, `Revenue Dashboard — ${selectedYear}`)}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-100 rounded-xl text-sm font-medium bg-white hover:bg-gray-50 shadow-sm disabled:opacity-50"
            >
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <Image size={14} />} Image
            </button>
            <button 
              onClick={() => exportToPDF('revenue-dashboard-content', `Revenue_${selectedYear}`, setExporting, `Revenue Dashboard — ${selectedYear}`)}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-100 rounded-xl text-sm font-medium bg-white hover:bg-gray-50 shadow-sm disabled:opacity-50"
            >
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />} PDF
            </button>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="flex items-center p-1 bg-gray-100/80 rounded-xl w-fit">
          {[
            { id: 'dashboard', name: 'Dashboard', icon: LayoutGrid },
            { id: 'setup', name: 'Setup', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveMainTab(tab.id as 'dashboard' | 'setup')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                activeMainTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
              }`}
            >
              <tab.icon size={15} />
              {tab.name}
            </button>
          ))}
        </div>
      )}

      {isAdmin && activeMainTab === 'setup' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-gray-900 inline-flex items-center gap-2">
                  <Shield size={16} className="text-brand-600" />
                  KPI Policy Setup
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Set up KPI formula by business role (BD/Headhunter) and effective date.
                </p>
              </div>
              <button
                onClick={handleRebuildSnapshots}
                disabled={rebuildingSnapshots}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
              >
                {rebuildingSnapshots ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Rebuild snapshots {selectedYear}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Preset</label>
                <select
                  value={selectedPresetCode}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="custom">Custom</option>
                  {policyPresets.map((preset) => (
                    <option key={preset.id} value={preset.preset_code}>
                      {preset.preset_name} ({preset.month_multiplier}x / {preset.quarter_multiplier}x)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Month multiplier</label>
                <input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={monthMultiplierInput}
                  onChange={(e) => setMonthMultiplierInput(Number(e.target.value))}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Quarter multiplier</label>
                <input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={quarterMultiplierInput}
                  onChange={(e) => setQuarterMultiplierInput(Number(e.target.value))}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Effective from</label>
                <input
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {KPI_POLICY_ROLES.map((role) => (
                  <label key={role} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={selectedRoles[role]}
                      onChange={(e) => setSelectedRoles((prev) => ({ ...prev, [role]: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    {role}
                  </label>
                ))}
              </div>
              <button
                onClick={handleApplyPolicy}
                disabled={savingPolicy}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-all font-bold text-sm shadow-lg shadow-brand-200 disabled:opacity-50"
              >
                {savingPolicy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Apply policy
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {KPI_POLICY_ROLES.map((role) => {
                const rolePolicy = activePolicyByRole.get(role);
                return (
                  <div key={role} className="rounded-xl border border-gray-100 p-3 bg-gray-50/50">
                    <div className="text-sm font-black text-gray-900">{role}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Month: {rolePolicy?.month?.multiplier ?? '-'}x | Quarter: {rolePolicy?.quarter?.multiplier ?? '-'}x
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Effective: {rolePolicy?.month?.effective_from ?? rolePolicy?.quarter?.effective_from ?? '-'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-black text-gray-900">Salary Setup (Internal Users)</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">
              Enter base salary for each internal personnel so the system can calculate KPI snapshots according to the policy.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-4 py-3 font-black text-gray-400 uppercase tracking-widest text-[10px]">Personnel</th>
                    <th className="px-4 py-3 font-black text-gray-400 uppercase tracking-widest text-[10px]">System Role</th>
                    <th className="px-4 py-3 font-black text-gray-400 uppercase tracking-widest text-[10px]">KPI role</th>
                    <th className="px-4 py-3 font-black text-gray-400 uppercase tracking-widest text-[10px] text-right">Current Salary</th>
                    <th className="px-4 py-3 font-black text-gray-400 uppercase tracking-widest text-[10px]">New Salary</th>
                    <th className="px-4 py-3 font-black text-gray-400 uppercase tracking-widest text-[10px]">Effective Date</th>
                    <th className="px-4 py-3 font-black text-gray-400 uppercase tracking-widest text-[10px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {internalUsers.map((internalUser) => {
                    const currentSalary = currentSalaryByUserId.get(internalUser.id);
                    const isSaving = savingSalaryUserId === internalUser.id;
                    const selectedEffectiveDate = salaryEffectiveDates[internalUser.id] ?? '';
                    const hasInvalidEffectiveDate = false; // Cho phép backfill ngày quá khứ
                    return (
                      <tr key={internalUser.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <div className="font-bold text-gray-900">{internalUser.full_name}</div>
                          <div className="text-xs text-gray-400">{internalUser.email}</div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-600">{internalUser.role}</td>
                        <td className="px-4 py-3 font-semibold text-gray-600">{internalUser.kpi_role ?? '-'}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          {currentSalary ? `${new Intl.NumberFormat('vi-VN').format(currentSalary.base_salary)} VND` : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-[170px]">
                            <MoneyInput
                              value={salaryInputs[internalUser.id] ?? 0}
                              onChange={(value) => setSalaryInputs((prev) => ({ ...prev, [internalUser.id]: value }))}
                              className="rounded-xl font-semibold"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <input
                              type="date"
                              value={selectedEffectiveDate}
                              onChange={(e) => setSalaryEffectiveDates((prev) => ({ ...prev, [internalUser.id]: e.target.value }))}
                              className={`border rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:ring-2 ${
                                hasInvalidEffectiveDate
                                  ? 'border-red-300 focus:ring-red-500'
                                  : 'border-gray-200 focus:ring-brand-500'
                              }`}
                            />
                            {hasInvalidEffectiveDate && (
                              <p className="text-[10px] font-medium text-red-500">
                                Effective date must be from {currentSalary?.effective_from} onwards.
                              </p>
                            )}
                            <p className="text-[10px] text-gray-400">Can enter a past date for backfill</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewSalaryHistory(internalUser)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold hover:bg-gray-50 text-gray-600"
                              title="View salary & KPI history"
                            >
                              <History size={14} />
                            </button>
                            <button
                              onClick={() => handleSaveSalary(internalUser.id)}
                              disabled={isSaving || hasInvalidEffectiveDate}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 disabled:opacity-50"
                            >
                              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                              Save
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {(!isAdmin || activeMainTab === 'dashboard') && (
        <>
      {/* KPI Setup Banner - Only show if no KPI set */}
      {!isAdmin && monthlyKpi === null && (
        <div className="bg-linear-to-r from-brand-50 to-blue-50 border border-brand-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-3 bg-brand-500/10 rounded-xl">
              <Target size={24} className="text-brand-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">No KPI set for this month</h3>
              <p className="text-sm text-gray-500">What is your monthly revenue target?</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input 
                type="number" 
                value={kpiInput}
                onChange={(e) => setKpiInput(Number(e.target.value))}
                className="w-[200px] pl-4 pr-12 py-2.5 border border-brand-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                placeholder="Enter amount..."
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">VND</span>
            </div>
            <button
              onClick={handleSetKpi}
              disabled={savingKpi}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-all font-bold text-sm shadow-lg shadow-brand-200 disabled:opacity-50"
            >
              <Save size={16} />
              {savingKpi ? 'Saving...' : 'Set KPI'}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center p-1 bg-gray-100/80 rounded-xl w-fit">
          {[
            { id: 'overview', name: 'Company Overview', icon: LayoutGrid },
            { id: 'bd', name: 'BD Department', icon: TrendingUp },
            { id: 'hh', name: 'HH Department', icon: Users }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
              }`}
            >
              <tab.icon size={16} />
              {tab.name}
            </button>
          ))}
        </div>

        {/* Month/Quarter filter for BD/HH tabs */}
        {activeTab !== 'overview' && (
          <select
            value={selectedMonthForBreakdown === null ? 'all' : selectedMonthForBreakdown}
            onChange={(e) => setSelectedMonthForBreakdown(e.target.value === 'all' ? null : Number(e.target.value))}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium bg-white hover:border-brand-400 transition-colors outline-none focus:ring-2 focus:ring-brand-400"
          >
            {periodType === 'month' ? (
              <>
                <option value="all">All months</option>
                {MONTHS.map((month, idx) => (
                  <option key={idx} value={idx}>{month}</option>
                ))}
              </>
            ) : (
              <>
                <option value="all">All quarters</option>
                {QUARTERS.map((quarter, idx) => (
                  <option key={idx} value={idx}>{quarter}</option>
                ))}
              </>
            )}
          </select>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-linear-to-br from-white to-brand-50/30 p-6 rounded-2xl border border-brand-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 size-24 bg-brand-500/10 rounded-full blur-2xl group-hover:bg-brand-500/20 transition-all duration-700"></div>
          <div className="flex justify-between items-start mb-4">
             <div className="p-2.5 bg-brand-500/10 text-brand-600 rounded-xl"><TrendingUp size={24} /></div>
             <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${achievementRate >= 100 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {achievementRate.toFixed(1)}% KPI
             </span>
          </div>
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
            Total Revenue — {periodType === 'month' ? MONTHS[selectedPeriodIndex] : QUARTERS[selectedPeriodIndex]} {selectedYear}
          </p>
          <h2 className="text-3xl font-black text-gray-900 tabular-nums">{totalRevenue.toLocaleString()} <span className="text-sm font-normal text-gray-400">VND</span></h2>
        </div>

        <div className="bg-linear-to-br from-white to-green-50/30 p-6 rounded-2xl border border-green-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 size-24 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all duration-700"></div>
          <div className="flex justify-between items-start mb-4">
             <div className="p-2.5 bg-green-500/10 text-green-600 rounded-xl"><Check size={24} /></div>
          </div>
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Invoiced</p>
          <h2 className="text-3xl font-black text-green-600 tabular-nums">{totalInvoiced.toLocaleString()} <span className="text-sm font-normal text-gray-400">VND</span></h2>
        </div>

        <div className="bg-linear-to-br from-white to-amber-50/30 p-6 rounded-2xl border border-amber-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 size-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-700"></div>
          <div className="flex justify-between items-start mb-4">
             <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-xl"><AlertCircle size={24} /></div>
          </div>
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Not Invoiced</p>
          <h2 className="text-3xl font-black text-amber-600 tabular-nums">{totalNotInvoiced.toLocaleString()} <span className="text-sm font-normal text-gray-400">VND</span></h2>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-black text-gray-900 inline-flex items-center gap-3">
             Revenue chart by {periodType === 'month' ? 'month' : 'quarter'}
             <span className="h-4 w-px bg-gray-200"></span>
             <small className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Year {selectedYear}</small>
             <span className="px-2 py-0.5 bg-brand-100 text-brand-700 rounded-full text-[10px] font-black">
               {activeTab === 'overview' ? (
                 // Overview tab: show selectedPeriodIndex
                 <>{periodType === 'month' ? MONTHS[selectedPeriodIndex] : QUARTERS[selectedPeriodIndex]} selected</>
               ) : (
                 // BD/HH tabs: show selectedMonthForBreakdown or "Tất cả"
                 selectedMonthForBreakdown !== null 
                   ? <>{periodType === 'month' ? MONTHS[selectedMonthForBreakdown] : QUARTERS[selectedMonthForBreakdown]} selected</>
                   : <>All {periodType === 'month' ? 'months' : 'quarters'}</>
               )}
             </span>
          </h3>
          <div className="flex items-center gap-6 text-xs font-bold">
            <div className="flex items-center gap-2"><span className="size-3 rounded-full bg-green-500"></span> Invoiced</div>
            <div className="flex items-center gap-2"><span className="size-3 rounded-full bg-amber-500"></span> Not Invoiced</div>
            <div className="flex items-center gap-2"><span className="size-3 rounded-full bg-gray-200"></span> KPI (Target)</div>
          </div>
        </div>
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dashboardData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis 
                 dataKey="name" 
                 axisLine={false} 
                 tickLine={false} 
                 tick={{fill: '#9ca3af', fontSize: 12, fontWeight: 700}} 
                 dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#9ca3af', fontSize: 10}}
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
              />
              <Tooltip 
                cursor={{fill: '#f9fafb'}}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                formatter={(value: any) => [new Intl.NumberFormat('vi-VN').format(value) + ' VND']}
              />
              <Bar dataKey="invoiced" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} maxBarSize={60} />
              <Bar dataKey="notInvoiced" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={60} />
              <Bar dataKey="kpi" fill="#e5e7eb" opacity={0.3} radius={[4, 4, 4, 4]} maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-12">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
           <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">
             Detailed data analysis
             {activeTab !== 'overview' && (
               <span className="ml-2 px-2 py-0.5 bg-brand-100 text-brand-700 rounded-full normal-case font-bold text-[10px]">
                 {periodType === 'month' ? MONTHS[selectedPeriodIndex] : QUARTERS[selectedPeriodIndex]} {selectedYear}
               </span>
             )}
           </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 font-black text-gray-400 uppercase tracking-widest text-[10px] min-w-[200px]">
                  {activeTab === 'overview' ? 'Metrics' : `${activeTab.toUpperCase()} Personnel`}
                </th>
                {activeTab === 'overview' ? (
                  <>
                    {periodLabels.map(m => (
                      <th key={m} className="px-4 py-4 font-black text-gray-400 text-center text-[10px]">{m}</th>
                    ))}
                    <th className="px-6 py-4 font-black text-brand-600 text-center text-[10px] bg-brand-50/50">Total</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-4 font-black text-gray-400 uppercase tracking-widest text-[10px] text-right">Target KPI</th>
                    <th className="px-6 py-4 font-black text-gray-400 uppercase tracking-widest text-[10px] text-right">Revenue</th>
                    <th className="px-6 py-4 font-black text-green-600 uppercase tracking-widest text-[10px] text-right">Invoiced</th>
                    <th className="px-6 py-4 font-black text-amber-600 uppercase tracking-widest text-[10px] text-right">Not Invoiced</th>
                    <th className="px-6 py-4 font-black text-brand-600 uppercase tracking-widest text-[10px] text-center bg-brand-50/50">% KPI</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activeTab === 'overview' ? (
                <>
                  {/* KPI Row */}
                  <tr>
                    <td className="px-6 py-4 font-bold text-gray-900 bg-gray-50/30">Target KPI</td>
                    {dashboardData.map((_d, i) => (
                      <td key={i} className={`px-4 py-4 text-center font-mono text-xs text-gray-400 italic ${i === selectedPeriodIndex ? 'bg-brand-50/40' : ''}`}>
                        {((_d.kpi || 0) / 1000000).toFixed(0)}M
                      </td>
                    ))}
                    <td className="px-6 py-4 text-center font-black text-gray-900 bg-gray-50/30">{(totalKPI / 1000000).toFixed(0)}M</td>
                  </tr>
                  {/* Revenue Row */}
                  <tr>
                    <td className="px-6 py-4 font-bold text-gray-900">Actual Revenue</td>
                    {dashboardData.map((d, i) => (
                      <td key={i} className={`px-4 py-4 text-center font-black text-xs ${i === selectedPeriodIndex ? 'bg-brand-50/40' : ''} ${d.total >= (d.kpi || 0) && (d.kpi || 0) > 0 ? 'text-green-600' : d.total > 0 ? 'text-orange-600' : 'text-gray-300'}`}>
                        {d.total > 0 ? `${(d.total / 1000000).toFixed(1)}M` : '-'}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-center font-black text-brand-700 bg-brand-50/30">{(totalRevenue / 1000000).toFixed(1)}M</td>
                  </tr>
                  {/* % KPI Row */}
                  <tr>
                    <td className="px-6 py-4 font-bold text-gray-900 bg-gray-50/30">% KPI Completion</td>
                    {dashboardData.map((d, i) => {
                      const rate = d.kpi > 0 ? (d.total / d.kpi) * 100 : 0;
                      return (
                        <td key={i} className={`px-4 py-4 text-center ${i === selectedPeriodIndex ? 'bg-brand-50/40' : ''}`}>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${rate >= 100 ? 'bg-green-100 text-green-700' : rate > 0 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                            {rate.toFixed(0)}%
                          </span>
                        </td>
                      )
                    })}
                    <td className="px-6 py-4 text-center font-black text-brand-600 bg-brand-50/30">{achievementRate.toFixed(0)}%</td>
                  </tr>
                </>
              ) : (
                <>
                  {dashboardData.map((person: any, idx) => {
                    const kpiRate = person.kpi > 0 ? (person.total / person.kpi) * 100 : 0;
                    return (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${idx % 2 === 0 ? 'bg-brand-500' : 'bg-blue-500'}`}></div>
                            {person.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-xs text-gray-400 italic tabular-nums whitespace-nowrap">
                          {person.kpi > 0 ? `${new Intl.NumberFormat('vi-VN').format(person.kpi)} VND` : '-'}
                        </td>
                        <td className="px-6 py-4 font-black text-gray-900 text-right tabular-nums whitespace-nowrap">
                          {person.total > 0 ? `${new Intl.NumberFormat('vi-VN').format(person.total)} VND` : '-'}
                        </td>
                        <td className="px-6 py-4 font-semibold text-green-600 text-right tabular-nums whitespace-nowrap">
                          {person.invoiced > 0 ? `${new Intl.NumberFormat('vi-VN').format(person.invoiced)} VND` : '-'}
                        </td>
                        <td className="px-6 py-4 font-semibold text-amber-600 text-right tabular-nums whitespace-nowrap">
                          {person.notInvoiced > 0 ? `${new Intl.NumberFormat('vi-VN').format(person.notInvoiced)} VND` : '-'}
                        </td>
                        <td className="px-6 py-4 text-center bg-brand-50/30">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                            kpiRate >= 100 ? 'bg-green-100 text-green-700' :
                            kpiRate >= 50 ? 'bg-orange-100 text-orange-700' :
                            kpiRate > 0 ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-400'
                          }`}>
                            {person.kpi > 0 ? `${kpiRate.toFixed(0)}%` : '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-gray-50/50 font-black">
                    <td className="px-6 py-4 text-gray-900">Total</td>
                    <td className="px-6 py-4 text-right text-gray-400 font-mono text-xs tabular-nums whitespace-nowrap">
                      {totalKPI > 0 ? `${new Intl.NumberFormat('vi-VN').format(totalKPI)} VND` : '-'}
                    </td>
                    <td className="px-6 py-4 text-brand-600 text-right tabular-nums whitespace-nowrap">
                      {new Intl.NumberFormat('vi-VN').format(totalRevenue)} VND
                    </td>
                    <td className="px-6 py-4 text-green-600 text-right tabular-nums whitespace-nowrap">
                      {new Intl.NumberFormat('vi-VN').format(totalInvoiced)} VND
                    </td>
                    <td className="px-6 py-4 text-amber-600 text-right tabular-nums whitespace-nowrap">
                      {new Intl.NumberFormat('vi-VN').format(totalNotInvoiced)} VND
                    </td>
                    <td className="px-6 py-4 text-center bg-brand-50/30">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                        achievementRate >= 100 ? 'bg-green-100 text-green-700' :
                        achievementRate >= 50 ? 'bg-orange-100 text-orange-700' :
                        achievementRate > 0 ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {totalKPI > 0 ? `${achievementRate.toFixed(0)}%` : '—'}
                      </span>
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </div>
    </div>

    {/* ===== SALARY HISTORY MODAL ===== */}
    {salaryHistoryUser && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-brand-100 flex items-center justify-between bg-brand-600 text-white">
            <div>
              <h3 className="font-black text-base">{salaryHistoryUser.full_name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {salaryHistoryUser.kpi_role ?? salaryHistoryUser.role} · Salary & KPI History
              </p>
            </div>
            <button
              onClick={() => setSalaryHistoryUser(null)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-12 gap-3 text-gray-400">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              <>
                {/* Salary timeline */}
                <div>
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                    Salary History ({salaryHistoryData.length} changes)
                  </h4>
                  {salaryHistoryData.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No salary data.</p>
                  ) : (() => {
                    // Sort ASC để tính diff dễ: cũ nhất ở idx=0
                    const sortedAsc = [...salaryHistoryData].sort((a, b) =>
                      a.effective_from.localeCompare(b.effective_from)
                    );
                    // Gắn diff vào từng record: diff = lần kế tiếp - lần này
                    const withDiff = sortedAsc.map((row, idx) => ({
                      ...row,
                      diff: idx + 1 < sortedAsc.length
                        ? sortedAsc[idx + 1].base_salary - row.base_salary
                        : null,
                    }));
                    // Hiển thị mới nhất trên
                    const displayList = [...withDiff].reverse();
                    return (
                      <div className="relative">
                        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-100" />
                        <div className="space-y-3">
                          {displayList.map((row) => (
                            <div key={row.id} className="flex items-start gap-3 pl-6 relative">
                              <div className={`absolute left-0 top-2 w-3.5 h-3.5 rounded-full border-2 border-white shadow ${row.is_current ? 'bg-brand-500' : 'bg-gray-300'}`} />
                              <div className={`flex-1 rounded-xl px-4 py-3 border ${row.is_current ? 'bg-brand-50 border-brand-100' : 'bg-gray-50 border-gray-100'}`}>
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-black text-gray-900">
                                      {new Intl.NumberFormat('vi-VN').format(row.base_salary)} VND
                                    </span>
                                    {row.diff !== null && row.diff !== 0 && (
                                      <span className={`text-xs font-bold inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${
                                        row.diff > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                                      }`}>
                                        {row.diff > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                        {row.diff > 0 ? '+' : ''}{new Intl.NumberFormat('vi-VN').format(row.diff)} VND next time
                                      </span>
                                    )}
                                  </div>
                                  {row.is_current && (
                                      <span className="px-2 py-0.5 bg-brand-500 text-white text-[10px] font-black rounded-full">Current</span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  {row.effective_from}{row.effective_to ? ` → ${row.effective_to}` : ' → now'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* KPI snapshots grouped by year */}
                <div>
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                    KPI by period ({kpiSnapshotHistoryData.length} snapshots)
                  </h4>
                  {kpiSnapshotHistoryData.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No KPI snapshot. Please rebuild snapshots.</p>
                  ) : (() => {
                    const byYear = new Map<number, KPITargetSnapshot[]>();
                    kpiSnapshotHistoryData.forEach(s => {
                      const y = new Date(s.period_start).getFullYear();
                      if (!byYear.has(y)) byYear.set(y, []);
                      byYear.get(y)!.push(s);
                    });
                    return Array.from(byYear.entries())
                      .sort(([a], [b]) => b - a)
                      .map(([year, snapshots]) => {
                        const monthSnaps = snapshots
                          .filter(s => s.period_type === 'month')
                          .sort((a, b) => a.period_start.localeCompare(b.period_start));
                        const quarterSnaps = snapshots
                          .filter(s => s.period_type === 'quarter')
                          .sort((a, b) => a.period_start.localeCompare(b.period_start));
                        return (
                          <div key={year} className="mb-5">
                            <div className="inline-flex items-center gap-2 mb-3">
                              <span className="text-sm font-black text-gray-700">{year}</span>
                              <span className="h-px flex-1 bg-gray-100 w-8" />
                            </div>

                            {monthSnaps.length > 0 && (
                              <div className="mb-4">
                                <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">By month</div>
                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                  {monthSnaps.map(s => {
                                    const month = new Date(s.period_start).getMonth() + 1;
                                    return (
                                      <div key={s.id} className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
                                        <div className="text-[11px] text-gray-400 font-bold mb-1">T{month}</div>
                                        <div className="text-sm font-black text-gray-900">
                                          {(s.target_amount / 1_000_000).toFixed(0)}M
                                        </div>
                                        <div className="text-[10px] text-gray-400 mt-1 leading-tight">
                                          {(s.base_salary_at_calc / 1_000_000).toFixed(0)}M
                                          <span className="text-gray-300 mx-0.5">×</span>
                                          {s.multiplier_at_calc}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {quarterSnaps.length > 0 && (
                              <div>
                                <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">By quarter</div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  {quarterSnaps.map(s => {
                                    const q = Math.floor(new Date(s.period_start).getMonth() / 3) + 1;
                                    return (
                                      <div key={s.id} className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
                                        <div className="text-[11px] text-gray-400 font-bold mb-1">Q{q}</div>
                                        <div className="text-sm font-black text-gray-900">
                                          {(s.target_amount / 1_000_000).toFixed(0)}M
                                        </div>
                                        <div className="text-[10px] text-gray-400 mt-1 leading-tight">
                                          {(s.base_salary_at_calc / 1_000_000).toFixed(0)}M
                                          <span className="text-gray-300 mx-0.5">×</span>
                                          {s.multiplier_at_calc}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      });
                  })()}
                </div>
              </>
            )}
          </div>

          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
            <button
              onClick={() => setSalaryHistoryUser(null)}
              className="px-5 py-2 text-sm font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-100"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
