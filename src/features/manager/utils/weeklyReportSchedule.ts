const TZ = 'Asia/Ho_Chi_Minh';

/** Tuần làm việc: Thứ 7 (week_start) → hết Thứ 6. */
export type WeeklyReportSchedulePhase = 'collecting' | 'report_window' | 'closed';

export interface WeeklyReportSchedule {
  phase: WeeklyReportSchedulePhase;
  metricsCutoffAt: Date;
  reportDeadlineAt: Date;
  metricsLocked: boolean;
  canSaveReport: boolean;
  metricsCutoffLabel: string;
  reportDeadlineLabel: string;
  bannerMessage: string;
}

function parseISODate(isoDate: string): { y: number; m: number; d: number } {
  const [y, m, d] = isoDate.split('-').map(Number);
  return { y, m, d };
}

/** Cộng ngày trên chuỗi YYYY-MM-DD (theo lịch, không phụ thuộc timezone máy client). */
export function addDaysToDateString(isoDate: string, days: number): string {
  const { y, m, d } = parseISODate(isoDate);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().split('T')[0];
}

/** Chuyển ngày + giờ VN (UTC+7) sang `Date` UTC. */
function vnLocalToDate(isoDate: string, hour: number, minute: number): Date {
  const { y, m, d } = parseISODate(isoDate);
  return new Date(Date.UTC(y, m - 1, d, hour - 7, minute, 0));
}

/** Thứ trong tuần theo giờ VN (0 = CN … 6 = T7). */
export function getVNDayOfWeek(now: Date = new Date()): number {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'short',
  }).format(now);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[weekday] ?? 0;
}

export function getVNHour(now: Date = new Date()): number {
  return parseInt(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: TZ,
      hour: '2-digit',
      hour12: false,
    }).format(now),
    10
  );
}

/** Sáng Thứ 7 trước 12:00 — cửa sổ nộp báo cáo tuần vừa chốt. */
export function isSaturdayReportWindow(now: Date = new Date()): boolean {
  return getVNDayOfWeek(now) === 6 && getVNHour(now) < 12;
}

/**
 * Tuần báo cáo mặc định trên UI:
 * - T7 00:00–11:59: vẫn là tuần T7→T6 vừa kết thúc (week_start lùi 7 ngày)
 * - Còn lại: tuần hiện tại theo `get_week_start`
 */
export function getReportingWeekStart(calendarWeekStart: string, now: Date = new Date()): string {
  if (isSaturdayReportWindow(now)) {
    return addDaysToDateString(calendarWeekStart, -7);
  }
  return calendarWeekStart;
}

/** 00:00 Thứ 7 (sau khi hết Thứ 6) — chốt chỉ số tự động. */
export function getMetricsCutoffAt(weekStart: string): Date {
  const saturday = addDaysToDateString(weekStart, 7);
  return vnLocalToDate(saturday, 0, 0);
}

/** 12:00 Thứ 7 — hạn nộp báo cáo tuần. */
export function getReportDeadlineAt(weekStart: string): Date {
  const saturday = addDaysToDateString(weekStart, 7);
  return vnLocalToDate(saturday, 12, 0);
}

function formatVNDateTime(date: Date): string {
  return date.toLocaleString('vi-VN', {
    timeZone: TZ,
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function getWeeklyReportSchedule(
  weekStart: string,
  now: Date = new Date()
): WeeklyReportSchedule {
  const metricsCutoffAt = getMetricsCutoffAt(weekStart);
  const reportDeadlineAt = getReportDeadlineAt(weekStart);
  const metricsLocked = now >= metricsCutoffAt;
  const canSaveReport = now < reportDeadlineAt;

  let phase: WeeklyReportSchedulePhase;
  if (!metricsLocked) {
    phase = 'collecting';
  } else if (canSaveReport) {
    phase = 'report_window';
  } else {
    phase = 'closed';
  }

  const metricsCutoffLabel = formatVNDateTime(metricsCutoffAt);
  const reportDeadlineLabel = formatVNDateTime(reportDeadlineAt);

  const manualSectionsHint =
    'Candidate Tracker, Sourcing, Vấn đề, Kế hoạch tuần sau, Self-review vẫn nhập bình thường';

  let bannerMessage: string;
  if (phase === 'collecting') {
    bannerMessage = `Chỉ số KPI/Pipeline đang cập nhật (T7→T6). Chốt số lúc ${metricsCutoffLabel}. Nộp báo cáo (các mục thủ công) trước ${reportDeadlineLabel}.`;
  } else if (phase === 'report_window') {
    bannerMessage = `Đã chốt chỉ số KPI/Pipeline lúc ${metricsCutoffLabel}. ${manualSectionsHint} — lưu báo cáo trước ${reportDeadlineLabel}.`;
  } else {
    bannerMessage = `Đã hết hạn nộp báo cáo (${reportDeadlineLabel}). Chỉ số KPI/Pipeline đã chốt từ ${metricsCutoffLabel}.`;
  }

  return {
    phase,
    metricsCutoffAt,
    reportDeadlineAt,
    metricsLocked,
    canSaveReport,
    metricsCutoffLabel,
    reportDeadlineLabel,
    bannerMessage,
  };
}
