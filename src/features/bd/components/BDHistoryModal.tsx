import { useState, useEffect } from 'react';
import { X, Calendar, User, Clock, Edit2, ArrowRight } from 'lucide-react';
import { getBDProcessHistory, updateCustomerStatus } from '../api';
import DOMPurify from 'dompurify';
import type { BDProcessHistory } from '../../clients/types';

interface BDHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  processId: string;
  clientName: string;
  filterStatus?: string | null;
}


export const BDHistoryModal = ({ isOpen, onClose, processId, clientName, filterStatus }: BDHistoryModalProps) => {
  const [history, setHistory] = useState<BDProcessHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && processId) {
      loadHistory();
    }
  }, [isOpen, processId, filterStatus]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getBDProcessHistory(processId);
      
      // Sort DESC (Newest first)
      data.sort((a, b) => new Date(b.change_date).getTime() - new Date(a.change_date).getTime());

      if (filterStatus) {
         // Lọc chỉ giữ lại các item thuộc về status này
         // Status của một item history được hiểu là trạng thái TẠI THỜI ĐIỂM ĐÓ.
         // Trường 'status' trong bd_process_history lưu trạng thái MỚI sau khi update.
         // Tuy nhiên, đối với log 'Khởi tạo', status là trạng thái khởi tạo.
         // Logic lọc: lấy các record có status == filterStatus
         const filtered = data.filter(item => 
             (item.status === filterStatus) || 
             (item.new_status === filterStatus) // fallback
         );
         setHistory(filtered);
      } else {
         setHistory(data);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!newNote.trim()) return;
    
    // Nếu đang ở chế độ lọc status, thì new note sẽ thuộc về status đó
    let currentStatus = filterStatus;

    if (!currentStatus) {
        // Fallback: Lấy status mới nhất hiện tại từ lịch sử
        const latestItem = history[0];
        currentStatus = latestItem ? (latestItem.new_status || latestItem.status || latestItem.old_status) : 'Research'; 
    }
    
    setSubmitting(true);
    try {
        // Gọi API update với status CŨ (giữ nguyên) và memo MỚI
        await updateCustomerStatus(processId, currentStatus as string, newNote);
        
        // Reload history
        await loadHistory();
        
        // Reset form
        setNewNote('');
        setIsAddingNote(false);
    } catch (error) {
        console.error('Failed to add note:', error);
    } finally {
        setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-120 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity" 
        onClick={onClose}
      ></div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] z-10">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/80 shrink-0">
            <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                {filterStatus ? <Edit2 size={20} className="text-pink-600" /> : <Clock size={20} className="text-pink-600" />}
                {filterStatus ? `Note: ${filterStatus}` : 'Care History'}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                    Customer: <span className="font-medium text-pink-600">{clientName}</span>
                </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="px-6 py-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
            {loading ? (
              <div className="py-12 text-center text-gray-500 flex flex-col items-center gap-2">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                 <span className="text-sm font-medium">Loading data...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="py-12 text-center text-gray-400 italic flex flex-col items-center gap-3">
                  <div className="p-4 bg-gray-50 rounded-full">
                      <Clock size={32} className="opacity-50" />
                  </div>
                  No change history yet.
              </div>
            ) : (
                <div className="relative border-l-2 border-gray-100 ml-4 space-y-8 pl-8 my-2 pt-2">
                  {(() => {
                    // 1. Grouping Logic
                    // Gom nhóm các items liên tiếp có cùng status vào 1 group
                    const groups: {
                        id: string;
                        transition: { from: string; to: string };
                        items: typeof history;
                        isShift: boolean;
                    }[] = [];
                    
                    let currentGroup: any = null;

                    history.forEach((item, index) => {
                        const prevItem = index > 0 ? history[index - 1] : null;
                        
                        // Logic xác định status cũ (của item hiện tại so với item TRƯỚC ĐÓ trong danh sách đã sort ASC)
                        const oldStatus = prevItem ? (prevItem.status || 'Unknown') : 'Initialized';
                        const newStatus = item.status || 'Unknown';
                        const isStatusShift = oldStatus !== newStatus;

                        if (isStatusShift || !currentGroup) {
                            // Tạo nhóm mới nếu có sự thay đổi status hoặc chưa có nhóm nào
                            currentGroup = {
                                id: item.id, // Dùng ID của item đầu tiên làm key
                                transition: { from: oldStatus, to: newStatus },
                                items: [item],
                                isShift: isStatusShift || index === 0 // Luôn coi item đầu tiên là shift (từ Khởi tạo)
                            };
                            groups.push(currentGroup);
                        } else {
                            // Nếu status không đổi, add vào nhóm hiện tại
                            currentGroup.items.push(item);
                        }
                    });

                    // 2. Rendering Groups
                    return groups.map((group, groupIndex) => {
                         const isLastGroup = groupIndex === groups.length - 1;

                         return (
                             <div key={group.id} className="relative group pl-2 pb-8 last:pb-0">
                                 {/* Timeline Dot cho cả Group */}
                                 <div className={`absolute -left-[39px] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm z-10 ${
                                     group.isShift ? 'bg-pink-500' : 'bg-gray-300'
                                 }`}></div>

                                 {/* Vertical Line */}
                                 {!isLastGroup && (
                                     <div className="absolute -left-[33px] top-5 bottom-[-8px] w-[2px] bg-gray-100"></div>
                                 )}

                                 <div className="flex flex-col gap-3">
                                    {/* Group Content Card */}
                                    <div className={`bg-gray-50 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md overflow-hidden ${group.isShift ? 'border-l-4 border-l-pink-400' : ''}`}>
                                        
                                        {/* Status Change Header (Hiển thị 1 lần cho cả Group) */}
                                        {group.isShift && (
                                            <div className="px-4 py-3 border-b border-gray-200 bg-gray-100/50 flex items-center flex-wrap gap-2 text-sm">
                                                <span className="text-gray-500 font-medium">
                                                    {group.transition.from}
                                                </span>
                                                <ArrowRight size={14} className="text-gray-400" />
                                                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold uppercase bg-pink-100 text-pink-700 border border-pink-200 shadow-sm tracking-wide">
                                                    {group.transition.to}
                                                </span>
                                            </div>
                                        )}

                                        {/* List Items trong Group */}
                                        <div className="flex flex-col divide-y divide-gray-100">
                                            {group.items.map((item) => (
                                                <div key={item.id} className="p-4 hover:bg-gray-50/80 transition-colors">
                                                    {/* Item Header: Date & User */}
                                                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                                                        <div className="flex items-center gap-1.5">
                                                           <Calendar size={11} className="text-gray-400" />
                                                           <span className="font-mono text-gray-600">
                                                               {new Date(item.change_date).toLocaleString('en-GB', { 
                                                                 hour: '2-digit', minute: '2-digit',
                                                                 day: '2-digit', month: '2-digit', year: 'numeric'
                                                               })}
                                                           </span>
                                                        </div>
                                                        <span className="text-gray-300">|</span>
                                                        <div className="flex items-center gap-1.5 font-medium text-gray-700">
                                                           <User size={11} className="text-gray-400" />
                                                           {item.changed_by_user?.full_name || 'System'}
                                                        </div>
                                                    </div>

                                                    {/* Memo Box */}
                                                    <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-inner">
                                                        {item.memo ? (
                                                            <div 
                                                                className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none"
                                                                dangerouslySetInnerHTML={{
                                                                    __html: DOMPurify.sanitize(item.memo.replace(/\n/g, '<br/>'))
                                                                }}
                                                            />
                                                        ) : (
                                                            <span className="text-sm text-gray-400 italic flex items-center gap-2">
                                                                <Edit2 size={12} />
                                                                No detailed notes
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                 </div>
                             </div>
                         );
                    });
                  })()}
                </div>
            )}
          </div>
          
          <div className="bg-gray-50 px-6 py-4 flex justify-between items-center shrink-0 border-t border-gray-100">
             {isAddingNote ? (
                 <div className="flex gap-2 w-full">
                     <textarea
                        autoFocus
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Enter new note..."
                        className="flex-1 px-4 py-2 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none h-20 bg-white shadow-sm"
                     />
                     <div className="flex flex-col gap-2">
                         <button
                            disabled={submitting || !newNote.trim()}
                            onClick={handleSaveNote}
                            className="px-4 py-2 bg-pink-600 text-white font-bold rounded-lg text-sm hover:bg-pink-700 disabled:opacity-50"
                         >
                            {submitting ? 'Saving...' : 'Save'}
                         </button>
                         <button
                            onClick={() => setIsAddingNote(false)}
                            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg text-sm hover:bg-gray-50"
                         >
                            Cancel
                         </button>
                     </div>
                 </div>
             ) : (
                 <button
                    onClick={() => setIsAddingNote(true)}
                    className="flex items-center gap-2 text-pink-600 font-bold text-sm hover:text-pink-700 transition-colors"
                 >
                    <Edit2 size={16} />
                    Write next note...
                 </button>
             )}

             {!isAddingNote && (
                 <button
                    type="button"
                    className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl shadow-sm hover:bg-gray-50 transition-all text-sm"
                    onClick={onClose}
                  >
                    Close
                  </button>
             )}
          </div>
      </div>
    </div>
  );
};
