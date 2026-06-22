
import { X, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect, useCallback, useState } from 'react';
import { useScrollLock } from '../../hooks';
import { ProfileHeader } from '../profile/components/ProfileHeader';
import { ProfileForm } from '../profile/components/ProfileForm';
import { useProfile } from '../profile/hooks';

interface UserDetailModalProps {
  userId: string | null;
  mode: 'view' | 'edit';
  onClose: () => void;
}

export function UserDetailModal({ userId, mode, onClose }: UserDetailModalProps) {
  const [mounted, setMounted] = useState(false);
  
  const { data: profile, isLoading, error } = useProfile(userId || '');

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useScrollLock(!!userId);

  useEffect(() => {
    if (userId) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [userId, handleKeyDown]);

  if (!userId || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-gray-100/50 backdrop-blur-sm">
      <div className="min-h-screen px-4 pb-20 pt-4 flex items-center justify-center relative">
        <div 
            className="fixed inset-0 bg-black/40 transition-opacity" 
            aria-hidden="true" 
            onClick={onClose}
        />
        
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
           {/* Header with Close Button */}
           <div className="absolute top-4 right-4 z-10">
                <button
                    onClick={onClose}
                    className="p-2 bg-white/80 hover:bg-white text-gray-500 hover:text-gray-800 rounded-full shadow-sm transition-all"
                >
                    <X size={24} />
                </button>
           </div>

           {isLoading ? (
             <div className="h-[400px] flex flex-col items-center justify-center gap-4">
                 <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
                 <p className="text-gray-500">Loading information...</p>
             </div>
           ) : error || !profile ? (
             <div className="h-[400px] flex items-center justify-center text-red-500">
                Error loading user information.
             </div>
           ) : (
             <div className="p-6 md:p-8 max-h-[90vh] overflow-y-auto">
                <ProfileHeader profile={profile} />
                
                <div className="mt-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        {mode === 'view' ? 'Profile Details' : 'Edit Profile'} 
                        {mode === 'view' && <span className="text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Read Only</span>}
                    </h3>
                    <ProfileForm profile={profile} readOnly={mode === 'view'} />
                </div>
             </div>
           )}
        </div>
      </div>
    </div>,
    document.body
  );
}
