import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PLAN_INFO } from '../lib/plans';
import { Search, CheckCircle, XCircle, Clock, RotateCw, FileText, Landmark, Wallet } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentRequest {
  id: string;
  user_id: string;
  plan: 'pro' | 'enterprise';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  payment_method: 'bank_transfer' | 'paypal' | null;
  receipt_url: string | null;
  user_paypal_email: string | null;
  created_at: string;
  updated_at: string;
  approved_by: string | null;
  notes: string | null;
  type: 'new' | 'renewal' | null;
  profiles?: { name: string | null; email: string | null };
}

export default function AdminPayments() {
  const { user, isLoading: authLoading } = useAuth();

  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payment_requests')
      .select('*, profiles!payment_requests_user_id_fkey(name, email)')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar pedidos: ' + error.message);
      setLoading(false);
      return;
    }
    setRequests(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    fetchRequests();
  }, [authLoading, fetchRequests]);

  const handleApprove = async (req: PaymentRequest) => {
    setProcessingId(req.id);

    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('payment_requests')
      .update({ status: 'approved', approved_by: user?.id })
      .eq('id', req.id);

    if (updateError) {
      toast.error('Erro ao aprovar: ' + updateError.message);
      setProcessingId(null);
      return;
    }

    // Buscar data de expiração atual para renovações
    let expiresAt: string;
    if (req.type === 'renewal') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan_expires_at')
        .eq('id', req.user_id)
        .maybeSingle();
      const currentExpiry = profile?.plan_expires_at ? new Date(profile.plan_expires_at) : new Date();
      const base = currentExpiry > new Date() ? currentExpiry : new Date();
      expiresAt = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    const { error: planError } = await supabase
      .from('profiles')
      .update({
        plan: req.plan,
        plan_activated_at: req.type === 'renewal' ? undefined : now,
        plan_expires_at: expiresAt,
      })
      .eq('id', req.user_id);

    if (planError) {
      toast.error('Pedido aprovado, mas erro ao atualizar plano: ' + planError.message);
    } else {
      toast.success(`Plano ${PLAN_INFO[req.plan].label} ativado para ${req.profiles?.name || req.user_id}`);
    }

    setRequests(prev =>
      prev.map(r => (r.id === req.id ? { ...r, status: 'approved' as const, approved_by: user?.id } : r))
    );
    setProcessingId(null);
  };

  const handleReject = async (req: PaymentRequest) => {
    setProcessingId(req.id);
    const { error } = await supabase
      .from('payment_requests')
      .update({ status: 'rejected', approved_by: user?.id })
      .eq('id', req.id);

    if (error) {
      toast.error('Erro ao rejeitar: ' + error.message);
    } else {
      toast.success('Pedido rejeitado');
      setRequests(prev =>
        prev.map(r => (r.id === req.id ? { ...r, status: 'rejected' as const, approved_by: user?.id } : r))
      );
    }
    setProcessingId(null);
  };

  const filtered = requests.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (r.profiles?.name || '').toLowerCase().includes(q) ||
      (r.profiles?.email || '').toLowerCase().includes(q) ||
      r.plan.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q) ||
      (r.payment_method || '').toLowerCase().includes(q)
    );
  });

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const statusBadge = (status: string) => {
    if (status === 'approved') {
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#f0fdf4', color: '#22c55e' }}>
        <CheckCircle size={12} /> Aprovado
      </span>;
    }
    if (status === 'rejected') {
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#fef2f2', color: '#ef4444' }}>
        <XCircle size={12} /> Rejeitado
      </span>;
    }
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#fffbeb', color: '#f59e0b' }}>
      <Clock size={12} /> Pendente
    </span>;
  };

  const formatKz = (amount: number) =>
    new Intl.NumberFormat('pt-PT').format(amount);

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: '#6b7280' }}>
        <RotateCw size={24} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} />
        A carregar...
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Pagamentos</h1>
          <p style={{ fontSize: 13, color: '#6b7280' }}>
            {requests.filter(r => r.status === 'pending').length} pedido{requests.filter(r => r.status === 'pending').length !== 1 ? 's' : ''} pendente{requests.filter(r => r.status === 'pending').length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', minWidth: 200 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar..."
              style={{
                width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10,
                border: '1px solid #e2e5e9', fontSize: 13, outline: 'none',
                background: '#fff', fontFamily: "'Poppins', sans-serif"
              }}
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{
              padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e5e9',
              fontSize: 13, background: '#fff', cursor: 'pointer',
              fontFamily: "'Poppins', sans-serif", outline: 'none',
            }}
          >
            <option value="pending">Pendentes</option>
            <option value="approved">Aprovados</option>
            <option value="rejected">Rejeitados</option>
            <option value="all">Todos</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, color: '#6b7280' }}>
          <RotateCw size={20} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} />
          A carregar pedidos...
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e5e9', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 900 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e5e9', background: '#f9fafb' }}>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: '#6b7280' }}>Utilizador</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: '#6b7280' }}>Plano</th>
                  <th style={{ textAlign: 'right', padding: '14px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: '#6b7280' }}>Valor</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: '#6b7280' }}>Método</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: '#6b7280' }}>Tipo</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: '#6b7280' }}>Data</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: '#6b7280' }}>Estado</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: '#6b7280' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
                      {search || filterStatus !== 'all' ? 'Nenhum pedido encontrado.' : 'Nenhum pedido de pagamento registado.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f0f2f5', transition: 'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e2e5e9', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                            {(r.profiles?.name || r.profiles?.email || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0d1117' }}>{r.profiles?.name || '—'}</div>
                            <div style={{ fontSize: 11, color: '#9ca3af' }}>{r.profiles?.email || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>{PLAN_INFO[r.plan].label}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700 }}>Kz {formatKz(r.amount)}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        {r.payment_method === 'bank_transfer' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#374151' }}>
                              <Landmark size={13} /> Transferência
                            </span>
                            {r.receipt_url && (
                              <a
                                href={r.receipt_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: 11, color: '#0d1117', display: 'inline-flex', alignItems: 'center', gap: 3, textDecoration: 'underline' }}
                              >
                                <FileText size={11} /> Comprovativo
                              </a>
                            )}
                          </div>
                        ) : r.payment_method === 'paypal' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#374151' }}>
                              <Wallet size={13} /> PayPal
                            </span>
                            {r.user_paypal_email && (
                              <span style={{ fontSize: 11, color: '#6b7280' }}>{r.user_paypal_email}</span>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: '#9ca3af' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '3px 10px', fontSize: 11, fontWeight: 600,
                          background: r.type === 'renewal' ? '#f0fdf4' : '#eff6ff',
                          color: r.type === 'renewal' ? '#22c55e' : '#3b82f6',
                        }}>
                          {r.type === 'renewal' ? 'Renovação' : 'Novo'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: 12 }}>{formatDate(r.created_at)}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>{statusBadge(r.status)}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        {r.status === 'pending' && (
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button
                              onClick={() => handleApprove(r)}
                              disabled={processingId === r.id}
                              title="Aprovar e ativar plano"
                              style={{
                                padding: '6px 14px', borderRadius: 8,
                                border: 'none', background: '#0d1117', color: '#fff',
                                cursor: 'pointer', fontSize: 12, fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: 6,
                                fontFamily: "'Poppins', sans-serif",
                                opacity: processingId === r.id ? 0.6 : 1,
                              }}
                            >
                              {processingId === r.id ? <RotateCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={14} />}
                              Aprovar
                            </button>
                            <button
                              onClick={() => handleReject(r)}
                              disabled={processingId === r.id}
                              title="Rejeitar pedido"
                              style={{
                                padding: '6px 14px', borderRadius: 8,
                                border: '1px solid #e2e5e9', background: '#fff',
                                cursor: 'pointer', fontSize: 12, fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: 6,
                                color: '#ef4444', fontFamily: "'Poppins', sans-serif",
                                opacity: processingId === r.id ? 0.6 : 1,
                              }}
                            >
                              <XCircle size={14} />
                              Rejeitar
                            </button>
                          </div>
                        )}
                        {r.status === 'approved' && (
                          <span style={{ fontSize: 12, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                            <CheckCircle size={14} /> Ativado
                          </span>
                        )}
                        {r.status === 'rejected' && (
                          <span style={{ fontSize: 12, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                            <XCircle size={14} /> Rejeitado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
