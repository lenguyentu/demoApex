import { useState, useEffect } from 'react';
import { X, Save, Edit } from 'lucide-react';
import { RichTextEditor } from '../../../components/RichTextEditor';
import type { BDPhase, BDStatus, UpdateBDProcessPayload } from '../types';

interface MemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: UpdateBDProcessPayload) => Promise<void>;
  currentPhase: BDPhase;
  currentStatus: BDStatus;
  initialMemo?: string | null;
  loading?: boolean;
}

const PHASE_OPTIONS = [
  { value: 'Connect', label: 'Phase 1: Connect' },
  { value: 'Working', label: 'Phase 2: Working' },
  { value: 'Nurturing', label: 'Phase 3: Nurturing' },
  { value: 'Lost', label: 'Phase 4: Lost/Closed' },
];

const STATUS_OPTIONS = [
  { group: 'Phase 1: Connect', options: [
    { value: 'Research', label: 'Research' },
    { value: 'Addfriend/Connect', label: 'Addfriend/Connect' },
    { value: 'Approach', label: 'Approach' },
  ]},
  { group: 'Phase 2: Working', options: [
    { value: 'Follow up', label: 'Follow up' },
    { value: 'Consulting', label: 'Consulting' },
    { value: 'Meeting Clear JD', label: 'Meeting Clear JD' },
    { value: 'Demo contract', label: 'Demo contract' },
    { value: 'Signing', label: 'Signing' },
  ]},
  { group: 'Phase 3: Nurture', options: [
    { value: 'Signed', label: 'Signed' },
    { value: 'Hunting', label: 'Hunting' },
    { value: 'Take care', label: 'Take care' },
    { value: 'No current need', label: 'No current need' },
    { value: 'Excluded', label: 'Excluded' },
  ]}
];

export const MemoModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  currentPhase, 
  currentStatus, 
  initialMemo,
  loading 
}: MemoModalProps) => {
  const [phase, setPhase] = useState<BDPhase>(currentPhase);
  const [status, setStatus] = useState<BDStatus>(currentStatus);
  const [memo, setMemo] = useState(initialMemo || '');

  useEffect(() => {
    if (isOpen) {
      setPhase(currentPhase);
      setStatus(currentStatus);
      setMemo(initialMemo || '');
    }
  }, [isOpen, currentPhase, currentStatus, initialMemo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm({
      phase,
      status,
      memo
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      <div className="bg-white rounded-xl overflow-hidden shadow-2xl w-full max-w-xl z-10 flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Edit size={20} className="text-brand-600" />
            Update Status & Notes
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-1 hover:bg-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phase
              </label>
              <select
                value={phase}
                onChange={(e) => setPhase(e.target.value as BDPhase)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              >
                {PHASE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BDStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              >
                {STATUS_OPTIONS.map(group => (
                  <optgroup key={group.group} label={group.group}>
                    {group.options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Memo)
            </label>
            <RichTextEditor
              value={memo}
              onChange={setMemo}
              placeholder="Enter detailed notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
