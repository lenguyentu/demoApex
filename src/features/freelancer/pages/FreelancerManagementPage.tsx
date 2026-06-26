
import { useState } from 'react';
import { startOfMonth, endOfMonth } from 'date-fns';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { Search, Award, FileText, Users, Activity, Download } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { useFreelancerPerformanceStats, useFreelancerGlobalStats } from '../hooks';
import { FreelancerDetailsModal } from '../../processes/components/FreelancerDetailsModal';
import { DateRangePicker, type DateRange } from '../../../components/DateRangePicker';
import { useDebounce } from '../../../hooks';
import { LoadMoreButton } from '../../../components/LoadMoreButton';
import { TopJobsStats } from '../components/TopJobsStats';
import { HRRankStats } from '../components/HRRankStats';

export const FreelancerManagementPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [dateRange, setDateRange] = useState<DateRange>(() => {
        const now = new Date();
        return {
            from: startOfMonth(now),
            to: endOfMonth(now)
        };
    });
    const [selectedFreelancerId, setSelectedFreelancerId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // List with pagination & server-side search
    const {
        data: freelancerData,
        totalCount: totalFreelancersInList,
        loading,
        error,
        hasMore,
        loadMore
    } = useFreelancerPerformanceStats(debouncedSearch, dateRange);

    // Global stats for cards
    const { data: globalStats, isLoading: globalLoading } = useFreelancerGlobalStats(dateRange);

    const totalFreelancersCount = totalFreelancersInList || 0;
    const totalCVToTDC = globalStats?.totalCVToTDC || 0;
    const totalOnboarding = globalStats?.totalOnboarding || 0;
    const overallConversionRate = globalStats?.overallConversionRate || '0.0';

    const handleExportExcel = () => {
        if (!freelancerData || freelancerData.length === 0) return;

        const dataToExport = freelancerData.map((f, index) => ({
            'No.': index + 1,
            'Headhunt Name': f.name || '',
            'Phone': f.phone || '',
            'Email': f.email || '',
            'CV to TDC': f.cvToTDC || 0,
            'CV to Client': f.cvToClient || 0,
            'Interview': f.interviews || 0,
            'Offer': f.offers || 0,
            'Onboarding': f.onboarding || 0,
            'Rejected': f.rejected || 0,
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);

        // Align column widths
        const colWidths = [
            { wch: 5 },  // No.
            { wch: 25 }, // Name
            { wch: 15 }, // Phone
            { wch: 30 }, // Email
            { wch: 12 }, // CV to TDC
            { wch: 15 }, // CV to Client
            { wch: 12 }, // Interview
            { wch: 10 }, // Offer
            { wch: 15 }, // Onboarding
            { wch: 12 }, // Rejected
        ];
        worksheet['!cols'] = colWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Headhunters');

        const dateStr = new Date().toISOString().split('T')[0];
        XLSX.writeFile(workbook, `Headhunt_List_${dateStr}.xlsx`);
    };

    if (error) {
        return (
            <div className="p-12 text-center text-red-500">
                <p>Error loading data: {String(error)}</p>
            </div>
        );
    }

    return (
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 min-h-screen">
            {/* Header Section */}
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Track headhunt performance & conversion rate
                    </p>
                </div>
                <div className="flex items-center gap-3 pr-15">
                    <DateRangePicker
                        value={dateRange}
                        onChange={setDateRange}
                        className="w-auto"
                    />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
                {globalLoading ? (
                    // Skeleton for Stats Cards
                    Array(4).fill(0).map((_, i) => (
                        <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 animate-pulse">
                            <div className="w-10 h-10 bg-gray-200 rounded-lg mb-4 float-right"></div>
                            <div className="h-4 bg-gray-200 w-24 rounded mb-2"></div>
                            <div className="h-8 bg-gray-200 w-16 rounded"></div>
                        </div>
                    ))
                ) : (
                    <>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-100 relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="absolute right-0 top-0 p-3 opacity-20 group-hover:opacity-30 transition-opacity">
                                <Users className="w-10 h-10 text-blue-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-500">Total Headhunters</p>
                            <p className="text-3xl font-bold text-blue-600 mt-2">{totalFreelancersCount}</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-emerald-100 relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="absolute right-0 top-0 p-3 opacity-20 group-hover:opacity-30 transition-opacity">
                                <FileText className="w-10 h-10 text-emerald-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-500">Total CVs Sent</p>
                            <p className="text-3xl font-bold text-emerald-600 mt-2">{totalCVToTDC}</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-purple-100 relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="absolute right-0 top-0 p-3 opacity-20 group-hover:opacity-30 transition-opacity">
                                <Award className="w-10 h-10 text-purple-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-500">Total Onboarding</p>
                            <p className="text-3xl font-bold text-purple-600 mt-2">{totalOnboarding}</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-orange-100 relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="absolute right-0 top-0 p-3 opacity-20 group-hover:opacity-30 transition-opacity">
                                <Activity className="w-10 h-10 text-orange-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
                            <p className="text-3xl font-bold text-orange-600 mt-2">{overallConversionRate}%</p>
                        </div>
                    </>
                )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
                {/* Table Header & Search */}
                <div className="p-6 border-b border-gray-100">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Headhunt List</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Headhunt focus job performance (Sorted by CV sent descending)
                            </p>
                        </div>
                        <div className="flex flex-col md:flex-row items-center gap-3 w-full lg:w-auto">
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    className="flex h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 pl-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ED0A63] focus:bg-white transition-all"
                                    placeholder="Search by name, phone, email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleExportExcel}
                                disabled={loading || freelancerData.length === 0}
                                className="inline-flex items-center gap-2 px-4 py-2 h-10 text-sm font-medium rounded-lg border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 hover:border-emerald-700 transition-all duration-150 shadow-sm w-full md:w-auto justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Download size={15} strokeWidth={2} />
                                <span>Export Excel</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto relative">
                    {(loading && freelancerData.length > 0) && (
                        <div className="absolute top-0 left-0 w-full h-0.5 bg-gray-100 overflow-hidden z-10">
                            <div className="w-full h-full bg-[#ED0A63] animate-progress origin-left-right"></div>
                        </div>
                    )}
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/50 text-xs uppercase text-gray-500 font-medium">
                            <tr>
                                <th className="px-6 py-4 text-center w-16">No.</th>
                                <th className="px-6 py-4">Headhunt Name</th>
                                <th className="px-6 py-4 text-center text-blue-600">CV to TDC</th>
                                <th className="px-6 py-4 text-center">CV to Client</th>
                                <th className="px-6 py-4 text-center">Interview</th>
                                <th className="px-6 py-4 text-center text-purple-600">Offer</th>
                                <th className="px-6 py-4 text-center text-emerald-600">Onboarding</th>
                                <th className="px-6 py-4 text-center text-red-600">Rejected</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading && freelancerData.length === 0 ? (
                                // Skeleton for Table Rows
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-8 mx-auto"></div></td>
                                        <td className="px-6 py-4">
                                            <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                                            <div className="h-3 bg-gray-200 rounded w-48"></div>
                                        </td>
                                        <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-8 mx-auto"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-8 mx-auto"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-8 mx-auto"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-8 mx-auto"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-8 mx-auto"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-8 mx-auto"></div></td>
                                    </tr>
                                ))
                            ) : freelancerData.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                        No matching records found.
                                    </td>
                                </tr>
                            ) : freelancerData.map((f, idx) => (
                                <tr key={f.id} className="hover:bg-gray-50/80 transition-colors">
                                    <td className="px-6 py-4 text-center font-medium text-gray-500">{idx + 1}</td>
                                    <td className="px-6 py-4 font-semibold text-gray-900 hover:text-[#ED0A63] cursor-pointer transition-colors"
                                        onClick={() => {
                                            setSelectedFreelancerId(f.id);
                                            setIsModalOpen(true);
                                        }}
                                    >
                                        <div className="flex flex-col">
                                            <span>{f.name}</span>
                                            <span className="text-xs text-gray-400 font-normal">{f.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <Link
                                            to={`/freelancer-management/${f.id}/cv-to-tdc`}
                                            target="_blank"
                                            className="inline-flex items-center justify-center min-w-[32px] h-7 px-2 rounded-full bg-blue-50 text-blue-700 font-bold text-xs ring-1 ring-blue-100 hover:bg-blue-100 transition-colors"
                                        >
                                            {f.cvToTDC}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-center font-medium text-gray-600">{f.cvToClient}</td>
                                    <td className="px-6 py-4 text-center font-medium text-gray-600">{f.interviews}</td>
                                    <td className="px-6 py-4 text-center font-bold text-purple-600">{f.offers}</td>
                                    <td className="px-6 py-4 text-center font-bold text-emerald-600 bg-emerald-50/30">{f.onboarding}</td>
                                    <td className="px-6 py-4 text-center font-medium text-red-500">
                                        <Link
                                            to={`/freelancer-management/${f.id}/rejected`}
                                            target="_blank"
                                            className="hover:underline hover:text-red-700 cursor-pointer block"
                                        >
                                            {f.rejected}
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Load More Button */}
                {hasMore && (
                    <div className="p-4 border-t border-gray-100 flex justify-center">
                        <LoadMoreButton
                            onClick={loadMore}
                            loading={loading}
                            hasMore={hasMore}
                            loadedCount={freelancerData.length}
                            totalCount={totalFreelancersCount}
                        />
                    </div>
                )}
            </div>

            {/* HR/Staff Statistics */}
            <HRRankStats 
                dateRange={dateRange} 
                onSelectHeadhunt={(id) => {
                    setSelectedFreelancerId(id);
                    setIsModalOpen(true);
                }}
            />

            {/* Top Jobs Statistics */}
            <TopJobsStats dateRange={dateRange} />

            {/* Chart Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Conversion Rate (Onboarding / CV sent)</h3>
                    <p className="text-sm text-gray-500 mt-1">Success rate of top 5 headhunters</p>
                </div>
                <div className="h-[300px] w-full">
                    {loading && freelancerData.length === 0 ? (
                        // Skeleton for Chart
                        <div className="w-full h-full flex flex-col justify-end space-y-4 animate-pulse px-4">
                            {Array(5).fill(0).map((_, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="h-4 bg-gray-200 w-24 rounded"></div>
                                    <div className="h-8 bg-gray-200 flex-1 rounded-r-lg" style={{ width: `${Math.random() * 50 + 20}%` }}></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={freelancerData.slice(0, 5)} margin={{ top: 0, right: 30, left: 40, bottom: 5 }}>
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 13, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="conversionRate" barSize={24} radius={[0, 4, 4, 0]}>
                                    {freelancerData.slice(0, 5).map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill="#ED0A63" fillOpacity={0.8} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Freelancer Details Modal */}
            <FreelancerDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                freelancerId={selectedFreelancerId}
            />
        </main>
    );
};

