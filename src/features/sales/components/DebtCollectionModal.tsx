import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { updateSaleFinance } from '../api';
import toast from 'react-hot-toast';
import type { ClientDebtItem } from '../utils';
import { addDays } from '../utils';

interface DebtCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: ClientDebtItem | null;
}

const formatMoney = (v: number) => {
  return new Intl.NumberFormat('vi-VN').format(v);
};

export function DebtCollectionModal({ isOpen, onClose, onSuccess, item }: DebtCollectionModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    p1_amount: 0,
    p1_paid_amount: 0,
    p1_due_date: '',
    
    p2_amount: 0,
    p2_paid_amount: 0,
    p2_due_date: '',
    
    note: '',
    overall_status: 'Doing'
  });

  useEffect(() => {
    if (isOpen && item && item.finance) {
      setFormData({
        p1_amount: item.finance.p1_amount || 0,
        p1_paid_amount: item.finance.p1_paid_amount || 0,
        p1_due_date: item.finance.p1_due_date ? item.finance.p1_due_date.split('T')[0] : '',
        
        p2_amount: item.finance.p2_amount || 0,
        p2_paid_amount: item.finance.p2_paid_amount || 0,
        p2_due_date: item.finance.p2_due_date ? item.finance.p2_due_date.split('T')[0] : '',
        
        note: item.finance.note || '',
        overall_status: item.finance.overall_status || 'Doing'
      });
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  // Tính ngày mặc định từ start_date + p_days nếu chưa có ngày hẹn
  const startDate = item.finance?.start_date?.split('T')[0];
  const p1DefaultDate = startDate && item.finance?.p1_days > 0
    ? addDays(startDate, item.finance.p1_days) : '';
  const p2DefaultDate = startDate && item.finance?.p2_days > 0
    ? addDays(startDate, item.finance.p2_days) : '';

  const handleMoneyChange = (key: string, valStr: string) => {
    const raw = valStr.replace(/\D/g, '');
    const num = raw === '' ? 0 : parseInt(raw, 10);
    
    setFormData(prev => {
      const next = { ...prev, [key]: num };
      
      // Auto-logic for smart debt status
      const totalAmount = next.p1_amount + next.p2_amount;
      const totalPaid = next.p1_paid_amount + next.p2_paid_amount;

      if (totalAmount > 0) {
        if (totalPaid > totalAmount) {
          toast.error('Warning: Total paid amount is greater than expected!', { id: 'debt-warning' });
        }

        if (totalPaid >= totalAmount) {
          if (next.overall_status !== 'Done') {
            next.overall_status = 'Done';
            toast.success('Fully collected! Automatically changed to Done status.', { id: 'debt-done' });
          }
        } else if (next.overall_status === 'Done' && totalPaid < totalAmount) {
          next.overall_status = 'Doing';
          toast('Not fully collected. Automatically changed to Doing status.', { icon: 'ℹ️', id: 'debt-doing' });
        }
      }

      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item.finance?.sales_id) {
       toast.error('Data error: Finance ID not found');
       return;
    }

    try {
      setLoading(true);
      await updateSaleFinance(item.finance.sales_id, {
        p1_amount: formData.p1_amount,
        p1_paid_amount: formData.p1_paid_amount,
        p1_due_date: formData.p1_due_date || null,
        
        p2_amount: formData.p2_amount,
        p2_paid_amount: formData.p2_paid_amount,
        p2_due_date: formData.p2_due_date || null,
        
        note: formData.note,
        overall_status: formData.overall_status as any
      });
      toast.success('Debt collection updated successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating debt collection:', error);
      toast.error('Cannot update debt collection: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Update Plan & Actual Collection</h2>
            <p className="text-sm text-gray-500 mt-1">Candidate: <span className="font-semibold text-brand-600">{item.candidate_name}</span> - {item.job_title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} id="debt-form" className="p-6 space-y-6">
            
            {/* Grid 2 cột cho Đợt 1 và Đợt 2 */}
            <div className="grid grid-cols-2 gap-6">
              
              {/* Cột Đợt 1 */}
              <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-4">
                <h3 className="font-bold text-brand-600 border-b border-brand-100 pb-2">Phase 1 Payment</h3>
                
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Due Date</label>
                  <input
                    type="date"
                    disabled={loading}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm transition-all text-gray-700"
                    value={formData.p1_due_date || p1DefaultDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, p1_due_date: e.target.value }))}
                  />
                  {!formData.p1_due_date && p1DefaultDate && (
                    <p className="text-[10px] text-blue-500 italic">Auto: {p1DefaultDate} ({item.finance?.p1_days} days from onboarding)</p>
                  )}
                  {!formData.p1_due_date && !p1DefaultDate && (
                    <p className="text-[10px] text-gray-400 italic">Leave blank to use {item.finance?.p1_days || 0} days as start.</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Expected (VND)</label>
                  <input
                    type="text"
                    disabled={loading}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium text-gray-900"
                    value={formatMoney(formData.p1_amount)}
                    onChange={(e) => handleMoneyChange('p1_amount', e.target.value)}
                    onFocus={(e) => e.target.select()}
                  />
                  {formData.p1_amount > 1000 && <p className="text-[10px] text-gray-400 font-medium px-1 pt-1">{formatMoney(formData.p1_amount)} VND</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-brand-600 uppercase tracking-wide bg-brand-50 px-2 py-1 rounded">Actual Paid</label>
                  <input
                    type="text"
                    disabled={loading}
                    className="w-full px-3 py-2.5 bg-green-50/30 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-base font-bold text-green-700"
                    value={formatMoney(formData.p1_paid_amount)}
                    onChange={(e) => handleMoneyChange('p1_paid_amount', e.target.value)}
                    onFocus={(e) => e.target.select()}
                  />
                  {formData.p1_paid_amount > 1000 && <p className="text-[10px] text-green-600 font-medium px-1">{formatMoney(formData.p1_paid_amount)} VND</p>}
                </div>
              </div>

              {/* Cột Đợt 2 */}
              <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-4">
                <h3 className="font-bold text-brand-600 border-b border-brand-100 pb-2">Phase 2 Payment</h3>
                
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Due Date</label>
                  <input
                    type="date"
                    disabled={loading}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm transition-all text-gray-700"
                    value={formData.p2_due_date || p2DefaultDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, p2_due_date: e.target.value }))}
                  />
                  {!formData.p2_due_date && p2DefaultDate && (
                    <p className="text-[10px] text-blue-500 italic">Auto: {p2DefaultDate} ({item.finance?.p2_days} days from onboarding)</p>
                  )}
                  {!formData.p2_due_date && !p2DefaultDate && (
                    <p className="text-[10px] text-gray-400 italic">Leave blank to use {item.finance?.p2_days || 0} days as start.</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Expected (VND)</label>
                  <input
                    type="text"
                    disabled={loading}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium text-gray-900"
                    value={formatMoney(formData.p2_amount)}
                    onChange={(e) => handleMoneyChange('p2_amount', e.target.value)}
                    onFocus={(e) => e.target.select()}
                  />
                  {formData.p2_amount > 1000 && <p className="text-[10px] text-gray-400 font-medium px-1 pt-1">{formatMoney(formData.p2_amount)} VND</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-brand-600 uppercase tracking-wide bg-brand-50 px-2 py-1 rounded">Actual Paid</label>
                  <input
                    type="text"
                    disabled={loading}
                    className="w-full px-3 py-2.5 bg-green-50/30 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-base font-bold text-green-700"
                    value={formatMoney(formData.p2_paid_amount)}
                    onChange={(e) => handleMoneyChange('p2_paid_amount', e.target.value)}
                    onFocus={(e) => e.target.select()}
                  />
                  {formData.p2_paid_amount > 1000 && <p className="text-[10px] text-green-600 font-medium px-1">{formatMoney(formData.p2_paid_amount)} VND</p>}
                </div>
              </div>

            </div>

            {/* Trạng thái và Ghi chú */}
            <div className="space-y-4 border-t border-gray-100 pt-5">
               <div className="grid grid-cols-3 gap-4">
                 <div className="col-span-1 space-y-2">
                   <label className="block text-sm font-semibold text-gray-700">Debt Status</label>
                   <select
                     value={formData.overall_status}
                     disabled={loading}
                     onChange={(e) => setFormData(prev => ({ ...prev, overall_status: e.target.value }))}
                     className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all font-medium text-gray-700 bg-white"
                   >
                     <option value="Doing">Doing</option>
                     <option value="Done">Done</option>
                     <option value="Reject">Cancel</option>
                   </select>
                 </div>
                 
                 <div className="col-span-2 space-y-2">
                   <label className="block text-sm font-semibold text-gray-700">Accounting Notes</label>
                   <textarea
                     disabled={loading}
                     rows={2}
                    //  placeholder="Ví dụ: Khách xin lùi hạn đợt 1 sang tuần sau..."
                     className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all text-sm resize-none"
                     value={formData.note}
                     onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                   />
                 </div>
               </div>
            </div>

          </form>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100 bg-white shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="debt-form"
            disabled={loading || (formData.p1_paid_amount + formData.p2_paid_amount > formData.p1_amount + formData.p2_amount && formData.p1_amount + formData.p2_amount > 0)}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-bold shadow-md shadow-brand-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            {loading ? 'Saving...' : 'Save Information'}
          </button>
        </div>
      </div>
    </div>
  );
}
