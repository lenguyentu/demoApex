// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../auth/store';
import { supabase } from '../../../lib/supabase';
import { fetchJobComments, createJobComment, updateJobComment, deleteJobComment } from '../api';
import type { JobComment } from '../types';
import toast from 'react-hot-toast';

interface JobCommentSectionProps {
  jobId: string;
}

// Helper function to format relative time
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Comment Item Component
const CommentItem = ({
  comment,
  currentUserId,
  currentUserEmail,
  onEdit,
  onDelete,
  onReplySubmit,
  isReply = false,
}: {
  comment: JobComment;
  currentUserId?: string;
  currentUserEmail?: string;
  onEdit: (comment: JobComment) => void;
  onDelete: (commentId: string) => void;
  onReplySubmit: (parentId: string, content: string) => Promise<void>;
  isReply?: boolean;
}) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  
  const isOwner = currentUserId === comment.user_id;
  const userName = comment.user?.full_name || comment.user?.email?.split('@')[0] || 'Unknown';
  const userRole = comment.user?.role;
  
  // Format display name as "Role - Name" or just "Name"
  const displayName = userRole ? `${userRole} - ${userName}` : userName;

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || isSubmittingReply) return;
    
    try {
      setIsSubmittingReply(true);
      await onReplySubmit(comment.id, replyContent);
      setReplyContent('');
      setShowReplyInput(false);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  return (
    <div className={`${isReply ? 'ml-8 mt-3' : ''}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center shrink-0">
          <span className="text-sm font-medium text-brand-600 dark:text-brand-400">
            {userName.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {displayName}
            </span>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mt-1">
              {comment.content}
            </p>
          </div>

          {/* Meta info & Actions */}
          <div className="flex items-center gap-2 mt-1 px-1 text-xs">
            <span className="text-gray-500 dark:text-gray-400">
              {formatRelativeTime(comment.created_at)}
              {comment.is_edited && ' (edited)'}
            </span>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            {!isReply && (
              <button
                onClick={() => setShowReplyInput(!showReplyInput)}
                className="text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium"
              >
                Reply
              </button>
            )}
            {isOwner && (
              <>
                <button
                  onClick={() => onEdit(comment)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(comment.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  Delete
                </button>
              </>
            )}
          </div>

          {/* Inline Reply Input */}
          {showReplyInput && !isReply && (
            <div className="mt-3 flex gap-2">
              <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center shrink-0">
                <span className="text-xs font-medium text-white">
                  {currentUserEmail?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitReply();
                    }
                  }}
                  placeholder="Write a reply..."
                  maxLength={2000}
                  autoFocus
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <div className="flex items-center gap-2 mt-1.5 px-1">
                  <button
                    onClick={() => { setShowReplyInput(false); setReplyContent(''); }}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReply}
                    disabled={!replyContent.trim() || isSubmittingReply}
                    className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium disabled:opacity-50 flex items-center gap-1"
                  >
                    {isSubmittingReply ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />}
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  currentUserEmail={currentUserEmail}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onReplySubmit={onReplySubmit}
                  isReply
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Component
export const JobCommentSection = ({ jobId }: JobCommentSectionProps) => {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<JobComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<JobComment | null>(null);

  // Fetch comments
  const loadComments = useCallback(async () => {
    try {
      setLoading(true);
      // MOCK COMMENTS
      setComments([]);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  // Initial load + Realtime subscription
  useEffect(() => {
    loadComments();
    // MOCK: Disabled Realtime subscription for Demo
  }, [jobId, loadComments]);

  // Handle submit new comment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    try {
      setSubmitting(true);
      await createJobComment(jobId, newComment);
      setNewComment('');
      await loadComments();
      toast.success('Comment added');
    } catch (error) {
      console.error('Error creating comment:', error);
      toast.error('Cannot add comment');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle reply (inline)
  const handleReplySubmit = async (parentId: string, content: string) => {
    try {
      await createJobComment(jobId, content, parentId);
      await loadComments();
      toast.success('Replied to comment');
    } catch (error) {
      console.error('Error creating reply:', error);
      toast.error('Cannot reply');
    }
  };

  // Handle edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComment || submitting) return;

    try {
      setSubmitting(true);
      await updateJobComment(editingComment.id, editingComment.content);
      setEditingComment(null);
      await loadComments();
      toast.success('Comment updated');
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Cannot update');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await deleteJobComment(commentId);
      await loadComments();
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Cannot delete');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
        <MessageSquare className="text-brand-500" size={20} />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Comments ({comments.length})
        </h3>
      </div>

      {/* New comment form */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center shrink-0">
            <span className="text-sm font-medium text-white">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              rows={2}
              maxLength={2000}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none text-sm"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-400">{newComment.length}/2000</span>
              <button
                type="submit"
                disabled={!newComment.trim() || submitting}
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Send
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Comments list */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-brand-500" size={24} />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
          <p>No comments yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={user?.id}
              currentUserEmail={user?.email}
              onEdit={setEditingComment}
              onDelete={handleDelete}
              onReplySubmit={handleReplySubmit}
            />
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editingComment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 w-full max-w-md mx-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Edit comment</h4>
            <form onSubmit={handleEditSubmit}>
              <textarea
                value={editingComment.content}
                onChange={(e) => setEditingComment({ ...editingComment, content: e.target.value })}
                rows={3}
                maxLength={2000}
                autoFocus
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none text-sm"
              />
              <div className="flex justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setEditingComment(null)}
                  className="px-4 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editingComment.content.trim() || submitting}
                  className="px-4 py-1.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 text-sm font-medium"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobCommentSection;

