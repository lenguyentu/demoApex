import { useState, useEffect } from 'react';

/**
 * Hook để debounce một giá trị (thường dùng cho search input).
 * @param value Giá trị cần debounce
 * @param delay Thời gian chờ (ms)
 * @returns Giá trị đã được debounce
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
