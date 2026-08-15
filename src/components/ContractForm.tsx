import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
  Save,
  X,
  Sparkles,
  AlertCircle,
  Calendar as CalendarIcon,
  DollarSign,
  Paperclip,
  File,
  Loader2,
  Wand2,
  FileUp,
  Library,
  ChevronLeft,
  FileText as FileTextIcon
} from 'lucide-react';
import { analyzeContractRisks, generateContractSuggestions, extractContractFromText } from '../services/gemini';
import { extractPdfText } from '../services/pdf';

import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TemplateLibrary from './TemplateLibrary';
import TemplateFieldForm from './TemplateFieldForm';
import AIContractGenerator from './AIContractGenerator';
import ContractClauseEditor from './ContractClauseEditor';
import TagInput from './TagInput';
import { useClients } from '../hooks/useClients';
import type { FieldDef } from './TemplateFieldForm';
import { checkPlan, getLimits, canUpgrade } from '../lib/plans';
import { logAudit, Actions } from '../services/auditLog';
import CurrencySelect from './CurrencySelect';
import { useCheckoutModal } from '../contexts/CheckoutModalContext';

export default function ContractForm() {
  const { user, plan, isAdmin, trialEndsAt } = useAuth();
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEditing = !!editId;
  const mode = isEditing ? null : (searchParams.get('mode') || null);
  const canUseAI = checkPlan(plan, 'pro', isAdmin, trialEndsAt);
  const { openCheckout } = useCheckoutModal();
  const [analyzing, setAnalyzing] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [extractingPdf, setExtractingPdf] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [extractingText, setExtractingText] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [loadingContract, setLoadingContract] = useState(isEditing);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [exportingPdf, setExportingPdf] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    value: '',
    currency: 'AOA',
    startDate: '',
    endDate: '',
    autoRenew: false,
    renewalPeriod: '',
    notificationDays: 30,
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [clientId, setClientId] = useState<string>('');
  const { data: clients } = useClients();

  useEffect(() => {
    if (!editId || !user) return;
    const fetchContract = async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', editId)
        .eq('owner_id', user.id)
        .single();
      if (error || !data) {
        toast.error('Contrato não encontrado');
        navigate('/contracts');
        return;
      }
      setFormData({
        title: data.title || '',
        description: data.description || '',
        content: data.content || '',
        value: data.value?.toString() || '',
        currency: data.currency || 'AOA',
        startDate: data.start_date || '',
        endDate: data.end_date || '',
        autoRenew: data.auto_renew || false,
        renewalPeriod: data.renewal_period || '',
        notificationDays: data.notification_days || 30,
      });
      setAnalysis(data.risks ? { risks: data.risks } : null);
      setExistingAttachments(data.attachments || []);
      setTags(data.tags || []);
      setClientId(data.client_id || '');
      setLoadingContract(false);
    };
    fetchContract();
  }, [editId, user, navigate]);

  // Modo "criar do zero" → abre a biblioteca de modelos automaticamente
  useEffect(() => {
    if (mode === 'template' && !isEditing) {
      setShowTemplateLibrary(true);
    }
  }, [mode, isEditing]);

  const requirePro = (feature: string): boolean => {
    if (canUseAI) return true;
    toast.info(`Esta funcionalidade requer o plano Pro (${feature})`);
    openCheckout('pro');
    return false;
  };

  const handleAnalyze = async () => {
    if (!formData.content) {
      toast.error("Adicione o conteúdo do contrato para analisar");
      return;
    }
    if (!requirePro('Análise de riscos')) return;
    setAnalyzing(true);
    try {
      const result = await analyzeContractRisks(formData.content);
      setAnalysis(result);
      toast.success("Análise completa concluída!");
    } catch (error) {
      toast.error("Erro ao analisar contrato");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!formData.description) {
      toast.error("Preenche a descrição para gerar o contrato com IA");
      return;
    }
    if (!requirePro('Geração de contratos com IA')) return;
    setGenerating(true);
    try {
      const generated = await generateContractSuggestions(
        `Título: ${formData.title || 'Contrato'}\nDescrição: ${formData.description}`
      );
      if (generated) {
        setFormData(prev => ({ ...prev, content: generated }));
        toast.success("Contrato gerado com IA! Revê e ajusta conforme necessário.");
      } else {
        toast.error("Não foi possível gerar o contrato");
      }
    } catch (error) {
      toast.error("Erro ao gerar contrato");
    } finally {
      setGenerating(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Selecciona um ficheiro PDF');
      return;
    }
    if (!requirePro('Extração de documentos PDF')) return;
    setExtractingPdf(true);
    try {
      const text = await extractPdfText(file);
      if (!text.trim()) {
        toast.error('Não foi possível extrair texto do PDF. Verifica se é um documento digitalizado.');
        return;
      }
      const limited = text.length > 40000 ? text.slice(0, 40000) : text;
      setFormData(prev => ({
        ...prev,
        description: prev.description || limited.slice(0, 500),
        content: prev.content ? prev.content + '\n\n' + limited : limited,
      }));
      toast.success('Texto extraído do PDF e adicionado ao contrato');
    } catch {
      toast.error('Erro ao processar PDF');
    } finally {
      setExtractingPdf(false);
      e.target.value = '';
    }
  };

  const handlePasteText = async () => {
    if (!pasteText.trim()) return;
    if (!requirePro('Extração de texto')) return;
    setExtractingText(true);
    try {
      const limited = pasteText.length > 40000 ? pasteText.slice(0, 40000) : pasteText;
      setFormData(prev => ({
        ...prev,
        description: prev.description || limited.slice(0, 500),
        content: prev.content ? prev.content + '\n\n' + limited : limited,
      }));
      toast.success('Texto colado adicionado ao contrato');
      setPasteOpen(false);
      setPasteText('');
    } finally {
      setExtractingText(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formData.title.trim()) {
      toast.error("O título do contrato é obrigatório");
      return;
    }

    setSaving(true);

    if (!isEditing) {
      const { count } = await supabase
        .from('contracts')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', user.id);
      const limits = getLimits(plan, trialEndsAt);
      if (count && count >= limits.maxContracts) {
        toast.error('Limite de contratos atingido. Faça upgrade para o plano Pro.');
        setSaving(false);
        return;
      }
    }

    try {
      const allAttachments = [...existingAttachments];
      if (attachments.length > 0) {
        for (const file of attachments) {
          const filePath = `${user.id}/${Date.now()}_${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('contracts')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('contracts')
            .getPublicUrl(filePath);

          allAttachments.push({
            id: uuidv4(),
            name: file.name,
            url: publicUrl,
            type: file.type,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            uploadedBy: user.id
          });
        }
      }

      // Merge template field values into content before saving
      let contentToSave = formData.content;
      if (selectedTemplate) {
        contentToSave = selectedTemplate.content;
        (selectedTemplate.fields || []).forEach((f: FieldDef) => {
          const val = fieldValues[f.name] || '';
          contentToSave = contentToSave.replace(new RegExp(`\\{\\{${f.name}\\}\\}`, 'g'), val);
        });
        // Update formData.content so editor reflects filled values
        setFormData(prev => ({ ...prev, content: contentToSave }));
      }

      if (isEditing) {
        const { error: updateError } = await supabase
          .from('contracts')
          .update({
            title: formData.title,
            description: formData.description,
            content: contentToSave,
            value: parseFloat(formData.value) || 0,
            currency: formData.currency,
            start_date: formData.startDate || null,
            end_date: formData.endDate || null,
            risks: analysis?.risks || [],
            attachments: allAttachments,
            tags,
            client_id: clientId || null,
            auto_renew: formData.autoRenew,
            renewal_period: formData.renewalPeriod || null,
            notification_days: formData.notificationDays,
          })
          .eq('id', editId)
          .eq('owner_id', user.id);

        if (updateError) throw updateError;

        const { data: latestVersion } = await supabase
          .from('contract_versions')
          .select('version_number')
          .eq('contract_id', editId)
          .order('version_number', { ascending: false })
          .limit(1);

        const nextVersion = (latestVersion?.[0]?.version_number || 0) + 1;

        await supabase.from('contract_versions').insert({
          contract_id: editId,
          content: contentToSave,
          version_number: nextVersion
        });

        logAudit({ user_id: user.id, user_name: user.user_metadata?.name, user_email: user.email, action: Actions.CONTRACT_UPDATE, resource: 'contract', resource_id: editId, resource_name: formData.title });
        toast.success("Contrato actualizado com sucesso!");
        navigate(`/contracts/${editId}`);
      } else {
        const { data: contract, error: contractError } = await supabase
          .from('contracts')
          .insert({
            title: formData.title,
            description: formData.description,
            content: contentToSave,
            value: parseFloat(formData.value) || 0,
            currency: formData.currency,
            status: 'draft',
            owner_id: user.id,
            start_date: formData.startDate || null,
            end_date: formData.endDate || null,
            risks: analysis?.risks || [],
            attachments: allAttachments,
            tags,
            client_id: clientId || null,
            auto_renew: formData.autoRenew,
            renewal_period: formData.renewalPeriod || null,
            notification_days: formData.notificationDays,
          })
          .select()
          .single();

        if (contractError) throw contractError;
        
        await supabase.from('contract_versions').insert({
          contract_id: contract.id,
          content: contentToSave,
          version_number: 1
        });

        logAudit({ user_id: user.id, user_name: user.user_metadata?.name, user_email: user.email, action: Actions.CONTRACT_CREATE, resource: 'contract', resource_id: contract.id, resource_name: formData.title });
        toast.success("Contrato criado com sucesso!");
        navigate('/contracts');
      }
    } catch (error) {
      console.error("Error saving contract:", error);
      toast.error("Erro ao salvar contrato");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!formData.content || !templateName.trim() || !templateCategory.trim()) {
      toast.error('Preenche o nome e categoria do modelo');
      return;
    }
    setSavingTemplate(true);
    try {
      const { error } = await supabase.from('contract_templates').insert({
        name: templateName.trim(),
        description: templateDesc.trim(),
        category: templateCategory.trim(),
        content: formData.content,
        user_id: user?.id,
        is_system: false
      });
      if (error) throw error;
      toast.success('Modelo guardado com sucesso!');
      setShowSaveTemplate(false);
      setTemplateName('');
      setTemplateCategory('');
      setTemplateDesc('');
    } catch (e) {
      toast.error('Erro ao guardar modelo');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleSelectTemplate = (template: any) => {
    setSelectedTemplate(template);
    const initial: Record<string, string> = {};
    (template.fields || []).forEach((f: FieldDef) => { initial[f.name] = ''; });
    setFieldValues(initial);
    setFormData(prev => ({ ...prev, content: template.content }));
    toast.success(`Modelo "${template.name}" aplicado — preenche os campos e exporta`);
  };

  const handleAIGenerated = (html: string, title: string) => {
    setFormData(prev => ({ ...prev, content: html, title: prev.title || title }));
    setShowAIGenerator(false);
    toast.success('Contrato gerado com sucesso!');
  };

  const handleFieldChange = (name: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [name]: value }));
  };

  const handleExportContent = async () => {
    if (!formData.content?.trim()) {
      toast.error('O contrato está vazio');
      return;
    }
    if (selectedTemplate) {
      const missing = (selectedTemplate.fields || [])
        .filter((f: FieldDef) => f.required && !fieldValues[f.name]?.trim())
        .map((f: FieldDef) => f.label);
      if (missing.length > 0) {
        toast.error(`Campos obrigatórios do modelo: ${missing.join(', ')}`);
        return;
      }
    }
    setExportingPdf(true);
    try {
      await generatePdf(formData.content, formData.title || 'contrato');
    } catch {
      toast.error('Erro ao exportar PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  const generatePdf = async (html: string, filename: string) => {
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:0;width:820px;z-index:-1';
    container.innerHTML = html;
    document.body.appendChild(container);

    await new Promise(r => setTimeout(r, 500));

    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');

    const canvas = await html2canvas(container, {
      scale: 2, useCORS: true, logging: false,
      width: 820, height: container.scrollHeight,
    });
    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    const pageHeight = pdf.internal.pageSize.getHeight();

    let heightLeft = pdfHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${filename.replace(/\s+/g, '_')}.pdf`);
    toast.success('PDF exportado com sucesso!');
  };

  return (
    <div style={{
      maxWidth: 1600,
      margin: '0 auto',
      fontFamily: "'Poppins', sans-serif"
    }}>
      <form onSubmit={handleSubmit}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.35)',
          borderRadius: 24,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          overflow: 'hidden'
        }}>
          <div style={{
            borderBottom: '1px solid #e2e5e9',
            padding: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h2 style={{
                fontSize: 20,
                fontWeight: 700,
                color: '#0d1117',
                marginBottom: 4,
                fontFamily: "'Poppins',sans-serif"
              }}>
                {isEditing ? 'Editar Contrato' : 'Novo Contrato'}
              </h2>
              <p style={{
                fontSize: 14,
                color: '#6b7280',
                fontFamily: "'Poppins',sans-serif"
              }}>
                {isEditing ? 'Altere os dados do contrato abaixo' : 'Preencha os dados do contrato abaixo'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={() => navigate(isEditing ? '/contracts' : '/contracts/new')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  fontSize: 14,
                  fontWeight: 600,
                  background: '#fff',
                  border: '1.5px solid #e2e5e9',
                  color: '#6b7280',
                  cursor: 'pointer',
                  transition: 'all .2s',
                  fontFamily: "'Poppins',sans-serif"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#f7f9fb';
                  e.currentTarget.style.color = '#0d1117';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#fff';
                  e.currentTarget.style.color = '#6b7280';
                }}
              >
                <X size={16} />
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  fontSize: 14,
                  fontWeight: 600,
                  background: '#0d1117',
                  border: 'none',
                  color: '#fff',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'all .2s',
                  fontFamily: "'Poppins',sans-serif",
                  opacity: saving ? 0.7 : 1
                }}
                onMouseEnter={e => {
                  if (!saving) e.currentTarget.style.background = '#000000';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#0d1117';
                }}
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'Salvando...' : 'Salvar Contrato'}
              </button>
            </div>
          </div>

          {!isEditing && mode === 'document' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 24px', background: '#0d1117', color: '#fff'
            }}>
              <FileUp size={20} color="#fff" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Modo: Importar documento existente</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                  Cola o texto ou faz upload do PDF no editor de conteúdo. Revê e corrige os dados antes de salvar.
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/contracts/new')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(255,255,255,0.12)', color: '#fff',
                  border: '1px solid rgba(255,255,255,0.25)',
                  padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'Poppins',sans-serif", transition: 'background .2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
              >
                <ChevronLeft size={14} />
                Voltar às opções
              </button>
            </div>
          )}

          {!isEditing && mode === 'draft' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 24px', background: 'rgba(0,0,0,0.04)', borderBottom: '1px solid #e2e5e9'
            }}>
              <FileTextIcon size={20} color="#6b7280" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0d1117' }}>Modo: Rascunho</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  Guarda o contrato para retomar mais tarde. O documento final é criado depois, quando estiveres pronto.
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/contracts/new')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: '#fff', color: '#6b7280',
                  border: '1px solid #e2e5e9',
                  padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'Poppins',sans-serif", transition: 'background .2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f7f9fb'; e.currentTarget.style.color = '#0d1117'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#6b7280'; }}
              >
                <ChevronLeft size={14} />
                Voltar às opções
              </button>
            </div>
          )}

          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 24
            }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: 8,
                  fontFamily: "'Poppins',sans-serif"
                }}>
                  Título do Contrato
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: 14,
                    fontFamily: "'Poppins',sans-serif",
                    background: '#fff',
                    border: '1.5px solid #e2e5e9',
                    color: '#0d1117',
                    outline: 'none',
                    transition: 'all .2s'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#0d1117'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e2e5e9'}
                  placeholder="Título do contrato"
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: 8,
                  fontFamily: "'Poppins',sans-serif"
                }}>
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: 14,
                    fontFamily: "'Poppins',sans-serif",
                    background: '#fff',
                    border: '1.5px solid #e2e5e9',
                    color: '#0d1117',
                    outline: 'none',
                    resize: 'vertical',
                    transition: 'all .2s'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#0d1117'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e2e5e9'}
                  placeholder="Breve descrição do contrato"
                />
              </div>

              <div>
                <label style={{
                  display: 'block', fontSize: 13, fontWeight: 600,
                  color: '#374151', marginBottom: 8,
                  fontFamily: "'Poppins',sans-serif"
                }}>
                  Tags
                </label>
                <TagInput tags={tags} onChange={setTags} />
              </div>

              <div>
                <label style={{
                  display: 'block', fontSize: 13, fontWeight: 600,
                  color: '#374151', marginBottom: 8,
                  fontFamily: "'Poppins',sans-serif"
                }}>
                  Cliente (opcional)
                </label>
                <select
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', fontSize: 13,
                    fontFamily: "'Poppins',sans-serif", color: '#0d1117',
                    background: '#fff', border: '1.5px solid #e2e5e9',
                    outline: 'none',
                  }}
                >
                  <option value="">Seleccionar cliente...</option>
                  {clients?.data?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: 8,
                  fontFamily: "'Poppins',sans-serif"
                }}>
                  Valor
                </label>
                <div style={{ position: 'relative' }}>
                  <DollarSign style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#6b7280'
                  }} size={18} />
                  <input
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={e => setFormData({ ...formData, value: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 42px',
                      fontSize: 14,
                      fontFamily: "'Poppins',sans-serif",
                      background: '#fff',
                      border: '1.5px solid #e2e5e9',
                      color: '#0d1117',
                      outline: 'none',
                      transition: 'all .2s'
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = '#0d1117'}
                    onBlur={e => e.currentTarget.style.borderColor = '#e2e5e9'}
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block', fontSize: 13, fontWeight: 600,
                  color: '#374151', marginBottom: 8, fontFamily: "'Poppins',sans-serif"
                }}>
                  Moeda
                </label>
                <CurrencySelect value={formData.currency} onChange={c => setFormData({ ...formData, currency: c })} />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: 8,
                  fontFamily: "'Poppins',sans-serif"
                }}>
                  Data de Início
                </label>
                <div style={{ position: 'relative' }}>
                  <CalendarIcon style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#6b7280'
                  }} size={18} />
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 42px',
                      fontSize: 14,
                      fontFamily: "'Poppins',sans-serif",
                      background: '#fff',
                      border: '1.5px solid #e2e5e9',
                      color: '#0d1117',
                      outline: 'none',
                      transition: 'all .2s'
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = '#0d1117'}
                    onBlur={e => e.currentTarget.style.borderColor = '#e2e5e9'}
                  />
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: 8,
                  fontFamily: "'Poppins',sans-serif"
                }}>
                  Data de Término
                </label>
                <div style={{ position: 'relative' }}>
                  <CalendarIcon style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#6b7280'
                  }} size={18} />
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 42px',
                      fontSize: 14,
                      fontFamily: "'Poppins',sans-serif",
                      background: '#fff',
                      border: '1.5px solid #e2e5e9',
                      color: '#0d1117',
                      outline: 'none',
                      transition: 'all .2s'
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = '#0d1117'}
                    onBlur={e => e.currentTarget.style.borderColor = '#e2e5e9'}
                  />
                </div>
              </div>
            </div>

            {/* Auto-renew fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '16px 0', borderTop: '1px solid #e2e5e9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="checkbox"
                  id="autoRenew"
                  checked={formData.autoRenew}
                  onChange={e => setFormData({ ...formData, autoRenew: e.target.checked })}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <label htmlFor="autoRenew" style={{ fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: "'Poppins',sans-serif" }}>
                  Renovação Automática
                </label>
              </div>

              {formData.autoRenew && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8, fontFamily: "'Poppins',sans-serif" }}>
                      Período de Renovação
                    </label>
                    <select
                      value={formData.renewalPeriod}
                      onChange={e => setFormData({ ...formData, renewalPeriod: e.target.value })}
                      style={{
                        width: '100%', padding: '10px 14px', fontSize: 13, fontFamily: "'Poppins',sans-serif",
                        color: '#0d1117', background: '#fff', border: '1.5px solid #e2e5e9', outline: 'none'
                      }}
                    >
                      <option value="">Seleccionar período...</option>
                      <option value="monthly">Mensal</option>
                      <option value="quarterly">Trimestral</option>
                      <option value="semi_annually">Semestral</option>
                      <option value="annually">Anual</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8, fontFamily: "'Poppins',sans-serif" }}>
                      Notificar com (dias de antecedência)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={formData.notificationDays}
                      onChange={e => setFormData({ ...formData, notificationDays: parseInt(e.target.value) || 30 })}
                      style={{
                        width: '100%', padding: '10px 14px', fontSize: 13, fontFamily: "'Poppins',sans-serif",
                        background: '#fff', border: '1.5px solid #e2e5e9', color: '#0d1117', outline: 'none'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8
              }}>
                <label style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#374151',
                  fontFamily: "'Poppins',sans-serif"
                }}>
                  {selectedTemplate ? 'Campos do Modelo' : 'Conte\u00fado do Contrato'}
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTemplate(null);
                      setFieldValues({});
                    }}
                    style={{
                      display: selectedTemplate ? 'inline-flex' : 'none',
                      alignItems: 'center', gap: 6,
                      padding: '6px 12px', fontSize: 12, fontWeight: 600,
                      background: '#fff', border: '1px solid #e2e5e9',
                      color: '#6b7280', cursor: 'pointer',
                      transition: 'all .2s', fontFamily: "'Poppins',sans-serif"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f7f9fb'; e.currentTarget.style.color = '#0d1117'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#6b7280'; }}
                  >
                    <X size={14} />
                    Limpar Modelo
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTemplateLibrary(true)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', fontSize: 12, fontWeight: 600,
                      background: '#fff', border: '1px solid #e2e5e9',
                      color: '#6b7280', cursor: 'pointer',
                      transition: 'all .2s', fontFamily: "'Poppins',sans-serif"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f7f9fb'; e.currentTarget.style.color = '#0d1117'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#6b7280'; }}
                  >
                    <Library size={14} />
                    Modelos
                  </button>
                  {!selectedTemplate && (
                    <>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handlePdfUpload}
                        style={{ display: 'none' }}
                        id="pdf-upload"
                      />
                      <label htmlFor="pdf-upload" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 12px', fontSize: 12, fontWeight: 600,
                        background: '#fff', border: '1px solid #e2e5e9',
                        color: extractingPdf ? '#0d1117' : '#6b7280',
                        cursor: extractingPdf ? 'not-allowed' : 'pointer',
                        transition: 'all .2s', fontFamily: "'Poppins',sans-serif",
                        opacity: extractingPdf ? 0.8 : 1
                      }}>
                        {extractingPdf ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
                        {extractingPdf ? 'Extraindo...' : 'Upload PDF'}
                      </label>
                      <button
                        type="button"
                        onClick={() => setPasteOpen(true)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '6px 12px', fontSize: 12, fontWeight: 600,
                          background: '#fff', border: '1px solid #e2e5e9',
                          color: '#6b7280', cursor: 'pointer',
                          transition: 'all .2s', fontFamily: "'Poppins',sans-serif"
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f7f9fb'; e.currentTarget.style.color = '#0d1117'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#6b7280'; }}
                      >
                        <FileTextIcon size={14} />
                        Colar Texto
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!requirePro('Geração de contratos com IA')) return;
                          setShowAIGenerator(true);
                        }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '6px 12px', fontSize: 12, fontWeight: 600,
                          background: 'linear-gradient(135deg, #0d1117, #000000)',
                          border: 'none', color: '#fff',
                          cursor: 'pointer',
                          transition: 'all .2s', fontFamily: "'Poppins',sans-serif",
                          borderRadius: 8
                        }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                      >
                        <Wand2 size={14} />
                        Gerar com IA
                      </button>
                      <button
                        type="button"
                        onClick={handleAnalyze}
                        disabled={analyzing}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '6px 12px', fontSize: 12, fontWeight: 600,
                          background: '#fff', border: '1px solid #e2e5e9',
                          color: analyzing ? '#0d1117' : '#6b7280',
                          cursor: analyzing ? 'not-allowed' : 'pointer',
                          transition: 'all .2s', fontFamily: "'Poppins',sans-serif"
                        }}
                        onMouseEnter={e => { if (!analyzing) { e.currentTarget.style.background = '#f7f9fb'; e.currentTarget.style.color = '#0d1117'; } }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = analyzing ? '#0d1117' : '#6b7280'; }}
                      >
                        {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        {analyzing ? 'Analisando...' : 'Analisar Riscos'}
                      </button>
                    </>
                  )}
                </div>
              </div>
              {selectedTemplate && (
                <div style={{
                  background: '#fff',
                  border: '1.5px solid #e2e5e9',
                  padding: 24
                }}>
                  <TemplateFieldForm
                    fields={selectedTemplate.fields || []}
                    values={fieldValues}
                    onChange={handleFieldChange}
                    templateName={selectedTemplate.name}
                  />
                </div>
              )}

              <ContractClauseEditor
                content={formData.content}
                fieldValues={{
                  ...fieldValues,
                  titulo: formData.title || 'Contrato',
                  data: new Date().toLocaleDateString('pt-PT'),
                }}
                onChange={html => setFormData(prev => ({ ...prev, content: html }))}
                exportingPdf={exportingPdf}
                onExportPdf={handleExportContent}
                canUseAI={canUseAI}
                onRequirePro={requirePro}
              />
            </div>

            {analysis && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {analysis.summary && (
                  <div style={{
                    padding: 16,
                    background: 'rgba(15, 168, 143, 0.05)',
                    borderLeft: '3px solid #0d1117'
                  }}>
                    <p style={{
                      fontSize: 13, fontWeight: 600, color: '#0d1117', marginBottom: 4,
                      fontFamily: "'Poppins',sans-serif"
                    }}>Análise Geral</p>
                    <p style={{
                      fontSize: 13, color: '#374151', lineHeight: 1.6,
                      fontFamily: "'Poppins',sans-serif"
                    }}>{analysis.summary}</p>
                  </div>
                )}

                {analysis.applicableLaw && (
                  <div style={{
                    padding: 16,
                    background: 'rgba(99, 102, 241, 0.05)',
                    borderLeft: '3px solid #6366f1'
                  }}>
                    <p style={{
                      fontSize: 13, fontWeight: 600, color: '#6366f1', marginBottom: 4,
                      fontFamily: "'Poppins',sans-serif"
                    }}>Legislação Aplicável</p>
                    <p style={{
                      fontSize: 13, color: '#374151', lineHeight: 1.6,
                      fontFamily: "'Poppins',sans-serif"
                    }}>{analysis.applicableLaw}</p>
                  </div>
                )}

                {analysis.valueAnalysis && (
                  <div style={{
                    padding: 16,
                    background: 'rgba(245, 158, 11, 0.05)',
                    borderLeft: '3px solid #f59e0b'
                  }}>
                    <p style={{
                      fontSize: 13, fontWeight: 600, color: '#f59e0b', marginBottom: 4,
                      fontFamily: "'Poppins',sans-serif"
                    }}>Análise de Valor</p>
                    <p style={{
                      fontSize: 13, color: '#374151', lineHeight: 1.6,
                      fontFamily: "'Poppins',sans-serif"
                    }}>{analysis.valueAnalysis}</p>
                  </div>
                )}

                {analysis.risks?.length > 0 && (
                  <div>
                    <h3 style={{
                      fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12,
                      fontFamily: "'Poppins',sans-serif"
                    }}>Riscos Identificados ({analysis.risks.length})</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {analysis.risks.map((risk: any, idx: number) => (
                        <div key={idx} style={{
                          display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px',
                          background: risk.severity === 'high' ? 'rgba(239, 68, 68, 0.05)' : 
                                      risk.severity === 'medium' ? 'rgba(245, 158, 11, 0.05)' : 
                                      'rgba(15, 168, 143, 0.05)',
                          borderLeft: '3px solid ' + (risk.severity === 'high' ? '#ef4444' : 
                                                      risk.severity === 'medium' ? '#f59e0b' : '#10b981')
                        }}>
                          <AlertCircle size={18} color={risk.severity === 'high' ? '#ef4444' : 
                                                                        risk.severity === 'medium' ? '#f59e0b' : '#10b981'} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                              <span style={{
                                fontSize: 12, fontWeight: 700, textTransform: 'capitalize', color: '#0d1117',
                                fontFamily: "'Poppins',sans-serif"
                              }}>Risco {risk.severity}</span>
                              {risk.type && (
                                <span style={{
                                  fontSize: 10, fontWeight: 600, padding: '2px 8px',
                                  background: '#f0f0f0', color: '#6b7280',
                                  fontFamily: "'Poppins',sans-serif"
                                }}>{risk.type}</span>
                              )}
                            </div>
                            <p style={{
                              fontSize: 13, color: '#374151', lineHeight: 1.5,
                              fontFamily: "'Poppins',sans-serif"
                            }}>{risk.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.opportunities?.length > 0 && (
                  <div>
                    <h3 style={{
                      fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12,
                      fontFamily: "'Poppins',sans-serif"
                    }}>Oportunidades e Benefícios ({analysis.opportunities.length})</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {analysis.opportunities.map((opp: any, idx: number) => (
                        <div key={idx} style={{
                          display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px',
                          background: 'rgba(15, 168, 143, 0.05)',
                          borderLeft: '3px solid #10b981'
                        }}>
                          <div style={{
                            width: 18, height: 18, borderRadius: '50%', background: '#10b981',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            color: '#fff', fontSize: 11, fontWeight: 700
                          }}>+</div>
                          <p style={{
                            fontSize: 13, color: '#374151', lineHeight: 1.5,
                            fontFamily: "'Poppins',sans-serif"
                          }}>{opp.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#374151',
                marginBottom: 8,
                fontFamily: "'Poppins',sans-serif"
              }}>
                Anexos
              </label>
              <div style={{
                border: '2px dashed #e2e5e9',
                padding: '24px',
                textAlign: 'center',
                transition: 'all .2s',
                cursor: 'pointer'
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#0d1117';
                  e.currentTarget.style.background = '#f6fffd';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#e2e5e9';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="file-upload"
                />
                <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
                  <Paperclip size={32} color="#9ca3af" style={{ margin: '0 auto 8px' }} />
                  <p style={{
                    fontSize: 14,
                    color: '#6b7280',
                    fontFamily: "'Poppins',sans-serif"
                  }}>
                    Clique para fazer upload ou arraste os arquivos aqui
                  </p>
                </label>
              </div>
              
              {attachments.length > 0 && (
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {attachments.map((file, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: '#f7f9fb',
                      border: '1px solid #e2e5e9'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <File size={18} color="#6b7280" />
                        <div>
                          <p style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: '#0d1117',
                            fontFamily: "'Poppins',sans-serif"
                          }}>
                            {file.name}
                          </p>
                          <p style={{
                            fontSize: 11,
                            color: '#6b7280',
                            fontFamily: "'Poppins',sans-serif"
                          }}>
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        style={{
                          padding: '6px 10px',
                          fontSize: 12,
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontFamily: "'Poppins',sans-serif"
                        }}
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Template Library Modal */}
      {showTemplateLibrary && (
        <TemplateLibrary
          onSelectTemplate={handleSelectTemplate}
          onClose={() => setShowTemplateLibrary(false)}
        />
      )}

      {/* AI Contract Generator Modal */}
      {showAIGenerator && (
        <AIContractGenerator
          onGenerated={handleAIGenerated}
          onClose={() => setShowAIGenerator(false)}
        />
      )}

      {/* Save as Template Dialog */}
      {showSaveTemplate && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, fontFamily: "'Poppins', sans-serif"
        }} onClick={(e) => { if (e.target === e.currentTarget) setShowSaveTemplate(false); }}>
          <div style={{
            background: '#fff', width: '100%', maxWidth: 480,
            boxShadow: '0 24px 64px rgba(0,0,0,0.2)'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e5e9' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0d1117', fontFamily: "'Poppins',sans-serif" }}>
                Guardar como Modelo
              </h2>
              <p style={{ fontSize: 13, color: '#6b7280', fontFamily: "'Poppins',sans-serif" }}>
                O conteúdo actual do contrato será guardado como modelo reutilizável
              </p>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, fontFamily: "'Poppins',sans-serif" }}>
                  NOME DO MODELO
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  placeholder="Ex: Contrato de Serviços - Padrão"
                  style={{
                    width: '100%', padding: '10px 14px', fontSize: 14,
                    border: '1.5px solid #e2e5e9', outline: 'none',
                    fontFamily: "'Poppins',sans-serif", color: '#0d1117'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#0d1117'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e2e5e9'}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, fontFamily: "'Poppins',sans-serif" }}>
                  CATEGORIA
                </label>
                <input
                  type="text"
                  value={templateCategory}
                  onChange={e => setTemplateCategory(e.target.value)}
                  placeholder="Ex: Serviços, Recursos Humanos, Comercial..."
                  style={{
                    width: '100%', padding: '10px 14px', fontSize: 14,
                    border: '1.5px solid #e2e5e9', outline: 'none',
                    fontFamily: "'Poppins',sans-serif", color: '#0d1117'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#0d1117'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e2e5e9'}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, fontFamily: "'Poppins',sans-serif" }}>
                  DESCRIÇÃO (OPCIONAL)
                </label>
                <input
                  type="text"
                  value={templateDesc}
                  onChange={e => setTemplateDesc(e.target.value)}
                  placeholder="Breve descrição do modelo"
                  style={{
                    width: '100%', padding: '10px 14px', fontSize: 14,
                    border: '1.5px solid #e2e5e9', outline: 'none',
                    fontFamily: "'Poppins',sans-serif", color: '#0d1117'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#0d1117'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e2e5e9'}
                />
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e5e9', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setShowSaveTemplate(false)}
                style={{
                  padding: '10px 20px', fontSize: 14, fontWeight: 600,
                  background: '#fff', border: '1px solid #e2e5e9', color: '#6b7280',
                  cursor: 'pointer', fontFamily: "'Poppins',sans-serif"
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={savingTemplate}
                style={{
                  padding: '10px 20px', fontSize: 14, fontWeight: 600,
                  background: '#0d1117', border: 'none', color: '#fff',
                  cursor: savingTemplate ? 'not-allowed' : 'pointer',
                  fontFamily: "'Poppins',sans-serif", opacity: savingTemplate ? 0.7 : 1
                }}
              >
                {savingTemplate ? 'Guardando...' : 'Guardar Modelo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Colar Texto Modal */}
      {pasteOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, fontFamily: "'Poppins', sans-serif"
        }} onClick={(e) => { if (e.target === e.currentTarget) setPasteOpen(false); }}>
          <div style={{
            background: '#fff', width: '100%', maxWidth: 560,
            boxShadow: '0 24px 64px rgba(0,0,0,0.2)'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e5e9' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0d1117', fontFamily: "'Poppins',sans-serif" }}>
                Colar Texto do Contrato
              </h2>
              <p style={{ fontSize: 13, color: '#6b7280', fontFamily: "'Poppins',sans-serif" }}>
                Copia o conteúdo do documento existente e cola aqui. Podes também usar para textos copiados de Word.
              </p>
            </div>
            <div style={{ padding: 24 }}>
              <textarea
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                rows={10}
                placeholder="Cola aqui o texto do contrato..."
                style={{
                  width: '100%', padding: '12px 14px', fontSize: 14,
                  border: '1.5px solid #e2e5e9', outline: 'none', resize: 'vertical',
                  fontFamily: "'Poppins',sans-serif", color: '#0d1117', lineHeight: 1.6
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#0d1117'}
                onBlur={e => e.currentTarget.style.borderColor = '#e2e5e9'}
              />
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e5e9', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setPasteOpen(false)}
                style={{
                  padding: '10px 20px', fontSize: 14, fontWeight: 600,
                  background: '#fff', border: '1px solid #e2e5e9', color: '#6b7280',
                  cursor: 'pointer', fontFamily: "'Poppins',sans-serif"
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handlePasteText}
                disabled={extractingText}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', fontSize: 14, fontWeight: 600,
                  background: '#0d1117', border: 'none', color: '#fff',
                  cursor: extractingText ? 'not-allowed' : 'pointer',
                  fontFamily: "'Poppins',sans-serif", opacity: extractingText ? 0.7 : 1
                }}
              >
                {extractingText ? <Loader2 size={16} className="animate-spin" /> : <FileTextIcon size={16} />}
                {extractingText ? 'Adicionando...' : 'Adicionar ao Contrato'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
