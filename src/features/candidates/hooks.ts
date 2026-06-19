import { MOCK_CANDIDATES } from '../../mocks/candidates';

export const candidateKeys = {
  all: ['candidates'] as const,
  detail: (id: string) => [...candidateKeys.all, 'detail', id] as const,
  database: ['database-candidates'] as const,
  databaseDetail: (id: string) => [...candidateKeys.database, 'detail', id] as const,
};

export function useCandidateDetail(id: string | null) {
  return { data: MOCK_CANDIDATES.find(c => c.id === id) || null, isLoading: false };
}

export function useCreateCandidate() {
  return { mutate: () => {}, mutateAsync: () => Promise.resolve() };
}

export function useUpdateCandidate() {
  return { mutate: () => {}, mutateAsync: () => Promise.resolve() };
}

export function useDeleteCandidate() {
  return { mutate: () => {}, mutateAsync: () => Promise.resolve() };
}

export function useDatabaseCandidateDetail(id: string | null) {
  return { data: MOCK_CANDIDATES.find(c => c.id === id) || null, isLoading: false };
}

export function useDeleteDatabaseCandidate() {
  return { mutate: () => {}, mutateAsync: () => Promise.resolve() };
}

export function useUpdateDatabaseCandidate() {
  return { mutate: () => {}, mutateAsync: () => Promise.resolve() };
}

export function useCandidatesList(
  mode: 'my' | 'database',
  filters: any
) {
  let filtered = MOCK_CANDIDATES;
  if (mode === 'my') {
    filtered = filtered.filter(c => c.owner_id === 'mock-user-123');
  }

  if (filters?.search) {
    filtered = filtered.filter(c => 
      c.full_name?.toLowerCase().includes(filters.search.toLowerCase()) || 
      c.name?.toLowerCase().includes(filters.search.toLowerCase())
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
