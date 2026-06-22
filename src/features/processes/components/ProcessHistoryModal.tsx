import { useState, useEffect } from 'react';
import { X, Calendar, User, FileText, ArrowRight, Activity } from 'lucide-react';
import { STATUS_CONFIG } from '../constants';
import { getProcessHistory } from '../api';
import DOMPurify from 'dompurify';

interface ProcessHistoryItem {
  id: string;
  process_id: string;
  status: string;
  note_snapshot: string | null;
  change_memo: string | null;
  changed_by_id: string;
  created_at: string;
  changed_by_user?: {
    full_name: string;
    email: string;
  };
}

interface ProcessHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  processId: string;
}

export const ProcessHistoryModal = ({ isOpen, onClose, processId }: ProcessHistoryModalProps) => {
  const [history, setHistory] = useState<ProcessHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && processId) {
      loadHistory();
    }
  }, [isOpen, processId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getProcessHistory(processId);
      setHistory(data as any);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity" 
        onClick={onClose}
      ></div>

      <div className="bg-white/95 dark:bg-gray-800/90 backdrop-blur-md rounded-xl overflow-hidden shadow-2xl transform transition-all sm:max-w-2xl sm:w-full z-10 flex flex-col max-h-[85vh] border border-white/20">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 shrink-0">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Activity size={20} className="text-brand-600" />
              Lịch sử thay đổi
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="px-6 py-6 overflow-y-auto custom-scrollbar flex-1 bg-transparent">
            {loading ? (
              <div className="py-12 text-center text-gray-500 flex flex-col items-center gap-2">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                 <span className="text-sm">Loading data...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="py-12 text-center text-gray-500 italic">No change history yet.</div>
            ) : (
                <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-4 space-y-8 pl-6 my-2">
                  {history.map((item, index) => {
                    const statusConfig = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG];
                    const prevItem = index < history.length - 1 ? history[index + 1] : null;
                    const isStatusChange = !prevItem || prevItem.status !== item.status;

                    return (
                      <div key={item.id} className="relative">
                        {/* Timeline Dot */}
                        <div className={`absolute -left-[33px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 shadow-sm ${
                            isStatusChange ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}></div>

                        <div className="flex flex-col gap-2">
                           <div className="flex items-center gap-3 text-xs text-gray-500 mb-1">
                              <div className="flex items-center gap-1 font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                <Calendar size={12} />
                                {new Date(item.created_at).toLocaleString('vi-VN', { 
                                  day: '2-digit', month: '2-digit', year: 'numeric', 
                                  hour: '2-digit', minute: '2-digit' 
                                })}
                              </div>
                              <div className="flex items-center gap-1">
                                <User size={12} />
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                  {item.changed_by_user?.full_name || 'System'}
                                </span>
                              </div>
                           </div>

                           {/* Content Box */}
                           <div className="bg-gray-50/80 dark:bg-gray-700/40 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-700/60">
                              {isStatusChange ? (
                                  <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-600 border-dashed last:border-0 last:mb-0 last:pb-0">
                                     <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            {prevItem ? STATUS_CONFIG[prevItem.status as keyof typeof STATUS_CONFIG]?.displayName || prevItem.status : 'Initialized'}
                                        </span>
                                        <ArrowRight size={14} className="text-gray-400" />
                                        <div 
                                            className={`px-2.5 py-1 rounded-md text-sm font-semibold border flex items-center gap-2 shadow-sm
                                                ${statusConfig?.columnBg || 'bg-gray-100'}
                                                ${statusConfig?.border || 'border-gray-200'}
                                                ${statusConfig?.text || 'text-gray-700'}
                                            `}
                                        >
                                            {statusConfig?.icon && <statusConfig.icon size={14} />}
                                            {statusConfig?.displayName || item.status}
                                        </div>
                                     </div>
                                  </div>
                              ) : (
                                <div className="mb-2 text-sm text-gray-500 dark:text-gray-400 italic flex items-center gap-1.5">
                                   <FileText size={14} />
                                   Cập nhật thông tin / Ghi chú
                                </div>
                              )}

                              {/* Note Display with HTML Sanitization */}
                              {(item.note_snapshot || item.change_memo) && (
                                  <div className="mt-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600 shadow-inner">
                                      {/* Render HTML Content safely */}
                                      <div 
                                        className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2"
                                        dangerouslySetInnerHTML={{
                                          __html: DOMPurify.sanitize(item.note_snapshot || item.change_memo || '')
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
          
          <div className="bg-gray-50/50 dark:bg-gray-800/50 px-6 py-4 flex justify-end shrink-0 border-t border-gray-200 dark:border-gray-700">
             <button
                type="button"
                className="inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-5 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors"
                onClick={onClose}
              >
                Đóng
              </button>
          </div>
      </div>
    </div>
  );
};

