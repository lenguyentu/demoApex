

import { ClientSelect } from "../../../components/ClientSelect";
import { OwnerSelect } from "../../../components/OwnerSelect";
import { useIndustries } from "../../clients/hooks";

interface CustomerFiltersProps {
  filters: {
    search: string;
    clientId?: string;
    owner_id?: string;
    status: string;
    priority: string;
    domain: string;
    source: string;
  };
  onFilterChange: (key: string, value: string) => void;
  hideStatus?: boolean;
}

export const CustomerFilters = ({ filters, onFilterChange, hideStatus }: CustomerFiltersProps) => {
  const { data: industries = [] } = useIndustries();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Filters</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Search Text */}
        {/* <div className="lg:col-span-1">
            ...
        </div> */}

        {/* Client Select */}
        <div className="lg:col-span-1">
           <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Công ty (Exact)</label>
           <ClientSelect 
              value={filters.clientId || ''} 
              onChange={(val) => onFilterChange('clientId', val)}
              placeholder="Chọn công ty..."
              className="w-full"
           />
        </div>

        {/* Owner Select */}
        <div className="lg:col-span-1">
           <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Người phụ trách</label>
           <OwnerSelect 
              value={filters.owner_id || ''} 
              onChange={(val) => onFilterChange('owner_id', val)} 
              placeholder="Tất cả"
              className="w-full"
           />
        </div>

        {/* Status */}
        {!hideStatus && (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
              <select 
                  value={filters.status}
                  onChange={(e) => onFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                  <option>Tất cả Status</option>
                  
                  <optgroup label="Phase 1: Connect">
                    <option value="Research">Research</option>
                    <option value="Addfriend/Connect">Addfriend/Connect</option>
                    <option value="Approach">Approach</option>
                  </optgroup>

                  <optgroup label="Phase 2: Working">
                    <option value="Follow up">Follow up</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Meeting Clear JD">Meeting Clear JD</option>
                    <option value="Demo contract">Demo contract</option>
                    <option value="Signing">Signing</option>
                    <option value="Signed">Signed</option>
                    <option value="Hunting">Hunting</option>
                  </optgroup>

                  <optgroup label="Phase 3: End/Nurture">
                    <option value="Take care">Take care</option>
                    <option value="No current need">No current need</option>
                    <option value="Excluded">Excluded</option>
                  </optgroup>

                  <optgroup label="Legacy (Cũ)">
                    <option value="Working">Working</option>
                    <option value="Hiring">Hiring</option>
                    <option value="Pending">Pending</option>
                    <option value="Closed">Closed</option>
                    <option value="Reject">Reject</option>
                  </optgroup>
              </select>
          </div>
        )}

        {/* Domain/Industry */}
        <div>
           <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Domain</label>
            <select 
                value={filters.domain}
                onChange={(e) => onFilterChange('domain', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
                <option value="">Tất cả Domain</option>
                {industries.map((ind) => (
                  <option key={ind.id} value={ind.name}>{ind.name}</option>
                ))}
            </select>
        </div>

        {/* Nguồn Job */}
        <div>
           <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nguồn Job</label>
            <select 
                value={filters.source}
                onChange={(e) => onFilterChange('source', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
                <option>Tất cả nguồn</option>
                <option value="Facebook">Facebook</option>
                <option value="Linkedin">Linkedin</option>
                <option value="Thread">Thread</option>
                <option value="Job Portal">Job Portal</option>
                <option value="Referral">Referral</option>
                <option value="Khác">Khác</option>
            </select>
        </div>

        {/* Priority */}
         <div>
           <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Priority</label>
            <select 
                value={filters.priority}
                onChange={(e) => onFilterChange('priority', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
                <option>Tất cả</option>
                 <option>Ưu tiên</option>
                 <option>Bình thường</option>
            </select>
        </div>
      </div>
    </div>
  );
};
