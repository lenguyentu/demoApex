import { useMemo } from 'react';
import { User } from 'lucide-react';
import { SearchableSelect } from './SearchableSelect';
import { useUsers } from '../features/auth/hooks';

interface OwnerSelectProps {
  value: string;
  onChange: (ownerId: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Reusable OwnerSelect component
 * Fetches users internally and renders a searchable dropdown.
 * Displays "Name (Email)" format in dropdown.
 * 
 * Usage:
 * ```tsx
 * <OwnerSelect
 *   value={selectedOwnerId}
 *   onChange={setSelectedOwnerId}
 *   placeholder="Chọn owner..."
 * />
 * ```
 */
export function OwnerSelect({
  value,
  onChange,
  placeholder = 'Select owner...',
  className = '',
  disabled = false,
}: OwnerSelectProps) {
  const { data: users = [], isLoading } = useUsers();

  const ownerOptions = useMemo(
    () => users.map((u) => ({ 
      value: u.id, 
      label: `${u.full_name} (${u.email})` 
    })),
    [users]
  );

  if (disabled) {
    const selectedLabel = ownerOptions.find((opt) => opt.value === value)?.label;
    return (
      <div className={`px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 ${className}`}>
        {selectedLabel || placeholder}
      </div>
    );
  }

  return (
    <SearchableSelect
      options={ownerOptions}
      value={value}
      onChange={onChange}
      placeholder={isLoading ? 'Loading...' : placeholder}
      icon={<User size={16} />}
      className={className}
    />
  );
}
