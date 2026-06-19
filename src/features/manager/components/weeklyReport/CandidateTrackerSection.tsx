import { Users, Calendar, AlertCircle } from 'lucide-react';
import { useWeeklyActiveProcesses } from '../../../processes/hooks';

interface Props {
  userId?: string;
  weekStart?: string;
  candidateTracker: Record<string, { next_step?: string; deadline?: string; risk_note?: string }>;
  setCandidateTracker: (val: any) => void;
  parentLoading?: boolean; // NEW: để parent control loading state
}

// Helper types for the process data structure
type CandidateData = { id: string; name: string } | { id: string; name: string }[];
type ClientData = { id: string; client_name: string } | { id: string; client_name: string }[];
type JobData = { 
  id: string; 
  job_id: string; 
  position_title: string; 
  clients: ClientData;
} | { 
  id: string; 
  job_id: string; 
  position_title: string; 
  clients: ClientData;
}[];

export default function CandidateTrackerSection({ userId, weekStart, candidateTracker, setCandidateTracker, parentLoading }: Props) {
  const { data: processes = [], isLoading } = useWeeklyActiveProcesses(userId, weekStart);

  // Nếu parent đang loading, không cần show loading riêng
  const showLoading = !parentLoading && isLoading;

  const updateTracker = (processId: string, field: string, value: string) => {
    setCandidateTracker({
      ...candidateTracker,
      [processId]: {
        ...(candidateTracker[processId] || {}),
        [field]: value,
      },
    });
  };

  // Helper functions to safely extract data
  const getCandidateName = (candidate: CandidateData | null | undefined): string => {
    if (!candidate) return 'N/A';
    if (Array.isArray(candidate)) return candidate[0]?.name || 'N/A';
    return candidate.name || 'N/A';
  };

  const getJobTitle = (job: JobData | null | undefined): string => {
    if (!job) return 'N/A';
    if (Array.isArray(job)) return job[0]?.position_title || 'N/A';
    return job.position_title || 'N/A';
  };

  const getClientName = (job: JobData | null | undefined): string => {
    if (!job) return 'N/A';
    
    let clients: ClientData | undefined;
    if (Array.isArray(job)) {
      clients = job[0]?.clients;
    } else {
      clients = job.clients;
    }
    
    if (!clients) return 'N/A';
    if (Array.isArray(clients)) return clients[0]?.client_name || 'N/A';
    return clients.client_name || 'N/A';
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'CV_SUBMITTED_TO_CLIENT': 'CV gửi KH',
      'INTERVIEW_SCHEDULED_1ST': 'Hẹn PV 1',
      'INTERVIEW_COMPLETED_1ST': 'PV 1',
      'INTERVIEW_SCHEDULED_2ND': 'Hẹn PV 2',
      'INTERVIEW_COMPLETED_2ND': 'PV 2',
      'INTERVIEW_SCHEDULED_FINAL': 'Hẹn PV cuối',
      'INTERVIEW_COMPLETED_FINAL': 'PV cuối',
      'OFFER_EXTENDED': 'Offer',
      'OFFER_ACCEPTED_BY_CANDIDATE': 'Chấp nhận offer',
      'ONBOARDING': 'Onboarding',
    };
    return statusMap[status] || status.replace(/_/g, ' ');
  };

  const getStatusColor = (status: string) => {
    if (status.includes('ONBOARDING') || status.includes('OFFER_ACCEPTED')) return 'bg-green-100 text-green-700';
    if (status.includes('OFFER')) return 'bg-purple-100 text-purple-700';
    if (status.includes('INTERVIEW_COMPLETED')) return 'bg-blue-100 text-blue-700';
    if (status.includes('INTERVIEW_SCHEDULED')) return 'bg-orange-100 text-orange-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-gradient-to-r from-green-50 to-teal-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Users size={18} className="text-green-600" />
              3. Candidate Tracker
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {processes.length} ứng viên active
            </p>
          </div>
        </div>
      </div>
      <div className="p-4">
        {showLoading ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : processes.length === 0 ? (
          <div className="py-8 text-center">
            <Users size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-xs text-gray-400">Không có ứng viên active trong tuần này</p>
          </div>
        ) : (
          <div className="space-y-3">
            {processes.map((process) => {
              const createdDate = process.created_at.split('T')[0];
              const updatedDate = (process.updated_at || process.created_at).split('T')[0];
              const weekStartDate = new Date(weekStart!).toISOString().split('T')[0];
              const weekEndDate = new Date(new Date(weekStart!).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
              
              const isNewlyCreated = createdDate >= weekStartDate && createdDate < weekEndDate;
              const isUpdatedOnly = createdDate < weekStartDate && updatedDate >= weekStartDate && updatedDate < weekEndDate;

              const tracker = candidateTracker[process.id] || {};

              return (
                <div key={process.id} className="group border border-gray-200 rounded-lg hover:border-green-400 hover:shadow-sm transition-all">
                  {/* Header */}
                  <div className="p-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900 text-sm truncate">
                            {getCandidateName(process.candidate as CandidateData)}
                          </h3>
                          {isNewlyCreated && (
                            <span className="flex-shrink-0 px-2 py-0.5 rounded text-xs font-bold bg-blue-500 text-white">MỚI</span>
                          )}
                          {isUpdatedOnly && (
                            <span className="flex-shrink-0 px-2 py-0.5 rounded text-xs font-bold bg-orange-500 text-white">CẬP NHẬT</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span className="truncate">
                            {getJobTitle(process.job as JobData)}
                          </span>
                          <span className="text-gray-400">·</span>
                          <span className="truncate">
                            {getClientName(process.job as JobData)}
                          </span>
                        </div>
                      </div>
                      <span className={`flex-shrink-0 ml-2 px-2 py-1 rounded text-xs font-semibold ${getStatusColor(process.process_status || '')}`}>
                        {getStatusLabel(process.process_status || '')}
                      </span>
                    </div>
                  </div>

                  {/* Editable Fields */}
                  <div className="p-3 space-y-2">
                    <div>
                      <label className="flex items-center gap-1 text-xs font-bold text-gray-700 mb-1">
                        <Calendar size={12} />
                        Next Step
                      </label>
                      <input
                        type="text"
                        value={tracker.next_step || ''}
                        onChange={(e) => updateTracker(process.id, 'next_step', e.target.value)}
                        placeholder="Nhập next step..."
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Deadline</label>
                        <input
                          type="date"
                          value={tracker.deadline || ''}
                          onChange={(e) => updateTracker(process.id, 'deadline', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-1 text-xs font-bold text-gray-700 mb-1">
                          <AlertCircle size={12} />
                          Risk/Note
                        </label>
                        <input
                          type="text"
                          value={tracker.risk_note || ''}
                          onChange={(e) => updateTracker(process.id, 'risk_note', e.target.value)}
                          placeholder="Risk..."
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
