import { useState, useRef, useEffect } from 'react';
import { Calendar, X, ChevronDown } from 'lucide-react';
import { format, startOfDay, endOfDay, startOfWeek, startOfMonth, endOfMonth, isValid, parse } from 'date-fns';
import { vi } from 'date-fns/locale';

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  placeholder?: string;
  className?: string;
}

const PRESET_OPTIONS = [
  { value: 'last_24h', label: '24h trước' },
  { value: 'today', label: 'Hôm nay' },
  { value: 'this_week', label: 'Tuần này' },
  { value: 'this_month', label: 'Tháng này' },
  { value: 'last_month', label: 'Tháng trước' },
  { value: 'custom', label: 'Tùy chọn...' },
];

const MONTHS_VN = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
];

export function DateRangePicker({ value, onChange, placeholder = 'Thời gian tạo', className = '' }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [tempFrom, setTempFrom] = useState('');
  const [tempTo, setTempTo] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCustom(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync temp inputs with value
  useEffect(() => {
    if (value.from) {
      setTempFrom(format(value.from, 'yyyy-MM-dd'));
    }
    if (value.to) {
      setTempTo(format(value.to, 'yyyy-MM-dd'));
    }
  }, [value]);

  const handlePresetSelect = (preset: string) => {
    const now = new Date();
    
    switch (preset) {
      case 'last_24h':
        onChange({
          from: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          to: now,
        });
        setIsOpen(false);
        break;
      case 'today':
        onChange({
          from: startOfDay(now),
          to: endOfDay(now),
        });
        setIsOpen(false);
        break;
      case 'this_week':
        onChange({
          from: startOfWeek(now, { weekStartsOn: 1 }), // Monday
          to: endOfDay(now),
        });
        setIsOpen(false);
        break;
      case 'this_month':
        onChange({
          from: startOfMonth(now),
          to: endOfMonth(now),
        });
        setIsOpen(false);
        break;
      case 'last_month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        onChange({
          from: startOfMonth(lastMonth),
          to: endOfMonth(lastMonth),
        });
        setIsOpen(false);
        break;
      case 'custom':
        setShowCustom(true);
        break;
      default:
        // Assume it's a specific month index from MONTHS_VN
        if (preset.startsWith('month-')) {
          const monthIdx = parseInt(preset.split('-')[1]);
          const targetDate = new Date(now.getFullYear(), monthIdx, 1);
          onChange({
             from: startOfMonth(targetDate),
             to: endOfMonth(targetDate)
          });
          setIsOpen(false);
        }
        break;
    }
  };

  const handleCustomApply = () => {
    const fromDate = tempFrom ? parse(tempFrom, 'yyyy-MM-dd', new Date()) : null;
    const toDate = tempTo ? parse(tempTo, 'yyyy-MM-dd', new Date()) : null;

    onChange({
      from: fromDate && isValid(fromDate) ? startOfDay(fromDate) : null,
      to: toDate && isValid(toDate) ? endOfDay(toDate) : null,
    });
    setIsOpen(false);
    setShowCustom(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ from: null, to: null });
    setTempFrom('');
    setTempTo('');
    setShowCustom(false);
  };

  const hasValue = value.from || value.to;

  const getDisplayText = () => {
    if (!hasValue) return placeholder;
    
    if (value.from && value.to) {
      const fromStr = format(value.from, 'dd/MM/yyyy', { locale: vi });
      const toStr = format(value.to, 'dd/MM/yyyy', { locale: vi });
      if (fromStr === toStr) return fromStr;
      
      // Special case: check if it matches a full month
      const startOfValFrom = startOfMonth(value.from);
      const endOfValTo = endOfMonth(value.to);
      if (format(value.from, 'yyyy-MM-dd') === format(startOfValFrom, 'yyyy-MM-dd') && 
          format(value.to, 'yyyy-MM-dd') === format(endOfValTo, 'yyyy-MM-dd') &&
          value.from.getMonth() === value.to.getMonth()) {
          return MONTHS_VN[value.from.getMonth()] + ' ' + value.from.getFullYear();
      }

      return `${fromStr} - ${toStr}`;
    }
    if (value.from) {
      return `Từ ${format(value.from, 'dd/MM/yyyy', { locale: vi })}`;
    }
    if (value.to) {
      return `Đến ${format(value.to, 'dd/MM/yyyy', { locale: vi })}`;
    }
    return placeholder;
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 ${
          hasValue ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 bg-white text-gray-700'
        } ${className}`}
      >
        <Calendar size={16} className={hasValue ? 'text-brand-500' : 'text-gray-400'} />
        <span className="flex-1 text-left truncate">{getDisplayText()}</span>
        {hasValue ? (
          <X 
            size={14} 
            className="text-gray-400 hover:text-gray-600" 
            onClick={handleClear}
          />
        ) : (
          <ChevronDown size={14} className="text-gray-400" />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[220px]">
          {!showCustom ? (
            <div className="py-1 max-h-[400px] overflow-y-auto">
              <div className="px-3 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Lựa chọn nhanh</div>
              {PRESET_OPTIONS.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handlePresetSelect(option.value)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-gray-700 font-medium"
                >
                  {option.label}
                </button>
              ))}
              <div className="border-t border-gray-100 my-1"></div>
              <div className="px-3 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Theo tháng ({new Date().getFullYear()})</div>
              <div className="grid grid-cols-2 p-1">
                {MONTHS_VN.map((m, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handlePresetSelect(`month-${i}`)}
                    className="px-3 py-2 text-left text-xs hover:bg-rose-50 hover:text-rose-600 rounded-md text-gray-600 transition-colors"
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <div className="text-sm font-medium text-gray-700">Chọn khoảng thời gian</div>
              
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Từ ngày</label>
                  <input
                    type="date"
                    value={tempFrom}
                    onChange={(e) => setTempFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Đến ngày</label>
                  <input
                    type="date"
                    value={tempTo}
                    onChange={(e) => setTempTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustom(false)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleCustomApply}
                  className="flex-1 px-3 py-2 text-sm bg-brand-500 text-white rounded-md hover:bg-brand-600"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export type { DateRange };
