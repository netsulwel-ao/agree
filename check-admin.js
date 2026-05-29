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

const { data, error } = await supabase
  .from('profiles')
  .select('id, email, name, role, is_blocked')
  .eq('email', 'ekctiandrog@gmail.com');

if (error) {
  console.error('Error:', error.message);
} else {
  console.log(JSON.stringify(data, null, 2));
}
