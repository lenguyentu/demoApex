// @ts-nocheck
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { ProcessList } from '../components/ProcessList';
import useDebounce from '../../../hooks/useDebounce';
import { Search, Users } from 'lucide-react';
import { ClientSelect } from '../../../components/ClientSelect';
import { OwnerSelect } from '../../../components/OwnerSelect';
import { JobSelect } from '../../../components/JobSelect';
import { DateRangePicker, type DateRange } from '../../../components/DateRangePicker';
import { STATUS_CONFIG, ROLE_OPTIONS } from '../constants';
import { useAuthStore } from '../../auth/store';

import { useProcessesList, useProcessesCount } from '../hooks';
import type { GetProcessesParams } from '../api';

export function ProcessPage() {
  const { user } = useAuthStore();
  const canSeeOwnerFilters = ['Admin', 'HR', 'BD', 'Community Manager', 'BD Lead', 'HH Lead'].includes(user?.role ?? '');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [jobFilter, setJobFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState(user?.id || '');
  const [ownerRoleFilter, setOwnerRoleFilter] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });
  const [myTeamOnly, setMyTeamOnly] = useState(false);
  
  const debouncedSearch = useDebounce(searchQuery, 400);

  const currentFilters = useMemo<GetProcessesParams>(() => ({
    searchTerm: debouncedSearch || null,
    statusFilter: statusFilter || null,
    clientFilter: clientFilter || null,
    jobIdFilter: jobFilter || null,
    ownerIdFilter: ownerFilter || null,
    ownerRoleFilter: ownerRoleFilter || null,
    myTeamHrId: myTeamOnly && user?.id ? user.id : null,
    dateFrom: dateRange.from?.toISOString() || null,
    dateTo: dateRange.to?.toISOString() || null,
  }), [debouncedSearch, statusFilter, clientFilter, jobFilter, ownerFilter, ownerRoleFilter, myTeamOnly, user?.id, dateRange.from, dateRange.to]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useProcessesList(currentFilters);

  // Flatten all pages into single array
  const allData = data?.pages.flatMap(page => page.data) || [];
  const loading = isLoading || (isFetching && allData.length === 0);

  // Total count query with same filters
  const { data: totalCount } = useProcessesCount(currentFilters);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Realtime subscription - invalidate cache on changes
  useEffect(() => {
    const processChannel = supabase
      .channel('public:processes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'processes' },
        () => {
          refetch();
        }
      )
      .subscribe();

    // Also listen to process_comments and process_comment_reads for unread count updates
    const commentChannel = supabase
      .channel('public:process_comments_and_reads')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'process_comments' },
        () => {
          refetch();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'process_comment_reads' },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(processChannel);
      supabase.removeChannel(commentChannel);
    };
  }, [refetch]);

  return (
    <div className="p-6 space-y-6">
       {/* Header */}
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Processes</h1>
          <p className="text-sm text-gray-500 mt-1">Manage recruitment processes</p>
        </div>
      </div>

       {/* Filters - Grid layout for better responsiveness and alignment */}
       <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Row 1 */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search name/email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
            />
          </div>

          <select 
            className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.displayName}</option>
            ))}
          </select>

          {/* Conditionally render Role, Owner, and My Team filters based on permissions */}
            {canSeeOwnerFilters && (
              <select 
                className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                value={ownerRoleFilter}
                onChange={(e) => setOwnerRoleFilter(e.target.value)}
              >
                {ROLE_OPTIONS.map((opt: { value: string; label: string }) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}

          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            className="w-full"
          />

          {/* Row 2 */}
          <div className="w-full">
            <ClientSelect
              value={clientFilter}
              onChange={setClientFilter}
              placeholder="Client..."
            />
          </div>

          <div className="w-full">
            <JobSelect
              value={jobFilter}
              onChange={setJobFilter}
              placeholder="Job..."
            />
          </div>

          {canSeeOwnerFilters && (
            <div className="w-full">
              <OwnerSelect
                value={ownerFilter}
                onChange={setOwnerFilter}
                placeholder="Owner..."
              />
            </div>
          )}

          <div className="flex items-center gap-3 w-full">
            <button
              onClick={() => setMyTeamOnly(!myTeamOnly)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                myTeamOnly 
                  ? 'bg-brand-500 text-white border-brand-500' 
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Users size={14} />
              My Team
            </button>
            {canSeeOwnerFilters && (
              <div className="text-xs text-gray-500 font-medium whitespace-nowrap">
                Total: {totalCount ?? allData.length}
              </div>
            )}
          </div>
       </div>

      <ProcessList 
        data={allData}
        loading={loading}
        loadingMore={isFetchingNextPage}
        hasMore={!!hasNextPage}
        loadMore={loadMore}
        totalCount={totalCount}
        refetchData={refetch}
      />
    </div>
  );
}
