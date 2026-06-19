import React from 'react';
import { Shield, Plus } from 'lucide-react';

interface UserHeaderProps {
  activeTab: 'all' | 'pending';
  setActiveTab: (tab: 'all' | 'pending') => void;
  pendingCount: number;
  onAddUser: () => void;
}

export const UserHeader: React.FC<UserHeaderProps> = ({ 
  activeTab, 
  setActiveTab, 
  pendingCount, 
  onAddUser 
}) => {
  return (
    <>
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="text-brand-600" />
          Quản Lý Tài Khoản Roles
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Quản lý danh sách và phân quyền người dùng trong hệ thống
        </p>
      </div>

      <div className="flex items-center justify-between border-b border-gray-200 pl-1">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 text-sm font-medium transition-all relative ${activeTab === 'all'
              ? 'text-brand-600 border-b-2 border-brand-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Danh sách thành viên
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 text-sm font-medium transition-all relative flex items-center gap-2 ${activeTab === 'pending'
              ? 'text-brand-600 border-b-2 border-brand-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Chờ duyệt
            {pendingCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs transition-colors ${activeTab === 'pending'
                ? 'bg-brand-100 text-brand-700'
                : 'bg-red-100 text-red-600 font-bold'
                }`}>
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={onAddUser}
          className="flex items-center gap-2 px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm mb-2"
        >
          <Plus size={18} />
          <span className="font-medium text-sm">Thêm thành viên</span>
        </button>
      </div>
    </>
  );
};
