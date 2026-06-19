import { useMemo, useEffect, useState } from 'react';
import { Calendar, Search, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../../lib/supabase';
import { ClientSelect } from '../../../../components/ClientSelect';
import { useJobFocusWithDetails } from '../../hooks';
import { addDaysToDateString } from '../../utils/weeklyReportSchedule';

type OpenJob = {
  id: string;
  job_id: string;
  position_title: string;
  phase?: string;
  clients?: { client_name?: string } | { client_name?: string }[];
};

function getClientName(job: OpenJob): string {
  const raw = job.clients;
  if (!raw) return '';
  if (Array.isArray(raw)) return raw[0]?.client_name ?? '';
  return raw.client_name ?? '';
}

interface Props {
  weekStart?: string;
  userId?: string;
  selectedJobs: string[];
  jobPlans: Record<string, { cv_target?: number; priority?: number; note?: string }>;
  setSelectedJobs: (val: string[]) => void;
  setJobPlans: (val: Record<string, { cv_target?: number; priority?: number; note?: string }>) => void;
}

export default function PlanSection({
  weekStart,
  userId,
  selectedJobs,
  jobPlans,
  setSelectedJobs,
  setJobPlans,
}: Props) {
  const [searchJob, setSearchJob] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [hasInitialized, setHasInitialized] = useState(false);

  const nextWeekStart = useMemo(
    () => (weekStart ? addDaysToDateString(weekStart, 7) : undefined),
    [weekStart],
  );

  const { data: nextWeekAssignments = [] } = useJobFocusWithDetails({
    assignee_id: userId,
    week_start: nextWeekStart,
  });

  const { data: openJobs = [], isLoading: loadingJobs } = useQuery({
    queryKey: ['weeklyReportOpenJobs', selectedClient],
    queryFn: async () => {
      let query = supabase
        .from('jobs')
        .select('id, job_id, position_title, phase, clients(id, client_name)')
        .in('phase', ['Open', 'Sourcing', 'On_Hold'])
        .order('created_at', { ascending: false })
        .limit(200);

      if (selectedClient) {
        query = query.eq('client_id', selectedClient);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as OpenJob[];
    },
    staleTime: 2 * 60 * 1000,
  });

  const jobById = useMemo(() => {
    const map = new Map<string, OpenJob>();
    for (const j of openJobs) map.set(j.id, j);
    for (const a of nextWeekAssignments) {
      if (!map.has(a.job_id)) {
        map.set(a.job_id, {
          id: a.job_id,
          job_id: a.job_code ?? a.job_id,
          position_title: a.position_title ?? '',
          phase: a.phase ?? undefined,
          clients: a.client_name ? { client_name: a.client_name } : undefined,
        });
      }
    }
    return map;
  }, [openJobs, nextWeekAssignments]);

  useEffect(() => {
    if (nextWeekAssignments.length > 0 && !hasInitialized) {
      const jobIds = nextWeekAssignments.map((a) => a.job_id);
      const plans: Record<string, { cv_target: number; priority: number; note: string }> = {};
      nextWeekAssignments.forEach((assignment) => {
        plans[assignment.job_id] = {
          cv_target: assignment.plan_cv_count || 0,
          priority: assignment.plan_priority_percent || 0,
          note: assignment.plan_note || assignment.note || '',
        };
      });
      setSelectedJobs(jobIds);
      setJobPlans(plans);
      setHasInitialized(true);
    } else if (nextWeekAssignments.length === 0 && !hasInitialized) {
      // mark as initialized even if empty so it doesn't try again later if it changes somehow
      // although nextWeekAssignments only changes on remount or weekStart change.
      // Wait, we need to handle weekStart changes by resetting hasInitialized.
    }
  }, [nextWeekAssignments, hasInitialized, setSelectedJobs, setJobPlans]);

  // Reset initialization when weekStart or userId changes
  useEffect(() => {
    setHasInitialized(false);
  }, [weekStart, userId]);

  const filteredOpenJobs = useMemo(() => {
    const keyword = searchJob.toLowerCase().trim();
    return openJobs.filter((job) => {
      if (selectedJobs.includes(job.id)) return false;
      if (!keyword) return true;
      const clientName = getClientName(job);
      return (
        (job.position_title || '').toLowerCase().includes(keyword) ||
        (job.job_id || '').toLowerCase().includes(keyword) ||
        clientName.toLowerCase().includes(keyword)
      );
    });
  }, [openJobs, searchJob, selectedJobs]);

  const addJob = (jobId: string) => {
    if (!selectedJobs.includes(jobId)) {
      setSelectedJobs([...selectedJobs, jobId]);
      setJobPlans({
        ...jobPlans,
        [jobId]: jobPlans[jobId] ?? { cv_target: 0, priority: 0, note: '' },
      });
    }
  };

  const removeJob = (jobId: string) => {
    setSelectedJobs(selectedJobs.filter((id) => id !== jobId));
    const newPlans = { ...jobPlans };
    delete newPlans[jobId];
    setJobPlans(newPlans);
  };

  const updatePlan = (jobId: string, field: string, value: string | number) => {
    setJobPlans({
      ...jobPlans,
      [jobId]: { ...jobPlans[jobId], [field]: value },
    });
  };

  const prioritySum = selectedJobs.reduce(
    (sum, id) => sum + (jobPlans[id]?.priority ?? 0),
    0,
  );

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <Calendar size={18} className="text-indigo-600" />
          6. Kế hoạch tuần sau
        </h2>
        {nextWeekStart && (
          <p className="text-xs text-gray-500 mt-0.5">
            Tuần {nextWeekStart}
            {nextWeekAssignments.length > 0
              ? ` · ${nextWeekAssignments.length} job đã giao`
              : ' · Chưa có job focus'}
          </p>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="relative">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={14}
            />
            <input
              type="text"
              value={searchJob}
              onChange={(e) => setSearchJob(e.target.value)}
              placeholder="Tìm mã job (TDC00X), tên vị trí, khách hàng..."
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <ClientSelect
            value={selectedClient}
            onChange={setSelectedClient}
            placeholder="Lọc theo khách hàng..."
          />
        </div>

        <div className="border border-gray-200 rounded-lg max-h-44 overflow-y-auto bg-gray-50/50">
          {loadingJobs ? (
            <p className="p-3 text-xs text-gray-500 text-center">Đang tải job Open...</p>
          ) : filteredOpenJobs.length === 0 ? (
            <p className="p-3 text-xs text-gray-500 text-center">
              {searchJob || selectedClient
                ? 'Không tìm thấy job phù hợp'
                : 'Không còn job Open/Sourcing để thêm'}
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filteredOpenJobs.map((job) => (
                <li
                  key={job.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-white"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-900 truncate">
                      {job.job_id} · {job.position_title}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate">
                      {getClientName(job) || '—'} · {job.phase}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addJob(job.id)}
                    className="flex-shrink-0 inline-flex items-center gap-0.5 px-2 py-1 text-[10px] font-bold text-indigo-700 bg-indigo-100 rounded hover:bg-indigo-200"
                  >
                    <Plus size={12} />
                    Thêm
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedJobs.length > 0 ? (
          <div className="space-y-2">
            {selectedJobs.map((jobId) => {
              const job = jobById.get(jobId);
              const plan = jobPlans[jobId] || {};
              const clientName = job ? getClientName(job) : '';

              return (
                <div key={jobId} className="p-3 border border-indigo-100 rounded-lg space-y-2 bg-indigo-50/30">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 text-xs truncate">
                        {job?.position_title ?? 'Job đã chọn'}
                      </div>
                      <div className="text-[10px] text-gray-600 truncate">
                        {job?.job_id ?? jobId}
                        {clientName ? ` · ${clientName}` : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeJob(jobId)}
                      className="text-red-400 hover:text-red-600 text-xs font-bold"
                      aria-label="Xóa job"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Target CV</label>
                      <input
                        type="number"
                        value={plan.cv_target ?? ''}
                        onChange={(e) =>
                          updatePlan(jobId, 'cv_target', parseInt(e.target.value, 10) || 0)
                        }
                        placeholder="0"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-semibold focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Ưu tiên %</label>
                      <input
                        type="number"
                        value={plan.priority ?? ''}
                        onChange={(e) =>
                          updatePlan(jobId, 'priority', parseInt(e.target.value, 10) || 0)
                        }
                        placeholder="0"
                        min={0}
                        max={100}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-semibold focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                  </div>

                  <input
                    type="text"
                    value={plan.note ?? ''}
                    onChange={(e) => updatePlan(jobId, 'note', e.target.value)}
                    placeholder="Kế hoạch cụ thể (mục tiêu, deadline...)"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <p className="text-xs text-gray-500">
              Tìm và bấm <strong>Thêm</strong> job Open ở trên để lập kế hoạch tuần sau
            </p>
          </div>
        )}

        <p
          className={`text-xs ${prioritySum === 100 ? 'text-green-600' : prioritySum > 0 ? 'text-amber-600' : 'text-gray-400'}`}
        >
          Tổng ưu tiên: <strong>{prioritySum}%</strong>
          {prioritySum !== 100 && prioritySum > 0 ? ' (nên = 100%)' : ''}
        </p>
      </div>
    </div>
  );
}
