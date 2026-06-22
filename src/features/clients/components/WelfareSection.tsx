
import { NotebookText } from 'lucide-react';
import type { NewClientData } from '../types';

interface WelfareSectionProps {
  formData: NewClientData;
  onChange: (field: keyof NewClientData, value: string) => void;
  isViewMode: boolean;
}

export const WelfareSection = ({ formData, onChange, isViewMode }: WelfareSectionProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
        <NotebookText className="w-5 h-5 text-brand-600" />
        <h2 className="font-semibold text-gray-900">Benefits & Description</h2>
      </div>
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-gray-700">Business Overview</label>
          <textarea
            rows={3}
            value={formData.business_overview || ''}
            onChange={(e) => onChange('business_overview', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-y disabled:bg-gray-50 font-medium"
            placeholder="Short description about the company..."
            disabled={isViewMode}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Working Hours</label>
          <input 
            type="text" 
            value={formData.working_hours || ''} 
            onChange={(e) => onChange('working_hours', e.target.value)} 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 font-medium" 
            placeholder="Mon-Fri..." 
            disabled={isViewMode}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Insurance</label>
          <input 
            type="text" 
            value={formData.insurance || ''} 
            onChange={(e) => onChange('insurance', e.target.value)} 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 font-medium" 
            placeholder="Full salary..." 
            disabled={isViewMode}
          />
        </div>
         <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Bonus</label>
            <input 
              type="text" 
              value={formData.bonus || ''} 
              onChange={(e) => onChange('bonus', e.target.value)} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 font-medium" 
              placeholder="13th month..." 
              disabled={isViewMode}
            />
        </div>
         <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Allowance</label>
            <input 
              type="text" 
              value={formData.allowance || ''} 
              onChange={(e) => onChange('allowance', e.target.value)} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 font-medium" 
              placeholder="Lunch, parking..." 
              disabled={isViewMode}
            />
        </div>
      </div>
    </div>
  );
};
