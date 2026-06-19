import { useState, useEffect } from 'react';
import { X, Calendar, User, FileText, ArrowRight, Activity } from 'lucide-react';
import { JOB_PHASE_CONFIG } from '../constants';
import { supabase } from '../../../lib/supabase';
import type { JobPhase } from '../types';
import DOMPurify from 'dompurify';

interface JobPhaseHistoryItem {
  id: string;
  job_id: string;
  phase: JobPhase;
  phase_memo: string | null;
  changed_by_id: string;
  changed_at: string;
  changed_by_name: string | null;
  changed_by_email: string | null;
}

interface JobPhaseHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
}

export const JobPhaseHistoryModal = ({ 
  isOpen, 
  onClose, 
  jobId
}: JobPhaseHistoryModalProps) => {
  const [history, setHistory] = useState<JobPhaseHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && jobId) {
      loadHistory();
    }
  }, [isOpen, jobId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_job_phase_history', {
        p_job_id: jobId
      });

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error('Error loading job phase history:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity" 
        onClick={onClose}
      />

      <div className="bg-white dark:bg-gray-800 backdrop-blur-md rounded-xl overflow-hidden shadow-2xl transform transition-all sm:max-w-2xl sm:w-full z-10 flex flex-col max-h-[85vh] border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity size={20} className="text-brand-600" />
            Lịch sử thay đổi Phase
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 overflow-y-auto custom-scrollbar flex-1">
          {loading ? (
            <div className="py-12 text-center text-gray-500 flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
              <span className="text-sm">Đang tải...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-gray-500 italic text-sm">
              Chưa có lịch sử thay đổi
            </div>
          ) : (
            <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-4 space-y-8 pl-6 my-2">
              {history.map((item, index) => {
                const phaseConfig = JOB_PHASE_CONFIG[item.phase];
                const prevItem = index < history.length - 1 ? history[index + 1] : null;
                const isPhaseChange = !prevItem || prevItem.phase !== item.phase;

                return (
                  <div key={item.id} className="relative">
                    {/* Timeline Dot */}
                    <div className={`absolute -left-[33px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 shadow-sm ${
                      isPhaseChange ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`} />

                    <div className="flex flex-col gap-2">
                      {/* Timestamp & User */}
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-1">
                        <div className="flex items-center gap-1 font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                          <Calendar size={12} />
                          {new Date(item.changed_at).toLocaleString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <User size={12} />
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {item.changed_by_name || 'System'}
                          </span>
                        </div>
                      </div>

                      {/* Content Box */}
                      <div className="bg-gray-50/80 dark:bg-gray-700/40 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-700/60">
                        {isPhaseChange ? (
                          <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-600 border-dashed last:border-0 last:mb-0 last:pb-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                {prevItem ? JOB_PHASE_CONFIG[prevItem.phase]?.displayName || prevItem.phase : 'Khởi tạo'}
                              </span>
                              <ArrowRight size={14} className="text-gray-400" />
                              <div className={`px-2.5 py-1 rounded-md text-sm font-semibold border ${phaseConfig ? `${phaseConfig.columnBg} ${phaseConfig.text} ${phaseConfig.border}` : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                {phaseConfig?.displayName || item.phase}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mb-2 text-sm text-gray-500 dark:text-gray-400 italic flex items-center gap-1.5">
                            <FileText size={14} />
                            Cập nhật ghi chú
                          </div>
                        )}

                        {/* Memo */}
                        {item.phase_memo && (
                          <div className="mt-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600 shadow-inner">
                            <div
                              className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2"
                              dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(item.phase_memo)
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 flex justify-end shrink-0 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            className="inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-5 py-2 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
