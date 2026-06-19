import { ExternalLink, FileText, Loader2, ChevronDown, Check, Eye, Pencil, History } from "lucide-react";
import type { BDCustomer } from "../types";
import { calculateReminder } from "../utils";
import { useState, useRef, useEffect } from "react";
import { BDStatusModal } from "./BDStatusModal";
import { ConfirmReminderModal } from "./ConfirmReminderModal";
import { useUpdateBDStatus, useUpdateBDPriority, useCustomScheduledSchedules } from "../hooks";

interface CustomerTableProps {
  data: BDCustomer[];
  onOpenHistory: (id: string, name: string, status?: string) => void;
}

const STATUS_PHASES = [
  {
    label: 'Phase 1: Connect',
    color: 'text-blue-600',
    statuses: ['Research', 'Addfriend/Connect', 'Approach']
  },
  {
    label: 'Phase 2: Working',
    color: 'text-orange-600',
    statuses: ['Follow up', 'Consulting', 'Meeting Clear JD', 'Demo contract', 'Signing']
  },
  {
    label: 'Phase 3: End/Nurture',
    color: 'text-emerald-600',
    statuses: ['Signed', 'Hunting', 'Take care', 'No current need', 'Excluded']
  }
];

const ALL_PRIORITIES = ['Bình thường', 'Ưu tiên'];

const ROLLING_STAGES = ['Research', 'Addfriend/Connect', 'Approach'];
const CUSTOM_STAGES = ['Follow up', 'Consulting', 'Demo contract', 'Signing', 'Meeting Clear JD'];

const getStatusColor = (status: BDCustomer['status']) => {
  switch (status) {
    case 'Research':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Addfriend/Connect':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'Approach':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Follow up':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'Consulting':
    case 'Hiring':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Demo contract':
      return 'bg-pink-50 text-pink-700 border-pink-200';
    case 'Signing':
    case 'Meeting Clear JD':
    case 'Hunting':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'Signed':
    case 'Take care':
    case 'Closed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Working':
    case 'Pending':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'No current need':
    case 'Excluded':
      return 'bg-gray-100 text-gray-600 border-gray-200';
    case 'Reject':
      return 'bg-red-50 text-red-600 border-red-200';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

export const CustomerTable = ({ data, onOpenHistory }: CustomerTableProps) => {
  const { data: customSchedules } = useCustomScheduledSchedules();
  const updateStatusMutation = useUpdateBDStatus();
  const updatePriorityMutation = useUpdateBDPriority();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updatingPriorityId, setUpdatingPriorityId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // State cho BDStatusModal (Dropdown)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusUpdateData, setStatusUpdateData] = useState<{
    customer: BDCustomer | null;
    newStatus: string;
  }>({ customer: null, newStatus: '' });

  // State cho ConfirmReminderModal (Edit Button)
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [selectedReminderCustomer, setSelectedReminderCustomer] = useState<BDCustomer | null>(null);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const handleStatusChange = (customer: BDCustomer, newStatus: string) => {
    if (customer.status === newStatus) return;
    setOpenDropdownId(null);

    // Nếu target status là Follow up+ thì mở ConfirmReminderModal để tạo custom schedule
    if (CUSTOM_STAGES.includes(newStatus)) {
      setSelectedReminderCustomer({ ...customer, _targetStatus: newStatus } as any);
      setIsReminderModalOpen(true);
      return;
    }

    setStatusUpdateData({ customer, newStatus });
    setIsStatusModalOpen(true);
  };

  const handlePriorityChange = (customer: BDCustomer, newPriority: string) => {
      if (customer.priority === newPriority) {
          setOpenDropdownId(null);
          return;
      }
      setUpdatingPriorityId(customer.id);
      setOpenDropdownId(null);
      updatePriorityMutation.mutate({ id: customer.id, priority: newPriority }, {
          onSettled: () => setUpdatingPriorityId(null)
      });
  };

  const handleConfirmStatusUpdate = async (memo: string) => {
    const { customer, newStatus } = statusUpdateData;
    if (!customer) return;

    setUpdatingId(customer.id);
    updateStatusMutation.mutate(
      { id: customer.id, status: newStatus as any, memo },
      {
        onSettled: () => setUpdatingId(null)
      }
    );
  };

  const handleOpenReminderModal = (customer: BDCustomer) => {
    setSelectedReminderCustomer(customer);
    setIsReminderModalOpen(true);
  };

  const handleConfirmReminderUpdate = async (newStatus: string, note: string) => {
      if (!selectedReminderCustomer) return;

      setUpdatingId(selectedReminderCustomer.id);
      updateStatusMutation.mutate(
        { id: selectedReminderCustomer.id, status: newStatus as any, memo: note },
        {
          onSettled: () => setUpdatingId(null)
        }
      );
      setIsReminderModalOpen(false);
      setSelectedReminderCustomer(null);
  };



  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto min-h-[500px]" style={{ scrollbarGutter: 'stable' }}>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-2 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap min-w-[90px] text-left">Date</th>
                <th className="px-2 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap min-w-[100px] text-left">Remind</th>
                <th className="px-2 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap min-w-[110px] text-left">Status</th>
                <th className="px-2 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[160px] text-left">Company Name</th>
                <th className="px-2 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap min-w-[120px] text-left">Industry</th>
                <th className="px-2 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[160px] text-left">Job</th>
                <th className="px-2 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap w-20 text-left">Nguồn</th>
                <th className="px-2 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap w-28 text-center">Priority</th>
                <th className="px-2 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap w-[140px] text-center sticky right-0 bg-gray-50 dark:bg-gray-700/50 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)] z-10">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.map((customer) => {
                const formatDateForUtil = (isoString?: string | null) => {
                    if (!isoString) return "01/01/2026"; 
                    try {
                      return new Date(isoString).toLocaleDateString('en-GB'); 
                    } catch (e) { return "01/01/2026"; }
                };
                
                const createdAtStr = formatDateForUtil(customer.created_at);
                const lastContactStr = formatDateForUtil(customer.last_contact_date);
  
                const reminder = calculateReminder(createdAtStr, customer.last_contact_date ? lastContactStr : null);
                
                const clientName = customer.client?.client_name || '-';
                const domain = customer.client?.client_industry || '-';
                const jobTitle = customer.potential_job_title;
                const source = customer.source;
                const isUpdating = updatingId === customer.id;
                const isPriorityUpdating = updatingPriorityId === customer.id;
                const isStatusDropdownOpen = openDropdownId === `status-${customer.id}`;
                const isPriorityDropdownOpen = openDropdownId === `priority-${customer.id}`;
                const hasMemo = Boolean(customer.memo);

                return (
                <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                  <td className="px-2 py-3 whitespace-nowrap text-xs text-gray-500">
                    {createdAtStr}
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap">
                     {ROLLING_STAGES.includes(customer.status) ? (
                          // Rolling reminder: hiện thị ngày & countdown
                          <div className="flex flex-col items-start gap-1">
                               <span className={`${
                                   reminder.daysLeft < 0 ? 'text-red-600 font-medium' : 
                                   reminder.daysLeft <= 3 ? 'text-orange-600 font-medium' :
                                   'text-blue-600 font-medium'
                               } text-xs`}>
                                   {reminder.date}
                               </span>
                               <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                   reminder.daysLeft < 0 ? 'bg-red-100 text-red-700' : 
                                   reminder.daysLeft === 0 ? 'bg-orange-100 text-orange-700' :
                                   'bg-green-100 text-green-700'
                               }`}>
                                   {reminder.daysLeft < 0 
                                       ? `${Math.abs(reminder.daysLeft)} ngày` 
                                       : reminder.daysLeft === 0 
                                           ? 'Hôm nay' 
                                           : `${reminder.daysLeft} ngày`}
                               </span>
                          </div>
                     ) : CUSTOM_STAGES.includes(customer.status) ? (
                          // Custom stage: hiển thị ngày hẹn cụ thể nếu đã đặt
                          (() => {
                            const schedule = customSchedules?.get(customer.id);
                            if (schedule) {
                              // Chuyển string date sang Local Date để so sánh
                              const [y, m, d] = schedule.dueDate.split('-').map(Number);
                              const dueDate = new Date(y, m - 1, d);
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              
                              const diffTime = dueDate.getTime() - today.getTime();
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              
                              const formattedDate = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
                              
                              return (
                                <div className="flex flex-col items-start gap-1">
                                  <span className={`${
                                      diffDays < 0 ? 'text-red-600 font-medium' : 
                                      diffDays === 0 ? 'text-orange-600 font-medium' :
                                      'text-blue-600 font-medium'
                                  } text-xs`}>
                                      {formattedDate}
                                  </span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                      diffDays < 0 ? 'bg-red-100 text-red-700' : 
                                      diffDays === 0 ? 'bg-orange-100 text-orange-700' :
                                      diffDays === 1 ? 'bg-amber-100 text-amber-700' :
                                      'bg-green-100 text-green-700'
                                  }`}>
                                      {diffDays < 0 
                                          ? `Quá ${Math.abs(diffDays)} ngày` 
                                          : diffDays === 0 
                                              ? 'Hôm nay' 
                                              : diffDays === 1 ? 'Ngày mai' : `${diffDays} ngày`}
                                  </span>
                                </div>
                              );
                            }
                            return (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-50 text-orange-600 border border-orange-200 animate-pulse">
                                ⚠️ Chưa đặt
                              </span>
                            );
                          })()
                     ) : (
                          // Completed / other
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
                              Completed
                          </span>
                     )}
                  </td>

                  <td className="px-2 py-3 whitespace-nowrap">
                    <div className="relative inline-block text-left" ref={isStatusDropdownOpen ? dropdownRef : null}>
                      <button
                        onClick={() => !isUpdating && setOpenDropdownId(isStatusDropdownOpen ? null : `status-${customer.id}`)}
                        disabled={isUpdating}
                        className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all ${getStatusColor(customer.status)} ${isUpdating ? 'opacity-50' : 'hover:brightness-95 active:scale-95 shadow-sm'}`}
                      >
                        <span className="truncate max-w-[80px]">{customer.status}</span>
                        {isUpdating ? <Loader2 size={10} className="ml-1 animate-spin" /> : <ChevronDown size={10} className="ml-0.5 opacity-40" />}
                      </button>

                      {isStatusDropdownOpen && (
                        <div className="absolute left-0 mt-2 w-52 rounded-xl shadow-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 z-[100] max-h-[440px] overflow-y-auto animate-in fade-in zoom-in-95 duration-100 origin-top">
                          <div className="py-1.5">
                            {STATUS_PHASES.map((phase) => (
                              <div key={phase.label}>
                                {/* Phase Header */}
                                <div className={`px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider ${phase.color}`}>
                                  {phase.label}
                                </div>
                                {/* Status Options */}
                                {phase.statuses.map((option) => (
                                  <button
                                    key={option}
                                    onClick={() => handleStatusChange(customer, option)}
                                    disabled={customer.status === option}
                                    className={`w-full text-left px-3 py-1.5 transition-colors flex items-center gap-1 rounded-md
                                      ${customer.status === option ? 'bg-pink-50/60 cursor-default' : 'hover:bg-gray-50'}`}
                                  >
                                    <div className="w-4 flex items-center justify-start">
                                      {customer.status === option && <Check size={11} className="text-pink-500" />}
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border shadow-sm ${getStatusColor(option as any)}`}>
                                      {option}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-2 py-3">
                     <div className="flex flex-col">
                        <span 
                          onClick={() => window.open(`/tables/clients/new/${customer.client_id}`, '_blank')}
                          className="text-xs font-semibold text-gray-900 break-words cursor-pointer hover:text-pink-600 hover:underline transition-colors block max-w-[180px] lg:max-w-[240px]" 
                          title={clientName}
                        >
                          {clientName}
                        </span>
                     </div>
                  </td>

                  <td className="px-2 py-3 whitespace-nowrap text-xs text-gray-500 truncate max-w-[120px]" title={domain}>
                      {domain}
                  </td>

                  <td className="px-2 py-3 text-xs">
                    {(() => {
                        const isTitleUrl = jobTitle?.startsWith('http');
                        const finalLink = isTitleUrl ? jobTitle : customer.potential_job_link;
                        
                        if (jobTitle && !isTitleUrl) {
                            return (
                                <div className="flex items-center gap-1.5 text-gray-600">
                                    <span className="break-words max-w-[160px] lg:max-w-[240px]" title={jobTitle}>{jobTitle}</span>
                                    {finalLink && (
                                        <button 
                                            onClick={() => window.open(finalLink, '_blank')}
                                            className="text-blue-500 hover:text-blue-700 transition-colors p-0.5 hover:bg-blue-50 rounded flex-shrink-0"
                                            title="Mở link Job"
                                        >
                                            <ExternalLink size={12} strokeWidth={2.5} />
                                        </button>
                                    )}
                                </div>
                            );
                        }
                        
                        if (finalLink) {
                            return (
                                <button 
                                    onClick={() => window.open(finalLink, '_blank')}
                                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium transition-colors group/link p-1 -ml-1 hover:bg-blue-50 rounded-md"
                                >
                                    <ExternalLink size={12} strokeWidth={2.5} />
                                    <span className="text-[10px] group-hover/link:underline">Link Job</span>
                                </button>
                            );
                        }

                        return <span className="text-gray-300 italic font-normal tracking-wider">N/A</span>;
                    })()}
                  </td>

                  <td className="px-2 py-3 whitespace-nowrap text-xs">
                    {source ? (
                        <span className="text-gray-500">{source}</span>
                    ) : (
                        <span className="text-gray-300 italic font-normal tracking-wider">N/A</span>
                    )}
                  </td>

                  <td className="px-2 py-3 whitespace-nowrap text-center">
                    <div className="relative inline-block text-left" ref={isPriorityDropdownOpen ? dropdownRef : null}>
                       <button
                           onClick={() => !isPriorityUpdating && setOpenDropdownId(isPriorityDropdownOpen ? null : `priority-${customer.id}`)}
                           disabled={isPriorityUpdating}
                           className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-medium border border-gray-100 transition-all ${customer.priority === 'Ưu tiên' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-gray-50 text-gray-500'} ${isPriorityUpdating ? 'opacity-50' : 'hover:brightness-95 active:scale-95'}`}
                       >
                           {customer.priority}
                           {isPriorityUpdating ? <Loader2 size={10} className="ml-1 animate-spin" /> : <ChevronDown size={10} className="ml-1 opacity-40" />}
                       </button>
                       
                       {isPriorityDropdownOpen && (
                           <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-32 rounded-lg shadow-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top">
                               <div className="py-1">
                                   {ALL_PRIORITIES.map((p) => (
                                       <button
                                           key={p}
                                           onClick={() => handlePriorityChange(customer, p)}
                                           className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2 ${customer.priority === p ? 'bg-gray-50 font-medium text-brand-600' : 'text-gray-600'}`}
                                       >
                                           {customer.priority === p && <Check size={12} />}
                                           <span className={customer.priority === p ? '' : 'pl-5'}>{p}</span>
                                       </button>
                                   ))}
                               </div>
                           </div>
                       )}
                    </div>
                  </td>

                  <td className="px-2 py-3 whitespace-nowrap text-center sticky right-0 bg-white dark:bg-gray-800 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)] group-hover:bg-gray-50 dark:group-hover:bg-gray-700/50 transition-colors z-10">
                    <div className="flex items-center justify-center gap-2">
                        <button
                            onClick={() => window.open(`/tables/clients/new/${customer.client_id}`, '_blank')}
                            className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Xem chi tiết (Trang)"
                        >
                            <Eye size={16} />
                        </button>
                        <button
                            onClick={() => onOpenHistory(customer.id, clientName, customer.status)}
                            className="p-1.5 rounded-lg transition-colors text-pink-600 bg-pink-50 hover:bg-pink-100"
                            title={hasMemo ? "Xem ghi chú" : "Thêm ghi chú"}
                        >
                            <FileText size={16} />
                        </button>
                        <button
                            onClick={() => onOpenHistory(customer.id, clientName)}
                            className="p-1.5 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                            title="Lịch sử chăm sóc"
                        >
                            <History size={16} />
                        </button>
                        <button
                            onClick={() => handleOpenReminderModal(customer)}
                            className="p-1.5 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                            title="Cập nhật trạng thái / Ghi chú"
                        >
                            <Pencil size={16} />
                        </button>
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <BDStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onConfirm={handleConfirmStatusUpdate}
        newStatus={statusUpdateData.newStatus}
        currentMemo={statusUpdateData.customer?.memo || ''}
        clientName={statusUpdateData.customer?.client?.client_name || ''}
      />

       <ConfirmReminderModal
          isOpen={isReminderModalOpen}
          onClose={() => { setIsReminderModalOpen(false); setSelectedReminderCustomer(null); }}
          clientName={selectedReminderCustomer?.client?.client_name || ''}
          currentStatus={(selectedReminderCustomer as any)?._targetStatus || selectedReminderCustomer?.status || ''}
          onConfirm={handleConfirmReminderUpdate}
          processId={selectedReminderCustomer?.id}
        />

    </>
  );
};
