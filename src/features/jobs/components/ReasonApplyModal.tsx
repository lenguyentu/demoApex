import { X } from 'lucide-react';
import DOMPurify from 'dompurify';

interface ReasonApplyModalProps {
  open: boolean;
  onClose: () => void;
  applicationReason?: string;
  candidateName?: string;
  candidateEmail?: string;
  candidatePhone?: string;
  candidateAddress?: string;
  positionTitle?: string;
}

export const ReasonApplyModal = ({
  open,
  onClose,
  applicationReason = '',
  candidateName = '',
  candidateEmail = '',
  candidatePhone = '',
  candidateAddress = '',
  positionTitle = '',
}: ReasonApplyModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-pink-600 text-white px-4 py-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Application Reason</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/20 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 max-h-[60vh] overflow-y-auto text-gray-700">
          <div className="mb-3">
            <h3 className="text-sm font-bold text-gray-800">
              {candidateName || 'Not updated'} —{' '}
              <span className="font-semibold text-gray-600">
                {positionTitle || 'Not updated'}
              </span>
            </h3>
          </div>

          {(candidateEmail || candidatePhone || candidateAddress) && (
            <div className="bg-pink-50 rounded-lg p-3 mb-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                {candidateEmail && (
                  <div>
                    <p className="font-semibold text-gray-600 mb-0.5">Email:</p>
                    <p className="text-gray-500 text-xs">{candidateEmail}</p>
                  </div>
                )}
                {candidatePhone && (
                  <div>
                    <p className="font-semibold text-gray-600 mb-0.5">
                      Phone:
                    </p>
                    <p className="text-gray-500 text-xs">{candidatePhone}</p>
                  </div>
                )}
                {candidateAddress && (
                  <div className="col-span-2">
                    <p className="font-semibold text-gray-600 mb-0.5">
                      Address:
                    </p>
                    <p className="text-gray-500 text-xs">
                      {candidateAddress || 'No address'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2 text-xs leading-relaxed">
            <div>
              <p className="font-semibold text-gray-800 mb-1">
                Application Reason:
              </p>
              <div 
                className="bg-gray-50 rounded-lg p-2 text-gray-700 text-xs whitespace-pre-wrap [word-break:break-word]"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(applicationReason || 'No application reason') }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-4 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReasonApplyModal;
