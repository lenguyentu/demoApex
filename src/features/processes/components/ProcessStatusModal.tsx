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
    return `<p>Chào bạn</p><p>Cảm ơn bạn đã gửi CV cho vị trí tuyển dụng. Hồ sơ của ứng viên đã được TD Consulting đánh giá và hiện đang trong quá trình liên hệ để phỏng vấn. Vui lòng thông báo cho ứng viên check tin nhắn Zalo hoặc điện thoại liên hệ trong vòng 24h tiếp theo vì admin sẽ gửi lịch phỏng vấn hoặc yêu cầu bổ sung thông tin.Cảm ơn sự hợp tác của bạn với TD Consulting!</p>`;
  }
  if (status === 'REJECT_BY_ADMIN') {
    return `<p>Chào bạn,</p><p>TD Consulting đã review CV này.</p><p>Hiện CV này chưa phù hợp với yêu cầu của job vì:<br>   - Lý do: </p><p>Bạn vui lòng tham khảo lại các tiêu chí chính của job dưới đây để các CV tiếp theo đạt tỷ lệ phù hợp cao hơn:<br>   - [Tiêu chí bắt buộc 1]<br>   - [Tiêu chí bắt buộc 2]</p><p>Cảm ơn bạn đã đồng hành cùng TD Consulting, mong tiếp tục nhận được các CV phù hợp từ bạn trong thời gian tới.</p>`;
  }
  if (status === 'REJECTED_BY_CLIENT') {
    return `<p>Chào bạn,</p><p>Khách hàng đã review hồ sơ bạn gửi. Tuy nhiên, CV này hiện chưa phù hợp với yêu cầu tuyển dụng ở thời điểm này. Lý do:</p><p>Rất mong bạn tiếp tục hỗ trợ gửi thêm các ứng viên khác phù hợp hơn để chúng ta có thể sớm tìm được profile đáp ứng nhu cầu.</p><p>Cảm ơn bạn đã đồng hành và hợp tác cùng TD Consulting. Mong sẽ tiếp tục nhận được nhiều CV chất lượng từ bạn! 👍</p>`;
  }
  if (status === 'PROCESS_ON_HOLD') {
    return `<p>Chào bạn,</p><p>TD Consulting cập nhật: CV ${candidateName} apply vị trí ${positionTitle} hiện sẽ tạm thời pending.</p><p>Do ở thời điểm hiện tại, TD Consulting đang nhận được số lượng CV khá lớn cho vị trí này, trong đó có một số hồ sơ có mức độ phù hợp và tính cạnh tranh cao hơn so với ứng viên của bạn.</p><p>Vì vậy, CV của ${candidateName} sẽ được lưu lại để theo dõi và xem xét trong trường hợp có sự thay đổi từ phía khách hàng.</p><p>Bạn vui lòng tiếp tục theo dõi trạng thái hồ sơ trên hệ thống Apex. Đồng thời, TD Consulting rất mong tiếp tục nhận được thêm các CV cho các job khác đang mở.</p><p>Cảm ơn bạn đã đồng hành cùng TD Consulting.</p>`;
  }
  if (status === 'CV_SUBMITTED_TO_CLIENT') {
    return `<p>Chào bạn,</p><p>TD Consulting đã review CV và đánh giá phù hợp với yêu cầu của job.</p><p>TD Consulting sẽ tiến hành:<br>   - Gửi CV sang phía khách hàng để review<br>   - Cập nhật lại bạn ngay khi có phản hồi tiếp theo (thời gian dự kiến từ 1–3 ngày làm việc)</p><p>Bạn vui lòng theo dõi trạng thái process CV của ứng viên trên hệ thống Apex.</p><p>Cảm ơn bạn đã đồng hành cùng TD Consulting, mong tiếp tục nhận được các CV phù hợp từ bạn trong thời gian tới.</p>`;
  }
  if (status?.startsWith('INTERVIEW_SCHEDULED_') || status?.startsWith('INTERVIEW_COMPLETED_')) {
    return `<p>Chào bạn ,</p><p>TD Consulting cập nhật: CV ${candidateName} apply vị trí ${positionTitle} đã được phía khách hàng chọn vào vòng phỏng vấn.</p><p>TD Consulting sẽ trực tiếp:<br>   - Liên hệ & sắp xếp lịch phỏng vấn với ứng viên<br>   - Follow ứng viên trong suốt quá trình phỏng vấn</p><p>TDC sẽ tiếp tục cập nhật trạng thái process của ứng viên trên hệ thống Apex, bạn vui lòng theo dõi hệ thống để nắm được kết quả.</p><p>Cảm ơn bạn đã đồng hành cùng TD Consulting, mong tiếp tục nhận được các CV phù hợp từ bạn trong thời gian tới.</p>`;
  }
  if (status === 'OFFER_EXTENDED' || status === 'OFFER_ACCEPTED_BY_CANDIDATE') {
    return `<p>Chào bạn ,</p><p>TD Consulting cập nhật: Ứng viên ${candidateName} cho vị trí ${positionTitle} đã pass phỏng vấn và đang được phía khách hàng tiến hành offer.</p><p>TD Consulting sẽ trực tiếp:<br>   - Làm việc với khách hàng về offer<br>   - Trao đổi, tư vấn và deal offer với ứng viên</p><p>TDC sẽ tiếp tục cập nhật trạng thái process của ứng viên trên hệ thống Apex, bạn vui lòng theo dõi hệ thống để nắm thông tin.</p><p>Cảm ơn bạn đã đồng hành cùng TD Consulting. Mong tiếp tục nhận được thêm nhiều CV chất lượng từ bạn trong thời gian tới để gia tăng cơ hội offer & hoa hồng.</p>`;
  }
  if (status === 'ONBOARDING') {
    return `<p>Chào bạn ,</p><p>TD Consulting cập nhật: Ứng viên ${candidateName} cho vị trí ${positionTitle} đã nhận offer và dự kiến onboard vào [Thời gian].</p><p>TD Consulting xin ghi nhận và cảm ơn bạn vì đã gửi CV phù hợp, góp phần tạo nên kết quả tuyển dụng này.</p><p>Thông tin hoa hồng cho hồ sơ trên sẽ được cập nhật chi tiết trên hệ thống Apex theo đúng chính sách hợp tác. Đội ngũ TDC sẽ chủ động liên hệ bạn nếu cần thêm thông tin liên quan.</p><p>Hiện tại, TD Consulting đang mở thêm nhiều vị trí tuyển dụng mới. Rất mong tiếp tục nhận được các CV chất lượng từ bạn để cùng nhau tạo thêm nhiều case onboard thành công trong thời gian tới.</p><p>Cảm ơn bạn đã đồng hành cùng TD Consulting 💙</p>`;
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
                  <p>Client này đã có tài khoản Portal. BẮT BUỘC phải có CV đã che thông tin.</p>
                </div>
              )}

              {/* Existing File Option */}
              {candidateEvaluationFilePath && !showUpload && (
                  <div className="bg-white p-3 rounded border border-orange-200 mb-3">
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                              <span className="font-medium text-brand-600">Đã có file CV che thông tin</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <a 
                                href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/evaluation-files/${candidateEvaluationFilePath}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-xs text-blue-600 hover:underline"
                            >
                                Xem file
                            </a>
                            <span className="text-gray-300">|</span>
                            <button 
                                type="button"
                                onClick={handleToggleUpload}
                                className="text-xs text-red-600 hover:underline"
                            >
                                Thay đổi
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
                             <span className="font-medium text-brand-600">Click để upload</span>
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
                           Hủy thay đổi (Dùng file cũ)
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
                    <li>Tóm tắt các điểm mạnh đặc biệt, kinh nghiệm và kỹ năng nổi bật của ứng viên.</li>
                    <li><span className="font-bold underline text-blue-900">BẮT BUỘC NHẬP:</span> Đây là nội dung <span className="font-bold">KHÁCH HÀNG SẼ NHÌN THẤY TRỰC TIẾP</span> trên Portal để đánh giá nhanh ứng viên.</li>
                 </ul>
              </div>
              <div className="relative bg-white rounded-lg border border-blue-200 focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden min-h-[180px]">
                <RichTextEditor
                  value={brief}
                  onChange={setBrief}
                  placeholder="Nhập tóm tắt chuyên sâu về ứng viên (HTML allowed)..."
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
                placeholder="Ghi chú chi tiết cho thay đổi trạng thái này (Nội bộ)..."
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
