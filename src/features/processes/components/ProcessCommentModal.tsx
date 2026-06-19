
import React, { useState, useEffect } from 'react';
import { X, Send, Edit2, Trash2, User } from 'lucide-react';
import { useAuthStore } from '../../auth/store';
import { getProcessComments, createProcessComment, deleteProcessComment, updateProcessComment, markProcessCommentsAsRead } from '../api';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';

interface ProcessCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  processId: string;
  onCommentsRead?: () => void; // Callback to refresh list unread count
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  user_id: string;
  is_read?: boolean;
  user?: {
    full_name: string;
    role?: string;
  };
}

export function ProcessCommentModal({ isOpen, onClose, processId, onCommentsRead }: ProcessCommentModalProps) {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const commentsEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchComments = async () => {
    setLoading(true);
    try {
      const data = await getProcessComments(processId);
      setComments(data as Comment[]);
      // Auto-scroll to bottom after loading
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Failed to fetch comments', error);
      toast.error('Could not load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && processId) {
      fetchComments();
      // Mark as read
      markProcessCommentsAsRead(processId).then(() => {
         if (onCommentsRead) onCommentsRead();
      });

      // Real-time subscription for new comments
      const channel = supabase
        .channel(`process_comments:${processId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'process_comments',
            filter: `process_id=eq.${processId}`,
          },
          () => {
            // Refetch comments when changes occur
            fetchComments();
          }
        )
        .subscribe();

      // Cleanup on unmount or when modal closes
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isOpen, processId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await createProcessComment(processId, newComment.trim());
      setNewComment('');
      await fetchComments();
    //   toast.success('Comment added');
    } catch (error) {
      console.error('Failed to add comment', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (commentId: string) => {
      if(!editContent.trim()) return;
      try {
          await updateProcessComment(commentId, editContent.trim());
          setEditingCommentId(null);
          setEditContent('');
          await fetchComments();
          toast.success('Comment updated');
      } catch (error) {
          console.error('Failed update', error);
          toast.error('Failed update');
      }
  }

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteProcessComment(commentId);
      await fetchComments();
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Failed delete', error);
      toast.error('Failed delete');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col h-[600px] max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-semibold text-gray-900">Comments</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
             <div className="text-center py-4 text-gray-400">Loading comments...</div>
          ) : comments.length === 0 ? (
             <div className="text-center py-10 text-gray-400 text-sm">No comments yet. Be the first to start the conversation!</div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className={`flex gap-3 ${comment.user_id === user?.id ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                    comment.user_id === user?.id ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  <User size={16} />
                </div>
                
                <div className={`group relative max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    comment.user_id === user?.id 
                    ? 'bg-brand-50 text-gray-900 rounded-tr-none' 
                    : 'bg-gray-100 text-gray-900 rounded-tl-none'
                }`}>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-xs opacity-75">{comment.user?.full_name}</span>
                        <span className="text-[10px] text-gray-400 pr-1">
                            {new Date(comment.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute:'2-digit', day:'2-digit', month:'2-digit' })}
                        </span>
                    </div>
                  
                  {editingCommentId === comment.id ? (
                      <div className="flex flex-col gap-2 min-w-[200px]">
                          <textarea 
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full text-sm p-2 border rounded bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                            rows={2}
                          />
                          <div className="flex justify-end gap-2">
                              <button onClick={() => setEditingCommentId(null)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                              <button onClick={() => handleUpdate(comment.id)} className="text-xs text-brand-600 hover:text-brand-700 font-medium">Save</button>
                          </div>
                      </div>
                  ) : (
                      <>
                        <p className="whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                        {comment.is_edited && <span className="text-[9px] text-gray-400 italic mt-1 block">Edited</span>}
                      </>
                  )}

                  {/* Actions for own comments */}
                  {comment.user_id === user?.id && !editingCommentId && (
                      <div className={`absolute top-2 ${comment.user_id === user?.id ? '-left-8' : '-right-8'} opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1`}>
                          <button 
                            onClick={() => {
                                setEditingCommentId(comment.id);
                                setEditContent(comment.content);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="Edit"
                          >
                              <Edit2 size={12} />
                          </button>
                          <button 
                             onClick={() => handleDelete(comment.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Delete"
                          >
                              <Trash2 size={12} />
                          </button>
                      </div>
                  )}
                </div>
              </div>
            ))
          )}
          {/* Scroll anchor - always at bottom */}
          <div ref={commentsEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-3 border-t border-gray-100 bg-white">
          <div className="relative flex items-center gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 rounded-full bg-gray-100 border-none py-2.5 px-4 text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="p-2.5 rounded-full bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:hover:bg-brand-600 transition-colors shadow-sm"
            >
              <Send size={16} className={submitting ? 'opacity-50' : ''} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
