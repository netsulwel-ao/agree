import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserSignatures, useDeleteUserSignature, useActivateUserSignature, type UserSignature } from '../hooks/useSignatures'
import { toast } from 'sonner'
import { Plus, Trash2, Loader2, FileSignature, CheckCircle2, Sparkles } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function SignatureList() {
  const navigate = useNavigate()
  const [deleteTarget, setDeleteTarget] = useState<UserSignature | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [activating, setActivating] = useState<string | null>(null)

  const { data: signatures = [], isLoading, isFetching } = useUserSignatures()
  const deleteSignature = useDeleteUserSignature()
  const activateSignature = useActivateUserSignature()

  const handleCreate = () => navigate('/signatures/register')

  const setActive = async (id: string) => {
    setActivating(id)
    try {
      await activateSignature.mutateAsync(id)
      toast.success('Assinatura activa alterada')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao alterar a assinatura activa')
    } finally {
      setActivating(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteSignature.mutateAsync({ id: deleteTarget.id, image_url: deleteTarget.image_url })
      toast.success('Assinatura eliminada')
      setDeleteTarget(null)
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao eliminar')
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(new Date(date))

  if (isLoading) {
    return (
      <div className='flex flex-col gap-4'>
        <Skeleton className='h-12 w-full' />
        <Skeleton className='h-96 w-full' />
      </div>
    )
  }

  const activeCount = signatures.filter(s => s.is_active).length

  return (
    <div className='flex flex-col gap-6'>
      {/* Toolbar */}
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h1 className='text-xl font-semibold'>Minhas Assinaturas</h1>
          <p className='text-sm text-muted-foreground'>
            {signatures.length} assinatura{signatures.length !== 1 ? 's' : ''} registada{signatures.length !== 1 ? 's' : ''}
            {activeCount > 0 && ` · ${activeCount} activa${activeCount !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          {isFetching && <Loader2 className='size-4 animate-spin text-muted-foreground' />}
          <Button size='sm' onClick={handleCreate}><Plus className='size-4' /> Nova Assinatura</Button>
        </div>
      </div>

      {signatures.length === 0 ? (
        <Card className='p-8'>
          <div className='flex flex-col items-center gap-4 text-center'>
            <div className='bg-primary/10 flex size-16 items-center justify-center rounded-xl'>
              <FileSignature className='size-8 text-primary' />
            </div>
            <div>
              <p className='font-semibold'>Nenhuma assinatura registada</p>
              <p className='text-sm text-muted-foreground mt-1 max-w-md'>
                Regista a tua assinatura digital para poderes assinar contratos de forma segura e estilizada.
                Podes desenhá-la, usar a câmara ou enviar uma imagem.
              </p>
            </div>
            <Button onClick={handleCreate}><Plus className='size-4' /> Registar Assinatura</Button>
          </div>
        </Card>
      ) : (
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {signatures.map(sig => (
            <Card key={sig.id} className={sig.is_active ? 'border-primary' : undefined}>
              <CardContent className='flex items-center gap-4'>
                <div className='flex size-20 shrink-0 items-center justify-center rounded-lg border bg-muted/30 p-2'>
                  {sig.image_url
                    ? <img src={sig.image_url} alt={sig.name} className='max-h-full max-w-full object-contain' />
                    : <FileSignature className='size-6 text-muted-foreground' />}
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center gap-2'>
                    <p className='truncate font-medium'>{sig.name || 'Assinatura'}</p>
                    {sig.is_active && (
                      <Badge className='gap-1 text-xs'><CheckCircle2 className='size-3' /> Activa</Badge>
                    )}
                  </div>
                  <p className='mt-0.5 text-xs text-muted-foreground'>Registada em {formatDate(sig.created_at)}</p>
                  <div className='mt-3 flex gap-2'>
                    {!sig.is_active && (
                      <Button variant='outline' size='sm' className='h-8' disabled={activating === sig.id} onClick={() => setActive(sig.id)}>
                        {activating === sig.id
                          ? <Loader2 className='mr-1.5 size-3.5 animate-spin' />
                          : <Sparkles className='mr-1.5 size-3.5' />}
                        Usar
                      </Button>
                    )}
                    <Button
                      variant='ghost' size='sm' className='h-8 text-destructive hover:text-destructive'
                      onClick={() => setDeleteTarget(sig)}
                    >
                      <Trash2 className='mr-1.5 size-3.5' /> Eliminar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={v => { if (!v && !deleting) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar assinatura</DialogTitle>
            <DialogDescription>
              Tens a certeza que queres eliminar a assinatura <strong>{deleteTarget?.name}</strong>? Esta acção é irreversível.
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
