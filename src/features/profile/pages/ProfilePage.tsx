// @ts-nocheck

import React from 'react';
import { useAuthStore } from '../../auth/store';
import { useProfile } from '../hooks';
import { ProfileHeader } from '../components/ProfileHeader';
import { ProfileForm } from '../components/ProfileForm';
import { ReferralTab } from '../components/ReferralTab';
import { ChangePasswordTab } from '../components/ChangePasswordTab';
import { Loader2 } from 'lucide-react';

const ProfilePage = () => {
  const { user } = useAuthStore();
  // --- MOCK DATA ---
  const profile = {
    id: user?.id || 'user1',
    full_name: 'Test User',
    email: user?.email || 'test@example.com',
    phone: '0123456789',
    role: 'Admin',
    status: 'Active',
    created_at: '2023-01-01T00:00:00Z',
  };
  const isLoading = false;
  const error = null;
  // -----------------
  const [activeTab, setActiveTab] = React.useState('profile');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
          <p className="text-gray-500">Loading profile information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="text-center p-8 bg-red-50 rounded-xl text-red-600">
            <h3 className="font-bold text-lg mb-2">Failed to load profile</h3>
            <p>{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
       {/* Tabs Header */}
       <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-2 text-sm font-medium transition-colors relative ${
              activeTab === 'profile' 
                ? 'text-brand-600 border-b-2 border-brand-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Personal Profile
          </button>
          <button
            onClick={() => setActiveTab('referral')}
             className={`pb-3 px-2 text-sm font-medium transition-colors relative ${
              activeTab === 'referral' 
                ? 'text-brand-600 border-b-2 border-brand-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Referral Management
          </button>
           <button
            onClick={() => setActiveTab('security')}
             className={`pb-3 px-2 text-sm font-medium transition-colors relative ${
              activeTab === 'security' 
                ? 'text-brand-600 border-b-2 border-brand-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Security
          </button>
       </div>

       {/* Content */}
       <div className="animate-fade-in">
         {activeTab === 'profile' && (
           <>
             <ProfileHeader profile={profile} />
             {profile && <ProfileForm profile={profile} />}
           </>
         )}
         {activeTab === 'referral' && (
            <ReferralTab userId={user?.id || ''} />
         )}
         {activeTab === 'security' && (
            <ChangePasswordTab />
         )}
       </div>
    </div>
  );
};

export default ProfilePage;
