// @ts-nocheck
import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, History, FileText, UserPlus, Loader2, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDebounce } from '../../../hooks';

import { useAuthStore } from '../../auth/store';
import { PERMISSIONS } from '../../auth/constants';
import { 
  useFlattenedClients, 
  useDeleteClient, 
  useUpdateClientOwner,
  useUpdateBDProcess,
  useClientJobs,
  useIndustries,
  useOwnerOptions,
} from '../hooks';
import type { ClientFilters, Client, BDProcess, UpdateBDProcessPayload, BDPhase, BDStatus } from '../types';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { LoadMoreButton } from '../../../components/LoadMoreButton';
import { ClientSelect } from '../../../components/ClientSelect';

// Modals
import { HistoryModal } from '../components/HistoryModal';
import { MemoModal } from '../components/MemoModal';
import { ClientJobsModal } from '../components/ClientJobsModal';
import { ClientUserProvisioningModal } from '../components/ClientUserProvisioningModal';

// ============================================
// CONSTANTS
// ============================================

const RANK_OPTIONS = ['A', 'B', 'C', 'D', 'F', 'Z'] as const;

const RANK_DESCRIPTIONS: Record<string, string> = {
  A: 'Client with signed contract, successful billing & 1 round process',
  B: 'Client with signed contract, successful billing & multiple round process',
  C: 'Client with new contract (within 1 month), no cases yet',
  D: 'Client with old contract (over 1 month), no successful cases yet',
  F: 'Client without signed contract, waiting for CV demo to close',
  Z: 'Company not yet cooperated',
};

const RANK_COLORS: Record<string, string> = {
  A: 'bg-red-100 text-red-700 border-red-200',
  B: 'bg-orange-100 text-orange-700 border-orange-200',
  C: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  D: 'bg-blue-100 text-blue-700 border-blue-200',
  F: 'bg-purple-100 text-purple-700 border-purple-200',
  Z: 'bg-green-100 text-green-700 border-green-200',
};

const STATUS_COLORS: Record<string, string> = {
  'Research': 'bg-blue-50 text-blue-700 border-blue-200',
  'Addfriend/Connect': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Approach': 'bg-amber-50 text-amber-700 border-amber-200',
  'Follow up': 'bg-orange-50 text-orange-700 border-orange-200',
  'Consulting': 'bg-purple-50 text-purple-700 border-purple-200',
  'Hiring': 'bg-purple-50 text-purple-700 border-purple-200',
  'Demo contract': 'bg-pink-50 text-pink-700 border-pink-200',
  'Signing': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Meeting Clear JD': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Hunting': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Signed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Take care': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Closed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Working': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'Pending': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'No current need': 'bg-gray-100 text-gray-600 border-gray-200',
  'Excluded': 'bg-gray-100 text-gray-600 border-gray-200',
  'Reject': 'bg-red-50 text-red-600 border-red-200',
};

// ============================================
// HELPER COMPONENTS
// ============================================

const RankBadge = ({ rank }: { rank: string | null | undefined }) => {
  if (!rank) return <span className="text-gray-400">-</span>;
  
  return (
    <div className="relative group">
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full cursor-help shadow-sm ${RANK_COLORS[rank] || 'bg-gray-100 text-gray-600'}`}>
        {rank}
      </span>
      <div className="absolute z-30 hidden group-hover:block bg-white border border-gray-100 rounded-lg shadow-xl p-3 mt-2 min-w-[250px] left-1/2 -translate-x-1/2">
        <p className="text-sm text-gray-600">{RANK_DESCRIPTIONS[rank] || 'Unknown rank'}</p>
      </div>
    </div>
  );
};

const StatusBadge = ({ 
  status, 
  onClick 
}: { 
  status: string | null | undefined; 
  onClick?: () => void 
}) => {
  if (!status) return <span className="text-gray-400">N/A</span>;
  
  return (
    <button 
      onClick={onClick}
      className={`inline-flex px-2.5 py-1 text-[10px] font-semibold rounded-full border hover:opacity-80 transition shadow-sm ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}
    >
      {status}
    </button>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export function ClientsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const can = useAuthStore((state) => state.can);
  const userRole = user?.role;

  // Filters state (for dropdowns/immediate filters)
  const [filters, setFilters] = useState<ClientFilters>({});

  // Input states
  const [locationInput, setLocationInput] = useState('');
  const [hrEmailInput, setHrEmailInput] = useState('');
  const [hrPhoneInput, setHrPhoneInput] = useState('');

  // Debounced values
  const debouncedLocation = useDebounce(locationInput, 500);
  const debouncedHrEmail = useDebounce(hrEmailInput, 500);
  const debouncedHrPhone = useDebounce(hrPhoneInput, 500);

  // Merge filters
  const activeFilters = useMemo(() => ({
    ...filters,
    location: debouncedLocation || undefined,
    hr_email: debouncedHrEmail || undefined,
    hr_phone: debouncedHrPhone || undefined,
  }), [filters, debouncedLocation, debouncedHrEmail, debouncedHrPhone]);

  // Modal states
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [jobsClientId, setJobsClientId] = useState<string | null>(null);
  const [jobsClientName, setJobsClientName] = useState<string>('');
  
  const [historyProcessId, setHistoryProcessId] = useState<string | null>(null);
  
  const [memoProcessId, setMemoProcessId] = useState<string | null>(null);
  const [memoData, setMemoData] = useState<{ phase: BDPhase; status: BDStatus; memo: string } | null>(null);

  const [pendingOwnerChange, setPendingOwnerChange] = useState<{ clientId: string; ownerId: string | null } | null>(null);

  const [provisioningClient, setProvisioningClient] = useState<{ id: string; name: string } | null>(null);

  // Queries
  const { 
    data: clients, 
    totalCount,
    isLoading, 
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFlattenedClients(activeFilters);

  const { data: industries = [] } = useIndustries();
  const { data: ownerOptions = [] } = useOwnerOptions();
  
  // Job Data for Modal
  const { data: clientJobs = [], isLoading: jobsLoading } = useClientJobs(jobsClientId);

  // Mutations
  const deleteClientMutation = useDeleteClient();
  const updateOwnerMutation = useUpdateClientOwner();
  const updateBDProcessMutation = useUpdateBDProcess();

  // ============================================
  // HANDLERS
  // ============================================

  const handleFilterChange = useCallback((key: keyof ClientFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined }));
  }, []);

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteId(id);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteId) return;
    try {
      await deleteClientMutation.mutateAsync(deleteId);
      toast.success('Client deleted successfully');
      setDeleteId(null);
    } catch (error: any) {
      toast.error(error.message || 'Error deleting client');
    }
  }, [deleteId, deleteClientMutation]);


  const handleOwnerChange = useCallback((clientId: string, ownerId: string | null) => {
    setPendingOwnerChange({ clientId, ownerId });
  }, []);

  const handleConfirmOwnerChange = useCallback(async () => {
    if (!pendingOwnerChange) return;
    try {
      await updateOwnerMutation.mutateAsync({ 
        clientId: pendingOwnerChange.clientId, 
        ownerId: pendingOwnerChange.ownerId 
      });
      toast.success('Owner updated');
      setPendingOwnerChange(null);
    } catch (error: any) {
      toast.error(error.message || 'Error updating owner');
    }
  }, [pendingOwnerChange, updateOwnerMutation]);

  const handleViewJobs = useCallback((client: Client) => {
    setJobsClientId(client.id);
    setJobsClientName(client.client_name);
  }, []);

  const getClientBDData = useCallback((client: Client) => {
    const bdProcesses = client.bd_processes;
    if (Array.isArray(bdProcesses) && bdProcesses.length > 0) {
      return bdProcesses[0];
    }
    if (bdProcesses && !Array.isArray(bdProcesses)) {
      return bdProcesses as BDProcess;
    }
    return null;
  }, []);

  const handlePhaseClick = useCallback((client: Client) => {
    const bdData = getClientBDData(client);
    if (bdData) {
      setMemoProcessId(bdData.id);
      setMemoData({
        phase: bdData.phase,
        status: bdData.status,
        memo: bdData.memo || ''
      });
    } else {
      toast.error('Client does not have a BD process');
    }
  }, [getClientBDData]);

  const handleHistoryClick = useCallback((client: Client) => {
    const bdData = getClientBDData(client);
    if (bdData) {
      setHistoryProcessId(bdData.id);
    } else {
      toast.error('Client does not have a BD process history');
    }
  }, [getClientBDData]);

  const handleUpdateMemo = useCallback(async (payload: UpdateBDProcessPayload) => {
    if (!memoProcessId) return;
    try {
      await updateBDProcessMutation.mutateAsync({ processId: memoProcessId, payload });
      toast.success('Status updated successfully');
      setMemoProcessId(null);
    } catch (error: any) {
      toast.error(error.message || 'Error updating');
    }
  }, [memoProcessId, updateBDProcessMutation]);

  const handleProvisioningSort = useCallback((client: Client) => {
    setProvisioningClient({ id: client.id, name: client.client_name });
  }, []);

  // ============================================
  // RENDER
  // ============================================

  // Removed early loading return to allow filter usage while loading

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <p className="text-red-600 mb-4">Error: {(error as Error).message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white ">
        <div className="px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-brand-50 text-brand-600 rounded-lg p-2">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Clients & Companies</h1>
                <p className="text-sm text-gray-500">Manage client information</p>
              </div>
            </div>
            {can(PERMISSIONS.MANAGE_CLIENTS) && (
              <button
                onClick={() => navigate('/tables/clients/new')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Client
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Search Filters</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Client Name</label>
              <ClientSelect
                value={filters.id || ''}
                onChange={(id) => setFilters(prev => ({ ...prev, id: id || undefined }))}
                placeholder="Select client..."
                className="w-full text-sm"
              />
            </div>

            {/* Rank */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Rank</label>
              <select
                value={filters.client_rank || ''}
                onChange={(e) => handleFilterChange('client_rank', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm outline-none"
              >
                <option value="">All</option>
                {RANK_OPTIONS.map((rank) => (
                  <option key={rank} value={rank}>Rank {rank}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Status</label>
              <select
                value={filters.phase || ''}
                onChange={(e) => handleFilterChange('phase', e.target.value)}
                 className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm outline-none"
              >
                <option value="">All</option>
                <optgroup label="Phase 1: Connect">
                  <option value="Research">Research</option>
                  <option value="Addfriend/Connect">Addfriend/Connect</option>
                  <option value="Approach">Approach</option>
                </optgroup>
                <optgroup label="Phase 2: Working">
                  <option value="Follow up">Follow up</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Meeting Clear JD">Meeting Clear JD</option>
                  <option value="Demo contract">Demo contract</option>
                  <option value="Signing">Signing</option>
                </optgroup>
                <optgroup label="Phase 3: End/Nurture">
                  <option value="Signed">Signed</option>
                  <option value="Hunting">Hunting</option>
                  <option value="Take care">Take care</option>
                  <option value="No current need">No current need</option>
                  <option value="Excluded">Excluded</option>
                </optgroup>
              </select>
            </div>

            {/* Owner - Hiện cho tất cả trừ Headhunter (BD được xem) */}
            {userRole !== 'Headhunter' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Owner</label>
                <select
                  value={filters.owner_id || ''}
                  onChange={(e) => handleFilterChange('owner_id', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm outline-none"
                >
                  <option value="">All</option>
                  {ownerOptions.map((owner) => (
                    <option key={owner.id} value={owner.id}>{owner.full_name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Second row filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-dashed border-gray-100">
            {/* Location */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Location</label>
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="Enter location..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
              />
            </div>

            {/* Industry */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Industry</label>
              <select
                value={filters.client_industry || ''}
                onChange={(e) => handleFilterChange('client_industry', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm outline-none"
              >
                <option value="">All</option>
                {industries.map((ind) => (
                  <option key={ind.id} value={ind.name}>{ind.name}</option>
                ))}
              </select>
            </div>

            {/* HR Email */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">HR Email</label>
              <input
                type="text"
                value={hrEmailInput}
                onChange={(e) => setHrEmailInput(e.target.value)}
                placeholder="search@email.com"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
              />
            </div>

            {/* HR Phone */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">HR Phone</label>
              <input
                type="text"
                value={hrPhoneInput}
                onChange={(e) => setHrPhoneInput(e.target.value)}
                placeholder="098..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
              />
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4 px-1">
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-900">{clients.length}</span> / <span className="font-semibold text-gray-900">{totalCount}</span> results
          </p>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden relative min-h-[400px]">
          {(isLoading || isFetchingNextPage) && (
            <div className="absolute top-0 left-0 w-full h-1 bg-brand-100 overflow-hidden z-20">
              <div className="w-full h-full bg-brand-500 animate-progress origin-left-right"></div>
            </div>
          )}
          
          {isLoading && clients.length === 0 ? (
             <div className="min-h-[400px] flex flex-col items-center justify-center">
               <Loader2 className="w-10 h-10 animate-spin text-brand-500 mb-4" />
               <p className="text-gray-500">Loading list...</p>
             </div>
          ) : clients.length === 0 ? (
            <div className="min-h-[400px] flex flex-col items-center justify-center">
              <FileText className="w-16 h-16 text-gray-200 mb-4" />
              <p className="text-gray-500">No matching data found</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client Name</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Rank</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[150px]">Location</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Industry</th>
                      {userRole !== 'Headhunter' && (
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[200px]">Owner</th>
                      )}
                      {can(PERMISSIONS.VIEW_CLIENTS) && (
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {clients.map((client) => {
                      const bdData = getClientBDData(client);
                      return (
                        <tr key={client.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => handleViewJobs(client)}
                              className="text-gray-900 font-medium hover:text-brand-600 text-left transition-colors"
                            >
                              {client.client_name}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <RankBadge rank={client.client_rank} />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <StatusBadge 
                              status={bdData?.status || 'Research'} 
                              onClick={() => handlePhaseClick(client)}
                            />
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-[150px]" title={client.location || ''}>
                            {client.location || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {client.client_industry || '-'}
                          </td>
                          {userRole !== 'Headhunter' && (
                            <td className="px-6 py-4 min-w-[200px]">
                              <select
                                value={client.owner_id || ''}
                                onChange={(e) => handleOwnerChange(client.id, e.target.value || null)}
                                className="text-xs border-gray-200 rounded px-2 py-1.5 w-full focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                              >
                                <option value="">None</option>
                                {ownerOptions.map((owner) => (
                                  <option key={owner.id} value={owner.id}>{owner.full_name}</option>
                                ))}
                              </select>
                            </td>
                          )}
                          {can(PERMISSIONS.VIEW_CLIENTS) && (
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => navigate(`/tables/clients/new/${client.id}`)}
                                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {can(PERMISSIONS.CREATE_JOB) && (
                                  <button
                                    onClick={() => navigate(`/jobs/new?client_id=${client.id}`)}
                                    className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                                    title="Create Job"
                                  >
                                    <Briefcase className="w-4 h-4" />
                                  </button>
                                )}
                                {can(PERMISSIONS.MANAGE_CLIENTS) && (
                                  <>
                                    <button
                                      onClick={() => handleHistoryClick(client)}
                                      className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded transition-all"
                                      title="History"
                                    >
                                      <History className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleProvisioningSort(client)}
                                      className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-all"
                                      title="Provision Account"
                                    >
                                      <UserPlus className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => navigate(`/tables/clients/new/${client.id}`, { state: { isEdit: true } })}
                                      className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                                      title="Edit"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile Cards */}
              <div className="lg:hidden divide-y divide-gray-100">
                {clients.map((client) => {
                  const bdData = getClientBDData(client);
                  return (
                    <div key={client.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <button 
                          onClick={() => handleViewJobs(client)}
                          className="text-gray-900 font-semibold hover:text-blue-600"
                        >
                          {client.client_name}
                        </button>
                        <div className="flex items-center gap-2">
                          <RankBadge rank={client.client_rank} />
                          <StatusBadge 
                            status={bdData?.status || 'Research'} 
                            onClick={() => handlePhaseClick(client)}
                          />
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1 mb-3">
                        <p><span className="font-medium">Location:</span> {client.location || '-'}</p>
                        <p><span className="font-medium">Industry:</span> {client.client_industry || '-'}</p>
                      </div>
                      {['Admin', 'HR', 'BD'].includes(userRole || '') && (
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => navigate(`/tables/clients/view/${client.id}`)}
                            className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg"
                          >
                            View
                          </button>
                          <button
                            onClick={() => navigate(`/jobs/new?client_id=${client.id}`)}
                            className="flex-1 px-3 py-2 text-sm bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center gap-2"
                          >
                             <Briefcase size={16} /> Job
                          </button>
                           <button
                            onClick={() => handleHistoryClick(client)}
                            className="flex-1 px-3 py-2 text-sm bg-purple-50 text-purple-600 rounded-lg"
                          >
                            History
                          </button>
                           <button
                            onClick={() => handleProvisioningSort(client)}
                            className="flex-1 px-3 py-2 text-sm bg-emerald-50 text-emerald-600 rounded-lg"
                          >
                            Portal
                          </button>
                          <button
                            onClick={() => handleDeleteClick(client.id)}
                            className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Load More */}
              {hasNextPage && (
                <div className="p-4 border-t">
                  <LoadMoreButton
                    onClick={() => { fetchNextPage(); }}
                    loading={isFetchingNextPage}
                    hasMore={!!hasNextPage}
                    loadedCount={clients.length}
                    totalCount={totalCount}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* MODALS */}
      
      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Client"
        message="Are you sure you want to delete this client? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteClientMutation.isPending}
      />

      <ConfirmModal
        open={!!pendingOwnerChange}
        onClose={() => setPendingOwnerChange(null)}
        onConfirm={handleConfirmOwnerChange}
        title="Confirm Owner Change"
        message="Are you sure you want to change the owner for this client?"
        confirmText="Update"
        cancelText="Cancel"
        variant="info"
        isLoading={updateOwnerMutation.isPending}
      />

      <HistoryModal
        isOpen={!!historyProcessId}
        onClose={() => setHistoryProcessId(null)}
        processId={historyProcessId || ''}
      />

      {memoData && (
        <MemoModal
          isOpen={!!memoProcessId}
          onClose={() => setMemoProcessId(null)}
          onConfirm={handleUpdateMemo}
          currentPhase={memoData.phase}
          currentStatus={memoData.status}
          initialMemo={memoData.memo}
          loading={updateBDProcessMutation.isPending}
        />
      )}

      <ClientJobsModal
        isOpen={!!jobsClientId}
        onClose={() => setJobsClientId(null)}
        jobs={clientJobs}
        clientName={jobsClientName}
        loading={jobsLoading}
      />

      {provisioningClient && (
        <ClientUserProvisioningModal
          isOpen={!!provisioningClient}
          onClose={() => setProvisioningClient(null)}
          clientId={provisioningClient.id}
          clientName={provisioningClient.name}
        />
      )}
    </div>
  );
}

export default ClientsPage;
