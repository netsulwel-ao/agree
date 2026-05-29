import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  FileText, Search, X, Loader2, BookTemplate, FolderOpen,
  Briefcase, Users, Home, Shield, Handshake, FileCode, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import AgreeLogo from '../Agree-logo.svg';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  variables: string[];
  is_system: boolean;
}

interface TemplateLibraryProps {
  onSelectTemplate: (template: Template) => void;
  onClose: () => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  'Serviços': <Briefcase size={20} />,
  'Recursos Humanos': <Users size={20} />,
  'Confidencialidade': <Shield size={20} />,
  'Imobiliário': <Home size={20} />,
  'Comercial': <Handshake size={20} />,
};

const categoryBg: Record<string, string> = {
  'Serviços': 'rgba(59, 130, 246, 0.1)',
  'Recursos Humanos': 'rgba(16, 185, 129, 0.1)',
  'Confidencialidade': 'rgba(245, 158, 11, 0.1)',
  'Imobiliário': 'rgba(168, 85, 247, 0.1)',
  'Comercial': 'rgba(239, 68, 68, 0.1)',
};

const categoryColors: Record<string, string> = {
  'Serviços': '#3b82f6',
  'Recursos Humanos': '#10b981',
  'Confidencialidade': '#f59e0b',
  'Imobiliário': '#a855f7',
  'Comercial': '#ef4444',
};

export default function TemplateLibrary({ onSelectTemplate, onClose }: TemplateLibraryProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [preview, setPreview] = useState<Template | null>(null);
const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from('contract_templates')
          .select('*')
          .order('category', { ascending: true })
          .order('name', { ascending: true });

        if (error) { console.error('[TemplateLibrary] Supabase error:', error); throw error; }
        console.log('[TemplateLibrary] Loaded templates:', data?.length);
        setTemplates(data || []);
        setDebugInfo('OK: ' + (data?.length || 0) + ' modelos');
      } catch (e) {
        console.error('[TemplateLibrary] Caught error:', e);
        setDebugInfo('ERRO: ' + (e instanceof Error ? e.message : 'desconhecido'));
        toast.error('Erro ao carregar modelos: ' + (e instanceof Error ? e.message : 'Erro desconhecido'));
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const categories = [...new Set(templates.map(t => t.category))];

  const filtered = templates.filter(t => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !selectedCategory || t.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const handleApply = (template: Template) => {
    onSelectTemplate(template);
    onClose();
  };

  const modalOverlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24, fontFamily: "'Poppins', sans-serif"
  };

  const modalCard: React.CSSProperties = {
    background: '#fff', width: '100%', maxWidth: 1000, maxHeight: '85vh',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    boxShadow: '0 24px 64px rgba(0,0,0,0.2)'
  };

  if (preview) {
    return (
      <div style={modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div style={modalCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e2e5e9' }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0d1117', fontFamily: "'Poppins',sans-serif" }}>{preview.name}</h2>
              <p style={{ fontSize: 13, color: '#6b7280', fontFamily: "'Poppins',sans-serif" }}>{preview.description}</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => handleApply(preview)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', background: '#0d1117', color: '#fff',
                  border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'Poppins',sans-serif"
                }}
              >
                <BookTemplate size={16} />
                Usar Modelo
              </button>
              <button
                onClick={() => setPreview(null)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 16px', background: '#fff', color: '#6b7280',
                  border: '1px solid #e2e5e9', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'Poppins',sans-serif"
                }}
              >
                <X size={16} />
                Voltar
              </button>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 24, position: 'relative' }}>
            <div
              style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, lineHeight: 1.8, color: '#374151', maxWidth: 700, margin: '0 auto' }}
              dangerouslySetInnerHTML={{ __html: preview.content }}
            />
            <div style={{
              position: 'sticky', bottom: 0, left: 0, right: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4,
              padding: '8px 16px',
              borderTop: '1px solid #e2e5e9',
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(8px)',
              fontSize: 10,
              fontWeight: 700,
              color: 'rgba(0,0,0,0.2)',
              fontFamily: "'Poppins',sans-serif",
              letterSpacing: 0.5,
              pointerEvents: 'none',
              userSelect: 'none'
            }}>
              <img src={AgreeLogo} alt="" style={{ height: 12, display: 'block', opacity: 0.4 }} />
              Agree — free plan
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modalCard}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e5e9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0d1117', fontFamily: "'Poppins',sans-serif" }}>
                Biblioteca de Modelos
              </h2>
              <p style={{ fontSize: 13, color: '#6b7280', fontFamily: "'Poppins',sans-serif" }}>
                Escolhe um modelo para começar o teu contrato
              </p>
            </div>
            <button
              onClick={onClose}
              style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280' }}
            >
              <X size={20} />
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar modelos..."
              style={{
                width: '100%', padding: '10px 14px 10px 42px', fontSize: 14,
                border: '1.5px solid #e2e5e9', outline: 'none',
                fontFamily: "'Poppins',sans-serif", color: '#0d1117'
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#0d1117'}
              onBlur={e => e.currentTarget.style.borderColor = '#e2e5e9'}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar - Categories */}
          <div style={{
            width: 200, flexShrink: 0, borderRight: '1px solid #e2e5e9',
            padding: 16, overflowY: 'auto'
          }}>
            <button
              onClick={() => setSelectedCategory(null)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', background: !selectedCategory ? '#f0f0f0' : 'transparent',
                border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                color: '#0d1117', fontFamily: "'Poppins',sans-serif", textAlign: 'left'
              }}
            >
              <FolderOpen size={16} />
              Todas as Categorias
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', background: selectedCategory === cat ? 'rgba(13,17,23,0.06)' : 'transparent',
                  border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: selectedCategory === cat ? 700 : 500,
                  color: selectedCategory === cat ? '#0d1117' : '#6b7280',
                  fontFamily: "'Poppins',sans-serif", textAlign: 'left', transition: 'all .15s'
                }}
                onMouseEnter={e => { if (selectedCategory !== cat) e.currentTarget.style.background = 'rgba(13,17,23,0.03)'; }}
                onMouseLeave={e => { if (selectedCategory !== cat) e.currentTarget.style.background = 'transparent'; }}
              >
                {categoryIcons[cat] || <FileCode size={16} />}
                {cat}
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9ca3af' }}>
                  {templates.filter(t => t.category === cat).length}
                </span>
              </button>
            ))}
          </div>

          {/* Grid */}
          <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, color: '#9ca3af', gap: 10 }}>
                <Loader2 size={20} className="animate-spin" />
                A carregar modelos...
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
                <FileText size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
                <p style={{ fontSize: 15, fontFamily: "'Poppins',sans-serif" }}>Nenhum modelo encontrado</p>
                <p style={{ fontSize: 13, marginTop: 4, fontFamily: "'Poppins',sans-serif" }}>Tenta ajustar a pesquisa ou filtros</p>
                <p style={{ fontSize: 11, marginTop: 16, fontFamily: "'Poppins',sans-serif", color: debugInfo.includes('ERRO') ? '#ef4444' : '#6b7280' }}>
                  {debugInfo || (loading ? 'A carregar...' : '')}
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {filtered.map(template => {
                  const bg = categoryBg[template.category] || 'rgba(13,17,23,0.06)';
                  const color = categoryColors[template.category] || '#6b7280';
                  return (
                    <div
                      key={template.id}
                      onClick={() => setPreview(template)}
                      style={{
                        background: '#fff', border: '1px solid #e2e5e9', cursor: 'pointer',
                        transition: 'all .2s', display: 'flex', flexDirection: 'column'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#0d1117'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e5e9'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div style={{ padding: 20, flex: 1 }}>
                        <div style={{ width: 40, height: 40, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, color: color }}>
                          {categoryIcons[template.category] || <FileText size={20} />}
                        </div>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0d1117', marginBottom: 6, fontFamily: "'Poppins',sans-serif" }}>
                          {template.name}
                        </h3>
                        <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5, fontFamily: "'Poppins',sans-serif", display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {template.description || 'Sem descrição'}
                        </p>
                      </div>
                      <div style={{ padding: '12px 20px', borderTop: '1px solid #f0f2f4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', background: bg, color: color, fontFamily: "'Poppins',sans-serif" }}>
                          {template.category}
                        </span>
                        <ChevronRight size={16} color="#9ca3af" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
