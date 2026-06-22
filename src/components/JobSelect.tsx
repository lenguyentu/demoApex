import { useMemo } from 'react';
import { Briefcase } from 'lucide-react';
import { SearchableSelect } from './SearchableSelect';
import { useJobsForDropdown } from '../features/jobs/hooks';

interface JobSelectProps {
  value: string;
  onChange: (jobId: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Reusable JobSelect component
 * Fetches jobs internally and renders a searchable dropdown.
 * Displays "Position Title (Job ID)" format.
 * 
 * Usage:
 * ```tsx
 * <JobSelect
 *   value={selectedJobId}
 *   onChange={setSelectedJobId}
 *   placeholder="Chọn job..."
 * />
 * ```
 */
export function JobSelect({
  value,
  onChange,
  placeholder = 'Select job...',
  className = '',
  disabled = false,
}: JobSelectProps) {
  const { data: jobs = [], isLoading } = useJobsForDropdown();

  const jobOptions = useMemo(
    () => jobs.map((j) => ({ 
      value: j.id, 
      label: `${j.position_title} (${j.job_id || 'N/A'})` 
    })),
    [jobs]
  );

  if (disabled) {
    const selectedLabel = jobOptions.find((opt) => opt.value === value)?.label;
    return (
      <div className={`px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 ${className}`}>
        {selectedLabel || placeholder}
      </div>
    );
  }

  return (
    <SearchableSelect
      options={jobOptions}
      value={value}
      onChange={onChange}
      placeholder={isLoading ? 'Loading...' : placeholder}
      icon={<Briefcase size={16} />}
      className={className}
    />
  );
}
