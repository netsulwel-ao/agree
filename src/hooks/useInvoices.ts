import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Invoice {
  id: string;
  created_at: string;
  updated_at: string;
  number: string;
  contract_id: string | null;
  client_id: string | null;
  owner_id: string;
  title: string;
  description: string | null;
  value: number;
  tax_rate: number;
  tax_value: number;
  total_value: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issued_date: string | null;
  due_date: string | null;
  paid_date: string | null;
  notes: string | null;
  line_items: LineItem[];
  currency: string;
  payment_terms: string | null;
  paid_via: string | null;
  notification_sent: boolean;
  contract?: { title: string } | null;
  client?: { name: string; email?: string } | null;
}

export function useInvoices(statusFilter?: string) {
  return useQuery({
    queryKey: ['invoices', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('invoices')
        .select(`
          id,
          created_at,
          number,
          title,
          value,
          total_value,
          status,
          issued_date,
          due_date,
          currency,
          contract:contracts(title),
          client:clients(name, email)
        `)
        .order('created_at', { ascending: false });
      if (statusFilter) query = query.eq('status', statusFilter);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data || []) as Invoice[];
    },
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('invoices')
        .select('*, contract:contracts(title), client:clients(name, email)')
        .eq('id', id)
        .single();
      if (error) throw new Error(error.message);
      return data as Invoice;
    },
    enabled: !!id,
  });
}

export function useInvoicesByContract(contractId: string | undefined) {
  return useQuery({
    queryKey: ['invoices', 'contract', contractId],
    queryFn: async () => {
      if (!contractId) return [];
      const { data, error } = await supabase
        .from('invoices')
        .select('id,created_at,number,title,value,total_value,status,currency,due_date,paid_date,contract_id,client_id')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []) as Invoice[];
    },
    enabled: !!contractId,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      contract_id?: string | null;
      client_id?: string | null;
      title: string;
      description?: string;
      value: number;
      tax_rate?: number;
      currency?: string;
      due_date?: string;
      notes?: string;
      line_items?: LineItem[];
      payment_terms?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Generate invoice number
      const { data: numData, error: numError } = await supabase.rpc('generate_invoice_number');
      if (numError) throw numError;
      const number = numData as string;

      const tax_rate = data.tax_rate || 0;
      const value = data.value;
      const tax_value = value * (tax_rate / 100);

      const { data: invoice, error } = await supabase
        .from('invoices')
        .insert({
          number,
          contract_id: data.contract_id || null,
          client_id: data.client_id || null,
          owner_id: user.id,
          title: data.title,
          description: data.description || '',
          value,
          tax_rate,
          tax_value,
          total_value: value + tax_value,
          status: 'draft',
          issued_date: new Date().toISOString().split('T')[0],
          due_date: data.due_date || null,
          notes: data.notes || null,
          line_items: data.line_items || [],
          currency: data.currency || 'AOA',
          payment_terms: data.payment_terms || null,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return invoice as Invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      title?: string;
      description?: string;
      value?: number;
      tax_rate?: number;
      currency?: string;
      status?: string;
      due_date?: string;
      issued_date?: string;
      paid_date?: string | null;
      notes?: string;
      line_items?: LineItem[];
      payment_terms?: string;
      paid_via?: string;
      notification_sent?: boolean;
    }) => {
      const updateData: any = { ...updates };
      if (updates.value !== undefined || updates.tax_rate !== undefined) {
        const invoice = await supabase.from('invoices').select('value, tax_rate').eq('id', id).single();
        const value = updates.value ?? invoice.data?.value ?? 0;
        const tax_rate = updates.tax_rate ?? invoice.data?.tax_rate ?? 0;
        updateData.tax_value = value * (tax_rate / 100);
        updateData.total_value = value + updateData.tax_value;
      }
      const { data, error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice'] });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useInvoiceClients() {
  return useQuery({
    queryKey: ['invoice-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email')
        .order('name');
      if (error) throw new Error(error.message);
      return data || [];
    },
  });
}

export function useInvoiceContracts() {
  return useQuery({
    queryKey: ['invoice-contracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('id, title, value, client_id')
        .order('title');
      if (error) throw new Error(error.message);
      return data || [];
    },
  });
}
