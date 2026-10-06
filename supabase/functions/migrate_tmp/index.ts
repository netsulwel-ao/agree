import { serve } from 'https://deno.land/std@0.177.1/http/server.ts';

// Edge Function descartavel: cria exec_sql via Management API e aplica a
// migracao. O SDK so chega a DML; DDL exige a Management API, que precisa de
// um token pessoal. O allow_list do pooler nao afeta esta via.

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok');
  if (req.method !== 'POST') return new Response('so POST', { status: 405 });

  const { sql, token, project_ref } = await req.json();

  if (!token || !project_ref) {
    return new Response(JSON.stringify({ error: 'falta token ou project_ref' }), { status: 400 });
  }

  const res = await fetch(`https://api.supabase.com/v1/projects/${project_ref}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  const body = await res.text();
  return new Response(body, { status: res.status });
});
