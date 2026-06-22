import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  DollarSign,
  MapPin,
  Calendar,
  Users,
  Eye,
} from 'lucide-react';
import type { Job } from '../types';

interface JobCardProps {
  job: Job;
  onIntroduceClick?: (job: Job) => void;
  checkboxSlot?: React.ReactNode;
}

const InterviewRoundsCell = ({ rounds }: { rounds: number }) => (
  <div className="flex items-center gap-2 text-gray-600 text-sm">
    <div className="w-4 h-4 bg-pink-100 rounded-full flex items-center justify-center shrink-0">
      <div className="w-2 h-2 bg-pink-500 rounded-full" />
    </div>
    <span className="truncate">{rounds || 0} rounds</span>
  </div>
);

export const JobCard = ({ job, onIntroduceClick, checkboxSlot }: JobCardProps) => {
  const location = useLocation();

  const salary = (() => {
    const min = job.min_monthly_salary;
    const max = job.max_monthly_salary;

    if (min && max) return `${min} - ${max}`;
    if (!min && max) return `${max}`;
    if (min && !max) return `${min}`;
    return 'Negotiable';
  })();

  const companyName = job.clients?.client_name ?? 'N/A';
  const postedDate = job.created_at
    ? new Date(job.created_at).toLocaleDateString('vi-VN')
    : 'N/A';

  const handleIntroduceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onIntroduceClick?.(job);
  };

  return (
    <div className="bg-white rounded-xl flex flex-col border-2 border-pink-200 shadow-sm hover:border-pink-400 hover:shadow-pink-100 hover:scale-[1.01] transition-all duration-300 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          {checkboxSlot}
          <div className="flex items-center gap-1.5 text-lg font-bold text-gray-800">
            <Briefcase className="w-5 h-5 text-purple-600" />
            <span>{`[${job.job_id || job.job_code || '-'}]`}</span>
          </div>
        </div>

        {/* Số lượng cần tuyển */}
        {job.number_of_employees != null && (
          <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
            <Users className="w-3.5 h-3.5" />
            <span>
              Headcount: {job.number_of_employees || 'Not updated'}
            </span>
          </div>
        )}
      </div>

      {/* Title */}
      <div className="flex-1 flex flex-col">
        <Link to={`/jobs/${job.id}`} state={{ from: location.pathname }}>
          <h3 className="ml-1 font-bold text-gray-800 hover:text-pink-600 transition-colors text-lg leading-snug cursor-pointer mb-3 line-clamp-1" title={job.position_title ?? undefined}>
            {job.position_title ?? 'Unknown'}
          </h3>
        </Link>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3 text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="w-4 h-4 text-orange-600 shrink-0" />
            <span className="text-gray-900 font-semibold truncate">
              {companyName}
            </span>
          </div>
          <InterviewRoundsCell rounds={job.interview_rounds ?? 0} />
          <div className="flex items-center gap-2 text-green-700 font-medium">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="truncate">{salary}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4 text-pink-600" />
            <span className="truncate">{job.work_location ?? 'Unknown'}</span>
          </div>
          <div className="flex items-center text-gray-500 text-sm">
            <div className="w-2.5 h-2.5 bg-blue-400 rounded-full mr-2" />
            <span>Warranty: {job.warranty_period_days ?? 'N/A'} days</span>
          </div>
          <div className="flex items-center text-gray-500 text-sm">
            <Calendar className="w-4 h-4 mr-1.5" />
            <span>Posted: {postedDate}</span>
          </div>
        </div>

      
        <div className="flex gap-2 mt-auto pt-3">
          <button
            onClick={handleIntroduceClick}
            className="w-full border border-pink-500 text-pink-600 hover:bg-pink-50 transition-all duration-200 font-semibold py-2.5 rounded-lg text-sm"
          >
            Introduce Candidate
          </button>
          <Link
            to={`/jobs/${job.id}`}
            state={{ from: location.pathname }}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white transition-all duration-200 font-semibold py-2.5 rounded-lg text-sm text-center flex items-center justify-center gap-1"
          >
            <Eye className="w-4 h-4" />
            View details
          </Link>
        </div>
      </div>
    </div>
  );
};
