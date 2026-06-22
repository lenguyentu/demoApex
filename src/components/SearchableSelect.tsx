import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
  onSearch?: (term: string) => void; // Async search callback
}

export const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  icon,
  onSearch,
}: SearchableSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options: If onSearch is provided, assume parent filters/loads options. Otherwise filter locally.
  const normalizeString = (str: string) => {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();
  };

  const filteredOptions = onSearch
    ? options
    : options.filter((option) => {
        const labelNorm = normalizeString(option.label);
        const labelNoSpace = labelNorm.replace(/[\s\(\)]+/g, '');
        const searchNoSpace = normalizeString(searchTerm).replace(/[\s\(\)]+/g, '');
        
        if (labelNoSpace.includes(searchNoSpace)) return true;

        const searchParts = normalizeString(searchTerm).split(/\s+/).filter(Boolean);
        return searchParts.length > 0 && searchParts.every(part => labelNorm.includes(part));
      });

  // Get selected option label
  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle Input Change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (onSearch) {
      onSearch(term);
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
    if (onSearch) onSearch(''); // Reset search on select
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
    if (onSearch) onSearch('');
  };

  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) setIsOpen(true);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger - always same DOM structure to prevent layout shift / flicker */}
      <div
        onClick={() => !isOpen && setIsOpen(true)}
        className={`relative flex items-center gap-2 w-full pl-3 pr-10 h-[38px] border rounded-lg text-left cursor-pointer transition-colors ${isOpen
            ? 'border-brand-500 bg-white dark:bg-gray-800'
            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400'
          }`}
      >
        {icon && <span className="text-gray-400 flex-shrink-0">{icon}</span>}

        {/* Always render both — toggle visibility to avoid DOM swap that causes reflow */}
        <span
          className={`flex-1 min-w-0 truncate text-sm select-none ${!selectedOption ? 'text-gray-400' : 'text-gray-900 dark:text-white'} ${isOpen ? 'hidden' : 'block'}`}
          title={selectedOption?.label}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onClick={handleInputClick}
          placeholder={onSearch ? (selectedOption?.label || placeholder) : (selectedOption ? selectedOption.label : placeholder)}
          className={`flex-1 min-w-0 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 ${isOpen ? 'block' : 'hidden'}`}
        />

        {/* Action icons container - Absolute positioned to prevent layout shift */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && !isOpen && (
            <div
              className="p-0.5 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
              onClick={handleClear}
            >
              <X size={14} className="text-gray-400 hover:text-gray-600" />
            </div>
          )}

          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Dropdown - Just options, no search box */}
      {isOpen && (
        <div className="absolute z-[9999] mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.slice(0, 100).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full px-3 py-2.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${option.value === value
                    ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 font-medium'
                    : 'text-gray-900 dark:text-white'
                  }`}
              >
                {option.label}
              </button>
            ))
          ) : (
            <div className="px-3 py-4 text-sm text-gray-500 text-center">
              {searchTerm ? `No results found for "${searchTerm}"` : 'No data'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
