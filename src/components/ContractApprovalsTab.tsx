import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useApprovalWorkflows, useCreateApprovalRequest } from '../hooks/useApprovalWorkflows';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Loader2, Shield, CheckCircle2, XCircle, Clock, Send,
  ArrowRight, User, ThumbsUp, ThumbsDown, BookTemplate
} from 'lucide-react';

interface ApprovalRequest {
  id: string;
  status: string;
  created_at: string;
  current_step_order: number | null;
  workflow: { name: string } | null;
}

interface Props {
  contractId: string;
  contract: any;
  user: any;
}

export default function ContractApprovalsTab({ contractId, contract, user }: Props) {
  const { data: workflows = [] } = useApprovalWorkflows();
  const createRequest = useCreateApprovalRequest();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWf, setSelectedWf] = useState('');

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('approval_requests')
        .select('id, status, created_at, current_step_order, workflow:approval_workflows(name)')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false });
      if (data) setRequests(data as any);
      setLoading(false);
    };
    fetch();
  }, [contractId]);

  const handleSubmitWorkflow = async () => {
    if (!selectedWf) { toast.error('Selecciona um workflow'); return; }
    try {
      await createRequest.mutateAsync({ contract_id: contractId, workflow_id: selectedWf });
      toast.success('Submetido para aprovação!');
      setSelectedWf('');
      const { data } = await supabase
        .from('approval_requests')
        .select('id, status, created_at, current_step_order, workflow:approval_workflows(name)')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false });
      if (data) setRequests(data as any);
    } catch {
      toast.error('Erro ao submeter');
    }
  };

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pendente', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    in_progress: { label: 'Em Curso', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    approved: { label: 'Aprovado', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    rejected: { label: 'Rejeitado', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, color: '#9ca3af', gap: 10 }}>
        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
        A carregar...
      </div>
    );
  }

  const activeRequest = requests.find(r => r.status === 'pending' || r.status === 'in_progress');

  return (
    <div style={{ fontFamily: "'Poppins',sans-serif" }}>
      {/* Submit to workflow */}
      {contract.owner_id === user?.id && contract.status === 'draft' && !activeRequest && (
        <div style={{
          padding: 20, marginBottom: 20,
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Send size={18} color="#f59e0b" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>Submeter para Workflow de Aprovação</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <select
              value={selectedWf}
              onChange={e => setSelectedWf(e.target.value)}
              style={{
                flex: 1, padding: '10px 14px', fontSize: 13, border: '1.5px solid #e2e5e9',
                outline: 'none', fontFamily: "'Poppins',sans-serif", background: '#fff', color: '#0d1117'
              }}
            >
              <option value="">Seleccionar workflow...</option>
              {workflows.map(wf => (
                <option key={wf.id} value={wf.id}>{wf.name}</option>
              ))}
            </select>
            <button onClick={handleSubmitWorkflow} disabled={createRequest.isPending}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '10px 20px', background: '#0d1117', color: '#fff',
                border: 'none', fontSize: 13, fontWeight: 600, cursor: createRequest.isPending ? 'not-allowed' : 'pointer',
                opacity: createRequest.isPending ? 0.6 : 1, whiteSpace: 'nowrap'
              }}
            >
              {createRequest.isPending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
              Submeter
            </button>
          </div>
          {workflows.length === 0 && (
            <p style={{ fontSize: 12, color: '#92400e', marginTop: 8 }}>
              Nenhum workflow ativo disponível. Contacta o administrador.
            </p>
          )}
        </div>
      )}

      {/* Existing requests list */}
      {requests.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0d1117', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={18} /> Pedidos de Aprovação
          </h3>
          {requests.map(req => {
            const cfg = statusConfig[req.status] || statusConfig.pending;
            return (
              <Link key={req.id} to={`/approvals/${req.id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                  background: '#fff', border: '1px solid #e2e5e9', textDecoration: 'none',
                  transition: 'all .15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#0d1117'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e5e9'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 8, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color }}>
                  {req.status === 'approved' ? <CheckCircle2 size={18} /> :
                   req.status === 'rejected' ? <XCircle size={18} /> :
                   <Clock size={18} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0d1117' }}>
                      {req.workflow?.name || 'Workflow'}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', background: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                    {new Date(req.created_at).toLocaleDateString('pt-PT')}
                    {req.current_step_order != null && ` · Passo ${req.current_step_order + 1}`}
                  </p>
                </div>
                <ArrowRight size={16} color="#9ca3af" />
              </Link>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
          <Shield size={40} style={{ marginBottom: 8, opacity: 0.3 }} />
          <p style={{ fontSize: 14 }}>Nenhum pedido de aprovação</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>
            {contract.status === 'draft'
              ? 'Submete o contrato para um workflow de aprovação'
              : 'Este contrato não passou por um workflow de aprovação'}
          </p>
        </div>
      )}
    </div>
  );
}
