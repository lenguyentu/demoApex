import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import PageMeta from '../../../components/common/PageMeta';
import { useAuthStore } from '../../auth/store';
import { useCurrentWeekStart } from '../hooks';
import { getDailyKPIFromProcesses, getWeeklyKPIFromProcesses, upsertDailyApproaches } from '../api';
import { sendKPIdailyNotification } from '../utils/kpiNotification';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { TeamMemberSelect } from '../../../components/TeamMemberSelect';
import { ROLES } from '../../auth/constants';

export default function HHKPIPage() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const now = new Date();
  const vnDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  
  const businessDate = vnDate; // Calendar day logic

  const businessDateLabel = now.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  });

  // User selection (for HH Lead and Admin)
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(user?.id);
  const isHHLead = user?.role === ROLES.HH_LEAD;
  const isAdmin = user?.role === ROLES.ADMIN;
  const canViewOthers = isHHLead || isAdmin;

  const { data: currentWeekStart } = useCurrentWeekStart();

  // Use selectedUserId for queries
  const effectiveUserId = selectedUserId || user?.id;

  // Get daily KPI (auto from processes + manual approaches)
  const { data: dailyKPI, isLoading: isLoadingDaily } = useQuery({
    queryKey: ['dailyKPIFromProcesses', effectiveUserId, businessDate],
    queryFn: () => getDailyKPIFromProcesses(effectiveUserId!, businessDate),
    enabled: !!effectiveUserId,
    staleTime: 30 * 1000,
  });

  // Get weekly history
  const { data: weeklyHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['weeklyKPIFromProcesses', effectiveUserId, currentWeekStart],
    queryFn: () => getWeeklyKPIFromProcesses(effectiveUserId!, currentWeekStart!),
    enabled: !!effectiveUserId && !!currentWeekStart,
    staleTime: 30 * 1000,
  });

  // Save approaches mutation (only for own data)
  const { mutate: saveApproaches, isPending: isSaving } = useMutation({
    mutationFn: ({ approaches, note }: { approaches: number; note?: string }) =>
      upsertDailyApproaches(user!.id, businessDate, approaches, note),
    onSuccess: async (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dailyKPIFromProcesses'] });
      queryClient.invalidateQueries({ queryKey: ['weeklyKPIFromProcesses'] });
      toast.success('Đã lưu KPI hôm nay! 🎉');

      if (!user) return;

      void sendKPIdailyNotification({
        reporterUserId: user.id,
        reporterName: user.full_name,
        reporterEmail: user.email,
        reporterDiscordId: user.discord_id,
        date: businessDate,
        dateLabel: businessDateLabel,
        savedAt: new Date(),
        approaches: variables.approaches,
        cvToDb: dailyKPI?.cv_to_db ?? 0,
        cvToClient: dailyKPI?.cv_to_client ?? 0,
        setupInterview: dailyKPI?.setup_interview ?? 0,
        actualInterview: dailyKPI?.actual_interview ?? 0,
        offer: dailyKPI?.offer ?? 0,
        placement: dailyKPI?.placement ?? 0,
        note: variables.note ?? dailyKPI?.note,
      });
    },
    onError: (error) => {
      console.error('Save error:', error);
      toast.error('Lỗi khi lưu');
    },
  });

  // Form state (chỉ approaches)
  const isViewingOwnData = effectiveUserId === user?.id;
  const [approaches, setApproaches] = useState(0);

  // Sync form data when dailyKPI loads
  useEffect(() => {
    if (dailyKPI) {
      setApproaches(dailyKPI.approaches || 0);
    }
  }, [dailyKPI]);

  // Calculate weekly totals
  const weeklyTotals = {
    approaches: weeklyHistory.reduce((sum: number, row: any) => sum + (row.approaches || 0), 0),
    cvToDb: weeklyHistory.reduce((sum: number, row: any) => sum + (row.cv_to_db || 0), 0),
    cvToClient: weeklyHistory.reduce((sum: number, row: any) => sum + (row.cv_to_client || 0), 0),
    setupInterview: weeklyHistory.reduce((sum: number, row: any) => sum + (row.setup_interview || 0), 0),
    actualInterview: weeklyHistory.reduce((sum: number, row: any) => sum + (row.actual_interview || 0), 0),
    offer: weeklyHistory.reduce((sum: number, row: any) => sum + (row.offer || 0), 0),
    placement: weeklyHistory.reduce((sum: number, row: any) => sum + (row.placement || 0), 0),
  };

  const handleSave = () => {
    if (!user?.id) return;
    saveApproaches({ approaches });
  };

  const metrics = [
    { label: 'Approaches', value: approaches, total: weeklyTotals.approaches, target: 30, targetWeek: 150, editable: true },
    { label: 'CV to Database', value: dailyKPI?.cv_to_db || 0, total: weeklyTotals.cvToDb, target: 5, targetWeek: 25, editable: false },
    { label: 'CV to Client', value: dailyKPI?.cv_to_client || 0, total: weeklyTotals.cvToClient, target: 1, targetWeek: 10, editable: false },
    { label: 'Set up Interview', value: dailyKPI?.setup_interview || 0, total: weeklyTotals.setupInterview, target: 0, targetWeek: 3, editable: false },
    { label: 'Actual Interview', value: dailyKPI?.actual_interview || 0, total: weeklyTotals.actualInterview, target: 0, targetWeek: 2, editable: false },
    { label: 'Offer', value: dailyKPI?.offer || 0, total: weeklyTotals.offer, target: 0, targetWeek: 1, editable: false },
    { label: 'Placement', value: dailyKPI?.placement || 0, total: weeklyTotals.placement, target: 0, targetWeek: 0, editable: false },
  ];

  if (isLoadingDaily || isLoadingHistory) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="KPI Tracker" />
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">KPI Tracker</h1>
                <p className="text-sm text-gray-500 mt-1">
                  KPI tính theo ngày dương lịch (00:00 - 23:59) - {businessDateLabel}
                </p>
              </div>

              {/* User Selector for HH Lead and Admin */}
              {canViewOthers && (
                <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
                  <span className="text-sm font-medium text-gray-600 whitespace-nowrap">Xem KPI của:</span>
                  <div className="w-56">
                    <TeamMemberSelect
                      value={selectedUserId || ''}
                      onChange={setSelectedUserId}
                      placeholder="Chọn thành viên..."
                      includeSelf={true}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Save Button - Only show when viewing own data */}
              {isViewingOwnData && (
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-all flex items-center gap-2 font-semibold shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Lưu KPI
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Input table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">KPI hôm nay</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Chỉ số tự động tính 00:00–lúc lưu · Lưu KPI sẽ gửi báo cáo Discord
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  {['Chỉ số','Target/ngày','Nhập actual hôm nay','Tổng tuần','Target tuần','% Tuần','Lũy kế T'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {metrics.map(metric => {
                  const pct = metric.targetWeek > 0 ? Math.round((metric.total / metric.targetWeek) * 100) : 0;
                  
                  return (
                    <tr key={metric.label} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-700">{metric.label}</td>
                      <td className="px-4 py-3 text-gray-500">{metric.target || '—'}</td>
                      <td className="px-4 py-3">
                        {metric.editable && isViewingOwnData ? (
                          <input 
                            type="number" 
                            value={approaches}
                            onChange={(e) => setApproaches(parseInt(e.target.value) || 0)}
                            className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-300" 
                          />
                        ) : (
                          <span className="text-gray-700 font-semibold">{metric.value}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{metric.total}</td>
                      <td className="px-4 py-3 text-gray-500">{metric.targetWeek}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${pct >= 100 ? 'text-green-600' : pct >= 70 ? 'text-brand-600' : 'text-red-500'}`}>
                          {pct}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{metric.total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* History */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-6">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">Lịch sử KPI các ngày trong tuần</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  {['Ngày','Approaches','CV DB','CV Client','Interview','Offer','Placement','Note'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {weeklyHistory.map((row: any) => (
                  <tr key={row.date} className={row.is_today ? 'bg-brand-50/30' : 'hover:bg-gray-50/50'}>
                    <td className={`px-4 py-3 font-medium ${row.is_today ? 'text-brand-600' : 'text-gray-700'}`}>
                      {row.day_of_week}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{row.approaches || 0}</td>
                    <td className="px-4 py-3 text-gray-700">{row.cv_to_db || 0}</td>
                    <td className="px-4 py-3 text-gray-700">{row.cv_to_client || 0}</td>
                    <td className="px-4 py-3 text-gray-700">{row.actual_interview || 0}</td>
                    <td className="px-4 py-3 text-gray-700">{row.offer || 0}</td>
                    <td className="px-4 py-3 text-gray-700">{row.placement || 0}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{row.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
