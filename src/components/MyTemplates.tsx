import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useUserTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate,
  type Template, type TemplateField,
} from '../hooks/useTemplates'
import { useAuth } from '../contexts/AuthContext'
import { getLimits, checkPlan } from '../lib/plans'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Search, Plus, Trash2, FileEdit, Wand2, X, Loader2, FileText, Star, Clock, Lock, Variable,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import RichTextEditor from './RichTextEditor'

const CATEGORIES = ['Serviços', 'Recursos Humanos', 'Confidencialidade', 'Imobiliário', 'Comercial'] as const

const CATEGORY_STYLE: Record<string, string> = {
  'Serviços': 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  'Recursos Humanos': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  'Confidencialidade': 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  'Imobiliário': 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
  'Comercial': 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
}

const categoryClass = (cat: string) => CATEGORY_STYLE[cat] || 'bg-muted text-muted-foreground'

/** Detecta {{variavel}} no conteúdo e converte em campos do modelo. */
const detectVariables = (content: string): TemplateField[] => {
  const matches = content.match(/\{\{\s*(\w+)\s*\}\}/g)
  if (!matches) return []
  const names = [...new Set(matches.map(m => m.replace(/[{}\s]/g, '')))]
  return names.map(name => ({
    name,
    label: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    type: 'text' as const,
    required: true,
  }))
}

type FormState = { id: string | null; name: string; description: string; category: string; content: string }

const EMPTY_FORM: FormState = { id: null, name: '', description: '', category: CATEGORIES[0], content: '' }

export default function MyTemplates() {
  const navigate = useNavigate()
  const { plan, isAdmin, trialEndsAt } = useAuth()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError] = useState('')

  const { data: templates = [], isLoading, isFetching } = useUserTemplates()
  const createTemplate = useCreateTemplate()
  const updateTemplate = useUpdateTemplate()
  const deleteTemplate = useDeleteTemplate()

  const maxTemplates = getLimits(plan, trialEndsAt).maxTemplates
  const customTemplates = useMemo(() => templates.filter(t => !t.is_system), [templates])

  const availableCategories = useMemo(() => {
    const set = new Set<string>(CATEGORIES)
    templates.forEach(t => t.category && set.add(t.category))
    return Array.from(set)
  }, [templates])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return templates.filter(t => {
      if (categoryFilter && t.category !== categoryFilter) return false
      if (!q) return true
      return (
        t.name.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      )
    })
  }, [templates, search, categoryFilter])

  const variables = useMemo(() => detectVariables(form.content), [form.content])

  useEffect(() => {
    if (!formOpen) setFormError('')
  }, [formOpen])

  const openCreate = () => {
    if (!checkPlan(plan, 'pro', isAdmin, trialEndsAt)) {
      toast.info('A criação de modelos exige o plano Pro')
      return
    }
    if (customTemplates.length >= maxTemplates) {
      toast.error(`Plano ${plan === 'free' ? 'Free' : plan} permite no máximo ${maxTemplates} modelo(s) próprios. Faz upgrade para criar mais.`)
      return
    }
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  const openEdit = (template: Template) => {
    if (template.is_system) {
      toast.info('Os modelos do sistema não podem ser editados. Cria uma cópia do teu.')
      return
    }
    setForm({
      id: template.id,
      name: template.name,
      description: template.description || '',
      category: template.category || CATEGORIES[0],
      content: template.content || '',
    })
    setFormOpen(true)
  }

  const useTemplate = (template: Template) => {
    navigate(`/contracts/new?mode=template&template=${encodeURIComponent(template.id)}`)
  }

  const submitForm = async () => {
    setFormError('')
    if (!form.name.trim()) { setFormError('Dá um nome ao modelo.'); return }
    if (!form.content.trim()) { setFormError('Escreve o conteúdo do modelo.'); return }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      content: form.content,
      variables,
    }

    try {
      if (form.id) {
        await updateTemplate.mutateAsync({ id: form.id, ...payload })
        toast.success('Modelo actualizado')
      } else {
        await createTemplate.mutateAsync(payload)
        toast.success('Modelo criado')
      }
      setFormOpen(false)
      setForm(EMPTY_FORM)
    } catch (e: any) {
      const msg = e?.message || 'Erro ao guardar o modelo'
      setFormError(msg)
      toast.error(msg)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteTemplate.mutateAsync(deleteTarget.id)
      toast.success('Modelo eliminado')
      setDeleteTarget(null)
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao eliminar')
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (date?: string) =>
    date
      ? new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date))
      : '—'

  const saving = createTemplate.isPending || updateTemplate.isPending

  if (isLoading) {
    return (
      <div className='flex flex-col gap-4'>
        <Skeleton className='h-12 w-full' />
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className='h-48 w-full' />)}
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-6'>
      {/* Toolbar */}
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
          <Input placeholder='Pesquisar modelos...' value={search} onChange={e => setSearch(e.target.value)} className='pl-9' />
          {isFetching && <Loader2 className='absolute right-2.5 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground' />}
        </div>
        <div className='flex items-center gap-2'>
          <Select value={categoryFilter} onValueChange={v => setCategoryFilter(v ?? '')}>
            <SelectTrigger className='w-44 h-8 text-sm'><SelectValue placeholder='Categoria' /></SelectTrigger>
            <SelectContent>
              <SelectItem value=''>Todas</SelectItem>
              {availableCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          {categoryFilter && <Button variant='ghost' size='icon' onClick={() => setCategoryFilter('')}><X className='size-4' /></Button>}          <Button size='sm' onClick={openCreate}><Plus className='size-4' /> Novo Modelo</Button>
        </div>
      </div>

      {/* Limite do plano */}
      <p className='text-xs text-muted-foreground'>
        {customTemplates.length} de {maxTemplates} modelo(s) próprios usados no plano{' '}
        <span className='font-medium text-foreground'>{plan === 'free' ? 'Free' : plan === 'pro' ? 'Pro' : 'Enterprise'}</span>.
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card className='p-8'>
          <div className='flex flex-col items-center gap-4 text-center'>
            <div className='bg-primary/10 flex size-16 items-center justify-center rounded-xl'>
              <FileText className='size-8 text-primary' />
            </div>
            <div>
              <h3 className='font-semibold'>{search || categoryFilter ? 'Nenhum modelo encontrado' : 'Ainda não tens modelos'}</h3>
              <p className='text-sm text-muted-foreground mt-1 max-w-xs'>
                {search || categoryFilter
                  ? 'Ajusta a pesquisa ou o filtro de categoria.'
                  : 'Cria o teu primeiro modelo para acelerar a criação de contratos.'}
              </p>
            </div>
            {!search && !categoryFilter && <Button onClick={openCreate}><Plus className='size-4' /> Novo Modelo</Button>}
          </div>
        </Card>
      ) : (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {filtered.map(template => (
            <Card key={template.id} className='group hover:border-primary/40 transition-colors'>
              <CardHeader className='pb-3'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex items-center gap-2 flex-1 min-w-0'>
                    <Badge variant='outline' className={cn('text-xs shrink-0', categoryClass(template.category))}>
                      {template.category}
                    </Badge>
                    {template.is_system && (
                      <Badge variant='secondary' className='text-xs gap-1 shrink-0'><Lock className='size-3' /> Sistema</Badge>
                    )}
                  </div>
                  {(template.usage_count || 0) > 0 && (
                    <span className='flex items-center gap-1 text-xs text-muted-foreground shrink-0'>
                      <Star className='size-3' /> {template.usage_count}
                    </span>
                  )}
                </div>
                <CardTitle className='text-base font-semibold leading-tight'>{template.name}</CardTitle>
                {template.description && (
                  <p className='text-sm text-muted-foreground line-clamp-2'>{template.description}</p>
                )}
              </CardHeader>
              <CardContent className='pt-0'>
                <div className='space-y-3'>
                  <div className='flex items-center gap-1 text-sm text-muted-foreground'>
                    <Clock className='size-3' />
                    {formatDate(template.created_at || template.updated_at)}
                  </div>
                  <div className='flex items-center justify-end gap-1'>
                    <Button size='sm' variant='outline' className='h-8' onClick={() => useTemplate(template)}>
                      <Wand2 className='size-4' /> Usar
                    </Button>
                    {!template.is_system && (
                      <>
                        <Button variant='ghost' size='icon' className='size-8' title='Editar' onClick={() => openEdit(template)}>
                          <FileEdit className='size-4' />
                        </Button>
                        <Button
                          variant='ghost' size='icon' className='size-8 text-destructive hover:text-destructive'
                          title='Eliminar' onClick={() => setDeleteTarget(template)}
                        >
                          <Trash2 className='size-4' />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog: criar / editar modelo */}
      <Dialog open={formOpen} onOpenChange={open => { if (!open && !saving) { setFormOpen(false); setFormError('') } }}>
        <DialogContent className='max-w-3xl'>
          <DialogHeader>
            <DialogTitle>{form.id ? 'Editar modelo' : 'Novo modelo'}</DialogTitle>
            <DialogDescription>
              Usa <code className='text-xs'>{'{{variavel}}'}</code> no conteúdo para criar campos que o utilizador preenche ao criar o contrato.
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='grid gap-2 sm:col-span-2'>
              <Label htmlFor='tpl-name'>Nome</Label>
              <Input
                id='tpl-name' value={form.name} placeholder='Ex.: Contrato de Prestação de Serviços'
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className='grid gap-2'>
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v ?? CATEGORIES[0] }))}>
                <SelectTrigger><SelectValue placeholder='Categoria' /></SelectTrigger>
                <SelectContent>
                  {availableCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='tpl-desc'>Descrição</Label>
              <Textarea
                id='tpl-desc' rows={2} value={form.description} placeholder='Breve descrição do modelo'
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className='grid gap-2 sm:col-span-2'>
              <Label>Conteúdo</Label>
              <div className='max-h-80 overflow-y-auto rounded-md border'>
                <RichTextEditor
                  content={form.content}
                  onChange={html => setForm(p => ({ ...p, content: html }))}
                  placeholder='Escreve o conteúdo do modelo. Insere {{nome_cliente}}, {{valor}}, etc.'
                />
              </div>
            </div>

            {variables.length > 0 && (
              <div className='grid gap-2 sm:col-span-2'>
                <Label className='flex items-center gap-1.5'><Variable className='size-3.5' /> Campos detectados ({variables.length})</Label>
                <div className='flex flex-wrap gap-1.5'>
                  {variables.map(v => (
                    <Badge key={v.name} variant='secondary' className='font-mono text-xs'>{v.name}</Badge>
                  ))}
                </div>
              </div>
            )}

            {formError && <p className='text-sm text-destructive sm:col-span-2'>{formError}</p>}
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => { setFormOpen(false); setFormError('') }} disabled={saving}>Cancelar</Button>
            <Button onClick={submitForm} disabled={saving}>
              {saving && <Loader2 className='mr-2 size-4 animate-spin' />}
              {form.id ? 'Guardar alterações' : 'Criar modelo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: eliminar */}
      <Dialog open={!!deleteTarget} onOpenChange={v => { if (!v && !deleting) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar modelo</DialogTitle>
            <DialogDescription>
              Tens a certeza que queres eliminar o modelo <strong>{deleteTarget?.name}</strong>? Esta acção é irreversível.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancelar</Button>
            <Button variant='destructive' onClick={confirmDelete} disabled={deleting}>
              {deleting && <Loader2 className='mr-2 size-4 animate-spin' />} Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
