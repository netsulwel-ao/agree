import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContracts, type Contract } from '../hooks/useContracts';
import { 
  Search, Filter, Eye, FileEdit, Trash2,
  Sparkles, Calendar as CalendarIcon, FileText, Download, X
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { intelligentSearch } from '../services/gemini';

import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../services/currency';

export default function ContractList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const { data: contractsData, isLoading } = useContracts(page);
  const contracts = contractsData?.data ?? [];
  const totalPages = Math.max(1, Math.ceil((contractsData?.count ?? 0) / 20));
  const [searchTerm, setSearchTerm] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>(contracts);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    riskLevel: '',
    dateFrom: '',
    dateTo: '',
    valueMin: '',
    valueMax: '',
  });

  const allTags = [...new Set(contracts.flatMap(c => c.tags || []))].sort();

  const filterContracts = () => {
    let result = contractsData?.data ?? [];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c =>
        c.title.toLowerCase().includes(term) ||
        c.description?.toLowerCase().includes(term)
      );
    }
    if (selectedTags.length > 0) {
      result = result.filter(c =>
        selectedTags.every(t => (c.tags || []).includes(t))
      );
    }
    if (filters.status) {
      result = result.filter(c => c.status === filters.status);
    }
    if (filters.riskLevel) {
      result = result.filter(c => c.risk_level === filters.riskLevel);
    }
    if (filters.dateFrom) {
      result = result.filter(c => !c.end_date || c.end_date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      result = result.filter(c => !c.end_date || c.end_date <= filters.dateTo);
    }
    if (filters.valueMin) {
      result = result.filter(c => (c.value || 0) >= parseFloat(filters.valueMin));
    }
    if (filters.valueMax) {
      result = result.filter(c => (c.value || 0) <= parseFloat(filters.valueMax));
    }
    setFilteredContracts(result);
  };

  React.useEffect(() => {
    filterContracts();
  }, [contractsData, searchTerm, selectedTags, filters]);

  const clearFilters = () => {
    setFilters({ status: '', riskLevel: '', dateFrom: '', dateTo: '', valueMin: '', valueMax: '' });
    setSelectedTags([]);
    setSearchTerm('');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    filterContracts();
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleAiSearch = async () => {
    if (!searchTerm.trim()) { toast.error("Digite algo para a pesquisa inteligente"); return; }
    setIsAiSearching(true);
    try {
      const results = await intelligentSearch(searchTerm, contractsData?.data ?? []);
      setFilteredContracts(results);
      toast.success(`Encontrados ${results.length} contratos relevantes`);
    } catch { toast.error("Erro na pesquisa inteligente"); }
    finally { setIsAiSearching(false); }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      approved: { bg: 'rgba(13,17,23,0.1)', color: '#0d1117', label: 'Assinado' },
      pending:  { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: 'Aprovação' },
      rejected: { bg: 'rgba(239,68,68,0.1)',  color: '#ef4444', label: 'Rejeitado' },
      draft:    { bg: '#f7f9fb',               color: '#6b7280', label: 'Rascunho' },
    };
    return map[status] || map.draft;
  };

  const getRiskColor = (risk: string) => {
    if (risk === 'high') return '#ef4444';
    if (risk === 'medium') return '#f59e0b';
    return '#0d1117';
  };

  const btnStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '10px 18px', fontSize: 13, fontWeight: 600,
    background: '#fff', border: '1.5px solid #e2e5e9',
    color: '#6b7280', cursor: 'pointer', transition: 'all .2s',
    fontFamily: "'Poppins',sans-serif"
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: "'Poppins',sans-serif" }}>
        <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}.sk{background:linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);background-size:400px 100%;animation:shimmer 1.4s ease infinite}`}</style>
        <div className="sk" style={{ height: 48 }} />
        <div className="sk" style={{ height: 400 }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: "'Poppins',sans-serif" }}>

      {/* Search & Filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, flex: 1, maxWidth: 500 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} size={16} />
            <input
              type="text"
              placeholder="Pesquisa inteligente..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '10px 16px 10px 44px', fontSize: 14,
                fontFamily: "'Poppins',sans-serif", color: '#0d1117',
                background: '#fff', border: '1.5px solid #e2e5e9', outline: 'none', transition: 'border-color .2s'
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#0d1117'}
              onBlur={e => e.currentTarget.style.borderColor = '#e2e5e9'}
            />
          </div>
          <button
            type="button"
            onClick={handleAiSearch}
            disabled={isAiSearching}
            style={{
              ...btnStyle,
              background: isAiSearching ? '#f0f0f0' : '#fff',
              color: isAiSearching ? '#0d1117' : '#6b7280',
              cursor: isAiSearching ? 'not-allowed' : 'pointer'
            }}
          >
            <Sparkles size={16} />
            {isAiSearching ? 'Analisando...' : 'IA'}
          </button>
        </form>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              ...btnStyle,
              background: showFilters || Object.values(filters).some(v => v) ? '#f7f9fb' : '#fff',
              color: showFilters || Object.values(filters).some(v => v) ? '#0d1117' : '#6b7280',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f7f9fb'; e.currentTarget.style.color = '#0d1117'; }}
            onMouseLeave={e => { e.currentTarget.style.background = showFilters || Object.values(filters).some(v => v) ? '#f7f9fb' : '#fff'; e.currentTarget.style.color = showFilters || Object.values(filters).some(v => v) ? '#0d1117' : '#6b7280'; }}
          >
            <Filter size={16} /> Filtros
            {Object.values(filters).some(v => v) && (
              <span style={{
                background: '#0d1117', color: '#fff', fontSize: 10, fontWeight: 700,
                padding: '1px 6px', borderRadius: 10, marginLeft: 4
              }}>
                {Object.values(filters).filter(v => v).length}
              </span>
            )}
          </button>
          {Object.values(filters).some(v => v) && (
            <button onClick={clearFilters} style={btnStyle}
              onMouseEnter={e => { e.currentTarget.style.background = '#f7f9fb'; e.currentTarget.style.color = '#0d1117'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#6b7280'; }}
            >
              <X size={16} /> Limpar
            </button>
          )}
        </div>
      </div>

      {/* Tag Filters */}
      {allTags.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {allTags.map(tag => {
            const active = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 20, border: 'none',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: active ? '#0d1117' : '#f3f4f6',
                  color: active ? '#fff' : '#6b7280',
                  fontFamily: "'Poppins',sans-serif", transition: 'all .2s',
                }}
              >
                {tag}
                {active && <X size={12} />}
              </button>
            );
          })}
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <div style={{
          padding: 20, background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16
        }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, fontFamily: "'Poppins',sans-serif" }}>Status</label>
            <select value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
              style={{ width: '100%', padding: '8px 12px', fontSize: 13, fontFamily: "'Poppins',sans-serif", border: '1px solid #e2e5e9', color: '#0d1117', outline: 'none', background: '#fff' }}>
              <option value="">Todos</option>
              <option value="draft">Rascunho</option>
              <option value="pending">Aprovação</option>
              <option value="approved">Assinado</option>
              <option value="rejected">Rejeitado</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, fontFamily: "'Poppins',sans-serif" }}>Risco</label>
            <select value={filters.riskLevel} onChange={e => setFilters(p => ({ ...p, riskLevel: e.target.value }))}
              style={{ width: '100%', padding: '8px 12px', fontSize: 13, fontFamily: "'Poppins',sans-serif", border: '1px solid #e2e5e9', color: '#0d1117', outline: 'none', background: '#fff' }}>
              <option value="">Todos</option>
              <option value="low">Baixo</option>
              <option value="medium">Médio</option>
              <option value="high">Alto</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, fontFamily: "'Poppins',sans-serif" }}>Período (término)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="date" value={filters.dateFrom} onChange={e => setFilters(p => ({ ...p, dateFrom: e.target.value }))}
                placeholder="De"
                style={{ width: '50%', padding: '8px 12px', fontSize: 12, fontFamily: "'Poppins',sans-serif", border: '1px solid #e2e5e9', color: '#0d1117', outline: 'none' }} />
              <input type="date" value={filters.dateTo} onChange={e => setFilters(p => ({ ...p, dateTo: e.target.value }))}
                placeholder="Até"
                style={{ width: '50%', padding: '8px 12px', fontSize: 12, fontFamily: "'Poppins',sans-serif", border: '1px solid #e2e5e9', color: '#0d1117', outline: 'none' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, fontFamily: "'Poppins',sans-serif" }}>Valor (mín)</label>
            <input type="number" value={filters.valueMin} onChange={e => setFilters(p => ({ ...p, valueMin: e.target.value }))}
              style={{ width: '100%', padding: '8px 12px', fontSize: 13, fontFamily: "'Poppins',sans-serif", border: '1px solid #e2e5e9', color: '#0d1117', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, fontFamily: "'Poppins',sans-serif" }}>Valor (máx)</label>
            <input type="number" value={filters.valueMax} onChange={e => setFilters(p => ({ ...p, valueMax: e.target.value }))}
              style={{ width: '100%', padding: '8px 12px', fontSize: 13, fontFamily: "'Poppins',sans-serif", border: '1px solid #e2e5e9', color: '#0d1117', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={clearFilters}
              style={{ padding: '8px 16px', fontSize: 12, fontWeight: 600, background: '#fff', border: '1px solid #e2e5e9', color: '#6b7280', cursor: 'pointer', fontFamily: "'Poppins',sans-serif" }}>
              Limpar Filtros
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{
        background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.5)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid #e2e5e9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(255,255,255,0.6)'
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0d1117', fontFamily: "'Poppins',sans-serif" }}>
            Contratos em Gestão
          </h2>
          <button
            onClick={() => toast.info('Exportação removida')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 600, color: '#0d1117',
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: "'Poppins',sans-serif", transition: 'color .2s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#000000'}
            onMouseLeave={e => e.currentTarget.style.color = '#0d1117'}
          >
            <Download size={14} /> Exportar PDF
          </button>
        </div>

        {/* Table */}
        <div className="responsive-table" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: "'Poppins',sans-serif" }}>
            <thead>
              <tr style={{ background: '#f7f9fb', borderBottom: '1px solid #e2e5e9' }}>
                {['Identificação', 'Versão', 'Risco', 'Vencimento', 'Valor', 'Status', 'Ações'].map((h, i) => (
                  <th key={h} style={{
                    textAlign: i === 6 ? 'right' : 'left',
                    padding: '12px 24px', fontSize: 11, fontWeight: 700,
                    color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredContracts.length > 0 ? filteredContracts.map(contract => {
                const badge = getStatusBadge(contract.status);
                const riskColor = getRiskColor(contract.risk_level);
                return (
                  <tr
                    key={contract.id}
                    style={{ borderBottom: '1px solid #e2e5e9', background: '#fff', cursor: 'pointer', transition: 'background .15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#f7f9fb'}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = '#fff'}
                    onClick={() => navigate(`/contracts/${contract.id}`)}
                  >
                    <td style={{ padding: '14px 24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 600, color: '#0d1117' }}>{contract.title}</span>
                            {contract.owner_id !== user?.id && (
                            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', background: 'rgba(13,17,23,0.08)', color: '#0d1117', borderRadius: 20, whiteSpace: 'nowrap' }}>
                              Partilhado
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: '#6b7280', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {contract.description || 'Sem descrição'}
                        </span>
                        {(contract.tags?.length ?? 0) > 0 && (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                            {contract.tags!.map(t => (
                              <span key={t} style={{
                                fontSize: 10, fontWeight: 600, padding: '2px 8px',
                                background: '#f3f4f6', color: '#6b7280', borderRadius: 20,
                              }}>{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 24px', color: '#6b7280' }}>v{contract.version || '1.0'}</td>
                    <td style={{ padding: '14px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: riskColor }}>
                        <span style={{ fontSize: 10 }}>●</span>
                        {contract.risk_level === 'high' ? 'Alto' : contract.risk_level === 'medium' ? 'Médio' : 'Baixo'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 24px', color: '#6b7280' }}>
                      {contract.end_date ? format(parseISO(contract.end_date), 'dd MMM yyyy', { locale: ptBR }) : 'N/A'}
                    </td>
                    <td style={{ padding: '14px 24px', color: '#6b7280', fontWeight: 500 }}>
                      {formatCurrency(Number(contract.value) || 0, contract.currency || 'AOA')}
                    </td>
                    <td style={{ padding: '14px 24px' }}>
                      <span style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, background: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }} onClick={e => e.stopPropagation()}>
                        {[
                          { icon: <Eye size={15} />, hoverColor: '#0d1117', onClick: () => navigate(`/contracts/${contract.id}`) },
                          { icon: <FileEdit size={15} />, hoverColor: '#0d1117', onClick: () => navigate(`/contracts/${contract.id}/edit`) },
                          { icon: <Trash2 size={15} />, hoverColor: '#ef4444', onClick: () => {
                            if (window.confirm('Tens a certeza que pretendes eliminar este contrato? Esta acção é irreversível.')) {
                              supabase.from('contracts').delete().eq('id', contract.id).eq('owner_id', user?.id).then(({ error }) => {
                                if (error) { toast.error('Erro ao eliminar contrato'); return; }
                                toast.success('Contrato eliminado com sucesso');
                              });
                            }
                          }},
                        ].map((btn, bi) => (
                          <button
                            key={bi}
                            onClick={btn.onClick}
                            style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', transition: 'all .2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f7f9fb'; e.currentTarget.style.color = btn.hoverColor; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
                          >
                            {btn.icon}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} style={{ height: 240, textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#9ca3af' }}>
                      <FileText size={44} style={{ marginBottom: 12, opacity: 0.2 }} />
                      <p style={{ fontSize: 14, fontFamily: "'Poppins',sans-serif" }}>Nenhum contrato encontrado</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            gap: 12, padding: '16px 24px', borderTop: '1px solid #e2e5e9',
            background: 'rgba(255,255,255,0.6)'
          }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              style={{
                padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: page > 1 ? 'pointer' : 'default',
                border: '1.5px solid #e2e5e9', background: page > 1 ? '#fff' : '#f7f9fb',
                color: page > 1 ? '#0d1117' : '#9ca3af', fontFamily: "'Poppins',sans-serif"
              }}
            >Anterior</button>
            <span style={{ fontSize: 13, color: '#6b7280' }}>Página {page} de {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              style={{
                padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: page < totalPages ? 'pointer' : 'default',
                border: '1.5px solid #e2e5e9', background: page < totalPages ? '#fff' : '#f7f9fb',
                color: page < totalPages ? '#0d1117' : '#9ca3af', fontFamily: "'Poppins',sans-serif"
              }}
            >Seguinte</button>
          </div>
        )}
      </div>
    </div>
  );
}
