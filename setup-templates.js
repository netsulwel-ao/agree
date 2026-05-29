import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Configura SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function setup() {
  console.log('🚀 A configurar templates e storage...\n');

  // 1. Criar bucket "contracts"
  console.log('📦 Criando bucket "contracts"...');
  const { error: bucketError } = await supabase.storage.createBucket('contracts', {
    public: true,
    allowedMimeTypes: ['application/pdf','image/png','image/jpeg','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    fileSizeLimit: 10485760,
  });
  if (bucketError && !bucketError.message.includes('already exists')) {
    console.error('❌ Erro ao criar bucket:', bucketError);
  } else {
    console.log('✅ Bucket "contracts" pronto');
  }

  // 2. Criar tabela contract_templates
  console.log('\n📋 Criando tabela contract_templates...');
  const sqlCommands = [
    `CREATE TABLE IF NOT EXISTS contract_templates (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        content TEXT NOT NULL,
        variables JSONB DEFAULT '[]'::jsonb,
        fields JSONB DEFAULT '[]'::jsonb,
        is_system BOOLEAN DEFAULT false,
        user_id UUID
    );`,
    `ALTER TABLE contract_templates ADD COLUMN IF NOT EXISTS fields JSONB DEFAULT '[]'::jsonb;`,
    `ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;`,
    `CREATE POLICY IF NOT EXISTS "Users can view all templates" ON contract_templates FOR SELECT USING (true);`,
    `CREATE POLICY IF NOT EXISTS "Users can create templates" ON contract_templates FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);`,
    `CREATE POLICY IF NOT EXISTS "Users can update their own templates" ON contract_templates FOR UPDATE USING (auth.uid() = user_id);`,
    `CREATE POLICY IF NOT EXISTS "Users can delete their own templates" ON contract_templates FOR DELETE USING (auth.uid() = user_id);`,
  ];
  for (const sql of sqlCommands) {
    const { error } = await supabase.rpc('exec_sql', { sql });
    if (error && !error.message?.includes('already exists') && !error.message?.includes('duplicate')) {
      console.error('  ⚠️  Aviso:', error.message);
    }
  }
  const { error: checkError } = await supabase.from('contract_templates').select('id').limit(1);
  if (checkError) {
    console.error('❌ Tabela contract_templates não foi criada:', checkError.message);
    return;
  }
  console.log('✅ Tabela contract_templates pronta');

  // ─────────────────────────────────────────────────────────────
  // SHARED ASSETS
  // ─────────────────────────────────────────────────────────────

  // Google Fonts import (Cormorant Garamond + DM Sans)
  const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');`;

  // Agree SVG logo path (compact)
  const LOGO_PATH = `<svg width="20" height="20" viewBox="0 0 2000 2000" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0,2000) scale(0.1,-0.1)"><path d="M9810 17311 c-80 -26 -154 -80 -199 -145 -35 -51 -6334 -13066 -6351 -13122 -20 -67 -9 -189 23 -255 33 -68 97 -135 168 -174 51 -28 60 -30 164 -30 l110 1 2138 797 c1176 438 2152 804 2170 813 57 30 95 64 130 117 30 45 314 617 1328 2674 126 254 248 513 272 575 62 158 161 376 262 578 550 1099 1323 2052 2295 2831 85 69 199 156 252 194 54 39 98 73 98 77 0 4 -550 1112 -1222 2463 -1341 2697 -1246 2518 -1373 2581 -51 25 -73 29 -150 31 -49 1 -101 -1 -115 -6z" fill="currentColor"/><path d="M12592 11764 c-114 -115 -264 -275 -333 -355 -854 -1001 -1414 -2184 -1539 -3254 -6 -49 -14 -178 -17 -285 l-6 -196 538 -1059 c295 -583 567 -1118 603 -1190 78 -154 134 -220 220 -258 159 -70 4221 -1570 4279 -1580 160 -28 332 76 392 238 25 66 28 170 7 236 -13 43 -3909 7885 -3926 7903 -5 5 -99 -81 -218 -200z" fill="currentColor"/></g></svg>`;

  // ─────────────────────────────────────────────────────────────
  // HELPER: generate footer (shared across all templates)
  // ─────────────────────────────────────────────────────────────
  function footer(refVar, pageLabel) {
    return `
<footer style="display:flex;align-items:center;justify-content:space-between;padding:18px 52px;border-top:1px solid rgba(0,0,0,0.08);margin-top:0;">
  <div style="display:flex;align-items:center;gap:8px;opacity:0.35;">
    ${LOGO_PATH}
    <span style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;">Agree</span>
  </div>
  <div style="font-family:'DM Sans',sans-serif;font-size:10px;letter-spacing:0.06em;opacity:0.3;text-transform:uppercase;display:flex;gap:24px;">
    <span>${refVar}</span><span>${pageLabel}</span>
  </div>
</footer>`;
  }

  // ─────────────────────────────────────────────────────────────
  // HELPER: section heading
  // ─────────────────────────────────────────────────────────────
  function sectionHead(label, color) {
    return `<div style="display:flex;align-items:center;gap:12px;margin:36px 0 16px;">
  <div style="width:3px;height:16px;background:${color};border-radius:2px;flex-shrink:0;"></div>
  <span style="font-family:'DM Sans',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:${color};">${label}</span>
</div>`;
  }

  // ─────────────────────────────────────────────────────────────
  // HELPER: two-col info grid row
  // ─────────────────────────────────────────────────────────────
  function infoGrid(pairs) {
    const cells = pairs.map(([label, value]) => `
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-bottom:4px;">${label}</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">${value}</div>
  </div>`).join('');
    return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px 36px;margin-bottom:28px;">${cells}</div>`;
  }

  // ─────────────────────────────────────────────────────────────
  // HELPER: clause
  // ─────────────────────────────────────────────────────────────
  function clause(num, title, body, accentColor) {
    return `<div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:${accentColor};line-height:1.2;padding-top:2px;text-align:right;">${num}</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">${title}</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">${body}</div>
  </div>
</div>`;
  }

  // ─────────────────────────────────────────────────────────────
  // HELPER: signature block
  // ─────────────────────────────────────────────────────────────
  function signatures(left, right, leftTitle, rightTitle) {
    const block = (name, title) => `<div>
  <div style="height:52px;border-bottom:1px solid #ccc;margin-bottom:10px;"></div>
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;font-weight:400;">${name}</div>
  <div style="font-family:'DM Sans',sans-serif;font-size:9px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-top:3px;">${title}</div>
</div>`;
    return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:52px;margin-top:40px;">${block(left,leftTitle)}${block(right,rightTitle)}</div>`;
  }

  // ─────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────
  // TEMPLATE 1 — COMPRA E VENDA
  // Aesthetic: Deep navy luxury. Geometric gold accent stripe.
  //            Cormorant headings. Premium banking document feel.
  // ─────────────────────────────────────────────────────────────
  const tmpl_compraVenda = {
    name: 'Contrato de Compra e Venda',
    description: 'Contrato comercial de compra e venda — design luxury navy com acento dourado',
    category: 'Comercial',
    is_system: true,
    fields: [
      { name: 'nome_vendedor',        label: 'Nome do Vendedor',          type: 'text',     required: true  },
      { name: 'nif_vendedor',         label: 'NIF do Vendedor',           type: 'text',     required: true  },
      { name: 'nome_comprador',       label: 'Nome do Comprador',         type: 'text',     required: true  },
      { name: 'nif_comprador',        label: 'NIF do Comprador',          type: 'text',     required: true  },
      { name: 'referencia',           label: 'Referência',                type: 'text',     required: true  },
      { name: 'descricao_bem',        label: 'Descrição do Bem',          type: 'textarea', required: true  },
      { name: 'quantidade',           label: 'Quantidade',                type: 'text',     required: true  },
      { name: 'preco_unitario',       label: 'Preço Unitário (Kz)',       type: 'text',     required: true  },
      { name: 'valor_total',          label: 'Valor Total (Kz)',          type: 'text',     required: true  },
      { name: 'modalidade_pagamento', label: 'Modalidade de Pagamento',   type: 'text',     required: true  },
      { name: 'data_celebracao',      label: 'Data de Celebração',        type: 'date',     required: true  },
      { name: 'data_entrega',         label: 'Data de Entrega',           type: 'date',     required: true  },
      { name: 'periodo_garantia',     label: 'Período de Garantia',       type: 'text',     required: false },
      { name: 'comarca_foro',         label: 'Comarca / Foro',            type: 'text',     required: true  },
    ],
    content: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${FONTS}
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
</style></head><body>
<div style="font-family:'DM Sans',sans-serif;max-width:820px;margin:0 auto;background:#fff;border:1px solid #e4e0d8;">

  <!-- HEADER BAND: deep navy with gold accent -->
  <div style="background:#0b1f38;padding:0 52px;position:relative;">
    <!-- Gold accent stripe top -->
    <div style="height:4px;background:linear-gradient(90deg,#c9a84c 0%,#e8cd7a 50%,#c9a84c 100%);position:absolute;top:0;left:0;right:0;"></div>

    <div style="padding-top:40px;padding-bottom:0;">
      <!-- Eyebrow row -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;">
        <div style="display:flex;align-items:center;gap:10px;opacity:0.55;color:#fff;">
          <div style="color:#c9a84c;">${LOGO_PATH}</div>
          <span style="font-size:10px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#c9a84c;">Agree</span>
          <span style="color:rgba(255,255,255,0.2);font-size:10px;">·</span>
          <span style="font-size:10px;letter-spacing:0.08em;color:rgba(255,255,255,0.4);">{{referencia}}</span>
        </div>
        <div style="text-align:right;">
          <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:500;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:4px;">Data</div>
          <div style="font-family:'DM Sans',sans-serif;font-size:12px;font-weight:300;color:rgba(255,255,255,0.7);">{{data_celebracao}}</div>
        </div>
      </div>

      <!-- Document type -->
      <div style="font-family:'DM Sans',sans-serif;font-size:10px;font-weight:500;letter-spacing:0.22em;text-transform:uppercase;color:#c9a84c;margin-bottom:10px;">Contrato Comercial</div>

      <!-- Main title -->
      <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:42px;font-weight:300;color:#fff;letter-spacing:-0.5px;line-height:1.1;margin-bottom:32px;">Compra e Venda</h1>
    </div>

    <!-- Parties band at bottom of header -->
    <div style="display:grid;grid-template-columns:1fr 1px 1fr;border-top:1px solid rgba(255,255,255,0.08);">
      <div style="padding:20px 0 20px 0;">
        <div style="font-size:8.5px;font-weight:500;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:6px;">Vendedor</div>
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;font-weight:400;color:#fff;">{{nome_vendedor}}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.35);margin-top:2px;">NIF {{nif_vendedor}}</div>
      </div>
      <div style="background:rgba(255,255,255,0.08);"></div>
      <div style="padding:20px 0 20px 28px;">
        <div style="font-size:8.5px;font-weight:500;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:6px;">Comprador</div>
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;font-weight:400;color:#fff;">{{nome_comprador}}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.35);margin-top:2px;">NIF {{nif_comprador}}</div>
      </div>
    </div>
  </div>

  <!-- BODY -->
  <div style="padding:44px 52px 40px;">

    <!-- Value highlight card -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1px;background:#e8e4dc;border:1px solid #e8e4dc;border-radius:4px;overflow:hidden;margin-bottom:40px;">
      <div style="background:#fff;padding:20px 22px;">
        <div style="font-size:8.5px;font-weight:500;letter-spacing:0.16em;text-transform:uppercase;color:#aaa;margin-bottom:6px;">Bem / Objecto</div>
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;font-weight:400;color:#1a1a1a;line-height:1.4;">{{descricao_bem}}</div>
      </div>
      <div style="background:#fff;padding:20px 22px;">
        <div style="font-size:8.5px;font-weight:500;letter-spacing:0.16em;text-transform:uppercase;color:#aaa;margin-bottom:6px;">Qtd · Preço Unit.</div>
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;font-weight:400;color:#1a1a1a;">{{quantidade}} &nbsp;×&nbsp; {{preco_unitario}}</div>
        <div style="font-size:11px;color:#888;margin-top:4px;">{{modalidade_pagamento}}</div>
      </div>
      <div style="background:#0b1f38;padding:20px 22px;">
        <div style="font-size:8.5px;font-weight:500;letter-spacing:0.16em;text-transform:uppercase;color:#c9a84c;margin-bottom:6px;">Valor Total</div>
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-weight:400;color:#fff;line-height:1.1;">{{valor_total}}</div>
      </div>
    </div>

    ${sectionHead('Objecto e Condições', '#c9a84c')}
    ${infoGrid([
      ['Quantidade', '{{quantidade}}'],
      ['Preço Unitário', '{{preco_unitario}}'],
      ['Modalidade de Pagamento', '{{modalidade_pagamento}}'],
      ['Data de Entrega', '{{data_entrega}}'],
      ['Período de Garantia', '{{periodo_garantia}}'],
      ['Comarca / Foro', '{{comarca_foro}}'],
    ])}

    ${sectionHead('Cláusulas Contratuais', '#0b1f38')}

    ${clause('I', 'Objecto', 'O VENDEDOR vende ao COMPRADOR, que aceita e adquire, o bem identificado no presente contrato, livre de quaisquer ónus, encargos ou restrições à propriedade, nos termos do artigo 874.º e seguintes do Código Civil Angolano.', '#c9a84c')}
    ${clause('II', 'Preço e Pagamento', 'O pagamento do preço será efectuado na modalidade acordada, comprovando-se mediante recibo ou transferência bancária. O atraso superior a 15 (quinze) dias confere ao VENDEDOR o direito de exigir juros de mora à taxa legal vigente na República de Angola.', '#c9a84c')}
    ${clause('III', 'Entrega', 'A entrega ocorrerá em {{data_entrega}}, no local designado pelas partes. Todas as despesas de transporte e seguros até à efectiva entrega são da responsabilidade do VENDEDOR. O risco transfere-se para o COMPRADOR com a assinatura do auto de entrega.', '#c9a84c')}
    ${clause('IV', 'Garantia', 'O VENDEDOR garante o bem pelo período de {{periodo_garantia}} contado da data de entrega, contra defeitos de fabrico, concepção ou funcionamento, obrigando-se a reparar ou substituir, a suas expensas, qualquer componente com defeito não imputável a uso indevido.', '#c9a84c')}
    ${clause('V', 'Obrigações das Partes', 'O VENDEDOR obriga-se a: (a) entregar o bem nas condições acordadas; (b) prestar assistência técnica durante a garantia; (c) garantir a plena propriedade do bem. O COMPRADOR obriga-se a: (a) pagar o preço no prazo acordado; (b) receber o bem; (c) não ceder direitos sem autorização prévia.', '#c9a84c')}
    ${clause('VI', 'Rescisão', 'Qualquer das partes poderá rescindir o contrato por: (a) incumprimento grave e reiterado; (b) declaração de insolvência; (c) impossibilidade superveniente. A rescisão deve ser comunicada por escrito com mínimo de 30 (trinta) dias de antecedência.', '#c9a84c')}
    ${clause('VII', 'Confidencialidade', 'As partes mantêm sigilo absoluto sobre todas as informações comerciais, técnicas e financeiras partilhadas no âmbito deste contrato, durante a sua vigência e por 5 (cinco) anos após o seu término.', '#c9a84c')}
    ${clause('VIII', 'Força Maior', 'Nenhuma das partes será responsabilizada por incumprimento ou atraso resultante de catástrofes naturais, greves, actos de guerra, terrorismo ou medidas governamentais que obstem objectivamente à execução do contrato.', '#c9a84c')}
    ${clause('IX', 'Foro e Lei Aplicável', 'Para resolução de litígios, as partes elegem o foro da Comarca de {{comarca_foro}}, com renúncia a qualquer outro, aplicando-se a lei angolana nos termos do Código Civil Angolano e demais legislação aplicável.', '#c9a84c')}
    ${clause('X', 'Disposições Finais', 'Este instrumento constitui o integral acordo entre as partes, substituindo todos os entendimentos anteriores. Qualquer alteração só será válida se reduzida a escrito e assinada por ambas as partes. A nulidade de qualquer cláusula não afectará a validade das demais.', '#c9a84c')}

    ${sectionHead('Assinaturas', '#0b1f38')}
    ${signatures('{{nome_vendedor}}','{{nome_comprador}}','Vendedor','Comprador')}

    <div style="margin-top:16px;text-align:right;font-family:'DM Sans',sans-serif;font-size:10px;letter-spacing:0.08em;color:#ccc;text-transform:uppercase;">{{data_celebracao}}</div>
  </div>

  ${footer('Ref: {{referencia}}', 'Página 1 / 1')}
</div>
</body></html>`
  };

  // ─────────────────────────────────────────────────────────────
  // TEMPLATE 2 — NDA
  // Aesthetic: Monochrome charcoal with a single crimson accent.
  //            Classified-document tension. Ultra-refined.
  // ─────────────────────────────────────────────────────────────
  const tmpl_nda = {
    name: 'Acordo de Confidencialidade (NDA)',
    description: 'NDA bilateral — design confidencial charcoal com acento carmesim',
    category: 'Confidencialidade',
    is_system: true,
    fields: [
      { name: 'nome_parte_a',         label: 'Nome da Parte A',                 type: 'text',     required: true  },
      { name: 'representante_a',      label: 'Representante da Parte A',        type: 'text',     required: true  },
      { name: 'nome_parte_b',         label: 'Nome da Parte B',                 type: 'text',     required: true  },
      { name: 'representante_b',      label: 'Representante da Parte B',        type: 'text',     required: true  },
      { name: 'referencia',           label: 'Referência',                      type: 'text',     required: true  },
      { name: 'descricao_negociacao', label: 'Descrição da Negociação',         type: 'textarea', required: true  },
      { name: 'tipo_informacoes',     label: 'Tipo de Informações',             type: 'text',     required: true  },
      { name: 'prazo_acordo',         label: 'Prazo do Acordo',                 type: 'text',     required: true  },
      { name: 'informacoes_excluidas',label: 'Informações Excluídas',           type: 'textarea', required: false },
      { name: 'valor_penalidade',     label: 'Penalidade por Incumprimento (Kz)',type: 'text',    required: true  },
      { name: 'camara_mediacao',      label: 'Câmara de Mediação',              type: 'text',     required: true  },
      { name: 'lei_aplicavel',        label: 'Lei Aplicável',                   type: 'text',     required: true  },
      { name: 'data_celebracao',      label: 'Data de Celebração',              type: 'date',     required: true  },
    ],
    content: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${FONTS}
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
</style></head><body>
<div style="font-family:'DM Sans',sans-serif;max-width:820px;margin:0 auto;background:#fff;border:1px solid #ddd;">

  <!-- HEADER: stark charcoal with crimson line -->
  <div style="background:#1c1c1c;padding:48px 52px 40px;position:relative;">
    <!-- Crimson accent top-right corner block -->
    <div style="position:absolute;top:0;right:0;width:6px;height:100%;background:#c0392b;"></div>

    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:36px;">
      <div>
        <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(192,57,43,0.15);border:1px solid rgba(192,57,43,0.3);padding:5px 14px;border-radius:2px;margin-bottom:20px;">
          <div style="width:6px;height:6px;border-radius:50%;background:#c0392b;"></div>
          <span style="font-size:9px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#c0392b;">Estritamente Confidencial</span>
        </div>
        <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:46px;font-weight:300;color:#fff;letter-spacing:-0.5px;line-height:1.0;">Non-Disclosure<br>Agreement</h1>
        <div style="font-size:10px;font-weight:500;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.25);margin-top:10px;">Acordo Bilateral de Confidencialidade</div>
      </div>
      <div style="text-align:right;padding-right:16px;">
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:48px;font-weight:300;color:rgba(255,255,255,0.06);line-height:1;letter-spacing:-2px;">NDA</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:4px;">{{referencia}}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.2);margin-top:2px;">{{data_celebracao}}</div>
      </div>
    </div>

    <!-- Parties -->
    <div style="display:grid;grid-template-columns:1fr 40px 1fr;align-items:center;border-top:1px solid rgba(255,255,255,0.08);padding-top:24px;">
      <div>
        <div style="font-size:8.5px;font-weight:500;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.25);margin-bottom:6px;">Parte A</div>
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;color:#fff;">{{nome_parte_a}}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:3px;">Rep.: {{representante_a}}</div>
      </div>
      <div style="text-align:center;font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;font-weight:300;color:#c0392b;line-height:1;">⟷</div>
      <div>
        <div style="font-size:8.5px;font-weight:500;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.25);margin-bottom:6px;">Parte B</div>
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;color:#fff;">{{nome_parte_b}}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:3px;">Rep.: {{representante_b}}</div>
      </div>
    </div>
  </div>

  <!-- BODY -->
  <div style="padding:44px 52px 40px;">

    <!-- Alert banner -->
    <div style="border:1px solid #f1b0a8;background:#fdf3f2;border-radius:3px;padding:14px 18px;display:flex;gap:14px;align-items:flex-start;margin-bottom:36px;">
      <div style="width:18px;height:18px;border-radius:50%;background:#c0392b;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;">
        <span style="color:#fff;font-size:11px;font-weight:700;line-height:1;">!</span>
      </div>
      <div style="font-size:12px;font-weight:300;color:#8b2a20;line-height:1.6;">Este é um acordo juridicamente vinculativo. A divulgação não autorizada de informação confidencial pode resultar em sanções civis e penais nos termos da lei angolana.</div>
    </div>

    ${sectionHead('Âmbito e Objecto', '#c0392b')}
    ${infoGrid([
      ['Negociação em Causa', '{{descricao_negociacao}}'],
      ['Tipo de Informações', '{{tipo_informacoes}}'],
      ['Prazo do Acordo', '{{prazo_acordo}}'],
      ['Câmara de Mediação', '{{camara_mediacao}}'],
      ['Lei Aplicável', '{{lei_aplicavel}}'],
      ['Informações Excluídas', '{{informacoes_excluidas}}'],
    ])}

    <!-- Penalty highlight -->
    <div style="border-left:4px solid #c0392b;background:#fdf3f2;padding:20px 24px;border-radius:0 4px 4px 0;margin-bottom:36px;">
      <div style="font-size:8.5px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:#c0392b;margin-bottom:6px;">Penalidade por Incumprimento</div>
      <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#1c1c1c;">{{valor_penalidade}}</div>
      <div style="font-size:11px;font-weight:300;color:#888;margin-top:4px;">Devido por cada violação confirmada do presente acordo</div>
    </div>

    ${sectionHead('Cláusulas', '#1c1c1c')}

    ${clause('I', 'Definição de Informação Confidencial', 'Toda e qualquer informação, dados, documentos, especificações técnicas, know-how, estratégias comerciais, informações financeiras, planos de negócio, listas de clientes, segredos comerciais e demais informações partilhadas entre as partes, independentemente da forma (oral, escrita, electrónica ou magnética).', '#c0392b')}
    ${clause('II', 'Obrigação de Confidencialidade', 'As Partes obrigam-se a: (a) manter sigilo absoluto; (b) não divulgar, reproduzir, copiar ou distribuir a terceiros sem autorização prévia e escrita; (c) utilizar a informação exclusivamente para os fins deste acordo; (d) restringir o acesso apenas aos colaboradores que necessitem de a conhecer.', '#c0392b')}
    ${clause('III', 'Exclusões', 'Não é considerada confidencial a informação que: (a) seja de domínio público sem violação deste acordo; (b) estivesse na posse legítima da Parte Receptora à data de recepção; (c) seja obtida de terceiros sem restrições de confidencialidade; (d) seja desenvolvida de forma independente.', '#c0392b')}
    ${clause('IV', 'Prazo de Vigência', 'O acordo vigora pelo prazo de {{prazo_acordo}} contado da data de assinatura. As obrigações de confidencialidade previstas nas cláusulas II e V manter-se-ão por um período adicional de 5 (cinco) anos após o término.', '#c0392b')}
    ${clause('V', 'Penalidades', 'A violação de qualquer obrigação de confidencialidade sujeita a Parte infractora ao pagamento de {{valor_penalidade}} por cada ocorrência, sem prejuízo do direito da Parte lesada a exigir perdas e danos e a recorrer a medidas cautelares.', '#c0392b')}
    ${clause('VI', 'Devolução de Informação', 'No término, por qualquer motivo, a Parte Receptora obriga-se a devolver toda a Informação Confidencial, incluindo cópias e extractos, ou a destruí-la mediante confirmação escrita.', '#c0392b')}
    ${clause('VII', 'Propriedade Intelectual', 'Nenhuma disposição deste acordo concede à Parte Receptora qualquer direito de propriedade intelectual ou industrial sobre a Informação Confidencial, que permanece propriedade exclusiva da Parte Divulgadora.', '#c0392b')}
    ${clause('VIII', 'Resolução de Litígios', 'As Partes elegem a {{camara_mediacao}} para resolução de litígios, aplicando-se a {{lei_aplicavel}}. Em caso de recurso a tribunal, elegem o foro da Comarca de Luanda com renúncia a qualquer outro.', '#c0392b')}
    ${clause('IX', 'Disposições Finais', 'Este acordo constitui o entendimento integral sobre a matéria, substituindo acordos anteriores. Qualquer modificação exige forma escrita assinada por ambas as partes. A invalidade de qualquer cláusula não afectará a validade das demais.', '#c0392b')}

    ${sectionHead('Assinaturas', '#1c1c1c')}
    ${signatures('{{nome_parte_a}}','{{nome_parte_b}}','Parte A','Parte B')}
    <div style="margin-top:16px;text-align:right;font-family:'DM Sans',sans-serif;font-size:10px;letter-spacing:0.08em;color:#ccc;text-transform:uppercase;">{{data_celebracao}}</div>
  </div>

  ${footer('NDA-{{referencia}}', 'Página 1 / 1')}
</div>
</body></html>`
  };

  // ─────────────────────────────────────────────────────────────
  // TEMPLATE 3 — ARRENDAMENTO
  // Aesthetic: Warm linen + forest green. Property atlas feel.
  //            Cartographic grid texture in header.
  // ─────────────────────────────────────────────────────────────
  const tmpl_arrendamento = {
    name: 'Contrato de Arrendamento',
    description: 'Arrendamento residencial — design atlas com verde floresta e linho quente',
    category: 'Imobiliário',
    is_system: true,
    fields: [
      { name: 'nome_senhorio',       label: 'Nome do Senhorio',                   type: 'text',  required: true  },
      { name: 'nif_senhorio',        label: 'NIF do Senhorio',                    type: 'text',  required: true  },
      { name: 'nome_arrendatario',   label: 'Nome do Arrendatário',               type: 'text',  required: true  },
      { name: 'nif_arrendatario',    label: 'NIF do Arrendatário',                type: 'text',  required: true  },
      { name: 'morada_imovel',       label: 'Morada do Imóvel',                   type: 'text',  required: true  },
      { name: 'andar',               label: 'Andar',                              type: 'text',  required: false },
      { name: 'fraccao',             label: 'Fracção',                            type: 'text',  required: false },
      { name: 'codigo_postal',       label: 'Código Postal',                      type: 'text',  required: false },
      { name: 'localidade',          label: 'Localidade',                         type: 'text',  required: true  },
      { name: 'area_metros',         label: 'Área (m²)',                          type: 'text',  required: true  },
      { name: 'tipologia',           label: 'Tipologia (T0, T1, T2…)',            type: 'text',  required: true  },
      { name: 'uso_imovel',          label: 'Uso do Imóvel',                      type: 'text',  required: true  },
      { name: 'valor_renda',         label: 'Valor da Renda (Kz)',                type: 'text',  required: true  },
      { name: 'valor_caucao',        label: 'Valor da Caução (Kz)',               type: 'text',  required: true  },
      { name: 'dia_pagamento',       label: 'Dia de Pagamento',                   type: 'text',  required: true  },
      { name: 'valor_condominio',    label: 'Valor do Condomínio (Kz)',           type: 'text',  required: false },
      { name: 'data_inicio',         label: 'Data de Início',                     type: 'date',  required: true  },
      { name: 'duracao_arrendamento',label: 'Duração do Arrendamento',            type: 'text',  required: true  },
      { name: 'renovacao_automatica',label: 'Renovação Automática (Sim/Não)',     type: 'text',  required: false },
      { name: 'prazo_aviso_previo',  label: 'Prazo de Aviso Prévio',             type: 'text',  required: false },
      { name: 'referencia',          label: 'Referência',                         type: 'text',  required: true  },
    ],
    content: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${FONTS}
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
</style></head><body>
<div style="font-family:'DM Sans',sans-serif;max-width:820px;margin:0 auto;background:#fff;border:1px solid #d6d0c4;">

  <!-- HEADER: warm linen background, forest green accents -->
  <div style="background:#f7f3ec;border-bottom:3px solid #1e4a2e;padding:48px 52px 40px;position:relative;overflow:hidden;">
    <!-- Subtle grid overlay (property map feel) -->
    <div style="position:absolute;inset:0;background-image:repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(30,74,46,0.04) 39px,rgba(30,74,46,0.04) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(30,74,46,0.04) 39px,rgba(30,74,46,0.04) 40px);pointer-events:none;"></div>

    <div style="position:relative;z-index:1;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:32px;">
        <div style="display:flex;align-items:center;gap:8px;color:#1e4a2e;">
          ${LOGO_PATH}
          <span style="font-size:10px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#1e4a2e;">Agree</span>
          <span style="color:rgba(30,74,46,0.3);">·</span>
          <span style="font-size:10px;letter-spacing:0.08em;color:rgba(30,74,46,0.4);">ARR-{{referencia}}</span>
        </div>
        <div style="font-size:10px;letter-spacing:0.08em;color:rgba(30,74,46,0.4);text-transform:uppercase;">{{data_inicio}}</div>
      </div>

      <div style="font-size:10px;font-weight:500;letter-spacing:0.22em;text-transform:uppercase;color:#1e4a2e;margin-bottom:8px;">Locação Residencial</div>
      <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:44px;font-weight:300;color:#1a1a1a;letter-spacing:-0.5px;line-height:1.05;margin-bottom:28px;">Contrato de<br>Arrendamento</h1>

      <!-- Property address block -->
      <div style="background:#fff;border:1px solid #d0c9b8;border-left:4px solid #1e4a2e;padding:16px 20px;border-radius:0 3px 3px 0;display:inline-block;min-width:60%;margin-bottom:28px;">
        <div style="font-size:8.5px;font-weight:500;letter-spacing:0.16em;text-transform:uppercase;color:#1e4a2e;margin-bottom:5px;">Imóvel</div>
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;font-weight:400;color:#1a1a1a;">{{morada_imovel}}{{andar}}</div>
        <div style="font-size:11px;color:#888;margin-top:2px;">{{codigo_postal}} {{localidade}} &nbsp;·&nbsp; Frac. {{fraccao}}</div>
      </div>

      <!-- Property tags -->
      <div style="display:flex;gap:8px;">
        <span style="background:#1e4a2e;color:#fff;font-size:9px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;padding:5px 14px;border-radius:2px;">{{area_metros}} m²</span>
        <span style="background:#1e4a2e;color:#fff;font-size:9px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;padding:5px 14px;border-radius:2px;">{{tipologia}}</span>
        <span style="border:1px solid #1e4a2e;color:#1e4a2e;font-size:9px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;padding:5px 14px;border-radius:2px;">{{uso_imovel}}</span>
      </div>
    </div>
  </div>

  <!-- BODY -->
  <div style="padding:44px 52px 40px;">

    <!-- Parties -->
    ${sectionHead('Partes Contratantes', '#1e4a2e')}
    ${infoGrid([
      ['Senhorio', '{{nome_senhorio}}'],
      ['Arrendatário', '{{nome_arrendatario}}'],
      ['NIF Senhorio', '{{nif_senhorio}}'],
      ['NIF Arrendatário', '{{nif_arrendatario}}'],
    ])}

    <!-- Financial summary cards -->
    ${sectionHead('Condições Financeiras', '#1e4a2e')}
    <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:1px;background:#d6d0c4;border:1px solid #d6d0c4;border-radius:4px;overflow:hidden;margin-bottom:36px;">
      <div style="background:#1e4a2e;padding:20px 22px;">
        <div style="font-size:8.5px;font-weight:500;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:6px;">Renda Mensal</div>
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:300;color:#fff;line-height:1;">{{valor_renda}}</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:4px;">até ao dia {{dia_pagamento}} de cada mês</div>
      </div>
      <div style="background:#f7f3ec;padding:20px 18px;">
        <div style="font-size:8.5px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:#aaa;margin-bottom:6px;">Caução</div>
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:400;color:#1a1a1a;">{{valor_caucao}}</div>
      </div>
      <div style="background:#f7f3ec;padding:20px 18px;">
        <div style="font-size:8.5px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:#aaa;margin-bottom:6px;">Condomínio</div>
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:400;color:#1a1a1a;">{{valor_condominio}}</div>
      </div>
      <div style="background:#f7f3ec;padding:20px 18px;">
        <div style="font-size:8.5px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:#aaa;margin-bottom:6px;">Duração</div>
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:400;color:#1a1a1a;">{{duracao_arrendamento}}</div>
        <div style="font-size:10px;color:#aaa;margin-top:3px;">Renov.: {{renovacao_automatica}}</div>
      </div>
    </div>

    ${sectionHead('Cláusulas Contratuais', '#1e4a2e')}

    ${clause('I', 'Objecto', 'O SENHORIO dá de arrendamento ao ARRENDATÁRIO, que aceita, o imóvel identificado neste instrumento para fins de {{uso_imovel}}, obrigando-se o ARRENDATÁRIO a usá-lo com a diligência de um bom pai de família, nos termos do artigo 1.062.º e seguintes do Código Civil Angolano.', '#1e4a2e')}
    ${clause('II', 'Renda e Pagamento', 'O ARRENDATÁRIO obriga-se a pagar a renda de {{valor_renda}} até ao dia {{dia_pagamento}} de cada mês por depósito bancário ou transferência para conta indicada pelo SENHORIO. O atraso confere ao SENHORIO o direito de exigir juros de mora e constitui fundamento de rescisão.', '#1e4a2e')}
    ${clause('III', 'Caução', 'No acto de assinatura, o ARRENDATÁRIO entrega ao SENHORIO {{valor_caucao}} a título de caução, restituível no término, após dedução de eventuais danos ou rendas em atraso.', '#1e4a2e')}
    ${clause('IV', 'Despesas e Encargos', 'Responsabilidade do SENHORIO: Imposto de Selo, IMI e seguros. Responsabilidade do ARRENDATÁRIO: facturas de água, electricidade, gás, comunicações e condomínio ({{valor_condominio}}).', '#1e4a2e')}
    ${clause('V', 'Conservação e Reparações', 'Reparações ordinárias e pequenas conservações: ARRENDATÁRIO. Reparações extraordinárias, estruturais ou que afectem a habitabilidade: SENHORIO. Obras de alteração carecem de autorização prévia e escrita do SENHORIO.', '#1e4a2e')}
    ${clause('VI', 'Subarrendamento e Cessão', 'O ARRENDATÁRIO não poderá subarrendar, ceder ou emprestar o imóvel, nem dar-lhe destino diverso do estipulado, sem autorização prévia e escrita do SENHORIO, sob pena de rescisão imediata.', '#1e4a2e')}
    ${clause('VII', 'Prazo e Renovação', 'O contrato é celebrado por {{duracao_arrendamento}}, com início em {{data_inicio}}. Renovação: {{renovacao_automatica}}. O valor da renda será actualizado pelo índice de preços ao consumidor. Denúncia: aviso prévio de {{prazo_aviso_previo}}.', '#1e4a2e')}
    ${clause('VIII', 'Rescisão', 'Fundamentos de rescisão pelo SENHORIO: (a) falta de pagamento por mais de 3 meses; (b) utilização ilícita; (c) subarrendamento não autorizado; (d) danos graves. O ARRENDATÁRIO pode rescindir com o aviso prévio acordado.', '#1e4a2e')}
    ${clause('IX', 'Foro', 'Para resolução de litígios, as partes elegem o foro da Comarca da situação do imóvel, com renúncia a qualquer outro, aplicando-se o Código Civil Angolano e a Lei de Arrendamento Urbano em vigor.', '#1e4a2e')}
    ${clause('X', 'Disposições Finais', 'Este contrato constitui o integral acordo entre as partes. Qualquer alteração exige forma escrita assinada por ambas as partes. As partes elegem o foro indicado para resolução de quaisquer litígios.', '#1e4a2e')}

    ${sectionHead('Assinaturas', '#1e4a2e')}
    ${signatures('{{nome_senhorio}}','{{nome_arrendatario}}','Senhorio','Arrendatário')}
    <div style="margin-top:16px;text-align:right;font-family:'DM Sans',sans-serif;font-size:10px;letter-spacing:0.08em;color:#ccc;text-transform:uppercase;">{{data_inicio}}</div>
  </div>

  ${footer('ARR-{{referencia}}', 'Página 1 / 1')}
</div>
</body></html>`
  };

  // ─────────────────────────────────────────────────────────────
  // TEMPLATE 4 — CONTRATO DE TRABALHO
  // Aesthetic: Corporate white with bold cardinal red stripe.
  //            Structured HR form. Data-dense header dashboard.
  // ─────────────────────────────────────────────────────────────
  const tmpl_trabalho = {
    name: 'Contrato de Trabalho Sem Termo',
    description: 'Contrato laboral sem termo — design corporativo branco com acento carmim estruturado',
    category: 'Recursos Humanos',
    is_system: true,
    fields: [
      { name: 'nome_empresa',        label: 'Nome da Empresa',              type: 'text',  required: true  },
      { name: 'nif_empresa',         label: 'NIF da Empresa',               type: 'text',  required: true  },
      { name: 'nome_colaborador',    label: 'Nome do Colaborador',          type: 'text',  required: true  },
      { name: 'nif_colaborador',     label: 'NIF do Colaborador',           type: 'text',  required: true  },
      { name: 'numero_contrato',     label: 'Número do Contrato',           type: 'text',  required: true  },
      { name: 'funcao_cargo',        label: 'Função / Cargo',               type: 'text',  required: true  },
      { name: 'data_admissao',       label: 'Data de Admissão',             type: 'date',  required: true  },
      { name: 'salario_base',        label: 'Salário Base (Kz)',            type: 'text',  required: true  },
      { name: 'jornada_trabalho',    label: 'Jornada de Trabalho',          type: 'text',  required: true  },
      { name: 'local_trabalho',      label: 'Local de Trabalho',            type: 'text',  required: true  },
      { name: 'periodo_experiencia', label: 'Período de Experiência',       type: 'text',  required: false },
      { name: 'subsidio_alimentacao',label: 'Subsídio de Alimentação (Kz)', type: 'text',  required: false },
      { name: 'dias_ferias',         label: 'Dias de Férias',               type: 'text',  required: false },
    ],
    content: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${FONTS}
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
</style></head><body>
<div style="font-family:'DM Sans',sans-serif;max-width:820px;margin:0 auto;background:#fff;border:1px solid #e0dbd8;">

  <!-- HEADER: white with cardinal red top stripe + bold typography -->
  <div style="padding:0 52px;background:#fff;border-bottom:1px solid #eee;">
    <!-- Cardinal stripe -->
    <div style="height:5px;background:#b92c1b;margin:0 -52px 0;"></div>

    <div style="padding-top:32px;padding-bottom:28px;">
      <!-- Top row -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:28px;">
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
            <div style="color:#b92c1b;">${LOGO_PATH}</div>
            <span style="font-size:10px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#b92c1b;">Agree</span>
          </div>
          <div style="font-size:10px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#b92c1b;margin-bottom:4px;">{{nome_empresa}}</div>
          <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:38px;font-weight:300;color:#1a1a1a;letter-spacing:-0.5px;line-height:1.1;">Contrato de Trabalho</h1>
          <div style="font-size:12px;font-weight:300;color:#aaa;margin-top:4px;letter-spacing:0.04em;">Sem Termo · Tempo Completo</div>
        </div>
        <div style="text-align:right;">
          <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:52px;font-weight:300;color:#f0ece8;line-height:1;letter-spacing:-2px;">{{numero_contrato}}</div>
          <div style="font-size:8.5px;font-weight:500;letter-spacing:0.16em;text-transform:uppercase;color:#ccc;margin-top:-4px;">Nº Contrato</div>
        </div>
      </div>

      <!-- Dashboard strip -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;border:1px solid #e8e4e0;border-radius:4px;overflow:hidden;">
        <div style="padding:14px 18px;border-right:1px solid #e8e4e0;">
          <div style="font-size:8.5px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-bottom:4px;">Colaborador</div>
          <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:400;color:#1a1a1a;">{{nome_colaborador}}</div>
        </div>
        <div style="padding:14px 18px;border-right:1px solid #e8e4e0;">
          <div style="font-size:8.5px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-bottom:4px;">Cargo</div>
          <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:400;color:#1a1a1a;">{{funcao_cargo}}</div>
        </div>
        <div style="padding:14px 18px;background:#b92c1b;">
          <div style="font-size:8.5px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.55);margin-bottom:4px;">Admissão</div>
          <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:400;color:#fff;">{{data_admissao}}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- BODY -->
  <div style="padding:44px 52px 40px;">

    ${sectionHead('Identificação das Partes', '#b92c1b')}
    ${infoGrid([
      ['Empresa (Entidade Patronal)', '{{nome_empresa}}'],
      ['Colaborador (Trabalhador)', '{{nome_colaborador}}'],
      ['NIF Empresa', '{{nif_empresa}}'],
      ['NIF Colaborador', '{{nif_colaborador}}'],
    ])}

    ${sectionHead('Condições de Trabalho', '#b92c1b')}
    <!-- Salary hero -->
    <div style="border-left:4px solid #b92c1b;background:#fdf4f3;padding:20px 24px;border-radius:0 4px 4px 0;margin-bottom:24px;">
      <div style="font-size:8.5px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:#b92c1b;margin-bottom:6px;">Salário Base Mensal</div>
      <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:32px;font-weight:400;color:#1a1a1a;">{{salario_base}}</div>
    </div>
    ${infoGrid([
      ['Jornada de Trabalho', '{{jornada_trabalho}}'],
      ['Local de Trabalho', '{{local_trabalho}}'],
      ['Período de Experiência', '{{periodo_experiencia}}'],
      ['Subsídio de Alimentação', '{{subsidio_alimentacao}}'],
      ['Dias de Férias', '{{dias_ferias}} dias'],
      ['NIF da Empresa', '{{nif_empresa}}'],
    ])}

    ${sectionHead('Cláusulas Contratuais', '#b92c1b')}

    ${clause('I', 'Funções', 'O COLABORADOR exercerá as funções de {{funcao_cargo}}, no quadro da Empresa, sob ordens e direcção desta, com a diligência e lealdade exigidas por lei, nos termos do artigo 220.º e seguintes da Lei Geral do Trabalho (Lei n.º 7/15 de 15 de Junho).', '#b92c1b')}
    ${clause('II', 'Duração', 'O contrato celebra-se por tempo indeterminado, nos termos do artigo 35.º da Lei Geral do Trabalho, produzindo efeitos a partir de {{data_admissao}}.', '#b92c1b')}
    ${clause('III', 'Remuneração e Prestações', 'A Empresa pagará ao Colaborador a remuneração base mensal de {{salario_base}}, subsídio de alimentação de {{subsidio_alimentacao}}, e demais prestações legais. O pagamento é efectuado até ao último dia útil de cada mês por transferência bancária.', '#b92c1b')}
    ${clause('IV', 'Horário e Local de Trabalho', 'O Colaborador cumpre a jornada de {{jornada_trabalho}} no local sito em {{local_trabalho}}. Horário e local poderão ser alterados por necessidade de serviço com aviso prévio de 30 dias, nos termos do artigo 97.º da LGT.', '#b92c1b')}
    ${clause('V', 'Período de Experiência', 'O contrato fica sujeito a período de experiência de {{periodo_experiencia}}, durante o qual qualquer das partes pode resolvê-lo sem aviso prévio nem indemnização, nos termos do artigo 36.º da LGT.', '#b92c1b')}
    ${clause('VI', 'Férias e Ausências', 'O Colaborador tem direito a {{dias_ferias}} dias úteis de férias em cada ano civil, nos termos do artigo 184.º e ss. da LGT, com retribuição acrescida de subsídio de férias.', '#b92c1b')}
    ${clause('VII', 'Deveres do Colaborador', 'O Colaborador obriga-se a: (a) cumprir ordens e instruções; (b) guardar lealdade; (c) não divulgar informações confidenciais; (d) zelar pelos equipamentos e instalações; (e) manter sigilo profissional mesmo após cessação do contrato.', '#b92c1b')}
    ${clause('VIII', 'Deveres da Empresa', 'A Empresa obriga-se a: (a) pagar pontualmente a remuneração; (b) proporcionar condições de trabalho seguras; (c) cumprir obrigações legais perante a segurança social e seguros; (d) respeitar a dignidade e os direitos do Colaborador.', '#b92c1b')}
    ${clause('IX', 'Denúncia e Rescisão', 'A Empresa comunica a denúncia com 60 dias de aviso prévio; o Colaborador com 30 dias. A rescisão por justa causa segue o regime dos artigos 47.º a 49.º da LGT.', '#b92c1b')}
    ${clause('X', 'Foro e Legislação Aplicável', 'Aplica-se a Lei Geral do Trabalho angolana (Lei n.º 7/15 de 15 de Junho). Para litígios, as partes elegem o Tribunal de Trabalho da Comarca de Luanda, com renúncia a qualquer outro.', '#b92c1b')}

    ${sectionHead('Assinaturas', '#b92c1b')}
    ${signatures('{{nome_empresa}}','{{nome_colaborador}}','Empregador','Colaborador')}
    <div style="margin-top:16px;text-align:right;font-family:'DM Sans',sans-serif;font-size:10px;letter-spacing:0.08em;color:#ccc;text-transform:uppercase;">{{data_admissao}}</div>
  </div>

  ${footer('CT-{{numero_contrato}}', 'Página 1 / 1')}
</div>
</body></html>`
  };

  // ─────────────────────────────────────────────────────────────
  // TEMPLATE 5 — PRESTAÇÃO DE SERVIÇOS
  // Aesthetic: Warm off-white editorial. Rich espresso brown.
  //            Magazine masthead energy. Deliverables as
  //            numbered editorial cards.
  // ─────────────────────────────────────────────────────────────
  const tmpl_servicos = {
    name: 'Prestação de Serviços e Consultoria',
    description: 'Contrato de serviços e consultoria — design editorial espresso com energia de masthead',
    category: 'Serviços',
    is_system: true,
    fields: [
      { name: 'nome_empresa',                 label: 'Nome da Empresa',                      type: 'text',     required: true  },
      { name: 'numero_contrato',              label: 'Número do Contrato',                   type: 'text',     required: true  },
      { name: 'titulo_servico',               label: 'Título do Serviço',                    type: 'text',     required: true  },
      { name: 'especialidade',                label: 'Especialidade',                        type: 'text',     required: true  },
      { name: 'nome_contratante',             label: 'Nome do Contratante',                  type: 'text',     required: true  },
      { name: 'nif_contratante',              label: 'NIF do Contratante',                   type: 'text',     required: true  },
      { name: 'nome_prestador',               label: 'Nome do Prestador',                    type: 'text',     required: true  },
      { name: 'nif_prestador',               label: 'NIF do Prestador',                     type: 'text',     required: true  },
      { name: 'descricao_detalhada_servico',  label: 'Descrição Detalhada do Serviço',       type: 'textarea', required: true  },
      { name: 'honorarios',                   label: 'Honorários (Kz)',                      type: 'text',     required: true  },
      { name: 'forma_pagamento',              label: 'Forma de Pagamento',                   type: 'text',     required: true  },
      { name: 'periodicidade_faturacao',      label: 'Periodicidade de Facturação',          type: 'text',     required: false },
      { name: 'prazo_execucao',               label: 'Prazo de Execução',                    type: 'text',     required: true  },
      { name: 'local_prestacao',              label: 'Local de Prestação',                   type: 'text',     required: true  },
      { name: 'indice_reajuste',              label: 'Índice de Reajuste',                   type: 'text',     required: false },
      { name: 'lista_entregaveis',            label: 'Lista de Entregáveis',                 type: 'textarea', required: true  },
      { name: 'propriedade_intelectual',      label: 'Propriedade Intelectual',              type: 'text',     required: true  },
      { name: 'clausula_exclusividade',       label: 'Cláusula de Exclusividade',            type: 'text',     required: false },
      { name: 'data_celebracao',              label: 'Data de Celebração',                   type: 'date',     required: true  },
    ],
    content: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${FONTS}
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
</style></head><body>
<div style="font-family:'DM Sans',sans-serif;max-width:820px;margin:0 auto;background:#fff;border:1px solid #ddd8d0;">

  <!-- HEADER: editorial masthead style, espresso brown -->
  <div style="background:#2c1a0e;padding:44px 52px 0;position:relative;overflow:hidden;">
    <!-- Abstract editorial geometry -->
    <div style="position:absolute;right:-20px;top:-20px;width:280px;height:280px;border-radius:50%;background:rgba(255,255,255,0.02);"></div>
    <div style="position:absolute;right:40px;top:30px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,0.015);"></div>

    <div style="position:relative;z-index:1;">
      <!-- Agree mark -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;">
        <div style="display:flex;align-items:center;gap:8px;color:rgba(255,255,255,0.4);">
          <div style="color:rgba(255,255,255,0.5);">${LOGO_PATH}</div>
          <span style="font-size:10px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.35);">Agree</span>
        </div>
        <div style="font-size:10px;letter-spacing:0.08em;color:rgba(255,255,255,0.2);text-transform:uppercase;">{{data_celebracao}}</div>
      </div>

      <!-- Company + Contract number -->
      <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:8px;">
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:42px;font-weight:300;color:#fff;letter-spacing:-1px;line-height:1;">{{nome_empresa}}</div>
        <div style="text-align:right;">
          <div style="font-size:8.5px;font-weight:500;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.25);margin-bottom:3px;">Documento</div>
          <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:rgba(255,255,255,0.6);">{{numero_contrato}}</div>
        </div>
      </div>

      <!-- Divider line -->
      <div style="height:1px;background:rgba(255,255,255,0.1);margin-bottom:16px;"></div>

      <!-- Service title -->
      <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-weight:400;color:rgba(255,255,255,0.85);letter-spacing:0;line-height:1.2;margin-bottom:4px;">{{titulo_servico}}</h1>
      <div style="font-size:10px;font-weight:500;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:28px;">{{especialidade}}</div>

      <!-- Parties bar -->
      <div style="display:grid;grid-template-columns:1fr 1px 1fr;border-top:1px solid rgba(255,255,255,0.08);">
        <div style="padding:18px 0;">
          <div style="font-size:8.5px;font-weight:500;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.25);margin-bottom:5px;">Contratante</div>
          <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;color:#fff;">{{nome_contratante}}</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.3);margin-top:2px;">NIF {{nif_contratante}}</div>
        </div>
        <div style="background:rgba(255,255,255,0.07);"></div>
        <div style="padding:18px 0 18px 28px;">
          <div style="font-size:8.5px;font-weight:500;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.25);margin-bottom:5px;">Prestador</div>
          <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;color:#fff;">{{nome_prestador}}</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.3);margin-top:2px;">NIF {{nif_prestador}}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- BODY -->
  <div style="padding:44px 52px 40px;">

    ${sectionHead('Descrição do Serviço', '#2c1a0e')}
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:300;line-height:1.75;color:#444;margin-bottom:32px;padding:20px 22px;background:#faf8f5;border-radius:4px;">{{descricao_detalhada_servico}}</div>

    <!-- Honorários + conditions -->
    ${sectionHead('Honorários e Condições', '#2c1a0e')}
    <div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:1px;background:#ddd8d0;border:1px solid #ddd8d0;border-radius:4px;overflow:hidden;margin-bottom:32px;">
      <div style="background:#2c1a0e;padding:20px 24px;">
        <div style="font-size:8.5px;font-weight:500;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:6px;">Honorários</div>
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:30px;font-weight:300;color:#fff;line-height:1;">{{honorarios}}</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.35);margin-top:6px;">{{periodicidade_faturacao}} · {{forma_pagamento}}</div>
      </div>
      <div style="background:#faf8f5;padding:20px 18px;">
        <div style="font-size:8.5px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:#aaa;margin-bottom:6px;">Prazo de Execução</div>
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;font-weight:400;color:#1a1a1a;">{{prazo_execucao}}</div>
      </div>
      <div style="background:#faf8f5;padding:20px 18px;">
        <div style="font-size:8.5px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:#aaa;margin-bottom:6px;">Local de Prestação</div>
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;font-weight:400;color:#1a1a1a;">{{local_prestacao}}</div>
      </div>
    </div>

    ${sectionHead('Entregáveis', '#2c1a0e')}
    <div style="background:#faf8f5;border:1px solid #e8e4dc;border-radius:4px;padding:20px 22px;margin-bottom:32px;">
      <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:300;line-height:1.75;color:#444;">{{lista_entregaveis}}</div>
    </div>

    ${sectionHead('Cláusulas Contratuais', '#2c1a0e')}

    ${clause('I', 'Objecto', 'O PRESTADOR obriga-se a executar os serviços descritos com a melhor técnica, autonomia de gestão e meios próprios, sem qualquer vínculo laboral ou de subordinação hierárquica com o CONTRATANTE, nos termos do artigo 1.154.º do Código Civil Angolano.', '#2c1a0e')}
    ${clause('II', 'Obrigações do Prestador', 'O PRESTADOR obriga-se a: (a) executar com qualidade nos prazos acordados; (b) apresentar relatórios periódicos; (c) utilizar os melhores padrões técnicos; (d) manter sigilo profissional; (e) afectar os recursos necessários ao bom cumprimento.', '#2c1a0e')}
    ${clause('III', 'Obrigações do Contratante', 'O CONTRATANTE obriga-se a: (a) fornecer informação e colaboração necessárias; (b) pagar os honorários nos prazos estabelecidos; (c) disponibilizar acessos a locais e sistemas; (d) designar um interlocutor para comunicação.', '#2c1a0e')}
    ${clause('IV', 'Honorários e Facturação', 'Pelos serviços, o CONTRATANTE pagará {{honorarios}}, com {{periodicidade_faturacao}}, mediante factura legal. Pagamento por {{forma_pagamento}} em 30 dias após emissão. O atraso confere ao PRESTADOR o direito de suspender os serviços e exigir juros de mora.', '#2c1a0e')}
    ${clause('V', 'Prazo e Execução', 'Os serviços serão executados no prazo de {{prazo_execucao}} contado da assinatura, em {{local_prestacao}}. O PRESTADOR apresentará os entregáveis descritos para aprovação do CONTRATANTE.', '#2c1a0e')}
    ${clause('VI', 'Propriedade Intelectual', 'Os direitos de propriedade intelectual sobre os resultados dos serviços, incluindo relatórios, estudos, software e entregáveis, serão de {{propriedade_intelectual}}, nos termos da Lei dos Direitos de Autor angolana.', '#2c1a0e')}
    ${clause('VII', 'Confidencialidade', 'As partes mantêm sigilo sobre toda a informação comercial, técnica ou financeira partilhada, durante a vigência do contrato e por 5 (cinco) anos após o seu término.', '#2c1a0e')}
    ${clause('VIII', 'Exclusividade', '{{clausula_exclusividade}}', '#2c1a0e')}
    ${clause('IX', 'Rescisão', 'Qualquer das partes pode resolver o contrato com 30 dias de aviso prévio, salvo incumprimento grave que justifique rescisão imediata. Constituem incumprimento grave: atraso reiterado no pagamento, execução defeituosa, ou violação do dever de confidencialidade.', '#2c1a0e')}
    ${clause('X', 'Foro e Lei Aplicável', 'O contrato é regulado pela lei angolana. Para litígios, as partes elegem o foro da Comarca de Luanda, com renúncia a qualquer outro, aplicando-se o Código Civil Angolano e demais legislação aplicável.', '#2c1a0e')}

    ${sectionHead('Assinaturas', '#2c1a0e')}
    ${signatures('{{nome_contratante}}','{{nome_prestador}}','Contratante','Prestador')}
    <div style="margin-top:16px;text-align:right;font-family:'DM Sans',sans-serif;font-size:10px;letter-spacing:0.08em;color:#ccc;text-transform:uppercase;">{{data_celebracao}}</div>
  </div>

  ${footer('PS-{{numero_contrato}}', 'Página 1 / 1')}
</div>
</body></html>`
  };

  // ─────────────────────────────────────────────────────────────
  // INSERT ALL TEMPLATES
  // ─────────────────────────────────────────────────────────────
  console.log('\n📝 Inserindo modelos premium redesenhados...');
  await supabase.from('contract_templates').delete().eq('is_system', true);

  const templates = [tmpl_compraVenda, tmpl_nda, tmpl_arrendamento, tmpl_trabalho, tmpl_servicos];

  const { error: insertError } = await supabase
    .from('contract_templates')
    .insert(templates.map(t => ({ ...t, variables: [] })));

  if (insertError) {
    console.error('  ⚠️  Tentando inserção individual...');
    for (const t of templates) {
      const { error } = await supabase.from('contract_templates').insert({ ...t, variables: [] });
      if (error) console.error(`  ❌ "${t.name}":`, error.message);
      else console.log(`  ✅ "${t.name}" inserido`);
    }
  } else {
    console.log(`  ✅ ${templates.length} templates premium inseridos com sucesso`);
  }

  console.log('\n✅ Setup completo! Templates com design premium activos.');
}

setup().catch(console.error);