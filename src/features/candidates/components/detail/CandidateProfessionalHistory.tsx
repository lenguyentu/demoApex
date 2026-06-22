import { Briefcase, Plus, X } from 'lucide-react';
import type { AnyCandidate, ProfessionalHistoryItem } from '../../types';

interface CandidateProfessionalHistoryProps {
  candidate: AnyCandidate;
  isEditing: boolean;
  professionalHistory: ProfessionalHistoryItem[];
  onHistoryChange: (index: number, field: string, value: string) => void;
  onAddHistory: () => void;
  onRemoveHistory: (index: number) => void;
}

export function CandidateProfessionalHistory({
  candidate,
  isEditing,
  professionalHistory,
  onHistoryChange,
  onAddHistory,
  onRemoveHistory,
}: CandidateProfessionalHistoryProps) {
  // Don't render if no history and not editing
  if (!candidate.professional_history && !isEditing) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-pink-600" />
          Professional History
        </h2>
        {isEditing && (
          <button 
            onClick={onAddHistory} 
            className="text-sm text-pink-600 hover:text-pink-700 flex items-center gap-1"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        )}
      </div>
      
      <div className="space-y-4">
        {isEditing ? (
          professionalHistory.map((history, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 relative bg-gray-50">
              <button 
                onClick={() => onRemoveHistory(index)} 
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input 
                  placeholder="Position" 
                  value={history.position || ''} 
                  onChange={(e) => onHistoryChange(index, 'position', e.target.value)} 
                  className="text-sm border-gray-300 rounded-md" 
                />
                <input 
                  placeholder="Company" 
                  value={history.companyName || history.company || ''} 
                  onChange={(e) => onHistoryChange(index, 'companyName', e.target.value)} 
                  className="text-sm border-gray-300 rounded-md" 
                />
                <input 
                  placeholder="Duration (e.g. 2020 - 2022)" 
                  value={history.duration || history.period || ''} 
                  onChange={(e) => onHistoryChange(index, 'duration', e.target.value)} 
                  className="text-sm border-gray-300 rounded-md" 
                />
                <textarea 
                  placeholder="Description" 
                  value={history.description || ''} 
                  onChange={(e) => onHistoryChange(index, 'description', e.target.value)} 
                  className="text-sm border-gray-300 rounded-md md:col-span-2" 
                  rows={2} 
                />
              </div>
            </div>
          ))
        ) : (
          Array.isArray(candidate.professional_history) ? (
            candidate.professional_history.map((history: ProfessionalHistoryItem, index: number) => (
              <div key={index} className="border-l-4 border-pink-500 pl-4 py-2">
                <div className="font-semibold text-sm text-gray-900">
                  {history.position || 'Position'}
                </div>
                <div className="text-xs text-gray-600">
                  {history.companyName || history.company || 'Company'}
                </div>
                {(history.duration || history.period) && (
                  <div className="text-xs text-gray-500">
                    {history.duration || history.period}
                  </div>
                )}
                {history.description && (
                  <div className="text-xs text-gray-700 mt-2 whitespace-pre-line">
                    {history.description}
                  </div>
                )}
              </div>
            ))
          ) : (
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
              {JSON.stringify(candidate.professional_history, null, 2)}
            </pre>
          )
        )}
      </div>
    </div>
  );
}
