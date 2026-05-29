import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Search, Shield, ShieldOff, RotateCw, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';

interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  is_blocked: boolean;
  created_at?: string;
}

export default function AdminUsers() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar utilizadores: ' + error.message);
      return;
    }
    setProfiles(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isAdmin) {
      navigate('/dashboard', { replace: true });
      return;
    }
    fetchProfiles();
  }, [user, isAdmin, authLoading, navigate, fetchProfiles]);

  const updateRole = async (profileId: string, newRole: string) => {
    setUpdatingId(profileId);
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', profileId);

    if (error) {
      toast.error('Erro ao atualizar role: ' + error.message);
    } else {
      toast.success('Role atualizado com sucesso');
      setProfiles(prev =>
        prev.map(p => (p.id === profileId ? { ...p, role: newRole } : p))
      );
    }
    setUpdatingId(null);
  };

  const toggleBlock = async (profile: Profile) => {
    setUpdatingId(profile.id);
    const newBlocked = !profile.is_blocked;
    const { error } = await supabase
      .from('profiles')
      .update({ is_blocked: newBlocked })
      .eq('id', profile.id);

    if (error) {
      toast.error('Erro ao atualizar estado: ' + error.message);
    } else {
      toast.success(newBlocked ? 'Utilizador bloqueado' : 'Utilizador desbloqueado');
      setProfiles(prev =>
        prev.map(p => (p.id === profile.id ? { ...p, is_blocked: newBlocked } : p))
      );
    }
    setUpdatingId(null);
  };

  const filtered = profiles.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      p.role.toLowerCase().includes(q)
    );
  });

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
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 24, flexWrap: 'wrap', gap: 12
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Gestão de Utilizadores</h1>
          <p style={{ fontSize: 13, color: '#6b7280' }}>
            {profiles.length} utilizador{profiles.length !== 1 ? 'es' : ''} registado{profiles.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ position: 'relative', minWidth: 260 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar por nome, email ou role..."
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
          A carregar utilizadores...
        </div>
      ) : (
        <div style={{
          background: '#fff', borderRadius: 16,
          border: '1px solid #e2e5e9', overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e5e9', background: '#f9fafb' }}>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: '#6b7280' }}>Utilizador</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: '#6b7280' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: '#6b7280' }}>Role</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: '#6b7280' }}>Estado</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: '#6b7280' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
                      {search ? 'Nenhum utilizador encontrado para esta pesquisa.' : 'Nenhum utilizador registado.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f0f2f5', transition: 'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: p.role === 'admin' ? '#0d1117' : '#e2e5e9',
                            color: p.role === 'admin' ? '#fff' : '#374151',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 700
                          }}>
                            {(p.name || p.email || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0d1117' }}>{p.name || '—'}</div>
                            {p.id === user?.id && (
                              <span style={{ fontSize: 10, color: '#6b7280' }}>(tu)</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#6b7280' }}>{p.email || '—'}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <select
                          value={p.role}
                          onChange={e => updateRole(p.id, e.target.value)}
                          disabled={updatingId === p.id || p.id === user?.id}
                          style={{
                            padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e5e9',
                            fontSize: 12, background: '#fff', cursor: 'pointer',
                            fontFamily: "'Poppins', sans-serif", fontWeight: 500,
                            color: p.role === 'admin' ? '#0d1117' : '#6b7280'
                          }}
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        {p.is_blocked ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                            background: '#fef2f2', color: '#ef4444'
                          }}>
                            <UserX size={12} /> Bloqueado
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                            background: '#f0fdf4', color: '#22c55e'
                          }}>
                            <UserCheck size={12} /> Ativo
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          {p.role !== 'admin' && (
                            <button
                              onClick={() => updateRole(p.id, 'admin')}
                              disabled={updatingId === p.id || p.id === user?.id}
                              title="Promover a admin"
                              style={{
                                padding: '6px 10px', borderRadius: 8,
                                border: '1px solid #e2e5e9', background: '#fff',
                                cursor: 'pointer', color: '#0d1117', fontSize: 12,
                                display: 'flex', alignItems: 'center', gap: 4,
                                fontFamily: "'Poppins', sans-serif"
                              }}
                            >
                              <Shield size={14} /> Admin
                            </button>
                          )}
                          {p.id !== user?.id && (
                            <button
                              onClick={() => toggleBlock(p)}
                              disabled={updatingId === p.id}
                              title={p.is_blocked ? 'Desbloquear' : 'Bloquear'}
                              style={{
                                padding: '6px 10px', borderRadius: 8,
                                border: '1px solid #e2e5e9', background: '#fff',
                                cursor: 'pointer',
                                color: p.is_blocked ? '#22c55e' : '#ef4444',
                                fontSize: 12, display: 'flex', alignItems: 'center', gap: 4,
                                fontFamily: "'Poppins', sans-serif"
                              }}
                            >
                              {p.is_blocked ? <ShieldOff size={14} /> : <Shield size={14} />}
                              {p.is_blocked ? 'Desbloquear' : 'Bloquear'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
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
