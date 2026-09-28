import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApprovalRequests, useDeleteApprovalRequest, type ApprovalRequest } from '../hooks/useApprovalRequests'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'
import { Search, Plus, Eye, FileEdit, Trash2, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  pending:  { label: 'Pendente',  variant: 'outline',     icon: <Clock className='size-3' /> },
  approved: { label: 'Aprovada', variant: 'default',     icon: <CheckCircle className='size-3' /> },
  rejected: { label: 'Rejeitada', variant: 'destructive', icon: <XCircle className='size-3' /> },
  expired:  { label: 'Expirada', variant: 'secondary',   icon: <AlertCircle className='size-3' /> },
}

export default function ApprovalRequestList() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<ApprovalRequest | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { data: requestsData, isLoading, isFetching } = useApprovalRequests(page, search)
  const requests = requestsData?.data ?? []
  const totalCount = requestsData?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / 20))
  const deleteMutation = useDeleteApprovalRequest()

  const filtered = requests.filter(req => {
    if (statusFilter && req.status !== statusFilter) return false
    if (typeFilter && req.type !== typeFilter) return false
    return true
  })

  const handleCreate = () => navigate('/approvals/new')

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      toast.success('Pedido de aprovação eliminado'); setDeleteTarget(null)
    } catch (e: any) { toast.error(e?.message || 'Erro ao eliminar') }
    finally { setDeleting(false) }
  }

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat('pt-PT', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      contract: 'Contrato',
      invoice: 'Factura', 
      payment: 'Pagamento',
      expense: 'Despesa',
      other: 'Outro'
    }
    return types[type] || type
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'text-blue-600',
      medium: 'text-yellow-600',
      high: 'text-red-600',
      urgent: 'text-red-700 font-semibold'
    }
    return colors[priority] || 'text-muted-foreground'
  }

  if (isLoading) return (
    <div className='flex flex-col gap-4'>
      <Skeleton className='h-12 w-full' />
      <Skeleton className='h-96 w-full' />
    </div>
  )

  return (
    <div className='flex flex-col gap-6'>
      {/* Toolbar */}
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
          <Input placeholder='Pesquisar aprovações...' value={search} onChange={e => setSearch(e.target.value)} className='pl-9' />
          {isFetching && <Loader2 className='absolute right-2.5 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground' />}
        </div>
        <div className='flex items-center gap-2'>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-32 h-8 text-sm'><SelectValue placeholder='Status' /></SelectTrigger>
            <SelectContent>
              <SelectItem value=''>Todos</SelectItem>
              <SelectItem value='pending'>Pendente</SelectItem>
              <SelectItem value='approved'>Aprovada</SelectItem>
              <SelectItem value='rejected'>Rejeitada</SelectItem>
              <SelectItem value='expired'>Expirada</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className='w-32 h-8 text-sm'><SelectValue placeholder='Tipo' /></SelectTrigger>
            <SelectContent>
              <SelectItem value=''>Todos</SelectItem>
              <SelectItem value='contract'>Contrato</SelectItem>
              <SelectItem value='invoice'>Factura</SelectItem>
              <SelectItem value='payment'>Pagamento</SelectItem>
              <SelectItem value='expense'>Despesa</SelectItem>
              <SelectItem value='other'>Outro</SelectItem>
            </SelectContent>
          </Select>
          <Button size='sm' onClick={handleCreate}><Plus className='size-4' /> Nova Aprovação</Button>
        </div>
      </div>

      {/* Table */}
      <Card className='py-0'>
        <CardHeader className='flex flex-row items-center justify-between border-b px-6 py-4'>
          <CardTitle className='text-base font-semibold'>Pedidos de Aprovação ({totalCount})</CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          {totalCount === 0 && !search ? (
            <div className='flex flex-col items-center gap-4 py-16 text-center'>
              <div className='bg-primary/10 flex size-16 items-center justify-center rounded-xl'>
                <CheckCircle className='size-8 text-primary' />
              </div>
              <div>
                <p className='font-semibold'>Ainda não tens pedidos de aprovação</p>
                <p className='text-sm text-muted-foreground mt-1 max-w-xs'>Cria o teu primeiro pedido de aprovação para documentos ou processos.</p>
              </div>
              <Button onClick={handleCreate}><Plus className='size-4' /> Nova Aprovação</Button>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='pl-6'>Título</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Solicitante</TableHead>
                    <TableHead>Aprovador</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Criado</TableHead>
                    <TableHead className='text-right pr-6'>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length > 0 ? filtered.map(request => {
                    const status = STATUS_MAP[request.status] ?? STATUS_MAP.pending
                    const isOverdue = request.due_date && new Date(request.due_date) < new Date() && request.status === 'pending'
                    
                    return (
                      <TableRow key={request.id} className='cursor-pointer' onClick={() => navigate(`/approvals/${request.id}`)}>
                        <TableCell className='pl-6'>
                          <div className='flex items-start gap-3'>
                            <div className='bg-primary/10 flex size-8 items-center justify-center rounded-lg shrink-0'>
                              {status.icon}
                            </div>
                            <div className='flex flex-col'>
                              <span className='font-medium text-sm leading-tight'>{request.title}</span>
                              {request.description && (
                                <span className='text-xs text-muted-foreground line-clamp-1 mt-0.5'>
                                  {request.description}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant='outline' className='text-xs'>
                            {getTypeLabel(request.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <Avatar className='size-6'>
                              <AvatarFallback className='bg-muted text-xs'>
                                {request.requester_name?.charAt(0).toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span className='text-sm'>{request.requester_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <Avatar className='size-6'>
                              <AvatarFallback className='bg-muted text-xs'>
                                {request.approver_name?.charAt(0).toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span className='text-sm'>{request.approver_name || 'Não atribuído'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={isOverdue ? 'destructive' : status.variant} className='gap-1'>
                            {status.icon}
                            {isOverdue ? 'Em atraso' : status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`text-sm capitalize ${getPriorityColor(request.priority)}`}>
                            {request.priority}
                          </span>
                        </TableCell>
                        <TableCell className='text-sm text-muted-foreground'>
                          {formatDate(request.created_at)}
                        </TableCell>
                        <TableCell className='text-right pr-6' onClick={e => e.stopPropagation()}>
                          <div className='flex justify-end gap-1'>
                            <Button variant='ghost' size='icon' className='size-8' onClick={() => navigate(`/approvals/${request.id}`)}>
                              <Eye className='size-4' />
                            </Button>
                            {request.status === 'pending' && (
                              <Button variant='ghost' size='icon' className='size-8' onClick={() => navigate(`/approvals/${request.id}/edit`)}>
                                <FileEdit className='size-4' />
                              </Button>
                            )}
                            <Button variant='ghost' size='icon' className='size-8 text-destructive hover:text-destructive' onClick={() => setDeleteTarget(request)}>
                              <Trash2 className='size-4' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  }) : (
                    <TableRow>
                      <TableCell colSpan={8} className='h-40 text-center text-muted-foreground'>
                        Nenhum pedido de aprovação encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          {totalPages > 1 && (
            <div className='flex items-center justify-between border-t px-6 py-3'>
              <p className='text-sm text-muted-foreground'>Página {page} de {totalPages}</p>
              <div className='flex gap-2'>
                <Button variant='outline' size='sm' disabled={page<=1} onClick={() => setPage(p=>p-1)}>Anterior</Button>
                <Button variant='outline' size='sm' disabled={page>=totalPages} onClick={() => setPage(p=>p+1)}>Seguinte</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!deleteTarget} onOpenChange={v => { if (!v && !deleting) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar pedido de aprovação</DialogTitle>
            <DialogDescription>
              Tens a certeza que queres eliminar o pedido <strong>{deleteTarget?.title}</strong>? Esta acção é irreversível.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancelar</Button>
            <Button variant='destructive' onClick={confirmDelete} disabled={deleting}>
              {deleting && <Loader2 className='size-4 animate-spin mr-2' />} Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}