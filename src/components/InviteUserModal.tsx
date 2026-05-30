import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { X, Mail, Send, CheckCircle } from 'lucide-react';

interface InviteUserModalProps {
  open: boolean;
  onClose: () => void;
}

export default function InviteUserModal({ open, onClose }: InviteUserModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  if (!open) return null;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: { name: name || undefined },
      });
      if (error) throw error;
      setSent(true);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar convite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 20, padding: 40,
          width: '100%', maxWidth: 440,
          boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: '#9ca3af', padding: 4,
          }}
        >
          <X size={20} />
        </button>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: '#0d1117', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <CheckCircle size={26} color="#fff" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0d1117', marginBottom: 8 }}>
              Convite enviado!
            </h2>
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginBottom: 16 }}>
              Enviámos um email para <strong>{email}</strong> com as instruções para criar a conta.
            </p>
            <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 24 }}>
              O utilizador só precisa de clicar no link do email para ativar a conta.
            </p>
            <button
              onClick={onClose}
              style={{
                width: '100%', padding: '14px 20px', fontSize: 15, fontWeight: 700,
                background: '#0d1117', border: 'none', borderRadius: 12,
                color: '#fff', cursor: 'pointer',
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              Fechar
            </button>
          </div>
        ) : (
          <>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: '#0d1117', display: 'flex', alignItems: 'center',
              justifyContent: 'center', marginBottom: 16,
            }}>
              <Mail size={22} color="#fff" />
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0d1117', marginBottom: 4 }}>
              Convidar utilizador
            </h2>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>
              O utilizador receberá um email com um link para criar a conta.
            </p>

            <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 6, letterSpacing: '.04em' }}>
                  NOME (OPCIONAL)
                </label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Nome do utilizador"
                  style={{
                    width: '100%', padding: '12px 14px', fontSize: 14,
                    border: '1px solid #e2e5e9', borderRadius: 10,
                    outline: 'none', fontFamily: "'Poppins', sans-serif",
                    transition: 'border-color .15s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#0d1117'}
                  onBlur={e => e.target.style.borderColor = '#e2e5e9'}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 6, letterSpacing: '.04em' }}>
                  EMAIL *
                </label>
                <input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  type="email"
                  placeholder="email@exemplo.com"
                  required
                  style={{
                    width: '100%', padding: '12px 14px', fontSize: 14,
                    border: '1px solid #e2e5e9', borderRadius: 10,
                    outline: 'none', fontFamily: "'Poppins', sans-serif",
                    transition: 'border-color .15s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#0d1117'}
                  onBlur={e => e.target.style.borderColor = '#e2e5e9'}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '14px 20px', fontSize: 15, fontWeight: 700,
                  background: '#0d1117', border: 'none', borderRadius: 12,
                  color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: "'Poppins', sans-serif",
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: loading ? 0.6 : 1,
                }}
              >
                <Send size={16} />
                {loading ? 'A enviar convite...' : 'Enviar convite'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
