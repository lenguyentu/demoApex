// @ts-nocheck
import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../auth/store';
import { Loader2, AlertCircle, Eye, ArrowDown } from 'lucide-react';
import { useCursorPagination } from '../../../hooks/useCursorPagination';
import { AuditLogDetailsModal } from '../components/AuditLogDetailsModal';
import { OwnerSelect } from '../../../components/OwnerSelect';
interface AuditLog {
  id: string;
  action: string;
  actor_user_id: string | null;
  target_user_id: string | null;
  target_table: string;
  details: any;
  created_at: string;
  // Snapshot fields (directly from DB now)
  actor_name: string | null;
  actor_email: string | null;
  target_user_name: string | null;
  target_user_email: string | null;
  target_summary: string | null; // e.g. "Senior Dev" or "Candidate Name"
}

const ACTION_OPTIONS = [
  { value: '', label: 'Tất cả hành động' },
  { value: 'INSERT', label: 'Tạo mới (Insert)' },
  { value: 'UPDATE', label: 'Cập nhật (Update)' },
  { value: 'DELETE', label: 'Xóa (Delete)' },
];

export const AuditLogPage = () => {
  const { can } = useAuthStore();
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  const filters = useCallback((query: any) => {
    let q = query;
    if (actionFilter) {
      q = q.ilike('action', `${actionFilter}%`);
    }
    if (userFilter) {
      q = q.eq('actor_user_id', userFilter);
    }
    return q;
  }, [actionFilter, userFilter]);

  const {
    data: logs,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  } = useCursorPagination<AuditLog>({

    supabaseClient: supabase,
    tableName: 'audit_logs', // Direct table access (Snapshot columns exist now)
    pageSize: 20,
    select: 'id, action, actor_user_id, target_user_id, target_table, created_at, actor_name, actor_email, target_user_name, target_user_email, target_summary',
    applyFilters: filters,
    refreshKey: `${actionFilter}-${userFilter}`,
  });

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasMore && !loading) {
      loadMore();
    }
  };

  if (!can('manage_system')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Truy cập bị từ chối</h2>
        <p className="text-gray-500 dark:text-gray-400">Bạn không có quyền xem nhật ký hệ thống.</p>
      </div>
    );
  }

  return (
    <div className="p-6 h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Audit Log</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Ghi lại các hoạt động quan trọng trong hệ thống
          </p>
        </div>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm"
        >
          Làm mới
        </button>
      </div>

      <div className="flex items-center gap-4 mb-4 shrink-0 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
        <div className="w-[200px]">
          <select
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            {ACTION_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="w-[300px]">
          <OwnerSelect
            value={userFilter}
            onChange={setUserFilter}
            placeholder="Lọc theo Người thực hiện..."
            className="bg-gray-50"
          />
        </div>
      </div>

      {!!error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 flex items-center gap-2 shrink-0">
          <AlertCircle size={20} />
          <span>Có lỗi xảy ra khi tải nhật ký. Vui lòng thử lại.</span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex-1 flex flex-col overflow-hidden">
        <div
          className="overflow-auto flex-1 custom-scrollbar"
          onScroll={handleScroll}
        >
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700/50 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-3 whitespace-nowrap">Thời gian</th>
                <th className="px-6 py-3 whitespace-nowrap">Hành động</th>
                <th className="px-6 py-3 whitespace-nowrap">Người thực hiện</th>
                <th className="px-6 py-3 whitespace-nowrap">Đối tượng</th>
                <th className="px-6 py-3 text-center whitespace-nowrap" style={{ width: '100px' }}>Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {logs.length === 0 && !loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="bg-gray-100 p-3 rounded-full">
                        <AlertCircle size={24} className="text-gray-400" />
                      </div>
                      <p>Không có nhật ký nào được ghi nhận</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-mono text-xs">
                      {new Intl.DateTimeFormat('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      }).format(new Date(log.created_at))}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium px-2.5 py-1 rounded-md text-xs border ${log.action?.includes('INSERT') ? 'bg-green-50 text-green-700 border-green-200' :
                        log.action?.includes('UPDATE') ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          log.action?.includes('DELETE') ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-gray-100 text-gray-700 border-gray-200'
                        }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-white text-sm">
                          {log.actor_name || <span className="text-gray-400 italic">Unknown/System</span>}
                        </span>
                        <span className="text-xs text-gray-500">{log.actor_email || log.actor_user_id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {/* Show Object Summary First (e.g. Job Title, Candidate Name) */}
                      {log.target_summary ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-white text-sm truncate max-w-[200px]" title={log.target_summary}>
                            {log.target_summary}
                          </span>
                          {/* Add subtitle for Table Name or Owner if needed. E.g. "Candidate" */}
                          <span className="text-xs text-brand-500 font-medium lowercase bg-brand-50 px-1.5 py-0.5 rounded w-fit mt-0.5">
                            {log.target_table}
                          </span>
                          {/* Optional: Show Owner if available and different */}
                          {log.target_user_name && !log.target_summary.includes(log.target_user_name) && (
                            <span className="text-[10px] text-gray-400 mt-0.5">
                              của {log.target_user_name}
                            </span>
                          )}
                        </div>
                      ) : (
                        /* Fallback for old logs or simple user changes */
                        log.target_user_name ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 text-sm">{log.target_user_name}</span>
                            <span className="text-xs text-gray-500">{log.target_user_email}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-2 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                        title="Xem chi tiết"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {loading && (
            <div className="py-8 text-center flex justify-center items-center gap-2 text-gray-500">
              <Loader2 size={20} className="animate-spin text-brand-500" />
              <span className="text-sm">Đang tải dữ liệu...</span>
            </div>
          )}

          {!loading && hasMore && (
            <div className="p-4 flex justify-center border-t border-gray-100">
              <button
                onClick={loadMore}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
              >
                <ArrowDown size={16} />
                Xem thêm cũ hơn
              </button>
            </div>
          )}
        </div>
      </div>

      <AuditLogDetailsModal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        log={selectedLog}
      />
    </div>
  );
};
