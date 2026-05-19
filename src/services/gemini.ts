import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeContractRisks(content: string) {
  if (!content) return [];

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analise o seguinte contrato e identifique riscos potenciais. Retorne uma lista de riscos com severidade (low, medium, high) e uma breve descrição em português.
    
    Contrato:
    ${content}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            severity: { type: Type.STRING, enum: ["low", "medium", "high"] },
            description: { type: Type.STRING }
          },
          required: ["severity", "description"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Error parsing risks:", e);
    return [];
  }
}

export async function intelligentSearch(query: string, contracts: any[]) {
  if (!query || contracts.length === 0) return contracts;

  const contractSummaries = contracts.map(c => ({
    id: c.id,
    title: c.title,
    description: c.description
  }));

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Com base na consulta do usuário, identifique quais destes contratos são os mais relevantes. Retorne apenas os IDs dos contratos relevantes em ordem de relevância.
    
    Consulta: "${query}"
    
    Contratos:
    ${JSON.stringify(contractSummaries)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  try {
    const relevantIds = JSON.parse(response.text || "[]");
    return contracts.filter(c => relevantIds.includes(c.id));
  } catch (e) {
    console.error("Error parsing search results:", e);
    return contracts;
  }
}
