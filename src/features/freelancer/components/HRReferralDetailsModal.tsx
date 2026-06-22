
import { X, Calendar, Mail, Shield, Activity } from 'lucide-react';
import { useHRReferralDetails } from '../hooks';
import type { DateRange } from '../../../components/DateRangePicker';
import { format } from 'date-fns';

interface HRReferralDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hrId: string | null;
  hrName: string | null;
  dateRange: DateRange;
}

export const HRReferralDetailsModal = ({ isOpen, onClose, hrId, hrName, dateRange }: HRReferralDetailsModalProps) => {
  const { data, isLoading } = useHRReferralDetails(hrId, dateRange);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-linear-to-r from-amber-50/50 to-transparent">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-600" />
              Referral Details for {hrName}
            </h3>
              List of users invited during the selected period
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors order-last"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : data && data.length > 0 ? (
            <div className="overflow-hidden border border-gray-100 rounded-xl">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Registered At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.map((user) => (
                    <tr key={user.user_id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{user.full_name || 'N/A'}</span>
                          <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full w-fit">
                          <Shield className="w-3.5 h-3.5" />
                          <span className="text-xs font-bold">{user.role}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          user.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-500">
                        <div className="flex items-center justify-end gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(user.created_at), 'dd/MM/yyyy HH:mm')}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-20 text-center text-gray-400 italic">
              No data found.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 text-sm font-bold text-gray-700 hover:bg-white rounded-lg border border-gray-200 transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
