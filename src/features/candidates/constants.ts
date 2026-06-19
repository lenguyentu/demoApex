// Status Colors
export const STATUS_CONFIG: Record<string, { displayName: string; color: string }> = {
  New: { displayName: 'Mới', color: 'bg-blue-100 text-blue-800' },
  Screening: { displayName: 'Sàng lọc', color: 'bg-indigo-100 text-indigo-800' },
  Interview: { displayName: 'Phỏng vấn', color: 'bg-purple-100 text-purple-800' },
  Offer: { displayName: 'Đề nghị', color: 'bg-green-100 text-green-800' },
  Hired: { displayName: 'Đã tuyển', color: 'bg-emerald-100 text-emerald-800' },
  Rejected: { displayName: 'Từ chối', color: 'bg-red-100 text-red-800' },
  'On Hold': { displayName: 'Tạm hoãn', color: 'bg-gray-100 text-gray-800' },
};

// Candidate Ranks
export const CANDIDATE_RANKS = [
  { value: 'A', label: 'A - Xuất sắc' },
  { value: 'B', label: 'B - Tốt' },
  { value: 'C', label: 'C - Trung bình' },
  { value: 'D', label: 'D - Cần cải thiện' },
] as const;

// Visa Status Options
export const VISA_OPTIONS = [
  { value: 'Citizen', label: 'Công dân' },
  { value: 'PR', label: 'Thường trú nhân (PR)' },
  { value: 'EP', label: 'Employment Pass (EP)' },
  { value: 'SP', label: 'S Pass (SP)' },
  { value: 'WP', label: 'Work Permit (WP)' },
  { value: 'DP', label: 'Dependant Pass (DP)' },
  { value: 'LTVP', label: 'Long Term Visit Pass (LTVP)' },
  { value: 'Student', label: 'Student Pass' },
  { value: 'Other', label: 'Khác' },
] as const;

// Employment Types
export const EMPLOYMENT_TYPES = [
  { value: 'Full-time', label: 'Toàn thời gian' },
  { value: 'Part-time', label: 'Bán thời gian' },
  { value: 'Contract', label: 'Hợp đồng' },
  { value: 'Freelance', label: 'Tự do' },
  { value: 'Internship', label: 'Thực tập' },
] as const;

// Gender Options
export const GENDER_OPTIONS = [
  { value: 'Male', label: 'Nam' },
  { value: 'Female', label: 'Nữ' },
  { value: 'Other', label: 'Khác' },
] as const;

// English Levels
export const ENGLISH_LEVELS = [
  { value: 'Beginner', label: 'Sơ cấp' },
  { value: 'Elementary', label: 'Cơ bản' },
  { value: 'Intermediate', label: 'Trung cấp' },
  { value: 'Upper-Intermediate', label: 'Trung cấp cao' },
  { value: 'Advanced', label: 'Nâng cao' },
  { value: 'Fluent', label: 'Thông thạo' },
  { value: 'Native', label: 'Bản ngữ' },
] as const;

// Candidate Phases
export const CANDIDATE_PHASE_OPTIONS = [
  { value: 'New_Lead', label: 'Mới' },
  { value: 'Contacted', label: 'Đã liên hệ' },
  { value: 'Screening', label: 'Sàng lọc' },
  { value: 'Qualified', label: 'Đạt yêu cầu' },
  { value: 'Submitted_To_Client', label: 'Đã gửi cho khách hàng' },
  { value: 'Interview_Process', label: 'Quy trình phỏng vấn' },
  { value: 'Offer_Stage', label: 'Giai đoạn đề nghị (Offer)' },
  { value: 'Placed', label: 'Đã tuyển dụng (Placed)' },
  { value: 'Archived_Not_Suitable', label: 'Lưu trữ - Không phù hợp (Not Suitable)' },
  { value: 'Archived_Not_Interested', label: 'Lưu trữ - Không quan tâm (Not Interested)' },
] as const;

// Potential Options
export const POTENTIAL_OPTIONS = [
  { value: 'no', label: 'Không' },
  { value: 'yes', label: 'Có (Hot Profile)' },
] as const;
