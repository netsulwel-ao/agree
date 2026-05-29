import Groq from "groq-sdk";

const apiKey = import.meta.env.VITE_GROQ_API_KEY || "";

const groq = new Groq({
  apiKey,
  dangerouslyAllowBrowser: true
});

const MODEL = "llama-3.3-70b-versatile";

export async function analyzeContractRisks(content: string) {
  if (!content) return { summary: '', risks: [], opportunities: [], valueAnalysis: '', applicableLaw: '' };
  if (!apiKey) {
    console.warn("Groq API key not set");
    return { summary: '', risks: [], opportunities: [], valueAnalysis: '', applicableLaw: '' };
  }

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `És um advogado especialista em direito angolano e internacional. 
A tua função é analisar contratos de forma completa.
Responde SEMPRE em JSON válido, sem markdown, sem blocos de código.`
        },
        {
          role: "user",
          content: `Analisa o seguinte contrato de forma completa.

Retorna APENAS um JSON com este formato exato:
{
  "summary": "breve resumo do contrato e análise geral",
  "risks": [
    {
      "severity": "low"|"medium"|"high",
      "type": "legal"|"financial"|"operational"|"regulatory"|"contractual",
      "description": "descrição detalhada do risco em português"
    }
  ],
  "opportunities": [
    {
      "type": "positive"|"neutral",
      "description": "descrição da oportunidade ou benefício em português"
    }
  ],
  "valueAnalysis": "análise se o valor do contrato é justo e se compensa o investimento",
  "applicableLaw": "legislação angolana e/ou internacional aplicável ao contrato"
}

Considera:
- Legislação angolana (Lei dos Contratos, Código Civil Angolano, Lei da Concorrência)
- Se aplicável, legislação internacional
- Riscos financeiros, legais, operacionais e regulatórios
- Oportunidades e benefícios do contrato
- Se o valor apresentado é justo face ao mercado

Contrato:
${content}`
        }
      ],
      temperature: 0.3,
      max_tokens: 2048,
    });

    const text = completion.choices[0]?.message?.content?.trim() || "{}";
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(clean);
    return {
      summary: parsed.summary || '',
      risks: parsed.risks || [],
      opportunities: parsed.opportunities || [],
      valueAnalysis: parsed.valueAnalysis || '',
      applicableLaw: parsed.applicableLaw || ''
    };
  } catch (e) {
    console.error("Error analyzing contract risks:", e);
    return { summary: '', risks: [], opportunities: [], valueAnalysis: '', applicableLaw: '' };
  }
}

export async function intelligentSearch(query: string, contracts: any[]) {
  if (!query || contracts.length === 0) return contracts;
  if (!apiKey) return contracts;

  try {
    const contractSummaries = contracts.map(c => ({
      id: c.id,
      title: c.title,
      description: c.description || ""
    }));

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "És um assistente de pesquisa. Identifica contratos relevantes com base numa consulta. Responde SEMPRE em JSON válido, sem markdown."
        },
        {
          role: "user",
          content: `Com base na consulta, identifica os contratos mais relevantes.
Retorna APENAS um array JSON com os IDs em ordem de relevância:
["id1", "id2", ...]

Consulta: "${query}"

Contratos:
${JSON.stringify(contractSummaries)}`
        }
      ],
      temperature: 0.2,
      max_tokens: 512,
    });

    const text = completion.choices[0]?.message?.content?.trim() || "[]";
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const relevantIds = JSON.parse(clean);
    return contracts.filter(c => relevantIds.includes(c.id));
  } catch (e) {
    console.error("Error in intelligent search:", e);
    return contracts;
  }
}

export async function extractContractFromText(text: string) {
  if (!text || !apiKey) return null;

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "És um assistente jurídico angolano. Extraí dados estruturados de contratos. Responde SEMPRE em JSON válido, sem markdown."
        },
        {
          role: "user",
          content: `Extraí os dados do seguinte contrato e retorna APENAS um JSON com este formato:
{
  "title": "título do contrato",
  "description": "breve descrição (máx 100 palavras)",
  "startDate": "data de início no formato YYYY-MM-DD ou vazio",
  "endDate": "data de término no formato YYYY-MM-DD ou vazio",
  "value": "valor numérico sem símbolos (ex: 1500000.00) ou vazio"
}

Se não encontrares um campo, deixa vazio. Não inventes dados.
Texto do contrato:
${text.slice(0, 15000)}`
        }
      ],
      temperature: 0.2,
      max_tokens: 512,
    });

    const content = completion.choices[0]?.message?.content?.trim() || "{}";
    const clean = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error("Error extracting contract data:", e);
    return null;
  }
}

export async function generateContractSuggestions(description: string): Promise<string> {
  if (!description || !apiKey) return "";

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "És um advogado especialista em direito contratual angolano. Rediges contratos profissionais e completos em português."
        },
        {
          role: "user",
          content: `Com base na seguinte descrição, gera um rascunho de contrato profissional em português angolano.
Inclui: identificação das partes, objeto do contrato, obrigações, prazo, valor, condições de pagamento e rescisão.

Descrição: ${description}`
        }
      ],
      temperature: 0.5,
      max_tokens: 2048,
    });

    return completion.choices[0]?.message?.content || "";
  } catch (e) {
    console.error("Error generating contract:", e);
    return "";
  }
}

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
  if (!apiKey) return "";

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

  // Mapeamento do tipo de contrato para cores do cabeçalho (como nos templates existentes)
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

  // Cor de destaque para highlight boxes
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
Se for "Internacional", adapta o contrato para uma transacção internacional, referindo tratados e convenções internacionais.
Se for um país específico, usa a legislação desse país.
Referências legais a usar: ${legislacaoRef}

REGRAS:
1. Gera APENAS HTML válido, sem markdown, sem blocos de código, sem \`\`\`
2. Usa CSS inline para formatação
3. O HTML deve ser completo e autónomo (apenas o conteúdo, sem tags html/head/body extra)
4. O design visual do contrato deve seguir EXACTAMENTE o estilo dos modelos profissionais da plataforma
5. REFERENCIA a legislação do país escolhido em cada cláusula relevante
6. Usa linguagem formal e técnica
7. Se for contrato internacional, inclui cláusula de arbitragem internacional (CCI - Câmara de Comércio Internacional)
8. Máximo de detalhe e qualidade - este contrato será usado como documento legal
9. O idioma do contrato deve ser português
10. Conteúdo centralizado com max-width:800px e margin:0 auto

DESIGN VISUAL OBRIGATÓRIO (deve replicar o estilo dos templates existentes na plataforma):

ESTRUTURA GERAL:
${'`'}${'`'}${'`'}
<div style="font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;max-width:800px;margin:0 auto;">
  <!-- HEADER com fundo colorido -->
  <div style="background:${headerColor};padding:32px 40px 0;color:${headerTextColor};position:relative;">
    <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;opacity:0.5;margin-bottom:4px;">Contrato</div>
    <h1 style="font-size:22px;font-weight:400;color:${headerTextColor};margin:0 0 20px;font-family:Georgia,serif;">[Tipo de Contrato]</h1>
    <div style="border-top:1px solid rgba(255,255,255,0.15);padding:12px 0;display:flex;gap:40px;font-size:11px;color:${headerTextColor};">
      <div><span style="opacity:0.5;display:block;font-size:9px;text-transform:uppercase;letter-spacing:0.5px;">País</span><span>${pais}</span></div>
      <div><span style="opacity:0.5;display:block;font-size:9px;text-transform:uppercase;letter-spacing:0.5px;">Data</span><span>[data_celebracao]</span></div>
      <div><span style="opacity:0.5;display:block;font-size:9px;text-transform:uppercase;letter-spacing:0.5px;">Estado</span><span>Rascunho</span></div>
    </div>
  </div>

  <!-- BODY -->
  <div style="padding:32px 40px;">
    <!-- SECÇÕES com título -->
    <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;font-weight:700;color:#0d1117;margin-bottom:12px;margin-top:24px;border-bottom:1px solid #e2e5e9;padding-bottom:6px;">Partes Contratantes</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">
      [campos em grid]
    </div>

    <!-- HIGHLIGHT BOX para valor -->
    <div style="background:#f0f5ff;border-left:2px solid ${accentColor};padding:16px 20px;margin-bottom:24px;">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;">Valor Total</div>
      <div style="font-size:20px;font-weight:700;color:${headerColor};">[valor]</div>
    </div>

    <!-- CLÁUSULAS -->
    <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;font-weight:700;color:#0d1117;margin-bottom:12px;margin-top:24px;border-bottom:1px solid #e2e5e9;padding-bottom:6px;">Cláusulas</div>
    <p><strong>Cláusula 1ª — ...</strong> — texto...</p>
    [10 cláusulas completas]

    <!-- ASSINATURAS -->
    <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;font-weight:700;color:#0d1117;margin-bottom:12px;margin-top:32px;border-bottom:1px solid #e2e5e9;padding-bottom:6px;">Assinaturas</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;">
      <div><div style="border-bottom:1px solid #ccc;padding-bottom:4px;margin-bottom:4px;"><p style="font-size:12px;margin:0;">[Parte A]</p></div><p style="font-size:10px;text-transform:uppercase;margin:0;color:#aaa;">Parte A</p></div>
      <div><div style="border-bottom:1px solid #ccc;padding-bottom:4px;margin-bottom:4px;"><p style="font-size:12px;margin:0;">[Parte B]</p></div><p style="font-size:10px;text-transform:uppercase;margin:0;color:#aaa;">Parte B</p></div>
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:12px;"><span style="font-size:10px;color:#bbb;text-transform:uppercase;">[local], [data]</span></div>
  </div>

  <!-- FOOTER com logótipo Agree -->
  <div style="background:#fafafa;border-top:0.5px solid #e8e8e8;padding:14px 40px;display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#bbb;text-transform:uppercase;font-family:Georgia,serif;">
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;"><svg width="18" height="18" viewBox="0 0 2000 2000" style="opacity:0.45;"><g transform="translate(0,2000) scale(0.1,-0.1)" fill="#000"><path d="M9810 17311 c-80 -26 -154 -80 -199 -145 -35 -51 -6334 -13066 -6351 -13122 -20 -67 -9 -189 23 -255 33 -68 97 -135 168 -174 51 -28 60 -30 164 -30 l110 1 2138 797 c1176 438 2152 804 2170 813 57 30 95 64 130 117 30 45 314 617 1328 2674 126 254 248 513 272 575 62 158 161 376 262 578 550 1099 1323 2052 2295 2831 85 69 199 156 252 194 54 39 98 73 98 77 0 4 -550 1112 -1222 2463 -1341 2697 -1246 2518 -1373 2581 -51 25 -73 29 -150 31 -49 1 -101 -1 -115 -6z"/><path d="M12592 11764 c-114 -115 -264 -275 -333 -355 -854 -1001 -1414 -2184 -1539 -3254 -6 -49 -14 -178 -17 -285 l-6 -196 538 -1059 c295 -583 567 -1118 603 -1190 78 -154 134 -220 220 -258 159 -70 4221 -1570 4279 -1580 160 -28 332 76 392 238 25 66 28 170 7 236 -13 43 -3909 7885 -3926 7903 -5 5 -99 -81 -218 -200z"/></g></svg></div>
      <span style="font-weight:700;letter-spacing:1.5px;color:#999;font-size:11px;">Agree</span>
    </div>
    <span style="letter-spacing:0.3px;">Página 1 / 1</span>
  </div>
</div>
${'`'}${'`'}${'`'}

O cabeçalho deve usar a cor de fundo CORRECTA consoante o tipo:
- Comercial / Venda / Compra ➜ header azul escuro (#0d2137), texto branco
- Confidencialidade / NDA / Sigilo ➜ header roxo escuro (#2d1b4e), texto branco
- Imobiliário / Arrendamento / Aluguer ➜ header verde escuro (#1a3a2a), texto branco
- Trabalho / Recursos Humanos ➜ header branco (#fff) com barra vermelha (#b5341a) no topo (5px), texto escuro
- Serviços / Consultoria ➜ header bege (#f5f1eb), texto escuro

ESTRUTURA OBRIGATÓRIA DO CONTRATO:
- Cabeçalho com identificação do tipo de contrato e país (com o design acima)
- Padded body com secções estilizadas
- Cláusula 1ª — Objecto do Contrato
- Cláusula 2ª — Obrigações da Parte A
- Cláusula 3ª — Obrigações da Parte B
- Cláusula 4ª — Valor e Condições de Pagamento
- Cláusula 5ª — Prazo e Vigência
- Cláusula 6ª — Penalidades e Mora
- Cláusula 7ª — Garantias
- Cláusula 8ª — Confidencialidade
- Cláusula 9ª — Rescisão
- Cláusula 10ª — Foro e Lei Aplicável (com referência ao país: ${pais})
- Secção de Assinaturas com grid 2 colunas
- Footer com fundo #fafafa`;

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Gera um contrato completo em HTML com base nos seguintes dados. USA O DESIGN VISUAL DOS TEMPLATES EXISTENTES (header colorido, secções estilizadas, highlight box, assinaturas grid, footer #fafafa).

País / Legislação: ${pais}
Tipo de Contrato: ${answers.tipo}
Parte A (Contratante): ${answers.parte_a_nome}, NIF: ${answers.parte_a_nif}, Morada: ${answers.parte_a_morada}
Parte B (Contratado): ${answers.parte_b_nome}, NIF: ${answers.parte_b_nif}, Morada: ${answers.parte_b_morada}
Valor: ${answers.valor} (${answers.valor_extenso})
Prazo: ${answers.prazo}
Objecto: ${answers.objecto}
Obrigações Parte A: ${answers.obrigacoes_a}
Obrigações Parte B: ${answers.obrigacoes_b}
Penalidade: ${answers.penalidade}
Foro: ${answers.foro}
Data de Celebração: ${answers.data_celebracao}
Local: ${answers.local_celebracao}
Detalhes Adicionais: ${answers.detalhes_adicionais}
${Object.entries(answers.extraFields || {}).filter(([,v]) => v).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join('\n')}

Header color: ${headerColor}${isWhiteHeader ? ' (texto escuro)' : ' (texto branco)'}
Accent color: ${accentColor}

Retorna APENAS o HTML completo do contrato, com CSS inline, pronto para ser inserido numa página web.
IMPORTANTE: As referências legais devem ser do país ${pais}.`
        }
      ],
      temperature: 0.4,
      max_tokens: 4096,
    });

    const text = completion.choices[0]?.message?.content?.trim() || "";
    const clean = text.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
    return clean;
  } catch (e) {
    console.error("Error generating full contract:", e);
    return "";
  }
}
