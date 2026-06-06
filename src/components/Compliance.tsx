import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  ShieldCheck, 
  Lock, 
  History, 
  Users, 
  FileCheck, 
  AlertTriangle,
  UserCheck,
  Key,
  Download,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

export default function Compliance() {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>('user');
  const [activeTab, setActiveTab] = useState<'audit' | 'permissions' | 'compliance'>('audit');

  useEffect(() => {
    if (user) {
      const init = async () => {
        try {
          // Add timeout for profile query
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Profile query timeout after 15s')), 15000);
          });

          const queryPromise = supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          const { data: profile, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

          const role = profile?.role || 'user';
          setCurrentUserRole(role);

          // Logs: admin vê todos, user vê só os seus
          await fetchLogs(role);

          // Perfis: só admin vê todos os utilizadores
          if (role === 'admin') {
            await fetchProfiles();
          } else {
            // User normal só vê o seu próprio perfil
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id);
            setUsers(data || []);
          }
        } catch (err) {
          console.error("Error initializing compliance:", err);
          // Use default role on error
          setCurrentUserRole('user');
        }
      };
      init();

      const logsChannel = supabase
        .channel('audit_logs_changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, () => {
          fetchLogs(currentUserRole);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(logsChannel);
      };
    }
  }, [user]);

  const fetchLogs = async (role: string) => {
    if (!user) return;
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);

    // User normal só vê os seus próprios logs
    if (role !== 'admin') {
      query = query.eq('user_id', user.id);
    }

    const { data } = await query;
    setAuditLogs(data || []);
  };

  const fetchProfiles = async () => {
    const { data } = await supabase.from('profiles').select('*');
    setUsers(data || []);
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    if (currentUserRole !== 'admin') {
      toast.error("Apenas administradores podem alterar permissões");
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      toast.success("Permissão atualizada com sucesso");
    } catch (error) {
      toast.error("Erro ao atualizar permissão");
    }
  };



  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
      fontFamily: "'Poppins', sans-serif"
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <h1 style={{
            fontSize: 24,
            fontWeight: 800,
            color: '#0d1117',
            marginBottom: 4,
            fontFamily: "'Poppins',sans-serif"
          }}>
            Compliance & Segurança
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', fontFamily: "'Poppins',sans-serif" }}>
            Gerencie permissões e visualize logs de auditoria
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 8,
        borderBottom: '1px solid #e2e5e9'
      }}>
        {[
          { id: 'audit', label: 'Logs de Auditoria', icon: History },
          { id: 'permissions', label: 'Permissões', icon: Lock },
          { id: 'compliance', label: 'Compliance', icon: ShieldCheck }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '12px 20px',
              background: 'transparent',
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              color: activeTab === tab.id ? '#0d1117' : '#6b7280',
              cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '2px solid #0d1117' : '2px solid transparent',
              transition: 'all .2s',
              fontFamily: "'Poppins',sans-serif",
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ minHeight: 400 }}>
        {activeTab === 'audit' && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.35)',
          borderRadius: 24,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e5e9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#0d1117',
                fontFamily: "'Poppins',sans-serif"
              }}>
                Logs de Auditoria
              </h2>
              {/*<button style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                background: '#fff',
                border: '1.5px solid #e2e5e9',
                color: '#6b7280',
                cursor: 'pointer',
                transition: 'all .2s',
                fontFamily: "'Poppins',sans-serif"
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#f7f9fb';
                  e.currentTarget.style.color = '#0d1117';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#fff';
                  e.currentTarget.style.color = '#6b7280';
                }}
              >
                <Download size={16} />
                Exportar
              </button>*/}
            </div>
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              {auditLogs.map((log, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  padding: '16px 24px',
                  borderBottom: '1px solid #e2e5e9'
                }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 0,
                    background: log.status === 'success' ? 'rgba(13,17,23,0.1)' : 'rgba(239,68,68,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {log.status === 'success' ? 
                      <CheckCircle2 size={18} color="#0d1117" /> : 
                      <AlertTriangle size={18} color="#ef4444" />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div>
                        <p style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: '#0d1117',
                          marginBottom: 2,
                          fontFamily: "'Poppins',sans-serif"
                        }}>
                          {log.action}
                        </p>
                        <p style={{
                          fontSize: 12,
                          color: '#6b7280',
                          fontFamily: "'Poppins',sans-serif"
                        }}>
                          {log.resource} • {log.user_name}
                        </p>
                      </div>
                      <span style={{
                        fontSize: 11,
                        color: '#9ca3af',
                        flexShrink: 0,
                        fontFamily: "'Poppins',sans-serif"
                      }}>
                        {format(parseISO(log.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'permissions' && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.35)',
          borderRadius: 24,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e5e9'
            }}>
              <h2 style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#0d1117',
                fontFamily: "'Poppins',sans-serif"
              }}>
                Utilizadores e Permissões
              </h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontFamily: "'Poppins',sans-serif",
                fontSize: 13
              }}>
                <thead>
                  <tr style={{ background: '#f7f9fb', borderBottom: '1px solid #e2e5e9' }}>
                    <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Utilizador</th>
                    <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Email</th>
                    <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Role</th>
                    <th style={{ textAlign: 'right', padding: '12px 24px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #e2e5e9' }}>
                      <td style={{ padding: '14px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 0,
                            background: '#0d1117',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 13,
                            fontWeight: 700,
                            fontFamily: "'Poppins',sans-serif"
                          }}>
                            {u.name?.charAt(0).toUpperCase() || u.email?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <span style={{ fontWeight: 500, color: '#0d1117', fontFamily: "'Poppins',sans-serif" }}>
                            {u.name || u.email?.split('@')[0]}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 24px', color: '#6b7280', fontFamily: "'Poppins',sans-serif" }}>
                        {u.email}
                      </td>
                      <td style={{ padding: '14px 24px' }}>
                        <span style={{
                          padding: '4px 12px',
                          fontSize: 11,
                          fontWeight: 600,
                          background: u.role === 'admin' ? 'rgba(13,17,23,0.1)' : '#f7f9fb',
                          color: u.role === 'admin' ? '#0d1117' : '#6b7280',
                          fontFamily: "'Poppins',sans-serif"
                        }}>
                          {u.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                        {currentUserRole === 'admin' && u.id !== user?.id && (
                          <select
                            value={u.role}
                            onChange={(e) => updateUserRole(u.id, e.target.value)}
                            style={{
                              padding: '6px 12px',
                              fontSize: 12,
                              background: '#fff',
                              border: '1px solid #e2e5e9',
                              borderRadius: 0,
                              outline: 'none',
                              fontFamily: "'Poppins',sans-serif"
                            }}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 20
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.45)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              borderRadius: 20,
              padding: 24
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'rgba(13,17,23,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16
              }}>
                <ShieldCheck size={20} color="#0d1117" />
              </div>
              <h3 style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#0d1117',
                marginBottom: 8,
                fontFamily: "'Poppins',sans-serif"
              }}>
                LGPD
              </h3>
              <p style={{
                fontSize: 14,
                color: '#6b7280',
                marginBottom: 16,
                fontFamily: "'Poppins',sans-serif"
              }}>
                Conforme com a Lei Geral de Proteção de Dados
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#0d1117',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "'Poppins',sans-serif"
              }}>
                <CheckCircle2 size={16} />
                Conforme
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.45)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              borderRadius: 20,
              padding: 24
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'rgba(13,17,23,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16
              }}>
                <Key size={20} color="#0d1117" />
              </div>
              <h3 style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#0d1117',
                marginBottom: 8,
                fontFamily: "'Poppins',sans-serif"
              }}>
                Assinaturas Digitais
              </h3>
              <p style={{
                fontSize: 14,
                color: '#6b7280',
                marginBottom: 16,
                fontFamily: "'Poppins',sans-serif"
              }}>
                Assinaturas com validade jurídica
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#0d1117',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "'Poppins',sans-serif"
              }}>
                <CheckCircle2 size={16} />
                Conforme
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.45)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              borderRadius: 20,
              padding: 24
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'rgba(13,17,23,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16
              }}>
                <Lock size={20} color="#0d1117" />
              </div>
              <h3 style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#0d1117',
                marginBottom: 8,
                fontFamily: "'Poppins',sans-serif"
              }}>
                Encriptação de Dados
              </h3>
              <p style={{
                fontSize: 14,
                color: '#6b7280',
                marginBottom: 16,
                fontFamily: "'Poppins',sans-serif"
              }}>
                Dados criptografados em trânsito e em repouso
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#0d1117',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "'Poppins',sans-serif"
              }}>
                <CheckCircle2 size={16} />
                Conforme
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.45)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              borderRadius: 20,
              padding: 24
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'rgba(13,17,23,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16
              }}>
                <History size={20} color="#0d1117" />
              </div>
              <h3 style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#0d1117',
                marginBottom: 8,
                fontFamily: "'Poppins',sans-serif"
              }}>
                Retenção Segura
              </h3>
              <p style={{
                fontSize: 14,
                color: '#6b7280',
                marginBottom: 16,
                fontFamily: "'Poppins',sans-serif"
              }}>
                Retenção segura de todos os registos
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#0d1117',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "'Poppins',sans-serif"
              }}>
                <CheckCircle2 size={16} />
                Conforme
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.45)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              borderRadius: 20,
              padding: 24
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'rgba(13,17,23,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16
              }}>
                <FileCheck size={20} color="#0d1117" />
              </div>
              <h3 style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#0d1117',
                marginBottom: 8,
                fontFamily: "'Poppins',sans-serif"
              }}>
                Auditoria Contínua
              </h3>
              <p style={{
                fontSize: 14,
                color: '#6b7280',
                marginBottom: 16,
                fontFamily: "'Poppins',sans-serif"
              }}>
                Todas as ações são registadas em log de auditoria
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#0d1117',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "'Poppins',sans-serif"
              }}>
                <CheckCircle2 size={16} />
                Conforme
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.45)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              borderRadius: 20,
              padding: 24
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'rgba(13,17,23,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16
              }}>
                <UserCheck size={20} color="#0d1117" />
              </div>
              <h3 style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#0d1117',
                marginBottom: 8,
                fontFamily: "'Poppins',sans-serif"
              }}>
                Controlo de Acessos
              </h3>
              <p style={{
                fontSize: 14,
                color: '#6b7280',
                marginBottom: 16,
                fontFamily: "'Poppins',sans-serif"
              }}>
                Sistema de roles e permissões granulares
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#0d1117',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "'Poppins',sans-serif"
              }}>
                <CheckCircle2 size={16} />
                Conforme
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
