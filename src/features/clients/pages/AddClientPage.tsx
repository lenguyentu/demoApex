import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Briefcase, Plus, Trash2, Phone, ArrowLeft, Loader2, Save, Eye, Pencil, MoreVertical, History, UserPlus, FileText, User } from 'lucide-react';

import { useAuthStore } from '../../auth/store';
import { 
  getClientById, 
  createClient, 
  updateClient, 
  getIndustries,
  deleteClient
} from '../api';

import { supabase } from '../../../lib/supabase';
import type { ClientRank, HrContactData, NewClientData } from '../types';
import { CLIENT_RANK_OPTIONS } from '../constants';
import { HrContactForm } from '../components/HrContactForm';
import { HistoryModal } from '../components/HistoryModal';
import { ClientUserProvisioningModal } from '../components/ClientUserProvisioningModal';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { ClientAttachmentsTable } from '../components/ClientAttachmentsTable';

// Split Components
import { BDInfoSection } from '../components/BDInfoSection';
import { WelfareSection } from '../components/WelfareSection';

const MapPinIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
);

export const AddClientPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const isEditMode = Boolean(id);
    const user = useAuthStore((state) => state.user);

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditMode);
    const [isViewMode, setIsViewMode] = useState(isEditMode);

    // Modal States
    const [showActions, setShowActions] = useState(false);
    const [historyProcessId, setHistoryProcessId] = useState<string | null>(null);
    const [provisioningClient, setProvisioningClient] = useState<{ id: string; name: string } | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Form States
    const [formData, setFormData] = useState<NewClientData>({
        client_name: '',
        owner_id: user?.id || null,
        client_rank: null,
        client_industry: '',
        website_url: '',
        tax_id: '',
        location: '',
        address: '',
        business_overview: '',
        working_hours: '',
        insurance: '',
        medical_expense: '',
        bonus: '',
        allowance: '',
        sick_leave: '',
        annual_leave: '',
        probation_period: '',
        other_benefits: '',
        contract_rate: null,
        warranty_period: null,
        notes: ''
    });

    const [bdData, setBdData] = useState({
        status: 'Research',
        potential_job_link: '',
        source: '',
        potential_job_title: '',
        priority: 'Normal',
        memo: ''
    });

    const [hrContacts, setHrContacts] = useState<HrContactData[]>([]);
    const [attachments, setAttachments] = useState<any[]>([]);
    const [industryOptions, setIndustryOptions] = useState<{id: string, name: string}[]>([]);
    
    // Owner Info State
    const [ownerInfo, setOwnerInfo] = useState<{ full_name?: string | null; email?: string | null } | null>(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const industries = await getIndustries();
                setIndustryOptions(industries);

                if (isEditMode && id) {
                    setInitialLoading(true);
                    const client = await getClientById(id);
                    if (client) {
                        setFormData({
                           ...formData,
                           client_name: client.client_name,
                           owner_id: client.owner_id,
                           client_rank: client.client_rank as ClientRank,
                           client_industry: client.client_industry || '',
                           website_url: client.website_url || '',
                           tax_id: client.tax_id || '',
                           location: client.location || '',
                           address: client.address || '',
                           business_overview: (client as any).business_overview || '',
                           working_hours: (client as any).working_hours || '',
                           insurance: (client as any).insurance || '',
                           medical_expense: (client as any).medical_expense || '',
                           bonus: (client as any).bonus || '',
                           allowance: (client as any).allowance || '',
                           contract_rate: client.contract_rate !== undefined ? client.contract_rate : null,
                           warranty_period: client.warranty_period !== undefined ? client.warranty_period : null,
                           notes: client.notes || '',
                        } as any);
                        
                        if (client.owner) {
                            setOwnerInfo(client.owner);
                        }
                        
                        setIsViewMode(!location.state?.isEdit);
                    }

                    const { data: bdProcess } = await supabase
                        .from('bd_processes')
                        .select('status, potential_job_link, source, potential_job_title, priority, memo')
                        .eq('client_id', id)
                        .maybeSingle();
                    
                    if (bdProcess) {
                        setBdData({
                            status: bdProcess.status || 'Research',
                            potential_job_link: bdProcess.potential_job_link || '',
                            source: bdProcess.source || '',
                            potential_job_title: bdProcess.potential_job_title || '',
                            priority: bdProcess.priority || 'Normal',
                            memo: bdProcess.memo || ''
                        });
                    }

                    const { data: contacts } = await supabase.from('hr_contacts').select('*').eq('client_id', id);
                    if (contacts) setHrContacts(contacts.map(c => ({...c, newsletter: Array.isArray(c.newsletter) ? c.newsletter : []})));
                    
                    const { data: attachmentsData } = await supabase.from('client_attachments').select('id, client_id, file_name, file_path, file_type, file_size, description, created_at, created_by_id').eq('client_id', id).order('created_at', { ascending: false });
                    if (attachmentsData) setAttachments(attachmentsData);
                } else {
                    setIsViewMode(false);
                }
            } catch (error) {
                console.error("Error loading data:", error);
                toast.error("Error loading client data");
            } finally {
                setInitialLoading(false);
            }
        };
        fetchInitialData();
    }, [id, isEditMode]);

    // Separate effect to set default owner in Create Mode when user is available
    useEffect(() => {
        if (!isEditMode && user && !ownerInfo) {
            setOwnerInfo({ full_name: user.full_name, email: user.email });
        }
    }, [isEditMode, user, ownerInfo]);

    const handleInputChange = (field: keyof NewClientData, value: any) => setFormData(prev => ({ ...prev, [field]: value }));
    const handleBdInputChange = (field: string, value: string) => setBdData(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.client_name.trim()) {
            toast.error("Please enter Client name");
            return;
        }

        // Validate website (bắt buộc)
        if (!formData.website_url?.trim()) {
            toast.error("Please enter Client Website");
            return;
        }

        // Validate at least one HR Contact with name (for both create and edit mode)
        const validContacts = hrContacts.filter(c => c.name?.trim());
        if (validContacts.length === 0) {
            toast.error("Please add at least 1 HR Contact");
            return;
        }

        // Validate HR Contacts that have data but missing NAME
        const hasInvalidContact = hrContacts.some(c => 
            !c.name?.trim() && 
            (c.email_1 || c.phone_1 || c.position_title || c.email_2 || c.phone_2 || c.memo)
        );

        if (hasInvalidContact) {
            toast.error("Please enter Name for HR Contact");
            return;
        }

        setLoading(true);
        try {
            let clientId = id;
            
            if (isEditMode && id) {
                // UPDATE MODE
                const clientPayload = {
                    ...formData,
                    owner_id: formData.owner_id || user?.id,
                };
                await updateClient(id, clientPayload);
                clientId = id;
            } else {
                // CREATE MODE - FE creates Client and BD Process
                const clientPayload = {
                    ...formData,
                    owner_id: formData.owner_id || user?.id,
                    user_id: user?.id,
                };
                const newClient = await createClient(clientPayload as any);
                clientId = newClient.id;
            }

            // 2. Lưu/Cập nhật thông tin BD Process
            if (clientId) {
                const { error: bdError } = await supabase.from('bd_processes').upsert({
                    client_id: clientId,
                    status: bdData.status,
                    potential_job_link: bdData.potential_job_link,
                    potential_job_title: bdData.potential_job_title,
                    source: bdData.source,
                    priority: bdData.priority,
                    memo: bdData.memo.trim() || 'Init',
                    owner_id: user?.id,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'client_id' });

                if (bdError) throw bdError;
            }

            // 3. Xử lý HR Contacts sau khi có clientId
            // Filter contacts that have names
            const validContacts = hrContacts.filter(c => c.name?.trim());
            
            if (clientId && validContacts.length > 0) {
                 const savePromises = validContacts.map(async (contact) => {
                     const payload: any = {
                         ...contact,
                         client_id: clientId,
                     };
                     
                     // Nếu id không tồn tại hoặc rỗng, xóa đi để DB tự sinh
                     if (!payload.id) delete payload.id;

                     const { error } = await supabase.from('hr_contacts').upsert(payload);
                     if (error) {
                         console.error('Error saving HR Contact:', contact.name, error);
                         throw error;
                     }
                 });

                 await Promise.all(savePromises);
            }

            await queryClient.invalidateQueries({ queryKey: ['clients'] });
            toast.success(isEditMode ? "Client updated successfully" : "Client created successfully");
            if (!isEditMode) navigate('/clients');
        } catch (error: any) {
            console.error("Submit error:", error);
            toast.error(error.message || "Error saving data");
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* Header Section */}
            <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"><ArrowLeft size={20} /></button>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold text-gray-900">{isEditMode ? 'Client Information' : 'Add New Client'}</h1>
                            {isEditMode && <div className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">{isViewMode ? 'View' : 'Edit'}</div>}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {isEditMode && (
                            <>
                                <button onClick={() => setIsViewMode(!isViewMode)} className={`p-2 rounded-lg transition-colors border ${isViewMode ? 'bg-brand-50 text-brand-600 border-brand-200' : 'bg-white text-gray-500 border-gray-200'}`}>{isViewMode ? <Pencil size={20} /> : <Eye size={20} />}</button>
                                {isViewMode && (
                                    <div className="relative">
                                        <button onClick={() => setShowActions(!showActions)} className="p-2 rounded-lg bg-white text-gray-500 border border-gray-200"><MoreVertical size={20} /></button>
                                        {showActions && (
                                            <>
                                                <div className="fixed inset-0 z-20" onClick={() => setShowActions(false)} />
                                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-30 py-1">
                                                    <button onClick={async () => {
                                                        const { data } = await supabase.from('bd_processes').select('id').eq('client_id', id!).single();
                                                        if (data) setHistoryProcessId(data.id);
                                                        setShowActions(false);
                                                    }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><History size={16} /> History</button>
                                                    <button onClick={() => { setProvisioningClient({ id: id!, name: formData.client_name }); setShowActions(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><UserPlus size={16} /> Provision Account</button>
                                                    <div className="border-t border-gray-100 my-1"></div>
                                                    <button onClick={() => { setDeleteId(id!); setShowActions(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 size={16} /> Delete Client</button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                        {!isViewMode && <button onClick={handleSubmit} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 shadow-sm disabled:opacity-70">{loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {isEditMode ? 'Update' : 'Save Client'}</button>}
                    </div>
                </div>
            </div>

            <div className="px-6 py-6">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8 space-y-4">
                        {/* 1. General Info */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2 rounded-t-xl"><Briefcase className="w-5 h-5 text-brand-600" /><h2 className="font-semibold text-gray-900">General Information</h2></div>
                            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2 md:col-span-2"><label className="text-sm font-medium text-gray-700">Client Name <span className="text-red-500">*</span></label><input type="text" value={formData.client_name} onChange={(e) => handleInputChange('client_name', e.target.value)} placeholder="Enter company name..." className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 font-medium disabled:bg-gray-50" disabled={isViewMode} /></div>
                                <div className="space-y-2"><label className="text-sm font-medium text-gray-700">Industry</label><select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white disabled:bg-gray-50" value={formData.client_industry || ''} onChange={(e) => handleInputChange('client_industry', e.target.value)} disabled={isViewMode}><option value="">Select industry</option>{industryOptions.map(ind => (<option key={ind.id} value={ind.name}>{ind.name}</option>))}</select></div>
                                <div className="space-y-2"><label className="text-sm font-medium text-gray-700">Rank</label><select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white disabled:bg-gray-50" value={formData.client_rank || ''} onChange={(e) => handleInputChange('client_rank', e.target.value || null)} disabled={isViewMode}><option value="">Select Rank</option>{CLIENT_RANK_OPTIONS.map(r => (<option key={r} value={r}>Rank {r}</option>))}</select></div>
                                
                                <div className="space-y-2"><label className="text-sm font-medium text-gray-700">Contract Rate</label><input type="number" step="0.1" value={formData.contract_rate || ''} onChange={(e) => handleInputChange('contract_rate', e.target.value ? parseFloat(e.target.value) : null)} placeholder="E.g.: 2" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 font-medium disabled:bg-gray-50" disabled={isViewMode} /></div>
                                <div className="space-y-2"><label className="text-sm font-medium text-gray-700">Warranty Period (days)</label><input type="number" value={formData.warranty_period || ''} onChange={(e) => handleInputChange('warranty_period', e.target.value ? parseInt(e.target.value, 10) : null)} placeholder="E.g.: 60" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 font-medium disabled:bg-gray-50" disabled={isViewMode} /></div>
                                <div className="space-y-2 md:col-span-2"><label className="text-sm font-medium text-gray-700">General Notes</label><textarea rows={2} value={formData.notes || ''} onChange={(e) => handleInputChange('notes', e.target.value)} placeholder="Enter general notes about the client..." className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 font-medium disabled:bg-gray-50 resize-none" disabled={isViewMode} /></div>
                            </div>
                        </div>

                        {/* 2. BD Info Section (Extracted) */}
                        <BDInfoSection bdData={bdData} onChange={handleBdInputChange} isViewMode={isViewMode} />

                        {/* 3. Contact & Location */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                             <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2 rounded-t-xl"><MapPinIcon className="w-5 h-5 text-brand-600" /><h2 className="font-semibold text-gray-900">Contact & Location</h2></div>
                            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                     <label className="text-sm font-medium text-gray-700">Tax ID</label>
                                    <input type="text" value={formData.tax_id || ''} onChange={(e) => handleInputChange('tax_id', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 font-medium" placeholder="010..." disabled={isViewMode} />
                                </div>
                                <div className="space-y-2">
                                     <label className="text-sm font-medium text-gray-700">Region/Province</label>
                                    <input type="text" value={formData.location || ''} onChange={(e) => handleInputChange('location', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 font-medium" placeholder="Hanoi, HCMC..." disabled={isViewMode} />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                     <label className="text-sm font-medium text-gray-700">Detailed Address</label>
                                    <input type="text" value={formData.address || ''} onChange={(e) => handleInputChange('address', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 font-medium" placeholder="House number, street name, ward/commune..." disabled={isViewMode} />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-gray-700">
                                        Website <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        value={formData.website_url || ''} 
                                        onChange={(e) => handleInputChange('website_url', e.target.value)} 
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 font-medium" 
                                        placeholder="https://example.com" 
                                        disabled={isViewMode}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 4. Welfare Section (Extracted) */}
                        <WelfareSection formData={formData} onChange={handleInputChange} isViewMode={isViewMode} />
                    </div>

                    <div className="lg:col-span-4 space-y-4">
                        {/* BD Owner Info Section */}
                        {ownerInfo && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                                    <User className="w-5 h-5 text-brand-600" />
                                     <h2 className="font-semibold text-gray-900">Owner (BD)</h2>
                                </div>
                                <div className="p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-lg">
                                            {ownerInfo.full_name?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <div className="overflow-hidden">
                                             <p className="font-medium text-gray-900 truncate" title={ownerInfo.full_name || ''}>{ownerInfo.full_name || 'Not updated'}</p>
                                            <p className="text-sm text-gray-500 truncate" title={ownerInfo.email || ''}>{ownerInfo.email || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-2"><Phone className="w-5 h-5 text-brand-600" /><h2 className="font-semibold text-gray-900">HR ({hrContacts.length}) <span className="text-red-500">*</span></h2></div>
                                {!isViewMode && <button type="button" onClick={() => setHrContacts([...hrContacts, {name: '', position_title: '', zip_code: '', address: '', phone_1: '', phone_2: '', email_1: '', email_2: '', division: '', newsletter: [], key_person: false, memo: ''}])} className="text-sm text-brand-600 font-medium flex items-center gap-1"><Plus size={16} /> Add</button>}
                            </div>
                            <div className="p-5 max-h-[600px] overflow-y-auto space-y-1">
                                {hrContacts.map((hr, idx) => (
                                    <HrContactForm key={idx} index={idx} hrContact={hr} onUpdate={(i, f, v) => { const nc = [...hrContacts]; nc[i] = {...nc[i], [f]: v}; setHrContacts(nc); }} onRemove={(i) => setHrContacts(hrContacts.filter((_, idx) => idx !== i))} isViewMode={isViewMode} />
                                ))}
                            </div>
                        </div>
                    </div>
                    {isEditMode && <div className="lg:col-span-12 mt-6"><div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"><div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between"><div className="flex items-center gap-2"><FileText className="w-5 h-5 text-brand-600" /><h2 className="font-semibold text-gray-900">Attachments ({attachments.length})</h2></div></div><div className="p-6"><ClientAttachmentsTable clientId={id!} attachments={attachments} isViewMode={isViewMode} onRefresh={async () => { const { data } = await supabase.from('client_attachments').select('id, client_id, file_name, file_path, file_type, file_size, description, created_at, created_by_id').eq('client_id', id!).order('created_at', { ascending: false }); if (data) setAttachments(data); }} /></div></div></div>}
                </form>

                <HistoryModal isOpen={!!historyProcessId} onClose={() => setHistoryProcessId(null)} processId={historyProcessId || ''} />
                {provisioningClient && <ClientUserProvisioningModal isOpen={!!provisioningClient} onClose={() => setProvisioningClient(null)} clientId={provisioningClient.id} clientName={provisioningClient.name} />}
                <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => { await deleteClient(deleteId!); toast.success("Client deleted successfully"); navigate('/clients'); }} title="Delete Client" message="Are you sure you want to delete this client?" variant="danger" />
            </div>
        </div>
    );
};

export default AddClientPage;
