import { useState, useEffect } from 'react';
import { X, Calendar, Upload, AlertCircle } from 'lucide-react';
import { STATUS_CONFIG } from '../constants';
import type { ProcessStatus } from '../types';
import { RichTextEditor } from '../../../components/RichTextEditor';

interface ProcessStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    note: string;
    brief: string;
    interviewDate?: string;
    interviewTime?: string;
    onboardingDate?: string;
    file?: File;
  }) => Promise<void>;
  newStatus: ProcessStatus;
  candidateName: string;
  positionTitle: string;
  clientPortalUserCount?: number;
  candidateEvaluationFilePath?: string;
  currentBrief?: string;
}

const getAutoNote = (status: string, candidateName: string, positionTitle: string): string => {
  if (status === 'REVIEW_CV_BY_TDC') {
    return `<p>Hello,</p><p>Thank you for submitting a CV for this position. The candidate's profile has been evaluated by TD Consulting and we are currently in the process of contacting them for an interview. Please notify the candidate to check their Zalo messages or phone within the next 24 hours as the admin will send an interview schedule or request additional information. Thank you for your cooperation with TD Consulting!</p>`;
  }
  if (status === 'REJECT_BY_ADMIN') {
    return `<p>Hello,</p><p>TD Consulting has reviewed this CV.</p><p>Currently, this CV is not suitable for the job requirements because:<br>   - Reason: </p><p>Please refer to the main criteria of the job below so that the next CVs can have a higher suitability rate:<br>   - [Mandatory criterion 1]<br>   - [Mandatory criterion 2]</p><p>Thank you for accompanying TD Consulting, hope to continue receiving suitable CVs from you in the future.</p>`;
  }
  if (status === 'REJECTED_BY_CLIENT') {
    return `<p>Hello,</p><p>The client has reviewed the profile you sent. However, this CV is currently not suitable for the recruitment requirements at this time. Reason:</p><p>We hope you continue to support sending other more suitable candidates so we can soon find a profile that meets the needs.</p><p>Thank you for accompanying and cooperating with TD Consulting. Hope to continue receiving many quality CVs from you! 👍</p>`;
  }
  if (status === 'PROCESS_ON_HOLD') {
    return `<p>Hello,</p><p>TD Consulting update: CV of ${candidateName} applying for ${positionTitle} position will be temporarily pending.</p><p>Because currently, TD Consulting is receiving a fairly large number of CVs for this position, including some profiles with higher suitability and competitiveness than your candidate.</p><p>Therefore, the CV of ${candidateName} will be kept for tracking and consideration in case of changes from the client.</p><p>Please continue to monitor the profile status on the Apex system. At the same time, TD Consulting hopes to continue receiving more CVs for other open jobs.</p><p>Thank you for accompanying TD Consulting.</p>`;
  }
  if (status === 'CV_SUBMITTED_TO_CLIENT') {
    return `<p>Hello,</p><p>TD Consulting has reviewed the CV and evaluated it as suitable for the job requirements.</p><p>TD Consulting will proceed to:<br>   - Send the CV to the client for review<br>   - Update you as soon as there is the next response (expected time is from 1-3 working days)</p><p>Please track the candidate's CV process status on the Apex system.</p><p>Thank you for accompanying TD Consulting, hope to continue receiving suitable CVs from you in the future.</p>`;
  }
  if (status?.startsWith('INTERVIEW_SCHEDULED_') || status?.startsWith('INTERVIEW_COMPLETED_')) {
    return `<p>Hello,</p><p>TD Consulting update: CV of ${candidateName} applying for ${positionTitle} position has been selected by the client for the interview round.</p><p>TD Consulting will directly:<br>   - Contact & arrange interview schedule with the candidate<br>   - Follow the candidate throughout the interview process</p><p>TDC will continue to update the candidate's process status on the Apex system, please monitor the system to grasp the results.</p><p>Thank you for accompanying TD Consulting, hope to continue receiving suitable CVs from you in the future.</p>`;
  }
  if (status === 'OFFER_EXTENDED' || status === 'OFFER_ACCEPTED_BY_CANDIDATE') {
    return `<p>Hello,</p><p>TD Consulting update: Candidate ${candidateName} for the ${positionTitle} position has passed the interview and is being offered by the client.</p><p>TD Consulting will directly:<br>   - Work with the client regarding the offer<br>   - Discuss, consult and negotiate the offer with the candidate</p><p>TDC will continue to update the candidate's process status on the Apex system, please monitor the system to get the information.</p><p>Thank you for accompanying TD Consulting. Hope to continue receiving more quality CVs from you in the near future to increase offer & commission opportunities.</p>`;
  }
  if (status === 'ONBOARDING') {
    return `<p>Hello,</p><p>TD Consulting update: Candidate ${candidateName} for the ${positionTitle} position has accepted the offer and is expected to onboard on [Time].</p><p>TD Consulting acknowledges and thanks you for sending a suitable CV, contributing to this recruitment result.</p><p>Commission information for the above profile will be updated in detail on the Apex system according to the cooperation policy. TDC team will proactively contact you if more relevant information is needed.</p><p>Currently, TD Consulting is opening many new recruitment positions. We hope to continue receiving quality CVs from you to jointly create many more successful onboard cases in the near future.</p><p>Thank you for accompanying TD Consulting 💙</p>`;
  }
  return '';
};

export function ProcessStatusModal({
  isOpen,
  onClose,
  onConfirm,
  newStatus,
  candidateName,
  positionTitle,
  clientPortalUserCount = 0,
  candidateEvaluationFilePath,
  currentBrief = '',
}: ProcessStatusModalProps) {
  const [note, setNote] = useState(() => getAutoNote(newStatus, candidateName, positionTitle) || '');
  const [brief, setBrief] = useState(currentBrief);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [onboardingDate, setOnboardingDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useExistingFile, setUseExistingFile] = useState(!!candidateEvaluationFilePath);
  const [showUpload, setShowUpload] = useState(!candidateEvaluationFilePath);

  // Status checks
  const isInterviewScheduled = newStatus?.startsWith('INTERVIEW_SCHEDULED');
  const isOnboarding = newStatus === 'ONBOARDING';
  const isCvSubmitted = newStatus === 'CV_SUBMITTED_TO_CLIENT';
  const isInternalStatus = ['APPLIED', 'REVIEW_CV_BY_TDC', 'REJECT_BY_ADMIN'].includes(newStatus);

  // Validation rules
  // If we utilize existing file, we don't need new file.
  // If we don't have existing file, OR we choose to upload new, and client user count > 0, then file is required.
  // Exception: If we have existing file and keep "useExistingFile" true, file is NOT required.
  const isFileRequired = isCvSubmitted && clientPortalUserCount > 0 && (!useExistingFile || !candidateEvaluationFilePath);

  useEffect(() => {
    if (isOpen) {
      setNote(getAutoNote(newStatus, candidateName, positionTitle) || '');
      setBrief(currentBrief || '');
      setInterviewDate('');
      setInterviewTime('');
      setOnboardingDate('');
      setFile(null);
      // Reset to default state based on availability
      const hasExisting = !!candidateEvaluationFilePath;
      setUseExistingFile(hasExisting);
      setShowUpload(!hasExisting);
    }
  }, [isOpen, newStatus, candidateName, positionTitle, candidateEvaluationFilePath, currentBrief]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    if (!isInternalStatus && !brief.trim()) return;
    if (isInterviewScheduled && (!interviewDate || !interviewTime)) return;
    if (isOnboarding && !onboardingDate) return;
    if (isFileRequired && !file) return;

    setIsSubmitting(true);
    try {
      await onConfirm({
        note: note.trim(),
        brief: brief.trim(),
        interviewDate: isInterviewScheduled ? interviewDate : undefined,
        interviewTime: isInterviewScheduled ? interviewTime : undefined,
        onboardingDate: isOnboarding ? onboardingDate : undefined,
        file: file || undefined,
      });
      onClose();
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleToggleUpload = () => {
      setShowUpload(true);
      setUseExistingFile(false);
      setFile(null);
  };

  const handleUseExisting = () => {
      setShowUpload(false);
      setUseExistingFile(true);
      setFile(null);
  };

  if (!isOpen) return null;

  const statusConfig = STATUS_CONFIG[newStatus];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="font-semibold text-gray-900">Process Note & Status</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {candidateName} - <span className="text-brand-600 font-medium">{positionTitle}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Process Status
            </label>
            <div className={`
              w-full px-3 py-2 rounded-lg border text-sm font-medium flex items-center gap-2
              ${statusConfig?.columnBg || 'bg-gray-50'} 
              ${statusConfig?.border || 'border-gray-200'}
              ${statusConfig?.text || 'text-gray-700'}
            `}>
              {statusConfig?.icon && <statusConfig.icon size={16} />}
              {statusConfig?.displayName || newStatus}
            </div>
          </div>

          {/* CV Submission Fields */}
          {isCvSubmitted && (
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 mb-3">
                <Upload className="w-4 h-4 text-orange-600" />
                <label className="block text-sm font-medium text-gray-700">
                  CV đã che thông tin {isFileRequired && <span className="text-red-500">*</span>}
                </label>
              </div>
              
              {isFileRequired && (
                <div className="flex items-start gap-2 mb-3 text-xs text-orange-800 bg-orange-100/50 p-2 rounded">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  <p>This Client has a Portal account. Masked CV is REQUIRED.</p>
                </div>
              )}

              {/* Existing File Option */}
              {candidateEvaluationFilePath && !showUpload && (
                  <div className="bg-white p-3 rounded border border-orange-200 mb-3">
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                              <span className="font-medium text-brand-600">Masked CV file exists</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <a 
                                href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/evaluation-files/${candidateEvaluationFilePath}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-xs text-blue-600 hover:underline"
                            >
                                View file
                            </a>
                            <span className="text-gray-300">|</span>
                            <button 
                                type="button"
                                onClick={handleToggleUpload}
                                className="text-xs text-red-600 hover:underline"
                            >
                                Change
                            </button>
                          </div>
                      </div>
                  </div>
              )}

              {showUpload && (
                  <label className={`cursor-pointer mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${file ? 'border-brand-300 bg-brand-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}>
                    <div className="space-y-1 text-center">
                      <input name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.doc,.docx" />
                      {file ? (
                        <div className="text-sm text-gray-900" onClick={(e) => e.preventDefault()}> 
                          {/* Prevent opening file dialog when clicking file info, or let it open? User said "click frame to upload". 
                              But "Remove" button needs to work. */}
                          <p className="font-medium text-brand-600">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          <button 
                            type="button" 
                            onClick={(e) => {
                                e.preventDefault(); // Prevent label click
                                setFile(null);
                            }}
                            className="text-xs text-red-500 hover:text-red-700 mt-2 underline z-10 relative"
                          >
                            Remove file
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="text-sm text-gray-600">
                             <span className="font-medium text-brand-600">Click to upload</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            DOC, DOCX, PDF (max 10MB)
                          </p>
                        </>
                      )}
                    </div>
                  </label>
              )}
              
              {showUpload && candidateEvaluationFilePath && (
                   <div className="text-right mt-2">
                       <button type="button" onClick={handleUseExisting} className="text-xs text-brand-600 hover:underline">
                           Cancel change (Use old file)
                       </button>
                   </div>
              )}
            </div>
          )}

          {/* Interview Schedule Fields */}
          {isInterviewScheduled && (
            <div className="bg-pink-50 rounded-lg p-4 border border-pink-200 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-pink-600" />
                <label className="block text-sm font-medium text-gray-700">
                  Interview Schedule
                </label>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="interviewDate" className="block text-xs text-gray-600 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="interviewDate"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
                    required={isInterviewScheduled}
                  />
                </div>
                <div>
                  <label htmlFor="interviewTime" className="block text-xs text-gray-600 mb-1">
                    Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    id="interviewTime"
                    value={interviewTime}
                    onChange={(e) => setInterviewTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
                    required={isInterviewScheduled}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Onboarding Date Field */}
          {isOnboarding && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-blue-600" />
                <label htmlFor="onboardingDate" className="block text-sm font-medium text-gray-700">
                  Onboarding Date <span className="text-red-500">*</span>
                </label>
              </div>
              <input
                type="date"
                id="onboardingDate"
                value={onboardingDate}
                onChange={(e) => setOnboardingDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                required={isOnboarding}
              />
            </div>
          )}

          {!isInternalStatus && (
            <div className="bg-blue-50/80 rounded-xl p-4 border border-blue-200 shadow-sm transition-all hover:shadow-md">
              <label htmlFor="process-brief" className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 bg-blue-600 text-white rounded-full text-[10px]">1</span>
                CANDIDATE BRIEF (Tóm tắt ứng viên) <span className="text-red-500">*</span>
              </label>
              <div className="bg-white p-3 rounded-lg border border-blue-100 mb-3 text-[13px] text-blue-800 leading-relaxed shadow-inner">
                 <p className="font-semibold flex items-center gap-1.5 mb-1.5 text-blue-700">
                    <AlertCircle size={14} /> 
                    QUAN TRỌNG:
                 </p>
                 <ul className="list-disc pl-4 space-y-1">
                    <li>Summarize the candidate's special strengths, experience, and outstanding skills.</li>
                    <li><span className="font-bold underline text-blue-900">REQUIRED:</span> This content will be <span className="font-bold">SEEN DIRECTLY BY THE CLIENT</span> on the Portal for quick candidate assessment.</li>
                 </ul>
              </div>
              <div className="relative bg-white rounded-lg border border-blue-200 focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden min-h-[180px]">
                <RichTextEditor
                  value={brief}
                  onChange={setBrief}
                  placeholder="Enter detailed candidate summary (HTML allowed)..."
                />
              </div>
            </div>
          )}

          <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-200">
            <label htmlFor="process-note" className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 bg-gray-500 text-white rounded-full text-[10px]">2</span>
              PROCESS NOTE (Note về trạng thái quy trình) <span className="text-red-500">*</span>
            </label>
            <div className="bg-white rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-brand-500 overflow-hidden min-h-[140px]">
              <RichTextEditor
                value={note}
                onChange={setNote}
                placeholder="Detailed notes for this status change (Internal)..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !note.trim() || (!isInternalStatus && !brief.trim()) || (isFileRequired && !file) || (isInterviewScheduled && (!interviewDate || !interviewTime)) || (isOnboarding && !onboardingDate)}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Updating...
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
