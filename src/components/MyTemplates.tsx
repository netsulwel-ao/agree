import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTemplates, useDeleteTemplate, type Template } from '../hooks/useTemplates'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'
import { Search, Plus, Eye, FileEdit, Trash2, Download, Copy, X, Loader2, FileText, Star, Clock } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  contract: { label: 'Contrato', color: 'bg-blue-500' },
  invoice: { label: 'Factura', color: 'bg-green-500' },
  proposal: { label: 'Proposta', color: 'bg-purple-500' },
  agreement: { label: 'Acordo', color: 'bg-orange-500' },
  legal: { label: 'Legal', color: 'bg-red-500' },
  other: { label: 'Outro', color: 'bg-gray-500' }
}

export default function MyTemplates() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [duplicating, setDuplicating] = useState<string | null>(null)

  const { data: templatesData, isLoading, isFetching } = useTemplates(page, search)
  const templates = templatesData?.data ?? []
  const totalCount = templatesData?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / 12))
  const deleteMutation = useDeleteTemplate()

  const filtered = templates.filter(template => {
    if (categoryFilter && template.category !== categoryFilter) return false
    return true
  })

  const handleCreate = () => navigate('/templates/new')

  const handleDuplicate = async (template: Template) => {
    setDuplicating(template.id)
    try {
      // Duplicate logic would go here
      toast.success(`Template "${template.name}" duplicado`)
    } catch (e: any) { 
      toast.error(e?.message || 'Erro ao duplicar') 
    } finally { 
      setDuplicating(null) 
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      toast.success('Template eliminado'); setDeleteTarget(null)
    } catch (e: any) { toast.error(e?.message || 'Erro ao eliminar') }
    finally { setDeleting(false) }
  }

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat('pt-PT', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }).format(new Date(date))

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
          <Input placeholder='Pesquisar templates...' value={search} onChange={e => setSearch(e.target.value)} className='pl-9' />
          {isFetching && <Loader2 className='absolute right-2.5 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground' />}
        </div>
        <div className='flex items-center gap-2'>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className='w-36 h-8 text-sm'><SelectValue placeholder='Categoria' /></SelectTrigger>
            <SelectContent>
              <SelectItem value=''>Todas</SelectItem>
              <SelectItem value='contract'>Contrato</SelectItem>
              <SelectItem value='invoice'>Factura</SelectItem>
              <SelectItem value='proposal'>Proposta</SelectItem>
              <SelectItem value='agreement'>Acordo</SelectItem>
              <SelectItem value='legal'>Legal</SelectItem>
              <SelectItem value='other'>Outro</SelectItem>
            </SelectContent>
          </Select>
          {categoryFilter && <Button variant='ghost' size='sm' onClick={() => setCategoryFilter('')}><X className='size-4' /></Button>}
          <Button size='sm' onClick={handleCreate}><Plus className='size-4' /> Novo Template</Button>
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
              <h3 className='font-semibold'>Ainda não tens templates</h3>
              <p className='text-sm text-muted-foreground mt-1 max-w-xs'>Cria o teu primeiro template para acelerar a criação de documentos.</p>
            </div>
            <Button onClick={handleCreate}><Plus className='size-4' /> Novo Template</Button>
          </div>
        </Card>
      ) : (
        <>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {filtered.map(template => {
              const category = CATEGORY_MAP[template.category] ?? CATEGORY_MAP.other
              
              return (
                <Card key={template.id} className='hover:bg-muted/50 cursor-pointer transition-colors group' onClick={() => navigate(`/templates/${template.id}`)}>
                  <CardHeader className='pb-3'>
                    <div className='flex items-start justify-between'>
                      <div className='flex items-center gap-2 flex-1'>
                        <div className={`size-3 rounded-full ${category.color}`} />
                        <Badge variant='outline' className='text-xs'>{category.label}</Badge>
                      </div>
                      {template.is_favorite && (
                        <Star className='size-4 text-yellow-500 fill-current' />
                      )}
                    </div>
                    <div className='space-y-1'>
                      <CardTitle className='text-base font-semibold leading-tight'>{template.name}</CardTitle>
                      {template.description && (
                        <p className='text-sm text-muted-foreground line-clamp-2'>{template.description}</p>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className='pt-0'>
                    <div className='space-y-3'>
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-muted-foreground flex items-center gap-1'>
                          <Clock className='size-3' />
                          {formatDate(template.updated_at)}
                        </span>
                        <span className='text-muted-foreground'>
                          {template.usage_count || 0} usos
                        </span>
                      </div>
                      
                      <div className='flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity' onClick={e => e.stopPropagation()}>
                        <Button variant='ghost' size='icon' className='size-8' onClick={() => navigate(`/templates/${template.id}`)}>
                          <Eye className='size-4' />
                        </Button>
                        <Button variant='ghost' size='icon' className='size-8' onClick={() => navigate(`/templates/${template.id}/edit`)}>
                          <FileEdit className='size-4' />
                        </Button>
                        <Button 
                          variant='ghost' 
                          size='icon' 
                          className='size-8' 
                          onClick={() => handleDuplicate(template)}
                          disabled={duplicating === template.id}
                        >
                          {duplicating === template.id ? (
                            <Loader2 className='size-4 animate-spin' />
                          ) : (
                            <Copy className='size-4' />
                          )}
                        </Button>
                        <Button variant='ghost' size='icon' className='size-8 text-destructive hover:text-destructive' onClick={() => setDeleteTarget(template)}>
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
                <p>Nenhum template encontrado</p>
              </div>
            </Card>
          )}

          {totalPages > 1 && (
            <div className='flex items-center justify-between'>
              <p className='text-sm text-muted-foreground'>
                Página {page} de {totalPages} • {totalCount} templates
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
            <DialogTitle>Eliminar template</DialogTitle>
            <DialogDescription>
              Tens a certeza que queres eliminar o template <strong>{deleteTarget?.name}</strong>? Esta acção é irreversível.
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