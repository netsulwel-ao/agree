import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  ArrowRight, ArrowLeft,
  CheckCircle,
  Mail
} from 'lucide-react';
import AgreeLogo from '../Agree-logo.svg';

type SentReason = 'signup' | 'magic' | 'recovery' | null;

export default function AuthenticationScreen() {
  const [mode, setMode] = useState<'login' | 'signup' | 'recovery' | 'magic'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentReason, setSentReason] = useState<SentReason>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Login realizado com sucesso!');
        navigate(redirectTo);
      } else if (mode === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.origin + '/login' },
        });
        if (error) throw error;
        setSentReason('magic');
      } else if (mode === 'recovery') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/reset-password',
        });
        if (error) throw error;
        setSentReason('recovery');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo: window.location.origin + '/confirmado'
          }
        });
        if (error) throw error;

        if (data?.session === null) {
          setSentReason('signup');
        } else {
          toast.success('Conta criada com sucesso!');
          navigate(redirectTo);
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Ocorreu um erro');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    sessionStorage.setItem('redirectAfterLogin', redirectTo);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/login' }
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Erro no login com Google');
    }
  };

  return (
    <div className="page-mesh auth-wrap" style={{ fontFamily: "'Poppins', sans-serif", color: '#0d1117', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .auth-wrap { display: flex; align-items: center; justify-content: center; min-height: 100vh; }

        .page-mesh {
          background-color: #f5f7f9;
          background-image:
            radial-gradient(40% 45% at 50% 12%, rgba(13,17,23,0.06) 0%, transparent 66%),
            radial-gradient(32% 38% at 8% 28%, rgba(13,17,23,0.075) 0%, transparent 66%),
            radial-gradient(34% 40% at 93% 34%, rgba(0,0,0,0.065) 0%, transparent 66%),
            radial-gradient(38% 44% at 88% 62%, rgba(13,17,23,0.07) 0%, transparent 66%),
            radial-gradient(34% 40% at 10% 74%, rgba(0,0,0,0.06) 0%, transparent 66%),
            radial-gradient(40% 46% at 55% 90%, rgba(13,17,23,0.075) 0%, transparent 66%);
          background-attachment: fixed;
        }

        .sheen-text {
          background-image: linear-gradient(115deg, #0d1117 30%, #46505d 50%, #0d1117 70%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .auth-cards {
          display: flex;
          flex-direction: row;
          align-items: stretch;
          width: 100%;
          max-width: 920px;
          box-shadow: 0 50px 100px -50px rgba(0,0,0,0.45);
        }
        .auth-card {
          flex: 1 1 500px;
          max-width: 500px;
          background: #fff;
          border: 1px solid #e2e5e9;
          padding: 44px 40px;
        }
        .brand-card {
          flex: 1 1 420px;
          max-width: 420px;
          background-color: #0d1117;
          position: relative;
          overflow: hidden;
        }
        .brand-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: #0d1117; color: #fff; border: none;
          padding: 14px 24px; font-size: 15px; font-weight: 700;
          cursor: pointer; font-family: 'Poppins', sans-serif;
          transition: all .2s; white-space: nowrap;
          justify-content: center; width: 100%;
        }
        .btn-primary:hover { background: #000000; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(13,17,23,0.3); }
        .btn-primary:disabled { opacity: .6; cursor: not-allowed; transform: none; box-shadow: none; }

        .btn-outline {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; color: #0d1117;
          border: 1.5px solid #e2e5e9;
          padding: 12px 22px; font-size: 14px; font-weight: 600;
          cursor: pointer; font-family: 'Poppins', sans-serif;
          transition: all .2s; white-space: nowrap;
          justify-content: center; width: 100%;
        }
        .btn-outline:hover { border-color: #0d1117; background: #f9fafb; transform: translateY(-1px); }

        .input-f {
          width: 100%; padding: 13px 14px; font-size: 14px;
          background: #f7f9fb; border: 1.5px solid #e2e5e9;
          color: #0d1117; outline: none;
          font-family: 'Poppins', sans-serif; transition: all .2s;
        }
        .input-f::placeholder { color: #b0b8c1; }
        .input-f:focus { border-color: #0d1117; background: #fff; box-shadow: 0 0 0 3px rgba(13,17,23,0.06); }

        .field-label {
          display: block; font-size: 11px; font-weight: 700;
          color: #6b7280; margin-bottom: 7px; letter-spacing: 1.2px;
          text-transform: uppercase;
        }

        @media(max-width:900px){
          .auth-cards { flex-direction: column; max-width: 460px; }
          .brand-card { max-width: 100%; min-height: 220px; }
          .auth-card { max-width: 100%; }
        }
      `}</style>

      <div className="auth-cards">
        {/* LEFT — Form */}
        <div className="auth-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 34 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <img src={AgreeLogo} alt="" style={{ height: 34, display: 'block' }} />
              <span className="sheen-text" style={{ fontFamily: "'Poppins', sans-serif", fontSize: 21, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1 }}>Agree</span>
            </div>
            {mode !== 'recovery' && (
              <button
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", fontSize: 13, color: '#6b7280', fontWeight: 600, transition: 'color .2s' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#0d1117'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#6b7280'; }}
              >
                {mode === 'login'
                  ? <>Criar conta</>
                  : <>Entrar</>
                }
              </button>
            )}
          </div>

          <motion.div
            key={sentReason || mode}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            {sentReason ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div style={{
                  width: 64, height: 64, background: '#0d1117',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 24px',
                }}>
                  <Mail size={28} color="#fff" />
                </div>
                <h2 className="sheen-text" style={{ fontSize: 24, fontWeight: 800, marginBottom: 16, textAlign: 'center', letterSpacing: -0.5 }}>
                  Verifica o teu email
                </h2>
                <div style={{
                  background: '#f9fafb', border: '1px solid #e2e5e9',
                  padding: 24, marginBottom: 24, textAlign: 'center',
                }}>
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, marginBottom: 12 }}>
                    Enviámos um email para <strong>{email}</strong>
                  </p>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontSize: 13, color: '#6b7280', lineHeight: 1.6,
                  }}>
                    <CheckCircle size={16} color="#22c55e" />
                    <span>
                      {sentReason === 'signup' && 'Clica no link de confirmação para ativares a tua conta.'}
                      {sentReason === 'magic' && 'Clica no link para entrares automaticamente na plataforma.'}
                      {sentReason === 'recovery' && 'Clica no link para redefinires a tua senha.'}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 12 }}>
                    Não recebeste? Verifica a pasta de Spam ou{' '}
                    <button
                      onClick={() => setSentReason(null)}
                      style={{
                        background: 'transparent', border: 'none', color: '#0d1117',
                        fontWeight: 600, cursor: 'pointer', fontSize: 12,
                        fontFamily: "'Poppins', sans-serif", textDecoration: 'underline',
                      }}
                    >
                      tenta novamente
                    </button>
                  </p>
                </div>
                <button
                  onClick={() => { setSentReason(null); setMode('login'); }}
                  className="btn-primary"
                >
                  Voltar ao login <ArrowLeft size={16} />
                </button>
              </motion.div>
            ) : (
            <>
            <h2 className="sheen-text" style={{ fontSize: 27, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1.15, marginBottom: 8 }}>
              {mode === 'login' ? 'Entrar na tua conta' : mode === 'signup' ? 'Criar a tua conta' : mode === 'magic' ? 'Link mágico' : 'Recuperar senha'}
            </h2>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 28, lineHeight: 1.65, fontWeight: 400 }}>
              {mode === 'login'
                ? 'Escolhe o método de autenticação que preferes.'
                : mode === 'signup'
                ? 'Escolhe o método para criares a tua conta.'
                : mode === 'magic'
                ? 'Insere o teu email e receberás um link para entrares sem senha.'
                : 'Insere o teu e-mail e enviaremos um link de recuperação.'
              }
            </p>

            {mode !== 'recovery' && (
              <>
              {mode === 'login' && (
                <button
                  onClick={() => setMode('magic')}
                  className="btn-outline"
                  style={{ marginBottom: 10 }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="4" />
                    <path d="M2 8h20" />
                    <path d="M8 2v20" />
                  </svg>
                  Enviar link mágico
                </button>
              )}

            <button
              onClick={handleGoogleSignIn}
              className="btn-outline"
              style={{ marginBottom: 5 }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z" fill="#4285F4"/>
                <path d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z" fill="#34A853"/>
                <path d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9s.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59z" fill="#FBBC05"/>
                <path d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.19 5.736 7.395 3.977 10 3.977z" fill="#EA4335"/>
              </svg>
              {mode === 'login' ? 'Continuar com Google' : 'Criar conta com Google'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '22px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#e2e5e9' }} />
              <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>ou</span>
              <div style={{ flex: 1, height: 1, background: '#e2e5e9' }} />
            </div>
            </>
            )}

            <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {mode === 'signup' && (
                <div>
                  <label className="field-label">Nome completo</label>
                  <input
                    className="input-f"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Como devemos te chamar?"
                    required
                  />
                </div>
              )}
              <div>
                <label className="field-label">Email</label>
                <input
                  className="input-f"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="teu@email.com"
                  required
                />
              </div>
              {mode !== 'recovery' && mode !== 'magic' && (
                <div>
                  <label className="field-label">Senha</label>
                  <input
                    className="input-f"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
              )}

              {mode === 'login' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -8 }}>
                  <button type="button" onClick={() => setMode('recovery')} style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", transition: 'color .2s' }} onMouseEnter={e => { e.currentTarget.style.color = '#0d1117'; }} onMouseLeave={e => { e.currentTarget.style.color = '#6b7280'; }}>
                    Esqueci-me da senha
                  </button>
                </div>
              )}
              {mode === 'magic' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -8 }}>
                  <button type="button" onClick={() => setMode('login')} style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Poppins', sans-serif" }}>
                    Voltar ao login
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ marginTop: 6 }}
              >
                {loading ? 'Aguarda...' : (mode === 'login' ? 'Entrar no Agree' : mode === 'signup' ? 'Criar conta' : mode === 'magic' ? 'Enviar link mágico' : 'Enviar e-mail')}
                {!loading && mode !== 'recovery' && mode !== 'magic' && <ArrowRight size={18} />}
              </button>

              {mode === 'recovery' && (
                <button type="button" onClick={() => setMode('login')} className="btn-outline" style={{ marginTop: 4 }}>
                  Voltar ao Login
                </button>
              )}
            </form>

            <p style={{ marginTop: 26, fontSize: 12, color: '#9ca3af', lineHeight: 1.6 }}>
              Ao continuar, confirmas que tens mais de 18 anos e aceitas os{' '}
              <a href="/termos" style={{ color: '#0d1117', fontWeight: 600 }}>Termos de Serviço</a>
              {' '}e{' '}
              <a href="/privacidade" style={{ color: '#0d1117', fontWeight: 600 }}>Política de Privacidade</a> do Agree.
            </p>
            </>
            )}
          </motion.div>
        </div>

        {/* RIGHT — Branding image */}
        <div className="brand-card">
          <img src="/Branding.png" alt="Agree — Gestão de Contratos" />
        </div>
      </div>
    </div>
  );
}
