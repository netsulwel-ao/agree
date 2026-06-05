import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import AgreeLogoUrl from '../Agree-logo.svg';

let logoDataUrl: string | null = null;

async function getLogoDataUrl(): Promise<string> {
  if (logoDataUrl) return logoDataUrl;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 80;
      canvas.height = 80;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('No canvas context')); return; }
      ctx.fillStyle = '#0fa88f';
      ctx.fillRect(0, 0, 80, 80);
      ctx.drawImage(img, 0, 0, 80, 80);
      logoDataUrl = canvas.toDataURL('image/png');
      resolve(logoDataUrl);
    };
    img.onerror = () => reject(new Error('Failed to load logo'));
    img.src = AgreeLogoUrl;
  });
}

function addWatermark(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.saveGraphicsState();
  doc.setGState(new (doc as any).GState({ opacity: 0.06 }));
  doc.setFontSize(72);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Agree', pageWidth / 2, pageHeight / 2, { align: 'center', angle: -30 });
  doc.restoreGraphicsState();
}

function addFreeFooter(doc: jsPDF, pageNum: number, totalPages: number, logoImg?: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  // Branding bar
  doc.setFillColor(15, 168, 143);
  doc.rect(0, pageHeight - 6, pageWidth, 6, 'F');
  // Logo SVG image
  if (logoImg) {
    doc.addImage(logoImg, 'PNG', pageWidth - 46, pageHeight - 15, 9, 9, undefined, 'FAST');
  }
  // Agree text
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Agree', pageWidth - 34, pageHeight - 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.text('free plan', pageWidth - 34, pageHeight - 3.5);

  // Page number
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.setFont('helvetica', 'normal');
  doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth / 2, pageHeight - 16, { align: 'center' });
}

export async function exportContractToPdf(contract: any) {
  const logoImg = await getLogoDataUrl();

  // ── Template HTML (full design) → render via html2canvas ──
  if (contract.content && (
    contract.content.trim().startsWith('<!DOCTYPE html>') ||
    contract.content.trim().startsWith('<html') ||
    contract.content.includes('Cormorant Garamond')
  )) {
    try {
      await exportTemplateAsImage(contract.content, contract.title, logoImg);
      return;
    } catch (e) {
      console.error('Template image export failed, falling back to legacy layout:', e);
    }
  }

  // ── Legacy / plain-text contracts → keep Agree layout ──
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Watermark
  addWatermark(doc);

  // Header
  doc.setFillColor(15, 168, 143);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Agree', 14, 18);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Gestão de Contratos', 14, 28);

  // Title
  doc.setTextColor(13, 17, 23);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(contract.title || 'Contrato', 14, 55);

  // Status badge
  const statusColors: Record<string, [number, number, number]> = {
    approved: [15, 168, 143],
    pending: [245, 158, 11],
    rejected: [239, 68, 68],
    draft: [107, 114, 128],
  };
  const statusLabels: Record<string, string> = {
    approved: 'Assinado',
    pending: 'Pendente',
    rejected: 'Rejeitado',
    draft: 'Rascunho',
  };
  const [r, g, b] = statusColors[contract.status] || [107, 114, 128];
  doc.setFillColor(r, g, b);
  doc.roundedRect(14, 60, 40, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(statusLabels[contract.status] || contract.status, 16, 65.5);

  // Info table
  doc.setTextColor(13, 17, 23);
  autoTable(doc, {
    startY: 75,
    head: [['Campo', 'Valor']],
    body: [
      ['Valor do Contrato', contract.value ? new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(contract.value) : 'N/A'],
      ['Nível de Risco', contract.risk_level === 'high' ? 'Alto' : contract.risk_level === 'medium' ? 'Médio' : 'Baixo'],
      ['Data de Início', contract.start_date ? new Date(contract.start_date).toLocaleDateString('pt-AO') : 'N/A'],
      ['Data de Término', contract.end_date ? new Date(contract.end_date).toLocaleDateString('pt-AO') : 'N/A'],
      ['Versão', `v${contract.version || '1.0'}`],
      ['Criado em', contract.created_at ? new Date(contract.created_at).toLocaleDateString('pt-AO') : 'N/A'],
    ],
    headStyles: { fillColor: [15, 168, 143], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 249] },
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
  });

  const afterTable = (doc as any).lastAutoTable.finalY + 10;

  // Description
  if (contract.description) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(13, 17, 23);
    doc.text('Descrição', 14, afterTable);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    const plainDesc = contract.description.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
    const descLines = doc.splitTextToSize(plainDesc, pageWidth - 28);
    doc.text(descLines, 14, afterTable + 7);
  }

  // Content (render HTML with styles)
  if (contract.content) {
    const contentY = contract.description
      ? afterTable + 15 + (doc.splitTextToSize(contract.description, pageWidth - 28).length * 5)
      : afterTable;

    let htmlContent = `
      <div style="font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;font-size:11px;line-height:1.6;padding:0 10px;">
        ${contract.content}
      </div>
    `;
    if (contract.risks && contract.risks.length > 0) {
      htmlContent += `
        <div style="margin-top:30px;padding-top:20px;border-top:1px solid #e2e5e9;">
          <h2 style="font-size:14px;font-weight:700;color:#0d1117;font-family:Georgia,serif;">Riscos Identificados</h2>
          ${contract.risks.map((r: any) => `
            <div style="margin-top:10px;padding:10px 14px;border-left:3px solid ${r.severity === 'high' ? '#ef4444' : r.severity === 'medium' ? '#f59e0b' : '#0fa88f'};background:#f9fafb;">
              <strong style="font-size:10px;text-transform:uppercase;color:${r.severity === 'high' ? '#ef4444' : r.severity === 'medium' ? '#f59e0b' : '#0fa88f'};">
                ${r.severity === 'high' ? 'Alto' : r.severity === 'medium' ? 'M\u00e9dio' : 'Baixo'}
              </strong>
              <p style="margin:4px 0 0;font-size:10px;color:#374151;">${r.description}</p>
            </div>
          `).join('')}
        </div>
      `;
    }
    doc.html(htmlContent, {
      x: 14,
      y: contentY + 8,
      width: pageWidth - 28,
      callback: () => {
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          if (i > 1) addWatermark(doc);
          addFreeFooter(doc, i, totalPages, logoImg);
        }
        doc.save(`${contract.title || 'contrato'}.pdf`);
      },
      margin: [10, 10, 20, 10],
      autoPaging: 'text',
    });
    return;
  }

  // Risks
  if (contract.risks && contract.risks.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(13, 17, 23);
    doc.text('Riscos Identificados', 14, 20);

    autoTable(doc, {
      startY: 28,
      head: [['Severidade', 'Descrição']],
      body: contract.risks.map((r: any) => [
        r.severity === 'high' ? 'Alto' : r.severity === 'medium' ? 'Médio' : 'Baixo',
        r.description
      ]),
      headStyles: { fillColor: [15, 168, 143], textColor: 255, fontStyle: 'bold' },
      bodyStyles: { fontSize: 10 },
      columnStyles: { 0: { cellWidth: 30, fontStyle: 'bold' } },
      didParseCell: (data: any) => {
        if (data.column.index === 0 && data.section === 'body') {
          const val = data.cell.raw as string;
          if (val === 'Alto') data.cell.styles.textColor = [239, 68, 68];
          else if (val === 'Médio') data.cell.styles.textColor = [245, 158, 11];
          else data.cell.styles.textColor = [15, 168, 143];
        }
      }
    });
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFreeFooter(doc, i, totalPages, logoImg);
  }

  doc.save(`${contract.title || 'contrato'}.pdf`);
}

async function exportTemplateAsImage(html: string, title: string | undefined, logoImg: string | undefined) {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '820px';
  container.style.zIndex = '-1000';
  container.style.background = '#fff';
  container.innerHTML = html;
  document.body.appendChild(container);

  await document.fonts.ready;

  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  document.body.removeChild(container);

  const imgData = canvas.toDataURL('image/png');
  const imgProps = canvas.width / canvas.height;
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const pdfImgWidth = pageWidth - 10;
  const pdfImgHeight = pdfImgWidth / imgProps;

  let remainingHeight = pdfImgHeight;
  let yPos = 0;
  let pageNum = 1;

  while (remainingHeight > 0) {
    if (pageNum > 1) pdf.addPage();

    // Watermark
    pdf.saveGraphicsState();
    pdf.setGState(new (pdf as any).GState({ opacity: 0.06 }));
    pdf.setFontSize(72);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Agree', pageWidth / 2, pageHeight / 2, { align: 'center', angle: -30 });
    pdf.restoreGraphicsState();

    const usableH = pageHeight - 12;
    const sliceH = Math.min(remainingHeight, usableH);
    const srcY = (pdfImgHeight - remainingHeight) / pdfImgHeight * canvas.height;
    const sliceCanvasH = sliceH / pdfImgHeight * canvas.height;
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = Math.ceil(sliceCanvasH);
    const ctx = sliceCanvas.getContext('2d')!;
    ctx.drawImage(canvas, 0, srcY, canvas.width, sliceCanvasH, 0, 0, canvas.width, sliceCanvasH);
    const sliceData = sliceCanvas.toDataURL('image/png');
    pdf.addImage(sliceData, 'PNG', 5, 5, pdfImgWidth, sliceH);

    // Footer branding
    pdf.setFillColor(15, 168, 143);
    pdf.rect(0, pageHeight - 5, pageWidth, 5, 'F');
    if (logoImg) {
      pdf.addImage(logoImg, 'PNG', pageWidth - 42, pageHeight - 13, 8, 8, undefined, 'FAST');
    }
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Agree', pageWidth - 31, pageHeight - 6.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(4.5);
    pdf.text('free plan', pageWidth - 31, pageHeight - 3.5);
    pdf.setFontSize(7);
    pdf.setTextColor(156, 163, 175);
    pdf.text(`Página ${pageNum}`, pageWidth / 2, pageHeight - 14, { align: 'center' });

    remainingHeight -= sliceH;
    pageNum++;
  }

  pdf.save(`${title || 'contrato'}.pdf`);
}

export async function exportContractListToPdf(contracts: any[]) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const logoImg = await getLogoDataUrl();

  // Watermark
  addWatermark(doc);

  // Header
  doc.setFillColor(15, 168, 143);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Agree', 14, 18);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Relatório de Contratos', 14, 28);

  // Date
  doc.setTextColor(13, 17, 23);
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-AO')}`, 14, 50);
  doc.text(`Total de contratos: ${contracts.length}`, 14, 57);

  // Table
  autoTable(doc, {
    startY: 65,
    head: [['Título', 'Status', 'Risco', 'Valor', 'Vencimento']],
    body: contracts.map(c => [
      c.title,
      c.status === 'approved' ? 'Assinado' : c.status === 'pending' ? 'Pendente' : c.status === 'rejected' ? 'Rejeitado' : 'Rascunho',
      c.risk_level === 'high' ? 'Alto' : c.risk_level === 'medium' ? 'Médio' : 'Baixo',
      c.value ? new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(c.value) : 'N/A',
      c.end_date ? new Date(c.end_date).toLocaleDateString('pt-AO') : 'N/A',
    ]),
    headStyles: { fillColor: [15, 168, 143], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 249] },
    styles: { fontSize: 9, cellPadding: 4 },
  });

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFreeFooter(doc, i, totalPages, logoImg);
  }

  doc.save('relatorio-contratos.pdf');
}
