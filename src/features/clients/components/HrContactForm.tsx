import React from 'react';
import { Trash2 } from 'lucide-react';
import type { HrContactData } from '../types';

interface HrContactFormProps {
  hrContact: HrContactData;
  index: number;
  onUpdate: (index: number, field: keyof HrContactData, value: any) => void;
  onRemove: (index: number) => void;
  isViewMode: boolean;
}

export const HrContactForm: React.FC<HrContactFormProps> = ({ 
  hrContact, 
  index, 
  onUpdate, 
  onRemove, 
  isViewMode 
}) => {
  return (
    <div className="border border-gray-200 rounded-lg p-5 mb-4 bg-gray-50/50 hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs">
            {index + 1}
          </div>
          HR Contact
        </h4>
        {!isViewMode && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50"
            title="Xóa liên hệ này"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
         {/* Name & Title */}
        <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-medium text-gray-700">Họ tên <span className="text-red-500">*</span></label>
            <input
            type="text"
            value={hrContact.name}
            onChange={(e) => onUpdate(index, 'name', e.target.value)}
            placeholder="Nguyễn Văn A"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            disabled={isViewMode}
            />
        </div>
        <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-medium text-gray-700">Chức vụ</label>
            <input
            type="text"
            value={hrContact.position_title}
            onChange={(e) => onUpdate(index, 'position_title', e.target.value)}
            placeholder="HR Manager"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            disabled={isViewMode}
            />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Email */}
        <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-medium text-gray-700">Email chính</label>
            <input
            type="text"
            value={hrContact.email_1 || ''}
            onChange={(e) => onUpdate(index, 'email_1', e.target.value)}
            placeholder="email@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            disabled={isViewMode}
            />
        </div>
        <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-medium text-gray-700">Số điện thoại</label>
            <input
            type="text"
            value={hrContact.phone_1 || ''}
            onChange={(e) => onUpdate(index, 'phone_1', e.target.value)}
            placeholder="0912..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            disabled={isViewMode}
            />
        </div>
      </div>

      {/* Note */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-700">Ghi chú</label>
        <textarea
            rows={2}
            value={hrContact.memo || ''}
            onChange={(e) => onUpdate(index, 'memo', e.target.value)}
            placeholder="Ghi chú thêm..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-y"
            disabled={isViewMode}
        />
      </div>
      
      {/* Key Person Checkbox */}
       <div className="mt-3 flex items-center gap-2">
         <input
           type="checkbox"
           id={`key-person-${index}`}
           checked={hrContact.key_person || false}
           onChange={(e) => onUpdate(index, 'key_person', e.target.checked)}
           className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
           disabled={isViewMode}
         />
         <label htmlFor={`key-person-${index}`} className="text-sm text-gray-700 font-medium">Người liên hệ chính (Key Person)</label>
       </div>
    </div>
  );
};
