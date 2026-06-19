import { useState, useEffect, useCallback } from 'react';
import { X, User, Building2, FileText, ExternalLink, Briefcase, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import type { BDCustomer } from '../types';

interface BDCustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  processId: string;
}

// Helper for Status Badge Color (same as Kanban)
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Research': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Addfriend/Connect': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'Approach': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Follow up': return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'Consulting':
    case 'Hiring': return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Demo contract': return 'bg-pink-50 text-pink-700 border-pink-200';
    case 'Signing':
    case 'Meeting Clear JD':
    case 'Hunting': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'Signed':
    case 'Take care':
    case 'Closed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Working':
    case 'Pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'No current need':
    case 'Excluded': return 'bg-gray-100 text-gray-600 border-gray-200';
    case 'Reject': return 'bg-red-50 text-red-700 border-red-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

export const BDCustomerDetailModal = ({ isOpen, onClose, processId }: BDCustomerDetailModalProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<BDCustomer | null>(null);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    try {
      const { data: customerData, error: custError } = await supabase
        .from('bd_processes')
        .select(`
          *,
          client:clients!inner(
            id,
            client_name,
            website_url,
            client_industry,
            location,
            address
          ),
          owner:users!owner_id(
            id,
            full_name
          )
        `)
        .eq('id', processId)
        .single();
      
      if (custError) throw custError;
      setCustomer(customerData as BDCustomer);
    } catch (error) {
      console.error('Error fetching customer details:', error);
    } finally {
      setLoading(false);
    }
  }, [processId]);

  useEffect(() => {
    if (isOpen && processId) {
      fetchDetails();
    }
  }, [isOpen, processId, fetchDetails]);


  const client = customer?.client as any;

  return (
    <div 
      className={`fixed inset-0 z-50 overflow-y-auto ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/25 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative w-full max-w-2xl transform rounded-2xl bg-white text-left shadow-xl ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50/50">
            <h3 className="text-lg font-semibold leading-6 text-gray-900 flex items-center gap-2">
              <Building2 className="text-brand-600 h-5 w-5" />
              Chi tiết khách hàng
            </h3>
            <button
              type="button"
              className="rounded-md p-1 hover:bg-gray-200 focus:outline-none transition-colors"
              onClick={onClose}
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content - Kanban Card Style */}
          <div className="p-6">
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
              </div>
            ) : customer && client ? (
              <div className="space-y-4">
                {/* Card-like Container */}
                <div className="rounded-2xl border border-zinc-200 bg-white/90 p-4 shadow-sm">
                  <div className="space-y-3">
                    {/* Title (Client Name) */}
                    <div className="flex items-start justify-between">
                      <h4 className="text-lg font-semibold text-zinc-800 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-brand-500" />
                        {client.client_name}
                      </h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(customer.status)}`}>
                        {customer.status}
                      </span>
                    </div>

                    {/* Subtitle (Industry + Location) */}
                    {client.client_industry && (
                      <div className="flex items-center gap-2 text-sm text-zinc-600">
                        <MapPin size={14} className="text-gray-400" />
                        <span className="font-medium">{client.client_industry}</span>
                        {client.location && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span>{client.location}</span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Metadata Rows */}
                    <div className="space-y-1.5 pt-2 border-t border-zinc-100">
                      <p className="text-xs text-zinc-600">
                        <span className="text-zinc-400">Priority:</span> {customer.priority}
                      </p>
                      <p className="text-xs text-zinc-600">
                        <span className="text-zinc-400">Source:</span> {customer.source}
                      </p>
                      <p className="text-xs text-zinc-600">
                        <span className="text-zinc-400">BD:</span> {customer.owner?.full_name || '-'}
                      </p>
                      {customer.last_contact_date && (
                        <p className="text-xs text-zinc-600">
                          <span className="text-zinc-400">Last Contact:</span> {new Date(customer.last_contact_date).toLocaleDateString('vi-VN')}
                        </p>
                      )}
                      {client.website_url && (
                        <p className="text-xs text-zinc-600">
                          <span className="text-zinc-400">Website:</span>{' '}
                          <a 
                            href={client.website_url.includes('http') ? client.website_url : `https://${client.website_url}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-brand-600 hover:underline inline-flex items-center gap-1"
                          >
                            Link <ExternalLink size={10} />
                          </a>
                        </p>
                      )}
                    </div>

                    {/* Memo */}
                    {customer.memo && (
                      <div className="pt-2 border-t border-zinc-100">
                        <p className="text-xs text-zinc-400 mb-1">Ghi chú:</p>
                        <p className="text-sm text-zinc-700 bg-gray-50 p-2 rounded-lg border border-gray-100">
                          {customer.memo}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button 
                    onClick={() => navigate(`/clients/${client.id}/edit`, { state: { isEdit: false } })}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <FileText size={16} />
                    Xem chi tiết
                  </button>
                  <button 
                    onClick={() => navigate(`/clients/${client.id}/edit`, { state: { isEdit: true } })}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors text-sm"
                  >
                    <User size={16} />
                    Chỉnh sửa
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Không tìm thấy thông tin khách hàng.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
