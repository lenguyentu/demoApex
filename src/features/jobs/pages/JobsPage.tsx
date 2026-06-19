import { useState, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import {
  Search,
  Plus,
  Edit,
  Eye,
  Loader2,
  Download,
  X,
  Grid3x3,
  List,
  ExternalLink,
  Clock,
  Flame,
} from 'lucide-react';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { ClientSelect } from '../../../components/ClientSelect';
import { useDeleteJob, useJobsList } from '../hooks';
import { type GetJobsParams } from '../api';
import { updateClientOwner } from '../../clients/api';
import { useOwnerOptions } from '../../clients/hooks';
import { JOB_PHASE_OPTIONS } from '../constants';
import { JobCard, IntroduceCandidateModal, JobPhaseHistoryModal, JobPhaseMemoModal, JobPhaseSelect, SetupUrgentJobsModal } from '../components';
import { LoadMoreButton } from '../../../components/LoadMoreButton';
import type { Job, JobMode, JobPhase } from '../types';
import { useAuthStore } from '../../auth/store';
import { PERMISSIONS } from '../../auth/constants';

interface JobsPageProps {
  mode: JobMode;
}

export const JobsPage = ({ mode }: JobsPageProps) => {
  const location = useLocation();
  const can = useAuthStore((state) => state.can);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedAssignment, setSelectedAssignment] = useState<string>('');
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const [selectedJobRank, setSelectedJobRank] = useState<string>('');
  const [selectedJobLevel, setSelectedJobLevel] = useState<string>('');
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [selectedBD, setSelectedBD] = useState<string>('');
  const [selectedUrgent, setSelectedUrgent] = useState<string>('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [introduceModalOpen, setIntroduceModalOpen] = useState(false);
  const [jobToIntroduce, setJobToIntroduce] = useState<Job | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [pendingBDChange, setPendingBDChange] = useState<{ job: Job; newOwnerId: string } | null>(null);
  const [updatingBD, setUpdatingBD] = useState<string | null>(null);
  const [phaseHistoryJobId, setPhaseHistoryJobId] = useState<string | null>(null);
  const [phaseMemoModal, setPhaseMemoModal] = useState<{ jobId: string; newPhase: JobPhase; currentPhase: JobPhase | null } | null>(null);

  const deleteMutation = useDeleteJob();
  const [setupUrgentModalOpen, setSetupUrgentModalOpen] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());

  const toggleSelectJob = (id: string) => {
    setSelectedJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedJobIds.size === jobs.length) {
      setSelectedJobIds(new Set());
    } else {
      setSelectedJobIds(new Set(jobs.map((j) => j.id)));
    }
  };

  // Debounce search
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    const timer = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Memoize filters for useJobsList
  const currentFilters = useMemo<GetJobsParams>(() => ({
    mode,
    search: debouncedSearch,
    clientId: selectedClient,
    assignmentType: selectedAssignment,
    phase: selectedPhase,
    jobRank: selectedJobRank,
    jobLevel: selectedJobLevel,
    tdJobCategory: selectedDomain,
    clientOwnerId: selectedBD,
    isUrgent: selectedUrgent,
  }), [mode, debouncedSearch, selectedClient, selectedAssignment, selectedPhase, selectedJobRank, selectedJobLevel, selectedDomain, selectedBD, selectedUrgent]);

  const {
    data: jobs,
    loading,
    hasMore,
    loadMore,
    totalCount,
    refresh,
  } = useJobsList(currentFilters);

  // Lấy danh sách BD (owner) options
  const { data: ownerOptions = [] } = useOwnerOptions();

  const handleDelete = async () => {
    if (!jobToDelete) return;
    try {
      await deleteMutation.mutateAsync(jobToDelete.id);
      setDeleteModalOpen(false);
      setJobToDelete(null);
      refresh();
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };


  const handleIntroduceClick = (job: Job) => {
    setJobToIntroduce(job);
    setIntroduceModalOpen(true);
  };

  const handleOwnerChange = (job: Job, newOwnerId: string) => {
    // Nếu không thay đổi thì không cần confirm
    if (newOwnerId === (job as any).clients?.owner_id) {
      return;
    }
    setPendingBDChange({ job, newOwnerId });
  };

  const handleConfirmBDChange = async () => {
    if (!pendingBDChange) return;
    
    const { job, newOwnerId } = pendingBDChange;
    
    if (!job.client_id) {
      toast.error('Job không có client');
      setPendingBDChange(null);
      return;
    }

    try {
      setUpdatingBD(job.id);
      await updateClientOwner(job.client_id, newOwnerId);
      toast.success('Đã cập nhật BD thành công');
      setPendingBDChange(null);
      refresh();
    } catch (error) {
      console.error('Error updating BD:', error);
      toast.error('Không thể cập nhật BD');
    } finally {
      setUpdatingBD(null);
    }
  };

  const handlePhaseChange = (job: Job, newPhase: string) => {
    // Nếu không thay đổi thì không làm gì
    if (newPhase === job.phase) {
      return;
    }
    
    // Mở modal để nhập note
    setPhaseMemoModal({
      jobId: job.id,
      newPhase: newPhase as JobPhase,
      currentPhase: job.phase || null
    });
  };

  const handleExportExcel = () => {
    const toExport = selectedJobIds.size > 0
      ? jobs.filter((j) => selectedJobIds.has(j.id))
      : jobs;
    if (toExport.length === 0) return;

    // Convert HTML to readable plain text, preserving line breaks from block elements
    const htmlToText = (html: string | null | undefined): string => {
      if (!html) return '';
      return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<\/h[1-6]>/gi, '\n')
        .replace(/<li[^>]*>/gi, '• ')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    };

    const COL_WIDTH_NORMAL = 18;
    const COL_WIDTH_RICH = 80; // fixed width for JD & Requirements

    const dataToExport = toExport.map((job) => ({
      'Mã Job': job.job_id || '',
      'Vị trí': job.position_title || '',
      'Khách hàng': (job as any).clients?.client_name || '',
      'Trạng thái': job.phase || '',
      'Số lượng': job.number_of_employees || '',
      'Loại': job.assignment_type || '',
      'Ngành': job.td_job_category || '',
      'Lương tối thiểu': job.min_monthly_salary || '',
      'Lương tối đa': job.max_monthly_salary || '',
      'Địa điểm': job.work_location || '',
      'JD': htmlToText(job.jd_clear),
      'Mô tả': htmlToText(job.job_summary),
      'Tạo bởi': (job as any).created_by_details?.full_name || '',
      'Ngày tạo': job.created_at ? new Date(job.created_at).toLocaleDateString('vi-VN') : '',
      'Cập nhật': job.updated_at ? new Date(job.updated_at).toLocaleDateString('vi-VN') : '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // Set column widths
    const colKeys = Object.keys(dataToExport[0] || {});
    worksheet['!cols'] = colKeys.map((key) =>
      key === 'JD' || key === 'Yêu cầu'
        ? { wch: COL_WIDTH_RICH }
        : { wch: COL_WIDTH_NORMAL }
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Jobs');
    const date = new Date().toISOString().split('T')[0];
    const label = mode === 'open' ? 'Open_Jobs' : 'Admin_Jobs';
    XLSX.writeFile(workbook, `${label}_${date}.xlsx`);
  };

  const pageTitle = mode === 'open' ? 'Open Jobs' : 'Admin Jobs';
  const pageDescription =
    mode === 'open'
      ? 'Các công việc đang tuyển dụng'
      : 'Quản lý tất cả công việc';

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {pageTitle}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {pageDescription}
            {totalCount !== undefined && ` • ${totalCount} công việc`}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {/* View Mode Toggle - Only for Open Jobs */}
          {mode === 'open' && (
            <div className="flex items-center gap-1 border border-gray-300 dark:border-gray-600 rounded-lg p-1 bg-white dark:bg-gray-800">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'card'
                    ? 'bg-brand-500 text-white'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title="Card View"
              >
                <Grid3x3 size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-brand-500 text-white'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title="List View"
              >
                <List size={16} />
              </button>
            </div>
          )}
          {selectedJobIds.size > 0 && (
            <button
              onClick={() => setSelectedJobIds(new Set())}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 hover:border-gray-400 transition-all duration-150 shadow-sm"
            >
              <X size={14} strokeWidth={2} />
              <span>Bỏ chọn ({selectedJobIds.size})</span>
            </button>
          )}
          <button
            onClick={handleExportExcel}
            disabled={jobs.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 hover:border-emerald-700 transition-all duration-150 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={15} strokeWidth={2} />
            <span className="font-medium">
              {selectedJobIds.size > 0
                ? `Xuất ${selectedJobIds.size} job`
                : 'Xuất Excel'}
            </span>
          </button>
          {can(PERMISSIONS.CREATE_JOB) && (
            <>

              <Link
                to="/jobs/new"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors shadow-sm"
              >
                <Plus size={15} strokeWidth={2} />
                <span>Thêm Job</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        {/* Fixed height row - min-height prevents layout shift when dropdowns open/close */}
        <div className="flex items-center gap-3 min-h-[38px]">
          {/* Search - fixed width, not flex-1 to avoid being too wide */}
          <div className="relative shrink-0 w-[260px]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Tìm theo tên vị trí, mã job..."
              className="w-full h-[38px] pl-10 pr-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Filters - Only for Open mode */}
          {mode === 'open' && (
            <>

              <div className="shrink-0 w-[130px]">
                <select
                  value={selectedJobRank}
                  onChange={(e) => setSelectedJobRank(e.target.value)}
                  className="w-full h-[38px] px-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Tất cả Rank</option>
                  <option value="S">Rank S</option>
                  <option value="A">Rank A</option>
                  <option value="B">Rank B</option>
                  <option value="C">Rank C</option>
                  <option value="D">Rank D</option>
                  <option value="F">Rank F</option>
                </select>
              </div>

              <div className="shrink-0 w-[140px]">
                <select
                  value={selectedJobLevel}
                  onChange={(e) => setSelectedJobLevel(e.target.value)}
                  className="w-full h-[38px] px-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Tất cả Level</option>
                  <option value="Intern">Intern</option>
                  <option value="Fresher">Fresher</option>
                  <option value="Junior">Junior</option>
                  <option value="Middle">Middle</option>
                  <option value="Senior">Senior</option>
                  <option value="Lead">Lead</option>
                  <option value="Manager">Manager</option>
                  <option value="Director">Director</option>
                  <option value="C-Level">C-Level</option>
                </select>
              </div>

              <div className="shrink-0 w-[160px]">
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="w-full h-[38px] px-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Tất cả Domain</option>
                  <option value="IT">IT</option>
                  <option value="Non-IT">Non-IT</option>
                  <option value="App/Games">App/Games</option>
                  <option value="Ecommerce">Ecommerce</option>
                </select>
              </div>

              <div className="shrink-0 w-[190px]">
                <select
                  value={selectedBD}
                  onChange={(e) => setSelectedBD(e.target.value)}
                  className="w-full h-[38px] px-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Tất cả BD</option>
                  {ownerOptions.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="shrink-0 w-[200px]">
                <ClientSelect
                  value={selectedClient}
                  onChange={setSelectedClient}
                  placeholder="Chọn khách hàng..."
                />
              </div>
            </>
          )}

          {/* Filters for Admin mode */}
          {mode === 'admin' && (
            <>
              <div className="shrink-0 w-[150px]">
                <select
                  value={selectedAssignment}
                  onChange={(e) => setSelectedAssignment(e.target.value)}
                  className="w-full h-[38px] px-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Tất cả loại</option>
                  <option value="Headhunter">Headhunter</option>
                  <option value="CTV">CTV</option>
                  <option value="Freelancer">Freelancer</option>
                </select>
              </div>

              <div className="shrink-0 w-[150px]">
                <select
                  value={selectedUrgent}
                  onChange={(e) => setSelectedUrgent(e.target.value)}
                  className="w-full h-[38px] px-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Tất cả (Gấp/Thường)</option>
                  <option value="true">Chỉ hiện Gấp</option>
                  <option value="false">Chỉ hiện Thường</option>
                </select>
              </div>

              <div className="shrink-0 w-[200px]">
                <ClientSelect
                  value={selectedClient}
                  onChange={setSelectedClient}
                  placeholder="Chọn khách hàng..."
                />
              </div>

              <div className="shrink-0 w-[150px]">
                <select
                  value={selectedPhase}
                  onChange={(e) => setSelectedPhase(e.target.value)}
                  className="w-full h-[38px] px-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Tất cả phase</option>
                  {JOB_PHASE_OPTIONS.map((phase) => (
                    <option key={phase.value} value={phase.value}>
                      {phase.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content - Card Grid for Open, Table for Admin */}
      {mode === 'open' ? (
        viewMode === 'card' ? (
          // Card Grid Layout for Open Job - with checkbox inline in header
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className={selectedJobIds.has(job.id) ? 'ring-2 ring-emerald-500 rounded-xl' : ''}
              >
                <JobCard
                  job={job}
                  onIntroduceClick={handleIntroduceClick}
                  checkboxSlot={
                    <input
                      type="checkbox"
                      checked={selectedJobIds.has(job.id)}
                      onChange={() => toggleSelectJob(job.id)}
                      className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-emerald-600 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    />
                  }
                />
              </div>
            ))}
          </div>
        ) : (
          // List/Table View for Open Jobs
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="pl-4 pr-2 py-3 w-8">
                      <input
                        type="checkbox"
                        checked={jobs.length > 0 && selectedJobIds.size === jobs.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 accent-emerald-600 cursor-pointer"
                      />
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-[8%] min-w-[90px]">
                      Date
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-[20%] min-w-[250px]">
                      Job ID / Role
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-[12%] min-w-[140px]">
                      Client
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-[6%] min-w-[80px]">
                      Ranking
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-[5%] min-w-[50px]">
                      SL
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-[10%] min-w-[120px]">
                      Domain
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-[10%] min-w-[120px]">
                      Range
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-[12%] min-w-[160px]">
                      BD
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-[5%] min-w-[60px]">
                      JD
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-[5%] min-w-[80px]">
                      Website
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-[12%] min-w-[140px]">
                      Location
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {jobs.map((job) => {
                    const formatDate = (dateStr: string | null | undefined) => {
                      if (!dateStr) return '-';
                      return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    };
                    const jobRank = job.job_rank || '-';
                    const clientWebsite = (job as any).clients?.website_url || '-';
                    
                    return (
                      <tr
                        key={job.id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                          selectedJobIds.has(job.id) ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
                        }`}
                      >
                        <td className="pl-4 pr-2 py-3 align-middle">
                          <input
                            type="checkbox"
                            checked={selectedJobIds.has(job.id)}
                            onChange={() => toggleSelectJob(job.id)}
                            className="w-4 h-4 rounded border-gray-300 accent-emerald-600 cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap align-middle">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {formatDate(job.created_at)}
                          </span>
                        </td>
                        <td className="px-3 py-3 w-[250px] align-middle">
                          <Link
                            target="_blank"
                            to={`/jobs/${job.id}`}
                            state={{ from: location.pathname }}
                            className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 hover:underline"
                          >
                            {job.job_id || '-'}
                          </Link>
                          <div className="mt-0.5">
                            <Link
                              target="_blank"
                              to={`/jobs/${job.id}`}
                              state={{ from: location.pathname }}
                              className="text-sm font-medium text-gray-900 dark:text-white hover:text-brand-600 hover:underline line-clamp-2"
                              title={job.position_title || ''}
                            >
                              {job.position_title || 'Chưa có tiêu đề'}
                            </Link>
                          </div>
                        </td>
                        <td className="px-3 py-3 align-middle">
                          {job.clients?.id ? (
                            <Link
                              target="_blank"
                              to={`/tables/clients/new/${job.clients.id}`}
                              className="text-sm text-gray-700 dark:text-gray-300 hover:text-brand-600 hover:underline line-clamp-2 max-w-[12vw] sm:max-w-[140px] md:max-w-[160px] lg:max-w-[200px]"
                              title={job.clients?.client_name || ''}
                            >
                              {job.clients?.client_name || '-'}
                            </Link>
                          ) : (
                            <span className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                              -
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center align-middle">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded ${
                            jobRank === 'S' ? 'bg-purple-100 text-purple-700' :
                            jobRank === 'A' ? 'bg-red-100 text-red-700' :
                            jobRank === 'B' ? 'bg-orange-100 text-orange-700' :
                            jobRank === 'C' ? 'bg-yellow-100 text-yellow-700' :
                            jobRank === 'D' ? 'bg-green-100 text-green-700' :
                            jobRank === 'F' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {jobRank}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center align-middle">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {job.number_of_employees || '-'}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate block max-w-[10vw] sm:max-w-[120px] md:max-w-[140px]" title={job.td_job_category || ''}>
                            {job.td_job_category || '-'}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <span className="text-sm text-green-600 dark:text-green-400 font-medium truncate block max-w-[10vw] sm:max-w-[120px] md:max-w-[140px]">
                            {(job.min_monthly_salary || job.max_monthly_salary) ? (
                              job.min_monthly_salary && job.max_monthly_salary
                                ? `${job.min_monthly_salary} - ${job.max_monthly_salary}`
                                : job.min_monthly_salary || job.max_monthly_salary
                            ) : '-'}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <select
                            value={(job as any).clients?.owner_id || ''}
                            onChange={(e) => handleOwnerChange(job, e.target.value)}
                            disabled={updatingBD === job.id}
                            className="text-xs border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 w-full focus:ring-1 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="">Chưa có</option>
                            {ownerOptions.map((owner) => (
                              <option key={owner.id} value={owner.id}>
                                {owner.full_name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-3 text-center align-middle">
                          {(job as any).job_internal_data?.original_jd_url ? (
                            <a
                              href={(job as any).job_internal_data.original_jd_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                              title="Xem JD gốc từ client"
                            >
                              <ExternalLink size={14} />
                            </a>
                          ) : (
                            <Link
                              target="_blank"
                              to={`/jobs/${job.id}`}
                              state={{ from: location.pathname }}
                              className="inline-flex items-center justify-center p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                              title="View JD"
                            >
                              <Eye size={14} />
                            </Link>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center align-middle">
                          {clientWebsite && clientWebsite !== '-' ? (
                            <a
                              href={clientWebsite.startsWith('http') ? clientWebsite : `https://${clientWebsite}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                              title={clientWebsite}
                            >
                              <ExternalLink size={14} />
                            </a>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <span className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 max-w-[12vw] sm:max-w-[140px] md:max-w-[160px]" title={job.work_location || ''}>
                            {job.work_location || '-'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        // Table Layout for Admin Job
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {/* Checkbox select all */}
                  <th className="pl-4 pr-2 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={jobs.length > 0 && selectedJobIds.size === jobs.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 accent-emerald-600 cursor-pointer"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    Mã Job
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-[350px]">
                    Vị trí
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-[300px]">
                    Khách hàng
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    Trạng thái
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    SL
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    Loại
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider min-w-[80px]">
                    BD
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    Ngày
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap sticky right-0 bg-gray-50 dark:bg-gray-700 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {jobs.map((job) => {
                  const formatDate = (dateStr: string | null | undefined) => {
                    if (!dateStr) return '-';
                    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' });
                  };
                  const assignmentLabel = job.assignment_type === 'CTV' ? 'CTV' : job.assignment_type === 'Freelancer' ? 'Freelancer' : job.assignment_type || '-';
                  const assignmentColor = job.assignment_type === 'CTV' ? 'bg-purple-100 text-purple-700' : job.assignment_type === 'Freelancer' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600';
                  return (
                    <tr
                      key={job.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                        selectedJobIds.has(job.id) ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
                      }`}
                    >
                      <td className="pl-4 pr-2 py-3">
                        <input
                          type="checkbox"
                          checked={selectedJobIds.has(job.id)}
                          onChange={() => toggleSelectJob(job.id)}
                          className="w-4 h-4 rounded border-gray-300 accent-emerald-600 cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <Link
                          target="_blank"
                          to={`/jobs/${job.id}`}
                          state={{ from: location.pathname }}
                          className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 hover:underline"
                        >
                          {job.job_id || '-'}
                        </Link>
                      </td>
                      <td className="px-3 py-3 w-[250px]">
                        <Link
                          target="_blank"
                          to={`/jobs/${job.id}`}
                          state={{ from: location.pathname }}
                          className="text-sm font-medium text-gray-900 dark:text-white hover:text-brand-600 hover:underline line-clamp-2"
                          title={job.position_title || ''}
                        >
                          {job.position_title || 'Chưa có tiêu đề'}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1 flex-wrap">
                          {job.is_urgent && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded border bg-red-50 border-red-200 text-red-600" title="Job Gấp">
                              <Flame size={12} className="fill-red-600" />
                              <span className="text-[10px] font-bold uppercase">Gấp</span>
                            </span>
                          )}
                          {job.td_job_category && <span>{job.td_job_category}</span>}
                          {job.td_job_category && (job.min_monthly_salary || job.max_monthly_salary) && <span>•</span>}
                          {(job.min_monthly_salary || job.max_monthly_salary) && (
                            <span className="text-green-600 dark:text-green-400">
                              {job.min_monthly_salary && job.max_monthly_salary
                                ? `${job.min_monthly_salary} - ${job.max_monthly_salary}`
                                : job.min_monthly_salary || job.max_monthly_salary}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 w-[180px]">
                        <span className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2" title={job.clients?.client_name || ''}>
                          {job.clients?.client_name || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center align-middle">
                        <div className="flex justify-center">
                          <JobPhaseSelect
                            currentPhase={job.phase}
                            onPhaseChange={(newPhase) => handlePhaseChange(job, newPhase)}
                            disabled={false}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {job.number_of_employees || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${assignmentColor}`}>
                          {assignmentLabel}
                        </span>
                      </td>
                      <td className="px-3 py-3 min-w-[150px]">
                        <select
                          value={(job as any).clients?.owner_id || ''}
                          onChange={(e) => handleOwnerChange(job, e.target.value)}
                          disabled={updatingBD === job.id}
                          className="text-xs border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 w-full focus:ring-1 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="">Chưa có</option>
                          {ownerOptions.map((owner) => (
                            <option key={owner.id} value={owner.id}>
                              {owner.full_name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed whitespace-nowrap">
                          <div>Create: {formatDate(job.created_at)}</div>
                          <div>Update: {formatDate(job.updated_at)}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right sticky right-0 bg-white dark:bg-gray-800 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setPhaseHistoryJobId(job.id)}
                            className="p-1 text-gray-500 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
                            title="Lịch sử Phase"
                          >
                            <Clock size={15} />
                          </button>
                          <Link
                            target="_blank"
                            to={`/jobs/${job.id}`}
                            state={{ from: location.pathname }}
                            className="p-1 text-gray-500 hover:text-brand-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye size={15} />
                          </Link>
                          <Link
                            target="_blank"
                            to={`/jobs/${job.id}/edit`}
                            className="p-1 text-gray-500 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit size={15} />
                          </Link>
                          {/* <button
                            onClick={() => {
                              setJobToDelete(job);
                              setDeleteModalOpen(true);
                            }}
                            className="p-1 text-gray-500 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Xóa"
                          >
                            <Trash2 size={15} />
                          </button> */}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Loading / Empty / Load More */}
      {loading && jobs.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-brand-500" size={32} />
        </div>
      )}

      {!loading && jobs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <p>Không tìm thấy công việc nào</p>
        </div>
      )}

      <LoadMoreButton
        onClick={loadMore}
        loading={loading}
        hasMore={hasMore}
        loadedCount={jobs.length}
        totalCount={totalCount}
      />

      {/* Delete Modal */}
      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setJobToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Xóa công việc"
        message={`Bạn có chắc chắn muốn xóa job "${jobToDelete?.position_title || jobToDelete?.job_code}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      {/* BD Change Confirm Modal */}
      <ConfirmModal
        open={!!pendingBDChange}
        onClose={() => setPendingBDChange(null)}
        onConfirm={handleConfirmBDChange}
        title="Xác nhận thay đổi BD"
        message={`Bạn có chắc muốn thay đổi BD cho client "${(pendingBDChange?.job as any)?.clients?.client_name}"? Tất cả jobs của client này sẽ có BD mới.`}
        confirmText="Xác nhận"
        variant="warning"
        isLoading={!!updatingBD}
      />

      {/* Introduce Candidate Modal */}
      <IntroduceCandidateModal
        job={jobToIntroduce}
        open={introduceModalOpen}
        onClose={() => {
          setIntroduceModalOpen(false);
          setJobToIntroduce(null);
        }}
        onSuccess={() => refresh()}
      />

      {/* Job Phase History Modal - Read only */}
      {phaseHistoryJobId && (
        <JobPhaseHistoryModal
          isOpen={!!phaseHistoryJobId}
          onClose={() => setPhaseHistoryJobId(null)}
          jobId={phaseHistoryJobId}
        />
      )}

      {/* Job Phase Memo Modal - For updating phase with note */}
      {phaseMemoModal && (
        <JobPhaseMemoModal
          isOpen={!!phaseMemoModal}
          onClose={() => setPhaseMemoModal(null)}
          jobId={phaseMemoModal.jobId}
          newPhase={phaseMemoModal.newPhase}
          currentPhase={phaseMemoModal.currentPhase}
          onSuccess={() => {
            refresh();
            setPhaseMemoModal(null);
          }}
        />
      )}

      <SetupUrgentJobsModal 
        isOpen={setupUrgentModalOpen} 
        onClose={() => setSetupUrgentModalOpen(false)} 
      />
    </div>
  );
};
