import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Mail, Lock, Shield, RotateCw, CheckCircle, Sparkles } from 'lucide-react';
import NotificationPreferences from './NotificationPreferences';
import ApiDocs from './ApiDocs';
import { checkPlan } from '../lib/plans';

export default function ProfileSettings() {
  const { user, plan, trialEndsAt } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [reauthRequired, setReauthRequired] = useState(false);

  const handleReauthenticate = async () => {
    setReauthRequired(true);
    try {
      const { error } = await supabase.auth.reauthenticate();
      if (error) throw error;
      toast.success('Email de verificação enviado! Verifica a tua caixa de entrada.');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao solicitar verificação');
      setReauthRequired(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      toast.error('Insere um email válido.');
      return;
    }
    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast.success('Email de confirmação enviado para o novo endereço!');
      setEmailSent(true);
      setNewEmail('');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao alterar email');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }
    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      toast.success('Senha alterada com sucesso!');
      setPasswordChanged(true);
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao alterar senha');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Definições da Conta</h1>
        <p style={{ fontSize: 13, color: '#6b7280' }}>
          Altera o teu email ou senha. As alterações são protegidas por verificação.
        </p>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28,
        maxWidth: 720,
      }}>
        {/* Change Email */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            background: '#fff', borderRadius: 16,
            border: '1px solid #e2e5e9', padding: 32,
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0d1117' }}>Alterar Email</h3>
              <p style={{ fontSize: 12, color: '#6b7280' }}>Email atual: {user?.email}</p>
            </div>
          </div>

          {emailSent ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
              padding: 32, textAlign: 'center',
              background: '#f9fafb', borderRadius: 16, border: '1px solid #e2e5e9',
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={22} color="#fff" />
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#0d1117', marginBottom: 4 }}>Verifica o teu email</p>
                <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
                  Enviámos um email de confirmação para o novo endereço.<br />
                  Clica no link do email para concluir a alteração.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleChangeEmail} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="Novo email"
                required
                style={{
                  width: '100%', padding: '12px 14px', fontSize: 14,
                  border: '1px solid #e2e5e9', borderRadius: 10,
                  outline: 'none', fontFamily: "'Poppins', sans-serif",
                }}
                onFocus={e => e.target.style.borderColor = '#0d1117'}
                onBlur={e => e.target.style.borderColor = '#e2e5e9'}
              />
              <button
                type="submit"
                disabled={emailLoading}
                style={{
                  padding: '12px 20px', fontSize: 14, fontWeight: 700,
                  background: '#0d1117', border: 'none', borderRadius: 12,
                  color: '#fff', cursor: emailLoading ? 'not-allowed' : 'pointer',
                  fontFamily: "'Poppins', sans-serif",
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: emailLoading ? 0.6 : 1,
                }}
              >
                {emailLoading ? <RotateCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                {emailLoading ? 'A enviar...' : 'Alterar Email'}
              </button>
            </form>
          )}
        </motion.div>

        {/* Change Password */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{
            background: '#fff', borderRadius: 16,
            border: '1px solid #e2e5e9', padding: 32,
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0d1117' }}>Alterar Senha</h3>
              <p style={{ fontSize: 12, color: '#6b7280' }}>Mínimo de 6 caracteres</p>
            </div>
          </div>

          {passwordChanged ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 16, background: '#f0fdf4', borderRadius: 12, border: '1px solid #22c55e' }}>
              <CheckCircle size={18} color="#22c55e" />
              <span style={{ fontSize: 13, color: '#166534' }}>Senha alterada com sucesso!</span>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Nova senha"
                required
                minLength={6}
                style={{
                  width: '100%', padding: '12px 14px', fontSize: 14,
                  border: '1px solid #e2e5e9', borderRadius: 10,
                  outline: 'none', fontFamily: "'Poppins', sans-serif",
                }}
                onFocus={e => e.target.style.borderColor = '#0d1117'}
                onBlur={e => e.target.style.borderColor = '#e2e5e9'}
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirmar nova senha"
                required
                minLength={6}
                style={{
                  width: '100%', padding: '12px 14px', fontSize: 14,
                  border: '1px solid #e2e5e9', borderRadius: 10,
                  outline: 'none', fontFamily: "'Poppins', sans-serif",
                }}
                onFocus={e => e.target.style.borderColor = '#0d1117'}
                onBlur={e => e.target.style.borderColor = '#e2e5e9'}
              />
              <button
                type="submit"
                disabled={passwordLoading}
                style={{
                  padding: '12px 20px', fontSize: 14, fontWeight: 700,
                  background: '#0d1117', border: 'none', borderRadius: 12,
                  color: '#fff', cursor: passwordLoading ? 'not-allowed' : 'pointer',
                  fontFamily: "'Poppins', sans-serif",
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: passwordLoading ? 0.6 : 1,
                }}
              >
                {passwordLoading ? <RotateCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                {passwordLoading ? 'A guardar...' : 'Alterar Senha'}
              </button>
            </form>
          )}
        </motion.div>

        {/* Reauthentication Info */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          style={{
            background: '#f9fafb', borderRadius: 16,
            border: '1px solid #e2e5e9', padding: 24,
            gridColumn: '1 / -1',
          }}
        >
          {reauthRequired ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center', padding: 8 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={22} color="#fff" />
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#0d1117', marginBottom: 4 }}>Verifica o teu email</p>
                <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
                  Enviámos um email de verificação para <strong>{user?.email}</strong>.<br />
                  Clica no link do email para confirmares a tua identidade.
                </p>
              </div>
              <button
                onClick={() => setReauthRequired(false)}
                style={{
                  padding: '8px 16px', fontSize: 12, fontWeight: 600,
                  background: 'transparent', border: '1px solid #e2e5e9',
                  borderRadius: 8, color: '#374151', cursor: 'pointer',
                  fontFamily: "'Poppins', sans-serif", marginTop: 4,
                }}
              >
                Fechar
              </button>
            </div>
          ) : (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Shield size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0d1117', marginBottom: 4 }}>Segurança</h3>
              <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
                Operações sensíveis como alterar email ou senha podem exigir verificação adicional.
                O Supabase envia um email para confirmares a tua identidade antes de aplicar as alterações.
              </p>
            </div>
          </div>
          )}
        </motion.div>

        {checkPlan(plan, 'pro', false, trialEndsAt) && (
          <div style={{ gridColumn: '1 / -1', marginTop: 24 }}>
            <ApiDocs />
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <NotificationPreferences />
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
