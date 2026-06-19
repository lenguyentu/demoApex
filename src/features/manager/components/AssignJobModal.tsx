import { useState } from 'react';
import { X } from 'lucide-react';
import { useTeamMembers, useCreateJobFocus, useCurrentWeekStart } from '../hooks';

interface AssignJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
}

export default function AssignJobModal({ isOpen, onClose, jobId, jobTitle }: AssignJobModalProps) {
  const [assigneeId, setAssigneeId] = useState('');
  const [note, setNote] = useState('');

  const { data: teamMembers = [], isLoading: loadingMembers } = useTeamMembers();
  const { data: weekStart } = useCurrentWeekStart();
  const createMutation = useCreateJobFocus();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigneeId || !weekStart) return;

    try {
      await createMutation.mutateAsync({
        job_id: jobId,
        assignee_id: assigneeId,
        week_start: weekStart,
        note: note.trim() || undefined,
      });
      onClose();
      setAssigneeId('');
      setNote('');
    } catch (error) {
      console.error('Failed to assign job:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Giao Job Focus</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Job info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Job</p>
            <p className="text-sm font-semibold text-gray-900">{jobTitle}</p>
          </div>

          {/* Assignee select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giao cho <span className="text-red-500">*</span>
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              required
              disabled={loadingMembers}
            >
              <option value="">-- Chọn HH --</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name} ({member.role})
                </option>
              ))}
            </select>
            {teamMembers.length === 0 && !loadingMembers && (
              <p className="text-xs text-amber-600 mt-1">
                Không có team member nào. Kiểm tra managed_by_id.
              </p>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
              rows={3}
              placeholder="Ví dụ: Focus vào senior level, deadline tuần này..."
            />
          </div>

          {/* Week info */}
          {weekStart && (
            <div className="text-xs text-gray-500">
              Tuần: <span className="font-mono font-semibold">{weekStart}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!assigneeId || createMutation.isPending}
              className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? 'Đang giao...' : 'Giao Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
