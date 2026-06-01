import React, { useState } from 'react';
import { Bell, Plus, X, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { createReminder, cancelReminder, getReminders, Reminder } from '../services/reminders';
import { useAuth } from '../contexts/AuthContext';
import { format, parseISO } from 'date-fns';

interface ReminderFormProps {
  contractId: string;
  contractTitle: string;
  onClose: () => void;
  onCreated: () => void;
}

export function ReminderForm({ contractId, contractTitle, onClose, onCreated }: ReminderFormProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(`Lembrete: ${contractTitle}`);
  const [message, setMessage] = useState('');
  const [remindAt, setRemindAt] = useState('');
  const [type, setType] = useState<Reminder['type']>('custom');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !remindAt) {
      toast.error('Selecciona uma data para o lembrete');
      return;
    }
    setSaving(true);
    try {
      await createReminder({
        user_id: user.id,
        contract_id: contractId,
        title,
        message: message || undefined,
        remind_at: new Date(remindAt).toISOString(),
        type
      });
      toast.success('Lembrete criado com sucesso');
      onCreated();
      onClose();
    } catch {
      toast.error('Erro ao criar lembrete');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, fontFamily: "'Poppins',sans-serif" }}>
          Título
        </label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', fontSize: 13, fontFamily: "'Poppins',sans-serif", border: '1px solid #e2e5e9', color: '#0d1117', outline: 'none' }}
          required />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, fontFamily: "'Poppins',sans-serif" }}>
          Mensagem (opcional)
        </label>
        <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2}
          style={{ width: '100%', padding: '8px 12px', fontSize: 13, fontFamily: "'Poppins',sans-serif", border: '1px solid #e2e5e9', color: '#0d1117', outline: 'none', resize: 'vertical' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, fontFamily: "'Poppins',sans-serif" }}>
            Data do Lembrete
          </label>
          <input type="datetime-local" value={remindAt} onChange={e => setRemindAt(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', fontSize: 13, fontFamily: "'Poppins',sans-serif", border: '1px solid #e2e5e9', color: '#0d1117', outline: 'none' }}
            required />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, fontFamily: "'Poppins',sans-serif" }}>
            Tipo
          </label>
          <select value={type} onChange={e => setType(e.target.value as Reminder['type'])}
            style={{ width: '100%', padding: '8px 12px', fontSize: 13, fontFamily: "'Poppins',sans-serif", border: '1px solid #e2e5e9', color: '#0d1117', outline: 'none' }}>
            <option value="custom">Personalizado</option>
            <option value="expiry">Expiração</option>
            <option value="renewal">Renovação</option>
            <option value="signature">Assinatura</option>
            <option value="approval">Aprovação</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onClose}
          style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, background: '#fff', border: '1px solid #e2e5e9', color: '#6b7280', cursor: 'pointer', fontFamily: "'Poppins',sans-serif" }}>
          Cancelar
        </button>
        <button type="submit" disabled={saving}
          style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, background: '#0d1117', border: 'none', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'Poppins',sans-serif", opacity: saving ? 0.7 : 1 }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : 'Criar Lembrete'}
        </button>
      </div>
    </form>
  );
}

interface ReminderListProps {
  contractId: string;
  onRefresh?: () => void;
}

export function ReminderList({ contractId, onRefresh }: ReminderListProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = async () => {
    try {
      const data = await getReminders(contractId);
      setReminders(data);
    } catch {
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { fetchReminders(); }, [contractId]);

  const handleCancel = async (id: string) => {
    try {
      await cancelReminder(id);
      setReminders(prev => prev.filter(r => r.id !== id));
      toast.success('Lembrete cancelado');
      onRefresh?.();
    } catch {
      toast.error('Erro ao cancelar lembrete');
    }
  };

  if (loading) return null;

  if (reminders.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Lembretes Agendados
      </div>
      {reminders.map(r => (
        <div key={r.id} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', background: 'rgba(245,158,11,0.06)',
          borderLeft: '3px solid #f59e0b'
        }}>
          <Clock size={14} color="#f59e0b" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0d1117' }}>{r.title}</div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>
              {r.remind_at ? format(parseISO(r.remind_at), "dd/MM/yyyy 'às' HH:mm") : ''}
              {r.type !== 'custom' && <span style={{ marginLeft: 8, textTransform: 'capitalize' }}>• {r.type}</span>}
            </div>
          </div>
          <button onClick={() => handleCancel(r.id)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}
            title="Cancelar">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
