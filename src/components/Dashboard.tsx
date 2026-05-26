import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useContracts } from '../hooks/useContracts';
import { 
  Plus, 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight,
  Bell,
  XCircle
} from 'lucide-react';
import { format, parseISO, addDays, startOfMonth, endOfMonth, isBefore, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: contracts = [], isLoading } = useContracts();

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

  const stats = {
    total: contracts.length,
    pending: contracts.filter(c => c.status === 'pending').length,
    highRisk: contracts.filter(c => c.risk_level === 'high').length,
    monthlyObligations,
    expiring: expiringContracts.length,
    criticalAlerts: expiringContracts.length + expiredContracts.length + contracts.filter(c => c.risk_level === 'high').length
  };

  const recentContracts = contracts.slice(0, 5);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 size={16} color="#0d1117" />;
      case 'pending': return <Clock size={16} color="#f59e0b" />;
      case 'rejected': return <AlertTriangle size={16} color="#ef4444" />;
      default: return <FileText size={16} color="#6b7280" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      approved: { bg: 'rgba(13,17,23,0.1)', color: '#0d1117', label: 'Assinado' },
      pending:  { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: 'Pendente' },
      rejected: { bg: 'rgba(239,68,68,0.1)',  color: '#ef4444', label: 'Rejeitado' },
      draft:    { bg: '#f7f9fb',               color: '#6b7280', label: 'Rascunho' },
    };
    return map[status] || map.draft;
  };

  // card base style — sem bordas redondas
  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.55)',
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
    border: '1px solid rgba(255,255,255,0.5)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
    borderRadius: 0,
    padding: 24,
    transition: 'transform .2s, box-shadow .2s',
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: "'Poppins', sans-serif" }}>
        <style>{`
          @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
          .sk { background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%); background-size:400px 100%; animation:shimmer 1.4s ease infinite; }
        `}</style>
        <div className="sk" style={{ height: 160 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {[1,2,3,4].map(i => <div key={i} className="sk" style={{ height: 120 }} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div className="sk" style={{ height: 300 }} />
          <div className="sk" style={{ height: 300 }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: "'Poppins', sans-serif" }}>

      {/* Banner de alertas */}
      {stats.criticalAlerts > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fff7ed, #fff3e0)',
          border: '1px solid #fed7aa',
          padding: '14px 20px',
          display: 'flex', flexDirection: 'column', gap: 8
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell size={17} color="#f59e0b" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e', fontFamily: "'Poppins',sans-serif" }}>
              {stats.criticalAlerts} alerta{stats.criticalAlerts > 1 ? 's' : ''} que requer{stats.criticalAlerts === 1 ? '' : 'em'} atenção
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {expiredContracts.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <XCircle size={13} color="#ef4444" />
                <span style={{ fontSize: 12, color: '#7f1d1d', fontFamily: "'Poppins',sans-serif" }}>
                  <strong>{expiredContracts.length}</strong> contrato{expiredContracts.length > 1 ? 's' : ''} expirado{expiredContracts.length > 1 ? 's' : ''}: {expiredContracts.slice(0, 2).map(c => c.title).join(', ')}{expiredContracts.length > 2 ? '...' : ''}
                </span>
              </div>
            )}
            {expiringContracts.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={13} color="#f59e0b" />
                <span style={{ fontSize: 12, color: '#78350f', fontFamily: "'Poppins',sans-serif" }}>
                  <strong>{expiringContracts.length}</strong> contrato{expiringContracts.length > 1 ? 's' : ''} a expirar nos próximos 30 dias
                </span>
              </div>
            )}
            {stats.highRisk > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={13} color="#ef4444" />
                <span style={{ fontSize: 12, color: '#7f1d1d', fontFamily: "'Poppins',sans-serif" }}>
                  <strong>{stats.highRisk}</strong> contrato{stats.highRisk > 1 ? 's' : ''} com risco alto identificado
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Welcome */}
      <div style={{
        background: 'linear-gradient(135deg, #0d1117 0%, #000000 100%)',
        padding: 32, color: '#fff', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', right: -32, top: -32, width: 200, height: 200, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(48px)' }} />
        <div style={{ position: 'absolute', left: 200, bottom: -64, width: 180, height: 180, background: 'rgba(0,0,0,0.1)', borderRadius: '50%', filter: 'blur(40px)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, fontFamily: "'Poppins',sans-serif" }}>
            Olá, {user?.user_metadata?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário'}! 👋
          </h1>
          <p style={{ fontSize: 15, opacity: 0.9, marginBottom: 24, fontFamily: "'Poppins',sans-serif" }}>
            Gerencie os seus contratos com total segurança e inteligência.
          </p>
          <button
            onClick={() => navigate('/contracts/new')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '12px 24px', background: '#fff', color: '#0d1117',
              border: 'none', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', transition: 'all .2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: "'Poppins',sans-serif"
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
          >
            <Plus size={18} />
            Novo Contrato
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        {[
          { icon: <FileText size={22} color="#0d1117" />, iconBg: 'rgba(13,17,23,0.1)', value: stats.total, label: 'Total de contratos', valueColor: '#0d1117' },
          { icon: <Clock size={22} color="#f59e0b" />, iconBg: 'rgba(245,158,11,0.1)', value: stats.pending, label: 'Pendentes de assinatura', valueColor: '#0d1117' },
          { icon: <TrendingUp size={22} color="#0d1117" />, iconBg: 'rgba(13,17,23,0.1)', value: new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumSignificantDigits: 3 }).format(stats.monthlyObligations), label: 'Obrigações este mês', valueColor: '#0d1117', small: true },
          { icon: <AlertTriangle size={22} color={stats.criticalAlerts > 0 ? '#ef4444' : '#0d1117'} />, iconBg: stats.criticalAlerts > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(13,17,23,0.1)', value: stats.criticalAlerts, label: stats.criticalAlerts === 0 ? 'Sem alertas críticos' : 'Alertas críticos', valueColor: stats.criticalAlerts > 0 ? '#ef4444' : '#0d1117' },
        ].map((s, i) => (
          <div
            key={i}
            style={card}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.06)'; }}
          >
            <div style={{ width: 44, height: 44, background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              {s.icon}
            </div>
            <div style={{ fontSize: s.small ? 22 : 32, fontWeight: 800, color: s.valueColor, marginBottom: 4, fontFamily: "'Poppins',sans-serif" }}>
              {s.value}
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', fontFamily: "'Poppins',sans-serif" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* Contratos Recentes */}
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0d1117', fontFamily: "'Poppins',sans-serif" }}>Contratos Recentes</h2>
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
                        {getStatusIcon(contract.status)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#0d1117', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Poppins',sans-serif" }}>
                          {contract.title}
                        </p>
                        <p style={{ fontSize: 11, color: '#6b7280', fontFamily: "'Poppins',sans-serif" }}>
                          {contract.created_at ? format(parseISO(contract.created_at), 'dd MMM yyyy', { locale: ptBR }) : ''}
                        </p>
                      </div>
                      <span style={{ padding: '3px 10px', fontSize: 11, fontWeight: 600, background: badge.bg, color: badge.color, flexShrink: 0, fontFamily: "'Poppins',sans-serif" }}>
                        {badge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af' }}>
                <FileText size={40} style={{ marginBottom: 12, opacity: 0.25 }} />
                <p style={{ fontSize: 14, fontFamily: "'Poppins',sans-serif" }}>Nenhum contrato ainda</p>
                <p style={{ fontSize: 12, marginTop: 4, fontFamily: "'Poppins',sans-serif" }}>Crie o seu primeiro contrato</p>
              </div>
            )}
          </div>
        </div>

        {/* Coluna direita */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* A expirar */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: expiringContracts.length > 0 ? 12 : 0 }}>
              <div style={{ width: 40, height: 40, background: stats.expiring > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(13,17,23,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={20} color={stats.expiring > 0 ? '#ef4444' : '#0d1117'} />
              </div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0d1117', fontFamily: "'Poppins',sans-serif" }}>A expirar</h3>
                <p style={{ fontSize: 12, color: '#6b7280', fontFamily: "'Poppins',sans-serif" }}>Nos próximos 30 dias</p>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 24, fontWeight: 800, color: stats.expiring > 0 ? '#ef4444' : '#0d1117', fontFamily: "'Poppins',sans-serif" }}>
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
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#0d1117', fontFamily: "'Poppins',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{c.title}</span>
                    <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 700, fontFamily: "'Poppins',sans-serif", flexShrink: 0 }}>{format(parseISO(c.end_date!), 'dd/MM/yyyy', { locale: ptBR })}</span>
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
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, fontFamily: "'Poppins',sans-serif" }}>Precisa de ajuda?</h3>
              <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 20, lineHeight: 1.6, fontFamily: "'Poppins',sans-serif" }}>
                A nossa IA ajuda-te a analisar riscos e cláusulas complexas em segundos.
              </p>
              <button
                onClick={() => navigate('/contracts/new')}
                style={{
                  width: '100%', padding: '12px 20px', background: '#0d1117',
                  color: '#fff', border: 'none', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 8, transition: 'background .2s',
                  fontFamily: "'Poppins',sans-serif"
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#000000'}
                onMouseLeave={e => e.currentTarget.style.background = '#0d1117'}
              >
                Experimentar Agora
                <ArrowUpRight size={16} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
