import { useNavigate } from 'react-router-dom';
import { Check, Trash2, ExternalLink } from 'lucide-react';
import type { Notification } from '../types';
import { NotificationIcon, getNotificationTypeLabel, getNotificationTypeBgColor } from './NotificationIcon';
import { useMarkAsRead, useDeleteNotification } from '../hooks';
import toast from 'react-hot-toast';

interface NotificationItemProps {
  notification: Notification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const navigate = useNavigate();
  const markAsReadMutation = useMarkAsRead();
  const deleteMutation = useDeleteNotification();
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleNavigate = () => {
    // Mark as read when clicking
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
    
    // Check type for chat messages first
    if (notification.type === 'chat_message' || notification.related_entity_type === 'chat') {
      const anyNotif = notification as any;
      const processId = anyNotif.data?.process_id || (notification.related_entity_type === 'process' ? notification.related_entity_id : null);
      
      if (processId) {
        navigate(`/chat?process=${processId}`);
      } else {
        navigate('/chat');
      }
      return;
    }

    // Navigate based on related entity
    if (notification.related_entity_type && notification.related_entity_id) {
      switch (notification.related_entity_type) {
        case 'process':
          navigate('/processes');
          break;
        case 'job':
          navigate(`/jobs/${notification.related_entity_id}`);
          break;
        case 'candidate':
          navigate(`/candidates/${notification.related_entity_id}`);
          break;
        case 'bd_process':
          navigate(`/bd/customers?id=${notification.related_entity_id}`);
          break;
        default:
          break;
      }
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAsReadMutation.mutate(notification.id, {
      onSuccess: () => toast.success('Marked as read'),
      onError: () => toast.error('An error occurred'),
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteMutation.mutate(notification.id, {
      onSuccess: () => toast.success('Notification deleted'),
      onError: () => toast.error('An error occurred'),
    });
  };

  return (
    <div 
      onClick={handleNavigate}
      className={`
        relative p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer
        ${!notification.read ? 'bg-blue-50/50' : 'bg-white'}
      `}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <span className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500" />
      )}
      
      <div className="flex items-start gap-3 pl-4">
        {/* Icon */}
        <div className="shrink-0 p-2 rounded-full bg-gray-100">
          <NotificationIcon type={notification.type} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getNotificationTypeBgColor(notification.type)}`}>
              {getNotificationTypeLabel(notification.type)}
            </span>
            <span className="text-xs text-gray-400">
              {formatTime(notification.created_at)}
            </span>
          </div>
          
          <h4 className={`text-sm font-medium text-gray-900 mb-0.5 ${!notification.read ? 'font-semibold' : ''}`}>
            {notification.title || 'New notification'}
          </h4>
          
          {notification.message && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {notification.message}
            </p>
          )}
          
          {notification.created_by?.full_name && (
            <p className="text-xs text-gray-400 mt-1">
              From: {notification.created_by.full_name}
            </p>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {notification.related_entity_id && (
            <button 
              onClick={handleNavigate}
              className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
              title="View details"
            >
              <ExternalLink size={16} />
            </button>
          )}
          
          {!notification.read && (
            <button 
              onClick={handleMarkAsRead}
              disabled={markAsReadMutation.isPending}
              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
              title="Mark as read"
            >
              <Check size={16} />
            </button>
          )}
          
          <button 
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
