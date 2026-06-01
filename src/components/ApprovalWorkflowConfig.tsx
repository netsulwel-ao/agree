import React, { useState } from 'react';
import {
  useApprovalWorkflows, useCreateWorkflow, useUpdateWorkflow, useDeleteWorkflow,
  useCreateStep, useUpdateStep, useDeleteStep,
  useAddApprover, useRemoveApprover, useUsers,
  type ApprovalWorkflow, type WorkflowStep,
} from '../hooks/useApprovalWorkflows';
import {
  Plus, X, Trash2, Edit3, Loader2, Check, Save, GripVertical,
  Shield, UserPlus, UserMinus, ToggleLeft, ToggleRight
} from 'lucide-react';
import { toast } from 'sonner';

const riskLevels = ['low', 'medium', 'high'];

export default function ApprovalWorkflowConfig() {
  const { data: workflows = [], isLoading } = useApprovalWorkflows(true);
  const createWorkflow = useCreateWorkflow();
  const updateWorkflow = useUpdateWorkflow();
  const deleteWorkflow = useDeleteWorkflow();
  const createStep = useCreateStep();
  const updateStep = useUpdateStep();
  const deleteStep = useDeleteStep();
  const addApprover = useAddApprover();
  const removeApprover = useRemoveApprover();
  const { data: users = [] } = useUsers();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingWf, setEditingWf] = useState<string | null>(null);
  const [wfName, setWfName] = useState('');
  const [wfDesc, setWfDesc] = useState('');
  const [showNewStep, setShowNewStep] = useState<string | null>(null);
  const [editingStep, setEditingStep] = useState<string | null>(null);
  const [stepForm, setStepForm] = useState({
    name: '', step_order: 0, min_value: '', max_value: '',
    min_risk_level: '', max_risk_level: '', required_approvers: 1,
  });
  const [addingApprover, setAddingApprover] = useState<{ stepId: string; wfId: string } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newWfName, setNewWfName] = useState('');
  const [newWfDesc, setNewWfDesc] = useState('');

  const containerStyle: React.CSSProperties = {
    fontFamily: "'Poppins', sans-serif", maxWidth: 1200, margin: '0 auto',
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(30px)',
    border: '1px solid rgba(255,255,255,0.35)', borderRadius: 24,
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)', overflow: 'hidden',
  };

  const handleCreateWorkflow = async () => {
    if (!newWfName.trim()) return;
    try {
      await createWorkflow.mutateAsync({ name: newWfName.trim(), description: newWfDesc.trim() });
      toast.success('Workflow criado');
      setNewWfName('');
      setNewWfDesc('');
      setShowCreate(false);
    } catch { toast.error('Erro ao criar workflow'); }
  };

  const handleSaveWf = async (id: string) => {
    try {
      await updateWorkflow.mutateAsync({ id, name: wfName.trim(), description: wfDesc.trim() });
      setEditingWf(null);
      toast.success('Workflow actualizado');
    } catch { toast.error('Erro ao actualizar workflow'); }
  };

  const handleToggleActive = async (wf: ApprovalWorkflow) => {
    try {
      await updateWorkflow.mutateAsync({ id: wf.id, is_active: !wf.is_active });
    } catch { toast.error('Erro ao alterar estado'); }
  };

  const handleDeleteWf = async (id: string, name: string) => {
    if (!window.confirm(`Eliminar workflow "${name}" e todos os seus passos?`)) return;
    try {
      await deleteWorkflow.mutateAsync(id);
      toast.success('Workflow eliminado');
      if (expanded === id) setExpanded(null);
    } catch { toast.error('Erro ao eliminar workflow'); }
  };

  const resetStepForm = (order: number) => {
    setStepForm({
      name: '', step_order: order, min_value: '', max_value: '',
      min_risk_level: '', max_risk_level: '', required_approvers: 1,
    });
  };

  const openEditStep = (step: WorkflowStep) => {
    setStepForm({
      name: step.name, step_order: step.step_order,
      min_value: step.min_value?.toString() || '',
      max_value: step.max_value?.toString() || '',
      min_risk_level: step.min_risk_level || '',
      max_risk_level: step.max_risk_level || '',
      required_approvers: step.required_approvers,
    });
    setEditingStep(step.id);
  };

  const handleSaveStep = async (wfId: string) => {
    if (!stepForm.name.trim()) { toast.error('Nome do passo é obrigatório'); return; }
    try {
      if (editingStep) {
        await updateStep.mutateAsync({
          id: editingStep,
          name: stepForm.name.trim(),
          min_value: stepForm.min_value ? parseFloat(stepForm.min_value) : null,
          max_value: stepForm.max_value ? parseFloat(stepForm.max_value) : null,
          min_risk_level: stepForm.min_risk_level || null,
          max_risk_level: stepForm.max_risk_level || null,
          required_approvers: stepForm.required_approvers,
        });
        toast.success('Passo actualizado');
      } else {
        await createStep.mutateAsync({
          workflow_id: wfId,
          step_order: stepForm.step_order,
          name: stepForm.name.trim(),
          min_value: stepForm.min_value ? parseFloat(stepForm.min_value) : null,
          max_value: stepForm.max_value ? parseFloat(stepForm.max_value) : null,
          min_risk_level: stepForm.min_risk_level || null,
          max_risk_level: stepForm.max_risk_level || null,
          required_approvers: stepForm.required_approvers,
        });
        toast.success('Passo criado');
      }
      setShowNewStep(null);
      setEditingStep(null);
    } catch { toast.error('Erro ao salvar passo'); }
  };

  const handleDeleteStep = async (id: string) => {
    if (!window.confirm('Eliminar este passo?')) return;
    try {
      await deleteStep.mutateAsync(id);
      toast.success('Passo eliminado');
    } catch { toast.error('Erro ao eliminar passo'); }
  };

  const handleAddApprover = async (stepId: string, userId: string) => {
    try {
      await addApprover.mutateAsync({ step_id: stepId, user_id: userId });
      setAddingApprover(null);
      toast.success('Aprovador adicionado');
    } catch { toast.error('Erro ao adicionar aprovador'); }
  };

  const handleRemoveApprover = async (id: string) => {
    try {
      await removeApprover.mutateAsync(id);
      toast.success('Aprovador removido');
    } catch { toast.error('Erro ao remover aprovador'); }
  };

  if (isLoading) {
    return (
      <div style={containerStyle}>
        <div style={{ ...cardStyle, padding: 60, textAlign: 'center', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
          A carregar workflows...
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Header */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid #e2e5e9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0d1117' }}>Workflows de Aprovação</h2>
            <p style={{ fontSize: 13, color: '#6b7280' }}>Configura fluxos de aprovação com múltiplos níveis e regras por valor/risco</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', background: '#0d1117', color: '#fff',
              border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Plus size={16} /> Novo Workflow
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div style={{ padding: '20px 28px', borderBottom: '1px solid #e2e5e9', background: 'rgba(13,17,23,0.02)' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Nome *</label>
                <input type="text" value={newWfName} onChange={e => setNewWfName(e.target.value)}
                  placeholder="Ex: Aprovação de Contratos > 5M Kz"
                  style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: '1.5px solid #e2e5e9', outline: 'none', fontFamily: "'Poppins',sans-serif", color: '#0d1117' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Descrição</label>
                <input type="text" value={newWfDesc} onChange={e => setNewWfDesc(e.target.value)}
                  placeholder="Descrição opcional"
                  style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: '1.5px solid #e2e5e9', outline: 'none', fontFamily: "'Poppins',sans-serif", color: '#0d1117' }}
                />
              </div>
              <button onClick={handleCreateWorkflow} disabled={createWorkflow.isPending}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                  background: '#0d1117', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: createWorkflow.isPending ? 0.6 : 1
                }}
              >
                {createWorkflow.isPending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />}
                Criar
              </button>
              <button onClick={() => setShowCreate(false)}
                style={{ display: 'inline-flex', padding: '8px 12px', background: '#fff', border: '1px solid #e2e5e9', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#6b7280' }}
              ><X size={14} /></button>
            </div>
          </div>
        )}

        {/* Workflow list */}
        <div style={{ padding: 20 }}>
          {workflows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
              <Shield size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p style={{ fontSize: 15 }}>Nenhum workflow configurado</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>Cria o primeiro workflow de aprovação</p>
            </div>
          ) : workflows.map(wf => (
            <div key={wf.id} style={{ marginBottom: 16, border: '1px solid #e2e5e9', overflow: 'hidden' }}>
              {/* Workflow header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
                background: 'rgba(13,17,23,0.02)', cursor: 'pointer',
                borderBottom: expanded === wf.id ? '1px solid #e2e5e9' : 'none'
              }}
                onClick={() => setExpanded(expanded === wf.id ? null : wf.id)}
              >
                <Shield size={18} color={wf.is_active ? '#10b981' : '#9ca3af'} />
                <div style={{ flex: 1 }}>
                  {editingWf === wf.id ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="text" value={wfName} onChange={e => setWfName(e.target.value)}
                        style={{ padding: '6px 10px', fontSize: 13, border: '1.5px solid #e2e5e9', outline: 'none', flex: 1, fontFamily: "'Poppins',sans-serif" }}
                      />
                      <input type="text" value={wfDesc} onChange={e => setWfDesc(e.target.value)}
                        style={{ padding: '6px 10px', fontSize: 13, border: '1.5px solid #e2e5e9', outline: 'none', flex: 1, fontFamily: "'Poppins',sans-serif" }}
                        placeholder="Descrição"
                      />
                      <button onClick={() => handleSaveWf(wf.id)}
                        style={{ padding: '6px 12px', background: '#0d1117', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      ><Save size={14} /></button>
                      <button onClick={() => setEditingWf(null)}
                        style={{ padding: '6px 10px', background: '#fff', border: '1px solid #e2e5e9', fontSize: 12, cursor: 'pointer', color: '#6b7280' }}
                      ><X size={14} /></button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#0d1117' }}>{wf.name}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: '2px 8px',
                          background: wf.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(156,163,175,0.1)',
                          color: wf.is_active ? '#10b981' : '#9ca3af',
                        }}>
                          {wf.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      {wf.description && <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{wf.description}</p>}
                    </>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={e => { e.stopPropagation(); handleToggleActive(wf); }}
                    style={{ padding: '6px 10px', background: 'transparent', border: 'none', cursor: 'pointer', color: wf.is_active ? '#10b981' : '#9ca3af' }}
                    title={wf.is_active ? 'Desactivar' : 'Activar'}
                  >
                    {wf.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                  <button onClick={e => { e.stopPropagation(); setEditingWf(wf.id); setWfName(wf.name); setWfDesc(wf.description || ''); }}
                    style={{ padding: '6px 10px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                  ><Edit3 size={16} /></button>
                  <button onClick={e => { e.stopPropagation(); handleDeleteWf(wf.id, wf.name); }}
                    style={{ padding: '6px 10px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                  ><Trash2 size={16} /></button>
                </div>
              </div>

              {/* Expanded steps */}
              {expanded === wf.id && (
                <div style={{ padding: 20 }}>
                  {/* Steps list */}
                  {(wf.steps || []).length === 0 && (
                    <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: 20 }}>
                      Nenhum passo definido. Adiciona o primeiro passo.
                    </p>
                  )}
                  {(wf.steps || []).sort((a, b) => a.step_order - b.step_order).map((step, idx) => (
                    <div key={step.id} style={{
                      display: 'flex', gap: 16, marginBottom: 12, padding: 16,
                      background: editingStep === step.id ? 'rgba(13,17,23,0.03)' : '#fff',
                      border: '1px solid #e2e5e9'
                    }}>
                      {/* Order indicator */}
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: '#0d1117', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, flexShrink: 0
                      }}>
                        {idx + 1}
                      </div>

                      {editingStep === step.id ? (
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                            <div>
                              <label style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 2 }}>Nome *</label>
                              <input type="text" value={stepForm.name} onChange={e => setStepForm(p => ({ ...p, name: e.target.value }))}
                                style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: '1.5px solid #e2e5e9', outline: 'none', fontFamily: "'Poppins',sans-serif" }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 2 }}>Ordem</label>
                              <input type="number" value={stepForm.step_order} onChange={e => setStepForm(p => ({ ...p, step_order: parseInt(e.target.value) || 0 }))}
                                style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: '1.5px solid #e2e5e9', outline: 'none', fontFamily: "'Poppins',sans-serif" }}
                              />
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                            <div>
                              <label style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 2 }}>Valor Mín. (Kz)</label>
                              <input type="number" value={stepForm.min_value} onChange={e => setStepForm(p => ({ ...p, min_value: e.target.value }))}
                                style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: '1.5px solid #e2e5e9', outline: 'none', fontFamily: "'Poppins',sans-serif" }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 2 }}>Valor Máx. (Kz)</label>
                              <input type="number" value={stepForm.max_value} onChange={e => setStepForm(p => ({ ...p, max_value: e.target.value }))}
                                style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: '1.5px solid #e2e5e9', outline: 'none', fontFamily: "'Poppins',sans-serif" }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 2 }}>Aprov. Necessários</label>
                              <input type="number" min={1} value={stepForm.required_approvers} onChange={e => setStepForm(p => ({ ...p, required_approvers: parseInt(e.target.value) || 1 }))}
                                style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: '1.5px solid #e2e5e9', outline: 'none', fontFamily: "'Poppins',sans-serif" }}
                              />
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                            <div>
                              <label style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 2 }}>Risco Mín.</label>
                              <select value={stepForm.min_risk_level} onChange={e => setStepForm(p => ({ ...p, min_risk_level: e.target.value }))}
                                style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: '1.5px solid #e2e5e9', outline: 'none', fontFamily: "'Poppins',sans-serif", background: '#fff' }}
                              >
                                <option value="">Qualquer</option>
                                {riskLevels.map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 2 }}>Risco Máx.</label>
                              <select value={stepForm.max_risk_level} onChange={e => setStepForm(p => ({ ...p, max_risk_level: e.target.value }))}
                                style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: '1.5px solid #e2e5e9', outline: 'none', fontFamily: "'Poppins',sans-serif", background: '#fff' }}
                              >
                                <option value="">Qualquer</option>
                                {riskLevels.map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => handleSaveStep(wf.id)}
                              style={{ padding: '6px 14px', background: '#0d1117', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                            ><Save size={14} style={{ marginRight: 4 }} />Guardar</button>
                            <button onClick={() => { setEditingStep(null); setShowNewStep(null); }}
                              style={{ padding: '6px 12px', background: '#fff', border: '1px solid #e2e5e9', fontSize: 12, cursor: 'pointer', color: '#6b7280' }}
                            >Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0d1117' }}>{step.name}</h4>
                              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                                Ordem {step.step_order} · {step.required_approvers} aprovador(es) necessário(s)
                              </p>
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button onClick={() => openEditStep(step)}
                                style={{ padding: '4px 8px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                              ><Edit3 size={14} /></button>
                              <button onClick={() => handleDeleteStep(step.id)}
                                style={{ padding: '4px 8px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                              ><Trash2 size={14} /></button>
                            </div>
                          </div>
                          {(step.min_value || step.max_value || step.min_risk_level || step.max_risk_level) && (
                            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                              {step.min_value != null && <Tag label={`Valor ≥ ${step.min_value.toLocaleString()} Kz`} color="#3b82f6" />}
                              {step.max_value != null && <Tag label={`Valor ≤ ${step.max_value.toLocaleString()} Kz`} color="#8b5cf6" />}
                              {step.min_risk_level && <Tag label={`Risco ≥ ${step.min_risk_level}`} color="#f59e0b" />}
                              {step.max_risk_level && <Tag label={`Risco ≤ ${step.max_risk_level}`} color="#10b981" />}
                            </div>
                          )}

                          {/* Approvers */}
                          <div style={{ marginTop: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280' }}>Aprovadores:</span>
                              <button onClick={() => setAddingApprover({ stepId: step.id, wfId: wf.id })}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: 'transparent', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', color: '#3b82f6' }}
                              ><UserPlus size={12} /> Adicionar</button>
                            </div>
                            {addingApprover?.stepId === step.id && (
                              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                                <select
                                  style={{
                                    flex: 1, padding: '4px 8px', fontSize: 12, border: '1.5px solid #e2e5e9',
                                    outline: 'none', fontFamily: "'Poppins',sans-serif", background: '#fff'
                                  }}
                                  onChange={e => {
                                    if (e.target.value) handleAddApprover(step.id, e.target.value);
                                  }}
                                  value=""
                                >
                                  <option value="">Seleccionar utilizador...</option>
                                  {users
                                    .filter((u: any) => !(step.approvers || []).some((a: any) => a.user_id === u.id))
                                    .map((u: any) => (
                                      <option key={u.id} value={u.id}>{u.name || u.email || u.id}</option>
                                    ))
                                  }
                                </select>
                                <button onClick={() => setAddingApprover(null)}
                                  style={{ padding: '4px 8px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                                ><X size={14} /></button>
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {(step.approvers || []).length === 0 && (
                                <span style={{ fontSize: 11, color: '#9ca3af' }}>Nenhum aprovador atribuído</span>
                              )}
                              {(step.approvers || []).map((app: any) => {
                                const u = users.find((x: any) => x.id === app.user_id);
                                return (
                                  <div key={app.id} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                    padding: '2px 8px 2px 10px', background: 'rgba(13,17,23,0.05)',
                                    fontSize: 11, fontWeight: 500, color: '#0d1117'
                                  }}>
                                    {u?.name || u?.email || app.user_id?.slice(0, 8)}
                                    <button onClick={() => handleRemoveApprover(app.id)}
                                      style={{ padding: 2, background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
                                    ><UserMinus size={12} /></button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add step button */}
                  {showNewStep !== wf.id ? (
                    <button onClick={() => { resetStepForm((wf.steps || []).length); setShowNewStep(wf.id); }}
                      style={{
                        width: '100%', padding: 12, background: 'transparent', border: '1px dashed #e2e5e9',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#6b7280', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', gap: 8
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#0d1117'; e.currentTarget.style.color = '#0d1117'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e5e9'; e.currentTarget.style.color = '#6b7280'; }}
                    >
                      <Plus size={16} /> Adicionar Passo
                    </button>
                  ) : (
                    <div style={{ padding: 16, border: '1px dashed #e2e5e9', marginTop: 12 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#0d1117', marginBottom: 12 }}>Novo passo (ordem: {stepForm.step_order})</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                        <div>
                          <label style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 2 }}>Nome *</label>
                          <input type="text" value={stepForm.name} onChange={e => setStepForm(p => ({ ...p, name: e.target.value }))}
                            style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: '1.5px solid #e2e5e9', outline: 'none', fontFamily: "'Poppins',sans-serif" }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 2 }}>Aprov. Necessários</label>
                          <input type="number" min={1} value={stepForm.required_approvers} onChange={e => setStepForm(p => ({ ...p, required_approvers: parseInt(e.target.value) || 1 }))}
                            style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: '1.5px solid #e2e5e9', outline: 'none', fontFamily: "'Poppins',sans-serif" }}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                        <div>
                          <label style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 2 }}>Valor Mín. (Kz)</label>
                          <input type="number" value={stepForm.min_value} onChange={e => setStepForm(p => ({ ...p, min_value: e.target.value }))}
                            style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: '1.5px solid #e2e5e9', outline: 'none', fontFamily: "'Poppins',sans-serif" }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 2 }}>Valor Máx. (Kz)</label>
                          <input type="number" value={stepForm.max_value} onChange={e => setStepForm(p => ({ ...p, max_value: e.target.value }))}
                            style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: '1.5px solid #e2e5e9', outline: 'none', fontFamily: "'Poppins',sans-serif" }}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                        <div>
                          <label style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 2 }}>Risco Mín.</label>
                          <select value={stepForm.min_risk_level} onChange={e => setStepForm(p => ({ ...p, min_risk_level: e.target.value }))}
                            style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: '1.5px solid #e2e5e9', outline: 'none', fontFamily: "'Poppins',sans-serif", background: '#fff' }}
                          >
                            <option value="">Qualquer</option>
                            {riskLevels.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 2 }}>Risco Máx.</label>
                          <select value={stepForm.max_risk_level} onChange={e => setStepForm(p => ({ ...p, max_risk_level: e.target.value }))}
                            style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: '1.5px solid #e2e5e9', outline: 'none', fontFamily: "'Poppins',sans-serif", background: '#fff' }}
                          >
                            <option value="">Qualquer</option>
                            {riskLevels.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleSaveStep(wf.id)}
                          style={{ padding: '6px 14px', background: '#0d1117', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        ><Check size={14} style={{ marginRight: 4 }} />Criar Passo</button>
                        <button onClick={() => setShowNewStep(null)}
                          style={{ padding: '6px 12px', background: '#fff', border: '1px solid #e2e5e9', fontSize: 12, cursor: 'pointer', color: '#6b7280' }}
                        >Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
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
