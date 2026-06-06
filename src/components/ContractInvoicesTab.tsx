import React from 'react';
import { Link } from 'react-router-dom';
import { useInvoicesByContract } from '../hooks/useInvoices';
import {
  Loader2, DollarSign, Plus, ArrowRight, FileText,
  Clock, CheckCircle2, XCircle, AlertTriangle
} from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  draft: { label: 'Rascunho', color: '#6b7280', bg: 'rgba(107,114,128,0.1)', icon: FileText },
  sent: { label: 'Enviada', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: Clock },
  paid: { label: 'Paga', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: CheckCircle2 },
  overdue: { label: 'Vencida', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: AlertTriangle },
  cancelled: { label: 'Cancelada', color: '#9ca3af', bg: 'rgba(156,163,175,0.1)', icon: XCircle },
};

interface Props {
  contractId: string;
}

export default function ContractInvoicesTab({ contractId }: Props) {
  const { data: invoices = [], isLoading } = useInvoicesByContract(contractId);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, color: '#9ca3af', gap: 10, fontFamily: "'Poppins',sans-serif" }}>
        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
        A carregar...
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Poppins',sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0d1117', display: 'flex', alignItems: 'center', gap: 8 }}>
          <DollarSign size={18} /> Facturas Associadas
        </h3>
        <Link to={`/invoices/new?contract=${contractId}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', background: '#0d1117', color: '#fff',
            textDecoration: 'none', fontSize: 12, fontWeight: 600,
          }}
        >
          <Plus size={14} /> Nova Factura
        </Link>
      </div>

      {invoices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <DollarSign size={40} style={{ marginBottom: 8, opacity: 0.3 }} />
          <p style={{ fontSize: 14, margin: 0 }}>Nenhuma factura associada a este contrato</p>
          <Link to={`/invoices/new?contract=${contractId}`}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12,
              padding: '8px 16px', background: '#0d1117', color: '#fff',
              textDecoration: 'none', fontSize: 12, fontWeight: 600,
            }}
          ><Plus size={14} /> Criar Factura</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {invoices.map(inv => {
            const cfg = statusConfig[inv.status];
            const Icon = cfg.icon;
            return (
              <Link key={inv.id} to={`/invoices/${inv.id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                  background: '#fff', border: '1px solid #e2e5e9', textDecoration: 'none',
                  transition: 'all .15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#0d1117'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e5e9'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 8, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color }}>
                  <Icon size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', fontFamily: "'Courier New',monospace" }}>{inv.number}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0d1117', marginTop: 2 }}>{inv.title}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: '#0d1117' }}>{inv.total_value.toLocaleString()} Kz</p>
                  {inv.due_date && <p style={{ fontSize: 11, color: '#6b7280' }}>{new Date(inv.due_date).toLocaleDateString('pt-PT')}</p>}
                </div>
                <ArrowRight size={16} color="#9ca3af" />
              </Link>
            );
          })}
        </div>
      )}

      {invoices.length > 0 && (
        <div style={{ marginTop: 16, padding: 16, background: 'rgba(13,17,23,0.03)', borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280' }}>
            <span>Total facturado:</span>
            <span style={{ fontWeight: 700, color: '#0d1117' }}>
              {invoices.filter(i => i.status !== 'cancelled').reduce((s, i) => s + i.total_value, 0).toLocaleString()} Kz
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            <span>Total pago:</span>
            <span style={{ fontWeight: 700, color: '#10b981' }}>
              {invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total_value, 0).toLocaleString()} Kz
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            <span>Pendente:</span>
            <span style={{ fontWeight: 700, color: '#f59e0b' }}>
              {invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + i.total_value, 0).toLocaleString()} Kz
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
