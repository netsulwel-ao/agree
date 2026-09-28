import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSignatures, useDeleteSignature, type Signature } from '../hooks/useSignatures'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'
import { Search, Plus, Eye, FileEdit, Trash2, Download, X, Loader2, FileSignature, Clock } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending:   { label: 'Pendente',   variant: 'outline'     },
  signed:    { label: 'Assinada',   variant: 'default'     },
  declined:  { label: 'Recusada',   variant: 'destructive' },
  expired:   { label: 'Expirada',   variant: 'secondary'   },
}

export default function SignatureList() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Signature | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { data: signaturesData, isLoading, isFetching } = useSignatures(page, search)
  const signatures = signaturesData?.data ?? []
  const totalCount = signaturesData?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / 20))
  const deleteMutation = useDeleteSignature()

  const filtered = signatures.filter(sig => {
    if (statusFilter && sig.status !== statusFilter) return false
    return true
  })

  const handleCreate = () => navigate('/signatures/new')

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      toast.success('Assinatura eliminada'); setDeleteTarget(null)
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
          <Input placeholder='Pesquisar assinaturas...' value={search} onChange={e => setSearch(e.target.value)} className='pl-9' />
          {isFetching && <Loader2 className='absolute right-2.5 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground' />}
        </div>
        <div className='flex items-center gap-2'>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-36 h-8 text-sm'><SelectValue placeholder='Status' /></SelectTrigger>
            <SelectContent>
              <SelectItem value=''>Todos</SelectItem>
              <SelectItem value='pending'>Pendente</SelectItem>
              <SelectItem value='signed'>Assinada</SelectItem>
              <SelectItem value='declined'>Recusada</SelectItem>
              <SelectItem value='expired'>Expirada</SelectItem>
            </SelectContent>
          </Select>
          {statusFilter && <Button variant='ghost' size='sm' onClick={() => setStatusFilter('')}><X className='size-4' /></Button>}
          <Button size='sm' onClick={handleCreate}><Plus className='size-4' /> Nova Assinatura</Button>
        </div>
      </div>

      {/* Table */}
      <Card className='py-0'>
        <CardHeader className='flex flex-row items-center justify-between border-b px-6 py-4'>
          <CardTitle className='text-base font-semibold'>Assinaturas Digitais ({totalCount})</CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          {totalCount === 0 && !search ? (
            <div className='flex flex-col items-center gap-4 py-16 text-center'>
              <div className='bg-primary/10 flex size-16 items-center justify-center rounded-xl'>
                <FileSignature className='size-8 text-primary' />
              </div>
              <div>
                <p className='font-semibold'>Ainda não tens assinaturas</p>
                <p className='text-sm text-muted-foreground mt-1 max-w-xs'>Cria o teu primeiro pedido de assinatura digital.</p>
              </div>
              <Button onClick={handleCreate}><Plus className='size-4' /> Nova Assinatura</Button>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='pl-6'>Documento</TableHead>
                    <TableHead>Signatário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead className='text-right pr-6'>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length > 0 ? filtered.map(signature => {
                    const status = STATUS_MAP[signature.status] ?? STATUS_MAP.pending
                    const isExpired = signature.expires_at && new Date(signature.expires_at) < new Date()
                    
                    return (
                      <TableRow key={signature.id} className='cursor-pointer' onClick={() => navigate(`/signatures/${signature.id}`)}>
                        <TableCell className='pl-6'>
                          <div className='flex items-center gap-3'>
                            <div className='bg-primary/10 flex size-8 items-center justify-center rounded-lg'>
                              <FileSignature className='size-4 text-primary' />
                            </div>
                            <div className='flex flex-col'>
                              <span className='font-medium text-sm'>{signature.document_title}</span>
                              <span className='text-xs text-muted-foreground'>{signature.contract_title || 'Documento avulso'}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <Avatar className='size-6'>
                              <AvatarFallback className='bg-muted text-xs'>
                                {signature.signer_name?.charAt(0).toUpperCase() || signature.signer_email?.charAt(0).toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className='flex flex-col'>
                              <span className='text-sm font-medium'>{signature.signer_name || signature.signer_email}</span>
                              {signature.signer_name && <span className='text-xs text-muted-foreground'>{signature.signer_email}</span>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={isExpired && signature.status === 'pending' ? 'destructive' : status.variant}>
                            {isExpired && signature.status === 'pending' ? 'Expirada' : status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-sm text-muted-foreground'>{formatDate(signature.created_at)}</TableCell>
                        <TableCell className='text-sm'>
                          {signature.expires_at ? (
                            <span className={isExpired ? 'text-destructive' : 'text-muted-foreground'}>
                              {formatDate(signature.expires_at)}
                            </span>
                          ) : (
                            <span className='text-muted-foreground'>Sem prazo</span>
                          )}
                        </TableCell>
                        <TableCell className='text-right pr-6' onClick={e => e.stopPropagation()}>
                          <div className='flex justify-end gap-1'>
                            <Button variant='ghost' size='icon' className='size-8' onClick={() => navigate(`/signatures/${signature.id}`)}>
                              <Eye className='size-4' />
                            </Button>
                            {signature.status === 'pending' && (
                              <Button variant='ghost' size='icon' className='size-8' onClick={() => navigate(`/signatures/${signature.id}/edit`)}>
                                <FileEdit className='size-4' />
                              </Button>
                            )}
                            <Button variant='ghost' size='icon' className='size-8 text-destructive hover:text-destructive' onClick={() => setDeleteTarget(signature)}>
                              <Trash2 className='size-4' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  }) : (
                    <TableRow>
                      <TableCell colSpan={6} className='h-40 text-center text-muted-foreground'>
                        Nenhuma assinatura encontrada
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
            <DialogTitle>Eliminar assinatura</DialogTitle>
            <DialogDescription>
              Tens a certeza que queres eliminar o pedido de assinatura para <strong>{deleteTarget?.document_title}</strong>? Esta acção é irreversível.
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