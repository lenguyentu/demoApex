// @ts-nocheck
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Job } from '../types';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';

/** Tăng khi đổi cách render PDF để không tái sử dụng file storage cũ (canvas/cache). */
const JD_PDF_GEN_VERSION = 2;

/** Dùng cho tên file PDF: đổi khi JD thay đổi để không trả về bản cache cũ từ storage. */
const pdfContentFingerprint = (job: Job): string => {
  const key = [
    String(JD_PDF_GEN_VERSION),
    job.job_summary || '',
    job.position_title || '',
    job.min_monthly_salary || '',
    job.max_monthly_salary || '',
    job.work_location || '',
  ].join('\x1e');
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `${(h >>> 0).toString(36)}_${key.length}`;
};

const generateStyledHTML = (job: Job): string => {
  if (!job) return '';
  
  const salary = (job.min_monthly_salary && job.max_monthly_salary) 
    ? `${job.min_monthly_salary} - ${job.max_monthly_salary}` 
    : job.max_monthly_salary || "Thỏa thuận";
  
  // --- XỬ LÝ HTML (Logic tối ưu: Replace LI bằng DIV Flex) ---
  const rawHtml = job.job_summary || "<p>Chưa có mô tả.</p>";
  
  // 1. Xử lý thẻ p thừa trong li
  let cleanHtml = rawHtml
    .replace(/<li[^>]*>\s*<p[^>]*>/gi, '<li>') 
    .replace(/<\/p>\s*<\/li>/gi, '</li>');

  // 2. Xóa thẻ bao danh sách (ul/ol)
  cleanHtml = cleanHtml.replace(/<\/?ul[^>]*>/gi, '').replace(/<\/?ol[^>]*>/gi, '');

  // 3. Thay thế li bằng div flex để thẳng hàng đẹp hơn
  cleanHtml = cleanHtml
    .replace(/<li[^>]*>/gi, `
      <div style="display: flex; align-items: flex-start; margin-bottom: 6px;">
        <span style="white-space: nowrap; margin-right: 8px; font-weight: bold;">-</span>
        <span>
    `)
    .replace(/<\/li>/gi, '</span></div>');

  // Màu tím trích xuất từ logo
  const brandPurple = "#3E2B56"; 
  const brandPink = "#D61F69";

  return `
    <!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>Job Description</title>
    <style>
      body { 
        font-family: Arial, sans-serif; 
        font-size: 11pt; 
        line-height: 1.5; 
        color: #333; 
        background-color: white; 
        margin: 0; padding: 0;
      }
      .page-container {
        padding: 40px 50px;
        position: relative;
        min-height: 100vh;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
      }
      
      /* HEADER */
      .header { display: flex; align-items: center; gap: 15px; margin-bottom: 25px; }
      .logo img { height: 60px; width: auto; object-fit: contain; }
      .company-info {
        font-size: 14pt;
        font-weight: 700;
        color: ${brandPink};
        text-transform: uppercase;
        line-height: 1.2;
      }
      .company-slogan {
        display: block;
        font-size: 9pt;
        /* Đổi màu slogan sang màu tím như trong ảnh logo */
        color: ${brandPurple}; 
        text-transform: none;
        font-weight: 600; /* Tăng độ đậm lên một chút cho rõ */
        margin-top: 2px;
      }
      
      /* JOB TITLE */
      .job-title-section { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #f0f0f0; padding-bottom: 15px; }
      .job-title { font-size: 20pt; font-weight: 700; color: #0F2C67; text-transform: uppercase; margin: 0 0 8px 0; letter-spacing: 1px; }
      .job-meta { color: ${brandPink}; font-size: 12pt; font-weight: 500; }

      /* BODY CONTENT */
      .content-body { font-size: 11pt; color: #444; text-align: justify; flex-grow: 1; }
      .content-body p { margin-bottom: 8px; margin-top: 0; }
      
      /* Styling headings trong nội dung */
      .content-body h1, .content-body h2, .content-body h3 {
        color: #0F2C67; font-size: 13pt; font-weight: 700; 
        margin-top: 20px; margin-bottom: 10px; text-transform: uppercase;
      }

      /* FOOTER - Cập nhật layout */
      .footer {
        /* Giảm margin-top để gần nội dung hơn */
        margin-top: 25px; 
        border-top: 1px solid #ddd;
        padding-top: 10px;
        
        /* Flexbox để chia trái phải */
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        font-size: 9pt;
        color: ${brandPurple}; /* Dùng màu tím cho footer luôn cho đẹp */
        font-weight: 500;
      }
      
      .footer-right {
        color: #D61F69;
        text-decoration: none;
      }

    </style></head><body>
      
      <div class="page-container">
        
        <!-- Header -->
        <div class="header">
          <div class="logo">
             <img src="/logoCompany.png" alt="TD Consulting Logo" /> 
          </div>
          <div class="company-info">
            TD CONSULTING
            <span class="company-slogan">a trusted Recruitment partner</span>
          </div>
        </div>

        <!-- Title -->
        <div class="job-title-section">
          <h1 class="job-title">${job.position_title}</h1>
          <div class="job-meta">
            ${salary} • ${job.work_location || "Hà Nội"}
          </div>
        </div>

        <!-- Content -->
        <div class="content-body">
             ${cleanHtml}
        </div>

        <!-- Footer mới -->
        <div class="footer">
          <div class="footer-left">
            TD Consulting - a trusted Recruitment partner
          </div>
          <div class="footer-right">
            https://tdconsulting.vn/
          </div>
        </div>

      </div>
      
    </body></html>`;
};

const JD_PDF_BUCKET = 'public-assets';

export const generatePDF = async (
  job: Job | null,
  setIsGeneratingPDF: (isGenerating: boolean) => void
): Promise<string | null> => {
  if (!job) {
    toast.error('Không có dữ liệu công việc để tạo PDF.');
    return null;
  }
  setIsGeneratingPDF(true);
  const jobFolder = `${job.job_id || job.id || 'unknown-job'}`.replace(/[^\w-]/g, '_');
  const stableFilePath = `jobs/${jobFolder}/jd_${pdfContentFingerprint(job)}.pdf`;
  
  const tempIframe = document.createElement('iframe');
  try {
    // Không dùng list() để tránh cần SELECT policy trên storage.objects.
    // Kiểm tra tồn tại bằng public URL trực tiếp.
    const { data: existingUrlData } = supabase.storage.from(JD_PDF_BUCKET).getPublicUrl(stableFilePath);
    const existingPublicUrl = existingUrlData.publicUrl;
    try {
      const headResponse = await fetch(existingPublicUrl, { method: 'HEAD' });
      if (headResponse.ok) {
        toast.success('Đã sao chép link JD có sẵn');
        return existingPublicUrl;
      }
    } catch {
      // Nếu HEAD lỗi mạng/CORS thì tiếp tục flow upload bình thường.
    }

    // 1. Render HTML vào iframe ẩn
    tempIframe.style.position = 'absolute';
    tempIframe.style.left = '-9999px';
    tempIframe.style.width = '800px';
    document.body.appendChild(tempIframe);
    
    const styledHTML = generateStyledHTML(job);
    const iframeDoc = tempIframe.contentDocument;
    if (!iframeDoc) throw new Error('Cannot access iframe document');
    iframeDoc.open();
    iframeDoc.write(styledHTML);
    iframeDoc.close();
    
    await new Promise<void>(resolve => {
      let attempts = 0;
      const checkReady = () => {
        // Check if images are loaded
        const images = iframeDoc.images;
        let allLoaded = true;
        for (let i = 0; i < images.length; i++) {
          if (!images[i].complete) {
            allLoaded = false;
            break;
          }
        }

        if (iframeDoc.readyState === 'complete' && allLoaded) {
           setTimeout(resolve, 500); 
        } else {
           if (attempts < 50) { // Timeout after ~5s
              attempts++;
              setTimeout(checkReady, 100);
           } else {
              resolve(); // Proceed anyway
           }
        }
      };
      checkReady();
    });
    
    const iframeBody = iframeDoc.body;
    // Ensure height is captured
    tempIframe.style.height = `${iframeBody.scrollHeight}px`;

    // Trình duyệt giới hạn kích thước canvas; scale cố định 2 có thể cắt mất cuối trang JD dài.
    const maxCanvasEdgePx = 16000;
    const sh = iframeBody.scrollHeight;
    const sw = iframeBody.scrollWidth;
    let captureScale = 2;
    while (sh * captureScale > maxCanvasEdgePx || sw * captureScale > maxCanvasEdgePx) {
      captureScale -= 0.25;
      if (captureScale < 0.75) break;
    }

    // 2. Chụp iframe thành ảnh canvas
    const canvas = await html2canvas(iframeBody, {
      scale: captureScale,
      useCORS: true,
      allowTaint: true, // Sometimes needed for local images
      backgroundColor: '#ffffff',
      windowWidth: iframeBody.scrollWidth,
      windowHeight: iframeBody.scrollHeight,
    });

    // 3. Tính toán kích thước PDF
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
    });
    
    // 4. Chèn ảnh vào PDF
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    
    // 6. Upload file PDF lên storage public
    const pdfBlob = pdf.output('blob');

    const { error: uploadError } = await supabase.storage
      .from(JD_PDF_BUCKET)
      .upload(stableFilePath, pdfBlob, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'application/pdf',
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from(JD_PDF_BUCKET).getPublicUrl(stableFilePath);
    const publicUrl = data.publicUrl;

    toast.success('Đã tạo link JD thành công!');
    return publicUrl;

  } catch (error) {
    console.error('Error generating PDF:', error);
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes('row-level security')) {
      toast.error('Bạn không có quyền tạo link JD (chỉ role nội bộ được upload).');
    } else {
      toast.error('Có lỗi xảy ra khi tạo link JD.');
    }
    return null;
  } finally {
    if (document.body.contains(tempIframe)) {
       document.body.removeChild(tempIframe);
    }
    setIsGeneratingPDF(false);
  }
};
