import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableClientCardProps {
  title: string;
  value: number;
  icon: any; 
  color: 'brand' | 'emerald' | 'orange' | 'amber' | 'cyan' | 'violet';
  loading?: boolean;
  formatValue?: (value: number) => string;
  selectedUserId?: string;
  authUserRole?: string;
  session?: any;
  timeFilter?: string;
}

export default function ExpandableClientCard({ 
  title, value, icon, color, loading = false, formatValue 
}: ExpandableClientCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [phaseStats] = useState([
    { phase: 'Connect', count: 10 },
    { phase: 'Proposal', count: 5 },
    { phase: 'Negotiation', count: 2 }
  ]);
  const [phaseLoading] = useState(false);

  const iconClasses = {
      brand: 'bg-blue-100', emerald: 'bg-emerald-100', orange: 'bg-orange-100', 
      amber: 'bg-amber-100', cyan: 'bg-cyan-100', violet: 'bg-violet-100'
  };
    const colorClasses = {
    brand: 'bg-blue-50 text-blue-600', emerald: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600', amber: 'bg-amber-50 text-amber-600',
    cyan: 'bg-cyan-50 text-cyan-600', violet: 'bg-violet-50 text-violet-600'
  };
  const phaseColors: any = {
    'Connect': 'bg-blue-100 text-blue-800',
    'Proposal': 'bg-yellow-100 text-yellow-800',
    'Negotiation': 'bg-orange-100 text-orange-800',
    'Contract': 'bg-purple-100 text-purple-800',
    'Closed_Won': 'bg-green-100 text-green-800',
    'Closed_Lost': 'bg-red-100 text-red-800'
  };

  const handleToggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200">
      <div className="p-6 cursor-pointer hover:bg-gray-50 transition-colors" onClick={handleToggleExpand}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
            {loading ? (
              <div className="h-8 w-20 bg-gray-200 animate-pulse rounded mt-2"></div>
            ) : (
              <p className="text-2xl font-semibold mt-2">{formatValue ? formatValue(value) : value.toLocaleString()}</p>
            )}
          </div>
          <div className={`p-3 rounded-full ${iconClasses[color]} ml-4`}>
             {icon && React.createElement(icon, { className: `w-5 h-5 ${colorClasses[color]}` })}
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="border-t border-gray-200 px-6 py-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">BD Process Phases</h4>
          {phaseLoading ? (
            <div className="space-y-2"><div className="h-4 bg-gray-200 animate-pulse rounded"></div></div>
          ) : (
            <div className="space-y-2">
              {phaseStats.map(({ phase, count }) => (
                <div key={phase} className="flex justify-between items-center py-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${phaseColors[phase] || 'bg-gray-100 text-gray-800'}`}>
                    {phase}
                  </span>
                  <span className="font-semibold text-gray-900">{count}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-100 flex justify-between items-center font-semibold">
                <span className="text-gray-700">Total</span>
                <span className="text-gray-900">{phaseStats.reduce((sum, s) => sum + s.count, 0)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
