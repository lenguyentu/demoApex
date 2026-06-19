import { useState, useCallback } from 'react';
import type { ProfessionalHistoryItem } from '../features/candidates/types';

/**
 * Form state cho Add Candidate Modal
 */
// Update CandidateFormData to include professionalSummary
export interface CandidateFormData {
  // Personal Info
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  address: string;
  facebook: string;
  appliedPosition: string;
  phase: string;
  isPotential: string;
  
  // Education & Skills
  degree: string;
  major: string;
  university: string;
  educationPeriod: string;
  gpa: string;
  englishLevel: string;
  certifications: string;
  languages: string;
  technicalSkills: string;
  softSkills: string;
  
  // Salary & Additional
  currentSalary: string;
  expectedSalary: string;
  availableDate: string;
  strengths: string;
  careerGoals: string;
  professionalHistory: ProfessionalHistoryItem[];
  professionalSummary: string; // New field for Blind CV/Brief

  // New Fields
  gender: string;
  linkedin: string;
  noticePeriod: string;
  employmentStartDate: string;
  employmentType: string;
  currentEmploymentStatus: string;
  expectedAnnualSalary: string;
  experiencedIndustry: string;
  experiencedJob: string;
  visaStatus: string;
  rank: string;
  icPassportNo: string;
}

/**
 * Dữ liệu trả về từ AI analysis
 */
export interface CVAnalysisData {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  address?: string | null;
  linkedin?: string | null;
  facebook?: string | null;
  applied_position?: string | null;
  highest_education?: string | null;
  major?: string | null;
  school_name?: string | null;
  education_period?: string | null;
  gpa_score?: string | null;
  gpa_max?: string | null;
  english_level?: string | null;
  other_languages?: string[] | null;
  professional_certifications?: string | null;
  technical_skills?: string[] | null;
  soft_skills?: string[] | null;
  current_monthly_salary?: string | null;
  expected_monthly_salary?: string | null;
  career_goals?: string | null;
  key_strengths?: string | null;
  professional_history?: ProfessionalHistoryItem[] | null;
  brief?: {
    overview?: string;
    strengths?: string[];
    blind_cv_content?: string;
  } | null;
}

const initialFormData: CandidateFormData = {
  fullName: '',
  email: '',
  phone: '',
  birthDate: '',
  address: '',
  facebook: '',
  appliedPosition: '',
  phase: 'New_Lead',
  isPotential: 'no',
  degree: '',
  major: '',
  university: '',
  educationPeriod: '',
  gpa: '',
  englishLevel: '',
  certifications: '',
  languages: '',
  technicalSkills: '',
  softSkills: '',
  currentSalary: '',
  expectedSalary: '',
  availableDate: '',
  strengths: '',
  careerGoals: '',
  professionalHistory: [],
  professionalSummary: '',
  
  gender: '',
  linkedin: '',
  noticePeriod: '',
  employmentStartDate: '',
  employmentType: '',
  currentEmploymentStatus: '',
  expectedAnnualSalary: '',
  experiencedIndustry: '',
  experiencedJob: '',
  visaStatus: '',
  rank: '',
  icPassportNo: '',
};

interface UseCandidateFormReturn {
  formData: CandidateFormData;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  resetForm: () => void;
  validateForm: () => { isValid: boolean; error?: string };
  autoFillFromAnalysis: (data: CVAnalysisData) => void;
  setFormData: React.Dispatch<React.SetStateAction<CandidateFormData>>;
  addProfessionalHistory: (item: ProfessionalHistoryItem) => void;
  removeProfessionalHistory: (index: number) => void;
  updateProfessionalHistory: (index: number, item: ProfessionalHistoryItem) => void;
}

/**
 * Hook quản lý form state cho Add Candidate
 */
export function useCandidateForm(initialData?: Partial<CandidateFormData>): UseCandidateFormReturn {
  const [formData, setFormData] = useState<CandidateFormData>({
    ...initialFormData,
    ...initialData,
    professionalHistory: initialData?.professionalHistory || [],
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const resetForm = useCallback(() => {
    setFormData({ ...initialFormData, ...initialData, professionalHistory: initialData?.professionalHistory || [] });
    setLoading(false);
  }, [initialData]);

  const validateForm = useCallback((): { isValid: boolean; error?: string } => {
    if (!formData.fullName.trim()) {
      return { isValid: false, error: 'Họ và tên là bắt buộc' };
    }
    if (!formData.email.trim()) {
      return { isValid: false, error: 'Email là bắt buộc' };
    }
    // Remove strict phone validation if it blocks import
    // if (!formData.phone.trim()) {
    //   return { isValid: false, error: 'Số điện thoại là bắt buộc' };
    // }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return { isValid: false, error: 'Email không hợp lệ' };
    }

    return { isValid: true };
  }, [formData]);

  const autoFillFromAnalysis = useCallback((data: CVAnalysisData) => {
    setFormData((prev) => ({
      ...prev,
      fullName: data.name || prev.fullName,
      email: data.email || prev.email,
      phone: data.phone || prev.phone,
      birthDate: data.date_of_birth || prev.birthDate,
      address: data.address || prev.address,
      facebook: data.facebook || prev.facebook,
      appliedPosition: data.applied_position || prev.appliedPosition,
      degree: data.highest_education || prev.degree,
      major: data.major || prev.major,
      university: data.school_name || prev.university,
      educationPeriod: data.education_period || prev.educationPeriod,
      gpa: data.gpa_score && data.gpa_max 
        ? `${data.gpa_score}/${data.gpa_max}` 
        : data.gpa_score || prev.gpa,
      englishLevel: data.english_level || prev.englishLevel,
      certifications: data.professional_certifications || prev.certifications,
      languages: data.other_languages?.join(', ') || prev.languages,
      technicalSkills: data.technical_skills?.join(', ') || prev.technicalSkills,
      softSkills: data.soft_skills?.join(', ') || prev.softSkills,
      currentSalary: data.current_monthly_salary || prev.currentSalary,
      expectedSalary: data.expected_monthly_salary || prev.expectedSalary,
      strengths: data.brief?.strengths?.join('\n') || data.key_strengths || prev.strengths,
      careerGoals: data.career_goals || prev.careerGoals,
      professionalHistory: data.professional_history || prev.professionalHistory,
      professionalSummary: data.brief?.blind_cv_content || data.brief?.overview || prev.professionalSummary,
      
      // Auto-fill new fields if available in analysis (assuming analysis might allow these later, currently mapping what exists)
      gender: data.gender || prev.gender,
      linkedin: data.linkedin || prev.linkedin,
    }));
  }, []);

  const addProfessionalHistory = useCallback((item: ProfessionalHistoryItem) => {
    setFormData((prev) => ({
      ...prev,
      professionalHistory: [...prev.professionalHistory, item],
    }));
  }, []);

  const removeProfessionalHistory = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      professionalHistory: prev.professionalHistory.filter((_, i) => i !== index),
    }));
  }, []);

  const updateProfessionalHistory = useCallback((index: number, item: ProfessionalHistoryItem) => {
    setFormData((prev) => {
      const newHistory = [...prev.professionalHistory];
      newHistory[index] = item;
      return { ...prev, professionalHistory: newHistory };
    });
  }, []);

  return {
    formData,
    loading,
    setLoading,
    handleInputChange,
    resetForm,
    validateForm,
    autoFillFromAnalysis,
    setFormData,
    addProfessionalHistory,
    removeProfessionalHistory,
    updateProfessionalHistory,
  };
}

export default useCandidateForm;
