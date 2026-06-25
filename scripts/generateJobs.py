import json

jobs_data = [
    {
        "id": "job-1", "job_id": "TD1029", "position_title": "Senior Frontend Engineer", "number_of_employees": 2,
        "clients": {"id": "client-1", "client_name": "TechNova Solutions"},
        "interview_rounds": 3, "min_monthly_salary": "$2500", "max_monthly_salary": "$4000",
        "work_location": "Ho Chi Minh City", "warranty_period_days": 60, "is_urgent": True,
        "status": "Open", "phase": "Open", "job_rank": "S", "td_job_category": "IT", "assignment_type": "Headhunter",
        "job_summary": "<p>Looking for a Senior Frontend Engineer to build world-class enterprise SaaS products using React, Next.js, and TypeScript.</p>",
        "requirements": "<p>5+ years of frontend experience. Strong knowledge of React, Next.js, and modern CSS (Tailwind). Experience with micro-frontends is a plus.</p>",
        "jd_clear": "<p>Annual performance review, premium healthcare, flexible remote work policy.</p>"
    },
    {
        "id": "job-2", "job_id": "TD1030", "position_title": "Product Marketing Manager", "number_of_employees": 1,
        "clients": {"id": "client-2", "client_name": "FinTech Asia"},
        "interview_rounds": 2, "min_monthly_salary": "40M", "max_monthly_salary": "60M",
        "work_location": "Hanoi", "warranty_period_days": 60, "is_urgent": False,
        "status": "Open", "phase": "Sourcing", "job_rank": "A", "td_job_category": "Marketing", "assignment_type": "Headhunter",
        "job_summary": "<p>We need an experienced Product Marketing Manager to drive GTM strategy for our B2B financial products across Southeast Asia.</p>",
        "requirements": "<p>3+ years in B2B Product Marketing. Excellent English, analytical skills, and experience with marketing automation tools.</p>",
        "jd_clear": "<p>13th-month salary, KPI bonus, ESOP, premium healthcare.</p>"
    },
    {
        "id": "job-3", "job_id": "TD1031", "position_title": "Backend Developer (Go)", "number_of_employees": 3,
        "clients": {"id": "client-3", "client_name": "Global Payments"},
        "interview_rounds": 3, "min_monthly_salary": "$2000", "max_monthly_salary": "$3500",
        "work_location": "Da Nang", "warranty_period_days": 60, "is_urgent": True,
        "status": "Open", "phase": "Interview", "job_rank": "A", "td_job_category": "IT", "assignment_type": "Headhunter",
        "job_summary": "<p>Develop high-performance payment processing systems using Golang and gRPC.</p>",
        "requirements": "<p>3+ years backend experience, at least 1.5 years with Go. Solid understanding of Postgres, Redis, and distributed systems.</p>",
        "jd_clear": "<p>Sign-on bonus, 100% remote option, international environment.</p>"
    },
    {
        "id": "job-4", "job_id": "TD1032", "position_title": "Head of Talent Acquisition", "number_of_employees": 1,
        "clients": {"id": "client-4", "client_name": "NextGen Logistics"},
        "interview_rounds": 4, "min_monthly_salary": "60M", "max_monthly_salary": "100M",
        "work_location": "Ho Chi Minh City", "warranty_period_days": 90, "is_urgent": False,
        "status": "Open", "phase": "Offer", "job_rank": "S", "td_job_category": "HR", "assignment_type": "Headhunter",
        "job_summary": "<p>Lead the entire recruitment department and scale our workforce from 500 to 1200 employees within the next 2 years.</p>",
        "requirements": "<p>7+ years in TA, 3+ years in a leadership role. Proven track record of scaling tech/logistics startups.</p>",
        "jd_clear": "<p>Base salary + strong ESOP package, company car allowance.</p>"
    },
    {
        "id": "job-5", "job_id": "TD1033", "position_title": "Data Engineer (Snowflake)", "number_of_employees": 2,
        "clients": {"id": "client-5", "client_name": "BigData Inc"},
        "interview_rounds": 2, "min_monthly_salary": "$2500", "max_monthly_salary": "$4500",
        "work_location": "Hanoi", "warranty_period_days": 60, "is_urgent": True,
        "status": "Open", "phase": "Sourcing", "job_rank": "B", "td_job_category": "IT", "assignment_type": "CTV",
        "job_summary": "<p>Build data pipelines and warehouse solutions using Snowflake, AWS, and Airflow.</p>",
        "requirements": "<p>Strong Python, advanced SQL, experience with Snowflake and AWS ecosystem.</p>",
        "jd_clear": "<p>13th month salary, hybrid work, MacBook Pro M3 provided.</p>"
    },
    {
        "id": "job-6", "job_id": "TD1034", "position_title": "B2B Sales Executive", "number_of_employees": 5,
        "clients": {"id": "client-6", "client_name": "SaaS Platform Corp"},
        "interview_rounds": 2, "min_monthly_salary": "15M", "max_monthly_salary": "25M",
        "work_location": "Ho Chi Minh City", "warranty_period_days": 30, "is_urgent": True,
        "status": "Open", "phase": "Open", "job_rank": "C", "td_job_category": "Sales", "assignment_type": "Freelancer",
        "job_summary": "<p>Drive sales for our enterprise SaaS products to SME clients in Vietnam.</p>",
        "requirements": "<p>1-3 years of B2B sales experience. Strong communication and negotiation skills.</p>",
        "jd_clear": "<p>High commission rate (up to 15%), monthly allowances, structured training.</p>"
    },
    {
        "id": "job-7", "job_id": "TD1035", "position_title": "Chief Financial Officer (CFO)", "number_of_employees": 1,
        "clients": {"id": "client-7", "client_name": "Eco Retail Group"},
        "interview_rounds": 4, "min_monthly_salary": "$5000", "max_monthly_salary": "$8000",
        "work_location": "Hanoi", "warranty_period_days": 90, "is_urgent": False,
        "status": "Open", "phase": "Interview", "job_rank": "S", "td_job_category": "Finance", "assignment_type": "Headhunter",
        "job_summary": "<p>Oversee all financial operations, fundraising, and M&A activities for a rapidly growing retail chain.</p>",
        "requirements": "<p>10+ years in Finance, previous CFO or VP Finance experience required. CFA or CPA preferred.</p>",
        "jd_clear": "<p>Executive compensation package, performance bonus, ESOP.</p>"
    },
    {
        "id": "job-8", "job_id": "TD1036", "position_title": "Senior UX/UI Designer", "number_of_employees": 2,
        "clients": {"id": "client-8", "client_name": "Creative Studio"},
        "interview_rounds": 2, "min_monthly_salary": "30M", "max_monthly_salary": "50M",
        "work_location": "Da Nang", "warranty_period_days": 60, "is_urgent": False,
        "status": "Open", "phase": "Sourcing", "job_rank": "A", "td_job_category": "Design", "assignment_type": "Headhunter",
        "job_summary": "<p>Lead the design of complex web applications. Create wireframes, prototypes, and high-fidelity UI.</p>",
        "requirements": "<p>4+ years UX/UI design experience. Strong portfolio demonstrating SaaS product design. Expert in Figma.</p>",
        "jd_clear": "<p>Creative work environment, flexible hours, annual design workshops abroad.</p>"
    },
    {
        "id": "job-9", "job_id": "TD1037", "position_title": "Supply Chain Manager", "number_of_employees": 1,
        "clients": {"id": "client-9", "client_name": "Global FMCG"},
        "interview_rounds": 3, "min_monthly_salary": "50M", "max_monthly_salary": "75M",
        "work_location": "Binh Duong", "warranty_period_days": 60, "is_urgent": True,
        "status": "Open", "phase": "Open", "job_rank": "A", "td_job_category": "Logistics", "assignment_type": "Headhunter",
        "job_summary": "<p>Manage end-to-end supply chain operations, including procurement, warehousing, and distribution.</p>",
        "requirements": "<p>5+ years in supply chain management within FMCG. Strong SAP skills and vendor management.</p>",
        "jd_clear": "<p>Shuttle bus from HCMC, comprehensive insurance, yearly bonus (up to 3 months).</p>"
    },
    {
        "id": "job-10", "job_id": "TD1038", "position_title": "Mobile Developer (Flutter)", "number_of_employees": 4,
        "clients": {"id": "client-1", "client_name": "TechNova Solutions"},
        "interview_rounds": 2, "min_monthly_salary": "$1500", "max_monthly_salary": "$2500",
        "work_location": "Ho Chi Minh City", "warranty_period_days": 60, "is_urgent": True,
        "status": "Open", "phase": "Interview", "job_rank": "B", "td_job_category": "IT", "assignment_type": "CTV",
        "job_summary": "<p>Develop cross-platform mobile applications using Flutter for our e-commerce client.</p>",
        "requirements": "<p>2+ years with Flutter/Dart. Experience with REST APIs, state management (Provider/Riverpod).</p>",
        "jd_clear": "<p>Performance bonus, project bonus, friendly environment.</p>"
    },
    {
        "id": "job-11", "job_id": "TD1039", "position_title": "Content Creator / Copywriter", "number_of_employees": 2,
        "clients": {"id": "client-10", "client_name": "Media Buzz"},
        "interview_rounds": 2, "min_monthly_salary": "12M", "max_monthly_salary": "20M",
        "work_location": "Hanoi", "warranty_period_days": 30, "is_urgent": False,
        "status": "Open", "phase": "Offer", "job_rank": "C", "td_job_category": "Marketing", "assignment_type": "Freelancer",
        "job_summary": "<p>Create engaging content for social media, blogs, and marketing campaigns.</p>",
        "requirements": "<p>1-2 years copywriting experience. Creative mindset, good SEO knowledge.</p>",
        "jd_clear": "<p>Remote-friendly, unlimited snacks, creative freedom.</p>"
    },
    {
        "id": "job-12", "job_id": "TD1040", "position_title": "AI/ML Engineer", "number_of_employees": 2,
        "clients": {"id": "client-11", "client_name": "AI Robotics Ltd"},
        "interview_rounds": 3, "min_monthly_salary": "$3000", "max_monthly_salary": "$5000",
        "work_location": "Ho Chi Minh City", "warranty_period_days": 60, "is_urgent": False,
        "status": "Open", "phase": "Sourcing", "job_rank": "S", "td_job_category": "IT", "assignment_type": "Headhunter",
        "job_summary": "<p>Design and deploy machine learning models for computer vision and NLP applications.</p>",
        "requirements": "<p>Strong Python, PyTorch/TensorFlow. Experience deploying ML models to production (MLOps).</p>",
        "jd_clear": "<p>Stock options, cutting-edge projects, top-tier health insurance.</p>"
    },
    {
        "id": "job-13", "job_id": "TD1041", "position_title": "Legal Counsel", "number_of_employees": 1,
        "clients": {"id": "client-12", "client_name": "Real Estate Corp"},
        "interview_rounds": 3, "min_monthly_salary": "40M", "max_monthly_salary": "60M",
        "work_location": "Hanoi", "warranty_period_days": 60, "is_urgent": True,
        "status": "Open", "phase": "Open", "job_rank": "A", "td_job_category": "Legal", "assignment_type": "Headhunter",
        "job_summary": "<p>Review contracts, provide legal advice on M&A, and ensure corporate compliance.</p>",
        "requirements": "<p>5+ years of corporate law experience. Real estate industry knowledge is highly preferred.</p>",
        "jd_clear": "<p>Annual retreat, professional development allowance, 13th month salary.</p>"
    },
    {
        "id": "job-14", "job_id": "TD1042", "position_title": "Customer Success Manager", "number_of_employees": 3,
        "clients": {"id": "client-6", "client_name": "SaaS Platform Corp"},
        "interview_rounds": 2, "min_monthly_salary": "20M", "max_monthly_salary": "35M",
        "work_location": "Da Nang", "warranty_period_days": 30, "is_urgent": False,
        "status": "Open", "phase": "Sourcing", "job_rank": "B", "td_job_category": "Sales", "assignment_type": "Headhunter",
        "job_summary": "<p>Manage a portfolio of B2B clients, ensure adoption, and drive renewals/upsells.</p>",
        "requirements": "<p>3+ years in B2B Account Management or Customer Success. Excellent problem-solving skills.</p>",
        "jd_clear": "<p>Bonus based on retention rates, clear promotion path, flexible hours.</p>"
    },
    {
        "id": "job-15", "job_id": "TD1043", "position_title": "QA Automation Engineer", "number_of_employees": 4,
        "clients": {"id": "client-1", "client_name": "TechNova Solutions"},
        "interview_rounds": 2, "min_monthly_salary": "$1200", "max_monthly_salary": "$2000",
        "work_location": "Ho Chi Minh City", "warranty_period_days": 60, "is_urgent": False,
        "status": "Open", "phase": "Interview", "job_rank": "C", "td_job_category": "IT", "assignment_type": "CTV",
        "job_summary": "<p>Build and maintain automated test frameworks for web and mobile applications.</p>",
        "requirements": "<p>2+ years automation testing (Selenium, Cypress, or Appium). Experience with CI/CD.</p>",
        "jd_clear": "<p>13th month salary, hybrid working model, English class sponsorships.</p>"
    },
    {
        "id": "job-16", "job_id": "TD1044", "position_title": "Chief Marketing Officer (CMO)", "number_of_employees": 1,
        "clients": {"id": "client-7", "client_name": "Eco Retail Group"},
        "interview_rounds": 4, "min_monthly_salary": "$4000", "max_monthly_salary": "$7000",
        "work_location": "Ho Chi Minh City", "warranty_period_days": 90, "is_urgent": True,
        "status": "Open", "phase": "Offer", "job_rank": "S", "td_job_category": "Marketing", "assignment_type": "Headhunter",
        "job_summary": "<p>Lead the entire marketing division, driving brand strategy, digital marketing, and market expansion.</p>",
        "requirements": "<p>10+ years marketing experience, with 3+ at C-level or VP level in retail/FMCG.</p>",
        "jd_clear": "<p>High performance bonuses, ESOP, premium health care for family.</p>"
    },
    {
        "id": "job-17", "job_id": "TD1045", "position_title": "DevOps Architect", "number_of_employees": 1,
        "clients": {"id": "client-13", "client_name": "CloudServices Inc"},
        "interview_rounds": 3, "min_monthly_salary": "$3500", "max_monthly_salary": "$5500",
        "work_location": "Hanoi", "warranty_period_days": 60, "is_urgent": False,
        "status": "Open", "phase": "Open", "job_rank": "S", "td_job_category": "IT", "assignment_type": "Headhunter",
        "job_summary": "<p>Design scalable cloud infrastructure and secure CI/CD pipelines for enterprise clients.</p>",
        "requirements": "<p>6+ years in DevOps/Cloud. Expert in Kubernetes, AWS/GCP, Terraform. AWS Solutions Architect certified.</p>",
        "jd_clear": "<p>Sign-on bonus, completely remote, tech gadget allowance.</p>"
    },
    {
        "id": "job-18", "job_id": "TD1046", "position_title": "Production Manager", "number_of_employees": 1,
        "clients": {"id": "client-14", "client_name": "Viet Manufacturing"},
        "interview_rounds": 3, "min_monthly_salary": "40M", "max_monthly_salary": "60M",
        "work_location": "Dong Nai", "warranty_period_days": 60, "is_urgent": True,
        "status": "Open", "phase": "Interview", "job_rank": "A", "td_job_category": "Manufacturing", "assignment_type": "Headhunter",
        "job_summary": "<p>Manage daily production operations, optimize efficiency, and ensure quality standards.</p>",
        "requirements": "<p>5+ years as Production Manager in manufacturing. Six Sigma or Lean Manufacturing experience.</p>",
        "jd_clear": "<p>Company car, housing allowance, 14th month salary.</p>"
    },
    {
        "id": "job-19", "job_id": "TD1047", "position_title": "Business Analyst (BA)", "number_of_employees": 3,
        "clients": {"id": "client-2", "client_name": "FinTech Asia"},
        "interview_rounds": 2, "min_monthly_salary": "25M", "max_monthly_salary": "40M",
        "work_location": "Hanoi", "warranty_period_days": 30, "is_urgent": False,
        "status": "Open", "phase": "Sourcing", "job_rank": "B", "td_job_category": "IT", "assignment_type": "CTV",
        "job_summary": "<p>Gather requirements and write SRS documents for core banking software implementations.</p>",
        "requirements": "<p>3+ years as IT BA. Experience in Banking/Finance domains. Fluent English.</p>",
        "jd_clear": "<p>Agile training, premium healthcare, project bonuses.</p>"
    },
    {
        "id": "job-20", "job_id": "TD1048", "position_title": "Social Media Executive", "number_of_employees": 2,
        "clients": {"id": "client-10", "client_name": "Media Buzz"},
        "interview_rounds": 1, "min_monthly_salary": "10M", "max_monthly_salary": "15M",
        "work_location": "Ho Chi Minh City", "warranty_period_days": 30, "is_urgent": False,
        "status": "Open", "phase": "Offer", "job_rank": "C", "td_job_category": "Marketing", "assignment_type": "Freelancer",
        "job_summary": "<p>Manage daily posts on Facebook, TikTok, and Instagram for various brand campaigns.</p>",
        "requirements": "<p>1 year experience. Trend-savvy, basic video editing skills (CapCut).</p>",
        "jd_clear": "<p>Young environment, team building trips, commission on viral campaigns.</p>"
    }
]

import random
from datetime import datetime, timedelta

def random_date():
    days = random.randint(1, 30)
    return (datetime.now() - timedelta(days=days)).isoformat()

# Format as TS code
jobs_ts_content = "export const MOCK_JOBS = [\n"
for job in jobs_data:
    job['created_at'] = random_date()
    jobs_ts_content += "  " + json.dumps(job, ensure_ascii=False) + ",\n"
jobs_ts_content += "];\n"

with open(r"d:\apex_internal\demoApex\src\mocks\jobs.ts", "w", encoding="utf-8") as f:
    f.write(jobs_ts_content)
