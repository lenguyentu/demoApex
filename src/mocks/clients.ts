export const MOCK_CLIENTS = [
  {
    id: "client-1",
    client_name: "TechNova Solutions",
    industry: "IT/Software",
    status: "Active",
    created_at: new Date().toISOString(),
    website: "https://technova-solutions.com",
    contact_email: "hr@technova-solutions.com",
    phone: "028 3812 3456",
    address: "Tòa nhà Bitexco, Quận 1, TP. Hồ Chí Minh",
    tax_code: "0312345678",
    description: "Công ty phát triển phần mềm và cung cấp giải pháp chuyển đổi số hàng đầu Châu Á."
  },
  {
    id: "client-2",
    client_name: "FinTech Asia",
    industry: "Fintech",
    status: "Active",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    website: "https://fintech-asia.com",
    contact_email: "recruitment@fintech-asia.com",
    phone: "024 3721 9999",
    address: "Keangnam Landmark 72, Nam Từ Liêm, Hà Nội",
    tax_code: "0109876543",
    description: "Startup tỷ đô (Unicorn) cung cấp các giải pháp thanh toán điện tử và tín dụng vi mô."
  },
  {
    id: "client-3",
    client_name: "Global E-commerce Corp",
    industry: "E-commerce",
    status: "Active",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    website: "https://global-ecommerce.com",
    contact_email: "talent@global-ecommerce.com",
    phone: "0236 3888 888",
    address: "Khu CNTT Tập Trung, Hải Châu, Đà Nẵng",
    tax_code: "0401122334",
    description: "Tập đoàn thương mại điện tử đa quốc gia có trụ sở tại Singapore."
  },
  {
    id: "client-4",
    client_name: "NextGen Logistics",
    industry: "Logistics / Supply Chain",
    status: "Active",
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    website: "https://nextgen-logistics.vn",
    contact_email: "hr.manager@nextgen-logistics.vn",
    phone: "028 3999 7777",
    address: "Khu Công Nghiệp Cát Lái, Quận 2, TP. Hồ Chí Minh",
    tax_code: "0319988776",
    description: "Công ty cung cấp giải pháp vận tải và chuỗi cung ứng thông minh bằng công nghệ AI."
  }
];
