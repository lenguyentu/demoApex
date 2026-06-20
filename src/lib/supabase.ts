const chainableMock: any = new Proxy(
  function () {},
  {
    get: function (_target, prop) {
      if (prop === 'then') {
        return (resolve: any) => resolve({ data: [], error: null });
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
    if (funcName === 'get_freelancer_performance') {
      return Promise.resolve({
        data: [
          {
            id: 'freelancer-1',
            name: 'Nguyễn Văn A (Mock)',
            email: 'nguyenvana@example.com',
            phone: '0901234567',
            cv_to_tdc: 120,
            cv_to_client: 90,
            interviews: 45,
            offers: 15,
            onboarding: 10,
            rejected: 30,
            conversion_rate: 8.3,
            total_count: 5
          },
          {
            id: 'freelancer-2',
            name: 'Trần Thị B (Mock)',
            email: 'tranthib@example.com',
            phone: '0987654321',
            cv_to_tdc: 80,
            cv_to_client: 50,
            interviews: 20,
            offers: 5,
            onboarding: 4,
            rejected: 15,
            conversion_rate: 5.0,
            total_count: 5
          },
          {
            id: 'freelancer-3',
            name: 'Lê Văn C (Mock)',
            email: 'levanc@example.com',
            phone: '0977665544',
            cv_to_tdc: 40,
            cv_to_client: 20,
            interviews: 10,
            offers: 2,
            onboarding: 1,
            rejected: 5,
            conversion_rate: 2.5,
            total_count: 5
          }
        ],
        error: null
      });
    }
    if (funcName === 'get_top_jobs_by_cv_count') {
      return Promise.resolve({
        data: [
          { job_id: 'job-1', position_title: 'Frontend Developer', client_name: 'Tech Corp', cv_count: 50 },
          { job_id: 'job-2', position_title: 'Backend Node.js', client_name: 'Startup VN', cv_count: 30 },
          { job_id: 'job-3', position_title: 'Product Manager', client_name: 'Big Bank', cv_count: 20 }
        ],
        error: null
      });
    }
    if (funcName === 'get_hr_rank_by_ref_count') {
      return Promise.resolve({
        data: [
          { hr_id: 'hr-1', hr_name: 'HR Alice', hr_email: 'alice@hr.com', ref_count: 10 },
          { hr_id: 'hr-2', hr_name: 'HR Bob', hr_email: 'bob@hr.com', ref_count: 5 }
        ],
        error: null
      });
    }
    return Promise.resolve({ data: [], error: null });
  },
  channel: (_name: string) => chainableMock,
  removeChannel: () => {},
};
