import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, ArrowLeft, CheckCircle, XCircle, Loader } from 'lucide-react';
import AgreeLogo from '../Agree-logo.svg';

export default function ResetPassword() {
  const [step, setStep] = useState<'verifying' | 'form' | 'success' | 'error'>('verifying');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let settled = false;
    let errorTimer: ReturnType<typeof setTimeout>;

    const showForm = () => {
      settled = true;
      setStep('form');
    };

    const showError = (msg: string) => {
      if (settled) return;
      settled = true;
      setStep('error');
      setErrorMsg(msg);
    };

    // 1) O hash pode ainda estar no URL (supabase ainda não o consumiu)
    const hashParams = new URLSearchParams(location.hash.replace('#', '?'));
    const type = hashParams.get('type');
    const accessToken = hashParams.get('access_token');

    if (type === 'recovery' && accessToken) {
      showForm();
      return;
    }

    // 2) Com detectSessionInUrl, o supabase-js consome o hash e limpa o URL.
    //    Nesse caso a sessão já está estabelecida — confirma via getSession.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (settled) return;
      if (session) {
        showForm();
        return;
      }
      // 3) Janela para o evento PASSWORD_RECOVERY chegar antes de dar erro
      errorTimer = setTimeout(() => {
        showError('Link de recuperação inválido ou expirado.');
      }, 2000);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') showForm();
    });

    return () => {
      clearTimeout(errorTimer);
      subscription.unsubscribe();
    };
  }, [location.hash]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      toast('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setStep('success');
    } catch (error: any) {
      setErrorMsg(error.message || 'Erro ao redefinir senha');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const toast = (msg: string) => {
    const el = document.createElement('div');
    el.textContent = msg;
    Object.assign(el.style, {
      position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
      background: '#0d1117', color: '#fff', padding: '12px 24px',
      borderRadius: '12px', fontSize: '13px', zIndex: '200',
      fontFamily: "'Poppins', sans-serif",
    });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  };

  return (
    <div className="font-[Poppins] bg-white min-h-screen flex items-center justify-center p-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          maxWidth: 460, width: '100%',
          background: '#fff', border: '1px solid #e2e5e9',
          padding: 56, textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 32 }}>
          <img src={AgreeLogo} alt="" style={{ height: 32, display: 'block' }} />
          <span style={{ fontSize: 22, fontWeight: 800, color: '#0d1117', letterSpacing: -0.5 }}>Agree</span>
        </div>

        {step === 'verifying' && (
          <div>
            <div style={{ width: 64, height: 64, background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Loader size={28} color="#0d1117" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0d1117', marginBottom: 8 }}>A verificar link...</h2>
          </div>
        )}

        {step === 'form' && (
          <form onSubmit={handleReset}>
            <div style={{ width: 64, height: 64, background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Lock size={28} color="#fff" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0d1117', marginBottom: 4 }}>Redefinir senha</h2>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 28, lineHeight: 1.6 }}>
              Escolhe uma nova senha para a tua conta.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 6, letterSpacing: '.04em' }}>
                  NOVA SENHA
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  style={{
                    width: '100%', padding: '12px 14px', fontSize: 14,
                    border: '1px solid #e2e5e9', outline: 'none',
                    fontFamily: "'Poppins', sans-serif",
                  }}
                  onFocus={e => e.target.style.borderColor = '#0d1117'}
                  onBlur={e => e.target.style.borderColor = '#e2e5e9'}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 6, letterSpacing: '.04em' }}>
                  CONFIRMAR SENHA
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  style={{
                    width: '100%', padding: '12px 14px', fontSize: 14,
                    border: '1px solid #e2e5e9', outline: 'none',
                    fontFamily: "'Poppins', sans-serif",
                  }}
                  onFocus={e => e.target.style.borderColor = '#0d1117'}
                  onBlur={e => e.target.style.borderColor = '#e2e5e9'}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '14px 24px', fontSize: 15, fontWeight: 700,
                  background: '#0d1117', border: 'none', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: "'Poppins', sans-serif",
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: loading ? 0.6 : 1, marginTop: 4,
                }}
              >
                {loading ? 'A guardar...' : 'Redefinir senha'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </div>
          </form>
        )}

        {step === 'success' && (
          <div>
            <div style={{ width: 64, height: 64, background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle size={28} color="#fff" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0d1117', marginBottom: 8 }}>Senha redefinida!</h2>
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginBottom: 32 }}>
              A tua senha foi alterada com sucesso. Agora podes entrar com a nova senha.
            </p>
            <button
              onClick={() => navigate('/login')}
              style={{
                width: '100%', padding: '14px 24px', fontSize: 15, fontWeight: 700,
                background: '#0d1117', border: 'none', color: '#fff', cursor: 'pointer',
                fontFamily: "'Poppins', sans-serif",
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              Ir para o Login <ArrowRight size={16} />
            </button>
          </div>
        )}

        {step === 'error' && (
          <div>
            <div style={{ width: 64, height: 64, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <XCircle size={28} color="#ef4444" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0d1117', marginBottom: 8 }}>Link inválido</h2>
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginBottom: 32 }}>
              {errorMsg}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => navigate('/login')}
                style={{
                  width: '100%', padding: '14px 24px', fontSize: 15, fontWeight: 700,
                  background: '#0d1117', border: 'none', color: '#fff', cursor: 'pointer',
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Ir para o Login
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
          </div>
        )}
      </motion.div>
    </div>
  );
}
