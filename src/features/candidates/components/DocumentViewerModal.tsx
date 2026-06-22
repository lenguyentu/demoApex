// @ts-nocheck
import { useEffect, useState, useRef } from 'react';
import { X, FileText, Loader2 } from 'lucide-react';
import { renderAsync } from 'docx-preview';
import { supabase } from '../../../lib/supabase';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cvUrl?: string | null;
  evaluationUrl?: string | null;
  initialTab?: 'cv' | 'evaluation';
}

type ViewerMode = 'pdf' | 'office' | 'docx-preview' | null;

// Bỏ hàm getFullStorageUrl đồng bộ cũ vì CV cần fetch async Signed URL

export function DocumentViewerModal({ 
  isOpen, 
  onClose, 
  cvUrl,
  evaluationUrl,
  initialTab = 'evaluation'
}: DocumentViewerModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerMode, setViewerMode] = useState<ViewerMode>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'cv' | 'evaluation'>('evaluation');
  const [resolvedFullUrl, setResolvedFullUrl] = useState<string | null>(null);
  
  /* Cache để lưu trữ blob URLs cho session hiện tại */
  const blobCache = useRef<Record<string, string>>({});
  
  const containerRef = useRef<HTMLDivElement>(null);
  const fileUrl = activeTab === 'cv' ? cvUrl : evaluationUrl;
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Cleanup blob URLs khi unmount
  useEffect(() => {
    return () => {
      // Revoke tất cả blob URLs trong cache
      Object.values(blobCache.current).forEach(url => {
        if (url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
        }
      });
      blobCache.current = {};
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setViewerMode(null);
      // Không clear cache khi đóng modal để mở lại nhanh hơn nếu cần
      // Nhưng nếu muốn tiết kiệm mem thì clear ở đây cũng được. 
      // User yêu cầu "max ping" -> giữ cache trong session modal.
      return;
    }
    
    // Reset active tab on open based on props
    if (initialTab) {
       if (initialTab === 'cv' && !cvUrl && evaluationUrl) setActiveTab('evaluation');
       else if (initialTab === 'evaluation' && !evaluationUrl && cvUrl) setActiveTab('cv');
       else setActiveTab(initialTab);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !fileUrl) {
       if (isOpen) {
           setError('No document available.');
           setViewerMode(null);
           setIsLoading(false);
           setResolvedFullUrl(null);
       }
       return;
    }

    const loadDocument = async () => {
      setIsLoading(true);
      setError(null);

      let fullUrl = '';
      if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
        fullUrl = fileUrl;
      } else if (activeTab === 'cv') {
        const { data, error } = await supabase.storage.from('cv').createSignedUrl(fileUrl, 3600);
        if (error || !data) {
          setError('No access to this CV (RLS Error).');
          setIsLoading(false);
          return;
        }
        fullUrl = data.signedUrl;
      } else {
        // Tài liệu đánh giá là Public, dùng getPublicUrl bình thường
        const { data } = supabase.storage.from('evaluation-files').getPublicUrl(fileUrl);
        fullUrl = data.publicUrl;
      }

      setResolvedFullUrl(fullUrl);
      const fileExtension = fileUrl.toLowerCase().split('.').pop();
      
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }

      // Kiểm tra cache trước
      if (fileExtension === 'pdf' && blobCache.current[fullUrl]) {
          console.log('Using cached PDF blob');
          setViewerMode('pdf');
          setBlobUrl(blobCache.current[fullUrl]);
          setIsLoading(false);
          return;
      }

      // PDF - fetch blob và tạo object URL
      if (fileExtension === 'pdf') {
        setViewerMode('pdf');
        setBlobUrl(null); 
        
        fetch(fullUrl, {
          mode: 'cors',
          cache: 'force-cache',
        })
          .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.blob();
          })
          .then(blob => {
            const pdfBlob = new Blob([blob], { type: 'application/pdf' });
            const newBlobUrl = URL.createObjectURL(pdfBlob);
            
            // Lưu vào cache
            blobCache.current[fullUrl] = newBlobUrl;
            
            setBlobUrl(newBlobUrl);
            setIsLoading(false);
          })
          .catch(err => {
            console.error('Error loading PDF:', err);
            const googleUrl = `google:${fullUrl}`;
            blobCache.current[fullUrl] = googleUrl; // Cache fallback URL too
            setBlobUrl(googleUrl);
            setIsLoading(false);
          });
        return;
      }

      // Kiểm tra định dạng file DOC/DOCX
      if (fileExtension !== 'docx' && fileExtension !== 'doc') {
        setError('Only PDF, DOC, and DOCX files are supported. Please download to view.');
        setIsLoading(false);
        setViewerMode(null);
        return;
      }

      if (fileExtension === 'doc') {
        setViewerMode('office');
        setIsLoading(false);
        return;
      }

      // DOCX
      setViewerMode('docx-preview');
      
      fetch(fullUrl, {
        mode: 'cors',
        cache: 'force-cache',
      })
        .then(response => {
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return response.blob();
        })
        .then(blob => {
          if (!containerRef.current) throw new Error('Container not available');
          return renderAsync(blob, containerRef.current, undefined, {
              className: 'docx-wrapper',
              inWrapper: true,
              useBase64URL: true,
          });
        })
        .then(() => setIsLoading(false))
        .catch(err => {
          console.error('Error rendering DOCX fallback:', err);
          setViewerMode('office');
          setIsLoading(false);
        });
    };

    loadDocument();
  }, [isOpen, fileUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/30 bg-opacity-70" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[80vh] flex flex-col m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
           <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-900 border-r border-gray-300 pr-4">View Document</h3>
              
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                    onClick={() => setActiveTab('cv')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                    activeTab === 'cv' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-900'
                    } ${!cvUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!cvUrl}
                >
                    CV
                </button>
                <button
                    onClick={() => setActiveTab('evaluation')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                    activeTab === 'evaluation' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-900'
                    } ${!evaluationUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!evaluationUrl}
                >
                    Evaluation
                </button>
              </div>
           </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-0 relative flex flex-col">
          {/* PDF Viewer */}
          {viewerMode === 'pdf' && blobUrl && (
            <div className="flex-1 w-full h-full min-h-0">
              {!blobUrl.startsWith('google:') ? (
                <object
                  data={blobUrl}
                  type="application/pdf"
                  className="w-full h-full"
                >
                  <iframe
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(resolvedFullUrl || '')}&embedded=true`}
                    className="w-full h-full border-0"
                    title="PDF Viewer"
                  />
                </object>
              ) : (
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(blobUrl.replace('google:', ''))}&embedded=true`}
                  className="w-full h-full border-0"
                  title="PDF Viewer"
                />
              )}
            </div>
          )}

          {/* Microsoft Office Online Viewer */}
          {viewerMode === 'office' && resolvedFullUrl && (
            <div className="flex-1 w-full h-full min-h-0">
              <iframe
                ref={iframeRef}
                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(resolvedFullUrl)}`}
                className="w-full h-full border-0"
                title="Document Viewer"
                allow="fullscreen"
              />
            </div>
          )}

          {/* docx-preview container */}
          {viewerMode === 'docx-preview' && !error && (
            <div 
              className="flex-1 overflow-y-auto overflow-x-auto p-6 min-h-0" 
            >
              <div 
                ref={containerRef}
                className="docx-wrapper"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  minHeight: '100%',
                }}
              />
            </div>
          )}
          
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
              <div className="flex items-center">
                <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
                <span className="ml-3 text-gray-600">Loading document...</span>
              </div>
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="text-center py-8 px-6">
                <p className="text-red-600 mb-4">{error}</p>
                <a
                  href={resolvedFullUrl || '#'}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Download
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
