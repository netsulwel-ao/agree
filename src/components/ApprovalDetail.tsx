import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApprovalRequestDetail, useApproveAction, useRejectAction, useUsers } from '../hooks/useApprovalWorkflows';
import {
  Loader2, CheckCircle2, XCircle, Clock, ArrowLeft, FileText,
  Shield, Check, X, MessageSquare, User, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: 'Pendente', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Clock },
  in_progress: { label: 'Em Curso', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: Clock },
  approved: { label: 'Aprovado', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: CheckCircle2 },
  rejected: { label: 'Rejeitado', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: XCircle },
};

export default function ApprovalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: detail, isLoading } = useApprovalRequestDetail(id);
  const { data: users = [] } = useUsers();
  const approveAction = useApproveAction();
  const rejectAction = useRejectAction();
  const [comment, setComment] = useState('');
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  const handleApprove = async () => {
    if (!detail || !detail.current_step_id) return;
    try {
      await approveAction.mutateAsync({
        request_id: detail.id,
        step_id: detail.current_step_id,
        comment: comment || undefined,
      });
      toast.success('Aprovado com sucesso!');
    } catch {
      toast.error('Erro ao aprovar');
    }
  };

  const handleReject = async () => {
    if (!detail) return;
    try {
      await rejectAction.mutateAsync({ request_id: detail.id, comment: comment || undefined });
      toast.success('Pedido rejeitado');
      setShowRejectConfirm(false);
    } catch {
      toast.error('Erro ao rejeitar');
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, color: '#9ca3af', gap: 10, fontFamily: "'Poppins',sans-serif" }}>
        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
        A carregar...
      </div>
    );
  }

  if (!detail) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af', fontFamily: "'Poppins',sans-serif" }}>
        <p style={{ fontSize: 15 }}>Pedido não encontrado</p>
        <Link to="/approvals" style={{ color: '#0d1117', fontSize: 13 }}>Voltar à lista</Link>
      </div>
    );
  }

  const cfg = statusConfig[detail.status];
  const StatusIcon = cfg.icon;
  const wf = detail.workflow as any;
  const steps = (wf?.steps || []).sort((a: any, b: any) => a.step_order - b.step_order);
  const approvals = detail.approvals || [];

  const containerStyle: React.CSSProperties = {
    fontFamily: "'Poppins', sans-serif", maxWidth: 1000, margin: '0 auto',
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(30px)',
    border: '1px solid rgba(255,255,255,0.35)', borderRadius: 24,
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)', overflow: 'hidden',
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Header */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid #e2e5e9' }}>
          <button onClick={() => navigate('/approvals')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 13, fontWeight: 600, marginBottom: 12 }}
          >
            <ArrowLeft size={16} /> Voltar
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0d1117' }}>
                  {detail.contract?.title || 'Contrato sem título'}
                </h2>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', background: cfg.bg, color: cfg.color, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <StatusIcon size={14} />
                  {cfg.label}
                </span>
              </div>
              <p style={{ fontSize: 13, color: '#6b7280' }}>
                Workflow: {wf?.name || '—'} · Contrato: {detail.contract?.id?.slice(0, 8)}
              </p>
            </div>
            {detail.contract?.value > 0 && (
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#0d1117' }}>
                  {Number(detail.contract.value).toLocaleString()} Kz
                </span>
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: 24 }}>
          {/* Steps timeline */}
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0d1117', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={18} /> Passos de Aprovação
          </h3>
          <div style={{ position: 'relative', paddingLeft: 32, marginBottom: 32 }}>
            {/* Vertical line */}
            <div style={{
              position: 'absolute', left: 15, top: 8, bottom: 8, width: 2,
              background: 'rgba(13,17,23,0.08)'
            }} />

            {steps.map((step: any, idx: number) => {
              const isCurrent = step.id === detail.current_step_id;
              const stepApprovals = approvals.filter((a: any) => a.step_id === step.id);
              const isComplete = (step.approvers?.length || 0) > 0 &&
                stepApprovals.filter((a: any) => a.status === 'approved').length >= (step.required_approvers || 1);
              const isRejected = stepApprovals.some((a: any) => a.status === 'rejected');
              const circleBg = isCurrent ? '#3b82f6' : isRejected ? '#ef4444' : isComplete ? '#10b981' : '#e2e5e9';
              const circleColor = isCurrent || isComplete || isRejected ? '#fff' : '#9ca3af';

              return (
                <div key={step.id} style={{ position: 'relative', marginBottom: 20 }}>
                  <div style={{
                    position: 'absolute', left: -23, top: 4,
                    width: 24, height: 24, borderRadius: '50%',
                    background: circleBg, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 1
                  }}>
                    {isComplete ? <CheckCircle2 size={14} color={circleColor} /> :
                     isRejected ? <XCircle size={14} color={circleColor} /> :
                     <div style={{ width: 8, height: 8, borderRadius: '50%', background: circleColor }} />}
                  </div>

                  <div style={{
                    padding: 16, borderRadius: 12,
                    background: isCurrent ? 'rgba(59,130,246,0.06)' : '#fafafa',
                    border: isCurrent ? '1.5px solid #3b82f6' : '1px solid #e2e5e9'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0d1117' }}>
                          Passo {idx + 1}: {step.name}
                        </span>
                        {isCurrent && (
                          <span style={{ fontSize: 10, fontWeight: 600, marginLeft: 8, padding: '2px 6px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                            Actual
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 11, color: '#6b7280' }}>
                        {step.required_approvers} aprovador(es) necessário(s)
                      </span>
                    </div>

                    {/* Step rules */}
                    {(step.min_value != null || step.max_value != null || step.min_risk_level || step.max_risk_level) && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                        {step.min_value != null && <Tag label={`Valor ≥ ${Number(step.min_value).toLocaleString()} Kz`} color="#3b82f6" />}
                        {step.max_value != null && <Tag label={`Valor ≤ ${Number(step.max_value).toLocaleString()} Kz`} color="#8b5cf6" />}
                        {step.min_risk_level && <Tag label={`Risco ≥ ${step.min_risk_level}`} color="#f59e0b" />}
                        {step.max_risk_level && <Tag label={`Risco ≤ ${step.max_risk_level}`} color="#10b981" />}
                      </div>
                    )}

                    {/* Approvers status */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {(step.approvers || []).length === 0 ? (
                        <span style={{ fontSize: 12, color: '#9ca3af' }}>Nenhum aprovador configurado</span>
                      ) : (step.approvers || []).map((app: any) => {
                        const approval = stepApprovals.find((a: any) => a.user_id === app.user_id);
                        const u = users.find((x: any) => x.id === app.user_id);
                        const isPendingApproval = !approval;
                        const isApproved = approval?.status === 'approved';
                        const isRejected = approval?.status === 'rejected';

                        return (
                          <div key={app.id} style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            fontSize: 12, padding: '4px 0'
                          }}>
                            <div style={{
                              width: 24, height: 24, borderRadius: '50%',
                              background: isApproved ? 'rgba(16,185,129,0.15)' : isRejected ? 'rgba(239,68,68,0.15)' : 'rgba(156,163,175,0.1)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              {isApproved ? <ThumbsUp size={12} color="#10b981" /> :
                               isRejected ? <ThumbsDown size={12} color="#ef4444" /> :
                               <User size={12} color="#9ca3af" />}
                            </div>
                            <span style={{ color: '#0d1117', fontWeight: 500 }}>
                              {u?.name || u?.email || app.user_id?.slice(0, 8)}
                            </span>
                            {isPendingApproval && <span style={{ color: '#f59e0b', fontWeight: 500 }}>Pendente</span>}
                            {isApproved && <span style={{ color: '#10b981', fontWeight: 500 }}>Aprovado</span>}
                            {isRejected && <span style={{ color: '#ef4444', fontWeight: 500 }}>Rejeitado</span>}
                            {approval?.comment && (
                              <span style={{ color: '#6b7280', fontStyle: 'italic' }}>— "{approval.comment}"</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action area */}
          {detail.status === 'in_progress' && detail.current_step_id && (
            <div style={{
              padding: 24, borderRadius: 16,
              background: 'rgba(13,17,23,0.03)', border: '1px solid #e2e5e9'
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0d1117', marginBottom: 12 }}>
                Aprovar ou Rejeitar
              </h3>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Comentário (opcional)</label>
                <textarea
                  value={comment} onChange={e => setComment(e.target.value)}
                  placeholder="Adiciona um comentário à tua decisão..."
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid #e2e5e9',
                    outline: 'none', fontFamily: "'Poppins',sans-serif", color: '#0d1117', resize: 'vertical'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#0d1117'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e2e5e9'}
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleApprove} disabled={approveAction.isPending}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '10px 24px', background: '#10b981', color: '#fff',
                    border: 'none', fontSize: 14, fontWeight: 600, cursor: approveAction.isPending ? 'not-allowed' : 'pointer',
                    opacity: approveAction.isPending ? 0.6 : 1
                  }}
                >
                  {approveAction.isPending ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} />}
                  Aprovar
                </button>
                {!showRejectConfirm ? (
                  <button onClick={() => setShowRejectConfirm(true)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '10px 24px', background: '#ef4444', color: '#fff',
                      border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    <X size={16} />
                    Rejeitar
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: '#ef4444', fontWeight: 600 }}>Tens a certeza?</span>
                    <button onClick={handleReject} disabled={rejectAction.isPending}
                      style={{
                        padding: '10px 20px', background: '#ef4444', color: '#fff',
                        border: 'none', fontSize: 13, fontWeight: 600, cursor: rejectAction.isPending ? 'not-allowed' : 'pointer',
                        opacity: rejectAction.isPending ? 0.6 : 1
                      }}
                    >
                      {rejectAction.isPending ? 'A rejeitar...' : 'Sim, Rejeitar'}
                    </button>
                    <button onClick={() => setShowRejectConfirm(false)}
                      style={{ padding: '10px 16px', background: '#fff', border: '1px solid #e2e5e9', fontSize: 13, cursor: 'pointer', color: '#6b7280' }}
                    >Cancelar</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contract link */}
          {detail.contract_id && (
            <div style={{ marginTop: 20 }}>
              <Link to={`/contracts/${detail.contract_id}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', background: '#0d1117', color: '#fff',
                  textDecoration: 'none', fontSize: 13, fontWeight: 600
                }}
              >
                <FileText size={16} />
                Ver Contrato
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '2px 8px',
      background: `${color}15`, color, display: 'inline-flex', alignItems: 'center', gap: 4
    }}>
      {label}
    </span>
  );
}
