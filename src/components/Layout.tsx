import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Users, DollarSign, BarChart3, PenLine,
  ThumbsUp, BookOpen, ShieldCheck, Shield, CreditCard, Settings,
  RefreshCw, Activity, Building2, Lock, Bell, LogOut, ChevronRight,
  Moon, Sun, PanelLeft, AlertTriangle, Clock, CheckCircle2, Ban,
  Send, MessageSquare, CheckCheck, Search, X,
} from 'lucide-react'
import { addDays, isBefore, isAfter, parseISO, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useCheckoutModal } from '../contexts/CheckoutModalContext'
import CheckoutModal from './CheckoutModal'

import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarInset, SidebarMenu, SidebarMenuBadge, SidebarMenuButton,
  SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton,
  SidebarMenuSubItem, SidebarProvider, SidebarTrigger, useSidebar,
} from '@/components/ui/sidebar'
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import AgreeLogo from '../Agree-logo.svg'

// ─── Types ───────────────────────────────────────────
interface AlertContract {
  id?: string; title?: string | null; end_date: string | null;
  risk_level: string | null; status: string | null;
}
interface Notification {
  id: string; type: string; title: string; message: string;
  read: boolean; created_at: string; reference_id?: string; reference_type?: string;
}
interface NavChild { id: string; label: string; icon: React.ElementType; path: string }
interface NavItem {
  id: string; label: string; icon: React.ElementType; path?: string
  badge?: number; adminOnly?: boolean; superAdminOnly?: boolean
  children?: NavChild[]
}
interface NavSection { groupLabel?: string; items: NavItem[] }

// ─── Nav ─────────────────────────────────────────────
const NAV_SECTIONS: NavSection[] = [
  {
    groupLabel: 'Principal',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { id: 'clients',   label: 'Clientes',  icon: Users,           path: '/clients'   },
      {
        id: 'contracts', label: 'Contratos', icon: FileText,
        children: [
          { id: 'contracts-list', label: 'Todos os Contratos', icon: FileText, path: '/contracts' },
          { id: 'contracts-new',  label: 'Novo Contrato',      icon: FileText, path: '/contracts/new' },
        ],
      },
      { id: 'invoices',   label: 'Facturação',  icon: DollarSign, path: '/invoices'   },
      { id: 'analytics',  label: 'Analytics',   icon: BarChart3,  path: '/analytics'  },
      { id: 'signatures', label: 'Assinaturas', icon: PenLine,    path: '/signatures' },
      { id: 'approvals',  label: 'Aprovações',  icon: ThumbsUp,   path: '/approvals'  },
      { id: 'templates',  label: 'Modelos',     icon: BookOpen,   path: '/templates'  },
      { id: 'compliance', label: 'Segurança',   icon: ShieldCheck, path: '/compliance' },
    ],
  },
  {
    groupLabel: 'Administração',
    items: [
      { id: 'admin',              label: 'Utilizadores',    icon: Shield,    path: '/admin/users',              adminOnly: true },
      { id: 'payments',           label: 'Pagamentos',      icon: CreditCard, path: '/admin/payments',          adminOnly: true },
      { id: 'plan-history',       label: 'Histórico Planos',icon: RefreshCw,  path: '/admin/plan-history',      adminOnly: true },
      { id: 'settings',           label: 'Definições',      icon: Settings,   path: '/admin/settings',          adminOnly: true },
      { id: 'approval-workflows', label: 'Workflows',       icon: ThumbsUp,   path: '/admin/approval-workflows',adminOnly: true },
      { id: 'audit-logs',         label: 'Auditoria',       icon: Activity,   path: '/admin/audit-logs',        adminOnly: true },
      { id: 'companies',          label: 'Empresas',        icon: Building2,  path: '/admin/companies',         superAdminOnly: true },
      { id: 'permissions',        label: 'Permissões',      icon: Lock,       path: '/admin/permissions',       superAdminOnly: true },
    ],
  },
]

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
    <Button variant="ghost" size="icon-lg" onClick={toggle} title="Alternar tema">
      {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </Button>
  )
}

// ─── Sidebar Component ────────────────────────────────
function AppSidebar({
  alertCount, isAdmin, isSuperAdmin,
}: { alertCount: number; isAdmin: boolean; isSuperAdmin: boolean }) {
  const location = useLocation()
  const { state } = useSidebar()
  const collapsed = state === 'collapsed'
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  const visibleSections = NAV_SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (item.superAdminOnly) return isSuperAdmin
      if (item.adminOnly) return isAdmin
      return true
    }),
  })).filter(s => s.items.length > 0)

  const isActive = (path?: string) => path ? location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path)) : false
  const isChildActive = (children?: NavChild[]) => children?.some(c => isActive(c.path)) ?? false

  const isBranchOpen = useCallback((id: string, children?: NavChild[]) => {
    if (id in openItems) return openItems[id]
    return isChildActive(children)
  }, [openItems, location.pathname])

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      {/* Logo */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="gap-2.5 bg-transparent!" render={<Link to="/dashboard" />}>
              <img src={AgreeLogo} alt="Agree" className="size-8 shrink-0" />
              <div className="flex flex-col items-start">
                <span className="text-lg font-bold leading-tight">Agree</span>
                <span className="text-xs font-light text-muted-foreground leading-tight">Gestão de Contratos</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent>
        {visibleSections.map((section, si) => (
          <SidebarGroup key={si}>
            {section.groupLabel && (
              <SidebarGroupLabel className="text-sidebar-foreground/50 tracking-wider uppercase">
                {section.groupLabel}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map(item => {
                  if (item.children) {
                    const childActive = isChildActive(item.children)
                    const open = isBranchOpen(item.id, item.children)
                    return (
                      <Collapsible
                        key={item.id}
                        className="group/collapsible"
                        open={open}
                        onOpenChange={v => setOpenItems(p => ({ ...p, [item.id]: v }))}
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger
                            render={
                              <SidebarMenuButton
                                tooltip={item.label}
                                isActive={childActive}
                                className="data-active:bg-primary/5!"
                              />
                            }
                          >
                            <item.icon />
                            <span className="flex-1 truncate">{item.label}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-all duration-200 data-ending-style:h-0 data-starting-style:h-0">
                            <SidebarMenuSub>
                              {item.children.map(child => (
                                <SidebarMenuSubItem key={child.id}>
                                  <SidebarMenuSubButton
                                    className="data-active:bg-primary/10! justify-between"
                                    render={<Link to={child.path} />}
                                    isActive={isActive(child.path)}
                                  >
                                    <span className="truncate">{child.label}</span>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    )
                  }
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        tooltip={item.label}
                        render={<Link to={item.path!} />}
                        isActive={isActive(item.path)}
                        className="data-active:bg-primary/10!"
                      >
                        <item.icon />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.id === 'dashboard' && alertCount > 0 && !collapsed && (
                          <SidebarMenuBadge className="bg-destructive text-destructive-foreground rounded-full px-1.5 font-normal">
                            {alertCount}
                          </SidebarMenuBadge>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}

// ─── Header Component ─────────────────────────────────
function AppHeader({
  notifications, unreadCount, alertCount, alerts, planExpiresAt, plan,
  onMarkRead, onMarkAllRead,
}: {
  notifications: Notification[]; unreadCount: number; alertCount: number
  alerts: AlertContract[]; planExpiresAt: string | null; plan: string
  onMarkRead: (id: string) => void; onMarkAllRead: () => void
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut, user } = useAuth()
  const { openCheckout, openRenewal } = useCheckoutModal()
  const totalAlerts = alertCount + unreadCount

  // Breadcrumb
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
    <header className="bg-card sticky top-0 z-50 border-b">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-6 px-4 py-2 sm:px-6">
        {/* Left */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="[&_svg]:size-5!" />
          <Separator orientation="vertical" className="hidden h-4! data-vertical:self-center sm:block" />
          <Breadcrumb className="hidden sm:block">
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
        <div className="flex items-center gap-1.5">
          {/* Notificações */}
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="ghost" size="icon-lg" className="relative">
                {totalAlerts > 0 ? (
                  <AlertTriangle className={`size-5 ${totalAlerts > 0 ? 'text-destructive' : ''}`} />
                ) : (
                  <Bell className="size-5" />
                )}
                {totalAlerts > 0 && (
                  <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive" />
                )}
              </Button>
            } />
            <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notificações</span>
                {unreadCount > 0 && (
                  <button onClick={onMarkAllRead} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <CheckCheck className="size-3" /> Marcar todas
                  </button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 && alerts.length === 0 ? (
                <div className="px-3 py-4 text-sm text-muted-foreground text-center">Sem notificações</div>
              ) : (
                <>
                  {notifications.slice(0, 8).map(n => (
                    <DropdownMenuItem
                      key={n.id}
                      className={`flex flex-col items-start gap-0.5 px-3 py-2 cursor-pointer ${!n.read ? 'bg-primary/5' : ''}`}
                      onClick={() => {
                        onMarkRead(n.id)
                        if (n.reference_id && n.reference_type === 'contract') navigate(`/contracts/${n.reference_id}`)
                      }}
                    >
                      <span className="font-medium text-sm">{n.title}</span>
                      <span className="text-xs text-muted-foreground">{n.message}</span>
                      <span className="text-xs text-muted-foreground/60">
                        {n.created_at ? format(parseISO(n.created_at), "dd/MM 'às' HH:mm", { locale: ptBR }) : ''}
                      </span>
                    </DropdownMenuItem>
                  ))}
                  {alerts.slice(0, 4).map((a, i) => {
                    const end = a.end_date ? parseISO(a.end_date) : null
                    const now = new Date()
                    const expired = end && isBefore(end, now)
                    return (
                      <DropdownMenuItem key={i} className="flex flex-col items-start gap-0.5 px-3 py-2">
                        <span className={`font-medium text-sm ${expired ? 'text-destructive' : 'text-amber-600'}`}>
                          {a.title || 'Contrato'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {expired ? 'Vencido' : 'A vencer em 30 dias'}
                          {a.end_date ? ` — ${new Date(a.end_date).toLocaleDateString('pt-PT')}` : ''}
                        </span>
                      </DropdownMenuItem>
                    )
                  })}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="justify-center text-xs text-primary" onClick={() => navigate('/notifications')}>
                    Ver todas as notificações
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <ModeToggle />

          {/* Perfil */}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-lg" className="rounded-full" />}>
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                  {avatarLetter}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>
                <div className="font-medium">{displayName}</div>
                <div className="text-xs text-muted-foreground font-normal">{user?.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link to="/profile" />}>
                <Settings className="size-4 mr-2" /> Perfil
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link to="/billing" />}>
                <CreditCard className="size-4 mr-2" /> Billing
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {plan === 'free' && (
                <DropdownMenuItem onClick={() => openCheckout()}>
                  <span className="text-primary font-medium">⬆ Upgrade de plano</span>
                </DropdownMenuItem>
              )}
              {(plan === 'pro' || plan === 'enterprise') && (
                <DropdownMenuItem onClick={() => openRenewal(plan as any)}>
                  <RefreshCw className="size-4 mr-2" /> Renovar plano
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={async () => { await signOut() }} className="text-destructive focus:text-destructive">
                <LogOut className="size-4 mr-2" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

// ─── Footer ───────────────────────────────────────────
function AppFooter() {
  return (
    <footer className="border-t">
      <div className="text-muted-foreground mx-auto flex max-w-screen-2xl items-center justify-between gap-3 px-4 py-3 max-sm:flex-col sm:gap-6 sm:px-6">
        <p className="text-sm text-balance max-sm:text-center">
          © {new Date().getFullYear()}{' '}
          <a href="https://agree.app" target="_blank" rel="noreferrer" className="text-primary hover:underline">
            Agree
          </a>{' '}
          — Plataforma de Gestão de Contratos
        </p>
        <div className="flex items-center gap-5 max-sm:hidden">
          <Link to="/termos" className="text-muted-foreground hover:text-foreground text-sm transition">Termos</Link>
          <Link to="/privacidade" className="text-muted-foreground hover:text-foreground text-sm transition">Privacidade</Link>
        </div>
      </div>
    </footer>
  )
}

// ─── Main Layout ──────────────────────────────────────
export default function Layout() {
  const { user, signOut, isAdmin, isSuperAdmin, plan, planExpiresAt } = useAuth()
  const { openCheckout, openRenewal } = useCheckoutModal()

  const [alertCount, setAlertCount] = useState(0)
  const [alerts, setAlerts] = useState<AlertContract[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Buscar alertas de contratos
  useEffect(() => {
    if (!user) return
    const fetch = async () => {
      const { data } = await supabase.from('contracts').select('id,title,end_date,risk_level,status').eq('owner_id', user.id)
      if (!data) return
      const today = new Date(); const in30 = addDays(today, 30)
      const flagged = data.filter(c => {
        const expiring = c.end_date && isAfter(parseISO(c.end_date), today) && isBefore(parseISO(c.end_date), in30)
        const expired = c.end_date && isBefore(parseISO(c.end_date), today) && c.status !== 'rejected'
        return expiring || expired || c.risk_level === 'high'
      })
      setAlertCount(flagged.length); setAlerts(flagged)
    }
    fetch()
  }, [user])

  // Buscar notificações
  useEffect(() => {
    if (!user) return
    const fetchNotifs = async () => {
      try { await supabase.rpc('insert_expiry_notifications') } catch {}
      const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
      if (data) setNotifications(data)
    }
    fetchNotifs()
    const channel = supabase.channel('notifs-layout').on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
      (p: any) => setNotifications(prev => [p.new, ...prev].slice(0, 20))
    ).subscribe()
    return () => { supabase.removeChannel(channel) }
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

  // Init dark mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') document.documentElement.classList.add('dark')
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <SidebarProvider>
      <div className="flex h-svh w-full min-w-0 bg-background">
        <AppSidebar alertCount={alertCount} isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} />
        <SidebarInset className="flex flex-1 flex-col overflow-hidden">
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
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6">
              <Outlet />
            </div>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
      <CheckoutModal />
    </SidebarProvider>
  )
}
