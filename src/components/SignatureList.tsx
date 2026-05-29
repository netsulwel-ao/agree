import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PenLine, Trash2, CheckCircle2, Plus, Loader2, Shield, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface UserSignature {
  id: string;
  created_at: string;
  name: string;
  image_url: string;
  is_active: boolean;
}

export default function SignatureList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [signatures, setSignatures] = useState<UserSignature[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('user_signatures')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setSignatures(data);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm('Tens a certeza que queres eliminar esta assinatura?')) return;
    setDeleting(id);
    try {
      const sig = signatures.find(s => s.id === id);
      if (sig?.image_url) {
        const path = sig.image_url.split('/signatures/')[1];
        if (path) await supabase.storage.from('signatures').remove([path]);
      }
      const { error } = await supabase.from('user_signatures').delete().eq('id', id);
      if (error) throw error;
      setSignatures(prev => prev.filter(s => s.id !== id));
      toast.success('Assinatura eliminada');
    } catch {
      toast.error('Erro ao eliminar assinatura');
    } finally {
      setDeleting(null);
    }
  };

  const setActive = async (id: string) => {
    if (!user) return;
    await supabase.from('user_signatures').update({ is_active: false }).eq('user_id', user.id);
    await supabase.from('user_signatures').update({ is_active: true }).eq('id', id);
    setSignatures(prev => prev.map(s => ({ ...s, is_active: s.id === id })));
    toast.success('Assinatura ativa alterada');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Loader2 size={32} className="animate-spin" color="#0d1117" />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Poppins',sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0d1117', margin: 0 }}>Minhas Assinaturas</h2>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{signatures.length} assinatura{signatures.length !== 1 ? 's' : ''} registada{signatures.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => navigate('/signatures/register')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', fontSize: 14, fontWeight: 700, background: '#0d1117', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: 12, fontFamily: "'Poppins',sans-serif" }}>
          <Plus size={18} />
          Nova Assinatura
        </button>
      </div>

      {signatures.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 60, background: '#fff', border: '1px solid #e2e5e9', borderRadius: 20 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#f7f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PenLine size={28} color="#9ca3af" />
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#6b7280' }}>Nenhuma assinatura registada</p>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: 0, textAlign: 'center', maxWidth: 360 }}>
            Regista a tua assinatura digital para poderes assinar contratos de forma segura e estilizada.
          </p>
          <button onClick={() => navigate('/signatures/register')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', fontSize: 14, fontWeight: 700, background: '#0d1117', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: 12, fontFamily: "'Poppins',sans-serif", marginTop: 8 }}>
            <Plus size={18} />
            Registar Assinatura
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {signatures.map(sig => (
            <div key={sig.id} style={{
              display: 'flex', alignItems: 'center', gap: 20,
              padding: '20px 24px', background: '#fff', border: sig.is_active ? '1.5px solid #0d1117' : '1px solid #e2e5e9',
              borderRadius: 16, transition: 'all .2s'
            }}>
              <div style={{ width: 80, height: 56, borderRadius: 10, border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.8)', flexShrink: 0 }}>
                <img src={sig.image_url} alt={sig.name} style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#0d1117', margin: 0, fontFamily: "'Poppins',sans-serif" }}>
                    {sig.name}
                  </p>
                  {sig.is_active && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', background: 'rgba(13,17,23,0.1)', color: '#0d1117', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={10} />
                      Ativa
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
                  Registada em {new Date(sig.created_at).toLocaleDateString()}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {!sig.is_active && (
                  <button onClick={() => setActive(sig.id)} style={{ padding: '8px 14px', fontSize: 12, fontWeight: 600, background: '#fff', border: '1px solid #e2e5e9', color: '#0d1117', cursor: 'pointer', borderRadius: 8, fontFamily: "'Poppins',sans-serif" }}>
                    Usar
                  </button>
                )}
                <button onClick={() => handleDelete(sig.id)} disabled={deleting === sig.id} style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, background: '#fff', border: '1px solid #fee2e2', color: '#ef4444', cursor: deleting === sig.id ? 'not-allowed' : 'pointer', borderRadius: 8, fontFamily: "'Poppins',sans-serif", display: 'flex', alignItems: 'center', gap: 4 }}>
                  {deleting === sig.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Security info */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 18px', background: 'rgba(13,17,23,0.04)', border: '1px solid #e2e5e9', borderRadius: 12, marginTop: 24 }}>
        <Shield size={16} color="#6b7280" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.6, margin: 0, fontFamily: "'Poppins',sans-serif" }}>
          As tuas assinaturas digitais são processadas e criptografadas com AES-GCM 256 bits. A imagem original é convertida para um formato estilizado com fundo transparente, garantindo qualidade e segurança nas tuas assinaturas.
        </p>
      </div>
    </div>
  );
}
