import React, { Fragment, useCallback, useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell, LogOut, Moon, Sun, AlertTriangle,
  CheckCheck, RefreshCw, Settings, CreditCard,
} from 'lucide-react'
import { addDays, isBefore, isAfter, parseISO, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useCheckoutModal } from '../contexts/CheckoutModalContext'
import CheckoutModal from './CheckoutModal'
import AppSidebar from './AppSidebar'

import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

// ─── Types ───────────────────────────────────────────
interface AlertContract {
  id?: string; title?: string | null
  end_date: string | null; risk_level: string | null; status: string | null
}
interface Notification {
  id: string; type: string; title: string; message: string
  read: boolean; created_at: string; reference_id?: string; reference_type?: string
}

// ─── Dark Mode Toggle ─────────────────────────────────
function ModeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }
  return (
    <Button variant='ghost' size='icon-lg' onClick={toggle} title='Alternar tema'>
      {dark ? <Sun className='size-5' /> : <Moon className='size-5' />}
    </Button>
  )
}

// ─── Header (idêntico ao AdminCN) ────────────────────
function AppHeader({
  notifications, unreadCount, alertCount, alerts, plan,
  onMarkRead, onMarkAllRead,
}: {
  notifications: Notification[]; unreadCount: number; alertCount: number
  alerts: AlertContract[]; plan: string; planExpiresAt: string | null
  onMarkRead: (id: string) => void; onMarkAllRead: () => void
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut, user } = useAuth()
  const { openCheckout, openRenewal } = useCheckoutModal()
  const totalAlerts = alertCount + unreadCount

  const segments = location.pathname.split('/').filter(Boolean)
  const labelMap: Record<string, string> = {
    dashboard: 'Dashboard', contracts: 'Contratos', clients: 'Clientes',
    invoices: 'Facturação', analytics: 'Analytics', signatures: 'Assinaturas',
    approvals: 'Aprovações', templates: 'Modelos', compliance: 'Segurança',
    admin: 'Admin', users: 'Utilizadores', payments: 'Pagamentos',
    settings: 'Definições', 'plan-history': 'Histórico Planos',
    'audit-logs': 'Auditoria', companies: 'Empresas', permissions: 'Permissões',
    'approval-workflows': 'Workflows', profile: 'Perfil', billing: 'Billing',
    notifications: 'Notificações', new: 'Novo', edit: 'Editar',
  }
  const label = (s: string) => labelMap[s] || s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Utilizador'
  const avatarLetter = displayName.charAt(0).toUpperCase()

  return (
    <header className='bg-card sticky top-0 z-50 border-b w-full'>
      <div className='flex items-center justify-between gap-6 px-4 py-2 sm:px-6'>
        {/* Left */}
        <div className='flex items-center gap-4'>
          <SidebarTrigger className='[&_svg]:size-5!' />
          <Separator orientation='vertical' className='hidden h-4! data-vertical:self-center sm:block' />
          <Breadcrumb className='hidden sm:block'>
            <BreadcrumbList>
              {segments.map((seg, i) => {
                const isLast = i === segments.length - 1
                const href = '/' + segments.slice(0, i + 1).join('/')
                return (
                  <Fragment key={href}>
                    <BreadcrumbItem>
                      {isLast
                        ? <BreadcrumbPage>{label(seg)}</BreadcrumbPage>
                        : <BreadcrumbLink href={href}>{label(seg)}</BreadcrumbLink>
                      }
                    </BreadcrumbItem>
                    {!isLast && <BreadcrumbSeparator />}
                  </Fragment>
                )
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Right */}
        <div className='flex items-center gap-1.5'>
          {/* Notificações */}
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant='ghost' size='icon-lg' className='relative'>
                {totalAlerts > 0
                  ? <AlertTriangle className='size-5 text-destructive' />
                  : <Bell className='size-5' />}
                {totalAlerts > 0 && (
                  <span className='absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive' />
                )}
              </Button>
            } />
            <DropdownMenuContent align='end' className='w-80 max-h-96 overflow-y-auto'>
              <DropdownMenuLabel className='flex items-center justify-between'>
                <span>Notificações</span>
                {unreadCount > 0 && (
                  <button onClick={onMarkAllRead} className='text-xs text-muted-foreground hover:text-foreground flex items-center gap-1'>
                    <CheckCheck className='size-3' /> Marcar todas
                  </button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 && alerts.length === 0
                ? <div className='px-3 py-4 text-sm text-muted-foreground text-center'>Sem notificações</div>
                : <>
                    {notifications.slice(0, 8).map(n => (
                      <DropdownMenuItem key={n.id}
                        className={`flex flex-col items-start gap-0.5 px-3 py-2 cursor-pointer ${!n.read ? 'bg-primary/5' : ''}`}
                        onClick={() => { onMarkRead(n.id); if (n.reference_id && n.reference_type === 'contract') navigate(`/contracts/${n.reference_id}`) }}>
                        <span className='font-medium text-sm'>{n.title}</span>
                        <span className='text-xs text-muted-foreground'>{n.message}</span>
                        <span className='text-xs text-muted-foreground/60'>
                          {n.created_at ? format(parseISO(n.created_at), "dd/MM 'às' HH:mm", { locale: ptBR }) : ''}
                        </span>
                      </DropdownMenuItem>
                    ))}
                    {alerts.slice(0, 4).map((a, i) => {
                      const expired = a.end_date && isBefore(parseISO(a.end_date), new Date())
                      return (
                        <DropdownMenuItem key={i} className='flex flex-col items-start gap-0.5 px-3 py-2'>
                          <span className={`font-medium text-sm ${expired ? 'text-destructive' : 'text-amber-600'}`}>
                            {a.title || 'Contrato'}
                          </span>
                          <span className='text-xs text-muted-foreground'>
                            {expired ? 'Vencido' : 'A vencer em 30 dias'}
                            {a.end_date ? ` — ${new Date(a.end_date).toLocaleDateString('pt-PT')}` : ''}
                          </span>
                        </DropdownMenuItem>
                      )
                    })}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className='justify-center text-xs text-primary' onClick={() => navigate('/notifications')}>
                      Ver todas as notificações
                    </DropdownMenuItem>
                  </>
              }
            </DropdownMenuContent>
          </DropdownMenu>

          <ModeToggle />

          {/* Perfil */}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant='ghost' size='icon-lg' className='rounded-full' />}>
              <Avatar className='size-8'>
                <AvatarFallback className='bg-primary text-primary-foreground text-sm font-bold'>
                  {avatarLetter}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-52'>
              <DropdownMenuLabel>
                <div className='font-medium'>{displayName}</div>
                <div className='text-xs text-muted-foreground font-normal'>{user?.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link to='/profile' />}>
                <Settings className='size-4 mr-2' /> Perfil
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link to='/billing' />}>
                <CreditCard className='size-4 mr-2' /> Billing
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {plan === 'free' && (
                <DropdownMenuItem onClick={() => openCheckout()}>
                  <span className='text-primary font-medium'>⬆ Upgrade de plano</span>
                </DropdownMenuItem>
              )}
              {(plan === 'pro' || plan === 'enterprise') && (
                <DropdownMenuItem onClick={() => openRenewal(plan as any)}>
                  <RefreshCw className='size-4 mr-2' /> Renovar plano
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={async () => { await signOut() }} className='text-destructive focus:text-destructive'>
                <LogOut className='size-4 mr-2' /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

// ─── Footer (idêntico ao AdminCN) ────────────────────
function AppFooter() {
  return (
    <footer>
      <div className='text-muted-foreground mx-auto flex max-w-360 items-center justify-between gap-3 px-4 py-3 max-sm:flex-col sm:gap-6 sm:px-6'>
        <p className='text-sm text-balance max-sm:text-center'>
          © {new Date().getFullYear()}{' '}
          <a href='https://agree.app' target='_blank' rel='noreferrer' className='text-primary hover:underline'>Agree</a>
          {' '}— Plataforma de Gestão de Contratos
        </p>
        <div className='flex items-center gap-5 max-sm:hidden'>
          <Link to='/termos' className='text-muted-foreground hover:text-foreground text-sm transition'>Termos</Link>
          <Link to='/privacidade' className='text-muted-foreground hover:text-foreground text-sm transition'>Privacidade</Link>
        </div>
      </div>
    </footer>
  )
}

// ─── Main Layout ──────────────────────────────────────
export default function Layout() {
  const { user, isAdmin, isSuperAdmin, plan, planExpiresAt } = useAuth()

  const [alertCount, setAlertCount] = useState(0)
  const [alerts, setAlerts]         = useState<AlertContract[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    if (!user) return
    const run = async () => {
      const { data } = await supabase.from('contracts').select('id,title,end_date,risk_level,status').eq('owner_id', user.id)
      if (!data) return
      const today = new Date(); const in30 = addDays(today, 30)
      const flagged = data.filter(c => {
        const expiring = c.end_date && isAfter(parseISO(c.end_date), today) && isBefore(parseISO(c.end_date), in30)
        const expired  = c.end_date && isBefore(parseISO(c.end_date), today) && c.status !== 'rejected'
        return expiring || expired || c.risk_level === 'high'
      })
      setAlertCount(flagged.length); setAlerts(flagged)
    }
    run()
  }, [user])

  useEffect(() => {
    if (!user) return
    const run = async () => {
      try { await supabase.rpc('insert_expiry_notifications') } catch {}
      const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
      if (data) setNotifications(data)
    }
    run()
    const ch = supabase.channel('notifs-layout').on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
      (p: any) => setNotifications(prev => [p.new, ...prev].slice(0, 20))
    ).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [user])

  const markAsRead = useCallback(async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [])

  const markAllAsRead = useCallback(async () => {
    if (!user) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    toast.success('Notificações marcadas como lidas')
  }, [user])

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') document.documentElement.classList.add('dark')
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <SidebarProvider>
      <div className='flex h-full w-full min-w-0 overflow-hidden'>
        <AppSidebar isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} plan={plan} />
        <SidebarInset className='flex flex-1 flex-col min-w-0 overflow-hidden'>
          <AppHeader
            notifications={notifications}
            unreadCount={unreadCount}
            alertCount={alertCount}
            alerts={alerts}
            planExpiresAt={planExpiresAt}
            plan={plan}
            onMarkRead={markAsRead}
            onMarkAllRead={markAllAsRead}
          />
          <main className='mx-auto size-full max-w-360 flex-1 px-4 py-6 sm:px-6'>
            <Outlet />
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
      <CheckoutModal />
    </SidebarProvider>
  )
}
