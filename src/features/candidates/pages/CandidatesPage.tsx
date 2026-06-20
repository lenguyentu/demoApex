// @ts-nocheck
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Plus,
  UploadCloud,
  
  Eye,
  Loader2,
  Briefcase,
  FileText,
  Star,
} from 'lucide-react';
import { useDeleteCandidate, useCandidatesList } from '../hooks';
import { useAuthStore } from '../../auth/store';
import type { Candidate, DatabaseCandidate } from '../types';
import type { GetCandidatesParams } from '../api';
import useDebounce from '../../../hooks/useDebounce';
import { AddCandidateModal, DocumentViewerModal, BatchImportModal } from '../components';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { LoadMoreButton } from '../../../components/LoadMoreButton';

type CandidateMode = 'my' | 'database';

interface CandidatesPageProps {
  mode: CandidateMode;
}

export function CandidatesPage({ mode }: CandidatesPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [cddCodeFilter, setCddCodeFilter] = useState('');
  const [potentialFilter, setPotentialFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 400);
  const debouncedPosition = useDebounce(positionFilter, 400);
  const debouncedCddCode = useDebounce(cddCodeFilter, 400);

  const { can } = useAuthStore();

  // Permissions
  const canCreate = can('create_candidate');

  // Filters object
  const currentFilters = useMemo<GetCandidatesParams>(() => ({
    search: debouncedSearch,
    position: debouncedPosition,
    cddCode: debouncedCddCode,
    isPotential: potentialFilter === 'yes' ? true : undefined
  }), [debouncedSearch, debouncedPosition, debouncedCddCode, potentialFilter]);

  // My Candidates với hook mới
  const {
    data: myCandidates,
    loading: loadingMy,
    hasMore: hasMoreMy,
    loadMore: loadMoreMy,
    totalCount: totalMy,
    refresh: refreshMy,
  } = useCandidatesList<Candidate>('my', currentFilters);

  // Database Candidates với hook mới
  const {
    data: dbCandidates,
    loading: loadingDb,
    hasMore: hasMoreDb,
    loadMore: loadMoreDb,
    totalCount: totalDb,
    refresh: refreshDb,
  } = useCandidatesList<DatabaseCandidate>('database', currentFilters);

  const deleteMutation = useDeleteCandidate();

  // Current data based on mode
  const currentData = mode === 'my' ? myCandidates : dbCandidates;
  const isLoading = mode === 'my' ? loadingMy : loadingDb;
  const hasMore = mode === 'my' ? hasMoreMy : hasMoreDb;
  const loadMore = mode === 'my' ? loadMoreMy : loadMoreDb;
  const totalCount = mode === 'my' ? totalMy : totalDb;

  const [candidateToDelete, setCandidateToDelete] = useState<{ id: string; name: string } | null>(null);
  const [viewingCandidate, setViewingCandidate] = useState<Candidate | DatabaseCandidate | null>(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  const handleDelete = async () => {
    if (!candidateToDelete) return;
    try {
      await deleteMutation.mutateAsync(candidateToDelete.id);
      setCandidateToDelete(null);
      // Reload list after delete
      if (mode === 'my') {
        refreshMy();
      } else {
        refreshDb();
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  // Title based on mode
  const pageTitle = mode === 'my' ? 'My Candidates' : 'Database Candidates';
  const pageDescription = mode === 'my'
    ? 'Quản lý ứng viên của bạn'
    : 'Danh sách tất cả ứng viên trong hệ thống';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
          <p className="text-sm text-gray-500 mt-1">{pageDescription}</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-gray-100 p-1 rounded-lg shrink-0">
          <Link
            to="/candidates/my"
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              mode === 'my' ? 'bg-white shadow text-brand-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Candidates
          </Link>
          <Link
            to="/candidates"
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              mode === 'database' ? 'bg-white shadow text-brand-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Candidate Database
          </Link>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Search by name/email/phone */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm theo tên, email, SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
            />
          </div>
          {/* Filter by applied_position */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Lọc theo vị trí ứng tuyển..."
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Filter by cdd_code */}
          <div className="relative flex-1 min-w-[150px] max-w-[200px]">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Lọc theo mã ứng viên..."
              value={cddCodeFilter}
              onChange={(e) => setCddCodeFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Filter by Potential Button */}
          <button
            onClick={() => setPotentialFilter(prev => prev === 'yes' ? '' : 'yes')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all text-sm font-medium ${
              potentialFilter === 'yes'
                ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Star 
              size={18} 
              className={potentialFilter === 'yes' ? 'fill-amber-500 text-amber-500' : 'text-gray-400'} 
            />
            Hot Profile
          </button>
          <div className="text-sm text-gray-500">
            {totalCount !== null && (
              <>
                Tổng: <span className="font-semibold text-gray-700">{totalCount}</span> ứng viên
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mode === 'my' && canCreate && (
            <>
              <button
                onClick={() => setIsBatchModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium shadow-sm"
              >
                <UploadCloud size={18} />
                Import Batch
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition font-medium shadow-sm"
              >
                <Plus size={18} />
                Thêm ứng viên
              </button>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[80px]">
                  Mã
                </th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[140px]">
                  Tên
                </th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[180px]">
                  Email
                </th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[110px]">
                  Điện thoại
                </th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[100px]">
                  Địa chỉ
                </th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[160px]">
                  Vị trí ứng tuyển
                </th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[100px]">
                  Ngày tạo
                </th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[100px]">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && currentData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-500" />
                    <p className="mt-2 text-sm text-gray-500">Đang tải dữ liệu...</p>
                  </td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    {debouncedSearch || debouncedPosition
                      ? 'Không tìm thấy ứng viên phù hợp'
                      : 'Không có ứng viên nào'}
                  </td>
                </tr>
              ) : (
                currentData.map((candidate: Candidate | DatabaseCandidate) => (
                  <tr key={candidate.id} className="hover:bg-gray-50 transition">
                    <td className="px-3 py-3 font-mono text-xs text-brand-600 font-bold">
                      {candidate.cdd_code || '---'}
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        target="_blank"
                        to={`/candidates/${candidate.id}?type=${mode}`}
                        className="font-medium text-gray-900 hover:text-brand-600 transition-colors flex items-center gap-1"
                      >
                        {candidate.name}
                        {(candidate as any).is_potential && (
                             <Star size={14} className="text-amber-500 fill-amber-500" />
                        )}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600 truncate max-w-[170px]" title={candidate.email || ''}>{candidate.email || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">{candidate.phone || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-600 truncate max-w-[90px]" title={candidate.address || ''}>{candidate.address || '-'}</td>
                    <td className="px-3 py-3 max-w-[150px]">
                      {candidate.applied_position ? (
                        <span
                          className="inline-block max-w-full truncate px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                          title={candidate.applied_position}
                        >
                          {candidate.applied_position}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">
                      {(candidate as any).created_at ? new Date((candidate as any).created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {candidate.cv_link && (
                          <button
                            onClick={() => {
                              setViewingCandidate(candidate);
                              setIsDocumentModalOpen(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Xem CV"
                          >
                            <FileText size={15} />
                          </button>
                        )}
                        <Link
                          target="_blank"
                          to={`/candidates/${candidate.id}?type=${mode}`}
                          className="p-1.5 text-gray-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition"
                          title="Xem chi tiết"
                        >
                          <Eye size={15} />
                        </Link>
                        {/* {canUpdate && (
                          <Link
                            to={`/candidates/${candidate.id}?type=${mode}&edit=true`}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                            title="Chỉnh sửa"
                          >
                            <Edit size={15} />
                          </Link>
                        )} */}
                        {/* {canDelete && (
                          <button
                            onClick={() => setCandidateToDelete({ id: candidate.id, name: candidate.name })}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Xóa"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 size={15} />
                          </button>
                        )} */}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Load More Button */}
        <div className="flex justify-center px-6 py-4 border-t border-gray-200 bg-gray-50">
          <LoadMoreButton
            onClick={loadMore}
            loading={isLoading}
            hasMore={hasMore}
            loadedCount={currentData.length}
            totalCount={mode === 'my' ? totalMy : totalDb}
          />
        </div>


        {/* End of list indicator */}
        {!hasMore && currentData.length > 0 && (
          <div className="text-center px-6 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-400">
            Đã hiển thị tất cả {currentData.length} ứng viên
          </div>
        )}
      </div>

      {/* Batch Import Modal */}
      <BatchImportModal 
        open={isBatchModalOpen} 
        onClose={() => setIsBatchModalOpen(false)} 
        onSuccess={refreshMy} 
      />

      {/* Add Candidate Modal */}
      <AddCandidateModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={refreshMy}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={!!candidateToDelete}
        onClose={() => setCandidateToDelete(null)}
        onConfirm={handleDelete}
        title="Xóa ứng viên"
        message={`Bạn có chắc chắn muốn xóa ứng viên "${candidateToDelete?.name}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={isDocumentModalOpen}
        onClose={() => {
          setIsDocumentModalOpen(false);
          setViewingCandidate(null);
        }}
        cvUrl={viewingCandidate?.cv_link}
        evaluationUrl={viewingCandidate?.evaluation_file_path}
        initialTab="cv"
      />
    </div>
  );
}
