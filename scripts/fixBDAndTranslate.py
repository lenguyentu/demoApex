import os

# 1. Translate ManageDailyPlansPage.tsx
file_path = r"d:\apex_internal\demoApex\src\features\daily_plan\pages\ManageDailyPlansPage.tsx"
if os.path.exists(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    replacements = {
        "Quản lý Daily Plan": "Manage Daily Plans",
        "Theo dõi tình trạng nộp kế hoạch và cấp quyền ngoại lệ đi muộn.": "Track plan submission status and grant late submission exceptions.",
        "Làm mới dữ liệu": "Refresh data",
        "Kế hoạch Sáng (Tới 09:00)": "Morning Plan (By 09:00)",
        "Kế hoạch Chiều (Tới 13:20)": "Afternoon Plan (By 13:20)",
        "Quyền Ngoại Lệ (Đi muộn)": "Exception Privilege (Late)",
        "Đã nộp": "Submitted",
        "Chưa có": "Missing",
        "Đã cấp quyền": "Granted",
        "Mở khóa form": "Unlock form",
        "Đang tải dữ liệu...": "Loading data...",
        "Không có Headhunter nào": "No Headhunters found"
    }

    for k, v in replacements.items():
        content = content.replace(k, v)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

# 2. Translate Landing components
landing_dir = r"d:\apex_internal\demoApex\src\features\landing"
for root, _, files in os.walk(landing_dir):
    for f in files:
        if f.endswith('.tsx'):
            p = os.path.join(root, f)
            with open(p, "r", encoding="utf-8") as file:
                text = file.read()
            
            # Common Vietnamese terms in landing pages if any
            reps = {
                "Nhập domain (VD: landing1)": "Enter domain (e.g. landing1)",
                "Cập nhật trạng thái": "Update status",
                "Mở link gốc": "Open original link",
                "Không có CV nào trong hàng đợi": "No CVs in queue",
                "Lưu cấu hình": "Save config",
                "Xem trước": "Preview",
                "Đang tải...": "Loading...",
                "Thành công": "Success",
                "Lỗi": "Error"
            }
            changed = False
            for k, v in reps.items():
                if k in text:
                    text = text.replace(k, v)
                    changed = True
            if changed:
                with open(p, "w", encoding="utf-8") as file:
                    file.write(text)

# 3. Update src/lib/supabase.ts to mock BD data
supabase_path = r"d:\apex_internal\demoApex\src\lib\supabase.ts"
with open(supabase_path, "r", encoding="utf-8") as f:
    sb_content = f.read()

# We need to enhance chainableMock to return mock data for bd_processes
# and add rpc handlers for BD CRM

new_supabase_ts = """
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
  },
  {
    id: 'bd-3',
    company_name: 'Shopee Vietnam',
    bd_process_status: 'Signing',
    priority: 'Medium',
    owner_id: 'mock-user-123',
    domain: 'Retail & E-commerce',
    created_at: new Date().toISOString(),
    client_industry: 'E-commerce'
  },
  {
    id: 'bd-4',
    company_name: 'Vinamilk',
    bd_process_status: 'Follow up',
    priority: 'High',
    owner_id: 'other-user',
    domain: 'Manufacturing & Production',
    created_at: new Date().toISOString(),
    client_industry: 'FMCG'
  },
  {
    id: 'bd-5',
    company_name: 'FPT Software',
    bd_process_status: 'Consulting',
    priority: 'Low',
    owner_id: 'mock-user-123',
    domain: 'Information Technology (IT)',
    created_at: new Date().toISOString(),
    client_industry: 'IT'
  }
];

const chainableMock: any = new Proxy(
  function () {},
  {
    get: function (_target, prop) {
      if (prop === 'then') {
        // Return bd_processes if it was called on it
        // We will pass the state via a custom property or just return full mock list
        return (resolve: any) => resolve({ data: MOCK_BD_PROCESSES, count: MOCK_BD_PROCESSES.length, error: null });
      }
      return chainableMock;
    },
    apply: function (_target, _thisArg, _argumentsList) {
      return chainableMock;
    }
  }
);

export const supabase = {
  from: (_table: string) => chainableMock,
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
  rpc: (funcName: string, params?: any) => {
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
    return Promise.resolve({ data: [], error: null });
  },
  channel: (_name: string) => chainableMock,
  removeChannel: () => {},
};
"""

with open(supabase_path, "w", encoding="utf-8") as f:
    f.write(new_supabase_ts)

print("Done translations and mocked BD CRM.")
