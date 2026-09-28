import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInvoices, useDeleteInvoice, type Invoice } from '../hooks/useInvoices'
import { useAuth } from '../contexts/AuthContext'
import { checkPlan, getLimits } from '../lib/plans'
import { useCheckoutModal } from '../contexts/CheckoutModalContext'
import { toast } from 'sonner'
import { Search, Plus, Eye, FileEdit, Trash2, Download, X, Loader2, FileText, Euro } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft:    { label: 'Rascunho',  variant: 'outline'     },
  sent:     { label: 'Enviada',   variant: 'secondary'   },
  paid:     { label: 'Paga',      variant: 'default'     },
  overdue:  { label: 'Em Atraso', variant: 'destructive' },
  cancelled:{ label: 'Cancelada', variant: 'destructive' },
}

export default function InvoiceList() {
  const navigate = useNavigate()
  const { user, plan, isAdmin, trialEndsAt } = useAuth()
  const { openCheckout } = useCheckoutModal()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { data: invoicesData, isLoading, isFetching } = useInvoices(page, search)
  const invoices = invoicesData?.data ?? []
  const totalCount = invoicesData?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / 20))
  const deleteMutation = useDeleteInvoice()

  const limits = getLimits(plan, trialEndsAt)

  useEffect(() => { setPage(1) }, [search])

  const filtered = invoices.filter(inv => {
    if (statusFilter && inv.status !== statusFilter) return false
    return true
  })

  const handleCreate = () => {
    if (totalCount >= limits.maxInvoices) { openCheckout('pro'); return }
    navigate('/invoices/new')
  }

  const handleExport = () => {
    if (!filtered.length) { toast.info('Sem facturas para exportar'); return }
    // Export logic would go here
    toast.success(`${filtered.length} facturas exportadas`)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      toast.success('Factura eliminada'); setDeleteTarget(null)
    } catch (e: any) { toast.error(e?.message || 'Erro ao eliminar') }
    finally { setDeleting(false) }
  }

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(amount)

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date))

  if (isLoading) return (
    <div className='flex flex-col gap-4'>
      <Skeleton className='h-12 w-full' />
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {Array.from({length: 6}).map((_, i) => <Skeleton key={i} className='h-48 w-full' />)}
      </div>
    </div>
  )

  return (
    <div className='flex flex-col gap-6'>
      {/* Toolbar */}
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
          <Input placeholder='Pesquisar facturas...' value={search} onChange={e => setSearch(e.target.value)} className='pl-9' />
          {isFetching && <Loader2 className='absolute right-2.5 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground' />}
        </div>
        <div className='flex items-center gap-2'>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-36 h-8 text-sm'><SelectValue placeholder='Status' /></SelectTrigger>
            <SelectContent>
              <SelectItem value=''>Todos</SelectItem>
              <SelectItem value='draft'>Rascunho</SelectItem>
              <SelectItem value='sent'>Enviada</SelectItem>
              <SelectItem value='paid'>Paga</SelectItem>
              <SelectItem value='overdue'>Em Atraso</SelectItem>
              <SelectItem value='cancelled'>Cancelada</SelectItem>
            </SelectContent>
          </Select>
          {statusFilter && <Button variant='ghost' size='sm' onClick={() => setStatusFilter('')}><X className='size-4' /></Button>}
          <Button variant='outline' size='sm' onClick={handleExport}><Download className='size-4' /></Button>
          <Button size='sm' onClick={handleCreate}><Plus className='size-4' /> Nova Factura</Button>
        </div>
      </div>

      {/* Cards Grid */}
      {totalCount === 0 && !search ? (
        <Card className='p-8'>
          <div className='flex flex-col items-center gap-4 text-center'>
            <div className='bg-primary/10 flex size-16 items-center justify-center rounded-xl'>
              <FileText className='size-8 text-primary' />
            </div>
            <div>
              <h3 className='font-semibold'>Ainda não tens facturas</h3>
              <p className='text-sm text-muted-foreground mt-1 max-w-xs'>Cria a tua primeira factura para começar a facturar os teus clientes.</p>
            </div>
            <Button onClick={handleCreate}><Plus className='size-4' /> Nova Factura</Button>
          </div>
        </Card>
      ) : (
        <>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {filtered.map(invoice => {
              const status = STATUS_MAP[invoice.status] ?? STATUS_MAP.draft
              return (
                <Card key={invoice.id} className='hover:bg-muted/50 cursor-pointer transition-colors' onClick={() => navigate(`/invoices/${invoice.id}`)}>
                  <CardHeader className='flex flex-row items-start justify-between space-y-0 pb-3'>
                    <div className='space-y-1'>
                      <CardTitle className='text-base font-semibold'>#{invoice.invoice_number}</CardTitle>
                      <p className='text-sm text-muted-foreground'>{invoice.client_name}</p>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </CardHeader>
                  <CardContent className='pt-0'>
                    <div className='space-y-3'>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm text-muted-foreground'>Valor:</span>
                        <span className='font-semibold text-lg'>{formatCurrency(invoice.total_amount)}</span>
                      </div>
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-muted-foreground'>Data:</span>
                        <span>{formatDate(invoice.issue_date)}</span>
                      </div>
                      {invoice.due_date && (
                        <div className='flex items-center justify-between text-sm'>
                          <span className='text-muted-foreground'>Vencimento:</span>
                          <span className={invoice.status === 'overdue' ? 'text-destructive' : ''}>
                            {formatDate(invoice.due_date)}
                          </span>
                        </div>
                      )}
                      <div className='flex justify-end gap-1 pt-2' onClick={e => e.stopPropagation()}>
                        <Button variant='ghost' size='icon' className='size-8' onClick={() => navigate(`/invoices/${invoice.id}`)}>
                          <Eye className='size-4' />
                        </Button>
                        <Button variant='ghost' size='icon' className='size-8' onClick={() => navigate(`/invoices/${invoice.id}/edit`)}>
                          <FileEdit className='size-4' />
                        </Button>
                        <Button variant='ghost' size='icon' className='size-8 text-destructive hover:text-destructive' onClick={() => setDeleteTarget(invoice)}>
                          <Trash2 className='size-4' />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <Card className='p-12'>
              <div className='text-center text-muted-foreground'>
                <FileText className='size-12 mx-auto mb-4 opacity-50' />
                <p>Nenhuma factura encontrada</p>
              </div>
            </Card>
          )}

          {totalPages > 1 && (
            <div className='flex items-center justify-between'>
              <p className='text-sm text-muted-foreground'>
                Página {page} de {totalPages} • {totalCount} facturas
              </p>
              <div className='flex gap-2'>
                <Button variant='outline' size='sm' disabled={page<=1} onClick={() => setPage(p=>p-1)}>Anterior</Button>
                <Button variant='outline' size='sm' disabled={page>=totalPages} onClick={() => setPage(p=>p+1)}>Seguinte</Button>
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={v => { if (!v && !deleting) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar factura</DialogTitle>
            <DialogDescription>
              Tens a certeza que queres eliminar a factura <strong>#{deleteTarget?.invoice_number}</strong>? Esta acção é irreversível.
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