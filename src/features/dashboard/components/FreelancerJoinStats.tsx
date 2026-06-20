import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

interface FreelancerJoinStatsProps {
  timeFilter?: '1_day' | '3_days' | '1_week' | '1_month';
}
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function FreelancerJoinStats({ timeFilter: _timeFilter = '1_month' }: FreelancerJoinStatsProps) {
  const [stats] = useState({ stats: { daily: 1, weekly: 5, monthly: 20, total: 100 }, trend: [{ date: '2023-01-01', count: 5 }] });
  const [sourceStats] = useState([{ source: 'LinkedIn', count: 50 }, { source: 'Facebook', count: 30 }]);
  const [loading] = useState(false);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="rounded-xl bg-white px-6 py-6 shadow-sm border border-gray-200">
      <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">Thống kê Freelancer Join</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
           <p className="text-sm font-medium text-gray-600">Hôm nay</p>
           <p className="text-2xl font-bold text-blue-600">{stats.stats.daily}</p>
        </div>
         <div className="bg-green-50 p-4 rounded-lg">
           <p className="text-sm font-medium text-gray-600">Tuần này</p>
           <p className="text-2xl font-bold text-green-600">{stats.stats.weekly}</p>
        </div>
         <div className="bg-orange-50 p-4 rounded-lg">
           <p className="text-sm font-medium text-gray-600">Tháng này</p>
           <p className="text-2xl font-bold text-orange-600">{stats.stats.monthly}</p>
        </div>
         <div className="bg-purple-50 p-4 rounded-lg">
           <p className="text-sm font-medium text-gray-600">Tổng cộng</p>
           <p className="text-2xl font-bold text-purple-600">{stats.stats.total}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h5 className="text-lg font-semibold text-gray-800 mb-4">Xu hướng Join theo thời gian</h5>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip />
                <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
           <h5 className="text-lg font-semibold text-gray-800 mb-4">Join theo nguồn</h5>
           <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sourceStats} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="count" label>
                  {sourceStats.map((_entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
}
