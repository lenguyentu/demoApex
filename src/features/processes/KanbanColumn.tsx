import { Clock, Plus, MoreHorizontal, ChevronDown, FileText, type LucideIcon } from 'lucide-react';
import { memo, useState, useEffect, useMemo } from 'react';

// --- Types ---
export interface KanbanItem {
  id: string;
  title: string;          // e.g. Candidate Name
  subtitle?: string;      // e.g. Job Code - Job Title
  subtitleId?: string;    // ID for subtitle click action
  
  // Metadata rows (e.g. Recruiter, Last Update)
  metadata?: {
    label: string;
    value: string;
  }[];
  status: string;
  isRejected?: boolean;
  
  // Specific UI flags
  hasHistoryButton?: boolean;
  onboardingDate?: string; // If present, shows the progress bar
  
  // Reminder badge for BD processes
  reminderBadge?: {
    type: 'overdue' | 'today' | 'upcoming' | 'future';
    days?: number;
  };
}

export interface KanbanColumnData {
  id: string;
  name: string;
  count: number;
  items: KanbanItem[];
}

export interface KanbanColumnProps {
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
  availableStatuses?: { value: string; label: string; group?: string }[];
  showAddButton?: boolean;
  
  // Custom Styles (Optional Override)
  colorTheme?: {
    main: string;     // bg-color-600
    columnBg: string; // bg-color-50
    border: string;   // border-color-200
    text: string;     // text-color-700
    icon?: LucideIcon;
  };
}

// --- Default Color Themes ---
const DEFAULT_THEME = {
  main: 'bg-blue-600',
  columnBg: 'bg-blue-50/80',
  border: 'border-blue-200',
  text: 'text-blue-700',
  icon: FileText,
};

// --- Main Component ---
function KanbanColumnComponent({
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
}: KanbanColumnProps) {
  
  // Ensure we have a theme
  const styles = useMemo(() => colorTheme || DEFAULT_THEME, [colorTheme]);
  const Icon = styles.icon || FileText;

  // Check if this column contains the highlighted item
  const hasHighlightedItem = useMemo(() => {
    if (!highlightItemId) return false;
    return column.items.some(c => c.id === highlightItemId);
  }, [highlightItemId, column.items]);

  // --- Collapsed View ---
  if (isCollapsed) {
    return (
      <div
        onClick={onToggleCollapse}
        className="flex flex-col items-center gap-2 w-[40px] h-full cursor-pointer transition-all"
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

  // --- Expanded View ---
  return (
    <div 
      className={`flex flex-col h-fit max-h-full transition-all rounded-xl ${styles.columnBg} ${styles.border} ${hasHighlightedItem ? 'animate-shake ring-2 ring-amber-400 ring-offset-2' : ''}`} 
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

      {/* Body / List */}
      <div className="space-y-2.5 overflow-y-auto custom-scrollbar px-2 pb-2">
        {column.items.map((item) => {
          const isHighlighted = highlightItemId === item.id;
          
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
                // Prevent click if interacting with controls
                if (target.tagName !== 'SELECT' && !target.closest('select') && !target.closest('button')) {
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

                {/* Subtitle (e.g. Job) */}
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

                {/* Guarantee Progress (Optional) */}
                {item.onboardingDate && !item.isRejected && (
                   <GuaranteePeriodProgress onboardingDate={item.onboardingDate} />
                )}

                {/* Status Dropdown */}
                <div className="flex flex-wrap items-center gap-3 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-400">Status:</span>
                    <div className="relative inline-block">
                      <select
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 pr-7 text-xs font-medium rounded border focus:outline-none focus:ring-2 focus:ring-offset-1 appearance-none bg-white 
                          ${item.isRejected ? 'cursor-not-allowed opacity-50 pointer-events-none' : 'cursor-pointer hover:border-zinc-400'}`}
                        value={item.isRejected ? 'rejected' : item.status}
                        disabled={item.isRejected}
                        onChange={(e) => {
                          e.stopPropagation();
                          onStatusChange?.(item.id, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {availableStatuses.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                        <option value="rejected">REJECTED</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
                    </div>
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

// Optimization
export const KanbanColumn = memo(KanbanColumnComponent);

// --- Sub-components ---
/**
 * Guarantee Progress Logic
 */
function GuaranteePeriodProgress({ onboardingDate }: { onboardingDate: string }) {
  const [daysElapsed, setDaysElapsed] = useState(0);
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
    const interval = setInterval(calculateProgress, 1000 * 60 * 60);

    return () => clearInterval(interval);
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
      <div className="flex items-center justify-between text-[10px] text-zinc-400">
        <span>Elapsed: {daysElapsed} days</span>
        <span>Start: {new Date(onboardingDate).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
