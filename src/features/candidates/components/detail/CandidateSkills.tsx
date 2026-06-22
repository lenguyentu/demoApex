import { Award } from 'lucide-react';
import type { AnyCandidate } from '../../types';
import { EditableField } from './EditableField';

interface CandidateSkillsProps {
  candidate: AnyCandidate;
  isEditing: boolean;
  formData: {
    technicalSkills?: string;
    softSkills?: string;
    languages?: string;
    englishLevel?: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export function CandidateSkills({
  candidate,
  isEditing,
  formData,
  handleInputChange,
}: CandidateSkillsProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Award className="h-4 w-4 text-pink-600" />
        Skills
      </h2>
      <div className="space-y-4">
        {isEditing ? (
          <>
            <EditableField 
              label="Technical skills (comma-separated)" 
              name="technicalSkills" 
              value={formData.technicalSkills} 
              isEditing={true} 
              onChange={handleInputChange} 
              type="textarea" 
            />
            <EditableField 
              label="Soft skills (comma-separated)" 
              name="softSkills" 
              value={formData.softSkills} 
              isEditing={true} 
              onChange={handleInputChange} 
              type="textarea" 
            />
            <EditableField 
              label="Other languages (comma-separated)" 
              name="languages" 
              value={formData.languages} 
              isEditing={true} 
              onChange={handleInputChange} 
            />
            <EditableField 
              label="English level" 
              name="englishLevel" 
              value={formData.englishLevel} 
              isEditing={true} 
              onChange={handleInputChange} 
            />
          </>
        ) : (
          <>
            {candidate.technical_skills && candidate.technical_skills.length > 0 && (
              <div>
                <label className="text-xs text-gray-500 mb-2 block">Technical skills</label>
                <div className="flex flex-wrap gap-2">
                  {candidate.technical_skills.map((skill, index) => (
                    <span 
                      key={index} 
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {candidate.soft_skills && candidate.soft_skills.length > 0 && (
              <div>
                <label className="text-xs text-gray-500 mb-2 block">Soft skills</label>
                <div className="flex flex-wrap gap-2">
                  {candidate.soft_skills.map((skill, index) => (
                    <span 
                      key={index} 
                      className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <EditableField 
              label="English level" 
              name="english_level" 
              value={candidate.english_level} 
              isEditing={false} 
              onChange={handleInputChange} 
            />
            <EditableField 
              label="Other languages" 
              name="other_languages" 
              value={candidate.other_languages?.join(', ')} 
              isEditing={false} 
              onChange={handleInputChange} 
            />
          </>
        )}
      </div>
    </div>
  );
}
