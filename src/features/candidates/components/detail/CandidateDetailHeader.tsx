import { User, FileText, Edit, Trash2, Save, X, Loader2 } from 'lucide-react';
import type { AnyCandidate, CandidatePhase } from '../../types';
import { STATUS_CONFIG } from '../../constants';
import { formatDate } from '../../../../utils/date';
import { EditableField } from './EditableField';

interface CandidateDetailHeaderProps {
  candidate: AnyCandidate;
  isEditing: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  formData: {
    fullName: string;
    appliedPosition?: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onViewCV: () => void;
  onViewEvaluation: () => void;
  isSaving: boolean;
}

export function CandidateDetailHeader({
  candidate,
  isEditing,
  canUpdate,
  canDelete,
  formData,
  handleInputChange,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onViewCV,
  onViewEvaluation,
  isSaving,
}: CandidateDetailHeaderProps) {
  const process_status = candidate.phase as CandidatePhase | null | undefined;
  const created_at = candidate.created_at;
  const evaluation_file_path = candidate.evaluation_file_path;
  const statusDisplayName = process_status && STATUS_CONFIG[process_status] 
    ? STATUS_CONFIG[process_status].displayName 
    : process_status;

  const ActionButtons = () => {
    if (isEditing) {
      return (
        <div className="flex items-center gap-3">
          <button
            onClick={onCancelEdit}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Hủy</span>
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-pink-600 rounded-lg hover:bg-pink-700 disabled:opacity-50 transition-colors"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span className="hidden sm:inline">Lưu</span>
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3">
        {canUpdate && (
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
          >
            <Edit className="h-4 w-4" />
            <span className="hidden sm:inline">Cập nhật</span>
          </button>
        )}
        {canDelete && (
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-white border border-gray-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Xóa</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="pb-6 border-b border-gray-200">
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-6 items-start relative">
        {/* Avatar */}
        <div className="flex justify-center lg:justify-start">
          <div className="shrink-0">
            {candidate.photo_url ? (
              <img 
                src={candidate.photo_url} 
                alt={candidate.name} 
                className="w-20 h-20 rounded-full object-cover border-4 border-pink-100 shadow-sm" 
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center border-4 border-pink-200 shadow-sm">
                <User className="h-10 w-10 text-pink-600" />
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <div className="space-y-3 mb-3">
              <EditableField 
                label="Họ và tên" 
                name="fullName" 
                value={formData.fullName} 
                isEditing={true} 
                onChange={handleInputChange} 
              />
              <EditableField 
                label="Vị trí ứng tuyển" 
                name="appliedPosition" 
                value={formData.appliedPosition} 
                isEditing={true} 
                onChange={handleInputChange} 
              />
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">{candidate.name}</h1>
              {candidate.applied_position && (
                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-1">
                    Vị trí mong muốn: <span className="font-semibold text-gray-900">{candidate.applied_position}</span>
                  </p>
                </div>
              )}
            </>
          )}

          {/* Document Links */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            {candidate.cv_link && (
              <div>
                <button 
                  onClick={onViewCV}
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-pink-600 transition-colors underline text-sm"
                >
                  <FileText className="h-4 w-4" />
                  <span>Xem CV</span>
                </button>
              </div>
            )}
            {evaluation_file_path && (
              <button 
                onClick={onViewEvaluation}
                className="inline-flex items-center gap-2 text-gray-600 hover:text-pink-600 transition-colors underline text-sm"
              >
                <FileText className="h-4 w-4" />
                <span>Xem tài liệu đánh giá</span>
              </button>
            )}
          </div>

          {/* Status & Date */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-200 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Trạng thái:</span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                process_status && STATUS_CONFIG[process_status] 
                  ? STATUS_CONFIG[process_status].color 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {statusDisplayName || 'Chưa cập nhật'}
              </span>
            </div>
            {created_at && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Ngày ứng tuyển:</span>
                <span className="text-xs text-gray-700">{formatDate(created_at)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Action Buttons */}
        <div className="hidden lg:block">
          <div className="text-right"><ActionButtons /></div>
        </div>
      </div>
      
      {/* Mobile Action Buttons */}
      <div className="lg:hidden mt-4 pt-4 border-t border-gray-200 flex justify-end">
        <ActionButtons />
      </div>
    </div>
  );
}
