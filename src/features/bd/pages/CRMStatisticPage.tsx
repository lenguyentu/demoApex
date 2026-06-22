import React, { useState } from 'react';
import PageMeta from '../../../components/common/PageMeta';
import {
    Users,
    ArrowLeft,
    Phone,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    BarChart2,
    Briefcase,
    Search,
    MessageSquare,
    Headphones,
    FileSignature,
    UserPlus,
    Building,
    PieChart as PieChartIcon
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart as RePieChart,
    Pie
} from 'recharts';
import { startOfMonth, endOfMonth } from 'date-fns';
import { DateRangePicker, type DateRange } from '../../../components/DateRangePicker';
import { useAuthStore } from '../../auth/store';
import { useBDStatistics } from '../hooks';

// --- Types ---
interface StatCardProps {
    label: string;
    count: number;
    color: string; // tailwind class for bg
    textColor?: string;
    icon?: React.ReactNode;
    clients?: string[];
}

interface StatusCardProps {
    label: string;
    count: number;
    color: string; // tailwind color class e.g. 'bg-blue-500'
    icon: React.ReactNode;
}

// --- Components ---

const Skeleton = ({ className }: { className?: string }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

const BDReportCard = ({ label, count, color, textColor = 'text-gray-800', clients = [] }: StatCardProps) => {
    const MAX_VISIBLE = 40;
    const hasMore = clients.length > MAX_VISIBLE;
    const visibleClients = clients.slice(0, MAX_VISIBLE);

    return (
        <div className="group relative h-full">
            {/* Card chính - Thiết kế Đậm & Rõ ràng */}
            <div className={`${color} rounded-2xl p-6 flex flex-col items-center justify-center text-center h-full min-h-32 shadow-sm border border-black/5 transition-all duration-300 group-hover:shadow-md cursor-pointer overflow-hidden relative`}>
                {/* Soft decorative element */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl" />
                
                <h3 className={`text-3xl font-bold mb-1 ${textColor} tracking-tight`}>{count}</h3>
                <p className={`text-[10px] font-black ${textColor} opacity-100 uppercase tracking-[0.15em]`}>{label}</p>
            </div>
            
            {/* Tooltip Premium Side-aligned - Pink & Bold Theme */}
            {clients.length > 0 && (
                <div className="absolute z-50 top-0 left-[calc(100%+12px)] w-72 
                                bg-rose-50 border border-rose-200 rounded-2xl p-4 shadow-[10px_20px_50px_-15px_rgba(244,63,94,0.15)]
                                opacity-0 invisible scale-95 translate-x-[-10px] origin-left
                                group-hover:opacity-100 group-hover:visible group-hover:scale-100 group-hover:translate-x-0 
                                transition-all duration-300 ease-out pointer-events-auto cursor-default">
                    
                    {/* Bridge area to keep tooltip open while moving mouse */}
                    <div className="absolute top-0 right-full w-4 h-full bg-transparent" />

                    <div className="flex items-center justify-between mb-3 border-b border-rose-200/50 pb-2">
                        <span className="font-black text-rose-800 text-xs tracking-tight uppercase">Customer Details</span>
                        <span className="text-[10px] font-black text-white bg-rose-500 px-2 py-0.5 rounded-lg shadow-sm">
                            {clients.length}
                        </span>
                    </div>

                    <div className="max-h-60 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar scroll-smooth">
                        {visibleClients.map((name, idx) => (
                            <div key={idx} className="flex gap-2.5 p-2.5 rounded-xl bg-white/60 hover:bg-white transition-all text-gray-900 border border-rose-100 hover:border-rose-300 group/item shadow-sm">
                                <span className="text-[10px] text-rose-500 font-black shrink-0 w-4 pt-0.5 font-mono">{(idx + 1).toString().padStart(2, '0')}</span>
                                <span className="text-[11px] font-bold leading-relaxed break-words">{name}</span>
                            </div>
                        ))}
                    </div>

                    {/* Footer for large data */}
                    {hasMore && (
                        <button 
                            onClick={() => window.open('/bd/customers', '_self')}
                            className="w-full mt-3 py-2 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-rose-200 active:scale-95"
                        >
                            View all ({clients.length - MAX_VISIBLE} other customers)
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const StatusCard = ({ label, count, color, icon }: StatusCardProps) => (
    <div className={`${color} rounded-xl p-4 flex flex-col items-center justify-center text-center min-h-[6rem] shadow-sm text-white transition-transform hover:scale-105 cursor-pointer`}>
        <div className="mb-1 opacity-90 scale-90">{icon}</div>
        <h3 className="text-2xl font-bold mb-0 leading-none">{count}</h3>
        <p className="text-xs font-medium mt-1 opacity-90">{label}</p>
    </div>
);

const DealRatioChart = ({ data }: { data: any[] }) => (
    <ResponsiveContainer width="100%" height={300}>
        <BarChart layout="vertical" data={data} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
            <XAxis type="number" hide />
            <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748b' }}
                width={100}
                interval={0}
            />
            <Tooltip cursor={{ fill: 'transparent' }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20} background={{ fill: '#f1f5f9' }}>
                {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                ))}
            </Bar>
        </BarChart>
    </ResponsiveContainer>
);

const SalesCycleChart = ({ data }: { data: any[] }) => (
    <div className="relative h-64 w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
            <RePieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
            </RePieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {/* Center Content simulating the donut hole info */}
        </div>
    </div>
);

const JobSourceChart = ({ data }: { data: any[] }) => (
    <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                interval={0} 
                tick={{ fontSize: 10, fill: '#64748b' }} 
            />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
            <Tooltip 
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30}>
                {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'][index % 8]} />
                ))}
            </Bar>
        </BarChart>
    </ResponsiveContainer>
);

export const CRMStatisticPage = () => {
    const { user } = useAuthStore();
    const [viewMode, setViewMode] = useState<'personal' | 'team'>('personal');
    
    // Time Range State
    const [dateRange, setDateRange] = useState<DateRange>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date())
    });

    // Filters for Hook
    const filters = React.useMemo(() => {
        const f: any = {};

        if (viewMode === 'personal' && user) {
            f.owner_id = user.id;
        }

        if (dateRange.from) f.dateFrom = dateRange.from.toISOString();
        if (dateRange.to) f.dateTo = dateRange.to.toISOString();

        return f;
    }, [viewMode, dateRange, user?.id]);

    const { stats, isLoading } = useBDStatistics({ filters });

    // Default empty objects if loading/undefined
    const report = stats?.report || {
        coldLead: { count: 0, clients: [] },
        formerClientApproaches: { count: 0, clients: [] },
        newClientApproaches: { count: 0, clients: [] },
        clientMeeting: { count: 0, clients: [] },
        newContract: { count: 0, clients: [] },
        newJD: { count: 0, clients: [] }
    };
    const sCounts = stats?.statusCounts || {};
    const sources = stats?.sourceCounts || [];
    const domains = stats?.dealDomainData || [];
    const customers = stats?.loyalCustomers || [];
    const salesCycle = stats?.salesCycleData || [];

    const totalSigned = sCounts['Signed'] || 0;

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            <PageMeta title="CRM Statistic | Apex Internal" description="Overview report and BD strategy analysis" />

            <div className="w-full px-6 py-4">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 relative">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <BarChart2 className="w-8 h-8 text-rose-500 bg-rose-100 p-1.5 rounded-lg" />
                            CRM Statistic
                        </h1>
                        <p className="text-gray-500 text-sm mt-1 ml-10">Overview report and BD strategy analysis</p>
                    </div>

                    <div className="flex items-center gap-3 bg-white p-1.5 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex bg-gray-100 rounded-md p-0.5">
                            <button
                                onClick={() => setViewMode('personal')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'personal' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Personal
                            </button>
                            <button
                                onClick={() => setViewMode('team')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'team' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Team
                            </button>
                        </div>
                        <div className="h-6 w-px bg-gray-300 mx-1"></div>
                        <button
                            onClick={() => window.open('/bd/customers', '_self')}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            List
                        </button>
                    </div>
                </div>

                {/* Top Section Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8 items-stretch">

                    {/* BD Report Section */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-800">BD Report</h2>
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Custom Date Range Picker with internal Month selector */}
                                <DateRangePicker 
                                    value={dateRange} 
                                    onChange={setDateRange} 
                                    className="h-[34px] py-0!"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 flex-1">
                            {isLoading ? (
                                Array(6).fill(0).map((_, i) => (
                                    <Skeleton key={i} className="h-32 w-full rounded-xl" />
                                ))
                            ) : (
                                <>
                                    <BDReportCard label="Cold lead" count={report.coldLead.count} clients={report.coldLead.clients} color="bg-gray-50" />
                                    <BDReportCard label="Former Client approaches" count={report.formerClientApproaches.count} clients={report.formerClientApproaches.clients} color="bg-blue-50" textColor="text-blue-700" />
                                    <BDReportCard label="New Client approaches" count={report.newClientApproaches.count} clients={report.newClientApproaches.clients} color="bg-emerald-50" textColor="text-emerald-700" />
                                    <BDReportCard label="Client Meeting" count={report.clientMeeting.count} clients={report.clientMeeting.clients} color="bg-orange-50" textColor="text-orange-700" />
                                    <BDReportCard label="New contract" count={report.newContract.count} clients={report.newContract.clients} color="bg-green-50" textColor="text-green-700" />
                                    <BDReportCard label="New JD" count={report.newJD.count} clients={report.newJD.clients} color="bg-purple-50" textColor="text-purple-700" />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Statistics by Status */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full">
                        <h2 className="text-lg font-bold text-gray-800 mb-6">Statistics by Status</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {isLoading ? (
                                Array(12).fill(0).map((_, i) => (
                                    <Skeleton key={i} className="h-24 w-full rounded-xl" />
                                ))
                            ) : (
                                <>
                                    <StatusCard label="Research" count={sCounts['Research'] || 0} color="bg-slate-500" icon={<Search className="w-6 h-6" />} />
                                    <StatusCard label="Addfriend" count={sCounts['Addfriend/Connect'] || 0} color="bg-indigo-400" icon={<UserPlus className="w-6 h-6" />} />
                                    <StatusCard label="Approach" count={sCounts['Approach'] || 0} color="bg-teal-500" icon={<UserPlus className="w-6 h-6" />} />
                                    <StatusCard label="Follow up" count={sCounts['Follow up'] || 0} color="bg-emerald-500" icon={<MessageSquare className="w-6 h-6" />} />
                                    <StatusCard label="Consulting" count={sCounts['Consulting'] || 0} color="bg-cyan-500" icon={<Headphones className="w-6 h-6" />} />
                                    <StatusCard label="Demo contract" count={sCounts['Demo contract'] || 0} color="bg-orange-500" icon={<FileText className="w-6 h-6" />} />
                                    <StatusCard label="Meeting" count={sCounts['Meeting Clear JD'] || 0} color="bg-blue-500" icon={<Users className="w-6 h-6" />} />
                                    <StatusCard label="Signing" count={sCounts['Signing'] || 0} color="bg-amber-600" icon={<FileSignature className="w-6 h-6" />} />
                                    <StatusCard label="Signed" count={sCounts['Signed'] || 0} color="bg-orange-600" icon={<CheckCircle className="w-6 h-6" />} />
                                    <StatusCard label="No current need" count={sCounts['No current need'] || 0} color="bg-red-500" icon={<XCircle className="w-6 h-6" />} />
                                    <StatusCard label="Hunting" count={sCounts['Hunting'] || 0} color="bg-pink-500" icon={<Search className="w-6 h-6" />} />
                                    <StatusCard label="Take care" count={sCounts['Take care'] || 0} color="bg-rose-500" icon={<Briefcase className="w-6 h-6" />} />
                                    <StatusCard label="Phone Number" count={sCounts['Phone Number'] || 0} color="bg-indigo-500" icon={<Phone className="w-6 h-6" />} />
                                    <StatusCard label="Total Lead" count={stats?.totalProcesses || 0} color="bg-purple-500" icon={<Users className="w-6 h-6" />} />
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Middle Section: Job Sources & Domain Ratio */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                    {/* Job Source Distribution */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">Statistics by Job Source</h2>
                                <p className="text-sm text-gray-500">Most effective customer acquisition channels</p>
                            </div>
                            <PieChartIcon className="w-5 h-5 text-indigo-400" />
                        </div>
                        {isLoading ? (
                            <Skeleton className="h-[300px] w-full" />
                        ) : sources.length === 0 ? (
                            <div className="h-[300px] flex items-center justify-center text-gray-400 italic text-sm">
                                No source data yet
                            </div>
                        ) : (
                            <JobSourceChart data={sources} />
                        )}
                    </div>

                    {/* Deal Ratio by Domain */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-gray-800">Deal Ratio by Domain</h2>
                            <p className="text-sm text-gray-500">Domains with the highest success rate</p>
                        </div>
                        {isLoading ? (
                            <Skeleton className="h-[300px] w-full" />
                        ) : (
                            <DealRatioChart data={domains} />
                        )}
                    </div>
                </div>

                {/* Bottom Section: Sales Cycle & Loyal Customers */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8 items-start">
                    {/* Sales Cycle (Span 1) */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-gray-800">Sales Cycle</h2>
                            <p className="text-sm text-gray-500 font-medium line-clamp-1">Time from approach to signing</p>
                        </div>

                        <div className="flex flex-col items-center gap-6">
                            <div className="w-full max-w-[200px]">
                                {isLoading ? (
                                    <Skeleton className="h-48 w-48 rounded-full mx-auto" />
                                ) : (
                                    <SalesCycleChart data={salesCycle} />
                                )}
                            </div>
                            <div className="space-y-4 w-full">
                                {isLoading ? (
                                    <>
                                        <Skeleton className="h-14 w-full" />
                                        <Skeleton className="h-14 w-full" />
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-xl">
                                            <div className="bg-white rounded-full p-2 shadow-sm">
                                                <Clock className="w-4 h-4 text-rose-500" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-800 leading-none">{stats?.avgSalesCycle || 0}</h3>
                                                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mt-1">avg days</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                                             <div className="bg-white rounded-full p-2 shadow-sm">
                                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-800 leading-none">{totalSigned}</h3>
                                                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mt-1">successful deals</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Loyal Customers List (Span 2) */}
                    <div className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <Building className="w-5 h-5 text-rose-500" />
                                    Loyal Customers
                                </h2>
                                <p className="text-sm text-gray-500">Partners with the highest number of signed contracts</p>
                            </div>
                            <div className="bg-green-50 px-3 py-1 rounded-full text-green-700 font-bold text-xs border border-green-100">
                                {totalSigned} signed deals
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 mt-4">
                            {isLoading ? (
                                Array(6).fill(0).map((_, i) => (
                                    <Skeleton key={i} className="h-20 w-full rounded-xl" />
                                ))
                            ) : customers.length === 0 ? (
                                <div className="col-span-2 h-40 flex items-center justify-center text-gray-400 italic text-sm">
                                    No loyal customer data yet
                                </div>
                            ) : (
                                customers.map((cust: any, idx: number) => (
                                    <div key={cust.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors bg-white shadow-sm">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-yellow-100 text-yellow-700 font-bold text-xs shrink-0">
                                                {idx + 1}
                                            </div>
                                            <div className="truncate">
                                                <h4 className="font-bold text-gray-800 text-sm truncate">{cust.name}</h4>
                                                <p className="text-[10px] text-gray-500 truncate">{cust.sector}</p>
                                            </div>
                                        </div>
                                        <div className="ml-2 shrink-0">
                                            <span className="text-rose-500 font-bold text-xs bg-rose-50 px-2 py-0.5 rounded-full">{cust.wins} deals</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
