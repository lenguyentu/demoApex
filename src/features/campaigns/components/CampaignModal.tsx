// @ts-nocheck
import React, { useState } from 'react';
import { X, Save, Upload, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { createCampaign, updateCampaign, type Campaign, type CampaignFormData } from '../api';
import type { ProcessStatus } from '../../processes/types';

interface CampaignModalProps {
  campaign?: Campaign;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AVAILABLE_PHASES: { value: ProcessStatus; label: string }[] = [
  { value: 'INTERVIEW_COMPLETED_1ST', label: 'Interview Completed (Round 1)' },
  { value: 'INTERVIEW_COMPLETED_2ND', label: 'Interview Completed (Round 2)' },
  { value: 'INTERVIEW_COMPLETED_FINAL', label: 'Interview Completed (Final)' },
  { value: 'INTERVIEW_COMPLETED_4TH', label: 'Interview Completed (Round 4)' },
  { value: 'CV_SUBMITTED_TO_CLIENT', label: 'CV Submitted to Client' },
  { value: 'PLACEMENT_CONFIRMED', label: 'Placement Confirmed' },
];

const toLocalISOString = (dateString?: string) => {
  const date = dateString ? new Date(dateString) : new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export const CampaignModal = ({ campaign, isOpen, onClose, onSuccess }: CampaignModalProps) => {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<'thumbnail' | 'banner' | null>(null);
  const [formData, setFormData] = useState<CampaignFormData>({
    title: campaign?.title || '',
    subtitle: campaign?.subtitle || '',
    thumbnail_url: campaign?.thumbnail_url || '',
    banner_url: campaign?.banner_url || '',
    metric_type: campaign?.metric_type || 'INTERVIEW_ACTUAL',
    rules: campaign?.rules || { target_phases: [] },
    reward_amount: campaign?.reward_amount || 0,
    apply_start_date: toLocalISOString(campaign?.apply_start_date),
    apply_end_date: toLocalISOString(campaign?.apply_end_date),
    display_start_date: toLocalISOString(campaign?.display_start_date),
    display_end_date: toLocalISOString(campaign?.display_end_date),
    status: campaign?.status || 'Draft',
  });

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'thumbnail' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(type);
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = `campaigns/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('public-assets')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        [type === 'thumbnail' ? 'thumbnail_url' : 'banner_url']: publicUrl
      }));
    } catch (error) {
      console.error(`Failed to upload ${type}:`, error);
      alert(`Upload failed. Please ensure 'public-assets' bucket exists and you have permissions.`);
    } finally {
      setUploadingImage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload: CampaignFormData = {
        ...formData,
        apply_start_date: new Date(formData.apply_start_date).toISOString(),
        apply_end_date: new Date(formData.apply_end_date).toISOString(),
        display_start_date: new Date(formData.display_start_date).toISOString(),
        display_end_date: new Date(formData.display_end_date).toISOString(),
      };

      if (campaign) {
        await updateCampaign(campaign.id, payload);
      } else {
        await createCampaign(payload);
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save campaign', error);
      alert('Failed to save campaign. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const togglePhase = (phase: string) => {
    const currentPhases = formData.rules.target_phases || [];
    const newPhases = currentPhases.includes(phase)
      ? currentPhases.filter(p => p !== phase)
      : [...currentPhases, phase];
    
    setFormData({ ...formData, rules: { ...formData.rules, target_phases: newPhases } });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900">
            {campaign ? 'Edit Campaign' : 'Create New Campaign'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 sm:col-span-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  placeholder="e.g. JUNE CAMPAIGN"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={formData.subtitle || ''}
                  onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  placeholder="e.g. Interview Actual"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reward Amount (VND)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.reward_amount}
                  onChange={e => setFormData({ ...formData, reward_amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                >
                  <option value="Draft">Draft</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apply Start Time</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.apply_start_date}
                  onChange={e => setFormData({ ...formData, apply_start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apply End Time</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.apply_end_date}
                  onChange={e => setFormData({ ...formData, apply_end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Start Time</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.display_start_date}
                  onChange={e => setFormData({ ...formData, display_start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display End Time</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.display_end_date}
                  onChange={e => setFormData({ ...formData, display_end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
            </div>

            <div className="col-span-2 space-y-4 pt-4 border-t border-gray-100">
              <h3 className="font-semibold text-gray-900">Campaign Rules</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Phases (Rule)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {AVAILABLE_PHASES.map(phase => (
                    <label key={phase.value} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={(formData.rules.target_phases || []).includes(phase.value)}
                        onChange={() => togglePhase(phase.value)}
                        className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">{phase.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail Image</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={formData.thumbnail_url || ''}
                    onChange={e => setFormData({ ...formData, thumbnail_url: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                    placeholder="https://..."
                  />
                  <label className={`flex shrink-0 items-center gap-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 transition text-sm font-medium ${uploadingImage === 'thumbnail' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {uploadingImage === 'thumbnail' ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    Upload
                    <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'thumbnail')} disabled={uploadingImage !== null} />
                  </label>
                </div>
                {formData.thumbnail_url && (
                  <div className="mt-2 rounded-lg border border-gray-200 overflow-hidden w-24 h-24 bg-gray-50 flex items-center justify-center">
                    <img src={formData.thumbnail_url} alt="Thumbnail" className="max-w-full max-h-full object-contain" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image URL</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={formData.banner_url || ''}
                    onChange={e => setFormData({ ...formData, banner_url: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                    placeholder="https://..."
                  />
                  <label className={`flex shrink-0 items-center gap-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 transition text-sm font-medium ${uploadingImage === 'banner' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {uploadingImage === 'banner' ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    Upload
                    <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'banner')} disabled={uploadingImage !== null} />
                  </label>
                </div>
                {formData.banner_url && (
                  <div className="mt-2 rounded-lg border border-gray-200 overflow-hidden w-full h-32 bg-gray-50 flex items-center justify-center">
                    <img src={formData.banner_url} alt="Banner" className="max-w-full max-h-full object-contain" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition font-medium disabled:opacity-50"
            >
              <Save size={18} />
              {loading ? 'Saving...' : 'Save Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
