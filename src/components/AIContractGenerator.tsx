import React, { useState, useRef } from 'react';
import { X, Loader2, ArrowRight, ArrowLeft, FileText, FileUp, Download } from 'lucide-react';
import { generateFullContract } from '../services/gemini';
import type { ContractAnswers } from '../services/gemini';
import jsPDF from 'jspdf';
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
      canvas.width = 24; canvas.height = 24;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('No canvas context')); return; }
      ctx.drawImage(img, 0, 0, 24, 24);
      logoDataUrl = canvas.toDataURL('image/png');
      resolve(logoDataUrl);
    };
    img.onerror = () => reject(new Error('Failed to load logo'));
    img.src = AgreeLogoUrl;
  });
}

const inputBase: React.CSSProperties = {
  width: '100%', padding: '10px 14px', fontSize: 14,
  background: '#fff', border: '1.5px solid #e2e5e9', outline: 'none',
  fontFamily: "'Poppins',sans-serif", boxSizing: 'border-box'
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280',
  marginBottom: 6, fontFamily: "'Poppins',sans-serif"
};

const tiposContrato = [
  'Compra e Venda', 'Prestação de Serviços', 'Prestação de Consultoria',
  'Contrato de Trabalho', 'Arrendamento', 'Acordo de Confidencialidade (NDA)',
  'Empreitada', 'Mandato', 'Sociedade', 'Outro'
];

interface FieldConfig {
  key: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'textarea' | 'date';
  required?: boolean;
}

const typeFields: Record<string, FieldConfig[]> = {
  'Compra e Venda': [
    { key: 'objecto', label: 'Objecto do Contrato', placeholder: 'Descreva o bem ou serviço a ser vendido...', type: 'textarea', required: true },
    { key: 'extra.condicoes_pagamento', label: 'Condições de Pagamento', placeholder: 'Ex: 50% no acto, 50% na entrega', type: 'textarea' },
    { key: 'valor', label: 'Valor (Kz)', placeholder: 'Ex: 5.000.000,00', required: true },
    { key: 'valor_extenso', label: 'Valor por Extenso', placeholder: 'Ex: Cinco milhões de kwanzas' },
    { key: 'prazo', label: 'Prazo de Entrega', placeholder: 'Ex: 30 dias úteis a contar da assinatura' },
    { key: 'penalidade', label: 'Penalidade por Incumprimento', placeholder: 'Ex: 10% do valor total' },
    { key: 'extra.garantia', label: 'Garantia', placeholder: 'Ex: 12 meses contra defeitos de fabrico' },
    { key: 'obrigacoes_a', label: 'Obrigações do Vendedor', type: 'textarea' },
    { key: 'obrigacoes_b', label: 'Obrigações do Comprador', type: 'textarea' },
    { key: 'data_celebracao', label: 'Data de Celebração', type: 'date' },
    { key: 'local_celebracao', label: 'Local de Celebração', placeholder: 'Ex: Luanda' },
    { key: 'foro', label: 'Foro / Tribunal Competente', placeholder: 'Ex: Comarca de Luanda' },
  ],
  'Prestação de Serviços': [
    { key: 'objecto', label: 'Descrição do Serviço', placeholder: 'Descreva detalhadamente o serviço a ser prestado...', type: 'textarea', required: true },
    { key: 'extra.condicoes_pagamento', label: 'Condições de Pagamento', placeholder: 'Ex: Pagamento mensal até ao dia 5', type: 'textarea' },
    { key: 'valor', label: 'Valor do Serviço (Kz)', placeholder: 'Ex: 2.500.000,00', required: true },
    { key: 'valor_extenso', label: 'Valor por Extenso', placeholder: 'Ex: Dois milhões e quinhentos mil kwanzas' },
    { key: 'prazo', label: 'Prazo de Execução', placeholder: 'Ex: 6 meses renováveis' },
    { key: 'penalidade', label: 'Penalidade por Incumprimento', placeholder: 'Ex: 2% ao mês sobre o valor' },
    { key: 'extra.entregaveis', label: 'Entregáveis / Marcos', placeholder: 'Ex: Relatório mensal, código fonte, documentação técnica', type: 'textarea' },
    { key: 'obrigacoes_a', label: 'Obrigações do Contratante', type: 'textarea' },
    { key: 'obrigacoes_b', label: 'Obrigações do Prestador', type: 'textarea' },
    { key: 'detalhes_adicionais', label: 'Detalhes Adicionais', type: 'textarea' },
    { key: 'data_celebracao', label: 'Data de Celebração', type: 'date' },
    { key: 'local_celebracao', label: 'Local de Celebração', placeholder: 'Ex: Luanda' },
    { key: 'foro', label: 'Foro / Tribunal Competente', placeholder: 'Ex: Comarca de Luanda' },
  ],
  'Prestação de Consultoria': [
    { key: 'objecto', label: 'Âmbito da Consultoria', placeholder: 'Descreva o objecto da consultoria...', type: 'textarea', required: true },
    { key: 'extra.condicoes_pagamento', label: 'Condições de Pagamento', placeholder: 'Ex: Honorários mensais de Kz 500.000,00', type: 'textarea' },
    { key: 'valor', label: 'Honorários (Kz)', placeholder: 'Ex: 3.000.000,00', required: true },
    { key: 'valor_extenso', label: 'Valor por Extenso' },
    { key: 'prazo', label: 'Duração da Consultoria', placeholder: 'Ex: 3 meses' },
    { key: 'extra.entregaveis', label: 'Entregáveis', placeholder: 'Ex: Relatório de diagnóstico, plano de acção', type: 'textarea' },
    { key: 'extra.honorarios_adicionais', label: 'Honorários Adicionais (deslocações, etc.)', placeholder: 'Ex: Despesas de viagem suportadas pelo contratante' },
    { key: 'obrigacoes_a', label: 'Obrigações do Contratante', type: 'textarea' },
    { key: 'obrigacoes_b', label: 'Obrigações do Consultor', type: 'textarea' },
    { key: 'data_celebracao', label: 'Data de Celebração', type: 'date' },
    { key: 'local_celebracao', label: 'Local de Celebração', placeholder: 'Ex: Luanda' },
    { key: 'foro', label: 'Foro / Tribunal Competente', placeholder: 'Ex: Comarca de Luanda' },
  ],
  'Contrato de Trabalho': [
    { key: 'extra.funcao', label: 'Função / Cargo', placeholder: 'Ex: Analista de Sistemas', required: true },
    { key: 'valor', label: 'Remuneração Base (Kz)', placeholder: 'Ex: 350.000,00', required: true },
    { key: 'extra.beneficios', label: 'Benefícios Adicionais', placeholder: 'Ex: Seguro de saúde, subsídio de alimentação, transporte', type: 'textarea' },
    { key: 'prazo', label: 'Período de Experiência', placeholder: 'Ex: 60 dias' },
    { key: 'extra.horario_trabalho', label: 'Horário de Trabalho', placeholder: 'Ex: Segunda a Sexta, 08h00-17h00' },
    { key: 'extra.local_trabalho', label: 'Local de Trabalho', placeholder: 'Ex: Luanda, sede da empresa' },
    { key: 'data_celebracao', label: 'Data de Admissão', type: 'date', required: true },
    { key: 'extra.duracao_contrato', label: 'Duração do Contrato', placeholder: 'Ex: Prazo certo de 12 meses / Sem termo / Temporário' },
    { key: 'obrigacoes_a', label: 'Obrigações do Empregador', type: 'textarea' },
    { key: 'obrigacoes_b', label: 'Obrigações do Trabalhador', type: 'textarea' },
    { key: 'penalidade', label: 'Penalidades / Justa Causa', placeholder: 'Ex: Falta grave, abandono, violação de deveres' },
    { key: 'local_celebracao', label: 'Local de Celebração', placeholder: 'Ex: Luanda' },
    { key: 'foro', label: 'Foro / Tribunal Competente', placeholder: 'Ex: Tribunal de Trabalho de Luanda' },
  ],
  'Arrendamento': [
    { key: 'objecto', label: 'Imóvel / Propriedade', placeholder: 'Descreva o imóvel a ser arrendado (morada, tipologia, área)...', type: 'textarea', required: true },
    { key: 'valor', label: 'Valor da Renda (Kz)', placeholder: 'Ex: 250.000,00', required: true },
    { key: 'valor_extenso', label: 'Valor por Extenso', placeholder: 'Ex: Duzentos e cinquenta mil kwanzas' },
    { key: 'extra.caucao', label: 'Caução / Depósito de Garantia', placeholder: 'Ex: 2 meses de renda (Kz 500.000,00)' },
    { key: 'prazo', label: 'Prazo do Arrendamento', placeholder: 'Ex: 12 meses, renovável automaticamente', required: true },
    { key: 'data_celebracao', label: 'Data de Início', type: 'date' },
    { key: 'extra.condicoes_pagamento', label: 'Condições de Pagamento', placeholder: 'Ex: Pagamento até ao dia 10 de cada mês', type: 'textarea' },
    { key: 'extra.encargos', label: 'Encargos / Despesas', placeholder: 'Ex: Água, luz e condomínio por conta do inquilino', type: 'textarea' },
    { key: 'obrigacoes_a', label: 'Obrigações do Senhorio', type: 'textarea' },
    { key: 'obrigacoes_b', label: 'Obrigações do Inquilino', type: 'textarea' },
    { key: 'penalidade', label: 'Penalidades (mora, danos)', placeholder: 'Ex: 5% ao mês sobre renda em atraso' },
    { key: 'local_celebracao', label: 'Local de Celebração', placeholder: 'Ex: Luanda' },
    { key: 'foro', label: 'Foro / Tribunal Competente', placeholder: 'Ex: Comarca de Luanda' },
  ],
  'Acordo de Confidencialidade (NDA)': [
    { key: 'objecto', label: 'Propósito da Divulgação', placeholder: 'Descreva o propósito pelo qual as partes trocarão informação confidencial...', type: 'textarea', required: true },
    { key: 'prazo', label: 'Prazo de Confidencialidade', placeholder: 'Ex: 5 anos após a assinatura', required: true },
    { key: 'extra.informacao_confidencial', label: 'Definição de Informação Confidencial', placeholder: 'Ex: Dados técnicos, financeiros, comerciais, know-how...', type: 'textarea' },
    { key: 'extra.exclusoes', label: 'Exclusões de Confidencialidade', placeholder: 'Ex: Informação pública, desenvolvida independentemente...', type: 'textarea' },
    { key: 'penalidade', label: 'Penalidade por Quebra de Sigilo', placeholder: 'Ex: Kz 5.000.000,00 de indemnização' },
    { key: 'obrigacoes_a', label: 'Obrigações da Parte Divulgadora', type: 'textarea' },
    { key: 'obrigacoes_b', label: 'Obrigações da Parte Receptora', type: 'textarea' },
    { key: 'data_celebracao', label: 'Data de Celebração', type: 'date' },
    { key: 'local_celebracao', label: 'Local de Celebração', placeholder: 'Ex: Luanda' },
    { key: 'foro', label: 'Foro / Tribunal Competente', placeholder: 'Ex: Comarca de Luanda' },
  ],
  'Empreitada': [
    { key: 'objecto', label: 'Descrição da Obra / Projecto', placeholder: 'Descreva detalhadamente a obra ou projecto...', type: 'textarea', required: true },
    { key: 'extra.condicoes_pagamento', label: 'Condições de Pagamento', placeholder: 'Ex: 30% no início, 40% a meio, 30% na conclusão', type: 'textarea' },
    { key: 'valor', label: 'Valor da Empreitada (Kz)', placeholder: 'Ex: 15.000.000,00', required: true },
    { key: 'valor_extenso', label: 'Valor por Extenso' },
    { key: 'prazo', label: 'Prazo de Execução', placeholder: 'Ex: 90 dias úteis', required: true },
    { key: 'penalidade', label: 'Penalidade por Atraso', placeholder: 'Ex: 0,5% do valor por dia de atraso' },
    { key: 'extra.materiais', label: 'Materiais / Especificações Técnicas', placeholder: 'Ex: Materiais a cargo do empreiteiro, conforme caderno de encargos', type: 'textarea' },
    { key: 'extra.garantia', label: 'Garantia da Obra', placeholder: 'Ex: 5 anos para vícios ocultos' },
    { key: 'obrigacoes_a', label: 'Obrigações do Dono da Obra', type: 'textarea' },
    { key: 'obrigacoes_b', label: 'Obrigações do Empreiteiro', type: 'textarea' },
    { key: 'data_celebracao', label: 'Data de Celebração', type: 'date' },
    { key: 'local_celebracao', label: 'Local de Celebração', placeholder: 'Ex: Luanda' },
    { key: 'foro', label: 'Foro / Tribunal Competente', placeholder: 'Ex: Comarca de Luanda' },
  ],
  'Mandato': [
    { key: 'objecto', label: 'Objecto do Mandato', placeholder: 'Descreva o mandato conferido...', type: 'textarea', required: true },
    { key: 'extra.condicoes_pagamento', label: 'Remuneração do Mandatário', placeholder: 'Ex: Comissão de 5% sobre o valor do negócio', type: 'textarea' },
    { key: 'valor', label: 'Valor / Comissão (Kz)', placeholder: 'Ex: 500.000,00' },
    { key: 'prazo', label: 'Prazo do Mandato', placeholder: 'Ex: 6 meses', required: true },
    { key: 'extra.poderes', label: 'Poderes Concedidos', placeholder: 'Ex: Poderes gerais de administração, poderes especiais para..., subdelegação autorizada?', type: 'textarea' },
    { key: 'obrigacoes_a', label: 'Obrigações do Mandante', type: 'textarea' },
    { key: 'obrigacoes_b', label: 'Obrigações do Mandatário', type: 'textarea' },
    { key: 'penalidade', label: 'Penalidades / Revogação', placeholder: 'Ex: Indemnização por revogação sem justa causa' },
    { key: 'data_celebracao', label: 'Data de Celebração', type: 'date' },
    { key: 'local_celebracao', label: 'Local de Celebração', placeholder: 'Ex: Luanda' },
    { key: 'foro', label: 'Foro / Tribunal Competente', placeholder: 'Ex: Comarca de Luanda' },
  ],
  'Sociedade': [
    { key: 'objecto', label: 'Objecto Social', placeholder: 'Descreva a actividade económica da sociedade...', type: 'textarea', required: true },
    { key: 'extra.nome_sociedade', label: 'Nome / Firma da Sociedade', placeholder: 'Ex: XYZ, Lda.', required: true },
    { key: 'extra.sede', label: 'Sede', placeholder: 'Ex: Luanda, Município de...' },
    { key: 'extra.capital_social', label: 'Capital Social (Kz)', placeholder: 'Ex: 1.000.000,00', required: true },
    { key: 'valor', label: 'Valor da Entrada de Cada Sócio (Kz)', placeholder: 'Ex: 500.000,00' },
    { key: 'extra.quotas', label: 'Distribuição de Quotas', placeholder: 'Ex: Sócio A: 50%, Sócio B: 50%' },
    { key: 'prazo', label: 'Prazo de Duração', placeholder: 'Ex: Prazo indeterminado' },
    { key: 'extra.administracao', label: 'Administração / Gerência', placeholder: 'Ex: Gerência a cargo do Sócio A, isoladamente', type: 'textarea' },
    { key: 'obrigacoes_a', label: 'Obrigações do Sócio A', type: 'textarea' },
    { key: 'obrigacoes_b', label: 'Obrigações do Sócio B', type: 'textarea' },
    { key: 'data_celebracao', label: 'Data de Celebração', type: 'date' },
    { key: 'local_celebracao', label: 'Local de Celebração', placeholder: 'Ex: Luanda' },
    { key: 'foro', label: 'Foro / Tribunal Competente', placeholder: 'Ex: Comarca de Luanda' },
  ],
  'Outro': [
    { key: 'objecto', label: 'Objecto do Contrato', placeholder: 'Descreva o objecto principal...', type: 'textarea', required: true },
    { key: 'valor', label: 'Valor (Kz)', placeholder: 'Ex: 0,00' },
    { key: 'prazo', label: 'Prazo / Duração', placeholder: 'Ex: A definir' },
    { key: 'penalidade', label: 'Penalidade por Incumprimento', placeholder: 'Ex: 10% do valor' },
    { key: 'obrigacoes_a', label: 'Obrigações da Parte A', type: 'textarea' },
    { key: 'obrigacoes_b', label: 'Obrigações da Parte B', type: 'textarea' },
    { key: 'detalhes_adicionais', label: 'Detalhes Adicionais', type: 'textarea' },
    { key: 'data_celebracao', label: 'Data de Celebração', type: 'date' },
    { key: 'local_celebracao', label: 'Local de Celebração', placeholder: 'Ex: Luanda' },
    { key: 'foro', label: 'Foro / Tribunal Competente', placeholder: 'Ex: Comarca de Luanda' },
  ],
};

const steps = [
  { label: 'Tipo', icon: '1' },
  { label: 'País', icon: '2' },
  { label: 'Partes', icon: '3' },
  { label: 'Detalhes', icon: '4' },
  { label: 'Gerar', icon: '5' },
];

interface AIContractGeneratorProps {
  onGenerated: (html: string, title: string) => void;
  onClose: () => void;
}

export default function AIContractGenerator({ onGenerated, onClose }: AIContractGeneratorProps) {
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [answers, setAnswers] = useState<ContractAnswers>({
    tipo: '',
    pais: 'Angola',
    parte_a_nome: '', parte_a_nif: '', parte_a_morada: '',
    parte_b_nome: '', parte_b_nif: '', parte_b_morada: '',
    valor: '', valor_extenso: '', prazo: '',
    objecto: '', obrigacoes_a: '', obrigacoes_b: '',
    penalidade: '', foro: '', data_celebracao: '', local_celebracao: '',
    detalhes_adicionais: '',
  });

  const update = (field: keyof ContractAnswers, value: string) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
  };

  const updateExtra = (field: string, value: string) => {
    setAnswers(prev => ({ ...prev, extraFields: { ...prev.extraFields, [field]: value } }));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const html = await generateFullContract(answers);
      if (html) {
        setPreview(html);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleUseContract = () => {
    if (preview) {
      onGenerated(preview, `${answers.tipo} - ${answers.parte_a_nome} & ${answers.parte_b_nome}`);
    }
  };

  const handleExportPdf = async () => {
    if (!preview || !previewRef.current) return;
    setPdfExporting(true);
    try {
      await document.fonts.ready;
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const imgProps = canvas.width / canvas.height;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pdfImgWidth = pageWidth - 20;
      const pdfImgHeight = pdfImgWidth / imgProps;

      // Watermark
      pdf.saveGraphicsState();
      pdf.setGState(new (pdf as any).GState({ opacity: 0.06 }));
      pdf.setFontSize(72);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Agree', pageWidth / 2, pageHeight / 2, { align: 'center', angle: -30 });
      pdf.restoreGraphicsState();

      // Header bar
      pdf.setFillColor(15, 168, 143);
      pdf.rect(0, 0, pageWidth, 10, 'F');

      // Content image — split across pages if needed
      let remainingHeight = pdfImgHeight;
      let yPos = 10;
      let pageNum = 1;
      const usableHeight = pageHeight - 16;
      const logoImg = await getLogoDataUrl();

      while (remainingHeight > 0) {
        const sliceH = Math.min(remainingHeight, usableHeight - yPos);
        const srcY = (pdfImgHeight - remainingHeight) / pdfImgHeight * canvas.height;
        const sliceCanvasH = sliceH / pdfImgHeight * canvas.height;
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceCanvasH;
        const ctx = sliceCanvas.getContext('2d')!;
        ctx.drawImage(canvas, 0, srcY, canvas.width, sliceCanvasH, 0, 0, canvas.width, sliceCanvasH);
        const sliceData = sliceCanvas.toDataURL('image/png');
        pdf.addImage(sliceData, 'PNG', 10, yPos, pdfImgWidth, sliceH);

        // Footer
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
        if (remainingHeight > 0) {
          pdf.addPage();
          yPos = 5;
          // Watermark each page
          pdf.saveGraphicsState();
          pdf.setGState(new (pdf as any).GState({ opacity: 0.06 }));
          pdf.setFontSize(72);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(0, 0, 0);
          pdf.text('Agree', pageWidth / 2, pageHeight / 2, { align: 'center', angle: -30 });
          pdf.restoreGraphicsState();
        }
      }

      pdf.save(`Contrato_${answers.tipo.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
    } finally {
      setPdfExporting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return !!answers.tipo;
      case 1: return !!answers.pais;
      case 2: return !!answers.parte_a_nome && !!answers.parte_b_nome;
      case 3: {
        const fields = typeFields[answers.tipo] || [];
        return fields.every(f => {
          if (!f.required) return true;
          if (f.key.startsWith('extra.')) return !!answers.extraFields?.[f.key.slice(6)];
          return !!answers[f.key as keyof ContractAnswers];
        });
      }
      default: return true;
    }
  };

  const modalOverlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24, fontFamily: "'Poppins', sans-serif"
  };

  const modalCard: React.CSSProperties = {
    background: '#fff', width: '100%', maxWidth: 800, maxHeight: '85vh',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    boxShadow: '0 24px 64px rgba(0,0,0,0.2)'
  };

  const renderStepIndicator = () => (
    <div style={{
      display: 'flex', gap: 4, padding: '16px 24px 0',
      borderBottom: '1px solid #e2e5e9', marginBottom: 0
    }}>
      {steps.map((s, i) => (
        <div key={i} style={{ flex: 1, textAlign: 'center', padding: '0 4px' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', margin: '0 auto 4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700,
            background: i < step ? '#0d1117' : i === step ? '#0fa88f' : '#e2e5e9',
            color: i <= step ? '#fff' : '#6b7280',
            transition: 'all .3s'
          }}>{s.icon}</div>
          <div style={{
            fontSize: 9, fontWeight: 600, color: i <= step ? '#0d1117' : '#bbb',
            textTransform: 'uppercase', letterSpacing: 0.3
          }}>{s.label}</div>
        </div>
      ))}
    </div>
  );

  if (preview) {
    return (
      <div style={modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div style={modalCard}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 24px', borderBottom: '1px solid #e2e5e9'
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, fontFamily: "'Poppins',sans-serif" }}>
              Contrato Gerado
            </h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleUseContract}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 18px', fontSize: 13, fontWeight: 600,
                  background: '#0d1117', border: 'none', color: '#fff', cursor: 'pointer',
                  fontFamily: "'Poppins',sans-serif"
                }}
              >
                <FileText size={15} />
                Usar Contrato
              </button>
              <button
                onClick={handleExportPdf}
                disabled={pdfExporting}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 18px', fontSize: 13, fontWeight: 600,
                  background: pdfExporting ? '#e2e5e9' : '#0fa88f',
                  border: 'none',
                  color: pdfExporting ? '#6b7280' : '#fff',
                  cursor: pdfExporting ? 'not-allowed' : 'pointer',
                  fontFamily: "'Poppins',sans-serif"
                }}
              >
                {pdfExporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                {pdfExporting ? 'A exportar...' : 'Exportar PDF'}
              </button>
              <button
                onClick={() => setPreview(null)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', fontSize: 13, fontWeight: 600,
                  background: '#fff', border: '1px solid #e2e5e9', color: '#6b7280',
                  cursor: 'pointer', fontFamily: "'Poppins',sans-serif"
                }}
              >
                <X size={15} />
                Voltar
              </button>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
            <div
              ref={previewRef}
              style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 13, lineHeight: 1.8, color: '#1a1a1a', maxWidth: 700, margin: '0 auto' }}
              dangerouslySetInnerHTML={{ __html: preview }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modalCard}>
        {renderStepIndicator()}

        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>

          {/* Step 0: Tipo */}
          {step === 0 && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, fontFamily: "'Poppins',sans-serif" }}>
                Que tipo de contrato?
              </h3>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, fontFamily: "'Poppins',sans-serif" }}>
                Escolhe o tipo de contrato que queres gerar
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {tiposContrato.map(t => (
                  <button
                    key={t}
                    onClick={() => update('tipo', t)}
                    style={{
                      padding: '14px 18px', fontSize: 14, fontWeight: 600,
                      background: answers.tipo === t ? '#0d1117' : '#fff',
                      color: answers.tipo === t ? '#fff' : '#0d1117',
                      border: answers.tipo === t ? 'none' : '1.5px solid #e2e5e9',
                      cursor: 'pointer', textAlign: 'left',
                      fontFamily: "'Poppins',sans-serif",
                      transition: 'all .2s'
                    }}
                    onMouseEnter={e => { if (answers.tipo !== t) { e.currentTarget.style.borderColor = '#0d1117'; }}}
                    onMouseLeave={e => { if (answers.tipo !== t) { e.currentTarget.style.borderColor = '#e2e5e9'; }}}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: País */}
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, fontFamily: "'Poppins',sans-serif" }}>
                Qual o país / legislação aplicável?
              </h3>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, fontFamily: "'Poppins',sans-serif" }}>
                Escolhe o país para aplicarmos a legislação correcta no contrato
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {['Angola', 'Brasil', 'Portugal', 'Moçambique', 'Cabo Verde', 'São Tomé e Príncipe', 'Guiné-Bissau', 'Timor-Leste', 'Internacional', 'Outro'].map(p => (
                  <button
                    key={p}
                    onClick={() => update('pais', p)}
                    style={{
                      padding: '14px 18px', fontSize: 14, fontWeight: 600,
                      background: answers.pais === p ? '#0d1117' : '#fff',
                      color: answers.pais === p ? '#fff' : '#0d1117',
                      border: answers.pais === p ? 'none' : '1.5px solid #e2e5e9',
                      cursor: 'pointer', textAlign: 'left',
                      fontFamily: "'Poppins',sans-serif",
                      transition: 'all .2s'
                    }}
                    onMouseEnter={e => { if (answers.pais !== p) { e.currentTarget.style.borderColor = '#0d1117'; }}}
                    onMouseLeave={e => { if (answers.pais !== p) { e.currentTarget.style.borderColor = '#e2e5e9'; }}}
                  >
                    {p}
                  </button>
                ))}
              </div>
              {answers.pais === 'Outro' && (
                <input
                  style={{ ...inputBase, marginTop: 12 }}
                  placeholder="Escreve o país..."
                  value={answers.pais === 'Outro' ? '' : answers.pais}
                  onChange={e => update('pais', e.target.value)}
                />
              )}
            </div>
          )}

          {/* Step 2: Partes */}
          {step === 2 && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, fontFamily: "'Poppins',sans-serif" }}>
                Quem são as partes?
              </h3>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, fontFamily: "'Poppins',sans-serif" }}>
                Identifica as partes contratantes
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Parte A (Contratante) *</label>
                  <input style={inputBase} placeholder="Nome completo" value={answers.parte_a_nome} onChange={e => update('parte_a_nome', e.target.value)} />
                  <input style={{ ...inputBase, marginTop: 8 }} placeholder="NIF" value={answers.parte_a_nif} onChange={e => update('parte_a_nif', e.target.value)} />
                  <input style={{ ...inputBase, marginTop: 8 }} placeholder="Morada" value={answers.parte_a_morada} onChange={e => update('parte_a_morada', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Parte B (Contratado) *</label>
                  <input style={inputBase} placeholder="Nome completo" value={answers.parte_b_nome} onChange={e => update('parte_b_nome', e.target.value)} />
                  <input style={{ ...inputBase, marginTop: 8 }} placeholder="NIF" value={answers.parte_b_nif} onChange={e => update('parte_b_nif', e.target.value)} />
                  <input style={{ ...inputBase, marginTop: 8 }} placeholder="Morada" value={answers.parte_b_morada} onChange={e => update('parte_b_morada', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Valor */}
          {step === 3 && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, fontFamily: "'Poppins',sans-serif" }}>
                Condições Financeiras
              </h3>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, fontFamily: "'Poppins',sans-serif" }}>
                Define o valor e condições de pagamento
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Valor do Contrato (Kz) *</label>
                  <input style={inputBase} placeholder="Ex: 5.000.000,00" value={answers.valor} onChange={e => update('valor', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Valor por Extenso</label>
                  <input style={inputBase} placeholder="Ex: Cinco milhões de kwanzas" value={answers.valor_extenso} onChange={e => update('valor_extenso', e.target.value)} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Penalidade por Incumprimento</label>
                  <input style={inputBase} placeholder="Ex: 10% do valor total" value={answers.penalidade} onChange={e => update('penalidade', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Prazo */}
          {step === 4 && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, fontFamily: "'Poppins',sans-serif" }}>
                Prazo e Vigência
              </h3>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, fontFamily: "'Poppins',sans-serif" }}>
                Define a duração do contrato
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Prazo / Duração *</label>
                  <input style={inputBase} placeholder="Ex: 12 meses" value={answers.prazo} onChange={e => update('prazo', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Data de Celebração</label>
                  <input type="date" style={inputBase} value={answers.data_celebracao} onChange={e => update('data_celebracao', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Local de Celebração</label>
                  <input style={inputBase} placeholder="Ex: Luanda" value={answers.local_celebracao} onChange={e => update('local_celebracao', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Foro / Tribunal Competente</label>
                  <input style={inputBase} placeholder="Ex: Comarca de Luanda" value={answers.foro} onChange={e => update('foro', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Objecto e Detalhes */}
          {step === 5 && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, fontFamily: "'Poppins',sans-serif" }}>
                Objecto e Detalhes
              </h3>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, fontFamily: "'Poppins',sans-serif" }}>
                Descreve o objecto do contrato e obrigações
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Objecto do Contrato *</label>
                  <textarea style={{ ...inputBase, resize: 'vertical' }} rows={3} placeholder="Descreve o objecto principal do contrato..." value={answers.objecto} onChange={e => update('objecto', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Obrigações da Parte A (Contratante)</label>
                  <textarea style={{ ...inputBase, resize: 'vertical' }} rows={2} placeholder="Ex: Pagar o valor acordado, fornecer informações..." value={answers.obrigacoes_a} onChange={e => update('obrigacoes_a', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Obrigações da Parte B (Contratado)</label>
                  <textarea style={{ ...inputBase, resize: 'vertical' }} rows={2} placeholder="Ex: Executar o serviço, entregar relatórios..." value={answers.obrigacoes_b} onChange={e => update('obrigacoes_b', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Detalhes Adicionais</label>
                  <textarea style={{ ...inputBase, resize: 'vertical' }} rows={2} placeholder="Outras cláusulas ou informações relevantes..." value={answers.detalhes_adicionais} onChange={e => update('detalhes_adicionais', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Gerar */}
          {step === 6 && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <FileText size={48} color="#0d1117" style={{ marginBottom: 16, opacity: 0.3 }} />
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, fontFamily: "'Poppins',sans-serif" }}>
                Tudo pronto!
              </h3>
              <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24, fontFamily: "'Poppins',sans-serif" }}>
                A IA vai gerar um contrato profissional completo com base nas tuas respostas
              </p>
              <div style={{
                background: '#f7f9fb', border: '1px solid #e2e5e9',
                padding: 16, marginBottom: 24, textAlign: 'left',
                fontSize: 13, fontFamily: "'Poppins',sans-serif", color: '#374151'
              }}>
                <p style={{ margin: '0 0 4px' }}><strong>Tipo:</strong> {answers.tipo}</p>
                <p style={{ margin: '0 0 4px' }}><strong>País:</strong> {answers.pais}</p>
                <p style={{ margin: '0 0 4px' }}><strong>Partes:</strong> {answers.parte_a_nome} & {answers.parte_b_nome}</p>
                {answers.valor && <p style={{ margin: '0 0 4px' }}><strong>Valor:</strong> {answers.valor} Kz</p>}
                <p style={{ margin: 0 }}><strong>Prazo:</strong> {answers.prazo}</p>
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '14px 32px', fontSize: 15, fontWeight: 700,
                  background: generating ? '#e2e5e9' : '#0d1117',
                  color: generating ? '#6b7280' : '#fff',
                  border: 'none', cursor: generating ? 'not-allowed' : 'pointer',
                  fontFamily: "'Poppins',sans-serif", transition: 'all .2s'
                }}
              >
                {generating ? <Loader2 size={18} className="animate-spin" /> : <FileUp size={18} />}
                {generating ? 'A gerar contrato...' : 'Gerar Contrato Completo'}
              </button>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          padding: '16px 24px', borderTop: '1px solid #e2e5e9'
        }}>
          <button
            onClick={() => step === 0 ? onClose() : setStep(s => s - 1)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 20px', fontSize: 14, fontWeight: 600,
              background: '#fff', border: '1.5px solid #e2e5e9',
              color: '#6b7280', cursor: 'pointer',
              fontFamily: "'Poppins',sans-serif"
            }}
          >
            <ArrowLeft size={16} />
            {step === 0 ? 'Cancelar' : 'Anterior'}
          </button>
          {step < 6 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '10px 24px', fontSize: 14, fontWeight: 600,
                background: canProceed() ? '#0d1117' : '#e2e5e9',
                border: 'none', color: canProceed() ? '#fff' : '#bbb',
                cursor: canProceed() ? 'pointer' : 'not-allowed',
                fontFamily: "'Poppins',sans-serif"
              }}
            >
              {step === 5 ? 'Rever & Gerar' : 'Próximo'}
              <ArrowRight size={16} />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
