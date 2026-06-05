import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  // Em dev lança aviso; em produção vai falhar naturalmente nas primeiras chamadas
  console.error(
    '[Agree] Credenciais Supabase em falta. ' +
    'Define VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no ficheiro .env'
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      // localStorage mantém sessão entre abas e após fechar/reabrir o browser
      storage: localStorage,
      persistSession: true,
      detectSessionInUrl: true,
      // Renovação automática do token antes de expirar
      autoRefreshToken: true,
    },
  }
);
