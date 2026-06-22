// Status Colors
export const STATUS_CONFIG: Record<string, { displayName: string; color: string }> = {
  New: { displayName: 'New', color: 'bg-blue-100 text-blue-800' },
  Screening: { displayName: 'Screening', color: 'bg-indigo-100 text-indigo-800' },
  Interview: { displayName: 'Interview', color: 'bg-purple-100 text-purple-800' },
  Offer: { displayName: 'Offer', color: 'bg-green-100 text-green-800' },
  Hired: { displayName: 'Hired', color: 'bg-emerald-100 text-emerald-800' },
  Rejected: { displayName: 'Rejected', color: 'bg-red-100 text-red-800' },
  'On Hold': { displayName: 'On Hold', color: 'bg-gray-100 text-gray-800' },
};

// Candidate Ranks
export const CANDIDATE_RANKS = [
  { value: 'A', label: 'A - Excellent' },
  { value: 'B', label: 'B - Good' },
  { value: 'C', label: 'C - Average' },
  { value: 'D', label: 'D - Needs improvement' },
] as const;

// Visa Status Options
export const VISA_OPTIONS = [
  { value: 'Citizen', label: 'Citizen' },
  { value: 'PR', label: 'Permanent Resident (PR)' },
  { value: 'EP', label: 'Employment Pass (EP)' },
  { value: 'SP', label: 'S Pass (SP)' },
  { value: 'WP', label: 'Work Permit (WP)' },
  { value: 'DP', label: 'Dependant Pass (DP)' },
  { value: 'LTVP', label: 'Long Term Visit Pass (LTVP)' },
  { value: 'Student', label: 'Student Pass' },
  { value: 'Other', label: 'Other' },
] as const;

// Employment Types
export const EMPLOYMENT_TYPES = [
  { value: 'Full-time', label: 'Full-time' },
  { value: 'Part-time', label: 'Part-time' },
  { value: 'Contract', label: 'Contract' },
  { value: 'Freelance', label: 'Freelance' },
  { value: 'Internship', label: 'Internship' },
] as const;

// Gender Options
export const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
] as const;

// English Levels
export const ENGLISH_LEVELS = [
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Elementary', label: 'Elementary' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Upper-Intermediate', label: 'Upper-Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
  { value: 'Fluent', label: 'Fluent' },
  { value: 'Native', label: 'Native' },
] as const;

// Candidate Phases
export const CANDIDATE_PHASE_OPTIONS = [
  { value: 'New_Lead', label: 'New Lead' },
  { value: 'Contacted', label: 'Contacted' },
  { value: 'Screening', label: 'Screening' },
  { value: 'Qualified', label: 'Qualified' },
  { value: 'Submitted_To_Client', label: 'Submitted to Client' },
  { value: 'Interview_Process', label: 'Interview Process' },
  { value: 'Offer_Stage', label: 'Offer Stage' },
  { value: 'Placed', label: 'Placed' },
  { value: 'Archived_Not_Suitable', label: 'Archived - Not Suitable' },
  { value: 'Archived_Not_Interested', label: 'Archived - Not Interested' },
] as const;

// Potential Options
export const POTENTIAL_OPTIONS = [
  { value: 'no', label: 'No' },
  { value: 'yes', label: 'Yes (Hot Profile)' },
] as const;
