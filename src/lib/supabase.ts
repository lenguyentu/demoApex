
const MOCK_BD_PROCESSES = [
  {
    id: 'bd-1',
    company_name: 'Techcombank',
    bd_process_status: 'Approach',
    priority: 'High',
    owner_id: 'mock-user-123',
    domain: 'Finance & Banking',
    created_at: new Date().toISOString(),
    client_industry: 'Finance'
  },
  {
    id: 'bd-2',
    company_name: 'VNG Corporation',
    bd_process_status: 'Meeting Clear JD',
    priority: 'Urgent',
    owner_id: 'mock-user-123',
    domain: 'Information Technology (IT)',
    created_at: new Date().toISOString(),
    client_industry: 'IT'
  }
];

const MOCK_AUDIT_LOGS = [
  {
    id: 'log-1',
    action: 'UPDATE',
    actor_user_id: 'user-1',
    target_user_id: 'user-2',
    target_table: 'candidates',
    details: {},
    created_at: new Date().toISOString(),
    actor_name: 'Admin User',
    actor_email: 'admin@apex.com',
    target_user_name: 'Alice Nguyen',
    target_user_email: 'alice@example.com',
    target_summary: 'Alice Nguyen'
  },
  {
    id: 'log-2',
    action: 'INSERT',
    actor_user_id: 'user-2',
    target_user_id: 'user-3',
    target_table: 'jobs',
    details: {},
    created_at: new Date(Date.now() - 3600000).toISOString(),
    actor_name: 'HR Manager',
    actor_email: 'hr@apex.com',
    target_user_name: 'Bob Tran',
    target_user_email: 'bob@example.com',
    target_summary: 'Senior Developer'
  }
];

const MOCK_JOB_FOCUS_WITH_DETAILS = [
  {
    job_id: 'job-1',
    job_title: 'Frontend Developer',
    client_name: 'Tech Corp',
    client_location: 'Hanoi',
    job_rank: 'A',
    pipeline_cv_sent: 5,
    pipeline_interview: 2,
    pipeline_offer: 1,
    pipeline_onboard: 0,
    assigned_to_names: 'Admin User',
    assigned_week: 'Week 1',
    days_since_created: 10,
    estimated_revenue: 1500,
    salary_range: '1000 - 2000 USD',
    salary_type: 'Gross',
    priority: 'High',
    assignee_id: 'mock-user-123',
    week_start: '2026-06-22',
    job_category: 'IT',
    warranty_period: 30,
    salary_min: 1000,
    salary_max: 2000,
    working_location: 'Hanoi',
    total_rounds: 3,
    posted_date: '2026-06-01'
  },
  {
    job_id: 'job-2',
    job_title: 'Backend Developer',
    client_name: 'VNG',
    client_location: 'HCMC',
    job_rank: 'B',
    pipeline_cv_sent: 2,
    pipeline_interview: 1,
    pipeline_offer: 0,
    pipeline_onboard: 0,
    assigned_to_names: 'Admin User',
    assigned_week: 'Week 1',
    days_since_created: 5,
    estimated_revenue: 2000,
    salary_range: '1500 - 2500 USD',
    salary_type: 'Net',
    priority: 'Urgent',
    assignee_id: 'mock-user-123',
    week_start: '2026-06-22',
    job_category: 'IT',
    warranty_period: 60,
    salary_min: 1500,
    salary_max: 2500,
    working_location: 'HCMC',
    total_rounds: 2,
    posted_date: '2026-06-15'
  }
];

function createTableMock(tableName: string) {
  let mockData: any[] = [];
  if (tableName === 'bd_processes') {
    mockData = MOCK_BD_PROCESSES;
  } else if (tableName === 'audit_logs') {
    mockData = MOCK_AUDIT_LOGS;
  } else if (tableName === 'job_focus_with_details') {
    mockData = MOCK_JOB_FOCUS_WITH_DETAILS;
  } else if (tableName === 'users') {
    mockData = [{ id: 'mock-user-123', full_name: 'Admin User' }];
  } else if (tableName === 'jobs') {
    mockData = [{ id: 'job-1', title: 'Frontend Developer' }];
  }

  const mockProxy: any = new Proxy(
    function () {},
    {
      get: function (_target, prop) {
        if (prop === 'then') {
          return (resolve: any) => resolve({ data: mockData, count: mockData.length, error: null });
        }
        return mockProxy;
      },
      apply: function (_target, _thisArg, _argumentsList) {
        return mockProxy;
      }
    }
  );
  return mockProxy;
}

export const supabase = {
  from: (table: string) => createTableMock(table),
  auth: {
    getSession: () => Promise.resolve({ data: { session: { user: { id: 'mock-user-123' } } }, error: null }),
    getUser: () => Promise.resolve({ data: { user: { id: 'mock-user-123' } }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  storage: {
    from: (_bucket: string) => ({
      upload: () => Promise.resolve({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: 'https://mock.url' } }),
      createSignedUrl: (_path: string, _expiresIn: number) => Promise.resolve({ data: { signedUrl: 'https://mock.url' }, error: null }),
    })
  },
  rpc: (funcName: string, _params?: any) => {
    if (funcName === 'get_bd_schedules') {
      return Promise.resolve({
        data: [
          {
            process_id: 'bd-1', client_id: 'client-1', client_name: 'Techcombank', owner_name: 'Admin User',
            bd_process_status: 'Approach', last_contact_date: '2026-06-20', reminder_type: 'Call',
            due_date: '2026-06-25', overdue_days: 0, priority: 'High', source: 'LinkedIn', client_industry: 'Finance', total_count: 5
          },
          {
            process_id: 'bd-2', client_id: 'client-2', client_name: 'VNG Corporation', owner_name: 'Admin User',
            bd_process_status: 'Meeting Clear JD', last_contact_date: '2026-06-18', reminder_type: 'Meeting',
            due_date: '2026-06-24', overdue_days: 1, priority: 'Urgent', source: 'Referral', client_industry: 'IT', total_count: 5
          },
          {
            process_id: 'bd-3', client_id: 'client-3', client_name: 'Shopee Vietnam', owner_name: 'Admin User',
            bd_process_status: 'Signing', last_contact_date: '2026-06-22', reminder_type: 'Email',
            due_date: '2026-06-26', overdue_days: 0, priority: 'Medium', source: 'Direct', client_industry: 'E-commerce', total_count: 5
          },
          {
            process_id: 'bd-4', client_id: 'client-4', client_name: 'Vinamilk', owner_name: 'Other User',
            bd_process_status: 'Follow up', last_contact_date: '2026-06-15', reminder_type: 'Follow-up',
            due_date: '2026-06-27', overdue_days: 0, priority: 'High', source: 'Facebook', client_industry: 'FMCG', total_count: 5
          },
          {
            process_id: 'bd-5', client_id: 'client-5', client_name: 'FPT Software', owner_name: 'Admin User',
            bd_process_status: 'Consulting', last_contact_date: '2026-06-10', reminder_type: 'Consulting',
            due_date: '2026-06-28', overdue_days: 0, priority: 'Low', source: 'Networking', client_industry: 'IT', total_count: 5
          }
        ],
        error: null
      });
    }
    if (funcName === 'get_bd_schedule_stats') {
      return Promise.resolve({
        data: [{ total_schedules: 5, overdue_count: 1, today_count: 1, upcoming_count: 3 }],
        error: null
      });
    }
    if (funcName === 'get_freelancer_performance') {
      return Promise.resolve({
        data: [
          {
            id: 'freelancer-1', name: 'Nguyễn Văn A (Mock)', email: 'nguyenvana@example.com', phone: '0901234567',
            cv_to_tdc: 120, cv_to_client: 90, interviews: 45, offers: 15, onboarding: 10, rejected: 30, conversion_rate: 8.3, total_count: 5
          }
        ],
        error: null
      });
    }
    if (funcName === 'get_top_jobs_by_cv_count') {
      return Promise.resolve({
        data: [
          { job_id: 'job-1', position_title: 'Frontend Developer', client_name: 'Tech Corp', cv_count: 50 }
        ],
        error: null
      });
    }
    if (funcName === 'get_hr_rank_by_ref_count') {
      return Promise.resolve({
        data: [
          { hr_id: 'hr-1', hr_name: 'HR Alice', hr_email: 'alice@hr.com', ref_count: 10 }
        ],
        error: null
      });
    }
    
    if (funcName === 'get_team_stats') {
      return Promise.resolve({
        data: [{
          cv_to_client_count: 42,
          cv_to_client_target: 50,
          interview_count: 15,
          interview_target: 20,
          offer_count: 5,
          offer_target: 5,
          onboard_count: 3,
          onboard_target: 5
        }],
        error: null
      });
    }
    if (funcName === 'get_team_members_performance') {
      return Promise.resolve({
        data: [
          {
            user_id: 'mem-1', full_name: 'Nguyen Van An', role: 'Headhunter',
            jobs_count: 5, cv_to_client_month: 12, interview_month: 4, offer_month: 1,
            kpi_month_percent: 85, status_label: 'Streak 3'
          },
          {
            user_id: 'mem-2', full_name: 'Tran Thi Binh', role: 'Senior Headhunter',
            jobs_count: 8, cv_to_client_month: 20, interview_month: 8, offer_month: 3,
            kpi_month_percent: 110, status_label: 'Top Performer'
          },
          {
            user_id: 'mem-3', full_name: 'Le Tuan Cuong', role: 'Headhunter',
            jobs_count: 3, cv_to_client_month: 5, interview_month: 1, offer_month: 0,
            kpi_month_percent: 45, status_label: 'Needs review'
          }
        ],
        error: null
      });
    }
    if (funcName === 'get_team_jobs_attention') {
      return Promise.resolve({
        data: [
          {
            job_id: 'job-1', job_title: 'Senior Frontend Engineer', client_name: 'Tech Corp', client_location: 'Hanoi',
            job_rank: 'A', pipeline_cv_sent: 5, pipeline_interview: 2, pipeline_offer: 1, pipeline_onboard: 0,
            assigned_to_names: 'Tran Thi Binh', assigned_week: 'Week 3', days_since_created: 10, estimated_revenue: 1500,
            latest_process_status: 'INTERVIEW', latest_process_updated_at: new Date(Date.now() - 5*86400000).toISOString()
          },
          {
            job_id: 'job-2', job_title: 'Product Marketing Manager', client_name: 'Retail Inc', client_location: 'HCMC',
            job_rank: 'B', pipeline_cv_sent: 0, pipeline_interview: 0, pipeline_offer: 0, pipeline_onboard: 0,
            assigned_to_names: null, assigned_week: null, days_since_created: 6, estimated_revenue: 1200,
            latest_process_status: null, latest_process_updated_at: null
          }
        ],
        error: null
      });
    }

    return Promise.resolve({ data: [], error: null });
  },
    channel: (_name: string) => createTableMock('channel'),
  removeChannel: () => {},
};
