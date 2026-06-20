// @ts-nocheck
import { useState, useEffect } from 'react';
import { Bell, CheckCheck, Filter, Search } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../auth/store';
import useDebounce from '../../../hooks/useDebounce';
import { NotificationList } from '../components/NotificationList';
import { useMarkAllAsRead, useNotificationsList, useUnreadCount } from '../hooks';
import type { NotificationFilters } from '../types';
import toast from 'react-hot-toast';

const GROUP_OPTIONS = [
  { value: '', label: 'Tất cả loại' },
  { value: 'job_freelancer', label: '📋 Job & Freelancer' },
  { value: 'process', label: '🔄 Process' },
  { value: 'admin', label: '🔧 Admin' },
  { value: 'user', label: '👤 User & Registration' },
  { value: 'communication', label: '💬 Communication' },
  { value: 'bd', label: '🤝 BD & Customer Care' },
] as const;

const READ_STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'unread', label: 'Chưa đọc' },
  { value: 'read', label: 'Đã đọc' },
] as const;

export function NotificationsPage() {
  const { user } = useAuthStore();
  const markAllAsReadMutation = useMarkAllAsRead();
  
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  const [filters, setFilters] = useState<NotificationFilters>({
    typeGroup: '',
    readStatus: 'all',
  });
  
  const {
    data,
    loading,
    hasMore,
    loadMore,
    totalCount,
    refresh,
  } = useNotificationsList({
    ...filters,
    searchTerm: debouncedSearchTerm,
  });
  
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('Đã đánh dấu tất cả là đã đọc');
        refresh();
      },
      onError: () => toast.error('Có lỗi xảy ra'),
    });
  };
  
  const handleFilterChange = (key: keyof NotificationFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };
  
  // Total unread for current user
  const { data: totalUnread = 0 } = useUnreadCount();
  const unreadCount = totalUnread;
  
  // Realtime subscription for new notifications
  useEffect(() => {
    if (!user?.id) return;
    
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id_receiver=eq.${user.id}`,
        },
        (payload) => {
          console.log('New notification received:', payload);
          // Refresh the list when new notification arrives
          refresh();
          // Toast is already handled by global useNotificationRealtime hook in MainLayout
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refresh]);
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-8 h-8 text-brand-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
            <p className="text-sm text-gray-500">
              {totalCount !== null ? `${totalCount} thông báo` : 'Đang tải...'} 
              {unreadCount > 0 && ` • ${unreadCount} chưa đọc`}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleMarkAllAsRead}
          disabled={markAllAsReadMutation.isPending || unreadCount === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCheck size={18} />
          Đánh dấu tất cả đã đọc
        </button>
      </div>
      
      {/* Filters & Search */}
      <div className="space-y-4 mb-6">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo tiêu đề hoặc nội dung..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <span className="text-sm">✕</span>
            </button>
          )}
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <Filter size={18} className="text-gray-400" />
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Nhóm:</label>
          <select
            value={filters.typeGroup}
            onChange={(e) => handleFilterChange('typeGroup', e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {GROUP_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Trạng thái:</label>
          <select
            value={filters.readStatus}
            onChange={(e) => handleFilterChange('readStatus', e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {READ_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
      
      {/* Notification List */}
      <NotificationList
        data={data}
        loading={loading}
        loadingMore={loading && data.length > 0}
        hasMore={hasMore}
        loadMore={loadMore}
        totalCount={totalCount}
      />
    </div>
  );
}

export default NotificationsPage;
