import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { RotateCw, ArrowUpRight, ArrowDownRight, RefreshCw, Shield, Search } from 'lucide-react';
import { toast } from 'sonner';

interface PlanChange {
  id: string;
  user_id: string;
  old_plan: string | null;
  new_plan: string;
  change_type: 'upgrade' | 'renewal' | 'downgrade' | 'admin_change';
  changed_by: string | null;
  created_at: string;
  profiles?: { name: string | null; email: string | null };
  changer?: { name: string | null };
}

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  upgrade: { label: 'Upgrade', color: '#3b82f6', bg: '#eff6ff' },
  renewal: { label: 'Renovação', color: '#22c55e', bg: '#f0fdf4' },
  downgrade: { label: 'Downgrade', color: '#f59e0b', bg: '#fffbeb' },
  admin_change: { label: 'Alteração admin', color: '#8b5cf6', bg: '#f5f3ff' },
};

export default function AdminPlanHistory() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [changes, setChanges] = useState<PlanChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('plan_history')
      .select('*, profiles!plan_history_user_id_fkey(name, email), changer:profiles!plan_history_changed_by_fkey(name)')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar histórico: ' + error.message);
      setLoading(false);
      return;
    }
    setChanges(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isAdmin) {
      navigate('/dashboard', { replace: true });
      return;
    }
    fetchHistory();
  }, [user, isAdmin, authLoading, navigate, fetchHistory]);

  const filtered = changes.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.profiles?.name || '').toLowerCase().includes(q) ||
      (c.profiles?.email || '').toLowerCase().includes(q) ||
      c.change_type.toLowerCase().includes(q) ||
      c.new_plan.toLowerCase().includes(q) ||
      (c.old_plan || '').toLowerCase().includes(q)
    );
  });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const changeIcon = (type: string) => {
    if (type === 'upgrade') return <ArrowUpRight size={13} color="#3b82f6" />;
    if (type === 'renewal') return <RefreshCw size={13} color="#22c55e" />;
    if (type === 'downgrade') return <ArrowDownRight size={13} color="#f59e0b" />;
    return <Shield size={13} color="#8b5cf6" />;
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: '#6b7280' }}>
        <RotateCw size={24} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} />
        A carregar...
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Histórico de Planos</h1>
          <p style={{ fontSize: 13, color: '#6b7280' }}>
            {changes.length} alteraç{changes.length !== 1 ? 'ões' : 'ão'} registada{changes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ position: 'relative', minWidth: 250 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar por utilizador, plano..."
            style={{
              width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10,
              border: '1px solid #e2e5e9', fontSize: 13, outline: 'none',
              background: '#fff', fontFamily: "'Poppins', sans-serif"
            }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, color: '#6b7280' }}>
          <RotateCw size={20} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} />
          A carregar histórico...
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e5e9', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 800 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e5e9', background: '#f9fafb' }}>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: '#6b7280' }}>Utilizador</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: '#6b7280' }}>Alteração</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: '#6b7280' }}>Tipo</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: '#6b7280' }}>Por</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: '#6b7280' }}>Data</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
                      Nenhuma alteração encontrada.
                    </td>
                  </tr>
                ) : (
                  filtered.map(c => {
                    const t = TYPE_LABELS[c.change_type] || { label: c.change_type, color: '#6b7280', bg: '#f9fafb' };
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid #f0f2f5', transition: 'background .15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e2e5e9', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                              {(c.profiles?.name || c.profiles?.email || '?')[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#0d1117' }}>{c.profiles?.name || '—'}</div>
                              <div style={{ fontSize: 11, color: '#9ca3af' }}>{c.profiles?.email || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12 }}>{c.old_plan || '—'}</span>
                            <span style={{ color: '#9ca3af' }}>→</span>
                            <span style={{ fontWeight: 700, color: '#0d1117' }}>{c.new_plan}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', fontSize: 11, fontWeight: 600, background: t.bg, color: t.color }}>
                            {changeIcon(c.change_type)} {t.label}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: 12 }}>
                          {c.changer?.name || (c.changed_by ? 'Admin' : 'Sistema')}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: 12 }}>{formatDate(c.created_at)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}