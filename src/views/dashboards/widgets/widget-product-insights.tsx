'use client'

import { Bar, BarChart } from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { type ChartConfig, ChartContainer } from '@/components/ui/chart'
import { Separator } from '@/components/ui/separator'

const totalChartData = [
  { month: 'Jan', value: 120 },
  { month: 'Fev', value: 185 },
  { month: 'Mar', value: 143 },
  { month: 'Abr', value: 210 },
  { month: 'Mai', value: 175 }
]
const totalChartConfig = {
  value: { label: 'Contratos', color: 'var(--primary)' }
} satisfies ChartConfig

const approvedChartData = [
  { month: 'Jan', value: 98 },
  { month: 'Fev', value: 140 },
  { month: 'Mar', value: 110 },
  { month: 'Abr', value: 168 },
  { month: 'Mai', value: 132 }
]
const approvedChartConfig = {
  value: { label: 'Assinados', color: 'color-mix(in oklab, var(--primary) 10%, transparent)' }
} satisfies ChartConfig

type Props = {
  totalContracts: number
  approvedContracts: number
  className?: string
}

const ContractInsightsWidget = ({ totalContracts, approvedContracts, className }: Props) => {
  return (
    <Card className={className}>
      <CardHeader className='flex justify-between'>
        <div className='flex flex-col gap-1'>
          <span className='text-lg font-semibold'>Visão Geral</span>
          <span className='text-muted-foreground text-sm'>
            {format(new Date(), "dd 'de' MMM yyyy '–' HH:mm", { locale: ptBR })}
          </span>
        </div>
        <div className='bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-md'>
          <svg xmlns='http://www.w3.org/2000/svg' className='size-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
          </svg>
        </div>
      </CardHeader>
      <CardContent>
        <Separator />
      </CardContent>
      <CardContent className='space-y-4'>
        <div className='flex items-center justify-between gap-1'>
          <div className='flex flex-col gap-1'>
            <span className='text-xs'>Total de contratos</span>
            <span className='text-2xl font-semibold'>{totalContracts.toLocaleString('pt-AO')}</span>
          </div>
          <ChartContainer config={totalChartConfig} className='min-h-13 max-w-18'>
            <BarChart accessibilityLayer data={totalChartData} barSize={8}>
              <Bar dataKey='value' fill='var(--color-value)' radius={2} />
            </BarChart>
          </ChartContainer>
        </div>
        <div className='flex items-center justify-between gap-1'>
          <div className='flex flex-col gap-1'>
            <span className='text-xs'>Contratos assinados</span>
            <span className='text-2xl font-semibold'>{approvedContracts.toLocaleString('pt-AO')}</span>
          </div>
          <ChartContainer config={approvedChartConfig} className='min-h-13 max-w-18'>
            <BarChart accessibilityLayer data={approvedChartData} barSize={8}>
              <Bar dataKey='value' fill='var(--color-value)' radius={2} />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default ContractInsightsWidget
