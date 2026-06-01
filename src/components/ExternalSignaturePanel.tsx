import React, { useState, useEffect } from 'react';
import { getActiveProviders, getRequestsForContract, sendToProvider, SignatureProvider, SignatureRequest, Signer } from '../services/signatureProviders';
import { supabase } from '../lib/supabase';
import { Send, Loader2, ExternalLink, XCircle, RefreshCw, CheckCircle2, Clock, AlertCircle, Eye, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { logAudit, Actions } from '../services/auditLog';

interface Props {
  contractId: string;
  contract: any;
  user: any;
  onUpdate?: () => void;
}

const STATUS_UI: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pendente', color: '#6b7280', icon: Clock },
  sent: { label: 'Enviado', color: '#3b82f6', icon: Send },
  viewed: { label: 'Visualizado', color: '#f59e0b', icon: Eye },
  signed: { label: 'Concluído', color: '#10b981', icon: CheckCircle2 },
  declined: { label: 'Recusado', color: '#ef4444', icon: XCircle },
  error: { label: 'Erro', color: '#ef4444', icon: AlertCircle },
  voided: { label: 'Cancelado', color: '#9ca3af', icon: XCircle },
};

export default function ExternalSignaturePanel({ contractId, contract, user }: Props) {
  const [providers, setProviders] = useState<SignatureProvider[]>([]);
  const [requests, setRequests] = useState<SignatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [signers, setSigners] = useState<Signer[]>([]);

  useEffect(() => {
    const load = async () => {
      const [prov, reqs] = await Promise.all([
        getActiveProviders(),
        getRequestsForContract(contractId),
      ]);
      setProviders(prov);
      setRequests(reqs);
      if (prov.length > 0) setSelectedProvider(prov[0].name);
      setLoading(false);
    };
    load();
  }, [contractId]);

  const addSigner = () => {
    if (!signerName.trim() || !signerEmail.trim()) { toast.error('Nome e email obrigatórios'); return; }
    setSigners(prev => [...prev, { name: signerName.trim(), email: signerEmail.trim() }]);
    setSignerName('');
    setSignerEmail('');
  };

  const removeSigner = (idx: number) => setSigners(prev => prev.filter((_, i) => i !== idx));

  const handleSend = async () => {
    if (!selectedProvider) { toast.error('Selecciona um provedor'); return; }
    if (signers.length === 0) { toast.error('Adiciona pelo menos um signatário'); return; }
    setSending(true);
    try {
      const provider = providers.find(p => p.name === selectedProvider);
      if (!provider) throw new Error('Provider not found');

      const result = await sendToProvider(selectedProvider, contract, signers, provider.config);

      await supabase.from('signature_requests').insert({
        contract_id: contractId,
        provider_id: provider.id,
        provider_request_id: result.requestId,
        status: 'sent',
        signers: signers.map(s => ({ ...s, status: 'awaiting' })),
        created_by: user.id,
        envelope_url: result.envelopeUrl || null,
      });

      logAudit({
        user_id: user.id, user_name: user.user_metadata?.name, user_email: user.email,
        action: Actions.SIGNATURE_SEND, resource: 'contract', resource_id: contractId,
        resource_name: contract.title,
        details: { provider: selectedProvider, signers: signers.map(s => s.email) },
      });

      toast.success(`Pedido enviado via ${provider.label}`);
      const reqs = await getRequestsForContract(contractId);
      setRequests(reqs);
      setSigners([]);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar pedido');
    }
    setSending(false);
  };

  if (loading) return <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /></div>;

  return (
    <div>
      {/* Send new request */}
      {providers.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e2e5e9', marginBottom: 20 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f2f4', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Send size={16} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0d1117' }}>Enviar para Assinatura Externa</span>
          </div>
          <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Provedor</label>
              <select value={selectedProvider} onChange={e => setSelectedProvider(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', fontSize: 12, border: '1.5px solid #e2e5e9', outline: 'none', fontFamily: "'Poppins',sans-serif" }}>
                {providers.map(p => <option key={p.id} value={p.name}>{p.label}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Signatários</label>
              {signers.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ flex: 1, fontSize: 12, color: '#0d1117' }}>{s.name} ({s.email})</span>
                  <button onClick={() => removeSigner(i)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }}>
                    <XCircle size={14} />
                  </button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" value={signerName} onChange={e => setSignerName(e.target.value)}
                  placeholder="Nome" style={{ flex: 1, padding: '7px 10px', fontSize: 12, border: '1.5px solid #e2e5e9', outline: 'none' }}
                  onKeyDown={e => e.key === 'Enter' && addSigner()}
                />
                <input type="email" value={signerEmail} onChange={e => setSignerEmail(e.target.value)}
                  placeholder="Email" style={{ flex: 1, padding: '7px 10px', fontSize: 12, border: '1.5px solid #e2e5e9', outline: 'none' }}
                  onKeyDown={e => e.key === 'Enter' && addSigner()}
                />
                <button onClick={addSigner}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '7px 12px', background: '#f0f2f4', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  <UserPlus size={14} /> Adicionar
                </button>
              </div>
            </div>

            <button onClick={handleSend} disabled={sending || signers.length === 0}
              style={{
                width: '100%', padding: '9px 0', background: '#0d1117', color: '#fff',
                border: 'none', fontSize: 13, fontWeight: 600,
                cursor: (sending || signers.length === 0) ? 'not-allowed' : 'pointer',
                opacity: (sending || signers.length === 0) ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
              {sending ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
              {sending ? 'A enviar...' : `Enviar via ${providers.find(p => p.name === selectedProvider)?.label || '...'}`}
            </button>
          </div>
        </div>
      )}

      {/* Request history */}
      {requests.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e2e5e9' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f2f4', display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={16} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0d1117' }}>Histórico de Pedidos</span>
          </div>
          {requests.map(req => {
            const st = STATUS_UI[req.status] || STATUS_UI.pending;
            const Icon = st.icon;
            return (
              <div key={req.id} style={{ padding: '14px 20px', borderBottom: '1px solid #f0f2f4' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon size={14} color={st.color} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: st.color }}>{st.label}</span>
                    </div>
                    {req.envelope_url && (
                      <a href={req.envelope_url} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#3b82f6', marginTop: 4, textDecoration: 'underline' }}>
                        <ExternalLink size={12} /> Abrir envelope
                      </a>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>
                    {new Date(req.created_at).toLocaleDateString('pt-PT')}
                  </span>
                </div>
                {(req.signers as any[])?.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {(req.signers as any[]).map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6b7280' }}>
                        <span>{s.name}</span>
                        <span style={{ color: '#9ca3af' }}>— {s.email}</span>
                        <span style={{
                          padding: '1px 6px', fontSize: 10, fontWeight: 600,
                          background: s.status === 'signed' ? '#f0fdf4' : s.status === 'declined' ? '#fef2f2' : '#f3f4f6',
                          color: s.status === 'signed' ? '#16a34a' : s.status === 'declined' ? '#ef4444' : '#6b7280',
                        }}>
                          {s.status === 'signed' ? 'Assinou' : s.status === 'declined' ? 'Recusou' : 'Aguardando'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {req.error_message && (
                  <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{req.error_message}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!providers.length && requests.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
          Nenhum provedor de assinatura configurado. O administrador pode configurá-los em Definições.
        </div>
      )}
    </div>
  );
}
