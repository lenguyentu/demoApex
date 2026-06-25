import os

jobs_ts_path = r'd:\apex_internal\demoApex\src\mocks\jobs.ts'

new_jobs_ts = """export const MOCK_JOBS = [
  {
    id: "mock-job-1",
    job_id: "J001",
    position_title: "Senior Frontend Engineer",
    number_of_employees: 2,
    clients: { id: "client-1", client_name: "Tech Corp" },
    interview_rounds: 3,
    min_monthly_salary: "$2500",
    max_monthly_salary: "$4000",
    work_location: "Ho Chi Minh City",
    warranty_period_days: 60,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    is_urgent: true,
    status: "Open",
    phase: "Open",
    job_rank: "S",
    td_job_category: "IT",
    assignment_type: "Headhunter",
    job_summary: "<p>Looking for a Senior Frontend Engineer to build world-class products.</p>",
    requirements: "<p>Strong React skills required.</p>",
    jd_clear: "<p>Great benefits.</p>"
  },
  {
    id: "mock-job-2",
    job_id: "J002",
    position_title: "Product Manager",
    number_of_employees: 1,
    clients: { id: "client-2", client_name: "Product LLC" },
    interview_rounds: 2,
    min_monthly_salary: "$3000",
    max_monthly_salary: "$5000",
    work_location: "Hanoi",
    warranty_period_days: 60,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    is_urgent: false,
    status: "Open",
    phase: "Sourcing",
    job_rank: "A",
    td_job_category: "IT",
    assignment_type: "Headhunter",
    job_summary: "<p>Experienced PM for enterprise products.</p>",
    requirements: "<p>5+ years PM experience.</p>",
    jd_clear: "<p>Flexible hours.</p>"
  },
  {
    id: "mock-job-3",
    job_id: "J003",
    position_title: "Backend Developer (Go)",
    number_of_employees: 3,
    clients: { id: "client-3", client_name: "Fintech Solutions" },
    interview_rounds: 3,
    min_monthly_salary: "$2000",
    max_monthly_salary: "$3500",
    work_location: "Da Nang",
    warranty_period_days: 60,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    is_urgent: true,
    status: "Open",
    phase: "Interview",
    job_rank: "A",
    td_job_category: "IT",
    assignment_type: "Headhunter",
    job_summary: "<p>Go developer for high-performance fintech APIs.</p>",
    requirements: "<p>Golang, Postgres, Redis.</p>",
    jd_clear: "<p>Sign-on bonus available.</p>"
  },
  {
    id: "mock-job-4",
    job_id: "J004",
    position_title: "Data Engineer",
    number_of_employees: 1,
    clients: { id: "client-4", client_name: "BigData Inc" },
    interview_rounds: 2,
    min_monthly_salary: "$2500",
    max_monthly_salary: "$4500",
    work_location: "Ho Chi Minh City",
    warranty_period_days: 60,
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    is_urgent: false,
    status: "Open",
    phase: "Offer",
    job_rank: "B",
    td_job_category: "IT",
    assignment_type: "Headhunter",
    job_summary: "<p>Data Engineer for big data processing.</p>",
    requirements: "<p>Python, Snowflake, AWS.</p>",
    jd_clear: "<p>13th month salary.</p>"
  },
  {
    id: "mock-job-5",
    job_id: "J005",
    position_title: "UX/UI Designer",
    number_of_employees: 2,
    clients: { id: "client-5", client_name: "Creative Studio" },
    interview_rounds: 2,
    min_monthly_salary: "$1500",
    max_monthly_salary: "$2500",
    work_location: "Hanoi",
    warranty_period_days: 60,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    is_urgent: true,
    status: "Open",
    phase: "Sourcing",
    job_rank: "A",
    td_job_category: "Design",
    assignment_type: "Headhunter",
    job_summary: "<p>Creative UI/UX Designer.</p>",
    requirements: "<p>Figma, UI/UX best practices.</p>",
    jd_clear: "<p>Macbook Pro provided.</p>"
  }
];
"""
with open(jobs_ts_path, 'w', encoding='utf-8') as f:
    f.write(new_jobs_ts)

# Let's fix translations in CandidateDetailPage.tsx
cand_page_path = r'd:\apex_internal\demoApex\src\features\candidates\pages\CandidateDetailPage.tsx'
with open(cand_page_path, 'r', encoding='utf-8') as f:
    content = f.read()

translations = {
    'Giao Job': 'Assign Job',
    'Focus Job': 'Focus Job',
    'Tuần này': 'This week',
    'Tuần trước': 'Last week',
    'Bản thân': 'Self',
    'Bạn chưa có job focus tuần này': 'You have no job focus this week',
    'Chưa có job focus': 'No job focus',
    'Hiệu Suất': 'Performance',
    'Danh Sách Jobs': 'Job List',
    'Có cập nhật tuần này': 'Updated this week'
}
for k, v in translations.items():
    content = content.replace(k, v)

with open(cand_page_path, 'w', encoding='utf-8') as f:
    f.write(content)
