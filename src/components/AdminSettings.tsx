import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { RotateCw, Landmark, Wallet, Shield, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { checkPlan } from '../lib/plans';
import SignatureProviderConfig from './SignatureProviderConfig';

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

const PENDING_KEY = 'pendingPaymentSettings';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export default function AdminSettings() {
  const { user, plan, isLoading: authLoading } = useAuth();
  const [settings, setSettings] = useState<PaymentSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState<PaymentSettings | null>(null);
  const [code, setCode] = useState('');
  const [codeVerifying, setCodeVerifying] = useState(false);
  const [codeError, setCodeError] = useState('');

  const doSave = useCallback(async (data: PaymentSettings) => {
    setSaving(true);
    setPending(null);
    localStorage.removeItem(PENDING_KEY);
    const payload = { ...data, updated_by: user?.id };
    const { error } = await supabase.from('payment_settings').upsert(payload, { onConflict: 'id' });
    setSaving(false);
    if (error) {
      toast.error('Erro ao guardar: ' + error.message);
    } else {
      toast.success('Definições guardadas com sucesso');
    }
  }, [user]);

  const verifyWithCode = async () => {
    if (!code.trim()) return;
    setCodeVerifying(true);
    setCodeError('');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setCodeError('Sessão expirada');
      setCodeVerifying(false);
      return;
    }
    const res = await fetch(`${SUPABASE_URL}/auth/v1/reauthenticate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ reauthentication_token: code.trim() }),
    });
    if (!res.ok) {
      setCodeError('Código inválido ou expirado');
      setCodeVerifying(false);
      return;
    }
    const stored = localStorage.getItem(PENDING_KEY);
    if (stored) {
      await doSave(JSON.parse(stored));
    }
    setCodeVerifying(false);
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PENDING_KEY);
      if (stored) {
        setPending(JSON.parse(stored) as PaymentSettings);
      }
    } catch { /* ignore */ }
  }, []);

  const handleSaveClick = () => {
    localStorage.setItem(PENDING_KEY, JSON.stringify(settings));
    setPending(settings);
    setCode('');
    setCodeError('');
    supabase.auth.reauthenticate();
    toast.success('Email de confirmação enviado! Verifica a tua caixa de entrada.');
  };

  const handleCompleteReauth = async () => {
    const stored = localStorage.getItem(PENDING_KEY);
    if (!stored) return;
    const data = JSON.parse(stored) as PaymentSettings;
    await doSave(data);
  };

  const handleDiscardPending = () => {
    setPending(null);
    localStorage.removeItem(PENDING_KEY);
    setCode('');
    setCodeError('');
    toast.info('Alterações canceladas');
  };

  const loadSettings = useCallback(async () => {
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
    loadSettings();
  }, [authLoading, loadSettings]);

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

      {pending ? (
        <div style={{
          background: '#f0f9ff', borderRadius: 16, border: '1.5px solid #bae6fd',
          padding: 24, textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 28, background: '#e0f2fe',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Mail size={24} color="#0284c7" />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Confirma a alteração</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
            Enviámos um código para <strong>{user?.email}</strong>.
            Insere-o abaixo para confirmares.
          </div>
          <div style={{
            display: 'flex', gap: 12, alignItems: 'center',
            justifyContent: 'center', marginBottom: 12,
          }}>
            <input
              value={code}
              onChange={e => { setCode(e.target.value); setCodeError(''); }}
              placeholder="000000"
              maxLength={6}
              style={{
                width: 140, padding: '10px 14px', borderRadius: 12,
                border: codeError ? '1.5px solid #ef4444' : '1px solid #bae6fd',
                fontSize: 18, outline: 'none',
                textAlign: 'center', letterSpacing: 6, fontFamily: "'JetBrains Mono', monospace",
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
                <><RotateCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> A verificar...</>
              ) : (
                'Confirmar'
              )}
            </button>
          </div>
          {codeError && (
            <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 12 }}>{codeError}</div>
          )}
          <div style={{ borderTop: '1px solid #e0f2fe', paddingTop: 16 }}>
            <button
              onClick={handleCompleteReauth}
              disabled={saving}
              style={{
                padding: '8px 16px', borderRadius: 10, border: '1px solid #bae6fd',
                background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#0284c7',
              }}
            >
              {saving ? 'A guardar...' : 'Já cliquei no link do email'}
            </button>
            <span style={{ color: '#d1d5db', margin: '0 10px' }}>|</span>
            <button
              onClick={handleDiscardPending}
              disabled={saving}
              style={{
                padding: '8px 16px', borderRadius: 10, border: 'none',
                background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#6b7280',
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleSaveClick}
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

      {checkPlan(plan, 'enterprise') && (
        <div style={{ marginTop: 24 }}>
          <SignatureProviderConfig />
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
