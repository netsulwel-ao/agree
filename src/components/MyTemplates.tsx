import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserTemplates, useDeleteTemplate, useCreateTemplate, useUpdateTemplate } from '../hooks/useTemplates';
import {
  FileText, Trash2, Edit3, Plus, X, Loader2, BookTemplate,
  Star, Search, Check, AlertTriangle, Save
} from 'lucide-react';
import { toast } from 'sonner';
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
  const [variables, setVariables] = useState<TemplateField[]>([]);
  const [saving, setSaving] = useState(false);

  const filtered = templates.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setName('');
    setDescription('');
    setCategory('');
    setContent('');
    setVariables([]);
    setEditingId(null);
    setShowCreate(false);
  };

  const openEdit = (t: Template) => {
    setName(t.name);
    setDescription(t.description || '');
    setCategory(t.category);
    setContent(t.content);
    setVariables(t.variables || []);
    setEditingId(t.id);
    setShowCreate(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !category.trim() || !content.trim()) {
      toast.error('Nome, categoria e conteúdo são obrigatórios');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateTemplate.mutateAsync({
          id: editingId,
          name: name.trim(),
          description: description.trim(),
          category: category.trim(),
          content,
          variables,
        });
        toast.success('Modelo actualizado');
      } else {
        await createTemplate.mutateAsync({
          name: name.trim(),
          description: description.trim(),
          category: category.trim(),
          content,
          variables,
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

  const addVariable = () => {
    setVariables(prev => [...prev, { name: '', label: '', type: 'text', required: false }]);
  };

  const updateVariable = (idx: number, field: Partial<TemplateField>) => {
    setVariables(prev => prev.map((v, i) => i === idx ? { ...v, ...field } : v));
  };

  const removeVariable = (idx: number) => {
    setVariables(prev => prev.filter((_, i) => i !== idx));
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
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Conteúdo (HTML) *</label>
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
              </div>

              {/* Variables */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Variáveis (campos dinâmicos)</span>
                  <button onClick={addVariable}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', background: '#f0f2f4', border: 'none',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#0d1117'
                    }}
                  >
                    <Plus size={14} /> Adicionar Campo
                  </button>
                </div>
                {variables.length === 0 && (
                  <p style={{ fontSize: 12, color: '#9ca3af' }}>Nenhuma variável definida. Usa <code>{'{{var_name}}'}</code> no conteúdo.</p>
                )}
                {variables.map((v, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <input type="text" value={v.name} onChange={e => updateVariable(i, { name: e.target.value })}
                      placeholder="var_name" style={{
                        width: 140, padding: '8px 10px', fontSize: 12, border: '1.5px solid #e2e5e9',
                        outline: 'none', fontFamily: "'Courier New', monospace", color: '#0d1117'
                      }}
                    />
                    <input type="text" value={v.label} onChange={e => updateVariable(i, { label: e.target.value })}
                      placeholder="Rótulo" style={{
                        flex: 1, padding: '8px 10px', fontSize: 12, border: '1.5px solid #e2e5e9',
                        outline: 'none', fontFamily: "'Poppins',sans-serif", color: '#0d1117'
                      }}
                    />
                    <select value={v.type} onChange={e => updateVariable(i, { type: e.target.value as any })}
                      style={{
                        width: 100, padding: '8px 10px', fontSize: 12, border: '1.5px solid #e2e5e9',
                        outline: 'none', fontFamily: "'Poppins',sans-serif", color: '#0d1117', background: '#fff'
                      }}
                    >
                      <option value="text">Texto</option>
                      <option value="textarea">Área</option>
                      <option value="date">Data</option>
                      <option value="currency">Valor</option>
                    </select>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6b7280', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      <input type="checkbox" checked={v.required} onChange={e => updateVariable(i, { required: e.target.checked })} />
                      Obrigatório
                    </label>
                    <button onClick={() => removeVariable(i)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

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
                return (
                  <div key={t.id} style={{
                    background: '#fff', border: '1px solid #e2e5e9', overflow: 'hidden',
                    transition: 'all .2s'
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#0d1117'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e5e9'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{ padding: 20 }}>
                      <div style={{ width: 36, height: 36, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color }}>
                        <FileText size={18} />
                      </div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0d1117', marginBottom: 4 }}>{t.name}</h3>
                      <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {t.description || 'Sem descrição'}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', background: bg, color }}>
                          {t.category}
                        </span>
                        {t.usage_count > 0 && (
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
