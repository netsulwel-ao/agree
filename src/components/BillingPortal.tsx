import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCheckoutModal } from '../contexts/CheckoutModalContext';
import {
  PLAN_INFO, canUpgrade, canRenew, trialDaysRemaining, isTrialActive,
} from '../lib/plans';
import {
  CreditCard, CheckCircle, Clock, XCircle, RefreshCw,
  ArrowUpRight, AlertTriangle, Landmark, Wallet, FileText,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PaymentRequest {
  id: string;
  plan: 'pro' | 'enterprise';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  payment_method: 'bank_transfer' | 'paypal' | null;
  receipt_url: string | null;
  created_at: string;
  type: 'new' | 'renewal' | null;
  notes: string | null;
}

export default function BillingPortal() {
  const { user, plan, planExpiresAt, trialEndsAt, isInTrial } = useAuth();
  const { openCheckout, openRenewal } = useCheckoutModal();
  const [history, setHistory] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('payment_requests')
      .select('id, plan, amount, status, payment_method, receipt_url, created_at, type, notes')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setHistory(data || []);
        setLoading(false);
      });
  }, [user]);

  // ─── Estado do plano ────────────────────────────────

  const now = new Date();
  const expiresDate = planExpiresAt ? new Date(planExpiresAt) : null;
  const daysLeft = expiresDate
    ? Math.ceil((expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const isExpired = expiresDate ? expiresDate < now : false;
  const isExpiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 7;
  const trialDays = trialDaysRemaining(trialEndsAt);

  const planColor = plan === 'enterprise' ? '#facc15' : plan === 'pro' ? '#3b82f6' : '#6b7280';
  const planBg = plan === 'enterprise' ? 'rgba(250,204,21,0.08)' : plan === 'pro' ? 'rgba(59,130,246,0.08)' : '#f9fafb';

  // ─── Render ─────────────────────────────────────────

  const card: React.CSSProperties = {
    background: '#fff',
    border: '1.5px solid #e2e5e9',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  };

  const statusBadge = (status: string) => {
    if (status === 'approved') return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#f0fdf4', color: '#22c55e' }}>
        <CheckCircle size={11} /> Aprovado
      </span>
    );
    if (status === 'rejected') return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#fef2f2', color: '#ef4444' }}>
        <XCircle size={11} /> Rejeitado
      </span>
    );
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#fffbeb', color: '#f59e0b' }}>
        <Clock size={11} /> Pendente
      </span>
    );
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', fontFamily: "'Poppins', sans-serif" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Billing & Plano</h1>
        <p style={{ fontSize: 13, color: '#6b7280' }}>Estado da tua subscrição e histórico de pagamentos.</p>
      </div>

      {/* ─── Card: Estado do plano ─── */}
      <div style={{ ...card, background: planBg, borderColor: planColor + '33' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: planColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={22} color={planColor} />
            </div>
            <div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: planColor, fontWeight: 700 }}>Plano Actual</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0d1117' }}>
                {isInTrial ? 'Pro (Trial)' : PLAN_INFO[plan].label}
              </div>
              {isInTrial && (
                <div style={{ fontSize: 12, color: '#3b82f6', fontWeight: 600, marginTop: 2 }}>
                  {trialDays} dia{trialDays !== 1 ? 's' : ''} restante{trialDays !== 1 ? 's' : ''} de trial gratuito
                </div>
              )}
              {!isInTrial && plan !== 'free' && expiresDate && (
                <div style={{ fontSize: 12, color: isExpired ? '#ef4444' : isExpiringSoon ? '#f59e0b' : '#6b7280', marginTop: 2 }}>
                  {isExpired
                    ? 'Expirado — renova para recuperar o acesso'
                    : `Expira em ${daysLeft} dia${daysLeft !== 1 ? 's' : ''} (${format(expiresDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })})`
                  }
                </div>
              )}
              {plan === 'free' && !isInTrial && (
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  Acesso limitado — 3 contratos, sem assinaturas digitais
                </div>
              )}
            </div>
          </div>

          {/* Acções */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {(isExpired || isExpiringSoon) && plan !== 'free' && (
              <button
                onClick={() => openRenewal(plan as 'pro' | 'enterprise')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', background: '#ef4444', color: '#fff',
                  border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
                }}
              >
                <RefreshCw size={15} /> Renovar agora
              </button>
            )}
            {!isExpired && canRenew(plan) && !isExpiringSoon && (
              <button
                onClick={() => openRenewal(plan as 'pro' | 'enterprise')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', background: '#fff', color: '#0d1117',
                  border: '1.5px solid #e2e5e9', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
                }}
              >
                <RefreshCw size={15} /> Renovar
              </button>
            )}
            {canUpgrade(plan) && (
              <button
                onClick={() => openCheckout()}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', background: '#0d1117', color: '#fff',
                  border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
                }}
              >
                <ArrowUpRight size={15} />
                {isInTrial ? 'Subscrever Pro' : 'Fazer Upgrade'}
              </button>
            )}
          </div>
        </div>

        {/* Barra de progresso do trial */}
        {isInTrial && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b7280', marginBottom: 6 }}>
              <span>Dia 1</span>
              <span>Dia 14</span>
            </div>
            <div style={{ height: 6, background: '#e2e5e9', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.max(0, Math.min(100, ((14 - trialDays) / 14) * 100))}%`,
                background: trialDays <= 3 ? '#ef4444' : trialDays <= 7 ? '#f59e0b' : '#3b82f6',
                borderRadius: 4, transition: 'width 0.3s',
              }} />
            </div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
              {14 - trialDays} de 14 dias usados
            </div>
          </div>
        )}

        {/* Aviso de expiração iminente */}
        {(isExpired || isExpiringSoon) && !isInTrial && plan !== 'free' && (
          <div style={{
            marginTop: 16, padding: '10px 14px', borderRadius: 10,
            background: isExpired ? '#fef2f2' : '#fffbeb',
            border: `1px solid ${isExpired ? '#fca5a5' : '#fde68a'}`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <AlertTriangle size={16} color={isExpired ? '#ef4444' : '#f59e0b'} />
            <span style={{ fontSize: 13, color: isExpired ? '#b91c1c' : '#92400e' }}>
              {isExpired
                ? 'O teu plano expirou. As funcionalidades premium foram suspensas.'
                : `O teu plano expira em ${daysLeft} dia${daysLeft !== 1 ? 's' : ''}. Renova para não perder o acesso.`}
            </span>
          </div>
        )}
      </div>

      {/* ─── Comparação de planos ─── */}
      {(plan === 'free' || isInTrial) && (
        <div style={card}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>O que ganhas ao subscrever</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['Até 50 contratos', 'vs 3 no Free'],
              ['Assinatura digital', 'Não disponível no Free'],
              ['Analytics e relatórios', 'Não disponível no Free'],
              ['Geração de contratos com IA', 'Não disponível no Free'],
              ['Templates ilimitados', 'vs 3 no Free'],
              ['Negociação de cláusulas', 'Não disponível no Free'],
            ].map(([feat, note]) => (
              <div key={feat} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <CheckCircle size={14} color="#22c55e" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0d1117' }}>{feat}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{note}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
            <button
              onClick={() => openCheckout('pro')}
              style={{
                flex: 1, padding: '12px 20px', background: '#0d1117', color: '#fff',
                border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <ArrowUpRight size={16} /> Subscrever Pro — Kz 39.900/mês
            </button>
          </div>
        </div>
      )}

      {/* ─── Histórico de pagamentos ─── */}
      <div style={card}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={16} /> Histórico de Pagamentos
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}>
            <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
            <div>A carregar...</div>
          </div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>
            <CreditCard size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
            <p style={{ fontSize: 14 }}>Nenhum pagamento registado.</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>Os teus pedidos de pagamento aparecerão aqui.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.map(r => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', background: '#f9fafb', borderRadius: 12,
                border: '1px solid #e2e5e9', flexWrap: 'wrap', gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: '#fff', border: '1px solid #e2e5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {r.payment_method === 'paypal' ? <Wallet size={16} color="#003087" /> : <Landmark size={16} color="#0d1117" />}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0d1117' }}>
                      Plano {PLAN_INFO[r.plan].label} — {r.type === 'renewal' ? 'Renovação' : 'Nova subscrição'}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>
                      {r.payment_method === 'paypal' ? 'PayPal' : 'Transferência Bancária'} · {format(parseISO(r.created_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#0d1117' }}>
                    Kz {new Intl.NumberFormat('pt-PT').format(r.amount)}
                  </span>
                  {statusBadge(r.status)}
                  {r.receipt_url && (
                    <a
                      href={r.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 11, color: '#6b7280', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <FileText size={12} /> Comprovativo
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
