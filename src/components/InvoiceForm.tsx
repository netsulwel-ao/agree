import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useInvoice, useCreateInvoice, useUpdateInvoice, useInvoiceClients, useInvoiceContracts, type LineItem } from '../hooks/useInvoices';
import { supabase } from '../lib/supabase';
import { Save, X, Loader2, Plus, Trash2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import CurrencySelect from './CurrencySelect';
import { formatCurrency } from '../services/currency';

export default function InvoiceForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const { data: editInvoice, isLoading: loadingInvoice } = useInvoice(id);
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const { data: clients = [] } = useInvoiceClients();
  const { data: contracts = [] } = useInvoiceContracts();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [taxRate, setTaxRate] = useState('0');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [contractId, setContractId] = useState('');
  const [clientId, setClientId] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [status, setStatus] = useState('draft');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [currency, setCurrency] = useState('AOA');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editInvoice) {
      setTitle(editInvoice.title);
      setDescription(editInvoice.description || '');
      setValue(editInvoice.value.toString());
      setTaxRate(editInvoice.tax_rate.toString());
      setDueDate(editInvoice.due_date || '');
      setNotes(editInvoice.notes || '');
      setContractId(editInvoice.contract_id || '');
      setClientId(editInvoice.client_id || '');
      setPaymentTerms(editInvoice.payment_terms || '');
      setStatus(editInvoice.status);
      setLineItems(editInvoice.line_items || []);
      setCurrency(editInvoice.currency || 'AOA');
    }
  }, [editInvoice]);

  const numValue = parseFloat(value) || 0;
  const numTax = parseFloat(taxRate) || 0;
  const taxValue = numValue * (numTax / 100);
  const totalValue = numValue + taxValue;

  const addLineItem = () => {
    setLineItems(prev => [...prev, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
  };

  const updateLineItem = (idx: number, field: Partial<LineItem>) => {
    setLineItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, ...field };
      updated.total = updated.quantity * updated.unit_price;
      return updated;
    }));
  };

  const removeLineItem = (idx: number) => {
    setLineItems(prev => prev.filter((_, i) => i !== idx));
  };

  const totalLineItems = lineItems.reduce((s, item) => s + item.total, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('O título é obrigatório'); return; }
    if (numValue <= 0 && totalLineItems <= 0) { toast.error('O valor deve ser maior que zero'); return; }

    setSaving(true);
    try {
      if (isEditing && id) {
        await updateInvoice.mutateAsync({
          id,
          title: title.trim(),
          description: description.trim(),
          value: totalLineItems > 0 ? totalLineItems : numValue,
          tax_rate: numTax,
          currency,
          status,
          due_date: dueDate || undefined,
          notes: notes || undefined,
          line_items: lineItems,
          payment_terms: paymentTerms || undefined,
        });
        toast.success('Factura actualizada');
        navigate(`/invoices/${id}`);
      } else {
        const invoice = await createInvoice.mutateAsync({
          title: title.trim(),
          description: description.trim(),
          value: totalLineItems > 0 ? totalLineItems : numValue,
          tax_rate: numTax,
          currency,
          due_date: dueDate || undefined,
          notes: notes || undefined,
          contract_id: contractId || null,
          client_id: clientId || null,
          line_items: lineItems,
          payment_terms: paymentTerms || undefined,
        });
        toast.success('Factura criada');
        navigate(`/invoices/${invoice.id}`);
      }
    } catch {
      toast.error('Erro ao salvar factura');
    } finally {
      setSaving(false);
    }
  };

  if (isEditing && loadingInvoice) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, color: '#9ca3af', gap: 10, fontFamily: "'Poppins',sans-serif" }}>
        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
        A carregar...
      </div>
    );
  }

  const containerStyle: React.CSSProperties = {
    fontFamily: "'Poppins', sans-serif", maxWidth: 900, margin: '0 auto',
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(30px)',
    border: '1px solid rgba(255,255,255,0.35)', borderRadius: 24,
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)', overflow: 'hidden',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid #e2e5e9',
    outline: 'none', fontFamily: "'Poppins',sans-serif", color: '#0d1117', background: '#fff',
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div style={{ padding: '24px 28px', borderBottom: '1px solid #e2e5e9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0d1117' }}>
                {isEditing ? 'Editar Factura' : 'Nova Factura'}
              </h2>
              <p style={{ fontSize: 13, color: '#6b7280' }}>
                {isEditing ? `#${editInvoice?.number}` : 'Preenche os dados para criar a factura'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={saving}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 24px', background: '#0d1117', color: '#fff',
                  border: 'none', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                {isEditing ? 'Actualizar' : 'Criar Factura'}
              </button>
              <button type="button" onClick={() => navigate(-1)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 16px', background: '#fff', color: '#6b7280',
                  border: '1px solid #e2e5e9', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              ><X size={16} /> Cancelar</button>
            </div>
          </div>

          <div style={{ padding: 28 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Título *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Consultoria Jurídica - Jan 2026" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Data de Vencimento</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Contrato Associado</label>
                <select value={contractId} onChange={e => {
                  setContractId(e.target.value);
                  const c = contracts.find(ct => ct.id === e.target.value);
                  if (c) setClientId(c.client_id || '');
                }} style={inputStyle}>
                  <option value="">Nenhum</option>
                  {contracts.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Cliente</label>
                <select value={clientId} onChange={e => setClientId(e.target.value)} style={inputStyle}>
                  <option value="">Seleccionar cliente</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Descrição</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                placeholder="Descrição opcional da factura" style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            {/* Line Items */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Itens da Factura</span>
                <button type="button" onClick={addLineItem}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                    background: '#f0f2f4', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#0d1117'
                  }}
                ><Plus size={14} /> Adicionar Item</button>
              </div>
              {lineItems.length === 0 && (
                <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>Nenhum item — o valor será usado directamente.</p>
              )}
              {lineItems.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <input type="text" value={item.description} onChange={e => updateLineItem(idx, { description: e.target.value })}
                    placeholder="Descrição" style={{ flex: 1, padding: '8px 10px', fontSize: 12, border: '1.5px solid #e2e5e9', outline: 'none', fontFamily: "'Poppins',sans-serif" }} />
                  <input type="number" value={item.quantity} onChange={e => updateLineItem(idx, { quantity: parseInt(e.target.value) || 0 })}
                    placeholder="Qtd" min={1} style={{ width: 60, padding: '8px 10px', fontSize: 12, border: '1.5px solid #e2e5e9', outline: 'none', fontFamily: "'Poppins',sans-serif" }} />
                  <input type="number" value={item.unit_price} onChange={e => updateLineItem(idx, { unit_price: parseFloat(e.target.value) || 0 })}
                    placeholder="Preço" style={{ width: 100, padding: '8px 10px', fontSize: 12, border: '1.5px solid #e2e5e9', outline: 'none', fontFamily: "'Poppins',sans-serif" }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#0d1117', width: 80, textAlign: 'right' }}>
                    {formatCurrency(item.total, currency)}
                  </span>
                  <button type="button" onClick={() => removeLineItem(idx)}
                    style={{ padding: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                  ><Trash2 size={14} /></button>
                </div>
              ))}
              {totalLineItems > 0 && (
                <p style={{ fontSize: 12, fontWeight: 600, color: '#0d1117', textAlign: 'right' }}>
                  Subtotal: {formatCurrency(totalLineItems, currency)}
                </p>
              )}
            </div>

            {/* Value, Tax, Currency */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>
                  Valor {totalLineItems > 0 ? '(subtotal)' : ''} *
                </label>
                <div style={{ position: 'relative' }}>
                  <input type="number" value={totalLineItems > 0 ? totalLineItems : value}
                    onChange={e => setValue(e.target.value)}
                    disabled={totalLineItems > 0}
                    style={{ ...inputStyle }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Moeda</label>
                <CurrencySelect value={currency} onChange={setCurrency} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Taxa (%)</label>
                <input type="number" value={taxRate} onChange={e => setTaxRate(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Total</label>
                <div style={{ padding: '10px 14px', fontSize: 18, fontWeight: 800, color: '#0d1117', border: '1.5px solid #e2e5e9' }}>
                  {formatCurrency(totalValue, currency)}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Condições de Pagamento</label>
                <input type="text" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}
                  placeholder="Ex: Pagamento a 30 dias" style={inputStyle} />
              </div>
              {isEditing && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Estado</label>
                  <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
                    <option value="draft">Rascunho</option>
                    <option value="sent">Enviada</option>
                    <option value="paid">Paga</option>
                    <option value="overdue">Vencida</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Notas Internas</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                placeholder="Notas ou observações internas" style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
