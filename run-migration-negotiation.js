import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const sql = readFileSync(resolve(__dirname, 'migration-negotiation.sql'), 'utf-8');

// Try supabase.sql() first (available since v2.46.0)
async function run() {
  // Method 1: supabase.sql() — might not exist in all builds
  try {
    if (typeof supabase.sql === 'function') {
      console.log('Trying supabase.sql()...');
      const { data, error } = await supabase.sql(sql);
      if (error) throw error;
      console.log('Migration executed successfully via supabase.sql()');
      console.log(JSON.stringify(data, null, 2));
      process.exit(0);
    }
  } catch (e) {
    console.log('supabase.sql() failed:', e.message);
  }

  // Method 2: pg-meta query endpoint (used by Supabase Dashboard SQL Editor)
  try {
    console.log('Trying pg-meta query...');
    const response = await fetch(`${supabaseUrl}/pg-meta/default/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ query: sql }),
    });
    const result = await response.json();
    if (!response.ok) {
      // Try /run-query instead
      throw new Error(JSON.stringify(result));
    }
    console.log('Migration executed successfully via pg-meta!');
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (e) {
    console.log('pg-meta/query failed:', e.message);
  }

  // Method 3: pg-meta run-query endpoint
  try {
    console.log('Trying pg-meta run-query...');
    const response = await fetch(`${supabaseUrl}/pg-meta/default/run-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ query: sql }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(result));
    console.log('Migration executed successfully via pg-meta/run-query!');
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (e) {
    console.log('pg-meta/run-query failed:', e.message);
  }

  console.error('All methods failed. Please run via Supabase SQL Editor.');
  process.exit(1);
}

run();
