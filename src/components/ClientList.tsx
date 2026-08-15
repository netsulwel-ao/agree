import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClients, useDeleteClient, Client } from '../hooks/useClients';
import { useAuth } from '../contexts/AuthContext';
import { checkPlan, getLimits } from '../lib/plans';
import { useCheckoutModal } from '../contexts/CheckoutModalContext';
import { useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Eye, FileEdit, Trash2, Download, Upload, X, Loader2, Users, ChevronDown, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  active:   { label: 'Activo',   bg: 'rgba(13,17,23,0.1)',   color: '#0d1117' },
  lead:     { label: 'Lead',     bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
  inactive: { label: 'Inactivo', bg: 'rgba(239,68,68,0.1)',  color: '#ef4444' },
};

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else inQuotes = false;
      } else cell += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell); cell = '';
    } else if (ch === '\n') {
      row.push(cell); rows.push(row); row = []; cell = '';
    } else if (ch !== '\r') {
      cell += ch;
    }
  }
  row.push(cell);
  if (row.some(c => c.trim() !== '')) rows.push(row);
  return rows;
}

export default function ClientList() {
  const navigate = useNavigate();
  const { user, plan, isAdmin, trialEndsAt } = useAuth();
  const { openCheckout } = useCheckoutModal();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const { data: clientsData, isLoading, isFetching, refetch } = useClients(page, searchTerm);
  const clients = clientsData?.data ?? [];
  const totalCount = clientsData?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / 20));
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const deleteMutation = useDeleteClient();

  const limits = getLimits(plan, trialEndsAt);
  const canUseTags = checkPlan(plan, 'pro', isAdmin, trialEndsAt);
  const canUseCategory = checkPlan(plan, 'pro', isAdmin, trialEndsAt);
  const canExport = checkPlan(plan, 'pro', isAdmin, trialEndsAt);
  const canImport = checkPlan(plan, 'enterprise', isAdmin, trialEndsAt);

  const allTags = canUseTags ? [...new Set(clients.flatMap(c => c.tags || []))].sort() : [];

  useEffect(() => { setPage(1); }, [searchTerm]);

  useEffect(() => {
    if (!statusOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setStatusOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [statusOpen]);

  const statusOptions = [
    { value: '', label: 'Todos os status' },
    { value: 'active', label: 'Activo' },
    { value: 'lead', label: 'Lead' },
    { value: 'inactive', label: 'Inactivo' },
  ];

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
    if (filtered.length === 0) { toast.info('Não há clientes para exportar'); return; }
    const headers = ['name', 'email', 'phone', 'status', 'category', 'tags', 'notes'];
    const rows = filtered.map(c =>
      headers.map(h => {
        const val = (c as any)[h];
        if (Array.isArray(val)) return val.join('; ');
        return val ?? '';
      })
    );
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `clientes_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success(`Exportados ${rows.length} cliente${rows.length > 1 ? 's' : ''}`);
  };

  const handleImportClick = () => {
    if (!canImport) { openCheckout('enterprise'); return; }
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImporting(true);
    const loadingToast = toast.loading('A importar clientes...');
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length <= 1) { toast.error('O ficheiro não tem dados para importar'); return; }

      const headerRow = rows[0].map(h => h.trim().toLowerCase());
      const col = (name: string, alt?: string) => {
        const idx = headerRow.indexOf(name);
        return idx >= 0 ? idx : (alt ? headerRow.indexOf(alt) : -1);
      };
      const nameIdx = col('name', 'nome');
      const emailIdx = col('email');
      const phoneIdx = col('phone', 'telefone');
      const statusIdx = col('status');
      const categoryIdx = col('category', 'categoria');
      const tagsIdx = col('tags');
      const notesIdx = col('notes', 'notas');
      if (nameIdx < 0) { toast.error('Falta a coluna "name" (ou "nome") no ficheiro'); return; }

      const remaining = limits.maxClients - totalCount;
      const parsed = rows.slice(1)
        .filter(r => (r[nameIdx] ?? '').trim() !== '')
        .map(r => ({
          name: (r[nameIdx] ?? '').trim(),
          email: (emailIdx >= 0 ? (r[emailIdx] ?? '').trim() : '') || null,
          phone: (phoneIdx >= 0 ? (r[phoneIdx] ?? '').trim() : '') || null,
          status: (statusIdx >= 0 ? (r[statusIdx] ?? '').trim().toLowerCase() : '') === 'inactive'
            || (statusIdx >= 0 && (r[statusIdx] ?? '').trim().toLowerCase() === 'inactivo')
            ? 'inactive'
            : (statusIdx >= 0 ? (r[statusIdx] ?? '').trim().toLowerCase() : '') === 'lead'
              ? 'lead' : 'active',
          category: (categoryIdx >= 0 ? (r[categoryIdx] ?? '').trim() : '') || null,
          tags: (tagsIdx >= 0 ? (r[tagsIdx] ?? '').split(';').map((t: string) => t.trim()).filter(Boolean) : []),
          notes: (notesIdx >= 0 ? (r[notesIdx] ?? '').trim() : '') || null,
        }));

      if (parsed.length === 0) { toast.error('Nenhum cliente válido encontrado no ficheiro'); return; }
      if (parsed.length > remaining) {
        toast.error(`Limite excedido: só tens espaço para ${Math.max(0, remaining)} cliente${Math.max(0, remaining) === 1 ? '' : 's'} no teu plano`);
        return;
      }

      let imported = 0;
      for (let i = 0; i < parsed.length; i += 100) {
        const batch = parsed.slice(i, i + 100).map(c => ({ ...c, owner_id: user!.id }));
        const { error } = await supabase.from('clients').insert(batch);
        if (error) throw new Error(error.message);
        imported += batch.length;
      }

      await queryClient.invalidateQueries({ queryKey: ['clients'] });
      await refetch();
      toast.success(`${imported} cliente${imported > 1 ? 's' : ''} importado${imported > 1 ? 's' : ''} com sucesso`);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao importar clientes');
    } finally {
      toast.dismiss(loadingToast);
      setImporting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Cliente eliminado com sucesso');
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao eliminar cliente');
    } finally {
      setDeleting(false);
    }
  };

  const handleCreate = () => {
    if (totalCount >= limits.maxClients) {
      if (plan === 'free') { openCheckout('pro'); return; }
      toast.error('Limite de clientes atingido');
      return;
    }
    navigate('/clients/new');
  };

  const btnStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '10px 16px', fontSize: 13, fontWeight: 600, borderRadius: 0,
    border: '1.5px solid #e2e5e9', cursor: 'pointer',
    color: '#6b7280', background: '#fff',
    fontFamily: "'Poppins',sans-serif", transition: 'all .2s',
  };

  const iconBtnStyle: React.CSSProperties = {
    ...btnStyle, padding: '7px 9px', lineHeight: 0,
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

  const showEmptyState = totalCount === 0 && !searchTerm && !isFetching;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: "'Poppins',sans-serif" }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        style={{ display: 'none' }}
        onChange={handleImportFile}
      />

      {/* Search & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
          <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} size={16} />
          <input
            type="text"
            placeholder="Pesquisar por nome, email ou telefone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%', padding: '10px 16px 10px 44px', fontSize: 14,
              fontFamily: "'Poppins',sans-serif", color: '#0d1117',
              background: '#fff', border: '1.5px solid #e2e5e9', outline: 'none',
            }}
          />
          {isFetching && (
            <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          )}
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
            <button type="button" onClick={handleImportClick} style={btnStyle} disabled={importing}
              onMouseEnter={e => { if (!importing) { e.currentTarget.style.background = '#f7f9fb'; e.currentTarget.style.color = '#0d1117'; } }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#6b7280'; }}
            >
              {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} {importing ? 'A importar...' : 'Importar'}
            </button>
          )}
          <button type="button" onClick={handleCreate} style={{ ...btnStyle, background: '#0d1117', color: '#fff', border: '1.5px solid #0d1117' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#000'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#0d1117'; }}
          >
            <Plus size={18} /> Novo Cliente
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div ref={statusRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setStatusOpen(o => !o)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', fontSize: 13, fontWeight: 500,
              fontFamily: "'Poppins',sans-serif",
              border: '1.5px solid #e2e5e9', background: '#fff', color: '#0d1117',
              outline: 'none', cursor: 'pointer', transition: 'all .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#0d1117'; }}
            onMouseLeave={e => { if (!statusOpen) e.currentTarget.style.borderColor = '#e2e5e9'; }}
          >
            <span style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: statusFilter === '' ? '#9ca3af'
                : statusFilter === 'active' ? '#0d1117'
                : statusFilter === 'lead' ? '#f59e0b' : '#ef4444',
            }} />
            {statusOptions.find(o => o.value === statusFilter)?.label || 'Todos os status'}
            <ChevronDown
              size={15}
              color="#6b7280"
              style={{ transition: 'transform .2s', transform: statusOpen ? 'rotate(180deg)' : 'none', marginLeft: 2 }}
            />
          </button>

          {statusOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, minWidth: 190,
              background: '#fff', border: '1px solid #e2e5e9', zIndex: 20,
              boxShadow: '0 12px 32px rgba(0,0,0,0.12)', padding: 6,
              fontFamily: "'Poppins',sans-serif",
            }}>
              {statusOptions.map(opt => {
                const selected = statusFilter === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setStatusFilter(opt.value); setStatusOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%', padding: '9px 12px', border: 'none', background: 'transparent',
                      fontSize: 13, cursor: 'pointer', textAlign: 'left',
                      color: selected ? '#0d1117' : '#4b5563', fontWeight: selected ? 600 : 400,
                      fontFamily: "'Poppins',sans-serif", transition: 'background .15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f7f9fb'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: opt.value === '' ? '#9ca3af'
                        : opt.value === 'active' ? '#0d1117'
                        : opt.value === 'lead' ? '#f59e0b' : '#ef4444',
                    }} />
                    <span style={{ flex: 1 }}>{opt.label}</span>
                    {selected && <Check size={15} color="#0d1117" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
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
            Clientes e Contactos ({totalCount})
          </h2>
          {totalCount > 0 && (
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              {totalCount} de {limits.maxClients === Infinity ? 'ilimitados' : limits.maxClients} utilizados
            </span>
          )}
        </div>

        {showEmptyState ? (
          <div style={{ padding: '70px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(13,17,23,0.08)', color: '#0d1117',
            }}>
              <Users size={32} />
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#0d1117' }}>Ainda não tens clientes</p>
              <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4, maxWidth: 340 }}>
                Cria o teu primeiro cliente ou importa a tua lista de contactos para começar a gerir os teus contratos.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={handleCreate}
                style={{ ...btnStyle, background: '#0d1117', color: '#fff', border: '1.5px solid #0d1117' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#000'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#0d1117'; }}
              >
                <Plus size={16} /> Novo Cliente
              </button>
              {canImport && (
                <button type="button" onClick={handleImportClick} style={btnStyle}>
                  <Upload size={16} /> Importar CSV
                </button>
              )}
            </div>
          </div>
        ) : (
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
                {filtered.length > 0 ? filtered.map(client => {
                  const statusInfo = STATUS_LABELS[client.status] || STATUS_LABELS.inactive;
                  return (
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
                        <span style={{ padding: '3px 10px', fontSize: 11, fontWeight: 600, background: statusInfo.bg, color: statusInfo.color }}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 24px', color: '#6b7280', fontSize: 12 }}>
                        {canUseCategory ? (client.category || '-') : '-'}
                      </td>
                      <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                          <button onClick={() => navigate(`/clients/${client.id}`)} style={iconBtnStyle} title="Ver cliente">
                            <Eye size={15} />
                          </button>
                          <button onClick={() => navigate(`/clients/${client.id}/edit`)} style={iconBtnStyle} title="Editar">
                            <FileEdit size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(client)}
                            style={{ ...iconBtnStyle, color: '#ef4444' }}
                            title="Eliminar"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={6} style={{ padding: '60px 24px', textAlign: 'center', color: '#6b7280' }}>
                      {searchTerm || statusFilter || selectedTags.length > 0
                        ? 'Nenhum cliente corresponde aos filtros aplicados'
                        : 'Nenhum cliente cadastrado'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            gap: 12, padding: '16px 24px', borderTop: '1px solid #e2e5e9',
            background: 'rgba(255,255,255,0.6)'
          }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              style={{
                padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: page > 1 ? 'pointer' : 'default',
                border: '1.5px solid #e2e5e9', background: page > 1 ? '#fff' : '#f7f9fb',
                color: page > 1 ? '#0d1117' : '#9ca3af', fontFamily: "'Poppins',sans-serif"
              }}
            >Anterior</button>
            <span style={{ fontSize: 13, color: '#6b7280' }}>Página {page} de {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              style={{
                padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: page < totalPages ? 'pointer' : 'default',
                border: '1.5px solid #e2e5e9', background: page < totalPages ? '#fff' : '#f7f9fb',
                color: page < totalPages ? '#0d1117' : '#9ca3af', fontFamily: "'Poppins',sans-serif"
              }}
            >Seguinte</button>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={() => { if (!deleting) setDeleteTarget(null); }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', width: '100%', maxWidth: 420, padding: 28,
              fontFamily: "'Poppins',sans-serif",
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0d1117' }}>Eliminar cliente</h3>
              <button onClick={() => { if (!deleting) setDeleteTarget(null); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 2 }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
              Tens a certeza que pretendes eliminar <strong style={{ color: '#0d1117' }}>{deleteTarget.name}</strong>?
              Esta acção é irreversível.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                style={{
                  padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  border: '1.5px solid #e2e5e9', background: '#fff', color: '#6b7280',
                  fontFamily: "'Poppins',sans-serif",
                }}
              >Cancelar</button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  border: '1.5px solid #ef4444', background: '#ef4444', color: '#fff',
                  fontFamily: "'Poppins',sans-serif",
                }}
              >
                {deleting && <Loader2 size={15} className="animate-spin" />}
                {deleting ? 'A eliminar...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
