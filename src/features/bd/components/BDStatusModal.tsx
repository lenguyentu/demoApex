import { useState, useEffect } from 'react';
import { X, Target, Info } from 'lucide-react';

interface BDStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (memo: string) => Promise<void>;
  newStatus: string;
  currentMemo: string;
  clientName: string;
}

export function BDStatusModal({
  isOpen,
  onClose,
  onConfirm,
  newStatus,
  currentMemo,
  clientName,
}: BDStatusModalProps) {
  const [memo, setMemo] = useState(currentMemo);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMemo(currentMemo || '');
    }
  }, [isOpen, currentMemo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirm(memo.trim());
      onClose();
    } catch (error) {
      console.error('Failed to update BD status:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-110 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-100 rounded-lg text-pink-600">
              <Target size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Update BD Status</h3>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">
                Customer: <span className="text-pink-600">{clientName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Status Display */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              New Status
            </label>
            <div className="px-4 py-2.5 bg-pink-50 border border-pink-100 rounded-xl text-pink-700 font-bold text-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
              {newStatus}
            </div>
          </div>

          {/* Memo Input */}
          <div>
            <label htmlFor="bd-memo" className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              Update note <Info size={14} className="text-gray-400" />
            </label>
            <textarea
              id="bd-memo"
              rows={4}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Enter note or reason for status change..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 text-sm font-medium transition-all resize-none bg-gray-50/30"
            />
            <p className="mt-2 text-[11px] text-gray-400">
              * This note will be saved in the BD process history.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-bold text-white bg-pink-600 rounded-xl hover:bg-pink-700 shadow-lg shadow-pink-200 focus:ring-4 focus:ring-pink-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                'Confirm Update'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
