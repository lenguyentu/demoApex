import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { useBatchAssignJobFocus, useCurrentWeekStart } from '../hooks';
import { useQuery } from '@tanstack/react-query';
import { ClientSelect } from '../../../components/ClientSelect';
import { supabase } from '../../../lib/supabase';

interface AssignJobFocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedAssigneeId?: string;
  preSelectedAssigneeName?: string;
  existingJobIds?: string[]; // Job IDs đã được giao cho member này
  onSuccess?: () => void;
}

export default function AssignJobFocusModal({ 
  isOpen, 
  onClose, 
  preSelectedAssigneeId,
  preSelectedAssigneeName,
  existingJobIds = [],
  onSuccess 
}: AssignJobFocusModalProps) {
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [searchJob, setSearchJob] = useState('');
  const [selectedClient, setSelectedClient] = useState('');

  const { data: jobs = [], isLoading: loadingJobs } = useQuery({
    queryKey: ['assignJobFocusJobs', selectedClient],
    queryFn: async () => {
      let query = supabase
        .from('jobs')
        .select('id, job_id, position_title, work_location, td_job_category, phase, clients(id, client_name, client_rank)')
        .in('phase', ['Open', 'Sourcing', 'On_Hold'])
        .order('created_at', { ascending: false })
        .limit(200);

      if (selectedClient) {
        query = query.eq('client_id', selectedClient);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });
  const { data: weekStart } = useCurrentWeekStart();
  const batchAssignMutation = useBatchAssignJobFocus();

  // Pre-select existing jobs when modal opens
  useEffect(() => {
    if (isOpen && existingJobIds.length > 0) {
      setSelectedJobIds(existingJobIds);
    }
  }, [isOpen, existingJobIds]);

  // Filter jobs by search
  const filteredJobs = jobs.filter(job => {
    const keyword = searchJob.toLowerCase().trim();
    if (!keyword) return true;

    const rawClient = (job as any).clients;
    const clientName = Array.isArray(rawClient)
      ? (rawClient[0]?.client_name || '')
      : (rawClient?.client_name || '');

    return (
      (job.position_title || '').toLowerCase().includes(keyword) ||
      (job.job_id || '').toLowerCase().includes(keyword) ||
      clientName.toLowerCase().includes(keyword)
    );
  });

  const handleToggleJob = (jobId: string) => {
    setSelectedJobIds(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preSelectedAssigneeId || !weekStart) return;

    try {
      // Tìm jobs cần thêm mới (có trong selected nhưng không có trong existing)
      const jobsToAdd = selectedJobIds.filter(id => !existingJobIds.includes(id));
      
      // Tìm jobs cần xóa (có trong existing nhưng không có trong selected)
      const jobsToRemove = existingJobIds.filter(id => !selectedJobIds.includes(id));

      // Nếu không có thay đổi gì
      if (jobsToAdd.length === 0 && jobsToRemove.length === 0) {
        alert('Không có thay đổi nào để lưu');
        return;
      }

      // 1. Insert jobs mới
      if (jobsToAdd.length > 0) {
        await batchAssignMutation.mutateAsync({
          jobIds: jobsToAdd,
          assigneeId: preSelectedAssigneeId,
          weekStart: weekStart,
          note: note.trim() || undefined,
        });
      }

      // 2. Delete jobs bị bỏ tích
      if (jobsToRemove.length > 0) {
        // Lấy assignment IDs cần xóa
        const { data: assignmentsToDelete, error: fetchError } = await supabase
          .from('job_focus_assignments')
          .select('id')
          .eq('assignee_id', preSelectedAssigneeId)
          .eq('week_start', weekStart)
          .in('job_id', jobsToRemove);

        if (fetchError) throw fetchError;

        if (assignmentsToDelete && assignmentsToDelete.length > 0) {
          const idsToDelete = assignmentsToDelete.map(a => a.id);
          const { error: deleteError } = await supabase
            .from('job_focus_assignments')
            .delete()
            .in('id', idsToDelete);

          if (deleteError) throw deleteError;
        }
      }

      onSuccess?.();
      onClose();
      setSelectedJobIds([]);
      setNote('');
      setSearchJob('');
      setSelectedClient('');
    } catch (error) {
      console.error('Failed to update job focus:', error);
      alert('Lỗi: ' + (error as any).message);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedJobIds([]);
      setNote('');
      setSearchJob('');
      setSelectedClient('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedJobs = jobs.filter(j => selectedJobIds.includes(j.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Giao Job Focus</h2>
            {preSelectedAssigneeName && (
              <p className="text-sm text-gray-500 mt-0.5">
                Giao cho: <span className="font-medium text-gray-700">{preSelectedAssigneeName}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-2 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchJob}
                  onChange={(e) => setSearchJob(e.target.value)}
                  placeholder="Tìm theo mã job (TDC00X), tên..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm"
                />
              </div>

              {/* Client Filter */}
              <ClientSelect
                value={selectedClient}
                onChange={setSelectedClient}
                placeholder="Lọc theo khách hàng..."
              />
            </div>

            {/* Job List with Checkboxes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn Jobs <span className="text-red-500">*</span>
                {selectedJobIds.length > 0 && (
                  <span className="ml-2 text-brand-600">({selectedJobIds.length} đã chọn)</span>
                )}
              </label>
              
              <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                {loadingJobs ? (
                  <div className="p-4 text-center text-sm text-gray-500">Đang tải...</div>
                ) : filteredJobs.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    {searchJob || selectedClient ? 'Không tìm thấy job' : 'Không có open job nào'}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredJobs.map(job => {
                      const rawClient = (job as any).clients;
                      const clientName = Array.isArray(rawClient)
                        ? (rawClient[0]?.client_name || 'N/A')
                        : (rawClient?.client_name || 'N/A');
                      const clientRank = Array.isArray(rawClient)
                        ? rawClient[0]?.client_rank
                        : rawClient?.client_rank;
                      const isSelected = selectedJobIds.includes(job.id);
                      const isExisting = existingJobIds.includes(job.id);
                      
                      return (
                        <label
                          key={job.id}
                          className={`flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                            isSelected ? 'bg-brand-50' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleJob(job.id)}
                            className="mt-1 accent-brand-500 w-4 h-4"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {job.position_title || 'Untitled'}
                                  </p>
                                  {isExisting && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
                                      Đã giao
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {job.job_id && <span className="font-mono font-medium text-brand-600">{job.job_id}</span>}
                                  {job.job_id && ' · '}
                                  {clientName} · {job.work_location || 'N/A'}
                                </p>
                              </div>
                              {clientRank && (
                                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${
                                  clientRank === 'S+' || clientRank === 'S' ? 'bg-red-100 text-red-600' : 
                                  clientRank === 'A' ? 'bg-orange-100 text-orange-600' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {clientRank}
                                </span>
                              )}
                            </div>
                            {job.td_job_category && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                {job.td_job_category}
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Jobs Preview */}
            {selectedJobs.length > 0 && (
              <div className="bg-brand-50 border border-brand-200 rounded-lg p-4">
                <p className="text-xs text-brand-600 font-medium mb-2">
                  Jobs đã chọn ({selectedJobs.length}):
                </p>
                <div className="space-y-1.5">
                  {selectedJobs.map(job => (
                    <div key={job.id} className="flex items-center justify-between text-sm bg-white rounded px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-gray-900">{job.position_title}</span>
                        <span className="text-gray-500 ml-2">
                          {job.job_id && <span className="font-mono text-xs">({job.job_id})</span>}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleJob(job.id)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
                rows={3}
                placeholder="Ví dụ: Focus vào senior level, deadline tuần này..."
              />
            </div>

            {/* Week info */}
            {weekStart && (
              <div className="text-xs text-gray-500">
                Tuần: <span className="font-mono font-semibold">{weekStart}</span>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={batchAssignMutation.isPending}
              className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {batchAssignMutation.isPending ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
