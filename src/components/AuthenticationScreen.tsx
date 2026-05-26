import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, Shield,
  Bell, Zap, CheckCircle, BarChart3,
  FileSignature
} from 'lucide-react';
import { useGlobalLoading } from '../contexts/GlobalLoadingContext';
import AgreeLogo from '../Agree-logo.svg';

export default function AuthenticationScreen() {
  const [mode, setMode] = useState<'login' | 'signup' | 'recovery'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setIsLoading: setGlobalLoading } = useGlobalLoading();

  const features = [
    { icon: <Shield size={20} />, title: 'Segurança Total', desc: 'Criptografia de ponta a ponta, conforme ICP-Brasil e legislação angolana.' },
    { icon: <Bell size={20} />, title: 'Alertas Inteligentes', desc: 'Nunca mais perca um prazo de renovação ou vencimento de contrato.' },
    { icon: <Zap size={20} />, title: 'IA Ajudante', desc: 'Extração automática de dados, sugestões de cláusulas e análise de risco.' },
    { icon: <BarChart3 size={20} />, title: 'Analytics em Tempo Real', desc: 'Dashboards completos do teu portfólio de contratos.' }
  ];

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setGlobalLoading(true, mode === 'login' ? 'A entrar...' : 'A criar conta...');
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Login realizado com sucesso!');
        navigate('/dashboard');
      } else if (mode === 'recovery') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        });
        if (error) throw error;
        toast.success('Email de recuperação enviado! Verifica a tua caixa de entrada.');
        setMode('login');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
            },
            emailRedirectTo: `${window.location.origin}/dashboard`
          }
        });
        if (error) throw error;

        if (data?.session === null) {
          toast.success('Verifica o teu email (incluindo o Spam) para confirmares a conta antes de entrar!');
          setMode('login');
        } else {
          toast.success('Conta criada com sucesso!');
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Ocorreu um erro');
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Erro no login com Google');
    }
  };

  return (
    <div className="font-[Poppins] bg-white text-slate-900 min-h-screen flex flex-col md:flex-row">
      {/* Left Side - Branding */}
      <div className="flex-1 bg-gradient-to-b from-slate-900 to-slate-950 p-12 flex flex-col justify-between min-h-screen">
        <div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border-none px-4 py-2 cursor-pointer transition-all mb-12 w-max"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-semibold">Voltar à página inicial</span>
          </button>

          <div className="flex items-center gap-1 mb-9 bg-white px-3 py-2 w-max">
            <img src={AgreeLogo} alt="" style={{ height: 36, display: 'block' }} />
            <span className="text-[23px] font-extrabold text-slate-900 tracking-tight" style={{ marginLeft: -2 }}>Agree</span>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-extrabold text-white leading-tight mb-4 tracking-tight"
          >
            {mode === 'login' ? 'Bem-vindo de volta!' : mode === 'signup' ? 'Começa a transformar a gestão de contratos hoje' : 'Recuperar o acesso'}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[15px] text-white/70 leading-relaxed max-w-[400px] mb-10"
          >
            {mode === 'login'
              ? 'Acede ao teu painel e continua a gerir os teus contratos com total controlo.'
              : 'Junta-te a centenas de empresas angolanas que já simplificaram o seu fluxo de trabalho contratual.'
            }
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                className="bg-white/5 border border-white/10 p-5"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center mb-3">
                  {React.cloneElement(feature.icon as React.ReactElement, { className: "text-white" })}
                </div>
                <div className="text-[13px] font-bold text-white mb-1">
                  {feature.title}
                </div>
                <div className="text-xs text-white/60 leading-relaxed">
                  {feature.desc}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-5 flex-wrap pt-8 border-t border-white/10 mt-12">
          {['10k+ contratos geridos', '500+ empresas', '98% taxa de retenção', 'Suporte 24/7'].map((label, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <CheckCircle size={15} className="text-white/80" />
              <span className="text-xs text-white/70">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 bg-white flex flex-col justify-center items-center min-h-screen p-8 md:p-14">
        <div className="w-full max-w-[420px]">

          <div className="flex justify-end mb-8">
            {mode !== 'recovery' && (
              <button 
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} 
                className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors bg-transparent border-none cursor-pointer flex gap-1"
              >
                {mode === 'login'
                  ? <>Ainda não tens conta? <strong className="text-slate-900 hover:text-black">Criar conta</strong></>
                  : <>Já tens uma conta? <strong className="text-slate-900 hover:text-black">Entrar</strong></>
                }
              </button>
            )}
          </div>

          <motion.div
            key={mode}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-2xl font-extrabold text-slate-900 mb-1.5 tracking-tight">
              {mode === 'login' ? 'Entrar na tua conta' : mode === 'signup' ? 'Criar a tua conta' : 'Recuperar senha'}
            </h2>
            <p className="text-sm text-slate-500 mb-7 leading-relaxed">
              {mode === 'login'
                ? 'Escolhe o método de autenticação que preferes.'
                : mode === 'signup'
                ? 'Escolhe o método para criares a tua conta.'
                : 'Insere o teu e-mail e enviaremos um link de recuperação.'
              }
            </p>

            {mode !== 'recovery' && (
              <>

            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 px-6 py-3.5 text-[15px] font-semibold text-slate-900 cursor-pointer transition-all hover:bg-slate-50 hover:border-slate-300 mb-5"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z" fill="#4285F4"/>
                <path d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z" fill="#34A853"/>
                <path d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9s.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59z" fill="#FBBC05"/>
                <path d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.19 5.736 7.395 3.977 10 3.977z" fill="#EA4335"/>
              </svg>
              {mode === 'login' ? 'Continuar com Google' : 'Criar conta com Google'}
            </button>

            <div className="flex items-center gap-3.5 mb-5">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">ou</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            </>
            )}

            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-1.5 tracking-wide">
                    NOME COMPLETO
                  </label>
                  <input 
                    className="w-full px-4 py-3.5 text-[15px] bg-white border-2 border-slate-200 text-slate-900 outline-none transition-all focus:border-slate-900 focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] placeholder:text-slate-400" 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Como devemos te chamar?" 
                    required 
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1.5 tracking-wide">
                  EMAIL
                </label>
                <input 
                  className="w-full px-4 py-3.5 text-[15px] bg-white border-2 border-slate-200 text-slate-900 outline-none transition-all focus:border-slate-900 focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] placeholder:text-slate-400" 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="teu@email.com" 
                  required 
                />
              </div>
              {mode !== 'recovery' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-1.5 tracking-wide">
                    SENHA
                  </label>
                  <input 
                    className="w-full px-4 py-3.5 text-[15px] bg-white border-2 border-slate-200 text-slate-900 outline-none transition-all focus:border-slate-900 focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] placeholder:text-slate-400" 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="••••••••" 
                    required 
                  />
                </div>
              )}

              {mode === 'login' && (
                <div className="flex justify-end -mt-2">
                  <button type="button" onClick={() => setMode('recovery')} className="text-xs font-semibold text-slate-700 hover:text-black bg-transparent border-none cursor-pointer">
                    Esqueci-me da senha
                  </button>
                </div>
              )}

              <button
                type="submit" 
                disabled={loading} 
                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white border-none py-3.5 px-6 text-[15px] font-bold cursor-pointer transition-all hover:bg-black hover:-translate-y-[1px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Aguarda...' : (mode === 'login' ? 'Entrar no Agree' : mode === 'signup' ? 'Criar conta' : 'Enviar e-mail')}
                {!loading && mode !== 'recovery' && <ArrowRight size={18} />}
              </button>

              {mode === 'recovery' && (
                <button type="button" onClick={() => setMode('login')} className="mt-2 text-[15px] font-semibold text-slate-500 hover:text-slate-900 bg-transparent border-none cursor-pointer">
                  Voltar ao Login
                </button>
              )}
            </form>

            <p className="mt-6 text-xs text-slate-400 leading-relaxed">
              Ao continuar, confirmas que tens mais de 18 anos e aceitas os{' '}
              <a href="#" className="text-slate-900 hover:underline font-medium">Termos de Serviço</a>
              {' '}e{' '}
              <a href="#" className="text-slate-900 hover:underline font-medium">Política de Privacidade</a> do Agree.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
