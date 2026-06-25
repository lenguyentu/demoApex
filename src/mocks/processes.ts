export const MOCK_PROCESSES = [
  {
    id: 'process-1',
    candidate_id: 'candidate-1',
    job_id: 'job-1',
    client_id: 'client-1',
    owner_id: 'mock-user-123',
    process_status: 'OFFER_ACCEPTED_BY_CANDIDATE',
    application_reason: 'Meets requirements',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    candidate: {
      id: 'candidate-1',
      name: 'Nguyễn Văn An',
      email: 'nguyen.van.an@example.com',
      cv_link: 'https://example.com/cv.pdf',
      phone: '0901234567'
    },
    job: {
      id: 'job-1',
      position_title: 'Senior Frontend Engineer',
      job_id: 'JOB-001'
    },
    client: {
      id: 'client-1',
      client_name: 'Techcombank'
    },
    owner: {
      id: 'mock-user-123',
      full_name: 'Admin User',
      email: 'admin@apex.com',
      role: 'Admin'
    },
    client_portal_user_count: 0,
    unread_comment_count: 0
  },
  {
    id: 'process-2',
    candidate_id: 'candidate-2',
    job_id: 'job-2',
    client_id: 'client-2',
    owner_id: 'mock-user-123',
    process_status: 'ONBOARDING',
    application_reason: 'Relevant experience',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    candidate: {
      id: 'candidate-2',
      name: 'Trần Thị Bích',
      email: 'tran.thi.bich@example.com',
      cv_link: 'https://example.com/cv2.pdf',
      phone: '0912345678'
    },
    job: {
      id: 'job-2',
      position_title: 'Product Manager',
      job_id: 'JOB-002'
    },
    client: {
      id: 'client-2',
      client_name: 'VNG'
    },
    owner: {
      id: 'mock-user-123',
      full_name: 'Admin User',
      email: 'admin@apex.com',
      role: 'Admin'
    },
    client_portal_user_count: 1,
    unread_comment_count: 2
  },
  {
    id: 'process-3',
    candidate_id: 'candidate-3',
    job_id: 'job-3',
    client_id: 'client-3',
    owner_id: 'other-user',
    process_status: 'PASSED_PROBATION',
    application_reason: 'Very excellent',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    candidate: {
      id: 'candidate-3',
      name: 'Lê Văn Cường',
      email: 'cuong.le@example.com',
      cv_link: 'https://example.com/cv3.pdf',
      phone: '0922334455'
    },
    job: {
      id: 'job-3',
      position_title: 'Backend Engineer',
      job_id: 'JOB-003'
    },
    client: {
      id: 'client-3',
      client_name: 'FPT Software'
    },
    owner: {
      id: 'other-user',
      full_name: 'Other User',
      email: 'other@apex.com',
      role: 'HR'
    },
    client_portal_user_count: 0,
    unread_comment_count: 0
  }
];
