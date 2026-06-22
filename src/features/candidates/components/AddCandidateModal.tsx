// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { ConfirmModal } from '../../../components/ConfirmModal';
import {
  X,
  UploadCloud,
  TriangleAlert,
  Lightbulb,
  Loader2,
  Upload,
  Plus,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import type { ProfessionalHistoryItem } from '../types';
import toast from 'react-hot-toast';
import { useFileUpload, useCandidateForm } from '../../../hooks';
import { uploadCV, analyzeCV } from '../cvService';
import { useCreateCandidate } from '../hooks';
import { useAuthStore } from '../../auth/store';
import { POTENTIAL_OPTIONS } from '../constants';
import { sendPotentialCandidateNotification } from '../utils/notification';
import type { DiscordExtraData } from '../utils/notification';
import { DiscordPreviewModal } from './DiscordPreviewModal';
import type { Candidate } from '../types';

interface AddCandidateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (candidate?: Candidate) => void;
  initialFile?: File; // For batch import
  size?: 'default' | 'compact'; // Size mode
  hideUploadSection?: boolean; // Hide upload UI for batch mode
  autoSubmitOnSuccess?: boolean; // Auto close on success for batch
  embedded?: boolean; // Render as card instead of modal overlay
  onRemove?: () => void; // Callback for X button in embedded mode
  onStatusChange?: (status: 'uploading' | 'analyzing' | 'ready' | 'saving' | 'success' | 'error') => void;
  cardKey?: string; // Unique key for Save All functionality
}

export function AddCandidateModal({ 
  open, 
  onClose, 
  onSuccess, 
  initialFile,
  size = 'default',
  hideUploadSection = false,
  embedded = false,
  onRemove,
  onStatusChange,
  cardKey
}: AddCandidateModalProps) {
  const {
    formData,
    loading,
    setLoading,
    handleInputChange,
    resetForm,
    validateForm,
    autoFillFromAnalysis,
    addProfessionalHistory,
    removeProfessionalHistory,
  } = useCandidateForm();

  const [newHistoryItem, setNewHistoryItem] = useState<ProfessionalHistoryItem>({
    companyName: '',
    position: '',
    duration: '',
    description: '',
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [uploadedCvUrl, setUploadedCvUrl] = useState<string | null>(null);
  const [embeddedStatus, setEmbeddedStatus] = useState<'success' | 'error' | null>(null);
  
  // Discord Notification Preview State
  const [showDiscordPreview, setShowDiscordPreview] = useState(false);
  const [showDiscordConfirm, setShowDiscordConfirm] = useState(false);
  const [createdCandidate, setCreatedCandidate] = useState<Candidate | null>(null);
  const [isSendingDiscord, setIsSendingDiscord] = useState(false);

  const { user } = useAuthStore();
  const createMutation = useCreateCandidate();

  const {
    file: cvFile,
    error: cvError,
    fileInputRef,
    handleFileChange: baseHandleFileChange,
    resetFile,
    openFileDialog,
  } = useFileUpload({
    maxSize: 10 * 1024 * 1024, // 10MB
    validateFileName: false,
  });

  // Ref to prevent duplicate processing from React StrictMode
  const hasProcessedInitialFileRef = useRef(false);

  // Auto-process initialFile if provided (for batch import)
  useEffect(() => {
    if (initialFile && open && !hasProcessedInitialFileRef.current) {
      hasProcessedInitialFileRef.current = true;
      // Simulate file input change
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(initialFile);
      const fakeEvent = {
        target: { files: dataTransfer.files }
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(fakeEvent);
    }
  }, [initialFile, open]);

  // Handle file change với auto-analysis
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      baseHandleFileChange(e);
      return;
    }

    // Validate và set file
    baseHandleFileChange(e);

    // Sau khi validate pass, bắt đầu analyze
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const maxSize = 10 * 1024 * 1024;

    if (!allowedTypes.includes(file.type) || file.size > maxSize) {
      return; // baseHandleFileChange đã set error
    }

    // Auto-analyze CV
    setAnalyzing(true);
    setAnalysisError('');
    setUploadedCvUrl(null);

    try {
      if (!user?.id) {
        throw new Error('Not logged in. Please log in again.');
      }

      // Upload CV
      const cvUrl = await uploadCV(file, user.id);
      setUploadedCvUrl(cvUrl);

      // Analyze CV
      const analysisData = await analyzeCV(cvUrl);
      autoFillFromAnalysis(analysisData);
    } catch (error) {
      console.error('Error analyzing CV:', error);
      setAnalysisError(
        error instanceof Error
          ? error.message
          : 'Unable to analyze CV. Please fill in manually.'
      );
    } finally {
      setAnalyzing(false);
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cvFile) {
      toast.error('CV is required to create a candidate');
      return;
    }

    const validation = validateForm();
    if (!validation.isValid) {
      toast.error(validation.error || 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      let cvUrl = uploadedCvUrl;

      if (!cvUrl && user?.id) {
        cvUrl = await uploadCV(cvFile, user.id);
      }

      // Helper để convert string thành array
      const stringToArray = (str: string | undefined): string[] | undefined => {
        if (!str || !str.trim()) return undefined;
        return str
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
      };

      const candidateData = {
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        applied_position: formData.appliedPosition || undefined,
        cv_link: cvUrl || undefined,
        phase: (formData.phase as any) || 'New_Lead',
        is_potential: formData.isPotential === 'yes',
        address: formData.address || undefined,
        facebook: formData.facebook || undefined,
        // Education
        highest_education: formData.degree || undefined,
        major: formData.major || undefined,
        school_name: formData.university || undefined,
        education_period: formData.educationPeriod || undefined,
        gpa: formData.gpa || undefined,
        english_level: formData.englishLevel || undefined,
        professional_certifications: formData.certifications || undefined,
        other_languages: stringToArray(formData.languages),
        // Skills
        technical_skills: stringToArray(formData.technicalSkills),
        soft_skills: stringToArray(formData.softSkills),
        // Salary
        current_monthly_salary: formData.currentSalary || undefined,
        expected_monthly_salary: formData.expectedSalary || undefined,
        career_goals: formData.careerGoals || undefined,
        key_strengths: formData.strengths || undefined,
        professional_summary: formData.professionalSummary || undefined,
        professional_history: formData.professionalHistory.length > 0 ? formData.professionalHistory : undefined,
        // New Fields
        gender: formData.gender as any || undefined,
        linkedin: formData.linkedin || undefined,
        notice_period: formData.noticePeriod || undefined,
        employment_start_date: formData.employmentStartDate || undefined,
        employment_type: formData.employmentType as any || undefined,
        current_employment_status: formData.currentEmploymentStatus || undefined,
        expected_annual_salary: formData.expectedAnnualSalary || undefined,
        experienced_industry: formData.experiencedIndustry || undefined,
        experienced_job: formData.experiencedJob || undefined,
        visa_status: formData.visaStatus as any || undefined,
        // cdd_rank: formData.rank as any || undefined, // Rank is usually internal
      };

      const result = await createMutation.mutateAsync(candidateData);
      setCreatedCandidate(result);

      if (formData.isPotential === 'yes') {
        setShowDiscordPreview(true);
        toast.success('Candidate added successfully! Please review the Discord notification.');
      } else {
        // Success but not potential - ask via ConfirmModal if want to send Discord
        toast.success('Candidate added successfully!');
        setShowDiscordConfirm(true);
      }
    } catch (error) {
      console.error('Error creating candidate:', error);
      toast.error(
        error instanceof Error ? error.message : 'An error occurred while creating the candidate'
      );
      if (embedded) {
        setEmbeddedStatus('error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessFinish = () => {
    // Save candidate ref before resetting
    const savedCandidate = createdCandidate;
    
    resetForm();
    resetFile();
    setAnalysisError('');
    setUploadedCvUrl(null);
    setCreatedCandidate(null);
    setShowDiscordPreview(false);
    setShowDiscordConfirm(false);
    
    // Close modal in both normal and embedded mode
    onClose();
    onSuccess?.(savedCandidate ?? undefined);
  };

  const handleSendDiscord = async (extraData: DiscordExtraData) => {
    if (!createdCandidate) return;
    
    setIsSendingDiscord(true);
    try {
      const creatorName = user?.full_name || user?.email || 'Unknown';
      await sendPotentialCandidateNotification(
        formData, 
        createdCandidate.cv_link, 
        creatorName, 
        createdCandidate.cdd_code,
        extraData
      );
      toast.success('Discord notification sent!');
      handleSuccessFinish();
    } catch (error) {
      console.error('Error sending Discord notification:', error);
      // Even if discord fails, we treat it as candidate success but show error for discord
      handleSuccessFinish();
    } finally {
      setIsSendingDiscord(false);
    }
  };

  const handleClose = () => {
    resetForm();
    resetFile();
    setAnalysisError('');
    setUploadedCvUrl(null);
    setShowDiscordPreview(false);
    setShowDiscordConfirm(false);
    setCreatedCandidate(null);
    onClose();
  };

  const inputClass =
    'w-full border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 px-3 py-2 bg-gray-50 border border-gray-200';

  const isCompact = size === 'compact';
  const modalWidthClass = isCompact ? 'max-w-md' : 'max-w-3xl';

  // Track current status for embedded mode
  const currentStatus: 'uploading' | 'analyzing' | 'ready' | 'saving' | 'success' | 'error' = 
    embeddedStatus ? embeddedStatus : 
    loading ? 'saving' : 
    analyzing ? 'analyzing' : 
    uploadedCvUrl ? 'ready' : 'uploading';
  
  // Notify parent of status changes
  useEffect(() => {
    if (embedded && onStatusChange) {
      onStatusChange(currentStatus);
    }
  }, [currentStatus, embedded, onStatusChange]);

  // Listen for save-all event
  useEffect(() => {
    if (!embedded || !cardKey) return;
    
    const handleSaveAll = () => {
      if (currentStatus === 'ready') {
        const form = document.querySelector(`[data-card-key="${cardKey}"] form`) as HTMLFormElement;
        if (form) form.requestSubmit();
      }
    };
    
    window.addEventListener(`save-all-candidates`, handleSaveAll);
    return () => window.removeEventListener(`save-all-candidates`, handleSaveAll);
  }, [embedded, cardKey, currentStatus]);

  if (!open) return null;

  // Wrapper for embedded vs modal mode
  const contentWrapper = (children: React.ReactNode) => {
    if (embedded) {
      // Embedded card mode - no backdrop, just card
      return (
        <div 
          data-card-key={cardKey}
          className={`bg-white rounded-lg border shadow-md flex flex-col h-full w-full transition-all
            ${currentStatus === 'success' ? 'border-green-300' : ''}
            ${currentStatus === 'error' ? 'border-red-300' : 'border-gray-200'}
          `}
        >
          {children}
        </div>
      );
    }
    // Normal modal mode - with backdrop
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      >
        <div
          className={`bg-white rounded-lg shadow-xl w-full ${modalWidthClass} max-h-[90vh] flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    );
  };

  // Render full form (same for both embedded and modal)
  return (
    <>
      {contentWrapper(
        <>
      {/* Header */}
      <header className={`flex items-center justify-between p-3 ${embedded ? 'bg-gray-50 border-b border-gray-100' : 'bg-brand-500 text-white'} rounded-t-lg sticky top-0 z-10`}>
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          {embedded && (currentStatus === 'uploading' || currentStatus === 'analyzing') && (
            <Loader2 className="animate-spin text-brand-500 shrink-0" size={16} />
          )}
          {embedded && currentStatus === 'success' && (
            <CheckCircle className="text-green-500 shrink-0" size={16} />
          )}
          <h2 className={`${embedded ? 'text-sm font-medium text-gray-700 truncate' : (isCompact ? 'text-lg' : 'text-2xl') + ' font-bold tracking-tight'}`}>
            {embedded ? (initialFile?.name || 'Add Candidate') : (isCompact ? 'Add Candidate' : 'Add New Candidate')}
          </h2>
        </div>
        <button
          onClick={embedded ? onRemove : handleClose}
          className={`p-1 rounded-full ${embedded ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'hover:bg-brand-600'} transition`}
        >
          <X size={embedded ? 16 : (isCompact ? 20 : 24)} />
        </button>
      </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className={`${isCompact ? 'p-4 space-y-4' : 'p-6 space-y-6'}`}>
            {/* Upload CV Section - Conditionally hidden */}
            {!hideUploadSection && (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <UploadCloud size={20} className="text-brand-500" /> Upload CV{' '}
                <span className="text-red-500">*</span>
              </h3>

              {cvError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
                  <TriangleAlert size={16} />
                  <span>{cvError}</span>
                </div>
              )}

              {analysisError && (
                <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-2 rounded-md">
                  <TriangleAlert size={16} />
                  <span>{analysisError}</span>
                </div>
              )}

              {analyzing && (
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-md">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Analyzing CV with AI...</span>
                </div>
              )}

              {/* File uploaded card */}
              {cvFile && !analyzing && uploadedCvUrl && (
                <div className="border-2 border-brand-400 rounded-lg bg-brand-50 p-4">
                  <div className="bg-white rounded-lg border border-brand-300 p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
                      <Upload className="w-6 h-6 text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-base truncate">
                        {cvFile.name}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        File uploaded
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        resetFile();
                        setUploadedCvUrl(null);
                        setAnalysisError('');
                        openFileDialog();
                      }}
                      className="px-4 py-2 bg-white border border-brand-500 text-brand-600 rounded-lg hover:bg-brand-50 transition-colors font-medium text-sm"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}

              {/* Upload area */}
              {(!cvFile || analyzing || !uploadedCvUrl) && (
                <>
                  {!cvError && !cvFile && !analyzing && (
                    <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 p-2 rounded-md">
                      <TriangleAlert size={16} />
                      <span>CV is required to create a candidate</span>
                    </div>
                  )}
                  <div
                    onClick={analyzing ? undefined : openFileDialog}
                    className={`border-2 border-dashed border-brand-300 rounded-lg p-6 text-center space-y-2 transition-colors ${
                      analyzing
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer hover:bg-brand-50/50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      disabled={analyzing}
                      className="hidden"
                    />
                    <div className="w-12 h-12 bg-brand-100 rounded-full mx-auto flex items-center justify-center">
                      <UploadCloud size={24} className="text-brand-500" />
                    </div>
                    <p className="font-semibold text-gray-700">Upload CV here</p>
                    <p className="text-sm text-gray-500">
                      Max size 10MB (PDF, DOC, DOCX)
                    </p>
                    <button
                      type="button"
                      className="mt-2 px-6 py-2 border border-brand-500 text-brand-600 rounded-full hover:bg-brand-50 font-semibold transition"
                    >
                      Select File
                  </button>
                </div>
              </>
            )}
          </div>
            )}

            {/* Info Box */}
            <div className="flex items-start gap-3 bg-yellow-50 text-yellow-800 p-4 rounded-lg border border-yellow-200">
              <Lightbulb size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm">
                The system will automatically read the CV and fill in the information fields. Please review and add any missing information before saving.
              </p>
            </div>

            {/* Personal Info */}
            <div className="p-6 border rounded-lg space-y-4 bg-white">
              <h3 className="text-xl font-bold text-gray-800 border-b pb-3">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="0123456789"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="email@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="text"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="dd/mm/yyyy"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className={inputClass}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Potential
                  </label>
                  <select
                    name="isPotential"
                    value={formData.isPotential}
                    onChange={handleInputChange}
                    className={`${inputClass} ${
                       formData.isPotential === 'yes' ? 'border-amber-400 ring-1 ring-amber-400 bg-amber-50' : ''
                    }`}
                  >
                    {POTENTIAL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-amber-600 mt-0.5">
                    * High quality candidate, available within 30 days
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="123 ABC Street, District 1, HCMC"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link Facebook
                  </label>
                  <input
                    type="text"
                    name="facebook"
                    value={formData.facebook}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="https://facebook.com/username"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link LinkedIn
                  </label>
                  <input
                    type="text"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Applied Position
                  </label>
                  <input
                    type="text"
                    name="appliedPosition"
                    value={formData.appliedPosition}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="Full-Stack Developer"
                  />
                </div>
              </div>
            </div>

            {/* Education & Skills */}
            <div className="p-6 border rounded-lg space-y-4 bg-white">
              <h3 className="text-xl font-bold text-gray-800 border-b pb-3">
                Education & Skills
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Degree
                  </label>
                  <input
                    type="text"
                    name="degree"
                    value={formData.degree}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="Bachelor"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Major
                  </label>
                  <input
                    type="text"
                    name="major"
                    value={formData.major}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="Information Technology"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    University
                  </label>
                  <input
                    type="text"
                    name="university"
                    value={formData.university}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="University of Technology"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Education Period
                  </label>
                  <input
                    type="text"
                    name="educationPeriod"
                    value={formData.educationPeriod}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="2018-2022"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GPA
                  </label>
                  <input
                    type="text"
                    name="gpa"
                    value={formData.gpa}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="3.2/4.0"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    English Level
                  </label>
                  <select
                    name="englishLevel"
                    value={formData.englishLevel}
                    onChange={handleInputChange}
                    className={inputClass}
                  >
                    <option value="">Select level</option>
                    <option value="Basic">Basic</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Fluent">Fluent</option>
                    <option value="Native">Native</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Certifications
                  </label>
                  <input
                    type="text"
                    name="certifications"
                    value={formData.certifications}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="AWS Certified, JLPT N2..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Other Languages
                  </label>
                  <input
                    type="text"
                    name="languages"
                    value={formData.languages}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="Japanese, Korean, Chinese"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate languages with commas
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Technical Skills
                  </label>
                  <textarea
                    name="technicalSkills"
                    value={formData.technicalSkills}
                    onChange={handleInputChange}
                    rows={3}
                    className={inputClass}
                    placeholder="JavaScript, React, Node.js, Python..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate skills with commas
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Soft Skills
                  </label>
                  <textarea
                    name="softSkills"
                    value={formData.softSkills}
                    onChange={handleInputChange}
                    rows={3}
                    className={inputClass}
                    placeholder="Communication, Leadership, Problem Solving..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate skills with commas
                  </p>
                </div>
              </div>
            </div>

            {/* Professional Info */}
            <div className="p-6 border rounded-lg space-y-4 bg-white">
              <h3 className="text-xl font-bold text-gray-800 border-b pb-3">
                Professional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employment Status
                  </label>
                  <input
                    type="text"
                    name="currentEmploymentStatus"
                    value={formData.currentEmploymentStatus}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="Employed, Looking for a job..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                     Experienced Industry
                  </label>
                  <input
                    type="text"
                    name="experiencedIndustry"
                    value={formData.experiencedIndustry}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="IT - Software, Marketing..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Experienced Job
                  </label>
                  <input
                    type="text"
                    name="experiencedJob"
                    value={formData.experiencedJob}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="Backend Developer, Sales Manager..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Desired Employment Type
                  </label>
                  <select
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleInputChange}
                    className={inputClass}
                  >
                    <option value="">Select type</option>
                    <option value="Full_Time_Permanent">Full-time</option>
                    <option value="Part_Time_Permanent">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Internship">Internship</option>
                    <option value="Temporary">Temporary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notice Period
                  </label>
                  <input
                    type="text"
                    name="noticePeriod"
                    value={formData.noticePeriod}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="1 month, 2 weeks..."
                  />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                    Available Start Date
                  </label>
                  <input
                    type="text"
                    name="employmentStartDate"
                    value={formData.employmentStartDate}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="dd/mm/yyyy"
                  />
                </div>
              </div>
            </div>

            {/* Professional History */}
            <div className="p-6 border rounded-lg space-y-4 bg-white">
              <h3 className="text-xl font-bold text-gray-800 border-b pb-3">
                Professional History
              </h3>
              
              {/* List */}
              <div className="space-y-4">
                {formData.professionalHistory.map((item, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative group">
                    <button
                      type="button"
                      onClick={() => removeProfessionalHistory(index)}
                      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Company</p>
                        <p className="font-semibold text-gray-800">{item.companyName || '---'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Position</p>
                        <p className="font-semibold text-gray-800">{item.position || '---'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Duration</p>
                        <p className="text-sm text-gray-700">{item.duration || '---'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-xs text-gray-500">Description</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.description || '---'}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {formData.professionalHistory.length === 0 && (
                  <p className="text-sm text-gray-500 italic text-center py-4">No professional history</p>
                )}
              </div>

              {/* Add New Form */}
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Add New Job</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div className="md:col-span-1">
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Company Name"
                      value={newHistoryItem.companyName || ''}
                      onChange={(e) => setNewHistoryItem(prev => ({ ...prev, companyName: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Position / Title"
                      value={newHistoryItem.position || ''}
                      onChange={(e) => setNewHistoryItem(prev => ({ ...prev, position: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Duration (e.g., Jan 2020 - Current)"
                      value={newHistoryItem.duration || ''}
                      onChange={(e) => setNewHistoryItem(prev => ({ ...prev, duration: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <textarea
                      rows={2}
                      className={inputClass}
                      placeholder="Job Description..."
                      value={newHistoryItem.description || ''}
                      onChange={(e) => setNewHistoryItem(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <button
                      type="button"
                      disabled={!newHistoryItem.companyName && !newHistoryItem.position}
                      onClick={() => {
                        addProfessionalHistory({ ...newHistoryItem });
                        setNewHistoryItem({ companyName: '', position: '', duration: '', description: '' });
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-brand-500 text-brand-600 rounded-md hover:bg-brand-50 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus size={16} /> Add to List
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Evaluation / Brief */}
            <div className="p-6 border rounded-lg space-y-4 bg-white">
              <h3 className="text-xl font-bold text-gray-800 border-b pb-3">
                Evaluation / Brief (Blind CV)
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Professional Summary
                  </label>
                  <div className="relative">
                    <textarea
                      name="professionalSummary"
                      value={formData.professionalSummary}
                      onChange={handleInputChange}
                      rows={10}
                      className={inputClass}
                      placeholder="Enter Blind CV content or candidate evaluation summary..."
                    />
                    <div className="absolute top-2 right-2 text-xs text-gray-400 pointer-events-none">
                      Markdown Supported
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    This content will be used to send to clients (Blind CV). AI has automatically generated a brief, you can edit it.
                  </p>
                </div>
              </div>
            </div>

            {/* Salary & Additional Info */}
            <div className="p-6 border rounded-lg space-y-4 bg-white">
              <h3 className="text-xl font-bold text-gray-800 border-b pb-3">
                Salary and Additional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Salary
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="currentSalary"
                      value={formData.currentSalary}
                      onChange={handleInputChange}
                      className={inputClass + ' pr-12'}
                      placeholder="15,000,000"
                    />
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                      VND
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Salary
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="expectedSalary"
                      value={formData.expectedSalary}
                      onChange={handleInputChange}
                      className={inputClass + ' pr-12'}
                      placeholder="20,000,000"
                    />
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                      VND
                    </span>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Available Date
                  </label>
                  <input
                    type="text"
                    name="availableDate"
                    value={formData.availableDate}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="dd/mm/yyyy"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Strengths
                  </label>
                  <textarea
                    name="strengths"
                    value={formData.strengths}
                    onChange={handleInputChange}
                    rows={4}
                    className={inputClass}
                    placeholder="Candidate's strengths and outstanding abilities..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Career Goals
                  </label>
                  <textarea
                    name="careerGoals"
                    value={formData.careerGoals}
                    onChange={handleInputChange}
                    rows={4}
                    className={inputClass}
                    placeholder="Candidate's career orientation..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="flex items-center justify-end gap-4 p-4 border-t bg-gray-50 rounded-b-lg sticky bottom-0 z-10">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border rounded-md text-gray-700 hover:bg-gray-100 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || analyzing || !cvFile}
              className="px-6 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? 'Creating...'
                : analyzing
                ? 'Analyzing CV...'
                : 'Add Candidate'}
            </button>
          </footer>
        </form>
      </>)}
      <DiscordPreviewModal
        open={showDiscordPreview}
        onClose={handleSuccessFinish}
        onConfirm={handleSendDiscord}
        candidate={formData}
        cvUrl={createdCandidate?.cv_link}
        creatorName={user?.full_name || user?.email || 'Unknown'}
        cddCode={createdCandidate?.cdd_code}
        isSending={isSendingDiscord}
      />
      <ConfirmModal
        open={showDiscordConfirm}
        onClose={() => {
          setShowDiscordConfirm(false);
          handleSuccessFinish();
        }}
        onConfirm={() => {
          setShowDiscordConfirm(false);
          setShowDiscordPreview(true);
        }}
        title="Send Discord Notification?"
        message="Candidate has been added successfully. Do you want to send a notification to Discord?"
        confirmText="Send to Discord"
        cancelText="Skip"
        variant="info"
      />
    </>
  );
}

export default AddCandidateModal;
