import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useClient, useCreateClient, useUpdateClient } from '../hooks/useClients';
import { useAuth } from '../contexts/AuthContext';
import { checkPlan } from '../lib/plans';
import TagInput from './TagInput';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ClientForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, plan, isAdmin } = useAuth();
  const { data: existing, isLoading: loadingExisting } = useClient(id);
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const isEdit = !!id;

  const canUseTags = checkPlan(plan, 'pro', isAdmin);
  const canUseCategory = checkPlan(plan, 'pro', isAdmin);
  const canUseCustomFields = checkPlan(plan, 'enterprise', isAdmin);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'active',
    category: '',
    notes: '',
  });
  const [tags, setTags] = useState<string[]>([]);
  const [customFields, setCustomFields] = useState<{ key: string; value: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setFormData({
        name: existing.name || '',
        email: existing.email || '',
        phone: existing.phone || '',
        status: existing.status || 'active',
        category: existing.category || '',
        notes: existing.notes || '',
      });
      setTags(existing.tags || []);
      if (existing.custom_fields) {
        setCustomFields(
          Object.entries(existing.custom_fields).map(([key, value]) => ({ key, value: String(value) }))
        );
      }
    }
  }, [existing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error('Nome é obrigatório'); return; }

    setSaving(true);
    try {
      const payload: any = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        status: formData.status,
        notes: formData.notes.trim() || null,
      };

      if (canUseCategory) payload.category = formData.category.trim() || null;
      if (canUseTags) payload.tags = tags;
      if (canUseCustomFields) {
        const fields: Record<string, string> = {};
        customFields.forEach(f => { if (f.key.trim()) fields[f.key.trim()] = f.value; });
        payload.custom_fields = fields;
      }

      if (isEdit) {
        await updateClient.mutateAsync({ id: id!, ...payload });
        toast.success('Cliente actualizado com sucesso!');
        navigate(`/clients/${id}`);
      } else {
        const result = await createClient.mutateAsync(payload as any);
        toast.success('Cliente criado com sucesso!');
        navigate(`/clients/${result.id}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar cliente');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', fontSize: 13, color: '#0d1117',
    fontFamily: "'Poppins',sans-serif", background: '#fff',
    border: '1.5px solid #e2e5e9', outline: 'none', transition: 'border-color .2s',
    boxSizing: 'border-box',
  };

  if (loadingExisting && isEdit) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#6b7280' }} />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Poppins',sans-serif" }}>
      <style>{`@keyframes spin{100%{transform:rotate(360deg)}}`}</style>

      <div style={{ marginBottom: 32 }}>
        <button
          onClick={() => navigate(isEdit ? `/clients/${id}` : '/clients')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px',
            background: '#fff', border: '1.5px solid #e2e5e9', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, color: '#6b7280',
            fontFamily: "'Poppins',sans-serif",
          }}
        >
          <ArrowLeft size={16} /> Voltar
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{
          background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.5)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)', padding: 32,
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0d1117', marginBottom: 24 }}>
            {isEdit ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0d1117', marginBottom: 6 }}>
                Nome <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                required
                value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0d1117', marginBottom: 6 }}>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0d1117', marginBottom: 6 }}>Telefone</label>
              <input
                value={formData.phone}
                onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                style={inputStyle}
              />
            </div>
            {canUseCategory && (
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0d1117', marginBottom: 6 }}>Categoria</label>
                <input
                  value={formData.category}
                  onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                  placeholder="ex: Cliente VIP, Parceiro"
                  style={inputStyle}
                />
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0d1117', marginBottom: 6 }}>Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}
                style={inputStyle}
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="lead">Lead</option>
              </select>
            </div>
          </div>

          {canUseTags && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0d1117', marginBottom: 6 }}>Tags</label>
              <TagInput tags={tags} onChange={setTags} />
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0d1117', marginBottom: 6 }}>Notas</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {canUseCustomFields && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0d1117', marginBottom: 6 }}>
                Campos Personalizados
              </label>
              {customFields.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                  <input
                    placeholder="Chave"
                    value={f.key}
                    onChange={e => {
                      const copy = [...customFields];
                      copy[i].key = e.target.value;
                      setCustomFields(copy);
                    }}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <input
                    placeholder="Valor"
                    value={f.value}
                    onChange={e => {
                      const copy = [...customFields];
                      copy[i].value = e.target.value;
                      setCustomFields(copy);
                    }}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => setCustomFields(prev => prev.filter((_, j) => j !== i))}
                    style={{
                      padding: '8px 12px', background: '#fff', border: '1.5px solid #e2e5e9',
                      cursor: 'pointer', color: '#ef4444', fontSize: 13, fontWeight: 600,
                    }}
                  >×</button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setCustomFields(prev => [...prev, { key: '', value: '' }])}
                style={{
                  padding: '8px 14px', fontSize: 12, fontWeight: 600, color: '#0d1117',
                  background: '#f3f4f6', border: 'none', cursor: 'pointer',
                  fontFamily: "'Poppins',sans-serif",
                }}
              >+ Adicionar campo</button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid #e2e5e9' }}>
            <button
              type="button"
              onClick={() => navigate(isEdit ? `/clients/${id}` : '/clients')}
              style={{
                padding: '10px 20px', fontSize: 13, fontWeight: 600,
                background: '#fff', border: '1.5px solid #e2e5e9',
                color: '#6b7280', cursor: 'pointer',
                fontFamily: "'Poppins',sans-serif",
              }}
            >Cancelar</button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '10px 20px', fontSize: 13, fontWeight: 600,
                background: saving ? '#999' : '#0d1117', border: 'none',
                color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: "'Poppins',sans-serif",
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}
            >
              {saving && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
              {saving ? 'A salvar...' : (isEdit ? 'Salvar Alterações' : 'Criar Cliente')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
