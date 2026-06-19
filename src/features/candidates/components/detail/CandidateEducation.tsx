import { GraduationCap } from 'lucide-react';
import type { AnyCandidate } from '../../types';
import { EditableField } from './EditableField';

interface CandidateEducationProps {
  candidate: AnyCandidate;
  isEditing: boolean;
  formData: {
    degree?: string;
    university?: string;
    major?: string;
    educationPeriod?: string;
    gpa?: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export function CandidateEducation({
  candidate,
  isEditing,
  formData,
  handleInputChange,
}: CandidateEducationProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <GraduationCap className="h-4 w-4 text-pink-600" />
        Học vấn
      </h2>
      <div className="space-y-4">
        <EditableField 
          label="Trình độ học vấn cao nhất" 
          name="degree" 
          value={isEditing ? formData.degree : candidate.highest_education} 
          isEditing={isEditing} 
          onChange={handleInputChange} 
        />
        <EditableField 
          label="Tên trường" 
          name="university" 
          value={isEditing ? formData.university : candidate.school_name} 
          isEditing={isEditing} 
          onChange={handleInputChange} 
        />
        <EditableField 
          label="Chuyên ngành" 
          name="major" 
          value={isEditing ? formData.major : candidate.major} 
          isEditing={isEditing} 
          onChange={handleInputChange} 
        />
        <EditableField 
          label="Thời gian học" 
          name="educationPeriod" 
          value={isEditing ? formData.educationPeriod : candidate.education_period} 
          isEditing={isEditing} 
          onChange={handleInputChange} 
        />
        <EditableField 
          label="GPA" 
          name="gpa" 
          value={isEditing ? formData.gpa : candidate.gpa} 
          isEditing={isEditing} 
          onChange={handleInputChange} 
        />
        {!isEditing && (
          <EditableField 
            label="Chi tiết học vấn" 
            name="education_details" 
            value={candidate.education_details} 
            isEditing={false} 
            onChange={handleInputChange} 
          />
        )}
      </div>
    </div>
  );
}
