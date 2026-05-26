import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportContractToPdf(contract: any) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(15, 168, 143);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('AGREE', 14, 18);

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
    const descLines = doc.splitTextToSize(contract.description, pageWidth - 28);
    doc.text(descLines, 14, afterTable + 7);
  }

  // Content
  if (contract.content) {
    const contentY = contract.description
      ? afterTable + 15 + (doc.splitTextToSize(contract.description, pageWidth - 28).length * 5)
      : afterTable;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(13, 17, 23);
    doc.text('Conteúdo do Contrato', 14, contentY);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    const contentLines = doc.splitTextToSize(contract.content, pageWidth - 28);

    // Add pages if needed
    let y = contentY + 8;
    const pageHeight = doc.internal.pageSize.getHeight();
    contentLines.forEach((line: string) => {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 14, y);
      y += 5;
    });
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

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Agree — Sistema de Gestão de Contratos | Página ${i} de ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  doc.save(`${contract.title || 'contrato'}.pdf`);
}

export function exportContractListToPdf(contracts: any[]) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(15, 168, 143);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('AGREE', 14, 18);
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
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `Agree — Sistema de Gestão de Contratos | Página ${i} de ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  doc.save('relatorio-contratos.pdf');
}
