
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { getFreelancerCVDetails } from '../api';
import { Building2, FileText, ExternalLink, AlertCircle } from 'lucide-react';
import { ProcessHistoryModal } from '../../processes/components/ProcessHistoryModal';

interface CVDetail {
    id: string; // process id
    created_at: string;
    process_status: string;
    process_history: { status: string; change_memo: string; created_at: string }[];
    candidate: { id: string; name: string };
    job: {
        id: string;
        position_title: string;
        client: { client_name: string };
    };
}

export const FreelancerRejectedCVListPage = () => {
    const { id } = useParams<{ id: string }>();
    const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['freelancer-cv-list', id, 'rejected'],
        queryFn: async () => {
            if (!id) return { cvDetails: [], freelancerName: '' };

            // Fetch Freelancer Name
            const { data: userData } = await supabase
                .from('users')
                .select('full_name, email')
                .eq('id', id)
                .single();
            
            const freelancerName = userData ? (userData.full_name || userData.email) : '';

            // Fetch CV Details (With history for rejection reason)
            const cvData = await getFreelancerCVDetails(id, true);
            
            // Filter for Rejected status
            const allCVs = (cvData as unknown as CVDetail[]) || [];
            const rejected = allCVs.filter(cv => 
                cv.process_status?.includes('REJECT') || 
                cv.process_status?.includes('WITHDREW') || 
                cv.process_status?.includes('CANCELLED')
            );

            return {
                cvDetails: rejected,
                freelancerName
            };
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000, 
    });

    const cvDetails = data?.cvDetails || [];
    const freelancerName = data?.freelancerName || '';

    // Group CVs by Job (Client - Position)
    const groupedCVs = cvDetails.reduce((acc, cv) => {
        const key = `${cv.job.client.client_name} - ${cv.job.position_title}`;
        if (!acc[key]) {
            acc[key] = {
                clientName: cv.job.client.client_name,
                positionTitle: cv.job.position_title,
                cvs: []
            };
        }
        acc[key].cvs.push(cv);
        return acc;
    }, {} as Record<string, { clientName: string; positionTitle: string; cvs: CVDetail[] }>);

    if (isLoading) {
        return <div className="p-12 text-center">Loading...</div>;
    }

    return (
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 min-h-screen">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Rejected CV List</h1>
                        <p className="text-sm text-gray-500">
                            Headhunter: <span className="font-semibold text-gray-700">{freelancerName}</span> • Total: {cvDetails.length} CVs
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {Object.values(groupedCVs).map((group, groupIdx) => (
                    <div key={groupIdx} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                        <div className="flex flex-col space-y-1.5 p-6 bg-gray-50/50 py-4 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold tracking-tight text-base text-gray-900">
                                            <span className="hover:text-red-600 cursor-pointer transition-colors">{group.clientName}</span>
                                            <span className="mx-2 text-gray-400">•</span>
                                            <span className="font-normal text-red-600 hover:underline cursor-pointer transition-colors">{group.positionTitle}</span>
                                        </h3>
                                        <div className="inline-flex items-center rounded-full border border-transparent bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700 mt-1">
                                            Rejected Processes
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm text-gray-500">{group.cvs.length} CV(s)</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-0">
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm text-left">
                                    <thead className="[&_tr]:border-b">
                                        <tr className="border-b border-gray-100 transition-colors bg-gray-50/30">
                                            <th className="h-12 px-4 align-middle font-medium text-gray-500 w-16 text-center">No.</th>
                                            <th className="h-12 px-4 align-middle font-medium text-gray-500 w-48 text-center">Candidate Name</th>
                                            <th className="h-12 px-4 align-middle font-medium text-gray-500 w-32 text-center">Applied Date</th>
                                            <th className="h-12 px-4 align-middle font-medium text-gray-500 w-40 text-center">CV</th>
                                            <th className="h-12 px-4 align-middle font-medium text-gray-500 w-40 text-center">Reject Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody className="[&_tr:last-child]:border-0 divide-y divide-gray-100">
                                        {group.cvs.map((cv, idx) => (
                                            <tr key={cv.id} className="border-b transition-colors hover:bg-gray-50/50">
                                                <td className="p-4 align-middle text-center font-medium text-gray-500">{idx + 1}</td>
                                                <td className="p-4 align-middle text-center font-medium text-gray-900">{cv.candidate.name}</td>
                                                <td className="p-4 align-middle text-center text-gray-500">
                                                    {new Date(cv.created_at).toLocaleDateString('en-GB')}
                                                </td>
                                                <td className="p-4 align-middle text-center">
                                                    <button 
                                                        className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-gray-100 h-9 rounded-md px-3 gap-2 text-blue-600 hover:text-blue-700"
                                                        onClick={() => window.open(`/candidates/${cv.candidate.id}`, '_blank')}
                                                    >
                                                        <FileText className="h-4 w-4" />
                                                        View CV
                                                        <ExternalLink className="h-3 w-3" />
                                                    </button>
                                                </td>
                                                <td className="p-4 align-middle text-center">
                                                     <button 
                                                        className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border bg-background hover:text-accent-foreground h-9 rounded-md px-3 gap-2 text-red-600 border-red-200 hover:bg-red-50"
                                                        onClick={() => setSelectedProcessId(cv.id)}
                                                    >
                                                        <AlertCircle className="h-4 w-4" />
                                                        View Reason
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ))}

                {cvDetails.length === 0 && (
                    <div className="text-center p-12 bg-white rounded-xl border border-gray-200">
                        <p className="text-gray-500">No rejected CVs found.</p>
                    </div>
                )}
            </div>

            {/* Process History Modal */}
            {selectedProcessId && (
                <ProcessHistoryModal
                    isOpen={!!selectedProcessId}
                    onClose={() => setSelectedProcessId(null)}
                    processId={selectedProcessId}
                />
            )}
        </main>
    );
};
