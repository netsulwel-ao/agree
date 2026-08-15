import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCheckoutModal } from '../contexts/CheckoutModalContext';
import CheckoutModal from './CheckoutModal';
import { toast } from 'sonner';
import {
  LayoutDashboard, FileText, PlusCircle, LogOut,
  Bell, Menu, X, BarChart3, ShieldCheck,
  AlertTriangle, PenLine, Shield, CreditCard, Settings, RefreshCw, Users, CheckCheck,
  MessageSquare, Clock, Send, CheckCircle2, Ban, BookTemplate, ThumbsUp, DollarSign, Activity, Building2, Lock,
  ChevronsLeft, ChevronsRight, Search, ChevronRight
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

interface NavItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  children?: { id: string; label: string; icon: any; path: string }[];
}

export default function Layout() {
  const [alertCount, setAlertCount] = useState(0);
  const [alerts, setAlerts] = useState<AlertContract[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { user, signOut, isAdmin, isSuperAdmin, plan, planExpiresAt } = useAuth();
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
    setSearchQuery('');
  }, [location.pathname]);

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'clients', label: 'Clientes', icon: Users, path: '/clients' },
    {
      id: 'contracts', label: 'Meus Contratos', icon: FileText, path: '/contracts',
      children: [
        { id: 'create', label: 'Novo Contrato', icon: PlusCircle, path: '/contracts/new' },
      ],
    },
    { id: 'invoices', label: 'Facturação', icon: DollarSign, path: '/invoices' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
    { id: 'signatures', label: 'Assinaturas', icon: PenLine, path: '/signatures' },
    { id: 'approvals', label: 'Aprovações', icon: ThumbsUp, path: '/approvals' },
    { id: 'templates', label: 'Modelos', icon: BookTemplate, path: '/templates' },
    { id: 'compliance', label: 'Segurança', icon: ShieldCheck, path: '/compliance' },
  ];

  if (isAdmin) {
    navItems.push({ id: 'admin', label: 'Admin', icon: Shield, path: '/admin/users' });
    navItems.push({ id: 'payments', label: 'Pagamentos', icon: CreditCard, path: '/admin/payments' });
    navItems.push({ id: 'plan-history', label: 'Histórico Planos', icon: RefreshCw, path: '/admin/plan-history' });
    navItems.push({ id: 'settings', label: 'Definições', icon: Settings, path: '/admin/settings' });
    navItems.push({ id: 'approval-workflows', label: 'Workflows Aprov.', icon: ThumbsUp, path: '/admin/approval-workflows' });
    navItems.push({ id: 'audit-logs', label: 'Auditoria', icon: Activity, path: '/admin/audit-logs' });
  }

  if (isSuperAdmin) {
    navItems.push({ id: 'companies', label: 'Empresas', icon: Building2, path: '/admin/companies' });
    navItems.push({ id: 'permissions', label: 'Permissões', icon: Lock, path: '/admin/permissions' });
  }

  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';
  const avatarLetter = displayName.charAt(0).toUpperCase();
  
  const allNav = navItems.flatMap(i => [i, ...(i.children ?? [])]);
  const currentNav = allNav.find(i => location.pathname === i.path)
    || allNav.find(i => i.path !== '/dashboard' && location.pathname.startsWith(i.path));
  const headerTitle = currentNav?.id === 'dashboard' ? 'Painel' : currentNav?.label || 'Detalhes';

  const unreadNotifications = notifications.filter(n => !n.read);
  const totalAlerts = alertCount + unreadNotifications.length;
  const collapsed = sidebarCollapsed && !isMobile;
  const q = searchQuery.trim().toLowerCase();
  const filteredNavItems = navItems.filter(i =>
    i.label.toLowerCase().includes(q) ||
    (i.children ?? []).some(c => c.label.toLowerCase().includes(q))
  );

  const isChildRouteActive = (children?: NavItem['children']) =>
    !!children?.some(c => location.pathname === c.path || location.pathname.startsWith(c.path));

  const isNavActive = (item: NavItem) => {
    if (location.pathname === item.path) return true;
    if (isChildRouteActive(item.children)) return false;
    return item.path !== '/dashboard' && location.pathname.startsWith(item.path);
  };

  const isGroupOpen = (item: NavItem) => expandedGroups[item.id] ?? isChildRouteActive(item.children);
  const toggleGroup = (item: NavItem) => {
    setExpandedGroups(p => ({ ...p, [item.id]: !isGroupOpen(item) }));
  };

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
          padding: 10px 11px;
          background: rgba(15,23,42,0.85);
        }
        .alerts-item.expired { background: rgba(248,113,113,0.15); }
        .alerts-item.expiring { background: rgba(250,204,21,0.15); }
        .alerts-item.risky { background: rgba(96,165,250,0.15); }
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
          display: flex; align-items: center; gap: 10px;
          height: 40px; margin: 2px 8px; padding: 0 10px;
          font-size: 14px; font-weight: 300;
          color: #6b7280; border-radius: 9px;
          transition: background 150ms ease, color 150ms ease;
          width: auto; cursor: pointer; border: none; text-decoration: none;
          background: transparent; font-family: 'Inter', 'Poppins', sans-serif;
          position: relative; white-space: nowrap;
        }
        .sidebar .nav-link:hover { background: rgba(0,0,0,0.04); color: #0d1117; }
        .sidebar .nav-link.active {
          background: #ffffff; color: #000000;
          font-weight: 600;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .sidebar .nav-link-logout { color: #f87171 !important; }
        .sidebar .nav-link-logout:hover {
          color: #ef4444 !important;
          background: rgba(239,68,68,0.12) !important;
        }
        .sidebar.collapsed .nav-link { justify-content: center; margin: 2px 6px; padding: 0; }
        .nav-label {
          overflow: hidden; white-space: nowrap;
          transition: opacity 150ms ease, width 150ms ease;
        }
        .sidebar.collapsed .nav-label { opacity: 0; width: 0; }
        .sidebar-logo {
          transition: padding 150ms ease, justify-content 150ms ease;
        }
        .sidebar.collapsed .sidebar-logo { justify-content: center; padding: 0; }
        .sidebar-toggle {
          display: flex; align-items: center; justify-content: center;
          height: 40px; margin: 4px 6px; border: none; cursor: pointer;
          background: transparent; color: #6b7280;
          border-radius: 9px; flex-shrink: 0;
          font-family: 'Inter', 'Poppins', sans-serif;
          transition: background 150ms ease, color 150ms ease;
        }
        .sidebar-toggle:hover { background: rgba(0,0,0,0.04); color: #0d1117; }
        .sidebar-nav::-webkit-scrollbar { width: 4px; }
        .sidebar-nav::-webkit-scrollbar-track { background: transparent; }
        .sidebar-nav::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; }
        .sidebar-nav::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.25); }
        @media (max-width: 768px) {
          .sidebar-desktop { transform: translateX(-100%); transition: transform 0.3s ease; }
          .sidebar-desktop.open { transform: translateX(0); }
          .sidebar-overlay { display: block; }
          .main-content { margin-left: 0 !important; padding: 12px !important; }
          .header-desktop { padding: 14px 16px !important; }
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
        .sidebar-desktop { transition: transform 0.3s ease, width 180ms ease; }
        .main-content { transition: margin-left 180ms ease; }
      `}</style>

      {/* Background blobs */}
      <div style={{ position: 'absolute', top: -150, left: -150, width: 600, height: 600, background: 'radial-gradient(circle, rgba(13,17,23,0.15) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -200, right: -150, width: 700, height: 700, background: 'radial-gradient(circle, rgba(13,17,23,0.1) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }} />

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
        className={`sidebar sidebar-desktop ${mobileSidebarOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}
        style={{
          width: isMobile ? 280 : collapsed ? 68 : 240,
          background: '#f7f7f7',
          boxShadow: isMobile && mobileSidebarOpen ? '0 0 40px rgba(0,0,0,0.3)' : '4px 0 24px rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 40,
          overflow: 'hidden',
        }}
      >
        {/* Topo fixo — Logo (rail) */}
        <div className="sidebar-logo" style={{
          height: 64, flexShrink: 0, display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start', gap: 6,
          padding: collapsed ? 0 : '0 18px',
        }}>
          <img
            src={AgreeLogo}
            alt=""
            style={{ height: 30, display: 'block', flexShrink: 0 }}
          />
          {!collapsed && (
            <span style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: 22,
              fontWeight: 800,
              color: '#0d1117',
              letterSpacing: -0.5,
              lineHeight: 1,
              marginLeft: -2,
              whiteSpace: 'nowrap',
            }}>Agree</span>
          )}
        </div>

        {/* Busca */}
        {!collapsed && (
          <div style={{ padding: '0 8px 10px', flexShrink: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              height: 34, padding: '0 10px',
              background: 'rgba(0,0,0,0.04)', borderRadius: 8,
            }}>
              <Search size={16} color="#9ca3af" style={{ flexShrink: 0 }} />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Pesquisar..."
                style={{
                  flex: 1, border: 'none', outline: 'none', background: 'transparent',
                  fontSize: 13, fontWeight: 300, color: '#0d1117',
                  fontFamily: "'Inter','Poppins',sans-serif",
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2, display: 'flex' }}
                  title="Limpar"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Meio scrollável — Nav */}
        <nav className="sidebar-nav" style={{
          display: 'flex', flexDirection: 'column', gap: 2,
          flex: 1, overflowY: 'auto', minHeight: 0,
          padding: '10px 0',
        }}>
          {filteredNavItems.length === 0 && !collapsed && (
            <p style={{ fontSize: 12, fontWeight: 300, color: '#9ca3af', textAlign: 'center', padding: '12px 8px', fontFamily: "'Inter','Poppins',sans-serif" }}>
              Sem resultados
            </p>
          )}
          {filteredNavItems.map((item) => {
            const childActive = isChildRouteActive(item.children);
            const visibleChildren = q
              ? (item.children ?? []).filter(c => c.label.toLowerCase().includes(q))
              : (item.children ?? []);
            return (
              <React.Fragment key={item.id}>
                <Link
                  to={item.path}
                  className={`nav-link ${isNavActive(item) ? 'active' : ''}`}
                  title={collapsed ? item.label : undefined}
                  onClick={() => item.children && toggleGroup(item)}
                >
                  <item.icon size={20} style={{ flexShrink: 0 }} />
                  <span className="nav-label">{item.label}</span>
                  {/* Badge de alertas no Dashboard */}
                  {item.id === 'dashboard' && totalAlerts > 0 && !collapsed && (
                    <span style={{
                      marginLeft: 'auto',
                      background: '#ef4444',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 7px',
                      fontFamily: "'Poppins',sans-serif",
                      minWidth: 20,
                      textAlign: 'center'
                    }}>
                      {alertCount}
                    </span>
                  )}
                  {item.children && !collapsed && (
                    <span
                      onClick={e => { e.preventDefault(); e.stopPropagation(); toggleGroup(item); }}
                      style={{
                        marginLeft: 'auto', color: isGroupOpen(item) ? '#0d1117' : '#9ca3af',
                        display: 'inline-flex', cursor: 'pointer', transition: 'transform .2s, color .2s',
                        transform: isGroupOpen(item) ? 'rotate(90deg)' : 'none',
                      }}
                      title={isGroupOpen(item) ? 'Recolher' : 'Expandir'}
                    >
                      <ChevronRight size={14} />
                    </span>
                  )}
                </Link>
                {!collapsed && isGroupOpen(item) && visibleChildren.length > 0 && (
                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: 2,
                    margin: '0 8px', paddingLeft: 12, marginLeft: 18,
                    borderLeft: '1px solid rgba(0,0,0,0.08)',
                  }}>
                    {visibleChildren.map(child => (
                      <Link
                        key={child.id}
                        to={child.path}
                        className="nav-link"
                        style={{
                          height: 36, margin: 0, padding: '0 10px', fontSize: 13,
                        }}
                      >
                        <span style={{ width: 20, display: 'inline-flex', justifyContent: 'center', flexShrink: 0 }}>
                          <child.icon size={15} style={{ flexShrink: 0 }} />
                        </span>
                        <span className="nav-label">{child.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Fundo fixo — User + Logout */}
        <div className="sidebar-user" style={{
          borderTop: '1px solid rgba(0,0,0,0.06)',
          padding: collapsed ? '10px 0' : '0 8px 8px',
          flexShrink: 0,
        }}>
          {!collapsed ? (
            <>
              <div style={{ background: '#ffffff', padding: 14, marginTop: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{
                    width: 40, height: 40, flexShrink: 0,
                    background: '#0d1117',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800, color: '#ffffff',
                  }}>
                    {avatarLetter}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0d1117', fontFamily: "'Poppins',sans-serif", marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {displayName}
                    </p>
                    <p style={{ fontSize: 11, color: '#9ca3af', fontFamily: "'Poppins',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.email}
                    </p>
                  </div>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
                  padding: '7px 12px',
                  background: plan === 'enterprise' ? 'rgba(250,204,21,0.15)' : plan === 'pro' ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.04)',
                }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em',
                    color: plan === 'enterprise' ? '#b45309' : plan === 'pro' ? '#2563eb' : '#9ca3af',
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
                  <div style={{ fontSize: 10, color: '#9ca3af', textAlign: 'center', marginBottom: 14 }}>
                    Expira em {new Date(planExpiresAt).toLocaleDateString('pt-PT')}
                  </div>
                )}
                <Link
                  to="/billing"
                  className="nav-link"
                  style={{ background: '#ffffff', textDecoration: 'none', marginBottom: 8 }}
                >
                  <CreditCard size={20} />
                  <span className="nav-label">Billing</span>
                </Link>
                <Link
                  to="/profile"
                  className="nav-link nav-link-logout"
                  style={{ background: '#ffffff', textDecoration: 'none', marginBottom: 8 }}
                >
                  <Settings size={20} />
                  <span className="nav-label">Perfil</span>
                </Link>
                <button
                  onClick={async () => {
                    await signOut();
                  }}
                  className="nav-link nav-link-logout"
                  style={{ background: 'rgba(239,68,68,0.12)' }}
                >
                  <LogOut size={20} />
                  <span className="nav-label">Sair</span>
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{
                width: 36, height: 36, flexShrink: 0,
                background: '#0d1117',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800, color: '#ffffff',
                margin: '2px auto 4px',
              }}>
                {avatarLetter}
              </div>
              <Link
                to="/billing"
                className="nav-link"
                title="Billing"
                style={{ background: 'transparent', textDecoration: 'none' }}
              >
                <CreditCard size={20} />
              </Link>
              <Link
                to="/profile"
                className="nav-link nav-link-logout"
                title="Perfil"
                style={{ background: 'transparent', textDecoration: 'none' }}
              >
                <Settings size={20} />
              </Link>
              <button
                onClick={async () => {
                  await signOut();
                }}
                className="nav-link nav-link-logout"
                title="Sair"
                style={{ background: 'rgba(239,68,68,0.12)' }}
              >
                <LogOut size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Toggle recolher/expandir (desktop) */}
        {!isMobile && (
          <button
            onClick={() => setSidebarCollapsed(c => !c)}
            className="sidebar-toggle"
            title={collapsed ? 'Expandir' : 'Recolher'}
            style={{
              borderTop: '1px solid rgba(0,0,0,0.06)',
              justifyContent: collapsed ? 'center' : 'flex-end',
              paddingRight: collapsed ? 0 : 12,
              color: '#6b7280',
            }}
          >
            {collapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
          </button>
        )}
      </aside>

      {/* Main Content */}
      <main className="main-content" style={{
        flex: 1, marginLeft: isMobile ? 0 : collapsed ? 68 : 240, display: 'flex',
        flexDirection: 'column', height: '100vh', padding: isMobile ? 12 : '12px 24px 24px 24px'
      }}>
        {/* Top Header */}
        <header className="header-desktop" style={{
          background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(30px)',
          padding: '20px 28px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', position: 'sticky', top: 12,
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
                {headerTitle}
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
                cursor: 'pointer', padding: 10,
                color: totalAlerts > 0 ? '#ef4444' : '#6b7280',
                position: 'relative', transition: 'all .2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = totalAlerts > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.8)'}
              onMouseLeave={e => e.currentTarget.style.background = totalAlerts > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.5)'}
            >
              {totalAlerts > 0 ? <AlertTriangle size={20} /> : <Bell size={20} />}
              {totalAlerts > 0 && (
                <span style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 8, height: 8, background: '#ef4444',
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
