import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Save, RotateCw, Landmark, Wallet, Mail, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentSettings {
  id: string;
  bank_name: string;
  bank_iban: string;
  bank_nib: string;
  bank_holder: string;
  paypal_email: string;
}

const defaults: PaymentSettings = {
  id: '',
  bank_name: '',
  bank_iban: '',
  bank_nib: '',
  bank_holder: '',
  paypal_email: '',
};

export default function AdminSettings() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [settings, setSettings] = useState<PaymentSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState('');
  const [codeVerifying, setCodeVerifying] = useState(false);

  const confirmSave = useCallback(async (data: PaymentSettings) => {
    setSaving(true);
    setVerifying(false);
    const payload = { ...data, updated_by: user?.id };
    const { error } = await supabase.from('payment_settings').upsert(payload, { onConflict: 'id' });
    setSaving(false);
    if (error) {
      toast.error('Erro ao guardar: ' + error.message);
    } else {
      toast.success('Definições guardadas com sucesso');
    }
  }, [user]);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('pendingPaymentSettings');
      if (stored) {
        sessionStorage.removeItem('pendingPaymentSettings');
        const parsed = JSON.parse(stored) as PaymentSettings;
        const hash = location.hash.replace('#', '');
        const params = new URLSearchParams(hash);
        if (params.get('type') === 'reauthentication' || params.has('access_token')) {
          confirmSave(parsed);
        }
      }
    } catch { /* ignore */ }
  }, []);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('payment_settings').select('*').limit(1).maybeSingle();
    if (error) {
      toast.error('Erro ao carregar definições: ' + error.message);
    } else if (data) {
      setSettings(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isAdmin) {
      navigate('/dashboard', { replace: true });
      return;
    }
    fetch();
  }, [user, isAdmin, authLoading, navigate, fetch]);

  const handleSave = async () => {
    sessionStorage.setItem('pendingPaymentSettings', JSON.stringify(settings));
    const { error } = await supabase.auth.reauthenticate();
    if (error) {
      sessionStorage.removeItem('pendingPaymentSettings');
      toast.error('Erro ao enviar email de verificação: ' + error.message);
      return;
    }
    setVerifying(true);
    toast.success('Email de verificação enviado! Verifica a tua caixa de entrada.');
  };

  const verifyWithCode = async () => {
    if (!code.trim()) return;
    setCodeVerifying(true);
    const pending = sessionStorage.getItem('pendingPaymentSettings');
    const { data, error } = await supabase.auth.verifyOtp({
      email: user?.email!,
      token: code.trim(),
      type: 'email',
    });
    if (error) {
      toast.error('Código inválido: ' + error.message);
      setCodeVerifying(false);
      return;
    }
    if (pending) {
      sessionStorage.removeItem('pendingPaymentSettings');
      const parsed = JSON.parse(pending) as PaymentSettings;
      await confirmSave(parsed);
    }
    setCodeVerifying(false);
  };

  if (authLoading || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: '#6b7280' }}>
        <RotateCw size={24} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} />
        A carregar...
      </div>
    );
  }

  const field = (label: string, value: string, onChange: (v: string) => void, opts?: { placeholder?: string; monospace?: boolean }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#0d1117', display: 'block', marginBottom: 6 }}>{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={opts?.placeholder}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 12,
          border: '1px solid #e2e5e9', fontSize: 13, outline: 'none',
          fontFamily: opts?.monospace ? "'JetBrains Mono', 'Fira Code', monospace" : "'Poppins', sans-serif",
        }}
      />
    </div>
  );

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Definições de Pagamento</h1>
        <p style={{ fontSize: 13, color: '#6b7280' }}>Configura as formas de pagamento que aparecem no checkout.</p>
      </div>

      {/* Bank Transfer */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e2e5e9', padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Landmark size={18} color="#0d1117" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Transferência Bancária</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Dados para o cliente fazer a transferência</div>
          </div>
        </div>
        {field('Nome do Banco', settings.bank_name, v => setSettings(s => ({ ...s, bank_name: v })), { placeholder: 'Ex: BAI (Banco Angolano de Investimentos)' })}
        {field('IBAN', settings.bank_iban, v => setSettings(s => ({ ...s, bank_iban: v })), { placeholder: 'Ex: AO06 0040 0000 1234 5678 9012 3', monospace: true })}
        {field('NIB', settings.bank_nib, v => setSettings(s => ({ ...s, bank_nib: v })), { placeholder: 'Ex: 0040 0000 1234 5678 9012 3', monospace: true })}
        {field('Titular da Conta', settings.bank_holder, v => setSettings(s => ({ ...s, bank_holder: v })), { placeholder: 'Ex: Agree - Gestão de Contratos, Lda' })}
      </div>

      {/* PayPal */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e2e5e9', padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet size={18} color="#0d1117" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>PayPal</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Email do PayPal empresarial para receber pagamentos</div>
          </div>
        </div>
        {field('Email PayPal', settings.paypal_email, v => setSettings(s => ({ ...s, paypal_email: v })), { placeholder: 'Ex: payments@agree.ao' })}
      </div>

      {verifying ? (
        <div style={{
          background: '#f0f9ff', borderRadius: 16, border: '1.5px solid #bae6fd',
          padding: 24,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 28, background: '#e0f2fe',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Mail size={24} color="#0284c7" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Verifica o teu email</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
              Enviámos um email de confirmação para <strong>{user?.email}</strong>.
              Clica no link do email ou insere o código abaixo.
            </div>
          </div>
          <div style={{
            display: 'flex', gap: 12, alignItems: 'center',
            justifyContent: 'center', marginBottom: 12,
          }}>
            <input
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Código de verificação"
              maxLength={6}
              style={{
                width: 180, padding: '10px 14px', borderRadius: 12,
                border: '1px solid #bae6fd', fontSize: 16, outline: 'none',
                textAlign: 'center', letterSpacing: 4, fontFamily: "'JetBrains Mono', monospace",
              }}
              onKeyDown={e => e.key === 'Enter' && verifyWithCode()}
            />
            <button
              onClick={verifyWithCode}
              disabled={codeVerifying || !code.trim()}
              className="btn-primary"
              style={{ whiteSpace: 'nowrap' }}
            >
              {codeVerifying ? (
                <><RotateCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Verificando...</>
              ) : (
                'Verificar'
              )}
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            <RotateCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 13, color: '#6b7280' }}>A aguardar confirmação pelo link do email...</span>
          </div>
        </div>
      ) : (
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'space-between' }}
        >
          {saving ? (
            <><RotateCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> A guardar...</>
          ) : (
            <><Shield size={16} /> Guardar Definições</>
          )}
        </button>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
