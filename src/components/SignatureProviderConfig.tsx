import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getAllProviders, SignatureProvider } from '../services/signatureProviders';
import { PenSquare, Loader2, CheckCircle2, XCircle, Save, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

// Fields per provider type
const PROVIDER_FIELDS: Record<string, { key: string; label: string; placeholder: string; secret?: boolean }[]> = {
  docusign: [
    { key: 'base_url', label: 'Base URL', placeholder: 'https://demo.docusign.net/restapi' },
    { key: 'account_id', label: 'Account ID', placeholder: 'abc-123...' },
    { key: 'api_key', label: 'Access Token', placeholder: 'eyJ...', secret: true },
  ],
  hellosign: [
    { key: 'base_url', label: 'Base URL', placeholder: 'https://api.hellosign.com/v3' },
    { key: 'api_key', label: 'API Key', placeholder: 'abc123...', secret: true },
    { key: 'client_id', label: 'Client ID', placeholder: 'abc123...', secret: true },
  ],
  signnow: [
    { key: 'base_url', label: 'Base URL', placeholder: 'https://api.signnow.com' },
    { key: 'api_key', label: 'Bearer Token', placeholder: 'eyJ...', secret: true },
    { key: 'account_id', label: 'Account ID', placeholder: 'user_...' },
  ],
};

export default function SignatureProviderConfig() {
  const [providers, setProviders] = useState<SignatureProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getAllProviders().then(data => {
      setProviders(data);
      setLoading(false);
    });
  }, []);

  const updateConfig = (id: string, key: string, value: string) => {
    setProviders(prev => prev.map(p =>
      p.id === id ? { ...p, config: { ...p.config, [key]: value } } : p
    ));
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('signature_providers')
      .update({ is_active: !current })
      .eq('id', id);
    if (error) { toast.error('Erro ao alterar estado'); return; }
    setProviders(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p));
    toast.success(`Provider ${current ? 'desactivado' : 'activado'}`);
  };

  const handleSave = async (id: string, provider: SignatureProvider) => {
    setSaving(id);
    const { error } = await supabase
      .from('signature_providers')
      .update({ config: provider.config })
      .eq('id', id);
    if (error) { toast.error('Erro ao guardar'); } else { toast.success('Configuração guardada'); }
    setSaving(null);
  };

  const cardStyle: React.CSSProperties = {
    background: '#fff', border: '1px solid #e2e5e9', marginBottom: 16,
  };

  if (loading) return <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /></div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <PenSquare size={16} />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#0d1117' }}>Provedores de Assinatura Digital</span>
      </div>
      {providers.map(p => {
        const fields = PROVIDER_FIELDS[p.name] || [];
        const showSecret = showSecrets[p.id] || false;
        return (
          <div key={p.id} style={cardStyle}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f2f4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0d1117' }}>{p.label}</span>
                {p.is_active
                  ? <CheckCircle2 size={14} color="#10b981" />
                  : <XCircle size={14} color="#9ca3af" />
                }
              </div>
              <button onClick={() => toggleActive(p.id, p.is_active)}
                style={{
                  padding: '5px 12px', fontSize: 11, fontWeight: 600,
                  background: p.is_active ? '#fee2e2' : '#f0fdf4',
                  color: p.is_active ? '#ef4444' : '#16a34a',
                  border: 'none', cursor: 'pointer',
                }}
              >
                {p.is_active ? 'Desactivar' : 'Activar'}
              </button>
            </div>
            <div style={{ padding: '14px 20px' }}>
              {fields.map(f => (
                <div key={f.key} style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 3 }}>{f.label}</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={f.secret && !showSecret ? 'password' : 'text'}
                      value={(p.config as any)[f.key] || ''}
                      onChange={e => updateConfig(p.id, f.key, e.target.value)}
                      placeholder={f.placeholder}
                      style={{
                        width: '100%', padding: '8px 10px', fontSize: 12,
                        border: '1.5px solid #e2e5e9', outline: 'none',
                        fontFamily: f.secret ? "'JetBrains Mono',monospace" : "'Poppins',sans-serif",
                        color: '#0d1117', paddingRight: 36,
                      }}
                    />
                    {f.secret && (
                      <button type="button" onClick={() => setShowSecrets(s => ({ ...s, [p.id]: !s[p.id] }))}
                        style={{
                          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4,
                        }}
                      >
                        {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button onClick={() => handleSave(p.id, p)} disabled={saving === p.id}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 16px', background: '#0d1117', color: '#fff',
                  border: 'none', fontSize: 12, fontWeight: 600, cursor: saving === p.id ? 'not-allowed' : 'pointer',
                  opacity: saving === p.id ? 0.7 : 1,
                }}
              >
                {saving === p.id ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                Guardar
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
