import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function check() {
  // 1. List all profiles
  const { data: profiles } = await supabase.from('profiles').select('*');
  console.log('=== PROFILES ===');
  console.log(JSON.stringify(profiles, null, 2));

  // 2. List auth users to find Google ones
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Auth error:', authError.message);
  } else {
    const googleUsers = authData.users.filter(u => u.app_metadata?.provider === 'google');
    console.log('\n=== AUTH USERS (GOOGLE) ===');
    console.log(JSON.stringify(googleUsers.map(u => ({ id: u.id, email: u.email, created_at: u.created_at, provider: u.app_metadata?.provider })), null, 2));
    
    // Check if any profile is missing
    const profileIds = new Set(profiles?.map(p => p.id) || []);
    const missing = authData.users.filter(u => !profileIds.has(u.id) && u.email === 'ekctiandrog@gmail.com');
    console.log('\n=== AUTH USERS NOT IN PROFILES (ekctiandrog) ===');
    console.log(JSON.stringify(missing.map(u => ({ id: u.id, email: u.email })), null, 2));
  }
}

check();
