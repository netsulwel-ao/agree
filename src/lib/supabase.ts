import { createClient } from '@supabase/supabase-js';
import { User as FirebaseUser } from 'firebase/auth';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials are missing. Please check your environment variables.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Sync Firebase user into Supabase profiles table
export const syncFirebaseUserWithSupabase = async (firebaseUser: FirebaseUser) => {
  try {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', firebaseUser.uid)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase.from('profiles').upsert({
        id: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
        email: firebaseUser.email,
        role: 'user',
      }, { onConflict: 'id' });
      if (error) console.error('Error creating profile:', error);
    }
  } catch (error) {
    console.error('Error syncing user:', error);
  }
};

export const createAuditLog = async (
  firebaseUser: FirebaseUser,
  action: string,
  resource: string,
  status: string = 'success'
) => {
  try {
    await supabase.from('audit_logs').insert({
      user_id: firebaseUser.uid,
      user_name: firebaseUser.displayName || firebaseUser.email,
      action,
      resource,
      status,
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
};
