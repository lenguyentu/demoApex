import React, { useMemo, useState, useCallback } from 'react';
import { BDKanbanColumn } from './BDKanbanColumn';
import type { KanbanItem } from '../../processes/components/KanbanColumn';
import type { BDCustomer } from '../types';
import { useUpdateBDStatus } from '../hooks';
import { BDStatusModal } from './BDStatusModal';
import { FileText, UserPlus, Send, MessageCircle, PenTool, CheckCircle, Shield, XCircle, HelpingHand } from 'lucide-react';

interface BDKanbanBoardProps {
  customers: BDCustomer[];
  onOpenHistory: (id: string, name: string) => void;
  onItemClick?: (processId: string) => void;
}

// Định nghĩa cấu hình cột và mapping status
const COLUMNS_DEF = [
  { 
    id: 'Research', 
    label: 'Research', 
    statuses: ['Research'], 
    theme: { main: 'bg-gray-500', columnBg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', icon: FileText } 
  },
  { 
    id: 'Connect', 
    label: 'Connect', 
    statuses: ['Addfriend/Connect'], 
    theme: { main: 'bg-blue-500', columnBg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700', icon: UserPlus } 
  },
  { 
    id: 'Approach', 
    label: 'Approach', 
    statuses: ['Approach'], 
    theme: { main: 'bg-indigo-500', columnBg: 'bg-indigo-50/50', border: 'border-indigo-100', text: 'text-indigo-700', icon: Send } 
  },
  { 
    id: 'Follow up', 
    label: 'Follow Up', 
    statuses: ['Follow up'], 
    theme: { main: 'bg-purple-500', columnBg: 'bg-purple-50/50', border: 'border-purple-100', text: 'text-purple-700', icon: MessageCircle } 
  },
  { 
    id: 'Consulting', 
    label: 'Consulting', 
    statuses: ['Consulting', 'Meeting Clear JD', 'Demo contract'], 
    theme: { main: 'bg-pink-500', columnBg: 'bg-pink-50/50', border: 'border-pink-100', text: 'text-pink-700', icon: HelpingHand } 
  },
  { 
    id: 'Signing', 
    label: 'Signing', 
    statuses: ['Signing'], 
    theme: { main: 'bg-orange-500', columnBg: 'bg-orange-50/50', border: 'border-orange-100', text: 'text-orange-700', icon: PenTool } 
  },
  { 
    id: 'Signed', 
    label: 'Signed', 
    statuses: ['Signed'], 
    theme: { main: 'bg-green-600', columnBg: 'bg-green-50', border: 'border-green-100', text: 'text-green-700', icon: CheckCircle } 
  },
  { 
    id: 'Hunting', 
    label: 'Hunting (Post-Sales)', 
    statuses: ['Hunting', 'Take care'], 
    theme: { main: 'bg-teal-500', columnBg: 'bg-teal-50', border: 'border-teal-100', text: 'text-teal-700', icon: Shield } 
  },
  { 
    id: 'Lost', 
    label: 'Lost / Stopped', 
    statuses: ['No current need', 'Excluded', 'Reject', 'Closed', 'Working', 'Hiring', 'Pending'], 
    theme: { main: 'bg-red-500', columnBg: 'bg-red-50', border: 'border-red-100', text: 'text-red-700', icon: XCircle } 
  }
];

// Pure function for reminder calculation - optimized for large datasets
const calculateReminderBadge = (
  lastContactDate: string | null,
  status: string,
  isRejected: boolean,
  todayTime: number
): { type: 'overdue' | 'today' | 'upcoming' | 'future'; days?: number } | undefined => {
  const reminderStatuses = ['Research', 'Addfriend/Connect', 'Approach', 'Follow up'];
  
  if (!lastContactDate || isRejected || !reminderStatuses.includes(status)) {
    return undefined;
  }

  const anchorDate = new Date(lastContactDate);
  anchorDate.setHours(0, 0, 0, 0);
  const anchorTime = anchorDate.getTime();
  
  // Calculate days since last contact
  const diffDays = Math.floor((todayTime - anchorTime) / 86400000);
  
  // Rolling reminder logic: 7 → 15 → 30
  const reminderType = diffDays <= 7 ? 7 : diffDays <= 15 ? 15 : 30;
  
  // Calculate due date
  const dueDiffDays = Math.ceil((anchorTime + reminderType * 86400000 - todayTime) / 86400000);
  
  // 4-tier badge system
  return dueDiffDays < 0 
    ? { type: 'overdue', days: -dueDiffDays }
    : dueDiffDays === 0 
      ? { type: 'today' }
      : dueDiffDays <= 3 
        ? { type: 'upcoming', days: dueDiffDays }
        : { type: 'future', days: dueDiffDays };
};

export const BDKanbanBoard = ({ customers, onOpenHistory, onItemClick }: BDKanbanBoardProps) => {
  const updateStatusMutation = useUpdateBDStatus();
  const [collapsedColumns, setCollapsedColumns] = useState<Record<string, boolean>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Modal State for Status Update
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusUpdateData, setStatusUpdateData] = useState<{
    itemId: string;
    newStatus: string;
    customer?: BDCustomer;
  } | null>(null);

  // Drag Scroll Logic initialized
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll-fast factor
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  // 1. Phân loại Customers vào các cột
  const columnsData = useMemo(() => {
    // Pre-calculate today ONCE for all customers
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();
    
    // Map status to column ID
    const statusToColumnId: Record<string, string> = {};
    COLUMNS_DEF.forEach(col => {
      col.statuses.forEach(s => statusToColumnId[s] = col.id);
    });

    // Initialize columns
    const cols = COLUMNS_DEF.map(def => ({
      id: def.id,
      name: def.label,
      def: def, // Keep ref to def for theme
      count: 0,
      items: [] as KanbanItem[]
    }));

    customers.forEach(cust => {
        let colId = statusToColumnId[cust.status];
        const isRejected = ['Reject', 'Excluded', 'No current need', 'Closed'].includes(cust.status);

        if (isRejected) {
             // Try to find previous status from history to place in that column
             const history = (cust as any).bd_process_history || [];
             // Sort by date desc
             const sortedHistory = [...history].sort((a: any, b: any) => new Date(b.change_date).getTime() - new Date(a.change_date).getTime());
             
             // Find the first status that is NOT a rejection status
             const prevItem = sortedHistory.find((h: any) => !['Reject', 'Excluded', 'No current need', 'Closed'].includes(h.status));
             
             if (prevItem && statusToColumnId[prevItem.status]) {
                 colId = statusToColumnId[prevItem.status];
             }
             // If no previous valid status found, it stays in statusToColumnId[cust.status] which is likely 'Lost' column
        }

        if (!colId) colId = 'Research'; // Fallback

        const colIndex = cols.findIndex(c => c.id === colId);
        if (colIndex !== -1) {
            const metadata = [];
            
            // Add PIC (owner) - full name
            if (cust.owner?.full_name) {
                metadata.push({ label: 'BD', value: cust.owner.full_name });
            }
            
            // Add Last Contact Date
            if (cust.last_contact_date) {
                const formattedDate = new Date(cust.last_contact_date).toLocaleDateString('vi-VN');
                metadata.push({ label: 'Update', value: formattedDate });
            }

            // Calculate reminder badge using pure function (optimized for large datasets)
            const reminderBadge = calculateReminderBadge(
                cust.last_contact_date,
                cust.status,
                isRejected,
                todayTime
            );

            cols[colIndex].items.push({
                id: cust.id,
                title: cust.client?.client_name || 'No Name',
                subtitle: cust.potential_job_title || undefined,
                status: cust.status,
                metadata: metadata,
                isRejected: isRejected,
                hasHistoryButton: true,
                reminderBadge: reminderBadge
            });
        }
    });

    // Update counts
    cols.forEach(c => c.count = c.items.length);

    return cols;
  }, [customers]);


  const handleToggleCollapse = (colId: string) => {
    setCollapsedColumns(prev => ({ ...prev, [colId]: !prev[colId] }));
  };

  const handleStatusChange = (itemId: string, newStatus: string) => {
      const customer = customers.find(c => c.id === itemId);
      setStatusUpdateData({ itemId, newStatus, customer });
      setIsStatusModalOpen(true);
  };
  
  const handleConfirmStatusUpdate = async (memo: string) => {
      if (!statusUpdateData) return;
      const { itemId, newStatus } = statusUpdateData;
      
      setUpdatingId(itemId);
      updateStatusMutation.mutate(
        { id: itemId, status: newStatus as any, memo },
        {
          onSettled: () => setUpdatingId(null)
        }
      );
      // Note: UI might flicker if React Query doesn't optimistically update fast enough, 
      // but standard mutation flow handles it via invalidateQueries.
      setIsStatusModalOpen(false);
      setStatusUpdateData(null);
  };


  // Memoize callbacks to prevent column re-renders
  const handleToggleCollapseCallback = useCallback((colId: string) => {
    handleToggleCollapse(colId);
  }, []);

  const handleItemClick = useCallback((processId: string) => {
    onItemClick?.(processId);
  }, [onItemClick]);

  const handleHistoryClickCallback = useCallback((processId: string) => {
    const clientName = customers.find(c => c.id === processId)?.client?.client_name || '';
    onOpenHistory(processId, clientName);
  }, [customers, onOpenHistory]);

  // AVAILABLE STATUSES for Dropdown
  const availableStatuses = useMemo(() => {
     // Flat list of all statuses
     const all: { value: string; label: string }[] = [];
     COLUMNS_DEF.forEach(c => {
         c.statuses.forEach(s => all.push({ value: s, label: s }));
     });
     return all;
  }, []);

  return (
    <>
    <div 
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto h-[calc(100vh-200px)] items-start cursor-grab active:cursor-grabbing select-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
    >
        <style>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {columnsData.map(col => (
            <BDKanbanColumn
                key={col.id}
                column={col}
                isCollapsed={collapsedColumns[col.id] || false}
                onToggleCollapse={() => handleToggleCollapseCallback(col.id)}
                colorTheme={col.def.theme}
                availableStatuses={availableStatuses}
                onStatusChange={handleStatusChange}
                updatingId={updatingId}
                onItemClick={handleItemClick}
                onHistoryClick={handleHistoryClickCallback}
            />
        ))}
    </div>

    <BDStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onConfirm={handleConfirmStatusUpdate}
        newStatus={statusUpdateData?.newStatus || ''}
        currentMemo={statusUpdateData?.customer?.memo || ''}
        clientName={statusUpdateData?.customer?.client?.client_name || ''}
    />
    </>
  );
};
