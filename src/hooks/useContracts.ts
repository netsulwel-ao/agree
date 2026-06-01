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

export function useContracts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['contracts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Contratos onde sou owner
      const { data: owned, error: err1 } = await supabase
        .from('contracts')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      // Contratos onde sou owner ou colaborador (numa query só)
      const filter = JSON.stringify([{ user_id: user.id }]);
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .or(`owner_id.eq.${user.id},collaborators.cs.${filter}`)
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
