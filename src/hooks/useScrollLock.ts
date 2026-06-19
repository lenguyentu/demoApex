import { useEffect } from 'react';

/**
 * Hook to lock body scroll and compensate for scrollbar width to prevent layout shift
 */
export function useScrollLock(lock: boolean) {
  useEffect(() => {
    if (!lock) return;

    // Measure scrollbar width
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    const originalStyle = window.getComputedStyle(document.body).overflow;
    const originalPaddingRight = window.getComputedStyle(document.body).paddingRight;

    // Apply styles
    document.body.style.overflow = 'hidden';
    
    // Only add padding if there's a scrollbar
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${parseInt(originalPaddingRight || '0') + scrollBarWidth}px`;
    }

    // Cleanup
    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [lock]);
}
