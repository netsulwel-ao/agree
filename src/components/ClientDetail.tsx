import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useClient } from '../hooks/useClients';
import { useAuth } from '../contexts/AuthContext';
import { checkPlan } from '../lib/plans';
import { supabase } from '../lib/supabase';
import { ArrowLeft, FileEdit, Trash2, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, plan, isAdmin, trialEndsAt } = useAuth();
  const { data: client, isLoading, refetch } = useClient(id);

  const canUseTags = checkPlan(plan, 'pro', isAdmin, trialEndsAt);
  const canUseCategory = checkPlan(plan, 'pro', isAdmin, trialEndsAt);
  const canUseContractHistory = checkPlan(plan, 'pro', isAdmin, trialEndsAt);
  const canUseCustomFields = checkPlan(plan, 'enterprise', isAdmin, trialEndsAt);

  const [contracts, setContracts] = useState<any[]>([]);

  useEffect(() => {
    if (client && canUseContractHistory) {
      supabase
        .from('contracts')
        .select('id, title, status, value, created_at, end_date')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => { if (data) setContracts(data); });
    }
  }, [client, canUseContractHistory]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80, fontFamily: "'Poppins',sans-serif" }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#6b7280' }} />
      </div>
    );
  }

  if (!client) {
    return (
      <div style={{ textAlign: 'center', padding: 80, fontFamily: "'Poppins',sans-serif" }}>
        <p style={{ color: '#6b7280' }}>Cliente não encontrado</p>
        <button onClick={() => navigate('/clients')} style={{
          marginTop: 12, padding: '8px 16px', fontSize: 13, fontWeight: 600,
          background: '#0d1117', color: '#fff', border: 'none', cursor: 'pointer',
          fontFamily: "'Poppins',sans-serif",
        }}>Voltar</button>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Poppins',sans-serif" }}>
      <style>{`@keyframes spin{100%{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => navigate('/clients')}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 40, height: 40, background: '#fff', border: '1.5px solid #e2e5e9',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={18} color="#0d1117" />
          </button>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0d1117', marginBottom: 4 }}>
              {client.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{
                padding: '4px 12px', fontSize: 12, fontWeight: 600,
                background: client.status === 'active' ? 'rgba(13,17,23,0.1)' :
                             client.status === 'lead' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                color: client.status === 'active' ? '#0d1117' :
                       client.status === 'lead' ? '#f59e0b' : '#ef4444',
              }}>
                {client.status === 'active' ? 'Activo' :
                 client.status === 'lead' ? 'Lead' : 'Inactivo'}
              </span>
              {canUseCategory && client.category && (
                <span style={{ fontSize: 12, color: '#6b7280' }}>
                  {client.category}
                </span>
              )}
              {(client.tags?.length ?? 0) > 0 && canUseTags && client.tags!.map(t => (
                <span key={t} style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 10px',
                  background: '#f3f4f6', color: '#6b7280', borderRadius: 20,
                }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate(`/clients/${client.id}/edit`)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 18px', fontSize: 13, fontWeight: 600,
              background: '#fff', border: '1.5px solid #e2e5e9',
              color: '#6b7280', cursor: 'pointer',
              fontFamily: "'Poppins',sans-serif",
            }}
          >
            <FileEdit size={16} /> Editar
          </button>
          <button
            onClick={async () => {
              if (!window.confirm('Tens a certeza que pretendes eliminar este cliente?')) return;
              const { error } = await supabase.from('clients').delete().eq('id', client.id);
              if (error) { toast.error('Erro ao eliminar cliente'); return; }
              toast.success('Cliente eliminado');
              navigate('/clients');
            }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 18px', fontSize: 13, fontWeight: 600,
              background: '#fff', border: '1.5px solid #e2e5e9',
              color: '#ef4444', cursor: 'pointer',
              fontFamily: "'Poppins',sans-serif",
            }}
          >
            <Trash2 size={16} /> Eliminar
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: canUseContractHistory ? '1fr 1fr' : '1fr', gap: 24 }}>
        {/* Info Card */}
        <div style={{
          background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.5)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)', padding: 28,
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0d1117', marginBottom: 20 }}>
            Informações do Cliente
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Email', value: client.email },
              { label: 'Telefone', value: client.phone },
              { label: 'Criado em', value: client.created_at ? format(parseISO(client.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : '-' },
              { label: 'Actualizado em', value: client.updated_at ? format(parseISO(client.updated_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : '-' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', gap: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', minWidth: 120 }}>{item.label}</span>
                <span style={{ fontSize: 13, color: '#0d1117' }}>{item.value || '-'}</span>
              </div>
            ))}
          </div>
          {client.notes && (
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #e2e5e9' }}>
              <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>Notas</span>
              <p style={{ fontSize: 13, color: '#0d1117', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{client.notes}</p>
            </div>
          )}
          {canUseCustomFields && client.custom_fields && Object.keys(client.custom_fields).length > 0 && (
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #e2e5e9' }}>
              <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>
                Campos Personalizados
              </span>
              {Object.entries(client.custom_fields).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', minWidth: 120 }}>{key}</span>
                  <span style={{ fontSize: 13, color: '#0d1117' }}>{String(val)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contract History - Pro */}
        {canUseContractHistory && (
          <div style={{
            background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.5)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)', padding: 28,
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0d1117', marginBottom: 20 }}>
              Histórico de Contratos
            </h3>
            {contracts.length === 0 ? (
              <p style={{ fontSize: 13, color: '#6b7280' }}>
                Nenhum contrato associado a este cliente
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {contracts.map((c: any) => (
                  <div
                    key={c.id}
                    onClick={() => navigate(`/contracts/${c.id}`)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 16px', background: '#fff', border: '1px solid #e2e5e9',
                      cursor: 'pointer', transition: 'all .15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f7f9fb'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
                  >
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0d1117' }}>{c.title}</span>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                        {c.created_at && format(parseISO(c.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        {c.value ? ` · ${new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(c.value)}` : ''}
                      </div>
                    </div>
                    <span style={{
                      padding: '3px 10px', fontSize: 11, fontWeight: 600,
                      background: c.status === 'approved' ? 'rgba(13,17,23,0.1)' :
                                   c.status === 'pending' ? 'rgba(245,158,11,0.1)' : '#f7f9fb',
                      color: c.status === 'approved' ? '#0d1117' :
                             c.status === 'pending' ? '#f59e0b' : '#6b7280',
                    }}>
                      {c.status === 'approved' ? 'Assinado' :
                       c.status === 'pending' ? 'Aprovação' :
                       c.status === 'rejected' ? 'Rejeitado' : 'Rascunho'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
