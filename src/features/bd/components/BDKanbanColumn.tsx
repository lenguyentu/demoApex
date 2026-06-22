import { Clock, Plus, MoreHorizontal, ChevronDown, FileText, Check, Loader2, type LucideIcon } from 'lucide-react';
import { memo, useState, useMemo, useEffect } from 'react';
import type { KanbanColumnData } from '../../processes/components/KanbanColumn';

interface BDKanbanColumnProps {
  column: KanbanColumnData;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  // Actions
  onItemClick?: (id: string) => void;
  onSubtitleClick?: (subtitleId: string) => void;
  onHistoryClick?: (itemId: string) => void;
  onStatusChange?: (itemId: string, newStatus: string) => void;
  onAddClick?: (columnId: string) => void;
  
  // Display Options
  highlightItemId?: string | null;
  availableStatuses?: { value: string; label: string }[];
  showAddButton?: boolean;
  updatingId?: string | null;
  
  // Custom Styles
  colorTheme?: {
    main: string;
    columnBg: string;
    border: string;
    text: string;
    icon?: LucideIcon;
  };
}

// Helper for Status Badge Color
const getStatusColor = (status: string) => {
    switch (status) {
      case 'Research': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Addfriend/Connect': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Approach': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Follow up': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Consulting':
      case 'Hiring': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Demo contract': return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'Signing':
      case 'Meeting Clear JD':
      case 'Hunting': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Signed':
      case 'Take care':
      case 'Closed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Working':
      case 'Pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'No current need':
      case 'Excluded': return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'Reject': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
};

const DEFAULT_THEME = {
  main: 'bg-blue-600',
  columnBg: 'bg-blue-50/80',
  border: 'border-blue-200',
  text: 'text-blue-700',
  icon: FileText,
};

function BDKanbanColumnComponent({
  column,
  isCollapsed,
  onToggleCollapse,
  onItemClick,
  onSubtitleClick,
  onHistoryClick,
  onStatusChange,
  onAddClick,
  highlightItemId,
  availableStatuses = [],
  showAddButton = false,
  colorTheme,
  updatingId
}: BDKanbanColumnProps) {
  
  const styles = useMemo(() => colorTheme || DEFAULT_THEME, [colorTheme]);
  const Icon = styles.icon || FileText;

  // Dropdown state
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const handleStatusChangeInternal = (itemId: string, newStatus: string) => {
    setOpenDropdownId(null);
    onStatusChange?.(itemId, newStatus);
  };

  const hasHighlightedItem = useMemo(() => {
    if (!highlightItemId) return false;
    return column.items.some(c => c.id === highlightItemId);
  }, [highlightItemId, column.items]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!openDropdownId) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't close if clicking on dropdown or status button
      if (target.closest('.dropdown-container') || target.closest('button[data-status-trigger]')) return;
      setOpenDropdownId(null);
    };

    // Use capture phase to handle event earlier
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [openDropdownId]);

  // Collapsed View
  if (isCollapsed) {
    return (
      <div
        onClick={onToggleCollapse}
        className="flex flex-col items-center gap-2 w-[40px] h-full cursor-pointer transition-all shrink-0"
        title={column.name}
      >
        <div className={`flex flex-col items-center justify-center gap-1.5 py-2 px-2 rounded-md shadow-sm border ${styles.main} ${styles.border}`}>
          <Icon className={`w-3.5 h-3.5 text-white ${column.id === 'technical-test' ? 'animate-spin-slow' : ''}`} />
          <span
            className="text-[11px] font-bold text-white uppercase tracking-wide whitespace-nowrap select-none"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            {column.name}
          </span>
        </div>
        <div className={`flex items-center justify-center min-w-[20px] h-6 px-1.5 bg-white rounded-md shadow-sm border ${styles.border}`}>
          <span className={`text-xs font-bold ${styles.text}`} style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
            {column.count}
          </span>
        </div>
      </div>
    );
  }

  // Expanded View
  return (
    <div 
      className={`flex flex-col h-fit max-h-full transition-all rounded-xl shrink-0 ${styles.columnBg} ${styles.border} ${hasHighlightedItem ? 'animate-shake ring-2 ring-amber-400 ring-offset-2' : ''}`} 
      style={{ width: 280 }}
    >
      {/* Header */}
      <div className="flex flex-col px-2 pt-2.5 pb-0">
        <div className="flex items-center justify-between cursor-pointer group mb-1.5" onClick={onToggleCollapse}>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 pl-2 pr-3 py-1 rounded-md shadow-sm ${styles.main}`}>
              <Icon className={`w-3.5 h-3.5 text-white ${column.id === 'technical-test' ? 'animate-spin-slow' : ''}`} />
              <span className="text-[11px] font-bold text-white uppercase tracking-wide truncate max-w-[150px]">
                {column.name}
              </span>
            </div>
            <div className={`flex items-center justify-center min-w-[20px] h-6 px-1.5 bg-white rounded-md shadow-sm border border-white/50`}>
              <span className={`text-xs font-bold ${styles.text}`}>{column.count}</span>
            </div>
          </div>
          <button className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-zinc-700 rounded hover:bg-black/5">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body / List - Changed to overflow-visible */}
      <div className="space-y-2.5 overflow-visible px-2 pb-2">
        {column.items.map((item) => {
          const isHighlighted = highlightItemId === item.id;
          const isUpdating = updatingId === item.id;
          const isDropdownOpen = openDropdownId === item.id;
          
          return (
            <div
              key={item.id}
              className={`
                rounded-2xl border p-3 shadow-sm cursor-pointer transition-all relative
                ${item.isRejected
                  ? 'border-red-300 bg-red-50/50 opacity-60 hover:opacity-80'
                  : isHighlighted 
                    ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-300 animate-pulse-highlight'
                    : 'border-zinc-200 bg-white/90 hover:shadow-md'
                }
              `}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.tagName !== 'SELECT' && !target.closest('.dropdown-container') && !target.closest('button')) {
                   onItemClick?.(item.id);
                }
              }}
            >
              {/* History Button */}
              {item.hasHistoryButton && (
                <div className="absolute top-2 right-2">
                  <button
                    className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-pink-200 transition-colors text-zinc-600 hover:text-pink-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      onHistoryClick?.(item.id);
                    }}
                    title="View History"
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="space-y-2">
                {/* Title */}
                <div>
                  <span className={`
                    text-sm font-semibold cursor-pointer hover:text-pink-600 hover:underline
                    ${item.isRejected ? 'text-red-600 line-through' : 'text-zinc-800'}
                  `}>
                    {item.title}
                  </span>
                  {item.isRejected && (
                    <span className="ml-2 text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded border border-red-200">
                      REJECTED
                    </span>
                  )}
                </div>

                {/* Subtitle */}
                {item.subtitle && (
                  <div>
                    <span
                      className={`
                        text-xs font-semibold cursor-pointer hover:text-pink-600 hover:underline
                        ${item.isRejected ? 'text-red-500 line-through' : 'text-zinc-800'}
                      `}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.subtitleId && onSubtitleClick) {
                          onSubtitleClick(item.subtitleId);
                        }
                      }}
                    >
                      {item.subtitle}
                    </span>
                  </div>
                )}

                {/* Metadata Rows */}
                {item.metadata?.map((meta, idx) => (
                  <div key={idx}>
                    <p className={`text-xs ${item.isRejected ? 'text-red-400' : 'text-zinc-600'}`}>
                      <span className="text-zinc-400">{meta.label}:</span> {meta.value}
                    </p>
                  </div>
                ))}

                {/* Reminder Badge */}
                {item.reminderBadge && !item.isRejected && (
                  <div className="pt-1">
                    {item.reminderBadge.type === 'overdue' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 border border-red-200">
                        ⚠️ Overdue {item.reminderBadge.days} days
                      </span>
                    ) : item.reminderBadge.type === 'today' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                        🔔 Reminder today
                      </span>
                    ) : item.reminderBadge.type === 'upcoming' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700 border border-green-200">
                        ✓ {item.reminderBadge.days} days left
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-200">
                        📅 {item.reminderBadge.days} days left
                      </span>
                    )}
                  </div>
                )}

                {/* Guarantee Progress */}
                {item.onboardingDate && !item.isRejected && (
                   <GuaranteePeriodProgress onboardingDate={item.onboardingDate} />
                )}

                {/* Dropdown Container */}
                <div className="flex flex-wrap items-center gap-3 text-[11px] mt-2 dropdown-container">
                  <div className="flex items-center gap-1.5 w-full relative">
                    <span className="text-zinc-400">Status:</span>
                    
                    <button
                      onClick={(e) => {
                          e.stopPropagation();
                          if (!isUpdating && !item.isRejected) {
                              setOpenDropdownId(isDropdownOpen ? null : item.id);
                          }
                      }}
                      disabled={isUpdating || item.isRejected}
                      className={`inline-flex items-center justify-center px-3 py-0.5 rounded-full text-[11px] font-medium border transition-all ${getStatusColor(item.status)} ${
                        isUpdating ? 'opacity-50' : item.isRejected ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-95 active:scale-95 shadow-sm'
                      }`}
                    >
                      {item.status}
                      {isUpdating ? (
                        <Loader2 size={11} className="ml-1 animate-spin" />
                      ) : (
                        <ChevronDown size={11} className="ml-1 opacity-40" />
                      )}
                    </button>

                    {/* Simple Dropdown - No Portal */}
                    {isDropdownOpen && (
                      <div className="absolute left-0 top-full mt-2 w-56 rounded-xl shadow-2xl bg-white border border-gray-100 z-[100] max-h-[300px] overflow-y-auto animate-in fade-in zoom-in-95 duration-100 origin-top-left">
                        <div className="py-1.5 px-0.5">
                          {availableStatuses.map((option) => (
                            <button
                              key={option.value}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChangeInternal(item.id, option.value);
                              }}
                              className={`w-full text-left px-3 py-2 transition-colors flex items-center group/opt hover:bg-gray-50 rounded-md ${
                                item.status === option.value ? 'bg-pink-50/50' : ''
                              }`}
                            >
                              <div className="w-5 flex items-center justify-start mr-1">
                                {item.status === option.value && <Check size={14} className="text-green-600" />}
                              </div>
                              <div className="flex-1 flex flex-col justify-start">
                                <div className="flex items-center justify-between w-full">
                                  <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(option.value)}`}>
                                    {option.label}
                                  </span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          );
        })}

        {/* Add Button */}
        {showAddButton && !isCollapsed && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddClick?.(column.id);
            }}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-lg mb-1 transition-all border border-dashed border-pink-300 ${styles.text} hover:bg-white/60 hover:border-pink-400`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        )}
      </div>
    </div>
  );
}

export const BDKanbanColumn = memo(BDKanbanColumnComponent);

// Sub-components
function GuaranteePeriodProgress({ onboardingDate }: { onboardingDate: string }) {
    const [, setDaysElapsed] = useState(0);
    const [daysRemaining, setDaysRemaining] = useState(60);
    const [progressPercentage, setProgressPercentage] = useState(0);

    useEffect(() => {
        const calculateProgress = () => {
        const today = new Date();
        const onboarding = new Date(onboardingDate);
        
        today.setHours(0, 0, 0, 0);
        onboarding.setHours(0, 0, 0, 0);
        
        const diffTime = today.getTime() - onboarding.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        const GUARANTEE_DAYS = 60;
        const elapsed = Math.max(0, diffDays);
        const remaining = Math.max(0, GUARANTEE_DAYS - elapsed);
        const percentage = Math.min(100, (elapsed / GUARANTEE_DAYS) * 100);
        
        setDaysElapsed(elapsed);
        setDaysRemaining(remaining);
        setProgressPercentage(percentage);
        };

        calculateProgress();
    }, [onboardingDate]);

    const isExpired = daysRemaining <= 0;
    const isWarning = daysRemaining <= 7 && daysRemaining > 0;

    return (
        <div className="space-y-1.5 pt-1 border-t border-zinc-200">
        <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-500 font-medium">Warranty (60 days)</span>
            <span className={`font-semibold ${
            isExpired ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-cyan-600'
            }`}>
            {isExpired ? 'Expired' : `${daysRemaining} days left`}
            </span>
        </div>
        <div className="w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden">
            <div
            className={`h-full transition-all duration-300 ${
                isExpired ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-cyan-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
            />
        </div>
        </div>
    );
}
