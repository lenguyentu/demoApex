import { X, FileText, AlertCircle, Download, Loader2, Mail, Send, Eye, ChevronLeft, ChevronRight, Layout, Monitor, Smartphone, Info, User, Reply } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { supabase } from '../../../lib/supabase';

import { ConfirmModal } from '../../../components/ConfirmModal'; 
import { useAuth } from '../../auth/hooks'; // Thêm import
import type { Job } from '../types';

interface MatchingCandidatesModalProps {
  job: Job | null;
  open: boolean;
  onClose: () => void;
}

interface MatchingCandidate {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  applied_position: string | null;
  cv_link: string | null;
  has_cv: boolean | null;
  address: string | null;
  similarity: number;
}

type ModalStep = 'list' | 'editor';

// --- SKELETON COMPONENT ---
const CandidateSkeleton = () => (
  <div className="p-4 border-b border-gray-100 last:border-b-0">
    <div className="flex flex-col gap-2 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-2/3"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
    </div>
  </div>
);

// --- SIMILARITY BADGE ---
const SimilarityBadge = ({ score }: { score: number }) => {
  const percentage = Math.round(score * 100);
  let colorClass = 'bg-gray-100 text-gray-700';
  if (percentage >= 80) colorClass = 'bg-green-100 text-green-700';
  else if (percentage >= 60) colorClass = 'bg-blue-100 text-blue-700';
  else if (percentage >= 40) colorClass = 'bg-yellow-100 text-yellow-700';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${colorClass}`}>
      {percentage}% phù hợp
    </span>
  );
};

// --- EMAIL CHIP ---
const EmailChip = ({ email, onRemove }: { email: string; onRemove: () => void }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-50 text-brand-700 border border-brand-200 rounded-full text-xs font-medium group hover:bg-brand-100 transition-colors">
    <Mail className="w-3 h-3 text-brand-400" />
    <span className="max-w-[150px] truncate">{email}</span>
    <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="ml-0.5 p-0.5 rounded-full hover:bg-brand-200 transition-colors">
      <X className="w-3 h-3" />
    </button>
  </span>
);

// --- CANDIDATE ITEM ---
const CandidateItemSelectable = ({
  candidate,
  isSelected,
  onToggle,
  onViewCV,
  isSigning,
}: {
  candidate: MatchingCandidate;
  isSelected: boolean;
  onToggle: () => void;
  onViewCV: () => void;
  isSigning: boolean;
}) => (
  <div className={`p-4 border-b border-gray-100 last:border-b-0 transition-colors cursor-pointer ${isSelected ? 'bg-brand-50/50' : 'hover:bg-gray-50'}`} onClick={onToggle}>
    <div className="flex items-start gap-3">
      <div className="pt-0.5">
        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-brand-600 border-brand-600' : 'border-gray-300 bg-white'}`}>
          {isSelected && <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M3 6l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900 truncate">{candidate.name}</span>
          <SimilarityBadge score={candidate.similarity} />
        </div>
        <p className="text-sm text-gray-600 mt-1 truncate">{candidate.applied_position || 'Chưa có vị trí'}</p>
        {candidate.address && <p className="text-[11px] text-gray-400 mt-0.5 truncate flex items-center gap-1">📍 {candidate.address}</p>}
        <div className="flex items-center gap-2 mt-2" onClick={e => e.stopPropagation()}>
          {candidate.cv_link ? (
            <button onClick={onViewCV} disabled={isSigning} className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors disabled:opacity-50">
              {isSigning ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
              Xem CV
            </button>
          ) : candidate.has_cv ? (
            <a href={`/candidates/${candidate.id}?type=database`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
              <FileText className="w-3 h-3" /> Hệ thống
            </a>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-500">
              <AlertCircle className="w-3 h-3" /> Không CV
            </span>
          )}
          {candidate.email && <span className="text-xs text-gray-500 truncate ml-auto italic">{candidate.email}</span>}
          {!candidate.email && <span className="text-xs text-red-400 italic ml-auto truncate">⚠ Thiếu mail</span>}
        </div>
      </div>
    </div>
  </div>
);

// --- MAIN COMPONENT ---
export const MatchingCandidatesModal = ({ job, open, onClose }: MatchingCandidatesModalProps) => {
  const [candidates, setCandidates] = useState<MatchingCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [externalEmails, setExternalEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  
  const [step, setStep] = useState<ModalStep>('list');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [sending, setSending] = useState(false);
  const [signingCvId, setSigningCvId] = useState<string | null>(null);

  const { user } = useAuth(); // Lấy thông tin user hiện tại
  
  // Email Config
  const [templateMode, setTemplateMode] = useState<'tdc' | 'tdg'>('tdc');
  const [subject, setSubject] = useState('');
  const [fromName, setFromName] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [replyTo, setReplyTo] = useState('');

  // Content
  const [titleLine1, setTitleLine1] = useState('');
  const [titleLine2, setTitleLine2] = useState('');
  const [recruiterName, setRecruiterName] = useState('');
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [recruiterPhone, setRecruiterPhone] = useState('0336.828.903');
  const [intro, setIntro] = useState('');
  
  // Effect để autofill thông tin user đang đăng nhập
  useEffect(() => {
    if (user && open) {
      setReplyTo(user.email || '');
      setRecruiterEmail(user.email || '');
      setFromName(user.full_name || 'TD Consulting Team');
      setRecruiterName(user.full_name?.split(' ').pop() || 'Dung'); // Lấy tên cuối hoặc mặc định Dung
    }
  }, [user, open]);
  const [requirement, setRequirement] = useState('');
  const [responsibility, setResponsibility] = useState('');
  const [careerPath, setCareerPath] = useState('');
  const [compensation, setCompensation] = useState('');
  const [whyJoinUs, setWhyJoinUs] = useState<{title: string, content: string}[]>([]);

  const [showConfirm, setShowConfirm] = useState(false); // Thêm state xác nhận

  useEffect(() => {
    if (open) document.body.classList.add('overflow-hidden');
    return () => { document.body.classList.remove('overflow-hidden'); };
  }, [open]);

  useEffect(() => {
    if (!open || !job?.id) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const { MOCK_CANDIDATES } = await import('../../../mocks/candidates');
        const result = MOCK_CANDIDATES.map((c, i) => ({
          id: c.id,
          name: c.full_name || 'No Name',
          email: c.email,
          phone: c.phone,
          applied_position: c.current_title,
          cv_link: null,
          has_cv: false,
          address: 'Hà Nội',
          similarity: 0.95 - (i * 0.05)
        }));
        setCandidates(result as unknown as MatchingCandidate[]);
        setSelectedIds(new Set()); // Khởi đầu với danh sách chưa chọn ai cả
      } catch (err: any) { 
        toast.error(err.message || 'Lỗi tải dữ liệu'); 
      } finally { 
        setLoading(false); 
      }
    };
    fetch();
  }, [open, job?.id]);

  useEffect(() => {
    if (job && step === 'editor') {
      const title = job.position_title || 'Tuyển dụng';
      const parts = title.split(' ');
      const mid = Math.ceil(parts.length / 2);

      if (templateMode === 'tdg') {
        setTitleLine1('2D SPINE');
        setTitleLine2('Animator');
        if (!subject || subject.startsWith('Cơ Hội')) setSubject(`TD Games - Tuyển Dụng ${title}`);
        setIntro('TD Games đang tuyển dụng gấp cho dự án game quốc tế mới. Chúng tôi tìm kiếm một <strong style="color:#ffffff;">2D Spine Animator</strong> có đam mê với animation game và mong muốn làm việc trong môi trường sáng tạo, chuyên nghiệp.');
        setRequirement('Thành thạo Spine 2D (rigging, skinning, animation)\nTối thiểu 1 năm kinh nghiệm game animation\nHiểu motion timing, weight & squash/stretch\nPortfolio game thực tế là lợi thế');
        setResponsibility('Tạo animation nhân vật & hiệu ứng trong game\nPhối hợp với team Artist & Programmer\nĐảm bảo chất lượng đúng style guide dự án\nReview & cải thiện pipeline animation');
        setCompensation('10,000,000 – 18,000,000 VND');
        setCareerPath('Thương lượng theo năng lực  ·  Review sau 3 tháng  ·  Thưởng dự án');
        setWhyJoinUs([
          { title: 'International Projects', content: 'Tham gia các dự án cho thị trường quốc tế với tiêu chuẩn nghệ thuật cao nhất.' },
          { title: 'Creative Freedom', content: 'Không gian sáng tạo mở, khuyến khích sự đột phá và phát triển kỹ năng liên tục.' }
        ]);
      } else {
        setTitleLine1(parts.slice(0, mid).join(' '));
        setTitleLine2(parts.slice(mid).join(' ') || 'Opportunity');
        if (!subject || subject.startsWith('TD Games')) setSubject(`Cơ Hội Nghề Nghiệp – ${title}`);
        setCompensation([job.min_monthly_salary, job.max_monthly_salary].filter(Boolean).join(' - ') || 'Thương lượng');
        setIntro(`Em là <strong>${user?.full_name?.split(' ').pop() || 'Dung'}</strong> từ <strong>TD Consulting</strong>. Hiện bên em đang hỗ trợ tuyển dụng cho đối tác cho vị trí <strong>${title}</strong>. Qua profile ấn tượng, em rất mong được kết nối với Anh/Chị.`);
        setRequirement(job.requirements?.replace(/<[^>]*>/g, '').slice(0, 100) + '...' || '');
        setResponsibility('Làm việc trực tiếp với PM, phát triển module tính năng chính.');
        setCareerPath('Lên Team Lead hoặc Technical Owner.');
      }
    }
  }, [job, step, templateMode, user?.full_name]);

  const handleEmailInput = (value: string) => {
    if (value.includes(',')) {
      const parts = value.split(',').map(e => e.trim()).filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
      setExternalEmails(prev => [...new Set([...prev, ...parts])]);
      setEmailInput('');
    } else { setEmailInput(value); }
  };

  const getRecipientEmails = (): string[] => {
    const fromCandidates = candidates.filter(c => selectedIds.has(c.id) && c.email).map(c => c.email!);
    return [...new Set([...fromCandidates, ...externalEmails])];
  };

  const totalRecipients = getRecipientEmails().length;

  const handleSendEmail = async (): Promise<void> => {
    const emails = getRecipientEmails();
    if (emails.length === 0) {
      toast.error('Chọn ít nhất 1 người nhận');
      return;
    }
    if (!job?.id) {
      toast.error('Thiếu thông tin Job ID');
      return;
    }
    const domain = templateMode === 'tdg' ? '@tdgamestudio.com' : '@tdconsulting.vn';
    if (!fromEmail.endsWith(domain)) {
      toast.error(`Email gửi phải thuộc tên miền ${domain}`);
      return;
    }

    setSending(true);
    try {
      // 1. Tạo candidateMap để backend ghi log chính xác cho từng người
      const candidateMap: Record<string, string> = {};
      candidates.forEach(c => {
        if (c.email && selectedIds.has(c.id)) {
          candidateMap[c.email] = c.id;
        }
      });

      const jobData: any = { 
        titleLine1, titleLine2, recruiterName, recruiterEmail, recruiterPhone, 
        intro, requirement, responsibility, careerPath, compensation 
      };

      if (templateMode === 'tdg') {
        jobData.requirementsList = requirement.split(/\r?\n/).filter(Boolean);
        jobData.responsibilitiesList = responsibility.split(/\r?\n/).filter(Boolean);
        jobData.salaryRange = compensation;
        jobData.benefitsSummary = careerPath;
        jobData.whyJoinUs = whyJoinUs;
        delete jobData.recruiterName;
        delete jobData.recruiterPhone;
      }

      const emailPayload = {
        to: emails, subject, jobId: job.id, candidateMap, replyTo, fromEmail, fromName, jobData
      };

      // 2. Gọi API tương ứng với thương hiệu
      const apiCall = templateMode === 'tdg' 
        ? marketingApi.sendTDGEmail(emailPayload) 
        : marketingApi.sendJobEmail(emailPayload);
        
      const res = await apiCall;

      // 3. Xử lý phản hồi chi tiết từ Backend
      const { sentCount, skippedCount, failedCount } = res?.data || { sentCount: emails.length, skippedCount: 0, failedCount: 0 };
      
      if (sentCount > 0) {
        toast.success(
          <div className="flex flex-col gap-1">
            <p className="font-bold">Campaign đã khởi chạy!</p>
            <div className="text-xs opacity-90">
              <p>✅ Gửi mới: {sentCount} người</p>
              {skippedCount > 0 && <p>🛡️ Đã có lọc trùng: {skippedCount} người</p>}
              {failedCount > 0 && <p className="text-red-500">❌ Lỗi API: {failedCount} người</p>}
            </div>
          </div>,
          { duration: 5000 }
        );
        setShowConfirm(false);
        onClose();
      } else if (skippedCount > 0) {
        toast.error(`Toàn bộ (${skippedCount}) ứng viên này đã nhận JD này trước đó. Không gửi trùng!`, { duration: 6000 });
      } else {
        toast.error('Gửi thất bại, vui lòng kiểm tra lại cấu hình.');
      }
    } catch (err: any) {
      console.error('Email Send Error:', err);
      toast.error(err.message || 'Gửi thất bại'); 
    } finally {
      setSending(false);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = candidates.map(c => ({ 'Tên': c.name, 'Email': c.email || 'N/A', 'Vị trí': c.applied_position || 'N/A', 'Độ phù hợp': Math.round(c.similarity * 100) + '%' }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Candidates');
    XLSX.writeFile(wb, `Candidates_${job?.position_title}.xlsx`);
  };

  const handleViewCV = async (c: MatchingCandidate) => {
    if (!c.cv_link) return;
    try {
      setSigningCvId(c.id);
      const { data, error: signError } = await supabase.storage.from('cv').createSignedUrl(c.cv_link, 3600);
      if (signError) throw signError;
      if (data?.signedUrl) window.open(data.signedUrl, '_blank');
    } catch { toast.error('Lỗi mở CV'); } finally { setSigningCvId(null); }
  };

  const getTDGEmailTemplate = (data: any): string => {
    // Helper functions to render lists from array or string
    const renderReqs = (list?: string[], fallback?: string) => {
      const dataList = list && list.length > 0 ? list : (fallback ? [fallback] : []);
      if (dataList.length === 0) return '';
      return dataList.map(item => `
        <div style="display:flex; align-items:flex-start; margin-bottom:9px;">
          <span style="flex-shrink:0; width:5px; height:5px; background:#F47920; border-radius:50%; margin-top:6px; margin-right:9px;"></span>
          <span style="font-family:'Be Vietnam Pro',sans-serif; font-size:12px; color:#cccccc; line-height:1.7; word-break: break-word;">${item}</span>
        </div>
      `).join('');
    };

    const renderResps = (list?: string[], fallback?: string) => {
      const dataList = list && list.length > 0 ? list : (fallback ? [fallback] : []);
      if (dataList.length === 0) return '';
      return dataList.map(item => `
        <div style="display:flex; align-items:flex-start; margin-bottom:9px;">
          <span style="flex-shrink:0; width:0; height:0; border-top:4px solid transparent; border-bottom:4px solid transparent; border-left:6px solid #F47920; margin-top:7px; margin-right:8px;"></span>
          <span style="font-family:'Be Vietnam Pro',sans-serif; font-size:12px; color:#cccccc; line-height:1.7; word-break: break-word;">${item}</span>
        </div>
      `).join('');
    };

    const renderWhyUs = (list?: { title: string; content: string }[]) => {
      const items = list && list.length > 0 ? list : [
        { title: 'International Projects', content: 'Tham gia các dự án cho thị trường quốc tế với tiêu chuẩn nghệ thuật cao nhất.' },
        { title: 'Creative Freedom', content: 'Không gian sáng tạo mở, khuyến khích sự đột phá và phát triển kỹ năng liên tục.' }
      ];

      return items.map((item, index) => `
        <tr>
          <td style="padding: ${index === 0 ? '0 0 11px' : '11px 0 0'}; border-bottom: ${index < items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'};">
            <p style="font-family:'Be Vietnam Pro',sans-serif; font-size:13px; font-weight:700; color:#fff; margin:0 0 3px;">${item.title}</p>
            <p style="font-family:'Be Vietnam Pro',sans-serif; font-size:12px; color:#888; margin:0; line-height:1.7;">${item.content}</p>
          </td>
        </tr>
      `).join('');
    };

    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TD Games - Tuyen Dung ${data.titleLine1} ${data.titleLine2}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@1,600;1,700&family=Be+Vietnam+Pro:wght@300;400;500;600;700&display=swap');
    body { background-color: #2A2A2D; margin: 0; padding: 0; }
    .container { width: 600px; background-color: #111111; border-radius: 20px; overflow: hidden; border: 1px solid #1e1e1e; box-shadow: 0 15px 50px rgba(0,0,0,0.9); }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; border-radius: 0 !important; }
      .hero-title { font-size: 36px !important; }
      .hero-pad { padding: 44px 24px 28px !important; }
      .greet-pad { padding: 0 24px 24px !important; }
      .section-pad { padding: 0 16px 18px !important; }
      .luong-pad { padding: 0 16px 22px !important; }
      .header-pad { padding: 18px 20px 16px !important; }
      .footer-pad { padding: 28px 20px 32px !important; }
      .header-title { font-size: 15px !important; letter-spacing: 1px !important; }
      .hiring-badge { font-size: 10px !important; padding: 5px 12px !important; letter-spacing: 1px !important; white-space: nowrap !important; }
      .card-col { display: block !important; width: 100% !important; box-sizing: border-box !important; }
      .card-col-border { border-right: none !important; border-bottom: 1px solid rgba(244,121,32,0.12) !important; padding-bottom: 14px !important; }
      .urgent-badge { display: inline-block !important; margin-top: 4px !important; }
      .hide-mobile { display: none !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#2A2A2D;">
<span style="display:none !important; visibility:hidden; mso-hide:all; font-size:1px; color:#2A2A2D; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">
  Cơ hội gia nhập TD Games cho vị trí ${data.titleLine1} ${data.titleLine2}. Tham gia phát triển các dự án chuẩn quốc tế cùng đội ngũ chuyên gia ngay hôm nay! &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
</span>
<center>
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="padding:24px 0; background-color:#2A2A2D;">
  <tr>
    <td align="center">
      <table class="container" cellpadding="0" cellspacing="0" border="0" width="600">
        <tr>
          <td class="header-pad" style="background: linear-gradient(135deg, #1a0e00 0%, #1f1200 40%, #151515 100%); padding: 28px 44px 24px; border-bottom: 2px solid #F47920;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td valign="middle">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td valign="middle">
                        <img src="https://dqnjtkbxtscjikalkajq.supabase.co/storage/v1/object/public/public-assets/favicon.png" width="38" height="38" alt="TD Games" style="display:block;">
                      </td>
                      <td width="12" valign="middle"></td>
                      <td valign="middle">
                        <p class="header-title" style="font-family:'Orbitron',sans-serif; font-size:18px; font-weight:900; color:#F47920; margin:0; letter-spacing:2px; text-transform:uppercase; line-height:1;">TD GAMES</p>
                        <p style="font-family:'Be Vietnam Pro',sans-serif; font-size:8px; color:#aaaaaa; margin:5px 0 0; font-weight:500; text-transform:uppercase; letter-spacing:2px;">Art &amp; Animation Studio</p>
                      </td>
                    </tr>
                  </table>
                </td>
                <td align="right" valign="middle">
                  <span class="hiring-badge" style="background:#F47920; color:#ffffff; font-family:'Rajdhani',sans-serif; font-size:11px; font-weight:700; padding:7px 20px; border-radius:4px; letter-spacing:2px; text-transform:uppercase; white-space:nowrap;">HIRING NOW</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td background="https://dqnjtkbxtscjikalkajq.supabase.co/storage/v1/object/public/public-assets/Gemini_Generated_Image_aql1traql1traql1.png"
              bgcolor="#111111" width="600" valign="top"
              style="background-image:url('https://dqnjtkbxtscjikalkajq.supabase.co/storage/v1/object/public/public-assets/Gemini_Generated_Image_aql1traql1traql1.png'); background-size:cover; background-position:center center; background-repeat:no-repeat; background-attachment:scroll;">
            <div>
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td class="hero-pad" style="padding:52px 44px 32px; text-align:center; background:linear-gradient(180deg, rgba(6,3,0,0.65) 0%, rgba(10,6,0,0.48) 100%);">
                    <h1 class="hero-title" style="font-family:'Rajdhani',sans-serif; font-size:48px; font-weight:700; color:#ffffff; line-height:1.05; margin:0; letter-spacing:2px;">
                      ${data.titleLine1}<br><span style="font-family:'Cormorant Garamond',serif; font-size:62px; font-weight:700; font-style:italic; color:#F47920; letter-spacing:1px; line-height:1;">${data.titleLine2}</span>
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td class="greet-pad" style="padding:0 44px 28px; background:linear-gradient(180deg, rgba(10,6,0,0.48) 0%, rgba(14,9,0,0.75) 100%);">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:18px;">
                      <tr><td style="height:1px; background:linear-gradient(90deg,#F47920,rgba(244,121,32,0.06));"></td></tr>
                    </table>
                    <p style="font-family:'Be Vietnam Pro',sans-serif; font-size:15px; color:#ffffff; margin:0 0 9px;">Chào <strong>${data.candidateName || 'Anh/Chị'}</strong>,</p>
                    <p style="font-family:'Be Vietnam Pro',sans-serif; font-size:13.5px; color:#cccccc; line-height:1.85; margin:0;">
                      ${data.intro}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td class="section-pad" style="padding:0 44px 22px; background:linear-gradient(180deg, rgba(14,9,0,0.75) 0%, rgba(10,6,0,0.90) 100%);">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-radius:12px; overflow:hidden; border:1px solid rgba(244,121,32,0.22);">
                      <tr>
                        <td colspan="2" style="background:linear-gradient(90deg,rgba(40,17,0,0.96),rgba(26,16,8,0.96)); padding:15px 26px 14px; border-bottom:1px solid rgba(244,121,32,0.18);">
                          <table class="card-header-inner" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td>
                                <p style="font-family:'Rajdhani',sans-serif; font-size:19px; font-weight:700; color:#F47920; letter-spacing:2px; text-transform:uppercase; margin:0;">${data.titleLine1} ${data.titleLine2}</p>
                              </td>
                              <td align="right" valign="middle" width="1%" style="padding-left: 15px; white-space: nowrap;">
                                <span class="urgent-badge" style="background:rgba(244,121,32,0.16); border:1px solid rgba(244,121,32,0.42); color:#F47920; font-family:'Rajdhani',sans-serif; font-size:10px; font-weight:700; padding:5px 13px; border-radius:3px; letter-spacing:1.5px; white-space:nowrap;">URGENT</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr valign="top">
                        <td class="card-col card-col-border" width="50%" style="background:rgba(8,5,0,0.85); padding:18px 14px 18px 24px; border-right:1px solid rgba(244,121,32,0.1);">
                          <p style="font-family:'Be Vietnam Pro',sans-serif; font-size:11px; font-weight:700; color:#F47920; margin:0 0 12px;">Requirements</p>
                          ${renderReqs(data.requirementsList, data.requirement)}
                        </td>
                        <td class="card-col" width="50%" style="background:rgba(6,4,0,0.85); padding:18px 24px 18px 16px;">
                          <p style="font-family:'Be Vietnam Pro',sans-serif; font-size:11px; font-weight:700; color:#F47920; margin:0 0 12px;">Responsibilities</p>
                          ${renderResps(data.responsibilitiesList, data.responsibility)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td class="luong-pad" style="padding:0 44px 22px; background:linear-gradient(180deg, rgba(10,6,0,0.90) 0%, rgba(14,10,4,0.97) 100%);">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="background:linear-gradient(90deg, rgba(244,121,32,0.16) 0%, rgba(244,121,32,0.04) 100%); border:1px solid rgba(244,121,32,0.32); border-radius:10px; padding:18px 24px;">
                          <table cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td valign="middle">
                                <p style="font-family:'Be Vietnam Pro',sans-serif; font-size:11px; font-weight:700; color:#F47920; letter-spacing:0.5px; margin:0 0 6px;">Salary &amp; Benefits</p>
                                <p style="font-family:'Rajdhani',sans-serif; font-size:20px; font-weight:700; color:#ffffff; margin:0 0 4px; letter-spacing:1px;">${data.salaryRange || data.compensation}</p>
                                <p style="font-family:'Be Vietnam Pro',sans-serif; font-size:11px; color:#888; margin:0; line-height:1.6;">${data.benefitsSummary || 'Thương lượng theo năng lực · Chế độ đãi ngộ hấp dẫn'}</p>
                              </td>
                              <td align="right" valign="middle" width="32">
                                <span style="font-size:20px; color:rgba(244,121,32,0.4);">&#9670;</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td class="section-pad" style="padding:0 44px 22px; background:linear-gradient(180deg, rgba(14,10,4,0.97) 0%, rgba(16,12,6,0.99) 100%);">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-radius:10px; border:1px solid rgba(244,121,32,0.08); background:rgba(244,121,32,0.03);">
                      <tr>
                        <td style="padding:20px 26px 18px;">
                          <p style="font-family:'Be Vietnam Pro',sans-serif; font-size:13px; font-weight:700; color:#F47920; letter-spacing:0.5px; text-align:center; margin:0 0 16px;">Tại sao TD Games?</p>
                          <table cellpadding="0" cellspacing="0" border="0" width="100%">
                            ${renderWhyUs(data.whyJoinUs)}
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td class="section-pad" style="padding:10px 44px 28px; text-align:center; background:rgba(16,12,6,0.99);">
                    <p style="font-family:'Be Vietnam Pro',sans-serif; font-size:13.5px; color:#dddddd; line-height:1.75; margin:0 auto; max-width:460px;">
                      Nếu bạn quan tâm và muốn thử sức với dự án, hãy <strong style="color:#ffffff;">Phản hồi (Reply)</strong> lại email này đính kèm <strong style="color:#F47920;">CV / Portfolio</strong> của mình nhé. Rất mong được đồng hành cùng bạn!
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="height:30px; background:linear-gradient(180deg, rgba(16,12,6,0.99) 0%, #111111 100%);"></td>
                </tr>
              </table>
            </div>
          </td>
        </tr>
        <tr>
          <td class="footer-pad" style="background:linear-gradient(180deg,#151515 0%,#0d0d0d 60%,#080808 100%); padding:36px 44px 40px; text-align:center; border-top:2px solid #F47920;">
            <img src="https://dqnjtkbxtscjikalkajq.supabase.co/storage/v1/object/public/public-assets/logo-td2.png" height="46" alt="TD Games" style="display:block; margin:0 auto 8px;">
            <p style="font-family:'Be Vietnam Pro',sans-serif; font-size:9px; color:#555; margin:0 0 6px; letter-spacing:1.5px;">505 Minh Khai, Vinh Tuy, Ha Noi</p>
            <a href="https://www.tdgamestudio.com" style="font-family:'Be Vietnam Pro',sans-serif; font-size:11px; color:#F47920; text-decoration:none; letter-spacing:0.5px;">www.tdgamestudio.com</a>
            <table cellpadding="0" cellspacing="0" border="0" width="60%" align="center" style="margin:20px auto 20px;">
              <tr><td style="height:1px; background:linear-gradient(90deg,transparent,#222,transparent);"></td></tr>
            </table>
            <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
              <tr>
                <td style="padding:0 10px;"><a href="https://www.behance.net/tdgames" style="text-decoration:none;"><img src="https://dqnjtkbxtscjikalkajq.supabase.co/storage/v1/object/public/public-assets/behance-square-color-icon.png" width="28" height="28" alt="Behance" style="display:block; border-radius:4px;"></a></td>
                <td style="padding:0 10px;"><a href="https://www.facebook.com/tdgamesvn" style="text-decoration:none;"><img src="https://cdn-images.mailchimp.com/icons/social-block-v2/color-facebook-96.png" width="28" height="28" alt="Facebook" style="display:block; border-radius:4px;"></a></td>
                <td style="padding:0 10px;"><a href="https://www.linkedin.com/company/tdgames" style="text-decoration:none;"><img src="https://cdn-images.mailchimp.com/icons/social-block-v2/color-linkedin-96.png" width="28" height="28" alt="LinkedIn" style="display:block; border-radius:4px;"></a></td>
                <td style="padding:0 10px;"><a href="https://www.tdgamestudio.com" style="text-decoration:none;"><img src="https://cdn-images.mailchimp.com/icons/social-block-v2/color-link-96.png" width="28" height="28" alt="Website" style="display:block; border-radius:4px;"></a></td>
              </tr>
            </table>
            <table cellpadding="0" cellspacing="0" border="0" width="70%" align="center" style="margin:0 auto 16px;">
              <tr><td style="height:1px; background:linear-gradient(90deg,transparent,#2a2a2a,transparent);"></td></tr>
            </table>
            <p style="font-family:'Be Vietnam Pro',sans-serif; font-size:10px; color:#444; margin:0;">© 2026 TD Games Studio. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</center>
</body>
</html>`;
  };

  const getPreviewHtml = (): string => {
    let d: any = { titleLine1, titleLine2, recruiterName, recruiterEmail, recruiterPhone, intro, requirement, responsibility, careerPath, compensation };
    
    if (templateMode === 'tdg') {
      d.requirementsList = requirement.split(/\r?\n/).filter(Boolean);
      d.responsibilitiesList = responsibility.split(/\r?\n/).filter(Boolean);
      d.salaryRange = compensation;
      d.benefitsSummary = careerPath;
      d.whyJoinUs = whyJoinUs;
      return getTDGEmailTemplate(d);
    }
    
    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Cơ Hội Nghề Nghiệp – TD Consulting</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p, a { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=Be+Vietnam+Pro:wght@300;400;500;600;700&display=swap');
    
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    
    body, p, div, li, td { font-family: 'Be Vietnam Pro', 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; }
    body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: #f8f9fc; }
    img { outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; border: none; max-width: 100%; display: block; }
    a { text-decoration: none; }

    /* MOBILE OPTIMIZATION */
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; border-radius: 0 !important; }
      .header-pad { padding: 30px 20px 20px !important; }
      .hero-title { font-size: 32px !important; }
      .content-padding { padding: 25px 20px !important; }
      .job-card { padding: 20px 15px !important; }
      .sig-img-td { width: 85px !important; min-width: 85px !important; padding-left: 10px !important; }
      .sig-img { width: 80px !important; }
      .sig-pad { padding: 15px 10px 15px 15px !important; } 
      .footer-pad { padding: 30px 20px !important; }
      .sig-contact { display: block !important; margin-top: 4px !important; word-break: break-all !important; }
      .sig-pipe { display: none !important; }
    }

    /* DARK MODE FIXES */
    @media (prefers-color-scheme: dark) {
      body { background-color: #111111 !important; }
      .container { background-color: #1a1a1a !important; box-shadow: 0 20px 50px rgba(0,0,0,0.5) !important; }
      .hero-title { color: #ffffff !important; }
      p, td, .sig-name { color: #e1e1e1 !important; }
      .job-card { background-color: #252525 !important; border-color: #333333 !important; }
      .header-pad, .footer-pad { background: #1a1a1a !important; border-color: #333333 !important; }
    }

    /* Gmail/Outlook Force Dark Mode Override */
    [data-ogsc] body { background-color: #111111 !important; }
    [data-ogsc] .container { background-color: #1a1a1a !important; }
    [data-ogsc] .hero-title { color: #ffffff !important; }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f8f9fc;">
<center style="width:100%; background-color:#f8f9fc;">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f8f9fc; padding:20px 0;">
  <tr>
    <td align="center">
      <table class="container" cellpadding="0" cellspacing="0" border="0" width="600"
             style="max-width:600px; width:100%; background:#ffffff; border-radius:32px; overflow:hidden; box-shadow:0 20px 50px rgba(221,0,103,0.06);">

        <!-- ===== HEADER ===== -->
        <tr>
          <td class="header-pad"
              style="background-color: #ffffff; background:linear-gradient(145deg,#ffffff 0%,#fff2f7 100%); padding:40px 50px 20px; border-bottom:1px solid #fceef4;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td valign="middle">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td valign="middle"><img src="http://cdn.mcauto-images-production.sendgrid.net/df994ac46b4d72ce/9d98b919-bd60-4907-ba1b-1fa7a051d2c8/473x408.png" width="44" alt="TD Logo" style="display:block;"></td>
                      <td width="12"></td>
                      <td width="1" style="background:#fceef4;"><div style="width:1px; height:28px; background:#fceef4;"></div></td>
                      <td width="12"></td>
                      <td valign="middle">
                        <p style="font-size:14px; font-weight:800; color:#1a1a2e; margin:0;">TD Consulting</p>
                        <p style="font-size:9px; color:#dd0067; margin:2px 0 0 0; font-weight:600; text-transform:uppercase;">A Trusted Recruitment Partner</p>
                      </td>
                    </tr>
                  </table>
                </td>
                <td align="right" valign="middle">
                  <span style="background:#fff0f6; color:#dd0067; font-size:9px; font-weight:800; padding:6px 12px; border-radius:30px; border:1px solid #ffdeeb; white-space:nowrap;">Cơ hội mới</span>
                </td>
              </tr>
            </table>

            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:20px;">
              <tr>
                <td align="center">
                  <h1 class="hero-title" style="font-family:'Playfair Display',serif; font-size:42px; font-weight:900; color:#1a1a2e !important; line-height:1.1; margin:0;">
                    <span style="color:#1a1a2e !important;">${titleLine1}</span><br>
                    <span style="color:#dd0067 !important; font-style:italic;">${titleLine2}</span>
                  </h1>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ===== BODY ===== -->
        <tr>
          <td class="content-padding" style="padding:30px 50px 10px;">
            <p style="font-size:15px; margin:0 0 10px 0; color:#1a1a2e;">Chào <strong>Anh/Chị</strong>,</p>
            <p style="font-size:14px; color:#5a6478; line-height:1.7; margin:0 0 25px 0;">
              ${intro}
            </p>

            <!-- Job Details Card -->
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:30px;">
              <tr>
                <td class="job-card" style="background-color: #ffffff; border:1px solid #fceef4; border-radius:32px; padding:24px 30px; box-shadow:0 15px 40px rgba(221,0,103,0.04);">
                  <div style="text-align:center; margin-bottom:18px;">
                    <span style="color:#dd0067; font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Điểm nổi bật của vị trí</span>
                  </div>
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td valign="top" width="18" style="font-size:16px; color:#dd0067; line-height:1.6; padding-bottom:12px;">•</td>
                      <td valign="top" width="85" style="font-size:14px; font-weight:700; color:#1a1a2e; padding-bottom:12px;">Yêu cầu:</td>
                      <td valign="top" style="font-size:14px; color:#5a6478; line-height:1.6; padding-bottom:12px;">${requirement}</td>
                    </tr>
                    <tr>
                      <td valign="top" width="18" style="font-size:16px; color:#dd0067; line-height:1.6; padding-bottom:12px;">•</td>
                      <td valign="top" width="85" style="font-size:14px; font-weight:700; color:#1a1a2e; padding-bottom:12px;">Quyền hạn:</td>
                      <td valign="top" style="font-size:14px; color:#5a6478; line-height:1.6; padding-bottom:12px;">${responsibility}</td>
                    </tr>
                    <tr>
                      <td valign="top" width="18" style="font-size:16px; color:#dd0067; line-height:1.6; padding-bottom:12px;">•</td>
                      <td valign="top" width="85" style="font-size:14px; font-weight:700; color:#1a1a2e; padding-bottom:12px;">Lộ trình:</td>
                      <td valign="top" style="font-size:14px; color:#5a6478; line-height:1.6; padding-bottom:12px;">${careerPath}</td>
                    </tr>
                    <tr>
                      <td valign="top" width="18" style="font-size:16px; color:#dd0067; line-height:1.6;">•</td>
                      <td valign="top" width="85" style="font-size:14px; color:#dd0067; font-weight:800;">Đãi ngộ:</td>
                      <td valign="top" style="font-size:14px; color:#dd0067; font-weight:700; line-height:1.6;">${compensation}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="font-size:14px; color:#5a6478; line-height:1.8; margin:0 0 30px 0;">
              Không biết Anh/Chị có đang open cho một bước tiến mới không ạ? Nếu tiện em xin phép gửi JD chi tiết để Anh/Chị tham khảo thêm nhé! Cảm ơn anh chị!
            </p>

             <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:35px;">
              <tr>
                <td>
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" 
                         style="background-color:#f9e5e7; border-radius:16px; border:1px solid #fceef4;">
                    <tr>
                      <td class="sig-img-td" width="130" valign="middle" style="line-height:0; padding-left:20px;">
                        <img class="sig-img" src="https://dqnjtkbxtscjikalkajq.supabase.co/storage/v1/object/public/avatars/girl.png" 
                             alt="Avatar" width="115" style="display:block;">
                      </td>
                      <td width="1" valign="middle" style="padding:20px 0;"><div style="width:1px; height:60px; background:#f2d1d4;"></div></td>
                      <td class="sig-pad" style="padding:20px 20px 20px 40px;" valign="middle">
                        <p style="font-size:17px; font-weight:700; color:#1a1a2e; margin:0 0 4px 0;">${recruiterName}</p>
                        <p style="font-size:12px; color:#5a6478; margin:0 0 8px 0; line-height:1.4;">
                          Recruitment Consultant<br>TD Consulting
                        </p>
                        <p style="font-size:11.5px; color:#dd0067; margin:0; font-weight:600; line-height:1.5;">
                          <a href="mailto:${recruiterEmail}" style="color:#dd0067; text-decoration:none;">${recruiterEmail}</a><br>
                          <a href="tel:${recruiterPhone}" style="color:#dd0067; text-decoration:none;">${recruiterPhone}</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ===== FOOTER (CLEAN NO EMOJI) ===== -->
        <tr>
          <td class="footer-pad" style="background-color: #ffffff; background:linear-gradient(145deg,#ffffff 0%,#fff2f7 100%); padding:30px 40px 40px; text-align:center; border-top:1px solid #fceef4;">
            <div style="margin-bottom:12px;"><img src="https://dqnjtkbxtscjikalkajq.supabase.co/storage/v1/object/public/avatars/logoCompany.png" alt="Logo" width="40" style="display:block; margin: 0 auto;"></div>
            <p style="font-size:14px; font-weight:700; color:#dd0067; margin:0;">TD Consulting Team</p>
            <div style="height:2px; width:30px; background:#dd0067; margin:12px auto;"></div>
            
            <p style="font-size:12px; color:#5a6478; line-height:1.8; margin:0 0 6px;">505 Minh Khai, Hai Bà Trưng, Hà Nội</p>
            <p style="font-size:12px; margin:0 0 18px;"><a href="https://tdconsulting.vn" target="_blank" style="color:#dd0067; font-weight:600; text-decoration:none;">tdconsulting.vn</a></p>

            <!-- Social Links -->
            <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
              <tr>
                <td style="padding:0 8px;"><a href="https://facebook.com/tdconsulting" target="_blank"><img src="https://cdn-images.mailchimp.com/icons/social-block-v2/color-facebook-96.png" width="24" alt="FB" style="display:block;"></a></td>
                <td style="padding:0 8px;"><a href="https://www.linkedin.com/company/td-consultingvn" target="_blank"><img src="https://cdn-images.mailchimp.com/icons/social-block-v2/color-linkedin-96.png" width="24" alt="LI" style="display:block;"></a></td>
                <td style="padding:0 8px;"><a href="https://tdconsulting.vn" target="_blank"><img src="https://cdn-images.mailchimp.com/icons/social-block-v2/color-link-96.png" width="24" alt="Web" style="display:block;"></a></td>
              </tr>
            </table>
            
            <p style="font-size:10px; color:#a1a1b5; margin-top:25px; letter-spacing:0.5px;">© 2026 TD Consulting. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</center>
</body>
</html>`;
  };

  if (!open || !job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" 
         onClick={() => step !== 'editor' && onClose()}>
      <div className={`relative bg-white shadow-2xl rounded-2xl flex flex-col overflow-hidden transition-all duration-300 ${step === 'editor' ? 'w-full max-w-7xl h-[95vh]' : 'w-full max-w-2xl h-[85vh]'}`} 
           onClick={e => e.stopPropagation()}>
        
        <div className="flex items-center justify-between px-6 py-4 bg-brand-600 text-white shrink-0">
          <div className="flex items-center gap-3">
            {step === 'editor' && <button onClick={() => setStep('list')} className="p-1 hover:bg-white/20 rounded-lg"><ChevronLeft /></button>}
            <Layout className="w-5 h-5" />
            <h2 className="text-lg font-bold">{step === 'list' ? 'Chọn ứng viên' : 'Thiết kế Email Campaign'}</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg"><X /></button>
        </div>

        {step === 'list' ? (
          <>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="px-6 py-3 bg-gray-50 border-b flex justify-between items-center sticky top-0 z-10">
                <p className="text-sm text-gray-600 font-medium">Đã chọn: <span className="text-brand-600 font-bold">{selectedIds.size}</span> ứng viên</p>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedIds(new Set(candidates.filter(c => c.email).map(c => c.id)))} className="text-xs px-2 py-1 text-brand-600 hover:bg-brand-50 rounded font-bold transition-colors">Chọn hết</button>
                  <button onClick={() => setSelectedIds(new Set())} className="text-xs px-2 py-1 text-red-500 hover:bg-red-50 rounded font-bold transition-colors">Bỏ hết</button>
                  <button onClick={handleExportExcel} className="text-xs px-2 py-1 bg-green-600 text-white rounded shadow-sm flex items-center gap-1 font-bold italic"><Download size={12}/> Excel</button>
                </div>
              </div>
              <div className="p-4 bg-white border-b">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Thêm email ngoài</label>
                <div className="flex flex-wrap gap-1.5 p-2 border border-gray-100 rounded-xl bg-gray-50/50 min-h-[42px] focus-within:ring-2 ring-brand-500/10 transition-all">
                  {externalEmails.map((e, i) => <EmailChip key={i} email={e} onRemove={() => setExternalEmails(prev => prev.filter((_, idx) => idx !== i))} />)}
                  <input value={emailInput} onChange={e => handleEmailInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleEmailInput(emailInput + ','))} placeholder="Nhập mail ngoài..." className="flex-1 min-w-[150px] bg-transparent outline-none text-sm font-medium" />
                </div>
              </div>
              {loading ? <div className="p-4 space-y-4 shadow-inner">{Array.from({length:6}).map((_,i)=><CandidateSkeleton key={i}/>)}</div> : 
               candidates.map(c => <CandidateItemSelectable key={c.id} candidate={c} isSelected={selectedIds.has(c.id)} onToggle={() => setSelectedIds(prev => { const n = new Set(prev); n.has(c.id) ? n.delete(c.id) : c.email ? n.add(c.id) : toast.error('Thiếu mail'); return n; })} onViewCV={() => handleViewCV(c)} isSigning={signingCvId === c.id} />)
              }
            </div>
            <div className="p-6 bg-gray-50 border-t"><button disabled={totalRecipients === 0} onClick={() => setStep('editor')} className="w-full py-4 bg-brand-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-brand-200">Tiếp tục soạn thảo ({totalRecipients}) <ChevronRight size={18}/></button></div>
          </>
        ) : (
          <div className="flex-1 flex overflow-hidden bg-gray-50">
            {/* --- EDITOR SIDE --- */}
            <div className="w-[420px] shrink-0 border-r flex flex-col bg-white">
              <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                <div className="space-y-4">
                  {user?.role === 'Admin' && (
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Thương hiệu (Admin Mode)</label>
                       <div className="flex bg-gray-100 p-1 rounded-[14px] w-full border border-gray-200/50 shadow-inner">
                         <button onClick={() => setTemplateMode('tdc')} className={`flex-1 p-2.5 rounded-[10px] text-[11px] font-black tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 ${templateMode === 'tdc' ? 'bg-white text-brand-600 shadow-md transform scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}><Layout size={12}/> TD Consulting</button>
                         <button onClick={() => setTemplateMode('tdg')} className={`flex-1 p-2.5 rounded-[10px] text-[11px] font-black tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 ${templateMode === 'tdg' ? 'bg-[#0f0f0f] text-[#F47920] shadow-[0_5px_15px_rgba(244,121,32,0.3)] transform scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}>🎮 TD Games</button>
                       </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-brand-600"><Info size={14} /><span className="text-[10px] font-black uppercase">Cấu hình Gửi Tin</span></div>
                  <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Tên người gửi</label>
                  <div className="relative"><User className="absolute left-3 top-2.5 w-4 h-4 text-gray-300" /><input value={fromName} onChange={e=>setFromName(e.target.value)} className="w-full pl-9 p-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold outline-none"/></div></div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">
                      Email gửi {templateMode === 'tdc' ? '(Bắt buộc @tdconsulting.vn)' : '(Bắt buộc @tdgamestudio.com)'}
                    </label>
                    <input 
                      value={fromEmail} 
                      onChange={e=>setFromEmail(e.target.value)} 
                      className={`w-full p-2.5 bg-gray-50 border-none rounded-xl text-sm font-medium outline-none transition-all ${!fromEmail.endsWith(templateMode === 'tdc' ? '@tdconsulting.vn' : '@tdgamestudio.com') ? 'ring-2 ring-red-500/20 text-red-600' : ''}`}
                    />
                    {!fromEmail.endsWith(templateMode === 'tdc' ? '@tdconsulting.vn' : '@tdgamestudio.com') && (
                      <p className="text-[10px] text-red-500 mt-1 font-bold italic">⚠️ Chú ý: Email phải kết thúc bằng {templateMode === 'tdc' ? '@tdconsulting.vn' : '@tdgamestudio.com'}</p>
                    )}
                  </div>
                  <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Reply To</label>
                  <div className="relative"><Reply className="absolute left-3 top-2.5 w-4 h-4 text-gray-300" /><input value={replyTo} onChange={e=>setReplyTo(e.target.value)} className="w-full pl-9 p-2.5 bg-gray-50 border-none rounded-xl text-sm font-medium outline-none"/></div></div>
                  <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Tiêu đề (Subject)</label><input value={subject} onChange={e=>setSubject(e.target.value)} className="w-full p-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold outline-none text-brand-600"/></div>
                </div>
                <hr className="border-gray-100" />
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-gray-400"><Layout size={14} /><span className="text-[10px] font-black uppercase">Nội dung Template</span></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Title 1</label><input value={titleLine1} onChange={e=>setTitleLine1(e.target.value)} className="w-full p-2.5 bg-gray-50 border-none rounded-xl text-xs font-medium outline-none"/></div>
                    <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Title 2</label><input value={titleLine2} onChange={e=>setTitleLine2(e.target.value)} className="w-full p-2.5 bg-gray-50 border-none rounded-xl text-xs font-medium outline-none"/></div>
                  </div>
                  <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Giới thiệu (Intro)</label><textarea value={intro} onChange={e=>setIntro(e.target.value)} rows={4} className="w-full p-2.5 bg-gray-50 border-none rounded-xl text-xs font-medium outline-none resize-none leading-relaxed"/></div>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Yêu cầu (Mỗi dòng 1 ý)</label>
                      <textarea value={requirement} onChange={e=>setRequirement(e.target.value)} rows={4} className="w-full p-2.5 bg-gray-50 border-none rounded-xl text-xs font-medium outline-none resize-y leading-relaxed custom-scrollbar"/>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Trách nhiệm (Mỗi dòng 1 ý)</label>
                      <textarea value={responsibility} onChange={e=>setResponsibility(e.target.value)} rows={4} className="w-full p-2.5 bg-gray-50 border-none rounded-xl text-xs font-medium outline-none resize-y leading-relaxed custom-scrollbar"/>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Lộ trình</label><input value={careerPath} onChange={e=>setCareerPath(e.target.value)} className="w-full p-2.5 bg-gray-50 border-none rounded-xl text-xs font-medium outline-none"/></div>
                    <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Đãi ngộ</label><input value={compensation} onChange={e=>setCompensation(e.target.value)} className="w-full p-2.5 bg-gray-50 border-none rounded-xl text-xs font-medium outline-none"/></div>
                  </div>
                  {templateMode === 'tdg' && (
                    <div className="pt-4 border-t border-gray-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-widest block italic text-[#F47920]">Tại sao chọn TD Games?</label>
                        <button onClick={() => setWhyJoinUs([...whyJoinUs, {title: '', content: ''}])} className="text-[10px] text-[#F47920] font-bold hover:underline">+ Thêm lý do</button>
                      </div>
                      {whyJoinUs.map((item, idx) => (
                        <div key={idx} className="space-y-2 p-3 bg-gray-50 rounded-xl relative group">
                          <button onClick={() => setWhyJoinUs(whyJoinUs.filter((_, i) => i !== idx))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                          <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Tiêu đề {idx + 1}</label>
                            <input value={item.title} onChange={e => { const updated = [...whyJoinUs]; updated[idx].title = e.target.value; setWhyJoinUs(updated); }} className="w-full p-2 bg-white border border-gray-100 rounded-lg text-xs font-bold outline-none text-[#F47920]"/>
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Nội dung</label>
                            <textarea value={item.content} rows={2} onChange={e => { const updated = [...whyJoinUs]; updated[idx].content = e.target.value; setWhyJoinUs(updated); }} className="w-full p-2 bg-white border border-gray-100 rounded-lg text-xs font-medium outline-none resize-y leading-relaxed"/>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {templateMode === 'tdc' && (
                    <div className="pt-4 border-t border-gray-100 space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest block italic text-brand-600">Thông tin Recruiter (trong Chữ ký)</label>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Tên hiển thị</label>
                        <input value={recruiterName} onChange={e=>setRecruiterName(e.target.value)} className="w-full p-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold outline-none"/>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Email liên hệ</label>
                          <input value={recruiterEmail} onChange={e=>setRecruiterEmail(e.target.value)} className="w-full p-2.5 bg-gray-50 border-none rounded-xl text-xs font-medium outline-none"/>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">SĐT liên hệ</label>
                          <input value={recruiterPhone} onChange={e=>setRecruiterPhone(e.target.value)} className="w-full p-2.5 bg-gray-50 border-none rounded-xl text-xs font-medium outline-none"/>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6 bg-white border-t"><button disabled={sending} onClick={() => setShowConfirm(true)} className="w-full py-4 bg-brand-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-brand-700 shadow-xl shadow-brand-200 transition-all flex items-center justify-center gap-2">{sending ? <Loader2 className="animate-spin w-5 h-5"/> : <Send size={16}/>}{sending ? 'Đang gửi...' : `Khởi chạy Campaign (${totalRecipients})`}</button></div>
            </div>

            <ConfirmModal 
              open={showConfirm} 
              onClose={() => setShowConfirm(false)} 
              onConfirm={handleSendEmail}
              title="Xác nhận khởi chạy Campaign"
              message={`Hệ thống sẽ gửi email tuyển dụng tới ${totalRecipients} ứng viên đã chọn. Bạn đã kiểm tra kỹ nội dung và email gửi (${templateMode === 'tdc' ? '@tdconsulting.vn' : '@tdgamestudio.com'}) chưa?`}
              confirmText="Xác nhận gửi ngay"
              cancelText="Để mình xem lại"
              variant="success"
              isLoading={sending}
            />

            {/* --- PREVIEW SIDE --- */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
              <div className="px-6 py-4 bg-white border-b flex items-center justify-between shadow-sm z-30 shrink-0">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2"><Eye size={14}/> Preview Studio</span>
                <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                  <button onClick={() => setPreviewDevice('desktop')} className={`p-1.5 px-3 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${previewDevice === 'desktop' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-400'}`}><Monitor size={14} /> Desktop</button>
                  <button onClick={() => setPreviewDevice('mobile')} className={`p-1.5 px-3 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${previewDevice === 'mobile' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-400'}`}><Smartphone size={14} /> Mobile</button>
                </div>
              </div>

              {/* Scroll Container */}
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8f9fb] p-6 lg:p-12 flex flex-col items-center">
                
                {/* --- MOBILE MODE --- */}
                {previewDevice === 'mobile' && (
                  <div className="relative py-10 shrink-0">
                     <div className="scale-[0.8] lg:scale-[1] origin-top">
                        <div className="w-[375px] h-[780px] rounded-[3.5rem] p-3 border-12 border-gray-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] bg-white overflow-hidden relative flex flex-col">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-40 flex items-center justify-center"><div className="w-10 h-1 bg-gray-800 rounded-full" /></div>
                            <div className="flex-1 overflow-y-auto hide-scrollbar rounded-[2.5rem] bg-white flex flex-col relative text-left">
                                <InboxHeader subject={subject} fromName={fromName} fromEmail={fromEmail} replyTo={replyTo} />
                                <div className="flex-1 bg-white">
                                    <iframe srcDoc={getPreviewHtml()} scrolling="yes" className="w-full h-full border-none min-h-[1200px]" />
                                </div>
                            </div>
                        </div>
                     </div>
                  </div>
                )}

                {/* --- DESKTOP MODE --- */}
                {previewDevice === 'desktop' && (
                  <div className="w-full max-w-[760px] flex flex-col shrink-0 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] rounded-2xl overflow-hidden border border-gray-100">
                       <InboxHeader subject={subject} fromName={fromName} fromEmail={fromEmail} replyTo={replyTo} />
                       <div className="w-full bg-white">
                          <iframe srcDoc={getPreviewHtml()} scrolling="no" className="w-full border-none" 
                          style={{ height: 'auto', minHeight: '1300px' }} 
                          onLoad={(e) => {
                             const frame = e.currentTarget;
                             const updateHeight = () => {
                               if (frame.contentWindow?.document.body) {
                                 frame.style.height = frame.contentWindow.document.body.scrollHeight + 'px';
                               }
                             };
                             updateHeight();
                             setTimeout(updateHeight, 500); 
                          }}/>
                       </div>
                    </div>
                  </div>
                )}
                
                <div className="h-20 shrink-0 w-full" /> {/* Outer Spacer */}
              </div>
            </div>
          </div>
        )}

        <style dangerouslySetInnerHTML={{ __html: `
          .custom-scrollbar::-webkit-scrollbar { width: 8px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; border: 2px solid #f8f9fb; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}} />
      </div>
    </div>
  );
};

const InboxHeader = ({ subject, fromName, fromEmail, replyTo }: any) => (
  <div className="p-6 bg-white border-b border-gray-50 shrink-0 text-left">
    <h3 className="text-xl font-bold text-[#1a1c1e] mb-4 leading-tight tracking-tight">{subject || '(Thiếu tiêu đề)'}</h3>
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-full bg-[#f4f6f8] flex items-center justify-center shrink-0 border border-gray-100 text-[#dd0067] font-bold uppercase text-xs">
        {fromName?.charAt(0) || 'D'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm text-[#1a1c1e] leading-none">{fromName}</span>
          <span className="text-[11px] text-[#5f6368] truncate">&lt;{fromEmail}&gt;</span>
        </div>
        <div className="flex items-center text-[11px] text-[#5f6368] mt-1.5">
          <span>tới tôi</span>
          <div className="w-0.5 h-0.5 rounded-full bg-gray-300 mx-1.5" />
          <span className="italic opacity-80">Phản hồi qua: {replyTo}</span>
        </div>
      </div>
      <div className="text-[10px] text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded">Mã hóa TLS</div>
    </div>
  </div>
);

export default MatchingCandidatesModal;
