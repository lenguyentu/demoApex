
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
        <h2 className="font-semibold text-gray-900">Phúc lợi & Mô tả</h2>
      </div>
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-gray-700">Tổng quan doanh nghiệp</label>
          <textarea
            rows={3}
            value={formData.business_overview || ''}
            onChange={(e) => onChange('business_overview', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-y disabled:bg-gray-50 font-medium"
            placeholder="Mô tả ngắn về công ty..."
            disabled={isViewMode}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Thời gian làm việc</label>
          <input 
            type="text" 
            value={formData.working_hours || ''} 
            onChange={(e) => onChange('working_hours', e.target.value)} 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 font-medium" 
            placeholder="T2-T6..." 
            disabled={isViewMode}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Bảo hiểm</label>
          <input 
            type="text" 
            value={formData.insurance || ''} 
            onChange={(e) => onChange('insurance', e.target.value)} 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 font-medium" 
            placeholder="Full lương..." 
            disabled={isViewMode}
          />
        </div>
         <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Bonus/Thưởng</label>
            <input 
              type="text" 
              value={formData.bonus || ''} 
              onChange={(e) => onChange('bonus', e.target.value)} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 font-medium" 
              placeholder="Tháng 13..." 
              disabled={isViewMode}
            />
        </div>
         <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Allowance/Phụ cấp</label>
            <input 
              type="text" 
              value={formData.allowance || ''} 
              onChange={(e) => onChange('allowance', e.target.value)} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 font-medium" 
              placeholder="Ăn trưa, gửi xe..." 
              disabled={isViewMode}
            />
        </div>
      </div>
    </div>
  );
};
