import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { CustomerHeader } from "../components/CustomerHeader";
import { CustomerFilters } from "../components/CustomerFilters";
import { CustomerTable } from "../components/CustomerTable";
import { BDKanbanBoard } from "../components/BDKanbanBoard";
import { BDHistoryModal } from "../components/BDHistoryModal";
import { BDCustomerDetailModal } from "../components/BDCustomerDetailModal";
import { useBDCustomers } from "../hooks";
import { LoadMoreButton } from "../../../components/LoadMoreButton";

import { useAuthStore } from "../../auth/store"; // Import store

// import { useFlattenedClients } from "../../clients/hooks";

export const CustomerListPage = () => {
  const { user } = useAuthStore();
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  
  // Use clients to auto-select
  // const { data: clients } = useFlattenedClients();

  // Modal State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState<{ id: string, name: string, status?: string } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    search: '',
    status: 'All Statuses',
    priority: 'All',
    domain: 'All Domains',
    source: 'All sources',
    owner_id: user?.id || '' // Default to current user
  });

  const [searchParams] = useSearchParams();

  // Handle opening detail from URL query param
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setDetailId(id);
      // Optional: clear the param after opening to avoid re-opening on refresh if not desired
      // But usually it's better to keep it if we want bookmarkable links.
      // For now, let's just set it.
    }
  }, [searchParams]);

  const { customers, isLoading, error, hasMore, loadMore, totalCount } = useBDCustomers({ 
    filters,
    pageSize: viewMode === 'kanban' ? 1000 : 20
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleOpenHistory = (id: string, name: string, status?: string) => {
      setHistoryData({ id, name, status });
      setIsHistoryOpen(true);
  };
  /* View Mode Handlers */
  const handleViewModeChange = (mode: 'table' | 'kanban') => {
    setViewMode(mode);
    if (mode === 'kanban') {
        // Set owner filter to current user when entering Kanban (for focus & performance)
        setFilters(prev => ({ ...prev, owner_id: user?.id || '' }));
    } else {
        // Restore current user filter when going back to Table
        setFilters(prev => ({ ...prev, owner_id: user?.id || '' }));
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <CustomerHeader 
        viewMode={viewMode} 
        onViewModeChange={handleViewModeChange}
      />
      
      <CustomerFilters 
        filters={filters}
        onFilterChange={handleFilterChange}
        hideStatus={viewMode === 'kanban'}
      />
      
      {!!error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
          Error loading customers: {(error as any)?.message || 'Unknown error occurred'}
        </div>
      )}

      {viewMode === 'table' && (
          <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Showing <span className="font-bold text-gray-900 dark:text-white">{customers.length}</span> / {totalCount ?? '...'} customers
          </div>
      )}

      {isLoading && customers.length === 0 ? (
        <div className="flex justify-center p-8">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      ) : (
        <>
          {/* Main Content: Table or Kanban */}
          {viewMode === 'table' ? (
              <CustomerTable 
                  data={customers} 
                  onOpenHistory={handleOpenHistory}
              />
          ) : (
              <>
                {!filters.owner_id ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-yellow-900 mb-1">
                          Please select an assignee
                        </h3>
                        <p className="text-sm text-yellow-700">
                          Kanban view requires selecting a specific BD to ensure best performance.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <BDKanbanBoard 
                      customers={customers} 
                      onOpenHistory={handleOpenHistory}
                      onItemClick={setDetailId}
                  />
                )}
              </>
          )}
          
          {/* Load More: Only show for Table */}
          {viewMode === 'table' && (
              <div className="mt-8 flex justify-center">
                 <LoadMoreButton 
                   hasMore={hasMore} 
                   loading={isLoading} 
                   onClick={loadMore} 
                 />
               </div>
          )}
          
          {!isLoading && customers.length === 0 && (
             <div className="text-center py-12 text-gray-500">
                No customers found. Try adjusting your filters.
             </div>
          )}
        </>
      )}

      <BDHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        processId={historyData?.id || ''}
        clientName={historyData?.name || ''}
        filterStatus={historyData?.status}
      />
      
      <BDCustomerDetailModal
        isOpen={!!detailId}
        onClose={() => setDetailId(null)}
        processId={detailId || ''}
      />
    </div>
  );
};
