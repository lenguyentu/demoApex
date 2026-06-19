import { useRef, useEffect, useState } from 'react';
import { X, Calendar, MessageCircle, Phone, Mail, Users, ClipboardList, ChevronDown, Check } from 'lucide-react';
import { format } from 'date-fns';
import { useCreateBDSchedule } from '../hooks';
import { useAuthStore } from '../../auth/store';

interface ConfirmReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  currentStatus: string;
  onConfirm: (newStatus: string, note: string) => void;
  processId?: string; // Add processId to create custom schedule
}

const REMINDER_TYPES = [
  { value: 'Follow up', label: 'Follow up', icon: <MessageCircle className="w-4 h-4" />, color: 'text-blue-600 bg-blue-50' },
  { value: 'Calling', label: 'Gọi điện', icon: <Phone className="w-4 h-4" />, color: 'text-green-600 bg-green-50' },
  { value: 'Emailing', label: 'Gửi Email', icon: <Mail className="w-4 h-4" />, color: 'text-purple-600 bg-purple-50' },
  { value: 'Meeting', label: 'Hẹn gặp', icon: <Users className="w-4 h-4" />, color: 'text-orange-600 bg-orange-50' },
  { value: 'Contract', label: 'Hợp đồng', icon: <ClipboardList className="w-4 h-4" />, color: 'text-pink-600 bg-pink-50' },
];

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

const getStatusColor = (status: string) => {
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

export function ConfirmReminderModal({
  isOpen,
  onClose,
  clientName,
  currentStatus,
  onConfirm,
  processId
}: ConfirmReminderModalProps) {
  const { user } = useAuthStore();
  const [status, setStatus] = useState(currentStatus);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [note, setNote] = useState('');
  const createScheduleMutation = useCreateBDSchedule();

  // Custom schedule state
  const [showCustomSchedule, setShowCustomSchedule] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [reminderType, setReminderType] = useState('Follow up');
  const [customTitle, setCustomTitle] = useState('');

  // Stages that use custom reminders (not rolling)
  const CUSTOM_REMINDER_STAGES = ['Follow up', 'Consulting', 'Demo contract', 'Signing', 'Meeting Clear JD'];
  const isCustomStage = (s: string) => CUSTOM_REMINDER_STAGES.includes(s);

  useEffect(() => {
    if (isOpen) {
      setStatus(currentStatus);
      setNote('');
      // Tự động mở form tạo lịch nếu đang ở stage cần custom reminder
      setShowCustomSchedule(isCustomStage(currentStatus));
      setScheduledDate('');
      setReminderType('Follow up');
      setCustomTitle('');
    }
  }, [isOpen, currentStatus]);

  // Tự động show/hide custom schedule khi đổi status sang Follow up+ 
  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    if (isCustomStage(newStatus)) {
      setShowCustomSchedule(true);
    }
  };

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    let enhancedNote = note;
    
    // If creating a custom schedule, append it to the note automatically
    if (showCustomSchedule && scheduledDate) {
      const formattedDate = format(new Date(scheduledDate), 'dd/MM/yyyy HH:mm');
      const scheduleInfo = `[📅 Lịch hẹn: ${customTitle || `Nhắc nhở ${clientName}`} lúc ${formattedDate}]`;
      enhancedNote = note ? `${note}\n${scheduleInfo}` : scheduleInfo;
    }

    // 1. Update status as usual with the enhanced note
    onConfirm(status, enhancedNote);

    // 2. Create custom schedule if requested
    if (showCustomSchedule && processId && user && scheduledDate) {
      try {
        await createScheduleMutation.mutateAsync({
          process_id: processId,
          owner_id: user.id,
          title: customTitle || `Nhắc nhở: ${clientName}`,
          scheduled_date: new Date(scheduledDate).toISOString(),
          reminder_type: reminderType,
          description: enhancedNote // Use enhanced note here too
        });
      } catch (err) {
        console.error('Failed to create custom schedule', err);
      }
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-xl mx-4 z-50 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Xác nhận Remind & Cập nhật</h2>
            <p className="text-sm text-gray-500 mt-0.5">{clientName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-sm transition-all hover:border-brand-300 shadow-sm"
                  >
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shadow-sm ${getStatusColor(status)}`}>
                      {status}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isStatusDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-full min-w-[200px] rounded-xl shadow-2xl bg-white border border-gray-100 z-[100] max-h-[350px] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 origin-top p-1">
                      <div className="py-1">
                        {STATUS_PHASES.map((phase) => (
                          <div key={phase.label} className="mb-2 last:mb-0">
                            <div className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${phase.color} bg-gray-50/50 rounded-md mb-1`}>
                              {phase.label}
                            </div>
                            {phase.statuses.map((option) => (
                              <button
                                key={option}
                                type="button"
                                onClick={() => {
                                  handleStatusChange(option);
                                  setIsStatusDropdownOpen(false);
                                }}
                                className={`w-full text-left px-2 py-1.5 transition-colors flex items-center justify-between rounded-lg group
                                  ${status === option ? 'bg-brand-50' : 'hover:bg-gray-50'}`}
                              >
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border shadow-sm transition-all ${getStatusColor(option)} ${status === option ? 'ring-2 ring-brand-200 ring-offset-1' : 'group-hover:scale-105'}`}>
                                  {option}
                                </span>
                                {status === option && <Check className="h-4 w-4 text-brand-500" />}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {isCustomStage(status) && (
                  <p className="text-[10px] text-brand-600 mt-1 ml-1 font-medium">
                    ℹ️ Stage này dùng lịch tùy chỉnh thay vì rolling 7/15/30 ngày
                  </p>
                )}
              </div>

              <div className="md:pt-6">
                 <label className="flex items-center gap-2 cursor-pointer group p-2 rounded-lg hover:bg-brand-50 transition border border-transparent hover:border-brand-100">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                      checked={showCustomSchedule}
                      onChange={(e) => setShowCustomSchedule(e.target.checked)}
                    />
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-700">Tạo lịch nhắc tùy chỉnh</span>
                        <span className="text-[10px] text-gray-500">Đặt lịch hẹn cụ thể cho lần sau</span>
                    </div>
                 </label>
              </div>
          </div>

          {showCustomSchedule && (
            <div className="space-y-4 p-4 rounded-xl bg-brand-50/50 border border-brand-100 animate-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 ml-1">Ngày & Giờ hẹn</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input 
                                type="datetime-local" 
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 ml-1">Loại nhắc nhở</label>
                        <select
                            value={reminderType}
                            onChange={(e) => setReminderType(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-sm"
                        >
                            {REMINDER_TYPES.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 ml-1">Tiêu đề lịch hẹn</label>
                    <input 
                        type="text"
                        placeholder="Ví dụ: Gọi lại chốt lịch gặp..."
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-sm font-medium"
                    />
                </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 ml-1">Ghi chú tương tác <span className="text-red-500">*</span></label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Nội dung đã trao đổi, lý do đặt lịch hẹn mới..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none text-sm"
              autoFocus
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t bg-gray-50 rounded-b-xl shrink-0">
          <button onClick={onClose} className="px-5 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-bold">Hủy</button>
          <button
            onClick={handleConfirm}
            disabled={!note.trim() || (showCustomSchedule && !scheduledDate)}
            className="px-6 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-brand-100"
          >
            Lưu & Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
}
