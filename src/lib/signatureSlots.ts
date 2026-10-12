/**
 * Extrai as posições/slots de assinatura do HTML do contrato.
 *
 * Os templates usam a estrutura:
 *   <div style="height:52px;border-bottom:..."></div>   ← linha de assinatura
 *   <div>Nome do signatário</div>
 *   <div style="...uppercase...color:#aaa...">VENDEDOR</div>   ← label/papel
 *
 * Retorna um array de slots: [{ index: 0, label: 'Vendedor' }, { index: 1, label: 'Comprador' }]
 */

export interface SignatureSlot {
  /** Índice da div de assinatura no HTML (0 = primeira, 1 = segunda, etc.) */
  index: number;
  /** Label/papel extraído do HTML (ex: "Vendedor", "Comprador", "Parte A") */
  label: string;
}

export function extractSignatureSlots(htmlContent: string): SignatureSlot[] {
  if (!htmlContent) return [];

  const slots: SignatureSlot[] = [];

  // Regex que encontra cada bloco: div-linha + div-nome + div-label
  // A div-label tem text-transform:uppercase e color:#aaa (padrão dos templates)
  const blockPattern = /<div[^>]*height:52px[^>]*border-bottom[^>]*>[\s\S]*?<\/div>\s*<div[^>]*>[\s\S]*?<\/div>\s*<div[^>]*(?:uppercase|letter-spacing)[^>]*>([\s\S]*?)<\/div>/gi;

  let match;
  let idx = 0;
  while ((match = blockPattern.exec(htmlContent)) !== null) {
    const rawLabel = match[1]
      .replace(/<[^>]+>/g, '') // remover tags HTML internas
      .trim();
    if (rawLabel) {
      // Capitalizar primeira letra
      const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1).toLowerCase();
      slots.push({ index: idx, label });
      idx++;
    }
  }

  // Fallback: se o padrão acima não encontrar nada, tentar padrão mais simples
  // (apenas contar as divs de assinatura e numerá-las)
  if (slots.length === 0) {
    const simplePattern = /<div[^>]*height:52px[^>]*border-bottom[^>]*>/gi;
    let simpleMatch;
    let simpleIdx = 0;
    while ((simpleMatch = simplePattern.exec(htmlContent)) !== null) {
      slots.push({ index: simpleIdx, label: `Assinante ${simpleIdx + 1}` });
      simpleIdx++;
    }
  }

  return slots;
}
