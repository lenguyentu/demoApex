
import { useState } from 'react';
import { Briefcase, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid
} from 'recharts';
import { useTopJobsByCVCount } from '../hooks';
import type { DateRange } from '../../../components/DateRangePicker';

interface TopJobsStatsProps {
  dateRange: DateRange;
}

const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#10B981', '#6366F1', '#14B8A6', '#F59E0B', '#EF4444', '#64748B'];

export const TopJobsStats = ({ dateRange }: TopJobsStatsProps) => {
  const [limit, setLimit] = useState(5);
  const { data, isLoading } = useTopJobsByCVCount(dateRange, limit);

  const chartData = data?.map((item, index) => ({
    name: item.position_title,
    cv_count: Number(item.cv_count),
    color: COLORS[index % COLORS.length]
  })) || [];

  const toggleLimit = () => {
    setLimit(prev => prev === 5 ? 10 : 5);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-rose-50 rounded-lg">
            <Briefcase className="w-5 h-5 text-[#ED0A63]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Most Submitted Positions</h3>
            <p className="text-sm text-gray-500 mt-0.5">Ranked by number of CVs from freelancers</p>
          </div>
        </div>
        
        <button 
          onClick={toggleLimit}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 shadow-sm active:scale-95 transition-all"
        >
          {limit === 5 ? 'View more' : 'View less'}
          {limit === 5 ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Chart */}
        <div className="lg:col-span-5 h-[320px] w-full">
          {isLoading ? (
             <div className="w-full h-full flex flex-col justify-center space-y-6 animate-pulse px-4">
                {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <div className="h-3 bg-gray-100 w-24 rounded"></div>
                        <div className="h-8 bg-gray-100 flex-1 rounded-sm" style={{width: `${80 - i * 15}%`}}></div>
                    </div>
                ))}
            </div>
          ) : data && data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={chartData}
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={120} 
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Bar dataKey="cv_count" barSize={32} radius={[0, 6, 6, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 italic">
              No data available
            </div>
          )}
        </div>

        {/* Right Side: Table/List */}
        <div className="lg:col-span-7 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-left">
                <th className="pb-4 px-4 w-12 text-center">#</th>
                <th className="pb-4 px-4">Position</th>
                <th className="pb-4 px-4">Company</th>
                <th className="pb-4 px-4 text-right">Total CVs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-6 w-6 bg-gray-100 rounded-full mx-auto"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-gray-100 rounded w-32"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-gray-100 rounded w-8 ml-auto"></div></td>
                  </tr>
                ))
              ) : data && data.length > 0 ? (
                data.map((item, index) => (
                  <tr key={item.job_id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-4 text-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm`} style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm font-semibold text-gray-900 group-hover:text-[#ED0A63] transition-colors">
                        {item.position_title}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-500">
                        {item.client_name}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="text-sm font-bold text-rose-500 bg-rose-50 px-3 py-1 rounded-full inline-block">
                        {item.cv_count}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan={4} className="py-8 text-center text-gray-500 italic">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
