
import { 
  FileText, Ban, Clock, Loader2, AlertCircle, CheckCircle2, XCircle, UserPlus, Search 
} from 'lucide-react';
import type { ProcessStatus } from './types';

export const STATUS_CONFIG: Record<ProcessStatus, { 
  main: string;    
  columnBg: string; 
  border: string;   
  text: string;    
  icon: any;
  displayName: string;
}> = {
  'APPLIED': { 
    main: 'bg-blue-600', columnBg: 'bg-blue-50/80', border: 'border-blue-200', text: 'text-blue-700', icon: FileText, displayName: 'APPLIED'
  },
  'REVIEW_CV_BY_TDC': { 
    main: 'bg-amber-500', columnBg: 'bg-amber-50/80', border: 'border-amber-200', text: 'text-amber-700', icon: Search, displayName: 'REVIEW CV BY TDC'
  },
  'REJECT_BY_ADMIN': { 
    main: 'bg-red-600', columnBg: 'bg-red-50/80', border: 'border-red-200', text: 'text-red-700', icon: Ban, displayName: 'REJECT BY TDC'
  },
  'CV_SUBMITTED_TO_CLIENT': { 
    main: 'bg-blue-700', columnBg: 'bg-blue-50/80', border: 'border-blue-200', text: 'text-blue-700', icon: FileText, displayName: 'CV SUBMITTED TO CLIENT'
  },
  'INTERVIEW_SCHEDULED_1ST': { 
    main: 'bg-pink-600', columnBg: 'bg-pink-50/80', border: 'border-pink-200', text: 'text-pink-700', icon: Clock, displayName: 'INTERVIEW SCHEDULED 1ST'
  },
  'INTERVIEW_COMPLETED_1ST': { 
    main: 'bg-pink-600', columnBg: 'bg-pink-50/80', border: 'border-pink-200', text: 'text-pink-700', icon: Clock, displayName: 'INTERVIEW COMPLETED 1ST'
  },
  'INTERVIEW_SCHEDULED_2ND': { 
    main: 'bg-purple-600', columnBg: 'bg-purple-50/80', border: 'border-purple-200', text: 'text-purple-700', icon: Clock, displayName: 'INTERVIEW SCHEDULED 2ND'
  },
  'INTERVIEW_COMPLETED_2ND': { 
    main: 'bg-purple-600', columnBg: 'bg-purple-50/80', border: 'border-purple-200', text: 'text-purple-700', icon: Clock, displayName: 'INTERVIEW COMPLETED 2ND'
  },
  'INTERVIEW_SCHEDULED_FINAL': { 
    main: 'bg-yellow-500', columnBg: 'bg-yellow-50/80', border: 'border-yellow-200', text: 'text-yellow-700', icon: Clock, displayName: 'INTERVIEW SCHEDULED 3RD'
  },
  'INTERVIEW_COMPLETED_FINAL': { 
    main: 'bg-yellow-500', columnBg: 'bg-yellow-50/80', border: 'border-yellow-200', text: 'text-yellow-700', icon: Clock, displayName: 'INTERVIEW COMPLETED 3RD'
  },
  'INTERVIEW_SCHEDULED_4TH': { 
    main: 'bg-fuchsia-600', columnBg: 'bg-fuchsia-50/80', border: 'border-fuchsia-200', text: 'text-fuchsia-700', icon: Clock, displayName: 'INTERVIEW SCHEDULED 4TH'
  },
  'INTERVIEW_COMPLETED_4TH': { 
    main: 'bg-fuchsia-600', columnBg: 'bg-fuchsia-50/80', border: 'border-fuchsia-200', text: 'text-fuchsia-700', icon: Clock, displayName: 'INTERVIEW COMPLETED 4TH'
  },
  'TEST_ASSIGNED': { 
    main: 'bg-blue-600', columnBg: 'bg-blue-50/80', border: 'border-blue-200', text: 'text-blue-700', icon: Loader2, displayName: 'TEST ASSIGNED'
  },
  'TEST_COMPLETED': { 
    main: 'bg-blue-600', columnBg: 'bg-blue-50/80', border: 'border-blue-200', text: 'text-blue-700', icon: Loader2, displayName: 'TEST COMPLETED'
  },
  'REFERENCE_CHECK_IN_PROGRESS': { 
    main: 'bg-orange-600', columnBg: 'bg-orange-50/80', border: 'border-orange-200', text: 'text-orange-700', icon: AlertCircle, displayName: 'REFERENCE CHECK IN PROGRESS'
  },
  'REFERENCE_CHECK_COMPLETED': { 
    main: 'bg-orange-600', columnBg: 'bg-orange-50/80', border: 'border-orange-200', text: 'text-orange-700', icon: AlertCircle, displayName: 'REFERENCE CHECK COMPLETED'
  },
  'OFFER_EXTENDED': { 
    main: 'bg-emerald-500', columnBg: 'bg-emerald-50/80', border: 'border-emerald-200', text: 'text-emerald-700', icon: CheckCircle2, displayName: 'OFFER EXTENDED'
  },
  'OFFER_ACCEPTED_BY_CANDIDATE': { 
    main: 'bg-emerald-500', columnBg: 'bg-emerald-50/80', border: 'border-emerald-200', text: 'text-emerald-700', icon: CheckCircle2, displayName: 'OFFER ACCEPTED BY CANDIDATE'
  },
  'OFFER_DECLINED_BY_CANDIDATE': { 
    main: 'bg-red-600', columnBg: 'bg-red-50/80', border: 'border-red-200', text: 'text-red-700', icon: XCircle, displayName: 'OFFER DECLINED BY CANDIDATE'
  },
  'REJECTED_BY_CLIENT': { 
    main: 'bg-red-600', columnBg: 'bg-red-50/80', border: 'border-red-200', text: 'text-red-700', icon: XCircle, displayName: 'REJECTED BY CLIENT'
  },
  'CANDIDATE_WITHDREW': { 
    main: 'bg-red-500', columnBg: 'bg-red-50/80', border: 'border-red-200', text: 'text-red-700', icon: XCircle, displayName: 'CANDIDATE WITHDREW'
  },
  'PLACEMENT_CONFIRMED': { 
    main: 'bg-indigo-600', columnBg: 'bg-indigo-50/80', border: 'border-indigo-200', text: 'text-indigo-700', icon: UserPlus, displayName: 'PLACEMENT CONFIRMED'
  },
  'ONBOARDING': { 
    main: 'bg-indigo-600', columnBg: 'bg-indigo-50/80', border: 'border-indigo-200', text: 'text-indigo-700', icon: UserPlus, displayName: 'ONBOARDING'
  },
  'GUARANTEE_PERIOD': { 
    main: 'bg-indigo-600', columnBg: 'bg-indigo-50/80', border: 'border-indigo-200', text: 'text-indigo-700', icon: UserPlus, displayName: 'GUARANTEE PERIOD'
  },
  'FAILED_PROBATION': { 
    main: 'bg-red-800', columnBg: 'bg-red-50/80', border: 'border-red-300', text: 'text-red-900', icon: XCircle, displayName: 'FAILED PROBATION'
  },
  'PASSED_PROBATION': { 
    main: 'bg-green-800', columnBg: 'bg-green-50/80', border: 'border-green-300', text: 'text-green-900', icon: CheckCircle2, displayName: 'PASSED PROBATION'
  },
  'PROCESS_ON_HOLD': { 
    main: 'bg-amber-600', columnBg: 'bg-amber-50/80', border: 'border-amber-200', text: 'text-amber-700', icon: AlertCircle, displayName: 'PROCESS ON HOLD'
  },
  'PROCESS_CANCELLED': { 
    main: 'bg-red-500', columnBg: 'bg-red-50/80', border: 'border-red-200', text: 'text-red-700', icon: XCircle, displayName: 'PROCESS CANCELLED'
  },
  'PAYMENT_RECEIVED': {
    main: 'bg-green-600', columnBg: 'bg-green-50/80', border: 'border-green-200', text: 'text-green-700', icon: CheckCircle2, displayName: 'PAYMENT RECEIVED'
  }
};

export const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'Admin', label: 'Admin' },
  { value: 'BD', label: 'BD' },
  { value: 'Headhunter', label: 'Headhunter' },
  { value: 'HR', label: 'HR' },
  { value: 'CTV', label: 'CTV' },
  { value: 'Freelancer', label: 'Freelancer' },
];
