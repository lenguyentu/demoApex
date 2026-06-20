import React, { useEffect, useState } from 'react';
import { X, Trophy, Loader2 } from 'lucide-react';
import { fetchCampaignLeaderboard, type CampaignLeaderboardRow } from '../api';

interface Props {
  campaignId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CampaignLeaderboardModal: React.FC<Props> = ({ campaignId, isOpen, onClose }) => {
  const [data, setData] = useState<CampaignLeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && campaignId) {
      setLoading(true);
      fetchCampaignLeaderboard(campaignId)
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, campaignId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="text-amber-500" />
            Top Dashboard
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Chưa có dữ liệu thống kê cho chiến dịch này.
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500 uppercase sticky top-0">
                  <tr>
                    <th className="px-6 py-4 font-medium w-16 text-center">Top</th>
                    <th className="px-6 py-4 font-medium">Freelancer</th>
                    <th className="px-6 py-4 font-medium text-center">Số lượng đạt</th>
                    <th className="px-6 py-4 font-medium text-right">Tổng thưởng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.map((row, index) => (
                    <tr key={row.freelancer_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold
                          ${index === 0 ? 'bg-amber-100 text-amber-700' :
                            index === 1 ? 'bg-gray-200 text-gray-700' :
                              index === 2 ? 'bg-orange-100 text-orange-700' :
                                'bg-gray-50 text-gray-500'}`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{row.freelancer_name || 'Người dùng ẩn danh'}</div>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-gray-700">
                        {row.process_count}
                      </td>
                      <td className="px-6 py-4 font-bold text-green-600 text-right">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(row.total_reward)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
