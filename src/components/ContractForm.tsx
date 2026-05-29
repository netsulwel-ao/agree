import React, { useState, useEffect } from 'react';
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
  BookTemplate,
  Library
} from 'lucide-react';
import { analyzeContractRisks, generateContractSuggestions, extractContractFromText } from '../services/gemini';
import { extractTextFromPdf } from '../services/pdf';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TemplateLibrary from './TemplateLibrary';
import TemplateFieldForm from './TemplateFieldForm';
import AIContractGenerator from './AIContractGenerator';
import type { FieldDef } from './TemplateFieldForm';
import { exportContractToPdf } from '../services/exportPdf';

export default function ContractForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isEditing = !!editId;
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [extractingPdf, setExtractingPdf] = useState(false);
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
    startDate: '',
    endDate: '',
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);

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
        startDate: data.start_date || '',
        endDate: data.end_date || '',
      });
      setAnalysis(data.risks ? { risks: data.risks } : null);
      setExistingAttachments(data.attachments || []);
      setLoadingContract(false);
    };
    fetchContract();
  }, [editId, user, navigate]);

  const handleAnalyze = async () => {
    if (!formData.content) {
      toast.error("Adicione o conteúdo do contrato para analisar");
      return;
    }
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
    setExtractingPdf(true);
    try {
      const text = await extractTextFromPdf(file);
      setFormData(prev => ({ ...prev, content: text }));
      toast.success(`Texto extraído (${(text.length / 1000).toFixed(0)}k caracteres). A extrair dados...`);

      const extracted = await extractContractFromText(text);
      if (extracted) {
        setFormData(prev => ({
          ...prev,
          title: extracted.title || prev.title,
          description: extracted.description || prev.description,
          value: extracted.value || prev.value,
          startDate: extracted.startDate || prev.startDate,
          endDate: extracted.endDate || prev.endDate,
          content: text,
        }));
        toast.success('Campos preenchidos automaticamente!');
      }

      const result = await analyzeContractRisks(text);
      if (result.risks?.length > 0) {
        setAnalysis(result);
        toast.success(`${result.risks.length} riscos identificados`);
      }
    } catch {
      toast.error('Erro ao processar PDF');
    } finally {
      setExtractingPdf(false);
      e.target.value = '';
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

      if (isEditing) {
        const { error: updateError } = await supabase
          .from('contracts')
          .update({
            title: formData.title,
            description: formData.description,
            content: formData.content,
            value: parseFloat(formData.value) || 0,
            start_date: formData.startDate || null,
            end_date: formData.endDate || null,
            risks: analysis?.risks || [],
            attachments: allAttachments,
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
          content: formData.content,
          version_number: nextVersion
        });

        toast.success("Contrato actualizado com sucesso!");
        navigate(`/contracts/${editId}`);
      } else {
        const { data: contract, error: contractError } = await supabase
          .from('contracts')
          .insert({
            title: formData.title,
            description: formData.description,
            content: formData.content,
            value: parseFloat(formData.value) || 0,
            status: 'draft',
            owner_id: user.id,
            start_date: formData.startDate || null,
            end_date: formData.endDate || null,
            risks: analysis?.risks || [],
            attachments: allAttachments,
          })
          .select()
          .single();

        if (contractError) throw contractError;
        
        await supabase.from('contract_versions').insert({
          contract_id: contract.id,
          content: formData.content,
          version_number: 1
        });

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
    setFormData(prev => ({ ...prev, content: '' }));
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

  const handleGeneratePdf = async () => {
    if (!selectedTemplate) return;
    const missing = (selectedTemplate.fields || [])
      .filter((f: FieldDef) => f.required && !fieldValues[f.name]?.trim())
      .map((f: FieldDef) => f.label);
    if (missing.length > 0) {
      toast.error(`Campos obrigat\u00f3rios: ${missing.join(', ')}`);
      return;
    }
    setExportingPdf(true);
    try {
      let html = selectedTemplate.content;
      (selectedTemplate.fields || []).forEach((f: FieldDef) => {
        const val = fieldValues[f.name] || '';
        html = html.replace(new RegExp(`\\{\\{${f.name}\\}\\}`, 'g'), val);
      });
      await exportContractToPdf({
        title: formData.title || selectedTemplate.name,
        content: html,
        status: 'draft',
        value: fieldValues.valor_total || fieldValues.honorarios || fieldValues.salario_base || fieldValues.valor_renda || '',
        risk_level: 'low',
        description: `Gerado do modelo: ${selectedTemplate.name}`,
        start_date: fieldValues.data_inicio || fieldValues.data_admissao || fieldValues.data_celebracao || '',
        end_date: fieldValues.prazo_execucao || fieldValues.duracao_arrendamento || '',
      });
      toast.success('PDF exportado com sucesso');
    } catch (err) {
      toast.error('Erro ao exportar PDF');
    } finally {
      setExportingPdf(false);
    }
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
                onClick={() => navigate('/contracts')}
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
                        onClick={() => setShowAIGenerator(true)}
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
              {selectedTemplate ? (
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
                  <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={handleGeneratePdf}
                      disabled={exportingPdf}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '12px 28px',
                        fontSize: 14, fontWeight: 700,
                        background: exportingPdf ? '#e2e5e9' : '#0d1117',
                        border: 'none', color: exportingPdf ? '#6b7280' : '#fff',
                        cursor: exportingPdf ? 'not-allowed' : 'pointer',
                        fontFamily: "'Poppins',sans-serif",
                        transition: 'all .2s'
                      }}
                      onMouseEnter={e => { if (!exportingPdf) e.currentTarget.style.background = '#000'; }}
                      onMouseLeave={e => { if (!exportingPdf) e.currentTarget.style.background = '#0d1117'; }}
                    >
                      {exportingPdf ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}
                      {exportingPdf ? 'A exportar...' : 'Exportar PDF'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <textarea
                    value={formData.content}
                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Escreve ou cola o conte\u00fado completo do contrato aqui..."
                    rows={16}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      fontSize: 14,
                      fontFamily: "'Poppins',sans-serif",
                      background: '#fff',
                      border: '1.5px solid #e2e5e9',
                      color: '#0d1117',
                      outline: 'none',
                      resize: 'vertical',
                      lineHeight: 1.7,
                      boxSizing: 'border-box'
                    }}
                  />
                  {formData.content && (
                    <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setShowSaveTemplate(true)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '6px 12px', fontSize: 12, fontWeight: 600,
                          background: 'transparent', border: 'none',
                          color: '#6b7280', cursor: 'pointer',
                          fontFamily: "'Poppins',sans-serif", transition: 'all .2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#0d1117'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#6b7280'; }}
                      >
                        <BookTemplate size={14} />
                        Guardar como Modelo
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await exportContractToPdf({
                            title: formData.title || 'contrato',
                            content: formData.content,
                            status: 'draft',
                            value: formData.value,
                            risk_level: 'low',
                            description: formData.description,
                            start_date: formData.startDate,
                            end_date: formData.endDate,
                          });
                        }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '6px 14px', fontSize: 12, fontWeight: 600,
                          background: '#0d1117', border: 'none', color: '#fff',
                          cursor: 'pointer', fontFamily: "'Poppins',sans-serif"
                        }}
                      >
                        <FileUp size={14} />
                        Exportar PDF
                      </button>
                    </div>
                  )}
                </>
              )}
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
    </div>
  );
}
