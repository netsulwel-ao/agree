import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Activity,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight
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

const COLORS = ['#0055FF', '#00B031', '#FF9500', '#FF3B30', '#8E8E93'];

export default function Analytics() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContracts();

    const channel = supabase
      .channel('analytics_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts' }, () => {
        fetchContracts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchContracts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('owner_id', user.id);

    if (error) {
      console.error("Error fetching analytics data:", error);
    } else {
      setContracts(data || []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="animate-spin text-[#0055FF]" size={32} />
      </div>
    );
  }

  // 1. Financial Data (Last 6 months)
  const financialData = Array.from({ length: 6 }).map((_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const monthName = format(date, 'MMM', { locale: ptBR });
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    
    const value = contracts
      .filter(c => {
        const createdAt = parseISO(c.created_at);
        return createdAt && isWithinInterval(createdAt, { start: monthStart, end: monthEnd });
      })
      .reduce((acc, c) => acc + (Number(c.value) || 0), 0);
    
    return { name: monthName, value };
  });

  // 2. Status Distribution
  const statusData = [
    { name: 'Aprovados', value: contracts.filter(c => c.status === 'approved').length },
    { name: 'Pendentes', value: contracts.filter(c => c.status === 'pending').length },
    { name: 'Rascunhos', value: contracts.filter(c => c.status === 'draft').length },
    { name: 'Rejeitados', value: contracts.filter(c => c.status === 'rejected').length },
  ].filter(d => d.value > 0);

  // 3. Risk Distribution
  const riskData = [
    { name: 'Baixo', value: contracts.filter(c => c.risk_level === 'low' || !c.risk_level).length },
    { name: 'Médio', value: contracts.filter(c => c.risk_level === 'medium').length },
    { name: 'Alto', value: contracts.filter(c => c.risk_level === 'high').length },
  ];

  // 4. Top Contracts by Value
  const topContracts = [...contracts]
    .sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0))
    .slice(0, 5)
    .map(c => ({
      name: c.title.length > 15 ? c.title.substring(0, 15) + '...' : c.title,
      value: Number(c.value) || 0
    }));

  const totalValue = contracts.reduce((acc, c) => acc + (Number(c.value) || 0), 0);
  const avgValue = contracts.length > 0 ? totalValue / contracts.length : 0;
  const highRiskCount = contracts.filter(c => c.risk_level === 'high').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-[24px] font-bold text-foreground">Analytics & Insights</h1>
        <p className="text-[14px] text-muted-foreground">Dados estratégicos para tomada de decisão</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="border border-border shadow-none bg-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Volume Total</span>
            <div className="p-1.5 bg-secondary rounded-lg text-primary">
              <DollarSign size={16} />
            </div>
          </div>
          <p className="text-[22px] font-bold text-foreground">
            {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(totalValue)}
          </p>
          <div className="flex items-center gap-1 mt-2 text-[11px] text-[#00B031] font-medium">
            <ArrowUpRight size={14} />
            <span>+8.4% vs mês anterior</span>
          </div>
        </Card>

        <Card className="border border-border shadow-none bg-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Ticket Médio</span>
            <div className="p-1.5 bg-secondary rounded-lg text-primary">
              <Activity size={16} />
            </div>
          </div>
          <p className="text-[22px] font-bold text-foreground">
            {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(avgValue)}
          </p>
          <div className="flex items-center gap-1 mt-2 text-[11px] text-muted-foreground font-medium">
            <Clock size={14} />
            <span>Baseado em {contracts.length} contratos</span>
          </div>
        </Card>

        <Card className="border border-border shadow-none bg-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Risco Crítico</span>
            <div className="p-1.5 bg-red-500/10 rounded-lg text-destructive">
              <ShieldAlert size={16} />
            </div>
          </div>
          <p className="text-[22px] font-bold text-foreground">{highRiskCount}</p>
          <div className="flex items-center gap-1 mt-2 text-[11px] text-destructive font-medium">
            <AlertTriangle size={14} />
            <span>{((highRiskCount / (contracts.length || 1)) * 100).toFixed(1)}% da carteira</span>
          </div>
        </Card>

        <Card className="border border-border shadow-none bg-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Taxa de Aprovação</span>
            <div className="p-1.5 bg-green-500/10 rounded-lg text-green-500">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="text-[22px] font-bold text-foreground">
            {((contracts.filter(c => c.status === 'approved').length / (contracts.length || 1)) * 100).toFixed(0)}%
          </p>
          <div className="flex items-center gap-1 mt-2 text-[11px] text-[#00B031] font-medium">
            <TrendingUp size={14} />
            <span>Fluxo de trabalho eficiente</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Financial Evolution */}
        <Card className="border border-border shadow-none bg-card rounded-xl overflow-hidden">
          <CardHeader className="p-6 border-b border-border">
            <CardTitle className="text-[16px] font-bold text-foreground">Evolução Financeira (Novos Contratos)</CardTitle>
            <CardDescription className="text-muted-foreground">Volume financeiro aportado nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financialData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  tickFormatter={(value) => `Kz ${value / 1000}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card)', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border)', 
                    boxShadow: 'none',
                    color: 'var(--foreground)'
                  }}
                  itemStyle={{ color: 'var(--foreground)' }}
                  labelStyle={{ color: 'var(--muted-foreground)' }}
                  formatter={(value: number) => [new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value), 'Valor']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="var(--chart-1)" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk Distribution */}
        <Card className="border border-border shadow-none bg-card rounded-xl overflow-hidden">
          <CardHeader className="p-6 border-b border-border">
            <CardTitle className="text-[16px] font-bold text-foreground">Distribuição de Risco</CardTitle>
            <CardDescription className="text-muted-foreground">Análise de exposição por nível de severidade</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--chart-2)' : index === 1 ? 'var(--chart-3)' : 'var(--chart-4)'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card)', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border)', 
                    boxShadow: 'none',
                    color: 'var(--foreground)'
                  }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: 'var(--foreground)' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Contracts */}
        <Card className="border border-border shadow-none bg-card rounded-xl overflow-hidden">
          <CardHeader className="p-6 border-b border-border">
            <CardTitle className="text-[16px] font-bold text-foreground">Top 5 Contratos por Valor</CardTitle>
            <CardDescription className="text-muted-foreground">Maiores obrigações financeiras ativas</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topContracts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--chart-grid)" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--foreground)', fontSize: 11, fontWeight: 500 }}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: 'var(--muted)' }}
                  contentStyle={{ 
                    backgroundColor: 'var(--card)', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border)', 
                    boxShadow: 'none',
                    color: 'var(--foreground)'
                  }}
                  itemStyle={{ color: 'var(--foreground)' }}
                  labelStyle={{ color: 'var(--muted-foreground)' }}
                  formatter={(value: number) => [new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value), 'Valor']}
                />
                <Bar dataKey="value" fill="var(--chart-1)" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card className="border border-border shadow-none bg-card rounded-xl overflow-hidden">
          <CardHeader className="p-6 border-b border-border">
            <CardTitle className="text-[16px] font-bold text-foreground">Status da Carteira</CardTitle>
            <CardDescription className="text-muted-foreground">Quantidade de contratos por estágio do fluxo</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                <Tooltip 
                  cursor={{ fill: 'var(--muted)' }}
                  contentStyle={{ 
                    backgroundColor: 'var(--card)', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border)', 
                    boxShadow: 'none',
                    color: 'var(--foreground)'
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`var(--chart-${(index % 5) + 1})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
