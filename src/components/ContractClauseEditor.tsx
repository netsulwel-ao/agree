import React, { useEffect, useRef, useState } from 'react';
import {
  Plus, Trash2, ArrowUp, ArrowDown, Copy, FileUp, Loader2,
  Sparkles, Eye, Pencil, ChevronDown, FileText as FileTextIcon,
} from 'lucide-react';
import {
  parseContract, serializeContract, renumberClauses, fillPlaceholders,
  formatClauseNum, CLAUSE_PRESETS,
  type ParsedContract, type ContractClause,
} from '../services/clauses';
import { generateContractSuggestions } from '../services/gemini';
import { toast } from 'sonner';

interface ContractClauseEditorProps {
  content: string;
  fieldValues: Record<string, string>;
  onChange: (html: string) => void;
  exportingPdf?: boolean;
  onExportPdf?: () => void;
  canUseAI?: boolean;
  onRequirePro?: (feature: string) => boolean;
}

const btnBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 14px', fontSize: 12, fontWeight: 600,
  border: 'none', cursor: 'pointer', fontFamily: "'Poppins',sans-serif",
  transition: 'background .2s',
};

export default function ContractClauseEditor({
  content, fieldValues, onChange,
  exportingPdf, onExportPdf, canUseAI, onRequirePro,
}: ContractClauseEditorProps) {
  const [parsed, setParsed] = useState<ParsedContract>(() => parseContract(content));
  const [addOpen, setAddOpen] = useState(false);
  const [aiTitle, setAiTitle] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [view, setView] = useState<'edit' | 'preview'>('edit');
  const lastEmitted = useRef<string | null>(null);

  useEffect(() => {
    if (content !== lastEmitted.current) {
      setParsed(parseContract(content));
    }
  }, [content]);

  const commit = (next: ParsedContract) => {
    setParsed(next);
    const html = serializeContract(next);
    lastEmitted.current = html;
    onChange(html);
  };

  const patchClause = (id: string, patch: Partial<ContractClause>) => {
    commit({
      ...parsed,
      clauses: parsed.clauses.map(c => (c.id === id ? { ...c, ...patch } : c)),
    });
  };

  const addClause = (title: string, body: string) => {
    const next: ParsedContract = {
      ...parsed,
      clauses: [...parsed.clauses, { id: Math.random().toString(36).slice(2), num: parsed.clauses.length + 1, title, body }],
    };
    commit(renumberClauses(next));
    setAddOpen(false);
  };

  const removeClause = (id: string) => {
    const next = { ...parsed, clauses: parsed.clauses.filter(c => c.id !== id) };
    commit(renumberClauses(next));
  };

  const duplicateClause = (id: string) => {
    const idx = parsed.clauses.findIndex(c => c.id === id);
    if (idx === -1) return;
    const src = parsed.clauses[idx];
    const copy: ContractClause = { ...src, id: Math.random().toString(36).slice(2), num: src.num + 1 };
    const clauses = [...parsed.clauses];
    clauses.splice(idx + 1, 0, copy);
    commit(renumberClauses({ ...parsed, clauses }));
  };

  const moveClause = (id: string, dir: -1 | 1) => {
    const idx = parsed.clauses.findIndex(c => c.id === id);
    const target = idx + dir;
    if (idx === -1 || target < 0 || target >= parsed.clauses.length) return;
    const clauses = [...parsed.clauses];
    [clauses[idx], clauses[target]] = [clauses[target], clauses[idx]];
    commit(renumberClauses({ ...parsed, clauses }));
  };

  const handleAiGenerate = async () => {
    if (!aiTitle.trim()) {
      toast.error('Indica o título da cláusula a gerar');
      return;
    }
    if (onRequirePro && !onRequirePro('Geração de cláusulas com IA')) return;
    setAiGenerating(true);
    try {
      const text = await generateContractSuggestions(
        `Escreve APENAS o corpo de uma cláusula contratual intitulada "${aiTitle.trim()}". Responde com texto corrido em português, sem título, sem numeração e sem marcação markdown.`
      );
      if (text && text.trim()) {
        addClause(aiTitle.trim(), text.trim());
        setAiTitle('');
        toast.success('Cláusula gerada e adicionada');
      } else {
        toast.error('Não foi possível gerar a cláusula');
      }
    } catch {
      toast.error('Erro ao gerar cláusula');
    } finally {
      setAiGenerating(false);
    }
  };

  const filledHtml = fillPlaceholders(serializeContract(parsed), fieldValues);
  const clauseCount = parsed.clauses.length;

  const toolbar = (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      padding: '12px 16px', borderBottom: '1px solid #e2e5e9',
    }}>
      <FileTextIcon size={16} color="#6b7280" />
      <span style={{ fontSize: 13, fontWeight: 700, color: '#0d1117' }}>
        Cláusulas ({clauseCount})
      </span>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => setView(view === 'edit' ? 'preview' : 'edit')}
          style={{ ...btnBase, background: '#fff', border: '1px solid #e2e5e9', color: '#6b7280' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f7f9fb'; e.currentTarget.style.color = '#0d1117'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#6b7280'; }}
        >
          {view === 'edit' ? <Eye size={14} /> : <Pencil size={14} />}
          {view === 'edit' ? 'Pré-visualizar' : 'Editar'}
        </button>
        {onExportPdf && (
          <button
            type="button"
            onClick={onExportPdf}
            disabled={exportingPdf || clauseCount === 0}
            style={{ ...btnBase, background: '#0d1117', color: '#fff', opacity: (exportingPdf || clauseCount === 0) ? 0.6 : 1 }}
            onMouseEnter={e => { if (!exportingPdf && clauseCount > 0) e.currentTarget.style.background = '#000'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#0d1117'; }}
          >
            {exportingPdf ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
            {exportingPdf ? 'A exportar...' : 'Exportar PDF'}
          </button>
        )}
      </div>
    </div>
  );

  const addMenu = addOpen && (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setAddOpen(false)} />
      <div style={{
        position: 'absolute', top: '100%', left: 0, marginTop: 6, zIndex: 1000,
        background: '#fff', border: '1px solid #e2e5e9', boxShadow: '0 16px 40px rgba(0,0,0,0.15)',
        width: 320, maxHeight: 360, overflow: 'auto',
      }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #f0f2f4' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0d1117' }}>Adicionar cláusula</div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>Escolhe um modelo ou escreve à medida</div>
        </div>
        <div style={{ padding: 10 }}>
          <button
            type="button"
            onClick={() => addClause('Nova Cláusula', 'Texto da cláusula...')}
            style={{ ...btnBase, width: '100%', background: '#0d1117', color: '#fff', justifyContent: 'center' }}
          >
            <Plus size={14} />
            Cláusula em branco
          </button>

          <div style={{ marginTop: 12, marginBottom: 6, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#9ca3af' }}>
            GERAR COM IA {canUseAI ? null : '(PRO)'}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={aiTitle}
              onChange={e => setAiTitle(e.target.value)}
              placeholder="Título da cláusula (ex: Responsabilidade)"
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAiGenerate(); } }}
              style={{
                flex: 1, padding: '8px 10px', fontSize: 12, border: '1.5px solid #e2e5e9', outline: 'none',
                fontFamily: "'Poppins',sans-serif", color: '#0d1117',
              }}
            />
            <button
              type="button"
              onClick={handleAiGenerate}
              disabled={aiGenerating}
              style={{ ...btnBase, background: 'linear-gradient(135deg,#0d1117,#000)', color: '#fff', opacity: aiGenerating ? 0.7 : 1 }}
            >
              {aiGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            </button>
          </div>

          <div style={{ marginTop: 14, marginBottom: 6, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#9ca3af' }}>
            MODELOS PRONTOS
          </div>
          {CLAUSE_PRESETS.map(p => (
            <button
              key={p.title}
              type="button"
              onClick={() => addClause(p.title, p.body)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontSize: 12, color: '#374151', textAlign: 'left', borderRadius: 4,
                fontFamily: "'Poppins',sans-serif",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f7f9fb'; e.currentTarget.style.color = '#0d1117'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#374151'; }}
            >
              <ChevronDown size={12} color="#9ca3af" />
              {p.title}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div style={{ background: '#fff', border: '1.5px solid #e2e5e9' }}>
      <div style={{ position: 'relative' }}>
        {toolbar}
        {addMenu}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: view === 'edit' ? '1fr 1fr' : '1fr', minHeight: 480 }}>
        {view === 'edit' && (
          <div style={{ padding: 16, borderRight: '1px solid #e2e5e9', display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 720, overflow: 'auto' }}>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              style={{ ...btnBase, background: '#0d1117', color: '#fff', justifyContent: 'center' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#000'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#0d1117'; }}
            >
              <Plus size={14} />
              Adicionar Cláusula
            </button>

            {clauseCount === 0 && (
              <div style={{
                textAlign: 'center', padding: '60px 20px', color: '#9ca3af',
                border: '1.5px dashed #d7dbdf', background: '#fafbfc',
              }}>
                <FileTextIcon size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: '#6b7280' }}>Sem cláusulas ainda</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Adiciona a primeira cláusula para começares o contrato</div>
              </div>
            )}

            {parsed.clauses.map((clause, idx) => (
              <div key={clause.id} style={{ border: '1px solid #e2e5e9', background: '#fafbfc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderBottom: '1px solid #e2e5e9', background: '#fff' }}>
                  <div style={{
                    minWidth: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#0d1117', color: '#fff', fontSize: 11, fontWeight: 700, padding: '0 6px',
                  }}>
                    {formatClauseNum(clause.num, parsed.numStyle)}
                  </div>
                  <input
                    value={clause.title}
                    onChange={e => patchClause(clause.id, { title: e.target.value })}
                    placeholder="Título da cláusula"
                    style={{
                      flex: 1, background: 'transparent', border: 'none', outline: 'none',
                      fontSize: 13, fontWeight: 600, color: '#0d1117', fontFamily: "'Poppins',sans-serif",
                    }}
                  />
                  <div style={{ display: 'flex', gap: 2 }}>
                    <IconBtn onClick={() => moveClause(clause.id, -1)} disabled={idx === 0} title="Subir"><ArrowUp size={14} /></IconBtn>
                    <IconBtn onClick={() => moveClause(clause.id, 1)} disabled={idx === parsed.clauses.length - 1} title="Descer"><ArrowDown size={14} /></IconBtn>
                    <IconBtn onClick={() => duplicateClause(clause.id)} title="Duplicar"><Copy size={14} /></IconBtn>
                    <IconBtn danger onClick={() => removeClause(clause.id)} title="Eliminar"><Trash2 size={14} /></IconBtn>
                  </div>
                </div>
                <textarea
                  value={clause.body}
                  onChange={e => patchClause(clause.id, { body: e.target.value })}
                  rows={Math.max(3, Math.min(10, (clause.body.match(/\n/g)?.length || 0) + 2))}
                  placeholder="Texto da cláusula..."
                  style={{
                    width: '100%', padding: '10px 12px', fontSize: 13, lineHeight: 1.6,
                    border: 'none', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                    background: 'transparent', fontFamily: "'Poppins',sans-serif", color: '#374151',
                  }}
                />
              </div>
            ))}
          </div>
        )}

        <div style={{ padding: 16, background: '#f4f5f7', minHeight: 480 }}>
          <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', letterSpacing: '0.04em' }}>
              PRÉ-VISUALIZAÇÃÕ DO DOCUMENTO
            </span>
          </div>
          <iframe
            title="Pré-visualização do contrato"
            srcDoc={filledHtml}
            style={{ width: '100%', height: 640, border: '1px solid #d7dbdf', background: '#fff' }}
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}

function IconBtn({
  onClick, disabled, danger, title, children,
}: {
  onClick: () => void; disabled?: boolean; danger?: boolean; title?: string; children: React.ReactNode;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        color: danger ? (hover ? '#dc2626' : '#9ca3af') : (hover ? '#0d1117' : '#9ca3af'),
        opacity: disabled ? 0.35 : 1, borderRadius: 4,
      }}
    >
      {children}
    </button>
  );
}
