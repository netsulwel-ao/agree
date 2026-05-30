import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
  MessageSquare, Plus, CheckCircle2, XCircle, Clock,
  UserPlus, Send, Loader2, Mail, UserCheck, Users, ArrowUpRight
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { sendCollaboratorInvite } from '../services/emailNotifications';
import { useAuth } from '../contexts/AuthContext';
import { checkPlan, getLimits, canUpgrade } from '../lib/plans';

interface Collaborator {
  user_id: string;
  email: string;
  name: string;
  status: 'pending' | 'accepted' | 'rejected';
  invited_at: string;
  responded_at?: string;
}

interface Message {
  id: string;
  created_at: string;
  user_id: string;
  user_name: string;
  message: string;
}

interface NegotiationRoomProps {
  contract: any;
  user: any;
  isOwner: boolean;
  onUpdate: () => void;
}

export default function NegotiationRoom({ contract, user, isOwner, onUpdate }: NegotiationRoomProps) {
  const { plan, isAdmin } = useAuth();
  const [collaborators, setCollaborators] = useState<Collaborator[]>(contract.collaborators || []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Carregar mensagens
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('negotiation_messages')
        .select('*')
        .eq('contract_id', contract.id)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    load();

    // Subscrição em tempo real
    const channel = supabase
      .channel(`negotiation_${contract.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'negotiation_messages',
        filter: `contract_id=eq.${contract.id}`,
      }, (payload: any) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [contract.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const myCollab = collaborators.find(c => c.user_id === user.id);
  const canAccept = myCollab && myCollab.status === 'pending';
  const hasAccepted = myCollab?.status === 'accepted';

  const handleInvite = async () => {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      toast.error('Preenche o nome e email');
      return;
    }
    if (collaborators.find(c => c.email === inviteEmail.trim().toLowerCase())) {
      toast.error('Este email já foi convidado');
      return;
    }
    const limits = getLimits(plan);
    if (collaborators.length >= limits.maxCollaboratorsPerContract) {
      toast.error('Limite de colaboradores atingido.');
      return;
    }
    setInviting(true);
    try {
      // Tenta encontrar o utilizador pelo email
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', inviteEmail.trim().toLowerCase())
        .maybeSingle();

      const newCollab: Collaborator = {
        user_id: profile?.id || '',
        email: inviteEmail.trim().toLowerCase(),
        name: inviteName.trim(),
        status: 'pending',
        invited_at: new Date().toISOString(),
      };
      const updated = [...collaborators, newCollab];
      const { error } = await supabase
        .from('contracts')
        .update({ collaborators: updated, updated_at: new Date().toISOString() })
        .eq('id', contract.id);
      if (error) throw error;
      setCollaborators(updated);
      setInviteName('');
      setInviteEmail('');
      setShowInvite(false);
      toast.success(`${newCollab.name} convidado para negociar`);
      const sent = await sendCollaboratorInvite(
        newCollab.email, newCollab.name, contract.title,
        user.user_metadata?.name || user.email || 'Owner',
        contract.id
      );
      if (!sent) toast.warning('Convite enviado, mas email não foi enviado (SMTP não configurado)');
      onUpdate();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao convidar');
    } finally {
      setInviting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setSendingMsg(true);
    try {
      const { error } = await supabase.from('negotiation_messages').insert({
        contract_id: contract.id,
        user_id: user.id,
        user_name: user.user_metadata?.name || user.email || 'Anónimo',
        message: newMessage.trim(),
      });
      if (error) throw error;
      setNewMessage('');
    } catch (e: any) {
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleAccept = async () => {
    try {
      const updated = collaborators.map(c =>
        c.email === user.email
          ? { ...c, status: 'accepted' as const, responded_at: new Date().toISOString() }
          : c
      );
      const { error } = await supabase
        .from('contracts')
        .update({ collaborators: updated, updated_at: new Date().toISOString() })
        .eq('id', contract.id);
      if (error) throw error;
      setCollaborators(updated);
      toast.success('Aceitaste os termos do contrato');
      onUpdate();
    } catch (e: any) {
      toast.error('Erro ao aceitar');
    }
  };

  const handleReject = async () => {
    try {
      const updated = collaborators.map(c =>
        c.email === user.email
          ? { ...c, status: 'rejected' as const, responded_at: new Date().toISOString() }
          : c
      );
      const { error } = await supabase
        .from('contracts')
        .update({ collaborators: updated, updated_at: new Date().toISOString() })
        .eq('id', contract.id);
      if (error) throw error;
      setCollaborators(updated);
      toast.success('Recusaste os termos do contrato');
      onUpdate();
    } catch (e: any) {
      toast.error('Erro ao recusar');
    }
  };

  if (!checkPlan(plan, 'pro', isAdmin)) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 60, gap: 20, fontFamily: "'Poppins',sans-serif", textAlign: 'center'
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(13,17,23,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <MessageSquare size={40} color="#9ca3af" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0d1117' }}>
          Negociação
        </h2>
        <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 400 }}>
          Negociação disponível apenas nos planos Pro e Enterprise.
        </p>
        <button onClick={() => window.location.href = '/upgrade'} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '12px 24px', fontSize: 14, fontWeight: 700,
          background: '#0d1117', border: 'none', color: '#fff',
          cursor: 'pointer', borderRadius: 12, fontFamily: "'Poppins',sans-serif"
        }}>
          <ArrowUpRight size={16} />
          Fazer Upgrade
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: "'Poppins',sans-serif" }}>
      {/* Status da negociação */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '16px 24px',
        background: hasAccepted ? 'rgba(13,17,23,0.06)' : 'rgba(245,158,11,0.08)',
        border: `1px solid ${hasAccepted ? 'rgba(13,17,23,0.2)' : 'rgba(245,158,11,0.3)'}`,
        borderRadius: 16
      }}>
        {hasAccepted
          ? <CheckCircle2 size={20} color="#0d1117" />
          : <MessageSquare size={20} color="#f59e0b" />
        }
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0d1117' }}>
            {hasAccepted ? 'Já aceitaste os termos deste contrato' : 'Sala de Negociação'}
          </p>
          <p style={{ fontSize: 12, color: '#6b7280' }}>
            {hasAccepted
              ? 'A aguardar que as outras partes também aceitem'
              : 'Comenta, sugere alterações e aceita ou recusa os termos'
            }
          </p>
        </div>
        {canAccept && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleAccept} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', fontSize: 12, fontWeight: 700,
              background: '#16a34a', border: 'none', color: '#fff',
              cursor: 'pointer', borderRadius: 8, fontFamily: "'Poppins',sans-serif"
            }}>
              <CheckCircle2 size={14} />
              Aceitar
            </button>
            <button onClick={handleReject} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', fontSize: 12, fontWeight: 700,
              background: '#ef4444', border: 'none', color: '#fff',
              cursor: 'pointer', borderRadius: 8, fontFamily: "'Poppins',sans-serif"
            }}>
              <XCircle size={14} />
              Recusar
            </button>
          </div>
        )}
      </div>

      {/* Convidados / Colaboradores */}
      <div style={{
        background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(30px)',
        border: '1px solid rgba(255,255,255,0.35)', borderRadius: 20,
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)', overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid #e2e5e9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0d1117', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={16} />
            Participantes ({collaborators.length + 1})
          </h3>
          {isOwner && (
            <button onClick={() => setShowInvite(true)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', fontSize: 12, fontWeight: 600,
              background: '#0d1117', border: 'none', color: '#fff',
              cursor: 'pointer', borderRadius: 8, fontFamily: "'Poppins',sans-serif"
            }}>
              <UserPlus size={14} />
              Convidar
            </button>
          )}
        </div>

        {showInvite && (
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e5e9', background: 'rgba(13,17,23,0.04)' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4, fontFamily: "'Poppins',sans-serif" }}>NOME</label>
                <input type="text" value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Nome completo"
                  style={{ width: '100%', padding: '8px 12px', fontSize: 13, background: '#fff', border: '1.5px solid #e2e5e9', outline: 'none', fontFamily: "'Poppins',sans-serif" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4, fontFamily: "'Poppins',sans-serif" }}>EMAIL</label>
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@exemplo.com"
                  style={{ width: '100%', padding: '8px 12px', fontSize: 13, background: '#fff', border: '1.5px solid #e2e5e9', outline: 'none', fontFamily: "'Poppins',sans-serif" }} />
              </div>
              <button onClick={handleInvite} disabled={inviting} style={{
                padding: '8px 16px', fontSize: 13, fontWeight: 600,
                background: '#0d1117', border: 'none', color: '#fff',
                cursor: inviting ? 'not-allowed' : 'pointer', borderRadius: 8,
                opacity: inviting ? 0.7 : 1, fontFamily: "'Poppins',sans-serif",
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {inviting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Convidar
              </button>
              <button onClick={() => setShowInvite(false)} style={{
                padding: '8px 12px', fontSize: 13, fontWeight: 600,
                background: '#fff', border: '1px solid #e2e5e9', color: '#6b7280',
                cursor: 'pointer', borderRadius: 8, fontFamily: "'Poppins',sans-serif"
              }}>Cancelar</button>
            </div>
          </div>
        )}

        <div style={{ padding: '16px 24px' }}>
          {/* Owner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, padding: '8px 12px', background: 'rgba(13,17,23,0.04)', borderRadius: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>
              {(user.user_metadata?.name || user.email || 'D').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0d1117' }}>
                {user.user_metadata?.name || user.email || 'Dono'}
                <span style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', marginLeft: 8, padding: '2px 6px', background: '#f0f0f0', borderRadius: 4 }}>Dono</span>
              </p>
              <p style={{ fontSize: 11, color: '#6b7280' }}>{user.email}</p>
            </div>
          </div>
          {/* Collaborators */}
          {collaborators.map((c, idx) => (
            <div key={c.email} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, padding: '8px 12px', borderRadius: 10, background: idx % 2 === 0 ? '#fff' : 'transparent' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: c.status === 'accepted' ? 'rgba(13,17,23,0.12)' : c.status === 'rejected' ? 'rgba(239,68,68,0.12)' : '#f7f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: c.status === 'accepted' ? '#0d1117' : c.status === 'rejected' ? '#ef4444' : '#9ca3af' }}>
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0d1117' }}>
                  {c.name}
                  {c.email === user.email && <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 6 }}>(Tu)</span>}
                </p>
                <p style={{ fontSize: 11, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Mail size={10} /> {c.email}
                </p>
              </div>
              <span style={{
                padding: '3px 10px', fontSize: 10, fontWeight: 700, borderRadius: 20,
                background: c.status === 'accepted' ? 'rgba(13,17,23,0.1)' : c.status === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                color: c.status === 'accepted' ? '#0d1117' : c.status === 'rejected' ? '#ef4444' : '#f59e0b',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                {c.status === 'accepted' ? <UserCheck size={10} /> : c.status === 'rejected' ? <XCircle size={10} /> : <Clock size={10} />}
                {c.status === 'accepted' ? 'Aceite' : c.status === 'rejected' ? 'Recusado' : 'Pendente'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sala de chat */}
      <div style={{
        background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(30px)',
        border: '1px solid rgba(255,255,255,0.35)', borderRadius: 20,
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e5e9' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0d1117', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={16} />
            Discussão ({messages.length})
          </h3>
        </div>

        <div style={{ maxHeight: 400, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>
              <MessageSquare size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p style={{ fontSize: 13 }}>Nenhuma mensagem ainda. Inicia a discussão!</p>
            </div>
          ) : (
            messages.map(msg => {
              const isMe = msg.user_id === user.id;
              return (
                <div key={msg.id} style={{
                  display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start',
                }}>
                  <div style={{
                    maxWidth: '80%', padding: '10px 16px', borderRadius: 14,
                    background: isMe ? '#0d1117' : '#f0f0f0',
                    color: isMe ? '#fff' : '#0d1117',
                    fontSize: 13, lineHeight: 1.5
                  }}>
                    <p style={{ fontWeight: 600, fontSize: 11, marginBottom: 4, opacity: 0.7 }}>
                      {isMe ? 'Tu' : msg.user_name}
                    </p>
                    {msg.message}
                  </div>
                  <span style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>
                    {format(parseISO(msg.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '12px 24px', borderTop: '1px solid #e2e5e9', display: 'flex', gap: 12 }}>
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Escreve uma mensagem..."
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            style={{
              flex: 1, padding: '10px 16px', fontSize: 13,
              background: '#fff', border: '1.5px solid #e2e5e9', outline: 'none',
              fontFamily: "'Poppins',sans-serif", borderRadius: 10
            }}
          />
          <button onClick={handleSendMessage} disabled={sendingMsg || !newMessage.trim()} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 18px', fontSize: 13, fontWeight: 600,
            background: '#0d1117', border: 'none', color: '#fff',
            cursor: (sendingMsg || !newMessage.trim()) ? 'not-allowed' : 'pointer',
            borderRadius: 10, opacity: (sendingMsg || !newMessage.trim()) ? 0.6 : 1,
            fontFamily: "'Poppins',sans-serif"
          }}>
            {sendingMsg ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
