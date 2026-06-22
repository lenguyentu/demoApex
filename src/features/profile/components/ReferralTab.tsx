// @ts-nocheck


import { Copy, Share2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';


export const ReferralTab = ({}: { userId?: string }) => {
    // --- MOCK DATA ---
    const referrals = [
        { id: 'ref1', full_name: 'Nguyễn Văn A', email: 'nguyenvana@example.com', role: 'CTV', created_at: '2023-05-10T10:00:00Z' },
        { id: 'ref2', full_name: 'Trần Thị B', email: 'tranthib@example.com', role: 'Freelancer', created_at: '2023-06-15T14:30:00Z' },
    ];
    const loadingReferrals = false;

    const stats = {
        full_name: 'Test User',
        role: 'Admin',
        referral_code: 'REF-APEX-2023',
        referred_count: 2,
        status: 'approved',
    };
    // -----------------

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`Copied ${label}`);
    };

    const referralLink = stats?.referral_code
        ? `https://apex.tdconsulting.vn/register?ref=${stats.referral_code}`
        : '...';

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header Section */}
            <div className="flex items-center gap-2 mb-4">
                <Share2 className="text-brand-600" />
                <h2 className="text-xl font-bold text-gray-900">Referral Management</h2>
            </div>

            {/* User Info Bar */}
            {stats && (
                <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <Users size={16} className="text-gray-500" />
                    </div>
                    <div>
                        <span className="font-semibold text-gray-900">{stats.full_name || 'User'}</span>
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">{stats.role}</span>
                    </div>
                </div>
            )}

            {/* Codes and Links */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                <div className="flex flex-col md:flex-row gap-6 md:items-end justify-between">
                    <div className="space-y-2">
                        <p className="text-blue-600 font-medium text-sm">Your referral code:</p>
                        <div className="text-2xl font-bold text-gray-900 tracking-wider">
                            {stats?.referral_code || '---'}
                        </div>
                    </div>
                    <button
                        onClick={() => stats?.referral_code && copyToClipboard(stats.referral_code, 'referral code')}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm font-medium"
                    >
                        <Copy size={16} /> Copy code
                    </button>
                </div>
            </div>

            <div className="bg-green-50 border border-green-100 rounded-xl p-6">
                <div className="space-y-2 mb-3">
                    <p className="text-green-700 font-medium text-sm">Full referral link:</p>
                    <div className="bg-white border border-green-200 rounded px-3 py-2 text-gray-600 text-sm font-mono truncate">
                        {referralLink}
                    </div>
                </div>
                <div className="flex justify-end">
                    <button
                        onClick={() => copyToClipboard(referralLink, 'link')}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition shadow-sm font-medium"
                    >
                        <Share2 size={16} /> Copy link
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                    <span className="text-purple-600 font-medium text-sm mb-1">Number of referred people</span>
                    <span className="text-3xl font-bold text-purple-700">{stats?.referred_count || 0}</span>
                </div>
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                    <span className="text-orange-600 font-medium text-sm mb-1">Status</span>
                    <span className="text-xl font-bold text-orange-700">
                        {stats?.status === 'approved' ? 'Active' : (stats?.status || '---')}
                    </span>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                    <span className="text-indigo-600 font-medium text-sm mb-1">Role</span>
                    <span className="text-xl font-bold text-indigo-700">{stats?.role || 'User'}</span>
                </div>
            </div>

            {/* List Section */}
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Users className="text-green-600" size={20} />
                        List of referred people ({referrals?.length || 0})
                    </h3>
                    {/* <button 
                onClick={() => refetch()}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm"
               >
                   <RefreshCw size={14} /> Làm mới
               </button> */}
                </div>

                <div className="divide-y divide-gray-100">
                    {loadingReferrals ? (
                        <div className="p-8 text-center text-gray-500">Loading...</div>
                    ) : referrals?.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 italic">No referrals yet.</div>
                    ) : (
                        referrals?.map((user) => (
                            <div key={user.id} className="p-4 hover:bg-gray-50 transition flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                                        {user.full_name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-900">{user.full_name || 'No Name'}</h4>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
                                        {user.role}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(user.created_at).toLocaleDateString('en-US')}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
