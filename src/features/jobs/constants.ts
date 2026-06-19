// Job Phase Colors - based on job_phase_enum (giống process style)
export const JOB_PHASE_CONFIG: Record<string, { 
  displayName: string; 
  columnBg: string;  // màu nền nhạt
  border: string;    // màu border đậm hơn
  text: string;      // màu chữ đậm nhất
  color: string;     // màu chính (hex hoặc tailwind color)
}> = {
  Open: { 
    displayName: 'Open', 
    columnBg: 'bg-green-50/80', 
    border: 'border-green-200', 
    text: 'text-green-700',
    color: '#16a34a' // green-600
  },
  'Filled by TDC': { 
    displayName: 'Filled by TDC', 
    columnBg: 'bg-blue-50/80', 
    border: 'border-blue-200', 
    text: 'text-blue-700',
    color: '#2563eb' // blue-600
  },
  Cancelled: { 
    displayName: 'Cancelled', 
    columnBg: 'bg-red-50/80', 
    border: 'border-red-200', 
    text: 'text-red-700',
    color: '#dc2626' // red-600
  },
  Closed: { 
    displayName: 'Closed', 
    columnBg: 'bg-gray-50/80', 
    border: 'border-gray-200', 
    text: 'text-gray-700',
    color: '#4b5563' // gray-600
  },
  On_Hold: { 
    displayName: 'On Hold', 
    columnBg: 'bg-amber-50/80', 
    border: 'border-amber-200', 
    text: 'text-amber-700',
    color: '#d97706' // amber-600
  },
};

// Job Phase Options for select/dropdown
export const JOB_PHASE_OPTIONS = [
  { value: 'Open', label: 'Open' },
  { value: 'Filled by TDC', label: 'Filled by TDC' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Closed', label: 'Closed' },
  { value: 'On_Hold', label: 'On Hold' },
] as const;

// Assignment Type Options - job_assignment_type_enum
export const ASSIGNMENT_TYPE_OPTIONS = [
  { value: 'Headhunt', label: 'Headhunt' },
  { value: 'CTV', label: 'CTV' },
  { value: 'Freelancer', label: 'Freelancer' },
] as const;

// TD Job Category Options (from constraint check)
export const TD_JOB_CATEGORY_OPTIONS = [
  { value: 'IT', label: 'IT' },
  { value: 'Non-IT', label: 'Non-IT' },
  { value: 'Ecommerce', label: 'Ecommerce' },
  { value: 'App/Games', label: 'App/Games' },
] as const;

// English Level Options - english_level_enum
export const ENGLISH_LEVEL_OPTIONS = [
  { value: 'Native', label: 'Bản ngữ' },
  { value: 'Fluent', label: 'Thông thạo' },
  { value: 'Business', label: 'Business' },
  { value: 'Conversational', label: 'Giao tiếp' },
  { value: 'Basic', label: 'Cơ bản' },
  { value: 'None', label: 'Không' },
] as const;

// Job Rank Options - job_rank_enum
export const JOB_RANK_OPTIONS = [
  { value: 'S', label: 'S - VIP (Bill to, process nhanh, HR support)' },
  { value: 'A', label: 'A - Đã kí HĐ, bill thành công, 1 vòng' },
  { value: 'B', label: 'B - Đã kí HĐ, bill thành công, nhiều vòng' },
  { value: 'C', label: 'C - Mới kí HĐ (<1 tháng), chưa có case' },
  { value: 'D', label: 'D - Kí HĐ lâu (>1 tháng), chưa bill' },
  { value: 'F', label: 'F - Chưa kí HĐ, đang chờ CV demo' },
] as const;

// Job Level Options - job_level_enum
export const JOB_LEVEL_OPTIONS = [
  { value: 'Intern', label: 'Intern' },
  { value: 'Fresher', label: 'Fresher' },
  { value: 'Junior', label: 'Junior' },
  { value: 'Middle', label: 'Middle' },
  { value: 'Senior', label: 'Senior' },
  { value: 'Lead', label: 'Lead' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Director', label: 'Director' },
  { value: 'C-Level', label: 'C-Level' },
] as const;

// Vietnam Provinces/Cities - 63 tỉnh thành
export const VIETNAM_PROVINCES = [
  // Thành phố trực thuộc TW (Popular first)
  { value: 'Hồ Chí Minh', label: 'TP. Hồ Chí Minh' },
  { value: 'Hà Nội', label: 'TP. Hà Nội' },
  { value: 'Đà Nẵng', label: 'TP. Đà Nẵng' },
  { value: 'Hải Phòng', label: 'TP. Hải Phòng' },
  { value: 'Cần Thơ', label: 'TP. Cần Thơ' },
  // Miền Bắc
  { value: 'An Giang', label: 'An Giang' },
  { value: 'Bà Rịa - Vũng Tàu', label: 'Bà Rịa - Vũng Tàu' },
  { value: 'Bắc Giang', label: 'Bắc Giang' },
  { value: 'Bắc Kạn', label: 'Bắc Kạn' },
  { value: 'Bạc Liêu', label: 'Bạc Liêu' },
  { value: 'Bắc Ninh', label: 'Bắc Ninh' },
  { value: 'Bến Tre', label: 'Bến Tre' },
  { value: 'Bình Định', label: 'Bình Định' },
  { value: 'Bình Dương', label: 'Bình Dương' },
  { value: 'Bình Phước', label: 'Bình Phước' },
  { value: 'Bình Thuận', label: 'Bình Thuận' },
  { value: 'Cà Mau', label: 'Cà Mau' },
  { value: 'Cao Bằng', label: 'Cao Bằng' },
  { value: 'Đắk Lắk', label: 'Đắk Lắk' },
  { value: 'Đắk Nông', label: 'Đắk Nông' },
  { value: 'Điện Biên', label: 'Điện Biên' },
  { value: 'Đồng Nai', label: 'Đồng Nai' },
  { value: 'Đồng Tháp', label: 'Đồng Tháp' },
  { value: 'Gia Lai', label: 'Gia Lai' },
  { value: 'Hà Giang', label: 'Hà Giang' },
  { value: 'Hà Nam', label: 'Hà Nam' },
  { value: 'Hà Tĩnh', label: 'Hà Tĩnh' },
  { value: 'Hải Dương', label: 'Hải Dương' },
  { value: 'Hậu Giang', label: 'Hậu Giang' },
  { value: 'Hòa Bình', label: 'Hòa Bình' },
  { value: 'Hưng Yên', label: 'Hưng Yên' },
  { value: 'Khánh Hòa', label: 'Khánh Hòa' },
  { value: 'Kiên Giang', label: 'Kiên Giang' },
  { value: 'Kon Tum', label: 'Kon Tum' },
  { value: 'Lai Châu', label: 'Lai Châu' },
  { value: 'Lâm Đồng', label: 'Lâm Đồng' },
  { value: 'Lạng Sơn', label: 'Lạng Sơn' },
  { value: 'Lào Cai', label: 'Lào Cai' },
  { value: 'Long An', label: 'Long An' },
  { value: 'Nam Định', label: 'Nam Định' },
  { value: 'Nghệ An', label: 'Nghệ An' },
  { value: 'Ninh Bình', label: 'Ninh Bình' },
  { value: 'Ninh Thuận', label: 'Ninh Thuận' },
  { value: 'Phú Thọ', label: 'Phú Thọ' },
  { value: 'Phú Yên', label: 'Phú Yên' },
  { value: 'Quảng Bình', label: 'Quảng Bình' },
  { value: 'Quảng Nam', label: 'Quảng Nam' },
  { value: 'Quảng Ngãi', label: 'Quảng Ngãi' },
  { value: 'Quảng Ninh', label: 'Quảng Ninh' },
  { value: 'Quảng Trị', label: 'Quảng Trị' },
  { value: 'Sóc Trăng', label: 'Sóc Trăng' },
  { value: 'Sơn La', label: 'Sơn La' },
  { value: 'Tây Ninh', label: 'Tây Ninh' },
  { value: 'Thái Bình', label: 'Thái Bình' },
  { value: 'Thái Nguyên', label: 'Thái Nguyên' },
  { value: 'Thanh Hóa', label: 'Thanh Hóa' },
  { value: 'Thừa Thiên Huế', label: 'Thừa Thiên Huế' },
  { value: 'Tiền Giang', label: 'Tiền Giang' },
  { value: 'Trà Vinh', label: 'Trà Vinh' },
  { value: 'Tuyên Quang', label: 'Tuyên Quang' },
  { value: 'Vĩnh Long', label: 'Vĩnh Long' },
  { value: 'Vĩnh Phúc', label: 'Vĩnh Phúc' },
  { value: 'Yên Bái', label: 'Yên Bái' },
  // Remote/Khác
  { value: 'Remote', label: 'Remote (Làm việc từ xa)' },
  { value: 'Hybrid', label: 'Hybrid (Kết hợp)' },
  { value: 'Khác', label: 'Khác' },
] as const;
