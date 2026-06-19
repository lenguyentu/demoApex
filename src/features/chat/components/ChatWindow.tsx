import { useState, useRef, useEffect } from 'react';
import type { Conversation } from '../types';
import { Paperclip, Send, Loader2, X, FileText, Image as ImageIcon } from 'lucide-react';
import { UserAvatar } from '../../../components/UserAvatar';
import { useFlattenedMessages, useSendMessage, useMessageRealtime } from '../hooks';
import { useAuthStore } from '../../auth/store';
import { uploadChatAttachments } from '../api';
import type { UploadedAttachment } from '../api';
import toast from 'react-hot-toast';

interface ChatWindowProps {
  conversation: Conversation;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const ChatWindow = ({ conversation }: ChatWindowProps) => {
  const [inputValue, setInputValue] = useState('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = useAuthStore((state) => state.user);
  
  const { messages, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useFlattenedMessages(conversation.id);
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();
  
  // Enable realtime for this conversation
  useMessageRealtime(conversation.id);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesContainerRef.current) {
      const { scrollHeight, clientHeight } = messagesContainerRef.current;
      messagesContainerRef.current.scrollTop = scrollHeight - clientHeight;
    }
  }, [messages]);

  // Close lightbox on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxImage(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const validateAndAddFiles = (files: File[]) => {
    const validFiles: File[] = [];
    
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File "${file.name}" quá lớn. Giới hạn 5MB.`);
        continue;
      }
      validFiles.push(file);
    }
    
    if (validFiles.length > 0) {
      setPendingFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    validateAndAddFiles(files);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!inputValue.trim() && pendingFiles.length === 0) || isSending || isUploading) return;
    
    let attachments: UploadedAttachment[] = [];
    
    // Upload files if any
    if (pendingFiles.length > 0) {
      setIsUploading(true);
      try {
        attachments = await uploadChatAttachments(pendingFiles, conversation.id);
        setPendingFiles([]);
      } catch (error) {
        toast.error('Không thể upload file: ' + (error as Error).message);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }
    
    sendMessage({
      conversationId: conversation.id,
      content: inputValue.trim(),
      attachments,
    }, {
      onSuccess: () => {
        setInputValue('');
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle paste for images from clipboard (Print Screen + Ctrl+V)
  // Converts to JPG for smaller file size
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          // Convert to JPG using canvas for smaller file size
          try {
            const jpgFile = await convertToJpg(file);
            if (jpgFile.size > MAX_FILE_SIZE) {
              toast.error('Ảnh quá lớn. Giới hạn 5MB.');
              return;
            }
            setPendingFiles(prev => [...prev, jpgFile]);
          } catch (err) {
            // Fallback to original file
            const timestamp = Date.now();
            const namedFile = new File([file], `screenshot_${timestamp}.png`, { type: file.type });
            validateAndAddFiles([namedFile]);
          }
        }
        break;
      }
    }
  };

  // Convert image to JPG using canvas (reduces file size)
  const convertToJpg = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw with white background (for transparency)
        ctx!.fillStyle = '#FFFFFF';
        ctx!.fillRect(0, 0, canvas.width, canvas.height);
        ctx!.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const timestamp = Date.now();
              const jpgFile = new File([blob], `screenshot_${timestamp}.jpg`, { type: 'image/jpeg' });
              resolve(jpgFile);
            } else {
              reject(new Error('Failed to convert to JPG'));
            }
          },
          'image/jpeg',
          0.85 // Quality 85%
        );
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const renderAttachment = (att: { name: string; url: string; type: string; size: number }, isFromMe: boolean) => {
    const isImage = att.type.startsWith('image/');
    
    if (isImage) {
      return (
        <button 
          key={att.url} 
          onClick={() => setLightboxImage(att.url)}
          className="block cursor-zoom-in"
        >
          <img 
            src={att.url} 
            alt={att.name} 
            className="max-w-[250px] max-h-[200px] rounded-xl object-cover shadow-md hover:shadow-lg transition-shadow"
          />
        </button>
      );
    }
    
    // File attachment - outside bubble
    return (
      <a 
        key={att.url}
        href={att.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className={`flex items-center gap-3 p-3 rounded-xl border shadow-sm hover:shadow-md transition-all ${
          isFromMe 
            ? 'bg-pink-50 border-pink-200 hover:bg-pink-100' 
            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
        }`}
      >
        <div className={`p-2 rounded-lg ${isFromMe ? 'bg-[#ED0A63]' : 'bg-blue-500'}`}>
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{att.name}</p>
          <p className="text-xs text-gray-500">
            {(att.size / 1024).toFixed(0)} KB • File đính kèm
          </p>
        </div>
      </a>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/30">
        {/* Lightbox Modal */}
        {lightboxImage && (
          <div 
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setLightboxImage(null)}
          >
            <button 
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
            >
              <X className="w-8 h-8" />
            </button>
            <img 
              src={lightboxImage} 
              alt="Preview" 
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Header - fixed at top */}
        <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center shrink-0 shadow-sm z-10">
            <div className="flex items-center gap-3">
                <UserAvatar 
                    name={conversation.candidate_name || conversation.title || 'Chat'} 
                    size="md"
                />
                <div>
                    <h2 className="font-bold text-gray-800">{conversation.candidate_name}</h2>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{conversation.job_title}</span>
                      {conversation.owner_name && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="text-orange-600 font-medium">{conversation.owner_name}</span>
                        </>
                      )}
                    </div>
                </div>
            </div>
        </div>

        {/* Messages */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
        >
            {/* Load more button */}
            {hasNextPage && (
              <div className="text-center">
                <button 
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="text-sm text-[#ED0A63] hover:underline"
                >
                  {isFetchingNextPage ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Tải thêm tin nhắn cũ'}
                </button>
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex justify-center py-8 text-gray-400 text-sm">
                Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.sender_id === user?.id;
                const showAvatar = !isMe && (idx === messages.length - 1 || messages[idx + 1]?.sender_id !== msg.sender_id);
                const showName = !isMe && (idx === 0 || messages[idx - 1]?.sender_id !== msg.sender_id);
                const senderRole = msg.sender?.role?.toLowerCase() || '';
                const isFreelancer = senderRole.includes('freelancer') || senderRole.includes('ctv');

                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group mb-1`}>
                    {!isMe && (
                      <div className="w-8 shrink-0 mr-2 flex flex-col justify-end">
                        {showAvatar ? (
                          <UserAvatar 
                            name={msg.sender?.full_name || 'Unknown'} 
                            avatarUrl={msg.sender?.avatar_url}
                            size="sm"
                            className="mb-1"
                          /> 
                        ) : <div className="w-8" />}
                      </div>
                    )}
                    <div className={`max-w-[70%] relative ${isMe ? 'order-1' : 'order-2'}`}>
                      {/* Sender name with role badge */}
                      {showName && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs font-medium text-gray-600">
                            {msg.sender?.full_name}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            isFreelancer 
                              ? 'bg-orange-100 text-orange-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {isFreelancer ? 'Freelancer' : 'Nội bộ'}
                          </span>
                        </div>
                      )}
                      {/* Text content bubble - only show if there's text */}
                      {msg.content && (
                        <div className={`px-4 py-2.5 rounded-2xl shadow-sm border ${
                          isMe 
                            ? 'bg-[#ED0A63] text-white border-[#ED0A63] rounded-br-sm' 
                            : 'bg-white text-gray-800 border-gray-100 rounded-bl-sm'
                        }`}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      )}
                      {/* Attachments - outside bubble */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className={`space-y-2 ${msg.content ? 'mt-2' : ''}`}>
                          {msg.attachments.map(att => renderAttachment(att, isMe))}
                        </div>
                      )}
                      <span className={`text-[10px] text-gray-400 mt-1 block opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-5 ${isMe ? 'right-0' : 'left-0'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
        </div>

        {/* Pending Files Preview */}
        {pendingFiles.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex gap-2 overflow-x-auto">
            {pendingFiles.map((file, idx) => (
              <div key={idx} className="relative shrink-0 bg-white border rounded-lg p-2 flex items-center gap-2">
                {file.type.startsWith('image/') ? (
                  <ImageIcon className="w-4 h-4 text-blue-500" />
                ) : (
                  <FileText className="w-4 h-4 text-gray-500" />
                )}
                <span className="text-xs max-w-[100px] truncate">{file.name}</span>
                <span className="text-xs text-gray-400">
                  {(file.size / 1024).toFixed(0)}KB
                </span>
                <button 
                  onClick={() => removePendingFile(idx)}
                  className="p-0.5 hover:bg-gray-100 rounded"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-200">
             <div className="bg-gray-50 border border-gray-200 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-[#ED0A63]/20 focus-within:border-[#ED0A63] transition-all">
                <textarea 
                    placeholder="Nhập tin nhắn... (Ctrl+V để paste ảnh)" 
                    className="w-full bg-transparent p-3 max-h-32 focus:outline-none text-sm resize-none"
                    rows={1}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    disabled={isSending || isUploading}
                />
                <div className="flex items-center justify-between px-2 pb-2">
                    <div className="flex gap-1 text-gray-400">
                        <input 
                          ref={fileInputRef}
                          type="file" 
                          multiple 
                          className="hidden" 
                          onChange={handleFileSelect}
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                        />
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                          title="Đính kèm file (tối đa 5MB)"
                        >
                          <Paperclip className="w-4 h-4" />
                        </button>
                    </div>
                    <button 
                      onClick={handleSend}
                      disabled={(!inputValue.trim() && pendingFiles.length === 0) || isSending || isUploading}
                      className="bg-[#ED0A63] hover:bg-[#c90854] disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors shadow-sm"
                    >
                        {(isSending || isUploading) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </div>
             </div>
             <p className="text-xs text-center text-gray-400 mt-2">
                Nhấn <span className="font-mono bg-gray-100 px-1 rounded">Enter</span> để gửi • Giới hạn 5MB/file
             </p>
        </div>
    </div>
  );
};
