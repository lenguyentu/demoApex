/**
 * Chat Types
 */

export interface User {
  id: string;
  full_name: string;
  email?: string;
  role?: string;
  email_role?: string; // 'internal' | 'freelancer'
  avatar_url?: string;
}

export interface LastMessage {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachments: { name: string; url: string; type: string; size: number }[];
  parent_message_id: string | null;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  sender?: User;
}

/**
 * Conversation from conversation_summary view
 */
export interface Conversation {
  id: string;
  process_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  // From view
  candidate_id: string;
  job_id: string;
  process_owner_id: string;
  candidate_name: string;
  job_title: string;
  owner_name: string;
  unread_count: number;
  last_message: LastMessage | null;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  last_read_at: string | null;
  is_active: boolean;
  joined_at: string;
  // Joined fields
  user?: User;
}
