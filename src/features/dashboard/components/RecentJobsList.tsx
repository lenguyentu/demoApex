import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function RecentJobsList({ selectedUserId: _selectedUserId }: { selectedUserId?: string }) {
  const [jobs] = useState([
    { id: '1', position_title: 'Frontend Dev', client_name: 'Tech Corp', created_at: '2023-01-01' },
    { id: '2', position_title: 'Backend Dev', client_name: 'Soft Inc', created_at: '2023-01-02' }
  ]);

  return (
    <div className="space-y-4">
      {jobs.map(job => (
        <Link to={`/tables/job-detail/${job.id}`} key={job.id} className="block p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-blue-600 hover:text-blue-700">{job.position_title}</h4>
              <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                <Building className="w-4 h-4 text-gray-400" /> {job.client_name}
              </p>
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {new Date(job.created_at).toLocaleDateString()}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
