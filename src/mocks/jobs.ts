export const MOCK_JOBS = [
  {
    id: "job-1",
    job_id: "TD1029",
    position_title: "Senior Fullstack Engineer (React/Node.js)",
    number_of_employees: 2,
    clients: { id: "client-1", client_name: "TechNova Solutions" },
    interview_rounds: 3,
    min_monthly_salary: "$ 2500",
    max_monthly_salary: "4000",
    work_location: "District 1, Ho Chi Minh City",
    warranty_period_days: 60,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    is_urgent: true,
    status: "Open",
    job_summary: `
      <p>We are looking for a passionate <strong>Senior Fullstack Engineer</strong> to join our core product development team. You will play a crucial role in designing and building large-scale systems serving millions of users.</p>
      <p><strong>Key Responsibilities:</strong></p>
      <ul style="list-style-type: disc; padding-left: 20px; line-height: 1.6;">
        <li>Design, develop and maintain frontend features using <strong>React.js</strong> and backend using <strong>Node.js</strong>.</li>
        <li>Analyze system requirements, propose optimal and scalable software architecture solutions.</li>
        <li>Review code, guide and provide technical direction for Junior/Mid-level members in the team.</li>
        <li>Work closely with Product Manager and QA to ensure the best product quality before release.</li>
      </ul>
    `,
    requirements: `
      <p>To succeed in this position, you need to have:</p>
      <ul style="list-style-type: disc; padding-left: 20px; line-height: 1.6;">
        <li>At least <strong>4 years of experience</strong> working as a Fullstack Developer.</li>
        <li>Proficient in Javascript/Typescript, React.js, Node.js (Express/NestJS).</li>
        <li>Experience working with relational databases (PostgreSQL, MySQL) and NoSQL (MongoDB, Redis).</li>
        <li>Deep understanding of RESTful API, GraphQL and Microservices architecture.</li>
        <li>Experience deploying applications on Cloud platforms (AWS/GCP), using Docker/Kubernetes is a huge advantage.</li>
        <li>Excellent problem solving skills, good communication and teamwork abilities.</li>
      </ul>
    `,
    jd_clear: `
      <p><strong>Benefits Policy:</strong></p>
      <ul style="list-style-type: disc; padding-left: 20px; line-height: 1.6;">
        <li>Attractive salary from <strong>$2500 - $4000</strong>, negotiable based on ability.</li>
        <li>13th month salary + Quarterly project performance bonus (up to 2 months salary/year).</li>
        <li>Salary review twice a year based on ability and contribution.</li>
        <li>Comprehensive health insurance package (Bao Viet Healthcare) for employees and relatives.</li>
        <li>Provided with the latest Macbook Pro M2/M3 and external monitor for work.</li>
        <li>Flexible working environment (Hybrid working at home 2 days/week), no strict dress code required.</li>
        <li>Annual company trip at a 5-star resort, exciting monthly teambuilding activities.</li>
      </ul>
    `
  },
  {
    id: "job-2",
    job_id: "TD1030",
    position_title: "Product Marketing Manager",
    number_of_employees: 1,
    clients: { id: "client-2", client_name: "FinTech Asia" },
    interview_rounds: 2,
    min_monthly_salary: "40M",
    max_monthly_salary: "60M",
    work_location: "Cau Giay, Hanoi",
    warranty_period_days: 60,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    is_urgent: false,
    status: "Open",
    job_summary: `
      <p>FinTech Asia is looking for a talented <strong>Product Marketing Manager</strong> to lead the product launch strategy and brand positioning in the Southeast Asian market.</p>
      <p><strong>Detailed Description:</strong></p>
      <ul style="list-style-type: disc; padding-left: 20px; line-height: 1.6;">
        <li>Market research, competitor analysis to identify the product's unique selling proposition (USP).</li>
        <li>Plan and execute the GTM (Go-To-Market) strategy for new features and products.</li>
        <li>Build communication messages, sales materials (sales kit, pitch deck, case studies) in coordination with the Design and Content team.</li>
        <li>Work closely with the Product, Sales and Customer Success teams to ensure consistent product messaging across all touchpoints.</li>
      </ul>
    `,
    requirements: `
      <p><strong>Candidate Requirements:</strong></p>
      <ul style="list-style-type: disc; padding-left: 20px; line-height: 1.6;">
        <li>3-5 years of experience in Marketing, including at least 2 years doing Product Marketing for B2B/SaaS or FinTech companies.</li>
        <li>Excellent storytelling skills and data analysis thinking.</li>
        <li>Proficient in English (IELTS 6.5 or above), able to write and communicate fluently with international partners.</li>
        <li>Keen on the financial and technology markets, always updating new trends.</li>
        <li>Independent working mindset and ability to withstand high pressure in a fast-paced startup environment.</li>
      </ul>
    `,
    jd_clear: `
      <p><strong>Benefits for you:</strong></p>
      <ul style="list-style-type: disc; padding-left: 20px; line-height: 1.6;">
        <li>Competitive income from <strong>40,000,000 - 60,000,000 VND/month</strong> + Business bonus.</li>
        <li>Provided with an abundant budget to execute breakthrough marketing campaigns.</li>
        <li>Participate in professional advanced training courses sponsored by the company.</li>
        <li>Premium health insurance, annual periodic health check-ups.</li>
        <li>Flexible working hours, focusing on efficiency and results rather than timekeeping hours.</li>
      </ul>
    `
  },
  {
    id: "job-3",
    job_id: "TD1031",
    position_title: "Data Engineer (AWS/Snowflake)",
    number_of_employees: 3,
    clients: { id: "client-1", client_name: "Global E-commerce Corp" },
    interview_rounds: 3,
    min_monthly_salary: "$ 2000",
    max_monthly_salary: "3500",
    work_location: "Da Nang",
    warranty_period_days: 60,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    is_urgent: true,
    status: "Open",
    job_summary: `
      <p>Become a key member of the Data Engineer team at a leading e-commerce corporation, processing Terabytes of data every day.</p>
      <p><strong>Your job:</strong></p>
      <ul style="list-style-type: disc; padding-left: 20px; line-height: 1.6;">
        <li>Design, build and optimize Data Pipelines (ETL/ELT) using Python, Spark, and Airflow.</li>
        <li>Manage and develop a modern Data Warehouse on the <strong>Snowflake</strong> and <strong>AWS (S3, Redshift, Glue)</strong> platform.</li>
        <li>Collaborate with Data Scientists and Data Analysts to prepare data for Machine Learning models and reporting Dashboards.</li>
        <li>Ensure data security, integrity and quality throughout the system.</li>
      </ul>
    `,
    requirements: `
      <p><strong>You need to meet:</strong></p>
      <ul style="list-style-type: disc; padding-left: 20px; line-height: 1.6;">
        <li>Graduated from University with a degree in IT, Mathematics or related.</li>
        <li>Minimum 3 years of practical experience in the position of Data Engineer.</li>
        <li>Proficient in <strong>Python</strong> and <strong>Advanced SQL</strong> programming.</li>
        <li>In-depth experience with at least one Cloud ecosystem (preferably AWS) and workflow management tools (Airflow/Luigi).</li>
        <li>Practical experience with Snowflake or Databricks is a big plus.</li>
        <li>Good English communication skills to work directly with engineering teams in Europe and the US.</li>
      </ul>
    `,
    jd_clear: `
      <p><strong>Benefits upon joining:</strong></p>
      <ul style="list-style-type: disc; padding-left: 20px; line-height: 1.6;">
        <li>Salary from <strong>$2000 - $3500</strong> depending on ability evaluated through the test.</li>
        <li>Signing bonus (1 month salary) for candidates who accept the job this month.</li>
        <li>Relocation package of 20 million VND for candidates moving from other provinces to work in Da Nang.</li>
        <li>100% international environment, opportunities to exchange and learn with top data experts.</li>
        <li>Premium insurance for yourself and your family, 15 days of annual leave/year.</li>
      </ul>
    `
  },
  {
    id: "job-4",
    job_id: "TD1032",
    position_title: "Head of Talent Acquisition",
    number_of_employees: 1,
    clients: { id: "client-2", client_name: "NextGen Logistics" },
    interview_rounds: 4,
    min_monthly_salary: "60M",
    max_monthly_salary: "100M",
    work_location: "District 3, Ho Chi Minh City",
    warranty_period_days: 90,
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    is_urgent: false,
    status: "Open",
    job_summary: `
      <p>We need to find a strategic leader to shape the future of the HR team at NextGen Logistics, helping the company scale from 500 to 1000 employees in the coming year.</p>
      <p><strong>Main Tasks:</strong></p>
      <ul style="list-style-type: disc; padding-left: 20px; line-height: 1.6;">
        <li>Build and execute the overall Recruitment strategy, positioning a strong Employer Branding in the market.</li>
        <li>Manage, train and develop a high-performance TA team (about 10-15 people).</li>
        <li>Optimize the recruitment funnel, improve the application process to enhance Candidate Experience.</li>
        <li>Build a strong network with Universities, recruitment partners and professional communities.</li>
        <li>Report directly to the CHRO and advise the Board of Directors on long-term HR strategy.</li>
      </ul>
    `,
    requirements: `
      <p><strong>Job Requirements:</strong></p>
      <ul style="list-style-type: disc; padding-left: 20px; line-height: 1.6;">
        <li>At least 7 years of experience in Recruitment, including at least 3 years in a senior management position (TA Manager / Head of TA).</li>
        <li>Track record proving successful organization scale-up at large-scale companies or tech startups.</li>
        <li>Data-driven mindset, keen on using ATS systems and analyzing recruitment metrics.</li>
        <li>Excellent leadership, inspiring and change management skills.</li>
        <li>Fluent English, professional demeanor and persuasive communication.</li>
      </ul>
    `,
    jd_clear: `
      <p><strong>Super Attractive Benefits Package:</strong></p>
      <ul style="list-style-type: disc; padding-left: 20px; line-height: 1.6;">
        <li>Competitive income: Base salary <strong>60 - 100 million/month</strong> + KPIs bonus + Annual Employee Stock Ownership Plan (ESOP).</li>
        <li>Car allowance for commuting and business travel expenses.</li>
        <li>Participate in senior leadership training courses domestically and internationally.</li>
        <li>Flexible working hours, respecting personal space.</li>
        <li>Premium VIP healthcare policy exclusively for management level.</li>
      </ul>
    `
  }
];
