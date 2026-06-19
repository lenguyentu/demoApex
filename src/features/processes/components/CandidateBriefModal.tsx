import { X, User } from 'lucide-react';

interface CandidateBriefModalProps {
  open: boolean;
  onClose: () => void;
  candidateName: string;
  positionTitle: string;
  brief: string;
}

export const CandidateBriefModal = ({
  open,
  onClose,
  candidateName,
  positionTitle,
  brief,
}: CandidateBriefModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative bg-white rounded-xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-linear-to-r from-blue-600 to-indigo-600 px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
             <div className="bg-white/20 p-2 rounded-lg">
                <User className="w-5 h-5 text-white" />
             </div>
             <div>
                <h2 className="text-lg font-bold text-white leading-tight">Candidate Brief</h2>
                <p className="text-blue-100 text-xs mt-0.5 font-medium">Professional Summary</p>
             </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:bg-white/20 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
           <div className="mb-4 pb-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">{candidateName}</h3>
                <p className="text-xs text-brand-600 font-medium mt-0.5">{positionTitle}</p>
           </div>

           <div className="space-y-3">
               <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Professional Summary</h4>
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-100 text-justify">
                      {brief || "No brief available."}
                  </div>
               </div>
           </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-5 py-3 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
