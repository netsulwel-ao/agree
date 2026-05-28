import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContracts } from '../hooks/useContracts';
import { 
  Search, Filter, Eye, FileEdit, Trash2,
  Sparkles, Calendar as CalendarIcon, FileText, Download
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { intelligentSearch } from '../services/gemini';
import { exportContractListToPdf } from '../services/exportPdf';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

export default function ContractList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: contracts = [], isLoading } = useContracts();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [filteredContracts, setFilteredContracts] = useState(contracts);

  React.useEffect(() => {
    if (!searchTerm.trim()) setFilteredContracts(contracts);
  }, [contracts, searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) { setFilteredContracts(contracts); return; }
    setFilteredContracts(contracts.filter(c =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ));
  };

  const handleAiSearch = async () => {
    if (!searchTerm.trim()) { toast.error("Digite algo para a pesquisa inteligente"); return; }
    setIsAiSearching(true);
    try {
      const results = await intelligentSearch(searchTerm, contracts);
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

        {/*<div style={{ display: 'flex', gap: 12 }}>
          <button style={btnStyle}
            onMouseEnter={e => { e.currentTarget.style.background = '#f7f9fb'; e.currentTarget.style.color = '#0d1117'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#6b7280'; }}
          >
            <Filter size={16} /> Filtros
          </button>
          <button style={btnStyle}
            onMouseEnter={e => { e.currentTarget.style.background = '#f7f9fb'; e.currentTarget.style.color = '#0d1117'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#6b7280'; }}
          >
            <CalendarIcon size={16} /> Data
          </button>
        </div>*/}
      </div>

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
            onClick={() => exportContractListToPdf(filteredContracts)}
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
        <div style={{ overflowX: 'auto' }}>
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
                        <span style={{ fontWeight: 600, color: '#0d1117' }}>{contract.title}</span>
                        <span style={{ fontSize: 11, color: '#6b7280', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {contract.description || 'Sem descrição'}
                        </span>
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
                      {contract.value ? new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(contract.value) : 'Kz 0,00'}
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
      </div>
    </div>
  );
}
