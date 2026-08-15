export interface ContractClause {
  id: string;
  num: number;
  title: string;
  body: string;
}

export type NumStyle = 'roman' | 'decimal' | 'ordinal';

export interface ParsedContract {
  head: string;
  hasStructure: boolean;
  bodyHtml: string;
  hasPlaceholder: boolean;
  gap: string;
  clauseTemplate: string;
  clauses: ContractClause[];
  numStyle: NumStyle;
}

const CLAUSE_NUM_TOKEN = '__NUM__';
const CLAUSE_TITLE_TOKEN = '__TITLE__';
const CLAUSE_BODY_TOKEN = '__BODY__';
const PLACEHOLDER_ATTR = 'data-clause-placeholder="1"';

export const GENERIC_CLAUSE_TEMPLATE = `<div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:Georgia,serif;font-size:18px;font-weight:300;color:#0d1117;line-height:1.2;padding-top:2px;text-align:right;">${CLAUSE_NUM_TOKEN}</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#0d1117;margin-bottom:5px;">${CLAUSE_TITLE_TOKEN}</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">${CLAUSE_BODY_TOKEN}</div>
  </div>
</div>`;

function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `c_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toRoman(n: number): string {
  const table: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let out = '';
  let rest = n;
  for (const [v, s] of table) {
    while (rest >= v) { out += s; rest -= v; }
  }
  return out;
}

const ROMAN_RE = /^[IVXLCDM]+$/i;

const ORDINALS: Record<string, number> = {
  'PRIMEIRA': 1, 'SEGUNDA': 2, 'TERCEIRA': 3, 'QUARTA': 4, 'QUINTA': 5,
  'SEXTA': 6, 'SÉTIMA': 7, 'SETIMA': 7, 'OITAVA': 8, 'NONA': 9,
  'DÉCIMA': 10, 'DECIMA': 10,
  'DÉCIMA PRIMEIRA': 11, 'DÉCIMA SEGUNDA': 12,
};

const ORDINAL_NAMES = [
  'PRIMEIRA', 'SEGUNDA', 'TERCEIRA', 'QUARTA', 'QUINTA', 'SEXTA',
  'SÉTIMA', 'OITAVA', 'NONA', 'DÉCIMA', 'DÉCIMA PRIMEIRA', 'DÉCIMA SEGUNDA',
];

function ordinalToNumber(text: string): number | null {
  const t = text.trim().replace(/[.…]/g, '').toUpperCase();
  if (!t) return null;
  return ORDINALS[t] ?? null;
}

function numberToOrdinal(n: number): string {
  return ORDINAL_NAMES[n - 1] || String(n);
}

function parseNumText(raw: string, idx: number): number {
  const cleaned = raw.trim().replace(/[.…]/g, '');
  if (ROMAN_RE.test(cleaned)) {
    const roman = parseRoman(cleaned);
    if (roman !== null) return roman;
  }
  const ord = ordinalToNumber(cleaned);
  if (ord !== null) return ord;
  const dec = parseInt(cleaned.replace(/\D/g, ''), 10);
  if (!isNaN(dec)) return dec;
  return idx + 1;
}

export function parseRoman(text: string): number | null {
  const romanMap: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  const t = text.trim().toUpperCase();
  if (!t || !ROMAN_RE.test(t)) return null;
  let total = 0;
  let prev = 0;
  for (let i = t.length - 1; i >= 0; i--) {
    const v = romanMap[t[i]];
    if (v < prev) total -= v; else total += v;
    prev = v;
  }
  return total;
}

export function formatClauseNum(n: number, style: NumStyle): string {
  if (style === 'roman') return toRoman(n);
  if (style === 'ordinal') return numberToOrdinal(n);
  return String(n);
}

export function detectNumStyle(rawNums: string[]): NumStyle {
  if (rawNums.length === 0) return 'roman';
  const cleaned = rawNums.map(r => r.trim().replace(/[.…]/g, ''));
  if (cleaned.every(c => ROMAN_RE.test(c))) return 'roman';
  if (cleaned.every(c => ordinalToNumber(c) !== null)) return 'ordinal';
  return 'decimal';
}

// ─── Clause node detection ───────────────────────────

function isGridClause(el: HTMLElement): boolean {
  const st = el.style;
  return st.display === 'grid' && (st.gridTemplateColumns || '').includes('36px');
}

function isSectionClause(el: HTMLElement): boolean {
  const st = el.style;
  const fc = el.firstElementChild as HTMLElement | null;
  return st.marginTop === '28px' && !!fc && fc.style.display === 'flex';
}

function detectClauseType(el: HTMLElement): 'grid' | 'section' | null {
  if (isGridClause(el)) return 'grid';
  if (isSectionClause(el)) return 'section';
  return null;
}

function gridNumberEl(clause: HTMLElement): HTMLElement {
  const children = Array.from(clause.children) as HTMLElement[];
  return children.find(el => el.style.textAlign === 'right') || children[0] || clause;
}

function gridTitleEl(clause: HTMLElement): HTMLElement {
  const children = Array.from(clause.children) as HTMLElement[];
  const col = children[1] || children[0];
  const subs = Array.from((col as HTMLElement).children) as HTMLElement[];
  return subs.find(el => (el.style.fontWeight || '').includes('600')) || subs[0] || (col as HTMLElement);
}

function gridBodyEl(clause: HTMLElement): HTMLElement | null {
  const children = Array.from(clause.children) as HTMLElement[];
  const col = children[1] || children[0];
  const title = gridTitleEl(clause);
  const subs = Array.from((col as HTMLElement).children) as HTMLElement[];
  return subs.find(el => el !== title) || (col as HTMLElement);
}

function sectionHeaderEl(clause: HTMLElement): HTMLElement {
  return (clause.firstElementChild as HTMLElement) || clause;
}

function sectionTitleEl(clause: HTMLElement): HTMLElement {
  const rest = Array.from(clause.children).slice(1) as HTMLElement[];
  const found = rest.find(el => (el.style.paddingLeft || '').includes('44px') && (el.style.fontWeight || '').includes('700'));
  return found || rest[0] || clause;
}

function sectionBodyEl(clause: HTMLElement): HTMLElement | null {
  const rest = Array.from(clause.children).slice(1) as HTMLElement[];
  const title = sectionTitleEl(clause);
  const found = rest.find(el => el !== title && (el.style.paddingLeft || '').includes('44px'));
  return found || (rest[rest.length - 1] ?? null);
}

function tokenizeClause(node: HTMLElement, type: 'grid' | 'section'): string {
  const clone = node.cloneNode(true) as HTMLElement;
  if (type === 'grid') {
    gridNumberEl(clone).innerHTML = CLAUSE_NUM_TOKEN;
    gridTitleEl(clone).innerHTML = CLAUSE_TITLE_TOKEN;
    const body = gridBodyEl(clone);
    if (body) body.innerHTML = CLAUSE_BODY_TOKEN;
  } else {
    const span = sectionHeaderEl(clone).querySelector('span') as HTMLElement | null;
    if (span) span.innerHTML = CLAUSE_NUM_TOKEN;
    sectionTitleEl(clone).innerHTML = CLAUSE_TITLE_TOKEN;
    const body = sectionBodyEl(clone);
    if (body) body.innerHTML = CLAUSE_BODY_TOKEN;
  }
  return clone.outerHTML;
}

// ─── Serialize body ──────────────────────────────────

function serializeBody(body: string): string {
  if (!body) return '';
  if (body.includes('<')) return body;
  return escapeHtml(body).replace(/\n/g, '<br/>');
}

export function renderClause(tpl: string, clause: ContractClause, style: NumStyle): string {
  return tpl
    .split(CLAUSE_NUM_TOKEN).join(formatClauseNum(clause.num, style))
    .split(CLAUSE_TITLE_TOKEN).join(escapeHtml(clause.title))
    .split(CLAUSE_BODY_TOKEN).join(serializeBody(clause.body));
}

const PLACEHOLDER_RE = /<div[^>]*data-clause-placeholder="1"[^>]*><\/div>/;

export function serializeContract(p: ParsedContract): string {
  const rendered = p.clauses
    .map(c => renderClause(p.clauseTemplate, c, p.numStyle))
    .join(p.gap);
  const body = p.hasPlaceholder ? p.bodyHtml.replace(PLACEHOLDER_RE, rendered) : p.bodyHtml;
  return `<!DOCTYPE html><html><head>${p.head || '<meta charset="utf-8">'}</head><body>${body}</body></html>`;
}

export function renumberClauses(p: ParsedContract): ParsedContract {
  return { ...p, clauses: p.clauses.map((c, i) => ({ ...c, num: i + 1 })) };
}

// ─── Parse ───────────────────────────────────────────

export function parseContract(content: string): ParsedContract {
  if (!content || !content.trim()) return buildDefaultParsed();

  const doc = new DOMParser().parseFromString(
    content.includes('<html') || content.includes('<body') ? content : `<html><head></head><body>${content}</body></html>`,
    'text/html'
  );
  const body = doc.body;

  type Candidate = { node: HTMLElement; type: 'grid' | 'section' };
  const candidates: Candidate[] = [];
  body.querySelectorAll('div').forEach(el => {
    const elH = el as HTMLElement;
    const type = detectClauseType(elH);
    if (type) {
      const parent = elH.parentElement;
      if (!parent || !detectClauseType(parent)) candidates.push({ node: elH, type });
    }
  });
  candidates.sort((a, b) => (a.node.compareDocumentPosition(b.node) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));

  if (candidates.length === 0) {
    const text = (body.textContent || '').split(/\n+/).map(l => l.trim()).filter(Boolean).join('\n');
    return {
      head: doc.head ? doc.head.innerHTML : '',
      hasStructure: false,
      bodyHtml: DEFAULT_BODY_SHELL,
      hasPlaceholder: true,
      gap: '\n    ',
      clauseTemplate: GENERIC_CLAUSE_TEMPLATE,
      clauses: [{ id: uid(), num: 1, title: 'Cláusula Única', body: text }],
      numStyle: 'roman',
    };
  }

  const first = candidates[0];
  const clauseNodes = candidates.map(c => c.node);

  const rawNums = candidates.map(c => {
    if (c.type === 'grid') return (gridNumberEl(c.node).textContent || '').trim();
    const span = sectionHeaderEl(c.node).querySelector('span');
    return (span?.textContent || '').trim();
  });

  const clauses: ContractClause[] = candidates.map((c, idx) => {
    let title = '';
    let body = '';
    if (c.type === 'grid') {
      title = (gridTitleEl(c.node).textContent || '').trim();
      const b = gridBodyEl(c.node);
      body = b ? b.innerHTML.trim() : '';
    } else {
      title = (sectionTitleEl(c.node).textContent || '').trim();
      const b = sectionBodyEl(c.node);
      body = b ? b.innerHTML.trim() : '';
    }
    return { id: uid(), num: parseNumText(rawNums[idx], idx), title, body };
  });

  // Insert placeholder in place of the first clause; remove the rest.
  const placeholder = doc.createElement('div');
  placeholder.setAttribute('data-clause-placeholder', '1');
  first.node.parentNode!.replaceChild(placeholder, first.node);
  clauseNodes.slice(1).forEach(n => n.parentNode!.removeChild(n));

  return renumberClauses({
    head: doc.head ? doc.head.innerHTML : '',
    hasStructure: true,
    bodyHtml: body.innerHTML,
    hasPlaceholder: true,
    gap: '\n    ',
    clauseTemplate: tokenizeClause(first.node, first.type),
    clauses,
    numStyle: detectNumStyle(rawNums),
  });
}

const DEFAULT_BODY_SHELL = `<div style="font-family:'DM Sans',sans-serif;max-width:820px;margin:0 auto;background:#fff;">
  <div style="padding:36px 52px;border-bottom:1px solid #e4e0d8;text-align:center;">
    <div style="font-size:9px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#888;margin-bottom:10px;">Documento</div>
    <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:30px;font-weight:300;color:#0d1117;margin:0;">{{titulo}}</h1>
  </div>
  <div style="padding:40px 52px 24px;">
    <div data-clause-placeholder="1"></div>
  </div>
  <div style="padding:20px 52px;border-top:1px solid #e4e0d8;text-align:center;font-family:'DM Sans',sans-serif;font-size:10px;letter-spacing:0.08em;color:#aaa;text-transform:uppercase;">Gerado no Agree — {{data}}</div>
</div>`;

export function buildDefaultParsed(): ParsedContract {
  return {
    head: `<meta charset="utf-8"><style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
</style>`,
    hasStructure: true,
    bodyHtml: DEFAULT_BODY_SHELL,
    hasPlaceholder: true,
    gap: '\n    ',
    clauseTemplate: GENERIC_CLAUSE_TEMPLATE,
    clauses: [],
    numStyle: 'roman',
  };
}

// ─── Presets ─────────────────────────────────────────

export interface ClausePreset {
  title: string;
  body: string;
}

export const CLAUSE_PRESETS: ClausePreset[] = [
  {
    title: 'Objecto',
    body: 'O presente contrato tem por objecto a regulação das condições em que as partes se obrigam, nos termos e condições descritos nas cláusulas seguintes, ao abrigo da lei aplicável na República de Angola.',
  },
  {
    title: 'Definições',
    body: 'Para efeitos do presente contrato, os termos com maiúscula inicial têm o significado que lhes é atribuído no corpo deste documento, aplicando-se as definições a todas as cláusulas.',
  },
  {
    title: 'Preço e Pagamento',
    body: 'Pela execução do presente contrato, a parte devedora pagará o valor de {{valor_total}}, em moeda de curso legal, na modalidade acordada. O pagamento considera-se efectuado na data em que o credor recebe os fundos. O atraso superior a 15 (quinze) dias confere ao credor o direito a juros de mora à taxa legal vigente.',
  },
  {
    title: 'Obrigações das Partes',
    body: 'A primeira parte obriga-se a cumprir todas as obrigações que lhe cabem nos termos do presente contrato. A segunda parte obriga-se, designadamente, a: (a) executar com diligência o objecto contratual; (b) comunicar por escrito qualquer facto que impeça ou dificulte o cumprimento; (c) não ceder os seus direitos sem consentimento prévio.',
  },
  {
    title: 'Prazo e Vigência',
    body: 'O presente contrato entra em vigor na data da sua assinatura e mantém-se válido até ao seu integral cumprimento, salvo se as partes acordarem prazo diverso. Poderá ser renovado por acordo escrito das partes.',
  },
  {
    title: 'Confidencialidade',
    body: 'As partes comprometem-se a manter absoluto sigilo sobre todas as informações comerciais, técnicas e financeiras partilhadas no âmbito deste contrato, obrigação que se mantém durante a vigência e por 5 (cinco) anos após o seu término.',
  },
  {
    title: 'Garantias',
    body: 'Cada parte garante que detém capacidade e poderes para celebrar o presente contrato e que não viola, com a sua celebração, qualquer obrigação anteriormente assumida perante terceiros.',
  },
  {
    title: 'Penalidades',
    body: 'Em caso de incumprimento, a parte faltosa poderá ser obrigada a pagar à outra uma pena no valor de {{penalidade}}, sem prejuízo de perdas e danos que se provem, nos termos do Código Civil Angolano.',
  },
  {
    title: 'Rescisão',
    body: 'Qualquer das partes poderá rescindir o presente contrato: (a) por incumprimento grave e reiterado; (b) por declaração de insolvência; (c) por impossibilidade superveniente. A rescisão deve ser comunicada por escrito com a antecedência mínima de 30 (trinta) dias.',
  },
  {
    title: 'Força Maior',
    body: 'Nenhuma das partes será responsável por incumprimento ou atraso resultante de catástrofes naturais, greves, actos de guerra, terrorismo ou medidas governamentais que obstem objectivamente à execução do presente contrato.',
  },
  {
    title: 'Comunicações',
    body: 'Todas as notificações ao abrigo deste contrato devem ser efectuadas por escrito, por carta registada, correio electrónico ou outro meio com confirmação de recepção, e consideram-se recebidas na data do respectivo envio confirmado.',
  },
  {
    title: 'Cessão',
    body: 'Nenhuma das partes poderá ceder, no todo ou em parte, os direitos e obrigações decorrentes deste contrato sem o consentimento prévio e escrito da outra parte, excepto em caso de fusão, cisão ou transformação societária.',
  },
  {
    title: 'Foro e Lei Aplicável',
    body: 'Para a resolução de quaisquer litígios emergentes do presente contrato, as partes elegem o foro da comarca de {{foro}}, com renúncia expressa a qualquer outro, aplicando-se a lei da República de Angola.',
  },
  {
    title: 'Disposições Finais',
    body: 'O presente contrato constitui o acordo integral entre as partes, revogando e substituindo qualquer entendimento anterior. Qualquer alteração só será válida se reduzida a escrito e assinada por ambas as partes. A nulidade de qualquer cláusula não afectará a validade das restantes.',
  },
];

export function fillPlaceholders(html: string, values: Record<string, string>): string {
  let out = html;
  for (const [key, value] of Object.entries(values)) {
    const token = `{{${key}}}`;
    if (out.includes(token)) out = out.split(token).join(escapeHtml(value || ''));
  }
  return out;
}
