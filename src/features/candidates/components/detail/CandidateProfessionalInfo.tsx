import { Building2 } from 'lucide-react';
import type { AnyCandidate } from '../../types';
import { EditableField } from './EditableField';

interface CandidateProfessionalInfoProps {
  candidate: AnyCandidate;
  isEditing: boolean;
  formData: {
    currentEmploymentStatus?: string;
    experiencedIndustry?: string;
    experiencedJob?: string;
    employmentType?: string;
    noticePeriod?: string;
    availableDate?: string;
    currentSalary?: string;
    expectedSalary?: string;
    expectedAnnualSalary?: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export function CandidateProfessionalInfo({
  candidate,
  isEditing,
  formData,
  handleInputChange,
}: CandidateProfessionalInfoProps) {
  
  // Options for Employment Status
//   const employmentStatusOptions = [
//     { value: 'Employed', label: 'Đang làm việc' },
//     { value: 'Unemployed', label: 'Đang thất nghiệp' },
//     { value: 'Looking for a job', label: 'Đang tìm việc' },
//     { value: 'Student', label: 'Sinh viên' },
//     { value: 'Other', label: 'Khác' },
//   ];

  // Options for Employment Type
  const employmentTypeOptions = [
    { value: 'Full_Time_Permanent', label: 'Full Time' },
    { value: 'Part_Time_Permanent', label: 'Part Time' },
    { value: 'Contract', label: 'Contract' },
    { value: 'Freelance', label: 'Freelance' },
    { value: 'Internship', label: 'Internship' },
    { value: 'Temporary', label: 'Temporary' },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Building2 className="h-4 w-4 text-pink-600" />
        Professional Information
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isEditing ? (
          <>
            <EditableField
              label="Employment status"
              name="currentEmploymentStatus"
              value={formData.currentEmploymentStatus}
              isEditing={true}
              onChange={handleInputChange}
            />
            <EditableField
              label="Experienced industry"
              name="experiencedIndustry"
              value={formData.experiencedIndustry}
              isEditing={true}
              onChange={handleInputChange}
            />
            <EditableField
              label="Experienced job"
              name="experiencedJob"
              value={formData.experiencedJob}
              isEditing={true}
              onChange={handleInputChange}
            />
            <EditableField
              label="Employment type"
              name="employmentType"
              value={formData.employmentType}
              isEditing={true}
              onChange={handleInputChange}
              type="select"
              options={employmentTypeOptions}
            />
            <EditableField
              label="Notice period"
              name="noticePeriod"
              value={formData.noticePeriod}
              isEditing={true}
              onChange={handleInputChange}
            />
            <EditableField
              label="Available date"
              name="availableDate"
              value={formData.availableDate}
              isEditing={true}
              onChange={handleInputChange}
              placeholder="dd/mm/yyyy"
            />
            <EditableField
              label="Current salary"
              name="currentSalary"
              value={formData.currentSalary}
              isEditing={true}
              onChange={handleInputChange}
            />
            <EditableField
              label="Expected salary (Monthly)"
              name="expectedSalary"
              value={formData.expectedSalary}
              isEditing={true}
              onChange={handleInputChange}
            />
            <EditableField
              label="Expected salary (Annual)"
              name="expectedAnnualSalary"
              value={formData.expectedAnnualSalary}
              isEditing={true}
              onChange={handleInputChange}
            />
          </>
        ) : (
          <>
            <EditableField
              label="Employment status"
              name="current_employment_status"
              value={candidate.current_employment_status}
              isEditing={false}
              onChange={handleInputChange}
            />
            <EditableField
              label="Experienced industry"
              name="experienced_industry"
              value={candidate.experienced_industry}
              isEditing={false}
              onChange={handleInputChange}
            />
            <EditableField
              label="Experienced job"
              name="experienced_job"
              value={candidate.experienced_job}
              isEditing={false}
              onChange={handleInputChange}
            />
            <EditableField
              label="Employment type"
              name="employment_type"
              value={candidate.employment_type}
              isEditing={false}
              onChange={handleInputChange}
            />
            <EditableField
              label="Notice period"
              name="notice_period"
              value={candidate.notice_period}
              isEditing={false}
              onChange={handleInputChange}
            />
            <EditableField
              label="Available date"
              name="employment_start_date"
              value={candidate.employment_start_date}
              isEditing={false}
              onChange={handleInputChange}
            />
            <EditableField
              label="Current salary"
              name="current_monthly_salary"
              value={candidate.current_monthly_salary}
              isEditing={false}
              onChange={handleInputChange}
            />
            <EditableField
              label="Expected salary (Monthly)"
              name="expected_monthly_salary"
              value={candidate.expected_monthly_salary}
              isEditing={false}
              onChange={handleInputChange}
            />
            <EditableField
              label="Expected salary (Annual)"
              name="expected_annual_salary"
              value={candidate.expected_annual_salary}
              isEditing={false}
              onChange={handleInputChange}
            />
          </>
        )}
      </div>
    </div>
  );
}
