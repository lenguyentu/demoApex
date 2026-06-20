import { useState } from 'react';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function RecentCandidatesList({ selectedUserId: _selectedUserId }: { selectedUserId?: string }) {
  const [candidates] = useState([
      { id: '1', name: 'Nguyen Van A', email: 'a@test.com', phase: 'New', created_at: '2023-01-01' },
      { id: '2', name: 'Tran Thi B', email: 'b@test.com', phase: 'Interview', created_at: '2023-01-02' }
  ]);

  return (
    <div className="space-y-4">
      {candidates.map((candidate) => (
        <div key={candidate.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">{candidate.name}</h4>
            <p className="text-sm text-gray-500 truncate">{candidate.email}</p>
          </div>
          <div className="ml-4 shrink-0">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-800">
              {candidate.phase}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
