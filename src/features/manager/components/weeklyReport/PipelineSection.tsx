import { useMemo } from 'react';
import { Target } from 'lucide-react';

interface Props {
  jobs: any[];
  stats: any[];
}

export default function PipelineSection({ jobs, stats }: Props) {
  const statsMap = useMemo(() => {
    const map = new Map();
    stats.forEach((s) => map.set(s.job_id, s));
    return map;
  }, [stats]);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <Target size={18} className="text-purple-600" />
          2. Pipeline theo Job
        </h2>
      </div>
      <div className="p-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 font-bold text-gray-700">Job</th>
              <th className="text-left py-2 font-bold text-gray-700">Client</th>
              <th className="text-center py-2 font-bold text-gray-700 w-16">CV</th>
              <th className="text-center py-2 font-bold text-gray-700 w-16">IV</th>
              <th className="text-center py-2 font-bold text-gray-700 w-16">Offer</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-gray-400 text-xs">
                  Chưa có job nào được giao tuần này
                </td>
              </tr>
            ) : (
              jobs.map((job) => {
                const stat = statsMap.get(job.job_id) || {
                  cv_client: 0,
                  interview: 0,
                  offer: 0,
                };

                return (
                  <tr key={job.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 font-semibold text-gray-800">{job.position_title}</td>
                    <td className="py-2 text-gray-700">{job.client_name}</td>
                    <td className="text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-bold text-xs">
                        {stat.cv_client}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 text-orange-700 font-bold text-xs">
                        {stat.interview}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-700 font-bold text-xs">
                        {stat.offer}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
