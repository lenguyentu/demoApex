
import React, { useState, useEffect } from 'react';
import {
  User, FileText, CreditCard, Facebook, Globe,
  Save, Loader2, Briefcase, X, Plus
} from 'lucide-react';
import { useUpdateProfile } from '../hooks';
import type { Profile, UpdateProfilePayload } from '../types';

export interface ProfileFormProps {
  profile: Profile;
  readOnly?: boolean;
}

const FormCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
    <div className="flex items-center gap-2 px-6 py-4 bg-gray-50 border-b border-gray-200">
      <div className="text-brand-600">{icon}</div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
    </div>
    <div className="p-6 space-y-4">
      {children}
    </div>
  </div>
);

const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {children}
  </div>
);

export const ProfileForm = ({ profile, readOnly = false }: ProfileFormProps) => {
  const updateProfileMutation = useUpdateProfile();

  const [formData, setFormData] = useState<UpdateProfilePayload>({});

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name,
        phone: profile.phone,
        bio: profile.bio,
        location: profile.location,
        address: profile.address,
        zalo: profile.zalo,
        facebook: profile.facebook,
        cv_url: profile.cv_url,
        bank_name: profile.bank_name,
        bank_account_number: profile.bank_account_number,
        bank_account_holder: profile.bank_account_holder,
        bank_branch: profile.bank_branch,
        cccd_file_path: profile.cccd_file_path,
        cccd_front_path: profile.cccd_front_path,
        cccd_back_path: profile.cccd_back_path,
        positions_confident: profile.positions_confident || [],
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    updateProfileMutation.mutate({ userId: profile.id, data: formData });
  };



  const isSaving = updateProfileMutation.isPending;

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <FormCard title="Personal Information" icon={<User size={20} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Full Name">
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name || ''}
                  onChange={handleChange}
                  disabled={readOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter full name"
                />
              </FormField>
              <FormField label="Phone Number">
                <input
                  type="text"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  disabled={readOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter phone number"
                />
              </FormField>
              <FormField label="Address">
                <input
                  type="text"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  disabled={readOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Contact address"
                />
              </FormField>
              <FormField label="City / Province">
                <input
                  type="text"
                  name="location"
                  value={formData.location || ''}
                  onChange={handleChange}
                  disabled={readOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Ex: Ho Chi Minh"
                />
              </FormField>
              <div className="md:col-span-2">
                <FormField label="Bio">
                  <textarea
                    name="bio"
                    rows={3}
                    value={formData.bio || ''}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="A little bit about yourself..."
                  />
                </FormField>
              </div>
            </div>
          </FormCard>

          {/* Positions Confident / Exp */}
          <FormCard title="Experience & Confident Positions" icon={<Briefcase size={20} />}>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Fields you have experience in or are confident recruiting for
              </p>
              <div className="flex flex-wrap gap-2">
                {(formData.positions_confident || []).map((pos, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                  >
                    {pos}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            positions_confident: (prev.positions_confident || []).filter((_, i) => i !== idx)
                          }));
                        }}
                        className="ml-1 p-0.5 hover:bg-emerald-200 rounded transition-colors"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {!readOnly && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="new-position-input"
                    placeholder="Add new position (press Enter)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.currentTarget;
                        const value = input.value.trim();
                        if (value && !(formData.positions_confident || []).includes(value)) {
                          setFormData(prev => ({
                            ...prev,
                            positions_confident: [...(prev.positions_confident || []), value]
                          }));
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('new-position-input') as HTMLInputElement;
                      const value = input?.value.trim();
                      if (value && !(formData.positions_confident || []).includes(value)) {
                        setFormData(prev => ({
                          ...prev,
                          positions_confident: [...(prev.positions_confident || []), value]
                        }));
                        input.value = '';
                      }
                    }}
                    className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1"
                  >
                    <Plus size={16} />
                    Add
                  </button>
                </div>
              )}
            </div>
          </FormCard>

          {/* Identity & Files */}
          <FormCard title="Documents & Identity" icon={<FileText size={20} />}>
            <div className="grid grid-cols-1 gap-4">
              <FormField label="Link CV">
                <input
                  type="text"
                  name="cv_url"
                  value={formData.cv_url || ''}
                  onChange={handleChange}
                  disabled={readOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="https://..."
                />
              </FormField>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="ID Card (Front)">
                  <input
                    type="text"
                    name="cccd_front_path"
                    value={formData.cccd_front_path || ''}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="URL hình ảnh"
                  />
                </FormField>
                <FormField label="ID Card (Back)">
                  <input
                    type="text"
                    name="cccd_back_path"
                    value={formData.cccd_back_path || ''}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="URL hình ảnh"
                  />
                </FormField>
                <FormField label="ID Card File">
                  <input
                    type="text"
                    name="cccd_file_path"
                    value={formData.cccd_file_path || ''}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Scan file path"
                  />
                </FormField>
              </div>
            </div>
          </FormCard>
        </div>

        <div className="space-y-6">
          {/* Socials */}
          <FormCard title="Social Media" icon={<Globe size={20} />}>
            <div className="space-y-4">
              <FormField label="Zalo">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">Z</div>
                  <input
                    type="text"
                    name="zalo"
                    value={formData.zalo || ''}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Zalo phone number"
                  />
                </div>
              </FormField>
              <FormField label="Facebook">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white shrink-0"><Facebook size={18} /></div>
                  <input
                    type="text"
                    name="facebook"
                    value={formData.facebook || ''}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Facebook profile link"
                  />
                </div>
              </FormField>
            </div>
          </FormCard>

          {/* Banking */}
          <FormCard title="Bank Information" icon={<CreditCard size={20} />}>
            <div className="space-y-4">
              <FormField label="Bank Name">
                <input
                  type="text"
                  name="bank_name"
                  value={formData.bank_name || ''}
                  onChange={handleChange}
                  disabled={readOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="VD: Vietcombank"
                />
              </FormField>
              <FormField label="Account Number">
                <input
                  type="text"
                  name="bank_account_number"
                  value={formData.bank_account_number || ''}
                  onChange={handleChange}
                  disabled={readOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="xxxx xxxx xxxx"
                />
              </FormField>
              <FormField label="Account Holder">
                <input
                  type="text"
                  name="bank_account_holder"
                  value={formData.bank_account_holder || ''}
                  onChange={handleChange}
                  disabled={readOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="NGUYEN VAN A"
                />
              </FormField>
              <FormField label="Branch">
                <input
                  type="text"
                  name="bank_branch"
                  value={formData.bank_branch || ''}
                  onChange={handleChange}
                  disabled={readOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Ex: HCM Branch"
                />
              </FormField>
            </div>
          </FormCard>

          {/* Save Button */}
          {!readOnly && (
            <div className="sticky bottom-6">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-3 px-4 rounded-xl font-medium shadow-lg shadow-brand-500/30 hover:bg-brand-700 transition-all disabled:opacity-70 disabled:shadow-none"
              >
                {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};
