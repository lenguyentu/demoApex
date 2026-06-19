import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useAuthStore } from '../../auth/store';
import {
  ArrowLeft,
  Building2,
  MapPin,
  DollarSign,
  Briefcase,
  Clock,
  Users,
  Calendar,
  FileText,
  Loader2,
  ExternalLink,
  Edit,
  Trash2,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  User,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { getJobInternalData } from '../api';
import { IntroduceCandidateModal, JobCommentSection, MatchingCandidatesModal } from '../components';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { JOB_PHASE_CONFIG } from '../constants';
import type { Job } from '../types';
import { generatePDF } from '../utils/pdfGenerator';

// Skeleton component for loading state
const JobDetailSkeleton = () => (
  <div className="animate-pulse">
    {/* Header Skeleton */}
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="h-8 w-2/3 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
        <div className="flex gap-3">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="h-6 w-28 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </div>
      </div>
    </div>
    {/* Content Skeleton */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 w-4/6 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Helper functions
const formatSalary = (job: Job): string => {
  if (job.min_monthly_salary && job.max_monthly_salary) {
    return `${job.min_monthly_salary} - ${job.max_monthly_salary}`;
  }
  if (job.max_monthly_salary) return `Up to ${job.max_monthly_salary}`;
  if (job.min_monthly_salary) return `From ${job.min_monthly_salary}`;
  if (job.min_annual_salary && job.max_annual_salary) {
    return `${job.min_annual_salary} - ${job.max_annual_salary}/year`;
  }
  return 'Thương lượng';
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    APPLIED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    SCREENING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    INTERVIEWING: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    OFFER_EXTENDED: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    PLACEMENT_CONFIRMED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    REJECTED_BY_CLIENT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return colors[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
};

export const JobDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine back link based on referrer
  const { user, can } = useAuthStore();
  // Permissions
  const canEdit = can('update_job');
  const canDelete = can('delete_job');

  const backPath = location.state?.from || '/jobs/open';
  const backLabel = backPath.includes('admin') ? 'Admin Jobs' : 'Open Jobs';

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appliedCandidates, setAppliedCandidates] = useState<any[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [internalData, setInternalData] = useState<{
    original_jd_url: string | null;
    internal_notes: string | null;
  } | null>(null);
  const [userLandingPage, setUserLandingPage] = useState<{ subdomain_slug: string } | null>(null);

  // Modal states
  const [introduceModalOpen, setIntroduceModalOpen] = useState(false);
  const [matchingModalOpen, setMatchingModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [signingCvId, setSigningCvId] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Fetch job data
  useEffect(() => {
    const fetchJob = async () => {
      if (!id) {
        setError('Job ID không hợp lệ');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // MOCK FETCH
        const { MOCK_JOBS } = await import('../../../mocks/jobs');
        const found = MOCK_JOBS.find(j => j.id === id);
        if (found) {
          setJob(found as any);
        } else {
          setError('Không tìm thấy công việc');
        }
      } catch (err) {
        console.error('Error fetching job:', err);
        setError('Không thể tải thông tin công việc');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  // Fetch applied candidates
  useEffect(() => {
    const fetchAppliedCandidates = async () => {
      if (!id) return;

      try {
        setCandidatesLoading(true);
        // MOCK FETCH
        const { MOCK_CANDIDATES } = await import('../../../mocks/candidates');
        const mockProcesses = MOCK_CANDIDATES.slice(0, 3).map(c => ({
          id: 'process-' + c.id,
          process_status: 'INTERVIEWING',
          updated_at: new Date().toISOString(),
          candidates: { id: c.id, name: c.full_name, email: c.email, cv_link: null },
          owner_details: { full_name: 'Mock Admin' }
        }));
        setAppliedCandidates(mockProcesses);
      } catch (err) {
        console.error('Error fetching applied candidates:', err);
      } finally {
        setCandidatesLoading(false);
      }
    };

    fetchAppliedCandidates();
  }, [id]);

  // Fetch internal data (chỉ internal staff được xem)
  useEffect(() => {
    const fetchInternalData = async () => {
      if (!id) return;

      try {
        const data = await getJobInternalData(id);
        setInternalData(data);
      } catch (err) {
        console.error('Error fetching internal data:', err);
        // Không hiển thị error vì có thể user không có quyền xem
      }
    };

    fetchInternalData();
  }, [id]);

  // Fetch landing page
  useEffect(() => {
    const fetchLandingPage = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('headhunter_landing_pages')
          .select('subdomain_slug')
          .eq('user_id', user.id)
          .eq('is_published', true)
          .maybeSingle();

        if (data && !error) {
          setUserLandingPage(data);
        }
      } catch (err) {
        console.error('Error fetching landing page:', err);
      }
    };

    fetchLandingPage();
  }, [user?.id]);

  // Delete job handler
  const handleDelete = async () => {
    if (!id) return;

    try {
      setIsDeleting(true);
      const { error: deleteError } = await supabase
        .from('jobs')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      toast.success('Đã xóa công việc thành công');
      navigate('/jobs');
    } catch (err) {
      console.error('Error deleting job:', err);
      toast.error('Không thể xóa công việc');
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  
  if (loading) return <JobDetailSkeleton />;

  if (error || !job) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4">
        <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {error || 'Không tìm thấy công việc'}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Công việc này có thể đã bị xóa hoặc không tồn tại.
        </p>
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
        >
          <ArrowLeft size={18} />
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  // Pagination logic
  const totalPages = Math.ceil(appliedCandidates.length / ITEMS_PER_PAGE);
  const currentCandidates = appliedCandidates.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const phaseConfig = job.phase ? JOB_PHASE_CONFIG[job.phase] : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
            <button 
              onClick={() => navigate(backPath)}
              className="hover:text-brand-500 transition-colors flex items-center gap-1"
            >
              <ArrowLeft size={14} />
              {backLabel}
            </button>
            <ChevronRight size={14} />
            <span className="text-gray-900 dark:text-white font-medium truncate max-w-[300px]">
              {job.position_title}
            </span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1 min-w-0 space-y-3">
              {/* Job ID & Status Badge Row */}
              <div className="flex items-center gap-3">
                {phaseConfig && (
                  <span
                    className="px-2.5 py-0.5 text-xs font-semibold rounded border"
                    style={{
                      backgroundColor: `${phaseConfig.color}10`,
                      color: phaseConfig.color,
                      borderColor: `${phaseConfig.color}40`
                    }}
                  >
                    {phaseConfig.displayName}
                  </span>
                )}
                {job.job_id && (
                  <span className="text-pink-400 dark:text-gray-500 text-sm font-medium">
                    #{job.job_id}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
                {job.position_title || 'Untitled Position'}
              </h1>

              {/* Meta Data Row - Clean Style */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm pt-1">
                {/* Company */}
                {job.clients?.client_name && (
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                    <Building2 size={16} className="text-gray-400" />
                    <Link
                      to={`/tables/clients/new/${job.clients.id}`}
                      className="font-medium hover:text-brand-500 transition-colors hover:underline"
                    >
                      {job.clients.client_name}
                    </Link>
                  </div>
                )}
                
                {/* Location */}
                {job.work_location && (
                  <>
                    <span className="hidden sm:block text-gray-300 dark:text-gray-600">•</span>
                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                      <MapPin size={16} className="text-gray-400" />
                      <span>{job.work_location}</span>
                    </div>
                  </>
                )}

                {/* Salary - Highlighted */}
                {(job.min_monthly_salary || job.max_monthly_salary) && (
                  <>
                    <span className="hidden sm:block text-gray-300 dark:text-gray-600">•</span>
                    <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium">
                      <DollarSign size={16} />
                      <span>{formatSalary(job)}</span>
                    </div>
                  </>
                )}

                {/* Interview Rounds */}
                {job.interview_rounds && (
                  <>
                    <span className="hidden sm:block text-gray-300 dark:text-gray-600">•</span>
                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                      <Clock size={16} />
                      <span>{job.interview_rounds} vòng</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Actions for Desktop */}
            <div className="flex items-center gap-2 pt-2">
             
              
              {canEdit && (
                <Link
                  to={`/jobs/${id}/edit`}
                  className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/10 rounded-lg transition-colors"
                  title="Chỉnh sửa công việc"
                >
                  <Edit size={20} />
                </Link>
              )}
              
              {canDelete && (
                <button
                  onClick={() => setDeleteModalOpen(true)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                  title="Xóa công việc"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Job Description */}
            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText size={20} className="text-brand-500" />
                  Mô tả công việc
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      const publicUrl = await generatePDF(job, setIsGeneratingPDF);
                      if (!publicUrl) return;

                      try {
                        const response = await fetch(publicUrl);
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `JD_${job.position_title || 'Job'}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                      } catch (err) {
                        console.error('Download failed', err);
                        window.open(`${publicUrl}?download=`, '_blank');
                      }
                    }}
                    disabled={isGeneratingPDF}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/20 dark:text-brand-400 dark:hover:bg-brand-900/40 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-brand-200 dark:border-brand-800"
                  >
                    {isGeneratingPDF ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Download size={16} />
                    )}
                    {isGeneratingPDF ? 'Đang tải...' : 'Tải xuống'}
                  </button>

                  <button
                    onClick={async () => {
                      if (userLandingPage?.subdomain_slug) {
                        const jobCodeOrId = job.job_code || job.job_id || job.id;
                        const landingUrl = `https://${userLandingPage.subdomain_slug}.tdconsulting.vn/jobs/${jobCodeOrId}`;
                        try {
                          await navigator.clipboard.writeText(landingUrl);
                          toast.success('Đã sao chép link JD');
                        } catch (clipboardError) {
                          console.error('Clipboard copy failed:', clipboardError);
                          toast.success(`Link JD: ${landingUrl}`);
                        }
                        return;
                      }

                      const publicUrl = await generatePDF(job, setIsGeneratingPDF);
                      if (!publicUrl) return;

                      try {
                        await navigator.clipboard.writeText(publicUrl);
                        toast.success('Hãy tạo landing page riêng để tránh miss CV nhé', { duration: 5000 });
                      } catch (clipboardError) {
                        console.error('Clipboard copy failed:', clipboardError);
                        toast.success(`Link JD: ${publicUrl}`);
                      }
                    }}
                    disabled={isGeneratingPDF}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingPDF ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <ExternalLink size={16} />
                    )}
                    {isGeneratingPDF ? 'Đang tạo link...' : 'Sao chép link'}
                  </button>
                </div>

              </div>
              <div className="px-6 py-5">
                {job.job_summary ? (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(job.job_summary) }}
                  />
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">
                    Chưa có mô tả công việc.
                  </p>
                )}
              </div>
            </section>

            {/* Requirements */}
            {job.requirements && (
              <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <CheckCircle size={20} className="text-green-500" />
                    Yêu cầu ứng viên
                  </h2>
                </div>
                <div className="px-6 py-5">
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(job.requirements) }}
                  />
                </div>
              </section>
            )}
            {/* Detailed JD */}
            {job.jd_clear && (
              <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText size={20} className="text-blue-500" />
                    JD chi tiết
                  </h2>
                </div>
                <div className="px-6 py-5">
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(job.jd_clear) }}
                  />
                </div>
              </section>
            )}


            {/* Applied Candidates */}
            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users size={20} className="text-brand-500" />
                  Ứng viên đã apply
                  <span className="ml-2 px-2.5 py-0.5 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 text-sm rounded-full">
                    {appliedCandidates.length}
                  </span>
                </h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {candidatesLoading ? (
                  <div className="px-6 py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                  </div>
                ) : appliedCandidates.length > 0 ? (
                  <>
                    {currentCandidates.map((process) => (
                      <div
                        key={process.id}
                        className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium">
                              {process.candidates?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {process.candidates?.name || 'N/A'}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {process.candidates?.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                process.process_status
                              )}`}
                            >
                              {process.process_status.replace(/_/g, ' ')}
                            </span>
                            {process.candidates?.cv_link && (
                              <button
                                onClick={async () => {
                                  const cvLink = process.candidates?.cv_link;
                                  if (!cvLink) return;

                                  // Nếu là link cũ (http)
                                  if (cvLink.startsWith('http')) {
                                    window.open(cvLink, '_blank');
                                    return;
                                  }

                                  try {
                                    setSigningCvId(process.id);
                                    const { data, error } = await supabase.storage
                                      .from('cv')
                                      .createSignedUrl(cvLink, 3600);
                                    
                                    if (error) throw error;
                                    if (data?.signedUrl) {
                                      window.open(data.signedUrl, '_blank');
                                    }
                                  } catch (err) {
                                    console.error('Error signing CV URL:', err);
                                    toast.error('Không có quyền xem CV hoặc file không tồn tại');
                                  } finally {
                                    setSigningCvId(null);
                                  }
                                }}
                                disabled={signingCvId === process.id}
                                className="p-1.5 text-gray-400 hover:text-brand-500 transition-colors disabled:opacity-50"
                                title="Mở CV trong tab mới"
                              >
                                {signingCvId === process.id ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <ExternalLink size={16} />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                        {process.owner_details?.full_name && (
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <User size={12} />
                            Giới thiệu bởi: {process.owner_details.full_name}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="text-sm text-gray-600 dark:text-gray-400 hover:text-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Trước
                        </button>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Trang {currentPage} / {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="text-sm text-gray-600 dark:text-gray-400 hover:text-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Sau
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="px-6 py-12 text-center">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users size={24} className="text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                      Chưa có ứng viên nào apply cho công việc này.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Job Comments Section */}
            {id && <JobCommentSection jobId={id} />}
          </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Action Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <button
                  onClick={() => setIntroduceModalOpen(true)}
                  className="w-full py-2.5 bg-brand-500 text-white font-semibold rounded-lg hover:bg-brand-600 transition-colors shadow-sm mb-3"
                >
                  Giới thiệu ứng viên
                </button>
                <button
                  onClick={() => setMatchingModalOpen(true)}
                  className="w-full py-2.5 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors shadow-sm"
                >
                  Ứng viên phù hợp
                </button>
              </div>

              {/* Quick Info */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Thông tin nhanh
                  </h3>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0">
                      <DollarSign size={16} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Mức lương</p>
                      <p className="font-medium text-gray-900 dark:text-white mt-0.5">
                        {formatSalary(job)}
                      </p>
                    </div>
                  </div>

                  {job.work_location && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                        <MapPin size={16} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Địa điểm</p>
                        <p className="font-medium text-gray-900 dark:text-white mt-0.5">
                          {job.work_location}
                        </p>
                      </div>
                    </div>
                  )}

                  {job.td_job_category && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                        <Briefcase size={16} className="text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">TD Category</p>
                        <p className="font-medium text-gray-900 dark:text-white mt-0.5">
                          {job.td_job_category}
                        </p>
                      </div>
                    </div>
                  )}

                  {job.job_rank && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center shrink-0">
                        <Briefcase size={16} className="text-rose-600 dark:text-rose-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Job Rank</p>
                        <p className="font-medium text-gray-900 dark:text-white mt-0.5">
                          Rank {job.job_rank}
                        </p>
                      </div>
                    </div>
                  )}

                  {job.job_level && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center shrink-0">
                        <Users size={16} className="text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Job Level</p>
                        <p className="font-medium text-gray-900 dark:text-white mt-0.5">
                          {job.job_level}
                        </p>
                      </div>
                    </div>
                  )}

                  {job.interview_rounds && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center shrink-0">
                        <Clock size={16} className="text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Vòng phỏng vấn</p>
                        <p className="font-medium text-gray-900 dark:text-white mt-0.5">
                          {job.interview_rounds} vòng
                        </p>
                      </div>
                    </div>
                  )}

                  {job.working_hours && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                        <Clock size={16} className="text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Giờ làm việc</p>
                        <p className="font-medium text-gray-900 dark:text-white mt-0.5">
                          {job.working_hours}
                        </p>
                      </div>
                    </div>
                  )}

                  {job.warranty_period_days && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center shrink-0">
                        <Calendar size={16} className="text-pink-600 dark:text-pink-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Bảo hành</p>
                        <p className="font-medium text-gray-900 dark:text-white mt-0.5">
                          {job.warranty_period_days} ngày
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Fee Info */}
              {(job.freelance_fee || job.headhunt_fee) && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Phí dịch vụ
                    </h3>
                  </div>
                  <div className="p-5 space-y-3">
                    {job.freelance_fee && (
                      <div className="flex justify-between items-center bg-green-50 dark:bg-green-900/10 p-3 rounded-lg border border-green-100 dark:border-green-900/30">
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">
                          Freelancer Fee
                        </span>
                        <span className="font-bold text-green-700 dark:text-green-400">
                          {job.freelance_fee}
                        </span>
                      </div>
                    )}
                    {job.headhunt_fee && (
                      <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                          Headhunt Fee
                        </span>
                        <span className="font-bold text-blue-700 dark:text-blue-400">
                          {job.headhunt_fee}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Internal Data - CHỈ internal staff được xem */}
              {internalData && (internalData.original_jd_url || internalData.internal_notes) && (
                <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl border-2 border-amber-200 dark:border-amber-800 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-amber-200 dark:border-amber-800 bg-amber-100 dark:bg-amber-900/20">
                    <h3 className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                      <FileText size={18} className="text-amber-600 dark:text-amber-400" />
                      Thông tin nội bộ
                    </h3>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                      Chỉ internal staff được xem
                    </p>
                  </div>
                  <div className="p-5 space-y-4">
                    {internalData.original_jd_url && (
                      <div>
                        <p className="text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wide font-medium mb-2">
                          Link JD gốc từ client
                        </p>
                        <a
                          href={internalData.original_jd_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 underline break-all"
                        >
                          <ExternalLink size={14} />
                          {internalData.original_jd_url}
                        </a>
                      </div>
                    )}
                    {internalData.internal_notes && (
                      <div>
                        <p className="text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wide font-medium mb-2">
                          Ghi chú nội bộ
                        </p>
                        <div className="text-sm text-amber-900 dark:text-amber-200 whitespace-pre-wrap bg-white dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                          {internalData.internal_notes}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Lịch sử</h3>
                <div className="relative pl-3 space-y-6">
                  
                  {/* Created At Item */}
                  <div className="flex items-start gap-4 relative">
                    <div className="relative z-10 w-2.5 h-2.5 rounded-full bg-gray-400 dark:bg-gray-600 ring-4 ring-white dark:ring-gray-800 shrink-0 mt-1.5 ml-px"></div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Ngày tạo</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatDate(job.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Updated At Item */}
                  <div className="flex items-start gap-4 relative">
                     <div className="relative z-10 w-2.5 h-2.5 rounded-full bg-brand-500 dark:bg-brand-400 ring-4 ring-white dark:ring-gray-800 shrink-0 mt-1.5 ml-px"></div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Cập nhật lần cuối</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatDate(job.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

      {/* Modals */}
      <IntroduceCandidateModal
        job={job}
        open={introduceModalOpen}
        onClose={() => setIntroduceModalOpen(false)}
        onSuccess={() => {
          setTimeout(() => window.location.reload(), 1500);
        }}
      />

      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Xóa công việc"
        message={`Bạn có chắc chắn muốn xóa "${job.position_title}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        variant="danger"
        isLoading={isDeleting}
      />



      <MatchingCandidatesModal
        job={job}
        open={matchingModalOpen}
        onClose={() => setMatchingModalOpen(false)}
      />
    </div>
  );
};

export default JobDetailPage;
