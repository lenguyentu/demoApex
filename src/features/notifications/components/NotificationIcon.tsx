import { Bell, MessageSquare, CheckCircle, Briefcase, Users, AlertCircle, Calendar } from 'lucide-react';
import type { NotificationType } from '../types';

interface NotificationIconProps {
  type: NotificationType | null;
  className?: string;
}

/**
 * Get icon and colors based on notification type
 */
export function NotificationIcon({ type, className = '' }: NotificationIconProps) {
  const baseClass = 'w-5 h-5';
  
  // Job & Freelancer types
  if (type?.includes('job_') || type?.includes('freelancer')) {
    return <Briefcase className={`${baseClass} text-blue-500 ${className}`} />;
  }
  
  // Process types
  if (type?.includes('process')) {
    return <CheckCircle className={`${baseClass} text-green-500 ${className}`} />;
  }
  
  // Admin types
  if (type?.includes('admin') || type?.includes('privileged')) {
    return <AlertCircle className={`${baseClass} text-orange-500 ${className}`} />;
  }
  
  // User & Registration types
  if (type?.includes('user') || type?.includes('registration') || type?.includes('referral')) {
    return <Users className={`${baseClass} text-purple-500 ${className}`} />;
  }
  
  // Communication types
  if (type?.includes('comment') || type?.includes('chat') || type?.includes('message')) {
    return <MessageSquare className={`${baseClass} text-indigo-500 ${className}`} />;
  }

  // BD & Customer Care types
  if (type?.includes('bd_')) {
    return <Calendar className={`${baseClass} text-amber-500 ${className}`} />;
  }
  
  return <Bell className={`${baseClass} text-gray-500 ${className}`} />;
}

/**
 * Get notification type label
 */
export function getNotificationTypeLabel(type: NotificationType | null): string {
  const typeLabels: Record<string, string> = {
    // Job & Freelancer
    'job_assignment_type_changed_to_freelancer': 'Job → Freelancer',
    'job_open_created': 'New Job',
    'job_phase_cancelled': 'Job phase cancelled',
    
    // Process - Owner/Participant
    'new_process_owner': 'New Process (Owner)',
    'new_process_ctv_freelancer_hr': 'New Process (CTV/FL/HR)',
    'new_process_client_owner': 'New Process (Client)',
    'process_status_update': 'Status Update',
    'process_status_update_ctv_freelancer_hr': 'Status (CTV/FL/HR)',
    'process_status_update_client_owner': 'Status (Client)',
    
    // Admin
    'new_process_admin': 'New Process (Admin)',
    'new_process_privileged_user': 'New Process (Privileged)',
    'process_status_update_admin': 'Status (Admin)',
    'job_assignment_type_changed_admin': 'Job changed (Admin)',
    
    // User & Registration
    'new_user_registration': 'New Registration',
    'user_registration_no_referral': 'Registration (No Ref)',
    'referral_registration': 'Referral Registration',
    
    // Communication
    'job_comment': 'Comment Job',
    'chat_message': 'Chat Message',

    // BD & Customer Care
    'bd_reminder': 'Customer Care',
  };
  
  return typeLabels[type || ''] || type || 'Notification';
}

/**
 * Get background color for notification type badge
 */
export function getNotificationTypeBgColor(type: NotificationType | null): string {
  // Job & Freelancer types
  if (type?.includes('job_') || type?.includes('freelancer')) {
    return 'bg-blue-100 text-blue-700';
  }
  
  // Process types
  if (type?.includes('process')) {
    return 'bg-green-100 text-green-700';
  }
  
  // Admin types
  if (type?.includes('admin') || type?.includes('privileged')) {
    return 'bg-orange-100 text-orange-700';
  }
  
  // User & Registration types
  if (type?.includes('user') || type?.includes('registration') || type?.includes('referral')) {
    return 'bg-purple-100 text-purple-700';
  }
  
  // Communication types
  if (type?.includes('comment') || type?.includes('chat') || type?.includes('message')) {
    return 'bg-indigo-100 text-indigo-700';
  }

  // BD & Customer Care types
  if (type?.includes('bd_')) {
    return 'bg-amber-100 text-amber-700';
  }
  
  return 'bg-gray-100 text-gray-700';
}
