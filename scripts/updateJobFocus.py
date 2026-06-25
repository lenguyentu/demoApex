import re
import os

path = r'd:\apex_internal\demoApex\src\features\manager\pages\JobFocusPage.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Mock data logic for useJobFocusWithDetails hook
mock_code_1 = """  let { data: jobFocusData = [], isLoading: loadingJobs, refetch } = useJobFocusWithDetails({
    assignee_id: selectedMemberId === SELF_ID ? (user?.id || undefined) : (selectedMemberId || undefined),
    week_start: weekStart,
  });

  if (import.meta.env.DEV && jobFocusData.length === 0 && !loadingJobs) {
    jobFocusData = [
      {
        id: 'mock-jf-1',
        job_id: 'mock-job-1',
        job_code: 'J001',
        position_title: 'Senior Frontend Engineer',
        phase: 'Open',
        phase_date: '2026-06-20',
        headhunt_fee: '1500 USD',
        client_name: 'Tech Corp',
        assignee_id: effectiveAssigneeId || 'mock-id',
        week_start: weekStart || '2026-06-22',
        created_at: new Date().toISOString(),
      },
      {
        id: 'mock-jf-2',
        job_id: 'mock-job-2',
        job_code: 'J002',
        position_title: 'Product Manager',
        phase: 'Sourcing',
        phase_date: '2026-06-15',
        headhunt_fee: '2000 USD',
        client_name: 'Product LLC',
        assignee_id: effectiveAssigneeId || 'mock-id',
        week_start: weekStart || '2026-06-22',
        created_at: new Date().toISOString(),
      }
    ] as any;
  }"""
content = content.replace("  const { data: jobFocusData = [], isLoading: loadingJobs, refetch } = useJobFocusWithDetails({\n    assignee_id: selectedMemberId === SELF_ID ? (user?.id || undefined) : (selectedMemberId || undefined),\n    week_start: weekStart,\n  });", mock_code_1)

# Mock data logic for processes in JobFocusRow
mock_code_2 = """  let { data: processPages, refetch: refetchProcesses } = useProcessesList({
    jobIdFilter: job.job_id,
    ownerIdFilter: assigneeId,
  });
  let processes = processPages?.pages.flatMap(p => p.data) ?? [];
  
  if (import.meta.env.DEV && processes.length === 0) {
    processes = [
      {
        id: 'mock-process-1',
        process_status: 'CV_SUBMITTED_TO_CLIENT',
        candidate: { name: 'Alice Nguyen', email: 'alice@example.com', cv_link: 'http://example.com/cv.pdf' },
        updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: 'mock-process-2',
        process_status: 'INTERVIEW_SCHEDULED_1ST',
        candidate: { name: 'Bob Tran', email: 'bob@example.com' },
        updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      }
    ] as any;
  }"""
content = content.replace("  const { data: processPages, refetch: refetchProcesses } = useProcessesList({\n    jobIdFilter: job.job_id,\n    ownerIdFilter: assigneeId,\n  });\n  const processes = processPages?.pages.flatMap(p => p.data) ?? [];", mock_code_2)

translations = {
    'Follow KH lấy feedback CV.\\nNếu chưa phản hồi sau 5 ngày → escalate lên lead.': 'Follow up with client for CV feedback.\\nEscalate to lead if no response after 5 days.',
    'Follow KH lấy kết quả phỏng vấn.\\nNếu KH delay → nhắc nhở 1 lần/ngày.': 'Follow up with client for interview results.\\nRemind once a day if delayed.',
    'Gọi/nhắn UV xác nhận ngày mai đi làm.\\nHỏi địa điểm, giờ, cần chuẩn bị gì.': 'Call/message candidate to confirm first day tomorrow.\\nAsk about location, time, preparation.',
    'Hỏi thăm UV sau ngày đầu tiên.\\nCảm nhận, team, môi trường.': 'Check in with candidate after first day.\\nFeedback on team and environment.',
    'Hỏi thăm UV sau ngày đầu tiên đi làm.\\nCảm nhận, team, môi trường.': 'Check in with candidate after first day.\\nFeedback on team and environment.',
    'Check-in sau 1 tuần.\\nUV có vấn đề gì? KH có phản hồi gì?': 'Check in after 1 week.\\nAny issues? Client feedback?',
    'Check-in sau 1 tuần.\\nUV có vấn đề gì không? KH có phản hồi gì không?': 'Check in after 1 week.\\nAny issues? Client feedback?',
    'Check-in sau 1 tháng.\\nUV adapt được không? Kỳ vọng vs thực tế.': 'Check in after 1 month.\\nAdaptation? Expectations vs reality.',
    'Check-in sau 1 tháng.\\nUV có adapt được không? Kỳ vọng vs thực tế.': 'Check in after 1 month.\\nAdaptation? Expectations vs reality.',
    'Check-in cuối kỳ bảo hành.\\nUV vẫn làm không? Nếu nghỉ → kích hoạt bảo hành.': 'Check in at the end of warranty.\\nStill employed? If not → activate warranty.',
    'Check-in cuối kỳ bảo hành.\\nUV vẫn làm không? Nếu nghỉ → kích hoạt điều khoản bảo hành.': 'Check in at the end of warranty.\\nStill employed? If not → activate warranty.',
    'Follow KH - CV': 'Client Follow-up - CV',
    'Follow KH - Interview': 'Client Follow-up - Interview',
    'Cập nhật trạng thái thành công': 'Status updated successfully',
    'Chưa có CV nào được submit': 'No CVs submitted yet',
    'Ứng viên': 'Candidate',
    'Trạng thái': 'Status',
    'Cập nhật': 'Update',
    'Xem CV': 'View CV',
    'Lịch sử': 'History',
    'Quá': 'Overdue',
    'Hôm nay': 'Today',
    'nữa': 'left',
    'trước': 'ago',
    'tuần này': 'this week',
    'tuần trước': 'last week',
    'thành viên': 'members',
    'Bản thân': 'Self',
    'Giao Job': 'Assign Job',
    'Focus Job': 'Focus Job',
    'Chưa có job focus': 'No job focus',
    'Bạn chưa có job focus tuần này': "You don't have job focus this week",
    'Focus job để bắt đầu làm việc': 'Focus on a job to start working',
    'Giao job để bắt đầu': 'Assign job to start',
    'Tuần Này': 'This Week',
    'Tuần Trước': 'Last Week',
    'Hiệu Suất': 'Performance',
    'Danh Sách Jobs': 'Job List',
    'Có cập nhật tuần này': 'Updates this week',
    'Đang tải...': 'Loading...',
    'Chưa có job nào được giao tuần này': 'No jobs assigned this week',
    'Tôi': 'Me',
    'tuần': 'week',
    'Tuần': 'Week',
    'Tốt': 'Good',
    'TB': 'Avg',
    'Yếu': 'Poor',
}

for k, v in translations.items():
    content = content.replace(k, v)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
