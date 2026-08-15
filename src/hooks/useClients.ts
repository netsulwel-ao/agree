import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Client {
  id: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  category?: string;
  tags?: string[];
  notes?: string;
  custom_fields?: Record<string, any>;
}

const PAGE_SIZE = 20;

export function useClients(page = 1, search = '') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['clients', user?.id, page, search],
    queryFn: async () => {
      if (!user) return { data: [], count: 0 };

      let query = supabase
        .from('clients')
        .select('id,created_at,updated_at,name,email,phone,status,category,tags,notes,owner_id', { count: 'exact' })
        .eq('owner_id', user.id);

      if (search) {
        const like = `%${search}%`;
        query = query.or(`name.ilike.${like},email.ilike.${like},phone.ilike.${like}`);
      }

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error, count } = await query
        .order('name', { ascending: true })
        .range(from, to);

      if (error) throw new Error(error.message);
      return { data: (data || []) as Client[], count: count || 0 };
    },
    enabled: !!user,
    placeholderData: (prev: any) => prev,
  });
}

export function useClient(id?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      if (!user || !id) return null;
      const { data, error } = await supabase
        .from('clients')
        .select('id,created_at,updated_at,name,email,phone,status,category,tags,notes,custom_fields,owner_id')
        .eq('id', id)
        .eq('owner_id', user.id)
        .single();
      if (error) throw new Error(error.message);
      return data as Client;
    },
    enabled: !!user && !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (client: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'owner_id'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('clients')
        .insert({ ...client, owner_id: user.id })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...client }: Partial<Client> & { id: string }) => {
      const { data, error } = await supabase
        .from('clients')
        .update({ ...client, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}
