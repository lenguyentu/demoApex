import { TrendingUp } from 'lucide-react';

interface Props {
  reportData: any;
  approaches: number;
  metricsLocked?: boolean;
  metricsCutoffLabel?: string;
}

export default function KPIFunnelSection({
  reportData,
  approaches,
  metricsLocked,
  metricsCutoffLabel,
}: Props) {
  if (!reportData) return null;
  const { current_week, monthly_accumulated } = reportData;

  const metrics = [
    {
      label: 'Number of approaches',
      target: 150, // Fixed: 150/tuần
      actual: approaches,
      accumulated: monthly_accumulated.approaches || 0,
    },
    {
      label: 'CV sent to database',
      target: 25, // Fixed: 25/tuần
      actual: current_week.cv_to_db,
      accumulated: monthly_accumulated.cv_to_db || 0,
    },
    {
      label: 'CV sent to client',
      target: 10, // Fixed: 10/tuần
      actual: current_week.cv_client,
      accumulated: monthly_accumulated.cv_client,
    },
    {
      label: 'Set up interview',
      target: 3, // Fixed: 3/tuần
      actual: current_week.interview_scheduled || 0,
      accumulated: monthly_accumulated.interview,
    },
    {
      label: 'Actual interview',
      target: 2, // Fixed: 2/tuần
      actual: current_week.interview_completed || 0,
      accumulated: monthly_accumulated.interview,
    },
    {
      label: 'Offer',
      target: 1, // Fixed: 1/tuần
      actual: current_week.offer,
      accumulated: monthly_accumulated.offer,
    },
    {
      label: 'Placement',
      target: 0, // Fixed: 0/tuần (không có target cố định)
      actual: current_week.onboard,
      accumulated: monthly_accumulated.onboard,
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-gradient-to-r from-brand-50 to-purple-50 border-b border-gray-100">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp size={18} className="text-brand-600" />
            1. KPI Funnel
          </h2>
          {metricsLocked && (
            <p className="text-[11px] text-amber-700 mt-1">
              Đã chốt {metricsCutoffLabel ? `lúc ${metricsCutoffLabel}` : '00:00 Thứ 7'} — Actual không đổi sau mốc này
            </p>
          )}
        </div>
      </div>
      <div className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 font-bold text-gray-700">Indicators</th>
                <th className="text-center py-2 font-bold text-gray-700 w-20">Target</th>
                <th className="text-center py-2 font-bold text-gray-700 w-20">Actual</th>
                <th className="text-center py-2 font-bold text-gray-700 w-16">%</th>
                <th className="text-center py-2 font-bold text-gray-700 w-20">Tháng</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric, idx) => {
                const percent = metric.target > 0 ? Math.round((metric.actual / metric.target) * 100) : 0;
                const colorClass =
                  percent >= 100 ? 'text-green-600 font-bold' : percent >= 70 ? 'text-yellow-600 font-bold' : 'text-red-600 font-bold';

                return (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 font-medium text-gray-800">{metric.label}</td>
                    <td className="text-center font-semibold text-gray-700">{metric.target}</td>
                    <td className="text-center">
                      <span className="font-semibold text-gray-800">{metric.actual}</span>
                    </td>
                    <td className={`text-center ${colorClass}`}>{percent}%</td>
                    <td className="text-center text-gray-600 font-medium">{metric.accumulated}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
