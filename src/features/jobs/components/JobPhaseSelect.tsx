import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { JOB_PHASE_CONFIG } from '../constants';
import type { JobPhase } from '../types';

interface JobPhaseSelectProps {
  currentPhase: JobPhase | null | undefined;
  onPhaseChange: (newPhase: JobPhase) => void;
  disabled?: boolean;
}

export function JobPhaseSelect({ currentPhase, onPhaseChange, disabled }: JobPhaseSelectProps) {
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
      const dropdownHeight = 240; // Ước tính chiều cao dropdown
      const dropdownWidth = 200;
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

  const phaseConfig = currentPhase ? JOB_PHASE_CONFIG[currentPhase] : null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all whitespace-nowrap w-fit max-w-full
          ${phaseConfig ? `${phaseConfig.columnBg} ${phaseConfig.text} ${phaseConfig.border}` : 'bg-gray-100 text-gray-700 border-gray-200'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}
        `}
      >
        <span className="truncate">{phaseConfig?.displayName || currentPhase || 'Select Phase'}</span>
        <ChevronDown size={14} className={phaseConfig ? phaseConfig.text : 'text-gray-500'} strokeWidth={2} />
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
          className="bg-white rounded-lg shadow-xl border border-gray-200 max-h-80 overflow-y-auto w-48 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="p-1 space-y-0.5">
            {Object.entries(JOB_PHASE_CONFIG).map(([phase, config]) => (
              <button
                key={phase}
                onClick={() => {
                  onPhaseChange(phase as JobPhase);
                  setIsOpen(false);
                }}
                className={`
                   w-full text-left px-3 py-2 text-xs font-medium rounded-md transition-colors
                   ${phase === currentPhase ? 'bg-gray-100' : 'hover:bg-gray-50'}
                `}
              >
                <span className={config.text}>{config.displayName}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
