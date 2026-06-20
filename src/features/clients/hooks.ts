// @ts-nocheck
import { MOCK_CLIENTS } from '../../mocks/clients';

export const clientKeys = {
  all: ['clients'] as const,
  lists: () => [...clientKeys.all, 'list'] as const,
  list: (filters: any) => [...clientKeys.lists(), filters] as const,
  detail: (id: string) => [...clientKeys.all, 'detail', id] as const,
  bdProcess: (clientId: string) => [...clientKeys.all, 'bd-process', clientId] as const,
  bdHistory: (processId: string) => [...clientKeys.all, 'bd-history', processId] as const,
  jobs: (clientId: string) => [...clientKeys.all, 'jobs', clientId] as const,
};

export const dropdownKeys = {
  locations: ['locations'] as const,
  industries: ['industries'] as const,
  owners: ['owners'] as const,
};

export function useClientsList(filters: any = {}) {
  let filtered = MOCK_CLIENTS;
  if (filters?.search) {
    filtered = MOCK_CLIENTS.filter(c => 
      c.client_name?.toLowerCase().includes(filters.search.toLowerCase())
    );
  }
  return {
    data: filtered,
    loading: false,
    hasMore: false,
    loadMore: () => {},
    totalCount: filtered.length,
    refresh: () => {},
  };
}

export function useFlattenedClients(filters: any = {}) {
  const result = useClientsList(filters);
  return {
    ...result,
    fetchNextPage: result.loadMore,
    hasNextPage: result.hasMore,
    isFetchingNextPage: result.loading,
    isLoading: false,
  };
}

export function useClientDetail(id: string | null) {
  return { data: MOCK_CLIENTS.find(c => c.id === id) || null, isLoading: false };
}

export function useCreateClient() {
  return { mutate: () => {}, mutateAsync: () => Promise.resolve() };
}

export function useUpdateClient() {
  return { mutate: () => {}, mutateAsync: () => Promise.resolve() };
}

export function useDeleteClient() {
  return { mutate: () => {}, mutateAsync: () => Promise.resolve() };
}

export function useUpdateClientOwner() {
  return { mutate: () => {}, mutateAsync: () => Promise.resolve() };
}

export function useProvisionClientUser() {
  return { mutate: () => {}, mutateAsync: () => Promise.resolve() };
}

export function useBDProcess(clientId: string | null) {
  return { data: null, isLoading: false };
}

export function useUpdateBDProcess() {
  return { mutate: () => {}, mutateAsync: () => Promise.resolve() };
}

export function useBDProcessHistory(processId: string | null) {
  return { data: [], isLoading: false };
}

export function useClientJobs(clientId: string | null) {
  return { data: [], isLoading: false };
}

export function useLocations() {
  return { data: [], isLoading: false };
}

export function useIndustries() {
  return { data: [], isLoading: false };
}

export function useOwnerOptions() {
  return { data: [], isLoading: false };
}
