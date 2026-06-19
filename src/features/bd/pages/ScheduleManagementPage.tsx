import { useState } from 'react';
import { Calendar, TriangleAlert, Clock, Bell, Search, ChevronRight, CircleCheckBig } from 'lucide-react';
import { ConfirmReminderModal } from '../components/ConfirmReminderModal';
import { CalendarModal } from '../components/CalendarModal';
import { useBDSchedules, useUpdateBDStatus } from '../hooks';
import type { ScheduleItem } from '../types';
import { OwnerSelect } from '../../../components/OwnerSelect';
import { DateRangePicker, type DateRange } from '../../../components/DateRangePicker';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

type StatusFilter = 'all' | 'overdue' | 'today' | 'upcoming';
type ReminderFilter = 'all' | '7-day' | '15-day' | '30-day' | 'Calling' | 'Meeting' | 'Emailing' | 'Contract' | 'Follow up';

export function ScheduleManagementPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [reminderFilter, setReminderFilter] = useState<ReminderFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');

  // Modal state
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Mutations
  const updateStatusMutation = useUpdateBDStatus();

  // Convert reminderFilter to hook format
  const getReminderType = (): string => {
    return reminderFilter;
  };

  // Fetch schedules with filters & pagination (for the list)
  const { schedules, stats, totalCount, isLoading } = useBDSchedules({
    filters: {
      search: searchQuery,
      reminderType: getReminderType(),
      statusFilter,
      dateFrom: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
      dateTo: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
      owner_id: selectedOwnerId || undefined
    },
    pagination: {
      page: currentPage,
      pageSize: ITEMS_PER_PAGE
    },
    enabled: true
  });

  // Fetch ALL schedules for Calendar (no pagination)
  const { schedules: allSchedules } = useBDSchedules({
    filters: {
      search: searchQuery,
      reminderType: getReminderType(),
      statusFilter: 'all', 
      owner_id: selectedOwnerId || undefined
    },
    pagination: {
      page: 1,
      pageSize: 1000 
    },
    enabled: isCalendarModalOpen
  });

  // Client-side pagination logic
  const totalItems = totalCount;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedSchedules = schedules;

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleConfirmReminder = (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (schedule) {
      setSelectedSchedule(schedule);
      setIsModalOpen(true);
    }
  };

  const handleModalConfirm = async (newStatus: string, note: string) => {
    if (!selectedSchedule) return;

    try {
      await updateStatusMutation.mutateAsync({
        id: selectedSchedule.processId,
        status: newStatus,
        memo: note
      });

      // Refresh list handled by mutation onSuccess in hook (invalidates 'bd_schedules')
      setIsModalOpen(false);
      setSelectedSchedule(null);
    } catch (error) {
      console.error('Failed to update schedule:', error);
      toast.error('Có lỗi xảy ra khi cập nhật!');
    }
  };

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    setCurrentPage(1); // Reset to page 1 when date filter changes
  };

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
              <Calendar className="h-6 w-6 text-brand-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
              <p className="text-gray-500">Lịch nhắc nhở theo dõi khách hàng 7/15/30 ngày</p>
            </div>
          </div>
          <button
            onClick={() => setIsCalendarModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-md text-sm font-medium transition"
          >
            <Calendar className="h-4 w-4" />
            Lịch nhắc nhở
            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700">
              {stats.upcoming}
            </span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total */}
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-6 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Tổng lịch nhắc</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <Calendar className="h-6 w-6 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Overdue - chỉ lịch custom quá hạn */}
          <div className="rounded-xl border border-red-100 bg-white shadow-sm p-6 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-500 uppercase tracking-wider">Quá hạn</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.overdue}</p>
                <p className="text-[10px] text-red-400 mt-0.5">Lịch custom chưa hoàn thành</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <TriangleAlert className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </div>

          {/* Today */}
          <div className="rounded-xl border border-yellow-100 bg-white shadow-sm p-6 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-500 uppercase tracking-wider">Hôm nay</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.today}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Upcoming */}
          <div className="rounded-xl border border-orange-100 bg-white shadow-sm p-6 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-500 uppercase tracking-wider">Sắp đến hạn</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{stats.upcoming}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <Bell className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          {/* Search, Owner & Tabs */}
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm công ty..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Owner Select */}
              <div className="w-full sm:w-[200px]">
                <OwnerSelect
                  value={selectedOwnerId}
                  onChange={(val) => { setSelectedOwnerId(val); setCurrentPage(1); }}
                  placeholder="Tất cả BD"
                  className="w-full"
                />
              </div>
            </div>

            {/* Tabs & Custom Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center justify-center rounded-md bg-gray-100 p-1 self-start xl:self-auto">
                <button
                  onClick={() => { setReminderFilter('all'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-sm transition ${reminderFilter === 'all' ? 'bg-white shadow-sm' : 'hover:bg-gray-50'
                    }`}
                >
                  Tất cả
                </button>
                {(['7-day', '15-day', '30-day'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => { setReminderFilter(f); setCurrentPage(1); }}
                    className={`px-3 py-1.5 text-sm font-medium rounded-sm transition ${reminderFilter === f ? 'bg-white shadow-sm' : 'hover:bg-gray-50'
                      }`}
                  >
                    {f.replace('-day', ' ngày')}
                  </button>
                ))}
              </div>


            </div>
          </div>

          {/* Date & Status Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Date Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-500">Lọc ngày:</span>
              <DateRangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                placeholder="Chọn khoảng thời gian"
                className="min-w-[200px]"
              />
            </div>

            {/* Status Filters */}
            <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
              <span className="text-sm text-gray-500">Trạng thái:</span>
              <div className="flex gap-1 flex-wrap">
                <button
                  onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${statusFilter === 'all'
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => { setStatusFilter('overdue'); setCurrentPage(1); }}
                  title="Lịch custom đã quá ngày hẹn mà chưa xử lý (không tính rolling)"
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${statusFilter === 'overdue'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-red-50 text-red-600 hover:bg-red-100'
                    }`}
                >
                  Quá hạn ({stats.overdue}) · <span className="text-[11px] opacity-70">custom</span>
                </button>
                <button
                  onClick={() => { setStatusFilter('today'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${statusFilter === 'today'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                    }`}
                >
                  Hôm nay ({stats.today})
                </button>
                <button
                  onClick={() => { setStatusFilter('upcoming'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${statusFilter === 'upcoming'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                    }`}
                >
                  Sắp tới ({stats.upcoming})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule List */}
        <div className="bg-transparent">
          <div className="bg-transparent">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
              </div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
                <Bell className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Không có lịch nhắc nhở</h3>
                <p className="mt-1 text-sm text-gray-500">Tuyệt vời! Bạn đã hoàn thành hết các công việc cần làm.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="text-base font-semibold text-gray-800">Danh sách nhắc nhở ({totalItems})</h3>
                </div>
                <div className="space-y-3">
                  {paginatedSchedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-200 bg-white ${schedule.overdueDays && schedule.overdueDays > 0
                          ? 'border-red-100 shadow-sm hover:border-red-200 hover:shadow-md'
                          : schedule.dueDate === new Date().toISOString().split('T')[0]
                            ? 'border-yellow-100 shadow-sm hover:border-yellow-200 hover:shadow-md'
                            : 'border-gray-50 shadow-sm hover:border-brand-100 hover:shadow-md'
                        }`}
                    >
                      {/* Left: Info */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <h4
                            className="font-semibold text-base text-gray-900 cursor-pointer hover:text-brand-600 transition truncate max-w-[300px]"
                            onClick={() => window.open(`/tables/clients/new/${schedule.clientId}`, '_blank')}
                            title={schedule.clientName}
                          >
                            {schedule.clientName}
                          </h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${schedule.reminderType === '7' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                              schedule.reminderType === '15' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                schedule.reminderType === '30' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                  schedule.reminderType === 'Meeting' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                    schedule.reminderType === 'Calling' ? 'bg-green-50 text-green-700 border-green-100' :
                                      'bg-indigo-50 text-indigo-700 border-indigo-100'
                            }`}>
                            {schedule.reminderType === '7' ? '7 ngày' :
                              schedule.reminderType === '15' ? '15 ngày' :
                                schedule.reminderType === '30' ? '30 ngày' :
                                  schedule.reminderType}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-gray-600 text-[11px] font-medium">
                            {schedule.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                          <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                            <span className="text-gray-400">Bắt đầu:</span>
                            <span className="font-medium text-gray-700">{schedule.startDate ? format(new Date(schedule.startDate), 'dd/MM/yyyy') : '-'}</span>
                          </div>
                          <span className="text-gray-300">→</span>
                          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${schedule.overdueDays && schedule.overdueDays > 0 ? 'bg-red-50 text-red-700 border-red-100' :
                              schedule.dueDate === new Date().toISOString().split('T')[0] ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                'bg-green-50 text-green-700 border-green-100'
                            }`}>
                            <span className={schedule.overdueDays && schedule.overdueDays > 0 ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                              Đến hạn:
                            </span>
                            <span className="font-bold">{schedule.dueDate ? format(new Date(schedule.dueDate), 'dd/MM/yyyy') : '-'}</span>
                          </div>
                          <span className="text-gray-300">•</span>
                          <div className="flex items-center gap-1 text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                            <span>BD:</span>
                            <span className="font-medium text-gray-900">{schedule.bdOwner}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-3">
                        {schedule.overdueDays && schedule.overdueDays > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                            <TriangleAlert className="h-3 w-3" />
                            Quá {schedule.overdueDays} ngày
                          </span>
                        ) : schedule.dueDate === new Date().toISOString().split('T')[0] ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                            <Clock className="h-3 w-3" />
                            Hôm nay
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                            <CircleCheckBig className="h-3 w-3" />
                            Sắp đến
                          </span>
                        )}

                        <button
                          onClick={() => handleConfirmReminder(schedule.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700 text-gray-700 rounded-lg text-xs font-medium transition-all shadow-sm"
                        >
                          <CircleCheckBig className="h-3.5 w-3.5" />
                          Xác nhận remind
                        </button>

                        <button
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          onClick={() => window.open(`/tables/clients/new/${schedule.clientId}`, '_blank')}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Pagination Controls */}
            {!isLoading && totalItems > 0 && (
              <div className="flex items-center justify-between pt-6 mt-2 pb-8">
                <p className="text-xs text-gray-500 font-medium">
                  Hiển thị {paginatedSchedules.length} / {totalItems} nhắc nhở
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-md hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition bg-white"
                  >
                    Trước
                  </button>
                  <span className="px-3 py-1.5 text-xs font-medium text-gray-700 flex items-center bg-white border border-gray-200 rounded-md">
                    Trang {currentPage}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Reminder Modal */}
      {selectedSchedule && (
        <ConfirmReminderModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSchedule(null);
          }}
          clientName={selectedSchedule.clientName}
          currentStatus={selectedSchedule.status}
          onConfirm={handleModalConfirm}
          processId={selectedSchedule.processId}
        />
      )}

      {/* Calendar Modal */}
      <CalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        schedules={allSchedules}
      />
    </div>
  );
}

export default ScheduleManagementPage;
