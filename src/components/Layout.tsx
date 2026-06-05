import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCheckoutModal } from '../contexts/CheckoutModalContext';
import CheckoutModal from './CheckoutModal';
import { Toaster, toast } from 'sonner';
import {
  LayoutDashboard, FileText, PlusCircle, LogOut,
  Bell, Menu, X, BarChart3, ShieldCheck,
  AlertTriangle, PenLine, Shield, CreditCard, Settings, RefreshCw, Users, CheckCheck,
  MessageSquare, Clock, Send, CheckCircle2, Ban, BookTemplate, ThumbsUp, DollarSign, Activity
} from 'lucide-react';
import { addDays, isBefore, isAfter, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AgreeLogo from '../Agree-logo.svg';

interface AlertContract {
  id?: string;
  title?: string | null;
  end_date: string | null;
  risk_level: string | null;
  status: string | null;
}

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

export default function Layout() {
  const [alertCount, setAlertCount] = useState(0);
  const [alerts, setAlerts] = useState<AlertContract[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { user, signOut, isAdmin, plan, planExpiresAt } = useAuth();
  const { openCheckout, openRenewal } = useCheckoutModal();
  const location = useLocation();
  const navigate = useNavigate();

  // Abrir checkout modal se vindo da landing page
  useEffect(() => {
    const planParam = sessionStorage.getItem('openCheckoutOnLogin');
    if (planParam) {
      sessionStorage.removeItem('openCheckoutOnLogin');
      openCheckout(planParam as any);
    }
  }, [user]);

  // Buscar alertas críticos para o badge
  useEffect(() => {
    if (!user) return;
    const fetchAlerts = async () => {
      const { data } = await supabase
        .from('contracts')
        .select('id, title, end_date, risk_level, status')
        .eq('owner_id', user.id);

      if (!data) {
        setAlertCount(0);
        setAlerts([]);
        return;
      }
      const today = new Date();
      const in30 = addDays(today, 30);

      const flagged = data.filter(c => {
        const expiring = c.end_date && isAfter(parseISO(c.end_date), today) && isBefore(parseISO(c.end_date), in30);
        const expired = c.end_date && isBefore(parseISO(c.end_date), today) && c.status !== 'rejected';
        const highRisk = c.risk_level === 'high';
        return expiring || expired || highRisk;
      });

      setAlertCount(flagged.length);
      setAlerts(flagged);
    };
    fetchAlerts();
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('Notificações marcadas como lidas');
  }, [user]);

  // Buscar notificações do sistema
  useEffect(() => {
    if (!user) return;

    const checkExpiring = async () => {
      try {
        await supabase.rpc('insert_expiry_notifications');
      } catch {}
    };
    checkExpiring();

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setNotifications(data);
      }
    };
    fetchNotifications();

    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          setNotifications(prev => [payload.new, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    const expiryInterval = setInterval(checkExpiring, 60 * 60 * 1000);

    return () => { supabase.removeChannel(channel); clearInterval(expiryInterval); };
  }, [user]);

  // Mobile detection
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(e.matches);
    handler(mq);
    mq.addEventListener('change', handler as any);
    return () => mq.removeEventListener('change', handler as any);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'clients', label: 'Clientes', icon: Users, path: '/clients' },
    { id: 'contracts', label: 'Meus Contratos', icon: FileText, path: '/contracts' },
    { id: 'invoices', label: 'Facturação', icon: DollarSign, path: '/invoices' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
    { id: 'signatures', label: 'Assinaturas', icon: PenLine, path: '/signatures' },
    { id: 'approvals', label: 'Aprovações', icon: ThumbsUp, path: '/approvals' },
    { id: 'templates', label: 'Modelos', icon: BookTemplate, path: '/templates' },
    { id: 'compliance', label: 'Segurança', icon: ShieldCheck, path: '/compliance' },
    { id: 'create', label: 'Novo Contrato', icon: PlusCircle, path: '/contracts/new' },
  ];

  if (isAdmin) {
    navItems.push({ id: 'admin', label: 'Admin', icon: Shield, path: '/admin/users' });
    navItems.push({ id: 'payments', label: 'Pagamentos', icon: CreditCard, path: '/admin/payments' });
    navItems.push({ id: 'plan-history', label: 'Histórico Planos', icon: RefreshCw, path: '/admin/plan-history' });
    navItems.push({ id: 'settings', label: 'Definições', icon: Settings, path: '/admin/settings' });
    navItems.push({ id: 'approval-workflows', label: 'Workflows Aprov.', icon: ThumbsUp, path: '/admin/approval-workflows' });
    navItems.push({ id: 'audit-logs', label: 'Auditoria', icon: Activity, path: '/admin/audit-logs' });
  }

  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';
  const avatarLetter = displayName.charAt(0).toUpperCase();
  
  const currentNav = navItems.find(i => location.pathname.startsWith(i.path));

  const unreadNotifications = notifications.filter(n => !n.read);
  const totalAlerts = alertCount + unreadNotifications.length;

  return (
    <div style={{
      fontFamily: "'Poppins', sans-serif",
      background: 'linear-gradient(135deg, #fafafa 0%, #f3f4f6 100%)',
      color: '#0d1117',
      height: '100vh',
      display: 'flex',
      flexDirection: 'row',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --accent: #0d1117; --accent-dark: #000000; --accent-light: #f0f0f0;
          --border: rgba(226, 229, 233, 0.6);
        }
        .alerts-panel {
          position: absolute;
          top: 90px;
          right: 32px;
          width: 340px;
          max-height: 360px;
          background: #0d1117;
          color: #f9fafb;
          border-radius: 18px;
          border: 1px solid rgba(148,163,184,0.4);
          box-shadow: 0 18px 45px rgba(0,0,0,0.45);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          z-index: 50;
        }
        .alerts-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 4px;
        }
        .alerts-panel-title {
          font-size: 14px;
          font-weight: 600;
          letter-spacing: .02em;
        }
        .alerts-panel-count {
          font-size: 11px;
          color: rgba(249,250,251,0.6);
        }
        .alerts-list {
          margin-top: 4px;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
          overflow-y: auto;
        }
        .alerts-item {
          border-radius: 12px;
          padding: 10px 11px;
          background: rgba(15,23,42,0.85);
          border: 1px solid rgba(148,163,184,0.35);
        }
        .alerts-item.expired { border-color: rgba(248,113,113,0.7); }
        .alerts-item.expiring { border-color: rgba(250,204,21,0.8); }
        .alerts-item.risky { border-color: rgba(96,165,250,0.8); }
        .alerts-item-title {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 2px;
        }
        .alerts-item-meta {
          font-size: 11px;
          color: rgba(148,163,184,0.9);
          display: flex;
          justify-content: space-between;
          gap: 6px;
        }
        .alerts-empty {
          font-size: 12px;
          color: rgba(148,163,184,0.9);
        }
        .sidebar .nav-link {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 18px; font-size: 14px; font-weight: 500;
          color: rgba(255,255,255,0.55); border-radius: 14px; transition: all .2s;
          width: 100%; cursor: pointer; border: none; text-decoration: none;
          background: transparent; font-family: 'Poppins', sans-serif;
          position: relative;
        }
        .sidebar .nav-link:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .sidebar .nav-link.active {
          background: rgba(255,255,255,0.12); color: #fff;
          font-weight: 600;
        }
        .sidebar .nav-link-logout { color: #f87171 !important; }
        .sidebar .nav-link-logout:hover {
          color: #fca5a5 !important;
          background: rgba(239,68,68,0.2) !important;
        }
        .sidebar-nav::-webkit-scrollbar { width: 4px; }
        .sidebar-nav::-webkit-scrollbar-track { background: transparent; }
        .sidebar-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
        .sidebar-nav::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
        @media (max-width: 768px) {
          .sidebar-desktop { transform: translateX(-100%); transition: transform 0.3s ease; }
          .sidebar-desktop.open { transform: translateX(0); }
          .sidebar-overlay { display: block; }
          .main-content { margin-left: 0 !important; padding: 12px !important; }
          .header-desktop { padding: 14px 16px !important; border-radius: 14px !important; }
          .header-desktop h2 { font-size: 16px !important; }
          .header-desktop p { font-size: 12px !important; }
          .alerts-panel-mobile { width: calc(100vw - 32px) !important; right: 16px !important; top: 80px !important; max-height: 70vh !important; }
          .responsive-table { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .responsive-table table { min-width: 600px; }
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
          input, select, textarea, button { font-size: 16px !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr !important; }
          .sidebar-desktop { width: 100% !important; }
        }
        .sidebar-desktop { transition: transform 0.3s ease; }
      `}</style>

      {/* Background blobs */}
      <div style={{ position: 'absolute', top: -150, left: -150, width: 600, height: 600, background: 'radial-gradient(circle, rgba(13,17,23,0.15) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -200, right: -150, width: 700, height: 700, background: 'radial-gradient(circle, rgba(13,17,23,0.1) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }} />

      <Toaster position="top-right" richColors />

      {/* Mobile overlay */}
      {isMobile && mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 39, backdropFilter: 'blur(4px)'
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar sidebar-desktop ${mobileSidebarOpen ? 'open' : ''}`}
        style={{
          width: isMobile ? 280 : 260,
          background: '#0d1117',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          boxShadow: isMobile && mobileSidebarOpen ? '0 0 40px rgba(0,0,0,0.4)' : '4px 0 24px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 40,
        }}
      >
        {/* Topo fixo — Logo */}
        <div style={{ padding: '32px 28px 8px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} aria-label="Agree">
            <img
              src={AgreeLogo}
              alt=""
              style={{ height: 36, display: 'block', filter: 'brightness(0) invert(1)' }}
            />
            <span style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: 23,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: -0.5,
              lineHeight: 1,
              marginLeft: -2,
            }}>Agree</span>
          </div>
        </div>

        {/* Meio scrollável — Nav */}
        <nav className="sidebar-nav" style={{
          display: 'flex', flexDirection: 'column', gap: 10,
          flex: 1, overflowY: 'auto', minHeight: 0,
          padding: '20px 28px',
        }}>
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`nav-link ${(location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path))) ? 'active' : ''}`}
            >
              <item.icon size={18} />
              {item.label}
              {/* Badge de alertas no Dashboard */}
              {item.id === 'dashboard' && totalAlerts > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 20,
                  fontFamily: "'Poppins',sans-serif",
                  minWidth: 20,
                  textAlign: 'center'
                }}>
                  {alertCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Fundo fixo — User + Logout */}
        <div style={{ padding: '0 28px 28px', flexShrink: 0 }}>
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 18,
            padding: 18,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, fontWeight: 800, color: '#0d1117',
              }}>
                {avatarLetter}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', fontFamily: "'Poppins',sans-serif", marginBottom: 2 }}>
                  {displayName}
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: "'Poppins',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.email}
                </p>
              </div>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
              padding: '8px 14px', borderRadius: 10,
              background: plan === 'enterprise' ? 'rgba(250,204,21,0.15)' : plan === 'pro' ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${
                plan === 'enterprise' ? 'rgba(250,204,21,0.3)' : plan === 'pro' ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)'
              }`,
            }}>
              <span style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em',
                color: plan === 'enterprise' ? '#facc15' : plan === 'pro' ? '#60a5fa' : 'rgba(255,255,255,0.4)',
                flex: 1,
              }}>
                {plan === 'enterprise' ? 'Enterprise' : plan === 'pro' ? 'Pro' : 'Free'}
              </span>
              {plan === 'free' && (
                <span onClick={() => openCheckout()} style={{ fontSize: 10, color: '#60a5fa', fontWeight: 600, cursor: 'pointer' }}>
                  Upgrade
                </span>
              )}
              {plan === 'pro' && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <span onClick={() => openCheckout()} style={{ fontSize: 10, color: '#60a5fa', fontWeight: 600, cursor: 'pointer' }}>
                    Upgrade
                  </span>
                  <span onClick={() => openRenewal('pro')} style={{ fontSize: 10, color: '#22c55e', fontWeight: 600, cursor: 'pointer' }}>
                    Renovar
                  </span>
                </div>
              )}
              {plan === 'enterprise' && (
                <span onClick={() => openRenewal('enterprise')} style={{ fontSize: 10, color: '#22c55e', fontWeight: 600, cursor: 'pointer' }}>
                  Renovar
                </span>
              )}
              </div>
            {planExpiresAt && (plan === 'pro' || plan === 'enterprise') && (
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 16 }}>
                Expira em {new Date(planExpiresAt).toLocaleDateString('pt-PT')}
              </div>
            )}
            <Link
              to="/billing"
              className="nav-link"
              style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, textDecoration: 'none', marginBottom: 10 }}
            >
              <CreditCard size={18} />
              Billing
            </Link>
            <Link
              to="/profile"
              className="nav-link nav-link-logout"
              style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, textDecoration: 'none', marginBottom: 10 }}
            >
              <Settings size={18} />
              Perfil
            </Link>
            <button
              onClick={() => signOut()}
              className="nav-link nav-link-logout"
              style={{ background: 'rgba(239,68,68,0.12)', borderRadius: 10 }}
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content" style={{
        flex: 1, marginLeft: isMobile ? 0 : 260, display: 'flex',
        flexDirection: 'column', height: '100vh', padding: isMobile ? 12 : 24
      }}>
        {/* Top Header */}
        <header className="header-desktop" style={{
          background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255,255,255,0.35)', borderRadius: 20,
          padding: '20px 28px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', position: 'sticky', top: isMobile ? 12 : 24,
          zIndex: 30, marginBottom: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            {isMobile && (
              <button
                onClick={() => setMobileSidebarOpen(true)}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: '#0d1117', padding: 4, display: 'flex',
                }}
              >
                <Menu size={22} />
              </button>
            )}
            <div>
              <h2 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 20, fontWeight: 700, color: '#0d1117', marginBottom: 4 }}>
                {currentNav?.label || 'Detalhes'}
              </h2>
              <p style={{ fontSize: 13, color: '#6b7280', fontFamily: "'Poppins',sans-serif" }}>
                Gerencie os seus contratos com total controlo
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
            <button
              onClick={() => setAlertsOpen(prev => !prev)}
              style={{
                background: totalAlerts > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.5)',
                border: `1px solid ${totalAlerts > 0 ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
                cursor: 'pointer', padding: 10,
                color: totalAlerts > 0 ? '#ef4444' : '#6b7280',
                position: 'relative', borderRadius: 12, transition: 'all .2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = totalAlerts > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.8)'}
              onMouseLeave={e => e.currentTarget.style.background = totalAlerts > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.5)'}
            >
              {totalAlerts > 0 ? <AlertTriangle size={20} /> : <Bell size={20} />}
              {totalAlerts > 0 && (
                <span style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 8, height: 8, background: '#ef4444',
                  borderRadius: '50%', border: '2px solid rgba(255,255,255,0.9)'
                }} />
              )}
            </button>
            {alertsOpen && (
              <div
                className={`alerts-panel ${isMobile ? 'alerts-panel-mobile' : ''}`}
                onClick={e => e.stopPropagation()}
                style={{ width: isMobile ? 'calc(100vw - 32px)' : 380, maxHeight: isMobile ? '70vh' : 480 }}
              >
                <div className="alerts-panel-header">
                  <div>
                    <div className="alerts-panel-title">Notificações</div>
                    <div className="alerts-panel-count">
                      {totalAlerts === 0
                        ? 'Nenhum alerta no momento'
                        : `${totalAlerts} notificaç${totalAlerts > 1 ? 'ões' : 'ão'}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {unreadNotifications.length > 0 && (
                      <button
                        onClick={markAllAsRead}
                        style={{
                          background: 'transparent', border: 'none',
                          color: 'rgba(148,163,184,0.9)', cursor: 'pointer',
                          fontSize: 11, padding: '4px 6px',
                        }}
                        title="Marcar todas como lidas"
                      >
                        <CheckCheck size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => { navigate('/notifications'); setAlertsOpen(false); }}
                      style={{
                        background: 'transparent', border: 'none',
                        color: 'rgba(148,163,184,0.9)', cursor: 'pointer',
                        fontSize: 11, padding: '4px 6px',
                      }}
                      title="Ver todas as notificações"
                    >
                      Ver todas
                    </button>
                    <button
                      onClick={() => setAlertsOpen(false)}
                      style={{
                        background: 'transparent', border: 'none',
                        color: 'rgba(148,163,184,0.9)', cursor: 'pointer',
                        fontSize: 12, padding: '4px 6px',
                      }}
                    >
                      Fechar
                    </button>
                  </div>
                </div>

                {/* Notificações do sistema */}
                {notifications.length > 0 && (
                  <>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(249,250,251,0.5)', letterSpacing: 0.3, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                      <span>NOTIFICAÇÕES</span>
                    </div>
                    <ul className="alerts-list" style={{ marginBottom: 12 }}>
                      {notifications.map(n => {
                        const icon = n.type === 'contract_approved' ? <CheckCircle2 size={14} color="#0d1117" /> :
                                    n.type === 'contract_rejected' ? <Ban size={14} color="#ef4444" /> :
                                    n.type === 'approval_requested' ? <Send size={14} color="#f59e0b" /> :
                                    n.type === 'contract_expiring' ? <Clock size={14} color="#f59e0b" /> :
                                    n.type === 'contract_shared' ? <MessageSquare size={14} color="#0d1117" /> :
                                    <Bell size={14} color="#6b7280" />;
                        return (
                          <li
                            key={n.id}
                            className={`alerts-item ${n.read ? 'read' : ''}`}
                            onClick={() => {
                              if (!n.read) markAsRead(n.id);
                              if (n.reference_id && n.reference_type === 'contract') {
                                navigate(`/contracts/${n.reference_id}`);
                                setAlertsOpen(false);
                              }
                            }}
                            style={{ cursor: n.reference_id ? 'pointer' : 'default', opacity: n.read ? 0.6 : 1 }}
                          >
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                              <div style={{ marginTop: 2 }}>{icon}</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="alerts-item-title" style={{ fontSize: 13 }}>{n.title}</div>
                                <div className="alerts-item-meta" style={{ fontSize: 11 }}>{n.message}</div>
                                <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.6)', marginTop: 4 }}>
                                  {n.created_at ? format(parseISO(n.created_at), "dd/MM 'às' HH:mm", { locale: ptBR }) : ''}
                                </div>
                              </div>
                              {!n.read && (
                                <button
                                  onClick={e => { e.stopPropagation(); markAsRead(n.id); }}
                                  style={{
                                    background: 'transparent', border: 'none',
                                    color: 'rgba(148,163,184,0.6)', cursor: 'pointer',
                                    padding: 2, fontSize: 10, marginTop: 2,
                                  }}
                                  title="Marcar como lida"
                                >
                                  <CheckCheck size={12} />
                                </button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}

                {/* Plan expiry warning */}
                {planExpiresAt && (plan === 'pro' || plan === 'enterprise') && (
                  <>
                    {(() => {
                      const daysLeft = Math.ceil((new Date(planExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      if (daysLeft <= 0) {
                        return (
                          <div className="alerts-item expired" style={{ padding: '10px 11px', marginBottom: 8 }}>
                            <div className="alerts-item-title">Plano expirado</div>
                            <div className="alerts-item-meta">O teu plano {plan === 'enterprise' ? 'Enterprise' : 'Pro'} expirou. Renova para continuares a usar as funcionalidades.</div>
                          </div>
                        );
                      }
                      if (daysLeft <= 7) {
                        return (
                          <div className="alerts-item expiring" style={{ padding: '10px 11px', marginBottom: 8 }}>
                            <div className="alerts-item-title">Plano a expirar</div>
                            <div className="alerts-item-meta">O teu plano {plan === 'enterprise' ? 'Enterprise' : 'Pro'} expira em {daysLeft} dia{daysLeft > 1 ? 's' : ''}.</div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </>
                )}

                {/* Alertas de contratos */}
                {alerts.length > 0 && (
                  <>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(249,250,251,0.5)', letterSpacing: 0.3, marginBottom: 6 }}>ALERTAS DE CONTRATOS</div>
                    <ul className="alerts-list">
                      {alerts.map(alert => {
                        const end = alert.end_date ? parseISO(alert.end_date) : null;
                        const now = new Date();
                        const expired = end && isBefore(end, now);
                        const in30 = end && isAfter(end, now) && isBefore(end, addDays(now, 30));
                        const cls = expired ? 'alerts-item expired' : in30 ? 'alerts-item expiring' : 'alerts-item risky';
                        return (
                          <li key={alert.id || `${alert.end_date}-${alert.status}`} className={cls}>
                            <div className="alerts-item-title">
                              {alert.title || 'Contrato sem título'}
                            </div>
                            <div className="alerts-item-meta">
                              <span>
                                {expired
                                  ? 'Vencido'
                                  : in30
                                  ? 'A vencer em 30 dias'
                                  : 'Risco elevado'}
                              </span>
                              <span>
                                {alert.end_date
                                  ? `Fim: ${new Date(alert.end_date).toLocaleDateString()}`
                                  : 'Sem data de fim'}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}

                {totalAlerts === 0 && (
                  <div className="alerts-empty">
                    Todas as notificações estão em dia.
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </div>
      </main>
      <CheckoutModal />
    </div>
  );
}
