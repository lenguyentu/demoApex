import { Bell, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useRecentNotifications, useMarkAsRead } from '../hooks';
import { useScrollLock } from '../../../hooks';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { Notification } from '../types';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
}

export function NotificationDropdown({ isOpen, onClose, unreadCount }: NotificationDropdownProps) {
  const { data: notifications = [], isLoading } = useRecentNotifications(50);
  const markAsReadMutation = useMarkAsRead();
  const navigate = useNavigate();

  // Prevent background scrolling when dropdown is open (with scrollbar compensation)
  useScrollLock(isOpen);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
    
    // Check type and redirect
    // Check type and redirect
    if (notification.type === 'chat_message' || notification.related_entity_type === 'chat') {
        const anyNotif = notification as any;
        // Prioritize process_id from data if available
        // For chat_message, related_entity_id IS the process_id (e.g. "b601...")
        const processId = anyNotif.data?.process_id || (notification.related_entity_type === 'process' ? notification.related_entity_id : null);
        
        if (processId) {
             navigate(`/chat?process=${processId}`);
        } else {
             navigate('/chat');
        }
    } else if (notification.related_entity_type === 'process') {
         // Generic process notification -> Go to processes list
         navigate('/processes'); 
    } else if (notification.related_entity_type === 'job' && notification.related_entity_id) {
         navigate(`/jobs/${notification.related_entity_id}`);
    } else if (notification.related_entity_type === 'candidate' && notification.related_entity_id) {
         navigate(`/candidates/${notification.related_entity_id}`);
    } else if (notification.related_entity_type === 'bd_process' && notification.related_entity_id) {
         navigate(`/bd/customers?id=${notification.related_entity_id}`);
    }
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Dropdown */}
      <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-brand-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto"></div>
              <p className="mt-2 text-sm">Loading...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell size={48} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${
                    !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    {!notification.read && (
                      <div className="shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <Link
            to="/notifications"
            onClick={onClose}
            className="block w-full text-center py-2 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition"
          >
            View all notifications
          </Link>
        </div>
      </div>
    </>
  );
}
