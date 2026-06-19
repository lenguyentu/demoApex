import { useState } from 'react';
import { X, FileText, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { JOB_PHASE_CONFIG } from '../constants';
import type { JobPhase } from '../types';

interface JobPhaseMemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  newPhase: JobPhase;
  currentPhase: JobPhase | null;
  onSuccess: () => void;
}

export const JobPhaseMemoModal = ({
  isOpen,
  onClose,
  jobId,
  newPhase,
  currentPhase,
  onSuccess
}: JobPhaseMemoModalProps) => {
  const [memo, setMemo] = useState('');
  const [updating, setUpdating] = useState(false);

  const handleSubmit = async () => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('jobs')
        .update({
          phase: newPhase,
          phase_memo: memo || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (error) throw error;

      toast.success('Đã cập nhật phase thành công');
      setMemo('');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error updating phase:', err);
      toast.error(err.message || 'Không thể cập nhật phase');
    } finally {
      setUpdating(false);
    }
  };

  if (!isOpen) return null;

  const newPhaseConfig = JOB_PHASE_CONFIG[newPhase];
  const currentPhaseConfig = currentPhase ? JOB_PHASE_CONFIG[currentPhase] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity" 
        onClick={onClose}
      />

      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-2xl transform transition-all sm:max-w-md sm:w-full z-10 border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText size={20} className="text-brand-600" />
            Ghi chú thay đổi Phase
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Phase Change Display */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              <strong>Thay đổi phase:</strong>
            </p>
            <div className="flex items-center gap-2">
              {currentPhaseConfig && (
                <span className={`px-2.5 py-1 rounded text-sm font-semibold ${currentPhaseConfig.color}`}>
                  {currentPhaseConfig.displayName}
                </span>
              )}
              <span className="text-gray-400">→</span>
              <span className={`px-2.5 py-1 rounded text-sm font-semibold ${newPhaseConfig?.color || 'bg-gray-100 text-gray-700'}`}>
                {newPhaseConfig?.displayName || newPhase}
              </span>
            </div>
          </div>

          {/* Memo Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ghi chú (tùy chọn)
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={4}
              placeholder="Nhập ghi chú về lý do thay đổi phase..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none"
              autoFocus
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={updating}
            className="inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={updating}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save size={16} />
                Lưu thay đổi
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
