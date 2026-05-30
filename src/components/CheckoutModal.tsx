import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PLAN_INFO } from '../lib/plans';
import { useCheckoutModal } from '../contexts/CheckoutModalContext';
import { X, ArrowUpRight, CheckCircle, Loader, Upload, Landmark, Wallet, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

type PaymentMethod = 'bank_transfer' | 'paypal';

interface PaymentSettings {
  bank_name: string;
  bank_iban: string;
  bank_nib: string;
  bank_holder: string;
  paypal_email: string;
}

export default function CheckoutModal() {
  const { user, plan: currentPlan } = useAuth();
  const { open, preselectedPlan, closeCheckout } = useCheckoutModal();
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'enterprise'>('pro');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [notes, setNotes] = useState('');
  const [userPaypalEmail, setUserPaypalEmail] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);

  const amount = selectedPlan === 'pro' ? 39900 : 99900;

  useEffect(() => {
    if (open) {
      setSelectedPlan(preselectedPlan);
      setPaymentMethod('bank_transfer');
      setNotes('');
      setUserPaypalEmail('');
      setReceiptFile(null);
      setSuccess(false);
      supabase.from('payment_settings').select('*').limit(1).maybeSingle()
        .then(({ data }) => { if (data) setSettings(data); });
    }
  }, [open, preselectedPlan]);

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
    });
    setSubmitting(false);
    if (error) { toast.error('Erro ao criar pedido: ' + error.message); return; }
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
    });
    setSubmitting(false);
    if (error) { toast.error('Erro ao criar pedido: ' + error.message); return; }
    setSuccess(true);
  };

  if (!open) return null;

  if (currentPlan !== 'free' && currentPlan !== 'pro') {
    return (
      <div onClick={closeCheckout} style={{
        position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 24, padding: 48, maxWidth: 480, width: '100%', textAlign: 'center', position: 'relative' }}>
          <button onClick={closeCheckout} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
          <CheckCircle size={48} color="#22c55e" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Já estás no plano {PLAN_INFO[currentPlan].label}</h2>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>O teu plano atual já inclui todas as funcionalidades disponíveis.</p>
          <button onClick={closeCheckout} className="btn-primary" style={{ width: '100%', justifyContent: 'space-between' }}>
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
        <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 24, padding: 48, maxWidth: 480, width: '100%', textAlign: 'center', position: 'relative' }}>
          <button onClick={closeCheckout} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle size={24} color="#fff" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Pedido enviado!</h2>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
            O pedido de upgrade para <strong>{PLAN_INFO[selectedPlan].label}</strong> foi registado.
          </p>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
            O administrador irá ativar o plano assim que o pagamento for confirmado.
          </p>
          <button onClick={closeCheckout} className="btn-primary" style={{ width: '100%', justifyContent: 'space-between' }}>
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
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 24, maxWidth: 640, width: '100%', padding: 36, position: 'relative' }}>
        <button onClick={closeCheckout} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
          <X size={20} />
        </button>

        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Checkout</h2>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>Escolhe o plano e a forma de pagamento.</p>

        {/* Plan selector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {(['pro', 'enterprise'] as const).map(p => {
            const pi = PLAN_INFO[p];
            const isSelected = selectedPlan === p;
            return (
              <button key={p} onClick={() => setSelectedPlan(p)}
                style={{
                  padding: '18px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                  border: isSelected ? '2px solid #0d1117' : '1.5px solid #e2e5e9',
                  background: isSelected ? '#f9fafb' : '#fff', fontFamily: "'Poppins', sans-serif", position: 'relative',
                }}
              >
                {pi.popular && <span style={{ position: 'absolute', top: -7, right: 10, background: '#0d1117', color: '#fff', fontSize: 8, fontWeight: 800, padding: '2px 7px', letterSpacing: 0.5 }}>MAIS POPULAR</span>}
                <div style={{ fontSize: 16, fontWeight: 700 }}>{pi.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{pi.price}<span style={{ fontSize: 11, fontWeight: 500, color: '#9ca3af' }}>{pi.priceSuffix}</span></div>
              </button>
            );
          })}
        </div>

        {/* Features */}
        <div style={{ background: '#f9fafb', borderRadius: 14, padding: 18, marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: '#0d1117' }}>Funcionalidades do plano {PLAN_INFO[selectedPlan].label}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {featuresList.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#374151' }}>
                <CheckCircle size={12} color="#0d1117" /> {f}
              </div>
            ))}
          </div>
        </div>

        {/* Payment method */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {([
            { value: 'bank_transfer' as PaymentMethod, label: 'Transferência', icon: Landmark },
            { value: 'paypal' as PaymentMethod, label: 'PayPal', icon: Wallet },
          ]).map(m => {
            const isSel = paymentMethod === m.value;
            const Icon = m.icon;
            return (
              <button key={m.value} onClick={() => setPaymentMethod(m.value)}
                style={{
                  padding: '12px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                  border: isSel ? '2px solid #0d1117' : '1.5px solid #e2e5e9',
                  background: isSel ? '#f9fafb' : '#fff', fontFamily: "'Poppins', sans-serif",
                }}
              >
                <Icon size={18} color={isSel ? '#0d1117' : '#6b7280'} style={{ marginBottom: 4 }} />
                <div style={{ fontSize: 12, fontWeight: 600 }}>{m.label}</div>
              </button>
            );
          })}
        </div>

        {/* Bank Transfer */}
        {paymentMethod === 'bank_transfer' && (
          <>
            {settings?.bank_name || settings?.bank_iban ? (
              <div style={{ background: '#f9fafb', borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 11, color: '#374151', lineHeight: 1.7 }}>
                {settings.bank_name && <div><strong>Banco:</strong> {settings.bank_name}</div>}
                {settings.bank_iban && <div><strong>IBAN:</strong> {settings.bank_iban}</div>}
                {settings.bank_nib && <div><strong>NIB:</strong> {settings.bank_nib}</div>}
                {settings.bank_holder && <div><strong>Titular:</strong> {settings.bank_holder}</div>}
                <div style={{ marginTop: 4, fontWeight: 600 }}>Valor: {PLAN_INFO[selectedPlan].price}{PLAN_INFO[selectedPlan].priceSuffix}</div>
              </div>
            ) : (
              <div style={{ background: '#fffbeb', borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 11, color: '#92400e', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={14} /> Dados bancários não configurados.
              </div>
            )}
            <label style={{ fontSize: 11, fontWeight: 600, color: '#0d1117', display: 'block', marginBottom: 6 }}>Comprovativo (PDF)</label>
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '18px 12px', borderRadius: 10, border: '1.5px dashed #e2e5e9', cursor: 'pointer',
              background: receiptFile ? '#f9fafb' : '#fff', marginBottom: 12,
            }}>
              {receiptFile ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#374151' }}>
                  <FileText size={16} color="#0d1117" />
                  <div><div style={{ fontWeight: 600 }}>{receiptFile.name}</div><div style={{ fontSize: 10, color: '#9ca3af' }}>{(receiptFile.size / 1024).toFixed(1)} KB</div></div>
                  <button onClick={e => { e.preventDefault(); setReceiptFile(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 11, fontFamily: "'Poppins', sans-serif", padding: 4 }}>X</button>
                </div>
              ) : (
                <><Upload size={18} color="#6b7280" style={{ marginBottom: 6 }} /><div style={{ fontSize: 12, color: '#374151' }}>Clique para selecionar PDF</div></>
              )}
              <input type="file" accept=".pdf,application/pdf" onChange={e => { const f = e.target.files?.[0]; if (f) setReceiptFile(f); }} style={{ display: 'none' }} />
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Referência da transferência (opcional)" rows={2}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e5e9', fontSize: 12, outline: 'none', fontFamily: "'Poppins', sans-serif", resize: 'vertical', marginBottom: 14 }} />
            <button onClick={handleBankSubmit} disabled={submitting} className="btn-primary" style={{ width: '100%', justifyContent: 'space-between' }}>
              {submitting ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> A enviar...</>
                : <>Solicitar — {PLAN_INFO[selectedPlan].price}<ArrowUpRight size={14} /></>}
            </button>
          </>
        )}

        {/* PayPal */}
        {paymentMethod === 'paypal' && (
          <>
            {settings?.paypal_email ? (
              <div style={{ background: '#f0fdf4', borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 11, color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Wallet size={14} /> Pagar para <strong>{settings.paypal_email}</strong>
              </div>
            ) : (
              <div style={{ background: '#fffbeb', borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 11, color: '#92400e', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={14} /> PayPal não configurado.
              </div>
            )}
            <input value={userPaypalEmail} onChange={e => setUserPaypalEmail(e.target.value)} placeholder="Teu email do PayPal"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e5e9', fontSize: 12, outline: 'none', fontFamily: "'Poppins', sans-serif", marginBottom: 12 }} />
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="ID da transação (opcional)" rows={2}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e5e9', fontSize: 12, outline: 'none', fontFamily: "'Poppins', sans-serif", resize: 'vertical', marginBottom: 14 }} />
            <button onClick={handlePayPalSubmit} disabled={submitting} className="btn-primary" style={{ width: '100%', justifyContent: 'space-between' }}>
              {submitting ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> A enviar...</>
                : <>Solicitar — {PLAN_INFO[selectedPlan].price}<ArrowUpRight size={14} /></>}
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
