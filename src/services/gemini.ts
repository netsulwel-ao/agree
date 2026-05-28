import Groq from "groq-sdk";

const apiKey = import.meta.env.VITE_GROQ_API_KEY || "";

const groq = new Groq({
  apiKey,
  dangerouslyAllowBrowser: true
});

const MODEL = "llama-3.3-70b-versatile";

export async function analyzeContractRisks(content: string) {
  if (!content) return [];
  if (!apiKey) {
    console.warn("Groq API key not set");
    return [];
  }

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "És um especialista jurídico angolano. Analisa contratos e identifica riscos. Responde SEMPRE em JSON válido, sem markdown, sem blocos de código."
        },
        {
          role: "user",
          content: `Analisa o seguinte contrato e identifica os riscos potenciais.
Retorna APENAS um array JSON com este formato exato:
[{"severity": "low"|"medium"|"high", "description": "descrição em português"}]

Contrato:
${content}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1024,
    });

    const text = completion.choices[0]?.message?.content?.trim() || "[]";
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error("Error analyzing contract risks:", e);
    return [];
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
