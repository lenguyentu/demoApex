import type { UserRole } from '../auth/types';

export const ROLES: (UserRole | 'All')[] = ['All', 'Admin', 'HH Lead', 'BD Lead', 'Headhunter', 'BD', 'CTV', 'Freelancer', 'HR', 'Client', 'Community Manager', 'Researcher'];

export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  All: 'Tất cả vai trò',
  Admin: 'Admin',
  'HH Lead': 'Headhunter Lead',
  'BD Lead': 'BD Lead',
  Headhunter: 'Headhunter',
  BD: 'BD',
  CTV: 'CTV',
  Freelancer: 'Freelancer',
  HR: 'HR',
  Client: 'Client',
  'Community Manager': 'Community Manager',
  Researcher: 'Researcher',
};

export const STATUS_COLORS: Record<string, string> = {
  active: 'text-green-600 bg-green-50 border-green-200',
  approved: 'text-green-600 bg-green-50 border-green-200',
  pending: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  rejected: 'text-red-600 bg-red-50 border-red-200',
  inactive: 'text-red-600 bg-red-50 border-red-200',
};

export const ROLE_BADGE_CLASSES: Record<string, string> = {
  Admin: 'bg-purple-50 text-purple-700 border-purple-200',
  'HH Lead': 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  'BD Lead': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  BD: 'bg-blue-50 text-blue-700 border-blue-200',
  Headhunter: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Freelancer: 'bg-orange-50 text-orange-700 border-orange-200',
  Client: 'bg-teal-50 text-teal-700 border-teal-200',
  HR: 'bg-pink-50 text-pink-700 border-pink-200',
  'Community Manager': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Researcher: 'bg-violet-50 text-violet-700 border-violet-200',
};
