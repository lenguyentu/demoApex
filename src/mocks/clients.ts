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
    address: "Bitexco Tower, District 1, Ho Chi Minh City",
    tax_code: "0312345678",
    description: "Leading software development and digital transformation solution provider in Asia."
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
    address: "Keangnam Landmark 72, Nam Tu Liem, Hanoi",
    tax_code: "0109876543",
    description: "Billion-dollar startup (Unicorn) providing electronic payment and microcredit solutions."
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
    address: "Central IT Park, Hai Chau, Da Nang",
    tax_code: "0401122334",
    description: "Multinational e-commerce corporation headquartered in Singapore."
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
    address: "Cat Lai Industrial Zone, District 2, Ho Chi Minh City",
    tax_code: "0319988776",
    description: "Company providing smart transportation and supply chain solutions using AI technology."
  }
];
