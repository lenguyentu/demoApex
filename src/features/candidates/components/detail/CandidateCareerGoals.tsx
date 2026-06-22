import { Briefcase, Award } from 'lucide-react';
import type { AnyCandidate } from '../../types';
import { EditableField } from './EditableField';

interface CandidateCareerGoalsProps {
  candidate: AnyCandidate;
  isEditing: boolean;
  formData: {
    careerGoals?: string;
    strengths?: string;
    certifications?: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export function CandidateCareerGoals({
  candidate,
  isEditing,
  formData,
  handleInputChange,
}: CandidateCareerGoalsProps) {
  // Don't render if no data and not editing
  const hasGoals = candidate.career_goals || candidate.key_strengths || isEditing;
  const hasCerts = candidate.professional_certifications || isEditing;

  if (!hasGoals && !hasCerts) return null;

  return (
    <>
      {/* Career Goals & Strengths */}
      {hasGoals && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-pink-600" />
            Goals & Strengths
          </h2>
          <div className="space-y-4">
            <EditableField 
              label="Career goals" 
              name="careerGoals" 
              value={isEditing ? formData.careerGoals : candidate.career_goals} 
              isEditing={isEditing} 
              onChange={handleInputChange} 
              type="textarea" 
            />
            <EditableField 
              label="Key strengths" 
              name="strengths" 
              value={isEditing ? formData.strengths : candidate.key_strengths} 
              isEditing={isEditing} 
              onChange={handleInputChange} 
              type="textarea" 
            />
          </div>
        </div>
      )}

      {/* Certifications */}
      {hasCerts && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="h-4 w-4 text-pink-600" />
            Professional certifications
          </h2>
          <EditableField 
            label="" 
            name="certifications" 
            value={isEditing ? formData.certifications : candidate.professional_certifications} 
            isEditing={isEditing} 
            onChange={handleInputChange} 
            type="textarea" 
            placeholder="Certification details..." 
          />
        </div>
      )}
    </>
  );
}
