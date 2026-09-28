import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useContracts } from '../hooks/useContracts'
import { checkPlan, trialDaysRemaining } from '../lib/plans'
import { useCheckoutModal } from '../contexts/CheckoutModalContext'
import { FileTextIcon, TriangleAlertIcon, CalendarX2Icon, CreditCard } from 'lucide-react'
import { addDays, startOfMonth, endOfMonth, isBefore, isAfter, parseISO } from 'date-fns'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import StatisticsCard from '@/views/dashboards/statistics/statistics-card-01'
import ContractInsightsWidget from '@/views/dashboards/widgets/widget-product-insights'
import TotalValueWidget from '@/views/dashboards/widgets/widget-total-earning'
import ContractMetricsChart from '@/views/dashboards/charts/chart-sales-metrics'
import ContractDatatable, { type Item } from '@/views/datatables/datatable-transaction'
import OnboardingWalkthrough from './OnboardingWalkthrough'

function DashboardSkeleton() {
  return (
    <div className='grid grid-cols-2 gap-6 lg:grid-cols-3'>
      <div className='col-span-full grid gap-6 sm:grid-cols-3'>
        {[1,2,3].map(i => <Skeleton key={i} className='h-32 rounded-lg' />)}
      </div>
      <Skeleton className='col-span-full h-64 rounded-lg lg:col-span-1' />
      <Skeleton className='col-span-full h-64 rounded-lg lg:col-span-1' />
      <Skeleton className='col-span-full h-80 rounded-lg xl:col-span-2' />
      <Skeleton className='col-span-full h-64 rounded-lg' />
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, plan, isAdmin, isInTrial, trialEndsAt, onboardingCompleted, setOnboardingCompleted } = useAuth()
  const { openCheckout } = useCheckoutModal()
  const { data: contractsData, isLoading } = useContracts()
  const contracts = contractsData?.data ?? []
  const [showOnboarding, setShowOnboarding] = useState(false)

  const canUseCharts = checkPlan(plan, 'pro', isAdmin, trialEndsAt)

  useEffect(() => {
    if (!isLoading && contracts.length === 0 && user && !onboardingCompleted) {
      setShowOnboarding(true)
    }
  }, [isLoading, contracts, user, onboardingCompleted])

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
    .filter(c => c.start_date && c.end_date
      && isBefore(parseISO(c.start_date), monthEnd)
      && isAfter(parseISO(c.end_date), monthStart))
    .reduce((a, c) => a + (Number(c.value) || 0), 0)

  const totalValue    = contracts.reduce((a, c) => a + (Number(c.value) || 0), 0)
  const approvedCount = contracts.filter(c => c.status === 'approved').length
  const pendingCount  = contracts.filter(c => c.status === 'pending').length
  const highRisk      = contracts.filter(c => c.risk_level === 'high').length
  const criticalAlerts = expiringContracts.length + expiredContracts.length + highRisk

  const fmt = (n: number) =>
    new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumSignificantDigits: 4 }).format(n)

  const approvedPct = contracts.length > 0
    ? `+${((approvedCount / contracts.length) * 100).toFixed(1)}%`
    : '0%'

  // Stats cards — idêntico ao AdminCN
  const statisticsCardData = [
    {
      icon: <FileTextIcon className='size-4' />,
      value: String(contracts.length),
      title: 'Total de Contratos',
      changePercentage: approvedPct
    },
    {
      icon: <TriangleAlertIcon className='size-4' />,
      value: String(criticalAlerts),
      title: 'Alertas Críticos',
      changePercentage: criticalAlerts > 0 ? `${criticalAlerts} alertas activos` : 'Sem alertas'
    },
    {
      icon: <CalendarX2Icon className='size-4' />,
      value: String(expiringContracts.length),
      title: 'A Expirar (30 dias)',
      changePercentage: `${expiredContracts.length} já expirados`
    }
  ]

  // Total value widget data
  const earningData = [
    {
      icon: <FileTextIcon className='size-5 text-primary' />,
      platform: 'Contratos Pendentes',
      description: `${pendingCount} contrato${pendingCount !== 1 ? 's' : ''}`,
      earnings: fmt(pendingCount * (totalValue / Math.max(contracts.length, 1))),
      progressPercentage: contracts.length > 0 ? Math.round((pendingCount / contracts.length) * 100) : 0
    },
    {
      icon: <TriangleAlertIcon className='size-5 text-primary' />,
      platform: 'A Expirar',
      description: `${expiringContracts.length} nos próximos 30 dias`,
      earnings: fmt(expiringContracts.reduce((a, c) => a + (Number(c.value) || 0), 0)),
      progressPercentage: contracts.length > 0 ? Math.round((expiringContracts.length / contracts.length) * 100) : 0
    }
  ]

  // Datatable data
  const tableData: Item[] = contracts.slice(0, 25).map(c => ({
    id:               c.id,
    title:            c.title,
    counterparty_name: c.counterparty_name,
    value:            c.value,
    status:           c.status,
    created_at:       c.created_at,
    end_date:         c.end_date,
  }))

  if (isLoading) return <DashboardSkeleton />

  return (
    <div className='grid grid-cols-2 gap-6 lg:grid-cols-3'>

      {/* Onboarding */}
      {showOnboarding && (
        <div className='col-span-full'>
          <OnboardingWalkthrough onComplete={async () => {
            await setOnboardingCompleted()
            setShowOnboarding(false)
          }} />
        </div>
      )}

      {/* Trial Banner */}
      {isInTrial && (
        <div className='col-span-full flex items-center justify-between gap-4 rounded-lg bg-primary px-5 py-3 text-primary-foreground flex-wrap'>
          <div className='flex items-center gap-3'>
            <CreditCard className='size-4 shrink-0' />
            <span className='text-sm font-semibold'>
              Trial Pro activo — {trialDaysRemaining(trialEndsAt)} dia{trialDaysRemaining(trialEndsAt) !== 1 ? 's' : ''} restante{trialDaysRemaining(trialEndsAt) !== 1 ? 's' : ''}
            </span>
          </div>
          <Button size='sm' variant='secondary' onClick={() => openCheckout('pro')}>
            Subscrever agora
          </Button>
        </div>
      )}

      {/* ── Statistics Cards (linha de topo — 3 colunas como no AdminCN) ── */}
      <div className='col-span-full grid gap-6 sm:grid-cols-3 md:max-lg:grid-cols-1'>
        {statisticsCardData.map((card, i) => (
          <StatisticsCard key={i}
            icon={card.icon}
            value={card.value}
            title={card.title}
            changePercentage={card.changePercentage}
          />
        ))}
      </div>

      {/* ── Coluna esquerda: Insights + Total Value ── */}
      <div className='grid gap-6 max-xl:col-span-full lg:max-xl:grid-cols-2'>
        <ContractInsightsWidget
          totalContracts={contracts.length}
          approvedContracts={approvedCount}
          className='justify-between gap-3 *:data-[slot=card-content]:space-y-5'
        />
        <TotalValueWidget
          title='Valor Total'
          earning={fmt(totalValue)}
          trend='up'
          percentage={approvedPct.replace(/[^0-9.]/g, '') ? parseFloat(approvedPct) : 0}
          comparisonText={`${fmt(monthlyObligations)} em obrigações este mês`}
          earningData={earningData}
          className='justify-between gap-5 sm:min-w-0'
        />
      </div>

      {/* ── Métricas (2 colunas como no AdminCN) ── */}
      {canUseCharts ? (
        <ContractMetricsChart
          totalContracts={contracts.length}
          approvedCount={approvedCount}
          pendingCount={pendingCount}
          highRisk={highRisk}
          monthlyValue={fmt(monthlyObligations)}
          totalValue={fmt(totalValue)}
          className='col-span-full *:data-[slot=card-content]:space-y-6 xl:col-span-2'
        />
      ) : (
        <Card className='col-span-full xl:col-span-2 flex items-center justify-center py-16'>
          <div className='text-center flex flex-col items-center gap-4'>
            <p className='font-semibold'>Métricas avançadas disponíveis no plano Pro</p>
            <Button size='sm' onClick={() => openCheckout('pro')}>Actualizar para Pro</Button>
          </div>
        </Card>
      )}

      {/* ── Tabela de contratos (linha completa como no AdminCN) ── */}
      <Card className='col-span-full w-full py-0'>
        <ContractDatatable
          data={tableData}
          onView={id => navigate(`/contracts/${id}`)}
          onEdit={id => navigate(`/contracts/${id}/edit`)}
          onDelete={() => {}}
        />
      </Card>

    </div>
  )
}
