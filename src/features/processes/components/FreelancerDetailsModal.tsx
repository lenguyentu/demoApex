import { useEffect, useState } from 'react';
import { X, User, Mail, Phone, Calendar, Users } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { STATUS_CONFIG } from '../constants';
import type { Process } from '../types';

interface FreelancerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  freelancerId: string | null;
}

interface FreelancerProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
}

export function FreelancerDetailsModal({ isOpen, onClose, freelancerId }: FreelancerDetailsModalProps) {
  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [candidateCount, setCandidateCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && freelancerId) {
      fetchFreelancerDetails(freelancerId);
    }
  }, [isOpen, freelancerId]);

  const fetchFreelancerDetails = async (id: string) => {
    setLoading(true);
    try {
      // Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, created_at')
        .eq('id', id)
        .single();
      
      if (profileData) {
         setProfile(profileData);
      }
      
      // If profile not found in profiles table, fallback to users table (though users table doesn't have phone usually)
      if (!profileData || profileError) {
         const { data: userData } = await supabase
            .from('users')
            .select('id, full_name, email, created_at')
            .eq('id', id)
            .single();
         if (userData) {
            setProfile({ ...userData, phone: null } as FreelancerProfile);
         }
      }

      // Fetch Candidates Count (candidates owned by this freelancer)
      const { count } = await supabase
        .from('candidates')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', id);
      
      setCandidateCount(count || 0);

      // Fetch Processes
      const { data: processData } = await supabase
        .from('processes')
        .select(`
          *,
          candidate:candidates(id, name, phone),
          job:jobs(id, position_title),
          client:clients(id, client_name)
        `)
        .eq('owner_id', id)
        .order('updated_at', { ascending: false });

      if (processData) {
        setProcesses(processData as unknown as Process[]);
      }

    } catch (error) {
      console.error('Error fetching freelancer details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-full border border-gray-100 shadow-sm text-brand-600">
               <User size={24} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Headhunt Details</h2>
              <p className="text-sm text-gray-500 font-normal">View profile and recruitment history</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          {loading ? (
             <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
             </div>
          ) : (
            <>
              {/* Profile Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                   <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><User size={12}/> Name</div>
                   <div className="font-semibold text-gray-900">{profile?.full_name || 'N/A'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                   <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Mail size={12}/> Email</div>
                   <div className="font-semibold text-gray-900">{profile?.email || 'N/A'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                   <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Phone size={12}/> Phone</div>
                   <div className="font-semibold text-gray-900">{profile?.phone || 'N/A'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                   <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Calendar size={12}/> Join date</div>
                   <div className="font-semibold text-gray-900">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'N/A'}
                   </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                   <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Users size={12}/> Number of candidates</div>
                   <div className="font-semibold text-gray-900">{candidateCount}</div>
                </div>
              </div>

              {/* Processes Table */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 px-1">Processes owned by this headhunter</h3>
                <div className="overflow-hidden border border-gray-200 rounded-lg bg-white shadow-sm">
                  <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50/80">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[180px]">Candidate</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[120px]">Phone</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[250px]">Job</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[200px]">Client</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[140px]">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[160px]">Updated</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {processes.length > 0 ? (
                        processes.map((process) => {
                           const statusConfig = process.process_status ? STATUS_CONFIG[process.process_status] : null;
                           return (
                            <tr key={process.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                <div className="truncate max-w-[180px]" title={process.candidate?.name}>
                                  {process.candidate?.name || 'N/A'}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">
                                {process.candidate?.phone || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                <div className="line-clamp-2" title={process.job?.position_title || ''}>
                                  {process.job?.position_title || 'N/A'}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                <div className="line-clamp-2" title={process.client?.client_name || ''}>
                                  {process.client?.client_name || 'N/A'}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {statusConfig ? (
                                  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold border ${statusConfig.columnBg} ${statusConfig.text} ${statusConfig.border}`}>
                                     {statusConfig.displayName}
                                  </span>
                                ) : (
                                  <span className="text-gray-500 text-sm">{process.process_status}</span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {process.updated_at ? new Date(process.updated_at).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'}
                              </td>
                            </tr>
                           );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                            No processes found for this headhunter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
