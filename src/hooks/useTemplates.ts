import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { BUILT_IN_TEMPLATES } from '../data/builtInTemplates'

export interface TemplateField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'date' | 'currency'
  required: boolean
}

export interface Template {
  id: string
  created_at?: string
  updated_at?: string
  name: string
  description?: string
  category: string
  content: string
  fields: TemplateField[]
  variables?: TemplateField[]
  is_system: boolean
  user_id?: string
  usage_count?: number
  plan?: 'free' | 'pro' | 'enterprise'
}

const withDefaults = (t: {
  id: string
  name: string
  description?: string
  category: string
  content?: string
  variables?: TemplateField[]
  is_system?: boolean
  user_id?: string
  usage_count?: number
  created_at?: string
}): Template => ({
  ...t,
  description: t.description || '',
  content: t.content || '',
  fields: t.variables || [],
  variables: t.variables || [],
  is_system: t.is_system ?? false,
  usage_count: t.usage_count ?? 0,
})

const builtIns = (): Template[] =>
  BUILT_IN_TEMPLATES.map(t =>
    withDefaults({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      content: t.content,
      variables: t.fields.map(f => ({ ...f, type: f.type as TemplateField['type'] })),
      is_system: true,
      usage_count: 0,
      created_at: new Date().toISOString(),
    })
  )

/** Todos os modelos: built-in + guardados na BD. */
export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: async (): Promise<Template[]> => {
      const base = builtIns()
      try {
        const { data, error } = await supabase
          .from('contract_templates')
          .select('id,name,description,category,content,variables,is_system,user_id,usage_count,created_at')
          .order('category', { ascending: true })
          .order('name', { ascending: true })
        if (error) {
          console.error('[useTemplates] erro ao carregar modelos:', error.message)
          return base
        }
        return [...base, ...(data || []).map(withDefaults)]
      } catch (err) {
        console.error('[useTemplates] exceção ao carregar modelos:', err)
        return base
      }
    },
  })
}

/** Modelos do utilizador autenticado + built-ins. */
export function useUserTemplates() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['user-templates', user?.id],
    queryFn: async (): Promise<Template[]> => {
      if (!user) return builtIns()
      const { data, error } = await supabase
        .from('contract_templates')
        .select('id,name,description,category,content,variables,is_system,user_id,usage_count,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      return [...builtIns(), ...(data || []).map(withDefaults)]
    },
    enabled: !!user,
  })
}

export interface TemplateInput {
  name: string
  description?: string
  category: string
  content: string
  variables?: TemplateField[]
}

export function useCreateTemplate() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (template: TemplateInput) => {
      if (!user) throw new Error('Sessão expirada')
      const { data, error } = await supabase
        .from('contract_templates')
        .insert({
          name: template.name,
          description: template.description || '',
          category: template.category,
          content: template.content,
          variables: template.variables || [],
          user_id: user.id,
          is_system: false,
        })
        .select()
        .single()
      if (error) throw new Error(error.message)
      return withDefaults(data as any)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      queryClient.invalidateQueries({ queryKey: ['user-templates'] })
    },
  })
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Template> & { id: string }) => {
      const { data, error } = await supabase
        .from('contract_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return withDefaults(data as any)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      queryClient.invalidateQueries({ queryKey: ['user-templates'] })
    },
  })
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contract_templates').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      queryClient.invalidateQueries({ queryKey: ['user-templates'] })
    },
  })
}

export function useIncrementTemplateUsage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('increment_template_usage', { template_id: id })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      queryClient.invalidateQueries({ queryKey: ['user-templates'] })
    },
  })
}
