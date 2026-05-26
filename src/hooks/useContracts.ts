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
}

export function useContracts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['contracts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching contracts:", error);
        throw new Error(error.message);
      }
      
      return (data || []) as Contract[];
    },
    enabled: !!user,
  });
}
