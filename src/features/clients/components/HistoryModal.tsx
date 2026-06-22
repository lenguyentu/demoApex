import { X, Calendar, User, FileText, ArrowRight, Activity, Loader2 } from 'lucide-react';
import DOMPurify from 'dompurify';
import { useBDProcessHistory } from '../hooks';


interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  processId: string;
}

const PHASE_DISPLAY: Record<string, string> = {
  Connect: 'Connect',
  Quote: 'Quote',
  Contract_JD: 'Contract & JD',
  Dealed: 'Dealed'
};

const PHASE_COLORS: Record<string, string> = {
  Connect: 'bg-blue-100 text-blue-700 border-blue-200',
  Quote: 'bg-amber-100 text-amber-700 border-amber-200',
  Contract_JD: 'bg-purple-100 text-purple-700 border-purple-200',
  Dealed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export const HistoryModal = ({ isOpen, onClose, processId }: HistoryModalProps) => {
  const { data: history = [], isLoading } = useBDProcessHistory(isOpen ? processId : null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity" 
        onClick={onClose}
      />

      <div className="bg-white rounded-xl overflow-hidden shadow-2xl transform transition-all w-full max-w-2xl z-10 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50 shrink-0">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Activity size={20} className="text-brand-600" />
            BD Process History
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-1 hover:bg-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
          {isLoading ? (
            <div className="py-12 text-center text-gray-500 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
              <span className="text-sm font-medium">Loading history...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-gray-500 italic flex flex-col items-center justify-center h-full">
              <FileText className="w-12 h-12 text-gray-300 mb-2" />
              No history found.
            </div>
          ) : (
            <div className="relative border-l-2 border-gray-200 ml-4 space-y-8 pl-6 my-2">
              {history.map((item) => {
                const isStatusChange = item.old_phase !== item.new_phase || item.old_status !== item.new_status;
                const phaseColor = PHASE_COLORS[item.new_phase as string] || 'bg-gray-100 text-gray-700';

                return (
                  <div key={item.id} className="relative">
                    {/* Timeline Dot */}
                    <div className={`absolute -left-[33px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                      isStatusChange ? 'bg-brand-500' : 'bg-gray-300'
                    }`} />

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-1">
                        <div className="flex items-center gap-1 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                          <Calendar size={12} />
                          {new Date(item.change_date).toLocaleString('vi-VN', { 
                            day: '2-digit', month: '2-digit', year: 'numeric', 
                            hour: '2-digit', minute: '2-digit' 
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <User size={12} />
                          <span className="font-medium text-gray-700">
                            {item.changed_by_user?.full_name || 'System'}
                          </span>
                        </div>
                      </div>

                      {/* Content Box */}
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm transition-all hover:bg-blue-50/30">
                        {isStatusChange ? (
                          <div className="mb-3 pb-3 border-b border-gray-200 border-dashed last:border-0 last:mb-0 last:pb-0">
                            <div className="flex items-center gap-2 flex-wrap text-sm">
                              <span className="text-gray-500">
                                {item.old_phase ? PHASE_DISPLAY[item.old_phase] : 'N/A'} 
                                {item.old_status ? ` (${item.old_status})` : ''}
                              </span>
                              <ArrowRight size={14} className="text-gray-400" />
                              <div className={`px-2.5 py-1 rounded-md font-semibold border flex items-center gap-2 shadow-sm ${phaseColor}`}>
                                {PHASE_DISPLAY[item.new_phase as string] || item.new_phase}
                                {item.new_status && (
                                  <span className="text-[10px] uppercase opacity-75 bg-black/5 px-1 rounded ml-1">
                                    {item.new_status}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mb-2 text-sm text-gray-500 italic flex items-center gap-1.5">
                            <FileText size={14} />
                            Memo updated
                          </div>
                        )}

                        {/* Memo */}
                        {item.memo && (
                          <div className="mt-2 text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200 shadow-inner">
                            <div 
                              className="prose prose-sm max-w-none prose-p:my-1"
                              dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(item.memo)
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
        
        <div className="bg-gray-50 px-6 py-4 flex justify-end shrink-0 border-t">
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
};
