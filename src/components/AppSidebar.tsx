import { type ComponentType, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import * as Icon from 'lucide-react'
import { ChevronRightIcon } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub,
  DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuBadge,
  SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton,
  SidebarMenuSubItem, useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
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
        <DropdownMenuTrigger render={<SidebarMenuButton isActive={isChildActive} className='data-active:bg-primary/5!' />}>
          {Tag && <Tag />}
          <span className='min-w-0 flex-1 truncate'>{item.label}</span>
          <ChevronRightIcon className='ml-auto' />
        </DropdownMenuTrigger>
        <DropdownMenuContent side='right' align='start' sideOffset={12} className='w-auto min-w-52'>
          <DropdownMenuGroup>
            <DropdownMenuLabel className='text-foreground flex items-center gap-2 text-sm'>
              <span className='truncate'>{item.label}</span>
              {item.badge && (
                <span className={cn('bg-primary/10 rounded-full px-1.5 text-xs font-normal', item.badgeClassName)}>
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
    {groupLabel && (
      <SidebarGroupLabel className='text-sidebar-foreground/50 tracking-wider uppercase'>
        {groupLabel}
      </SidebarGroupLabel>
    )}
    <SidebarGroupContent>
      <SidebarMenu>
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
                  <SidebarMenuButton tooltip={item.label} isActive={isChildActive} className='data-active:bg-primary/5!' />
                }>
                  {Tag && <Tag />}
                  <span className={cn('min-w-0 flex-1 truncate', item.badge && 'pr-14')}>{item.label}</span>
                  {item.badge && (
                    <SidebarMenuBadge className={cn('bg-primary/10 max-w-24 truncate rounded-full px-1.5 font-normal', item.badgeClassName)}>
                      {item.badge}
                    </SidebarMenuBadge>
                  )}
                  <ChevronRightIcon className='ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90' />
                </CollapsibleTrigger>
                <CollapsibleContent className='h-(--collapsible-panel-height) overflow-hidden transition-all duration-200 data-ending-style:h-0 data-starting-style:h-0'>
                  <SidebarMenuSub>
                    {item.childItems.map(subItem =>
                      isSubGroup(subItem) ? (
                        <Collapsible className='group/subcollapsible' key={subItem.label}
                          open={isBranchOpen(subGroupKey(item.label, subItem.label))}
                          onOpenChange={open => setOpenItem(subGroupKey(item.label, subItem.label), open)}>
                          <SidebarMenuSubItem>
                            <CollapsibleTrigger nativeButton={false} render={
                              <SidebarMenuSubButton className='data-active:bg-primary/10! justify-between'
                                isActive={subItem.childItems.some(leaf => isLinkActive(leaf.href, pathname))} />
                            }>
                              {subItem.label}
                              <ChevronRightIcon className='ml-auto shrink-0 transition-transform duration-200 group-data-open/subcollapsible:rotate-90' />
                            </CollapsibleTrigger>
                            <CollapsibleContent className='h-(--collapsible-panel-height) overflow-hidden transition-all duration-200 data-ending-style:h-0 data-starting-style:h-0'>
                              <SidebarMenuSub className='mx-0'>
                                {subItem.childItems.map(leaf => (
                                  <SidebarMenuSubItem key={leaf.label}>
                                    <SidebarMenuSubButton className='data-active:bg-primary/10! justify-between'
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
                          <SidebarMenuSubButton className='data-active:bg-primary/10! justify-between'
                            render={<Link to={subItem.href} />}
                            isActive={isLinkActive(subItem.href, pathname)}>
                            <span className='min-w-0 flex-1 truncate'>{subItem.label}</span>
                            {subItem.badge && (
                              <SidebarMenuBadge className={cn('bg-primary/10 max-w-24 truncate rounded-full px-1.5 font-normal', subItem.badgeClassName)}>
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
                className='data-active:bg-primary/10!'>
                {Tag && <Tag />}
                <span className={cn('min-w-0 flex-1 truncate', item.badge && 'pr-14')}>{item.label}</span>
                {item.badge && (
                  <SidebarMenuBadge className={cn('bg-primary/10 max-w-24 truncate rounded-full px-1.5 font-normal', item.badgeClassName)}>
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
  const { state, isMobile } = useSidebar()
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

  return (
    <Sidebar collapsible='icon' variant='sidebar'>
      {/* ── Logo idêntico ao AdminCN ── */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size='lg' className='gap-2.5 bg-transparent! [&>svg]:size-8'
              render={<Link to='/dashboard' />}>
              <img src={AgreeLogo} alt='Agree' className='size-8 shrink-0' />
              <div className='flex flex-col items-start'>
                <span className='text-lg font-semibold text-nowrap'>Agree</span>
                <span className='text-xs font-light text-nowrap text-muted-foreground'>Gestão de Contratos</span>
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
    </Sidebar>
  )
}
