import { supabase } from '../lib/supabase';

export interface Reminder {
  id: string;
  user_id: string;
  contract_id: string;
  title: string;
  message?: string;
  remind_at: string;
  type: 'expiry' | 'renewal' | 'signature' | 'approval' | 'custom';
  status: 'pending' | 'sent' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface RenewalHistory {
  id: string;
  contract_id: string;
  renewed_at: string;
  previous_end_date: string;
  new_end_date: string;
  previous_value?: number;
  new_value?: number;
  notes?: string;
  created_by: string;
}

export async function getReminders(contractId?: string): Promise<Reminder[]> {
  let query = supabase
    .from('reminders')
    .select('*')
    .order('remind_at', { ascending: true });

  if (contractId) {
    query = query.eq('contract_id', contractId);
  }

  query = query.eq('status', 'pending');

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createReminder(reminder: Omit<Reminder, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'status'> & { user_id: string }): Promise<Reminder> {
  const { data, error } = await supabase
    .from('reminders')
    .insert({ ...reminder, status: 'pending' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function cancelReminder(id: string): Promise<void> {
  const { error } = await supabase
    .from('reminders')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function getRenewalHistory(contractId: string): Promise<RenewalHistory[]> {
  const { data, error } = await supabase
    .from('renewal_history')
    .select('*')
    .eq('contract_id', contractId)
    .order('renewed_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function renewContract(
  contractId: string,
  newEndDate: string,
  newValue?: number,
  notes?: string
): Promise<{ success: boolean; renewal_count?: number; error?: string }> {
  const { data, error } = await supabase
    .rpc('renew_contract', {
      p_contract_id: contractId,
      p_new_end_date: newEndDate,
      p_new_value: newValue || null,
      p_notes: notes || null
    });

  if (error) throw error;
  return data as any;
}

export async function checkAndInsertExpiryNotifications(): Promise<void> {
  await supabase.rpc('insert_expiry_notifications');
}
