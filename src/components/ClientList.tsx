import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClients } from '../hooks/useClients';
import { useAuth } from '../contexts/AuthContext';
import { checkPlan, getLimits } from '../lib/plans';
import { useCheckoutModal } from '../contexts/CheckoutModalContext';
import { Search, Plus, Eye, FileEdit, Trash2, Download, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

export default function ClientList() {
  const navigate = useNavigate();
  const { user, plan, isAdmin } = useAuth();
  const { openCheckout } = useCheckoutModal();
  const { data: clients = [], isLoading } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('');

  const limits = getLimits(plan);
  const canUseTags = checkPlan(plan, 'pro', isAdmin);
  const canUseCategory = checkPlan(plan, 'pro', isAdmin);
  const canExport = checkPlan(plan, 'pro', isAdmin);
  const canImport = checkPlan(plan, 'enterprise', isAdmin);

  const allTags = canUseTags ? [...new Set(clients.flatMap(c => c.tags || []))].sort() : [];

  const filtered = clients.filter(c => {
    const matchSearch = !searchTerm.trim() ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm);
    const matchTags = selectedTags.length === 0 ||
      selectedTags.every(t => (c.tags || []).includes(t));
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchTags && matchStatus;
  });

  const handleExport = () => {
    const headers = ['name', 'email', 'phone', 'status', 'category', 'tags', 'notes'];
    const rows = filtered.map(c =>
      headers.map(h => {
        const val = (c as any)[h];
        if (Array.isArray(val)) return val.join('; ');
        return val ?? '';
      })
    );
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `clientes_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('Ficheiro exportado com sucesso');
  };

  const handleImport = () => {
    toast.info('Funcionalidade disponível no plano Enterprise');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tens a certeza que pretendes eliminar este cliente?')) return;
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) { toast.error('Erro ao eliminar cliente'); return; }
    toast.success('Cliente eliminado com sucesso');
  };

  const btnStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '10px 16px', fontSize: 13, fontWeight: 600, borderRadius: 0,
    border: '1.5px solid #e2e5e9', cursor: 'pointer',
    color: '#6b7280', background: '#fff',
    fontFamily: "'Poppins',sans-serif", transition: 'all .2s',
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: "'Poppins',sans-serif" }}>
        <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}.sk{background:linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);background-size:400px 100%;animation:shimmer 1.4s ease infinite}`}</style>
        <div className="sk" style={{ height: 48 }} />
        <div className="sk" style={{ height: 400 }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: "'Poppins',sans-serif" }}>
      {/* Search & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
          <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} size={16} />
          <input
            type="text"
            placeholder="Pesquisar clientes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%', padding: '10px 16px 10px 44px', fontSize: 14,
              fontFamily: "'Poppins',sans-serif", color: '#0d1117',
              background: '#fff', border: '1.5px solid #e2e5e9', outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {canExport && (
            <button type="button" onClick={handleExport} style={btnStyle}
              onMouseEnter={e => { e.currentTarget.style.background = '#f7f9fb'; e.currentTarget.style.color = '#0d1117'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#6b7280'; }}
            >
              <Download size={16} /> Exportar
            </button>
          )}
          {canImport && (
            <button type="button" onClick={handleImport} style={btnStyle}
              onMouseEnter={e => { e.currentTarget.style.background = '#f7f9fb'; e.currentTarget.style.color = '#0d1117'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#6b7280'; }}
            >
              <Upload size={16} /> Importar
            </button>
          )}
          <button type="button" onClick={() => {
            if (clients.length >= limits.maxClients) {
              if (plan === 'free') { openCheckout('pro'); return; }
              toast.error('Limite de clientes atingido');
              return;
            }
            navigate('/clients/new');
          }}
            style={{
              ...btnStyle, background: '#0d1117', color: '#fff', border: '1.5px solid #0d1117',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#000'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#0d1117'; }}
          >
            <Plus size={18} /> Novo Cliente
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {canUseCategory && (
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px', fontSize: 13, fontFamily: "'Poppins',sans-serif",
              border: '1.5px solid #e2e5e9', background: '#fff', color: '#0d1117',
              outline: 'none',
            }}
          >
            <option value="">Todos os status</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="lead">Lead</option>
          </select>
        )}
        {canUseTags && allTags.map(tag => {
          const active = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
              style={{
                padding: '6px 14px', borderRadius: 20, border: 'none',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: active ? '#0d1117' : '#f3f4f6',
                color: active ? '#fff' : '#6b7280',
                fontFamily: "'Poppins',sans-serif",
              }}
            >
              {tag}{active && ` ×`}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div style={{
        background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.5)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)', overflow: 'hidden'
      }}>
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid #e2e5e9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(255,255,255,0.6)'
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0d1117', fontFamily: "'Poppins',sans-serif" }}>
            Clientes e Contactos {clients.length > 0 && `(${clients.length})`}
          </h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: "'Poppins',sans-serif" }}>
            <thead>
              <tr style={{ background: '#f7f9fb', borderBottom: '1px solid #e2e5e9' }}>
                {['Nome', 'Email', 'Telefone', 'Status', 'Categoria', 'Ações'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '12px 24px', fontSize: 11, fontWeight: 700,
                    color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map(client => (
                <tr
                  key={client.id}
                  style={{ borderBottom: '1px solid #e2e5e9', background: '#fff', cursor: 'pointer', transition: 'background .15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#f7f9fb'}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = '#fff'}
                  onClick={() => navigate(`/clients/${client.id}`)}
                >
                  <td style={{ padding: '14px 24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontWeight: 600, color: '#0d1117' }}>{client.name}</span>
                      {(client.tags?.length ?? 0) > 0 && canUseTags && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {client.tags!.map(t => (
                            <span key={t} style={{
                              fontSize: 10, fontWeight: 600, padding: '2px 8px',
                              background: '#f3f4f6', color: '#6b7280', borderRadius: 20,
                            }}>{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '14px 24px', color: '#6b7280' }}>{client.email || '-'}</td>
                  <td style={{ padding: '14px 24px', color: '#6b7280' }}>{client.phone || '-'}</td>
                  <td style={{ padding: '14px 24px' }}>
                    <span style={{
                      padding: '3px 10px', fontSize: 11, fontWeight: 600,
                      background: client.status === 'active' ? 'rgba(13,17,23,0.1)' :
                                   client.status === 'lead' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                      color: client.status === 'active' ? '#0d1117' :
                             client.status === 'lead' ? '#f59e0b' : '#ef4444',
                    }}>
                      {client.status === 'active' ? 'Activo' :
                       client.status === 'lead' ? 'Lead' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 24px', color: '#6b7280', fontSize: 12 }}>
                    {canUseCategory ? (client.category || '-') : '-'}
                  </td>
                  <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/clients/${client.id}`)}
                        style={{ ...btnStyle, padding: '6px 10px' }}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => navigate(`/clients/${client.id}/edit`)}
                        style={{ ...btnStyle, padding: '6px 10px' }}
                      >
                        <FileEdit size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(client.id)}
                        style={{ ...btnStyle, padding: '6px 10px' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} style={{ padding: '60px 24px', textAlign: 'center', color: '#6b7280' }}>
                  {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
