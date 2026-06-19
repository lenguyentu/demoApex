import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { ChatWindow } from '../components/ChatWindow';
import { useFlattenedConversations, useChatRealtime, useMarkAsRead } from '../hooks';
import { getConversationByProcessId } from '../api';
import { Loader2 } from 'lucide-react';
import type { Conversation } from '../types';

export const ChatLayout = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const processIdFromUrl = searchParams.get('process');

  const { 
    conversations, 
    isLoading, 
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage
  } = useFlattenedConversations();
  
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [directConversation, setDirectConversation] = useState<Conversation | null>(null);
  const { mutate: markAsRead } = useMarkAsRead();

  // Enable realtime updates
  useChatRealtime();

  // Handle process ID from URL
  useEffect(() => {
    if (processIdFromUrl && conversations) {
      // Find conversation by process_id in loaded list
      const existingConv = conversations.find(c => c.process_id === processIdFromUrl);
      
      if (existingConv) {
        setSelectedConversationId(existingConv.id);
        setDirectConversation(null);
        markAsRead(existingConv.id);
        setSearchParams({});
      } else {
        // Fetch conversation directly by process_id
        getConversationByProcessId(processIdFromUrl).then(conv => {
          if (conv) {
            setDirectConversation(conv);
            setSelectedConversationId(conv.id);
            markAsRead(conv.id);
          }
          setSearchParams({});
        }).catch(() => {
          setSearchParams({});
        });
      }
    }
  }, [processIdFromUrl, conversations, markAsRead, setSearchParams]);

  // Auto-select first conversation when data loads (only if no URL param)
  useEffect(() => {
    if (!processIdFromUrl && conversations && conversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId, processIdFromUrl]);

  // Mark as read when selecting a conversation
  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
    markAsRead(id);
  };

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Use directConversation as fallback if not in loaded list
  const selectedConversation = conversations?.find(c => c.id === selectedConversationId) || directConversation;

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] bg-gray-50 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#ED0A63]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-64px)] bg-gray-50 items-center justify-center">
        <p className="text-red-500">Error loading conversations</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50 overflow-hidden font-sans">
      {/* Pane 1: Sidebar List */}
      <div className="w-96 border-r border-gray-200 bg-white flex flex-col shrink-0">
        <Sidebar 
          conversations={conversations || []} 
          selectedId={selectedConversationId}
          onSelect={handleSelectConversation}
          hasMore={hasNextPage}
          isLoadingMore={isFetchingNextPage}
          onLoadMore={handleLoadMore}
        />
      </div>

      {/* Pane 2: Main Chat Window */}
      <div className="flex-1 flex flex-col min-w-0 bg-white relative">
        {selectedConversation ? (
          <ChatWindow conversation={selectedConversation} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            {conversations?.length === 0 
              ? 'Chưa có cuộc trò chuyện nào'
              : 'Chọn một cuộc trò chuyện để bắt đầu'}
          </div>
        )}
      </div>
    </div>
  );
};
