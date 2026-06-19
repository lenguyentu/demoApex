
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfile, uploadAvatar } from './api';
import toast from 'react-hot-toast';

export const PROFILE_KEYS = {
  all: ['profile'] as const,
  detail: (userId: string) => [...PROFILE_KEYS.all, 'detail', userId] as const,
};

export function useProfile(userId: string) {
  return useQuery({
    queryKey: PROFILE_KEYS.detail(userId),
    queryFn: () => getProfile(userId),
    enabled: !!userId,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: Parameters<typeof updateProfile>[1] }) =>
      updateProfile(userId, data),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.detail(userId) });
      toast.success('Profile updated successfully.');
    },
    onError: (error) => {
      toast.error('Failed to update profile.');
      console.error('Update profile error:', error);
    },
  });
}

export function useUploadAvatar() {    
    return useMutation({
        mutationFn: ({ userId, file }: { userId: string, file: File }) => uploadAvatar(userId, file),
        onError: (error) => {
             toast.error('Failed to upload avatar.');
            console.error('Upload avatar error:', error);
        }
    })
}
