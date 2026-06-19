import { TrendingUp } from 'lucide-react';

interface Props {
  data: {
    channels: Array<{ name: string; followers_start: number; followers_end: number; cv_received: number; posts_count: number; note?: string }>;
    note: string;
  };
  setData: (val: any) => void;
}

export default function SourcingChannelSection({ data, setData }: Props) {
  const channels = data.channels || [];
  const availableChannels = ['Facebook', 'LinkedIn', 'Indeed', 'Glassdoor', 'CareerBuilder', 'VietnamWorks', 'TopCV', 'Other'];

  const addChannel = () => {
    setData({
      ...data,
      channels: [...channels, {
        name: 'Facebook',
        followers_start: 0,
        followers_end: 0,
        cv_received: 0,
        posts_count: 0,
        note: ''
      }]
    });
  };

  const removeChannel = (index: number) => {
    setData({
      ...data,
      channels: channels.filter((_, i) => i !== index)
    });
  };

  const updateChannel = (index: number, field: string, value: any) => {
    const updated = [...channels];
    updated[index] = { ...updated[index], [field]: value };
    setData({ ...data, channels: updated });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp size={18} className="text-blue-600" />
          4. Sourcing Channel
        </h2>
      </div>
      <div className="p-4 space-y-3">
        {channels.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-400 mb-2">Chưa có kênh nào</p>
            <button
              onClick={addChannel}
              className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs font-semibold"
            >
              + Thêm kênh
            </button>
          </div>
        ) : (
          <>
            {channels.map((channel, index) => {
              const growth = channel.followers_end - channel.followers_start;
              const growthPercent = channel.followers_start > 0 ? ((growth / channel.followers_start) * 100).toFixed(1) : 0;

              return (
                <div key={index} className="p-3 border border-gray-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <select
                      value={channel.name}
                      onChange={(e) => updateChannel(index, 'name', e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded font-semibold text-xs focus:ring-2 focus:ring-brand-500"
                    >
                      {availableChannels.map(ch => (
                        <option key={ch} value={ch}>{ch}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeChannel(index)}
                      className="text-red-400 hover:text-red-600 text-xs font-semibold"
                    >
                      Xóa
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Followers trước</label>
                      <input
                        type="number"
                        value={channel.followers_start}
                        onChange={(e) => updateChannel(index, 'followers_start', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Followers sau</label>
                      <input
                        type="number"
                        value={channel.followers_end}
                        onChange={(e) => updateChannel(index, 'followers_end', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  <div className="p-2 bg-green-50 rounded">
                    <p className="text-xs font-semibold text-gray-700">
                      Tăng trưởng: <span className="font-bold text-green-600">+{growth}</span> ({growthPercent}%)
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">CV nhận</label>
                      <input
                        type="number"
                        value={channel.cv_received}
                        onChange={(e) => updateChannel(index, 'cv_received', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Bài đăng</label>
                      <input
                        type="number"
                        value={channel.posts_count}
                        onChange={(e) => updateChannel(index, 'posts_count', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  <input
                    type="text"
                    value={channel.note || ''}
                    onChange={(e) => updateChannel(index, 'note', e.target.value)}
                    placeholder="Ghi chú kênh này..."
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              );
            })}

            <button
              onClick={addChannel}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-xs font-semibold text-gray-600 hover:text-blue-600"
            >
              + Thêm kênh khác
            </button>
          </>
        )}

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Ghi chú chung</label>
          <textarea
            value={data.note || ''}
            onChange={(e) => setData({ ...data, note: e.target.value })}
            placeholder="Tổng quan về tất cả các kênh..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-xs"
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}
