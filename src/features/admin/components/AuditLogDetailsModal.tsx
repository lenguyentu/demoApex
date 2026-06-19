import React, { useMemo } from 'react';
import { X, ArrowRight, FileJson, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface AuditLogDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: any; // Using any for flexibility with JSONB data
}

/**
 * AuditLogDetailsModal - Refactored for performance
 * Fixes: Infinite loop in useEffect, heavy rendering of large fields, and slow backdrop effects.
 */
export const AuditLogDetailsModal = React.memo(({ isOpen, onClose, log: initialLog }: AuditLogDetailsModalProps) => {
  const [fullLog, setFullLog] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [showRaw, setShowRaw] = React.useState(false);

  // Fetch details only when modal opens or ID changes
  React.useEffect(() => {
    if (!isOpen || !initialLog?.id) {
      setFullLog(null);
      return;
    }

    const fetchFullLog = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('id', initialLog.id)
          .single();

        if (!error && data) {
          setFullLog(data);
        }
      } catch (err) {
        console.error('Failed to fetch audit log details:', err);
      } finally {
        setLoading(false);
      }
    };

    // Use existing details if available, otherwise fetch
    if (initialLog.details) {
      setFullLog(initialLog);
    } else {
      fetchFullLog();
    }
  }, [isOpen, initialLog?.id]);

  const displayLog = fullLog || initialLog;
  const { action, details } = displayLog || {};
  const { old_data, new_data, table } = details || {};

  // Memoize differences to prevent expensive calculations on每一帧
  const changes = useMemo(() => {
    if (!old_data || !new_data) return [];

    // EXCLUDE extremely large/complex fields that aren't useful for comparison view
    const SKIP_FIELDS = ['updated_at', 'created_at', 'embedding', 'cv_text', 'search_vector', 'metadata', 'cv_link', 'profile_image'];

    const keys = new Set([...Object.keys(old_data), ...Object.keys(new_data)]);
    const diffs: { key: string; oldVal: any; newVal: any }[] = [];

    keys.forEach(key => {
      if (SKIP_FIELDS.includes(key)) return;

      const oldVal = old_data[key];
      const newVal = new_data[key];

      if (oldVal === newVal) return;

      // Deep comparison for objects, but be cautious of size
      try {
        const oldStr = typeof oldVal === 'object' ? JSON.stringify(oldVal) : String(oldVal);
        const newStr = typeof newVal === 'object' ? JSON.stringify(newVal) : String(newVal);

        if (oldStr !== newStr) {
          diffs.push({ key, oldVal, newVal });
        }
      } catch (e) {
        // Safety fallback
        diffs.push({ key, oldVal, newVal });
      }
    });

    return diffs;
  }, [old_data, new_data]);

  // Fast formatter for values in the table
  const formatValue = (val: any) => {
    if (val === null || val === undefined) return <span className="text-gray-400 italic">null</span>;
    if (typeof val === 'boolean') return val ? 'True' : 'False';

    if (typeof val === 'object') {
      try {
        if (Array.isArray(val)) return `Array(${val.length})`;
        const keys = Object.keys(val);
        if (keys.length > 5) return `Object {${keys.slice(0, 3).join(', ')} ...}`;
        const s = JSON.stringify(val);
        return s.length > 100 ? s.substring(0, 100) + '...' : s;
      } catch (e) {
        return '[Object]';
      }
    }

    const strVal = String(val);
    if (strVal.length > 200) return strVal.substring(0, 200) + '...';
    return strVal;
  };

  if (!isOpen || !initialLog) return null;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin mb-2 text-brand-500" />
          <p>Đang tải chi tiết...</p>
        </div>
      );
    }

    if (action?.includes('UPDATE')) {
      return (
        <div className="space-y-4">
          {changes.length === 0 ? (
            <div className="text-gray-500 italic text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              Không có thay đổi dữ liệu (chỉ cập nhật metadata)
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-100 dark:bg-gray-700/50 text-gray-500 uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-2 text-left w-1/4">Trường</th>
                    <th className="px-4 py-2 text-left">Cũ</th>
                    <th className="px-2 py-2 w-8"></th>
                    <th className="px-4 py-2 text-left">Mới</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {changes.map(({ key, oldVal, newVal }) => (
                    <tr key={key} className="hover:bg-white/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-gray-600 dark:text-gray-400">{key}</td>
                      <td className="px-4 py-3 text-red-600 bg-red-50/20 break-all">{formatValue(oldVal)}</td>
                      <td className="px-2 py-3 text-gray-400 text-center"><ArrowRight size={12} /></td>
                      <td className="px-4 py-3 text-green-600 bg-green-50/20 break-all">{formatValue(newVal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="text-[10px] text-brand-500 font-medium hover:underline flex items-center gap-1"
            >
              {showRaw ? 'Ẩn JSON' : 'Xem JSON thô (Dành cho Dev)'}
            </button>
            {showRaw && (
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="space-y-1">
                  <span className="text-[9px] text-gray-400 uppercase">Dữ liệu Cũ</span>
                  <pre className="p-2 bg-gray-900 text-gray-400 rounded-lg text-[9px] overflow-auto max-h-[200px] border border-gray-800">
                    {old_data ? (JSON.stringify(old_data).length > 20000 ? "⚠️ Dữ liệu quá lớn (>20KB)" : JSON.stringify(old_data, null, 2)) : 'null'}
                  </pre>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-gray-400 uppercase">Dữ liệu Mới</span>
                  <pre className="p-2 bg-gray-900 text-gray-400 rounded-lg text-[9px] overflow-auto max-h-[200px] border border-gray-800">
                    {new_data ? (JSON.stringify(new_data).length > 20000 ? "⚠️ Dữ liệu quá lớn (>20KB)" : JSON.stringify(new_data, null, 2)) : 'null'}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    const dataToShow = action?.includes('INSERT') ? new_data : old_data;
    if (!dataToShow) return <div className="text-gray-500 text-center py-8">Không có dữ liệu chi tiết</div>;

    return (
      <div className="bg-gray-900 rounded-lg p-4 font-mono text-[10px] text-gray-400 overflow-auto max-h-[400px] border border-gray-800">
        <pre className="whitespace-pre-wrap">
          {JSON.stringify(dataToShow).length > 40000 ? "⚠️ Dữ liệu quá lớn (>40KB)" : JSON.stringify(dataToShow, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 transition-opacity">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-50 dark:bg-brand-900/20 text-brand-600 rounded-lg"><FileJson size={18} /></div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Chi tiết thay đổi</h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">ID: {displayLog?.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
              <span className="text-[10px] uppercase text-gray-400 block mb-0.5 font-semibold">Hành động</span>
              <span className="font-bold text-xs text-gray-700 dark:text-gray-200">{action}</span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
              <span className="text-[10px] uppercase text-gray-400 block mb-0.5 font-semibold">Bảng</span>
              <span className="font-bold text-xs text-gray-700 dark:text-gray-200">{table || 'N/A'}</span>
            </div>
          </div>
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg font-bold text-xs transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
});
