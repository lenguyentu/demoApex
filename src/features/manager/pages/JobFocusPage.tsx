import { useState, useMemo } from 'react';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, UserPlus, Briefcase, TrendingUp, Clock, AlertTriangle, Target, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, FileText, Mic, Rocket, Leaf, Phone, CalendarDays, Flag, History, MessageCircle } from 'lucide-react';
import PageMeta from '../../../components/common/PageMeta';
import AssignJobFocusModal from '../components/AssignJobFocusModal';
import { useAuthStore } from '../../auth/store';
import { PERMISSIONS, ROLES } from '../../auth/constants';
import {useJobFocusWithDetails, useCurrentWeekStart, useJobFocusPipelineStats, useWeeklyCvToDb, usePipelineStageDetail, useJobFocusByJobIds } from '../hooks';
import { JobCard, IntroduceCandidateModal } from '../../jobs/components';
import { useProcessesList } from '../../processes/hooks';
import { updateProcess } from '../../processes/api';
import { StatusSelect } from '../../processes/components/StatusSelect';
import { ProcessStatusModal } from '../../processes/components/ProcessStatusModal';
import { ProcessHistoryModal } from '../../processes/components/ProcessHistoryModal';
import { ProcessCommentModal } from '../../processes/components/ProcessCommentModal';
import type { Process, ProcessStatus } from '../../processes/types';
import toast from 'react-hot-toast';
import type { Job } from '../../jobs/types';
import type { JobFocusWithDetails, JobPipelineStats, PipelineStageDetail, PipelineStageCandidate } from '../types';
import { supabase } from '../../../lib/supabase';

// ─── Milestone config (kept for reference) ───────────────────────────────────

// Tính milestone từ process_history:
// Mỗi milestone = tính từ ngày đạt phase tương ứng + targetDays → còn X ngày
interface MilestoneResult {
  key: string;
  label: string;
  icon: React.ReactNode;
  hint: string;        // mô tả việc cần làm
  targetDays: number;
  phaseDate: Date | null;
  daysRemaining: number | null;
  status: 'not_reached' | 'upcoming' | 'due_soon' | 'overdue' | 'done';
}

function calcMilestones(processes: Process[]): MilestoneResult[] {
  const getPhaseDate = (statuses: string[]): Date | null => {
    let earliest: Date | null = null;
    for (const p of processes) {
      if (statuses.includes(p.process_status || '')) {
        const d = new Date(p.updated_at || p.created_at);
        if (!earliest || d < earliest) earliest = d;
      }
    }
    return earliest;
  };

  const cvDate    = getPhaseDate(['CV_SUBMITTED_TO_CLIENT']);
  const intDate   = getPhaseDate(['INTERVIEW_SCHEDULED_1ST','INTERVIEW_COMPLETED_1ST','INTERVIEW_SCHEDULED_2ND','INTERVIEW_COMPLETED_2ND','INTERVIEW_SCHEDULED_FINAL','INTERVIEW_COMPLETED_FINAL','TEST_ASSIGNED','TEST_COMPLETED']);
  const offerDate = getPhaseDate(['OFFER_ACCEPTED_BY_CANDIDATE','OFFER_EXTENDED']);

  // onboarding_date từ field thực tế trong process (ngày UV đi làm)
  const onboardingDateStr = processes.find(p => p.onboarding_date)?.onboarding_date;
  const onbDate = onboardingDateStr ? new Date(onboardingDateStr) : null;

  const now = Date.now();

  const calc = (
    phaseDate: Date | null,
    targetDays: number,
    nextPhaseDate?: Date | null
  ): Pick<MilestoneResult, 'phaseDate' | 'daysRemaining' | 'status'> => {
    if (!phaseDate) return { phaseDate: null, daysRemaining: null, status: 'not_reached' };
    if (nextPhaseDate) return { phaseDate, daysRemaining: null, status: 'done' };
    const deadline = phaseDate.getTime() + targetDays * 86400000;
    const remaining = Math.ceil((deadline - now) / 86400000);
    const status = remaining < 0 ? 'overdue'
      : remaining <= 1 ? 'due_soon'
      : 'upcoming';
    return { phaseDate, daysRemaining: remaining, status };
  };

  // Pre-Onboard: tính từ onboarding_date - 1 ngày (nhắc ago 1 ngày đi làm)
  // Nếu chưa có onboarding_date → tính từ offer date + 1 ngày (fallback)
  const preOnboardBase = onbDate
    ? new Date(onbDate.getTime() - 1 * 86400000)  // onboarding_date - 1 ngày
    : offerDate;

  // Day-1/7/30/60: tính từ onboarding_date thực tế
  // Mỗi milestone active khi đã qua milestone ago (dùng daysSinceOnboard)
  const daysSinceOnboard = onbDate
    ? Math.floor((now - onbDate.getTime()) / 86400000)
    : null;

  const calcFollowUp = (targetDays: number): Pick<MilestoneResult, 'phaseDate' | 'daysRemaining' | 'status'> => {
    if (!onbDate) return { phaseDate: null, daysRemaining: null, status: 'not_reached' };
    // Chỉ active khi đã qua milestone ago (targetDays - 1 ngày)
    if (daysSinceOnboard! < targetDays - 1) return { phaseDate: onbDate, daysRemaining: null, status: 'not_reached' };
    const deadline = onbDate.getTime() + targetDays * 86400000;
    const remaining = Math.ceil((deadline - now) / 86400000);
    if (remaining < -2) return { phaseDate: onbDate, daysRemaining: null, status: 'done' }; // đã qua lâu → ẩn
    const status = remaining < 0 ? 'overdue' : remaining <= 1 ? 'due_soon' : 'upcoming';
    return { phaseDate: onbDate, daysRemaining: remaining, status };
  };

  return [
    { key: 'cv_submitted', icon: <FileText size={10} />,     label: 'Client Follow-up - CV',       hint: '📋 Follow KH lấy feedback về CV đã gửi.\nNếu KH chưa phản hồi sau 5 ngày → escalate lên lead.',  targetDays: 5,  ...calc(cvDate, 5, intDate) },
    { key: 'interview',    icon: <Mic size={10} />,          label: 'Client Follow-up - Interview', hint: '🎤 Follow KH lấy kết quả phỏng vấn.\nNếu KH delay → nhắc nhở nhẹ nhàng 1 lần/ngày.',            targetDays: 5,  ...calc(intDate, 5, offerDate) },
    { key: 'pre_onboard',  icon: <Rocket size={10} />,       label: 'Pre-Onboard',           hint: '🚀 Call/message candidate to confirm first day tomorrow.\nAsk about location, time, preparation.',                  targetDays: 0,  ...calc(preOnboardBase, 0, onbDate) },
    { key: 'day1',         icon: <Leaf size={10} />,         label: 'Day-1 Follow',          hint: '🌱 Check in with candidate after first day.\nFeedback on team and environment.',                           targetDays: 1,  ...calcFollowUp(1) },
    { key: 'day7',         icon: <Phone size={10} />,        label: '7-day Follow',          hint: '📞 Check in after 1 week.\nAny issues? Client feedback?',                        targetDays: 7,  ...calcFollowUp(7) },
    { key: 'day30',        icon: <CalendarDays size={10} />, label: '30-day Follow',         hint: '📅 Check in after 1 month.\nAdaptation? Expectations vs reality.',                            targetDays: 30, ...calcFollowUp(30) },
    { key: 'day60',        icon: <Flag size={10} />,         label: '60-day Follow',         hint: '🏁 Check in at the end of warranty.\nStill employed? If not → activate warranty.',      targetDays: 60, ...calcFollowUp(60) },
  ];
}

// Tính milestone cho 1 process đơn lẻ dựa trên status + updated_at của nó
function calcMilestoneForProcess(process: Process): MilestoneResult | null {
  const status = process.process_status || '';
  const updatedAt = process.updated_at ? new Date(process.updated_at) : null;
  const onbDate = process.onboarding_date ? new Date(process.onboarding_date) : null;
  const now = Date.now();

  const calcRemaining = (baseDate: Date | null, targetDays: number) => {
    if (!baseDate) return null;
    const deadline = baseDate.getTime() + targetDays * 86400000;
    return Math.ceil((deadline - now) / 86400000);
  };

  const toStatus = (remaining: number | null): MilestoneResult['status'] => {
    if (remaining === null) return 'not_reached';
    if (remaining < 0) return 'overdue';
    if (remaining <= 1) return 'due_soon';
    return 'upcoming';
  };

  // CV Submitted → follow KH trong 5 ngày
  if (status === 'CV_SUBMITTED_TO_CLIENT') {
    const r = calcRemaining(updatedAt, 5);
    return { key: 'cv_submitted', icon: <FileText size={10} />, label: 'Client Follow-up - CV',
      hint: '📋 Follow up with client for CV feedback.\nEscalate to lead if no response after 5 days.',
      targetDays: 5, phaseDate: updatedAt, daysRemaining: r, status: toStatus(r) };
  }

  // Interview → follow KH trong 5 ngày
  if (['INTERVIEW_SCHEDULED_1ST','INTERVIEW_COMPLETED_1ST','INTERVIEW_SCHEDULED_2ND',
       'INTERVIEW_COMPLETED_2ND','INTERVIEW_SCHEDULED_FINAL','INTERVIEW_COMPLETED_FINAL',
       'TEST_ASSIGNED','TEST_COMPLETED'].includes(status)) {
    const r = calcRemaining(updatedAt, 5);
    return { key: 'interview', icon: <Mic size={10} />, label: 'Client Follow-up - Interview',
      hint: '🎤 Follow up with client for interview results.\nRemind once a day if delayed.',
      targetDays: 5, phaseDate: updatedAt, daysRemaining: r, status: toStatus(r) };
  }

  // Offer → Pre-Onboard: nhắc UV ago 1 ngày onboarding_date
  if (['OFFER_EXTENDED','OFFER_ACCEPTED_BY_CANDIDATE'].includes(status)) {
    const preOnbBase = onbDate ? new Date(onbDate.getTime() - 86400000) : updatedAt;
    const r = calcRemaining(preOnbBase, 0);
    return { key: 'pre_onboard', icon: <Rocket size={10} />, label: 'Pre-Onboard',
      hint: '🚀 Call/message candidate to confirm first day tomorrow.\nAsk about location, time, preparation.',
      targetDays: 1, phaseDate: preOnbBase, daysRemaining: r, status: toStatus(r) };
  }

  // Onboarding → Day-1/7/30/60 follow
  if (['ONBOARDING','PLACEMENT_CONFIRMED'].includes(status) && onbDate) {
    const daysSince = Math.floor((now - onbDate.getTime()) / 86400000);
    void daysSince; // used implicitly via calcRemaining
    // Tìm milestone phù hợp nhất
    const followUps = [
      { key: 'day1', icon: <Leaf size={10} />, label: 'Day-1 Follow', hint: '🌱 Check in with candidate after first day.\nFeedback on team and environment.', targetDays: 1 },
      { key: 'day7', icon: <Phone size={10} />, label: '7-day Follow', hint: '📞 Check in after 1 week.\nAny issues? Client feedback?', targetDays: 7 },
      { key: 'day30', icon: <CalendarDays size={10} />, label: '30-day Follow', hint: '📅 Check in after 1 month.\nAdaptation? Expectations vs reality.', targetDays: 30 },
      { key: 'day60', icon: <Flag size={10} />, label: '60-day Follow', hint: '🏁 Check in at the end of warranty.\nStill employed? If not → activate warranty.', targetDays: 60 },
    ];
    // Lấy milestone gần nhất chưa quá 2 ngày
    for (const f of followUps) {
      const r = calcRemaining(onbDate, f.targetDays);
      if (r !== null && r >= -2) {
        return { ...f, phaseDate: onbDate, daysRemaining: r, status: toStatus(r) };
      }
    }
  }

  return null;
}
function JobFocusRow({
  job,
  assigneeId,
}: {
  job: JobFocusWithDetails;
  assigneeId: string;
}) {
  const [introduceJob, setIntroduceJob] = useState<Job | null>(null);
  const [statusModalData, setStatusModalData] = useState<{
    processId: string; newStatus: ProcessStatus;
    candidateName: string; positionTitle: string;
    clientPortalUserCount?: number; candidateEvaluationFilePath?: string; currentBrief?: string;
  } | null>(null);
  const [historyProcessId, setHistoryProcessId] = useState<string | null>(null);
  const [commentProcessId, setCommentProcessId] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // NOTE: Processes KHÔNG filter theo week
  // - Hiển thị TẤT CẢ processes của job này (owner = assignee)
  // - Lý do: Cần tracking đầy đủ pipeline cho báo cáo và milestone
  // - VD: CV submit week ago vẫn cần hiện để theo dõi tiến độ interview
  // - Nếu cần filter theo week, thêm dateFrom/dateTo vào useProcessesList
  // ─────────────────────────────────────────────────────────────────────────────
  let { data: processPages, refetch: refetchProcesses } = useProcessesList({
    jobIdFilter: job.job_id,
    ownerIdFilter: assigneeId,
  });
  let processes = processPages?.pages.flatMap(p => p.data) ?? [];
  
  if (import.meta.env.DEV && processes.length === 0) {
    processes = [
      {
        id: 'mock-process-1',
        process_status: 'CV_SUBMITTED_TO_CLIENT',
        candidate: { name: 'Alice Nguyen', email: 'alice@example.com', cv_link: 'http://example.com/cv.pdf' },
        updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: 'mock-process-2',
        process_status: 'INTERVIEW_SCHEDULED_1ST',
        candidate: { name: 'Bob Tran', email: 'bob@example.com' },
        updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      }
    ] as any;
  }

  // Milestone tính từ phase date + target days
  const milestones = calcMilestones(processes);

  const handleStatusChange = (process: Process, newStatus: ProcessStatus) => {
    setStatusModalData({
      processId: process.id,
      newStatus,
      candidateName: process.candidate?.name || 'Candidate',
      positionTitle: process.job?.position_title || job.position_title || 'Job',
      clientPortalUserCount: process.client_portal_user_count,
      candidateEvaluationFilePath: process.candidate?.evaluation_file_path || undefined,
      currentBrief: process.evaluation_brief || '',
    });
  };

  const handleConfirmStatus = async ({ note, brief, onboardingDate }: any) => {
    if (!statusModalData) return;
    try {
      await updateProcess(statusModalData.processId, {
        process_status: statusModalData.newStatus,
        process_note: note,
        evaluation_brief: brief,
        ...(onboardingDate ? { onboarding_date: onboardingDate } : {}),
      });
      toast.success('Status updated successfully');
      setStatusModalData(null);
      refetchProcesses();
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message);
    }
  };

  const jobForCard: Job = {
    id: job.job_id,
    job_id: job.job_code,
    position_title: job.position_title,
    phase: job.phase as any,
    phase_date: job.phase_date,
    headhunt_fee: job.headhunt_fee,
    ctv_fee: job.ctv_fee,
    freelance_fee: job.freelance_fee,
    td_job_category: job.td_job_category as any,
    work_location: job.work_location,
    number_of_employees: job.number_of_employees,
    interview_rounds: job.interview_rounds,
    warranty_period_days: job.warranty_period_days,
    min_monthly_salary: job.min_monthly_salary,
    max_monthly_salary: job.max_monthly_salary,
    created_at: job.created_at,
    clients: job.client_id ? { id: job.client_id, client_name: job.client_name } : null,
  };

  return (
    <div className="flex gap-3">
      {/* LEFT: JobCard */}
      <div className="w-[500px] shrink-0">
        <JobCard job={jobForCard} onIntroduceClick={setIntroduceJob} />
      </div>

      {/* RIGHT: Processes + Milestone tích hợp */}
      <div className="flex-1 min-w-0 bg-white dark:bg-gray-800 rounded-xl border-2 border-pink-200 overflow-hidden">

        {/* ── Thead ── */}
        <div className="flex items-center px-3 py-2 bg-gray-50 dark:bg-gray-700/40 border-b border-pink-100 dark:border-gray-700">
          <div className="w-[22%] min-w-[140px] shrink-0 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Candidate</div>
          <div className="w-[24%] min-w-[160px] shrink-0 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Status</div>
          <div className="w-[28%] min-w-[180px] shrink-0 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Milestone</div>
          <div className="w-[14%] min-w-[80px] shrink-0 text-[10px] font-semibold text-gray-500 uppercase tracking-wide text-center">Update</div>
          <div className="w-[12%] min-w-[80px] flex items-center justify-center gap-0.5 shrink-0 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
            <span className="w-7 text-center">CV</span>
            <span className="w-7 text-center">LS</span>
            <span className="w-7 text-center">Chat</span>
          </div>
        </div>

        {/* ── Process list ── */}
        <div className="overflow-y-auto max-h-56">
          {processes.length === 0 ? (
            /* Empty state: hiển thị milestone ở giữa thay vì để trống */
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-2 text-gray-400">
                <FileText size={16} className="opacity-40" />
                <span className="text-xs">No CVs submitted yet</span>
              </div>
              {/* Milestone vẫn hiển thị dù chưa có CV */}
              {(() => {
                const active = milestones.find(m => m.status === 'overdue' || m.status === 'due_soon' || m.status === 'upcoming');
                if (!active) return null;
                const cls = active.status === 'overdue' ? 'bg-red-50 border-red-200 text-red-700'
                  : active.status === 'due_soon' ? 'bg-yellow-50 border-yellow-300 text-yellow-800'
                  : 'bg-blue-50 border-blue-200 text-blue-700';
                const timeText = active.status === 'overdue' ? `Overdue ${Math.abs(active.daysRemaining!)}d`
                  : active.daysRemaining === 0 ? 'Today' : `${active.daysRemaining}d left`;
                return (
                  <div className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-semibold ${cls}`}>
                    {active.icon}{active.label} · <span className="font-bold">{timeText}</span>
                    <div className="absolute right-0 top-full mt-1 z-50 hidden group-hover:block w-64 bg-gray-900 text-white text-[10px] rounded-lg px-3 py-2 shadow-xl whitespace-pre-line">
                      {active.hint}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-700">
              {processes.map((process) => {
                const daysSinceUpdate = process.updated_at
                  ? Math.floor((Date.now() - new Date(process.updated_at).getTime()) / 86400000)
                  : null;
                const updateColor = daysSinceUpdate === null ? 'text-gray-400'
                  : daysSinceUpdate === 0 ? 'text-green-600'
                  : daysSinceUpdate <= 2 ? 'text-blue-500'
                  : daysSinceUpdate <= 5 ? 'text-orange-500'
                  : 'text-red-500';
                const updateLabel = daysSinceUpdate === null ? '—'
                  : daysSinceUpdate === 0 ? 'Today'
                  : `${daysSinceUpdate}d ago`;

                // Milestone riêng cho từng process
                const active = calcMilestoneForProcess(process);
                const timeText = active
                  ? active.status === 'overdue' ? `Overdue ${Math.abs(active.daysRemaining!)}d`
                    : active.daysRemaining === 0 ? 'Today'
                    : `${active.daysRemaining}d left`
                  : null;
                const hintBg = active?.status === 'overdue' ? 'bg-red-50 border-red-100 text-red-700'
                  : active?.status === 'due_soon' ? 'bg-yellow-50 border-yellow-100 text-yellow-800'
                  : 'bg-blue-50 border-blue-100 text-blue-700';

                return (
                  <div key={process.id}>
                    <div className="flex items-center px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <div className="w-[22%] min-w-[140px] shrink-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{process.candidate?.name}</p>
                        <p className="text-[11px] text-gray-400 truncate">{process.candidate?.email}</p>
                      </div>
                      <div className="w-[24%] min-w-[160px] shrink-0">
                        <StatusSelect currentStatus={process.process_status} onStatusChange={(s) => handleStatusChange(process, s)} />
                      </div>
                      <div className="w-[28%] min-w-[180px] shrink-0">
                        {active ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border ${hintBg}`}>
                            {active.icon}
                            <span className="truncate">{active.label}</span>
                            <span className="font-bold shrink-0 whitespace-nowrap">· {timeText}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300 italic">—</span>
                        )}
                      </div>
                      <div className="w-[14%] min-w-[80px] shrink-0 text-center">
                        <p className={`text-xs font-semibold ${updateColor}`}>{updateLabel}</p>
                        {process.updated_at && (
                          <p className="text-[10px] text-gray-400">
                            {new Date(process.updated_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                          </p>
                        )}
                      </div>
                      <div className="w-[12%] min-w-[80px] flex items-center justify-center gap-0.5 shrink-0">
                        {process.candidate?.cv_link ? (
                          <a href={process.candidate.cv_link} target="_blank" rel="noopener noreferrer"
                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-blue-100 text-blue-400 hover:text-blue-600 transition-colors" title="View CV">
                            <FileText size={13} />
                          </a>
                        ) : (
                          <span className="w-7 h-7 flex items-center justify-center text-gray-200"><FileText size={13} /></span>
                        )}
                        <button onClick={() => setHistoryProcessId(process.id)}
                          className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-gray-600 transition-colors" title="History">
                          <History size={13} />
                        </button>
                        <button onClick={() => setCommentProcessId(process.id)}
                          className="relative w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-gray-600 transition-colors" title="Comments">
                          <MessageCircle size={13} />
                          {(process.unread_comment_count ?? 0) > 0 && (
                            <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full" />
                          )}
                        </button>
                      </div>
                    </div>
                    {/* Sub-row hint đã bỏ */}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {statusModalData && (
        <ProcessStatusModal
          isOpen={!!statusModalData}
          onClose={() => setStatusModalData(null)}
          onConfirm={handleConfirmStatus}
          newStatus={statusModalData.newStatus}
          candidateName={statusModalData.candidateName}
          positionTitle={statusModalData.positionTitle}
          clientPortalUserCount={statusModalData.clientPortalUserCount}
          candidateEvaluationFilePath={statusModalData.candidateEvaluationFilePath}
          currentBrief={statusModalData.currentBrief}
        />
      )}
      {historyProcessId && (
        <ProcessHistoryModal
          isOpen={!!historyProcessId}
          onClose={() => setHistoryProcessId(null)}
          processId={historyProcessId}
        />
      )}
      {commentProcessId && (
        <ProcessCommentModal
          isOpen={!!commentProcessId}
          onClose={() => setCommentProcessId(null)}
          processId={commentProcessId}
        />
      )}
      <IntroduceCandidateModal
        job={introduceJob}
        open={!!introduceJob}
        onClose={() => setIntroduceJob(null)}
        onSuccess={() => setIntroduceJob(null)}
      />
    </div>
  );
}

// Helper: format ngày ngắn gọn kèm label week tương đối
function fmtDate(iso: string | null | undefined, weekStart: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const ws = new Date(weekStart);
  const diffWeeks = Math.floor((ws.getTime() - d.getTime()) / (7 * 86400000));
  const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  if (diffWeeks === 0) return `${dateStr} (this week)`;
  if (diffWeeks === -1) return `${dateStr} (week ago)`;
  if (diffWeeks < 0) return `${dateStr} (${Math.abs(diffWeeks)} week ago)`;
  return `${dateStr} (week +${diffWeeks})`;
}

// Tooltip nội dung cho 1 stage
function StageTooltip({
  candidates,
  weekStart,
}: {
  candidates: PipelineStageCandidate[];
  weekStart: string;
}) {
  if (candidates.length === 0) return null;
  return (
    <div className="absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 w-68 bg-gray-900 text-white rounded-xl shadow-2xl p-3 text-left pointer-events-none" style={{ width: '272px' }}>
      {/* Arrow */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
        {candidates.length} ứng viên
      </p>
      <div className="space-y-2.5 max-h-52 overflow-y-auto">
        {candidates.map((c) => {
          // carry-over: job được giao week ago (assigned_week_start < weekStart)
          const isCarryOver = c.assigned_week_start < weekStart;
          return (
            <div key={c.process_id} className="border-b border-gray-700 pb-2 last:border-0 last:pb-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-xs font-semibold text-white truncate">{c.candidate_name}</p>
                {isCarryOver ? (
                  <span className="shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 whitespace-nowrap">
                    carry-over
                  </span>
                ) : (
                  <span className="shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 whitespace-nowrap">
                    this week
                  </span>
                )}
              </div>
              <div className="space-y-0.5">
                {c.cv_submitted_at && (
                  <p className="text-[10px] text-gray-400">
                    <span className="text-purple-400">CV Client</span> · {fmtDate(c.cv_submitted_at, weekStart)}
                  </p>
                )}
                {c.interview_at && (
                  <p className="text-[10px] text-gray-400">
                    <span className="text-orange-400">Interview</span> · {fmtDate(c.interview_at, weekStart)}
                  </p>
                )}
                {c.offer_at && (
                  <p className="text-[10px] text-gray-400">
                    <span className="text-green-400">Offer</span> · {fmtDate(c.offer_at, weekStart)}
                  </p>
                )}
                {c.onboard_at && (
                  <p className="text-[10px] text-gray-400">
                    <span className="text-pink-400">Onboard</span> · {fmtDate(c.onboard_at, weekStart)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Pipeline Bar Component - Activity-based với tooltip hover
function PipelineBar({
  stats,
  cvToDb,
  stageDetail,
  weekStart,
}: {
  stats: JobPipelineStats[];
  cvToDb: number;
  stageDetail: PipelineStageDetail[];
  weekStart: string;
}) {
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  // Build detail map: stage → candidates
  const detailMap = new Map<string, PipelineStageCandidate[]>();
  stageDetail.forEach(d => detailMap.set(d.stage, d.candidates));

  const totals = {
    cv_to_db: cvToDb,
    cv_client: stats.reduce((s, d) => s + d.cv_client, 0),
    interview: stats.reduce((s, d) => s + d.interview, 0),
    offer: stats.reduce((s, d) => s + d.offer, 0),
    onboard: stats.reduce((s, d) => s + d.onboard, 0),
  };

  const stages: {
    key: string;
    label: string;
    short: string;
    value: number;
    color: string;
    lightBg: string;
    textColor: string;
    borderColor: string;
  }[] = [
    { key: 'cv_to_db',   label: 'CV to DB',     short: 'CV DB',     value: totals.cv_to_db,   color: 'bg-blue-500',   lightBg: 'bg-blue-50',   textColor: 'text-blue-600',   borderColor: 'border-blue-300' },
    { key: 'cv_client',  label: 'CV to Client',  short: 'CV Client', value: totals.cv_client,  color: 'bg-purple-500', lightBg: 'bg-purple-50', textColor: 'text-purple-600', borderColor: 'border-purple-300' },
    { key: 'interview',  label: 'Interview',     short: 'Interview', value: totals.interview,  color: 'bg-orange-400', lightBg: 'bg-orange-50', textColor: 'text-orange-600', borderColor: 'border-orange-300' },
    { key: 'offer',      label: 'Offer',         short: 'Offer',     value: totals.offer,      color: 'bg-green-400',  lightBg: 'bg-green-50',  textColor: 'text-green-600',  borderColor: 'border-green-300' },
    { key: 'onboard',    label: 'Onboard',       short: 'Onboard',   value: totals.onboard,    color: 'bg-pink-400',   lightBg: 'bg-pink-50',   textColor: 'text-pink-600',   borderColor: 'border-pink-300' },
  ];

  return (
    <div className="flex items-center gap-2">
      {stages.map((stage, idx) => {
        const candidates = detailMap.get(stage.key) || [];
        const hasDetail = candidates.length > 0;
        const isHovered = hoveredStage === stage.key;

        return (
          <div key={idx} className="flex items-center gap-2 flex-1">
            {/* Stage box */}
            <div
              className={`relative flex-1 ${stage.lightBg} border-2 ${
                isHovered && hasDetail ? stage.borderColor : stage.color.replace('bg-', 'border-')
              } rounded-lg p-2 text-center transition-all ${hasDetail ? 'cursor-pointer hover:shadow-md hover:scale-105' : ''}`}
              onMouseEnter={() => hasDetail && setHoveredStage(stage.key)}
              onMouseLeave={() => setHoveredStage(null)}
            >
              <p className={`text-2xl font-bold ${stage.textColor}`}>{stage.value}</p>
              <p className="text-[10px] text-gray-600 font-medium mt-0.5">{stage.short}</p>
              {/* Dot indicator nếu có detail */}
              {hasDetail && (
                <span className={`absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full ${stage.color}`} />
              )}
              {/* Tooltip */}
              {isHovered && hasDetail && (
                <StageTooltip candidates={candidates} weekStart={weekStart} />
              )}
            </div>

            {/* Arrow */}
            {idx < stages.length - 1 && (
              <svg className="w-4 h-4 text-gray-300 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Job Performance Table Row Component
function JobPerformanceRow({ job, stats, weekStart }: { job: JobFocusWithDetails; stats: JobPipelineStats; weekStart?: string }) {
  const statusColor = 
    stats.conversion_rate >= 40 ? 'text-green-600 bg-green-50' :
    stats.conversion_rate >= 25 ? 'text-orange-600 bg-orange-50' :
    'text-red-600 bg-red-50';

  const statusText = 
    stats.conversion_rate >= 40 ? 'Good' :
    stats.conversion_rate >= 25 ? 'Avg' :
    'Poor';

  // Số ngày từ đầu week (Thứ 7) đến hiện tại
  const daysFromWeekStart = weekStart 
    ? Math.max(0, Math.floor((Date.now() - new Date(weekStart).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const pipelineStages = [
    { val: stats.cv_client, bgColor: 'bg-purple-100', textColor: 'text-purple-600', label: 'CV Cl' },
    { val: stats.interview, bgColor: 'bg-orange-100', textColor: 'text-orange-600', label: 'Interview' },
    { val: stats.offer, bgColor: 'bg-green-100', textColor: 'text-green-600', label: 'Offer' },
    { val: stats.onboard, bgColor: 'bg-pink-100', textColor: 'text-pink-600', label: 'Onboard' },
  ];

  return (
    <tr className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
      <td className="px-3 py-2">
        <p className="font-medium text-gray-800 dark:text-gray-200 text-xs truncate">{job.position_title}</p>
        <p className="text-[10px] text-gray-400 truncate">{job.client_name || 'Unknown'}</p>
      </td>
      <td className="px-2 py-2">
        <div className="flex items-center gap-1.5 justify-center">
          {pipelineStages.map((stage, i) => (
            <div key={i} className="flex items-center gap-1">
              {/* Number box */}
              <div className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded ${stage.bgColor} ${stage.textColor} text-[10px] font-bold`}>
                {stage.val}
              </div>
              {/* Label */}
              <span className="text-[9px] text-gray-500 dark:text-gray-400 whitespace-nowrap">{stage.label}</span>
              {/* Arrow separator */}
              {i < pipelineStages.length - 1 && (
                <span className="text-gray-300 text-[10px] mx-0.5">›</span>
              )}
            </div>
          ))}
        </div>
      </td>
      <td className="px-2 py-2 text-center">
        <div className="flex items-center justify-center gap-0.5 text-[10px] text-gray-500 dark:text-gray-400">
          <Clock size={10} />
          {daysFromWeekStart}d
        </div>
      </td>
      <td className="px-2 py-2 text-center">
        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{stats.conversion_rate}%</span>
      </td>
      <td className="px-2 py-2">
        <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColor}`}>
          {stats.conversion_rate >= 40 && <CheckCircle2 size={9} />}
          {stats.conversion_rate < 25 && <AlertTriangle size={9} />}
          {statusText}
        </span>
      </td>
    </tr>
  );
}

export default function JobFocusPage() {
  const user = useAuthStore((state) => state.user);
  const can = useAuthStore((state) => state.can);
  const isAdmin = user?.role === ROLES.ADMIN;
  const isHHLead = user?.role === ROLES.HH_LEAD;
  const isHeadhunter = user?.role === ROLES.HEADHUNTER;
  // Dùng can() theo chuẩn permission-based, Admin bypass tất cả
  // Headhunter thường có thể tự giao job cho bản thân
  const canAssign = can(PERMISSIONS.ASSIGN_JOB_FOCUS) || isHeadhunter;

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('self');
  const [selectedTeamLeadId, setSelectedTeamLeadId] = useState<string>('');
  // weekOffset: 0 = this week, -1 = week ago, -2 = 2 week ago, ...
  const [weekOffset, setWeekOffset] = useState(0);

  const SELF_ID = 'self';

  // Admin: Get list of HH Leads first
  const { data: hhLeads = [] } = useQuery({
    queryKey: ['hh-leads-job-focus'],
    queryFn: async () => {
      if (!isAdmin) return [];
      const { data } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('role', 'HH Lead')
        .eq('is_active', true)
        .order('full_name');
      return data || [];
    },
    enabled: isAdmin,
  });

  // Set default HH Lead when data loads
  React.useEffect(() => {
    if (isAdmin && hhLeads.length > 0 && !selectedTeamLeadId) {
      setSelectedTeamLeadId(hhLeads[0].id);
    }
  }, [isAdmin, hhLeads, selectedTeamLeadId]);

  // Get team members based on selected HH Lead (Admin) or current user (HH Lead)
  // Headhunter thường không có team members, chỉ HH Lead và Admin mới có
  const effectiveLeadId = isAdmin ? selectedTeamLeadId : (isHHLead ? user?.id : null);
  
  const { data: teamMembers = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['team-members-for-lead', effectiveLeadId],
    queryFn: async () => {
      if (!effectiveLeadId) return [];
      
      // Chỉ lấy Headhunters trong team, KHÔNG lấy HH Lead
      const { data } = await supabase
        .from('users')
        .select('id, full_name, email, role')
        .eq('role', 'Headhunter')
        .eq('managed_by_id', effectiveLeadId)
        .eq('is_active', true)
        .order('full_name');
      
      return data || [];
    },
    enabled: !!effectiveLeadId,
  });

  const { data: currentWeekStart } = useCurrentWeekStart();

  // Tính weekStart theo offset (mỗi bước = 7 ngày)
  const weekStart = useMemo(() => {
    if (!currentWeekStart) return undefined;
    if (weekOffset === 0) return currentWeekStart;
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + weekOffset * 7);
    return d.toISOString().split('T')[0];
  }, [currentWeekStart, weekOffset]);

  // Build member tabs: Admin không có "Self", chỉ có team members
  // Headhunter thường chỉ có "Self", không có team members
  const memberTabs = useMemo(() => {
    // Admin: chỉ hiển thị team members, không có "Self"
    if (isAdmin) {
      return teamMembers.map(m => ({ ...m, isSelf: false }));
    }
    
    // HH Lead: "Self" đầu tiên + team members
    if (isHHLead) {
      const selfTab = {
        id: SELF_ID,
        full_name: user?.full_name || 'Self',
        role: user?.role || '',
        isSelf: true,
      };
      const teamTabs = teamMembers.map(m => ({ ...m, isSelf: false }));
      return [selfTab, ...teamTabs];
    }
    
    // Headhunter thường: chỉ có "Self"
    return [{
      id: SELF_ID,
      full_name: user?.full_name || 'Self',
      role: user?.role || '',
      isSelf: true,
    }];
  }, [isAdmin, isHHLead, user?.full_name, user?.role, teamMembers]);

  // Auto-select first member when tabs change (for Admin)
  React.useEffect(() => {
    if (memberTabs.length > 0 && !memberTabs.find(m => m.id === selectedMemberId)) {
      setSelectedMemberId(memberTabs[0].id);
    }
  }, [memberTabs, selectedMemberId]);

  let { data: jobFocusData = [], isLoading: loadingJobs, refetch } = useJobFocusWithDetails({
    assignee_id: selectedMemberId === SELF_ID ? (user?.id || undefined) : (selectedMemberId || undefined),
    week_start: weekStart,
  });

  if (import.meta.env.DEV && jobFocusData.length === 0 && !loadingJobs) {
    jobFocusData = [
      {
        id: 'mock-jf-1',
        job_id: 'mock-job-1',
        job_code: 'J001',
        position_title: 'Senior Frontend Engineer',
        phase: 'Open',
        phase_date: '2026-06-20',
        headhunt_fee: '1500 USD',
        client_name: 'Tech Corp',
        assignee_id: (selectedMemberId === SELF_ID ? user?.id : selectedMemberId) || 'mock-id',
        week_start: weekStart || '2026-06-22',
        created_at: new Date().toISOString(),
      },
      {
        id: 'mock-jf-2',
        job_id: 'mock-job-2',
        job_code: 'J002',
        position_title: 'Product Manager',
        phase: 'Sourcing',
        phase_date: '2026-06-15',
        headhunt_fee: '2000 USD',
        client_name: 'Product LLC',
        assignee_id: (selectedMemberId === SELF_ID ? user?.id : selectedMemberId) || 'mock-id',
        week_start: weekStart || '2026-06-22',
        created_at: new Date().toISOString(),
      },
      {
        id: 'mock-jf-3',
        job_id: 'mock-job-3',
        job_code: 'J003',
        position_title: 'Backend Developer (Go)',
        phase: 'Interview',
        phase_date: '2026-06-18',
        headhunt_fee: '1800 USD',
        client_name: 'Fintech Solutions',
        assignee_id: (selectedMemberId === SELF_ID ? user?.id : selectedMemberId) || 'mock-id',
        week_start: weekStart || '2026-06-22',
        created_at: new Date().toISOString(),
      },
      {
        id: 'mock-jf-4',
        job_id: 'mock-job-4',
        job_code: 'J004',
        position_title: 'Data Engineer',
        phase: 'Offer',
        phase_date: '2026-06-22',
        headhunt_fee: '2200 USD',
        client_name: 'BigData Inc',
        assignee_id: (selectedMemberId === SELF_ID ? user?.id : selectedMemberId) || 'mock-id',
        week_start: weekStart || '2026-06-22',
        created_at: new Date().toISOString(),
      },
      {
        id: 'mock-jf-5',
        job_id: 'mock-job-5',
        job_code: 'J005',
        position_title: 'UX/UI Designer',
        phase: 'Sourcing',
        phase_date: '2026-06-19',
        headhunt_fee: '1200 USD',
        client_name: 'Creative Studio',
        assignee_id: (selectedMemberId === SELF_ID ? user?.id : selectedMemberId) || 'mock-id',
        week_start: weekStart || '2026-06-22',
        created_at: new Date().toISOString(),
      }
    ] as any;
  }

  // Fetch pipeline stats thật từ processes table
  const effectiveAssigneeId = selectedMemberId === SELF_ID ? user?.id : selectedMemberId;
  let { data: pipelineStats = [], isLoading: loadingStats } = useJobFocusPipelineStats(
    effectiveAssigneeId || undefined,
    weekStart
  );

  if (import.meta.env.DEV && pipelineStats.length === 0 && !loadingStats) {
    pipelineStats = [
      { job_id: 'mock-job-1', cv_client: 3, interview: 2, offer: 1, onboard: 0, conversion_rate: 33 },
      { job_id: 'mock-job-2', cv_client: 5, interview: 1, offer: 0, onboard: 0, conversion_rate: 20 },
      { job_id: 'mock-job-3', cv_client: 2, interview: 1, offer: 0, onboard: 0, conversion_rate: 50 },
      { job_id: 'mock-job-4', cv_client: 4, interview: 3, offer: 2, onboard: 1, conversion_rate: 25 },
      { job_id: 'mock-job-5', cv_client: 6, interview: 0, offer: 0, onboard: 0, conversion_rate: 0 },
    ] as any;
  }

  // Fetch CV to DB count
  let { data: cvToDbCount = 0 } = useWeeklyCvToDb(
    effectiveAssigneeId || undefined,
    weekStart
  );

  if (import.meta.env.DEV && cvToDbCount === 0) {
    cvToDbCount = 12;
  }

  // Fetch pipeline stage detail cho tooltip (activity-based)
  let { data: stageDetail = [], isLoading: loadingStageDetail } = usePipelineStageDetail(
    effectiveAssigneeId || undefined,
    weekStart
  );

  if (import.meta.env.DEV && stageDetail.length === 0 && !loadingStageDetail) {
    stageDetail = [
      {
        stage: 'cv_client',
        candidates: [
          { process_id: 'p1', job_id: 'mock-job-1', candidate_name: 'Nguyen Van A', cv_submitted_at: new Date(Date.now() - 2*86400000).toISOString(), assigned_week_start: weekStart || '' },
          { process_id: 'p2', job_id: 'mock-job-2', candidate_name: 'Tran Thi B', cv_submitted_at: new Date(Date.now() - 1*86400000).toISOString(), assigned_week_start: weekStart || '' },
        ]
      },
      {
        stage: 'interview',
        candidates: [
          { process_id: 'p1', job_id: 'mock-job-1', candidate_name: 'Nguyen Van A', interview_at: new Date().toISOString(), assigned_week_start: weekStart || '' },
        ]
      },
      {
        stage: 'offer',
        candidates: [
          { process_id: 'p1', job_id: 'mock-job-1', candidate_name: 'Nguyen Van A', offer_at: new Date(Date.now() + 86400000).toISOString(), assigned_week_start: weekStart || '' },
        ]
      }
    ] as any;
  }

  // Debug log
  console.log('🔍 CV to DB Debug:', {
    effectiveAssigneeId,
    weekStart,
    cvToDbCount,
    totalStats: {
      jobs: jobFocusData.length,
      cv_to_db: cvToDbCount,
    }
  });

  // Map pipeline stats theo job_id để lookup nhanh
  const statsMap = useMemo(() => {
    const map = new Map<string, JobPipelineStats>();
    pipelineStats.forEach(s => map.set(s.job_id, s));
    return map;
  }, [pipelineStats]);

  // Tính carry-over job IDs: job có activity this week nhưng KHÔNG được giao this week
  // Lấy từ stageDetail (đã có r_job_id và r_assigned_week_start)
  const carryOverJobIds = useMemo(() => {
    if (!weekStart) return new Set<string>();
    const assignedThisWeek = new Set(jobFocusData.map(j => j.job_id));
    const ids = new Set<string>();
    for (const detail of stageDetail) {
      for (const c of detail.candidates) {
        if (!assignedThisWeek.has(c.job_id) && c.assigned_week_start < weekStart) {
          ids.add(c.job_id);
        }
      }
    }
    return ids;
  }, [stageDetail, jobFocusData, weekStart]);

  // Fetch thông tin đầy đủ cho carry-over jobs
  const carryOverJobIdsArray = useMemo(() => Array.from(carryOverJobIds), [carryOverJobIds]);
  const { data: carryOverJobDetails = [], isLoading: loadingCarryOver } = useJobFocusByJobIds(
    effectiveAssigneeId || undefined,
    carryOverJobIdsArray
  );

  // Merge: jobs được giao this week + carry-over jobs có activity this week
  const allDisplayJobs = useMemo(() => {
    const thisWeekJobIds = new Set(jobFocusData.map(j => j.job_id));
    const extras = carryOverJobDetails.filter(j => !thisWeekJobIds.has(j.job_id));
    return [...jobFocusData, ...extras];
  }, [jobFocusData, carryOverJobDetails]);

  // Default stats khi chưa có data
  const emptyStats: JobPipelineStats = { job_id: '', cv_client: 0, interview: 0, offer: 0, onboard: 0, conversion_rate: 0 };

  const selectedMember = selectedMemberId === SELF_ID
    ? { id: user?.id || '', full_name: user?.full_name || 'Self', role: user?.role || '' }
    : teamMembers.find(m => m.id === selectedMemberId);

  // Tổng stats từ pipeline data thật
  const totalStats = {
    jobs: jobFocusData.length,
    cv_to_db: cvToDbCount,
    cv_client: pipelineStats.reduce((s, p) => s + p.cv_client, 0),
    interview: pipelineStats.reduce((s, p) => s + p.interview, 0),
    offer: pipelineStats.reduce((s, p) => s + p.offer, 0),
    onboard: pipelineStats.reduce((s, p) => s + p.onboard, 0),
  };

  const assignTargetId = selectedMemberId === SELF_ID ? (user?.id || '') : (selectedMemberId || '');
  const assignTargetName = selectedMember?.full_name || '';

  return (
    <>
      <PageMeta title="Job Focus" />
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Job Focus Management</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{memberTabs.length - 1} members</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Giao job - chỉ HH Lead và Admin, Headhunter thường có thể focus cho bản thân */}
            {canAssign && selectedMemberId && (
              <button
                onClick={() => setAssignModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors text-xs font-medium"
              >
                <UserPlus size={14} />
                {selectedMemberId === SELF_ID ? 'Focus Job' : 'Assign Job'}
              </button>
            )}
            {/* Week navigation */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-1">
              <button
                onClick={() => setWeekOffset(o => o - 1)}
                className="p-2 hover:bg-white rounded-md transition-colors"
                title="Last week"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="px-3 py-1 text-center">
                <div className="text-sm font-bold">{weekOffset === 0 ? 'This week' : weekOffset === -1 ? 'Last week' : `${Math.abs(weekOffset)} week ago`}</div>
                {weekStart && (() => {
                  const d = new Date(weekStart);
                  const endDate = new Date(d);
                  endDate.setDate(endDate.getDate() + 6);
                  const startOfYear = new Date(d.getFullYear(), 0, 1);
                  const weekNum = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
                  const startStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                  const endStr = endDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                  return (
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      Week {weekNum} · {startStr} - {endStr}
                    </div>
                  );
                })()}
              </div>
              <button
                onClick={() => setWeekOffset(o => Math.min(0, o + 1))}
                disabled={weekOffset === 0}
                className="p-2 hover:bg-white rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Next week"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            {/* Admin: filter by team */}
            {isAdmin && hhLeads.length > 0 && (
              <div className="relative">
                <select
                  value={selectedTeamLeadId}
                  onChange={e => {
                    setSelectedTeamLeadId(e.target.value);
                    setSelectedMemberId(SELF_ID); // Reset to first member when changing team
                  }}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs border border-gray-200 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-pink-400"
                >
                  {hhLeads.map(lead => (
                    <option key={lead.id} value={lead.id}>
                      Team {lead.full_name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            )}
          </div>
        </div>

        {/* Member Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2">
          <div className="flex items-center gap-2 overflow-x-auto">
            {loadingMembers && memberTabs.length <= 1 ? (
              <Loader2 className="animate-spin text-pink-500 mx-auto" size={18} />
            ) : (
              memberTabs.map(member => {
                const isSelected = selectedMemberId === member.id;
                return (
                  <button
                    key={member.id}
                    onClick={() => setSelectedMemberId(member.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all shrink-0 ${
                      isSelected
                        ? 'bg-pink-500 text-white shadow-sm'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                    }`}>
                      {member.isSelf ? '★' : member.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-medium leading-tight">
                        {member.isSelf ? 'Self' : member.full_name}
                      </p>
                      <p className={`text-[9px] leading-tight ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                        {member.role}
                      </p>
                    </div>
                    {member.isSelf && (
                      <span className={`text-[8px] px-1 py-0.5 rounded font-semibold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-pink-100 text-pink-600'
                      }`}>
                        Me
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Main Content */}
        <div>
          {(loadingJobs || loadingStageDetail || loadingCarryOver) ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-pink-500" size={28} />
            </div>
          ) : allDisplayJobs.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-12 text-center">
              <Briefcase className="mx-auto mb-2 text-gray-200" size={40} />
              <p className="text-sm text-gray-500 font-medium mb-1">
                {selectedMemberId === SELF_ID ? "You don't have job focus this week" : 'No job focus'}
              </p>
              <p className="text-xs text-gray-400 mb-4">
                {selectedMemberId === SELF_ID ? 'Focus on a job to start working' : 'Assign job to start'}
              </p>
              {(canAssign) && (
                <button
                  onClick={() => setAssignModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors text-xs font-medium"
                >
                  <UserPlus size={14} />
                  {selectedMemberId === SELF_ID ? 'Focus Job' : 'Assign Job'}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { val: totalStats.jobs, label: 'Jobs', color: 'text-pink-500' },
                    { val: totalStats.cv_client, label: 'CV Client', color: 'text-purple-500' },
                    { val: totalStats.interview, label: 'Interview', color: 'text-orange-500' },
                    { val: totalStats.offer, label: 'Offer', color: 'text-green-500' },
                    { val: totalStats.onboard, label: 'Onboard', color: 'text-pink-400' },
                  ].map(s => (
                    <div key={s.label} className="text-center p-2 bg-gray-50 dark:bg-gray-700/30 rounded">
                      <p className={`text-lg font-bold ${s.color}`}>{s.val}</p>
                      <p className="text-[9px] text-gray-500 uppercase">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pipeline */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                  <TrendingUp size={12} className="text-pink-500" />
                  Pipeline {weekOffset === 0 ? 'This Week' : weekOffset === -1 ? 'Last Week' : `${Math.abs(weekOffset)} Last Week`}
                  {loadingStats && <Loader2 size={10} className="animate-spin text-gray-400 ml-1" />}
                </h3>
                <PipelineBar stats={pipelineStats} cvToDb={cvToDbCount} stageDetail={stageDetail} weekStart={weekStart || ''} />
              </div>

              {/* Performance Table */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <Target size={12} className="text-pink-500" />
                    Performance
                  </h2>
                  <span className="text-[10px] text-gray-400">{jobFocusData.length} jobs</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20">
                        <th className="text-left px-3 py-2 text-[10px] font-medium text-gray-400 uppercase">Job</th>
                        <th className="px-2 py-2 text-[10px] font-medium text-gray-400 uppercase">Pipeline</th>
                        <th className="text-center px-2 py-2 text-[10px] font-medium text-gray-400 uppercase">Ngày</th>
                        <th className="text-center px-2 py-2 text-[10px] font-medium text-gray-400 uppercase">CV%</th>
                        <th className="text-left px-2 py-2 text-[10px] font-medium text-gray-400 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobFocusData.map((job) => (
                        <JobPerformanceRow 
                          key={job.id} 
                          job={job} 
                          stats={statsMap.get(job.job_id) || emptyStats} 
                          weekStart={weekStart} 
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Jobs: JobCard trái + Processes + Milestones phải */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <Briefcase size={12} className="text-pink-500" />
                    Job List
                  </h2>
                  <span className="text-[10px] text-gray-400">{allDisplayJobs.length} jobs{carryOverJobIdsArray.length > 0 && ` · ${carryOverJobIdsArray.length} carry-over`}</span>
                </div>
                {allDisplayJobs.map(assignment => (
                  <div key={assignment.id} className="relative">
                    {/* Badge carry-over */}
                    {carryOverJobIds.has(assignment.job_id) && (
                      <div className="absolute -top-1.5 left-4 z-10">
                        <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-300 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                           Updates this week
                        </span>
                      </div>
                    )}
                    <div className={carryOverJobIds.has(assignment.job_id) ? 'pt-2' : ''}>
                      <JobFocusRow
                        job={assignment}
                        assigneeId={effectiveAssigneeId || ''}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {assignTargetId && (
        <AssignJobFocusModal
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          preSelectedAssigneeId={assignTargetId}
          preSelectedAssigneeName={assignTargetName}
          existingJobIds={jobFocusData.map(jf => jf.job_id)}
          onSuccess={() => refetch()}
        />
      )}

    </>
  );
}
