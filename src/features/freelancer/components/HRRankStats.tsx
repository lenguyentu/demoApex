import { Trophy, ChevronDown, ChevronUp, ExternalLink, Mail, FileText } from 'lucide-react';
import { useState } from 'react';
import { useFreelancerPerformanceStats } from '../hooks';
import type { DateRange } from '../../../components/DateRangePicker';

interface HRRankStatsProps {
  dateRange: DateRange;
  onSelectHeadhunt?: (id: string) => void;
}

export const HRRankStats = ({ dateRange, onSelectHeadhunt }: HRRankStatsProps) => {
  const [limit, setLimit] = useState(5);
  // Re-fetch or use the hook with limit (actually hook uses PAGE_SIZE=15, we'll just slice)
  const { data, loading } = useFreelancerPerformanceStats('', dateRange);

  const toggleLimit = () => {
    setLimit(prev => prev === 5 ? 10 : 5);
  };

  const topData = data ? data.slice(0, limit) : [];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-linear-to-r from-amber-50/50 to-transparent">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-amber-100 rounded-lg shadow-sm">
            <Trophy className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Headhunt Ranking (By CV Sent)</h3>
            <p className="text-sm text-gray-500 mt-0.5">Top headhunters by number of CVs sent to TDC</p>
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

      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {loading && topData.length === 0 ? (
                Array(4).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-gray-50 animate-pulse">
                        <div className="h-4 bg-gray-100 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-100 rounded w-48"></div>
                    </div>
                ))
            ) : topData.length > 0 ? (
                topData.map((item, index) => (
                    <div key={item.id} className="group relative p-4 rounded-xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50/20 transition-all flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 overflow-hidden">
                           <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shadow-sm ${
                                index === 0 ? 'bg-amber-400 text-white' : index === 1 ? 'bg-slate-300 text-slate-700' : index === 2 ? 'bg-amber-700 text-white' : 'bg-gray-100 text-gray-500'
                           }`}>
                                {index + 1}
                           </div>
                           <div className="min-w-0 pr-4">
                              <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-amber-800 transition-colors">
                                  {item.name || 'N/A'}
                              </h4>
                              <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                                 <Mail className="w-3 h-3" />
                                 {item.email || 'no-email'}
                              </p>
                           </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 shadow-sm flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    {item.cvToTDC} CVs
                                </span>
                            </div>
                            {onSelectHeadhunt && (
                              <button 
                                  onClick={() => onSelectHeadhunt(item.id)}
                                  className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-100/50 rounded-lg transition-all"
                                  title="View details"
                              >
                                  <ExternalLink className="w-4 h-4" />
                              </button>
                            )}
                        </div>
                    </div>
                ))
            ) : (
                <div className="col-span-full py-12 text-center text-gray-400 italic">
                    No ranking data available for this period.
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
