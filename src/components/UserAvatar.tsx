
import { useState } from 'react';
import { User } from 'lucide-react';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  status?: 'online' | 'offline' | 'busy' | 'away' | null;
  className?: string;
}

export const UserAvatar = ({ 
  name, 
  avatarUrl, 
  size = 'md', 
  status = null,
  className = ''
}: UserAvatarProps) => {
  const [imgError, setImgError] = useState(false);

  // Size mappings
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-24 h-24 text-3xl'
  };

  const statusColor = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    busy: 'bg-red-500',
    away: 'bg-yellow-500'
  };

  const statusSize = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
    '2xl': 'w-5 h-5'
  };

  // Generate initials
  const initials = name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Generate consistent background color based on name
  const bgColors = [
    'bg-red-100 text-red-600',
    'bg-orange-100 text-orange-600',
    'bg-amber-100 text-amber-600',
    'bg-green-100 text-green-600',
    'bg-emerald-100 text-emerald-600',
    'bg-teal-100 text-teal-600',
    'bg-cyan-100 text-cyan-600',
    'bg-sky-100 text-sky-600',
    'bg-blue-100 text-blue-600',
    'bg-indigo-100 text-indigo-600',
    'bg-violet-100 text-violet-600',
    'bg-purple-100 text-purple-600',
    'bg-fuchsia-100 text-fuchsia-600',
    'bg-pink-100 text-pink-600',
    'bg-rose-100 text-rose-600',
  ];
  
  const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % bgColors.length;
  const colorClass = bgColors[colorIndex];

  return (
    <div className={`relative inline-block ${className}`}>
      <div 
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-white shadow-sm ${!avatarUrl || imgError ? colorClass : 'bg-gray-100'}`}
      >
        {avatarUrl && !imgError ? (
          <img 
            src={avatarUrl} 
            alt={name} 
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="font-bold flex items-center justify-center w-full h-full">
            {initials || <User className="w-[60%] h-[60%]" />}
          </span>
        )}
      </div>
      
      {status && (
        <span className={`absolute bottom-0 right-0 rounded-full border-2 border-white ${statusSize[size]} ${statusColor[status]}`}></span>
      )}
    </div>
  );
};
