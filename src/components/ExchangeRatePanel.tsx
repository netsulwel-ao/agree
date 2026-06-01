import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SUPPORTED_CURRENCIES, clearRatesCache } from '../services/currency';
import { Loader2, RefreshCw, Save, Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface RateRow {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
}

export default function ExchangeRatePanel() {
  const [rates, setRates] = useState<RateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('exchange_rates').select('*').order('from_currency');
      if (data) setRates(data);
      setLoading(false);
    };
    fetch();
  }, []);

  const handleSave = async (id: string, from: string, to: string) => {
    const rate = parseFloat(editValue);
    if (isNaN(rate) || rate <= 0) { toast.error('Taxa inválida'); return; }
    setSaving(true);
    const { error } = await supabase.from('exchange_rates').upsert({
      id, from_currency: from, to_currency: to, rate,
    }, { onConflict: 'from_currency, to_currency' });
    if (error) { toast.error('Erro ao guardar'); } else {
      clearRatesCache();
      setRates(prev => prev.map(r => r.id === id ? { ...r, rate } : r));
      toast.success('Taxa actualizada');
    }
    setSaving(false);
    setEditId(null);
  };

  const getName = (code: string) => SUPPORTED_CURRENCIES.find(c => c.code === code)?.name || code;

  if (loading) return <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /></div>;

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e5e9' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f2f4', display: 'flex', alignItems: 'center', gap: 8 }}>
        <RefreshCw size={16} />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#0d1117' }}>Taxas de Câmbio</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e2e5e9' }}>
            <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>De</th>
            <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Para</th>
            <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#374151' }}>Taxa</th>
            <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#374151' }}>Acções</th>
          </tr>
        </thead>
        <tbody>
          {rates.map(r => (
            <tr key={r.id} style={{ borderBottom: '1px solid #f0f2f4' }}>
              <td style={{ padding: '10px 16px', color: '#0d1117', fontWeight: 500 }}>{getName(r.from_currency)}</td>
              <td style={{ padding: '10px 16px', color: '#0d1117' }}>{getName(r.to_currency)}</td>
              <td style={{ padding: '10px 16px', textAlign: 'right', color: '#0d1117' }}>
                {editId === r.id ? (
                  <input type="number" step="0.0001" value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    style={{ width: 100, padding: '4px 8px', fontSize: 12, border: '1.5px solid #e2e5e9', outline: 'none', textAlign: 'right' }}
                    autoFocus
                  />
                ) : (
                  <span>{r.rate.toFixed(4)}</span>
                )}
              </td>
              <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                {editId === r.id ? (
                  <button onClick={() => handleSave(r.id, r.from_currency, r.to_currency)} disabled={saving}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', padding: 4 }}>
                    {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                  </button>
                ) : (
                  <button onClick={() => { setEditId(r.id); setEditValue(String(r.rate)); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}>
                    <Pencil size={14} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ padding: '10px 20px', fontSize: 11, color: '#9ca3af', borderTop: '1px solid #f0f2f4' }}>
        As taxas são usadas para conversão automática em contratos e facturas.
      </div>
    </div>
  );
}
