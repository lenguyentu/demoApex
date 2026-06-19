import { create } from 'zustand';

interface AuthState {
  user: any;
  profile: any;
  isInitialized: boolean;
  logout: () => void;
  can: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: { id: 'mock-user-123', full_name: 'Admin User', role: 'Admin', email: 'admin@apex.com' },
  profile: {
    id: 'mock-user-123',
    email: 'admin@apex.com',
    full_name: 'Admin User',
    role: 'Admin',
    avatar_url: 'https://i.pravatar.cc/150?u=admin'
  },
  isInitialized: true,
  logout: () => console.log('Mock logout'),
  can: (permission: string) => true, // Admin has all permissions in mock
}));
