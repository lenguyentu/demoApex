import { formatDate } from '../../../../utils/date';

export interface EditableFieldProps {
  label: string;
  name: string;
  value: string | undefined | null;
  isEditing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  type?: 'text' | 'date' | 'email' | 'tel' | 'textarea' | 'select';
  options?: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}

export function EditableField({ 
  label, 
  name, 
  value, 
  isEditing, 
  onChange, 
  type = 'text', 
  options, 
  placeholder,
  className = ''
}: EditableFieldProps) {
  if (!isEditing) {
    // Only render if value exists
    if (value === null || value === undefined || value === '') return null;
    
    // Format display for specific types
    let displayValue = value;
    if (type === 'date') {
      displayValue = formatDate(value);
    } else if (type === 'select' && options) {
      const option = options.find(o => o.value === value);
      if (option) displayValue = option.label;
    }

    return (
      <div className={className}>
        <label className="text-xs text-gray-500">{label}</label>
        <p className="text-sm font-medium text-gray-900 whitespace-pre-wrap">{displayValue}</p>
      </div>
    );
  }

  // Edit Mode
  return (
    <div className={className}>
      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
      {type === 'textarea' ? (
        <textarea
          name={name}
          value={value || ''}
          onChange={onChange}
          className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500"
          rows={4}
          placeholder={placeholder}
        />
      ) : type === 'select' ? (
        <select
          name={name}
          value={value || ''}
          onChange={onChange}
          className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500"
        >
          <option value="">-- Select --</option>
          {options?.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value || ''}
          onChange={onChange}
          className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500"
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
