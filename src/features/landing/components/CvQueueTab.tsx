import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../auth/store';
import { fetchCvIntakeQueue, getIntakeCvSignedUrl, getMyLandingPage } from '../api';
import type { CvIntakeApplyType, CvIntakeQueueItem, CvIntakeStatus } from '../types';

const STATUS_FILTER_OPTIONS: { value: 'all' | CvIntakeStatus; label: string }[] = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'promoted', label: 'Đã xử lý' },
  { value: 'rejected', label: 'Từ chối' },
  { value: 'expired', label: 'Hết hạn' },
];

/** Bật lại khi cần cột Trạng thái + Thao tác (Đã xử lý / Từ chối). */
const SHOW_STATUS_AND_ACTION_COLUMNS = false;

function ApplyTypeBadge({ type }: { type: CvIntakeApplyType }) {
  if (type === 'job') {
    return (
      <span className="inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
        Ứng tuyển job
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-700">
      Cần hỗ trợ tìm job
    </span>
  );
}

function JobContextCell({ row }: { row: CvIntakeQueueItem }) {
  if (row.apply_type === 'advice') {
    return (
      <div className="space-y-1 text-xs">
        <p className="text-violet-700 font-medium">Tư vấn / kết nối — chưa chọn job cụ thể</p>
        {row.reason ? (
          <p className="text-gray-600 line-clamp-2" title={row.reason}>
            {row.reason}
          </p>
        ) : null}
      </div>
    );
  }

  const ref = row.job_ref || row.context_job_ref;
  const title = row.job_title || row.context_job_title;

  return (
    <div className="space-y-0.5">
      {ref ? (
        <p className="font-mono text-xs font-semibold text-brand-700">{ref}</p>
      ) : null}
      <p className="text-sm text-gray-900 dark:text-white">{title || '—'}</p>
    </div>
  );
}

function CvLink({ row }: { row: CvIntakeQueueItem }) {
  const [refreshing, setRefreshing] = useState(false);

  const openCv = async () => {
    if (row.cvSignedUrl) {
      window.open(row.cvSignedUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    setRefreshing(true);
    try {
      const url = await getIntakeCvSignedUrl(row.storage_path, row.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Không mở được CV';
      toast.error(msg);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={openCv}
      disabled={refreshing || !row.storage_path}
      className="inline-flex items-center gap-1 rounded-lg border border-brand-200 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50"
    >
      {refreshing ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <ExternalLink size={14} />
      )}
      Xem CV
    </button>
  );
}

export function CvQueueTab() {
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CvIntakeQueueItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | CvIntakeStatus>('all');
  const [applyFilter, setApplyFilter] = useState<'all' | 'job' | 'advice'>('all');
  const [teamSlug, setTeamSlug] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const landing = await getMyLandingPage(user.id);
      const slug = landing?.subdomain_slug ?? null;
      setTeamSlug(slug);
      const rows = await fetchCvIntakeQueue({
        teamSlug: slug,
        status: statusFilter,
        applyType: applyFilter,
        withSignedUrls: true,
      });
      setItems(rows);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không tải được hàng đợi CV');
    } finally {
      setLoading(false);
    }
  }, [user?.id, statusFilter, applyFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const jobCount = items.filter((i) => i.apply_type === 'job').length;
  const adviceCount = items.filter((i) => i.apply_type === 'advice').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            CV từ landing
            {teamSlug ? (
              <>
                {' '}
                — team <code className="rounded bg-gray-100 px-1 text-xs dark:bg-gray-800">{teamSlug}</code>
              </>
            ) : (
              ' — lưu slug trong tab Setup để lọc đúng team'
            )}
          </p>
          {!loading && items.length > 0 ? (
            <p className="mt-1 text-xs text-gray-500">
              {items.length} bản ghi · {jobCount} ứng tuyển job · {adviceCount} cần tư vấn tìm job
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={applyFilter}
            onChange={(e) => setApplyFilter(e.target.value as 'all' | 'job' | 'advice')}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-950"
          >
            <option value="all">Tất cả loại</option>
            <option value="job">Ứng tuyển job</option>
            <option value="advice">Cần hỗ trợ tìm job</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as 'all' | CvIntakeStatus)
            }
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-950"
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={load}
            className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            title="Tải lại + làm mới signed URL"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">Chưa có CV trong hàng đợi.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left dark:bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 font-medium">Thời gian</th>
                <th className="px-4 py-3 font-medium">Ứng viên</th>
                <th className="px-4 py-3 font-medium">Loại</th>
                <th className="px-4 py-3 font-medium">Job / nhu cầu</th>
                {SHOW_STATUS_AND_ACTION_COLUMNS ? (
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                ) : null}
                <th className="px-4 py-3 font-medium">CV</th>
                {SHOW_STATUS_AND_ACTION_COLUMNS ? (
                  <th className="px-4 py-3 font-medium">Thao tác</th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    {new Date(row.created_at).toLocaleString('vi-VN')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {row.full_name || '—'}
                    </div>
                    {row.email ? <div className="text-xs text-gray-500">{row.email}</div> : null}
                    {row.phone ? <div className="text-xs text-gray-500">{row.phone}</div> : null}
                  </td>
                  <td className="px-4 py-3">
                    <ApplyTypeBadge type={row.apply_type} />
                  </td>
                  <td className="max-w-xs px-4 py-3">
                    <JobContextCell row={row} />
                  </td>
                  <td className="px-4 py-3">
                    <CvLink row={row} />
                    {!row.cvSignedUrl && row.storage_path ? (
                      <p className="mt-1 text-[10px] text-amber-600" title={row.storage_path}>
                        Chưa ký URL — bấm Xem CV để thử lại
                      </p>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
