export const useLogout = () => {
  return {
    mutate: (data: any, options: any) => {
      if (options?.onSuccess) {
        options.onSuccess();
      }
    }
  };
};

export const useInitializeAuth = () => {};
export const useUser = () => ({ data: { id: 'mock-user-123' } });
export const useAuth = () => ({ session: { user: { id: 'mock-user-123' } } });
export const useUsers = () => ({ data: [{ id: 'mock-user-123', full_name: 'Admin User', email: 'admin@apex.com' }, { id: 'other-user', full_name: 'Other User', email: 'other@apex.com' }], isLoading: false });
export const useActiveInternalUsers = () => ({ data: [{ id: 'mock-user-123', full_name: 'Admin User', email: 'admin@apex.com' }, { id: 'other-user', full_name: 'Other User', email: 'other@apex.com' }], isLoading: false });
