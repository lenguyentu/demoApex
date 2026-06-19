import { useEffect, type RefObject, useCallback } from 'react';

type Event = MouseEvent | TouchEvent;

/**
 * Hook để phát hiện click bên ngoài một element (thường dùng cho dropdown/modal).
 * @param ref Ref của element cần theo dõi
 * @param handler Callback được gọi khi click ra ngoài
 */
function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null>,
  handler: (event: Event) => void
) {
  // Dùng useCallback để ổn định listener function
  const listener = useCallback(
    (event: Event) => {
      const el = ref.current;
      if (!el || el.contains(event.target as Node)) {
        return;
      }
      handler(event);
    },
    [ref, handler]
  );

  useEffect(() => {
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [listener]);
}

export default useOnClickOutside;
