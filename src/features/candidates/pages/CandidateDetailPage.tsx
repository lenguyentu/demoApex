// @ts-nocheck
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { useCandidateDetail, useDatabaseCandidateDetail, useDeleteCandidate, useDeleteDatabaseCandidate, useUpdateCandidate, useUpdateDatabaseCandidate } from '../hooks';
import { useCandidateForm } from '../../../hooks/useCandidateForm';
import { useAuthStore } from '../../auth/store';
import { ArrowLeft, Loader2, Briefcase, Star, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { DocumentViewerModal } from '../components/DocumentViewerModal';
import { ConfirmModal } from '../../../components/ConfirmModal';
import {
  CandidateDetailHeader,
  CandidatePersonalInfo,
  CandidateProfessionalHistory,
  CandidateEducation,
  CandidateSkills,
  CandidateCareerGoals,
  CandidateProfessionalInfo,
} from '../components/detail';
import { RichTextEditor } from '../../../components/RichTextEditor';
import type { ProfessionalHistoryItem } from '../types';
import { sendZaloCandidateNotification } from '../utils/notification';

export function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sourceType = searchParams.get('type') as 'my' | 'database' || 'my';
  
  // Auth & Permissions
  const { can } = useAuthStore();
  const canUpdate = can('update_candidate');
  const canDelete = can('delete_candidate');

  // Modal states
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'cv' | 'evaluation'>('evaluation');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewMessage, setPreviewMessage] = useState('');
  const [isEditing, setIsEditing] = useState(() => searchParams.get('edit') === 'true' && can('update_candidate'));

  // Queries
  const { data: myCandidate, isLoading: isLoadingMy, error: errorMy } = useCandidateDetail(
    sourceType === 'my' ? id || null : null
  );
  
  const { data: dbCandidate, isLoading: isLoadingDb, error: errorDb } = useDatabaseCandidateDetail(
    sourceType === 'database' ? id || null : null
  );

  const candidate = sourceType === 'my' ? myCandidate : dbCandidate;
  const isLoading = sourceType === 'my' ? isLoadingMy : isLoadingDb;
  const error = sourceType === 'my' ? errorMy : errorDb;

  // Mutations
  const updateMyMutation = useUpdateCandidate();
  const updateDbMutation = useUpdateDatabaseCandidate();
  const updateMutation = sourceType === 'my' ? updateMyMutation : updateDbMutation;
  const deleteMyMutation = useDeleteCandidate();
  const deleteDbMutation = useDeleteDatabaseCandidate();
  const deleteMutation = sourceType === 'my' ? deleteMyMutation : deleteDbMutation;

  // Form Handling
  const initialData = useMemo(() => {
    if (!candidate) return undefined;
    const skills = candidate.technical_skills || [];
    const softSkills = candidate.soft_skills || [];
    const languages = candidate.other_languages || [];
    const history = Array.isArray(candidate.professional_history) 
      ? candidate.professional_history 
      : [];

    return {
      fullName: candidate.name,
      email: candidate.email || '',
      phone: candidate.phone || '',
      birthDate: candidate.date_of_birth || '',
      address: candidate.address || '',
      facebook: candidate.facebook || '',
      appliedPosition: candidate.applied_position || '',
      degree: candidate.highest_education || '',
      major: candidate.major || '',
      university: candidate.school_name || '',
      educationPeriod: candidate.education_period || '',
      gpa: candidate.gpa || '',
      englishLevel: candidate.english_level || '',
      certifications: candidate.professional_certifications || '',
      languages: languages.join(', '),
      technicalSkills: skills.join(', '),
      softSkills: softSkills.join(', '),
      currentSalary: candidate.current_monthly_salary || '',
      expectedSalary: candidate.expected_monthly_salary || '',
      availableDate: candidate.employment_start_date || '',
      strengths: candidate.key_strengths || '',
      careerGoals: candidate.career_goals || '',
      professionalHistory: history as ProfessionalHistoryItem[],
      professionalSummary: candidate.professional_summary || '',
      // New Fields mappings
      linkedin: candidate.linkedin || '',
      gender: candidate.gender || '',
      visaStatus: candidate.visa_status || '',
      icPassportNo: candidate.ic_passport_no || '',
      currentEmploymentStatus: candidate.current_employment_status || '',
      experiencedIndustry: candidate.experienced_industry || '',
      experiencedJob: candidate.experienced_job || '',
      employmentType: candidate.employment_type || '',
      noticePeriod: candidate.notice_period || '',
      expectedAnnualSalary: candidate.expected_annual_salary || '',
    };
  }, [candidate]);

  const {
    formData,
    handleInputChange,
    resetForm,
    validateForm,
    setFormData,
  } = useCandidateForm(initialData);

  // Reset form when entering/exiting edit mode or when data loads
  useEffect(() => {
    if (candidate && !isEditing) {
      resetForm();
    }
  }, [candidate, isEditing, resetForm]);

  // Layout Adjustment
  const leftColumnRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!candidate) return;
    if (!leftColumnRef.current) return;
    const adjustFontSize = () => {
      const leftCol = leftColumnRef.current;
      if (!leftCol) return;
      leftCol.style.fontSize = '';
      setTimeout(() => {
        if (!leftCol) return;
        const leftHeight = leftCol.scrollHeight;
        const containerHeight = leftCol.offsetHeight;
        if (leftHeight > containerHeight) {
          const scale = containerHeight / leftHeight;
          const finalScale = Math.max(0.85, Math.min(1.0, scale));
          leftCol.style.fontSize = `${finalScale * 100}%`;
        }
      }, 100);
    };
    adjustFontSize();
    window.addEventListener('resize', adjustFontSize);
    const resizeObserver = new ResizeObserver(adjustFontSize);
    if (leftColumnRef.current) resizeObserver.observe(leftColumnRef.current);
    return () => {
      window.removeEventListener('resize', adjustFontSize);
      resizeObserver.disconnect();
    };
  }, [candidate, isEditing]);

  // Handlers
  const handleDelete = async () => {
    if (!candidate) return;
    try {
      await toast.promise(
        deleteMutation.mutateAsync(candidate.id),
        {
          loading: 'Deleting candidate...',
          success: 'Candidate deleted successfully',
          error: 'An error occurred while deleting the candidate',
        }
      );
      setIsDeleteModalOpen(false);
      navigate(sourceType === 'my' ? '/candidates/my' : '/candidates');
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdate = async () => {
    if (!candidate) return;

    const validation = validateForm();
    if (!validation.isValid) {
      toast.error(validation.error || 'Please double check the information');
      return;
    }

    const stringToArray = (str: string | undefined): string[] | undefined => {
      if (!str || !str.trim()) return undefined;
      return str.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
    };

    const payload = {
      name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      applied_position: formData.appliedPosition || undefined,
      address: formData.address || undefined,
      facebook: formData.facebook || undefined,
      highest_education: formData.degree || undefined,
      major: formData.major || undefined,
      school_name: formData.university || undefined,
      education_period: formData.educationPeriod || undefined,
      gpa: formData.gpa || undefined,
      english_level: formData.englishLevel || undefined,
      professional_certifications: formData.certifications || undefined,
      other_languages: stringToArray(formData.languages),
      technical_skills: stringToArray(formData.technicalSkills),
      soft_skills: stringToArray(formData.softSkills),
      current_monthly_salary: formData.currentSalary || undefined,
      expected_monthly_salary: formData.expectedSalary || undefined,
      career_goals: formData.careerGoals || undefined,
      key_strengths: formData.strengths || undefined,
      date_of_birth: formData.birthDate || undefined,
      employment_start_date: formData.availableDate || undefined,
      professional_summary: formData.professionalSummary || undefined,
      professional_history: formData.professionalHistory.length > 0 ? formData.professionalHistory : undefined,
      // New fields payload
      linkedin: formData.linkedin || undefined,
      gender: formData.gender as any || undefined,
      visa_status: formData.visaStatus as any || undefined,
      ic_passport_no: formData.icPassportNo || undefined,
      current_employment_status: formData.currentEmploymentStatus || undefined,
      experienced_industry: formData.experiencedIndustry || undefined,
      experienced_job: formData.experiencedJob || undefined,
      employment_type: formData.employmentType as any || undefined,
      notice_period: formData.noticePeriod || undefined,
      expected_annual_salary: formData.expectedAnnualSalary || undefined,
    };

    try {
      await toast.promise(
        updateMutation.mutateAsync({ id: candidate.id, payload }),
        {
          loading: 'Updating...',
          success: 'Update successful',
          error: 'An error occurred while updating',
        }
      );
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  // History handlers
  const handleHistoryChange = useCallback((index: number, field: string, value: string) => {
    setFormData(prev => {
      const newHistory = [...prev.professionalHistory];
      newHistory[index] = { ...newHistory[index], [field]: value };
      return { ...prev, professionalHistory: newHistory };
    });
  }, [setFormData]);

  const handleAddHistory = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      professionalHistory: [
        ...prev.professionalHistory,
        { position: '', companyName: '', duration: '', description: '' }
      ]
    }));
  }, [setFormData]);

  const handleRemoveHistory = useCallback((index: number) => {
    setFormData(prev => {
      const newHistory = [...prev.professionalHistory];
      newHistory.splice(index, 1);
      return { ...prev, professionalHistory: newHistory };
    });
  }, [setFormData]);

  // Potential change handler - Only updates DB status
  const handlePotentialChange = async (isPotential: boolean) => {
    if (!candidate) return;

    try {
      await toast.promise(
        updateMutation.mutateAsync({ 
          id: candidate.id, 
          payload: { is_potential: isPotential } 
        }),
        {
          loading: isPotential ? 'Marking as Hot Profile...' : 'Unmarking...',
          success: isPotential ? 'Marked as Hot Profile!' : 'Unmarked successfully',
          error: 'An error occurred',
        }
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Open Zalo preview modal
  const handleOpenZaloPreview = () => {
    if (!candidate) return;

    // 1. Chỉ strip các HTML tags đơn giản nếu nội dung là HTML từ RichTextEditor
    const stripHtml = (html: string) => {
      if (!html) return 'N/A';
      return html
        .replace(/<[^>]*>?/gm, '') // Strip HTML tags
        .replace(/&nbsp;/g, ' ')
        .trim();
    };

    const summary = stripHtml(candidate.professional_summary || '');
    const message = `
Potential profile from TD Consulting
Candidate Code: ${candidate.cdd_code || 'N/A'}
Position: ${candidate.applied_position || 'Not updated'}
Location: ${candidate.address || 'Not updated'}

Summary
${summary}

Expected Salary: ${candidate.expected_monthly_salary || 'Negotiable'}

Please contact TD Consulting if you want to connect for a fee (headhunting) with us via Zalo number: 0336828903
`.trim();

    setPreviewMessage(message);
    setIsPreviewModalOpen(true);
  };

  // Confirm and send Zalo
  const handleConfirmSendZalo = async () => {
    if (!candidate) return;

    try {
      // Send Zalo notification
      await sendZaloCandidateNotification(
        {
          fullName: candidate.name,
          appliedPosition: candidate.applied_position || '',
          address: candidate.address || '',
          professionalSummary: candidate.professional_summary || '',
          expectedSalary: candidate.expected_monthly_salary || '',
        } as any,
        candidate.cdd_code || undefined,
        previewMessage // Pass the edited message here
      );
      
      toast.success('Zalo notification sent!');
      setIsPreviewModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-pink-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading candidate information...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !candidate) {
    return (
      <div className="space-y-6 font-sans p-6">
        <button
          onClick={() => navigate(sourceType === 'my' ? '/candidates/my' : '/candidates')}
          className="flex items-center gap-2 text-gray-600 hover:text-pink-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to list</span>
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">
            {error ? 'An error occurred' : 'Candidate information not found'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans space-y-6 p-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(sourceType === 'my' ? '/candidates/my' : '/candidates')}
        className="flex items-center gap-2 text-gray-600 hover:text-pink-600 transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Back to list</span>
      </button>

      <div className="space-y-6">
        <div ref={leftColumnRef} className="space-y-6 bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col">
          {/* Header Section */}
          <CandidateDetailHeader
            candidate={candidate}
            isEditing={isEditing}
            canUpdate={canUpdate}
            canDelete={canDelete}
            formData={formData}
            handleInputChange={handleInputChange}
            onEdit={() => setIsEditing(true)}
            onCancelEdit={() => {
              resetForm();
              setIsEditing(false);
            }}
            onSave={handleUpdate}
            onDelete={() => setIsDeleteModalOpen(true)}
            onViewCV={() => {
              setModalTab('cv');
              setIsDocumentModalOpen(true);
            }}
            onViewEvaluation={() => {
              setModalTab('evaluation');
              setIsDocumentModalOpen(true);
            }}
            isSaving={updateMutation.isPending}
          />

          {/* Personal Information */}
          <CandidatePersonalInfo
            candidate={candidate}
            isEditing={isEditing}
            formData={formData}
            handleInputChange={handleInputChange}
          />

          {/* Professional Summary */}
          {(candidate.professional_summary || isEditing) && (
            <div className={`transition-all duration-300 ${isEditing ? 'bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-brand-600" />
                  <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
                    Brief Summary
                  </span>
                  {!isEditing && (
                      <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          AI Generated
                      </span>
                  )}
                </h2>
                {/* Potential & Zalo Actions */}
                {canUpdate && !isEditing && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Potential:</span>
                      <select
                        value={candidate.is_potential ? 'yes' : 'no'}
                        onChange={(e) => handlePotentialChange(e.target.value === 'yes')}
                        className={`text-xs font-medium px-3 py-1.5 rounded-full border-0 focus:ring-2 focus:ring-amber-500 cursor-pointer transition-all shadow-sm ${
                          candidate.is_potential 
                            ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <option value="no">Normal</option>
                        <option value="yes">⭐ Hot Profile</option>
                      </select>
                    </div>

                    <button
                      onClick={handleOpenZaloPreview}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-brand-600 rounded-full hover:bg-brand-700 transition-all shadow-sm"
                    >
                      <Send className="h-3 w-3" />
                      Send Zalo
                    </button>
                  </div>
                )}
              </div>
              
              {isEditing ? (
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Brief Content</label>
                    <RichTextEditor
                        value={formData.professionalSummary}
                        onChange={(val) => handleInputChange({ target: { name: 'professionalSummary', value: val } } as any)}
                    />
                </div>
              ) : (
                <div className="relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-400 to-brand-600 rounded-full opacity-80"></div>
                    <div className="pl-5 py-1 text-sm text-gray-700 leading-relaxed font-medium prose prose-sm max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(candidate.professional_summary || '') }} />
                    </div>
                </div>
              )}
            </div>
          )}

          {/* Professional History */}
          <CandidateProfessionalHistory
            candidate={candidate}
            isEditing={isEditing}
            professionalHistory={formData.professionalHistory}
            onHistoryChange={handleHistoryChange}
            onAddHistory={handleAddHistory}
            onRemoveHistory={handleRemoveHistory}
          />

          {/* Professional Information */}
          <CandidateProfessionalInfo
            candidate={candidate}
            isEditing={isEditing}
            formData={formData}
            handleInputChange={handleInputChange}
          />

          {/* Education */}
          <CandidateEducation
            candidate={candidate}
            isEditing={isEditing}
            formData={formData}
            handleInputChange={handleInputChange}
          />

          {/* Skills */}
          <CandidateSkills
            candidate={candidate}
            isEditing={isEditing}
            formData={formData}
            handleInputChange={handleInputChange}
          />

          {/* Career Goals & Certifications */}
          <CandidateCareerGoals
            candidate={candidate}
            isEditing={isEditing}
            formData={formData}
            handleInputChange={handleInputChange}
          />
        </div>
      </div>

      <DocumentViewerModal 
        isOpen={isDocumentModalOpen} 
        onClose={() => setIsDocumentModalOpen(false)} 
        cvUrl={candidate.cv_link}
        evaluationUrl={candidate.evaluation_file_path}
        initialTab={modalTab}
      />
      <ConfirmModal 
        open={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={handleDelete} 
        title="Delete Candidate" 
        message={`Are you sure you want to delete candidate "${candidate?.name}"? This action cannot be undone.`} 
        confirmText="Delete" 
        cancelText="Cancel" 
        variant="danger" 
        isLoading={deleteMutation.isPending} 
      />

      {/* Zalo Preview Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-200">
            <div className="bg-linear-to-r from-brand-500 to-brand-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Star className="h-5 w-5 fill-white" />
                <h3 className="text-lg font-semibold">Preview Zalo Message</h3>
              </div>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="text-white hover:bg-white/20 rounded-lg p-1 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500 font-medium">Message content (Can edit directly):</p>
                  {/* <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Group: Share CV TDC</span> */}
                </div>
                <textarea
                  value={previewMessage}
                  onChange={(e) => setPreviewMessage(e.target.value)}
                  rows={12}
                  className="w-full bg-transparent text-sm text-gray-800 font-sans leading-relaxed border-0 focus:ring-0 p-2 resize-none min-h-[300px]"
                  placeholder="Enter message content..."
                />
              </div>
              <p className="mt-3 text-[11px] text-gray-400 italic">* Note: This content will be sent directly to the Zalo group via bot.</p>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSendZalo}
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition shadow-sm"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send Zalo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
