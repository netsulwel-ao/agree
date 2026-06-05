import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BUILT_IN_TEMPLATES } from '../data/builtInTemplates';

export interface TemplateField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'currency';
  required: boolean;
}

export interface Template {
  id: string;
  created_at?: string;
  name: string;
  description: string;
  category: string;
  content: string;
  fields: TemplateField[];
  variables?: TemplateField[];
  is_system: boolean;
  user_id?: string;
  usage_count?: number;
}

export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      // 1. Built-in templates (always available, no DB required)
      const builtIns: Template[] = BUILT_IN_TEMPLATES.map(t => ({
        ...t,
        created_at: new Date().toISOString(),
        fields: t.fields.map(f => ({ ...f, type: f.type as TemplateField['type'] })),
        variables: [],
        usage_count: 0,
      }));

      // 2. User-created templates from Supabase (if available)
      try {
        const { data, error } = await supabase
          .from('contract_templates')
          .select('*')
          .order('category', { ascending: true })
          .order('name', { ascending: true });
        if (!error && data) {
          return [...builtIns, ...(data as Template[]).filter(t => t.user_id)];
        }
      } catch {
        // Supabase unavailable — return built-ins only
      }

      return builtIns;
    },
  });
}

export function useUserTemplates() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-templates', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []) as Template[];
    },
    enabled: !!user,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (template: {
      name: string;
      description?: string;
      category: string;
      content: string;
      variables?: TemplateField[];
    }) => {
      if (!user) throw new Error('Not authenticated');
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
        .single();
      if (error) throw new Error(error.message);
      return data as Template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['user-templates'] });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Template> & { id: string }) => {
      const { data, error } = await supabase
        .from('contract_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['user-templates'] });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contract_templates').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['user-templates'] });
    },
  });
}

export function useIncrementTemplateUsage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('increment_template_usage', { template_id: id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}
