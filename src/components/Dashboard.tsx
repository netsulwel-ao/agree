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

  // Contratos a expirar nos próximos 30 dias
  const expiringContracts = contracts.filter(c => {
    if (!c.end_date) return false;
    const end = parseISO(c.end_date);
    return isAfter(end, today) && isBefore(end, addDays(today, 30));
  });

  // Contratos já expirados mas ainda ativos
  const expiredContracts = contracts.filter(c => {
    if (!c.end_date) return false;
    return isBefore(parseISO(c.end_date), today) && c.status !== 'rejected';
  });

  // Obrigações financeiras do mês atual
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const monthlyObligations = contracts
    .filter(c => {
      if (!c.start_date || !c.end_date) return false;
      const start = parseISO(c.start_date);
      const end = parseISO(c.end_date);
      return isBefore(start, monthEnd) && isAfter(end, monthStart);
    })
    .reduce((acc, c) => acc + (Number(c.value) || 0), 0);

  const stats = {
    total: contracts.length,
    pending: contracts.filter(c => c.status === 'pending').length,
    approved: contracts.filter(c => c.status === 'approved').length,
    highRisk: contracts.filter(c => c.risk_level === 'high').length,
    monthlyObligations,
    expiring: expiringContracts.length,
    expired: expiredContracts.length,
    criticalAlerts: expiringContracts.length + expiredContracts.length + contracts.filter(c => c.risk_level === 'high').length
  };

  const recentContracts = contracts.slice(0, 5);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 size={16} className="text-teal-500" />;
      case 'pending': return <Clock size={16} className="text-amber-500" />;
      case 'rejected': return <AlertTriangle size={16} className="text-red-500" />;
      default: return <FileText size={16} className="text-slate-500" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved': return "bg-teal-500/10 text-teal-600";
      case 'pending': return "bg-amber-500/10 text-amber-600";
      case 'rejected': return "bg-red-500/10 text-red-600";
      default: return "bg-slate-100 text-slate-500";
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 font-[Poppins]">
        <div className="h-40 rounded-3xl bg-slate-200 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1,2,3,4].map(i => <div key={i} className="h-32 rounded-2xl bg-slate-200 animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 rounded-3xl bg-slate-200 animate-pulse" />
          <div className="h-80 rounded-3xl bg-slate-200 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 font-[Poppins]">

      {/* Alertas críticos */}
      {stats.criticalAlerts > 0 && (
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2.5 mb-1">
            <Bell size={18} className="text-amber-500" />
            <span className="text-sm font-bold text-orange-900">
              {stats.criticalAlerts} alerta{stats.criticalAlerts > 1 ? 's' : ''} que requer{stats.criticalAlerts === 1 ? '' : 'em'} atenção
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {expiredContracts.length > 0 && (
              <div className="flex items-center gap-2">
                <XCircle size={14} className="text-red-500" />
                <span className="text-[13px] text-red-900">
                  <strong>{expiredContracts.length}</strong> contrato{expiredContracts.length > 1 ? 's' : ''} expirado{expiredContracts.length > 1 ? 's' : ''}: {expiredContracts.slice(0, 2).map(c => c.title).join(', ')}{expiredContracts.length > 2 ? '...' : ''}
                </span>
              </div>
            )}
            {expiringContracts.length > 0 && (
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-amber-500" />
                <span className="text-[13px] text-orange-900">
                  <strong>{expiringContracts.length}</strong> contrato{expiringContracts.length > 1 ? 's' : ''} a expirar nos próximos 30 dias
                </span>
              </div>
            )}
            {stats.highRisk > 0 && (
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-red-500" />
                <span className="text-[13px] text-red-900">
                  <strong>{stats.highRisk}</strong> contrato{stats.highRisk > 1 ? 's' : ''} com risco alto identificado
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute left-48 -bottom-16 w-44 h-44 bg-black/10 rounded-full blur-2xl" />

        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold mb-2">
            Olá, {user?.user_metadata?.name?.split(' ')[0] || 'Usuário'}! 👋
          </h1>
          <p className="text-[15px] opacity-90 mb-6">
            Gerencie os seus contratos com total segurança e inteligência.
          </p>
          <button
            onClick={() => navigate('/contracts/new')}
            className="inline-flex items-center gap-2.5 px-6 py-3 bg-white text-teal-600 border-none rounded-2xl text-sm font-bold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg shadow-black/10"
          >
            <Plus size={18} />
            Novo Contrato
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { 
            icon: <FileText size={22} className="text-teal-600" />, 
            bg: 'bg-teal-500/10',
            value: stats.total, 
            label: 'Total de contratos' 
          },
          { 
            icon: <Clock size={22} className="text-amber-500" />, 
            bg: 'bg-amber-500/10',
            value: stats.pending, 
            label: 'Pendentes de assinatura' 
          },
          { 
            icon: <TrendingUp size={22} className="text-teal-600" />, 
            bg: 'bg-teal-500/10',
            value: new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumSignificantDigits: 3 }).format(stats.monthlyObligations), 
            label: 'Obrigações este mês' 
          },
          { 
            icon: <AlertTriangle size={22} className={stats.criticalAlerts > 0 ? 'text-red-500' : 'text-teal-600'} />, 
            bg: stats.criticalAlerts > 0 ? 'bg-red-500/10' : 'bg-teal-500/10',
            value: stats.criticalAlerts, 
            label: stats.criticalAlerts === 0 ? 'Sem alertas críticos' : 'Alertas críticos',
            valueColor: stats.criticalAlerts > 0 ? 'text-red-500' : 'text-slate-900'
          }
        ].map((stat, i) => (
          <div key={i} className="bg-white/40 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-3xl p-6 transition-all hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,0,0,0.06)]">
            <div className={`w-11 h-11 rounded-2xl ${stat.bg} flex items-center justify-center mb-4`}>
              {stat.icon}
            </div>
            <div className={`text-3xl font-extrabold mb-1 ${stat.valueColor || 'text-slate-900'}`}>
              {stat.value}
            </div>
            <div className="text-[13px] text-slate-500 flex items-center gap-1.5">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Contracts & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Contracts */}
        <div className="bg-white/40 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-3xl overflow-hidden flex flex-col">
          <div className="p-6 pb-4 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Contratos Recentes</h2>
          </div>
          <div className="px-6 pb-6 flex-1">
            {recentContracts.length > 0 ? (
              <div className="flex flex-col gap-3">
                {recentContracts.map((contract) => (
                  <div 
                    key={contract.id} 
                    onClick={() => navigate(`/contracts/${contract.id}`)} 
                    className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer transition-colors hover:bg-teal-50/50 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      {getStatusIcon(contract.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 mb-0.5 truncate group-hover:text-teal-700 transition-colors">
                        {contract.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {contract.created_at ? format(parseISO(contract.created_at), 'dd MMM yyyy', { locale: ptBR }) : ''}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg shrink-0 ${getStatusBadgeClass(contract.status)}`}>
                      {contract.status === 'approved' ? 'Assinado' : contract.status === 'pending' ? 'Pendente' : contract.status === 'rejected' ? 'Rejeitado' : 'Rascunho'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 flex flex-col items-center">
                <FileText size={40} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">Nenhum contrato ainda</p>
                <p className="text-xs mt-1">Crie o seu primeiro contrato</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions / Expiring */}
        <div className="flex flex-col gap-5">
          
          <div className="bg-white/70 backdrop-blur-lg border border-slate-200/60 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stats.expiring > 0 ? 'bg-red-500/10' : 'bg-teal-500/10'}`}>
                <AlertTriangle size={20} className={stats.expiring > 0 ? 'text-red-500' : 'text-teal-600'} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">A expirar</h3>
                <p className="text-xs text-slate-500">Nos próximos 30 dias</p>
              </div>
              <div className="ml-auto">
                <span className={`text-2xl font-extrabold ${stats.expiring > 0 ? 'text-red-500' : 'text-teal-600'}`}>
                  {stats.expiring}
                </span>
              </div>
            </div>
            {expiringContracts.length > 0 && (
              <div className="flex flex-col gap-2 mt-2">
                {expiringContracts.slice(0, 3).map(c => (
                  <div
                    key={c.id}
                    onClick={() => navigate(`/contracts/${c.id}`)}
                    className="flex justify-between items-center px-3 py-2 bg-red-500/5 rounded-xl cursor-pointer transition-colors hover:bg-red-500/10"
                  >
                    <span className="text-xs font-semibold text-slate-900 truncate max-w-[140px]">
                      {c.title}
                    </span>
                    <span className="text-[11px] text-red-500 font-bold shrink-0">
                      {format(parseISO(c.end_date!), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-7 text-white relative overflow-hidden flex-1 flex flex-col justify-center">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full" />
            <div className="relative z-10">
              <h3 className="text-base font-bold mb-2">Precisa de ajuda?</h3>
              <p className="text-[13px] opacity-80 mb-5 leading-relaxed max-w-[250px]">
                A nossa IA ajuda-te a analisar riscos e cláusulas complexas em segundos.
              </p>
              <button
                onClick={() => navigate('/contracts/new')}
                className="w-full py-3 bg-teal-500 hover:bg-teal-600 text-white border-none rounded-2xl text-sm font-bold cursor-pointer transition-all flex items-center justify-center gap-2"
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
