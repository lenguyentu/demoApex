
import { useState } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import type { UserRole } from '../auth/types';
import { ClientSelect } from '../../components/ClientSelect';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ROLES: UserRole[] = ['BD', 'Headhunter', 'CTV', 'Freelancer', 'HR', 'Client', 'Admin', 'Community Manager', 'Researcher'];

export function AddUserModal({ isOpen, onClose, onSuccess }: AddUserModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'Freelancer' as UserRole,
    client_id: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Vui lòng đăng nhập lại');

        const payload = {
            email: formData.email,
            full_name: formData.full_name,
            role: formData.role,
            client_id: formData.role === 'Client' ? formData.client_id : undefined
        };

        const { error } = await supabase.functions.invoke('invite-user', {
            body: payload,
            headers: {
                Authorization: `Bearer ${session.access_token}`
            }
        });
        if (error) throw error;

        toast.success('Tạo tài khoản thành công!');
        onSuccess();
        onClose();
        // Reset form
        setFormData({
            email: '',
            full_name: '',
            role: 'Freelancer',
            client_id: ''
        });

    } catch (error: any) {
        console.error('Error creating user:', error);
        toast.error(error.message || 'Có lỗi xảy ra');
    } finally {
        setIsLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-9999 overflow-y-auto bg-gray-100/50 backdrop-blur-sm">
      <div className="min-h-screen px-4 flex items-center justify-center relative">
        <div 
            className="fixed inset-0 bg-black/40 transition-opacity" 
            aria-hidden="true" 
            onClick={onClose}
        />
        
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
           {/* Header */}
           <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Thêm thành viên mới</h3>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                >
                    <X size={20} />
                </button>
           </div>

           <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        required
                        value={formData.full_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                        placeholder="VD: Nguyễn Văn A"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                    <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                        placeholder="VD: user@example.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò <span className="text-red-500">*</span></label>
                    <select
                        value={formData.role}
                        onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
                    >
                        {ROLES.map(role => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                </div>

                {formData.role === 'Client' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Khách hàng <span className="text-red-500">*</span></label>
                        <ClientSelect
                            value={formData.client_id}
                            onChange={(val) => setFormData(prev => ({ ...prev, client_id: val }))}
                            placeholder="Chọn khách hàng doanh nghiệp"
                        />
                    </div>
                )}

                <div className="pt-4 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                        disabled={isLoading}
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 bg-brand-600 text-white hover:bg-brand-700 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-brand-500/30"
                    >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {isLoading ? 'Đang tạo...' : 'Tạo tài khoản'}
                    </button>
                </div>
           </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
