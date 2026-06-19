import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { STATUS_CONFIG } from '../constants';
import type { ProcessStatus } from '../types';

interface StatusSelectProps {
  currentStatus: ProcessStatus | null | undefined;
  onStatusChange: (newStatus: ProcessStatus) => void;
  disabled?: boolean;
}

export function StatusSelect({ currentStatus, onStatusChange, disabled }: StatusSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = (event: Event) => {
      // Don't close if scrolling inside the dropdown
      if (dropdownRef.current?.contains(event.target as Node)) {
        return;
      }
      if (isOpen) setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', () => setIsOpen(false));

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', () => setIsOpen(false));
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    if (disabled) return;
    
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 320; // max-h-80 is 320px
      const dropdownWidth = 256;  // w-64 is 256px
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // Vertical position
      let top = rect.bottom + 4;
      if (rect.bottom + dropdownHeight > viewportHeight && rect.top > dropdownHeight) {
        top = rect.top - dropdownHeight - 4;
      }

      // Horizontal position - ensure it doesn't go off the right edge
      let left = rect.left;
      if (left + dropdownWidth > viewportWidth) {
        left = viewportWidth - dropdownWidth - 10; // 10px padding from edge
      }

      setPosition({
        top,
        left: Math.max(10, left), // 10px padding from left edge
        width: rect.width,
      });
    }
    setIsOpen(!isOpen);
  };

  const statusConfig = currentStatus ? STATUS_CONFIG[currentStatus] : null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all whitespace-nowrap w-fit max-w-full
          ${statusConfig ? `${statusConfig.columnBg} ${statusConfig.text} ${statusConfig.border}` : 'bg-gray-100 text-gray-700 border-gray-200'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}
        `}
      >
        <span className="truncate">{statusConfig?.displayName || currentStatus || 'Select Status'}</span>
        <ChevronDown size={14} className={statusConfig ? statusConfig.text : 'text-gray-500'} strokeWidth={2} />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            zIndex: 9999,
          }}
          className="bg-white rounded-lg shadow-xl border border-gray-200 max-h-80 overflow-y-auto w-64 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="p-1 space-y-0.5">
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <button
                key={status}
                onClick={() => {
                  onStatusChange(status as ProcessStatus);
                  setIsOpen(false);
                }}
                className={`
                   w-full text-left px-3 py-2 text-xs font-medium rounded-md transition-colors flex items-center gap-2
                   ${status === currentStatus ? 'bg-gray-100' : 'hover:bg-gray-50'}
                `}
              >
                <config.icon size={14} className={config.text} />
                <span className={config.text}>{config.displayName}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
