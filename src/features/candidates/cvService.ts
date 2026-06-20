// @ts-nocheck
import { supabase } from '../../lib/supabase';
import type { CVAnalysisData } from '../../hooks/useCandidateForm';

/**
 * Sanitize file name - remove special characters
 */
function sanitizeFileName(fileName: string): string {
  // Get file extension
  const lastDot = fileName.lastIndexOf('.');
  const ext = lastDot !== -1 ? fileName.slice(lastDot) : '';
  const name = lastDot !== -1 ? fileName.slice(0, lastDot) : fileName;
  
  // Remove special characters, keep only alphanumeric, dash, underscore
  const sanitized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace special chars with underscore
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
  
  return `${sanitized || 'cv'}${ext}`;
}

/**
 * Upload CV file to Supabase Storage
 * @param file - File to upload
 * @param userId - User ID for folder organization
 * @returns Public URL of uploaded file
 */
export async function uploadCV(file: File, userId: string): Promise<string> {
  const sanitizedName = sanitizeFileName(file.name);
  const timestamp = Date.now();
  // Bucket: cv, folder: public/
  const filePath = `public/${userId}/${timestamp}_${sanitizedName}`;

  const { error: uploadError } = await supabase.storage
    .from('cv')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    throw new Error(`Không thể upload CV: ${uploadError.message}`);
  }

  // Trả về đường dẫn tương đối (relative path) để lưu vào DB
  // KHÔNG dùng getPublicUrl vì bucket 'cv' đã chuyển sang Private
  return filePath;
}

/**
 * Analyze CV using Edge Function
 * @param cvPath - Đường dẫn tương đối của CV trong bucket 'cv' (ví dụ: public/uuid/file.pdf)
 * @returns Extracted data from CV
 */
export async function analyzeCV(cvPath: string): Promise<CVAnalysisData> {
  // Tạo Signed URL (có thời hạn 10 phút) để Edge Function có thể fetch file
  const { data: signedData, error: signError } = await supabase.storage
    .from('cv')
    .createSignedUrl(cvPath, 600); // 600 giây = 10 phút (đủ cho AI phân tích)

  if (signError || !signedData) {
    console.error('Signed URL error:', signError);
    throw new Error('Không thể tạo link truy cập CV. Vui lòng thử lại.');
  }

  const { data, error } = await supabase.functions.invoke('analyze-cv', {
    body: { cvUrl: signedData.signedUrl },
  });

  if (error) {
    console.error('Analyze CV error:', error);
    throw new Error(`Không thể phân tích CV: ${error.message}`);
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Phân tích CV thất bại');
  }

  return data.data as CVAnalysisData;
}
