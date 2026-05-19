import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials are missing. Please check your environment variables.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Helper for audit logging in Supabase
export const createAuditLog = async (action: string, resource: string, status: string = 'success') => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      user_name: user.user_metadata?.full_name || user.email,
      action,
      resource,
      status
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
};
