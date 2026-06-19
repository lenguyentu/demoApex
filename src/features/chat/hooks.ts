import { useMutation, useQueryClient, useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { useAuthStore } from '../auth/store';
import {
  getConversationsPaginated,
  getMessages,
  sendMessage,
  markConversationAsRead,
  getTotalUnreadCount,
} from './api';
import type { Message } from './types';

// ============================================
// QUERY KEYS
// ============================================
export const chatKeys = {
  all: ['chat'] as const,
  conversations: (userId?: string) => [...chatKeys.all, 'conversations', userId] as const,
  messages: (conversationId: string) => [...chatKeys.all, 'messages', conversationId] as const,
  unreadCount: (userId?: string) => [...chatKeys.all, 'unread', userId] as const,
};

// ============================================
// QUERY HOOKS
// ============================================

const CONVERSATIONS_PAGE_SIZE = 20;

/**
 * Hook to get conversations with infinite scroll
 */
export function useConversations() {
  const user = useAuthStore((state) => state.user);

  return useInfiniteQuery({
    queryKey: chatKeys.conversations(user?.id),
    queryFn: ({ pageParam }) => getConversationsPaginated(CONVERSATIONS_PAGE_SIZE, pageParam as number | undefined),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < CONVERSATIONS_PAGE_SIZE) return undefined;
      return allPages.length * CONVERSATIONS_PAGE_SIZE;
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to get flattened conversations from infinite query
 */
export function useFlattenedConversations() {
  const { data, ...rest } = useConversations();

  const conversations = useMemo(() => {
    return data?.pages.flat() || [];
  }, [data]);

  return { conversations, ...rest };
}

/**
 * Hook to get messages for a conversation (infinite scroll)
 */
export function useMessages(conversationId: string | null) {
  const PAGE_SIZE = 30;

  return useInfiniteQuery({
    queryKey: chatKeys.messages(conversationId || ''),
    queryFn: async ({ pageParam }) => {
      if (!conversationId) return [];
      return getMessages(conversationId, PAGE_SIZE, pageParam as string | undefined);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
      return lastPage[lastPage.length - 1]?.created_at;
    },
    enabled: !!conversationId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to get total unread count
 */
export function useChatUnreadCount() {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: chatKeys.unreadCount(user?.id),
    queryFn: () => getTotalUnreadCount(user?.id || ''),
    enabled: !!user?.id,
    refetchInterval: 30000, // Fallback polling
  });
}

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Hook to send a message
 */
export function useSendMessage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: ({ conversationId, content, attachments }: { 
      conversationId: string; 
      content: string; 
      attachments?: Message['attachments'];
    }) => {
      if (!user?.id) throw new Error('User not logged in');
      return sendMessage(conversationId, user.id, content, attachments);
    },
    onMutate: async (newMsg) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: chatKeys.messages(newMsg.conversationId) });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(chatKeys.messages(newMsg.conversationId));

      // Optimistically update
      queryClient.setQueryData(chatKeys.messages(newMsg.conversationId), (old: any) => {
        if (!old) return old;
        
        // Mock temporary message
        const optimisticMessage: Message = {
          id: 'temp-' + Date.now(),
          conversation_id: newMsg.conversationId,
          sender_id: user?.id || '',
          content: newMsg.content,
          attachments: newMsg.attachments || [],
          parent_message_id: null,
          is_edited: false,
          is_deleted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sender: {
            id: user?.id || '',
            full_name: user?.full_name || 'Me',
            avatar_url: user?.avatar_url,
            role: user?.role,
            email: user?.email
          }
        };

        const newPages = [...old.pages];
        if (newPages.length > 0) {
          // Add to first page (newest messages are first in fetch, but reversed in display)
          // Actually getMessages returns newest first. 
          // So we should prepend to the first page.
          newPages[0] = [optimisticMessage, ...newPages[0]];
        }
        
        return {
          ...old,
          pages: newPages,
        };
      });

      return { previousMessages };
    },
    onError: (error, newMsg, context) => {
      toast.error('Không thể gửi tin nhắn: ' + (error as Error).message);
      // Rollback
      if (context?.previousMessages) {
        queryClient.setQueryData(chatKeys.messages(newMsg.conversationId), context.previousMessages);
      }
    },
    onSettled: (_, __, variables) => {
      // Always invalidate to ensure sync
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(variables.conversationId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    },
  });
}

/**
 * Hook to mark conversation as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: (conversationId: string) => {
      if (!user?.id) throw new Error('User not logged in');
      return markConversationAsRead(conversationId, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
      queryClient.invalidateQueries({ queryKey: chatKeys.unreadCount() });
    },
  });
}

// ============================================
// REALTIME HOOKS
// ============================================

/**
 * Hook to subscribe to new messages in a conversation
 */
export function useMessageRealtime(conversationId: string | null) {
  // Mock: No realtime in demo
}

export function useChatRealtime() {
  // Mock: No realtime in demo
}

// ============================================
// HELPER HOOKS
// ============================================

/**
 * Get flattened messages from infinite query
 */
export function useFlattenedMessages(conversationId: string | null) {
  const { data, ...rest } = useMessages(conversationId);

  const messages = useMemo(() => {
    const flat = data?.pages.flat() || [];
    // Reverse to show oldest first (for chat display)
    return [...flat].reverse();
  }, [data]);

  return { messages, ...rest };
}
