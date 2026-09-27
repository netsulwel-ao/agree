import type { LucideIcon } from 'lucide-react'

export type NavLeaf = {
  label: string
  path: string
}

export type NavGroup = {
  label: string
  children: NavLeaf[]
}

export type NavItem = {
  id: string
  label: string
  icon: LucideIcon
  path?: string
  badge?: number
  children?: NavLeaf[]
}

export type NavSection = {
  groupLabel?: string
  items: NavItem[]
}
