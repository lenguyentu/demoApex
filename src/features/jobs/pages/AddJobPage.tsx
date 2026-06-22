// @ts-nocheck
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Save, Loader2, Building2, MapPin, DollarSign, 
  FileText, Users, Briefcase, Calendar, Layout
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { saveJobInterviewRounds, saveJobInternalData, getJobInternalData } from '../api';
import { SearchableSelect } from '../../../components/SearchableSelect';
import { ClientSelect } from '../../../components/ClientSelect';
import { useJobDetail, useCreateJob, useUpdateJob } from '../hooks';
import { 
  JOB_PHASE_OPTIONS, 
  ASSIGNMENT_TYPE_OPTIONS, 
  TD_JOB_CATEGORY_OPTIONS,
  ENGLISH_LEVEL_OPTIONS,
  JOB_RANK_OPTIONS,
  JOB_LEVEL_OPTIONS,
  VIETNAM_PROVINCES 
} from '../constants';
import type { JobFormData } from '../types';


// Rich text editor
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import ListItem from '@tiptap/extension-list-item';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';

// ============================================
// MINI COMPONENTS
// ============================================

const EditorToolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) return null;
  
  return (
    <div className="flex items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-lg">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
      >
        <span className="font-bold text-sm">B</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
      >
        <span className="italic text-sm">I</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
      >
        •••
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
      >
        123
      </button>
    </div>
  );
};

interface FormCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const FormCard = ({ title, icon, children, rightContent }: FormCardProps & { rightContent?: React.ReactNode }) => (
  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 ease-in-out">
    <div className="flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 rounded-t-xl">
      <div className="flex items-center gap-2">
        <span className="text-brand-500">{icon}</span>
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      {rightContent && <div>{rightContent}</div>}
    </div>
    <div className="p-5 space-y-4">{children}</div>
  </div>
);

interface InputProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

const FormField = ({ label, required, error, children }: InputProps) => (
  <div className={`transition-all duration-200 ${error ? 'animate-shake' : ''}`}>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && (
      <p className="mt-1 text-sm text-red-600 animate-fade-in">{error}</p>
    )}
  </div>
); 

// --- Kanban Preview Component ---
const KanbanStagesPreview = ({ interviewDetails }: { interviewDetails: any[] }) => {
  const getRoundLabel = (round: any) => {
    let base = '';
    switch(round.round_name) {
      case 'INTERVIEW_COMPLETED_1ST': base = 'VÒNG 1'; break;
      case 'INTERVIEW_COMPLETED_2ND': base = 'VÒNG 2'; break;
      case 'INTERVIEW_COMPLETED_FINAL': base = 'VÒNG 3'; break;
      case 'INTERVIEW_COMPLETED_4TH': base = 'VÒNG 4'; break;
      case 'TEST_COMPLETED': base = 'TEST'; break;
      default: base = `VÒNG ${round.round_number}`;
    }
    return round.description ? `${base}: ${round.description}` : base;
  };

  const getRoundColor = (round: any) => {
    switch(round.round_name) {
      case 'INTERVIEW_COMPLETED_1ST': return 'bg-pink-600';
      case 'INTERVIEW_COMPLETED_2ND': return 'bg-purple-600';
      case 'INTERVIEW_COMPLETED_FINAL': return 'bg-yellow-500';
      case 'INTERVIEW_COMPLETED_4TH': return 'bg-fuchsia-600';
      case 'TEST_COMPLETED': return 'bg-blue-600';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 py-3 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
      {/* Screening is always there */}
      <div className="flex flex-col items-center gap-1">
        <div className="px-3 py-1 rounded-md bg-zinc-800 text-white text-[10px] font-bold shadow-sm">SCREENING</div>
        <div className="w-0.5 h-2 bg-gray-300 dark:bg-gray-700"></div>
      </div>

      {/* Dynamic Interview Rounds */}
      {interviewDetails.map((round, idx) => (
        <div key={round.round_number} className="flex items-center gap-2">
           <div className="flex flex-col items-center gap-1 animate-in zoom-in-90 duration-300">
            <div className={`px-3 py-1 rounded-md ${getRoundColor(round)} text-white text-[10px] font-bold shadow-sm max-w-[150px] truncate`}>
              {getRoundLabel(round).toUpperCase()}
            </div>
            <div className="w-0.5 h-2 bg-gray-300 dark:bg-gray-700"></div>
          </div>
          {idx < interviewDetails.length - 1 && <ArrowLeft size={12} className="text-gray-400 rotate-180 mb-3" />}
        </div>
      ))}

      {/* Offer & Placement always there */}
      <div className="flex items-center gap-2">
         {interviewDetails.length > 0 && <ArrowLeft size={12} className="text-gray-400 rotate-180 mb-3" />}
         <div className="flex flex-col items-center gap-1">
          <div className="px-3 py-1 rounded-md bg-emerald-600 text-white text-[10px] font-bold shadow-sm">OFFER</div>
          <div className="w-0.5 h-2 bg-gray-300 dark:bg-gray-700"></div>
        </div>
      </div>

      <div className="flex items-center gap-2">
         <ArrowLeft size={12} className="text-gray-400 rotate-180 mb-3" />
         <div className="flex flex-col items-center gap-1">
          <div className="px-3 py-1 rounded-md bg-indigo-600 text-white text-[10px] font-bold shadow-sm">PLACEMENT</div>
          <div className="w-0.5 h-2 bg-gray-300 dark:bg-gray-700"></div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const AddJobPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const preSelectedClientId = searchParams.get('client_id');

  const isEditMode = Boolean(id);

  // Hooks
  const { data: existingJob, isLoading: isLoadingJob } = useJobDetail(id || null);
  const createJobMutation = useCreateJob();
  const updateJobMutation = useUpdateJob();

  // HR Contacts state
  const [hrContacts, setHrContacts] = useState<{ id: string; name: string }[]>([]);
  const [loadingHr, setLoadingHr] = useState(false);
  
  // Auto-generated Job ID state
  const [jobId, setJobId] = useState<string>('');
  
  // Generate new job_id on mount (create mode only)
  const generateNewJobId = useCallback(async () => {
    try {
      // Get all job_ids and find the max numeric value
      const { data, error } = await supabase
        .from('jobs')
        .select('job_id')
        .not('job_id', 'is', null)
        .like('job_id', 'TDC%');

      if (error) throw error;

      let maxNumber = 0;
      if (data && data.length > 0) {
        data.forEach((job) => {
          if (job.job_id) {
            const numPart = job.job_id.replace(/\D/g, '');
            if (numPart) {
              const num = parseInt(numPart, 10);
              if (num > maxNumber) {
                maxNumber = num;
              }
            }
          }
        });
      }

      const newJobId = `TDC${(maxNumber + 1).toString().padStart(5, '0')}`;
      setJobId(newJobId);
    } catch (err) {
      console.error('Error generating job_id:', err);
      toast.error('Cannot generate new job code');
    }
  }, []);

  // Call generateNewJobId on mount (create mode)
  useEffect(() => {
    if (!isEditMode) {
      generateNewJobId();
    }
  }, [isEditMode, generateNewJobId]);

  // Form state
  const [formData, setFormData] = useState<JobFormData>({
    position_title: '',
    is_urgent: false,
    client_id: preSelectedClientId || '',
    hr_contact_id: '',
    phase: 'Open',
    td_job_category: 'Non-IT',
    job_rank: null,
    job_level: null,
    job_summary: '',
    jd_clear: '',
    requirements: '',
    work_location: '',
    work_address: '',
    min_monthly_salary: '',
    max_monthly_salary: '',
    min_annual_salary: '',
    max_annual_salary: '',
    assignment_type: 'CTV',
    headhunt_fee: '',
    ctv_fee: '',
    freelance_fee: '',
    warranty_period_days: 60,
    interview_rounds: 0,
    english_level: 'Conversational',
    lower_age_limit: null,
    upper_age_limit: null,
    insurance: '',
    bonus: '',
    allowance: '',
    annual_leave: '',
    number_of_employees: 1,
    working_hours: '',
  });

  // Internal data state (job_internal_data table)
  const [internalData, setInternalData] = useState({
    original_jd_url: '',
    internal_notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Interview round details - dynamic based on interview_rounds count
  const [interviewDetails, setInterviewDetails] = useState<
    { round_number: number; round_name: string; interviewer_name: string; description: string }[]
  >([]);

  // Sync interview details when interview_rounds changes
  useEffect(() => {
    const rounds = formData.interview_rounds || 0;
    setInterviewDetails((prev) => {
      const newDetails = [];
      for (let i = 1; i <= rounds; i++) {
        const existing = prev.find((d) => d.round_number === i);
        
        // Auto-select round name for new rounds
        let defaultRoundName = '';
        if (!existing) {
          if (i === 1) defaultRoundName = 'INTERVIEW_COMPLETED_1ST';
          else if (i === 2) defaultRoundName = 'INTERVIEW_COMPLETED_2ND';
          else if (i === 3) defaultRoundName = 'INTERVIEW_COMPLETED_FINAL';
          else if (i === 4) defaultRoundName = 'INTERVIEW_COMPLETED_4TH';
        }

        newDetails.push(existing || { 
          round_number: i, 
          round_name: defaultRoundName, 
          interviewer_name: '', 
          description: '' 
        });
      }
      return newDetails;
    });
  }, [formData.interview_rounds]);

  // Handle interview detail changes
  const handleInterviewDetailChange = (
    roundNumber: number,
    field: 'round_name' | 'interviewer_name' | 'description',
    value: string
  ) => {
    setInterviewDetails((prev) =>
      prev.map((d) => (d.round_number === roundNumber ? { ...d, [field]: value } : d))
    );
  };

  // Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      ListItem,
      BulletList,
      OrderedList,
    ],
    content: formData.job_summary || '',
    onUpdate: ({ editor: e }) => {
      setFormData((prev) => ({ ...prev, job_summary: e.getHTML() }));
    },
  });

  // Auto-resize for JD Clear
  const jdClearRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (jdClearRef.current) {
      jdClearRef.current.style.height = 'auto';
      jdClearRef.current.style.height = `${jdClearRef.current.scrollHeight}px`;
    }
  }, [formData.jd_clear]);

  // Load existing job data
  useEffect(() => {
    if (existingJob && isEditMode) {
      // Set job_id from existing job
      setJobId(existingJob.job_id || '');
      
      setFormData({
        position_title: existingJob.position_title || '',
        is_urgent: existingJob.is_urgent || false,
        client_id: existingJob.client_id || '',
        hr_contact_id: existingJob.hr_contact_id || '',
        phase: existingJob.phase || 'Open',
        td_job_category: existingJob.td_job_category || 'Non-IT',
        job_rank: existingJob.job_rank || null,
        job_level: existingJob.job_level || null,
        job_summary: existingJob.job_summary || '',
        jd_clear: existingJob.jd_clear || '',
        requirements: existingJob.requirements || '',
        work_location: existingJob.work_location || '',
        work_address: existingJob.work_address || '',
        min_monthly_salary: existingJob.min_monthly_salary || '',
        max_monthly_salary: existingJob.max_monthly_salary || '',
        min_annual_salary: existingJob.min_annual_salary || '',
        max_annual_salary: existingJob.max_annual_salary || '',
        assignment_type: existingJob.assignment_type || 'CTV',
        headhunt_fee: existingJob.headhunt_fee || '',
        ctv_fee: existingJob.ctv_fee || '',
        freelance_fee: existingJob.freelance_fee || '',
        warranty_period_days: existingJob.warranty_period_days || 60,
        interview_rounds: existingJob.interview_rounds || 2,
        english_level: existingJob.english_level || 'Conversational',
        lower_age_limit: existingJob.lower_age_limit || 25,
        upper_age_limit: existingJob.upper_age_limit || 40,
        insurance: existingJob.insurance || '',
        bonus: existingJob.bonus || '',
        allowance: existingJob.allowance || '',
        annual_leave: existingJob.annual_leave || '',
        number_of_employees: existingJob.number_of_employees || null,
        working_hours: existingJob.working_hours || '',
      });
      editor?.commands.setContent(existingJob.job_summary || '');

      // Fetch internal data from job_internal_data table
      const fetchInternalData = async () => {
        try {
          const data = await getJobInternalData(existingJob.id);
          if (data) {
            setInternalData({
              original_jd_url: data.original_jd_url || '',
              internal_notes: data.internal_notes || '',
            });
          }
        } catch (error) {
          console.error('Error fetching internal data:', error);
        }
      };
      fetchInternalData();

      // Fetch interview rounds from database
      const fetchInterviewRounds = async () => {
        const { data, error } = await supabase
          .from('job_interview_rounds')
          .select('*')
          .eq('job_id', existingJob.id)
          .order('round_number');

        if (!error && data && data.length > 0) {
          setInterviewDetails(
            data.map((r) => ({
              round_number: r.round_number,
              round_name: r.round_name || '',
              interviewer_name: r.interviewer_name || '',
              description: r.description || '',
            }))
          );
        }
      };
      fetchInterviewRounds();
    }
  }, [existingJob, isEditMode, editor]);

  // Fetch HR contacts when client changes
  useEffect(() => {
    if (!formData.client_id) {
      setHrContacts([]);
      return;
    }

    const fetchHr = async () => {
      setLoadingHr(true);
      const { data, error } = await supabase
        .from('hr_contacts')
        .select('id, name')
        .eq('client_id', formData.client_id)
        .order('name');
      
      if (!error && data) {
        setHrContacts(data);
      }
      setLoadingHr(false);
    };

    fetchHr();
  }, [formData.client_id]);

  // Handle form changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value ? Number(value) : null) : value,
    }));
    // Clear error
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.position_title?.trim()) {
      newErrors.position_title = 'Job name cannot be empty';
    }
    if (!formData.client_id) {
      newErrors.client_id = 'Please select a client';
    }
    if (!formData.work_location?.trim()) {
      newErrors.work_location = 'Work location cannot be empty';
    }
    if (!formData.work_address?.trim()) {
      newErrors.work_address = 'Detailed address cannot be empty';
    }
    if (!formData.td_job_category) {
      newErrors.td_job_category = 'Please select TD Category';
    }

    // Salary validation - at least one field
    const hasSalary = formData.min_monthly_salary || formData.max_monthly_salary || 
                      formData.min_annual_salary || formData.max_annual_salary;
    if (!hasSalary) {
      newErrors.salary = 'Please enter at least one salary figure';
    }

    if (!formData.hr_contact_id) {
      newErrors.hr_contact_id = 'Please select HR Contact';
    }

    setErrors(newErrors);

    // Scroll to first error field
    if (Object.keys(newErrors).length > 0) {
      const firstErrorKey = Object.keys(newErrors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorKey}"]`) ||
                          document.querySelector(`[data-field="${firstErrorKey}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (errorElement as HTMLElement).focus?.();
      }
    }

    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Please fill out all required information');
      return;
    }

    // Check if job_id is generated (for new jobs)
    if (!isEditMode && !jobId) {
      toast.error('Generating job code, please wait...');
      return;
    }

    try {
      let savedJob;
      if (isEditMode && id) {
        // Check if data has changed by comparing with existing job
        const hasChanges = Object.keys(formData).some((key) => {
          const formVal = formData[key as keyof typeof formData];
          const existingVal = existingJob?.[key as keyof typeof existingJob];
          return formVal !== existingVal && formVal !== (existingVal ?? '');
        });

        // Check if internal data has changed
        const hasInternalDataChanges = 
          (internalData.original_jd_url || internalData.internal_notes);

        if (!hasChanges && interviewDetails.length === 0 && !hasInternalDataChanges) {
          toast.success('No changes to save', { duration: 2000 });
          return;
        }

        // Save job data if changed
        if (hasChanges) {
          savedJob = await updateJobMutation.mutateAsync({ id, payload: formData });
        }
        
        // Save interview rounds if any
        if (interviewDetails.length > 0) {
          await saveJobInterviewRounds(id, interviewDetails);
        }
        
        // Save internal data only if there's data to save
        if (hasInternalDataChanges) {
          await saveJobInternalData(id, internalData);
        }
        
        toast.success('Job updated successfully!', { duration: 3000 });
      } else {
        // Include auto-generated job_id for new jobs
        savedJob = await createJobMutation.mutateAsync({ ...formData, job_id: jobId });
        
        // Save interview rounds with new job ID
        if (savedJob?.id && interviewDetails.length > 0) {
          await saveJobInterviewRounds(savedJob.id, interviewDetails);
        }
        
        // Save internal data with new job ID (only if there's data)
        if (savedJob?.id && (internalData.original_jd_url || internalData.internal_notes)) {
          await saveJobInternalData(savedJob.id, internalData);
        }
        
        toast.success(`Job ${jobId} created successfully!`, { duration: 3000 });
      }
      
      // Delay to let toast show before redirect
      setTimeout(() => {
        navigate(isEditMode ? '/jobs/admin' : '/jobs/open');
      }, 1000);
    } catch (error) {
      console.error('Error saving job:', error);
      toast.error('An error occurred. Please try again.');
    }
  };

  const isSubmitting = createJobMutation.isPending || updateJobMutation.isPending;

  if (isEditMode && isLoadingJob) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="sticky top-0 z-40 -mt-6 pt-6 -mx-4 px-4 pb-4 mb-6 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEditMode ? 'Edit Job' : 'Add New Job'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isEditMode ? 'Update job information' : 'Fill in information to create a new job'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors bg-white dark:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-job-form"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                {isEditMode ? 'Update' : 'Create Job'}
              </>
            )}
          </button>
        </div>
      </div>

      <form id="add-job-form" onSubmit={handleSubmit} className="animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT COLUMN - All fields (3/5) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Basic Info */}
            <FormCard 
              title="Basic Information" 
              icon={<FileText size={18} />}
              rightContent={
                (!isEditMode && jobId) ? (
                  <span className="text-lg font-semibold text-brand-600">ID: {jobId}</span>
                ) : (isEditMode && existingJob?.job_id) ? (
                  <span className="text-lg font-semibold text-brand-600">ID: {existingJob.job_id}</span>
                ) : null
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Job Name" required error={errors.position_title}>
              <input
                type="text"
                name="position_title"
                value={formData.position_title || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800"
                placeholder="E.g.: Senior Frontend Developer"
              />
            </FormField>

            <FormField label="Phase" required>
              <select
                name="phase"
                value={formData.phase || 'Open'}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800"
              >
                {JOB_PHASE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="TD Category" required error={errors.td_job_category}>
              <select
                name="td_job_category"
                value={formData.td_job_category || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800"
              >
                <option value="">Select...</option>
                {TD_JOB_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Job Rank">
              <select
                name="job_rank"
                value={formData.job_rank || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800"
              >
                <option value="">Select rank...</option>
                {JOB_RANK_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Job Level">
              <select
                name="job_level"
                value={formData.job_level || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800"
              >
                <option value="">Select level...</option>
                {JOB_LEVEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Headcount">
              <input
                type="number"
                name="number_of_employees"
                value={formData.number_of_employees || ''}
                onChange={handleChange}
                min={1}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800"
                placeholder="E.g.: 5"
              />
            </FormField>

            <FormField label="Working Hours">
              <input
                type="text"
                name="working_hours"
                value={formData.working_hours || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800"
                placeholder="E.g.: Mon - Fri (8:00 - 17:00)"
              />
            </FormField>
            
          </div>
        </FormCard>

        {/* Client Info */}
        <FormCard title="Client & HR Contact" icon={<Building2 size={18} />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Client" required error={errors.client_id}>
              <div data-field="client_id">
                <ClientSelect
                  value={formData.client_id || ''}
                  onChange={(value) => {
                    setFormData((prev) => ({ ...prev, client_id: value, hr_contact_id: '' }));
                    if (errors.client_id) setErrors((prev) => ({ ...prev, client_id: '' }));
                  }}
                  placeholder="Find and select client..."
                />
              </div>
            </FormField>

            <FormField label="HR Contact" required error={errors.hr_contact_id}>
              <select
                name="hr_contact_id"
                value={formData.hr_contact_id || ''}
                onChange={handleChange}
                disabled={loadingHr || !formData.client_id}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 disabled:opacity-50"
              >
                <option value="">{loadingHr ? 'Loading...' : 'Select HR...'}</option>
                {hrContacts.map((hr) => (
                  <option key={hr.id} value={hr.id}>
                    {hr.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        </FormCard>

        {/* Location */}
        <FormCard title="Location" icon={<MapPin size={18} />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Location" required error={errors.work_location}>
              <div data-field="work_location">
                <SearchableSelect
                  options={VIETNAM_PROVINCES.map(p => ({ value: p.value, label: p.label }))}
                  value={formData.work_location || ''}
                  onChange={(value) => {
                    setFormData((prev) => ({ ...prev, work_location: value }));
                    if (errors.work_location) setErrors((prev) => ({ ...prev, work_location: '' }));
                  }}
                  placeholder="Select province/city..."
                  icon={<MapPin size={16} />}
                />
              </div>
            </FormField>

            <FormField label="Detailed Address" required error={errors.work_address}>
              <input
                type="text"
                name="work_address"
                value={formData.work_address || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800"
                placeholder="123 Nguyen Van Troi, Phu Nhuan Dist..."
              />
            </FormField>
          </div>
        </FormCard>

        {/* Salary */}
        <FormCard title="Salary" icon={<DollarSign size={18} />}>
          {errors.salary && (
            <p className="text-sm text-red-600 mb-2">{errors.salary}</p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-field="salary">
            <FormField label="Min Monthly Salary" required error={errors.min_monthly_salary}>
              <input
                type="text"
                name="min_monthly_salary"
                value={formData.min_monthly_salary || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800"
                placeholder="25M VND"
              />
            </FormField>
            <FormField label="Max Monthly Salary" >
              <input
                type="text"
                name="max_monthly_salary"
                value={formData.max_monthly_salary || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800"
                placeholder="40M VND"
              />
            </FormField>
            <FormField label="Min Annual Salary">
              <input
                type="text"
                name="min_annual_salary"
                value={formData.min_annual_salary || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800"
                placeholder="300M VND"
              />
            </FormField>
            <FormField label="Max Annual Salary">
              <input
                type="text"
                name="max_annual_salary"
                value={formData.max_annual_salary || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800"
                placeholder="500M VND"
              />
            </FormField>
          </div>
        </FormCard>

        {/* Requirements */}
        <FormCard title="Requirements" icon={<Users size={18} />}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FormField label="Min Age">
              <input
                type="number"
                name="lower_age_limit"
                value={formData.lower_age_limit || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800"
              />
            </FormField>
            <FormField label="Max Age">
              <input
                type="number"
                name="upper_age_limit"
                value={formData.upper_age_limit || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800"
              />
            </FormField>
            <FormField label="English Level">
              <select
                name="english_level"
                value={formData.english_level || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800"
              >
                {ENGLISH_LEVEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Interview Rounds">
              <input
                type="number"
                name="interview_rounds"
                value={formData.interview_rounds || ''}
                onChange={handleChange}
                min={1}
                max={5}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800"
              />
            </FormField>
          </div>

          {/* Interview Round Details - shown when interview_rounds > 0 */}
          {interviewDetails.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-base font-semibold text-gray-800 dark:text-white mb-4">
                Interview Round Details
              </h4>
              <div className="space-y-4">
                {interviewDetails.map((round) => (
                  <div
                    key={round.round_number}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
                  >
                    <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Round {round.round_number}
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Tên vòng phỏng vấn */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Interview Round Name <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={round.round_name}
                          onChange={(e) =>
                            handleInterviewDetailChange(round.round_number, 'round_name', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 text-sm"
                        >
                          <option value="">-- Select interview round --</option>
                          <option value="INTERVIEW_COMPLETED_1ST">Round 1 - 1st Round Interview</option>
                          <option value="INTERVIEW_COMPLETED_2ND">Round 2 - 2nd Round Interview</option>
                          <option value="INTERVIEW_COMPLETED_FINAL">Round 3 - 3rd Round Interview</option>
                          <option value="INTERVIEW_COMPLETED_4TH">Round 4 - 4th Round Interview</option>
                          <option value="TEST_COMPLETED">Test - Completed test</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Select the corresponding interview round for the client to easily update the process status
                        </p>
                      </div>

                      {/* Người phỏng vấn */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Interviewer
                        </label>
                        <input
                          type="text"
                          value={round.interviewer_name}
                          onChange={(e) =>
                            handleInterviewDetailChange(round.round_number, 'interviewer_name', e.target.value)
                          }
                          placeholder="VD: HR Manager, CTO..."
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 text-sm"
                        />
                      </div>

                      {/* Mô tả */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Description
                        </label>
                        <textarea
                          value={round.description}
                          onChange={(e) =>
                            handleInterviewDetailChange(round.round_number, 'description', e.target.value)
                          }
                          placeholder="Detailed description of the interview round..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Kanban Preview Section */}
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-2 mb-3">
               <Layout size={16} className="text-brand-600" />
               <h4 className="text-sm font-semibold text-gray-800 dark:text-white uppercase tracking-wider">
                  Kanban Stages Preview
               </h4>
            </div>
            <KanbanStagesPreview interviewDetails={interviewDetails} />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
               * The columns above will be dynamically displayed on the Kanban board corresponding to this job.
            </p>
          </div>
        </FormCard>

        {/* Fees */}
        <FormCard title="Fees & Assignment" icon={<Briefcase size={18} />}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <FormField label="Assignment Type">
              <select
                name="assignment_type"
                value={formData.assignment_type || 'CTV'}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800"
              >
                {ASSIGNMENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>
            {/*<FormField label="Headhunt Fee">
              <input
                type="text"
                name="headhunt_fee"
                value={formData.headhunt_fee || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800"
                placeholder="15%"
              />
            </FormField>
            <FormField label="CTV Fee">
              <input
                type="text"
                name="ctv_fee"
                value={formData.ctv_fee || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800"
                placeholder="10M VND"
              />
            </FormField>
           */}
            <FormField label="Freelance Fee">
              <input
                type="text"
                name="freelance_fee"
                value={formData.freelance_fee || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800"
                placeholder="X million"
              />
            </FormField>
             <FormField label="Warranty (days)">
            <input
              type="number"
              name="warranty_period_days"
              value={formData.warranty_period_days || ''}
              onChange={handleChange}
              className="w-full  px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800"
            />
          </FormField>
          </div>
         
        </FormCard>

        {/* Internal Data - CHỈ internal staff được xem */}
        <FormCard title="Internal Information (Internal staff only)" icon={<Calendar size={18} />}>
          <FormField label="Original JD Link from client">
            <input
              type="url"
              value={internalData.original_jd_url}
              onChange={(e) => setInternalData(prev => ({ ...prev, original_jd_url: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800"
              placeholder="https://..."
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Original JD link from client (may contain sensitive information). Freelancer/CTV cannot view.
            </p>
          </FormField>

          <FormField label="Internal Notes">
            <textarea
              value={internalData.internal_notes}
              onChange={(e) => setInternalData(prev => ({ ...prev, internal_notes: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800"
              placeholder="Notes for the internal team: actual salary, special requirements, sensitive information..."
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Information for this position is stored in a separate table, visible only to internal staff.
            </p>
          </FormField>
        </FormCard>
        </div>

          {/* RIGHT COLUMN - Job Summary (Sticky) (2/5) */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-6 space-y-6">
              <FormCard title="Job Description" icon={<FileText size={18} />}>
                <FormField label="Job Summary">
                  <div 
                    className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden cursor-text bg-white dark:bg-gray-800 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 transition-all"
                    onClick={() => editor?.commands.focus()}
                  >
                    <EditorToolbar editor={editor} />
                    <EditorContent
                      editor={editor}
                      className="p-4 prose dark:prose-invert max-w-none [&_.ProseMirror]:min-h-[500px] [&_.ProseMirror]:outline-none"
                    />
                  </div>
                </FormField>

                <FormField label="JD Clear">
                  <textarea
                    ref={jdClearRef}
                    name="jd_clear"
                    value={formData.jd_clear || ''}
                    onChange={handleChange}
                    rows={1}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 resize-none overflow-hidden min-h-[100px]"
                    placeholder="Note..."
                  />
                </FormField>
              </FormCard>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
};

export default AddJobPage;
