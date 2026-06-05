import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PLAN_INFO, getUpgradeOptions } from '../lib/plans';
import { useCheckoutModal } from '../contexts/CheckoutModalContext';
import { X, ArrowUpRight, CheckCircle, Loader, Upload, Landmark, FileText, AlertCircle, Wallet } from 'lucide-react';
import AgreeLogo from '../Agree-logo.svg';
import { toast } from 'sonner';

type PaymentMethod = 'bank_transfer' | 'paypal';

interface PaymentSettings {
  bank_name: string;
  bank_iban: string;
  bank_nib: string;
  bank_holder: string;
  paypal_email: string;
}

const PayPalIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.607 4.653H8.941L6.645 19.251H1.82L4.862 0h7.995c3.754 0 6.375 2.294 6.473 5.513-.648-.478-2.105-.86-3.722-.86m6.57 5.546c0 3.41-3.01 6.853-6.958 6.853h-2.493L11.595 24H6.74l1.845-11.538h3.592c4.208 0 7.346-3.634 7.153-6.949a5.24 5.24 0 0 1 2.848 4.686M9.653 5.546h6.408c.907 0 1.942.222 2.363.541-.195 2.741-2.655 5.483-6.441 5.483H8.714Z" fill="#003087"/>
  </svg>
);

export default function CheckoutModal() {
  const { user, plan: currentPlan } = useAuth();
  const { open, preselectedPlan, mode, closeCheckout } = useCheckoutModal();
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'enterprise'>('pro');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [notes, setNotes] = useState('');
  const [userPaypalEmail, setUserPaypalEmail] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);

  const isRenewal = mode === 'renewal';
  const availablePlans = isRenewal
    ? (currentPlan === 'pro' || currentPlan === 'enterprise' ? [currentPlan] : [] as ('pro' | 'enterprise')[])
    : getUpgradeOptions(currentPlan);

  const amount = selectedPlan === 'pro' ? 39900 : 99900;

  useEffect(() => {
    if (open) {
      const initialPlan = isRenewal
        ? (currentPlan === 'pro' || currentPlan === 'enterprise' ? currentPlan : 'pro')
        : (preselectedPlan && availablePlans.includes(preselectedPlan) ? preselectedPlan : availablePlans[0] || 'pro');
      setSelectedPlan(initialPlan);
      setPaymentMethod('bank_transfer');
      setNotes('');
      setUserPaypalEmail('');
      setReceiptFile(null);
      setSuccess(false);
      supabase.from('payment_settings').select('*').limit(1).maybeSingle()
        .then(({ data }) => { if (data) setSettings(data); });
    }
  }, [open, preselectedPlan, mode, currentPlan]);

  const handleBankSubmit = async () => {
    if (!user) return;
    if (!receiptFile) { toast.error('Anexa o comprovativo de transferência'); return; }
    setSubmitting(true);
    let receipt_url: string | null = null;
    const ext = receiptFile.name.split('.').pop() || 'pdf';
    const filePath = `${user.id}/${Date.now()}-receipt.${ext}`;
    const { error: uploadError } = await supabase.storage.from('payment-receipts').upload(filePath, receiptFile);
    if (uploadError) { toast.error('Erro ao enviar comprovativo: ' + uploadError.message); setSubmitting(false); return; }
    const { data: urlData } = supabase.storage.from('payment-receipts').getPublicUrl(filePath);
    receipt_url = urlData?.publicUrl || null;
    const { error } = await supabase.from('payment_requests').insert({
      user_id: user.id, plan: selectedPlan, amount,
      payment_method: 'bank_transfer', receipt_url,
      notes: notes.trim() || null, status: 'pending',
      type: isRenewal ? 'renewal' : 'new',
    });
    setSubmitting(false);
    if (error) { toast.error('Erro ao criar pedido: ' + error.message); return; }
    // Notificar admins
    notifyAdmins(selectedPlan, user.email || user.id, isRenewal);
    setSuccess(true);
  };

  const handlePayPalSubmit = async () => {
    if (!user) return;
    if (!settings?.paypal_email) { toast.error('PayPal não configurado.'); return; }
    if (!userPaypalEmail.trim()) { toast.error('Indica o teu email do PayPal'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('payment_requests').insert({
      user_id: user.id, plan: selectedPlan, amount,
      payment_method: 'paypal', user_paypal_email: userPaypalEmail.trim(),
      notes: notes.trim() || null, status: 'pending',
      type: isRenewal ? 'renewal' : 'new',
    });
    setSubmitting(false);
    if (error) { toast.error('Erro ao criar pedido: ' + error.message); return; }
    // Notificar admins
    notifyAdmins(selectedPlan, user.email || user.id, isRenewal);
    setSuccess(true);
  };

  const notifyAdmins = async (plan: string, userEmail: string, renewal: boolean) => {
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin');
    if (!admins?.length) return;
    const notificationInserts = admins.map(a => ({
      user_id: a.id,
      type: 'payment_request',
      title: renewal ? 'Renovação pendente' : 'Novo pedido de upgrade',
      message: `${userEmail} solicitou o plano ${PLAN_INFO[plan].label} (${renewal ? 'renovação' : 'novo'}).`,
      reference_id: null,
      reference_type: 'payment_request',
    }));
    await supabase.from('notifications').insert(notificationInserts);
  };

  if (!open) return null;

  // Enterprise with no upgrade options and not renewal
  if (!isRenewal && availablePlans.length === 0) {
    return (
      <div onClick={closeCheckout} style={{
        position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        <div onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: 48, maxWidth: 500, width: '100%', textAlign: 'center', position: 'relative' }}>
          <button onClick={closeCheckout} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', zIndex: 1 }}><X size={20} /></button>
          <div style={{ position: 'absolute', top: 24, right: 56, display: 'flex', alignItems: 'center', gap: 6 }}>
            <img src={AgreeLogo} alt="" style={{ height: 28, display: 'block' }} />
            <span style={{ fontSize: 20, fontWeight: 800, color: '#0d1117', letterSpacing: -0.5 }}>Agree</span>
          </div>
          <CheckCircle size={48} color="#22c55e" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Já estás no plano {PLAN_INFO[currentPlan].label}</h2>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>O teu plano atual já inclui todas as funcionalidades disponíveis.</p>
          <button onClick={closeCheckout} style={{
            width: '100%', padding: '14px 24px', fontSize: 15, fontWeight: 700,
            background: '#0d1117', border: 'none', color: '#fff', cursor: 'pointer',
             fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 6,
          }}>
            Fechar <ArrowUpRight size={15} />
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div onClick={closeCheckout} style={{
        position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        <div onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: 48, maxWidth: 500, width: '100%', textAlign: 'center', position: 'relative' }}>
          <button onClick={closeCheckout} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', zIndex: 1 }}><X size={20} /></button>
          <div style={{ position: 'absolute', top: 24, right: 56, display: 'flex', alignItems: 'center', gap: 6 }}>
            <img src={AgreeLogo} alt="" style={{ height: 28, display: 'block' }} />
            <span style={{ fontSize: 20, fontWeight: 800, color: '#0d1117', letterSpacing: -0.5 }}>Agree</span>
          </div>
          <div style={{ width: 56, height: 56,  background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle size={24} color="#fff" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            {isRenewal ? 'Renovação pedida!' : 'Pedido enviado!'}
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
            {isRenewal
              ? `O pedido de renovação do plano <strong>${PLAN_INFO[selectedPlan].label}</strong> foi registado.`
              : `O pedido de upgrade para <strong>${PLAN_INFO[selectedPlan].label}</strong> foi registado.`
            }
          </p>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
            O administrador irá ativar o plano assim que o pagamento for confirmado.
          </p>
          <button onClick={closeCheckout} style={{
            width: '100%', padding: '14px 24px', fontSize: 15, fontWeight: 700,
            background: '#0d1117', border: 'none', color: '#fff', cursor: 'pointer',
             fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 6,
          }}>
            Fechar <ArrowUpRight size={15} />
          </button>
        </div>
      </div>
    );
  }

  const featuresList = selectedPlan === 'pro'
    ? ['Até 50 contratos', '5 colaboradores por contrato', 'Assinatura digital', 'Analytics e relatórios', 'Negociação de cláusulas', 'Geração com IA', 'Templates ilimitados', '50 MB de armazenamento']
    : ['Contratos ilimitados', 'Colaboradores ilimitados', 'Assinatura digital', 'Analytics e relatórios', 'Negociação de cláusulas', 'Geração com IA', '500 MB de armazenamento', 'Suporte prioritário 24/7'];

  return (
    <div onClick={closeCheckout} style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflowY: 'auto',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', maxWidth: 860, width: '100%', position: 'relative',
        display: 'flex', flexDirection: 'row', overflow: 'hidden',
      }}>
        <button onClick={closeCheckout} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', zIndex: 10 }}>
          <X size={18} />
        </button>

        {/* Left column */}
        <div style={{ flex: 1, padding: '36px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Logo + Agree */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <img src={AgreeLogo} alt="" style={{ height: 32, display: 'block' }} />
            <span style={{ fontSize: 22, fontWeight: 800, color: '#0d1117', letterSpacing: -0.5 }}>Agree</span>
          </div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, marginBottom: 2 }}>
              {isRenewal ? 'Renovar plano' : 'Checkout'}
            </h2>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
              {isRenewal
                ? `Renova o teu plano ${PLAN_INFO[currentPlan].label} por mais um mês.`
                : 'Escolhe o plano e a forma de pagamento.'}
            </p>
          </div>

          {/* Plan cards — stacked vertically */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {availablePlans.map(p => {
              const pi = PLAN_INFO[p];
              const isSelected = selectedPlan === p;
              return (
                <button key={p} onClick={() => setSelectedPlan(p)}
                  style={{
                    padding: '18px 20px',  cursor: 'pointer', textAlign: 'left',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    border: isSelected ? '2px solid #0d1117' : '1.5px solid #d1d5db',
                    background: isSelected ? '#f9fafb' : '#fff', fontFamily: "'Poppins', sans-serif", position: 'relative',
                  }}
                >
                  <div>
                    {pi.popular && <span style={{ fontSize: 9, fontWeight: 800, color: '#0d1117', letterSpacing: 0.5, marginBottom: 2 }}>MAIS POPULAR</span>}
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{pi.label}</div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, textAlign: 'right' }}>{pi.price}<span style={{ fontSize: 11, fontWeight: 500, color: '#9ca3af' }}>{pi.priceSuffix}</span></div>
                </button>
              );
            })}
          </div>

          {/* Features */}
          <div style={{ background: '#f9fafb',  padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 10, color: '#0d1117', letterSpacing: 0.3 }}>FUNCIONALIDADES DO PLANO {PLAN_INFO[selectedPlan].label.toUpperCase()}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 12px' }}>
              {featuresList.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#374151' }}>
                  <CheckCircle size={11} color="#22c55e" /> {f}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Vertical divider */}
        <div style={{ width: 1, background: '#e2e5e9', flexShrink: 0 }} />

        {/* Right column */}
        <div style={{ flex: 1, padding: '36px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Payment method buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            {([
              { value: 'bank_transfer' as PaymentMethod, label: 'Transferência Bancária' },
              { value: 'paypal' as PaymentMethod, label: 'PayPal' },
            ]).map(m => {
              const isSel = paymentMethod === m.value;
              return (
                <button key={m.value} onClick={() => setPaymentMethod(m.value)}
                  style={{
                    flex: 1, padding: '14px 8px',  cursor: 'pointer', textAlign: 'center',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    border: isSel ? '2px solid #0d1117' : '1.5px solid #d1d5db',
                    background: isSel ? '#f9fafb' : '#fff', fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  {m.value === 'bank_transfer' ? (
                    <Landmark size={20} color={isSel ? '#0d1117' : '#6b7280'} />
                  ) : (
                    <PayPalIcon />
                  )}
                  <div style={{ fontSize: 11, fontWeight: 600 }}>{m.label}</div>
                </button>
              );
            })}
          </div>

          {/* Bank Transfer form */}
          {paymentMethod === 'bank_transfer' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
              {settings?.bank_name || settings?.bank_iban ? (
                <div style={{ background: '#f9fafb',  padding: 12, fontSize: 11, color: '#374151', lineHeight: 1.7 }}>
                  {settings.bank_name && <div><strong>Banco:</strong> {settings.bank_name}</div>}
                  {settings.bank_iban && <div><strong>IBAN:</strong> {settings.bank_iban}</div>}
                  {settings.bank_nib && <div><strong>NIB:</strong> {settings.bank_nib}</div>}
                  {settings.bank_holder && <div><strong>Titular:</strong> {settings.bank_holder}</div>}
                </div>
              ) : (
                <div style={{ background: '#fffbeb',  padding: 12, fontSize: 11, color: '#92400e', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={14} /> Dados bancários não configurados.
                </div>
              )}
              <label style={{ fontSize: 11, fontWeight: 600, color: '#0d1117', marginBottom: -4 }}>Comprovativo (PDF)</label>
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '14px 12px',  border: '1.5px dashed #d1d5db', cursor: 'pointer',
                background: receiptFile ? '#f9fafb' : '#fff',
              }}>
                {receiptFile ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#374151' }}>
                    <FileText size={14} color="#0d1117" />
                    <div><div style={{ fontWeight: 600 }}>{receiptFile.name}</div><div style={{ fontSize: 9, color: '#9ca3af' }}>{(receiptFile.size / 1024).toFixed(1)} KB</div></div>
                    <button onClick={e => { e.preventDefault(); setReceiptFile(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 10, fontFamily: "'Poppins', sans-serif", padding: 2 }}>X</button>
                  </div>
                ) : (
                  <><Upload size={16} color="#6b7280" style={{ marginBottom: 4 }} /><div style={{ fontSize: 11, color: '#6b7280' }}>Clique para selecionar PDF</div></>
                )}
                <input type="file" accept=".pdf,application/pdf" onChange={e => { const f = e.target.files?.[0]; if (f) setReceiptFile(f); }} style={{ display: 'none' }} />
              </label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Referência da transferência (opcional)" rows={2}
                style={{ width: '100%', padding: '10px 12px',  border: '1px solid #d1d5db', fontSize: 11, outline: 'none', fontFamily: "'Poppins', sans-serif", resize: 'none' }} />
            </div>
          )}

          {/* PayPal form */}
          {paymentMethod === 'paypal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
              {settings?.paypal_email ? (
                <div style={{ background: '#f0fdf4',  padding: 12, fontSize: 11, color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Wallet size={14} /> Pagar para <strong>{settings.paypal_email}</strong>
                </div>
              ) : (
                <div style={{ background: '#fffbeb',  padding: 12, fontSize: 11, color: '#92400e', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={14} /> PayPal não configurado.
                </div>
              )}
              <input value={userPaypalEmail} onChange={e => setUserPaypalEmail(e.target.value)} placeholder="Teu email do PayPal"
                style={{ width: '100%', padding: '10px 12px',  border: '1px solid #d1d5db', fontSize: 11, outline: 'none', fontFamily: "'Poppins', sans-serif" }} />
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="ID da transação (opcional)" rows={2}
                style={{ width: '100%', padding: '10px 12px',  border: '1px solid #d1d5db', fontSize: 11, outline: 'none', fontFamily: "'Poppins', sans-serif", resize: 'none' }} />
            </div>
          )}

          {/* Total + Submit button */}
          <div style={{ marginTop: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Total do plano {PLAN_INFO[selectedPlan].label}</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#0d1117' }}>{PLAN_INFO[selectedPlan].price}<span style={{ fontSize: 12, fontWeight: 500, color: '#9ca3af' }}>{PLAN_INFO[selectedPlan].priceSuffix}</span></span>
            </div>
            <button
              onClick={paymentMethod === 'bank_transfer' ? handleBankSubmit : handlePayPalSubmit}
              disabled={submitting}
              style={{
                width: '100%', padding: '16px 24px', fontSize: 16, fontWeight: 700,
                background: '#0d1117', border: 'none', color: '#fff',
                cursor: submitting ? 'not-allowed' : 'pointer', 
                fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8, opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? (
                <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> A enviar...</>
              ) : (
                <>{isRenewal ? 'Renovar' : 'Solicitar'} — {PLAN_INFO[selectedPlan].price} {PLAN_INFO[selectedPlan].priceSuffix}<ArrowUpRight size={16} /></>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}