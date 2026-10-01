import { type ComponentType, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import * as Icon from 'lucide-react'
import { ChevronRightIcon, User, Settings } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub,
  DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuBadge,
  SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton,
  SidebarMenuSubItem, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { useAuth } from '../contexts/AuthContext'
import AgreeLogo from '../Agree-logo.svg'

// ─── Tipos (igual ao AdminCN) ─────────────────────────
type IconName = keyof typeof Icon

type MenuLeafSubItem = {
  label: string; href: string; badge?: string; badgeClassName?: string
}
type MenuGroupSubItem = {
  label: string; childItems: MenuLeafSubItem[]
}
type MenuSubItem = MenuLeafSubItem | MenuGroupSubItem
type MenuItem = {
  icon: IconName; label: string
} & (
  | { href: string; badge?: string; badgeClassName?: string; childItems?: never }
  | { href?: never; badge?: string; badgeClassName?: string; childItems: MenuSubItem[] }
)
type NavItem = { groupLabel?: string; items: MenuItem[] }

const isSubGroup = (item: MenuSubItem): item is MenuGroupSubItem => 'childItems' in item
const subGroupKey = (a: string, b: string) => `${a}::${b}`

function isLinkActive(href: string, pathname: string): boolean {
  if (href === '/dashboard') return pathname === href
  return pathname === href || pathname.startsWith(href + '/')
}

function getActiveBranchKeys(groups: NavItem[], pathname: string): Set<string> {
  const keys = new Set<string>()
  groups.forEach(group => {
    group.items.forEach(item => {
      item.childItems?.forEach(subItem => {
        if (isSubGroup(subItem)) {
          if (subItem.childItems.some(leaf => isLinkActive(leaf.href, pathname))) {
            keys.add(item.label)
            keys.add(subGroupKey(item.label, subItem.label))
          }
        } else if (isLinkActive(subItem.href, pathname)) {
          keys.add(item.label)
        }
      })
    })
  })
  return keys
}

// ─── Nav do nosso sistema ─────────────────────────────
// Estrutura idêntica ao navItems do AdminCN
const buildNavItems = (isAdmin: boolean, isSuperAdmin: boolean, plan: string): NavItem[] => {
  const items: NavItem[] = [
    {
      groupLabel: 'Principal',
      items: [
        { icon: 'LayoutDashboard', label: 'Dashboard',   href: '/dashboard'  },
        { icon: 'Users',           label: 'Clientes',    href: '/clients'    },
        {
          icon: 'FileText', label: 'Contratos',
          childItems: [
            { label: 'Todos os Contratos', href: '/contracts'     },
            { label: 'Novo Contrato',      href: '/contracts/new' },
          ],
        },
        { icon: 'DollarSign',  label: 'Facturação',  href: '/invoices'   },
        { icon: 'BarChart3',   label: 'Analytics',   href: '/analytics'  },
        { icon: 'PenLine',     label: 'Assinaturas', href: '/signatures' },
        { icon: 'ThumbsUp',    label: 'Aprovações',  href: '/approvals'  },
        { icon: 'BookOpen',    label: 'Modelos',     href: '/templates'  },
        { icon: 'ShieldCheck', label: 'Segurança',   href: '/compliance' },
      ],
    },
  ]

  if (isAdmin) {
    items.push({
      groupLabel: 'Administração',
      items: [
        { icon: 'Shield',      label: 'Utilizadores',     href: '/admin/users'               },
        { icon: 'CreditCard',  label: 'Pagamentos',       href: '/admin/payments'            },
        { icon: 'RefreshCw',   label: 'Histórico Planos', href: '/admin/plan-history'        },
        { icon: 'Settings',    label: 'Definições',       href: '/admin/settings'            },
        { icon: 'ThumbsUp',    label: 'Workflows',        href: '/admin/approval-workflows'  },
        { icon: 'Activity',    label: 'Auditoria',        href: '/admin/audit-logs'          },
        ...(isSuperAdmin ? [
          { icon: 'Building2' as IconName, label: 'Empresas',   href: '/admin/companies'   },
          { icon: 'Lock'      as IconName, label: 'Permissões', href: '/admin/permissions' },
        ] : []),
      ],
    })
  }

  return items
}

// ─── FlyoutMenuLink (igual ao AdminCN) ───────────────
const FlyoutMenuLink = ({ item, isActive }: { item: MenuLeafSubItem; isActive: boolean }) => (
  <DropdownMenuItem
    className={cn('justify-between gap-2', isActive && 'bg-primary/10 text-accent-foreground font-medium')}
    render={<Link to={item.href} />}
  >
    <span className='truncate'>{item.label}</span>
    {item.badge && (
      <span className={cn('bg-primary/10 ml-auto rounded-full px-1.5 text-xs font-normal', item.badgeClassName)}>
        {item.badge}
      </span>
    )}
  </DropdownMenuItem>
)

// ─── FlyoutMenuItem (igual ao AdminCN) ───────────────
const FlyoutMenuItem = ({ item, childItems, isChildActive, pathname }: {
  item: MenuItem; childItems: MenuSubItem[]; isChildActive: boolean; pathname: string
}) => {
  const Tag = item.icon ? (Icon[item.icon] as ComponentType) : null
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger render={<SidebarMenuButton isActive={isChildActive} className='data-active:bg-primary/5! h-10 px-4 rounded-lg hover:bg-muted/50' />}>
          {Tag && <Tag className='size-5' />}
          <span className='min-w-0 flex-1 truncate text-base font-medium'>{item.label}</span>
          <ChevronRightIcon className='ml-auto size-4' />
        </DropdownMenuTrigger>
        <DropdownMenuContent side='right' align='start' sideOffset={12} className='w-auto min-w-52'>
          <DropdownMenuGroup>
            <DropdownMenuLabel className='text-foreground flex items-center gap-2 text-sm'>
              <span className='truncate'>{item.label}</span>
              {item.badge && (
                <span className={cn('bg-primary/10 rounded-full px-2 py-1 text-xs font-normal', item.badgeClassName)}>
                  {item.badge}
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {childItems.map(subItem =>
              isSubGroup(subItem) ? (
                <DropdownMenuSub key={subItem.label}>
                  <DropdownMenuSubTrigger>
                    <span className='truncate'>{subItem.label}</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent sideOffset={9} className='w-auto min-w-48'>
                    {subItem.childItems.map(leaf => (
                      <FlyoutMenuLink key={leaf.label} item={leaf} isActive={isLinkActive(leaf.href, pathname)} />
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ) : (
                <FlyoutMenuLink key={subItem.label} item={subItem} isActive={isLinkActive(subItem.href, pathname)} />
              )
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

// ─── SidebarGroupedMenuItems (igual ao AdminCN) ──────
const SidebarGroupedMenuItems = ({ data, groupLabel, pathname, isIconMode, isBranchOpen, setOpenItem }: {
  data: MenuItem[]; groupLabel?: string; pathname: string
  isIconMode: boolean; isBranchOpen: (key: string) => boolean; setOpenItem: (key: string, open: boolean) => void
}) => (
  <SidebarGroup>
    {groupLabel && !isIconMode && (
      <SidebarGroupLabel className='text-sidebar-foreground/50 tracking-wider uppercase text-sm font-medium px-4 py-3 mb-1'>
        {groupLabel}
      </SidebarGroupLabel>
    )}
    <SidebarGroupContent className={isIconMode ? 'px-2' : 'px-2'}>
      <SidebarMenu className={isIconMode ? 'space-y-2' : 'space-y-1.5'}>
        {data.map(item => {
          const Tag = item.icon ? (Icon[item.icon] as ComponentType) : null
          const isChildActive = item.childItems?.some(sub =>
            isSubGroup(sub)
              ? sub.childItems.some(leaf => isLinkActive(leaf.href, pathname))
              : isLinkActive(sub.href, pathname)
          ) ?? false

          if (item.childItems && isIconMode) {
            return (
              <FlyoutMenuItem key={item.label} item={item} childItems={item.childItems}
                isChildActive={isChildActive} pathname={pathname} />
            )
          }

          return item.childItems ? (
            <Collapsible className='group/collapsible' key={item.label}
              open={isBranchOpen(item.label)}
              onOpenChange={open => setOpenItem(item.label, open)}>
              <SidebarMenuItem>
                <CollapsibleTrigger render={
                  <SidebarMenuButton tooltip={item.label} isActive={isChildActive} 
                    className='data-active:bg-primary/5! h-10 px-4 text-base font-medium rounded-lg hover:bg-muted/50 transition-colors' />
                }>
                  {Tag && <Tag className='size-5' />}
                  <span className={cn('min-w-0 flex-1 truncate', item.badge && 'pr-14')}>{item.label}</span>
                  {item.badge && (
                    <SidebarMenuBadge className={cn('bg-primary/10 max-w-24 truncate rounded-full px-2 py-1 font-normal text-xs', item.badgeClassName)}>
                      {item.badge}
                    </SidebarMenuBadge>
                  )}
                  <ChevronRightIcon className='ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90 size-4' />
                </CollapsibleTrigger>
                <CollapsibleContent className='h-(--collapsible-panel-height) overflow-hidden transition-all duration-200 data-ending-style:h-0 data-starting-style:h-0'>
                  <SidebarMenuSub className='ml-6 mt-2 space-y-1'>
                    {item.childItems.map(subItem =>
                      isSubGroup(subItem) ? (
                        <Collapsible className='group/subcollapsible' key={subItem.label}
                          open={isBranchOpen(subGroupKey(item.label, subItem.label))}
                          onOpenChange={open => setOpenItem(subGroupKey(item.label, subItem.label), open)}>
                          <SidebarMenuSubItem>
                            <CollapsibleTrigger nativeButton={false} render={
                              <SidebarMenuSubButton className='data-active:bg-primary/10! justify-between h-9 px-3 text-sm rounded-md'
                                isActive={subItem.childItems.some(leaf => isLinkActive(leaf.href, pathname))} />
                            }>
                              {subItem.label}
                              <ChevronRightIcon className='ml-auto shrink-0 transition-transform duration-200 group-data-open/subcollapsible:rotate-90 size-4' />
                            </CollapsibleTrigger>
                            <CollapsibleContent className='h-(--collapsible-panel-height) overflow-hidden transition-all duration-200 data-ending-style:h-0 data-starting-style:h-0'>
                              <SidebarMenuSub className='mx-0 ml-4 space-y-1'>
                                {subItem.childItems.map(leaf => (
                                  <SidebarMenuSubItem key={leaf.label}>
                                    <SidebarMenuSubButton className='data-active:bg-primary/10! justify-between h-8 px-3 text-sm rounded-md hover:bg-muted/50'
                                      render={<Link to={leaf.href} />}
                                      isActive={isLinkActive(leaf.href, pathname)}>
                                      <span className='min-w-0 flex-1 truncate'>{leaf.label}</span>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </SidebarMenuSubItem>
                        </Collapsible>
                      ) : (
                        <SidebarMenuSubItem key={subItem.label}>
                          <SidebarMenuSubButton className='data-active:bg-primary/10! justify-between h-9 px-3 text-sm rounded-md hover:bg-muted/50'
                            render={<Link to={subItem.href} />}
                            isActive={isLinkActive(subItem.href, pathname)}>
                            <span className='min-w-0 flex-1 truncate'>{subItem.label}</span>
                            {subItem.badge && (
                              <SidebarMenuBadge className={cn('bg-primary/10 max-w-24 truncate rounded-full px-2 py-1 font-normal text-xs', subItem.badgeClassName)}>
                                {subItem.badge}
                              </SidebarMenuBadge>
                            )}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    )}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton tooltip={item.label}
                render={<Link to={item.href!} />}
                isActive={isLinkActive(item.href!, pathname)}
                className={cn(
                  'data-active:bg-primary/10! h-10 text-base font-medium rounded-lg hover:bg-muted/50 transition-colors',
                  isIconMode ? 'px-0 justify-center w-10 mx-auto' : 'px-4'
                )}>
                {Tag && <Tag className='size-5' />}
                {!isIconMode && (
                  <span className={cn('min-w-0 flex-1 truncate', item.badge && 'pr-14')}>{item.label}</span>
                )}
                {item.badge && !isIconMode && (
                  <SidebarMenuBadge className={cn('bg-primary/10 max-w-24 truncate rounded-full px-2 py-1 font-normal text-xs', item.badgeClassName)}>
                    {item.badge}
                  </SidebarMenuBadge>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
)

// ─── AppSidebar principal ─────────────────────────────
export default function AppSidebar({ isAdmin, isSuperAdmin, plan }: {
  isAdmin: boolean; isSuperAdmin: boolean; plan: string
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const { state, isMobile } = useSidebar()
  const { user, profile } = useAuth()
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  const navGroups = useMemo(() => buildNavItems(isAdmin, isSuperAdmin, plan), [isAdmin, isSuperAdmin, plan])

  const activeBranchKeys = useMemo(
    () => getActiveBranchKeys(navGroups, location.pathname),
    [navGroups, location.pathname]
  )

  const isBranchOpen = useCallback(
    (key: string) => openItems[key] ?? activeBranchKeys.has(key),
    [openItems, activeBranchKeys]
  )

  const setOpenItem = useCallback((key: string, open: boolean) => {
    setOpenItems(prev => ({ ...prev, [key]: open }))
  }, [])

  const isIconMode = state === 'collapsed' && !isMobile
  
  const getUserDisplayName = () => {
    return profile?.full_name || user?.email?.split('@')[0] || 'Usuário'
  }
  
  const getUserInitials = () => {
    const name = getUserDisplayName()
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2)
  }
  
  const getPlanLabel = () => {
    const plans: Record<string, string> = {
      free: 'Gratuito',
      pro: 'Pro',
      enterprise: 'Enterprise'
    }
    return plans[plan] || 'Gratuito'
  }

  return (
    <Sidebar collapsible='icon' variant='sidebar' className='w-64 group-data-[collapsible=icon]:w-16'>
      {/* ── Logo com comportamento AdminCN ── */}
      <SidebarHeader className='group-data-[collapsible=icon]:p-2'>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              size='lg' 
              className='gap-3 bg-transparent! h-16 group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center'
              render={<Link to='/dashboard' />}
            >
              <div className='group-data-[collapsible=icon]:bg-primary group-data-[collapsible=icon]:text-primary-foreground group-data-[collapsible=icon]:rounded-lg group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center'>
                <img 
                  src={AgreeLogo} 
                  alt='Agree' 
                  className='size-9 shrink-0 group-data-[collapsible=icon]:size-6 group-data-[collapsible=icon]:brightness-0 group-data-[collapsible=icon]:invert' 
                />
              </div>
              <div className='flex flex-col items-start group-data-[collapsible=icon]:hidden'>
                <span className='text-xl font-semibold text-nowrap'>Agree</span>
                <span className='text-sm font-light text-nowrap text-muted-foreground'>Gestão de Contratos</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── Nav idêntico ao AdminCN ── */}
      <SidebarContent className='group-data-[collapsible=icon]:overflow-y-auto'>
        {navGroups.map((navItem, index) => (
          <SidebarGroupedMenuItems
            key={navItem.groupLabel || index}
            data={navItem.items}
            groupLabel={navItem.groupLabel}
            pathname={location.pathname}
            isIconMode={isIconMode}
            isBranchOpen={isBranchOpen}
            setOpenItem={setOpenItem}
          />
        ))}
      </SidebarContent>

      {/* ── Dados do Usuário (Minimalista) ── */}
      {!isIconMode && user && (
        <SidebarFooter className='p-4 border-t'>
          <div className='flex items-center gap-3'>
            <Avatar className='size-10'>
              <AvatarFallback className='bg-primary/10 text-primary text-sm font-semibold'>
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className='flex-1 min-w-0'>
              <p className='text-sm font-medium text-foreground truncate'>
                {getUserDisplayName()}
              </p>
              <p className='text-xs text-muted-foreground truncate'>
                {user.email}
              </p>
              <p className='text-xs text-muted-foreground'>
                Plano {getPlanLabel()}
              </p>
            </div>
            <Button 
              variant='ghost' 
              size='icon' 
              className='size-8 shrink-0'
              onClick={() => navigate('/profile')}
            >
              <Settings className='size-4' />
            </Button>
          </div>
        </SidebarFooter>
      )}

      {/* ── Avatar colapsado (estilo AdminCN) ── */}
      {isIconMode && user && (
        <SidebarFooter className='p-2'>
          <div className='flex justify-center'>
            <Button
              variant='ghost'
              size='icon'
              className='size-10 rounded-lg p-0'
              onClick={() => navigate('/profile')}
            >
              <Avatar className='size-8'>
                <AvatarFallback className='bg-muted text-foreground text-xs font-semibold'>
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  )
}
