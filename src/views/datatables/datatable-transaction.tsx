'use client'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef, PaginationState } from '@tanstack/react-table'
import {
  flexRender, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, useReactTable
} from '@tanstack/react-table'
import { ChevronLeftIcon, ChevronRightIcon, EllipsisVerticalIcon } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from '@/components/ui/pagination'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { usePagination } from '@/hooks/use-pagination'

export type Item = {
  id: string
  title: string
  counterparty_name?: string
  value?: number
  status: string
  created_at?: string
  end_date?: string
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  approved: 'default',
  pending:  'secondary',
  rejected: 'destructive',
  draft:    'outline',
}
const statusLabel: Record<string, string> = {
  approved: 'Assinado',
  pending:  'Pendente',
  rejected: 'Rejeitado',
  draft:    'Rascunho',
}

const ContractDatatable = ({ data, onView, onEdit, onDelete }: {
  data: Item[]
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}) => {
  const pageSize = 5
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize })

  const columns: ColumnDef<Item>[] = [
    {
      accessorKey: 'title',
      header: 'Contrato',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Avatar className='size-9'>
            <AvatarFallback className='bg-primary/10 text-primary text-xs font-bold rounded-sm'>
              {(row.original.title || 'C').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className='flex flex-col text-sm'>
            <span className='text-card-foreground font-medium truncate max-w-[180px]'>{row.original.title}</span>
            <span className='text-muted-foreground'>{row.original.counterparty_name || '—'}</span>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'value',
      header: 'Valor',
      cell: ({ row }) => {
        const v = row.original.value
        if (!v) return <span className='text-muted-foreground'>—</span>
        return <span>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumSignificantDigits: 4 }).format(v)}</span>
      }
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={statusVariant[row.original.status] ?? 'outline'}
          className='h-auto rounded-sm px-1.5 capitalize'>
          {statusLabel[row.original.status] ?? row.original.status}
        </Badge>
      )
    },
    {
      accessorKey: 'created_at',
      header: 'Data',
      cell: ({ row }) => (
        <span className='text-muted-foreground text-sm'>
          {row.original.created_at
            ? format(parseISO(row.original.created_at), 'dd MMM yyyy', { locale: ptBR })
            : '—'}
        </span>
      )
    },
    {
      id: 'actions',
      header: 'Acções',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button size='icon' variant='ghost' aria-label='Acções' />}>
            <EllipsisVerticalIcon className='size-5' />
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => onView?.(row.original.id)}>Ver</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(row.original.id)}>Editar</DropdownMenuItem>
              <DropdownMenuItem variant='destructive' onClick={() => onDelete?.(row.original.id)}>Eliminar</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      size: 60,
      enableHiding: false
    }
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onPaginationChange: setPagination,
    state: { pagination }
  })

  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage: table.getState().pagination.pageIndex + 1,
    totalPages: table.getPageCount(),
    paginationItemsToDisplay: 2
  })

  return (
    <div className='w-full'>
      <div className='border-b'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map(h => (
                  <TableHead key={h.id} className='text-muted-foreground h-14 first:pl-4'>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} className='cursor-pointer hover:bg-muted/30'
                  onClick={() => onView?.(row.original.id)}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className='first:pl-4'>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center text-muted-foreground'>
                  Sem contratos para mostrar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className='flex items-center justify-between gap-3 px-6 py-4 max-sm:flex-col md:max-lg:flex-col'>
        <p className='text-muted-foreground text-sm whitespace-nowrap' aria-live='polite'>
          A mostrar{' '}
          <span>
            {table.getState().pagination.pageIndex * pageSize + 1} a{' '}
            {Math.min((table.getState().pagination.pageIndex + 1) * pageSize, table.getRowCount())}
          </span>{' '}
          de <span>{table.getRowCount()} entradas</span>
        </p>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button className='disabled:pointer-events-none disabled:opacity-50' variant='ghost'
                onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label='Anterior'>
                <ChevronLeftIcon aria-hidden='true' /> Anterior
              </Button>
            </PaginationItem>
            {showLeftEllipsis && <PaginationItem><PaginationEllipsis /></PaginationItem>}
            {pages.map(page => {
              const isActive = page === table.getState().pagination.pageIndex + 1
              return (
                <PaginationItem key={page}>
                  <Button size='icon'
                    className={!isActive ? 'bg-primary/10 text-primary hover:bg-primary/20' : ''}
                    onClick={() => table.setPageIndex(page - 1)}
                    aria-current={isActive ? 'page' : undefined}>
                    {page}
                  </Button>
                </PaginationItem>
              )
            })}
            {showRightEllipsis && <PaginationItem><PaginationEllipsis /></PaginationItem>}
            <PaginationItem>
              <Button className='disabled:pointer-events-none disabled:opacity-50' variant='ghost'
                onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label='Seguinte'>
                Seguinte <ChevronRightIcon aria-hidden='true' />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}

export default ContractDatatable
