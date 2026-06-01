import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useInvoices } from '../hooks/useInvoices';
import {
  FileText, Loader2, Plus, Search, Filter, ArrowRight,
  DollarSign, Clock, CheckCircle2, XCircle, AlertTriangle
} from 'lucide-react';
import { formatCurrency } from '../services/currency';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  draft: { label: 'Rascunho', color: '#6b7280', bg: 'rgba(107,114,128,0.1)', icon: FileText },
  sent: { label: 'Enviada', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: Clock },
  paid: { label: 'Paga', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: CheckCircle2 },
  overdue: { label: 'Vencida', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: AlertTriangle },
  cancelled: { label: 'Cancelada', color: '#9ca3af', bg: 'rgba(156,163,175,0.1)', icon: XCircle },
};

export default function InvoiceList() {
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const { data: invoices = [], isLoading } = useInvoices(statusFilter || undefined);

  const filtered = invoices.filter(inv => {
    if (!search) return true;
    const q = search.toLowerCase();
    return inv.number.toLowerCase().includes(q)
      || inv.title.toLowerCase().includes(q)
      || inv.client?.name?.toLowerCase().includes(q)
      || inv.contract?.title?.toLowerCase().includes(q);
  });

  const totals = {
    total: invoices.reduce((s, i) => s + (i.status !== 'cancelled' ? i.total_value : 0), 0),
    paid: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total_value, 0),
    pending: invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + i.total_value, 0),
    overdue: invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.total_value, 0),
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
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Total (não cancelado)', value: totals.total, color: '#0d1117' },
          { label: 'Pago', value: totals.paid, color: '#10b981' },
          { label: 'Pendente', value: totals.pending, color: '#f59e0b' },
          { label: 'Vencido', value: totals.overdue, color: '#ef4444' },
        ].map((item, idx) => (
          <div key={idx} style={{
            background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(30px)',
            border: '1px solid rgba(255,255,255,0.35)', borderRadius: 20,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            padding: '18px 20px'
          }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {item.label}
            </p>
            <p style={{ fontSize: 22, fontWeight: 800, color: item.color }}>
              {formatCurrency(Number(item.value), 'AOA')}
            </p>
          </div>
        ))}
      </div>

      <div style={cardStyle}>
        {/* Header */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid #e2e5e9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0d1117' }}>
                <DollarSign size={20} style={{ marginRight: 8, display: 'inline' }} />
                Facturação
              </h2>
              <p style={{ fontSize: 13, color: '#6b7280' }}>{invoices.length} facturas</p>
            </div>
            <Link to="/invoices/new"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', background: '#0d1117', color: '#fff',
                textDecoration: 'none', fontSize: 14, fontWeight: 600,
              }}
            >
              <Plus size={16} /> Nova Factura
            </Link>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Pesquisar por nº, título, cliente..."
                style={{
                  width: '100%', padding: '8px 12px 8px 36px', fontSize: 13,
                  border: '1.5px solid #e2e5e9', outline: 'none', fontFamily: "'Poppins',sans-serif", color: '#0d1117'
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#0d1117'}
                onBlur={e => e.currentTarget.style.borderColor = '#e2e5e9'}
              />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['', 'draft', 'sent', 'paid', 'overdue', 'cancelled'].map(s => {
                const cfg = s ? statusConfig[s] : { label: 'Todas', color: '#6b7280' };
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
              A carregar facturas...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
              <DollarSign size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p style={{ fontSize: 15 }}>{invoices.length === 0 ? 'Nenhuma factura criada' : 'Nenhuma factura encontrada'}</p>
              {invoices.length === 0 && (
                <Link to="/invoices/new"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 12,
                    padding: '10px 20px', background: '#0d1117', color: '#fff',
                    textDecoration: 'none', fontSize: 14, fontWeight: 600,
                  }}
                ><Plus size={16} /> Criar Primeira Factura</Link>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(inv => {
                const cfg = statusConfig[inv.status];
                const Icon = cfg.icon;
                return (
                  <Link key={inv.id} to={`/invoices/${inv.id}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
                      background: '#fff', border: '1px solid #e2e5e9', textDecoration: 'none',
                      transition: 'all .15s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#0d1117'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e5e9'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color }}>
                      <Icon size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', fontFamily: "'Courier New',monospace" }}>{inv.number}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#0d1117' }}>{inv.title}</p>
                      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#6b7280' }}>
                        {inv.client?.name && <span>{inv.client.name}</span>}
                        {inv.contract?.title && <span>Contrato: {inv.contract.title}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 16, fontWeight: 800, color: '#0d1117' }}>
                        {formatCurrency(Number(inv.total_value), inv.currency || 'AOA')}
                      </p>
                      {inv.due_date && (
                        <p style={{ fontSize: 11, color: inv.status === 'overdue' ? '#ef4444' : '#6b7280' }}>
                          Vence: {new Date(inv.due_date).toLocaleDateString('pt-PT')}
                        </p>
                      )}
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
