import os

# 1. Translate TeamDashboardPage.tsx
file_path = r"d:\apex_internal\demoApex\src\features\manager\pages\TeamDashboardPage.tsx"
if os.path.exists(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    replacements = {
        "Report tháng team của tôi": "My Team's Monthly Report",
        "Report tháng": "Monthly Report",
        "Tất cả thành viên": "All members",
        "Xem team của:": "View team of:",
        "Team của": "Team of",
        "Toàn bộ team": "Entire team",
        "Tháng này": "This month",
        "Tháng trước": "Last month",
        "tháng trước": "months ago",
        "thành viên": "members",
        "Chưa có thành viên nào trong team": "No members in the team",
        "Không có job nào cần chú ý": "No jobs need attention",
        "Jobs cần chú ý": "Jobs to watch",
        "tháng này": "this month",
        "Giao cho": "Assigned to",
        "Chưa giao": "Unassigned",
        "Cần review": "Needs review",
        "Thành viên": "Member",
        "Trạng thái": "Status",
        "Ngày": "Days",
        "Giao": "Assign",
        "KPI Tháng": "Monthly KPI"
    }

    for k, v in replacements.items():
        content = content.replace(k, v)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

# 2. Add RPC mocks in supabase.ts
supabase_path = r"d:\apex_internal\demoApex\src\lib\supabase.ts"
if os.path.exists(supabase_path):
    with open(supabase_path, "r", encoding="utf-8") as f:
        sb_content = f.read()
    
    # We will inject the new mock RPC returns before the final Promise.resolve({ data: [], error: null });
    # Let's find: return Promise.resolve({ data: [], error: null });
    # and insert our mocks right above it.
    
    rpc_mock = """
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
"""
    
    if "get_team_stats" not in sb_content:
        # replace the last "return Promise.resolve({ data: [], error: null });"
        sb_content = sb_content.replace(
            "return Promise.resolve({ data: [], error: null });",
            rpc_mock + "\n    return Promise.resolve({ data: [], error: null });"
        )
        
        with open(supabase_path, "w", encoding="utf-8") as f:
            f.write(sb_content)

print("TeamDashboard translated and mock data injected.")
