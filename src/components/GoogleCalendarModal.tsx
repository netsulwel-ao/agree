import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { createCalendarEvent } from '../services/google';
import { format, addHours } from 'date-fns';
import { X, Loader2, Calendar, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  contract: {
    id: string;
    title: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    contract_value?: number;
  };
}

export default function GoogleCalendarModal({ isOpen, onClose, userId, contract }: Props) {
  const [loading, setLoading] = useState(false);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);

  const eventTitle = `Contrato: ${contract.title}`;
  const eventDesc = `Contrato #${contract.id.slice(0, 8)}\n\n${contract.description || ''}\n\nValor: ${contract.contract_value ? `${contract.contract_value.toLocaleString()} AKZ` : 'N/A'}`;

  const defaultStart = contract.start_date
    ? format(new Date(contract.start_date), "yyyy-MM-dd'T'09:00")
    : format(new Date(), "yyyy-MM-dd'T'09:00");
  const defaultEnd = contract.end_date
    ? format(new Date(contract.end_date), "yyyy-MM-dd'T'10:00")
    : format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm");

  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('google_integrations')
        .select('access_token')
        .eq('user_id', userId)
        .single();
      if (!data?.access_token) { toast.error('Google não conectado'); return; }

      const result = await createCalendarEvent(data.access_token, {
        summary: eventTitle,
        description: eventDesc,
        start: { dateTime: new Date(start).toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        end: { dateTime: new Date(end).toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      });

      setCreatedUrl(result.htmlLink);
      toast.success('Evento criado no Google Calendar');
    } catch { toast.error('Erro ao criar evento'); }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: '#fff', width: 480, maxWidth: '90vw',
        fontFamily: "'Poppins',sans-serif",
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #eee' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} color="#4285F4" />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0d1117' }}>Criar Evento Calendar</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={18} color="#6b7280" />
          </button>
        </div>

        {createdUrl ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <CheckCircle2 size={40} color="#10b981" style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: '#0d1117', marginBottom: 8 }}>Evento Criado!</p>
            <a href={createdUrl} target="_blank" rel="noopener noreferrer"
              style={{ color: '#4285F4', fontSize: 13, textDecoration: 'underline' }}>
              Abrir no Google Calendar →
            </a>
            <br /><br />
            <button onClick={onClose}
              style={{ padding: '8px 20px', background: '#0d1117', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Fechar
            </button>
          </div>
        ) : (
          <div style={{ padding: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#0d1117', marginBottom: 4 }}>{eventTitle}</p>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16, maxHeight: 60, overflow: 'hidden' }}>
              {contract.description?.slice(0, 200)}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Início</label>
              <input type="datetime-local" value={start} onChange={e => setStart(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1.5px solid #e2e5e9', outline: 'none' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Fim</label>
              <input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1.5px solid #e2e5e9', outline: 'none' }} />
            </div>

            <button onClick={handleCreate} disabled={loading}
              style={{
                width: '100%', padding: '10px 0', background: '#4285F4', color: '#fff', border: 'none',
                fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}>
              {loading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
              {loading ? 'A criar...' : 'Criar Evento'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
