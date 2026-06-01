import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Loader2, CheckCircle2, X, ExternalLink, RefreshCw, LogOut
} from 'lucide-react';
import { toast } from 'sonner';

const GOOGLE_CLIENT_ID_STORAGE_KEY = 'agree_google_client_id';

interface GoogleUser {
  email: string;
  name: string;
  picture?: string;
}

export default function GoogleConfigPanel() {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState(() => localStorage.getItem(GOOGLE_CLIENT_ID_STORAGE_KEY) || '');
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    if (!user) return;
    const check = async () => {
      const { data } = await supabase
        .from('google_integrations')
        .select('google_email, google_name, is_connected')
        .eq('user_id', user.id)
        .single();
      if (data?.is_connected) {
        setConnected(true);
        setGoogleUser({ email: data.google_email || '', name: data.google_name || '' });
      }
      setLoading(false);
    };
    check();
  }, [user]);

  const saveClientId = () => {
    localStorage.setItem(GOOGLE_CLIENT_ID_STORAGE_KEY, clientId);
    toast.success('Client ID guardado');
    setShowConfig(false);
  };

  const handleConnect = useCallback(() => {
    const cid = localStorage.getItem(GOOGLE_CLIENT_ID_STORAGE_KEY);
    if (!cid) {
      toast.error('Configura o Google Client ID primeiro');
      setShowConfig(true);
      return;
    }

    const redirectUri = `${window.location.origin}/google-callback`;
    const state = user?.id || '';

    const params = new URLSearchParams({
      client_id: cid,
      redirect_uri: redirectUri,
      response_type: 'token',
      scope: [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ].join(' '),
      state,
      include_granted_scopes: 'true',
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }, [user]);

  const handleDisconnect = async () => {
    if (!user) return;
    try {
      await supabase
        .from('google_integrations')
        .update({ is_connected: false, access_token: null, refresh_token: null, token_expires_at: null })
        .eq('user_id', user.id);
      setConnected(false);
      setGoogleUser(null);
      toast.success('Conta Google desconectada');
    } catch { toast.error('Erro ao desconectar'); }
  };

  const cardStyle: React.CSSProperties = {
    background: '#fff', border: '1px solid #e2e5e9', overflow: 'hidden',
  };

  if (loading) return <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /></div>;

  return (
    <div style={cardStyle}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f2f4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0d1117' }}>Google Calendar & Docs</span>
        </div>
        <button onClick={() => setShowConfig(p => !p)}
          style={{ padding: '4px 10px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#6b7280' }}
        >Configurar</button>
      </div>

      {showConfig && (
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #f0f2f4', background: 'rgba(13,17,23,0.02)' }}>
          <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>
            Client ID do Google Cloud Console (APIs → Credenciais → OAuth 2.0):
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" value={clientId} onChange={e => setClientId(e.target.value)}
              placeholder="123456-abc.apps.googleusercontent.com"
              style={{
                flex: 1, padding: '6px 10px', fontSize: 12, border: '1.5px solid #e2e5e9',
                outline: 'none', fontFamily: "'Poppins',sans-serif", color: '#0d1117'
              }}
            />
            <button onClick={saveClientId}
              style={{ padding: '6px 14px', background: '#0d1117', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >Guardar</button>
          </div>
          <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>
            Redirect URI: <code style={{ background: 'rgba(13,17,23,0.05)', padding: '1px 4px' }}>{window.location.origin}/google-callback</code>
          </p>
        </div>
      )}

      <div style={{ padding: '16px 20px' }}>
        {connected && googleUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckCircle2 size={20} color="#10b981" />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0d1117' }}>{googleUser.name}</p>
              <p style={{ fontSize: 12, color: '#6b7280' }}>{googleUser.email}</p>
            </div>
            <button onClick={handleDisconnect}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: 'transparent', border: '1px solid #ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#ef4444' }}
            ><LogOut size={14} /> Desconectar</button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>
              Conecta a tua conta Google para criar eventos no Calendar e exportar contratos para o Docs.
            </p>
            <button onClick={handleConnect}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                background: '#0d1117', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Conectar Google
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
