import { MessageSquare } from 'lucide-react';

interface Props {
  issues: string;
  setIssues: (val: string) => void;
}

export default function IssuesSection({ issues, setIssues }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare size={18} className="text-yellow-600" />
          5. Vấn đề & Hành động
        </h2>
      </div>
      <div className="p-4">
        <textarea
          value={issues}
          onChange={(e) => setIssues(e.target.value)}
          placeholder="Vấn đề gặp phải, nguyên nhân, hành động khắc phục..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          rows={4}
        />
      </div>
    </div>
  );
}
