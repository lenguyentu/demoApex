import  { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { RefreshCw, Unlock, Lock } from 'lucide-react';

interface HHStatus {
  user_id: string;
  full_name: string;
  has_morning: boolean;
  has_afternoon: boolean;
  has_exception: boolean;
}

const getTodayVn = () => new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().split('T')[0];

const ManageDailyPlansPage = () => {
  const [hhStatusList, setHhStatusList] = useState<HHStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayVn());

  const fetchData = async () => {
    setLoading(true);

    // Lấy danh sách nhân sự
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name')
      .in('role', ['BD', 'Headhunter', 'BD Lead', 'HH Lead', 'Researcher'])
      .eq('is_active', true)
      .order('full_name');

    // Lấy data Daily Plan của ngày đang chọn
    const { data: plans } = await supabase
      .from('hh_daily_plans')
      .select('user_id, has_morning, has_afternoon')
      .eq('plan_date', selectedDate);

    // Lấy data Ngoại lệ cấp quyền nộp muộn
    const { data: exceptions } = await supabase
      .from('hh_daily_plan_exceptions')
      .select('user_id')
      .eq('plan_date', selectedDate);

    if (users) {
      const list = users.map(u => {
        const plan = plans?.find(p => p.user_id === u.id);
        const exc = exceptions?.find(e => e.user_id === u.id);
        return {
          user_id: u.id,
          full_name: u.full_name,
          has_morning: plan?.has_morning || false,
          has_afternoon: plan?.has_afternoon || false,
          has_exception: !!exc
        };
      });
      setHhStatusList(list);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const handleToggleException = async (userId: string, currentStatus: boolean) => {
    if (currentStatus) {
      // Hủy quyền
      await supabase.from('hh_daily_plan_exceptions').delete().eq('user_id', userId).eq('plan_date', selectedDate);
    } else {
      // Cấp quyền
      await supabase.from('hh_daily_plan_exceptions').insert({ user_id: userId, plan_date: selectedDate });
    }
    fetchData(); // Reload lại bảng
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
       <div className="w-full">
         <div className="flex justify-between items-center mb-8">
           <div>
             <h1 className="text-2xl font-bold text-gray-800">Daily Plan Management</h1>
             <p className="text-gray-500 mt-1">Track plan submission status and grant late arrival exceptions.</p>
           </div>
           <div className="flex items-center gap-4">
             <input 
               type="date"
               value={selectedDate}
               onChange={(e) => setSelectedDate(e.target.value)}
               className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 shadow-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
             />
             <button 
               onClick={fetchData} 
               disabled={loading}
               title="Refresh data"
               className="flex items-center justify-center p-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-gray-600 hover:text-gray-900"
             >
               <RefreshCw size={20} className={loading ? "animate-spin" : ""} /> 
             </button>
           </div>
         </div>
         
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="bg-gray-50 border-b border-gray-200 text-sm uppercase tracking-wider">
                 <th className="p-4 font-semibold text-gray-600">Headhunter</th>
                 <th className="p-4 font-semibold text-gray-600">Morning Plan (By 09:00)</th>
                 <th className="p-4 font-semibold text-gray-600">Afternoon Plan (By 13:20)</th>
                 <th className="p-4 font-semibold text-gray-600 text-center">Exception (Late Arrival)</th>
               </tr>
             </thead>
             <tbody>
               {hhStatusList.map(h => (
                 <tr key={h.user_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                   <td className="p-4 font-medium text-gray-800">{h.full_name}</td>
                   <td className="p-4">
                     {h.has_morning 
                       ? <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Submitted</span> 
                       : <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm font-medium">Missing</span>}
                   </td>
                   <td className="p-4">
                     {h.has_afternoon 
                       ? <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Submitted</span> 
                       : <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm font-medium">Missing</span>}
                   </td>
                   <td className="p-4 text-center">
                     {h.has_exception ? (
                       <button 
                         onClick={() => handleToggleException(h.user_id, true)} 
                         className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 w-40 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 text-sm font-medium transition-colors"
                       >
                         <Unlock size={14} /> Đã cấp quyền
                       </button>
                     ) : (
                       <button 
                         onClick={() => handleToggleException(h.user_id, false)} 
                         className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 w-40 bg-gray-100 text-gray-600 border border-gray-200 rounded-lg hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 text-sm font-medium transition-colors"
                       >
                         <Lock size={14} /> Mở khóa form
                       </button>
                     )}
                   </td>
                 </tr>
               ))}
               {hhStatusList.length === 0 && (
                 <tr>
                   <td colSpan={4} className="p-8 text-center text-gray-500">
                     {loading ? 'Loading data...' : 'No Headhunters found'}
                   </td>
                 </tr>
               )}
             </tbody>
           </table>
         </div>
       </div>
    </div>
  );
};

export default ManageDailyPlansPage;
