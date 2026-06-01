import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useContracts } from '../hooks/useContracts';
import { checkPlan, getLimits } from '../lib/plans';
import { useCheckoutModal } from '../contexts/CheckoutModalContext';
import {
  Plus, FileText, TrendingUp, AlertTriangle, Clock, CheckCircle2,
  ArrowUpRight, Bell, XCircle, Download, BarChart3, DollarSign, RefreshCw,
  Users, CreditCard, Target
} from 'lucide-react';
import { format, parseISO, addDays, startOfMonth, endOfMonth, isBefore, isAfter, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, AreaChart, Area
} from 'recharts';
import { exportContractListToPdf } from '../services/exportPdf';
import OnboardingWalkthrough from './OnboardingWalkthrough';

const PIE_COLORS = ['#0d1117', '#f59e0b', '#ef4444', '#6b7280'];
const RISK_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

const QUICK_ACTIONS = [
  { icon: FileText, label: 'Novo Contrato', path: '/contracts/new', color: '#0d1117', bg: 'rgba(13,17,23,0.08)' },
  { icon: Users, label: 'Novo Cliente', path: '/clients/new', color: '#2563eb', bg: 'rgba(37,99,235,0.08)' },
  { icon: DollarSign, label: 'Nova Factura', path: '/invoices/new', color: '#16a34a', bg: 'rgba(22,163,74,0.08)' },
  { icon: Clock, label: 'Ver Contratos', path: '/contracts', color: '#d97706', bg: 'rgba(217,119,6,0.08)' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, plan, isAdmin } = useAuth();
  const { openCheckout } = useCheckoutModal();
  const { data: contracts = [], isLoading } = useContracts();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const canUseCharts = checkPlan(plan, 'pro', isAdmin);
  const canExport = checkPlan(plan, 'enterprise', isAdmin);

  useEffect(() => {
    if (!isLoading && contracts.length === 0 && user) {
      const completed = localStorage.getItem('onboarding_completed');
      if (!completed) {
        setShowOnboarding(true);
      }
    }
  }, [isLoading, contracts, user]);

  const today = new Date();
  const expiringContracts = contracts.filter(c => {
    if (!c.end_date) return false;
    const end = parseISO(c.end_date);
    return isAfter(end, today) && isBefore(end, addDays(today, 30));
  });
  const expiredContracts = contracts.filter(c => {
    if (!c.end_date) return false;
    return isBefore(parseISO(c.end_date), today) && c.status !== 'rejected';
  });
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const monthlyObligations = contracts
    .filter(c => {
      if (!c.start_date || !c.end_date) return false;
      return isBefore(parseISO(c.start_date), monthEnd) && isAfter(parseISO(c.end_date), monthStart);
    })
    .reduce((acc, c) => acc + (Number(c.value) || 0), 0);
  const totalValue = contracts.reduce((acc, c) => acc + (Number(c.value) || 0), 0);
  const approvedCount = contracts.filter(c => c.status === 'approved').length;
  const pendingCount = contracts.filter(c => c.status === 'pending').length;

  const autoRenewCount = contracts.filter(c => c.auto_renew).length;
  const stats = {
    total: contracts.length,
    pending: pendingCount,
    approved: approvedCount,
    highRisk: contracts.filter(c => c.risk_level === 'high').length,
    monthlyObligations,
    totalValue,
    expiring: expiringContracts.length,
    criticalAlerts: expiringContracts.length + expiredContracts.length + contracts.filter(c => c.risk_level === 'high').length,
    autoRenew: autoRenewCount,
  };

  const recentContracts = contracts.slice(0, 5);

  const statusData = [
    { name: 'Assinados', value: contracts.filter(c => c.status === 'approved').length },
    { name: 'Pendentes', value: contracts.filter(c => c.status === 'pending').length },
    { name: 'Rejeitados', value: contracts.filter(c => c.status === 'rejected').length },
    { name: 'Rascunhos', value: contracts.filter(c => c.status === 'draft').length },
  ].filter(d => d.value > 0);

  const riskData = [
    { name: 'Baixo', value: contracts.filter(c => c.risk_level === 'low').length },
    { name: 'Médio', value: contracts.filter(c => c.risk_level === 'medium').length },
    { name: 'Alto', value: contracts.filter(c => c.risk_level === 'high').length },
  ];

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(today, 5 - i);
    const s = startOfMonth(d);
    const e = endOfMonth(d);
    const monthContracts = contracts.filter(c => {
      if (!c.created_at) return false;
      const created = parseISO(c.created_at);
      return isAfter(created, s) && isBefore(created, e);
    });
    return {
      month: format(d, 'MMM', { locale: ptBR }),
      valor: monthContracts.reduce((acc, c) => acc + (Number(c.value) || 0), 0),
      contratos: monthContracts.length,
    };
  });

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      approved: { bg: 'rgba(13,17,23,0.1)', color: '#0d1117', label: 'Assinado' },
      pending:  { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: 'Pendente' },
      rejected: { bg: 'rgba(239,68,68,0.1)',  color: '#ef4444', label: 'Rejeitado' },
      draft:    { bg: '#f7f9fb',               color: '#6b7280', label: 'Rascunho' },
    };
    return map[status] || map.draft;
  };

  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.5)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)', borderRadius: 0, padding: 24,
    transition: 'transform .2s, box-shadow .2s',
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: "'Poppins',sans-serif" }}>
        <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}.sk{background:linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);background-size:400px 100%;animation:shimmer 1.4s ease infinite}`}</style>
        <div className="sk" style={{ height: 160 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {[1,2,3,4].map(i => <div key={i} className="sk" style={{ height: 120 }} />)}
        </div>
        <div className="sk" style={{ height: 300 }} />
      </div>
    );
  }

  const isNewUser = contracts.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: "'Poppins',sans-serif" }}>

      {/* Onboarding Walkthrough */}
      {showOnboarding && (
        <OnboardingWalkthrough onComplete={() => {
          localStorage.setItem('onboarding_completed', 'true');
          setShowOnboarding(false);
        }} />
      )}

      {/* Alert Banner */}
      {!isNewUser && stats.criticalAlerts > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fff7ed, #fff3e0)',
          border: '1px solid #fed7aa', padding: '14px 20px',
          display: 'flex', flexDirection: 'column', gap: 8
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell size={17} color="#f59e0b" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>
              {stats.criticalAlerts} alerta{stats.criticalAlerts > 1 ? 's' : ''} que requer{stats.criticalAlerts === 1 ? '' : 'em'} atenção
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {expiredContracts.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <XCircle size={13} color="#ef4444" />
                <span style={{ fontSize: 12, color: '#7f1d1d' }}>
                  <strong>{expiredContracts.length}</strong> contrato{expiredContracts.length > 1 ? 's' : ''} expirado{expiredContracts.length > 1 ? 's' : ''}: {expiredContracts.slice(0, 2).map(c => c.title).join(', ')}{expiredContracts.length > 2 ? '...' : ''}
                </span>
              </div>
            )}
            {expiringContracts.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={13} color="#f59e0b" />
                <span style={{ fontSize: 12, color: '#78350f' }}>
                  <strong>{expiringContracts.length}</strong> contrato{expiringContracts.length > 1 ? 's' : ''} a expirar nos próximos 30 dias
                </span>
              </div>
            )}
            {stats.highRisk > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={13} color="#ef4444" />
                <span style={{ fontSize: 12, color: '#7f1d1d' }}>
                  <strong>{stats.highRisk}</strong> contrato{stats.highRisk > 1 ? 's' : ''} com risco alto
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Welcome + Quick Actions for new users */}
      <div style={{
        background: isNewUser
          ? 'linear-gradient(135deg, #0d1117 0%, #2d3548 100%)'
          : 'linear-gradient(135deg, #1a1f2e 0%, #2d3548 100%)',
        padding: 32, color: '#fff', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', right: -32, top: -32, width: 200, height: 200, background: 'rgba(255,255,255,0.08)', borderRadius: '50%', filter: 'blur(48px)' }} />
        <div style={{ position: 'absolute', left: 200, bottom: -64, width: 180, height: 180, background: 'rgba(255,255,255,0.05)', borderRadius: '50%', filter: 'blur(40px)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
                Olá, {user?.user_metadata?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário'}!
              </h1>
              <p style={{ fontSize: 15, opacity: 0.9, marginBottom: isNewUser ? 0 : 24 }}>
                {isNewUser
                  ? 'Vamos começar? Cria o teu primeiro contrato ou cliente em segundos.'
                  : 'Gerencie os seus contratos com total segurança e inteligência.'}
              </p>
            </div>
            {!isNewUser && canExport && (
              <button
                onClick={async () => await exportContractListToPdf(contracts)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 18px', background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'Poppins',sans-serif", whiteSpace: 'nowrap',
                }}
              >
                <Download size={16} /> Exportar Relatório
              </button>
            )}
          </div>

          {/* Quick Actions — always visible for new users, collapsible for others */}
          {isNewUser && (
            <div style={{
              display: 'flex', gap: 12, marginTop: 24,
              flexWrap: 'wrap'
            }}>
              {QUICK_ACTIONS.slice(0, 3).map(qa => (
                <button
                  key={qa.path}
                  onClick={() => navigate(qa.path)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 10,
                    padding: '12px 20px', background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.15)', color: '#fff',
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    fontFamily: "'Poppins',sans-serif",
                    transition: 'all .2s', flex: 1, minWidth: 160,
                    justifyContent: 'center'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                >
                  <qa.icon size={18} />
                  {qa.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Bar (for returning users) */}
      {!isNewUser && (
        <div style={{
          display: 'flex', gap: 12, flexWrap: 'wrap'
        }}>
          {QUICK_ACTIONS.map(qa => (
            <button
              key={qa.path}
              onClick={() => navigate(qa.path)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 18px', fontSize: 13, fontWeight: 600,
                background: qa.bg, border: 'none', color: qa.color,
                cursor: 'pointer', fontFamily: "'Poppins',sans-serif",
                transition: 'all .2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              <qa.icon size={16} />
              {qa.label}
            </button>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      {!isNewUser && (
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          {[
            { icon: <FileText size={22} color="#0d1117" />, iconBg: 'rgba(13,17,23,0.1)', value: stats.total, label: 'Total de contratos' },
            { icon: <CheckCircle2 size={22} color="#0d1117" />, iconBg: 'rgba(13,17,23,0.1)', value: stats.approved, label: 'Assinados' },
            { icon: <Clock size={22} color="#f59e0b" />, iconBg: 'rgba(245,158,11,0.1)', value: stats.pending, label: 'Pendentes' },
            { icon: <DollarSign size={22} color="#0d1117" />, iconBg: 'rgba(13,17,23,0.1)', value: new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumSignificantDigits: 3 }).format(monthlyObligations), label: 'Obrigações este mês', small: true },
            { icon: <TrendingUp size={22} color="#0d1117" />, iconBg: 'rgba(13,17,23,0.1)', value: new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumSignificantDigits: 3 }).format(totalValue), label: 'Valor total contratos', small: true },
            { icon: <AlertTriangle size={22} color={stats.criticalAlerts > 0 ? '#ef4444' : '#0d1117'} />, iconBg: stats.criticalAlerts > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(13,17,23,0.1)', value: stats.criticalAlerts, label: stats.criticalAlerts === 0 ? 'Sem alertas' : 'Alertas críticos', valueColor: stats.criticalAlerts > 0 ? '#ef4444' : '#0d1117' },
            { icon: <RefreshCw size={22} color="#22c55e" />, iconBg: 'rgba(34,197,94,0.1)', value: stats.autoRenew, label: 'Renovação automática', valueColor: '#22c55e' },
          ].map((s, i) => (
            <div key={i} style={card}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.06)'; }}
            >
              <div style={{ width: 44, height: 44, background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                {s.icon}
              </div>
              <div style={{ fontSize: s.small ? 22 : 32, fontWeight: 800, color: (s as any).valueColor || '#0d1117', marginBottom: 4 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Charts Section - Pro */}
      {!isNewUser && canUseCharts && contracts.length > 0 && (
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {/* Status Pie */}
          {statusData.length > 0 && (
            <div style={card}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0d1117', marginBottom: 16 }}>Status dos Contratos</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                    {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
                {statusData.map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span style={{ fontSize: 11, color: '#6b7280' }}>{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Bar */}
          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0d1117', marginBottom: 16 }}>Distribuição de Riscos</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={riskData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e5e9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={0}>
                  {riskData.map((_, i) => <Cell key={i} fill={RISK_COLORS[i % RISK_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Trend */}
          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0d1117', marginBottom: 16 }}>Evolução Mensal</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e5e9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="contratos" stroke="#0d1117" fill="rgba(13,17,23,0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Pro upgrade prompt */}
      {!isNewUser && !canUseCharts && contracts.length > 0 && (
        <div style={{
          ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #fafafa, #f3f4f6)', padding: '20px 24px',
          flexWrap: 'wrap', gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <BarChart3 size={24} color="#6b7280" />
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#0d1117' }}>Gráficos e Analytics</p>
              <p style={{ fontSize: 12, color: '#6b7280' }}>Actualiza para Pro para veres gráficos detalhados dos teus contratos.</p>
            </div>
          </div>
          <button
            onClick={() => openCheckout('pro')}
            style={{
              padding: '10px 20px', fontSize: 13, fontWeight: 600,
              background: '#0d1117', color: '#fff', border: 'none', cursor: 'pointer',
              fontFamily: "'Poppins',sans-serif",
            }}
          >
            Actualizar
          </button>
        </div>
      )}

      {/* Empty State for new users */}
      {isNewUser && (
        <div style={{
          ...card, textAlign: 'center', padding: '60px 24px', display: 'flex',
          flexDirection: 'column', alignItems: 'center', gap: 16
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: 'rgba(13,17,23,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Target size={40} color="#0d1117" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0d1117' }}>Bem-vindo ao Agree!</h2>
          <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 400, lineHeight: 1.6 }}>
            O teu painel está vazio. Cria o teu primeiro contrato, adiciona um cliente ou gera a tua primeira factura para começares a ver as tuas estatísticas aqui.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={() => navigate('/contracts/new')} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', background: '#0d1117', color: '#fff',
              border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Poppins',sans-serif"
            }}>
              <Plus size={18} /> Criar Primeiro Contrato
            </button>
            <button onClick={() => {
              localStorage.removeItem('onboarding_completed');
              setShowOnboarding(true);
            }} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', background: '#fff', color: '#0d1117',
              border: '1px solid #e2e5e9', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: "'Poppins',sans-serif"
            }}>
              Ver Tutorial
            </button>
          </div>
        </div>
      )}

      {/* Bottom Grid — only show for users with contracts */}
      {!isNewUser && (
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {/* Recent Contracts */}
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0d1117' }}>Contratos Recentes</h2>
              <button
                onClick={() => navigate('/contracts')}
                style={{
                  fontSize: 12, fontWeight: 600, color: '#6b7280',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: "'Poppins',sans-serif",
                }}
              >Ver todos</button>
            </div>
            <div style={{ padding: '0 24px 24px' }}>
              {recentContracts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {recentContracts.map(contract => {
                    const badge = getStatusBadge(contract.status);
                    return (
                      <div
                        key={contract.id}
                        onClick={() => navigate(`/contracts/${contract.id}`)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 14px', background: '#f7f9fb',
                          cursor: 'pointer', transition: 'background .2s'
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f0f0f0'}
                        onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = '#f7f9fb'}
                      >
                        <div style={{ width: 38, height: 38, background: '#fff', border: '1px solid #e2e5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {contract.status === 'approved' ? <CheckCircle2 size={16} color="#0d1117" /> :
                           contract.status === 'pending' ? <Clock size={16} color="#f59e0b" /> :
                           contract.status === 'rejected' ? <AlertTriangle size={16} color="#ef4444" /> :
                           <FileText size={16} color="#6b7280" />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#0d1117', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {contract.title}
                          </p>
                          <p style={{ fontSize: 11, color: '#6b7280' }}>
                            {contract.created_at ? format(parseISO(contract.created_at), 'dd MMM yyyy', { locale: ptBR }) : ''}
                          </p>
                        </div>
                        <span style={{ padding: '3px 10px', fontSize: 11, fontWeight: 600, background: badge.bg, color: badge.color, flexShrink: 0 }}>
                          {badge.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Expiring */}
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: expiringContracts.length > 0 ? 12 : 0 }}>
                <div style={{ width: 40, height: 40, background: stats.expiring > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(13,17,23,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={20} color={stats.expiring > 0 ? '#ef4444' : '#0d1117'} />
                </div>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0d1117' }}>A expirar</h3>
                  <p style={{ fontSize: 12, color: '#6b7280' }}>Nos próximos 30 dias</p>
                </div>
                <span style={{ marginLeft: 'auto', fontSize: 24, fontWeight: 800, color: stats.expiring > 0 ? '#ef4444' : '#0d1117' }}>
                  {stats.expiring}
                </span>
              </div>
              {expiringContracts.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {expiringContracts.slice(0, 3).map(c => (
                    <div
                      key={c.id}
                      onClick={() => navigate(`/contracts/${c.id}`)}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: 'rgba(239,68,68,0.05)', cursor: 'pointer', transition: 'background .2s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(239,68,68,0.1)'}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(239,68,68,0.05)'}
                    >
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#0d1117', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{c.title}</span>
                      <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 700, flexShrink: 0 }}>{format(parseISO(c.end_date!), 'dd/MM/yyyy', { locale: ptBR })}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CTA */}
            <div style={{
              background: 'linear-gradient(135deg, #0d1117 0%, #262626 100%)',
              padding: 28, color: '#fff', position: 'relative', overflow: 'hidden', flex: 1
            }}>
              <div style={{ position: 'absolute', right: -40, bottom: -40, width: 200, height: 200, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
              <div style={{ position: 'relative' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Precisa de ajuda?</h3>
                <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 20, lineHeight: 1.6 }}>
                  A nossa IA ajuda-te a analisar riscos e cláusulas complexas em segundos.
                </p>
                <button
                  onClick={() => navigate('/contracts/new')}
                  style={{
                    width: '100%', padding: '12px 20px', background: '#fff',
                    color: '#0d1117', border: 'none', fontSize: 14, fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 8, transition: 'background .2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0f0f0'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  Experimentar Agora <ArrowUpRight size={16} />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
