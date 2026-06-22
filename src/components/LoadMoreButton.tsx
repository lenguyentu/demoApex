import { Loader2 } from 'lucide-react';

interface LoadMoreButtonProps {
  onClick: () => void;
  loading?: boolean;
  hasMore: boolean;
  className?: string;
  loadedCount?: number | null;
  totalCount?: number | null;
}

export function LoadMoreButton({
  onClick,
  loading = false,
  hasMore,
  className = '',
  // loadedCount,
  // totalCount,
}: LoadMoreButtonProps) {
  if (!hasMore) {
    return null;
  }

  return (
    <div className={`flex flex-col items-center gap-2 py-4 ${className}`}>
      <button
        onClick={onClick}
        disabled={loading}
        className="px-6 cursor-pointer py-3 rounded-full bg-pink-600 text-white font-semibold hover:bg-pink-700 transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          <span>Load more</span>
        )}
      </button>
      {/* {loadedCount != null && totalCount != null && (
        <span className="text-xs text-gray-400">
          Showing {loadedCount} / {totalCount}
        </span>
      )} */}
    </div>
  );
}
