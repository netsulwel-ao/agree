import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClients, useDeleteClient, type Client } from '../hooks/useClients'
import { useAuth } from '../contexts/AuthContext'
import { checkPlan, getLimits } from '../lib/plans'
import { useCheckoutModal } from '../contexts/CheckoutModalContext'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { Search, Plus, Eye, FileEdit, Trash2, Download, Upload, X, Loader2, Users } from 'lucide-react'

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
  active:   { label: 'Activo',   variant: 'default'   },
  lead:     { label: 'Lead',     variant: 'secondary' },
  inactive: { label: 'Inactivo', variant: 'outline'   },
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cell = ''; let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) { if (ch === '"') { if (text[i+1] === '"') { cell += '"'; i++ } else inQuotes = false } else cell += ch }
    else if (ch === '"') inQuotes = true
    else if (ch === ',') { row.push(cell); cell = '' }
    else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = '' }
    else if (ch !== '\r') cell += ch
  }
  row.push(cell)
  if (row.some(c => c.trim() !== '')) rows.push(row)
  return rows
}

export default function ClientList() {
  const navigate = useNavigate()
  const { user, plan, isAdmin, trialEndsAt } = useAuth()
  const { openCheckout } = useCheckoutModal()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [importing, setImporting] = useState(false)

  const { data: clientsData, isLoading, isFetching, refetch } = useClients(page, search)
  const clients = clientsData?.data ?? []
  const totalCount = clientsData?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / 20))
  const deleteMutation = useDeleteClient()

  const limits = getLimits(plan, trialEndsAt)
  const canExport = checkPlan(plan, 'pro', isAdmin, trialEndsAt)
  const canImport = checkPlan(plan, 'enterprise', isAdmin, trialEndsAt)

  useEffect(() => { setPage(1) }, [search])

  const filtered = clients.filter(c => {
    if (statusFilter && c.status !== statusFilter) return false
    return true
  })

  const handleCreate = () => {
    if (totalCount >= limits.maxClients) { openCheckout('pro'); return }
    navigate('/clients/new')
  }

  const handleExport = () => {
    if (!filtered.length) { toast.info('Sem clientes para exportar'); return }
    const headers = ['name','email','phone','status','category','tags','notes']
    const rows = filtered.map(c => headers.map(h => { const v = (c as any)[h]; return Array.isArray(v) ? v.join(';') : v ?? '' }))
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob)
    link.download = `clientes_${new Date().toISOString().slice(0,10)}.csv`; link.click()
    URL.revokeObjectURL(link.href); toast.success(`${filtered.length} clientes exportados`)
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = ''
    if (!file) return
    setImporting(true); const t = toast.loading('A importar...')
    try {
      const text = await file.text(); const rows = parseCSV(text)
      if (rows.length <= 1) { toast.error('Ficheiro sem dados'); return }
      const headerRow = rows[0].map(h => h.trim().toLowerCase())
      const col = (n: string, alt?: string) => { const i = headerRow.indexOf(n); return i >= 0 ? i : (alt ? headerRow.indexOf(alt) : -1) }
      const nameIdx = col('name','nome'); if (nameIdx < 0) { toast.error('Falta coluna "name"'); return }
      const parsed = rows.slice(1).filter(r => (r[nameIdx]??'').trim()).map(r => ({
        name: r[nameIdx].trim(), email: (r[col('email')]??'').trim() || null,
        phone: (r[col('phone','telefone')]??'').trim() || null, status: 'active' as const,
        owner_id: user!.id,
      }))
      for (let i = 0; i < parsed.length; i += 100) {
        const { error } = await supabase.from('clients').insert(parsed.slice(i,i+100))
        if (error) throw error
      }
      await queryClient.invalidateQueries({ queryKey: ['clients'] }); await refetch()
      toast.success(`${parsed.length} clientes importados`)
    } catch (err: any) { toast.error(err?.message || 'Erro ao importar') }
    finally { toast.dismiss(t); setImporting(false) }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      toast.success('Cliente eliminado'); setDeleteTarget(null)
    } catch (e: any) { toast.error(e?.message || 'Erro ao eliminar') }
    finally { setDeleting(false) }
  }

  if (isLoading) return (
    <div className='flex flex-col gap-4'>
      <Skeleton className='h-12 w-full' />
      <Skeleton className='h-96 w-full' />
    </div>
  )

  return (
    <div className='flex flex-col gap-6'>
      <input ref={fileInputRef} type='file' accept='.csv' style={{ display:'none' }} onChange={handleImportFile} />

      {/* Toolbar */}
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
          <Input placeholder='Pesquisar por nome, email...' value={search} onChange={e => setSearch(e.target.value)} className='pl-9' />
          {isFetching && <Loader2 className='absolute right-2.5 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground' />}
        </div>
        <div className='flex items-center gap-2'>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-36 h-8 text-sm'><SelectValue placeholder='Status' /></SelectTrigger>
            <SelectContent>
              <SelectItem value=''>Todos</SelectItem>
              <SelectItem value='active'>Activo</SelectItem>
              <SelectItem value='lead'>Lead</SelectItem>
              <SelectItem value='inactive'>Inactivo</SelectItem>
            </SelectContent>
          </Select>
          {statusFilter && <Button variant='ghost' size='sm' onClick={() => setStatusFilter('')}><X className='size-4' /></Button>}
          {canExport && <Button variant='outline' size='sm' onClick={handleExport}><Download className='size-4' /></Button>}
          {canImport && (
            <Button variant='outline' size='sm' onClick={() => fileInputRef.current?.click()} disabled={importing}>
              {importing ? <Loader2 className='size-4 animate-spin' /> : <Upload className='size-4' />}
            </Button>
          )}
          <Button size='sm' onClick={handleCreate}><Plus className='size-4' /> Novo Cliente</Button>
        </div>
      </div>

      {/* Table */}
      <Card className='py-0'>
        <CardHeader className='flex flex-row items-center justify-between border-b px-6 py-4'>
          <CardTitle className='text-base font-semibold'>Clientes e Contactos ({totalCount})</CardTitle>
          {totalCount > 0 && (
            <span className='text-xs text-muted-foreground'>
              {totalCount} de {limits.maxClients === Infinity ? 'ilimitados' : limits.maxClients}
            </span>
          )}
        </CardHeader>
        <CardContent className='p-0'>
          {totalCount === 0 && !search ? (
            <div className='flex flex-col items-center gap-4 py-16 text-center'>
              <div className='bg-primary/10 flex size-16 items-center justify-center rounded-xl'>
                <Users className='size-8 text-primary' />
              </div>
              <div>
                <p className='font-semibold'>Ainda não tens clientes</p>
                <p className='text-sm text-muted-foreground mt-1 max-w-xs'>Cria o teu primeiro cliente ou importa a tua lista.</p>
              </div>
              <div className='flex gap-2'>
                <Button onClick={handleCreate}><Plus className='size-4' /> Novo Cliente</Button>
                {canImport && <Button variant='outline' onClick={() => fileInputRef.current?.click()}><Upload className='size-4' /> Importar CSV</Button>}
              </div>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='pl-6'>Cliente</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right pr-6'>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length > 0 ? filtered.map(c => {
                    const s = STATUS_MAP[c.status] ?? STATUS_MAP.active
                    return (
                      <TableRow key={c.id} className='cursor-pointer' onClick={() => navigate(`/clients/${c.id}`)}>
                        <TableCell className='pl-6'>
                          <div className='flex items-center gap-3'>
                            <Avatar className='size-8'>
                              <AvatarFallback className='bg-primary/10 text-primary text-xs font-bold'>
                                {c.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className='flex flex-col'>
                              <span className='font-medium text-sm'>{c.name}</span>
                              {c.category && <span className='text-xs text-muted-foreground'>{c.category}</span>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className='text-sm text-muted-foreground'>{c.email || '—'}</TableCell>
                        <TableCell className='text-sm text-muted-foreground'>{c.phone || '—'}</TableCell>
                        <TableCell><Badge variant={s.variant}>{s.label}</Badge></TableCell>
                        <TableCell className='text-right pr-6' onClick={e => e.stopPropagation()}>
                          <div className='flex justify-end gap-1'>
                            <Button variant='ghost' size='icon' className='size-8' onClick={() => navigate(`/clients/${c.id}`)}><Eye className='size-4' /></Button>
                            <Button variant='ghost' size='icon' className='size-8' onClick={() => navigate(`/clients/${c.id}/edit`)}><FileEdit className='size-4' /></Button>
                            <Button variant='ghost' size='icon' className='size-8 text-destructive hover:text-destructive' onClick={() => setDeleteTarget(c)}><Trash2 className='size-4' /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  }) : (
                    <TableRow>
                      <TableCell colSpan={5} className='h-40 text-center text-muted-foreground'>Nenhum cliente encontrado</TableCell>
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
            <DialogTitle>Eliminar cliente</DialogTitle>
            <DialogDescription>Tens a certeza que queres eliminar <strong>{deleteTarget?.name}</strong>? Esta acção é irreversível.</DialogDescription>
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
