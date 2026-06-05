/**
 * Serviço de IA — todas as chamadas passam pela Edge Function `/functions/v1/ai`
 * A Groq API key nunca é exposta no bundle do cliente.
 */

const AI_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai`;

// Importa o cliente supabase apenas para obter o token de acesso corrente
import { supabase } from '../lib/supabase';

async function callAI<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const res = await fetch(AI_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ action, payload }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `AI request failed with status ${res.status}`);
  }

  const json = await res.json();
  return json.data as T;
}

// ─── Tipos ────────────────────────────────────────────

export interface RiskItem {
  severity: 'low' | 'medium' | 'high';
  type: 'legal' | 'financial' | 'operational' | 'regulatory' | 'contractual';
  description: string;
}

export interface OpportunityItem {
  type: 'positive' | 'neutral';
  description: string;
}

export interface ContractAnalysis {
  summary: string;
  risks: RiskItem[];
  opportunities: OpportunityItem[];
  valueAnalysis: string;
  applicableLaw: string;
}

// ─── Funções públicas ─────────────────────────────────

export async function analyzeContractRisks(content: string): Promise<ContractAnalysis> {
  const empty: ContractAnalysis = { summary: '', risks: [], opportunities: [], valueAnalysis: '', applicableLaw: '' };
  if (!content) return empty;

  try {
    return await callAI<ContractAnalysis>('analyzeRisks', { content });
  } catch (e) {
    console.error('Error analyzing contract risks:', e);
    return empty;
  }
}

export async function intelligentSearch<T extends { id: string; title: string; description?: string }>(query: string, contracts: T[]): Promise<T[]> {
  if (!query || contracts.length === 0) return contracts;

  try {
    const relevantIds = await callAI<string[]>('intelligentSearch', {
      query,
      contracts: contracts.map(c => ({ id: c.id, title: c.title, description: c.description || '' })),
    });
    return contracts.filter(c => relevantIds.includes(c.id));
  } catch (e) {
    console.error('Error in intelligent search:', e);
    return contracts;
  }
}

export async function extractContractFromText(text: string): Promise<{
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  value: string;
} | null> {
  if (!text) return null;

  try {
    return await callAI('extractContract', { text });
  } catch (e) {
    console.error('Error extracting contract data:', e);
    return null;
  }
}

export async function generateContractSuggestions(description: string): Promise<string> {
  if (!description) return '';

  try {
    return await callAI<string>('generateSuggestions', { description });
  } catch (e) {
    console.error('Error generating contract suggestions:', e);
    return '';
  }
}

// ─── Tipos para geração de contrato completo ─────────

export interface ContractAnswers {
  tipo: string;
  pais: string;
  parte_a_nome: string;
  parte_a_nif: string;
  parte_a_morada: string;
  parte_b_nome: string;
  parte_b_nif: string;
  parte_b_morada: string;
  valor: string;
  valor_extenso: string;
  prazo: string;
  objecto: string;
  obrigacoes_a: string;
  obrigacoes_b: string;
  penalidade: string;
  foro: string;
  data_celebracao: string;
  local_celebracao: string;
  detalhes_adicionais: string;
  extraFields: Record<string, string>;
}

export async function generateFullContract(answers: ContractAnswers): Promise<string> {
  const pais = answers.pais || 'Angola';
  const isInternacional = pais.toLowerCase() === 'internacional' || pais.toLowerCase() === 'outro';

  const leisPorPais: Record<string, string> = {
    'angola': 'Código Civil Angolano, Lei dos Contratos (Lei n.º 7/15 de 15 de Junho), Código Comercial Angolano, demais legislação da República de Angola',
    'brasil': 'Código Civil Brasileiro (Lei n.º 10.406/2002), Código de Defesa do Consumidor, Lei de Licitações (Lei n.º 14.133/2021), demais legislação da República Federativa do Brasil',
    'portugal': 'Código Civil Português, Código Comercial Português, demais legislação da República Portuguesa',
    'moçambique': 'Código Civil Moçambicano, Lei dos Contratos de Moçambique, demais legislação da República de Moçambique',
    'cabo verde': 'Código Civil de Cabo Verde, Código Comercial, demais legislação da República de Cabo Verde',
    'são tomé': 'Código Civil de São Tomé e Príncipe, demais legislação da República Democrática de São Tomé e Príncipe',
    'guiné-bissau': 'Código Civil da Guiné-Bissau, demais legislação da República da Guiné-Bissau',
    'timor-leste': 'Código Civil de Timor-Leste, demais legislação da República Democrática de Timor-Leste',
  };

  const encontrarLeis = (p: string): string => {
    for (const [key, leis] of Object.entries(leisPorPais)) {
      if (p.toLowerCase().includes(key)) return leis;
    }
    return '';
  };

  const leisPais = encontrarLeis(pais);
  const legislacaoRef = leisPais || (isInternacional
    ? 'leis do país escolhido, tratados internacionais aplicáveis, convenções internacionais (Convenção de Viena sobre Compra e Venda Internacional de Mercadorias, Princípios UNIDROIT, etc.)'
    : 'legislação aplicável do país em questão');

  const tipo = answers.tipo.toLowerCase();

  const headerColor = ((): string => {
    if (tipo.includes('venda') || tipo.includes('compra') || tipo.includes('comercial')) return '#0d2137';
    if (tipo.includes('confidencialidade') || tipo.includes('nda') || tipo.includes('sigilo')) return '#2d1b4e';
    if (tipo.includes('arrendamento') || tipo.includes('imobiliário') || tipo.includes('imobiliario') || tipo.includes('aluguer') || tipo.includes('locação') || tipo.includes('locacao')) return '#1a3a2a';
    if (tipo.includes('trabalho') || tipo.includes('emprego') || tipo.includes('recursos humanos') || tipo.includes('colaborador')) return '#fff';
    if (tipo.includes('serviço') || tipo.includes('servico') || tipo.includes('consultoria')) return '#f5f1eb';
    return '#0d2137';
  })();

  const isWhiteHeader = headerColor === '#fff' || headerColor === '#f5f1eb';
  const headerTextColor = isWhiteHeader ? '#1a1a1a' : '#fff';

  const accentColor = ((): string => {
    if (tipo.includes('venda') || tipo.includes('compra') || tipo.includes('comercial')) return '#185FA5';
    if (tipo.includes('confidencialidade') || tipo.includes('nda') || tipo.includes('sigilo')) return '#c8b8f0';
    if (tipo.includes('arrendamento') || tipo.includes('imobiliário') || tipo.includes('imobiliario')) return '#1a3a2a';
    if (tipo.includes('trabalho') || tipo.includes('emprego') || tipo.includes('recursos humanos')) return '#b5341a';
    if (tipo.includes('serviço') || tipo.includes('servico') || tipo.includes('consultoria')) return '#1a1a1a';
    return '#185FA5';
  })();

  const systemPrompt = `És um advogado sénior especialista em direito contratual internacional, com mais de 20 anos de experiência.
A tua função é redigir contratos de alto nível, completos e juridicamente sólidos.

PAÍS / LEGISLAÇÃO APLICÁVEL: ${pais}
Referências legais a usar: ${legislacaoRef}

REGRAS:
1. Gera APENAS HTML válido, sem markdown, sem blocos de código
2. Usa CSS inline para formatação
3. O HTML deve ser completo e autónomo (apenas o conteúdo, sem tags html/head/body extra)
4. REFERENCIA a legislação do país escolhido em cada cláusula relevante
5. Usa linguagem formal e técnica
6. Se for contrato internacional, inclui cláusula de arbitragem internacional (CCI)
7. Máximo de detalhe e qualidade
8. O idioma do contrato deve ser português
9. Conteúdo centralizado com max-width:800px e margin:0 auto

DESIGN: header com fundo ${headerColor} (texto ${headerTextColor}), acento ${accentColor}.

ESTRUTURA OBRIGATÓRIA:
- Cabeçalho com tipo e país
- Cláusula 1ª — Objecto
- Cláusula 2ª — Obrigações Parte A
- Cláusula 3ª — Obrigações Parte B
- Cláusula 4ª — Valor e Pagamento
- Cláusula 5ª — Prazo e Vigência
- Cláusula 6ª — Penalidades
- Cláusula 7ª — Garantias
- Cláusula 8ª — Confidencialidade
- Cláusula 9ª — Rescisão
- Cláusula 10ª — Foro e Lei Aplicável (${pais})
- Assinaturas em grid 2 colunas
- Footer #fafafa com logótipo Agree`;

  const userPrompt = `Gera um contrato completo em HTML com estes dados:

País: ${pais} | Tipo: ${answers.tipo}
Parte A: ${answers.parte_a_nome}, NIF: ${answers.parte_a_nif}, Morada: ${answers.parte_a_morada}
Parte B: ${answers.parte_b_nome}, NIF: ${answers.parte_b_nif}, Morada: ${answers.parte_b_morada}
Valor: ${answers.valor} (${answers.valor_extenso})
Prazo: ${answers.prazo}
Objecto: ${answers.objecto}
Obrigações A: ${answers.obrigacoes_a}
Obrigações B: ${answers.obrigacoes_b}
Penalidade: ${answers.penalidade}
Foro: ${answers.foro}
Data: ${answers.data_celebracao} | Local: ${answers.local_celebracao}
Detalhes: ${answers.detalhes_adicionais}
${Object.entries(answers.extraFields || {}).filter(([, v]) => v).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join('\n')}

Retorna APENAS o HTML com CSS inline, pronto para inserir numa página web.`;

  try {
    return await callAI<string>('generateFullContract', { systemPrompt, userPrompt });
  } catch (e) {
    console.error('Error generating full contract:', e);
    return '';
  }
}
