import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, FileText, PlusCircle, LogOut,
  Bell, Menu, X, BarChart3, ShieldCheck, FileSignature,
  AlertTriangle
} from 'lucide-react';
import { addDays, isBefore, isAfter, parseISO } from 'date-fns';

export default function Layout() {
  const [alertCount, setAlertCount] = useState(0);
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Buscar alertas críticos para o badge
  useEffect(() => {
    if (!user) return;
    const fetchAlerts = async () => {
      const { data } = await supabase
        .from('contracts')
        .select('end_date, risk_level, status')
        .eq('owner_id', user.id);

      if (!data) return;
      const today = new Date();
      const in30 = addDays(today, 30);

      const count = data.filter(c => {
        const expiring = c.end_date && isAfter(parseISO(c.end_date), today) && isBefore(parseISO(c.end_date), in30);
        const expired = c.end_date && isBefore(parseISO(c.end_date), today) && c.status !== 'rejected';
        const highRisk = c.risk_level === 'high';
        return expiring || expired || highRisk;
      }).length;

      setAlertCount(count);
    };
    fetchAlerts();
  }, [user]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'contracts', label: 'Meus Contratos', icon: FileText, path: '/contracts' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
    { id: 'compliance', label: 'Segurança', icon: ShieldCheck, path: '/compliance' },
    { id: 'create', label: 'Novo Contrato', icon: PlusCircle, path: '/contracts/new' },
  ];

  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';
  const avatarLetter = displayName.charAt(0).toUpperCase();
  
  const currentNav = navItems.find(i => location.pathname.startsWith(i.path));

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
          --teal: #0fa88f; --teal-dark: #0d8a76; --teal-light: #e6f7f4;
          --border: rgba(226, 229, 233, 0.6);
        }
        .nav-link {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px; font-size: 14px; font-weight: 500;
          color: #6b7280; border-radius: 12px; transition: all .2s;
          width: 100%; cursor: pointer; border: none; text-decoration: none;
          background: transparent; font-family: 'Poppins', sans-serif;
          position: relative;
        }
        .nav-link:hover { background: rgba(255,255,255,0.5); color: #0d1117; }
        .nav-link.active {
          background: rgba(230,247,244,0.9); color: var(--teal);
          font-weight: 600; box-shadow: 0 2px 8px rgba(15,168,143,0.1);
        }
      `}</style>

      {/* Background blobs */}
      <div style={{ position: 'absolute', top: -150, left: -150, width: 600, height: 600, background: 'radial-gradient(circle, rgba(15,168,143,0.15) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -200, right: -150, width: 700, height: 700, background: 'radial-gradient(circle, rgba(15,168,143,0.1) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }} />

      {/* Sidebar */}
      <aside style={{
        width: 260, background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(30px)',
        borderRight: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        display: 'flex', flexDirection: 'column', padding: '24px', gap: 32,
        position: 'fixed', left: 0, zIndex: 40, overflowY: 'auto',
        height: '100%', borderRadius: '0 24px 24px 0'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#1d8c78,#0fa88f)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(15,168,143,0.3)' }}>
            <FileSignature size={20} color="#fff" />
          </div>
          <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 20, color: '#0d1117' }}>Agree</span>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`nav-link ${(location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path))) ? 'active' : ''}`}
            >
              <item.icon size={18} />
              {item.label}
              {/* Badge de alertas no Dashboard */}
              {item.id === 'dashboard' && alertCount > 0 && (
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

        {/* User + Logout */}
        <div style={{
          background: 'rgba(255,255,255,0.4)', borderRadius: 16,
          padding: 16, marginLeft: -4, marginRight: -4
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg,#1d8c78,#0fa88f)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 800, color: '#fff',
              boxShadow: '0 4px 12px rgba(15,168,143,0.3)'
            }}>
              {avatarLetter}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#0d1117', fontFamily: "'Poppins',sans-serif", marginBottom: 2 }}>
                {displayName}
              </p>
              <p style={{ fontSize: 12, color: '#6b7280', fontFamily: "'Poppins',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="nav-link"
            style={{ color: '#ef4444', background: 'rgba(239,68,68,0.05)', borderRadius: 10 }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.05)'}
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1, marginLeft: 260, display: 'flex',
        flexDirection: 'column', height: '100vh', padding: 24
      }}>
        {/* Top Header */}
        <header style={{
          background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255,255,255,0.35)', borderRadius: 20,
          padding: '20px 28px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', position: 'sticky', top: 24,
          zIndex: 30, marginBottom: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
        }}>
          <div>
            <h2 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 20, fontWeight: 700, color: '#0d1117', marginBottom: 4 }}>
              {currentNav?.label || 'Detalhes'}
            </h2>
            <p style={{ fontSize: 13, color: '#6b7280', fontFamily: "'Poppins',sans-serif" }}>
              Gerencie os seus contratos com total controlo
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                background: alertCount > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.5)',
                border: `1px solid ${alertCount > 0 ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
                cursor: 'pointer', padding: 10,
                color: alertCount > 0 ? '#ef4444' : '#6b7280',
                position: 'relative', borderRadius: 12, transition: 'all .2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = alertCount > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.8)'}
              onMouseLeave={e => e.currentTarget.style.background = alertCount > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.5)'}
            >
              {alertCount > 0 ? <AlertTriangle size={20} /> : <Bell size={20} />}
              {alertCount > 0 && (
                <span style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 8, height: 8, background: '#ef4444',
                  borderRadius: '50%', border: '2px solid rgba(255,255,255,0.9)'
                }} />
              )}
            </button>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
