import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Key, Loader2, Copy, Trash2, Eye, EyeOff, Plus, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ApiKey {
  id: string;
  created_at: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  rate_limit: number;
}

const ALL_SCOPES = [
  { id: 'contracts:read', label: 'Ler contratos' },
  { id: 'contracts:write', label: 'Criar/editar contratos' },
  { id: 'invoices:read', label: 'Ler facturas' },
  { id: 'clients:read', label: 'Ler clientes' },
];

export default function ApiKeyManager() {
  const { user, plan, isAdmin } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newScopes, setNewScopes] = useState<string[]>(['contracts:read']);
  const [creating, setCreating] = useState(false);
  const [justCreatedKey, setJustCreatedKey] = useState<string | null>(null);
  const [showFullKey, setShowFullKey] = useState<Record<string, boolean>>({});

  // Plan limits
  const maxKeys = plan === 'enterprise' ? 10 : plan === 'pro' ? 1 : 0;

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setKeys(data);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const generateKey = (): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const parts: string[] = [];
    for (let p = 0; p < 3; p++) {
      let seg = '';
      for (let i = 0; i < 8; i++) seg += chars[Math.floor(Math.random() * chars.length)];
      parts.push(seg);
    }
    return `ag_${parts.join('_')}`;
  };

  const handleCreate = async () => {
    if (!newName.trim()) { toast.error('Nome obrigatório'); return; }
    if (keys.length >= maxKeys) { toast.error(`Limite de ${maxKeys} chaves atingido`); return; }

    setCreating(true);
    const rawKey = generateKey();
    const prefix = rawKey.slice(0, 8);

    // Hash the key (SHA-256 via Web Crypto)
    const encoder = new TextEncoder();
    const data = encoder.encode(rawKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const { error } = await supabase.from('api_keys').insert({
      user_id: user!.id,
      name: newName.trim(),
      key_hash: keyHash,
      key_prefix: prefix,
      scopes: newScopes,
      rate_limit: 60,
    });

    if (error) { toast.error('Erro ao criar chave'); setCreating(false); return; }

    setJustCreatedKey(rawKey);
    setNewName('');
    setNewScopes(['contracts:read']);
    setShowCreate(false);

    // Refresh
    const { data: fresh } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    if (fresh) setKeys(fresh);

    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tens a certeza? Esta acção é irreversível.')) return;
    const { error } = await supabase.from('api_keys').delete().eq('id', id);
    if (error) { toast.error('Erro ao eliminar'); return; }
    setKeys(prev => prev.filter(k => k.id !== id));
    toast.success('Chave eliminada');
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from('api_keys').update({ is_active: !current }).eq('id', id);
    if (error) { toast.error('Erro ao alterar estado'); return; }
    setKeys(prev => prev.map(k => k.id === id ? { ...k, is_active: !current } : k));
    toast.success(current ? 'Chave desactivada' : 'Chave activada');
  };

  if (maxKeys === 0) {
    return (
      <div style={{ background: '#fff', border: '1px solid #e2e5e9', padding: 32, textAlign: 'center' }}>
        <Key size={24} color="#9ca3af" style={{ marginBottom: 8 }} />
        <p style={{ fontSize: 14, fontWeight: 600, color: '#0d1117', marginBottom: 4 }}>API Pública</p>
        <p style={{ fontSize: 12, color: '#6b7280' }}>
          A API pública está disponível nos planos Pro (1 chave) e Enterprise (10 chaves).
        </p>
      </div>
    );
  }

  if (loading) return <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Key size={16} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0d1117' }}>Chaves de API ({keys.length}/{maxKeys})</span>
        </div>
        {keys.length < maxKeys && (
          <button onClick={() => setShowCreate(p => !p)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#0d1117', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Nova Chave
          </button>
        )}
      </div>

      {/* Just created key — show once */}
      {justCreatedKey && (
        <div style={{ padding: 16, background: '#f0fdf4', border: '1px solid #22c55e', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <CheckCircle2 size={16} color="#16a34a" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>Chave criada! Copia-a agora — não será mostrada novamente.</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <code style={{ flex: 1, padding: '8px 12px', background: '#fff', border: '1px solid #22c55e', fontSize: 12, fontFamily: "'JetBrains Mono',monospace", color: '#0d1117', wordBreak: 'break-all' }}>
              {justCreatedKey}
            </code>
            <button onClick={() => { navigator.clipboard.writeText(justCreatedKey); toast.success('Copiado!'); }}
              style={{ padding: '8px 12px', background: '#fff', border: '1px solid #22c55e', cursor: 'pointer' }}>
              <Copy size={14} />
            </button>
            <button onClick={() => setJustCreatedKey(null)}
              style={{ padding: '8px 12px', background: '#fff', border: '1px solid #22c55e', cursor: 'pointer' }}>
              <XCircle size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div style={{ background: '#fff', border: '1px solid #e2e5e9', marginBottom: 16, padding: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Nome</label>
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="Ex: Integração ERP" style={{ width: '100%', padding: '8px 10px', fontSize: 12, border: '1.5px solid #e2e5e9', outline: 'none' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Permissões</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ALL_SCOPES.map(s => (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#374151', cursor: 'pointer' }}>
                  <input type="checkbox" checked={newScopes.includes(s.id)}
                    onChange={e => setNewScopes(prev => e.target.checked ? [...prev, s.id] : prev.filter(x => x !== s.id))}
                    style={{ cursor: 'pointer' }} />
                  {s.label}
                </label>
              ))}
            </div>
          </div>
          <button onClick={handleCreate} disabled={creating}
            style={{ padding: '8px 20px', background: '#0d1117', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.7 : 1 }}>
            {creating ? 'A criar...' : 'Criar Chave'}
          </button>
        </div>
      )}

      {/* Key list */}
      {keys.length === 0 && !showCreate && (
        <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: 13, background: '#fff', border: '1px solid #e2e5e9' }}>
          Nenhuma chave de API. Cria uma para começar a integrar.
        </div>
      )}

      {keys.map(k => (
        <div key={k.id} style={{ background: '#fff', border: '1px solid #e2e5e9', marginBottom: 8 }}>
          <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0d1117' }}>{k.name}</span>
                {k.is_active
                  ? <span style={{ fontSize: 10, padding: '1px 6px', background: '#f0fdf4', color: '#16a34a', fontWeight: 600 }}>Activa</span>
                  : <span style={{ fontSize: 10, padding: '1px 6px', background: '#f3f4f6', color: '#9ca3af', fontWeight: 600 }}>Inactiva</span>
                }
              </div>
              <code style={{ fontSize: 11, color: '#6b7280', fontFamily: "'JetBrains Mono',monospace" }}>
                {k.key_prefix}...
              </code>
              <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 8 }}>
                {k.scopes?.join(', ') || 'sem scopes'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => toggleActive(k.id, k.is_active)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}
                title={k.is_active ? 'Desactivar' : 'Activar'}>
                {k.is_active ? <XCircle size={14} /> : <CheckCircle2 size={14} color="#16a34a" />}
              </button>
              <button onClick={() => handleDelete(k.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}
                title="Eliminar">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          {k.last_used_at && (
            <div style={{ padding: '0 16px 8px', fontSize: 10, color: '#9ca3af' }}>
              Último uso: {new Date(k.last_used_at).toLocaleString('pt-PT')}
            </div>
          )}
        </div>
      ))}

      {/* API info */}
      <div style={{ marginTop: 16, padding: 14, background: '#f9fafb', fontSize: 11, color: '#6b7280' }}>
        <p style={{ fontWeight: 600, marginBottom: 4, color: '#374151' }}>Endpoint Base:</p>
        <code style={{ fontSize: 11, color: '#3b82f6', wordBreak: 'break-all' }}>
          {import.meta.env.VITE_SUPABASE_URL}/functions/v1/api
        </code>
        <p style={{ fontWeight: 600, marginTop: 8, marginBottom: 4, color: '#374151' }}>Autenticação:</p>
        <code style={{ fontSize: 11, color: '#6b7280' }}>Authorization: Bearer {'{api_key}'}</code>
      </div>
    </div>
  );
}
