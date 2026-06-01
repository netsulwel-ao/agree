import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function GoogleCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('A conectar conta Google...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const expiresIn = params.get('expires_in');
        const state = params.get('state'); // user_id

        if (!accessToken || !state) {
          setStatus('error');
          setMessage('Token ou estado inválido. Tenta novamente.');
          return;
        }

        // Fetch user info
        const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const userInfo = await userRes.json();

        const expiresAt = expiresIn ? Math.floor(Date.now() / 1000) + parseInt(expiresIn) : undefined;

        const { error } = await supabase.from('google_integrations').upsert({
          user_id: state,
          access_token: accessToken,
          google_email: userInfo.email,
          google_name: userInfo.name,
          token_expires_at: expiresAt ? new Date(expiresAt * 1000).toISOString() : null,
          is_connected: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

        if (error) throw error;

        setStatus('success');
        setMessage(`Conta Google conectada: ${userInfo.email}`);
        setTimeout(() => navigate('/profile'), 1500);
      } catch {
        setStatus('error');
        setMessage('Erro ao conectar conta Google.');
      }
    };

    handleCallback();
  }, [navigate]);

  const containerStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', fontFamily: "'Poppins',sans-serif", background: '#f8f9fa',
  };

  return (
    <div style={containerStyle}>
      {status === 'processing' && <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#4285F4' }} />}
      {status === 'success' && <CheckCircle2 size={32} color="#10b981" />}
      {status === 'error' && <XCircle size={32} color="#ef4444" />}
      <p style={{ marginTop: 12, fontSize: 14, fontWeight: 500, color: status === 'error' ? '#ef4444' : '#374151' }}>
        {message}
      </p>
      {status === 'error' && (
        <button onClick={() => navigate('/profile')}
          style={{ marginTop: 16, padding: '8px 20px', background: '#0d1117', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          Voltar às definições
        </button>
      )}
    </div>
  );
}
