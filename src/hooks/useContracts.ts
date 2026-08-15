import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Contract {
  id: string;
  created_at: string;
  title: string;
  description?: string;
  content: string;
  owner_id: string;
  end_date?: string;
  start_date?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  risk_level: 'low' | 'medium' | 'high';
  value?: number;
  version: number;
  collaborators?: any[];
  tags?: string[];
  client_id?: string;
  currency?: string;
  auto_renew?: boolean;
  renewal_period?: 'monthly' | 'quarterly' | 'semi_annually' | 'annually';
  renewal_count?: number;
  renewed_from?: string;
  notification_days?: number;
}

const PAGE_SIZE = 20;

export function useContracts(page = 1, search = '') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['contracts', user?.id, page, search],
    queryFn: async () => {
      if (!user) return { data: [], count: 0 };

      const contractFields = 'id,created_at,title,description,status,risk_level,value,currency,start_date,end_date,owner_id,client_id,version,auto_renew,renewal_count,notification_days,tags';
      const filter = JSON.stringify([{ user_id: user.id }]);

      let query = supabase
        .from('contracts')
        .select(contractFields, { count: 'exact' })
        .or(`owner_id.eq.${user.id},collaborators.cs.${filter}`);

      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw new Error(error.message);

      return { data: (data || []) as Contract[], count: count || 0 };
    },
    enabled: !!user,
    placeholderData: (prev: any) => prev,
  });
}

export function useContract(id?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['contract', id],
    queryFn: async () => {
      if (!user || !id) return null;
      const { data, error } = await supabase
        .from('contracts')
        .select('*, client:clients(name)')
        .eq('id', id)
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user && !!id,
  });
}
