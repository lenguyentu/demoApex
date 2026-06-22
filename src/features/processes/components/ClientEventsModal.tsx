import { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Edit2, Check, AlertCircle } from 'lucide-react';
import { getClientEvents, updateInterviewEvent } from '../api';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';

interface ClientEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName?: string;
  jobId?: string;
  jobTitle?: string;
}

interface Event {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  description?: string;
  level?: string;
  process?: {
    id: string;
    candidate?: {
      name: string;
    };
  };
}

export function ClientEventsModal({ 
  isOpen, 
  onClose, 
  clientId, 
  clientName,
  jobId,
  jobTitle 
}: ClientEventsModalProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    level: '',
    description: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isOpen && clientId) {
      fetchEvents();
    }
  }, [isOpen, clientId, jobId]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await getClientEvents(clientId, jobId);
      setEvents(data as Event[]);
    } catch (error) {
      console.error('Failed to fetch events', error);
      toast.error('Could not load events');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (event: Event) => {
    const startDate = new Date(event.start_time);
    const endDate = new Date(event.end_time);
    
    setEditingEventId(event.id);
    setEditForm({
      title: event.title,
      date: startDate.toISOString().split('T')[0],
      startTime: startDate.toTimeString().split(' ')[0].substring(0, 5),
      endTime: endDate.toTimeString().split(' ')[0].substring(0, 5),
      level: event.level || '',
      description: event.description || ''
    });
  };

  const handleUpdate = async () => {
    if (!editingEventId) return;
    setIsUpdating(true);
    try {
      const startDateTime = new Date(`${editForm.date}T${editForm.startTime}`).toISOString();
      const endDateTime = new Date(`${editForm.date}T${editForm.endTime}`).toISOString();

      await updateInterviewEvent(editingEventId, {
        title: editForm.title,
        start_time: startDateTime,
        end_time: endDateTime,
        description: editForm.description,
        level: editForm.level
      });

      toast.success('Interview schedule updated');
      setEditingEventId(null);
      fetchEvents();
    } catch (error) {
      console.error('Failed to update event', error);
      toast.error('Error updating schedule');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen) return null;

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (startTime: string) => {
    const now = new Date();
    const eventTime = new Date(startTime);
    if (eventTime < now) return 'bg-gray-100 text-gray-600'; // Past
    if (eventTime.toDateString() === now.toDateString()) return 'bg-green-100 text-green-700'; // Today
    return 'bg-blue-100 text-blue-700'; // Future
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-base">
              <Calendar size={18} className="text-purple-600" />
              Lịch phỏng vấn
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {clientName} {jobTitle && `• ${jobTitle}`}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {loading ? (
            <div className="text-center py-12 text-gray-400">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-3"></div>
              <p className="text-sm">Loading schedule...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Calendar size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-base font-medium">No interview schedule yet</p>
              <p className="text-xs mt-1">Lịch sẽ xuất hiện khi bạn cập nhật trạng thái phỏng vấn.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div 
                  key={event.id} 
                  className={`p-4 rounded-xl border transition-all duration-200 ${
                    editingEventId === event.id 
                    ? 'border-purple-500 ring-2 ring-purple-100 bg-purple-50/10' 
                    : 'border-gray-100 hover:border-purple-200 hover:shadow-md bg-white'
                  }`}
                >
                  {editingEventId === event.id ? (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                       <div className="flex items-center justify-between mb-2 pb-2 border-b border-purple-100">
                          <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Chế độ chỉnh sửa</span>
                          <div className="flex gap-2">
                             <button 
                                onClick={() => setEditingEventId(null)}
                                className="p-1 px-3 text-xs text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-md transition-colors"
                             >
                                Hủy
                             </button>
                             <button 
                                onClick={handleUpdate}
                                disabled={isUpdating}
                                className="p-1 px-3 text-xs text-white bg-purple-600 hover:bg-purple-700 rounded-md flex items-center gap-1 shadow-sm transition-colors"
                             >
                                {isUpdating ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={12} />}
                                Lưu
                             </button>
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="md:col-span-2">
                             <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-tighter">Tiêu đề phỏng vấn</label>
                             <input 
                                type="text"
                                value={editForm.title}
                                onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                             />
                          </div>

                          <div>
                             <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-tighter">Ngày thực hiện</label>
                             <input 
                                type="date"
                                value={editForm.date}
                                onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                             />
                          </div>

                          <div>
                             <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-tighter">Vòng phỏng vấn</label>
                             <input 
                                type="text"
                                value={editForm.level}
                                onChange={(e) => setEditForm({...editForm, level: e.target.value})}
                                placeholder="VD: 1, 2, Final..."
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                             />
                          </div>

                          <div>
                             <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-tighter">Thời gian Bắt đầu</label>
                             <input 
                                type="time"
                                value={editForm.startTime}
                                onChange={(e) => setEditForm({...editForm, startTime: e.target.value})}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                             />
                          </div>

                          <div>
                             <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-tighter">Thời gian Kết thúc</label>
                             <input 
                                type="time"
                                value={editForm.endTime}
                                onChange={(e) => setEditForm({...editForm, endTime: e.target.value})}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                             />
                          </div>

                          <div className="md:col-span-2">
                             <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-tighter">Mô tả/Link họp</label>
                             <textarea 
                                value={editForm.description}
                                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                rows={2}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all resize-none"
                             />
                          </div>
                       </div>
                    </div>
                  ) : (
                    <div className="group/event relative">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-sm leading-tight flex items-center gap-2">
                            {event.title}
                            {event.level && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(event.start_time)}`}>
                                Vòng {event.level}
                              </span>
                            )}
                          </h4>
                          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2">
                            {event.process?.candidate?.name && (
                              <p className="text-[11px] font-medium text-gray-600 flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                                <User size={12} className="text-gray-400" />
                                {event.process.candidate.name}
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                              <Calendar size={12} className="text-purple-400" />
                              <span className="font-medium">{formatDateTime(event.start_time)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                              <Clock size={12} className="text-blue-400" />
                              <span className="font-medium">{formatTime(event.start_time)} - {formatTime(event.end_time)}</span>
                            </div>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleStartEdit(event)}
                          className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg opacity-0 group-hover/event:opacity-100 transition-all shrink-0 border border-transparent hover:border-purple-100"
                          title="Edit schedule"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>

                      {event.description && (
                         <div className="mt-3 bg-gray-50/50 p-2 rounded-lg border border-dashed border-gray-200">
                            <div 
                              className="text-[11px] text-gray-600 prose-p:my-1 prose-ul:my-1 prose-li:my-0.5"
                              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(event.description) }}
                            />
                         </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500 italic">
            <AlertCircle size={14} className="text-amber-500" />
            Lưu ý: Mọi thay đổi sẽ cập nhật trực tiếp lên hệ thống.
          </div>
          <p className="text-xs font-bold text-gray-400 tracking-widest uppercase">
            Total: {events.length}
          </p>
        </div>
      </div>
    </div>
  );
}
