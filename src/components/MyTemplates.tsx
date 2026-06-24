import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserTemplates, useDeleteTemplate, useCreateTemplate, useUpdateTemplate } from '../hooks/useTemplates';
import { useAuth } from '../contexts/AuthContext';
import {
  FileText, Trash2, Edit3, Plus, X, Loader2, BookTemplate,
  Star, Search, Check, AlertTriangle, Save, Crown, Zap, Building2, Code2
} from 'lucide-react';
import { toast } from 'sonner';
import RichTextEditor from './RichTextEditor';
import type { Template, TemplateField } from '../hooks/useTemplates';

const categoryColors: Record<string, string> = {
  'Serviços': '#3b82f6', 'Recursos Humanos': '#10b981',
  'Confidencialidade': '#f59e0b', 'Imobiliário': '#a855f7', 'Comercial': '#ef4444',
};

const categoryBg: Record<string, string> = {
  'Serviços': 'rgba(59,130,246,0.1)', 'Recursos Humanos': 'rgba(16,185,129,0.1)',
  'Confidencialidade': 'rgba(245,158,11,0.1)', 'Imobiliário': 'rgba(168,85,247,0.1)',
  'Comercial': 'rgba(239,68,68,0.1)',
};

export default function MyTemplates() {
  const navigate = useNavigate();
  const { plan: userPlan } = useAuth();
  const { data: templates = [], isLoading } = useUserTemplates();
  const deleteTemplate = useDeleteTemplate();
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();

  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  const detectedVars = useMemo(() => {
    const matches = content.match(/\{\{(\w+)\}\}/g);
    if (!matches) return [];
    const unique = [...new Set(matches.map(m => m.replace(/\{|\}/g, '')))];
    return unique.map(name => ({
      name,
      label: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      type: 'text' as const,
      required: true,
    }));
  }, [content]);

  const replaceVars = (html: string, vals: Record<string, string>) => {
    let result = html;
    for (const [key, val] of Object.entries(vals)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val || `<span style="color:#ccc;border-bottom:1px dashed #ccc;">{{${key}}}</span>`);
    }
    return result;
  };

  const filtered = templates.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  // Filtrar modelos por plano do usuário
  const canAccessPlan = (templatePlan?: string) => {
    if (!templatePlan) return true;
    if (templatePlan === 'free') return true;
    if (templatePlan === 'pro') return userPlan === 'pro' || userPlan === 'enterprise';
    if (templatePlan === 'enterprise') return userPlan === 'enterprise';
    return true;
  };

  const getPlanBadge = (templatePlan?: string) => {
    if (!templatePlan || templatePlan === 'free') return null;
    if (templatePlan === 'pro') {
      return (
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '2px 8px', background: 'rgba(59,130,246,0.1)',
          color: '#3b82f6', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4
        }}>
          <Zap size={10} /> Pro
        </span>
      );
    }
    if (templatePlan === 'enterprise') {
      return (
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '2px 8px', background: 'rgba(168,85,247,0.1)',
          color: '#a855f7', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4
        }}>
          <Crown size={10} /> Enterprise
        </span>
      );
    }
    return null;
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setCategory('');
    setContent('');
    setEditingId(null);
    setShowCreate(false);
    setShowSource(false);
    setFieldValues({});
  };

  const openEdit = (t: Template) => {
    setName(t.name);
    setDescription(t.description || '');
    setCategory(t.category);
    setContent(t.content);
    setFieldValues({});
    setEditingId(t.id);
    setShowCreate(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !category.trim() || !content.trim()) {
      toast.error('Nome, categoria e conteúdo são obrigatórios');
      return;
    }
    setSaving(true);
    const varsToSave: TemplateField[] = detectedVars.map(v => ({
      ...v,
      type: v.name.toLowerCase().includes('data') ? 'date' as const : v.name.toLowerCase().includes('valor') || v.name.toLowerCase().includes('preco') ? 'currency' as const : 'text' as const,
    }));
    try {
      if (editingId) {
        await updateTemplate.mutateAsync({
          id: editingId,
          name: name.trim(),
          description: description.trim(),
          category: category.trim(),
          content,
          variables: varsToSave,
        });
        toast.success('Modelo actualizado');
      } else {
        await createTemplate.mutateAsync({
          name: name.trim(),
          description: description.trim(),
          category: category.trim(),
          content,
          variables: varsToSave,
        });
        toast.success('Modelo criado');
      }
      resetForm();
    } catch {
      toast.error('Erro ao salvar modelo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Eliminar modelo "${name}"?`)) return;
    deleteTemplate.mutate(id, {
      onSuccess: () => toast.success('Modelo eliminado'),
      onError: () => toast.error('Erro ao eliminar modelo'),
    });
  };

  const containerStyle: React.CSSProperties = {
    fontFamily: "'Poppins', sans-serif", maxWidth: 1200, margin: '0 auto',
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(30px)',
    border: '1px solid rgba(255,255,255,0.35)', borderRadius: 24,
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)', overflow: 'hidden',
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Header */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid #e2e5e9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0d1117' }}>Meus Modelos</h2>
            <p style={{ fontSize: 13, color: '#6b7280' }}>Gerir modelos de contrato personalizados</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowCreate(true); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', background: '#0d1117', color: '#fff',
              border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Plus size={16} />
            Novo Modelo
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '16px 28px', borderBottom: '1px solid #f0f2f4' }}>
          <div style={{ position: 'relative', maxWidth: 400 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar modelos..."
              style={{
                width: '100%', padding: '8px 12px 8px 36px', fontSize: 13,
                border: '1.5px solid #e2e5e9', outline: 'none', borderRadius: 8,
                fontFamily: "'Poppins',sans-serif", color: '#0d1117'
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#0d1117'}
              onBlur={e => e.currentTarget.style.borderColor = '#e2e5e9'}
            />
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 28, minHeight: 300 }}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, color: '#9ca3af', gap: 10 }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
              A carregar modelos...
            </div>
          ) : showCreate ? (
            /* Create / Edit Form */
            <div style={{ maxWidth: 800 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Nome *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Ex: Contrato de Prestação de Serviços"
                    style={{
                      width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid #e2e5e9',
                      outline: 'none', fontFamily: "'Poppins',sans-serif", color: '#0d1117'
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = '#0d1117'}
                    onBlur={e => e.currentTarget.style.borderColor = '#e2e5e9'}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Categoria *</label>
                  <select value={category} onChange={e => setCategory(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid #e2e5e9',
                      outline: 'none', fontFamily: "'Poppins',sans-serif", color: '#0d1117', background: '#fff'
                    }}
                  >
                    <option value="">Seleccionar categoria</option>
                    <option value="Serviços">Serviços</option>
                    <option value="Recursos Humanos">Recursos Humanos</option>
                    <option value="Confidencialidade">Confidencialidade</option>
                    <option value="Imobiliário">Imobiliário</option>
                    <option value="Comercial">Comercial</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Descrição</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Breve descrição do modelo"
                  style={{
                    width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid #e2e5e9',
                    outline: 'none', fontFamily: "'Poppins',sans-serif", color: '#0d1117'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#0d1117'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e2e5e9'}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Conteúdo *</label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button type="button" onClick={() => setShowSource(false)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
                        background: !showSource ? '#0d1117' : '#f0f2f4', border: 'none',
                        fontSize: 11, fontWeight: 600, cursor: 'pointer', color: !showSource ? '#fff' : '#6b7280'
                      }}
                    >
                      Pré-visualizar
                    </button>
                    <button type="button" onClick={() => setShowSource(true)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
                        background: showSource ? '#0d1117' : '#f0f2f4', border: 'none',
                        fontSize: 11, fontWeight: 600, cursor: 'pointer', color: showSource ? '#fff' : '#6b7280'
                      }}
                    >
                      <Code2 size={13} /> HTML
                    </button>
                  </div>
                </div>
                {showSource ? (
                  <textarea value={content} onChange={e => setContent(e.target.value)}
                    placeholder="<p>Entre as partes <strong>{{parte_nome}}</strong>...</p>"
                    rows={12}
                    style={{
                      width: '100%', padding: '14px', fontSize: 13, border: '1.5px solid #e2e5e9',
                      outline: 'none', fontFamily: "'Courier New', monospace", color: '#0d1117', resize: 'vertical', lineHeight: 1.6
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = '#0d1117'}
                    onBlur={e => e.currentTarget.style.borderColor = '#e2e5e9'}
                  />
                ) : (
                  <iframe
                    srcDoc={replaceVars(content, fieldValues)}
                    title="Pré-visualização do modelo"
                    style={{
                      width: '100%', height: 600, border: '1.5px solid #e2e5e9',
                      background: '#fff'
                    }}
                  />
                )}
              </div>

              {/* Auto-detected fields */}
              {detectedVars.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 3, height: 14, background: '#0d1117', borderRadius: 2 }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#0d1117' }}>Preenche os campos para testar o modelo</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {detectedVars.map(v => {
                      const isDate = v.name.toLowerCase().includes('data');
                      const isCurrency = v.name.toLowerCase().includes('valor') || v.name.toLowerCase().includes('preco');
                      return (
                        <div key={v.name}>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#6b7280', marginBottom: 4 }}>
                            {v.label} <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          {isDate ? (
                            <input type="date" value={fieldValues[v.name] || ''} onChange={e => setFieldValues(prev => ({ ...prev, [v.name]: e.target.value }))}
                              style={{
                                width: '100%', padding: '8px 10px', fontSize: 13, border: '1.5px solid #e2e5e9',
                                outline: 'none', fontFamily: "'Poppins',sans-serif", color: '#0d1117'
                              }}
                              onFocus={e => e.currentTarget.style.borderColor = '#0d1117'}
                              onBlur={e => e.currentTarget.style.borderColor = '#e2e5e9'}
                            />
                          ) : (
                            <input type="text" value={fieldValues[v.name] || ''} onChange={e => setFieldValues(prev => ({ ...prev, [v.name]: e.target.value }))}
                              placeholder={v.label}
                              style={{
                                width: '100%', padding: '8px 10px', fontSize: 13, border: '1.5px solid #e2e5e9',
                                outline: 'none', fontFamily: "'Poppins',sans-serif", color: '#0d1117'
                              }}
                              onFocus={e => e.currentTarget.style.borderColor = '#0d1117'}
                              onBlur={e => e.currentTarget.style.borderColor = '#e2e5e9'}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {detectedVars.length === 0 && !showSource && (
                <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>
                  Usa <code style={{ background: '#f0f2f4', padding: '2px 6px' }}>{'{{nome_variavel}}'}</code> no conteúdo para criar campos dinâmicos
                </p>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleSave} disabled={saving}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '10px 24px', background: '#0d1117', color: '#fff',
                    border: 'none', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1
                  }}
                >
                  {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                  {editingId ? 'Actualizar' : 'Criar'} Modelo
                </button>
                <button onClick={resetForm}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '10px 20px', background: '#fff', color: '#6b7280',
                    border: '1px solid #e2e5e9', fontSize: 14, fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  <X size={16} />
                  Cancelar
                </button>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
              <BookTemplate size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p style={{ fontSize: 15 }}>{templates.length === 0 ? 'Ainda não tens modelos personalizados' : 'Nenhum modelo encontrado'}</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>
                {templates.length === 0
                  ? 'Guarda um contrato como modelo para reutilizar depois'
                  : 'Tenta ajustar a pesquisa'}
              </p>
              {templates.length === 0 && (
                <button onClick={() => { resetForm(); setShowCreate(true); }}
                  style={{
                    marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '10px 20px', background: '#0d1117', color: '#fff',
                    border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  <Plus size={16} />
                  Criar Primeiro Modelo
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {filtered.map(t => {
                const color = categoryColors[t.category] || '#6b7280';
                const bg = categoryBg[t.category] || 'rgba(13,17,23,0.06)';
                const canAccess = canAccessPlan(t.plan);
                const planBadge = getPlanBadge(t.plan);
                
                return (
                  <div key={t.id} style={{
                    background: '#fff', border: '1px solid #e2e5e9', overflow: 'hidden',
                    transition: 'all .2s', opacity: canAccess ? 1 : 0.6
                  }}
                    onMouseEnter={e => { if (canAccess) { e.currentTarget.style.borderColor = '#0d1117'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; } }}
                    onMouseLeave={e => { if (canAccess) { e.currentTarget.style.borderColor = '#e2e5e9'; e.currentTarget.style.boxShadow = 'none'; } }}
                  >
                    <div style={{ padding: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div style={{ width: 36, height: 36, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                          <FileText size={18} />
                        </div>
                        {planBadge}
                      </div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0d1117', marginBottom: 4 }}>{t.name}</h3>
                      <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {t.description || 'Sem descrição'}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', background: bg, color }}>
                          {t.category}
                        </span>
                        {t.usage_count && t.usage_count > 0 && (
                          <span style={{ fontSize: 10, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Star size={10} /> {t.usage_count} usos
                          </span>
                        )}
                        <span style={{ fontSize: 10, color: '#9ca3af' }}>
                          {(t.variables?.length || 0)} campos
                        </span>
                      </div>
                    </div>
                    <div style={{ padding: '12px 20px', borderTop: '1px solid #f0f2f4', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      {canAccess ? (
                        <>
                          <button onClick={() => openEdit(t)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                              background: '#f0f2f4', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#0d1117'
                            }}
                          >
                            <Edit3 size={14} /> Editar
                          </button>
                          <button onClick={() => handleDelete(t.id, t.name)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                              background: 'rgba(239,68,68,0.08)', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#ef4444'
                            }}
                          >
                            <Trash2 size={14} /> Eliminar
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => navigate('/pricing')}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none',
                            fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#fff'
                          }}
                        >
                          <Crown size={14} /> Upgrade
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Loading overlay for mutations */}
      {deleteTemplate.isPending && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '24px 32px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#0d1117' }}>A eliminar...</span>
          </div>
        </div>
      )}
    </div>
  );
}
