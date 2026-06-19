
import { User, MapPin, Mail, Phone, Calendar } from 'lucide-react';
import type { Profile } from '../types';

interface ProfileHeaderProps {
  profile: Profile | null | undefined;
}

export const ProfileHeader = ({ profile }: ProfileHeaderProps) => {
  if (!profile) return (
    <div className="h-48 bg-gray-100 animate-pulse rounded-xl mb-6"></div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
      <div className="h-32 bg-gradient-to-r from-blue-500 to-cyan-500 relative">
        <div className="absolute -bottom-12 left-8">
          <div className="w-24 h-24 rounded-full bg-white p-1 shadow-md">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.full_name || 'Avatar'} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                <User size={40} />
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="pt-14 pb-6 px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{profile.full_name || 'Chưa cập nhật tên'}</h1>
            <p className="text-gray-500 font-medium">{profile.role || 'User'}</p>
            
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
              {profile.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={16} />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.email && (
                <div className="flex items-center gap-1.5">
                  <Mail size={16} />
                  <span>{profile.email}</span>
                </div>
              )}
              {profile.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone size={16} />
                  <span>{profile.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar size={16} />
                <span>Tham gia {new Date(profile.created_at || Date.now()).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            {/* Action buttons could go here */}
          </div>
        </div>
      </div>
    </div>
  );
};
