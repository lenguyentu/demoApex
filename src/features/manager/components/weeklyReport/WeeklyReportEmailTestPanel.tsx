import { useState, useEffect } from 'react';
import { Bell, Mail, Loader2, PlayCircle, Send, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  sendWeeklyReportDigestTest,
  sendWeeklyReportReminderTest,
} from '../../api';

interface Props {
  defaultWeekStart?: string;
}

function downloadXlsxFromBase64(base64: string, filename: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function WeeklyReportEmailTestPanel({ defaultWeekStart }: Props) {
  const [weekStart, setWeekStart] = useState(defaultWeekStart ?? '');
  const [digestEmail, setDigestEmail] = useState('utnl3002@gmail.com');
  const [reminderTestEmail, setReminderTestEmail] = useState('utnl3002@gmail.com');
  const [onlySaved, setOnlySaved] = useState(true);
  const [reminderDryRun, setReminderDryRun] = useState(true);
  const [digestDryRun, setDigestDryRun] = useState(true);
  const [busy, setBusy] = useState<'reminder' | 'reminderTest' | 'digest' | 'download' | null>(null);
  const [lastReminderPreview, setLastReminderPreview] = useState<string[]>([]);

  useEffect(() => {
    if (defaultWeekStart) setWeekStart(defaultWeekStart);
  }, [defaultWeekStart]);

  const weekParam = weekStart.trim() || undefined;

  const runReminderList = async () => {
    setBusy('reminder');
    try {
      const result = await sendWeeklyReportReminderTest({
        week_start: weekParam,
        dry_run: reminderDryRun,
      });
      if (result.error) throw new Error(result.error);
      const emails = result.sent ?? [];
      setLastReminderPreview(emails);
      if (reminderDryRun) {
        toast.success(
          `Dry-run: ${result.recipient_count ?? emails.length} HH/HH Lead · tuần ${result.week_start ?? ''}`
        );
      } else {
        toast.success(
          `Đã gửi ${result.sent_count ?? 0}/${result.recipient_count ?? emails.length} · tuần ${result.week_start ?? ''}`
        );
      }
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Lỗi';
      toast.error(
        msg.includes('Unauthorized')
          ? `${msg} — Chạy: supabase functions deploy weekly-report-reminder`
          : msg
      );
    } finally {
      setBusy(null);
    }
  };

  const runReminderTestMail = async () => {
    const to = reminderTestEmail.trim();
    if (!to.includes('@')) {
      toast.error('Nhập email test hợp lệ');
      return;
    }
    setBusy('reminderTest');
    try {
      const result = await sendWeeklyReportReminderTest({
        week_start: weekParam,
        dry_run: false,
        test_to: to,
      });
      if (result.error) throw new Error(result.error);
      if (result.dry_run || (result.sent_count ?? 0) === 0) {
        toast.error('Không gửi mail (dry-run?). Bỏ tick dry-run hoặc kiểm tra RESEND_API_KEY');
        return;
      }
      const resendHint = result.resend_id ? ` · ID: ${result.resend_id}` : '';
      toast.success(
        `${result.message ?? `Đã gửi nhắc tới ${to}`}${resendHint} — kiểm tra cả Hộp thư rác / Promotions`
      );
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Lỗi';
      toast.error(
        msg.includes('Unauthorized')
          ? `${msg} — Deploy: supabase functions deploy weekly-report-reminder`
          : msg
      );
    } finally {
      setBusy(null);
    }
  };

  const runDigest = async (downloadOnly = false) => {
    const trimmed = digestEmail.trim();
    if (!downloadOnly && !digestDryRun && (!trimmed || !trimmed.includes('@'))) {
      toast.error('Nhập email nhận hợp lệ');
      return;
    }

    setBusy(downloadOnly ? 'download' : 'digest');
    try {
      const result = await sendWeeklyReportDigestTest({
        to: trimmed || 'utnl3002@gmail.com',
        week_start: weekParam,
        only_saved_reports: onlySaved,
        dry_run: downloadOnly || digestDryRun,
        return_file: downloadOnly,
      });
      if (result.error) throw new Error(result.error);

      if (downloadOnly && result.xlsx_base64 && result.filename) {
        downloadXlsxFromBase64(result.xlsx_base64, result.filename);
        toast.success(`Đã tải ${result.filename} · ${result.member_count ?? 0} người`);
      } else if (digestDryRun) {
        toast.success(
          `OK: ${result.member_count ?? 0} người · ~${result.xlsx_bytes ?? 0} bytes — bấm「Tải Excel」để tải file`
        );
      } else {
        toast.success(
          `Đã gửi digest tới ${trimmed} · ${result.member_count ?? '?'} người (xem hộp thư + file đính kèm)`
        );
      }
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Digest thất bại');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mb-4 rounded-xl border border-dashed border-violet-300 bg-violet-50/90 overflow-hidden">
      <div className="px-4 py-2 border-b border-violet-200 bg-violet-100/60">
        <p className="text-xs font-bold text-violet-900 uppercase tracking-wide">
          Admin · Test lịch mail báo cáo tuần
        </p>
        <p className="text-[11px] text-violet-700 mt-0.5">
          Dry-run <strong>không tạo file trên máy</strong> — dùng「Tải Excel」hoặc「Gửi mail」mới có file.
          Nhắc lỗi 401 → deploy <code className="text-[10px]">weekly-report-reminder</code>.
        </p>
      </div>

      <div className="px-4 py-3 flex flex-wrap items-end gap-3 border-b border-violet-100">
        <div className="w-44">
          <label className="block text-xs font-medium text-gray-600 mb-1">week_start (T7)</label>
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            className="w-full border border-violet-200 rounded-lg px-3 py-2 text-sm bg-white"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-violet-100">
        <div className="px-4 py-3 space-y-3">
          <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Bell size={16} className="text-amber-600" />
            1. Nhắc 10:00 T7
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email test nhắc</label>
            <input
              type="email"
              value={reminderTestEmail}
              onChange={(e) => setReminderTestEmail(e.target.value)}
              className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm bg-white"
            />
          </div>
          <button
            type="button"
            onClick={runReminderTestMail}
            disabled={busy !== null}
            className="w-full px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {busy === 'reminderTest' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Gửi mail nhắc test (gửi thật qua Resend)
          </button>
          <p className="text-[10px] text-amber-800">
            Nút trên luôn gửi mail thật. Tick dry-run chỉ áp dụng「Xem danh sách HH」bên dưới.
          </p>
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={reminderDryRun}
              onChange={(e) => setReminderDryRun(e.target.checked)}
              className="rounded border-amber-300"
            />
            Dry-run khi gửi cả team (nút dưới)
          </label>
          <button
            type="button"
            onClick={runReminderList}
            disabled={busy !== null}
            className="w-full px-3 py-2 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg hover:bg-amber-200 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {busy === 'reminder' ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />}
            {reminderDryRun ? 'Xem danh sách HH' : 'Gửi nhắc cả team'}
          </button>
          {lastReminderPreview.length > 0 && (
            <p className="text-[10px] text-gray-500 break-all">
              {lastReminderPreview.slice(0, 4).join(', ')}
              {lastReminderPreview.length > 4 ? ` … +${lastReminderPreview.length - 4}` : ''}
            </p>
          )}
        </div>

        <div className="px-4 py-3 space-y-3">
          <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Mail size={16} className="text-violet-600" />
            2. Digest 12:00 T7
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email nhận (test)</label>
            <input
              type="email"
              value={digestEmail}
              onChange={(e) => setDigestEmail(e.target.value)}
              className="w-full border border-violet-200 rounded-lg px-3 py-2 text-sm bg-white"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={onlySaved}
              onChange={(e) => setOnlySaved(e.target.checked)}
              className="rounded border-violet-300"
            />
            Chỉ người đã lưu weekly_reports
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={digestDryRun}
              onChange={(e) => setDigestDryRun(e.target.checked)}
              className="rounded border-violet-300"
            />
            Dry-run trước khi gửi mail
          </label>
          <button
            type="button"
            onClick={() => runDigest(true)}
            disabled={busy !== null}
            className="w-full px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {busy === 'download' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Tải Excel về máy
          </button>
          <button
            type="button"
            onClick={() => runDigest(false)}
            disabled={busy !== null}
            className="w-full px-3 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {busy === 'digest' ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
            {digestDryRun ? 'Kiểm tra digest' : 'Gửi mail + file đính kèm'}
          </button>
        </div>
      </div>
    </div>
  );
}
