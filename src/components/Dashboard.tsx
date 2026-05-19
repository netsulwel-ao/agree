import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { 
  FileText, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Database,
  Loader2
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
  Area
} from 'recharts';
import { format, isAfter, isBefore, addDays, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { seedSampleContracts } from '../services/seedData';
import { toast } from 'sonner';

interface DashboardProps {
  onSelectContract: (id: string) => void;
}

export default function Dashboard({ onSelectContract }: DashboardProps) {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetchContracts();

    // Subscribe to changes
    const channel = supabase
      .channel('contracts_changes')
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
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching contracts:", error);
    } else {
      setContracts(data || []);
    }
    setLoading(false);
  };

  const stats = {
    total: contracts.length,
    pending: contracts.filter(c => c.status === 'pending').length,
    expiringSoon: contracts.filter(c => {
      if (!c.end_date) return false;
      const end = parseISO(c.end_date);
      return isAfter(end, new Date()) && isBefore(end, addDays(new Date(), 30));
    }).length,
    totalValue: contracts.reduce((acc, c) => acc + (Number(c.value) || 0), 0)
  };

  // Prepare data for financial chart (monthly obligations)
  const monthlyData = Array.from({ length: 6 }).map((_, i) => {
    const date = addDays(startOfMonth(new Date()), -i * 30);
    const monthName = format(date, 'MMM', { locale: ptBR });
    const value = contracts
      .filter(c => {
        if (!c.start_date) return false;
        const start = parseISO(c.start_date);
        return start.getMonth() === date.getMonth() && start.getFullYear() === date.getFullYear();
      })
      .reduce((acc, c) => acc + (Number(c.value) || 0), 0);
    
    return { name: monthName, value };
  }).reverse();

  const recentContracts = contracts.slice(0, 5);

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      await seedSampleContracts();
      fetchContracts();
      toast.success("Dados de exemplo gerados com sucesso!");
    } catch (error) {
      console.error("Error seeding data:", error);
      toast.error("Erro ao gerar dados de exemplo");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header with Seed Button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-[24px] font-bold text-foreground">Dashboard</h1>
          <p className="text-[14px] text-muted-foreground">Visão geral da sua gestão contratual</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 border-border text-muted-foreground hover:bg-muted rounded-lg text-[12px] font-semibold"
          onClick={handleSeedData}
          disabled={seeding}
        >
          {seeding ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
          {seeding ? 'Gerando...' : 'Gerar Dados de Exemplo'}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="border border-border shadow-none bg-card rounded-xl p-5 flex flex-col gap-2">
            <CardDescription className="text-muted-foreground uppercase tracking-[0.5px] font-semibold">Obrigações Financeiras (Mês)</CardDescription>
            <CardTitle className="text-[24px] font-bold text-foreground">
              {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(stats.totalValue)}
            </CardTitle>
          <div className="flex items-center gap-1 text-[11px] text-[#00B031] font-medium">
            <TrendingUp size={14} />
            <span>↑ 12% vs mês anterior</span>
          </div>
        </Card>

        <Card className="border border-border shadow-none bg-card rounded-xl p-5 flex flex-col gap-2">
          <span className="text-[12px] text-muted-foreground uppercase tracking-[0.5px] font-semibold">Contratos a Vencer (30 dias)</span>
          <span className="text-[24px] font-bold text-foreground">{stats.expiringSoon.toString().padStart(2, '0')}</span>
          <div className="flex items-center gap-1 text-[11px] text-[#FF3B30] font-medium">
            <AlertTriangle size={14} />
            <span>Ação requerida em {stats.expiringSoon} contratos</span>
          </div>
        </Card>

        <Card className="border border-border shadow-none bg-card rounded-xl p-5 flex flex-col gap-2">
          <span className="text-[12px] text-muted-foreground uppercase tracking-[0.5px] font-semibold">Assinaturas Pendentes</span>
          <span className="text-[24px] font-bold text-foreground">{stats.pending.toString().padStart(2, '0')}</span>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
            <Clock size={14} />
            <span>Média de conclusão: 2.4 dias</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Financial Obligations Chart */}
        <Card className="lg:col-span-2 border border-border shadow-none bg-card rounded-xl overflow-hidden">
          <div className="p-5 border-b border-border flex justify-between items-center">
            <h2 className="text-[16px] font-semibold text-foreground">Obrigações Financeiras Mensais</h2>
            <div className="text-[12px] text-primary cursor-pointer font-medium">Ver histórico completo</div>
          </div>
          <CardContent className="h-[300px] p-5">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
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

        {/* Recent Activity */}
        <Card className="border border-border shadow-none bg-card rounded-xl overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="text-[16px] font-semibold text-foreground">Atividade Recente</h2>
          </div>
          <CardContent className="p-5">
            <div className="space-y-5">
              {recentContracts.length > 0 ? (
                recentContracts.map((contract) => {
                  const isExpiringSoon = contract.end_date && 
                    isAfter(parseISO(contract.end_date), new Date()) && 
                    isBefore(parseISO(contract.end_date), addDays(new Date(), 7));

                  return (
                    <div 
                      key={contract.id} 
                      className={`flex items-start gap-4 group cursor-pointer p-2 -mx-2 rounded-lg transition-colors ${isExpiringSoon ? 'bg-red-500/10' : 'hover:bg-muted'}`}
                      onClick={() => onSelectContract(contract.id)}
                    >
                      <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                        contract.status === 'approved' ? 'bg-[#00B031]' :
                        contract.status === 'pending' ? 'bg-[#FF9500]' :
                        contract.status === 'rejected' ? 'bg-[#FF3B30]' : 'bg-slate-300'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {contract.title}
                          </p>
                          {isExpiringSoon && (
                            <span className="shrink-0 px-1.5 py-0.5 bg-[#FF3B30] text-white text-[9px] font-bold rounded-[4px] animate-pulse">
                              URGENTE
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)} • {format(parseISO(contract.updated_at || contract.created_at), 'dd/MM/yyyy')}
                          {isExpiringSoon && ` • Vence em ${format(parseISO(contract.end_date), 'dd/MM')}`}
                        </p>
                      </div>
                      <ArrowUpRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Nenhum contrato recente</p>
                </div>
              )}
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-6 border-border text-muted-foreground hover:bg-muted rounded-md text-[13px] font-semibold h-10"
              onClick={() => onSelectContract('all')}
            >
              Ver todos os contratos
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
