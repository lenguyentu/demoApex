import { useMemo } from 'react';
import { Users } from 'lucide-react';
import { SearchableSelect } from './SearchableSelect';
import { useTeamMembers } from '../features/manager/hooks';
import { useAuthStore } from '../features/auth/store';

interface TeamMemberSelectProps {
  value: string;
  onChange: (userId: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  includeSelf?: boolean; // Include current user in the list
}

/**
 * TeamMemberSelect - Chọn team member (for HH Lead)
 * Chỉ hiển thị Headhunters có managed_by_id = current user
 * Admin thì hiển thị tất cả active internal users
 * 
 * Usage:
 * ```tsx
 * <TeamMemberSelect
 *   value={selectedUserId}
 *   onChange={setSelectedUserId}
 *   placeholder="Chọn thành viên..."
 *   includeSelf={true}
 * />
 * ```
 */
export function TeamMemberSelect({
  value,
  onChange,
  placeholder = 'Chọn thành viên...',
  className = '',
  disabled = false,
  includeSelf = true,
}: TeamMemberSelectProps) {
  const user = useAuthStore((state) => state.user);
  const { data: teamMembers = [], isLoading } = useTeamMembers();

  const userOptions = useMemo(() => {
    let options = teamMembers.map((u) => ({ 
      value: u.id, 
      label: `${u.full_name} (${u.email})` 
    }));

    // Add current user to the list if includeSelf is true
    if (includeSelf && user) {
      const selfExists = options.some(opt => opt.value === user.id);
      if (!selfExists) {
        options = [
          { value: user.id, label: `${user.full_name} (Bạn)` },
          ...options
        ];
      }
    }

    return options;
  }, [teamMembers, user, includeSelf]);

  if (disabled) {
    const selectedLabel = userOptions.find((opt) => opt.value === value)?.label;
    return (
      <div className={`px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 ${className}`}>
        {selectedLabel || placeholder}
      </div>
    );
  }

  return (
    <SearchableSelect
      options={userOptions}
      value={value}
      onChange={onChange}
      placeholder={isLoading ? 'Đang tải...' : placeholder}
      icon={<Users size={16} />}
      className={className}
    />
  );
}
