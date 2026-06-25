import os

# Update MatchingCandidatesModal.tsx
path_matching = r'd:\apex_internal\demoApex\src\features\jobs\components\MatchingCandidatesModal.tsx'
with open(path_matching, 'r', encoding='utf-8') as f:
    content = f.read()

# Change similarity logic
# from `similarity: 0.95 - (i * 0.05)`
# to `similarity: max(0.70, 0.92 - (i * (0.22 / max(1, MOCK_CANDIDATES.length))))` or something that makes it 70%-92%
# Actually, the user wants range 7x->90 as highest. 
# So max is 0.90 (90%) and it drops down to 0.70 (70%).
# So: `similarity: 0.90 - (i * 0.03) > 0.70 ? 0.90 - (i * 0.03) : (0.70 + (i % 5)*0.02)`
new_similarity = """similarity: i === 0 ? 0.90 : i === 1 ? 0.86 : i === 2 ? 0.82 : i === 3 ? 0.79 : i === 4 ? 0.75 : 0.71"""
content = content.replace("similarity: 0.95 - (i * 0.05)", "similarity: 0.90 - (i * (0.20 / Math.max(1, MOCK_CANDIDATES.length - 1)))")

with open(path_matching, 'w', encoding='utf-8') as f:
    f.write(content)

# Update JobFocusPage.tsx to add more jobs
path_job_focus = r'd:\apex_internal\demoApex\src\features\manager\pages\JobFocusPage.tsx'
with open(path_job_focus, 'r', encoding='utf-8') as f:
    jf_content = f.read()

mock_jobs_old = """    jobFocusData = [
      {
        id: 'mock-jf-1',
        job_id: 'mock-job-1',
        job_code: 'J001',
        position_title: 'Senior Frontend Engineer',
        phase: 'Open',
        phase_date: '2026-06-20',
        headhunt_fee: '1500 USD',
        client_name: 'Tech Corp',
        assignee_id: (selectedMemberId === SELF_ID ? user?.id : selectedMemberId) || 'mock-id',
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
        assignee_id: (selectedMemberId === SELF_ID ? user?.id : selectedMemberId) || 'mock-id',
        week_start: weekStart || '2026-06-22',
        created_at: new Date().toISOString(),
      }
    ] as any;"""

mock_jobs_new = """    jobFocusData = [
      {
        id: 'mock-jf-1',
        job_id: 'mock-job-1',
        job_code: 'J001',
        position_title: 'Senior Frontend Engineer',
        phase: 'Open',
        phase_date: '2026-06-20',
        headhunt_fee: '1500 USD',
        client_name: 'Tech Corp',
        assignee_id: (selectedMemberId === SELF_ID ? user?.id : selectedMemberId) || 'mock-id',
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
        assignee_id: (selectedMemberId === SELF_ID ? user?.id : selectedMemberId) || 'mock-id',
        week_start: weekStart || '2026-06-22',
        created_at: new Date().toISOString(),
      },
      {
        id: 'mock-jf-3',
        job_id: 'mock-job-3',
        job_code: 'J003',
        position_title: 'Backend Developer (Go)',
        phase: 'Interview',
        phase_date: '2026-06-18',
        headhunt_fee: '1800 USD',
        client_name: 'Fintech Solutions',
        assignee_id: (selectedMemberId === SELF_ID ? user?.id : selectedMemberId) || 'mock-id',
        week_start: weekStart || '2026-06-22',
        created_at: new Date().toISOString(),
      },
      {
        id: 'mock-jf-4',
        job_id: 'mock-job-4',
        job_code: 'J004',
        position_title: 'Data Engineer',
        phase: 'Offer',
        phase_date: '2026-06-22',
        headhunt_fee: '2200 USD',
        client_name: 'BigData Inc',
        assignee_id: (selectedMemberId === SELF_ID ? user?.id : selectedMemberId) || 'mock-id',
        week_start: weekStart || '2026-06-22',
        created_at: new Date().toISOString(),
      },
      {
        id: 'mock-jf-5',
        job_id: 'mock-job-5',
        job_code: 'J005',
        position_title: 'UX/UI Designer',
        phase: 'Sourcing',
        phase_date: '2026-06-19',
        headhunt_fee: '1200 USD',
        client_name: 'Creative Studio',
        assignee_id: (selectedMemberId === SELF_ID ? user?.id : selectedMemberId) || 'mock-id',
        week_start: weekStart || '2026-06-22',
        created_at: new Date().toISOString(),
      }
    ] as any;"""

jf_content = jf_content.replace(mock_jobs_old, mock_jobs_new)

mock_stats_old = """    pipelineStats = [
      { job_id: 'mock-job-1', cv_client: 3, interview: 2, offer: 1, onboard: 0, conversion_rate: 33 },
      { job_id: 'mock-job-2', cv_client: 5, interview: 1, offer: 0, onboard: 0, conversion_rate: 20 },
    ] as any;"""

mock_stats_new = """    pipelineStats = [
      { job_id: 'mock-job-1', cv_client: 3, interview: 2, offer: 1, onboard: 0, conversion_rate: 33 },
      { job_id: 'mock-job-2', cv_client: 5, interview: 1, offer: 0, onboard: 0, conversion_rate: 20 },
      { job_id: 'mock-job-3', cv_client: 2, interview: 1, offer: 0, onboard: 0, conversion_rate: 50 },
      { job_id: 'mock-job-4', cv_client: 4, interview: 3, offer: 2, onboard: 1, conversion_rate: 25 },
      { job_id: 'mock-job-5', cv_client: 6, interview: 0, offer: 0, onboard: 0, conversion_rate: 0 },
    ] as any;"""

jf_content = jf_content.replace(mock_stats_old, mock_stats_new)

with open(path_job_focus, 'w', encoding='utf-8') as f:
    f.write(jf_content)
