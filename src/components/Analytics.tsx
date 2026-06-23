import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Activity,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { useCheckoutModal } from '../contexts/CheckoutModalContext';
import { checkPlan, getLimits, canUpgrade } from '../lib/plans';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1'];
const VIBRANT = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Analytics() {
  const { user, plan, isAdmin } = useAuth();
  const { openCheckout } = useCheckoutModal();
  const [contracts, setContracts] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      const init = async () => {
        try {
          const { data, error } = await supabase
            .from('contracts')
            .select('*')
            .eq('owner_id', user.id);

          if (error) {
            console.error("Error fetching analytics data:", error);
            setContracts([]);
          } else {
            setContracts(data || []);
          }
        } catch (err) {
          console.error("Error initializing analytics:", err);
        }
      };
      init();

      const channel = supabase
        .channel('analytics_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts' }, () => {
          fetchContracts();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchContracts = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('owner_id', user.id);

      if (error) {
        console.error("Error fetching analytics data:", error);
        setContracts([]);
      } else {
        setContracts(data || []);
      }
    } catch (err) {
      console.error("Error fetching analytics data:", err);
    }
  };

  const financialData = Array.from({ length: 6 }).map((_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const monthName = format(date, 'MMM', { locale: ptBR });
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    
    const monthContracts = contracts.filter(c => {
      const createdAt = parseISO(c.created_at);
      return createdAt && isWithinInterval(createdAt, { start: monthStart, end: monthEnd });
    });

    const value = monthContracts.reduce((acc, c) => acc + (Number(c.value) || 0), 0);
    
    return { name: monthName, value };
  });

  // Correlação: novos contratos vs risco assumido por mês
  const correlationData = Array.from({ length: 6 }).map((_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const monthName = format(date, 'MMM', { locale: ptBR });
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    const monthContracts = contracts.filter(c => {
      const createdAt = parseISO(c.created_at);
      return createdAt && isWithinInterval(createdAt, { start: monthStart, end: monthEnd });
    });

    return {
      name: monthName,
      total: monthContracts.length,
      alto: monthContracts.filter(c => c.risk_level === 'high').length,
      medio: monthContracts.filter(c => c.risk_level === 'medium').length,
      baixo: monthContracts.filter(c => c.risk_level === 'low').length,
    };
  });

  const statusData = [
    { name: 'Aprovados', value: contracts.filter(c => c.status === 'approved').length },
    { name: 'Pendentes', value: contracts.filter(c => c.status === 'pending').length },
    { name: 'Rejeitados', value: contracts.filter(c => c.status === 'rejected').length },
    { name: 'Rascunhos', value: contracts.filter(c => c.status === 'draft').length }
  ].filter(item => item.value > 0);

  const riskData = [
    { name: 'Baixo', value: contracts.filter(c => c.risk_level === 'low').length },
    { name: 'Médio', value: contracts.filter(c => c.risk_level === 'medium').length },
    { name: 'Alto', value: contracts.filter(c => c.risk_level === 'high').length }
  ].filter(item => item.value > 0);

  const stats = {
    total: contracts.length,
    totalValue: contracts.reduce((acc, c) => acc + (Number(c.value) || 0), 0),
    approved: contracts.filter(c => c.status === 'approved').length,
    pending: contracts.filter(c => c.status === 'pending').length,
    highRisk: contracts.filter(c => c.risk_level === 'high').length
  };

  if (!checkPlan(plan, 'pro', isAdmin)) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 60, gap: 20, fontFamily: "'Poppins',sans-serif", textAlign: 'center'
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(13,17,23,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <TrendingUp size={40} color="#9ca3af" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0d1117' }}>
          Analytics
        </h2>
        <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 400 }}>
          Analytics está disponível apenas nos planos Pro e Enterprise.
        </p>
        <button onClick={() => openCheckout('pro')} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '12px 24px', fontSize: 14, fontWeight: 700,
          background: '#0d1117', border: 'none', color: '#fff',
          cursor: 'pointer', borderRadius: 12, fontFamily: "'Poppins',sans-serif"
        }}>
          <ArrowUpRight size={16} />
          Fazer Upgrade
        </button>
      </div>
    );
  }

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
            Análise de Dados
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', fontFamily: "'Poppins',sans-serif" }}>
            Visão detalhada dos seus contratos
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.35)',
          borderRadius: 20,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          <div style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#6b7280',
            letterSpacing: 1,
            textTransform: 'uppercase',
            fontFamily: "'Poppins',sans-serif"
          }}>
            Total de Contratos
          </div>
          <div style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#0d1117',
            fontFamily: "'Poppins',sans-serif"
          }}>
            {stats.total}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={16} color="#0d1117" />
            <span style={{ fontSize: 12, color: '#0d1117', fontWeight: 600, fontFamily: "'Poppins',sans-serif" }}>
              {stats.approved} aprovados
            </span>
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.35)',
          borderRadius: 20,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          <div style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#6b7280',
            letterSpacing: 1,
            textTransform: 'uppercase',
            fontFamily: "'Poppins',sans-serif"
          }}>
            Valor Total
          </div>
          <div style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#0d1117',
            fontFamily: "'Poppins',sans-serif"
          }}>
            {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(stats.totalValue)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={16} color="#0d1117" />
            <span style={{ fontSize: 12, color: '#0d1117', fontWeight: 600, fontFamily: "'Poppins',sans-serif" }}>
              ↑ 8% vs período anterior
            </span>
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.35)',
          borderRadius: 20,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          <div style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#6b7280',
            letterSpacing: 1,
            textTransform: 'uppercase',
            fontFamily: "'Poppins',sans-serif"
          }}>
            Pendentes
          </div>
          <div style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#0d1117',
            fontFamily: "'Poppins',sans-serif"
          }}>
            {stats.pending}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={16} color="#f59e0b" />
            <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600, fontFamily: "'Poppins',sans-serif" }}>
              Requer atenção
            </span>
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.35)',
          borderRadius: 20,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          <div style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#6b7280',
            letterSpacing: 1,
            textTransform: 'uppercase',
            fontFamily: "'Poppins',sans-serif"
          }}>
            Risco Alto
          </div>
          <div style={{
            fontSize: 28,
            fontWeight: 800,
            color: stats.highRisk > 0 ? '#ef4444' : '#0d1117',
            fontFamily: "'Poppins',sans-serif"
          }}>
            {stats.highRisk}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldAlert size={16} color="#ef4444" />
            <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600, fontFamily: "'Poppins',sans-serif" }}>
              {stats.highRisk > 0 ? 'Ação imediata' : 'Sem riscos'}
            </span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 24
      }} className="lg:grid-cols-3">
        {/* Financial Chart */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.35)',
          borderRadius: 24,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          overflow: 'hidden',
          gridColumn: '1 / span 2'
        }} className="lg:col-span-2">
          <div style={{
            padding: '24px',
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
              Evolução Financeira
            </h2>
          </div>
          <div style={{ padding: '24px', height: 350, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={financialData}>
                <defs>
                  <linearGradient id="colorFinancial" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e5e9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 11, fontFamily: "'Poppins',sans-serif" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 11, fontFamily: "'Poppins',sans-serif" }}
                  tickFormatter={(value) => `Kz ${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '10px',
                    border: '1px solid #e2e5e9',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    fontFamily: "'Poppins',sans-serif"
                  }}
                  itemStyle={{ color: '#0d1117', fontFamily: "'Poppins',sans-serif" }}
                  labelStyle={{ color: '#6b7280', fontFamily: "'Poppins',sans-serif" }}
                  formatter={(value: any) => [
                    new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(Number(value)),
                    'Valor'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorFinancial)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Pie Chart */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.35)',
          borderRadius: 24,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '24px',
            borderBottom: '1px solid #e2e5e9'
          }}>
            <h2 style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#0d1117',
              fontFamily: "'Poppins',sans-serif"
            }}>
              Status dos Contratos
            </h2>
          </div>
          <div style={{ padding: '24px', height: 300, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '10px',
                    border: '1px solid #e2e5e9',
                    fontFamily: "'Poppins',sans-serif"
                  }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Bar Chart */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.35)',
          borderRadius: 24,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          overflow: 'hidden',
          gridColumn: '1 / span 1'
        }} className="lg:col-span-1">
          <div style={{
            padding: '24px',
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
              Distribuição de Riscos
            </h2>
          </div>
          <div style={{ padding: '24px', height: 300, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={riskData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e5e9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 13, fontFamily: "'Poppins',sans-serif" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 11, fontFamily: "'Poppins',sans-serif" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '10px',
                    border: '1px solid #e2e5e9',
                    fontFamily: "'Poppins',sans-serif"
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {riskData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.name === 'Alto' ? '#ef4444' : entry.name === 'Médio' ? '#f59e0b' : '#10b981'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Correlation Chart: Novos Contratos vs Risco */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.35)',
          borderRadius: 24,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          overflow: 'hidden',
          gridColumn: '1 / -1'
        }} className="lg:col-span-1">
          <div style={{
            padding: '24px',
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
              Novos Contratos vs Risco Assumido
            </h2>
          </div>
          <div style={{ padding: '24px', height: 300, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={correlationData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e5e9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 13, fontFamily: "'Poppins',sans-serif" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 11, fontFamily: "'Poppins',sans-serif" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '10px',
                    border: '1px solid #e2e5e9',
                    fontFamily: "'Poppins',sans-serif"
                  }}
                />
                <Bar dataKey="total" name="Total" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="alto" name="Risco Alto" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="medio" name="Risco Médio" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="baixo" name="Risco Baixo" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Legend verticalAlign="bottom" height={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
