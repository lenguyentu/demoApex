import { useState, useMemo } from 'react';
import { Building2 } from 'lucide-react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { SearchableSelect } from './SearchableSelect';
import { searchClients, getClientById } from '../features/clients/api';
import { useDebounce } from '../hooks';

interface ClientSelectProps {
  value: string;
  onChange: (clientId: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Reusable ClientSelect component
 * Uses Async Search to fetch clients, avoiding large payload.
 * 
 * Usage:
 * ```tsx
 * <ClientSelect
 *   value={selectedClientId}
 *   onChange={setSelectedClientId}
 *   placeholder="Chọn khách hàng..."
 * />
 * ```
 */
export function ClientSelect({
  value,
  onChange,
  placeholder = 'Chọn khách hàng...',
  className = '',
  disabled = false,
}: ClientSelectProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Use useQuery for caching and async state (Search Data)
  const { data: searchResults = [], isLoading: isSearching } = useQuery<{ id: string, client_name: string }[]>({
    queryKey: ['clients', 'search', debouncedSearchTerm],
    queryFn: () => searchClients(debouncedSearchTerm),
    staleTime: 60 * 1000, // Cache for 1 minute
    placeholderData: keepPreviousData, // Keep showing previous results while fetching new ones
  });

  // Fetch selected client detail if value exists but not in search results
  // This is important for initial load or when viewing an item where the selected client 
  // might not be in the top 20 default search results.
  const { data: selectedClient } = useQuery({
    queryKey: ['clients', 'detail', value],
    queryFn: () => getClientById(value),
    enabled: !!value && !searchResults.some((c: { id: string }) => c.id === value),
    staleTime: 5 * 60 * 1000,
  });

  // Merge search results with selected client to ensure selected item is always in options (if loaded)
  const clientOptions = useMemo(() => {
    let options = searchResults.map((c: { id: string, client_name: string }) => ({ value: c.id, label: c.client_name }));

    if (selectedClient && !options.find((o: { value: string }) => o.value === selectedClient.id)) {
      options = [{ value: selectedClient.id, label: selectedClient.client_name }, ...options];
    }

    return options;
  }, [searchResults, selectedClient]);

  if (disabled) {
    const selectedLabel = clientOptions.find((opt: { value: string, label: string }) => opt.value === value)?.label || selectedClient?.client_name;
    return (
      <div className={`px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 ${className}`}>
        {selectedLabel || (value ? 'Đang tải...' : placeholder)}
      </div>
    );
  }

  return (
    <SearchableSelect
      options={clientOptions}
      value={value}
      onChange={onChange}
      placeholder={isSearching ? 'Đang tìm...' : placeholder}
      icon={<Building2 size={16} />}
      className={className}
      onSearch={setSearchTerm}
    />
  );
}
