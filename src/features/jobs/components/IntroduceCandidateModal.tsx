import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Search, FileText, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import useDebounce from '../../../hooks/useDebounce';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../auth/store';
import AddCandidateModal from '../../candidates/components/AddCandidateModal';
import { sendHeadhunterAssignmentNotification } from '../../candidates/utils/notification';
import type { Job } from '../types';
import type { Candidate } from '../../candidates/types';

interface IntroduceCandidateModalProps {
  job: Job | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// --- SKELETON COMPONENT ---
const CandidateSkeleton = () => (
  <div className="p-3 border-b border-gray-100 last:border-b-0">
    <div className="flex flex-col gap-2 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
    </div>
  </div>
);

// --- CANDIDATE ITEM COMPONENT ---
const CandidateItem = ({
  candidate,
  onSelect,
}: {
  candidate: Candidate;
  onSelect: (c: Candidate) => void;
}) => (
  <div
    className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
    onClick={() => onSelect(candidate)}
  >
    <div className="flex items-center space-x-3">
      <div className="flex-1">
        <p className="font-medium text-gray-900">{candidate.name}</p>
        <p className="text-sm text-gray-600">
          {candidate.applied_position || 'Chưa có vị trí'}
        </p>
        <p className="text-xs text-gray-500">{candidate.email}</p>
        {candidate.cv_link ? (
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <FileText className="w-3 h-3 mr-1" />
              Có CV
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <AlertCircle className="w-3 h-3 mr-1" />
              Không có CV
            </span>
          </div>
        )}
      </div>
    </div>
  </div>
);

// --- MAIN COMPONENT ---
export const IntroduceCandidateModal = ({
  job,
  open,
  onClose,
  onSuccess,
}: IntroduceCandidateModalProps) => {
  const user = useAuthStore((state) => state.user);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null
  );
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.classList.add('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [open]);

  // Fetch candidates based on search - only user's candidates
  const fetchCandidates = useCallback(async (query: string) => {
    if (!user?.id) {
      setCandidates([]);
      setLoadingCandidates(false);
      return;
    }

    setLoadingCandidates(true);
    try {
      // MOCK FETCH
      const { MOCK_CANDIDATES } = await import('../../../mocks/candidates');
      let filtered = MOCK_CANDIDATES;
      if (query) {
        filtered = filtered.filter(c => 
          (c.full_name && c.full_name.toLowerCase().includes(query.toLowerCase())) ||
          (c.email && c.email.toLowerCase().includes(query.toLowerCase()))
        );
      }
      const mapped = filtered.map(c => ({
        id: c.id,
        name: c.full_name || 'No Name',
        email: c.email,
        phone: c.phone,
        applied_position: c.current_title,
        cv_link: null,
        address: 'Hà Nội'
      }));
      setCandidates(mapped as unknown as Candidate[]);
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
      setCandidates([]);
    } finally {
      setLoadingCandidates(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (open) {
      fetchCandidates(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, open, fetchCandidates]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSelectedCandidate(null);
      setReason('');
      setReasonError('');
    }
  }, [open]);

  const handleAddCandidateSuccess = (candidate?: import('../../candidates/types').Candidate) => {
    setIsAddModalOpen(false);
    fetchCandidates('');
    // Auto-select the newly created candidate to show the application form
    if (candidate) {
      setSelectedCandidate(candidate);
    }
  };

  const handleSubmitIntroduction = async () => {
    if (!selectedCandidate || !job) {
      toast.error('Vui lòng chọn ứng viên và công việc.');
      return;
    }

    if (!reason.trim()) {
      setReasonError('Vui lòng nhập lý do giới thiệu.');
      return;
    }
    setReasonError('');

    setIsSubmitting(true);

    try {
      // MOCK SUBMIT
      await new Promise(r => setTimeout(r, 500));
      toast.success(
        `Đã giới thiệu ứng viên "${selectedCandidate.name}" cho công việc "${job.position_title}"`
      );
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error applying candidate:', error);
      toast.error('Lỗi khi giới thiệu ứng viên');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open || !job) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white shadow-lg rounded-lg max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex flex-col gap-2 text-center sm:text-left shrink-0">
          <h2 className="text-2xl bg-pink-600 py-6 px-4 rounded-t-lg font-bold text-white tracking-wide">
            Giới thiệu Ứng viên
          </h2>
          <div className="px-4 pt-2 pb-2">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-900">
                Công việc:{' '}
                <span className="font-semibold">{job.position_title}</span>
              </p>
              <p className="text-sm text-blue-700">
                Công ty: {job.clients?.client_name ?? 'Không rõ'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white opacity-70 hover:opacity-100 disabled:opacity-50"
            disabled={isSubmitting}
          >
            <X size={24} />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto space-y-4 p-4">
          {selectedCandidate ? (
            // VIEW 2: Confirm and enter reason
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Xác nhận giới thiệu
              </h3>
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600">Bạn đang giới thiệu:</p>
                <p className="font-semibold text-lg text-gray-900">
                  {selectedCandidate.name}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedCandidate.email}
                </p>
              </div>
              <div>
                <label
                  htmlFor="reason"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Lý do giới thiệu <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="reason"
                  rows={4}
                  required
                  className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-pink-500 ${
                    reasonError
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder={`Tại sao ${selectedCandidate.name} phù hợp với vị trí này?`}
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (reasonError && e.target.value.trim()) {
                      setReasonError('');
                    }
                  }}
                  onBlur={() => {
                    if (!reason.trim()) {
                      setReasonError('Vui lòng nhập lý do giới thiệu.');
                    }
                  }}
                  disabled={isSubmitting}
                />
                {reasonError && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {reasonError}
                  </p>
                )}
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setSelectedCandidate(null);
                    setReason('');
                    setReasonError('');
                  }}
                  className="flex-1 h-10 px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Quay lại
                </button>
                <button
                  onClick={handleSubmitIntroduction}
                  className="flex-1 h-10 px-4 py-2 border rounded-md text-sm font-medium bg-pink-600 text-white hover:bg-pink-700 disabled:bg-pink-400 disabled:cursor-not-allowed inline-flex items-center justify-center"
                  disabled={isSubmitting || !reason.trim()}
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isSubmitting ? 'Đang giới thiệu...' : 'Xác nhận'}
                </button>
              </div>
            </div>
          ) : (
            // VIEW 1: Select or add candidate
            <>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Thêm Ứng viên mới
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 w-full h-9 px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-100"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm Ứng viên
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t"></span>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">hoặc</span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Chọn từ danh sách có sẵn
                </h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    className="h-9 w-full rounded-md border bg-transparent pl-10 pr-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Tìm kiếm theo tên hoặc email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                  {loadingCandidates ? (
                    <>
                      <CandidateSkeleton />
                      <CandidateSkeleton />
                    </>
                  ) : candidates.length > 0 ? (
                    candidates.map((candidate) => (
                      <CandidateItem
                        key={candidate.id}
                        candidate={candidate}
                        onSelect={setSelectedCandidate}
                      />
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500">
                      Không tìm thấy ứng viên.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Add Candidate Modal - must be inside stopPropagation div to prevent
            portal events (ConfirmModal, DiscordPreview) from bubbling to backdrop */}
        <AddCandidateModal
          open={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleAddCandidateSuccess}
        />
      </div>
    </div>
  );
};

export default IntroduceCandidateModal;
