import { Target, Share2, Briefcase, Link as LinkIcon } from 'lucide-react';

// Reuse BD constants if available, else define here for clients feature
export const BD_STATUS_OPTIONS = [
  'Research', 'Addfriend/Connect', 'Approach',
  'Follow up', 'Consulting', 'Demo contract', 'Working', 'Pending',
  'Signing', 'Meeting Clear JD', 'Hunting', 'Hiring',
  'Signed', 'Take care',
  'No current need', 'Excluded', 'Closed', 'Reject'
];

interface BDInfoSectionProps {
  bdData: {
    status: string;
    source: string;
    potential_job_title: string;
    potential_job_link: string;
    priority: string;
    memo: string;
  };
  onChange: (field: string, value: string) => void;
  isViewMode: boolean;
}

export const BDInfoSection = ({ bdData, onChange, isViewMode }: BDInfoSectionProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-100 bg-pink-50/30 flex items-center gap-2 rounded-t-xl">
        <Target className="w-5 h-5 text-pink-600" />
        <h2 className="font-semibold text-gray-900">BD Process Information</h2>
      </div>
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">BD Status</label>
          <select
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white disabled:bg-gray-50 text-sm"
            value={bdData.status}
            onChange={(e) => onChange('status', e.target.value)}
            disabled={isViewMode}
          >
            {BD_STATUS_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Priority</label>
          <select
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white disabled:bg-gray-50 text-sm font-medium"
            value={bdData.priority}
            onChange={(e) => onChange('priority', e.target.value)}
            disabled={isViewMode}
          >
            <option value="Normal">Normal</option>
            <option value="High Priority">High Priority</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Client Source</label>
          <div className="relative">
            <Share2 className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <select
              value={bdData.source}
              onChange={(e) => onChange('source', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 text-sm disabled:bg-gray-50 font-medium appearance-none bg-white"
              disabled={isViewMode}
            >
              <option value="">Select source</option>
              {['Facebook', 'Linkedin', 'Thread', 'Job Portal', 'Referral', 'Other'].map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
           {/* Placeholder để giữ grid cân đối hoặc có thể thêm trường khác */}
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-gray-700">Potential Job Title</label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              value={bdData.potential_job_title}
              onChange={(e) => onChange('potential_job_title', e.target.value)}
              placeholder="E.g.: Senior React Developer..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 text-sm disabled:bg-gray-50 font-medium"
              disabled={isViewMode}
            />
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-gray-700">Potential Job Link</label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              value={bdData.potential_job_link}
              onChange={(e) => onChange('potential_job_link', e.target.value)}
              placeholder="https://linkedin.com/jobs/..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 text-sm disabled:bg-gray-50 font-medium"
              disabled={isViewMode}
            />
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-gray-700">BD Notes</label>
          <textarea
            rows={2}
            value={bdData.memo}
            onChange={(e) => onChange('memo', e.target.value)}
            placeholder="Notes about this client..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 text-sm disabled:bg-gray-50 font-medium resize-none"
            disabled={isViewMode}
          />
        </div>
      </div>
    </div>
  );
};
