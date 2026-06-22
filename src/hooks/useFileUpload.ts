import { useState, useRef, useCallback } from 'react';

interface UseFileUploadOptions {
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Allowed MIME types */
  allowedTypes?: string[];
  /** Whether to validate file name for special characters */
  validateFileName?: boolean;
}

interface UseFileUploadReturn {
  file: File | null;
  error: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  resetFile: () => void;
  openFileDialog: () => void;
}

const DEFAULT_ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Hook quản lý file upload với validation
 */
export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const {
    maxSize = DEFAULT_MAX_SIZE,
    allowedTypes = DEFAULT_ALLOWED_TYPES,
    validateFileName = false,
  } = options;

  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      setError(null);

      if (!selectedFile) {
        setFile(null);
        return;
      }

      // Validate file type
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Unsupported file format. Please choose PDF, DOC, or DOCX.');
        setFile(null);
        return;
      }

      // Validate file size
      if (selectedFile.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / (1024 * 1024));
        setError(`File quá lớn. Kích thước tối đa là ${maxSizeMB}MB.`);
        setFile(null);
        return;
      }

      // Validate file name (optional)
      if (validateFileName) {
        const invalidChars = /[^\w\s.-]/;
        if (invalidChars.test(selectedFile.name)) {
          setError('File name contains special characters. Please rename the file.');
          setFile(null);
          return;
        }
      }

      setFile(selectedFile);
    },
    [allowedTypes, maxSize, validateFileName]
  );

  const resetFile = useCallback(() => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    file,
    error,
    fileInputRef,
    handleFileChange,
    resetFile,
    openFileDialog,
  };
}

export default useFileUpload;
