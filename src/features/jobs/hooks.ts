import { MOCK_JOBS } from '../../mocks/jobs';

export const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...jobKeys.lists(), filters] as const,
  detail: (id: string) => [...jobKeys.all, 'detail', id] as const,
};

export const categoryKeys = {
  all: ['categories'] as const,
};

export const clientKeys = {
  all: ['clients'] as const,
};

export const jobListKeys = {
  dropdown: ['jobs-dropdown'] as const,
};

export function useCategories() {
  return { data: [], error: null, isLoading: false };
}

export function useClients() {
  return { data: [], error: null, isLoading: false };
}

export function useJobsForDropdown() {
  return { data: [], error: null, isLoading: false };
}

export function useJobsList(params: any) {
  // Apply simple filtering if needed based on search text, otherwise return mock jobs
  let filtered = MOCK_JOBS;
  if (params?.search) {
    filtered = MOCK_JOBS.filter(j => 
      j.position_title?.toLowerCase().includes(params.search.toLowerCase()) ||
      j.job_id?.toLowerCase().includes(params.search.toLowerCase())
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

export function useJobDetail(id: string | null) {
  return { data: MOCK_JOBS.find(j => j.id === id) || null, isLoading: false };
}

export function useUrgentJobs() {
  return { data: [], isLoading: false };
}

export function useCreateJob() {
  return { mutate: () => {}, mutateAsync: () => Promise.resolve() };
}

export function useUpdateJob() {
  return { mutate: () => {}, mutateAsync: () => Promise.resolve() };
}

export function useToggleUrgentJob() {
  return { mutate: () => {}, mutateAsync: () => Promise.resolve() };
}

export function useDeleteJob() {
  return { mutate: () => {}, mutateAsync: () => Promise.resolve() };
}

export function useUrgentJobTitle() {
  return { data: 'Urgent Jobs', isLoading: false };
}

export function useUpdateUrgentJobTitleMutation() {
  return { mutate: () => {}, mutateAsync: () => Promise.resolve() };
}

export function useUpdateUrgentJobsSetupMutation() {
  return { mutate: () => {}, mutateAsync: () => Promise.resolve() };
}
