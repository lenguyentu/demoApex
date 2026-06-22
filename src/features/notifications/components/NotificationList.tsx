import type { Notification } from '../types';
import { NotificationItem } from './NotificationItem';
import { LoadMoreButton } from '../../../components/LoadMoreButton';
import { Bell } from 'lucide-react';

interface NotificationListProps {
  data: Notification[];
  loading: boolean;
  loadingMore?: boolean;
  hasMore: boolean;
  loadMore: () => void;
  totalCount?: number | null;
}

export function NotificationList({ 
  data, 
  loading, 
  loadingMore, 
  hasMore, 
  loadMore, 
  totalCount 
}: NotificationListProps) {
  
  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="divide-y divide-gray-100">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="p-4 animate-pulse">
          <div className="flex items-start gap-3 pl-4">
            <div className="w-9 h-9 rounded-full bg-gray-200" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-5 w-24 bg-gray-200 rounded-full" />
                <div className="h-4 w-20 bg-gray-100 rounded" />
              </div>
              <div className="h-4 w-3/4 bg-gray-200 rounded mb-1" />
              <div className="h-4 w-1/2 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
  
  // Initial loading
  if (loading && data.length === 0) {
    return <LoadingSkeleton />;
  }
  
  // Empty state
  if (data.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Bell size={48} className="mb-4 text-gray-300" />
        <p className="text-lg font-medium text-gray-500">No notifications</p>
        <p className="text-sm">You will receive notifications when there is new activity</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="divide-y divide-gray-100 border rounded-lg overflow-hidden bg-white">
        {data.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </div>
      
      <div className="mt-4">
        <LoadMoreButton
          onClick={loadMore}
          loading={loadingMore}
          hasMore={hasMore}
          loadedCount={data.length}
          totalCount={totalCount}
        />
      </div>
    </div>
  );
}
