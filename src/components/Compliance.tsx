import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Shield, CheckCircle, AlertTriangle, XCircle, Eye, FileText, Calendar, Clock, Users, Settings } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ComplianceMetric {
  id: string
  name: string
  status: 'compliant' | 'warning' | 'non-compliant'
  score: number
  description: string
  lastCheck: string
  requirements: string[]
  actions: string[]
}

interface ComplianceReport {
  id: string
  title: string
  date: string
  status: 'generated' | 'pending' | 'failed'
  type: string
  downloadUrl?: string
}

const mockMetrics: ComplianceMetric[] = [
  {
    id: '1',
    name: 'RGPD/GDPR',
    status: 'compliant',
    score: 95,
    description: 'Conformidade com o Regulamento Geral sobre a Proteção de Dados',
    lastCheck: '2024-01-15T10:30:00Z',
    requirements: ['Política de privacidade atualizada', 'Consentimento explícito', 'Direito ao esquecimento'],
    actions: []
  },
  {
    id: '2', 
    name: 'Contratos Digitais',
    status: 'warning',
    score: 78,
    description: 'Conformidade com legislação de contratos eletrónicos',
    lastCheck: '2024-01-14T14:20:00Z',
    requirements: ['Assinatura digital certificada', 'Timestamping', 'Arquivo digital seguro'],
    actions: ['Implementar timestamping nos contratos', 'Renovar certificados digitais']
  },
  {
    id: '3',
    name: 'Retenção de Dados',
    status: 'compliant',
    score: 88,
    description: 'Políticas de retenção e eliminação de dados',
    lastCheck: '2024-01-13T09:15:00Z',
    requirements: ['Política de retenção definida', 'Eliminação automática', 'Logs de auditoria'],
    actions: []
  },
  {
    id: '4',
    name: 'Segurança da Informação',
    status: 'non-compliant',
    score: 65,
    description: 'Conformidade com normas de segurança da informação',
    lastCheck: '2024-01-12T16:45:00Z',
    requirements: ['Encriptação end-to-end', 'Autenticação multifator', 'Backup seguro'],
    actions: ['Implementar 2FA obrigatório', 'Atualizar política de senhas', 'Configurar backup automático']
  }
]

const mockReports: ComplianceReport[] = [
  {
    id: '1',
    title: 'Relatório RGPD - Janeiro 2024',
    date: '2024-01-15',
    status: 'generated',
    type: 'RGPD',
    downloadUrl: '/reports/rgpd-jan-2024.pdf'
  },
  {
    id: '2',
    title: 'Auditoria de Segurança - Janeiro 2024', 
    date: '2024-01-10',
    status: 'generated',
    type: 'Segurança',
    downloadUrl: '/reports/security-jan-2024.pdf'
  },
  {
    id: '3',
    title: 'Relatório Mensal - Dezembro 2023',
    date: '2024-01-01',
    status: 'pending',
    type: 'Geral'
  }
]

const STATUS_CONFIG = {
  compliant: { 
    icon: CheckCircle, 
    label: 'Conforme', 
    variant: 'default' as const,
    color: 'text-green-600'
  },
  warning: { 
    icon: AlertTriangle, 
    label: 'Atenção', 
    variant: 'secondary' as const,
    color: 'text-yellow-600'
  },
  'non-compliant': { 
    icon: XCircle, 
    label: 'Não Conforme', 
    variant: 'destructive' as const,
    color: 'text-red-600'
  }
}

export default function Compliance() {
  const { user } = useAuth()
  const [isLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const overallScore = Math.round(mockMetrics.reduce((sum, m) => sum + m.score, 0) / mockMetrics.length)
  const compliantCount = mockMetrics.filter(m => m.status === 'compliant').length
  const warningCount = mockMetrics.filter(m => m.status === 'warning').length
  const nonCompliantCount = mockMetrics.filter(m => m.status === 'non-compliant').length

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat('pt-PT', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='grid gap-4 md:grid-cols-4'>
          {Array.from({length: 4}).map((_, i) => <Skeleton key={i} className='h-32 w-full' />)}
        </div>
        <Skeleton className='h-96 w-full' />
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Overview Cards */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Pontuação Geral</CardTitle>
            <Shield className='size-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{overallScore}%</div>
            <Progress value={overallScore} className='mt-2' />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Conformes</CardTitle>
            <CheckCircle className='size-4 text-green-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>{compliantCount}</div>
            <p className='text-xs text-muted-foreground'>de {mockMetrics.length} áreas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Com Atenção</CardTitle>
            <AlertTriangle className='size-4 text-yellow-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-yellow-600'>{warningCount}</div>
            <p className='text-xs text-muted-foreground'>requerem atenção</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Não Conformes</CardTitle>
            <XCircle className='size-4 text-red-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-600'>{nonCompliantCount}</div>
            <p className='text-xs text-muted-foreground'>precisam correção</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='overview'>Visão Geral</TabsTrigger>
          <TabsTrigger value='reports'>Relatórios</TabsTrigger>
          <TabsTrigger value='settings'>Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-4'>
          <div className='grid gap-4'>
            {mockMetrics.map(metric => {
              const status = STATUS_CONFIG[metric.status]
              const StatusIcon = status.icon

              return (
                <Card key={metric.id}>
                  <CardHeader>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <StatusIcon className={`size-5 ${status.color}`} />
                        <div>
                          <CardTitle className='text-base'>{metric.name}</CardTitle>
                          <CardDescription>{metric.description}</CardDescription>
                        </div>
                      </div>
                      <div className='flex items-center gap-3'>
                        <div className='text-right'>
                          <div className='text-lg font-semibold'>{metric.score}%</div>
                          <Badge variant={status.variant} className='text-xs'>
                            {status.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <Progress value={metric.score} />
                    
                    <div className='grid gap-4 md:grid-cols-2'>
                      <div>
                        <h4 className='text-sm font-medium mb-2'>Requisitos:</h4>
                        <ul className='space-y-1'>
                          {metric.requirements.map((req, i) => (
                            <li key={i} className='text-sm text-muted-foreground flex items-center gap-2'>
                              <CheckCircle className='size-3 text-green-600' />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {metric.actions.length > 0 && (
                        <div>
                          <h4 className='text-sm font-medium mb-2'>Ações Necessárias:</h4>
                          <ul className='space-y-1'>
                            {metric.actions.map((action, i) => (
                              <li key={i} className='text-sm text-muted-foreground flex items-center gap-2'>
                                <AlertTriangle className='size-3 text-yellow-600' />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    <div className='flex items-center justify-between pt-2 border-t'>
                      <span className='text-xs text-muted-foreground flex items-center gap-1'>
                        <Clock className='size-3' />
                        Última verificação: {formatDate(metric.lastCheck)}
                      </span>
                      <Button variant='outline' size='sm'>
                        <Eye className='size-4 mr-1' /> Ver Detalhes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value='reports' className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-lg font-semibold'>Relatórios de Conformidade</h3>
              <p className='text-sm text-muted-foreground'>Histórico de relatórios e auditorias geradas</p>
            </div>
            <Button>
              <FileText className='size-4 mr-2' /> Gerar Relatório
            </Button>
          </div>

          <div className='grid gap-4'>
            {mockReports.map(report => (
              <Card key={report.id}>
                <CardContent className='flex items-center justify-between p-4'>
                  <div className='flex items-center gap-3'>
                    <div className='bg-primary/10 flex size-10 items-center justify-center rounded-lg'>
                      <FileText className='size-5 text-primary' />
                    </div>
                    <div>
                      <h4 className='font-medium'>{report.title}</h4>
                      <p className='text-sm text-muted-foreground flex items-center gap-1'>
                        <Calendar className='size-3' />
                        {formatDate(report.date)}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-3'>
                    <Badge variant={report.status === 'generated' ? 'default' : report.status === 'pending' ? 'secondary' : 'destructive'}>
                      {report.status === 'generated' ? 'Gerado' : report.status === 'pending' ? 'Pendente' : 'Falhado'}
                    </Badge>
                    {report.downloadUrl && (
                      <Button variant='outline' size='sm'>
                        Download
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value='settings' className='space-y-4'>
          <div className='grid gap-4'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Settings className='size-5' />
                  Configurações de Conformidade
                </CardTitle>
                <CardDescription>
                  Configure as verificações automáticas e notificações de conformidade
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between py-3 border-b'>
                  <div>
                    <h4 className='font-medium'>Verificações Automáticas</h4>
                    <p className='text-sm text-muted-foreground'>Executar verificações de conformidade diariamente</p>
                  </div>
                  <Button variant='outline' size='sm'>Ativado</Button>
                </div>
                <div className='flex items-center justify-between py-3 border-b'>
                  <div>
                    <h4 className='font-medium'>Notificações por Email</h4>
                    <p className='text-sm text-muted-foreground'>Receber alertas sobre questões de conformidade</p>
                  </div>
                  <Button variant='outline' size='sm'>Configurar</Button>
                </div>
                <div className='flex items-center justify-between py-3'>
                  <div>
                    <h4 className='font-medium'>Relatórios Automáticos</h4>
                    <p className='text-sm text-muted-foreground'>Gerar relatórios mensais automaticamente</p>
                  </div>
                  <Button variant='outline' size='sm'>Configurar</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}