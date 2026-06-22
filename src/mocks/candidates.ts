export const MOCK_CANDIDATES = [
  {
    id: "candidate-1",
    cdd_code: "CDD-0001",
    name: "Nguyễn Văn An",
    full_name: "Nguyễn Văn An",
    email: "nguyen.van.an@example.com",
    phone: "0901234567",
    status: "Active",
    current_title: "Senior Frontend Engineer",
    applied_position: "Senior Frontend Engineer",
    experience_years: 5,
    address: "Hanoi",
    created_at: new Date().toISOString(),
    owner_id: "mock-user-123", // My candidate
    cv_link: "https://example.com/cv1.pdf",
    is_potential: true
  },
  {
    id: "candidate-2",
    cdd_code: "CDD-0002",
    name: "Trần Thị Bích",
    full_name: "Trần Thị Bích",
    email: "tran.thi.bich@example.com",
    phone: "0912345678",
    status: "Interviewing",
    current_title: "Product Manager",
    applied_position: "Product Manager",
    experience_years: 3,
    address: "Ho Chi Minh City",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    owner_id: "mock-user-123", // My candidate
    cv_link: "https://example.com/cv2.pdf"
  },
  {
    id: "candidate-3",
    cdd_code: "CDD-0003",
    name: "Lê Văn Cường",
    full_name: "Lê Văn Cường",
    email: "le.van.cuong@example.com",
    phone: "0923456789",
    status: "Offered",
    current_title: "Backend Developer",
    applied_position: "Backend Developer",
    experience_years: 7,
    address: "Da Nang",
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    owner_id: "other-user", // Database candidate
    is_potential: true
  },
  {
    id: "candidate-4",
    cdd_code: "CDD-0004",
    name: "Phạm Hoàng Sơn",
    full_name: "Phạm Hoàng Sơn",
    email: "pham.hoang.son@example.com",
    phone: "0934567890",
    status: "Active",
    current_title: "DevOps Engineer",
    applied_position: "DevOps Engineer",
    experience_years: 4,
    address: "Hanoi",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    owner_id: "other-user", // Database candidate
  },
  {
    id: "candidate-5",
    cdd_code: "CDD-0005",
    name: "Đặng Mai Phương",
    full_name: "Đặng Mai Phương",
    email: "dang.mai.phuong@example.com",
    phone: "0945678901",
    status: "Applied",
    current_title: "UX/UI Designer",
    applied_position: "Senior UX Designer",
    experience_years: 6,
    address: "Hai Phong",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    owner_id: "mock-user-123", // My candidate
    is_potential: true,
    cv_link: "https://example.com/cv5.pdf"
  }
];
