// @ts-nocheck
import React from 'react';
import { Search, Filter as FilterIcon } from 'lucide-react';
import { DateRangePicker, type DateRange } from '../../../components/DateRangePicker';
import { ROLES, ROLE_DISPLAY_NAMES } from '../constants';
import type { UserRole } from '../../auth/types';

interface UserFilterBarProps {
  search: string;
  setSearch: (val: string) => void;
  selectedRole: UserRole | 'All';
  setSelectedRole: (role: UserRole | 'All') => void;
  selectedLeadId: string;
  setSelectedLeadId: (id: string) => void;
  leadOptions: Array<{ id: string; full_name: string | null; email: string | null; role?: string | null }>;
  showLeadFilter?: boolean;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  totalCount: number | null;
  activeTab: 'all' | 'pending';
}

export const UserFilterBar: React.FC<UserFilterBarProps> = ({
  search,
  setSearch,
  selectedRole,
  setSelectedRole,
  selectedLeadId,
  setSelectedLeadId,
  leadOptions,
  showLeadFilter = false,
  dateRange,
  setDateRange,
  totalCount,
  activeTab
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={activeTab === 'pending' ? "Search pending accounts..." : "Search by name, email..."}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="relative min-w-[150px]">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <FilterIcon size={16} />
          </div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as UserRole | 'All')}
            className="appearance-none pl-9 pr-8 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-gray-700 cursor-pointer hover:border-gray-300"
          >
            {ROLES.map(role => (
              <option key={role} value={role}>{ROLE_DISPLAY_NAMES[role] || role}</option>
            ))}
          </select>
        </div>

        {showLeadFilter && (
          <div className="relative min-w-[220px]">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <FilterIcon size={16} />
            </div>
            <select
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              className="appearance-none pl-9 pr-8 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-gray-700 cursor-pointer hover:border-gray-300"
            >
              <option value="All">Filter by team</option>
              {leadOptions.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.full_name || lead.email || lead.id}{lead.role ? ` (${ROLE_DISPLAY_NAMES[lead.role] || lead.role})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
          placeholder="Created date"
        />
      </div>

      <div className="text-sm text-gray-500 whitespace-nowrap">
        {totalCount !== null && (
          <>Total: <span className="font-semibold text-gray-900">{totalCount}</span> {activeTab === 'pending' ? 'requests' : 'members'}</>
        )}
      </div>
    </div>
  );
};
