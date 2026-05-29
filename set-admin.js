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

async function setAdmin() {
  const { error } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', 'EGaVh884uVNFOQLAfGZzewi5pnC3');

  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

  console.log('ektiandrog@gmail.com is now admin!');
}

setAdmin();
