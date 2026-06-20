// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Loader2, Search, Plus, Trash2, Eye, MapPin, Users, Clock, Flame } from 'lucide-react';
import toast from 'react-hot-toast';
import { useJobsList, useUrgentJobTitle, useUpdateUrgentJobsSetupMutation, useUrgentJobs } from '../hooks';
import type { Job, UrgentInfo } from '../types';

interface SetupUrgentJobsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SelectedJobConfig {
  id: string;
  job: Job;
  urgent_info: UrgentInfo;
}

export const SetupUrgentJobsModal: React.FC<SetupUrgentJobsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { data: currentUrgentJobs = [], isLoading: urgentLoading } = useUrgentJobs();
  const { data: currentTitle, isLoading: titleLoading } = useUrgentJobTitle();
  const updateMutation = useUpdateUrgentJobsSetupMutation();

  const [title, setTitle] = useState('HOT JOB TUẦN NÀY - PROCESS NHANH');
  const [selectedConfigs, setSelectedConfigs] = useState<SelectedJobConfig[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Use useJobsList for server-side search
  const { data: searchResultsData = [], loading: searchLoading } = useJobsList({
    mode: 'open',
    search: debouncedSearch
  });
  
  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (currentTitle) setTitle(currentTitle);
      
      const initialConfigs = currentUrgentJobs.map(job => ({
        id: job.id,
        job,
        urgent_info: job.urgent_info || { tag1: '🔥 HOT', tag2: 'PROCESS 24H', note: 'Feedback CV trong 24h' }
      }));
      setSelectedConfigs(initialConfigs.slice(0, 5)); // Max 5
    }
  }, [isOpen, currentUrgentJobs, currentTitle]);


  const handleAddJob = (job: Job) => {
    if (selectedConfigs.length >= 5) {
      toast.error('Chỉ được chọn tối đa 5 Job Gấp');
      return;
    }
    if (selectedConfigs.find(c => c.id === job.id)) {
      toast.error('Job này đã được chọn');
      return;
    }
    setSelectedConfigs([
      ...selectedConfigs,
      {
        id: job.id,
        job,
        urgent_info: { tag1: '🔥 HOT', tag2: 'PROCESS 24H', note: 'Feedback CV trong 24h' }
      }
    ]);
    setSearch('');
  };

  const handleRemoveJob = (id: string) => {
    setSelectedConfigs(selectedConfigs.filter(c => c.id !== id));
  };

  const handleUpdateConfig = (id: string, field: keyof UrgentInfo, value: string) => {
    setSelectedConfigs(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          urgent_info: { ...c.urgent_info, [field]: value }
        };
      }
      return c;
    }));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề khu vực');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        title,
        selectedJobs: selectedConfigs.map(c => ({
          id: c.id,
          urgent_info: c.urgent_info
        }))
      });
      toast.success('Lưu cài đặt Job Gấp thành công');
      onClose();
    } catch (error) {
      console.error('Error saving urgent setup:', error);
      toast.error('Có lỗi xảy ra khi lưu cài đặt');
    }
  };

  // Filter available jobs for dropdown
  const searchResults = useMemo(() => {
    if (!debouncedSearch.trim()) return [];
    return searchResultsData
      .filter(job => 
        !selectedConfigs.some(c => c.id === job.id) && // Not already selected
        (job.assignment_type === 'Freelancer' || job.assignment_type === 'CTV') // Only allow Freelancer/CTV jobs
      )
      .slice(0, 5); // Show top 5 matches
  }, [searchResultsData, debouncedSearch, selectedConfigs]);



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col my-auto">
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 rounded-t-xl shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Flame size={20} className="text-orange-500 fill-orange-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Cài đặt Top 5 Job Gấp
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {(urgentLoading || titleLoading) ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500 mb-4" />
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              
              {/* LEFT COLUMN: Configuration */}
              <div className="flex-1 space-y-6">
                {/* 1. Global Title */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 text-brand-600 text-xs">1</span>
                    Tiêu đề Khu vực (Hiển thị to nhất)
                  </h3>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 text-lg font-bold border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
                    placeholder="VD: HOT JOB TUẦN NÀY - PROCESS NHANH"
                  />
                </div>

                {/* 2. Job Selection */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 text-brand-600 text-xs">2</span>
                      Danh sách Job Gấp ({selectedConfigs.length}/5)
                    </h3>
                  </div>

                  {/* Search / Add Job */}
                  {selectedConfigs.length < 5 && (
                    <div className="relative mb-6 z-20">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Tìm job để thêm vào danh sách gấp (Gõ tên, mã job, công ty)..."
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      
                      {/* Search Results Dropdown */}
                      {search.trim() && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
                          {searchLoading && (
                            <div className="p-3 text-sm text-gray-500 text-center flex items-center justify-center gap-2">
                              <Loader2 size={14} className="animate-spin" />
                              Đang tìm kiếm...
                            </div>
                          )}
                          {!searchLoading && searchResults.length === 0 && (
                            <div className="p-4 text-center text-gray-500 text-sm">
                              Không tìm thấy Job (chỉ hỗ trợ job Open và loại Freelancer/CTV)
                            </div>
                          )}
                          {!searchLoading && searchResults.map(job => (
                            <button
                              key={job.id}
                              onClick={() => handleAddJob(job)}
                              className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors"
                            >
                              <div className="flex-1 min-w-0 pr-4">
                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                  {job.position_title}
                                </p>
                                <p className="text-xs text-gray-500 truncate mt-0.5">
                                  {job.job_id} • {job.clients?.client_name} • {job.assignment_type}
                                </p>
                              </div>
                              <Plus size={18} className="text-brand-500 shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                      {search.trim() && searchResults.length === 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
                          Không tìm thấy Job (chỉ hỗ trợ job Open và loại Freelancer/CTV)
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selected Jobs List */}
                  <div className="space-y-4">
                    {selectedConfigs.length === 0 ? (
                      <div className="p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-center text-gray-500">
                        Chưa có Job nào được chọn. Vui lòng tìm kiếm và thêm ở trên.
                      </div>
                    ) : (
                      selectedConfigs.map((config, index) => (
                        <div key={config.id} className="relative bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 pr-12 transition-all hover:border-brand-300">
                          {/* Remove button */}
                          <button
                            onClick={() => handleRemoveJob(config.id)}
                            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                            title="Loại khỏi danh sách"
                          >
                            <Trash2 size={16} />
                          </button>

                          <div className="flex items-start gap-3 mb-4">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 text-brand-600 font-bold text-xs shrink-0 mt-0.5">
                              {index + 1}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                {config.job.position_title}
                              </h4>
                              <p className="text-xs text-gray-500 truncate mt-1">
                                {config.job.clients?.client_name} • {(config.job.min_monthly_salary || config.job.max_monthly_salary) ? `${config.job.min_monthly_salary} - ${config.job.max_monthly_salary}` : 'Thỏa thuận'}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pl-9">
                            <div>
                              <label className="block text-[11px] font-medium text-gray-500 mb-1">Tag 1 (VD: 🔥 HOT)</label>
                              <input
                                type="text"
                                value={config.urgent_info.tag1 || ''}
                                onChange={(e) => handleUpdateConfig(config.id, 'tag1', e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 focus:ring-1 focus:ring-brand-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-gray-500 mb-1">Tag 2 (VD: PROCESS 24H)</label>
                              <input
                                type="text"
                                value={config.urgent_info.tag2 || ''}
                                onChange={(e) => handleUpdateConfig(config.id, 'tag2', e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 focus:ring-1 focus:ring-brand-500"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-[11px] font-medium text-gray-500 mb-1">Ghi chú (VD: Feedback CV trong 24h)</label>
                              <input
                                type="text"
                                value={config.urgent_info.note || ''}
                                onChange={(e) => handleUpdateConfig(config.id, 'note', e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 focus:ring-1 focus:ring-brand-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Live Preview */}
              <div className="w-full lg:w-[380px] shrink-0">
                <div className="sticky top-0 bg-white dark:bg-gray-800 rounded-xl p-4 md:p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <Eye size={16} /> Xem trước giao diện Freelancer
                  </h3>
                  
                  <div className="p-4 bg-gradient-to-r from-pink-50/80 to-white dark:from-pink-900/10 dark:to-gray-800 rounded-xl border border-pink-100/50 dark:border-pink-900/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-pink-100/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    
                    {/* Fake Header */}
                    <div className="flex items-center gap-2 mb-4 relative z-10">
                      <Flame className="w-5 h-5 text-pink-600 fill-pink-600" />
                      <h4 className="text-sm font-black text-gray-900 dark:text-white tracking-tight uppercase line-clamp-2">
                        {title || 'TIÊU ĐỀ KHU VỰC'}
                      </h4>
                    </div>

                    {/* Fake Cards List */}
                    {selectedConfigs.length > 0 ? (
                      <div className="space-y-4 relative z-10 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                        {selectedConfigs.map((config, index) => (
                          <div key={config.id} className="bg-white dark:bg-gray-800 rounded-xl border border-pink-100 dark:border-pink-900/50 shadow-sm flex flex-col p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="text-xl font-black text-pink-400">{index + 1}</span>
                              <div className="flex gap-2">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-600 uppercase">
                                  {config.urgent_info.tag1 || 'TAG 1'}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-600 uppercase">
                                  {config.urgent_info.tag2 || 'TAG 2'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="mb-4">
                              <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight mb-1.5">
                                <span className="text-purple-600 mr-2">[{config.job.job_id || config.job.job_code || '-'}]</span>
                                {config.job.position_title}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {config.job.clients?.client_name || 'Tên Công Ty'} (sẽ bị ẩn)
                              </p>
                              <div className="text-sm font-bold text-green-600 mt-1.5">
                                {(config.job.min_monthly_salary || config.job.max_monthly_salary) 
                                  ? `${config.job.min_monthly_salary} - ${config.job.max_monthly_salary}` 
                                  : 'Thỏa thuận'}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-y-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                <span>{config.job.work_location || 'Địa điểm'}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 shrink-0" />
                                <span>{config.job.interview_rounds ? `${config.job.interview_rounds} openings` : '1 opening'}</span>
                              </div>
                              <div className="col-span-2 flex items-start gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium mt-1">
                                <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                <span className="whitespace-pre-wrap">{config.urgent_info.note || 'Ghi chú thêm...'}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white/50 border border-dashed border-pink-200 rounded-xl p-6 text-center text-sm text-gray-500 relative z-10">
                        Chưa có Job nào để hiển thị
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-b-xl shrink-0 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={updateMutation.isPending || urgentLoading}
            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-brand-600 border border-transparent rounded-lg hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save size={16} />
                Lưu Cấu Hình
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
