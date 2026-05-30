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

async function fix() {
  const { data: authData } = await supabase.auth.admin.listUsers();
  const authUsers = authData?.users || [];

  const { data: profiles } = await supabase.from('profiles').select('id');
  const existingIds = new Set(profiles?.map(p => p.id) || []);

  const missing = authUsers.filter(u => !existingIds.has(u.id));

  for (const user of missing) {
    const name = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || '';
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, email: user.email, name, role: 'user' }, { onConflict: 'id' });
    if (error) {
      console.error(`Error creating profile for ${user.email}:`, error.message);
    } else {
      console.log(`Profile created for ${user.email} (${user.id})`);
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', 'a608f690-8dc6-439f-bb36-b43986073728');

  if (error) {
    console.error('Error setting admin:', error.message);
  } else {
    console.log('Google user is now admin!');
  }
}

fix();
