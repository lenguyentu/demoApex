import { useState, useRef } from 'react';
import { X, UploadCloud, FileText, CheckCheck } from 'lucide-react';
import { AddCandidateModal } from './AddCandidateModal';
import toast from 'react-hot-toast';

interface BatchImportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FileWithKey {
  file: File;
  key: string;
  status: 'pending' | 'processing' | 'ready' | 'success' | 'error';
}

export function BatchImportModal({ open, onClose, onSuccess }: BatchImportModalProps) {
  const [files, setFiles] = useState<FileWithKey[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmSaveAll, setShowConfirmSaveAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file, idx) => ({
        file,
        key: `${Date.now()}-${idx}`,
        status: 'pending' as const,
      }));
      const combined = [...files, ...newFiles].slice(0, 5);
      setFiles(combined);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files).map((file, idx) => ({
        file,
        key: `${Date.now()}-${idx}`,
        status: 'pending' as const,
      }));
      const combined = [...files, ...newFiles].slice(0, 5);
      setFiles(combined);
    }
  };

  const removeFile = (key: string) => {
    setFiles(prev => prev.filter(f => f.key !== key));
  };

  const startProcessing = () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    // Mark all as processing
    setFiles(prev => prev.map(f => ({ ...f, status: 'processing' as const })));
  };

  const updateFileStatus = (key: string, status: FileWithKey['status']) => {
    setFiles(prev => prev.map(f => 
      f.key === key ? { ...f, status } : f
    ));
  };

  const handleSaveAll = () => {
    setShowConfirmSaveAll(false);
    // Dispatch global event that all embedded cards will listen for
    window.dispatchEvent(new CustomEvent('save-all-candidates'));
    toast.success('Saving all candidates...');
  };

  const handleClose = () => {
    const hasActiveProcessors = files.some(f => 
      f.status === 'processing' || f.status === 'ready'
    );

    if (hasActiveProcessors && isProcessing) {
      if (!confirm('There are processes running. Are you sure you want to close?')) {
        return;
      }
    }

    setFiles([]);
    setIsProcessing(false);
    onClose();
  };

  const readyCount = files.filter(f => f.status === 'ready').length;
  const successCount = files.filter(f => f.status === 'success').length;

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (isProcessing && e.target === e.currentTarget) {
          toast.error('Please wait or click the Close button');
        } else if (!isProcessing && e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className={`bg-white rounded-xl shadow-xl w-full ${isProcessing ? 'h-[90vh] max-w-[95vw]' : 'max-w-xl'} flex flex-col transition-all duration-300`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-linear-to-r from-brand-50 to-blue-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <UploadCloud className="text-brand-600" size={24} />
              {isProcessing ? 'Batch CV Processing' : 'Batch CV Upload'}
            </h2>
            {isProcessing && (
              <p className="text-xs text-gray-500 mt-1">
                Ready: <span className="font-semibold text-brand-600">{readyCount}</span> | 
                Success: <span className="font-semibold text-green-600">{successCount}</span>
              </p>
            )}
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
          {!isProcessing ? (
            <div className="space-y-6">
              {/* Drop Zone */}
              <div 
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:bg-brand-50/30 hover:border-brand-300 transition-all cursor-pointer text-center group"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  multiple 
                  className="hidden" 
                  ref={fileInputRef} 
                  accept=".pdf,.doc,.docx,.txt,image/*"
                  onChange={handleFileChange}
                />
                <div className="w-16 h-16 bg-blue-50 text-brand-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <UploadCloud size={32} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Drag & drop or select multiple CVs</h3>
                <p className="text-sm text-gray-500">Supports PDF, DOCX, Images (Max 5 files at a time)</p>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Selected {files.length}/5 files:</h4>
                  <div className="space-y-2">
                    {files.map((fileItem) => (
                      <div key={fileItem.key} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                            <FileText size={16} />
                          </div>
                          <div className="truncate">
                            <p className="text-sm font-medium text-gray-900 truncate" title={fileItem.file.name}>{fileItem.file.name}</p>
                            <p className="text-xs text-gray-500">{(fileItem.file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeFile(fileItem.key); }}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Grid of embedded AddCandidateModal cards - Adjusted for better width */
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 h-full p-2">
              {files.map((fileItem) => (
                <div key={fileItem.key} className="h-[700px]">
                  <AddCandidateModal
                    open={true}
                    onClose={() => removeFile(fileItem.key)}
                    onSuccess={onSuccess}
                    initialFile={fileItem.file}
                    embedded={true}
                    onRemove={() => removeFile(fileItem.key)}
                    onStatusChange={(status) => updateFileStatus(fileItem.key, status as FileWithKey['status'])}
                    cardKey={fileItem.key}
                    hideUploadSection={true}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center gap-3">
          {!isProcessing ? (
            <>
              <button 
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={startProcessing}
                disabled={files.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <div className="bg-white/20 px-1.5 py-0.5 rounded text-xs font-bold">{files.length}</div>
                Start Processing
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Close
              </button>
              {readyCount > 0 && (
                <button 
                  onClick={() => setShowConfirmSaveAll(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm flex items-center gap-2"
                >
                  <CheckCheck size={18} />
                  Import All ({readyCount})
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Confirm Save All Modal */}
      {showConfirmSaveAll && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Confirm Import All</h3>
            <p className="text-sm text-gray-600 mb-2">
              Do you want to import <span className="font-semibold text-brand-600">{readyCount} candidates</span>?
            </p>
            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded mb-4">
              ⚠️ Please check the information carefully before importing.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowConfirmSaveAll(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveAll}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm"
              >
                Checked, Import Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
