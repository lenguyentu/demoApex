import { X, Briefcase, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ClientJob } from '../types';

interface ClientJobsModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: ClientJob[];
  clientName: string;
  loading: boolean;
}

const PHASE_COLORS: Record<string, string> = {
  Open: 'bg-green-100 text-green-700 border-green-200',
  Closed: 'bg-gray-100 text-gray-700 border-gray-200',
  Sourcing: 'bg-blue-100 text-blue-700 border-blue-200',
  Interviewing: 'bg-purple-100 text-purple-700 border-purple-200',
  Offer_Extended: 'bg-amber-100 text-amber-700 border-amber-200',
  Filled: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  On_Hold: 'bg-orange-100 text-orange-700 border-orange-200',
  Cancelled: 'bg-red-100 text-red-700 border-red-200',
};

export const ClientJobsModal = ({ isOpen, onClose, jobs, clientName, loading }: ClientJobsModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      <div className="bg-white rounded-xl overflow-hidden shadow-2xl w-full max-w-2xl z-10 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Briefcase size={20} className="text-brand-600" />
            Jobs tại {clientName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-1 hover:bg-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
          {loading ? (
             <div className="py-12 text-center text-gray-500 flex flex-col items-center gap-2">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                 <span className="text-sm">Đang tải danh sách jobs...</span>
             </div>
          ) : jobs.length === 0 ? (
            <div className="py-12 text-center text-gray-500 italic flex flex-col items-center gap-2">
              <Briefcase className="w-12 h-12 text-gray-300" />
              Khách hàng này chưa có Job nào.
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors group">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900 group-hover:text-brand-600 transition-colors">
                        {job.position_title}
                      </h4>
                      <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                        <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{job.job_id}</code>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${PHASE_COLORS[job.phase as string] || 'bg-gray-100'}`}>
                      {job.phase?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  
                  <div className="mt-3 flex justify-end">
                    <Link 
                      to={`/jobs/${job.id}`}
                      className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                    >
                      Xem chi tiết <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end shrink-0 border-t">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
