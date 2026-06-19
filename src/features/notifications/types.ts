/**
 * Notification types - Các loại thông báo trong hệ thống
 * Grouped by target role/permission
 */

// ============================================
// GROUP 1: Job & Freelancer Related (Freelancer, CTV, HR)
// ============================================
export type JobFreelancerNotificationType =
  | 'job_assignment_type_changed_to_freelancer'  // Job được gán cho Freelancer
  | 'job_assignment_type_changed_admin'          // Job assignment changed (CTV → Freelancer)
  | 'job_open_created'                            // Job mới được tạo (Open)
  | 'job_phase_cancelled';                        // Job phase bị hủy

// ============================================
// GROUP 2: Process Related (Owner/Participant)
// ============================================
export type ProcessNotificationType =
  | 'new_process_owner'                          // Process mới - Owner
  | 'new_process_ctv_freelancer_hr'              // Process mới - CTV/Freelancer/HR
  | 'new_process_client_owner'                   // Process mới - Client Owner
  | 'process_status_update'                      // Cập nhật status - Owner
  | 'process_status_update_ctv_freelancer_hr'    // Cập nhật status - CTV/Freelancer/HR
  | 'process_status_update_client_owner';        // Cập nhật status - Client Owner

// ============================================
// GROUP 3: Admin Notifications
// ============================================
export type AdminNotificationType =
  | 'new_process_admin'                          // Process mới - Admin
  | 'new_process_privileged_user'                // Process mới - Privileged User
  | 'process_status_update_admin';               // Cập nhật status - Admin

// ============================================
// GROUP 4: User & Registration
// ============================================
export type UserNotificationType =
  | 'new_user_registration'                      // Đăng ký user mới
  | 'user_registration_no_referral'              // Đăng ký không có referral
  | 'referral_registration';                     // Đăng ký qua referral

// ============================================
// GROUP 5: Communication
// ============================================
export type CommunicationNotificationType =
  | 'job_comment'                                // Comment trong job
  | 'chat_message';                              // Tin nhắn chat

// ============================================
// GROUP 6: BD & Customer Care Related
// ============================================
export type BDNotificationType = 
  | 'bd_reminder';                               // Lịch chăm sóc khách hàng

// ============================================
// Combined Type
// ============================================
export type NotificationType =
  | JobFreelancerNotificationType
  | ProcessNotificationType
  | AdminNotificationType
  | UserNotificationType
  | CommunicationNotificationType
  | BDNotificationType
  | string;  // Allow other custom types

/**
 * Notification type groups for filtering UI
 */
export const NOTIFICATION_TYPE_GROUPS = {
  job_freelancer: {
    label: '📋 Job & Freelancer',
    types: [
      'job_assignment_type_changed_to_freelancer',
      'job_assignment_type_changed_admin',
      'job_open_created',
      'job_phase_cancelled',
    ],
  },
  process: {
    label: '🔄 Process',
    types: [
      'new_process_owner',
      'new_process_ctv_freelancer_hr',
      'new_process_client_owner',
      'process_status_update',
      'process_status_update_ctv_freelancer_hr',
      'process_status_update_client_owner',
    ],
  },
  admin: {
    label: '🔧 Admin',
    types: [
      'new_process_admin',
      'new_process_privileged_user',
      'process_status_update_admin',
    ],
  },
  user: {
    label: '👤 User & Registration',
    types: [
      'new_user_registration',
      'user_registration_no_referral',
      'referral_registration',
    ],
  },
  communication: {
    label: '💬 Communication',
    types: [
      'job_comment',
      'chat_message',
    ],
  },
  bd: {
    label: '🤝 BD & Customer Care',
    types: [
      'bd_reminder',
    ],
  },
} as const;

/**
 * Related entity types
 */
export type RelatedEntityType = 'process' | 'job' | 'candidate' | 'comment' | 'user' | 'chat' | 'bd_process' | string;

/**
 * Notification interface - Maps to public.notifications table
 */
export interface Notification {
  id: string;
  user_id_receiver: string;
  title: string | null;
  message: string | null;
  type: NotificationType | null;
  related_entity_type: RelatedEntityType | null;
  related_entity_id: string | null;
  read: boolean;
  created_at: string;
  created_by_id: string | null;
  event_id: string | null;
  remind_time: string | null;
  // Joined fields
  created_by?: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
}

/**
 * Filter options for notifications list
 */
export interface NotificationFilters {
  type?: NotificationType | '';
  typeGroup?: keyof typeof NOTIFICATION_TYPE_GROUPS | '';
  readStatus?: 'all' | 'read' | 'unread';
}
