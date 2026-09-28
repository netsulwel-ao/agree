'use client'

import { Bar, BarChart, Label, Pie, PieChart } from 'recharts'
import {
  TrendingUpIcon, DollarSignIcon, CheckCircle2Icon,
  ClockIcon, ChartNoAxesCombinedIcon, CirclePercentIcon, FileTextIcon
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

type Props = {
  totalContracts: number
  approvedCount: number
  pendingCount: number
  highRisk: number
  monthlyValue: string
  totalValue: string
  className?: string
}

const ContractMetricsChart = ({
  totalContracts, approvedCount, pendingCount, highRisk, monthlyValue, totalValue, className
}: Props) => {
  const pct = totalContracts > 0 ? Math.round((approvedCount / totalContracts) * 100) : 0
  const totalBars = 24
  const filledBars = Math.round((pct * totalBars) / 100)

  const salesChartData = Array.from({ length: totalBars }, (_, i) => ({
    i,
    sales: i < filledBars ? 315 : 0.0001
  }))
  const salesChartConfig = { sales: { label: 'Aprovados' } } satisfies ChartConfig

  const metricsData = [
    { icon: <TrendingUpIcon className='size-5' />,    title: 'Valor este mês',  value: monthlyValue },
    { icon: <DollarSignIcon className='size-5' />,    title: 'Valor total',      value: totalValue   },
    { icon: <CheckCircle2Icon className='size-5' />,  title: 'Assinados',        value: String(approvedCount) },
    { icon: <ClockIcon className='size-5' />,         title: 'Pendentes',        value: String(pendingCount)  },
  ]

  const revenueData = [
    { month: 'assinados', sales: approvedCount || 1, fill: 'var(--color-assinados)' },
    { month: 'pendentes', sales: pendingCount  || 1, fill: 'var(--color-pendentes)' },
    { month: 'risco',     sales: highRisk      || 1, fill: 'var(--color-risco)'     },
  ]
  const revenueConfig = {
    sales:     { label: 'Contratos'  },
    assinados: { label: 'Assinados',  color: 'var(--primary)'                                         },
    pendentes: { label: 'Pendentes',  color: 'color-mix(in oklab, var(--primary) 60%, transparent)'   },
    risco:     { label: 'Risco Alto', color: 'color-mix(in oklab, var(--primary) 20%, transparent)'   },
  } satisfies ChartConfig

  return (
    <Card className={className}>
      <CardContent>
        <div className='grid gap-6 lg:grid-cols-5'>
          {/* Esquerda */}
          <div className='flex flex-col justify-between gap-7 lg:col-span-3'>
            <span className='text-lg font-semibold'>Métricas de contratos</span>
            <div className='flex items-center gap-3'>
              <div className='bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg'>
                <FileTextIcon className='size-5 text-primary' />
              </div>
              <div className='flex flex-col gap-0.5'>
                <span className='text-xl font-medium'>Gestão de Contratos</span>
                <span className='text-muted-foreground text-sm'>Agree · Painel</span>
              </div>
            </div>
            <div className='grid gap-4 sm:grid-cols-2'>
              {metricsData.map((m, i) => (
                <Card key={i} className='ring-foreground/10 py-2 shadow-none ring-1'>
                  <CardContent className='flex items-center gap-3 px-4'>
                    <Avatar className='rounded-sm after:border-0'>
                      <AvatarFallback className='bg-primary/10 text-primary shrink-0 rounded-sm'>
                        {m.icon}
                      </AvatarFallback>
                    </Avatar>
                    <div className='flex flex-col gap-0.5'>
                      <span className='text-muted-foreground text-sm font-medium'>{m.title}</span>
                      <span className='text-lg font-medium'>{m.value}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Direita — Donut */}
          <Card className='ring-foreground/10 justify-between gap-4 shadow-none ring-1 lg:col-span-2'>
            <CardHeader className='gap-1'>
              <CardTitle className='text-lg font-semibold'>Taxa de aprovação</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <ChartContainer config={revenueConfig} className='h-38.5 w-full'>
                <PieChart margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Pie data={revenueData} dataKey='sales' nameKey='month'
                    startAngle={300} endAngle={660}
                    innerRadius={58} outerRadius={75} paddingAngle={2}>
                    <Label content={({ viewBox }) => {
                      if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                        return (
                          <text x={viewBox.cx} y={viewBox.cy} textAnchor='middle' dominantBaseline='middle'>
                            <tspan x={viewBox.cx} y={(viewBox.cy || 0) - 12} className='fill-card-foreground text-lg font-medium'>
                              {pct}%
                            </tspan>
                            <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 19} className='fill-muted-foreground text-sm'>
                              Aprovados
                            </tspan>
                          </text>
                        )
                      }
                    }} />
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className='flex items-center justify-between'>
                <span className='text-xl'>Plano concluído</span>
                <span className='text-2xl font-medium'>{pct}%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>

      {/* Barra de progresso inferior */}
      <CardContent>
        <Card className='ring-foreground/10 shadow-none ring-1'>
          <CardContent className='grid gap-4 lg:grid-cols-5'>
            <div className='flex flex-col justify-center gap-6'>
              <span className='text-lg font-semibold'>Taxa de contratos</span>
              <span className='max-lg:text-5xl text-6xl'>{pct}%</span>
              <span className='text-muted-foreground text-sm'>Percentagem de contratos aprovados</span>
            </div>
            <div className='flex flex-col gap-6 text-lg md:col-span-4'>
              <span className='font-medium'>Indicadores de desempenho</span>
              <span className='text-muted-foreground text-wrap'>
                Analisa o comportamento dos contratos ao longo do tempo, identificando tendências de aprovação, renovação e risco.
              </span>
              <div className='grid gap-6 md:grid-cols-2'>
                <div className='flex items-center gap-2'>
                  <ChartNoAxesCombinedIcon className='size-6' />
                  <span className='text-lg font-medium'>Ver Analytics</span>
                </div>
                <div className='flex items-center gap-2'>
                  <CirclePercentIcon className='size-6' />
                  <span className='text-lg font-medium'>Taxa de Renovação</span>
                </div>
              </div>
              <ChartContainer config={salesChartConfig} className='h-7.75 w-full'>
                <BarChart accessibilityLayer data={salesChartData}
                  margin={{ left: 0, right: 0 }} maxBarSize={16}>
                  <Bar dataKey='sales' fill='var(--primary)'
                    background={{ fill: 'color-mix(in oklab, var(--primary) 10%, transparent)', radius: 12 }}
                    radius={12} />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}

export default ContractMetricsChart
