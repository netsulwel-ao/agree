import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Clock, Send, CheckCircle2, Ban, MessageSquare, AlertTriangle, Trash2, Filter } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  reference_id?: string;
  reference_type?: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setNotifications(data);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('Todas marcadas como lidas');
  };

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleClick = (n: Notification) => {
    if (!n.read) markAsRead(n.id);
    if (n.reference_id && n.reference_type === 'contract') {
      navigate(`/contracts/${n.reference_id}`);
    }
  };

  const getIcon = (type: string) => {
    const map: Record<string, React.ReactNode> = {
      contract_approved: <CheckCircle2 size={18} color="#0d1117" />,
      contract_rejected: <Ban size={18} color="#ef4444" />,
      approval_requested: <Send size={18} color="#f59e0b" />,
      contract_expiring: <Clock size={18} color="#f59e0b" />,
      contract_shared: <MessageSquare size={18} color="#0d1117" />,
    };
    return map[type] || <Bell size={18} color="#6b7280" />;
  };

  const displayed = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;
  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, fontFamily: "'Poppins',sans-serif" }}>
        <Bell size={24} style={{ color: '#9ca3af' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: "'Poppins',sans-serif" }}>
      <div style={{
        background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(30px)',
        border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid #e2e5e9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(255,255,255,0.6)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0d1117' }}>Notificações</h2>
            {unreadCount > 0 && (
              <span style={{
                background: '#0d1117', color: '#fff', fontSize: 11, fontWeight: 700,
                padding: '2px 8px', borderRadius: 20
              }}>
                {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as any)}
              style={{
                padding: '6px 12px', fontSize: 12, fontWeight: 600, fontFamily: "'Poppins',sans-serif",
                background: '#fff', border: '1px solid #e2e5e9', color: '#0d1117', outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">Todas</option>
              <option value="unread">Não lidas</option>
            </select>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                fontSize: 12, fontWeight: 600, background: '#fff', border: '1px solid #e2e5e9',
                color: '#0d1117', cursor: 'pointer', fontFamily: "'Poppins',sans-serif"
              }}>
                <CheckCheck size={14} /> Marcar todas
              </button>
            )}
          </div>
        </div>

        {displayed.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={48} style={{ color: '#d1d5db', marginBottom: 12 }} />
            <p style={{ color: '#9ca3af', fontSize: 14, margin: 0 }}>
              {filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {displayed.map((n, i) => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                style={{
                  display: 'flex', gap: 14, padding: '16px 24px',
                  borderBottom: i < displayed.length - 1 ? '1px solid #e2e5e9' : 'none',
                  background: n.read ? '#fff' : 'rgba(13,17,23,0.02)',
                  cursor: n.reference_id ? 'pointer' : 'default',
                  transition: 'background .15s',
                  opacity: n.read ? 0.7 : 1
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f7f9fb'; }}
                onMouseLeave={e => { e.currentTarget.style.background = n.read ? '#fff' : 'rgba(13,17,23,0.02)'; }}
              >
                <div style={{ marginTop: 2, flexShrink: 0 }}>
                  {getIcon(n.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#0d1117' }}>{n.title}</span>
                      {!n.read && (
                        <span style={{
                          display: 'inline-block', width: 6, height: 6, background: '#0d1117',
                          borderRadius: '50%', marginLeft: 8, verticalAlign: 'middle'
                        }} />
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      {!n.read && (
                        <button onClick={e => { e.stopPropagation(); markAsRead(n.id); }}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}
                          title="Marcar como lida">
                          <CheckCheck size={14} />
                        </button>
                      )}
                      <button onClick={e => { e.stopPropagation(); deleteNotification(n.id); }}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}
                        title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: '#6b7280', marginTop: 2, lineHeight: 1.4 }}>{n.message}</p>
                  <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                    {n.created_at ? format(parseISO(n.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR }) : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
