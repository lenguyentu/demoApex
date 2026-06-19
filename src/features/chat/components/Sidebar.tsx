import { useState, useRef, useCallback } from 'react';
import type { Conversation } from '../types';
import { Search, Loader2 } from 'lucide-react';
import { UserAvatar } from '../../../components/UserAvatar';

interface SidebarProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

export const Sidebar = ({ 
  conversations, 
  selectedId, 
  onSelect,
  hasMore,
  isLoadingMore,
  onLoadMore 
}: SidebarProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const filteredConversations = conversations.filter(c => {
    const name = c.candidate_name || c.title || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Hôm qua';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('vi-VN', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    }
  };

  // Handle scroll to load more
  const handleScroll = useCallback(() => {
    if (!listRef.current || !hasMore || isLoadingMore) return;
    
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollHeight - scrollTop - clientHeight < 100) {
      onLoadMore?.();
    }
  }, [hasMore, isLoadingMore, onLoadMore]);

  return (
    <div className="flex flex-col h-full">
      {/* Header & Search */}
      <div className="p-4 border-b border-gray-100 space-y-3">
        <h2 className="text-xl font-bold text-gray-800">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm..." 
            className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ED0A63]/20 transition-all placeholder:text-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Filter section removed - unread logic needs DB fix */}

      {/* List */}
      <div 
        ref={listRef}
        className="flex-1 overflow-y-auto"
        onScroll={handleScroll}
      >
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            Không có cuộc trò chuyện nào
          </div>
        ) : (
          <>
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors group ${
                  selectedId === conv.id ? 'bg-[#ED0A63]/5 hover:bg-[#ED0A63]/10 border-l-4 border-l-[#ED0A63] pl-[12px]' : 'border-l-4 border-l-transparent'
                }`}
              >
                <div className="flex gap-3">
                  <UserAvatar 
                    name={conv.candidate_name || 'Unknown'} 
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <h3 className={`font-semibold truncate text-[15px] ${(conv.unread_count || 0) > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                        {conv.candidate_name || 'Cuộc trò chuyện'}
                      </h3>
                      <span className="text-xs text-gray-400 shrink-0">
                        {formatTime(conv.updated_at)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mb-1 bg-gray-100 inline-block px-1.5 py-0.5 rounded">
                      {conv.job_title}
                    </p>
                    <div className="flex justify-between items-end">
                      <p className={`text-sm truncate w-full pr-2 ${(conv.unread_count || 0) > 0 ? 'font-medium text-gray-800' : 'text-gray-500'}`}>
                        {conv.last_message 
                          ? (conv.last_message.content || '📎 Đã gửi tệp đính kèm')
                          : 'Chưa có tin nhắn'}
                      </p>
                       {(conv.unread_count || 0) > 0 && (
                        <span className="shrink-0 bg-[#ED0A63] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Load more indicator */}
            {isLoadingMore && (
              <div className="p-4 text-center">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400 mx-auto" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
