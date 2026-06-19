import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

/**
 * Temporarily insert a title header above the capture area, 
 * take screenshot, then remove it.
 */
const withTitle = async (
  element: HTMLElement, 
  title: string | undefined,
  callback: (el: HTMLElement) => Promise<void>
) => {
  let titleEl: HTMLDivElement | null = null;

  if (title) {
    titleEl = document.createElement('div');
    titleEl.style.cssText = `
      padding: 16px 20px; 
      font-size: 18px; 
      font-weight: 800; 
      color: #111827;
      border-bottom: 2px solid #e5e7eb;
      margin-bottom: 8px;
      font-family: system-ui, sans-serif;
    `;
    titleEl.textContent = title;
    element.prepend(titleEl);
  }

  // Hide action buttons that shouldn't appear in exports
  const hiddenEls = element.querySelectorAll<HTMLElement>('.export-hidden');
  hiddenEls.forEach(el => { el.style.visibility = 'hidden'; });

  try {
    await callback(element);
  } finally {
    if (titleEl) titleEl.remove();
    hiddenEls.forEach(el => { el.style.visibility = ''; });
  }
};

/**
 * Export a DOM element to a PDF with infinite scroll (no page breaks).
 */
export const exportToPDF = async (
  elementId: string, 
  fileName: string,
  setLoading?: (v: boolean) => void,
  title?: string
) => {
  setLoading?.(true);
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      toast.error('Không tìm thấy nội dung để xuất');
      return;
    }

    await withTitle(element, title, async (el) => {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdfWidth = 297;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: 'l',
        unit: 'mm',
        format: [pdfWidth, pdfHeight],
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${fileName}.pdf`);
    });

    toast.success('Đã xuất PDF thành công!');
  } catch (error) {
    console.error('Error exporting PDF:', error);
    toast.error('Có lỗi khi xuất PDF');
  } finally {
    setLoading?.(false);
  }
};

/**
 * Export a DOM element to a PNG image with high resolution.
 */
export const exportToImage = async (
  elementId: string,
  fileName: string,
  setLoading?: (v: boolean) => void,
  title?: string
) => {
  setLoading?.(true);
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      toast.error('Không tìm thấy nội dung để xuất');
      return;
    }

    await withTitle(element, title, async (el) => {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
      });

      const link = document.createElement('a');
      link.download = `${fileName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });

    toast.success('Đã xuất ảnh thành công!');
  } catch (error) {
    console.error('Error exporting image:', error);
    toast.error('Có lỗi khi xuất ảnh');
  } finally {
    setLoading?.(false);
  }
};

/**
 * Export data rows to an Excel (.xlsx) file.
 */
export const exportToExcel = (
  rows: Record<string, any>[],
  headers: { key: string; label: string }[],
  fileName: string
) => {
  try {
    const wsData = [
      headers.map(h => h.label),
      ...rows.map(row => headers.map(h => row[h.key] ?? ''))
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    const colWidths = headers.map((h) => {
      const maxLen = Math.max(
        h.label.length,
        ...rows.map(r => String(r[h.key] ?? '').length)
      );
      return { wch: Math.min(maxLen + 4, 40) };
    });
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `${fileName}.xlsx`);
    toast.success('Đã xuất Excel thành công!');
  } catch (error) {
    console.error('Error exporting Excel:', error);
    toast.error('Có lỗi khi xuất Excel');
  }
};

/**
 * Specialized Export for Debt Tracking Table (Nested Headers & Merging)
 */
export const exportToDebtExcel = (
  data: {
    monthHeaders: string[]; // e.g. ["Tháng 4/2026", "Tháng 5/2026"]
    rows: any[];
    grandTotal: any;
  },
  fileName: string
) => {
  try {
    const { monthHeaders, rows, grandTotal } = data;
    const wsData: any[][] = [];

    // --- ROW 1: TOP HEADERS ---
    const header1 = ['Khách hàng / Vị trí / Ứng viên', 'Số case', 'Nợ phát sinh', 'Đã TT'];
    const colCountBeforeMonths = header1.length;
    // Add "Dự kiến thu công nợ theo tháng" merged header
    header1.push('Dự kiến thu công nợ theo tháng');
    // Pad with empty strings for merging
    for (let i = 0; i < (monthHeaders.length * 2) - 1; i++) header1.push('');
    header1.push('Trạng thái');
    wsData.push(header1);

    // --- ROW 2: MONTH HEADERS ---
    const header2 = ['', '', '', ''];
    monthHeaders.forEach(m => {
      header2.push(m);
      header2.push(''); // Pad for merging 2 cols per month
    });
    header2.push('');
    wsData.push(header2);

    // --- ROW 3: SUB HEADERS ---
    const header3 = ['', '', '', ''];
    monthHeaders.forEach(() => {
      header3.push('Số tiền');
      header3.push('Ngày hạn');
    });
    header3.push('');
    wsData.push(header3);

    // --- ROWS: DATA ---
    rows.forEach(r => {
      const rowArr = [
        r.name,
        r.cases || '',
        r.incurred || 0,
        r.paid || 0,
      ];
      // Monthly data
      monthHeaders.forEach((_, idx) => {
        rowArr.push(r.months[idx]?.amount || 0);
        rowArr.push(r.months[idx]?.date || '');
      });
      rowArr.push(r.status || '');
      wsData.push(rowArr);
    });

    // --- FOOTER: GRAND TOTAL ---
    const footerArr = [
      'TỔNG CỘNG',
      '',
      grandTotal.incurred,
      grandTotal.paid,
    ];
    monthHeaders.forEach((_, idx) => {
      footerArr.push(grandTotal.months[idx]?.amount || 0);
      footerArr.push('');
    });
    footerArr.push('');
    wsData.push(footerArr);

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // --- CELL MERGES ---
    const merges: XLSX.Range[] = [];
    
    // Merge Top Headers (Khách hàng, Số case, etc.) vertically across 3 rows
    for (let col = 0; col < colCountBeforeMonths; col++) {
      merges.push({ s: { r: 0, c: col }, e: { r: 2, c: col } });
    }
    // Merge Last column (Trạng thái) vertically
    const lastColIdx = colCountBeforeMonths + (monthHeaders.length * 2);
    merges.push({ s: { r: 0, c: lastColIdx }, e: { r: 2, c: lastColIdx } });

    // Merge "Dự kiến thu..." horizontally
    merges.push({ s: { r: 0, c: colCountBeforeMonths }, e: { r: 0, c: lastColIdx - 1 } });

    // Merge Monthly headers horizontally across 2 cols
    monthHeaders.forEach((_, i) => {
       const startCol = colCountBeforeMonths + (i * 2);
       merges.push({ s: { r: 1, c: startCol }, e: { r: 1, c: startCol + 1 } });
    });

    ws['!merges'] = merges;
    
    // Set column widths
    ws['!cols'] = [
      { wch: 40 }, // Name
      { wch: 8 },  // Cases
      { wch: 15 }, // Incurred
      { wch: 15 }, // Paid
      ...monthHeaders.flatMap(() => [{ wch: 12 }, { wch: 12 }]), // Months
      { wch: 10 }  // Status
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Công nợ');
    XLSX.writeFile(wb, `${fileName}.xlsx`);
    toast.success('Đã xuất Excel chuyên sâu thành công!');

  } catch (error) {
    console.error('Advanced Excel Export Error:', error);
    toast.error('Có lỗi khi xuất Excel nâng cao');
  }
};
