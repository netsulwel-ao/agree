import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContracts, type Contract } from '../hooks/useContracts'
import { useAuth } from '../contexts/AuthContext'
import { getLimits } from '../lib/plans'
import { useCheckoutModal } from '../contexts/CheckoutModalContext'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import {
  Search, Plus, Eye, FileEdit, Trash2, Download, X,
  Loader2, FileText, Filter, Sparkles
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatCurrency } from '../services/currency'
import { intelligentSearch } from '../services/gemini'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  approved: { label: 'Assinado',  variant: 'default'     },
  pending:  { label: 'Aprovação', variant: 'secondary'   },
  rejected: { label: 'Rejeitado', variant: 'destructive' },
  draft:    { label: 'Rascunho',  variant: 'outline'     },
}
const RISK_MAP: Record<string, { label: string; color: string }> = {
  low:    { label: 'Baixo', color: 'text-emerald-600' },
  medium: { label: 'Médio', color: 'text-amber-600'   },
  high:   { label: 'Alto',  color: 'text-destructive' },
}

export default function ContractList() {
  const navigate = useNavigate()
  const { user, plan, trialEndsAt } = useAuth()
  const { openCheckout } = useCheckoutModal()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const { data: contractsData, isLoading } = useContracts(page)
  const contracts = contractsData?.data ?? []
  const totalCount = contractsData?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / 20))
  const limits = getLimits(plan, trialEndsAt)

  const [search, setSearch] = useState('')
  const [aiSearching, setAiSearching] = useState(false)
  const [filtered, setFiltered] = useState<Contract[]>(contracts)
  const [statusFilter, setStatusFilter] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Contract | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)

  React.useEffect(() => {
    let result = contracts
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(c => c.title.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q))
    }
    if (statusFilter) result = result.filter(c => c.status === statusFilter)
    if (riskFilter) result = result.filter(c => c.risk_level === riskFilter)
    setFiltered(result)
  }, [contracts, search, statusFilter, riskFilter])

  const handleAiSearch = async () => {
    if (!search.trim()) { toast.error('Escreve algo para a pesquisa inteligente'); return }
    setAiSearching(true)
    try {
      const results = await intelligentSearch(search, contracts)
      setFiltered(results)
      toast.success(`${results.length} contrato${results.length !== 1 ? 's' : ''} encontrado${results.length !== 1 ? 's' : ''}`)
    } catch { toast.error('Erro na pesquisa inteligente') }
    finally { setAiSearching(false) }
  }

  const handleCreate = () => {
    if (totalCount >= limits.maxContracts) { openCheckout('pro'); return }
    navigate('/contracts/new')
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('contracts').delete().eq('id', deleteTarget.id).eq('owner_id', user?.id)
      if (error) throw error
      await queryClient.invalidateQueries({ queryKey: ['contracts'] })
      setDeleteTarget(null)
      toast.success('Contrato eliminado')
    } catch (e: any) { toast.error(e.message || 'Erro ao eliminar') }
    finally { setDeleting(false) }
  }

  const handleExportPdf = async () => {
    if (!filtered.length) { toast.info('Sem contratos para exportar'); return }
    setExportingPdf(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default
      const doc = new jsPDF('landscape')
      doc.text('Contratos', 14, 16)
      autoTable(doc, {
        startY: 24,
        head: [['Título', 'Risco', 'Vencimento', 'Valor', 'Status']],
        body: filtered.map(c => [
          c.title,
          RISK_MAP[c.risk_level]?.label || c.risk_level,
          c.end_date ? format(parseISO(c.end_date), 'dd/MM/yyyy') : 'N/A',
          formatCurrency(Number(c.value) || 0, c.currency || 'AOA'),
          STATUS_MAP[c.status]?.label || c.status,
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [13, 17, 23] },
      })
      doc.save(`contratos_${new Date().toISOString().slice(0, 10)}.pdf`)
      toast.success('PDF exportado')
    } catch { toast.error('Erro ao exportar') }
    finally { setExportingPdf(false) }
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
        <div className='flex flex-1 items-center gap-2 max-w-md'>
          <div className='relative flex-1'>
            <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
            <Input
              placeholder='Pesquisa inteligente...'
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAiSearch()}
              className='pl-9'
            />
          </div>
          <Button variant='outline' size='sm' onClick={handleAiSearch} disabled={aiSearching}>
            {aiSearching ? <Loader2 className='size-4 animate-spin' /> : <Sparkles className='size-4' />}
            IA
          </Button>
        </div>
        <div className='flex items-center gap-2'>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-36 h-8 text-sm'>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=''>Todos</SelectItem>
              <SelectItem value='draft'>Rascunho</SelectItem>
              <SelectItem value='pending'>Aprovação</SelectItem>
              <SelectItem value='approved'>Assinado</SelectItem>
              <SelectItem value='rejected'>Rejeitado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className='w-32 h-8 text-sm'>
              <SelectValue placeholder='Risco' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=''>Todos</SelectItem>
              <SelectItem value='low'>Baixo</SelectItem>
              <SelectItem value='medium'>Médio</SelectItem>
              <SelectItem value='high'>Alto</SelectItem>
            </SelectContent>
          </Select>
          {(statusFilter || riskFilter || search) && (
            <Button variant='ghost' size='sm' onClick={() => { setStatusFilter(''); setRiskFilter(''); setSearch(''); }}>
              <X className='size-4' />
            </Button>
          )}
          <Button variant='outline' size='sm' onClick={handleExportPdf} disabled={exportingPdf}>
            {exportingPdf ? <Loader2 className='size-4 animate-spin' /> : <Download className='size-4' />}
          </Button>
          <Button size='sm' onClick={handleCreate}>
            <Plus className='size-4' /> Novo Contrato
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className='py-0'>
        <CardHeader className='flex flex-row items-center justify-between border-b px-6 py-4'>
          <CardTitle className='text-base font-semibold'>Contratos em Gestão ({totalCount})</CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          {totalCount === 0 && !search ? (
            <div className='flex flex-col items-center gap-4 py-16 text-center'>
              <div className='bg-primary/10 flex size-16 items-center justify-center rounded-xl'>
                <FileText className='size-8 text-primary' />
              </div>
              <div>
                <p className='font-semibold'>Ainda não tens contratos</p>
                <p className='text-sm text-muted-foreground mt-1 max-w-xs'>Cria o teu primeiro contrato com o modelo inteligente da Agree.</p>
              </div>
              <Button onClick={handleCreate}><Plus className='size-4' /> Novo Contrato</Button>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='pl-6'>Título</TableHead>
                    <TableHead>Risco</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right pr-6'>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length > 0 ? filtered.map(c => {
                    const status = STATUS_MAP[c.status] ?? STATUS_MAP.draft
                    const risk = RISK_MAP[c.risk_level] ?? RISK_MAP.low
                    return (
                      <TableRow key={c.id} className='cursor-pointer' onClick={() => navigate(`/contracts/${c.id}`)}>
                        <TableCell className='pl-6'>
                          <div className='flex flex-col gap-0.5'>
                            <span className='font-medium'>{c.title}</span>
                            {c.description && <span className='text-xs text-muted-foreground truncate max-w-[200px]'>{c.description}</span>}
                            {c.tags && c.tags.length > 0 && (
                              <div className='flex gap-1 mt-1 flex-wrap'>
                                {c.tags.map(t => <Badge key={t} variant='outline' className='text-xs px-1.5 py-0'>{t}</Badge>)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`text-sm font-medium ${risk.color}`}>● {risk.label}</span>
                        </TableCell>
                        <TableCell className='text-muted-foreground text-sm'>
                          {c.end_date ? format(parseISO(c.end_date), 'dd MMM yyyy', { locale: ptBR }) : '—'}
                        </TableCell>
                        <TableCell className='text-sm text-muted-foreground'>
                          {formatCurrency(Number(c.value) || 0, c.currency || 'AOA')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className='text-right pr-6' onClick={e => e.stopPropagation()}>
                          <div className='flex justify-end gap-1'>
                            <Button variant='ghost' size='icon' className='size-8' onClick={() => navigate(`/contracts/${c.id}`)}>
                              <Eye className='size-4' />
                            </Button>
                            <Button variant='ghost' size='icon' className='size-8' onClick={() => navigate(`/contracts/${c.id}/edit`)}>
                              <FileEdit className='size-4' />
                            </Button>
                            <Button variant='ghost' size='icon' className='size-8 text-destructive hover:text-destructive' onClick={() => setDeleteTarget(c)}>
                              <Trash2 className='size-4' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  }) : (
                    <TableRow>
                      <TableCell colSpan={6} className='h-40 text-center text-muted-foreground'>
                        Nenhum contrato encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex items-center justify-between border-t px-6 py-3'>
              <p className='text-sm text-muted-foreground'>Página {page} de {totalPages}</p>
              <div className='flex gap-2'>
                <Button variant='outline' size='sm' disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
                <Button variant='outline' size='sm' disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Seguinte</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={v => { if (!v && !deleting) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar contrato</DialogTitle>
            <DialogDescription>
              Tens a certeza que pretendes eliminar <strong>{deleteTarget?.title}</strong>? Esta acção é irreversível.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancelar</Button>
            <Button variant='destructive' onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className='size-4 animate-spin mr-2' />} Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
