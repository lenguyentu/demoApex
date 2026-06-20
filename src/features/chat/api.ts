// @ts-nocheck
import type { Conversation, Message } from './types';

export interface UploadedAttachment {
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
}

const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    process_id: 'process-1',
    title: 'Chat với Khách hàng A',
    created_at: new Date(Date.now() - 10000000).toISOString(),
    updated_at: new Date(Date.now() - 5000000).toISOString(),
    last_message: 'Bên mình đã nhận được CV nhé.',
    last_message_at: new Date(Date.now() - 5000000).toISOString(),
    unread_count: 2,
    participants: ['mock-user-123', 'client-a'],
    avatar_urls: []
  },
  {
    id: 'conv-2',
    process_id: 'process-2',
    title: 'Nội bộ Team HN',
    created_at: new Date(Date.now() - 80000000).toISOString(),
    updated_at: new Date(Date.now() - 2000000).toISOString(),
    last_message: 'Hôm nay mọi người update Daily Plan chưa?',
    last_message_at: new Date(Date.now() - 2000000).toISOString(),
    unread_count: 0,
    participants: ['mock-user-123', 'team-hn'],
    avatar_urls: []
  }
];

const mockMessages: Record<string, Message[]> = {
  'conv-1': [
    {
      id: 'msg-1',
      conversation_id: 'conv-1',
      sender_id: 'client-a',
      sender_name: 'Khách hàng A',
      content: 'Chào bạn, CV bạn gửi bên mình đã xem qua.',
      attachments: [],
      created_at: new Date(Date.now() - 6000000).toISOString()
    },
    {
      id: 'msg-2',
      conversation_id: 'conv-1',
      sender_id: 'client-a',
      sender_name: 'Khách hàng A',
      content: 'Bên mình đã nhận được CV nhé.',
      attachments: [],
      created_at: new Date(Date.now() - 5000000).toISOString()
    }
  ],
  'conv-2': [
    {
      id: 'msg-3',
      conversation_id: 'conv-2',
      sender_id: 'manager-1',
      sender_name: 'Quản lý Team',
      content: 'Hôm nay mọi người update Daily Plan chưa?',
      attachments: [],
      created_at: new Date(Date.now() - 2000000).toISOString()
    }
  ]
};

export async function getConversationsPaginated(limit: number = 20, offset: number = 0): Promise<Conversation[]> {
  return mockConversations.slice(offset, offset + limit);
}

export async function getOrCreateConversation(processId: string, title: string): Promise<Conversation> {
  let conv = mockConversations.find(c => c.process_id === processId);
  if (!conv) {
    conv = {
      id: `conv-${Date.now()}`,
      process_id: processId,
      title,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_message: '',
      last_message_at: new Date().toISOString(),
      unread_count: 0,
      participants: ['mock-user-123'],
      avatar_urls: []
    };
    mockConversations.unshift(conv);
    mockMessages[conv.id] = [];
  }
  return conv;
}

export async function getConversationByProcessId(processId: string): Promise<Conversation | null> {
  return mockConversations.find(c => c.process_id === processId) || null;
}

export async function getMessages(conversationId: string, limit: number = 50, beforeDate?: string): Promise<Message[]> {
  let msgs = mockMessages[conversationId] || [];
  if (beforeDate) {
    msgs = msgs.filter(m => new Date(m.created_at) < new Date(beforeDate));
  }
  return msgs.slice(-limit);
}

export async function uploadChatAttachment(conversationId: string, file: File): Promise<UploadedAttachment> {
  return {
    file_name: file.name,
    file_url: URL.createObjectURL(file),
    file_size: file.size,
    file_type: file.type
  };
}

export async function uploadChatAttachments(conversationId: string, files: File[]): Promise<UploadedAttachment[]> {
  return Promise.all(files.map(f => uploadChatAttachment(conversationId, f)));
}

export async function sendMessage(
  conversationId: string,
  content: string,
  attachments: UploadedAttachment[] = []
): Promise<Message> {
  const newMsg: Message = {
    id: `msg-${Date.now()}`,
    conversation_id: conversationId,
    sender_id: 'mock-user-123',
    sender_name: 'Bạn',
    content,
    attachments,
    created_at: new Date().toISOString()
  };
  
  if (!mockMessages[conversationId]) {
    mockMessages[conversationId] = [];
  }
  mockMessages[conversationId].push(newMsg);
  
  const conv = mockConversations.find(c => c.id === conversationId);
  if (conv) {
    conv.last_message = content || 'Gửi tệp đính kèm';
    conv.last_message_at = newMsg.created_at;
  }
  
  return newMsg;
}

export async function markConversationAsRead(conversationId: string, userId: string): Promise<void> {
  const conv = mockConversations.find(c => c.id === conversationId);
  if (conv) conv.unread_count = 0;
}

export async function addParticipant(conversationId: string, userId: string): Promise<void> {
  const conv = mockConversations.find(c => c.id === conversationId);
  if (conv && !conv.participants.includes(userId)) {
    conv.participants.push(userId);
  }
}

export async function getTotalUnreadCount(_userId: string): Promise<number> {
  return mockConversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
}
