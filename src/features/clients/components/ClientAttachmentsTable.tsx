// @ts-nocheck
import React, { useState } from 'react';
import { FileText, Download, Eye, Loader2, Trash2, Plus } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { UploadFileModal } from './UploadFileModal';

interface ClientAttachment {
  id: string;
  client_id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  description: string | null;
  created_at: string;
  created_by_id: string | null;
}

interface ClientAttachmentsTableProps {
  clientId: string;
  attachments: ClientAttachment[];
  isViewMode: boolean;
  onRefresh: () => void;
}

export const ClientAttachmentsTable: React.FC<ClientAttachmentsTableProps> = ({
  clientId,
  attachments,
  isViewMode,
  onRefresh,
}) => {
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleViewFile = async (attachment: ClientAttachment) => {
    setLoadingFileId(attachment.id);
    const loadingToast = toast.loading('Loading document...');
    try {
      // Check if file_path is a valid URL (starts with http)
      if (attachment.file_path && attachment.file_path.startsWith('http')) {
        window.open(attachment.file_path, '_blank');
      } else {
        // Legacy: Fetch base64 data from database
        const { data, error } = await supabase
          .from('client_attachments')
          .select('file_data, file_type')
          .eq('id', attachment.id)
          .single();

        if (error) throw error;

        if (!data?.file_data) {
          toast.error('File data not found');
          return;
        }

        // Convert base64 to blob
        const base64Data = data.file_data;
        // Check if string contains base64 prefix (e.g., "data:application/pdf;base64,")
        const base64Content = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
        
        const byteCharacters = atob(base64Content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: data.file_type || 'application/octet-stream' });

        // Create blob URL and open in new tab
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');

        // Clean up blob URL after a delay
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      }
      toast.dismiss(loadingToast);
    } catch (error: any) {
      console.error('Error viewing file:', error);
      toast.error(error.message || 'Error opening file', { id: loadingToast });
    } finally {
      setLoadingFileId(null);
      toast.dismiss(loadingToast);
    }
  };

  const handleDownloadFile = async (attachment: ClientAttachment) => {
    setLoadingFileId(attachment.id);
    const loadingToast = toast.loading('Preparing file for download...');
    try {
      let blob: Blob;

      // Check if file_path is a valid URL
      if (attachment.file_path && attachment.file_path.startsWith('http')) {
        const response = await fetch(attachment.file_path);
        blob = await response.blob();
      } else {
         // Legacy: Fetch base64 data from database
         const { data, error } = await supabase
           .from('client_attachments')
           .select('file_data, file_type')
           .eq('id', attachment.id)
           .single();
 
         if (error) throw error;
 
         if (!data?.file_data) {
           toast.error('File data not found', { id: loadingToast });
           return;
         }
 
         // Convert base64 to blob
         const base64Data = data.file_data;
         const base64Content = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

         const byteCharacters = atob(base64Content);
         const byteNumbers = new Array(byteCharacters.length);
         for (let i = 0; i < byteCharacters.length; i++) {
           byteNumbers[i] = byteCharacters.charCodeAt(i);
         }
         const byteArray = new Uint8Array(byteNumbers);
         blob = new Blob([byteArray], { type: data.file_type || 'application/octet-stream' });
      }

      // Create download link
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = attachment.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      toast.success('File downloaded successfully', { id: loadingToast });
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast.error(error.message || 'Error downloading file', { id: loadingToast });
    } finally {
      setLoadingFileId(null);
    }
  };

  const handleDeleteFile = async (attachment: ClientAttachment) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    setDeletingFileId(attachment.id);
    try {
      // Extract storage path from URL
      // URL format: https://{project}.supabase.co/storage/v1/object/public/client-attachments/{path}
      const urlParts = attachment.file_path.split('/client-attachments/');
      const storagePath = urlParts[1];

      // Delete from storage
      if (storagePath) {
        const { error: storageError } = await supabase.storage
          .from('client-attachments')
          .remove([storagePath]);

        if (storageError) {
          console.error('Storage deletion error:', storageError);
          // Continue to delete DB record even if storage deletion fails
        }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('client_attachments')
        .delete()
        .eq('id', attachment.id);

      if (dbError) throw dbError;

      toast.success('File deleted successfully');
      onRefresh();
    } catch (error: any) {
      console.error('Error deleting file:', error);
      toast.error(error.message || 'Error deleting file');
    } finally {
      setDeletingFileId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      {!isViewMode && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add File
          </button>
        </div>
      )}

      {/* Table */}
      {attachments.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          {isViewMode ? 'No attachments' : 'No attachments. Click "Add File" to upload.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  File Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attachments.map((attachment) => (
                <tr key={attachment.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{attachment.file_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">{attachment.description || '-'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">{formatFileSize(attachment.file_size)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">
                      {format(new Date(attachment.created_at), 'dd/MM/yyyy HH:mm')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleViewFile(attachment)}
                        disabled={loadingFileId === attachment.id}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all disabled:opacity-50"
                        title="View File"
                      >
                        {loadingFileId === attachment.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadFile(attachment)}
                        disabled={loadingFileId === attachment.id}
                        className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-all disabled:opacity-50"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {!isViewMode && (
                        <button
                          type="button"
                          onClick={() => handleDeleteFile(attachment)}
                          disabled={deletingFileId === attachment.id}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-all disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingFileId === attachment.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Modal */}
      <UploadFileModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        clientId={clientId}
        onSuccess={onRefresh}
      />
    </div>
  );
};
