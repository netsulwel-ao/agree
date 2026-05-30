import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader, ArrowRight, ArrowLeft } from 'lucide-react';
import AgreeLogo from '../Agree-logo.svg';

export default function EmailConfirmed() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleConfirmation = async () => {
      const hashParams = new URLSearchParams(location.hash.replace('#', '?'));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') || '';
      const type = hashParams.get('type');

      if (!accessToken) {
        setStatus('error');
        setErrorMsg('Link de confirmação inválido ou expirado.');
        return;
      }

      // For email change and reauthentication, just set the session
      if (type === 'email_change' || type === 'signup' || type === 'reauthentication') {
        try {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            if (error.message.includes('expired') || error.message.includes('invalid')) {
              setStatus('error');
              setErrorMsg('Este link expirou ou já foi usado.');
            } else {
              setStatus('error');
              setErrorMsg(error.message);
            }
            return;
          }

          setStatus('success');
          return;
        } catch {
          setStatus('error');
          setErrorMsg('Ocorreu um erro ao processar o link.');
          return;
        }
      }

      setStatus('error');
      setErrorMsg('Link de confirmação inválido ou expirado.');
    };

    handleConfirmation();
  }, [location.hash]);

  return (
    <div className="font-[Poppins] bg-white min-h-screen flex items-center justify-center p-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          maxWidth: 460,
          width: '100%',
          background: '#fff',
          border: '1px solid #e2e5e9',
          padding: 56,
          textAlign: 'center',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 32 }}>
          <img src={AgreeLogo} alt="" style={{ height: 32, display: 'block' }} />
          <span style={{ fontSize: 22, fontWeight: 800, color: '#0d1117', letterSpacing: -0.5 }}>Agree</span>
        </div>

        {status === 'loading' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div style={{
              width: 64, height: 64, background: '#f9fafb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Loader size={28} color="#0d1117" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0d1117', marginBottom: 8 }}>
              A confirmar o teu email...
            </h2>
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
              Aguarda um momento enquanto verificamos o teu link de confirmação.
            </p>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div style={{
              width: 64, height: 64, background: '#0d1117',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <CheckCircle size={28} color="#fff" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0d1117', marginBottom: 8 }}>
              Email confirmado!
            </h2>
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginBottom: 32 }}>
              {(() => {
                const hashParams = new URLSearchParams(location.hash.replace('#', '?'));
                const type = hashParams.get('type');
                if (type === 'email_change') return 'O teu email foi alterado com sucesso.';
                if (type === 'reauthentication') return 'A tua identidade foi verificada com sucesso.';
                return 'A tua conta foi verificada com sucesso. Já podes aceder à plataforma e começar a gerir os teus contratos.';
              })()}
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                width: '100%', padding: '14px 24px', fontSize: 15, fontWeight: 700,
                background: '#0d1117', border: 'none', color: '#fff', cursor: 'pointer',
                fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8,
              }}
            >
              Ir para o Dashboard <ArrowRight size={16} />
            </button>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div style={{
              width: 64, height: 64, background: '#fef2f2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <XCircle size={28} color="#ef4444" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0d1117', marginBottom: 8 }}>
              Link inválido ou expirado
            </h2>
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginBottom: 32 }}>
              {errorMsg}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => navigate('/login')}
                style={{
                  width: '100%', padding: '14px 24px', fontSize: 15, fontWeight: 700,
                  background: '#0d1117', border: 'none', color: '#fff', cursor: 'pointer',
                  fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 8,
                }}
              >
                Ir para o Login <ArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate('/')}
                style={{
                  width: '100%', padding: '12px 24px', fontSize: 14, fontWeight: 600,
                  background: 'transparent', border: '1px solid #e2e5e9', color: '#0d1117',
                  cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <ArrowLeft size={15} /> Voltar à página inicial
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}