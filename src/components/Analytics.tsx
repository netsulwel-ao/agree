import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useAnalytics } from '../hooks/useAnalytics'
import { TrendingUp, TrendingDown, Users, FileText, Euro, Calendar, BarChart3, PieChart } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ReactNode
  loading?: boolean
}

function MetricCard({ title, value, change, changeLabel, icon, loading }: MetricCardProps) {
  if (loading) return <Card><CardContent className='p-6'><Skeleton className='h-20 w-full' /></CardContent></Card>

  const isPositive = change && change > 0
  const isNegative = change && change < 0

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium text-muted-foreground'>{title}</CardTitle>
        <div className='text-muted-foreground'>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        {change !== undefined && (
          <div className='flex items-center pt-1'>
            {isPositive && <TrendingUp className='size-4 text-green-600 mr-1' />}
            {isNegative && <TrendingDown className='size-4 text-red-600 mr-1' />}
            <span className={`text-xs font-medium ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-muted-foreground'}`}>
              {change > 0 ? '+' : ''}{change}% {changeLabel}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ChartCardProps {
  title: string
  description?: string
  children: React.ReactNode
  loading?: boolean
}

function ChartCard({ title, description, children, loading }: ChartCardProps) {
  if (loading) return (
    <Card className='col-span-2'>
      <CardHeader><Skeleton className='h-6 w-48' /><Skeleton className='h-4 w-32' /></CardHeader>
      <CardContent><Skeleton className='h-80 w-full' /></CardContent>
    </Card>
  )

  return (
    <Card className='col-span-2'>
      <CardHeader>
        <CardTitle className='text-base'>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export default function Analytics() {
  const { user } = useAuth()
  const { data: analytics, isLoading } = useAnalytics()

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(amount)

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {Array.from({length: 4}).map((_, i) => <Skeleton key={i} className='h-32 w-full' />)}
        </div>
        <div className='grid gap-4 md:grid-cols-2'>
          <Skeleton className='h-96 w-full' />
          <Skeleton className='h-96 w-full' />
        </div>
      </div>
    )
  }

  const stats = analytics || {
    totalContracts: 0,
    totalClients: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    contractsThisMonth: 0,
    clientsThisMonth: 0,
    invoicesThisMonth: 0,
    revenueThisMonth: 0,
    contractsByStatus: {},
    invoicesByStatus: {},
    monthlyRevenue: [],
    recentActivity: []
  }

  return (
    <div className='space-y-6'>
      {/* Overview Cards */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <MetricCard
          title='Contratos Totais'
          value={stats.totalContracts}
          change={stats.contractsThisMonth > 0 ? ((stats.contractsThisMonth / Math.max(stats.totalContracts - stats.contractsThisMonth, 1)) * 100) : 0}
          changeLabel='este mês'
          icon={<FileText className='size-4' />}
          loading={isLoading}
        />
        <MetricCard
          title='Clientes Activos'
          value={stats.totalClients}
          change={stats.clientsThisMonth > 0 ? ((stats.clientsThisMonth / Math.max(stats.totalClients - stats.clientsThisMonth, 1)) * 100) : 0}
          changeLabel='este mês'
          icon={<Users className='size-4' />}
          loading={isLoading}
        />
        <MetricCard
          title='Facturas Emitidas'
          value={stats.totalInvoices}
          change={stats.invoicesThisMonth > 0 ? ((stats.invoicesThisMonth / Math.max(stats.totalInvoices - stats.invoicesThisMonth, 1)) * 100) : 0}
          changeLabel='este mês'
          icon={<Calendar className='size-4' />}
          loading={isLoading}
        />
        <MetricCard
          title='Receita Total'
          value={formatCurrency(stats.totalRevenue)}
          change={stats.revenueThisMonth > 0 ? ((stats.revenueThisMonth / Math.max(stats.totalRevenue - stats.revenueThisMonth, 1)) * 100) : 0}
          changeLabel='este mês'
          icon={<Euro className='size-4' />}
          loading={isLoading}
        />
      </div>

      {/* Charts Row */}
      <div className='grid gap-4 md:grid-cols-2'>
        <ChartCard
          title='Contratos por Status'
          description='Distribuição dos contratos por estado actual'
          loading={isLoading}
        >
          <div className='space-y-3'>
            {Object.entries(stats.contractsByStatus || {}).map(([status, count]) => {
              const statusLabels: Record<string, string> = {
                draft: 'Rascunho',
                active: 'Activo',
                expired: 'Expirado',
                terminated: 'Terminado'
              }
              const colors: Record<string, string> = {
                draft: 'bg-gray-500',
                active: 'bg-green-500',
                expired: 'bg-yellow-500',
                terminated: 'bg-red-500'
              }
              const percentage = stats.totalContracts > 0 ? Math.round((count as number / stats.totalContracts) * 100) : 0
              
              return (
                <div key={status} className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <div className={`size-3 rounded-full ${colors[status] || 'bg-gray-400'}`} />
                    <span className='text-sm font-medium'>{statusLabels[status] || status}</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm text-muted-foreground'>{count}</span>
                    <Badge variant='secondary' className='text-xs'>{percentage}%</Badge>
                  </div>
                </div>
              )
            })}
            {Object.keys(stats.contractsByStatus || {}).length === 0 && (
              <div className='flex items-center justify-center h-40 text-muted-foreground'>
                <PieChart className='size-12 mb-2' />
                <p>Sem dados disponíveis</p>
              </div>
            )}
          </div>
        </ChartCard>

        <ChartCard
          title='Facturas por Status'
          description='Estado actual das facturas emitidas'
          loading={isLoading}
        >
          <div className='space-y-3'>
            {Object.entries(stats.invoicesByStatus || {}).map(([status, count]) => {
              const statusLabels: Record<string, string> = {
                draft: 'Rascunho',
                sent: 'Enviada',
                paid: 'Paga',
                overdue: 'Em Atraso',
                cancelled: 'Cancelada'
              }
              const colors: Record<string, string> = {
                draft: 'bg-gray-500',
                sent: 'bg-blue-500',
                paid: 'bg-green-500',
                overdue: 'bg-red-500',
                cancelled: 'bg-gray-400'
              }
              const percentage = stats.totalInvoices > 0 ? Math.round((count as number / stats.totalInvoices) * 100) : 0
              
              return (
                <div key={status} className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <div className={`size-3 rounded-full ${colors[status] || 'bg-gray-400'}`} />
                    <span className='text-sm font-medium'>{statusLabels[status] || status}</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm text-muted-foreground'>{count}</span>
                    <Badge variant='secondary' className='text-xs'>{percentage}%</Badge>
                  </div>
                </div>
              )
            })}
            {Object.keys(stats.invoicesByStatus || {}).length === 0 && (
              <div className='flex items-center justify-center h-40 text-muted-foreground'>
                <BarChart3 className='size-12 mb-2' />
                <p>Sem dados disponíveis</p>
              </div>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Actividade Recente</CardTitle>
          <CardDescription>Últimas acções no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentActivity && stats.recentActivity.length > 0 ? (
            <div className='space-y-4'>
              {stats.recentActivity.slice(0, 5).map((activity: any, index: number) => (
                <div key={index} className='flex items-center gap-3 pb-3 border-b last:border-0'>
                  <div className='bg-primary/10 flex size-8 items-center justify-center rounded-lg'>
                    <FileText className='size-4 text-primary' />
                  </div>
                  <div className='flex-1'>
                    <p className='text-sm font-medium'>{activity.description}</p>
                    <p className='text-xs text-muted-foreground'>{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='flex items-center justify-center h-32 text-muted-foreground'>
              <div className='text-center'>
                <Calendar className='size-12 mx-auto mb-2 opacity-50' />
                <p>Nenhuma actividade recente</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}