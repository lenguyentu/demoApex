import { AlertTriangle, Mail, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import PageMeta from '../../../components/common/PageMeta';

// ── Mock Data ─────────────────────────────────────────────────────────────────
const TIMING = [
  { icon: '📄', label: 'CV Submitted',    days: '5d' },
  { icon: '🎤', label: 'Actual Interview', days: '5d' },
  { icon: '🚀', label: 'Pre-Onboard',     days: '1d' },
  { icon: '🌱', label: 'Day-1 Follow',    days: '24h' },
  { icon: '📞', label: '7-day Follow',    days: '7d' },
  { icon: '📅', label: '30-day Follow',   days: '30d' },
  { icon: '🏁', label: '60-day Follow',   days: '60d' },
];

const DONE_TODAY = [
  'Nguyễn Trung Đức — Day-1 Follow · VCS',
  'Đinh Trung Hiếu — 60-day Follow · Pixon',
];

const PROCESSES = [
  {
    id: '1',
    name: 'Trần Thị Bích',
    job: 'Senior PM',
    client: 'Techbank',
    stage: 'Actual Interview',
    urgency: 'overdue',
    urgencyLabel: 'Quá 2 ngày',
    actionIcon: '🎤',
    hh_note: 'Phỏng vấn xong 10/4 — chờ KH',
    kh_note: '',
    notifications: [
      { type: 'mail',     label: 'Mail gửi 07:00' },
      { type: 'discord',  label: 'Discord @headhunter' },
      { type: 'telegram', label: 'Telegram @dungheadhunter' },
    ],
  },
  {
    id: '2',
    name: 'Nguyễn Tiến Anh',
    job: 'Game Designer',
    client: 'Champion',
    stage: 'CV Submitted',
    urgency: 'today',
    urgencyLabel: 'Hôm nay',
    actionIcon: '📄',
    hh_note: 'Tình hình từ UV...',
    kh_note: '',
    notifications: [],
  },
  {
    id: '3',
    name: 'Phạm Thị Dung',
    job: 'HR Manager',
    client: 'Teemazing',
    stage: '7-day Follow',
    urgency: 'today',
    urgencyLabel: 'Hôm nay',
    actionIcon: '📞',
    hh_note: 'NV hài lòng với môi trường',
    kh_note: '',
    notifications: [],
  },
  {
    id: '4',
    name: 'Lê Minh Cường',
    job: 'Pentest Manager',
    client: 'CyberSec VN',
    stage: 'Pre-Onboard',
    urgency: 'tomorrow',
    urgencyLabel: 'Còn 1 ngày',
    actionIcon: '🚀',
    hh_note: 'Tình hình từ UV...',
    kh_note: '',
    notifications: [],
  },
];

// ── Sub Components ─────────────────────────────────────────────────────────────
function UrgencyBadge({ urgency, label }: { urgency: string; label: string }) {
  const styles = {
    overdue:  'text-red-600 bg-red-50 border border-red-200',
    today:    'text-orange-600 bg-orange-50 border border-orange-200',
    tomorrow: 'text-blue-600 bg-blue-50 border border-blue-200',
  }[urgency] ?? 'text-gray-500 bg-gray-50';

  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles}`}>
      {label}
    </span>
  );
}

function NotifIcon({ type }: { type: string }) {
  if (type === 'mail')     return <Mail size={13} className="text-gray-400" />;
  if (type === 'discord')  return <MessageSquare size={13} className="text-indigo-400" />;
  if (type === 'telegram') return <Send size={13} className="text-blue-400" />;
  return null;
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function HHProcessPage() {
  const overdueCount = PROCESSES.filter(p => p.urgency === 'overdue').length;

  return (
    <>
      <PageMeta title="Process & Follow-up" />
      <div className="p-6">
        <div className="flex gap-6">

          {/* Left — Action list */}
          <div className="flex-1 min-w-0 space-y-4">
            <h1 className="text-base font-semibold text-gray-500 uppercase tracking-wider">
              Process & Follow-up · Cần action hôm nay
            </h1>

            {/* Alert */}
            {overdueCount > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
                <AlertTriangle size={15} className="shrink-0" />
                {overdueCount} process đã quá deadline — Discord + Telegram đã gửi cảnh báo tự động.
              </div>
            )}

            {/* Section header */}
            <p className="text-sm font-semibold text-gray-700">Cần action ngay</p>

            {/* Process cards */}
            <div className="space-y-3">
              {PROCESSES.map(p => (
                <div key={p.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                  p.urgency === 'overdue' ? 'border-red-200' : 'border-gray-100'
                }`}>
                  {/* Card header */}
                  <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-gray-50">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{p.job} · {p.client} · {p.stage}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <UrgencyBadge urgency={p.urgency} label={p.urgencyLabel} />
                      <span className="text-lg">{p.actionIcon}</span>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="grid grid-cols-2 gap-0 divide-x divide-gray-50">
                    <div className="px-4 py-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">HH Note</p>
                      <textarea
                        defaultValue={p.hh_note}
                        placeholder="Tình hình từ UV..."
                        rows={2}
                        className="w-full text-xs text-gray-700 bg-transparent resize-none focus:outline-none placeholder-gray-300"
                      />
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">KH Note</p>
                      <textarea
                        defaultValue={p.kh_note}
                        placeholder="Phản hồi từ HM..."
                        rows={2}
                        className="w-full text-xs text-gray-700 bg-transparent resize-none focus:outline-none placeholder-gray-300"
                      />
                    </div>
                  </div>

                  {/* Notifications */}
                  {p.notifications.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-50 flex items-center gap-3">
                      {p.notifications.map((n, i) => (
                        <span key={i} className="flex items-center gap-1 text-xs text-gray-400">
                          <NotifIcon type={n.type} />
                          {n.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right — Timing + Done */}
          <div className="w-64 shrink-0 space-y-4">

            {/* Timing */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Timing</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {TIMING.map(t => (
                  <div key={t.label} className="flex items-center gap-1.5">
                    <span className="text-sm">{t.icon}</span>
                    <div>
                      <p className="text-[10px] text-gray-500 leading-tight">{t.label}</p>
                      <p className="text-xs font-bold text-gray-700">{t.days}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Done today */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Đã xử lý hôm nay</p>
              <div className="space-y-2">
                {DONE_TODAY.map((d, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="text-green-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-gray-400 line-through">{d}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
