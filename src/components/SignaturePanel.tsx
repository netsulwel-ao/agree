import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  PenLine, CheckCircle2, Clock, Plus, Trash2,
  Mail, Shield, AlertCircle, Loader2, Image as ImageIcon, ArrowUpRight
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';
import { decryptSignature } from '../services/signatureEncryption';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { checkPlan, getLimits, canUpgrade } from '../lib/plans';

interface Signature {
  id: string;
  name: string;
  email: string;
  signed: boolean;
  signedAt?: string;
  hash?: string;
  signatureUrl?: string;
}

interface SignaturePanelProps {
  contract: any;
  user: User;
  onUpdate: () => void;
}

// Simple hash of contract content for integrity
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
}

const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;

async function sendNotificationEmail(to: string, name: string, contractTitle: string, ownerName: string, type: 'invite' | 'reminder' | 'signed') {
  const contractUrl = `${APP_URL}/contracts/${contract.id}`;
  const subject = type === 'invite'
    ? `Foste convidado(a) para assinar: ${contractTitle}`
    : type === 'reminder'
    ? `Lembrete: assina o contrato ${contractTitle}`
    : `Contrato assinado: ${contractTitle}`;

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
      <h2 style="font-size:20px;color:#0d1117;margin-bottom:16px">${subject}</h2>
      ${type === 'invite' ? `<p style="font-size:14px;color:#374151">Olá <strong>${name}</strong>,</p>
      <p style="font-size:14px;color:#374151;line-height:1.6"><strong>${ownerName}</strong> convidou-te para assinar o contrato <strong>"${contractTitle}"</strong> na plataforma Agree.</p>` : ''}
      ${type === 'reminder' ? `<p style="font-size:14px;color:#374151">Olá <strong>${name}</strong>,</p>
      <p style="font-size:14px;color:#374151;line-height:1.6">Ainda não assinaste o contrato <strong>"${contractTitle}"</strong>. O <strong>${ownerName}</strong> solicita a tua assinatura.</p>` : ''}
      ${type === 'signed' ? `<p style="font-size:14px;color:#374151;line-height:1.6"><strong>${name}</strong> assinou o contrato <strong>"${contractTitle}"</strong>.</p>` : ''}
      <p style="font-size:14px;color:#374151">Acede ao link abaixo para ver o contrato:</p>
      <a href="${contractUrl}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:700;color:#fff;background:#0d1117;text-decoration:none;border-radius:10px;margin:16px 0">Ver Contrato</a>
      <hr style="border:none;border-top:1px solid #e2e5e9;margin:24px 0">
      <p style="font-size:12px;color:#9ca3af">Plataforma Agree — Gestão de Contratos</p>
    </div>
  `;

  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html }),
    });
    if (!res.ok) throw new Error(await res.text());
    return true;
  } catch (e: any) {
    console.warn('Email não enviado (SMTP configurado?):', e.message);
    return false;
  }
}

export default function SignaturePanel({ contract, user, onUpdate }: SignaturePanelProps) {
  const { plan, isAdmin } = useAuth();
  const [signatures, setSignatures] = useState<Signature[]>(contract.signatures || []);
  const [addingSignatory, setAddingSignatory] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [signing, setSigning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userSignature, setUserSignature] = useState<{ id: string; image_url: string; name: string } | null>(null);

  useEffect(() => {
    const fetchSignature = async () => {
      const { data } = await supabase
        .from('user_signatures')
        .select('id, image_url, name')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();
      if (data) setUserSignature(data);
    };
    fetchSignature();
  }, [user]);

  const isOwner = contract.owner_id === user.id;
  const currentUserSignature = signatures.find(s => s.email === user.email);
  const allSigned = signatures.length > 0 && signatures.every(s => s.signed);
  const signedCount = signatures.filter(s => s.signed).length;

  const handleAddSignatory = async () => {
    if (!newName.trim() || !newEmail.trim()) {
      toast.error('Preenche o nome e email do signatário');
      return;
    }
    if (signatures.find(s => s.email === newEmail)) {
      toast.error('Este email já foi adicionado');
      return;
    }

    setSaving(true);
    try {
      const newSig: Signature = {
        id: crypto.randomUUID(),
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        signed: false,
      };

      const updated = [...signatures, newSig];
      const { error } = await supabase
        .from('contracts')
        .update({ signatures: updated, updated_at: new Date().toISOString() })
        .eq('id', contract.id);

      if (error) throw error;

      setSignatures(updated);
      setNewName('');
      setNewEmail('');
      setAddingSignatory(false);
      toast.success(`${newSig.name} adicionado como signatário`);

      // Enviar email de notificação
      const sent = await sendNotificationEmail(
        newSig.email, newSig.name, contract.title,
        user.user_metadata?.name || user.email || 'Owner',
        'invite'
      );
      if (!sent) {
        toast.warning('Signatário adicionado, mas não foi possível enviar o email (SMTP não configurado)');
      }

      onUpdate();
    } catch (e) {
      toast.error('Erro ao adicionar signatário');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSignatory = async (id: string) => {
    const sig = signatures.find(s => s.id === id);
    if (sig?.signed) {
      toast.error('Não é possível remover um signatário que já assinou');
      return;
    }

    setSaving(true);
    try {
      const updated = signatures.filter(s => s.id !== id);
      const { error } = await supabase
        .from('contracts')
        .update({ signatures: updated, updated_at: new Date().toISOString() })
        .eq('id', contract.id);

      if (error) throw error;
      setSignatures(updated);
      toast.success('Signatário removido');
      onUpdate();
    } catch (e) {
      toast.error('Erro ao remover signatário');
    } finally {
      setSaving(false);
    }
  };

  const handleSign = async () => {
    if (!currentUserSignature) {
      toast.error('O teu email não está na lista de signatários');
      return;
    }
    if (currentUserSignature.signed) {
      toast.error('Já assinaste este contrato');
      return;
    }

    setSigning(true);
    try {
      const hash = simpleHash(`${contract.id}|${contract.content || ''}|${user.email}|${Date.now()}`);
      const updated = signatures.map(s =>
        s.email === user.email
          ? { ...s, signed: true, signedAt: new Date().toISOString(), hash, signatureUrl: userSignature?.image_url || undefined }
          : s
      );

      const allNowSigned = updated.every(s => s.signed);
      const { error } = await supabase
        .from('contracts')
        .update({
          signatures: updated,
          status: allNowSigned ? 'approved' : contract.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', contract.id);

      if (error) throw error;

      setSignatures(updated);

      if (allNowSigned) {
        toast.success('Contrato totalmente assinado e aprovado!');
      } else {
        toast.success('Assinatura registada com sucesso!');
      }
      onUpdate();
    } catch (e) {
      toast.error('Erro ao registar assinatura');
    } finally {
      setSigning(false);
    }
  };

  if (!checkPlan(plan, 'pro', isAdmin)) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '16px 20px', background: 'rgba(107,114,128,0.06)',
        border: '1px solid #e2e5e9', borderRadius: 16,
        fontFamily: "'Poppins',sans-serif"
      }}>
        <PenLine size={20} color="#9ca3af" />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#0d1117' }}>
            Assinaturas Digitais
          </p>
          <p style={{ fontSize: 12, color: '#6b7280' }}>
            Disponível no plano Pro e Enterprise
          </p>
        </div>
        <Link
          to="/upgrade"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', fontSize: 12, fontWeight: 700,
            background: '#0d1117', border: 'none', color: '#fff',
            cursor: 'pointer', borderRadius: 10, textDecoration: 'none',
            fontFamily: "'Poppins',sans-serif"
          }}
        >
          <ArrowUpRight size={14} />
          Upgrade
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Status geral */}
      <div style={{
        background: allSigned
          ? 'linear-gradient(135deg, rgba(13,17,23,0.08), rgba(13,17,23,0.04))'
          : signatures.length === 0
          ? 'rgba(107,114,128,0.06)'
          : 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.04))',
        border: `1px solid ${allSigned ? 'rgba(13,17,23,0.3)' : signatures.length === 0 ? '#e2e5e9' : 'rgba(245,158,11,0.3)'}`,
        borderRadius: 16,
        padding: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 16
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: allSigned ? 'rgba(13,17,23,0.15)' : signatures.length === 0 ? '#f7f9fb' : 'rgba(245,158,11,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          {allSigned
            ? <CheckCircle2 size={24} color="#0d1117" />
            : signatures.length === 0
            ? <PenLine size={24} color="#9ca3af" />
            : <Clock size={24} color="#f59e0b" />
          }
        </div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#0d1117', fontFamily: "'Poppins',sans-serif", marginBottom: 2 }}>
            {allSigned
              ? 'Contrato totalmente assinado'
              : signatures.length === 0
              ? 'Sem signatários definidos'
              : `${signedCount} de ${signatures.length} assinatura${signatures.length > 1 ? 's' : ''}`
            }
          </p>
          <p style={{ fontSize: 12, color: '#6b7280', fontFamily: "'Poppins',sans-serif" }}>
            {allSigned
              ? 'Todas as partes assinaram este contrato'
              : signatures.length === 0
              ? 'Adiciona os signatários para iniciar o processo'
              : 'A aguardar assinaturas pendentes'
            }
          </p>
        </div>
        {/* Barra de progresso */}
        {signatures.length > 0 && (
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <p style={{ fontSize: 20, fontWeight: 800, color: allSigned ? '#0d1117' : '#f59e0b', fontFamily: "'Poppins',sans-serif" }}>
              {Math.round((signedCount / signatures.length) * 100)}%
            </p>
            <div style={{ width: 80, height: 4, background: '#e2e5e9', borderRadius: 4, marginTop: 4 }}>
              <div style={{
                width: `${(signedCount / signatures.length) * 100}%`,
                height: '100%',
                background: allSigned ? '#0d1117' : '#f59e0b',
                borderRadius: 4,
                transition: 'width .4s ease'
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Botão assinar — para o utilizador atual se for signatário */}
      {currentUserSignature && !currentUserSignature.signed && (
        <div style={{
          background: 'linear-gradient(135deg, #0d1117, #262626)',
          borderRadius: 16, padding: 20,
          display: 'flex', flexDirection: 'column', gap: 16
        }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: "'Poppins',sans-serif", marginBottom: 4 }}>
              A tua assinatura é necessária
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontFamily: "'Poppins',sans-serif" }}>
              Ao assinar, confirmas que leste e concordas com os termos deste contrato.
            </p>
          </div>

          {userSignature ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 10,
                padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12
              }}>
                <div style={{ width: 60, height: 40, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)' }}>
                  <img src={userSignature.image_url} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', margin: 0 }}>{userSignature.name}</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', margin: 0 }}>Assinatura digital</p>
                </div>
              </div>
              <button
                onClick={handleSign}
                disabled={signing}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 24px', fontSize: 14, fontWeight: 700,
                  background: '#fff', border: 'none', color: '#0d1117',
                  cursor: signing ? 'not-allowed' : 'pointer',
                  borderRadius: 12, transition: 'all .2s', flexShrink: 0,
                  opacity: signing ? 0.7 : 1, fontFamily: "'Poppins',sans-serif"
                }}
              >
                {signing ? <Loader2 size={16} className="animate-spin" /> : <PenLine size={16} />}
                {signing ? 'A assinar...' : 'Assinar Contrato'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: "'Poppins',sans-serif", flex: 1 }}>
                Ainda não tens uma assinatura digital registada.
              </p>
              <Link
                to="/signatures/register"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 24px', fontSize: 14, fontWeight: 700,
                  background: '#fff', border: 'none', color: '#0d1117',
                  cursor: 'pointer', borderRadius: 12, textDecoration: 'none',
                  fontFamily: "'Poppins',sans-serif"
                }}
              >
                <PenLine size={16} />
                Registar Assinatura
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Lista de signatários */}
      <div style={{
        background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(30px)',
        border: '1px solid rgba(255,255,255,0.35)', borderRadius: 20,
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)', overflow: 'hidden'
      }}>
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid #e2e5e9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0d1117', fontFamily: "'Poppins',sans-serif" }}>
            Signatários ({signatures.length})
          </h3>
          {isOwner && !allSigned && (
            <button
              onClick={() => setAddingSignatory(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', fontSize: 12, fontWeight: 600,
                background: '#0d1117', border: 'none', color: '#fff',
                cursor: 'pointer', borderRadius: 10, transition: 'all .2s',
                fontFamily: "'Poppins',sans-serif"
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#000000'}
              onMouseLeave={e => e.currentTarget.style.background = '#0d1117'}
            >
              <Plus size={14} />
              Adicionar Signatário
            </button>
          )}
        </div>

        {/* Form para adicionar signatário */}
        {addingSignatory && (
          <div style={{
            padding: '16px 24px', borderBottom: '1px solid #e2e5e9',
            background: 'rgba(13,17,23,0.04)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6, letterSpacing: 0.5, fontFamily: "'Poppins',sans-serif" }}>
                  NOME
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Nome completo"
                  style={{
                    width: '100%', padding: '10px 14px', fontSize: 13,
                    background: '#fff', border: '1.5px solid #e2e5e9',
                    outline: 'none', fontFamily: "'Poppins',sans-serif",
                    transition: 'border-color .2s'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#0d1117'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e2e5e9'}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6, letterSpacing: 0.5, fontFamily: "'Poppins',sans-serif" }}>
                  EMAIL
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  style={{
                    width: '100%', padding: '10px 14px', fontSize: 13,
                    background: '#fff', border: '1.5px solid #e2e5e9',
                    outline: 'none', fontFamily: "'Poppins',sans-serif",
                    transition: 'border-color .2s'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#0d1117'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e2e5e9'}
                  onKeyDown={e => e.key === 'Enter' && handleAddSignatory()}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleAddSignatory}
                  disabled={saving}
                  style={{
                    padding: '10px 16px', fontSize: 13, fontWeight: 600,
                    background: '#0d1117', border: 'none', color: '#fff',
                    cursor: saving ? 'not-allowed' : 'pointer', borderRadius: 8,
                    fontFamily: "'Poppins',sans-serif", opacity: saving ? 0.7 : 1
                  }}
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : 'Adicionar'}
                </button>
                <button
                  onClick={() => { setAddingSignatory(false); setNewName(''); setNewEmail(''); }}
                  style={{
                    padding: '10px 12px', fontSize: 13, fontWeight: 600,
                    background: '#fff', border: '1px solid #e2e5e9', color: '#6b7280',
                    cursor: 'pointer', borderRadius: 8, fontFamily: "'Poppins',sans-serif"
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista */}
        {signatures.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>
            <PenLine size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p style={{ fontSize: 14, fontFamily: "'Poppins',sans-serif" }}>
              Nenhum signatário adicionado
            </p>
            <p style={{ fontSize: 12, marginTop: 4, fontFamily: "'Poppins',sans-serif" }}>
              {isOwner ? 'Clica em "Adicionar Signatário" para começar' : 'O dono do contrato ainda não adicionou signatários'}
            </p>
          </div>
        ) : (
          <div>
            {signatures.map((sig, idx) => (
              <div
                key={sig.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '16px 24px',
                  borderBottom: idx < signatures.length - 1 ? '1px solid #f0f2f4' : 'none',
                  background: sig.signed ? 'rgba(13,17,23,0.02)' : '#fff'
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: sig.signed ? 'rgba(13,17,23,0.12)' : '#f7f9fb',
                  border: `2px solid ${sig.signed ? '#0d1117' : '#e2e5e9'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700,
                  color: sig.signed ? '#0d1117' : '#9ca3af',
                  fontFamily: "'Poppins',sans-serif"
                }}>
                  {sig.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0d1117', fontFamily: "'Poppins',sans-serif" }}>
                      {sig.name}
                    </p>
                    {sig.email === user.email && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px',
                        background: 'rgba(13,17,23,0.1)', color: '#0d1117',
                        borderRadius: 20, fontFamily: "'Poppins',sans-serif"
                      }}>
                        Tu
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 12, color: '#6b7280', fontFamily: "'Poppins',sans-serif", display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Mail size={11} />
                      {sig.email}
                    </span>
                    {sig.signed && sig.signedAt && (
                      <span style={{ fontSize: 11, color: '#0d1117', fontFamily: "'Poppins',sans-serif", display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={11} />
                        Assinado em {format(parseISO(sig.signedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    )}
                  </div>
                  {sig.signed && sig.signatureUrl && (
                    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 64, height: 32, borderRadius: 4, border: '1px solid #e2e5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
                        <img src={sig.signatureUrl} alt="Assinatura" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
                      </div>
                      {sig.hash && (
                        <span style={{ fontSize: 10, color: '#9ca3af', fontFamily: "'Poppins',sans-serif", display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Shield size={10} />
                          Hash: {sig.hash}
                        </span>
                      )}
                    </div>
                  )}
                  {sig.signed && !sig.signatureUrl && sig.hash && (
                    <p style={{ fontSize: 10, color: '#9ca3af', fontFamily: "'Poppins',sans-serif", marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Shield size={10} />
                      Hash: {sig.hash}
                    </p>
                  )}
                </div>

                {/* Status badge */}
                <span style={{
                  padding: '5px 12px', fontSize: 11, fontWeight: 700, borderRadius: 20, flexShrink: 0,
                  background: sig.signed ? 'rgba(13,17,23,0.1)' : 'rgba(245,158,11,0.1)',
                  color: sig.signed ? '#0d1117' : '#f59e0b',
                  fontFamily: "'Poppins',sans-serif",
                  display: 'flex', alignItems: 'center', gap: 5
                }}>
                  {sig.signed ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                  {sig.signed ? 'Assinado' : 'Pendente'}
                </span>

                {/* Ações (só owner, só não assinados) */}
                {isOwner && !sig.signed && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={async () => {
                        const sent = await sendNotificationEmail(
                          sig.email, sig.name, contract.title,
                          user.user_metadata?.name || user.email || 'Owner',
                          'reminder'
                        );
                        if (sent) toast.success('Lembrete enviado para ' + sig.email);
                        else toast.warning('Não foi possível enviar o email (SMTP não configurado)');
                      }}
                      title="Enviar lembrete"
                      style={{
                        width: 32, height: 32, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', background: 'transparent', border: 'none',
                        color: '#9ca3af', cursor: 'pointer', borderRadius: 8, transition: 'all .2s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(13,17,23,0.08)'; e.currentTarget.style.color = '#0d1117'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
                    >
                      <Mail size={14} />
                    </button>
                    <button
                      onClick={() => handleRemoveSignatory(sig.id)}
                      title="Remover signatário"
                      style={{
                        width: 32, height: 32, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', background: 'transparent', border: 'none',
                        color: '#9ca3af', cursor: 'pointer', borderRadius: 8, transition: 'all .2s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Aviso legal */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '12px 16px', background: 'rgba(107,114,128,0.06)',
        borderRadius: 12, border: '1px solid #e2e5e9'
      }}>
        <AlertCircle size={15} color="#9ca3af" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.6, fontFamily: "'Poppins',sans-serif" }}>
          As assinaturas digitais registadas nesta plataforma incluem identificação por email, timestamp e hash de integridade do documento. Para validade jurídica plena conforme a legislação angolana, recomenda-se complementar com certificado digital qualificado.
        </p>
      </div>
    </div>
  );
}
