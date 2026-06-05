// AI proxy — Supabase Edge Function
// Mantém a Groq API key no servidor, nunca exposta ao cliente.
// Deploy: supabase functions deploy ai

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'authorization,content-type',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

// Verifica que o pedido vem de um utilizador autenticado via Supabase JWT
async function getAuthenticatedUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function callGroq(messages: unknown[], maxTokens = 2048, temperature = 0.3): Promise<string> {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY não configurada no servidor');

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({ model: MODEL, messages, temperature, max_tokens: maxTokens }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  // Valida autenticação — só utilizadores logados podem usar a IA
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return json({ error: 'Unauthorized' }, 401);
  }

  let body: { action: string; payload: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { action, payload } = body;

  try {
    switch (action) {
      case 'analyzeRisks': {
        const content = String(payload.content || '');
        if (!content) return json({ error: 'content é obrigatório' }, 400);

        const text = await callGroq([
          {
            role: 'system',
            content: `És um advogado especialista em direito angolano e internacional.
A tua função é analisar contratos de forma completa.
Responde SEMPRE em JSON válido, sem markdown, sem blocos de código.`,
          },
          {
            role: 'user',
            content: `Analisa o seguinte contrato. Retorna APENAS um JSON:
{
  "summary": "breve resumo",
  "risks": [{"severity":"low"|"medium"|"high","type":"legal"|"financial"|"operational"|"regulatory"|"contractual","description":"..."}],
  "opportunities": [{"type":"positive"|"neutral","description":"..."}],
  "valueAnalysis": "...",
  "applicableLaw": "..."
}
Contrato:\n${content}`,
          },
        ], 2048, 0.3);

        const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return json({ data: JSON.parse(clean) });
      }

      case 'intelligentSearch': {
        const query = String(payload.query || '');
        const contracts = payload.contracts as { id: string; title: string; description: string }[];
        if (!query || !contracts?.length) return json({ data: [] });

        const text = await callGroq([
          {
            role: 'system',
            content: 'És um assistente de pesquisa. Identifica contratos relevantes. Responde SEMPRE em JSON válido, sem markdown.',
          },
          {
            role: 'user',
            content: `Retorna APENAS um array JSON com os IDs em ordem de relevância: ["id1","id2",...]
Consulta: "${query}"
Contratos: ${JSON.stringify(contracts)}`,
          },
        ], 512, 0.2);

        const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return json({ data: JSON.parse(clean) });
      }

      case 'extractContract': {
        const text = String(payload.text || '');
        if (!text) return json({ data: null });

        const result = await callGroq([
          {
            role: 'system',
            content: 'És um assistente jurídico angolano. Extrai dados estruturados de contratos. Responde SEMPRE em JSON válido, sem markdown.',
          },
          {
            role: 'user',
            content: `Extrai os dados e retorna APENAS um JSON:
{
  "title": "...",
  "description": "... (máx 100 palavras)",
  "startDate": "YYYY-MM-DD ou vazio",
  "endDate": "YYYY-MM-DD ou vazio",
  "value": "número sem símbolos ou vazio"
}
Texto:\n${text.slice(0, 15000)}`,
          },
        ], 512, 0.2);

        const clean = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return json({ data: JSON.parse(clean) });
      }

      case 'generateSuggestions': {
        const description = String(payload.description || '');
        if (!description) return json({ data: '' });

        const text = await callGroq([
          {
            role: 'system',
            content: 'És um advogado especialista em direito contratual angolano. Rediges contratos profissionais em português.',
          },
          {
            role: 'user',
            content: `Gera um rascunho de contrato profissional com base nesta descrição. Inclui: partes, objecto, obrigações, prazo, valor, pagamento e rescisão.\n\nDescrição: ${description}`,
          },
        ], 2048, 0.5);

        return json({ data: text });
      }

      case 'generateFullContract': {
        const { systemPrompt, userPrompt } = payload as { systemPrompt: string; userPrompt: string };
        if (!systemPrompt || !userPrompt) return json({ error: 'systemPrompt e userPrompt são obrigatórios' }, 400);

        const text = await callGroq([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ], 4096, 0.4);

        const clean = text.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
        return json({ data: clean });
      }

      default:
        return json({ error: `Acção desconhecida: ${action}` }, 400);
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal error';
    console.error(`[AI Edge Function] action=${action} error:`, message);
    return json({ error: message }, 500);
  }
});
