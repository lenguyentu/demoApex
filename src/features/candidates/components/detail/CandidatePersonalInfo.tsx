import { User } from 'lucide-react';
import type { AnyCandidate } from '../../types';
import { EditableField } from './EditableField';

interface CandidatePersonalInfoProps {
  candidate: AnyCandidate;
  isEditing: boolean;
  formData: {
    fullName?: string;
    email?: string;
    phone?: string;
    birthDate?: string;
    address?: string;
    facebook?: string;
    linkedin?: string;
    gender?: string;
    visaStatus?: string;
    icPassportNo?: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export function CandidatePersonalInfo({
  candidate,
  isEditing,
  formData,
  handleInputChange,
}: CandidatePersonalInfoProps) {
  // Helper to translate gender
  const getGenderLabel = (gender: string | null | undefined) => {
    if (!gender) return '';
    switch (gender) {
      case 'Male': return 'Nam';
      case 'Female': return 'Nữ';
      default: return 'Khác';
    }
  };

  const genderOptions = [
    { value: 'Male', label: 'Nam' },
    { value: 'Female', label: 'Nữ' },
    { value: 'Other', label: 'Khác' },
  ];

  const visaOptions = [
    { value: 'Citizen', label: 'Công dân (Citizen)' },
    { value: 'Permanent_Resident', label: 'PR (Thường trú nhân)' },
    { value: 'Work_Permit_Holder', label: 'Work Permit (EP/SP/WP)' },
    { value: 'Dependent_Pass_Holder', label: 'Dependent Pass (DP/LTVP)' },
    { value: 'Student_Pass_Holder', label: 'Student Pass' },
    { value: 'Requires_Sponsorship', label: 'Cần bảo lãnh (Sponsorship)' },
    { value: 'Not_Applicable', label: 'Không áp dụng / Khác' },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <User className="h-4 w-4 text-pink-600" />
        Thông tin cá nhân
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isEditing ? (
          <>
            <EditableField 
              label="Họ và tên" 
              name="fullName" 
              value={formData.fullName} 
              isEditing={true} 
              onChange={handleInputChange} 
            />
            <EditableField 
              label="Email" 
              name="email" 
              value={formData.email} 
              isEditing={true} 
              onChange={handleInputChange} 
              type="email"
            />
            <EditableField 
              label="Số điện thoại" 
              name="phone" 
              value={formData.phone} 
              isEditing={true} 
              onChange={handleInputChange} 
              type="tel"
            />
            <EditableField 
              label="Ngày sinh" 
              name="birthDate" 
              value={formData.birthDate} 
              isEditing={true} 
              onChange={handleInputChange} 
              type="date" 
            />
            <EditableField 
              label="Giới tính" 
              name="gender" 
              value={formData.gender} 
              isEditing={true} 
              onChange={handleInputChange}
              type="select"
              options={genderOptions}
            />
            <EditableField 
              label="Tình trạng visa" 
              name="visaStatus" 
              value={formData.visaStatus} 
              isEditing={true} 
              onChange={handleInputChange}
              type="select"
              options={visaOptions}
            />
             <EditableField 
              label="Số CMND/Passport" 
              name="icPassportNo" 
              value={formData.icPassportNo} 
              isEditing={true} 
              onChange={handleInputChange} 
            />
            <EditableField 
              label="Địa chỉ" 
              name="address" 
              value={formData.address} 
              isEditing={true} 
              onChange={handleInputChange} 
              className="md:col-span-2" 
            />
            <EditableField 
              label="Facebook" 
              name="facebook" 
              value={formData.facebook} 
              isEditing={true} 
              onChange={handleInputChange} 
            />
            <EditableField 
              label="LinkedIn" 
              name="linkedin" 
              value={formData.linkedin} 
              isEditing={true} 
              onChange={handleInputChange} 
            />
          </>
        ) : (
          <>
            <EditableField 
              label="Giới tính" 
              name="gender" 
              value={getGenderLabel(candidate.gender)} 
              isEditing={false} 
              onChange={handleInputChange} 
            />
            <EditableField 
              label="Ngày sinh" 
              name="date_of_birth" 
              value={candidate.date_of_birth} 
              isEditing={false} 
              onChange={handleInputChange} 
              type="date" 
            />
            <EditableField 
              label="Email" 
              name="email" 
              value={candidate.email} 
              isEditing={false} 
              onChange={handleInputChange} 
            />
            <EditableField 
              label="Số điện thoại" 
              name="phone" 
              value={candidate.phone} 
              isEditing={false} 
              onChange={handleInputChange} 
            />
            <EditableField 
              label="Tình trạng visa" 
              name="visa_status" 
              value={candidate.visa_status} 
              isEditing={false} 
              onChange={handleInputChange} 
            />
            <EditableField 
              label="Số CMND/Passport" 
              name="ic_passport_no" 
              value={candidate.ic_passport_no} 
              isEditing={false} 
              onChange={handleInputChange} 
            />
            <EditableField 
              label="Facebook" 
              name="facebook" 
              value={candidate.facebook} 
              isEditing={false} 
              onChange={handleInputChange} 
            />
            <EditableField 
              label="LinkedIn" 
              name="linkedin" 
              value={candidate.linkedin} 
              isEditing={false} 
              onChange={handleInputChange} 
            />
            <EditableField 
              label="Địa chỉ" 
              name="address" 
              value={candidate.address} 
              isEditing={false} 
              onChange={handleInputChange} 
              className="md:col-span-2" 
            />
          </>
        )}
      </div>
    </div>
  );
}
