import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { checkPlan } from '../lib/plans';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Prefs {
  email_approval: boolean;
  email_sharing: boolean;
  email_expiry: boolean;
  email_digest: boolean;
  in_app_approval: boolean;
  in_app_sharing: boolean;
  in_app_expiry: boolean;
}

const defaultPrefs: Prefs = {
  email_approval: true,
  email_sharing: true,
  email_expiry: true,
  email_digest: false,
  in_app_approval: true,
  in_app_sharing: true,
  in_app_expiry: true,
};

export default function NotificationPreferences() {
  const { user, plan, isAdmin, trialEndsAt } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canConfigure = checkPlan(plan, 'enterprise', isAdmin, trialEndsAt);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPrefs({
            email_approval: data.email_approval ?? true,
            email_sharing: data.email_sharing ?? true,
            email_expiry: data.email_expiry ?? true,
            email_digest: data.email_digest ?? false,
            in_app_approval: data.in_app_approval ?? true,
            in_app_sharing: data.in_app_sharing ?? true,
            in_app_expiry: data.in_app_expiry ?? true,
          });
        }
        setLoading(false);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({ user_id: user.id, ...prefs, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      if (error) throw error;
      toast.success('Preferências guardadas');
    } catch {
      toast.error('Erro ao guardar preferências');
    } finally {
      setSaving(false);
    }
  };

  if (!canConfigure) {
    return (
      <div style={{
        fontFamily: "'Poppins',sans-serif", padding: 28,
        background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.5)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0d1117', marginBottom: 8 }}>Preferências de Notificação</h3>
        <p style={{ fontSize: 13, color: '#6b7280' }}>Disponível no plano Enterprise.</p>
      </div>
    );
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /></div>;
  }

  const toggle = (key: keyof Prefs) => setPrefs(prev => ({ ...prev, [key]: !prev[key] }));

  const Switch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      type="button"
      onClick={onChange}
      style={{
        width: 40, height: 22, borderRadius: 11, border: 'none',
        background: checked ? '#0d1117' : '#e2e5e9',
        cursor: 'pointer', position: 'relative', transition: 'background .2s',
        padding: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 2, left: checked ? 20 : 2,
        width: 18, height: 18, borderRadius: '50%',
        background: '#fff', transition: 'left .2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }} />
    </button>
  );

  return (
    <div style={{
      fontFamily: "'Poppins',sans-serif", padding: 28,
      background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(30px)',
      WebkitBackdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.5)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
    }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0d1117', marginBottom: 20 }}>Preferências de Notificação</h3>

      <div style={{ marginBottom: 24 }}>
        <h4 style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.3 }}>Email</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { key: 'email_approval' as keyof Prefs, label: 'Aprovação de contratos' },
            { key: 'email_sharing' as keyof Prefs, label: 'Partilha de contratos' },
            { key: 'email_expiry' as keyof Prefs, label: 'Vencimento de contratos' },
            { key: 'email_digest' as keyof Prefs, label: 'Resumo diário/semanal' },
          ].map(item => (
            <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#0d1117' }}>{item.label}</span>
              <Switch checked={prefs[item.key]} onChange={() => toggle(item.key)} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.3 }}>Notificações na App</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { key: 'in_app_approval' as keyof Prefs, label: 'Aprovação de contratos' },
            { key: 'in_app_sharing' as keyof Prefs, label: 'Partilha de contratos' },
            { key: 'in_app_expiry' as keyof Prefs, label: 'Vencimento de contratos' },
          ].map(item => (
            <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#0d1117' }}>{item.label}</span>
              <Switch checked={prefs[item.key]} onChange={() => toggle(item.key)} />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          marginTop: 24, padding: '10px 20px', fontSize: 13, fontWeight: 600,
          background: saving ? '#999' : '#0d1117', border: 'none',
          color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
          fontFamily: "'Poppins',sans-serif",
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}
      >
        {saving && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
        {saving ? 'A guardar...' : 'Guardar Preferências'}
      </button>
    </div>
  );
}
