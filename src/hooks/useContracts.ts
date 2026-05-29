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

      // Contratos onde sou colaborador
      const { data: collab, error: err2 } = await supabase
        .from('contracts')
        .select('*')
        .contains('collaborators', [{ user_id: user.id }])
        .order('created_at', { ascending: false });

      if (err1 || err2) {
        console.error("Error fetching contracts:", err1 || err2);
        throw new Error((err1 || err2)!.message);
      }

      const all = [...(owned || [])];
      // Add collaborator contracts not already owned
      for (const c of (collab || [])) {
        if (!all.find(x => x.id === c.id)) all.push(c);
      }
      all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return all as Contract[];
    },
    enabled: !!user,
  });
}
