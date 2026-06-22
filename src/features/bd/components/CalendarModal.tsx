import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, Bell, Clock } from 'lucide-react';
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  format, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { ScheduleItem } from '../types';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedules: ScheduleItem[];
}

export function CalendarModal({ isOpen, onClose, schedules }: CalendarModalProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  if (!isOpen) return null;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Group schedules by due date
  const schedulesByDate = schedules.reduce((acc, schedule) => {
    const dateKey = schedule.dueDate; // yyyy-MM-dd
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(schedule);
    return acc;
  }, {} as Record<string, ScheduleItem[]>);

  const getSchedulesForDay = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return schedulesByDate[dateKey] || [];
  };

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => setCurrentMonth(new Date());

  const daySchedules = selectedDay ? getSchedulesForDay(selectedDay) : [];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-[1100px] max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100">
                <CalendarIcon className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">General Reminder Calendar</h2>
                <p className="text-sm text-gray-500">View all reminders by month</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Calendar Controls */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50 shrink-0">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-white rounded-lg transition border border-transparent hover:border-gray-200"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900 first-letter:uppercase">
                {format(currentMonth, 'MMMM yyyy', { locale: enUS })}
              </h3>
              <button
                onClick={handleToday}
                className="px-3 py-1.5 text-sm border border-gray-200 bg-white hover:bg-gray-50 rounded-md transition"
              >
                Today
              </button>
            </div>

            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-white rounded-lg transition border border-transparent hover:border-gray-200"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 overflow-auto p-6 bg-white custom-scrollbar">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2 w-max mx-auto">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="w-[140px] text-center text-sm font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2 w-max mx-auto pb-4">
              {calendarDays.map((day) => {
                const s = getSchedulesForDay(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, new Date());
                const hasOverdue = s.some(item => (item.overdueDays || 0) > 0);

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => { if(s.length > 0) setSelectedDay(day); }}
                    className={`w-[140px] h-[140px] p-2 rounded-lg border transition-all overflow-hidden flex flex-col ${
                      s.length > 0 ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''
                    } ${
                      !isCurrentMonth 
                        ? 'bg-gray-50 border-gray-100 opacity-60' 
                        : isToday
                        ? 'bg-brand-50 border-brand-300 ring-2 ring-brand-200'
                        : hasOverdue
                        ? 'bg-red-50 border-red-200'
                        : s.length > 0
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${
                        !isCurrentMonth 
                          ? 'text-gray-400' 
                          : isToday
                          ? 'text-brand-700 font-bold'
                          : 'text-gray-700'
                      }`}>
                        {format(day, 'd')}
                      </span>
                      {s.length > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          hasOverdue ? 'bg-red-600 text-white' : 'bg-yellow-600 text-white'
                        }`}>
                          {s.length}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <div className="space-y-1">
                        {s.slice(0, 2).map((item) => (
                          <div
                            key={item.id}
                            className={`text-[10px] p-1 rounded border truncate ${
                              (item.overdueDays || 0) > 0
                                ? 'bg-red-100/80 text-red-800 border-red-200'
                                : 'bg-white text-gray-700 border-gray-200'
                            }`}
                          >
                            <div className="font-bold truncate uppercase text-[9px] tracking-tight">{item.clientName}</div>
                            <div className="text-[8px] text-gray-500 truncate font-medium">{item.bdOwner}</div>
                          </div>
                        ))}
                      </div>
                      {s.length > 2 && (
                        <div className="text-[9px] text-gray-400 font-bold italic mt-1 px-1">
                          + {s.length - 2} others...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 px-6 py-4 border-t bg-gray-50 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-brand-50 border-2 border-brand-300"></div>
              <span className="text-xs text-gray-600">Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-50 border border-yellow-200"></div>
              <span className="text-xs text-gray-600">Has reminder</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-50 border border-red-200"></div>
              <span className="text-xs text-gray-600">Overdue</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal (Floating) */}
      {selectedDay && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" 
            onClick={() => setSelectedDay(null)}
          ></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 z-10 border border-gray-100">
            <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
              <div>
                <h3 className="font-bold text-gray-900">Details for {format(selectedDay, 'dd/MM/yyyy')}</h3>
                <p className="text-xs text-gray-500">Found {daySchedules.length} reminders</p>
              </div>
              <button 
                onClick={() => setSelectedDay(null)}
                className="p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-gray-600 transition-colors shadow-sm"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-3 bg-white">
              {daySchedules.map((schedule) => (
                <div 
                  key={schedule.id}
                  className={`p-4 rounded-xl border border-gray-100 bg-gray-50 transition-all hover:border-brand-200 hover:shadow-md ${
                    (schedule.overdueDays || 0) > 0 ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-brand-400'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-900">{schedule.clientName}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-gray-200 font-bold text-gray-600 uppercase">
                      {schedule.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 mt-3">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <User size={13} className="text-gray-400" />
                      <span>BD: <span className="font-semibold text-gray-800">{schedule.bdOwner}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Bell size={13} className="text-gray-400" />
                      <span>Type: <span className="font-semibold text-purple-600">{schedule.reminderType}</span></span>
                    </div>
                    {(schedule.overdueDays || 0) > 0 && (
                      <div className="flex items-center gap-2 text-xs text-red-600 font-bold pt-1">
                        <Clock size={13} />
                        Overdue {schedule.overdueDays} days
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-gray-50 border-t flex justify-end">
              <button
                onClick={() => setSelectedDay(null)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
