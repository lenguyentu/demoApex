import { useState, useEffect } from 'react';
import { X, FileText, Activity, Calendar, User, ArrowRight } from 'lucide-react';
import { getSalesFinanceHistory } from '../api';
import type { ClientDebtItem } from '../utils';

interface DebtHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ClientDebtItem | null;
}

export function DebtHistoryModal({ isOpen, onClose, item }: DebtHistoryModalProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && item?.finance?.sales_id) {
      loadHistory();
    } else {
      setHistory([]);
    }
  }, [isOpen, item]);

  const loadHistory = async () => {
    if (!item?.finance?.sales_id) return;
    setLoading(true);
    try {
      const data = await getSalesFinanceHistory(item.finance.sales_id);
      setHistory(data);
    } catch (error) {
      console.error('Failed to load history', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity" 
        onClick={onClose}
      ></div>

      <div className="bg-white/95 dark:bg-gray-800/90 backdrop-blur-md rounded-xl overflow-hidden shadow-2xl transform transition-all w-full max-w-2xl z-10 flex flex-col max-h-[85vh] border border-white/20">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 shrink-0">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Activity size={20} className="text-brand-600" />
            Debt Collection History
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 overflow-y-auto custom-scrollbar flex-1 bg-transparent">
          {loading ? (
             <div className="py-12 text-center text-gray-500 flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                <span className="text-sm">Loading data...</span>
             </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-gray-500 italic">No modification history found.</div>
          ) : (
            <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-4 space-y-8 pl-6 my-2">
              {history.map((log) => {
                // Determine what changed
                const noteChanged = log.new_note !== log.old_note;
                const p1Changed = log.new_p1_paid_amount !== log.old_p1_paid_amount;
                const p2Changed = log.new_p2_paid_amount !== log.old_p2_paid_amount;
                const p1ExpChanged = log.new_p1_amount !== log.old_p1_amount;
                const p2ExpChanged = log.new_p2_amount !== log.old_p2_amount;
                const statusChanged = log.new_overall_status !== log.old_overall_status;

                return (
                  <div key={log.id} className="relative">
                    {/* Timeline Dot */}
                    <div className={`absolute -left-[33px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 shadow-sm ${
                        statusChanged ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}></div>
                    
                    <div className="flex flex-col gap-2">
                       {/* Meta Info */}
                       <div className="flex items-center gap-3 text-xs text-gray-500 mb-1">
                          <div className="flex items-center gap-1 font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                            <Calendar size={12} />
                            {formatDate(log.created_at)}
                          </div>
                          <div className="flex items-center gap-1">
                            <User size={12} />
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {log.users?.full_name || 'System'}
                            </span>
                          </div>
                       </div>

                       {/* Content Box */}
                       <div className="bg-gray-50/80 dark:bg-gray-700/40 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-700/60">
                          
                          {/* Status Change - Fancy Header style */}
                          {statusChanged && (
                              <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-600 border-dashed">
                                 <div className="flex items-center gap-2 flex-wrap text-sm">
                                    <span className="font-medium text-gray-500">
                                        {log.old_overall_status || 'Initialize'}
                                    </span>
                                    <ArrowRight size={14} className="text-gray-400" />
                                    <div className={`px-2 py-0.5 rounded text-xs font-bold border uppercase tracking-wider
                                        ${log.new_overall_status === 'Done' ? 'bg-green-50 border-green-200 text-green-700' : 
                                          log.new_overall_status === 'Cancel' ? 'bg-gray-50 border-gray-200 text-gray-500' : 
                                          'bg-amber-50 border-amber-200 text-amber-700'}
                                    `}>
                                        {log.new_overall_status || 'Empty'}
                                    </div>
                                 </div>
                              </div>
                          )}

                          {/* Data Changes Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             {(p1Changed || p1ExpChanged) && (
                                <div className="space-y-1">
                                    <div className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Phase 1</div>
                                    <div className="text-sm flex flex-col">
                                       {p1ExpChanged && (
                                         <div className="text-gray-500 line-through text-xs">Expected: {Number(log.old_p1_amount || 0).toLocaleString()} VND</div>
                                       )}
                                       <div className="text-gray-900 font-semibold">
                                         {Number(log.new_p1_amount || 0).toLocaleString()} VND 
                                         <span className="text-xs text-green-600 ml-2">(Collected: {Number(log.new_p1_paid_amount || 0).toLocaleString()} VND)</span>
                                       </div>
                                    </div>
                                </div>
                             )}
                             
                             {(p2Changed || p2ExpChanged) && (
                                <div className="space-y-1">
                                    <div className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Phase 2</div>
                                    <div className="text-sm flex flex-col">
                                       {p2ExpChanged && (
                                          <div className="text-gray-500 line-through text-xs">Expected: {Number(log.old_p2_amount || 0).toLocaleString()} VND</div>
                                       )}
                                       <div className="text-gray-900 font-semibold">
                                          {Number(log.new_p2_amount || 0).toLocaleString()} VND
                                          <span className="text-xs text-green-600 ml-2">(Collected: {Number(log.new_p2_paid_amount || 0).toLocaleString()} VND)</span>
                                       </div>
                                    </div>
                                </div>
                             )}
                          </div>

                          {/* Note Display */}
                          {noteChanged && log.new_note && (
                              <div className="mt-3 text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200 shadow-inner flex gap-2">
                                 <FileText size={16} className="text-brand-500 shrink-0 mt-0.5" />
                                 <div className="italic leading-relaxed">{log.new_note}</div>
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
        <div className="bg-gray-50/50 px-6 py-4 flex justify-end shrink-0 border-t border-gray-200">
           <button
              type="button"
              className="inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-5 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors"
              onClick={onClose}
            >
              Close
            </button>
        </div>
      </div>
    </div>
  );
}
