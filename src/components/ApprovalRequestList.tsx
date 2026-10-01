import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useApprovalRequests, useApprovalWorkflows, useCreateApprovalRequest, type ApprovalRequest,
} from '../hooks/useApprovalWorkflows'
import { useContracts } from '../hooks/useContracts'
import { toast } from 'sonner'
import { Search, Plus, Eye, Loader2, CheckCircle2, XCircle, Clock, FileText, Send, AlertCircle } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type RequestWithRelations = ApprovalRequest & { contract: any; workflow: any }

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  pending:     { label: 'Pendente',  variant: 'outline',     icon: <Clock className='size-3' /> },
  in_progress: { label: 'Em Curso',  variant: 'secondary',   icon: <Clock className='size-3' /> },
  approved:    { label: 'Aprovado',  variant: 'default',     icon: <CheckCircle2 className='size-3' /> },
  rejected:    { label: 'Rejeitado', variant: 'destructive', icon: <XCircle className='size-3' /> },
}

const RISK_LABEL: Record<string, string> = { low: 'Baixo', medium: 'Médio', high: 'Alto' }

const formatDate = (date?: string) =>
  date
    ? new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date))
    : '—'

const formatValue = (value?: number, currency?: string) =>
  value ? new Intl.NumberFormat('pt-PT', { style: 'currency', currency: currency || 'AOA', maximumFractionDigits: 0 }).format(value) : '—'

export default function ApprovalRequestList() {
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState('')
  const [selectedWorkflow, setSelectedWorkflow] = useState('')
  const [createError, setCreateError] = useState('')

  const { data: requests = [], isLoading, isFetching } = useApprovalRequests()
  const { data: workflows = [] } = useApprovalWorkflows()
  const { data: contractsData } = useContracts(1, '')
  const createRequest = useCreateApprovalRequest()

  const contracts = useMemo(() => contractsData?.data ?? [], [contractsData])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (requests as RequestWithRelations[]).filter(req => {
      if (statusFilter && req.status !== statusFilter) return false
      if (!q) return true
      return (
        (req.contract?.title || '').toLowerCase().includes(q) ||
        (req.workflow?.name || '').toLowerCase().includes(q)
      )
    })
  }, [requests, search, statusFilter])

  const activeCount = (requests as RequestWithRelations[]).filter(r => r.status === 'pending' || r.status === 'in_progress').length

  const openCreate = () => {
    setSelectedContract('')
    setSelectedWorkflow('')
    setCreateError('')
    setCreateOpen(true)
  }

  const submitCreate = async () => {
    setCreateError('')
    if (!selectedContract) { setCreateError('Escolhe o contrato a submeter.'); return }
    if (!selectedWorkflow) { setCreateError('Escolhe o workflow de aprovação.'); return }
    try {
      await createRequest.mutateAsync({ contract_id: selectedContract, workflow_id: selectedWorkflow })
      toast.success('Pedido de aprovação criado')
      setCreateOpen(false)
    } catch (e: any) {
      const msg = e?.message || 'Erro ao criar o pedido de aprovação'
      setCreateError(msg)
      toast.error(msg)
    }
  }

  if (isLoading) {
    return (
      <div className='flex flex-col gap-4'>
        <Skeleton className='h-12 w-full' />
        <Skeleton className='h-96 w-full' />
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-6'>
      {/* Toolbar */}
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
          <Input placeholder='Pesquisar por contrato ou workflow...' value={search} onChange={e => setSearch(e.target.value)} className='pl-9' />
          {isFetching && <Loader2 className='absolute right-2.5 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground' />}
        </div>
        <div className='flex items-center gap-2'>
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v ?? '')}>
            <SelectTrigger className='w-36 h-8 text-sm'><SelectValue placeholder='Estado' /></SelectTrigger>
            <SelectContent>
              <SelectItem value=''>Todos</SelectItem>
              <SelectItem value='pending'>Pendente</SelectItem>
              <SelectItem value='in_progress'>Em Curso</SelectItem>
              <SelectItem value='approved'>Aprovado</SelectItem>
              <SelectItem value='rejected'>Rejeitado</SelectItem>
            </SelectContent>
          </Select>
          <Button size='sm' onClick={openCreate}><Plus className='size-4' /> Nova Aprovação</Button>
        </div>
      </div>

      {/* Table */}
      <Card className='py-0'>
        <CardHeader className='flex flex-row items-center justify-between border-b px-6 py-4'>
          <CardTitle className='text-base font-semibold'>
            Pedidos de Aprovação ({requests.length})
          </CardTitle>
          {activeCount > 0 && <span className='text-sm text-muted-foreground'>{activeCount} em curso</span>}
        </CardHeader>
        <CardContent className='p-0'>
          {filtered.length === 0 ? (
            <div className='flex flex-col items-center gap-4 py-16 text-center'>
              <div className='bg-primary/10 flex size-16 items-center justify-center rounded-xl'>
                <CheckCircle2 className='size-8 text-primary' />
              </div>
              <div>
                <p className='font-semibold'>
                  {search || statusFilter ? 'Nenhum pedido encontrado' : 'Ainda não tens pedidos de aprovação'}
                </p>
                <p className='text-sm text-muted-foreground mt-1 max-w-md'>
                  {search || statusFilter
                    ? 'Ajusta a pesquisa ou o filtro de estado.'
                    : 'Submete um contrato para um workflow de aprovação para acompanhares aqui o progresso.'}
                </p>
              </div>
              {!search && !statusFilter && <Button onClick={openCreate}><Plus className='size-4' /> Nova Aprovação</Button>}
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='pl-6'>Contrato</TableHead>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Risco</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Passo</TableHead>
                    <TableHead>Criado</TableHead>
                    <TableHead className='text-right pr-6'>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(request => {
                    const status = STATUS_MAP[request.status] ?? STATUS_MAP.pending
                    return (
                      <TableRow
                        key={request.id}
                        className='cursor-pointer'
                        onClick={() => navigate(`/approvals/${request.id}`)}
                      >
                        <TableCell className='pl-6'>
                          <div className='flex items-center gap-3'>
                            <div className='bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg'>
                              <FileText className='size-4 text-primary' />
                            </div>
                            <div className='min-w-0'>
                              <span className='block truncate font-medium text-sm leading-tight'>
                                {request.contract?.title || 'Contrato sem título'}
                              </span>
                              {request.contract?.id && (
                                <span className='text-xs text-muted-foreground'>{request.contract.id.slice(0, 8)}</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className='text-sm'>{request.workflow?.name || '—'}</TableCell>
                        <TableCell className='text-sm'>
                          {formatValue(request.contract?.value, request.contract?.currency)}
                        </TableCell>
                        <TableCell>
                          <span className='text-sm'>{RISK_LABEL[request.contract?.risk_level] || '—'}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className='gap-1'>
                            {status.icon}
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-sm text-muted-foreground'>
                          {request.current_step_order != null ? `${request.current_step_order}` : '—'}
                        </TableCell>
                        <TableCell className='text-sm text-muted-foreground'>{formatDate(request.created_at)}</TableCell>
                        <TableCell className='text-right pr-6' onClick={e => e.stopPropagation()}>
                          <Button variant='ghost' size='icon' className='size-8' title='Ver pedido' onClick={() => navigate(`/approvals/${request.id}`)}>
                            <Eye className='size-4' />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: nova aprovação */}
      <Dialog open={createOpen} onOpenChange={open => { if (!open && !createRequest.isPending) setCreateOpen(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova aprovação</DialogTitle>
            <DialogDescription>
              Escolhe o contrato e o workflow. O pedido começa no primeiro passo e os aprovadores são notificados.
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4'>
            <div className='grid gap-2'>
              <Label>Contrato</Label>
              {contracts.length === 0 ? (
                <p className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <AlertCircle className='size-4' /> Ainda não tens contratos. Cria um contrato para o submeter.
                </p>
              ) : (
                <Select value={selectedContract} onValueChange={v => setSelectedContract(v ?? '')}>
                  <SelectTrigger><SelectValue placeholder='Escolhe o contrato' /></SelectTrigger>
                  <SelectContent>
                    {contracts.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className='grid gap-2'>
              <Label>Workflow</Label>
              {workflows.length === 0 ? (
                <p className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <AlertCircle className='size-4' /> Nenhum workflow activo. Configura um em Administração → Workflows.
                </p>
              ) : (
                <Select value={selectedWorkflow} onValueChange={v => setSelectedWorkflow(v ?? '')}>
                  <SelectTrigger><SelectValue placeholder='Escolhe o workflow' /></SelectTrigger>
                  <SelectContent>
                    {workflows.map(wf => (
                      <SelectItem key={wf.id} value={wf.id}>{wf.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {createError && <p className='text-sm text-destructive'>{createError}</p>}
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setCreateOpen(false)} disabled={createRequest.isPending}>Cancelar</Button>
            <Button onClick={submitCreate} disabled={createRequest.isPending || contracts.length === 0 || workflows.length === 0}>
              {createRequest.isPending
                ? <Loader2 className='mr-2 size-4 animate-spin' />
                : <Send className='mr-2 size-4' />}
              Submeter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
