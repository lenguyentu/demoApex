import { useState } from 'react';
import PageMeta from "../../../components/common/PageMeta";
import { DateRangePicker, type DateRange } from '../../../components/DateRangePicker';
import { SearchableSelect } from '../../../components/SearchableSelect';
import { 
  TriangleAlert,
  Users, 
  Briefcase, 
  Building, 
  Handshake, 
  Banknote, 
  ListChecks 
} from 'lucide-react';

// Components
import StatCard from '../components/StatCard';
import ExpandableClientCard from '../components/ExpandableClientCard';
import CandidateStatusChart from '../components/CandidateStatusChart';
import JobCategoryChart from '../components/JobCategoryChart';
import RevenueChart from '../components/RevenueChart';
import RecentJobsList from '../components/RecentJobsList';
import RecentCandidatesList from '../components/RecentCandidatesList';
import RecentDealsList from '../components/RecentDealsList';
import PendingReferredUsersNotification from '../components/PendingReferredUsersNotification';
import FreelancerJoinStats from '../components/FreelancerJoinStats';

interface DashboardTemplateProps {
  userRole?: string; 
}

/**
 * DashboardPage (based on DashboardTemplate)
 * 
 * This is a UI template for the Dashboard.
 * It contains the layout and structure but replaces complex data fetching logic with
 * simplified placeholders and comments explaining where to fetch data.
 */
export const DashboardPage = ({ userRole = 'admin' }: DashboardTemplateProps) => {
  // --- UI State ---
  const [timeFilter, setTimeFilter] = useState<string>('1_month');
  const [dateFilterMode, setDateFilterMode] = useState<'preset' | 'custom'>('preset');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_customDateRange, _setCustomDateRange] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // --- Dummy/Placeholder Data State ---
  // In a real implementation, you would populate this 'stats' object via API calls.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [stats, _setStats] = useState({
    newCandidates: 0,
    openJobs: 0,
    newClients: 0,
    successfulDeals: 0,
    totalFeeForSaler: 0,
    activeProcesses: 0
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [pendingUsersCount, _setPendingUsersCount] = useState(0);

  // Example placeholder for users list dropdown
  const userOptions = [
    { value: '', label: 'All Users' },
    { value: 'user-1', label: 'user1@example.com' },
    // Populate this from API: GET /functions/v1/get-all-users
  ];

  const timeFilterOptions = [
    { value: '1_day', label: 'Last 1 Day' },
    { value: '3_days', label: 'Last 3 Days' },
    { value: '1_week', label: 'Last 1 Week' },
    { value: '1_month', label: 'Last 1 Month' }
  ];

  return (
    <>
      <PageMeta
        title="Dashboard | TD Consulting App"
        description="Dashboard UI Template"
      />
      {/* 
        ---------------------------------------------------------
        TOP CONTROLS SECTION 
        Filter by Date, Time Range, and User (Admin only)
        ---------------------------------------------------------
      */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ml-3">
        <h2 className="text-2xl font-bold text-black dark:text-white">
          Dashboard
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Date Filter Mode Toggle */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filter Type:
            </label>
            <select
              value={dateFilterMode}
              onChange={(e) => setDateFilterMode(e.target.value as 'preset' | 'custom')}
              className="h-11 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            >
              <option value="preset">Preset Time</option>
              <option value="custom">Custom Date</option>
            </select>
          </div>

          {/* Time Filter - Only show when preset mode */}
          {dateFilterMode === 'preset' && (
          <div className="w-full sm:w-48">
            <SearchableSelect
              options={timeFilterOptions}
              onChange={(value) => setTimeFilter(value)}
              value={timeFilter}
            />
          </div>
          )}

          {/* Custom Date Range - Only show when custom mode */}
          {dateFilterMode === 'custom' && (
            <div className="w-full sm:w-64">
              <DateRangePicker
                value={dateRange}
                onChange={(range) => {
                    setDateRange(range);
                    if (range.from && range.to) {
                        _setCustomDateRange([range.from.toISOString().split('T')[0], range.to.toISOString().split('T')[0]]);
                    }
                }}
                placeholder="Select date range"
              />
            </div>
          )}
          
          {/* User Filter - Only show for admin */}
          {/* LOGIC: Check if userRole is 'admin' before rendering this */}
          {userRole?.toLowerCase() === 'admin' && (
            <div className="w-full sm:w-60">
              <SearchableSelect
                options={userOptions}
                onChange={(value) => setSelectedUserId(value)}
                value={selectedUserId}
              />
            </div>
          )}
        </div>
      </div>

      <div className="min-h-screen bg-gray-50">
        {/* Header Title Block */}
       

        <div className="container mx-auto px-4 py-8">
          
          {/* 
            NOTIFICATION AREA 
            - Pending Users (logic: check `pendingUsersCount` > 0)
            - Referral Notifications
          */}
          {pendingUsersCount > 0 && (userRole?.toLowerCase() === 'admin' || userRole?.toLowerCase() === 'hr') && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center">
                <TriangleAlert className="text-yellow-600 mr-3 text-xl w-6 h-6" />
                <div>
                  <h3 className="text-yellow-800 font-semibold">There are {pendingUsersCount} accounts pending approval</h3>
                  <p className="text-yellow-700 text-sm">Please check and approve newly registered accounts</p>
                </div>
              </div>
              <a
                href="/tables/users"
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-150 flex items-center"
              >
                <Users className="mr-2 w-4 h-4" />
                View list
              </a>
            </div>
          )}

          {userRole === 'Community Manager' && (
            <PendingReferredUsersNotification />
          )}

          {/* 
            STATS CARDS GRID 
            Data Source: 'stats' state object populated by API calls
          */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3 2xl:gap-7.5">
            <StatCard title="New Candidates" value={stats.newCandidates} icon={Users} color="brand" />
            <StatCard title="Open Jobs" value={stats.openJobs} icon={Briefcase} color="cyan" />
            
            {/* ExpandableClientCard: Requires specific logic to handle expansion and internal fetching if needed */}
            <ExpandableClientCard 
              title="New Clients" 
              value={stats.newClients} 
              icon={Building} 
              color="violet"
              selectedUserId={selectedUserId}
              authUserRole={userRole}
              session={{ user: { id: 'current-user-id' }, access_token: 'dummy-token' }} // Placeholder session
              timeFilter={timeFilter}
            />
            
            <StatCard title="Successful Deals" value={stats.successfulDeals} icon={Handshake} color="orange" />
            
            <StatCard 
                title="Total Fee for Saler" 
                value={stats.totalFeeForSaler} 
                icon={Banknote} 
                color="emerald" 
                formatValue={(value) => value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
            />
            <StatCard title="Active Processes" value={stats.activeProcesses} icon={ListChecks} color="amber" />
          </div>

          {/* 
             MAIN CONTENT GRID: Charts and Lists
             Each component below should handle its own data fetching or receive data as props.
          */}
          <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
            {/* Row 1: Revenue & Job Category */}
            <div className="col-span-12 xl:col-span-8">
                <div className="h-full rounded-xl bg-white px-6 py-6 shadow-sm border border-gray-200">
                    <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">Revenue Over Time</h4>
                    {/* API Call: Fetch monthly revenue grouped by date */}
                    <RevenueChart selectedUserId={selectedUserId} />
                </div>
            </div>
            <div className="col-span-12 xl:col-span-4">
                <div className="h-full rounded-xl bg-white px-6 py-6 shadow-sm border border-gray-200">
                    <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">Jobs by Category</h4>
                    {/* API Call: Fetch open jobs grouped by category */}
                    <JobCategoryChart />
                </div>
            </div>

            {/* Row 2: Recent Jobs & Candidates */}
            <div className="col-span-12 md:col-span-6">
                <div className="rounded-xl bg-white px-6 py-6 shadow-sm border border-gray-200">
                    <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">Recent Jobs</h4>
                    {/* API Call: GET /jobs?order=created_at.desc&limit=5 */}
                    <RecentJobsList selectedUserId={selectedUserId} />
                </div>
            </div>
            <div className="col-span-12 md:col-span-6">
                <div className="rounded-xl bg-white px-6 py-6 shadow-sm border border-gray-200">
                    <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">Recent Candidates</h4>
                    {/* API Call: GET /candidates?order=created_at.desc&limit=5 */}
                    <RecentCandidatesList selectedUserId={selectedUserId} />
                </div>
            </div>

            {/* Row 3: Candidate Status & Recent Deals */}
            <div className="col-span-12 md:col-span-6">
                <div className="rounded-xl bg-white px-6 py-6 shadow-sm border border-gray-200">
                    <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">Candidate Status</h4>
                    {/* API Call: Aggregate candidates by status/stage */}
                    <CandidateStatusChart selectedUserId={selectedUserId} />
                </div>
            </div>
            <div className="col-span-12 md:col-span-6">
                <div className="rounded-xl bg-white px-6 py-6 shadow-sm border border-gray-200">
                    <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">Recent Deals</h4>
                    {/* API Call: GET /sales?payment_status=eq.Paid&order=created_at.desc&limit=5 */}
                    <RecentDealsList selectedUserId={selectedUserId} />
                </div>
            </div>

            {/* Row 4 - Freelancer Join Stats (Only for Admin) */}
            {userRole?.toLowerCase() === 'admin' && (
              <div className="col-span-12">
                {/* API Call: Count new users with Role='Freelancer' per time period */}
                <FreelancerJoinStats timeFilter={timeFilter as '1_day' | '3_days' | '1_week' | '1_month'} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
