// @ts-nocheck
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Process, ProcessStatus } from '../types';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { Eye, FileText, History, MessageCircle, Trash2, Calendar, MessageSquareText } from 'lucide-react';
import { ReasonApplyModal } from '../../jobs/components/ReasonApplyModal';
import { FreelancerDetailsModal } from './FreelancerDetailsModal';
import { updateProcess, deleteProcess } from '../api';
import toast from 'react-hot-toast';
import { StatusSelect } from './StatusSelect';
import { LoadMoreButton } from '../../../components/LoadMoreButton';
import { ProcessStatusModal } from './ProcessStatusModal';
import { ProcessHistoryModal } from './ProcessHistoryModal';
import { ProcessCommentModal } from './ProcessCommentModal';
import { ClientEventsModal } from './ClientEventsModal';
import { useAuthStore } from '../../auth/store';
import { useNavigate } from 'react-router-dom';
import { CandidateBriefModal } from './CandidateBriefModal';
import { HasPermission } from '../../auth/components/HasPermission';
import { PERMISSIONS } from '../../auth/constants';



interface ProcessListProps {
  data: Process[];
  loading: boolean;
  loadingMore?: boolean;
  hasMore: boolean;
  loadMore: () => void;
  totalCount?: number | null;
  refetchData?: () => void;
}

const ROLE_STYLES: Record<string, string> = {
  'Admin': 'text-red-600 font-bold',
  'BD': 'text-emerald-500 font-semibold',
  'Headhunter': 'text-green-600 font-semibold',
  'HR': 'text-purple-600 font-semibold',
  'CTV': 'text-orange-600 font-semibold',
  'Freelancer': 'text-blue-600 font-semibold',
};

export function ProcessList({ data, loading, loadingMore, hasMore, loadMore, totalCount, refetchData }: ProcessListProps) {
  const [selectedProcessForReason, setSelectedProcessForReason] = useState<Process | null>(null);
  const [selectedProcessForBrief, setSelectedProcessForBrief] = useState<Process | null>(null);
  const [selectedFreelancerId, setSelectedFreelancerId] = useState<string | null>(null);
  const [updatingProcessId, setUpdatingProcessId] = useState<string | null>(null);
  const [historyModalProcessId, setHistoryModalProcessId] = useState<string | null>(null);
  const [commentModalProcessId, setCommentModalProcessId] = useState<string | null>(null);
  const [eventsModalData, setEventsModalData] = useState<{
    clientId: string;
    clientName?: string;
    jobId?: string;
    jobTitle?: string;
  } | null>(null);
  const [deleteConfirmProcessId, setDeleteConfirmProcessId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [signingCvId, setSigningCvId] = useState<string | null>(null);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [statusModalData, setStatusModalData] = useState<{
    processId: string;
    newStatus: ProcessStatus;
    candidateName: string;
    positionTitle: string;
    clientPortalUserCount?: number;
    candidateEvaluationFilePath?: string;
    currentBrief?: string;
  } | null>(null);

  const handleStatusChange = (process: Process, newStatus: ProcessStatus) => {
    // Open modal instead of updating directly
    setStatusModalData({
      processId: process.id,
      newStatus,
      candidateName: process.candidate?.name || 'Candidate',
      positionTitle: process.job?.position_title || 'Job',
      clientPortalUserCount: process.client_portal_user_count,
      candidateEvaluationFilePath: process.candidate?.evaluation_file_path || undefined,
      currentBrief: process.evaluation_brief || '',
    });
  };

  const handleConfirmStatusChange = async ({
    note,
    brief,
    interviewDate,
    interviewTime,
    onboardingDate,
    file
  }: {
    note: string;
    brief: string;
    interviewDate?: string;
    interviewTime?: string;
    onboardingDate?: string;
    file?: File;
  }) => {
    if (!statusModalData) return;

    const { processId, newStatus, candidateName, positionTitle } = statusModalData;
    // Helper to find process
    const process = data.find(p => p.id === processId);
    if (!process) return;

    setUpdatingProcessId(processId);

    try {
      // 1. Upload File if present
      let evaluationFilePath = process.evaluation_file_path; // Default to current process path

      // If we have a file, upload it and update CANDIDATE + PROCESS
      if (file) {
        const fileExt = file.name.split('.').pop();
        const timestamp = Date.now();
        const fileName = `${process.candidate_id}-${timestamp}.${fileExt}`;
        const filePath = `${fileName}`;

        const supabase = (await import('../../../lib/supabase')).supabase;
        const { error: uploadError } = await supabase.storage
          .from('evaluation-files')
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        evaluationFilePath = filePath;

        // Update Candidate Record (So it's available for future jobs)
        await supabase
          .from('candidates')
          .update({ evaluation_file_path: filePath, updated_at: new Date().toISOString() })
          .eq('id', process.candidate_id);
      }
      // If no file uploaded, but candidate has one (passed from logic or query), and status is CV_SUBMITTED
      else if (newStatus === 'CV_SUBMITTED_TO_CLIENT' && process.candidate?.evaluation_file_path) {
        // Use the existing candidate file path
        evaluationFilePath = process.candidate.evaluation_file_path;
      }

      // 2. Create interview event if scheduled
      if (interviewDate && interviewTime) {
        try {
          const startDateTime = new Date(`${interviewDate}T${interviewTime}`);
          const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // +1 hour

          let roundType = '1ST';
          if (newStatus.includes('2ND')) roundType = '2ND';
          else if (newStatus.includes('FINAL')) roundType = 'FINAL';
          else if (newStatus.includes('4TH')) roundType = '4TH';

          await import('../api').then(mod => mod.createInterviewEvent({
            processId,
            title: `Phỏng vấn Vòng ${roundType}: ${candidateName} - ${positionTitle}`,
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
            description: note,
            jobId: process?.job?.id,
            clientId: process?.client?.id,
            level: roundType
          }));

          toast.success('Interview event created');
        } catch (err) {
          console.error('Failed to create interview event:', err);
          toast.error('Failed to create interview event, but updating status...');
        }
      }

      // 3. Update Process
      let displayNote = note;
      if (interviewDate && interviewTime) {
        let roundType = '1ST';
        if (newStatus.includes('2ND')) roundType = '2ND';
        else if (newStatus.includes('FINAL')) roundType = 'FINAL';
        else if (newStatus.includes('4TH')) roundType = '4TH';

        const formattedDate = new Date(interviewDate).toLocaleDateString('vi-VN', { 
           day: '2-digit', month: '2-digit', year: 'numeric' 
        });
        
        displayNote = `<p><strong>Lịch phỏng vấn Vòng ${roundType}:</strong> ${formattedDate} lúc ${interviewTime}</p><hr/>${note}`;
      }

      const updates: any = {
        process_status: newStatus,
        process_note: displayNote,
        evaluation_brief: brief,
        status_update_date: new Date().toISOString(),
      };

      if (onboardingDate) {
        updates.onboarding_date = onboardingDate;
      }

      // Always update evaluation_file_path if we determined one (either new upload or existing candidate file)
      // This ensures the process record reflects the correct file snapshot or link
      if (evaluationFilePath) {
        updates.evaluation_file_path = evaluationFilePath;
      }

      await updateProcess(processId, updates);

      // 4. Notification Logic (Only for CV_SUBMITTED_TO_CLIENT)
      if (newStatus === 'CV_SUBMITTED_TO_CLIENT' && process.client_id) {
        const supabase = (await import('../../../lib/supabase')).supabase;

        // Get Client Users
        const { data: clientUsers } = await supabase
          .from('users')
          .select('id, email, full_name')
          .eq('client_id', process.client_id);

        if (clientUsers && clientUsers.length > 0) {
          const notifyToast = toast.loading(`Đang gửi email & thông báo tới ${clientUsers.length} users...`);

          try {
            // Loop through users
            for (const clientUser of clientUsers) {
              // Insert Notification
              await supabase.from('notifications').insert({
                user_id_receiver: clientUser.id,
                title: `Ứng viên mới cho ${positionTitle}`,
                message: `Ứng viên ${candidateName} đã được giới thiệu cho vị trí ${positionTitle}. Vui lòng kiểm tra.`,
                type: 'process_update',
                related_entity_type: 'process',
                related_entity_id: processId,
                created_by_id: user?.id
              });

              // Send Email via Edge Function
              if (clientUser.email) {
                await supabase.functions.invoke('send-process-email', {
                  body: {
                    templateData: {
                      candidateName: candidateName,
                      positionName: positionTitle,
                      recipientEmail: clientUser.email
                    },
                    processId: processId,
                    sentByUserId: user?.id,
                    language: 'vi'
                  }
                });
              }
            }
            toast.success(`Đã gửi email & thông báo thành công tới ${clientUsers.length} người dùng`, { id: notifyToast });
          } catch (notifyError) {
            console.error('Notification error:', notifyError);
            toast.error('Gửi email & thông báo thất bại', { id: notifyToast });
          }
        }
      }

      // Final success message for the whole operation if not covered by partials, 
      // but if we have the notify toast, maybe just general update success is enough or duplicate?
      // The user wants to know about the email process specifically.
      if (newStatus !== 'CV_SUBMITTED_TO_CLIENT') {
        toast.success('Status updated successfully');
      }

      if (refetchData) refetchData();
    } catch (error: any) {
      console.error('Failed to update status:', error);
      toast.error(error.message || 'Failed to update status');
    } finally {
      setUpdatingProcessId(null);
      setStatusModalData(null);
    }
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-md border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 bg-white text-xs">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[18%] min-w-[140px]">Candidate</th>
              <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[12%] min-w-[100px]">Owner</th>
              <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[18%] min-w-[140px]">Job</th>
              <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[12%] min-w-[100px]">Client</th>
              <th className="px-2 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[6%] min-w-[50px]">Reason</th>
              <th className="px-2 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[5%] min-w-[40px]">CV</th>
              <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[14%] min-w-[120px]">Status</th>
              <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[8%] min-w-[80px]">Updated</th>
              <th className="px-2 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[7%] min-w-[80px]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="px-3 py-3"><div className="h-4 bg-gray-200 rounded w-28"></div><div className="h-3 bg-gray-100 rounded w-32 mt-1"></div></td>
                <td className="px-3 py-3"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                <td className="px-3 py-3"><div className="h-4 bg-gray-200 rounded w-28"></div></td>
                <td className="px-3 py-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                <td className="px-2 py-3 text-center"><div className="h-5 w-5 bg-gray-200 rounded mx-auto"></div></td>
                <td className="px-2 py-3 text-center"><div className="h-5 w-5 bg-gray-200 rounded mx-auto"></div></td>
                <td className="px-3 py-3"><div className="h-5 bg-gray-200 rounded w-24"></div></td>
                <td className="px-3 py-3"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                <td className="px-2 py-3 text-center"><div className="h-5 w-5 bg-gray-200 rounded mx-auto"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Show skeleton during initial load
  if (loading && data.length === 0) {
    return <LoadingSkeleton />;
  }

  if (data.length === 0 && !loading) {
    return <div className="text-center py-10 text-gray-500">No processes found.</div>;
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header/Table-like structure or Card grid */}
        <div className="overflow-x-auto rounded-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 bg-white text-xs">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[18%] min-w-[140px]">Candidate</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[12%] min-w-[100px]">Owner</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[18%] min-w-[140px]">Job</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[12%] min-w-[100px]">Client</th>
                <th className="px-2 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[6%] min-w-[50px]">Reason</th>
                <th className="px-2 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[5%] min-w-[40px]">CV</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[14%] min-w-[120px]">Status</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[8%] min-w-[80px]">Updated</th>
                <th className="px-2 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[7%] min-w-[80px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {data.map((process) => (
                <tr key={process.id} className="hover:bg-gray-50/80 transition-colors duration-150 ease-in-out group">
                  <td className="px-3 py-2.5">
                    <div className="flex flex-col">
                      <Link
                        to={`/candidates/${process.candidate?.id}`}
                        target="_blank"
                        className="text-[13px] font-medium text-gray-900 hover:text-brand-600 hover:underline truncate max-w-[12vw] sm:max-w-[140px] md:max-w-[160px] lg:max-w-[200px]"
                      >
                        {process.candidate?.name || 'N/A'}
                      </Link>
                      <span className="text-[11px] text-gray-500 truncate max-w-[12vw] sm:max-w-[140px] md:max-w-[160px] lg:max-w-[200px]">{process.candidate?.email}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-col justify-center">
                      <button
                        onClick={() => process.owner?.id && setSelectedFreelancerId(process.owner.id)}
                        className="text-left group/owner"
                      >
                        <span className={`text-[13px] group-hover/owner:underline ${process.owner?.role ? ROLE_STYLES[process.owner.role] || 'text-gray-700' : 'text-gray-700'}`}>
                          {process.owner?.full_name || '-'}
                          <span className="font-normal text-[11px] ml-0.5">
                            {process.owner?.role ? `(${process.owner.role})` : ''}
                          </span>
                        </span>
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-col">
                      <Link
                        to={`/jobs/${process.job?.id}`}
                        target="_blank"
                        className="text-[13px] font-semibold text-gray-900 hover:text-brand-600 hover:underline transition-colors truncate max-w-[12vw] sm:max-w-[150px] md:max-w-[180px] lg:max-w-[220px]"
                      >
                        {process.job?.position_title || 'N/A'}
                      </Link>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700">
                          {process.job?.job_id}
                        </span>
                        <button
                          onClick={() => setHistoryModalProcessId(process.id)}
                          className="flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100"
                          title="View History"
                        >
                          <History size={10} />
                          History
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-[13px] text-gray-600 font-medium">
                    <Link
                      to={`/tables/clients/new/${process.client?.id}`}
                      target="_blank"
                      className="hover:text-brand-600 hover:underline truncate block max-w-[8vw] sm:max-w-[100px] md:max-w-[120px]"
                    >
                      {process.client?.client_name || 'N/A'}
                    </Link>
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    {process.application_reason ? (
                      <button
                        onClick={() => setSelectedProcessForReason(process)}
                        className="inline-flex items-center justify-center p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                        title="View Application Reason"
                      >
                        <Eye size={14} />
                      </button>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    {process.candidate?.cv_link ? (
                      <button
                        onClick={async () => {
                          const cvLink = process.candidate?.cv_link;
                          if (!cvLink) return;

                          // Nếu là link cũ (http)
                          if (cvLink.startsWith('http')) {
                            window.open(cvLink, '_blank');
                            return;
                          }

                          try {
                            setSigningCvId(process.id);
                            const supabase = (await import('../../../lib/supabase')).supabase;
                            const { data, error } = await supabase.storage
                              .from('cv')
                              .createSignedUrl(cvLink, 3600);
                            
                            if (error) throw error;
                            if (data?.signedUrl) {
                              window.open(data.signedUrl, '_blank');
                            }
                          } catch (err) {
                            console.error('Error signing CV URL:', err);
                            toast.error('Không có quyền xem CV hoặc file không tồn tại');
                          } finally {
                            setSigningCvId(null);
                          }
                        }}
                        disabled={signingCvId === process.id}
                        className="inline-flex items-center justify-center p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors disabled:opacity-50"
                        title="Mở CV trong tab mới"
                      >
                        {signingCvId === process.id ? (
                          <div className="animate-spin h-3.5 w-3.5 border-2 border-gray-400 border-t-brand-600 rounded-full" />
                        ) : (
                          <FileText size={14} />
                        )}
                      </button>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="relative">
                      <StatusSelect
                        currentStatus={process.process_status}
                        onStatusChange={(newStatus) => handleStatusChange(process, newStatus)}
                        disabled={updatingProcessId === process.id}
                      />
                      {updatingProcessId === process.id && (
                        <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-md z-10">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-brand-600"></div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-gray-500">
                    {process.updated_at ? new Date(process.updated_at).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      {/* Chat */}
                      <button
                        onClick={() => navigate(`/chat?process=${process.id}`)}
                        className="p-1 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
                        title={`Chat về ${process.candidate?.name || 'ứng viên'}`}
                      >
                        <MessageCircle size={14} />
                      </button>

                      {/* Comment */}
                      <button
                        onClick={() => setCommentModalProcessId(process.id)}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors relative"
                        title="Comments"
                      >
                        <MessageSquareText size={14} />
                        {process.unread_comment_count && process.unread_comment_count > 0 ? (
                          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                        ) : null}
                      </button>

                      {/* Schedule - View client events */}
                      <button
                        onClick={() => process.client_id && setEventsModalData({
                          clientId: process.client_id,
                          clientName: process.client?.client_name || undefined,
                          jobId: process.job_id || undefined,
                          jobTitle: process.job?.position_title || undefined
                        })}
                        className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                        title="Xem lịch phỏng vấn"
                      >
                        <Calendar size={14} />
                      </button>

                      {/* Delete */}
                      <HasPermission permission={PERMISSIONS.DELETE_PROCESS}>
                        <button
                          onClick={() => setDeleteConfirmProcessId(process.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Xóa quy trình"
                        >
                          <Trash2 size={14} />
                        </button>
                      </HasPermission>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <LoadMoreButton
          onClick={loadMore}
          loading={loadingMore}
          hasMore={hasMore}
          loadedCount={data.length}
          totalCount={totalCount}
        />
      </div>

      <ReasonApplyModal
        open={!!selectedProcessForReason}
        onClose={() => setSelectedProcessForReason(null)}
        applicationReason={selectedProcessForReason?.application_reason || ''}
        candidateName={selectedProcessForReason?.candidate?.name}
        candidateEmail={selectedProcessForReason?.candidate?.email || ''}
        positionTitle={selectedProcessForReason?.job?.position_title || ''}
      />

      {/* Candidate Brief Modal */}
      <CandidateBriefModal 
        open={!!selectedProcessForBrief}
        onClose={() => setSelectedProcessForBrief(null)}
        candidateName={selectedProcessForBrief?.candidate?.name || ''}
        positionTitle={selectedProcessForBrief?.job?.position_title || ''}
        brief={selectedProcessForBrief?.evaluation_brief || ''}
      />

      {/* Freelancer Details Modal */}
      <FreelancerDetailsModal
        isOpen={!!selectedFreelancerId}
        onClose={() => setSelectedFreelancerId(null)}
        freelancerId={selectedFreelancerId}
      />

      {/* Status Note Modal */}
      {statusModalData && (
        <ProcessStatusModal
          isOpen={!!statusModalData}
          onClose={() => setStatusModalData(null)}
          onConfirm={handleConfirmStatusChange}
          newStatus={statusModalData.newStatus}
          candidateName={statusModalData.candidateName}
          positionTitle={statusModalData.positionTitle}
          clientPortalUserCount={statusModalData.clientPortalUserCount}
          candidateEvaluationFilePath={statusModalData.candidateEvaluationFilePath}
          currentBrief={statusModalData.currentBrief}
        />
      )}

      {/* Comment Modal */}
      {commentModalProcessId && (
        <ProcessCommentModal
          isOpen={!!commentModalProcessId}
          onClose={() => setCommentModalProcessId(null)}
          processId={commentModalProcessId}
          onCommentsRead={() => {
            // Trigger refetch to update unread count immediately
            if (refetchData) refetchData();
          }}
        />
      )}

      {/* Process History Modal */}
      <ProcessHistoryModal
        isOpen={!!historyModalProcessId}
        onClose={() => setHistoryModalProcessId(null)}
        processId={historyModalProcessId || ''}
      />

      {/* Client Events Modal */}
      {eventsModalData && (
        <ClientEventsModal
          isOpen={!!eventsModalData}
          onClose={() => setEventsModalData(null)}
          clientId={eventsModalData.clientId}
          clientName={eventsModalData.clientName}
          jobId={eventsModalData.jobId}
          jobTitle={eventsModalData.jobTitle}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={!!deleteConfirmProcessId}
        onClose={() => setDeleteConfirmProcessId(null)}
        onConfirm={async () => {
          if (!deleteConfirmProcessId) return;
          setIsDeleting(true);
          try {
            await deleteProcess(deleteConfirmProcessId);
            toast.success('Đã xóa quy trình');
            if (refetchData) refetchData();
            setDeleteConfirmProcessId(null);
          } catch (e) {
            console.error(e);
            toast.error('Không thể xóa quy trình');
          } finally {
            setIsDeleting(false);
          }
        }}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa quy trình này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
