import { Award } from 'lucide-react';

interface Props {
  data: {
    score: number;
    lessons: string;
    support: string;
  };
  setData: (val: any) => void;
}

export default function SelfReviewSection({ data, setData }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <Award size={18} className="text-purple-600" />
          8. Self-review
        </h2>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Điểm tự đánh giá (1-10)</label>
          <input
            type="number"
            min="1"
            max="10"
            value={data.score}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 1;
              setData({ ...data, score: Math.min(10, Math.max(1, val)) });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Bài học rút ra</label>
          <textarea
            value={data.lessons}
            onChange={(e) => setData({ ...data, lessons: e.target.value })}
            placeholder="Những gì học được tuần này..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Cần hỗ trợ từ quản lý</label>
          <textarea
            value={data.support}
            onChange={(e) => setData({ ...data, support: e.target.value })}
            placeholder="Cần giúp đỡ về..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}
