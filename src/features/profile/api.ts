import type { Profile, UpdateProfilePayload } from './types';

export async function getProfile(userId: string) {
  return {
    id: userId,
    full_name: 'Demo User Profile',
    phone: '0901234567',
    avatar_url: '',
    updated_at: new Date().toISOString()
  } as Profile;
}

export async function updateProfile(userId: string, payload: UpdateProfilePayload) {
  return {
    id: userId,
    ...payload,
    updated_at: new Date().toISOString()
  } as Profile;
}

export async function uploadAvatar(userId: string, file: File) {
  return URL.createObjectURL(file);
}
