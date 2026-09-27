import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../contexts/AuthContext'
import { useContracts } from '../hooks/useContracts'
import { checkPlan, trialDaysRemaining } from '../lib/plans'
import { useCheckoutModal } from '../contexts/CheckoutModalContext'
import {
  Plus, FileText, TrendingUp, AlertTriangle, Clock, CheckCircle2,
  XCircle, Download, BarChart3, DollarSign, RefreshCw, Users,
  CreditCard, Target, ArrowUpRight, ShieldAlert,
} from 'lucide-react'
import { format, parseISO, addDays, startOfMonth, endOfMonth, isBefore, isAfter, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, AreaChart, Area,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import OnboardingWalkthrough from './OnboardingWalkthrough'

// ─── Cores ─────────────────────────────────────────
const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))']
const RISK_COLORS = ['#22c55e', '#f59e0b', '#ef4444']

const QUICK_ACTIONS = [
  { icon: FileText, label: 'Novo Contrato',  path: '/contracts/new' },
  { icon: Users,    label: 'Novo Cliente',   path: '/clients/new'   },
  { icon: DollarSign, label: 'Nova Factura', path: '/invoices/new'  },
  { icon: Clock,    label: 'Ver Contratos',  path: '/contracts'     },
]

// ─── Status badge helper ────────────────────────────
const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  approved: { label: 'Assinado',  variant: 'default'     },
  pending:  { label: 'Pendente',  variant: 'secondary'   },
  rejected: { label: 'Rejeitado', variant: 'destructive' },
  draft:    { label: 'Rascunho',  variant: 'outline'     },
}

// ─── Stat Card (estilo AdminCN statistics-card-01) ──
function StatCard({
  icon, value, label, changeLabel, iconClassName, valueClassName,
}: {
  icon: React.ReactNode; value: React.ReactNode; label: string
  changeLabel?: string; iconClassName?: string; valueClassName?: string
}) {
  return (
    <Card>
      <CardHeader className="flex items-center gap-3 pb-2">
        <div className={`bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-md ${iconClassName ?? ''}`}>
          {icon}
        </div>
        <span className={`text-2xl font-bold ${valueClassName ?? ''}`}>{value}</span>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <span className="text-sm font-semibold">{label}</span>
        {changeLabel && (
          <p className="text-xs text-muted-foreground">{changeLabel}</p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Loading Skeleton ───────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-32 w-full rounded-lg" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-lg" />)}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1,2,3].map(i => <Skeleton key={i} className="h-56 rounded-lg" />)}
      </div>
    </div>
  )
}

// ─── Main ───────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const { user, plan, isAdmin, isInTrial, trialEndsAt, onboardingCompleted, setOnboardingCompleted } = useAuth()
  const { openCheckout } = useCheckoutModal()
  const { data: contractsData, isLoading } = useContracts()
  const contracts = contractsData?.data ?? []
  const [showOnboarding, setShowOnboarding] = useState(false)

  const canUseCharts = checkPlan(plan, 'pro', isAdmin, trialEndsAt)
  const canExport    = checkPlan(plan, 'enterprise', isAdmin, trialEndsAt)

  useEffect(() => {
    if (!isLoading && contracts.length === 0 && user && !onboardingCompleted) {
      setShowOnboarding(true)
    }
  }, [isLoading, contracts, user, onboardingCompleted])

  // ── Métricas ──────────────────────────────────────
  const today      = new Date()
  const monthStart = startOfMonth(today)
  const monthEnd   = endOfMonth(today)

  const expiringContracts = contracts.filter(c => {
    if (!c.end_date) return false
    const end = parseISO(c.end_date)
    return isAfter(end, today) && isBefore(end, addDays(today, 30))
  })
  const expiredContracts = contracts.filter(c =>
    c.end_date && isBefore(parseISO(c.end_date), today) && c.status !== 'rejected'
  )
  const monthlyObligations = contracts
    .filter(c => c.start_date && c.end_date && isBefore(parseISO(c.start_date), monthEnd) && isAfter(parseISO(c.end_date), monthStart))
    .reduce((acc, c) => acc + (Number(c.value) || 0), 0)

  const totalValue    = contracts.reduce((acc, c) => acc + (Number(c.value) || 0), 0)
  const approvedCount = contracts.filter(c => c.status === 'approved').length
  const pendingCount  = contracts.filter(c => c.status === 'pending').length
  const highRisk      = contracts.filter(c => c.risk_level === 'high').length
  const autoRenew     = contracts.filter(c => c.auto_renew).length
  const criticalAlerts = expiringContracts.length + expiredContracts.length + highRisk

  const fmt = (n: number) =>
    new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumSignificantDigits: 3 }).format(n)

  // ── Dados gráficos ────────────────────────────────
  const statusData = [
    { name: 'Assinados',  value: approvedCount },
    { name: 'Pendentes',  value: pendingCount  },
    { name: 'Rejeitados', value: contracts.filter(c => c.status === 'rejected').length },
    { name: 'Rascunhos',  value: contracts.filter(c => c.status === 'draft').length    },
  ].filter(d => d.value > 0)

  const riskData = [
    { name: 'Baixo',  value: contracts.filter(c => c.risk_level === 'low').length    },
    { name: 'Médio',  value: contracts.filter(c => c.risk_level === 'medium').length },
    { name: 'Alto',   value: highRisk },
  ]

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(today, 5 - i)
    const s = startOfMonth(d); const e = endOfMonth(d)
    const mc = contracts.filter(c => c.created_at && isAfter(parseISO(c.created_at), s) && isBefore(parseISO(c.created_at), e))
    return {
      month:     format(d, 'MMM', { locale: ptBR }),
      contratos: mc.length,
      valor:     mc.reduce((a, c) => a + (Number(c.value) || 0), 0),
    }
  })

  const recentContracts = contracts.slice(0, 5)
  const isNewUser = contracts.length === 0

  if (isLoading) return <DashboardSkeleton />

  return (
    <div className="flex flex-col gap-6">

      {/* Onboarding */}
      {showOnboarding && (
        <OnboardingWalkthrough onComplete={async () => {
          await setOnboardingCompleted()
          setShowOnboarding(false)
        }} />
      )}

      {/* Trial Banner */}
      {isInTrial && (
        <div className="flex items-center justify-between gap-4 rounded-lg bg-primary px-5 py-3 text-primary-foreground flex-wrap">
          <div className="flex items-center gap-3">
            <CreditCard className="size-4 shrink-0" />
            <span className="text-sm font-semibold">
              Trial Pro activo —{' '}
              <span className="opacity-80">
                {trialDaysRemaining(trialEndsAt)} dia{trialDaysRemaining(trialEndsAt) !== 1 ? 's' : ''} restante{trialDaysRemaining(trialEndsAt) !== 1 ? 's' : ''}
              </span>
            </span>
            <span className="text-xs opacity-70 hidden sm:inline">
              Estás a usar o Agree Pro gratuitamente.
            </span>
          </div>
          <Button size="sm" variant="secondary" onClick={() => openCheckout('pro')}>
            Subscrever agora
          </Button>
        </div>
      )}

      {/* Alert Banner */}
      {!isNewUser && criticalAlerts > 0 && (
        <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-5 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-bold text-amber-800 dark:text-amber-300">
              {criticalAlerts} alerta{criticalAlerts > 1 ? 's' : ''} que requer{criticalAlerts === 1 ? '' : 'em'} atenção
            </span>
          </div>
          <div className="flex flex-col gap-1 pl-6">
            {expiredContracts.length > 0 && (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <XCircle className="inline size-3 mr-1" />
                <strong>{expiredContracts.length}</strong> contrato{expiredContracts.length > 1 ? 's' : ''} expirado{expiredContracts.length > 1 ? 's' : ''}
              </p>
            )}
            {expiringContracts.length > 0 && (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <Clock className="inline size-3 mr-1" />
                <strong>{expiringContracts.length}</strong> a expirar nos próximos 30 dias
              </p>
            )}
            {highRisk > 0 && (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <ShieldAlert className="inline size-3 mr-1" />
                <strong>{highRisk}</strong> com risco alto
              </p>
            )}
          </div>
        </div>
      )}

      {/* Hero / Welcome Card */}
      <Card className="relative overflow-hidden border-0 bg-primary text-primary-foreground">
        <div className="pointer-events-none absolute -right-8 -top-8 size-48 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-48 size-44 rounded-full bg-white/5 blur-3xl" />
        <CardContent className="relative z-10 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              Olá, {user?.user_metadata?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Utilizador'}!
            </h1>
            <p className="text-sm opacity-80">
              {isNewUser
                ? 'Bem-vindo ao Agree. Cria o teu primeiro contrato em segundos.'
                : 'Gere os teus contratos com total segurança e controlo.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.slice(0, isNewUser ? 3 : 4).map(qa => (
              <Button
                key={qa.path}
                variant="secondary"
                size="sm"
                onClick={() => navigate(qa.path)}
                className="gap-1.5 bg-white/10 text-primary-foreground border-white/20 hover:bg-white/20"
              >
                <qa.icon className="size-3.5" />
                {qa.label}
              </Button>
            ))}
            {canExport && !isNewUser && (
              <Button variant="secondary" size="sm" className="gap-1.5 bg-white/10 text-primary-foreground border-white/20 hover:bg-white/20" onClick={() => toast.info('Exportação em breve')}>
                <Download className="size-3.5" /> Exportar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      {!isNewUser && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
          <StatCard icon={<FileText className="size-4" />}      value={contracts.length} label="Total contratos" />
          <StatCard icon={<CheckCircle2 className="size-4" />}  value={approvedCount}    label="Assinados" />
          <StatCard
            icon={<Clock className="size-4" />}
            value={pendingCount}
            label="Pendentes"
            iconClassName="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
          />
          <StatCard
            icon={<AlertTriangle className="size-4" />}
            value={criticalAlerts}
            label="Alertas críticos"
            iconClassName={criticalAlerts > 0 ? 'bg-destructive/10 text-destructive' : ''}
            valueClassName={criticalAlerts > 0 ? 'text-destructive' : ''}
          />
          <StatCard
            icon={<DollarSign className="size-4" />}
            value={<span className="text-lg">{fmt(monthlyObligations)}</span>}
            label="Obrigações este mês"
          />
          <StatCard
            icon={<TrendingUp className="size-4" />}
            value={<span className="text-lg">{fmt(totalValue)}</span>}
            label="Valor total"
          />
          <StatCard
            icon={<RefreshCw className="size-4" />}
            value={autoRenew}
            label="Auto-renovação"
            iconClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
          />
        </div>
      )}

      {/* Charts — Pro */}
      {!isNewUser && canUseCharts && contracts.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Status Pie */}
          {statusData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Status dos Contratos</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70}>
                      {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {statusData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <div className="size-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-xs text-muted-foreground">{d.name} ({d.value})</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risk Bar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Distribuição de Riscos</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={riskData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  <Bar dataKey="value" radius={[4,4,0,0]}>
                    {riskData.map((_, i) => <Cell key={i} fill={RISK_COLORS[i % RISK_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Evolução Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  <Area type="monotone" dataKey="contratos" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pro upgrade prompt */}
      {!isNewUser && !canUseCharts && contracts.length > 0 && (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 flex-wrap p-5">
            <div className="flex items-center gap-3">
              <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-md">
                <BarChart3 className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">Gráficos e Analytics</p>
                <p className="text-xs text-muted-foreground">Actualiza para Pro para veres gráficos detalhados.</p>
              </div>
            </div>
            <Button size="sm" onClick={() => openCheckout('pro')}>Actualizar para Pro</Button>
          </CardContent>
        </Card>
      )}

      {/* Bottom Grid */}
      {!isNewUser && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

          {/* Contratos Recentes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold">Contratos Recentes</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-auto p-0 hover:text-foreground" onClick={() => navigate('/contracts')}>
                Ver todos <ArrowUpRight className="ml-1 size-3" />
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-4 pt-0">
              {recentContracts.length > 0 ? recentContracts.map(c => {
                const s = STATUS_MAP[c.status] ?? STATUS_MAP.draft
                return (
                  <div
                    key={c.id}
                    onClick={() => navigate(`/contracts/${c.id}`)}
                    className="flex cursor-pointer items-center gap-3 rounded-md border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-md">
                      {c.status === 'approved' ? <CheckCircle2 className="size-4" /> :
                       c.status === 'pending'  ? <Clock className="size-4 text-amber-500" /> :
                       c.status === 'rejected' ? <AlertTriangle className="size-4 text-destructive" /> :
                       <FileText className="size-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.created_at ? format(parseISO(c.created_at), 'dd MMM yyyy', { locale: ptBR }) : ''}
                      </p>
                    </div>
                    <Badge variant={s.variant} className="shrink-0 text-xs">{s.label}</Badge>
                  </div>
                )
              }) : (
                <p className="text-sm text-muted-foreground text-center py-4">Sem contratos recentes</p>
              )}
            </CardContent>
          </Card>

          {/* Right column */}
          <div className="flex flex-col gap-4">

            {/* A expirar */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className={`flex size-9 shrink-0 items-center justify-center rounded-md ${expiringContracts.length > 0 ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                  <AlertTriangle className="size-4" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-sm font-semibold">A expirar</CardTitle>
                  <p className="text-xs text-muted-foreground">Nos próximos 30 dias</p>
                </div>
                <span className={`text-2xl font-bold ${expiringContracts.length > 0 ? 'text-destructive' : ''}`}>
                  {expiringContracts.length}
                </span>
              </CardHeader>
              {expiringContracts.length > 0 && (
                <CardContent className="flex flex-col gap-1.5 pt-0">
                  {expiringContracts.slice(0, 3).map(c => (
                    <div
                      key={c.id}
                      onClick={() => navigate(`/contracts/${c.id}`)}
                      className="flex cursor-pointer items-center justify-between rounded-md bg-destructive/5 hover:bg-destructive/10 px-3 py-2 transition-colors"
                    >
                      <span className="text-xs font-medium truncate max-w-[160px]">{c.title}</span>
                      <span className="text-xs text-destructive font-semibold shrink-0">
                        {c.end_date ? format(parseISO(c.end_date), 'dd/MM/yy') : '—'}
                      </span>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>

            {/* Acções rápidas */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Acções Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map(qa => (
                  <Button
                    key={qa.path}
                    variant="outline"
                    className="h-auto flex-col gap-2 py-4 text-xs font-medium"
                    onClick={() => navigate(qa.path)}
                  >
                    <qa.icon className="size-5" />
                    {qa.label}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Empty State */}
      {isNewUser && (
        <Card className="text-center">
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <div className="bg-primary/10 flex size-20 items-center justify-center rounded-2xl">
              <Target className="size-10 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Bem-vindo ao Agree!</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                O teu painel está vazio. Cria o teu primeiro contrato, adiciona um cliente ou gera a tua primeira factura para veres as estatísticas aqui.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap justify-center mt-2">
              <Button onClick={() => navigate('/contracts/new')} className="gap-2">
                <Plus className="size-4" /> Criar Primeiro Contrato
              </Button>
              <Button variant="outline" onClick={() => setShowOnboarding(true)}>
                Ver Tutorial
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
