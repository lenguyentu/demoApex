import { Building2, KanbanSquare, Table, BarChart3, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
// import { ClientSelect } from "../../../components/ClientSelect";
// import { OwnerSelect } from "../../../components/OwnerSelect";

interface CustomerHeaderProps {
  viewMode: 'table' | 'kanban';
  onViewModeChange: (mode: 'table' | 'kanban') => void;
}

export const CustomerHeader = ({ 
  viewMode, 
  onViewModeChange, 
}: CustomerHeaderProps) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div className="flex items-start gap-3 w-1/4">
        <div className="p-2 bg-brand-100 dark:bg-brand-900/20 rounded-lg">
          <Building2 className="w-8 h-8 text-brand-600 dark:text-brand-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage and track customer relations for BD</p>
        </div>
      </div>

      {viewMode === 'kanban' && (
          <div className="flex-1 flex justify-center gap-3 px-8">
              {/* Client Select removed as requested */}
              {/* <div className="w-[200px]">
                 <OwnerSelect 
                    value={selectedOwnerId || ''}
                    onChange={onOwnerChange}
                    placeholder="Select PIC..."
                    className="w-full shadow-sm border-brand-200 ring-2 ring-transparent focus:ring-brand-500"
                 />
              </div> */}
          </div>
      )}

      <div className={`flex items-center gap-2 flex-wrap ${viewMode === 'kanban' ? 'w-1/3 justify-end' : ''}`}>
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
            <button 
                onClick={() => onViewModeChange('table')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'table' 
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
                <Table size={16} /> Table
            </button>
            <button 
                onClick={() => onViewModeChange('kanban')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'kanban' 
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
                <KanbanSquare size={16} /> Kanban
            </button>
        </div>

        {/* <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium">
          <Upload size={16} /> Import Excel
        </button> */}
         <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium">
          <BarChart3 size={16} /> Statistics
        </button>

        {viewMode !== 'kanban' && (
          <button 
            onClick={() => navigate('/tables/clients/new')}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm text-sm font-medium"
          >
            <Plus size={16} /> Add Customer
          </button>
        )}
      </div>
    </div>
  );
};
