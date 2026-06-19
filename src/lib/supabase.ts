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
    from: () => ({
      upload: () => Promise.resolve({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: 'https://mock.url' } }),
      createSignedUrl: () => Promise.resolve({ data: { signedUrl: 'https://mock.url' }, error: null }),
    })
  },
  rpc: chainableMock,
  channel: () => chainableMock,
  removeChannel: () => {},
};
