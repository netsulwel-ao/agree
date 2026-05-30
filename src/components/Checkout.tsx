import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PLAN_INFO } from '../lib/plans';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { ArrowUpRight, CheckCircle, Loader, Upload, Landmark, Wallet, FileText, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

type PlanOption = 'pro' | 'enterprise';
type PaymentMethod = 'bank_transfer' | 'paypal';

interface PaymentSettings {
  bank_name: string;
  bank_iban: string;
  bank_nib: string;
  bank_holder: string;
  paypal_email: string;
}

const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';

const AMOUNTS = { pro: 39.9, enterprise: 99.9 };

export default function Checkout() {
  const { user, plan: currentPlan, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<PlanOption>('pro');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [notes, setNotes] = useState('');
  const [userPaypalEmail, setUserPaypalEmail] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const amount = selectedPlan === 'pro' ? 39900 : 99900;

  useEffect(() => {
    supabase.from('payment_settings').select('*').limit(1).maybeSingle()
      .then(({ data }) => {
        if (data) setSettings(data);
        setLoadingSettings(false);
      });
  }, []);

  const handleBankSubmit = async () => {
    if (!user) return;
    if (!receiptFile) { toast.error('Anexa o comprovativo de transferência'); return; }

    setSubmitting(true);

    let receipt_url: string | null = null;
    const ext = receiptFile.name.split('.').pop() || 'pdf';
    const filePath = `${user.id}/${Date.now()}-receipt.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('payment-receipts')
      .upload(filePath, receiptFile);

    if (uploadError) {
      toast.error('Erro ao enviar comprovativo: ' + uploadError.message);
      setSubmitting(false);
      return;
    }

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

  const handlePayPalApprove = async (orderId: string) => {
    if (!user) return;
    const res = await fetch('/api/paypal/capture-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, userId: user.id, plan: selectedPlan }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error('Erro no pagamento: ' + (data.error || 'Erro desconhecido'));
      return;
    }
    await refreshProfile();
    setSuccess(true);
  };

  if (currentPlan !== 'free' && currentPlan !== 'pro') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: 40 }}>
        <CheckCircle size={48} color="#22c55e" style={{ marginBottom: 16 }} />
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Já estás no plano {PLAN_INFO[currentPlan].label}</h1>
        <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 400, marginBottom: 24 }}>O teu plano atual já inclui todas as funcionalidades disponíveis.</p>
        <button className="btn-primary" onClick={() => navigate('/dashboard')}><ArrowUpRight size={15} /> Ir para o Dashboard</button>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: 40 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <CheckCircle size={28} color="#fff" />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          {paymentMethod === 'paypal' ? 'Pagamento confirmado!' : 'Pedido enviado!'}
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 440, marginBottom: 8 }}>
          {paymentMethod === 'paypal'
            ? `O plano ${PLAN_INFO[selectedPlan].label} foi ativado com sucesso.`
            : `O pedido de upgrade para ${PLAN_INFO[selectedPlan].label} foi registado.`}
        </p>
        {paymentMethod !== 'paypal' && (
          <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 440, marginBottom: 24 }}>
            O administrador irá ativar o plano assim que o pagamento for confirmado.
          </p>
        )}
        <button className="btn-primary" onClick={() => navigate('/dashboard')}><ArrowUpRight size={15} /> Voltar ao Dashboard</button>
      </div>
    );
  }

  const planCards = (['pro', 'enterprise'] as PlanOption[]).map(p => {
    const pi = PLAN_INFO[p];
    const isSelected = selectedPlan === p;
    return (
      <button key={p} onClick={() => setSelectedPlan(p)}
        style={{
          padding: '20px', borderRadius: 16, cursor: 'pointer', textAlign: 'left',
          border: isSelected ? '2px solid #0d1117' : '1.5px solid #e2e5e9',
          background: isSelected ? '#f9fafb' : '#fff', transition: 'all .15s',
          fontFamily: "'Poppins', sans-serif", position: 'relative',
        }}
      >
        {pi.popular && <span style={{ position: 'absolute', top: -8, right: 12, background: '#0d1117', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 8px', letterSpacing: 0.5 }}>MAIS POPULAR</span>}
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>{pi.label}</div>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 2 }}>{pi.price}<span style={{ fontSize: 12, fontWeight: 500, color: '#9ca3af' }}>{pi.priceSuffix}</span></div>
        <div style={{ fontSize: 12, color: '#6b7280' }}>{p === 'pro' ? 'Até 50 contratos · 5 colaboradores' : 'Contratos ilimitados · Tudo incluído'}</div>
      </button>
    );
  });

  const featuresList = selectedPlan === 'pro'
    ? ['Até 50 contratos', '5 colaboradores por contrato', 'Assinatura digital', 'Analytics e relatórios', 'Negociação de cláusulas', 'Geração com IA', 'Templates ilimitados', '50 MB de armazenamento']
    : ['Contratos ilimitados', 'Colaboradores ilimitados', 'Assinatura digital', 'Analytics e relatórios', 'Negociação de cláusulas', 'Geração com IA', '500 MB de armazenamento', 'Suporte prioritário 24/7'];

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Checkout</h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>Escolhe o plano e a forma de pagamento.</p>
      </div>

      {/* Plan selector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>{planCards}</div>

      {/* Features */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e2e5e9', padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#0d1117' }}>
          Funcionalidades incluídas no plano {PLAN_INFO[selectedPlan].label}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {featuresList.map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#374151' }}>
              <CheckCircle size={13} color="#0d1117" /> {f}
            </div>
          ))}
        </div>
      </div>

      {/* Payment method */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e2e5e9', padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: '#0d1117' }}>
          Forma de pagamento
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {([
            { value: 'bank_transfer' as PaymentMethod, label: 'Transferência Bancária', icon: Landmark, desc: 'Envia o comprovativo em PDF' },
            { value: 'paypal' as PaymentMethod, label: 'PayPal', icon: Wallet, desc: 'Pagamento instantâneo' },
          ]).map(m => {
            const isSel = paymentMethod === m.value;
            const Icon = m.icon;
            return (
              <button key={m.value} onClick={() => setPaymentMethod(m.value)}
                style={{
                  padding: '16px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                  border: isSel ? '2px solid #0d1117' : '1.5px solid #e2e5e9',
                  background: isSel ? '#f9fafb' : '#fff', transition: 'all .15s',
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                <Icon size={22} color={isSel ? '#0d1117' : '#6b7280'} style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{m.label}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>{m.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Bank Transfer */}
        {paymentMethod === 'bank_transfer' && (
          <>
            {settings && (settings.bank_name || settings.bank_iban) ? (
              <div style={{ background: '#f9fafb', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 12, color: '#374151', lineHeight: 1.8 }}>
                {settings.bank_name && <div><strong>Banco:</strong> {settings.bank_name}</div>}
                {settings.bank_iban && <div><strong>IBAN:</strong> {settings.bank_iban}</div>}
                {settings.bank_nib && <div><strong>NIB:</strong> {settings.bank_nib}</div>}
                {settings.bank_holder && <div><strong>Titular:</strong> {settings.bank_holder}</div>}
                <div style={{ marginTop: 6, fontWeight: 600 }}>Valor: {PLAN_INFO[selectedPlan].price}{PLAN_INFO[selectedPlan].priceSuffix}</div>
              </div>
            ) : (
              <div style={{ background: '#fffbeb', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 12, color: '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={16} /> Os dados bancários ainda não foram configurados. Contacta o administrador.
              </div>
            )}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#0d1117', display: 'block', marginBottom: 6 }}>Comprovativo de transferência (PDF)</label>
              <label
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '24px 16px', borderRadius: 12, border: '1.5px dashed #e2e5e9',
                  cursor: 'pointer', transition: 'all .15s', background: receiptFile ? '#f9fafb' : '#fff',
                }}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#0d1117'; }}
                onDragLeave={e => { e.currentTarget.style.borderColor = '#e2e5e9'; }}
              >
                {receiptFile ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#374151' }}>
                    <FileText size={20} color="#0d1117" />
                    <div><div style={{ fontWeight: 600 }}>{receiptFile.name}</div><div style={{ fontSize: 11, color: '#9ca3af' }}>{(receiptFile.size / 1024).toFixed(1)} KB</div></div>
                    <button onClick={e => { e.preventDefault(); setReceiptFile(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 12, fontFamily: "'Poppins', sans-serif", padding: 4 }}>Remover</button>
                  </div>
                ) : (
                  <><Upload size={20} color="#6b7280" style={{ marginBottom: 8 }} /><div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Clique para selecionar o PDF</div><div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>ou arrasta o ficheiro para aqui</div></>
                )}
                <input type="file" accept=".pdf,application/pdf" onChange={e => { const f = e.target.files?.[0]; if (f) setReceiptFile(f); }} style={{ display: 'none' }} />
              </label>
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#0d1117', display: 'block', marginBottom: 6 }}>Observações (opcional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Número de referência da transferência, etc." rows={2}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #e2e5e9', fontSize: 13, outline: 'none', fontFamily: "'Poppins', sans-serif", resize: 'vertical' }} />
            </div>
            <button onClick={handleBankSubmit} disabled={submitting} className="btn-primary" style={{ width: '100%', justifyContent: 'space-between', marginTop: 16 }}>
              {submitting ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> A enviar...</>
                : <>Solicitar Ativação — {PLAN_INFO[selectedPlan].price}<ArrowUpRight size={15} /></>}
            </button>
          </>
        )}

        {/* PayPal */}
        {paymentMethod === 'paypal' && (
          <>
            <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 12, color: '#166534', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Wallet size={16} />
              Pagamento seguro via PayPal — {PLAN_INFO[selectedPlan].price} ({AMOUNTS[selectedPlan]} USD)
            </div>

            {!paypalClientId ? (
              <div style={{ background: '#fffbeb', borderRadius: 12, padding: 16, fontSize: 12, color: '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={16} /> PayPal não configurado (falta VITE_PAYPAL_CLIENT_ID). Contacta o administrador.
              </div>
            ) : (
              <PayPalScriptProvider options={{ clientId: paypalClientId, currency: 'USD' }}>
                <PayPalButtons
                  style={{ layout: 'vertical', shape: 'rect', color: 'black', label: 'pay', height: 45 }}
                  createOrder={async () => {
                    const res = await fetch('/api/paypal/create-order', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ plan: selectedPlan }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Erro ao criar ordem');
                    return data.orderId;
                  }}
                  onApprove={async (data) => {
                    await handlePayPalApprove(data.orderID);
                  }}
                  onError={(err) => {
                    toast.error('Erro no PayPal: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
                  }}
                />
              </PayPalScriptProvider>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
