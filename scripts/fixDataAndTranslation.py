import os

supabase_path = r"d:\apex_internal\demoApex\src\lib\supabase.ts"
with open(supabase_path, "r", encoding="utf-8") as f:
    sb_content = f.read()

# Replace the chainableMock definition with a better one

new_code = """
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
  rpc: (funcName: string, params?: any) => {
"""

# Now we need to extract the current rpc implementations from the file and keep them, except for the first part of chainableMock

# We can find `rpc: (funcName: string, params?: any) => {` in sb_content
start_rpc = sb_content.find("  rpc: (funcName: string")
end_rpc = sb_content.find("channel: (_name: string)", start_rpc)

if start_rpc != -1 and end_rpc != -1:
    rpc_content = sb_content[start_rpc + 39 : end_rpc]
    final_content = new_code + rpc_content + """  channel: (_name: string) => createTableMock('channel'),
  removeChannel: () => {},
};
"""
    with open(supabase_path, "w", encoding="utf-8") as f:
        f.write(final_content)
else:
    print("Error parsing supabase.ts")

# 2. Translate AuditLogPage.tsx
audit_log_path = r"d:\apex_internal\demoApex\src\features\admin\pages\AuditLogPage.tsx"
if os.path.exists(audit_log_path):
    with open(audit_log_path, "r", encoding="utf-8") as f:
        audit_content = f.read()

    audit_replacements = {
        "Tất cả hành động": "All actions",
        "Tạo mới (Insert)": "Create (Insert)",
        "Cập nhật (Update)": "Update",
        "Xóa (Delete)": "Delete",
        "Truy cập bị từ chối": "Access Denied",
        "Bạn không có quyền xem nhật ký hệ thống.": "You do not have permission to view system logs.",
        "Ghi lại các hoạt động quan trọng trong hệ thống": "Record important system activities",
        "Làm mới": "Refresh",
        "Lọc theo Người thực hiện...": "Filter by Performer...",
        "Có lỗi xảy ra khi tải nhật ký. Vui lòng thử lại.": "An error occurred while loading logs. Please try again.",
        "Thời gian": "Time",
        "Hành động": "Action",
        "Người thực hiện": "Performer",
        "Đối tượng": "Target",
        "Chi tiết": "Details",
        "Không có nhật ký nào được ghi nhận": "No logs recorded",
        "của": "of",
        "Xem chi tiết": "View Details",
        "Đang tải dữ liệu...": "Loading data...",
        "Xem thêm cũ hơn": "Load more"
    }

    for k, v in audit_replacements.items():
        audit_content = audit_content.replace(k, v)
        
    with open(audit_log_path, "w", encoding="utf-8") as f:
        f.write(audit_content)
