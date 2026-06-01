import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApprovalRequests } from '../hooks/useApprovalWorkflows';
import {
  FileText, Loader2, CheckCircle2, XCircle, Clock, ArrowRight,
  Search, Filter, Shield
} from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pendente', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  in_progress: { label: 'Em Curso', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  approved: { label: 'Aprovado', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  rejected: { label: 'Rejeitado', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

export default function ApprovalRequestList() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const { data: requests = [], isLoading } = useApprovalRequests(statusFilter || undefined);

  const filtered = requests.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    const title = r.contract?.title || '';
    const wfName = r.workflow?.name || '';
    return title.toLowerCase().includes(q) || wfName.toLowerCase().includes(q);
  });

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
        <div style={{ padding: '24px 28px', borderBottom: '1px solid #e2e5e9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0d1117' }}>Pedidos de Aprovação</h2>
              <p style={{ fontSize: 13, color: '#6b7280' }}>Aprovações pendentes, em curso e concluídas</p>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Pesquisar por contrato ou workflow..."
                style={{
                  width: '100%', padding: '8px 12px 8px 36px', fontSize: 13,
                  border: '1.5px solid #e2e5e9', outline: 'none', fontFamily: "'Poppins',sans-serif", color: '#0d1117'
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#0d1117'}
                onBlur={e => e.currentTarget.style.borderColor = '#e2e5e9'}
              />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['', 'pending', 'in_progress', 'approved', 'rejected'].map(s => {
                const cfg = s ? statusConfig[s] : { label: 'Todos', color: '#6b7280', bg: 'transparent' };
                return (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    style={{
                      padding: '6px 14px', fontSize: 12, fontWeight: 600,
                      background: statusFilter === s ? '#0d1117' : '#fff',
                      color: statusFilter === s ? '#fff' : '#6b7280',
                      border: statusFilter === s ? 'none' : '1px solid #e2e5e9',
                      cursor: 'pointer',
                    }}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* List */}
        <div style={{ padding: 20, minHeight: 300 }}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, color: '#9ca3af', gap: 10 }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
              A carregar pedidos...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
              <Shield size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p style={{ fontSize: 15 }}>Nenhum pedido de aprovação encontrado</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>
                {requests.length === 0
                  ? 'Os pedidos aparecem aqui quando um contrato é submetido para aprovação'
                  : 'Tenta ajustar os filtros'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(req => {
                const cfg = statusConfig[req.status];
                return (
                  <Link key={req.id} to={`/approvals/${req.id}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
                      background: '#fff', border: '1px solid #e2e5e9', textDecoration: 'none',
                      transition: 'all .15s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#0d1117'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e5e9'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color
                    }}>
                      {req.status === 'approved' ? <CheckCircle2 size={20} /> :
                       req.status === 'rejected' ? <XCircle size={20} /> :
                       req.status === 'in_progress' ? <Clock size={20} /> :
                       <Clock size={20} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0d1117' }}>{req.contract?.title || 'Sem título'}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', background: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#6b7280' }}>
                        <span>Workflow: {req.workflow?.name || '—'}</span>
                        {req.contract?.value > 0 && (
                          <span>Valor: {Number(req.contract.value).toLocaleString()} Kz</span>
                        )}
                        {req.current_step_order != null && (
                          <span>Passo: {req.current_step_order + 1}</span>
                        )}
                      </div>
                    </div>
                    <ArrowRight size={18} color="#9ca3af" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
