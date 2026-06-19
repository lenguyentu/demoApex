export interface WeeklyReportRevenueRow {
  id: number;
  candidate: string;
  position: string;
  client: string;
  salary: number;
  rate: number;
  bill: number;
}

export const EMPTY_REVENUE_ROW: WeeklyReportRevenueRow = {
  id: 1,
  candidate: '',
  position: '',
  client: '',
  salary: 0,
  rate: 0,
  bill: 0,
};

export function parseRevenueTracker(raw: unknown): WeeklyReportRevenueRow[] {
  let arr: unknown[] = [];
  if (Array.isArray(raw)) arr = raw;
  else if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) arr = parsed;
    } catch {
      /* ignore */
    }
  }

  const rows = arr
    .map((item, index) => {
      const r = item as Record<string, unknown>;
      const salary = Number(r.salary) || 0;
      const rate = Number(r.rate) || 0;
      const bill = Number(r.bill) || salary * rate;
      return {
        id: Number(r.id) || index + 1,
        candidate: String(r.candidate ?? ''),
        position: String(r.position ?? ''),
        client: String(r.client ?? ''),
        salary,
        rate,
        bill,
      };
    })
    .filter(
      (r) =>
        r.candidate.trim() ||
        r.position.trim() ||
        r.client.trim() ||
        r.salary > 0 ||
        r.rate > 0,
    );

  return rows.length > 0 ? rows : [{ ...EMPTY_REVENUE_ROW }];
}

export function serializeRevenueTracker(rows: WeeklyReportRevenueRow[]): WeeklyReportRevenueRow[] {
  return rows
    .map((r) => {
      const salary = Number(r.salary) || 0;
      const rate = Number(r.rate) || 0;
      return {
        id: r.id,
        candidate: r.candidate.trim(),
        position: r.position.trim(),
        client: r.client.trim(),
        salary,
        rate,
        bill: Number(r.bill) || salary * rate,
      };
    })
    .filter(
      (r) =>
        r.candidate ||
        r.position ||
        r.client ||
        r.salary > 0 ||
        r.rate > 0,
    );
}
