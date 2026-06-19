import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Eye, FileText, Briefcase, User, Clock, Search, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../auth/store';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';
import {
  fetchResearchQueue,
  approveQueueItem,
  rejectQueueItem,
  toQueueStatus,
  type ResearchQueueItem,
  type ResearchQueueStatus,
} from '../api';
import { ProcessStatusModal } from '../../processes/components/ProcessStatusModal';
import { ProcessHistoryModal } from '../../processes/components/ProcessHistoryModal';
import { STATUS_CONFIG } from '../../processes/constants';
import type { ProcessStatus } from '../../processes/types';

// ─── DETAIL MODAL ─────────────────────────────────────────────────────────────
function DetailModal({ item, onClose }: { item: ResearchQueueItem; onClose: () => void }) {
  const status = toQueueStatus(item.process_status);
  const badgeCls = {
    PENDING_REVIEW: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
  }[status];
  const badgeLabel = { PENDING_REVIEW: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối' }[status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Chi tiết CV</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XCircle size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Trạng thái</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeCls}`}>{badgeLabel}</span>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 space-y-1">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Ứng viên</p>
            <p className="font-semibold text-gray-900">{item.candidate_name}</p>
            {item.candidate_email && <p className="text-sm text-gray-600">{item.candidate_email}</p>}
            {item.candidate_phone && <p className="text-sm text-gray-600">{item.candidate_phone}</p>}
            {item.candidate_cv_link ? (
              <a href={item.candidate_cv_link} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-1">
                <FileText size={14} /> Xem CV
              </a>
            ) : (
              <span className="inline-flex items-center gap-1 text-sm text-yellow-600 mt-1">
                <AlertCircle size={14} /> Chưa có CV
              </span>
            )}
          </div>
          <div className="bg-gray-50 rounded-lg p-4 space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vị trí</p>
            <div className="flex items-center gap-2 flex-wrap">
              {item.job_code && (
                <span className="text-xs font-mono font-semibold text-brand-600">[{item.job_code}]</span>
              )}
              <a
                href={`/jobs/${item.job_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-gray-900 hover:text-brand-600 hover:underline"
              >
                {item.job_position_title}
              </a>
            </div>
            <p className="text-sm text-gray-600">{item.job_client_name}</p>
          </div>
          {item.application_reason && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Lý do giới thiệu</p>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg leading-relaxed">{item.application_reason}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-gray-400">Researcher</p><p className="font-medium text-gray-800">{item.created_by_name}</p></div>
            <div><p className="text-xs text-pink-400">Assigned to</p><p className="font-medium text-gray-800">{item.owner_name}</p><p className="text-xs text-gray-500">{item.owner_role}</p></div>
            <div><p className="text-xs text-gray-400">Ngày gửi</p><p className="font-medium text-gray-800">{new Date(item.created_at).toLocaleDateString('vi-VN')}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────


export function ResearchQueuePage() {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<ResearchQueueStatus | 'ALL'>('PENDING_REVIEW');
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<ResearchQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailTarget, setDetailTarget] = useState<ResearchQueueItem | null>(null);
  const [approveTarget, setApproveTarget] = useState<ResearchQueueItem | null>(null);
  const [rejectModalTarget, setRejectModalTarget] = useState<ResearchQueueItem | null>(null);
  const [historyProcessId, setHistoryProcessId] = useState<string | null>(null);
  /** Process được highlight khi vào từ ?candidate= (Discord / link ngoài). */
  const [deeplinkHighlightProcessId, setDeeplinkHighlightProcessId] = useState<string | null>(null);

  const effectiveRole = user?.role ?? 'Admin';
  const effectiveUserId = user?.id ?? '';

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const result = await fetchResearchQueue(effectiveUserId, effectiveRole as string);
      setData(result);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [user?.id, effectiveRole, effectiveUserId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Mở đúng CV khi vào từ link Discord: /research/queue?candidate=<uuid> — tab Tất cả + highlight card
  useEffect(() => {
    const cand = searchParams.get('candidate')?.trim();
    if (!cand || data.length === 0) return;
    const hit = data.find(i => i.candidate_id === cand);
    if (!hit) {
      toast.error('Không tìm thấy CV trong queue (đã xử lý hoặc không thuộc danh sách của bạn).');
      setSearchParams({}, { replace: true });
      return;
    }
    setSearchQuery('');
    setStatusFilter('ALL');
    setDeeplinkHighlightProcessId(hit.id);
    setSearchParams({}, { replace: true });
  }, [data, searchParams, setSearchParams]);

  // Bỏ viền highlight sau vài giây (card vẫn đã được scroll vào giữa màn hình)
  useEffect(() => {
    if (!deeplinkHighlightProcessId) return;
    const t = window.setTimeout(() => setDeeplinkHighlightProcessId(null), 12000);
    return () => window.clearTimeout(t);
  }, [deeplinkHighlightProcessId]);

  // Scroll tới card vừa highlight (sau khi DOM render tab Tất cả)
  useEffect(() => {
    if (!deeplinkHighlightProcessId || loading) return;
    const t = window.setTimeout(() => {
      document
        .getElementById(`research-queue-card-${deeplinkHighlightProcessId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
    return () => window.clearTimeout(t);
  }, [deeplinkHighlightProcessId, loading, statusFilter, data.length]);

  // ── Realtime subscription ──────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('research_queue_processes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'processes' }, () => {
        loadData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  // ── Counts ─────────────────────────────────────────────────────────────────
  const counts = {
    PENDING_REVIEW: data.filter(d => toQueueStatus(d.process_status) === 'PENDING_REVIEW').length,
    APPROVED:       data.filter(d => toQueueStatus(d.process_status) === 'APPROVED').length,
    REJECTED:       data.filter(d => toQueueStatus(d.process_status) === 'REJECTED').length,
    ALL:            data.length,
  };

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = data
    .filter(item => statusFilter === 'ALL' || toQueueStatus(item.process_status) === statusFilter)
    .filter(item => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.candidate_name.toLowerCase().includes(q) ||
        (item.candidate_email ?? '').toLowerCase().includes(q) ||
        item.job_position_title.toLowerCase().includes(q) ||
        item.job_client_name.toLowerCase().includes(q) ||
        item.owner_name.toLowerCase().includes(q) ||
        item.created_by_name.toLowerCase().includes(q)
      );
    });

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleApprove = async (data: { note: string; brief: string; interviewDate?: string; interviewTime?: string; onboardingDate?: string; file?: File }) => {
    if (!approveTarget) return;
    try {
      await approveQueueItem(approveTarget.id, { note: data.note, brief: data.brief });
      setApproveTarget(null);
      toast.success('CV đã được duyệt và gửi cho client!');
      loadData();
    } catch {
      toast.error('Không thể duyệt CV');
    }
  };

  const handleRejectViaModal = async (data: { note: string; brief: string }) => {
    if (!rejectModalTarget) return;
    try {
      await rejectQueueItem(rejectModalTarget.id, { note: data.note, brief: data.brief });
      setRejectModalTarget(null);
      toast.success('CV đã bị từ chối.');
      loadData();
    } catch {
      toast.error('Không thể từ chối CV');
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatTime = (dateString: string) => {
    const diffMins = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} giờ trước`;
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (processStatus: string) => {
    const q = toQueueStatus(processStatus);

    // Chờ duyệt / Từ chối → badge đơn giản
    if (q === 'PENDING_REVIEW') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock size={12} className="mr-1" />Chờ duyệt</span>;
    }
    if (q === 'REJECTED') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle size={12} className="mr-1" />Từ chối</span>;
    }

    // Đã duyệt → hiển thị status thực tế từ STATUS_CONFIG
    const cfg = STATUS_CONFIG[processStatus as ProcessStatus];
    if (cfg) {
      const Icon = cfg.icon;
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.main} text-white`}>
          <Icon size={11} />
          {cfg.displayName}
        </span>
      );
    }
    // Fallback
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={12} className="mr-1" />Đã duyệt</span>;
  };

  const canApproveReject = effectiveRole === 'Headhunter' || effectiveRole === 'HH Lead' || effectiveRole === 'Admin';

  const TAB_CONFIG: { key: ResearchQueueStatus | 'ALL'; label: string; activeClass: string }[] = [
    { key: 'PENDING_REVIEW', label: 'Chờ duyệt', activeClass: 'bg-yellow-500 text-white' },
    { key: 'APPROVED',       label: 'Đã duyệt',  activeClass: 'bg-green-500 text-white' },
    { key: 'REJECTED',       label: 'Từ chối',   activeClass: 'bg-red-500 text-white' },
    { key: 'ALL',            label: 'Tất cả',    activeClass: 'bg-blue-500 text-white' },
  ];

  return (
    <div className="p-6 space-y-6">
      {detailTarget && <DetailModal item={detailTarget} onClose={() => setDetailTarget(null)} />}
      {approveTarget && (
        <ProcessStatusModal
          isOpen={true}
          onClose={() => setApproveTarget(null)}
          onConfirm={handleApprove}
          newStatus={'CV_SUBMITTED_TO_CLIENT' as ProcessStatus}
          candidateName={approveTarget.candidate_name}
          positionTitle={approveTarget.job_position_title}
          clientPortalUserCount={0}
          candidateEvaluationFilePath={approveTarget.evaluation_file_path || undefined}
          currentBrief={approveTarget.evaluation_brief || ''}
        />
      )}
      {rejectModalTarget && (
        <ProcessStatusModal
          isOpen={true}
          onClose={() => setRejectModalTarget(null)}
          onConfirm={handleRejectViaModal}
          newStatus={'REJECT_BY_ADMIN' as ProcessStatus}
          candidateName={rejectModalTarget.candidate_name}
          positionTitle={rejectModalTarget.job_position_title}
          clientPortalUserCount={0}
          candidateEvaluationFilePath={rejectModalTarget.evaluation_file_path || undefined}
          currentBrief={rejectModalTarget.evaluation_brief || ''}
        />
      )}
      <ProcessHistoryModal
        isOpen={!!historyProcessId}
        onClose={() => setHistoryProcessId(null)}
        processId={historyProcessId ?? ''}
      />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Research Queue</h1>
          <p className="text-sm text-gray-500 mt-1">
            {effectiveRole === 'Researcher' ? 'CV bạn đã gửi và trạng thái duyệt'
              : effectiveRole === 'Headhunter' || effectiveRole === 'HH Lead' ? 'CV từ Researcher được gán cho bạn'
              : 'Tất cả CV từ Researcher'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Stats */}
          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full font-medium">{counts.PENDING_REVIEW} chờ duyệt</span>
            <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full font-medium">{counts.APPROVED} đã duyệt</span>
            <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full font-medium">{counts.REJECTED} từ chối</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-3">
        <div className="flex flex-wrap gap-2">
          {TAB_CONFIG.map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                statusFilter === tab.key ? tab.activeClass : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label} ({counts[tab.key]})
            </button>
          ))}
        </div>
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm ứng viên, job, client, HH..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-sm">Không có CV nào phù hợp</p>
          </div>
        ) : (
          filtered.map(item => {
            const qStatus = toQueueStatus(item.process_status);
            return (
              <div
                key={item.id}
                id={`research-queue-card-${item.id}`}
                className={`rounded-lg border shadow-sm transition p-5 ${
                  item.id === deeplinkHighlightProcessId
                    ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-300 animate-pulse-highlight'
                    : `bg-white hover:shadow-md ${
                        qStatus === 'REJECTED' ? 'border-red-100' :
                        qStatus === 'APPROVED' ? 'border-green-100' : 'border-gray-200'
                      }`
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3 min-w-0">
                    {/* Candidate */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <User size={18} className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className="font-semibold text-gray-900 cursor-pointer hover:text-brand-600 hover:underline"
                            onClick={() => setDetailTarget(item)}
                          >
                            {item.candidate_name}
                          </h3>
                          {!item.candidate_cv_link && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700">
                              <AlertCircle size={11} /> Chưa có CV
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{item.candidate_email} {item.candidate_phone ? `• ${item.candidate_phone}` : ''}</p>
                      </div>
                    </div>
                    {/* Job */}
                    <div className="flex items-center gap-2 pl-13 text-sm flex-wrap">
                      <Briefcase size={14} className="text-gray-400 shrink-0" />
                      <a
                        href={`/jobs/${item.job_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-gray-800 hover:text-brand-600 hover:underline"
                      >
                        {item.job_code ? `${item.job_code} · ` : ''}{item.job_position_title}
                      </a>
                      <span className="text-gray-300">|</span>
                      {item.job_client_id ? (
                        <a
                          href={`/tables/clients/new/${item.job_client_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-brand-600 hover:underline"
                        >
                          {item.job_client_name}
                        </a>
                      ) : (
                        <span className="text-gray-500">{item.job_client_name}</span>
                      )}
                    </div>
                    {/* Reason */}
                    {item.application_reason && (
                      <div className="pl-13">
                        <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg line-clamp-2 leading-relaxed">
                          {item.application_reason}
                        </p>
                      </div>
                    )}
                    {/* Meta */}
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 pl-13 text-xs text-gray-500">
                      <span><span className="font-medium text-gray-700">Researcher:</span> {item.created_by_name}</span>
                      <span className={user?.id === item.owner_id ? "bg-pink-50 text-pink-700 px-2 py-0.5 rounded border border-pink-200 font-medium -ml-2" : ""}>
                        <span className={`font-medium ${user?.id === item.owner_id ? 'text-pink-800' : 'text-gray-700'}`}>Assigned to:</span> {item.owner_name} <span className={user?.id === item.owner_id ? 'text-pink-600' : 'text-gray-400'}>({item.owner_role})</span>
                      </span>
                      <span>{formatTime(item.created_at)}</span>
                    </div>
                  </div>

                  {/* Right */}
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    {getStatusBadge(item.process_status)}
                    <div className="flex items-center gap-1">
                      {/* View CV — tạo signed URL từ Supabase storage */}
                      {item.candidate_cv_link ? (
                        <button
                          onClick={async () => {
                            try {
                              const path = item.candidate_cv_link!;
                              if (path.startsWith('http')) {
                                window.open(path, '_blank');
                                return;
                              }
                              const { data, error } = await supabase.storage
                                .from('cv')
                                .createSignedUrl(path.replace(/^cv\//, ''), 60 * 60);
                              if (error || !data?.signedUrl) {
                                toast.error('Không thể mở CV');
                                return;
                              }
                              window.open(data.signedUrl, '_blank');
                            } catch {
                              toast.error('Không thể mở CV');
                            }
                          }}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Xem CV"
                        >
                          <FileText size={17} />
                        </button>
                      ) : (
                        <span className="p-2 text-gray-300 cursor-not-allowed" title="Chưa có CV">
                          <FileText size={17} />
                        </span>
                      )}
                      {/* History modal */}
                      <button
                        onClick={() => setHistoryProcessId(item.id)}
                        className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                        title="Xem lịch sử process"
                      >
                        <Eye size={17} />
                      </button>
                      {canApproveReject && qStatus === 'PENDING_REVIEW' && (
                        <>
                          <button onClick={() => setApproveTarget(item)}
                            className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition" title="Duyệt CV">
                            <CheckCircle size={17} />
                          </button>
                          <button onClick={() => setRejectModalTarget(item)}
                            className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Từ chối">
                            <XCircle size={17} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
