import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useInvoice, useUpdateInvoice } from '../hooks/useInvoices';
import { useAuth } from '../contexts/AuthContext';
import {
  Loader2, ArrowLeft, FileText, Edit3, Trash2, CheckCircle2,
  Clock, XCircle, AlertTriangle, DollarSign, Send, Printer,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { logAudit, Actions } from '../services/auditLog';
import { formatCurrency } from '../services/currency';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Rascunho', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
  sent: { label: 'Enviada', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  paid: { label: 'Paga', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  overdue: { label: 'Vencida', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  cancelled: { label: 'Cancelada', color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' },
};

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: invoice, isLoading } = useInvoice(id);
  const updateInvoice = useUpdateInvoice();
  const [exportingPdf, setExportingPdf] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (!id) return;
    const updates: any = { status: newStatus };
    if (newStatus === 'paid') updates.paid_date = new Date().toISOString().split('T')[0];
    try {
      await updateInvoice.mutateAsync({ id, ...updates });
      toast.success(`Factura actualizada para "${statusConfig[newStatus]?.label}"`);
      if (user && invoice) {
        logAudit({ user_id: user.id, user_name: user.user_metadata?.name, user_email: user.email, action: Actions.INVOICE_STATUS_CHANGE, resource: 'invoice', resource_id: id, resource_name: invoice.title, details: { from: invoice.status, to: newStatus } });
      }
    } catch { toast.error('Erro ao actualizar estado'); }
  };

  const handleExportPdf = async () => {
    if (!invoice) return;
    setExportingPdf(true);
    try {
      const lineItemsHtml = (invoice.line_items || []).map((item: any) =>
        `<tr><td>${item.description}</td><td style="text-align:center">${item.quantity}</td><td style="text-align:right">${formatCurrency(Number(item.unit_price), invoice.currency || 'AOA')}</td><td style="text-align:right">${formatCurrency(Number(item.total), invoice.currency || 'AOA')}</td></tr>`
      ).join('');

      const html = `
        <div style="font-family:'Poppins',sans-serif;max-width:800px;margin:0 auto;padding:40px">
          <div style="display:flex;justify-content:space-between;margin-bottom:40px">
            <div>
              <h1 style="font-size:24px;font-weight:800;color:#0d1117;margin:0">FACTURA</h1>
              <p style="font-size:13px;color:#6b7280;margin:4px 0 0">${invoice.number}</p>
            </div>
            <div style="text-align:right">
              <p style="font-size:14px;font-weight:600;color:#0d1117;margin:0">${invoice.client?.name || '—'}</p>
              <p style="font-size:12px;color:#6b7280;margin:2px 0 0">${invoice.client?.email || ''}</p>
            </div>
          </div>
          <div style="border-bottom:2px solid #0d1117;margin-bottom:20px;padding-bottom:20px">
            <h2 style="font-size:18px;font-weight:700;color:#0d1117;margin:0">${invoice.title}</h2>
            ${invoice.description ? `<p style="font-size:13px;color:#6b7280;margin:4px 0 0">${invoice.description}</p>` : ''}
          </div>
          ${lineItemsHtml ? `
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
            <thead>
              <tr style="background:rgba(13,17,23,0.05)">
                <th style="padding:10px;font-size:12px;font-weight:700;color:#6b7280;text-align:left">Descrição</th>
                <th style="padding:10px;font-size:12px;font-weight:700;color:#6b7280;text-align:center">Qtd</th>
                <th style="padding:10px;font-size:12px;font-weight:700;color:#6b7280;text-align:right">Preço</th>
                <th style="padding:10px;font-size:12px;font-weight:700;color:#6b7280;text-align:right">Total</th>
              </tr>
            </thead>
            <tbody>${lineItemsHtml}</tbody>
          </table>` : ''}
          <div style="border-top:1px solid #e2e5e9;padding-top:16px;margin-bottom:20px">
            <div style="display:flex;justify-content:space-between;font-size:14px;color:#6b7280;margin-bottom:4px">
              <span>Subtotal</span><span>${formatCurrency(Number(invoice.value), invoice.currency || 'AOA')}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:14px;color:#6b7280;margin-bottom:4px">
              <span>IVA (${invoice.tax_rate}%)</span><span>${formatCurrency(Number(invoice.tax_value), invoice.currency || 'AOA')}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:20px;font-weight:800;color:#0d1117;margin-top:8px;padding-top:8px;border-top:2px solid #0d1117">
              <span>Total</span><span>${formatCurrency(Number(invoice.total_value), invoice.currency || 'AOA')}</span>
            </div>
          </div>
          <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e2e5e9;font-size:12px;color:#9ca3af">
            <p>${invoice.payment_terms || ''}</p>
            <p style="margin-top:4px">${invoice.notes || ''}</p>
          </div>
        </div>`;

      toast.info('Exportação removida');
    } catch { toast.error('Erro ao exportar PDF'); }
    finally { setExportingPdf(false); }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, color: '#9ca3af', gap: 10, fontFamily: "'Poppins',sans-serif" }}>
        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
        A carregar...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af', fontFamily: "'Poppins',sans-serif" }}>
        <p style={{ fontSize: 15 }}>Factura não encontrada</p>
        <Link to="/invoices" style={{ color: '#0d1117', fontSize: 13 }}>Voltar à lista</Link>
      </div>
    );
  }

  const cfg = statusConfig[invoice.status];

  const containerStyle: React.CSSProperties = {
    fontFamily: "'Poppins', sans-serif", maxWidth: 1000, margin: '0 auto',
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
          <button onClick={() => navigate('/invoices')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 13, fontWeight: 600, marginBottom: 12 }}
          >
            <ArrowLeft size={16} /> Voltar
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', fontFamily: "'Courier New',monospace" }}>{invoice.number}</span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0d1117' }}>{invoice.title}</h2>
              <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                {invoice.client?.name && `Cliente: ${invoice.client.name}`}
                {invoice.contract?.title && ` · Contrato: ${invoice.contract.title}`}
                {invoice.issued_date && ` · Emitida: ${new Date(invoice.issued_date).toLocaleDateString('pt-PT')}`}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#0d1117' }}>
                {formatCurrency(Number(invoice.total_value), invoice.currency || 'AOA')}
              </p>
              {invoice.due_date && (
                <p style={{ fontSize: 12, color: invoice.status === 'overdue' ? '#ef4444' : '#6b7280', marginTop: 2 }}>
                  Vence: {new Date(invoice.due_date).toLocaleDateString('pt-PT')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '16px 28px', borderBottom: '1px solid #f0f2f4', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link to={`/invoices/${id}/edit`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              background: '#f0f2f4', color: '#0d1117', textDecoration: 'none', fontSize: 13, fontWeight: 600
            }}
          ><Edit3 size={14} /> Editar</Link>
          <button onClick={handleExportPdf} disabled={exportingPdf}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              background: '#f0f2f4', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#0d1117'
            }}
          >{exportingPdf ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Printer size={14} />} Exportar PDF</button>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {invoice.status === 'draft' && (
              <button onClick={() => handleStatusChange('sent')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#3b82f6', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#fff' }}
              ><Send size={14} /> Marcar Enviada</button>
            )}
            {invoice.status === 'sent' && (
              <>
                <button onClick={() => handleStatusChange('paid')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#10b981', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#fff' }}
                ><CheckCircle2 size={14} /> Marcar Paga</button>
                <button onClick={() => handleStatusChange('overdue')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#ef4444', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#fff' }}
                ><AlertTriangle size={14} /> Marcar Vencida</button>
              </>
            )}
            {invoice.paid_date && (
              <span style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={14} color="#10b981" />
                Paga em {new Date(invoice.paid_date).toLocaleDateString('pt-PT')}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 28 }}>
          {/* Linked contract */}
          {invoice.contract_id && (
            <Link to={`/contracts/${invoice.contract_id}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20,
                padding: '10px 18px', background: 'rgba(13,17,23,0.03)', border: '1px solid #e2e5e9',
                textDecoration: 'none', fontSize: 13, fontWeight: 600, color: '#0d1117'
              }}
            >
              <ExternalLink size={14} /> Ver Contrato Associado
            </Link>
          )}

          {/* Line items */}
          {(invoice.line_items || []).length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0d1117', marginBottom: 12 }}>Itens</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'rgba(13,17,23,0.03)' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>Descrição</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: '#6b7280' }}>Qtd</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#6b7280' }}>Preço Unit.</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#6b7280' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.line_items as any[]).map((item, idx) => (
                    <tr key={idx} style={{ borderTop: '1px solid #f0f2f4' }}>
                      <td style={{ padding: '10px 14px', color: '#0d1117' }}>{item.description}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', color: '#0d1117' }}>{item.quantity}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#6b7280' }}>{formatCurrency(Number(item.unit_price), invoice.currency || 'AOA')}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#0d1117' }}>{formatCurrency(Number(item.total), invoice.currency || 'AOA')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          <div style={{ marginLeft: 'auto', maxWidth: 320 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#6b7280' }}>
              <span>Subtotal</span><span>{formatCurrency(Number(invoice.value), invoice.currency || 'AOA')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#6b7280' }}>
              <span>IVA ({invoice.tax_rate}%)</span><span>{formatCurrency(Number(invoice.tax_value), invoice.currency || 'AOA')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 20, fontWeight: 800, color: '#0d1117', borderTop: '2px solid #0d1117', marginTop: 6 }}>
              <span>Total</span><span>{formatCurrency(Number(invoice.total_value), invoice.currency || 'AOA')}</span>
            </div>
          </div>

          {/* Additional info */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #e2e5e9', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13, color: '#6b7280' }}>
            {invoice.payment_terms && (
              <div>
                <span style={{ fontWeight: 600, color: '#0d1117' }}>Condições de Pagamento</span>
                <p style={{ marginTop: 2 }}>{invoice.payment_terms}</p>
              </div>
            )}
            {invoice.notes && (
              <div>
                <span style={{ fontWeight: 600, color: '#0d1117' }}>Notas</span>
                <p style={{ marginTop: 2 }}>{invoice.notes}</p>
              </div>
            )}
            {invoice.paid_via && (
              <div>
                <span style={{ fontWeight: 600, color: '#0d1117' }}>Pago via</span>
                <p style={{ marginTop: 2 }}>{invoice.paid_via}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
