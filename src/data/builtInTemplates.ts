// GENERATED FILE — DO NOT EDIT DIRECTLY
// Templates embedded directly in code to avoid Supabase dependency

export interface BuiltInTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  fields: { name: string; label: string; type: string; required: boolean }[];
  is_system: boolean;
}

export const BUILT_IN_TEMPLATES: BuiltInTemplate[] = [

  {
    id: 'built-in-1',
    name: 'Contrato de Compra e Venda',
    description: 'Contrato comercial de compra e venda — design luxury navy com acento dourado',
    category: 'Comercial',
    content: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
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
          <div style="color:#c9a84c;"><svg width="20" height="20" viewBox="0 0 2000 2000" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0,2000) scale(0.1,-0.1)"><path d="M9810 17311 c-80 -26 -154 -80 -199 -145 -35 -51 -6334 -13066 -6351 -13122 -20 -67 -9 -189 23 -255 33 -68 97 -135 168 -174 51 -28 60 -30 164 -30 l110 1 2138 797 c1176 438 2152 804 2170 813 57 30 95 64 130 117 30 45 314 617 1328 2674 126 254 248 513 272 575 62 158 161 376 262 578 550 1099 1323 2052 2295 2831 85 69 199 156 252 194 54 39 98 73 98 77 0 4 -550 1112 -1222 2463 -1341 2697 -1246 2518 -1373 2581 -51 25 -73 29 -150 31 -49 1 -101 -1 -115 -6z" fill="currentColor"/><path d="M12592 11764 c-114 -115 -264 -275 -333 -355 -854 -1001 -1414 -2184 -1539 -3254 -6 -49 -14 -178 -17 -285 l-6 -196 538 -1059 c295 -583 567 -1118 603 -1190 78 -154 134 -220 220 -258 159 -70 4221 -1570 4279 -1580 160 -28 332 76 392 238 25 66 28 170 7 236 -13 43 -3909 7885 -3926 7903 -5 5 -99 -81 -218 -200z" fill="currentColor"/></g></svg></div>
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

    <div style="display:flex;align-items:center;gap:12px;margin:36px 0 16px;">
  <div style="width:3px;height:16px;background:#c9a84c;border-radius:2px;flex-shrink:0;"></div>
  <span style="font-family:'DM Sans',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#c9a84c;">Objecto e Condições</span>
</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px 36px;margin-bottom:28px;">
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-bottom:4px;">Quantidade</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{quantidade}}</div>
  </div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-bottom:4px;">Preço Unitário</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{preco_unitario}}</div>
  </div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-bottom:4px;">Modalidade de Pagamento</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{modalidade_pagamento}}</div>
  </div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-bottom:4px;">Data de Entrega</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{data_entrega}}</div>
  </div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-bottom:4px;">Período de Garantia</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{periodo_garantia}}</div>
  </div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-bottom:4px;">Comarca / Foro</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{comarca_foro}}</div>
  </div></div>

    <div style="display:flex;align-items:center;gap:12px;margin:36px 0 16px;">
  <div style="width:3px;height:16px;background:#0b1f38;border-radius:2px;flex-shrink:0;"></div>
  <span style="font-family:'DM Sans',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#0b1f38;">Cláusulas Contratuais</span>
</div>

    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#c9a84c;line-height:1.2;padding-top:2px;text-align:right;">I</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Objecto</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">O VENDEDOR vende ao COMPRADOR, que aceita e adquire, o bem identificado no presente contrato, livre de quaisquer ónus, encargos ou restrições à propriedade, nos termos do artigo 874.º e seguintes do Código Civil Angolano.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#c9a84c;line-height:1.2;padding-top:2px;text-align:right;">II</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Preço e Pagamento</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">O pagamento do preço será efectuado na modalidade acordada, comprovando-se mediante recibo ou transferência bancária. O atraso superior a 15 (quinze) dias confere ao VENDEDOR o direito de exigir juros de mora à taxa legal vigente na República de Angola.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#c9a84c;line-height:1.2;padding-top:2px;text-align:right;">III</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Entrega</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">A entrega ocorrerá em {{data_entrega}}, no local designado pelas partes. Todas as despesas de transporte e seguros até à efectiva entrega são da responsabilidade do VENDEDOR. O risco transfere-se para o COMPRADOR com a assinatura do auto de entrega.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#c9a84c;line-height:1.2;padding-top:2px;text-align:right;">IV</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Garantia</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">O VENDEDOR garante o bem pelo período de {{periodo_garantia}} contado da data de entrega, contra defeitos de fabrico, concepção ou funcionamento, obrigando-se a reparar ou substituir, a suas expensas, qualquer componente com defeito não imputável a uso indevido.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#c9a84c;line-height:1.2;padding-top:2px;text-align:right;">V</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Obrigações das Partes</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">O VENDEDOR obriga-se a: (a) entregar o bem nas condições acordadas; (b) prestar assistência técnica durante a garantia; (c) garantir a plena propriedade do bem. O COMPRADOR obriga-se a: (a) pagar o preço no prazo acordado; (b) receber o bem; (c) não ceder direitos sem autorização prévia.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#c9a84c;line-height:1.2;padding-top:2px;text-align:right;">VI</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Rescisão</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">Qualquer das partes poderá rescindir o contrato por: (a) incumprimento grave e reiterado; (b) declaração de insolvência; (c) impossibilidade superveniente. A rescisão deve ser comunicada por escrito com mínimo de 30 (trinta) dias de antecedência.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#c9a84c;line-height:1.2;padding-top:2px;text-align:right;">VII</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Confidencialidade</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">As partes mantêm sigilo absoluto sobre todas as informações comerciais, técnicas e financeiras partilhadas no âmbito deste contrato, durante a sua vigência e por 5 (cinco) anos após o seu término.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#c9a84c;line-height:1.2;padding-top:2px;text-align:right;">VIII</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Força Maior</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">Nenhuma das partes será responsabilizada por incumprimento ou atraso resultante de catástrofes naturais, greves, actos de guerra, terrorismo ou medidas governamentais que obstem objectivamente à execução do contrato.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#c9a84c;line-height:1.2;padding-top:2px;text-align:right;">IX</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Foro e Lei Aplicável</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">Para resolução de litígios, as partes elegem o foro da Comarca de {{comarca_foro}}, com renúncia a qualquer outro, aplicando-se a lei angolana nos termos do Código Civil Angolano e demais legislação aplicável.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#c9a84c;line-height:1.2;padding-top:2px;text-align:right;">X</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Disposições Finais</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">Este instrumento constitui o integral acordo entre as partes, substituindo todos os entendimentos anteriores. Qualquer alteração só será válida se reduzida a escrito e assinada por ambas as partes. A nulidade de qualquer cláusula não afectará a validade das demais.</div>
  </div>
</div>

    <div style="display:flex;align-items:center;gap:12px;margin:36px 0 16px;">
  <div style="width:3px;height:16px;background:#0b1f38;border-radius:2px;flex-shrink:0;"></div>
  <span style="font-family:'DM Sans',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#0b1f38;">Assinaturas</span>
</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:52px;margin-top:40px;"><div>
  <div style="height:52px;border-bottom:1px solid #ccc;margin-bottom:10px;"></div>
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;font-weight:400;">{{nome_vendedor}}</div>
  <div style="font-family:'DM Sans',sans-serif;font-size:9px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-top:3px;">Vendedor</div>
</div><div>
  <div style="height:52px;border-bottom:1px solid #ccc;margin-bottom:10px;"></div>
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;font-weight:400;">{{nome_comprador}}</div>
  <div style="font-family:'DM Sans',sans-serif;font-size:9px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-top:3px;">Comprador</div>
</div></div>

    <div style="margin-top:16px;text-align:right;font-family:'DM Sans',sans-serif;font-size:10px;letter-spacing:0.08em;color:#ccc;text-transform:uppercase;">{{data_celebracao}}</div>
  </div>

  
<footer style="display:flex;align-items:center;justify-content:space-between;padding:18px 52px;border-top:1px solid rgba(0,0,0,0.08);margin-top:0;">
  <div style="display:flex;align-items:center;gap:8px;opacity:0.35;">
    <svg width="20" height="20" viewBox="0 0 2000 2000" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0,2000) scale(0.1,-0.1)"><path d="M9810 17311 c-80 -26 -154 -80 -199 -145 -35 -51 -6334 -13066 -6351 -13122 -20 -67 -9 -189 23 -255 33 -68 97 -135 168 -174 51 -28 60 -30 164 -30 l110 1 2138 797 c1176 438 2152 804 2170 813 57 30 95 64 130 117 30 45 314 617 1328 2674 126 254 248 513 272 575 62 158 161 376 262 578 550 1099 1323 2052 2295 2831 85 69 199 156 252 194 54 39 98 73 98 77 0 4 -550 1112 -1222 2463 -1341 2697 -1246 2518 -1373 2581 -51 25 -73 29 -150 31 -49 1 -101 -1 -115 -6z" fill="currentColor"/><path d="M12592 11764 c-114 -115 -264 -275 -333 -355 -854 -1001 -1414 -2184 -1539 -3254 -6 -49 -14 -178 -17 -285 l-6 -196 538 -1059 c295 -583 567 -1118 603 -1190 78 -154 134 -220 220 -258 159 -70 4221 -1570 4279 -1580 160 -28 332 76 392 238 25 66 28 170 7 236 -13 43 -3909 7885 -3926 7903 -5 5 -99 -81 -218 -200z" fill="currentColor"/></g></svg>
    <span style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;">Agree</span>
  </div>
  <div style="font-family:'DM Sans',sans-serif;font-size:10px;letter-spacing:0.06em;opacity:0.3;text-transform:uppercase;display:flex;gap:24px;">
    <span>Ref: {{referencia}}</span><span>Página 1 / 1</span>
  </div>
</footer>
</div>
</body></html>`,
    fields: [
      { name: 'nome_vendedor', label: 'Nome do Vendedor', type: 'text', required: true },
      { name: 'nif_vendedor', label: 'NIF do Vendedor', type: 'text', required: true },
      { name: 'nome_comprador', label: 'Nome do Comprador', type: 'text', required: true },
      { name: 'nif_comprador', label: 'NIF do Comprador', type: 'text', required: true },
      { name: 'referencia', label: 'Referência', type: 'text', required: true },
      { name: 'descricao_bem', label: 'Descrição do Bem', type: 'textarea', required: true },
      { name: 'quantidade', label: 'Quantidade', type: 'text', required: true },
      { name: 'preco_unitario', label: 'Preço Unitário (Kz)', type: 'text', required: true },
      { name: 'valor_total', label: 'Valor Total (Kz)', type: 'text', required: true },
      { name: 'modalidade_pagamento', label: 'Modalidade de Pagamento', type: 'text', required: true },
      { name: 'data_celebracao', label: 'Data de Celebração', type: 'date', required: true },
      { name: 'data_entrega', label: 'Data de Entrega', type: 'date', required: true },
      { name: 'periodo_garantia', label: 'Período de Garantia', type: 'text', required: false },
      { name: 'comarca_foro', label: 'Comarca / Foro', type: 'text', required: true },
    ],
    is_system: true,
  },

  {
    id: 'built-in-2',
    name: 'Acordo de Confidencialidade (NDA)',
    description: 'NDA bilateral — design confidencial charcoal com acento carmesim',
    category: 'Confidencialidade',
    content: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
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

    <div style="display:flex;align-items:center;gap:12px;margin:36px 0 16px;">
  <div style="width:3px;height:16px;background:#c0392b;border-radius:2px;flex-shrink:0;"></div>
  <span style="font-family:'DM Sans',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#c0392b;">Âmbito e Objecto</span>
</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px 36px;margin-bottom:28px;">
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-bottom:4px;">Negociação em Causa</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{descricao_negociacao}}</div>
  </div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-bottom:4px;">Tipo de Informações</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{tipo_informacoes}}</div>
  </div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-bottom:4px;">Prazo do Acordo</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{prazo_acordo}}</div>
  </div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-bottom:4px;">Câmara de Mediação</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{camara_mediacao}}</div>
  </div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-bottom:4px;">Lei Aplicável</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{lei_aplicavel}}</div>
  </div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-bottom:4px;">Informações Excluídas</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{informacoes_excluidas}}</div>
  </div></div>

    <!-- Penalty highlight -->
    <div style="border-left:4px solid #c0392b;background:#fdf3f2;padding:20px 24px;border-radius:0 4px 4px 0;margin-bottom:36px;">
      <div style="font-size:8.5px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:#c0392b;margin-bottom:6px;">Penalidade por Incumprimento</div>
      <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#1c1c1c;">{{valor_penalidade}}</div>
      <div style="font-size:11px;font-weight:300;color:#888;margin-top:4px;">Devido por cada violação confirmada do presente acordo</div>
    </div>

    <div style="display:flex;align-items:center;gap:12px;margin:36px 0 16px;">
  <div style="width:3px;height:16px;background:#1c1c1c;border-radius:2px;flex-shrink:0;"></div>
  <span style="font-family:'DM Sans',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#1c1c1c;">Cláusulas</span>
</div>

    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#c0392b;line-height:1.2;padding-top:2px;text-align:right;">I</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Definição de Informação Confidencial</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">Toda e qualquer informação, dados, documentos, especificações técnicas, know-how, estratégias comerciais, informações financeiras, planos de negócio, listas de clientes, segredos comerciais e demais informações partilhadas entre as partes, independentemente da forma (oral, escrita, electrónica ou magnética).</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#c0392b;line-height:1.2;padding-top:2px;text-align:right;">II</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Obrigação de Confidencialidade</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">As Partes obrigam-se a: (a) manter sigilo absoluto; (b) não divulgar, reproduzir, copiar ou distribuir a terceiros sem autorização prévia e escrita; (c) utilizar a informação exclusivamente para os fins deste acordo; (d) restringir o acesso apenas aos colaboradores que necessitem de a conhecer.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#c0392b;line-height:1.2;padding-top:2px;text-align:right;">III</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Exclusões</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">Não é considerada confidencial a informação que: (a) seja de domínio público sem violação deste acordo; (b) estivesse na posse legítima da Parte Receptora à data de recepção; (c) seja obtida de terceiros sem restrições de confidencialidade; (d) seja desenvolvida de forma independente.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#c0392b;line-height:1.2;padding-top:2px;text-align:right;">IV</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Prazo de Vigência</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">O acordo vigora pelo prazo de {{prazo_acordo}} contado da data de assinatura. As obrigações de confidencialidade previstas nas cláusulas II e V manter-se-ão por um período adicional de 5 (cinco) anos após o término.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#c0392b;line-height:1.2;padding-top:2px;text-align:right;">V</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Penalidades</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">A violação de qualquer obrigação de confidencialidade sujeita a Parte infractora ao pagamento de {{valor_penalidade}} por cada ocorrência, sem prejuízo do direito da Parte lesada a exigir perdas e danos e a recorrer a medidas cautelares.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#c0392b;line-height:1.2;padding-top:2px;text-align:right;">VI</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Devolução de Informação</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">No término, por qualquer motivo, a Parte Receptora obriga-se a devolver toda a Informação Confidencial, incluindo cópias e extractos, ou a destruí-la mediante confirmação escrita.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#c0392b;line-height:1.2;padding-top:2px;text-align:right;">VII</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Propriedade Intelectual</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">Nenhuma disposição deste acordo concede à Parte Receptora qualquer direito de propriedade intelectual ou industrial sobre a Informação Confidencial, que permanece propriedade exclusiva da Parte Divulgadora.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#c0392b;line-height:1.2;padding-top:2px;text-align:right;">VIII</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Resolução de Litígios</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">As Partes elegem a {{camara_mediacao}} para resolução de litígios, aplicando-se a {{lei_aplicavel}}. Em caso de recurso a tribunal, elegem o foro da Comarca de Luanda com renúncia a qualquer outro.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#c0392b;line-height:1.2;padding-top:2px;text-align:right;">IX</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Disposições Finais</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">Este acordo constitui o entendimento integral sobre a matéria, substituindo acordos anteriores. Qualquer modificação exige forma escrita assinada por ambas as partes. A invalidade de qualquer cláusula não afectará a validade das demais.</div>
  </div>
</div>

    <div style="display:flex;align-items:center;gap:12px;margin:36px 0 16px;">
  <div style="width:3px;height:16px;background:#1c1c1c;border-radius:2px;flex-shrink:0;"></div>
  <span style="font-family:'DM Sans',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#1c1c1c;">Assinaturas</span>
</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:52px;margin-top:40px;"><div>
  <div style="height:52px;border-bottom:1px solid #ccc;margin-bottom:10px;"></div>
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;font-weight:400;">{{nome_parte_a}}</div>
  <div style="font-family:'DM Sans',sans-serif;font-size:9px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-top:3px;">Parte A</div>
</div><div>
  <div style="height:52px;border-bottom:1px solid #ccc;margin-bottom:10px;"></div>
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;font-weight:400;">{{nome_parte_b}}</div>
  <div style="font-family:'DM Sans',sans-serif;font-size:9px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-top:3px;">Parte B</div>
</div></div>
    <div style="margin-top:16px;text-align:right;font-family:'DM Sans',sans-serif;font-size:10px;letter-spacing:0.08em;color:#ccc;text-transform:uppercase;">{{data_celebracao}}</div>
  </div>

  
<footer style="display:flex;align-items:center;justify-content:space-between;padding:18px 52px;border-top:1px solid rgba(0,0,0,0.08);margin-top:0;">
  <div style="display:flex;align-items:center;gap:8px;opacity:0.35;">
    <svg width="20" height="20" viewBox="0 0 2000 2000" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0,2000) scale(0.1,-0.1)"><path d="M9810 17311 c-80 -26 -154 -80 -199 -145 -35 -51 -6334 -13066 -6351 -13122 -20 -67 -9 -189 23 -255 33 -68 97 -135 168 -174 51 -28 60 -30 164 -30 l110 1 2138 797 c1176 438 2152 804 2170 813 57 30 95 64 130 117 30 45 314 617 1328 2674 126 254 248 513 272 575 62 158 161 376 262 578 550 1099 1323 2052 2295 2831 85 69 199 156 252 194 54 39 98 73 98 77 0 4 -550 1112 -1222 2463 -1341 2697 -1246 2518 -1373 2581 -51 25 -73 29 -150 31 -49 1 -101 -1 -115 -6z" fill="currentColor"/><path d="M12592 11764 c-114 -115 -264 -275 -333 -355 -854 -1001 -1414 -2184 -1539 -3254 -6 -49 -14 -178 -17 -285 l-6 -196 538 -1059 c295 -583 567 -1118 603 -1190 78 -154 134 -220 220 -258 159 -70 4221 -1570 4279 -1580 160 -28 332 76 392 238 25 66 28 170 7 236 -13 43 -3909 7885 -3926 7903 -5 5 -99 -81 -218 -200z" fill="currentColor"/></g></svg>
    <span style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;">Agree</span>
  </div>
  <div style="font-family:'DM Sans',sans-serif;font-size:10px;letter-spacing:0.06em;opacity:0.3;text-transform:uppercase;display:flex;gap:24px;">
    <span>NDA-{{referencia}}</span><span>Página 1 / 1</span>
  </div>
</footer>
</div>
</body></html>`,
    fields: [
      { name: 'nome_parte_a', label: 'Nome da Parte A', type: 'text', required: true },
      { name: 'representante_a', label: 'Representante da Parte A', type: 'text', required: true },
      { name: 'nome_parte_b', label: 'Nome da Parte B', type: 'text', required: true },
      { name: 'representante_b', label: 'Representante da Parte B', type: 'text', required: true },
      { name: 'referencia', label: 'Referência', type: 'text', required: true },
      { name: 'descricao_negociacao', label: 'Descrição da Negociação', type: 'textarea', required: true },
      { name: 'tipo_informacoes', label: 'Tipo de Informações', type: 'text', required: true },
      { name: 'prazo_acordo', label: 'Prazo do Acordo', type: 'text', required: true },
      { name: 'informacoes_excluidas', label: 'Informações Excluídas', type: 'textarea', required: false },
      { name: 'valor_penalidade', label: 'Penalidade por Incumprimento (Kz)', type: 'text', required: true },
      { name: 'camara_mediacao', label: 'Câmara de Mediação', type: 'text', required: true },
      { name: 'lei_aplicavel', label: 'Lei Aplicável', type: 'text', required: true },
      { name: 'data_celebracao', label: 'Data de Celebração', type: 'date', required: true },
    ],
    is_system: true,
  },

  {
    id: 'built-in-3',
    name: 'Contrato de Arrendamento',
    description: 'Arrendamento residencial — design atlas com verde floresta e linho quente',
    category: 'Imobiliário',
    content: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
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
          <svg width="20" height="20" viewBox="0 0 2000 2000" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0,2000) scale(0.1,-0.1)"><path d="M9810 17311 c-80 -26 -154 -80 -199 -145 -35 -51 -6334 -13066 -6351 -13122 -20 -67 -9 -189 23 -255 33 -68 97 -135 168 -174 51 -28 60 -30 164 -30 l110 1 2138 797 c1176 438 2152 804 2170 813 57 30 95 64 130 117 30 45 314 617 1328 2674 126 254 248 513 272 575 62 158 161 376 262 578 550 1099 1323 2052 2295 2831 85 69 199 156 252 194 54 39 98 73 98 77 0 4 -550 1112 -1222 2463 -1341 2697 -1246 2518 -1373 2581 -51 25 -73 29 -150 31 -49 1 -101 -1 -115 -6z" fill="currentColor"/><path d="M12592 11764 c-114 -115 -264 -275 -333 -355 -854 -1001 -1414 -2184 -1539 -3254 -6 -49 -14 -178 -17 -285 l-6 -196 538 -1059 c295 -583 567 -1118 603 -1190 78 -154 134 -220 220 -258 159 -70 4221 -1570 4279 -1580 160 -28 332 76 392 238 25 66 28 170 7 236 -13 43 -3909 7885 -3926 7903 -5 5 -99 -81 -218 -200z" fill="currentColor"/></g></svg>
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
    <div style="display:flex;align-items:center;gap:12px;margin:36px 0 16px;">
  <div style="width:3px;height:16px;background:#1e4a2e;border-radius:2px;flex-shrink:0;"></div>
  <span style="font-family:'DM Sans',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#1e4a2e;">Partes Contratantes</span>
</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px 36px;margin-bottom:28px;">
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-bottom:4px;">Senhorio</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{nome_senhorio}}</div>
  </div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-bottom:4px;">Arrendatário</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{nome_arrendatario}}</div>
  </div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-bottom:4px;">NIF Senhorio</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{nif_senhorio}}</div>
  </div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-bottom:4px;">NIF Arrendatário</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{nif_arrendatario}}</div>
  </div></div>

    <!-- Financial summary cards -->
    <div style="display:flex;align-items:center;gap:12px;margin:36px 0 16px;">
  <div style="width:3px;height:16px;background:#1e4a2e;border-radius:2px;flex-shrink:0;"></div>
  <span style="font-family:'DM Sans',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#1e4a2e;">Condições Financeiras</span>
</div>
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

    <div style="display:flex;align-items:center;gap:12px;margin:36px 0 16px;">
  <div style="width:3px;height:16px;background:#1e4a2e;border-radius:2px;flex-shrink:0;"></div>
  <span style="font-family:'DM Sans',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#1e4a2e;">Cláusulas Contratuais</span>
</div>

    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#1e4a2e;line-height:1.2;padding-top:2px;text-align:right;">I</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Objecto</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">O SENHORIO dá de arrendamento ao ARRENDATÁRIO, que aceita, o imóvel identificado neste instrumento para fins de {{uso_imovel}}, obrigando-se o ARRENDATÁRIO a usá-lo com a diligência de um bom pai de família, nos termos do artigo 1.062.º e seguintes do Código Civil Angolano.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#1e4a2e;line-height:1.2;padding-top:2px;text-align:right;">II</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Renda e Pagamento</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">O ARRENDATÁRIO obriga-se a pagar a renda de {{valor_renda}} até ao dia {{dia_pagamento}} de cada mês por depósito bancário ou transferência para conta indicada pelo SENHORIO. O atraso confere ao SENHORIO o direito de exigir juros de mora e constitui fundamento de rescisão.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#1e4a2e;line-height:1.2;padding-top:2px;text-align:right;">III</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Caução</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">No acto de assinatura, o ARRENDATÁRIO entrega ao SENHORIO {{valor_caucao}} a título de caução, restituível no término, após dedução de eventuais danos ou rendas em atraso.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#1e4a2e;line-height:1.2;padding-top:2px;text-align:right;">IV</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Despesas e Encargos</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">Responsabilidade do SENHORIO: Imposto de Selo, IMI e seguros. Responsabilidade do ARRENDATÁRIO: facturas de água, electricidade, gás, comunicações e condomínio ({{valor_condominio}}).</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#1e4a2e;line-height:1.2;padding-top:2px;text-align:right;">V</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Conservação e Reparações</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">Reparações ordinárias e pequenas conservações: ARRENDATÁRIO. Reparações extraordinárias, estruturais ou que afectem a habitabilidade: SENHORIO. Obras de alteração carecem de autorização prévia e escrita do SENHORIO.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#1e4a2e;line-height:1.2;padding-top:2px;text-align:right;">VI</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Subarrendamento e Cessão</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">O ARRENDATÁRIO não poderá subarrendar, ceder ou emprestar o imóvel, nem dar-lhe destino diverso do estipulado, sem autorização prévia e escrita do SENHORIO, sob pena de rescisão imediata.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#1e4a2e;line-height:1.2;padding-top:2px;text-align:right;">VII</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Prazo e Renovação</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">O contrato é celebrado por {{duracao_arrendamento}}, com início em {{data_inicio}}. Renovação: {{renovacao_automatica}}. O valor da renda será actualizado pelo índice de preços ao consumidor. Denúncia: aviso prévio de {{prazo_aviso_previo}}.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#1e4a2e;line-height:1.2;padding-top:2px;text-align:right;">VIII</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Rescisão</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">Fundamentos de rescisão pelo SENHORIO: (a) falta de pagamento por mais de 3 meses; (b) utilização ilícita; (c) subarrendamento não autorizado; (d) danos graves. O ARRENDATÁRIO pode rescindir com o aviso prévio acordado.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#1e4a2e;line-height:1.2;padding-top:2px;text-align:right;">IX</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Foro</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">Para resolução de litígios, as partes elegem o foro da Comarca da situação do imóvel, com renúncia a qualquer outro, aplicando-se o Código Civil Angolano e a Lei de Arrendamento Urbano em vigor.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#1e4a2e;line-height:1.2;padding-top:2px;text-align:right;">X</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Disposições Finais</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">Este contrato constitui o integral acordo entre as partes. Qualquer alteração exige forma escrita assinada por ambas as partes. As partes elegem o foro indicado para resolução de quaisquer litígios.</div>
  </div>
</div>

    <div style="display:flex;align-items:center;gap:12px;margin:36px 0 16px;">
  <div style="width:3px;height:16px;background:#1e4a2e;border-radius:2px;flex-shrink:0;"></div>
  <span style="font-family:'DM Sans',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#1e4a2e;">Assinaturas</span>
</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:52px;margin-top:40px;"><div>
  <div style="height:52px;border-bottom:1px solid #ccc;margin-bottom:10px;"></div>
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;font-weight:400;">{{nome_senhorio}}</div>
  <div style="font-family:'DM Sans',sans-serif;font-size:9px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-top:3px;">Senhorio</div>
</div><div>
  <div style="height:52px;border-bottom:1px solid #ccc;margin-bottom:10px;"></div>
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;font-weight:400;">{{nome_arrendatario}}</div>
  <div style="font-family:'DM Sans',sans-serif;font-size:9px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-top:3px;">Arrendatário</div>
</div></div>
    <div style="margin-top:16px;text-align:right;font-family:'DM Sans',sans-serif;font-size:10px;letter-spacing:0.08em;color:#ccc;text-transform:uppercase;">{{data_inicio}}</div>
  </div>

  
<footer style="display:flex;align-items:center;justify-content:space-between;padding:18px 52px;border-top:1px solid rgba(0,0,0,0.08);margin-top:0;">
  <div style="display:flex;align-items:center;gap:8px;opacity:0.35;">
    <svg width="20" height="20" viewBox="0 0 2000 2000" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0,2000) scale(0.1,-0.1)"><path d="M9810 17311 c-80 -26 -154 -80 -199 -145 -35 -51 -6334 -13066 -6351 -13122 -20 -67 -9 -189 23 -255 33 -68 97 -135 168 -174 51 -28 60 -30 164 -30 l110 1 2138 797 c1176 438 2152 804 2170 813 57 30 95 64 130 117 30 45 314 617 1328 2674 126 254 248 513 272 575 62 158 161 376 262 578 550 1099 1323 2052 2295 2831 85 69 199 156 252 194 54 39 98 73 98 77 0 4 -550 1112 -1222 2463 -1341 2697 -1246 2518 -1373 2581 -51 25 -73 29 -150 31 -49 1 -101 -1 -115 -6z" fill="currentColor"/><path d="M12592 11764 c-114 -115 -264 -275 -333 -355 -854 -1001 -1414 -2184 -1539 -3254 -6 -49 -14 -178 -17 -285 l-6 -196 538 -1059 c295 -583 567 -1118 603 -1190 78 -154 134 -220 220 -258 159 -70 4221 -1570 4279 -1580 160 -28 332 76 392 238 25 66 28 170 7 236 -13 43 -3909 7885 -3926 7903 -5 5 -99 -81 -218 -200z" fill="currentColor"/></g></svg>
    <span style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;">Agree</span>
  </div>
  <div style="font-family:'DM Sans',sans-serif;font-size:10px;letter-spacing:0.06em;opacity:0.3;text-transform:uppercase;display:flex;gap:24px;">
    <span>ARR-{{referencia}}</span><span>Página 1 / 1</span>
  </div>
</footer>
</div>
</body></html>`,
    fields: [
      { name: 'nome_senhorio', label: 'Nome do Senhorio', type: 'text', required: true },
      { name: 'nif_senhorio', label: 'NIF do Senhorio', type: 'text', required: true },
      { name: 'nome_arrendatario', label: 'Nome do Arrendatário', type: 'text', required: true },
      { name: 'nif_arrendatario', label: 'NIF do Arrendatário', type: 'text', required: true },
      { name: 'morada_imovel', label: 'Morada do Imóvel', type: 'text', required: true },
      { name: 'andar', label: 'Andar', type: 'text', required: false },
      { name: 'fraccao', label: 'Fracção', type: 'text', required: false },
      { name: 'codigo_postal', label: 'Código Postal', type: 'text', required: false },
      { name: 'localidade', label: 'Localidade', type: 'text', required: true },
      { name: 'area_metros', label: 'Área (m²)', type: 'text', required: true },
      { name: 'tipologia', label: 'Tipologia (T0, T1, T2…)', type: 'text', required: true },
      { name: 'uso_imovel', label: 'Uso do Imóvel', type: 'text', required: true },
      { name: 'valor_renda', label: 'Valor da Renda (Kz)', type: 'text', required: true },
      { name: 'valor_caucao', label: 'Valor da Caução (Kz)', type: 'text', required: true },
      { name: 'dia_pagamento', label: 'Dia de Pagamento', type: 'text', required: true },
      { name: 'valor_condominio', label: 'Valor do Condomínio (Kz)', type: 'text', required: false },
      { name: 'data_inicio', label: 'Data de Início', type: 'date', required: true },
      { name: 'duracao_arrendamento', label: 'Duração do Arrendamento', type: 'text', required: true },
      { name: 'renovacao_automatica', label: 'Renovação Automática (Sim/Não)', type: 'text', required: false },
      { name: 'prazo_aviso_previo', label: 'Prazo de Aviso Prévio', type: 'text', required: false },
      { name: 'referencia', label: 'Referência', type: 'text', required: true },
    ],
    is_system: true,
  },

  {
    id: 'built-in-4',
    name: 'Contrato de Trabalho Sem Termo',
    description: 'Contrato laboral sem termo — design corporativo branco com acento carmim estruturado',
    category: 'Recursos Humanos',
    content: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
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
            <div style="color:#b92c1b;"><svg width="20" height="20" viewBox="0 0 2000 2000" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0,2000) scale(0.1,-0.1)"><path d="M9810 17311 c-80 -26 -154 -80 -199 -145 -35 -51 -6334 -13066 -6351 -13122 -20 -67 -9 -189 23 -255 33 -68 97 -135 168 -174 51 -28 60 -30 164 -30 l110 1 2138 797 c1176 438 2152 804 2170 813 57 30 95 64 130 117 30 45 314 617 1328 2674 126 254 248 513 272 575 62 158 161 376 262 578 550 1099 1323 2052 2295 2831 85 69 199 156 252 194 54 39 98 73 98 77 0 4 -550 1112 -1222 2463 -1341 2697 -1246 2518 -1373 2581 -51 25 -73 29 -150 31 -49 1 -101 -1 -115 -6z" fill="currentColor"/><path d="M12592 11764 c-114 -115 -264 -275 -333 -355 -854 -1001 -1414 -2184 -1539 -3254 -6 -49 -14 -178 -17 -285 l-6 -196 538 -1059 c295 -583 567 -1118 603 -1190 78 -154 134 -220 220 -258 159 -70 4221 -1570 4279 -1580 160 -28 332 76 392 238 25 66 28 170 7 236 -13 43 -3909 7885 -3926 7903 -5 5 -99 -81 -218 -200z" fill="currentColor"/></g></svg></div>
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

    <div style="display:flex;align-items:center;gap:12px;margin:36px 0 16px;">
  <div style="width:3px;height:16px;background:#b92c1b;border-radius:2px;flex-shrink:0;"></div>
  <span style="font-family:'DM Sans',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#b92c1b;">Identificação das Partes</span>
</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px 36px;margin-bottom:28px;">
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-bottom:4px;">Empresa (Entidade Patronal)</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{nome_empresa}}</div>
  </div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-bottom:4px;">Colaborador (Trabalhador)</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{nome_colaborador}}</div>
  </div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-bottom:4px;">NIF Empresa</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{nif_empresa}}</div>
  </div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-bottom:4px;">NIF Colaborador</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{nif_colaborador}}</div>
  </div></div>

    <div style="display:flex;align-items:center;gap:12px;margin:36px 0 16px;">
  <div style="width:3px;height:16px;background:#b92c1b;border-radius:2px;flex-shrink:0;"></div>
  <span style="font-family:'DM Sans',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#b92c1b;">Condições de Trabalho</span>
</div>
    <!-- Salary hero -->
    <div style="border-left:4px solid #b92c1b;background:#fdf4f3;padding:20px 24px;border-radius:0 4px 4px 0;margin-bottom:24px;">
      <div style="font-size:8.5px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:#b92c1b;margin-bottom:6px;">Salário Base Mensal</div>
      <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:32px;font-weight:400;color:#1a1a1a;">{{salario_base}}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px 36px;margin-bottom:28px;">
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-bottom:4px;">Jornada de Trabalho</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{jornada_trabalho}}</div>
  </div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-bottom:4px;">Local de Trabalho</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{local_trabalho}}</div>
  </div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-bottom:4px;">Período de Experiência</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{periodo_experiencia}}</div>
  </div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-bottom:4px;">Subsídio de Alimentação</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{subsidio_alimentacao}}</div>
  </div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-bottom:4px;">Dias de Férias</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{dias_ferias}} dias</div>
  </div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-bottom:4px;">NIF da Empresa</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{nif_empresa}}</div>
  </div></div>

    <div style="display:flex;align-items:center;gap:12px;margin:36px 0 16px;">
  <div style="width:3px;height:16px;background:#b92c1b;border-radius:2px;flex-shrink:0;"></div>
  <span style="font-family:'DM Sans',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#b92c1b;">Cláusulas Contratuais</span>
</div>

    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#b92c1b;line-height:1.2;padding-top:2px;text-align:right;">I</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Funções</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">O COLABORADOR exercerá as funções de {{funcao_cargo}}, no quadro da Empresa, sob ordens e direcção desta, com a diligência e lealdade exigidas por lei, nos termos do artigo 220.º e seguintes da Lei Geral do Trabalho (Lei n.º 7/15 de 15 de Junho).</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#b92c1b;line-height:1.2;padding-top:2px;text-align:right;">II</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Duração</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">O contrato celebra-se por tempo indeterminado, nos termos do artigo 35.º da Lei Geral do Trabalho, produzindo efeitos a partir de {{data_admissao}}.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#b92c1b;line-height:1.2;padding-top:2px;text-align:right;">III</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Remuneração e Prestações</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">A Empresa pagará ao Colaborador a remuneração base mensal de {{salario_base}}, subsídio de alimentação de {{subsidio_alimentacao}}, e demais prestações legais. O pagamento é efectuado até ao último dia útil de cada mês por transferência bancária.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#b92c1b;line-height:1.2;padding-top:2px;text-align:right;">IV</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Horário e Local de Trabalho</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">O Colaborador cumpre a jornada de {{jornada_trabalho}} no local sito em {{local_trabalho}}. Horário e local poderão ser alterados por necessidade de serviço com aviso prévio de 30 dias, nos termos do artigo 97.º da LGT.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#b92c1b;line-height:1.2;padding-top:2px;text-align:right;">V</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Período de Experiência</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">O contrato fica sujeito a período de experiência de {{periodo_experiencia}}, durante o qual qualquer das partes pode resolvê-lo sem aviso prévio nem indemnização, nos termos do artigo 36.º da LGT.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#b92c1b;line-height:1.2;padding-top:2px;text-align:right;">VI</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Férias e Ausências</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">O Colaborador tem direito a {{dias_ferias}} dias úteis de férias em cada ano civil, nos termos do artigo 184.º e ss. da LGT, com retribuição acrescida de subsídio de férias.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#b92c1b;line-height:1.2;padding-top:2px;text-align:right;">VII</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Deveres do Colaborador</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">O Colaborador obriga-se a: (a) cumprir ordens e instruções; (b) guardar lealdade; (c) não divulgar informações confidenciais; (d) zelar pelos equipamentos e instalações; (e) manter sigilo profissional mesmo após cessação do contrato.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#b92c1b;line-height:1.2;padding-top:2px;text-align:right;">VIII</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Deveres da Empresa</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">A Empresa obriga-se a: (a) pagar pontualmente a remuneração; (b) proporcionar condições de trabalho seguras; (c) cumprir obrigações legais perante a segurança social e seguros; (d) respeitar a dignidade e os direitos do Colaborador.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#b92c1b;line-height:1.2;padding-top:2px;text-align:right;">IX</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Denúncia e Rescisão</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">A Empresa comunica a denúncia com 60 dias de aviso prévio; o Colaborador com 30 dias. A rescisão por justa causa segue o regime dos artigos 47.º a 49.º da LGT.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#b92c1b;line-height:1.2;padding-top:2px;text-align:right;">X</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Foro e Legislação Aplicável</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">Aplica-se a Lei Geral do Trabalho angolana (Lei n.º 7/15 de 15 de Junho). Para litígios, as partes elegem o Tribunal de Trabalho da Comarca de Luanda, com renúncia a qualquer outro.</div>
  </div>
</div>

    <div style="display:flex;align-items:center;gap:12px;margin:36px 0 16px;">
  <div style="width:3px;height:16px;background:#b92c1b;border-radius:2px;flex-shrink:0;"></div>
  <span style="font-family:'DM Sans',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#b92c1b;">Assinaturas</span>
</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:52px;margin-top:40px;"><div>
  <div style="height:52px;border-bottom:1px solid #ccc;margin-bottom:10px;"></div>
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;font-weight:400;">{{nome_empresa}}</div>
  <div style="font-family:'DM Sans',sans-serif;font-size:9px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-top:3px;">Empregador</div>
</div><div>
  <div style="height:52px;border-bottom:1px solid #ccc;margin-bottom:10px;"></div>
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;font-weight:400;">{{nome_colaborador}}</div>
  <div style="font-family:'DM Sans',sans-serif;font-size:9px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-top:3px;">Colaborador</div>
</div></div>
    <div style="margin-top:16px;text-align:right;font-family:'DM Sans',sans-serif;font-size:10px;letter-spacing:0.08em;color:#ccc;text-transform:uppercase;">{{data_admissao}}</div>
  </div>

  
<footer style="display:flex;align-items:center;justify-content:space-between;padding:18px 52px;border-top:1px solid rgba(0,0,0,0.08);margin-top:0;">
  <div style="display:flex;align-items:center;gap:8px;opacity:0.35;">
    <svg width="20" height="20" viewBox="0 0 2000 2000" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0,2000) scale(0.1,-0.1)"><path d="M9810 17311 c-80 -26 -154 -80 -199 -145 -35 -51 -6334 -13066 -6351 -13122 -20 -67 -9 -189 23 -255 33 -68 97 -135 168 -174 51 -28 60 -30 164 -30 l110 1 2138 797 c1176 438 2152 804 2170 813 57 30 95 64 130 117 30 45 314 617 1328 2674 126 254 248 513 272 575 62 158 161 376 262 578 550 1099 1323 2052 2295 2831 85 69 199 156 252 194 54 39 98 73 98 77 0 4 -550 1112 -1222 2463 -1341 2697 -1246 2518 -1373 2581 -51 25 -73 29 -150 31 -49 1 -101 -1 -115 -6z" fill="currentColor"/><path d="M12592 11764 c-114 -115 -264 -275 -333 -355 -854 -1001 -1414 -2184 -1539 -3254 -6 -49 -14 -178 -17 -285 l-6 -196 538 -1059 c295 -583 567 -1118 603 -1190 78 -154 134 -220 220 -258 159 -70 4221 -1570 4279 -1580 160 -28 332 76 392 238 25 66 28 170 7 236 -13 43 -3909 7885 -3926 7903 -5 5 -99 -81 -218 -200z" fill="currentColor"/></g></svg>
    <span style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;">Agree</span>
  </div>
  <div style="font-family:'DM Sans',sans-serif;font-size:10px;letter-spacing:0.06em;opacity:0.3;text-transform:uppercase;display:flex;gap:24px;">
    <span>CT-{{numero_contrato}}</span><span>Página 1 / 1</span>
  </div>
</footer>
</div>
</body></html>`,
    fields: [
      { name: 'nome_empresa', label: 'Nome da Empresa', type: 'text', required: true },
      { name: 'nif_empresa', label: 'NIF da Empresa', type: 'text', required: true },
      { name: 'nome_colaborador', label: 'Nome do Colaborador', type: 'text', required: true },
      { name: 'nif_colaborador', label: 'NIF do Colaborador', type: 'text', required: true },
      { name: 'numero_contrato', label: 'Número do Contrato', type: 'text', required: true },
      { name: 'funcao_cargo', label: 'Função / Cargo', type: 'text', required: true },
      { name: 'data_admissao', label: 'Data de Admissão', type: 'date', required: true },
      { name: 'salario_base', label: 'Salário Base (Kz)', type: 'text', required: true },
      { name: 'jornada_trabalho', label: 'Jornada de Trabalho', type: 'text', required: true },
      { name: 'local_trabalho', label: 'Local de Trabalho', type: 'text', required: true },
      { name: 'periodo_experiencia', label: 'Período de Experiência', type: 'text', required: false },
      { name: 'subsidio_alimentacao', label: 'Subsídio de Alimentação (Kz)', type: 'text', required: false },
      { name: 'dias_ferias', label: 'Dias de Férias', type: 'text', required: false },
    ],
    is_system: true,
  },

  {
    id: 'built-in-5',
    name: 'Prestação de Serviços e Consultoria',
    description: 'Contrato de serviços e consultoria — design editorial espresso com energia de masthead',
    category: 'Serviços',
    content: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
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
          <div style="color:rgba(255,255,255,0.5);"><svg width="20" height="20" viewBox="0 0 2000 2000" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0,2000) scale(0.1,-0.1)"><path d="M9810 17311 c-80 -26 -154 -80 -199 -145 -35 -51 -6334 -13066 -6351 -13122 -20 -67 -9 -189 23 -255 33 -68 97 -135 168 -174 51 -28 60 -30 164 -30 l110 1 2138 797 c1176 438 2152 804 2170 813 57 30 95 64 130 117 30 45 314 617 1328 2674 126 254 248 513 272 575 62 158 161 376 262 578 550 1099 1323 2052 2295 2831 85 69 199 156 252 194 54 39 98 73 98 77 0 4 -550 1112 -1222 2463 -1341 2697 -1246 2518 -1373 2581 -51 25 -73 29 -150 31 -49 1 -101 -1 -115 -6z" fill="currentColor"/><path d="M12592 11764 c-114 -115 -264 -275 -333 -355 -854 -1001 -1414 -2184 -1539 -3254 -6 -49 -14 -178 -17 -285 l-6 -196 538 -1059 c295 -583 567 -1118 603 -1190 78 -154 134 -220 220 -258 159 -70 4221 -1570 4279 -1580 160 -28 332 76 392 238 25 66 28 170 7 236 -13 43 -3909 7885 -3926 7903 -5 5 -99 -81 -218 -200z" fill="currentColor"/></g></svg></div>
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

    <div style="display:flex;align-items:center;gap:12px;margin:36px 0 16px;">
  <div style="width:3px;height:16px;background:#2c1a0e;border-radius:2px;flex-shrink:0;"></div>
  <span style="font-family:'DM Sans',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#2c1a0e;">Descrição do Serviço</span>
</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:300;line-height:1.75;color:#444;margin-bottom:32px;padding:20px 22px;background:#faf8f5;border-radius:4px;">{{descricao_detalhada_servico}}</div>

    <!-- Honorários + conditions -->
    <div style="display:flex;align-items:center;gap:12px;margin:36px 0 16px;">
  <div style="width:3px;height:16px;background:#2c1a0e;border-radius:2px;flex-shrink:0;"></div>
  <span style="font-family:'DM Sans',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#2c1a0e;">Honorários e Condições</span>
</div>
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

    <div style="display:flex;align-items:center;gap:12px;margin:36px 0 16px;">
  <div style="width:3px;height:16px;background:#2c1a0e;border-radius:2px;flex-shrink:0;"></div>
  <span style="font-family:'DM Sans',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#2c1a0e;">Entregáveis</span>
</div>
    <div style="background:#faf8f5;border:1px solid #e8e4dc;border-radius:4px;padding:20px 22px;margin-bottom:32px;">
      <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:300;line-height:1.75;color:#444;">{{lista_entregaveis}}</div>
    </div>

    <div style="display:flex;align-items:center;gap:12px;margin:36px 0 16px;">
  <div style="width:3px;height:16px;background:#2c1a0e;border-radius:2px;flex-shrink:0;"></div>
  <span style="font-family:'DM Sans',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#2c1a0e;">Cláusulas Contratuais</span>
</div>

    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#2c1a0e;line-height:1.2;padding-top:2px;text-align:right;">I</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Objecto</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">O PRESTADOR obriga-se a executar os serviços descritos com a melhor técnica, autonomia de gestão e meios próprios, sem qualquer vínculo laboral ou de subordinação hierárquica com o CONTRATANTE, nos termos do artigo 1.154.º do Código Civil Angolano.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#2c1a0e;line-height:1.2;padding-top:2px;text-align:right;">II</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Obrigações do Prestador</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">O PRESTADOR obriga-se a: (a) executar com qualidade nos prazos acordados; (b) apresentar relatórios periódicos; (c) utilizar os melhores padrões técnicos; (d) manter sigilo profissional; (e) afectar os recursos necessários ao bom cumprimento.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#2c1a0e;line-height:1.2;padding-top:2px;text-align:right;">III</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Obrigações do Contratante</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">O CONTRATANTE obriga-se a: (a) fornecer informação e colaboração necessárias; (b) pagar os honorários nos prazos estabelecidos; (c) disponibilizar acessos a locais e sistemas; (d) designar um interlocutor para comunicação.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#2c1a0e;line-height:1.2;padding-top:2px;text-align:right;">IV</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Honorários e Facturação</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">Pelos serviços, o CONTRATANTE pagará {{honorarios}}, com {{periodicidade_faturacao}}, mediante factura legal. Pagamento por {{forma_pagamento}} em 30 dias após emissão. O atraso confere ao PRESTADOR o direito de suspender os serviços e exigir juros de mora.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#2c1a0e;line-height:1.2;padding-top:2px;text-align:right;">V</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Prazo e Execução</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">Os serviços serão executados no prazo de {{prazo_execucao}} contado da assinatura, em {{local_prestacao}}. O PRESTADOR apresentará os entregáveis descritos para aprovação do CONTRATANTE.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#2c1a0e;line-height:1.2;padding-top:2px;text-align:right;">VI</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Propriedade Intelectual</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">Os direitos de propriedade intelectual sobre os resultados dos serviços, incluindo relatórios, estudos, software e entregáveis, serão de {{propriedade_intelectual}}, nos termos da Lei dos Direitos de Autor angolana.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#2c1a0e;line-height:1.2;padding-top:2px;text-align:right;">VII</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Confidencialidade</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">As partes mantêm sigilo sobre toda a informação comercial, técnica ou financeira partilhada, durante a vigência do contrato e por 5 (cinco) anos após o seu término.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#2c1a0e;line-height:1.2;padding-top:2px;text-align:right;">VIII</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Exclusividade</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">{{clausula_exclusividade}}</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#2c1a0e;line-height:1.2;padding-top:2px;text-align:right;">IX</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Rescisão</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">Qualquer das partes pode resolver o contrato com 30 dias de aviso prévio, salvo incumprimento grave que justifique rescisão imediata. Constituem incumprimento grave: atraso reiterado no pagamento, execução defeituosa, ou violação do dever de confidencialidade.</div>
  </div>
</div>
    <div style="display:grid;grid-template-columns:36px 1fr;gap:0 16px;margin-bottom:18px;align-items:start;">
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#2c1a0e;line-height:1.2;padding-top:2px;text-align:right;">X</div>
  <div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;margin-bottom:5px;">Foro e Lei Aplicável</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.75;color:#444;">O contrato é regulado pela lei angolana. Para litígios, as partes elegem o foro da Comarca de Luanda, com renúncia a qualquer outro, aplicando-se o Código Civil Angolano e demais legislação aplicável.</div>
  </div>
</div>

    <div style="display:flex;align-items:center;gap:12px;margin:36px 0 16px;">
  <div style="width:3px;height:16px;background:#2c1a0e;border-radius:2px;flex-shrink:0;"></div>
  <span style="font-family:'DM Sans',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#2c1a0e;">Assinaturas</span>
</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:52px;margin-top:40px;"><div>
  <div style="height:52px;border-bottom:1px solid #ccc;margin-bottom:10px;"></div>
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;font-weight:400;">{{nome_contratante}}</div>
  <div style="font-family:'DM Sans',sans-serif;font-size:9px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-top:3px;">Contratante</div>
</div><div>
  <div style="height:52px;border-bottom:1px solid #ccc;margin-bottom:10px;"></div>
  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;font-weight:400;">{{nome_prestador}}</div>
  <div style="font-family:'DM Sans',sans-serif;font-size:9px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;margin-top:3px;">Prestador</div>
</div></div>
    <div style="margin-top:16px;text-align:right;font-family:'DM Sans',sans-serif;font-size:10px;letter-spacing:0.08em;color:#ccc;text-transform:uppercase;">{{data_celebracao}}</div>
  </div>

  
<footer style="display:flex;align-items:center;justify-content:space-between;padding:18px 52px;border-top:1px solid rgba(0,0,0,0.08);margin-top:0;">
  <div style="display:flex;align-items:center;gap:8px;opacity:0.35;">
    <svg width="20" height="20" viewBox="0 0 2000 2000" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0,2000) scale(0.1,-0.1)"><path d="M9810 17311 c-80 -26 -154 -80 -199 -145 -35 -51 -6334 -13066 -6351 -13122 -20 -67 -9 -189 23 -255 33 -68 97 -135 168 -174 51 -28 60 -30 164 -30 l110 1 2138 797 c1176 438 2152 804 2170 813 57 30 95 64 130 117 30 45 314 617 1328 2674 126 254 248 513 272 575 62 158 161 376 262 578 550 1099 1323 2052 2295 2831 85 69 199 156 252 194 54 39 98 73 98 77 0 4 -550 1112 -1222 2463 -1341 2697 -1246 2518 -1373 2581 -51 25 -73 29 -150 31 -49 1 -101 -1 -115 -6z" fill="currentColor"/><path d="M12592 11764 c-114 -115 -264 -275 -333 -355 -854 -1001 -1414 -2184 -1539 -3254 -6 -49 -14 -178 -17 -285 l-6 -196 538 -1059 c295 -583 567 -1118 603 -1190 78 -154 134 -220 220 -258 159 -70 4221 -1570 4279 -1580 160 -28 332 76 392 238 25 66 28 170 7 236 -13 43 -3909 7885 -3926 7903 -5 5 -99 -81 -218 -200z" fill="currentColor"/></g></svg>
    <span style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;">Agree</span>
  </div>
  <div style="font-family:'DM Sans',sans-serif;font-size:10px;letter-spacing:0.06em;opacity:0.3;text-transform:uppercase;display:flex;gap:24px;">
    <span>PS-{{numero_contrato}}</span><span>Página 1 / 1</span>
  </div>
</footer>
</div>
</body></html>`,
    fields: [
      { name: 'nome_empresa', label: 'Nome da Empresa', type: 'text', required: true },
      { name: 'numero_contrato', label: 'Número do Contrato', type: 'text', required: true },
      { name: 'titulo_servico', label: 'Título do Serviço', type: 'text', required: true },
      { name: 'especialidade', label: 'Especialidade', type: 'text', required: true },
      { name: 'nome_contratante', label: 'Nome do Contratante', type: 'text', required: true },
      { name: 'nif_contratante', label: 'NIF do Contratante', type: 'text', required: true },
      { name: 'nome_prestador', label: 'Nome do Prestador', type: 'text', required: true },
      { name: 'nif_prestador', label: 'NIF do Prestador', type: 'text', required: true },
      { name: 'descricao_detalhada_servico', label: 'Descrição Detalhada do Serviço', type: 'textarea', required: true },
      { name: 'honorarios', label: 'Honorários (Kz)', type: 'text', required: true },
      { name: 'forma_pagamento', label: 'Forma de Pagamento', type: 'text', required: true },
      { name: 'periodicidade_faturacao', label: 'Periodicidade de Facturação', type: 'text', required: false },
      { name: 'prazo_execucao', label: 'Prazo de Execução', type: 'text', required: true },
      { name: 'local_prestacao', label: 'Local de Prestação', type: 'text', required: true },
      { name: 'indice_reajuste', label: 'Índice de Reajuste', type: 'text', required: false },
      { name: 'lista_entregaveis', label: 'Lista de Entregáveis', type: 'textarea', required: true },
      { name: 'propriedade_intelectual', label: 'Propriedade Intelectual', type: 'text', required: true },
      { name: 'clausula_exclusividade', label: 'Cláusula de Exclusividade', type: 'text', required: false },
      { name: 'data_celebracao', label: 'Data de Celebração', type: 'date', required: true },
    ],
    is_system: true,
  },

  {
    id: 'built-in-6',
    name: 'Contrato de Empreitada',
    description: 'Contrato de empreitada para obras e serviços — design industrial slate com acento laranja queimado',
    category: 'Construção',
    content: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
</style></head><body>
<div style="font-family:'DM Sans',sans-serif;max-width:820px;margin:0 auto;background:#fff;border:1px solid #e4e0d8;">

  <!-- HEADER BAND -->
  <div style="background:#1e293b;padding:0 52px;position:relative;">
    <div style="height:4px;background:linear-gradient(90deg,#d9742b 0%,#ff9c53 50%,#d9742b 100%);position:absolute;top:0;left:0;right:0;"></div>
    <div style="padding-top:40px;padding-bottom:0;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;">
        <div style="display:flex;align-items:center;gap:10px;opacity:0.55;color:#fff;">
          <div style="color:#d9742b;"><svg width="20" height="20" viewBox="0 0 2000 2000" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0,2000) scale(0.1,-0.1)"><path d="M9810 17311 c-80 -26 -154 -80 -199 -145 -35 -51 -6334 -13066 -6351 -13122 -20 -67 -9 -189 23 -255 33 -68 97 -135 168 -174 51 -28 60 -30 164 -30 l110 1 2138 797 c1176 438 2152 804 2170 813 57 30 95 64 130 117 30 45 314 617 1328 2674 126 254 248 513 272 575 62 158 161 376 262 578 550 1099 1323 2052 2295 2831 85 69 199 156 252 194 54 39 98 73 98 77 0 4 -550 1112 -1222 2463 -1341 2697 -1246 2518 -1373 2581 -51 25 -73 29 -150 31 -49 1 -101 -1 -115 -6z" fill="currentColor"/><path d="M12592 11764 c-114 -115 -264 -275 -333 -355 -854 -1001 -1414 -2184 -1539 -3254 -6 -49 -14 -178 -17 -285 l-6 -196 538 -1059 c295 -583 567 -1118 603 -1190 78 -154 134 -220 220 -258 159 -70 4221 -1570 4279 -1580 160 -28 332 76 392 238 25 66 28 170 7 236 -13 43 -3909 7885 -3926 7903 -5 5 -99 -81 -218 -200z" fill="currentColor"/></g></svg></div>
          <span style="font-size:10px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#d9742b;">Agree</span>
          <span style="color:rgba(255,255,255,0.2);font-size:10px;">·</span>
          <span style="font-size:10px;letter-spacing:0.08em;color:rgba(255,255,255,0.4);">{{referencia}}</span>
        </div>
        <div style="text-align:right;">
          <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:500;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:4px;">Data</div>
          <div style="font-family:'DM Sans',sans-serif;font-size:12px;font-weight:300;color:rgba(255,255,255,0.7);">{{data_celebracao}}</div>
        </div>
      </div>
      <div style="font-family:'DM Sans',sans-serif;font-size:10px;font-weight:500;letter-spacing:0.22em;text-transform:uppercase;color:#d9742b;margin-bottom:10px;">Contrato de Empreitada</div>


  <!-- TITLE -->
  <div style="text-align:center;padding:32px 52px 8px;border-bottom:1px solid #e4e0d8;">
    <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:600;color:#1e293b;letter-spacing:0.03em;margin-bottom:4px;">Contrato de Prestação de Serviços de Empreitada</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;color:#888;letter-spacing:0.1em;margin-bottom:12px;">que entre si celebram</div>
  </div>

  <!-- PARTIES -->
  <div style="margin:20px 52px 0;">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
      <div style="background:#f8f7f2;padding:14px 18px;border-left:3px solid #d9742b;">
        <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#d9742b;margin-bottom:4px;">EMPREITEIRO</div>
        <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{nome_empreiteiro}}, pessoa colectiva n.º {{nif_empreiteiro}}</div>
      </div>
      <div style="background:#f8f7f2;padding:14px 18px;border-left:3px solid #d9742b;">
        <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#d9742b;margin-bottom:4px;">DONO DE OBRA</div>
        <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{nome_dono_obra}}, pessoa colectiva n.º {{nif_dono_obra}}</div>
      </div>
    </div>

    <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.7;color:#444;margin-bottom:20px;">
      <p style="margin-bottom:12px;">O Primeiro Outorgante, na qualidade de Empreiteiro, e o Segundo Outorgante, na qualidade de Dono de Obra, decidem celebrar o presente contrato de empreitada, que se rege pelas cláusulas seguintes:</p>
    </div>
  </div>

  <!-- SECTIONS -->
  <div style="margin:0 52px;">
  <!-- PRIMEIRA -->
  <div style="margin-top:28px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
      <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:700;color:#d9742b;min-width:32px;">PRIMEIRA.</span>
      <div style="flex:1;height:1px;background:linear-gradient(90deg,#d9742b44,transparent);"></div>
    </div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;color:#1e293b;margin-bottom:6px;padding-left:44px;">DO OBJECTO</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.75;color:#444;padding-left:44px;">O presente contrato tem por objecto a execução, pelo PRIMEIRO OUTORGANTE enquanto empreiteiro, da obra descrita como: {{descricao_obra}}, a realizar no local sito em {{local_obra}}, conforme especificações técnicas e projecto que ficam a fazer parte integrante do presente contrato.</div>
  </div>  <!-- SEGUNDA -->
  <div style="margin-top:28px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
      <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:700;color:#d9742b;min-width:32px;">SEGUNDA.</span>
      <div style="flex:1;height:1px;background:linear-gradient(90deg,#d9742b44,transparent);"></div>
    </div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;color:#1e293b;margin-bottom:6px;padding-left:44px;">DO VALOR E PAGAMENTO</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.75;color:#444;padding-left:44px;">O valor global da empreitada é de Kz {{valor_empreitada}} ({{valor_empreitada}} Kwanzas), a ser pago da seguinte forma: {{forma_pagamento}}. O presente valor inclui todos os materiais, mão-de-obra e equipamentos necessários à boa execução da obra.</div>
  </div>  <!-- TERCEIRA -->
  <div style="margin-top:28px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
      <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:700;color:#d9742b;min-width:32px;">TERCEIRA.</span>
      <div style="flex:1;height:1px;background:linear-gradient(90deg,#d9742b44,transparent);"></div>
    </div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;color:#1e293b;margin-bottom:6px;padding-left:44px;">DO PRAZO</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.75;color:#444;padding-left:44px;">A empreitada terá início em {{data_inicio}} e o prazo de execução é de {{prazo_execucao}}, contado a partir da data de início. O empreiteiro obriga-se a cumprir rigorosamente o cronograma aprovado.</div>
  </div>  <!-- QUARTA -->
  <div style="margin-top:28px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
      <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:700;color:#d9742b;min-width:32px;">QUARTA.</span>
      <div style="flex:1;height:1px;background:linear-gradient(90deg,#d9742b44,transparent);"></div>
    </div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;color:#1e293b;margin-bottom:6px;padding-left:44px;">DA GARANTIA</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.75;color:#444;padding-left:44px;">O empreiteiro concede uma garantia de {{garantia}} contra quaisquer defeitos de construção ou vicissitudes da obra, contado a partir da data de recepção definitiva da obra.</div>
  </div>  <!-- QUINTA -->
  <div style="margin-top:28px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
      <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:700;color:#d9742b;min-width:32px;">QUINTA.</span>
      <div style="flex:1;height:1px;background:linear-gradient(90deg,#d9742b44,transparent);"></div>
    </div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;color:#1e293b;margin-bottom:6px;padding-left:44px;">DA RESPONSABILIDADE TÉCNICA</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.75;color:#444;padding-left:44px;">O responsável técnico pela obra é {{responsavel_tecnico}}, que se responsabiliza pela correcta execução dos trabalhos de acordo com as normas técnicas aplicáveis e a legislação em vigor.</div>
  </div>
  </div>

  <!-- CLOSING -->
  <div style="margin:0 52px;">
  <!-- SIGNATURE AREA -->
  <div style="margin-top:48px;padding-top:32px;border-top:2px solid #e4e0d8;">
    <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;font-weight:600;color:#1e293b;margin-bottom:24px;">Cláusulas Finais</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.7;color:#444;margin-bottom:24px;">
      <p style="margin-bottom:12px;">O presente contrato é celebrado em duas vias originais, ambas consideradas válidas para todos os efeitos legais, ficando um exemplar na posse de cada uma das Partes.</p>
      <p style="margin-bottom:12px;">As Partes elegem o foro da comarca de Luanda, com renúncia expressa a qualquer outro, por mais privilegiado que seja, para dirimir qualquer litígio decorrente do presente contrato.</p>
    </div>
    <div style="display:flex;gap:48px;justify-content:center;margin-top:32px;">
      <div style="text-align:center;flex:1;">
        <div style="border-bottom:1px solid #ccc;padding-bottom:48px;margin-bottom:8px;"></div>
        <div style="font-family:'DM Sans',sans-serif;font-size:10px;font-weight:600;color:#666;letter-spacing:0.08em;">{{nome_parte_a}}</div>
      </div>
      <div style="text-align:center;flex:1;">
        <div style="border-bottom:1px solid #ccc;padding-bottom:48px;margin-bottom:8px;"></div>
        <div style="font-family:'DM Sans',sans-serif;font-size:10px;font-weight:600;color:#666;letter-spacing:0.08em;">{{nome_parte_a}}</div>
      </div>
    </div>
  </div>
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
    <div style="font-family:'DM Sans',sans-serif;font-size:8px;letter-spacing:0.1em;color:#aaa;text-transform:uppercase;">Gerado por Agree • Sistema de Gestão de Contratos</div>
    <div style="display:flex;align-items:center;gap:4px;font-family:'DM Sans',sans-serif;font-size:8px;font-weight:700;color:rgba(0,0,0,0.15);letter-spacing:0.5px;">
      <svg width="10" height="10" viewBox="0 0 2000 2000" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0,2000) scale(0.1,-0.1)"><path d="M9810 17311 c-80 -26 -154 -80 -199 -145 -35 -51 -6334 -13066 -6351 -13122 -20 -67 -9 -189 23 -255 33 -68 97 -135 168 -174 51 -28 60 -30 164 -30 l110 1 2138 797 c1176 438 2152 804 2170 813 57 30 95 64 130 117 30 45 314 617 1328 2674 126 254 248 513 272 575 62 158 161 376 262 578 550 1099 1323 2052 2295 2831 85 69 199 156 252 194 54 39 98 73 98 77 0 4 -550 1112 -1222 2463 -1341 2697 -1246 2518 -1373 2581 -51 25 -73 29 -150 31 -49 1 -101 -1 -115 -6z" fill="currentColor"/><path d="M12592 11764 c-114 -115 -264 -275 -333 -355 -854 -1001 -1414 -2184 -1539 -3254 -6 -49 -14 -178 -17 -285 l-6 -196 538 -1059 c295 -583 567 -1118 603 -1190 78 -154 134 -220 220 -258 159 -70 4221 -1570 4279 -1580 160 -28 332 76 392 238 25 66 28 170 7 236 -13 43 -3909 7885 -3926 7903 -5 5 -99 -81 -218 -200z" fill="currentColor"/></g></svg>
      Agree
    </div>
  </div>
</div>
</div>`,
    fields: [
      { name: 'nome_empreiteiro', label: 'Nome do Empreiteiro', type: 'text', required: true },
      { name: 'nif_empreiteiro', label: 'NIF do Empreiteiro', type: 'text', required: true },
      { name: 'nome_dono_obra', label: 'Nome do Dono de Obra', type: 'text', required: true },
      { name: 'nif_dono_obra', label: 'NIF do Dono de Obra', type: 'text', required: true },
      { name: 'descricao_obra', label: 'Descrição da Obra', type: 'textarea', required: true },
      { name: 'local_obra', label: 'Local da Obra', type: 'text', required: true },
      { name: 'valor_empreitada', label: 'Valor da Empreitada (Kz)', type: 'text', required: true },
      { name: 'prazo_execucao', label: 'Prazo de Execução', type: 'text', required: true },
      { name: 'data_inicio', label: 'Data de Início', type: 'date', required: true },
      { name: 'garantia', label: 'Período de Garantia', type: 'text', required: true },
      { name: 'forma_pagamento', label: 'Forma de Pagamento', type: 'text', required: true },
      { name: 'responsavel_tecnico', label: 'Responsável Técnico', type: 'text', required: false },
      { name: 'referencia', label: 'Referência', type: 'text', required: true },
      { name: 'data_celebracao', label: 'Data de Celebração', type: 'date', required: true },
    ],
    is_system: true,
  },
  {
    id: 'built-in-7',
    name: 'Contrato de Mandato',
    description: 'Contrato de mandato para representação — design formal burgundy com acento dourado suave',
    category: 'Jurídico',
    content: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
</style></head><body>
<div style="font-family:'DM Sans',sans-serif;max-width:820px;margin:0 auto;background:#fff;border:1px solid #e4e0d8;">

  <!-- HEADER BAND -->
  <div style="background:#5c1a2e;padding:0 52px;position:relative;">
    <div style="height:4px;background:linear-gradient(90deg,#c9a84c 0%,#f1d074 50%,#c9a84c 100%);position:absolute;top:0;left:0;right:0;"></div>
    <div style="padding-top:40px;padding-bottom:0;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;">
        <div style="display:flex;align-items:center;gap:10px;opacity:0.55;color:#fff;">
          <div style="color:#c9a84c;"><svg width="20" height="20" viewBox="0 0 2000 2000" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0,2000) scale(0.1,-0.1)"><path d="M9810 17311 c-80 -26 -154 -80 -199 -145 -35 -51 -6334 -13066 -6351 -13122 -20 -67 -9 -189 23 -255 33 -68 97 -135 168 -174 51 -28 60 -30 164 -30 l110 1 2138 797 c1176 438 2152 804 2170 813 57 30 95 64 130 117 30 45 314 617 1328 2674 126 254 248 513 272 575 62 158 161 376 262 578 550 1099 1323 2052 2295 2831 85 69 199 156 252 194 54 39 98 73 98 77 0 4 -550 1112 -1222 2463 -1341 2697 -1246 2518 -1373 2581 -51 25 -73 29 -150 31 -49 1 -101 -1 -115 -6z" fill="currentColor"/><path d="M12592 11764 c-114 -115 -264 -275 -333 -355 -854 -1001 -1414 -2184 -1539 -3254 -6 -49 -14 -178 -17 -285 l-6 -196 538 -1059 c295 -583 567 -1118 603 -1190 78 -154 134 -220 220 -258 159 -70 4221 -1570 4279 -1580 160 -28 332 76 392 238 25 66 28 170 7 236 -13 43 -3909 7885 -3926 7903 -5 5 -99 -81 -218 -200z" fill="currentColor"/></g></svg></div>
          <span style="font-size:10px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#c9a84c;">Agree</span>
          <span style="color:rgba(255,255,255,0.2);font-size:10px;">·</span>
          <span style="font-size:10px;letter-spacing:0.08em;color:rgba(255,255,255,0.4);">{{referencia}}</span>
        </div>
        <div style="text-align:right;">
          <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:500;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:4px;">Data</div>
          <div style="font-family:'DM Sans',sans-serif;font-size:12px;font-weight:300;color:rgba(255,255,255,0.7);">{{data_celebracao}}</div>
        </div>
      </div>
      <div style="font-family:'DM Sans',sans-serif;font-size:10px;font-weight:500;letter-spacing:0.22em;text-transform:uppercase;color:#c9a84c;margin-bottom:10px;">Contrato de Mandato</div>


  <!-- TITLE -->
  <div style="text-align:center;padding:32px 52px 8px;border-bottom:1px solid #e4e0d8;">
    <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:600;color:#5c1a2e;letter-spacing:0.03em;margin-bottom:4px;">Contrato de Mandato para Representação</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;color:#888;letter-spacing:0.1em;margin-bottom:12px;">que entre si celebram</div>
  </div>

  <!-- PARTIES -->
  <div style="margin:20px 52px 0;">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
      <div style="background:#f8f7f2;padding:14px 18px;border-left:3px solid #c9a84c;">
        <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#c9a84c;margin-bottom:4px;">MANDANTE</div>
        <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{nome_mandante}}, pessoa colectiva n.º {{nif_mandante}}</div>
      </div>
      <div style="background:#f8f7f2;padding:14px 18px;border-left:3px solid #c9a84c;">
        <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#c9a84c;margin-bottom:4px;">MANDATÁRIO</div>
        <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{nome_mandatario}}, pessoa colectiva n.º {{nif_mandatario}}</div>
      </div>
    </div>

    <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.7;color:#444;margin-bottom:20px;">
      <p style="margin-bottom:12px;">O Primeiro Outorgante, na qualidade de Mandante, e o Segundo Outorgante, na qualidade de Mandatário, decidem celebrar o presente contrato de mandato, que se rege pelas cláusulas seguintes:</p>
    </div>
  </div>

  <!-- SECTIONS -->
  <div style="margin:0 52px;">
  <!-- PRIMEIRA -->
  <div style="margin-top:28px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
      <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:700;color:#c9a84c;min-width:32px;">PRIMEIRA.</span>
      <div style="flex:1;height:1px;background:linear-gradient(90deg,#c9a84c44,transparent);"></div>
    </div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;color:#5c1a2e;margin-bottom:6px;padding-left:44px;">DO OBJECTO</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.75;color:#444;padding-left:44px;">O presente contrato tem por objecto a concessão de mandato pelo PRIMEIRO OUTORGANTE ao SEGUNDO OUTORGANTE, para representação e prática dos actos descritos no objeto do mandato: {{objeto_mandato}}.</div>
  </div>  <!-- SEGUNDA -->
  <div style="margin-top:28px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
      <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:700;color:#c9a84c;min-width:32px;">SEGUNDA.</span>
      <div style="flex:1;height:1px;background:linear-gradient(90deg,#c9a84c44,transparent);"></div>
    </div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;color:#5c1a2e;margin-bottom:6px;padding-left:44px;">DOS PODERES</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.75;color:#444;padding-left:44px;">O Mandatário fica investido dos seguintes poderes para o exercício do presente mandato: {{poderes}}. Os poderes conferidos são exercidos nos termos da lei e no exclusivo interesse do Mandante.</div>
  </div>  <!-- TERCEIRA -->
  <div style="margin-top:28px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
      <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:700;color:#c9a84c;min-width:32px;">TERCEIRA.</span>
      <div style="flex:1;height:1px;background:linear-gradient(90deg,#c9a84c44,transparent);"></div>
    </div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;color:#5c1a2e;margin-bottom:6px;padding-left:44px;">DA REMUNERAÇÃO</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.75;color:#444;padding-left:44px;">O Mandante pagará ao Mandatário, como contrapartida do presente mandato, o montante de Kz {{remuneracao}}, ou, na ausência de remuneração definida, o mandato considera-se gratuito nos termos do Código Civil.</div>
  </div>  <!-- QUARTA -->
  <div style="margin-top:28px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
      <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:700;color:#c9a84c;min-width:32px;">QUARTA.</span>
      <div style="flex:1;height:1px;background:linear-gradient(90deg,#c9a84c44,transparent);"></div>
    </div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;color:#5c1a2e;margin-bottom:6px;padding-left:44px;">DO PRAZO</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.75;color:#444;padding-left:44px;">O presente mandato vigorará pelo período de {{prazo_mandato}}, contado da presente data, podendo ser renovado por acordo escrito das Partes.</div>
  </div>  <!-- QUINTA -->
  <div style="margin-top:28px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
      <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:700;color:#c9a84c;min-width:32px;">QUINTA.</span>
      <div style="flex:1;height:1px;background:linear-gradient(90deg,#c9a84c44,transparent);"></div>
    </div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;color:#5c1a2e;margin-bottom:6px;padding-left:44px;">DA PRESTAÇÃO DE CONTAS</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.75;color:#444;padding-left:44px;">O Mandatário obriga-se a prestar contas ao Mandante sempre que solicitado e, obrigatoriamente, no termo do mandato, apresentando relatório detalhado de todos os actos praticados.</div>
  </div>
  </div>

  <!-- CLOSING -->
  <div style="margin:0 52px;">
  <!-- SIGNATURE AREA -->
  <div style="margin-top:48px;padding-top:32px;border-top:2px solid #e4e0d8;">
    <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;font-weight:600;color:#5c1a2e;margin-bottom:24px;">Cláusulas Finais</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.7;color:#444;margin-bottom:24px;">
      <p style="margin-bottom:12px;">O presente contrato é celebrado em duas vias originais, ambas consideradas válidas para todos os efeitos legais, ficando um exemplar na posse de cada uma das Partes.</p>
      <p style="margin-bottom:12px;">As Partes elegem o foro da comarca de Luanda, com renúncia expressa a qualquer outro, por mais privilegiado que seja, para dirimir qualquer litígio decorrente do presente contrato.</p>
    </div>
    <div style="display:flex;gap:48px;justify-content:center;margin-top:32px;">
      <div style="text-align:center;flex:1;">
        <div style="border-bottom:1px solid #ccc;padding-bottom:48px;margin-bottom:8px;"></div>
        <div style="font-family:'DM Sans',sans-serif;font-size:10px;font-weight:600;color:#666;letter-spacing:0.08em;">{{nome_parte_a}}</div>
      </div>
      <div style="text-align:center;flex:1;">
        <div style="border-bottom:1px solid #ccc;padding-bottom:48px;margin-bottom:8px;"></div>
        <div style="font-family:'DM Sans',sans-serif;font-size:10px;font-weight:600;color:#666;letter-spacing:0.08em;">{{nome_parte_a}}</div>
      </div>
    </div>
  </div>
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
    <div style="font-family:'DM Sans',sans-serif;font-size:8px;letter-spacing:0.1em;color:#aaa;text-transform:uppercase;">Gerado por Agree • Sistema de Gestão de Contratos</div>
    <div style="display:flex;align-items:center;gap:4px;font-family:'DM Sans',sans-serif;font-size:8px;font-weight:700;color:rgba(0,0,0,0.15);letter-spacing:0.5px;">
      <svg width="10" height="10" viewBox="0 0 2000 2000" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0,2000) scale(0.1,-0.1)"><path d="M9810 17311 c-80 -26 -154 -80 -199 -145 -35 -51 -6334 -13066 -6351 -13122 -20 -67 -9 -189 23 -255 33 -68 97 -135 168 -174 51 -28 60 -30 164 -30 l110 1 2138 797 c1176 438 2152 804 2170 813 57 30 95 64 130 117 30 45 314 617 1328 2674 126 254 248 513 272 575 62 158 161 376 262 578 550 1099 1323 2052 2295 2831 85 69 199 156 252 194 54 39 98 73 98 77 0 4 -550 1112 -1222 2463 -1341 2697 -1246 2518 -1373 2581 -51 25 -73 29 -150 31 -49 1 -101 -1 -115 -6z" fill="currentColor"/><path d="M12592 11764 c-114 -115 -264 -275 -333 -355 -854 -1001 -1414 -2184 -1539 -3254 -6 -49 -14 -178 -17 -285 l-6 -196 538 -1059 c295 -583 567 -1118 603 -1190 78 -154 134 -220 220 -258 159 -70 4221 -1570 4279 -1580 160 -28 332 76 392 238 25 66 28 170 7 236 -13 43 -3909 7885 -3926 7903 -5 5 -99 -81 -218 -200z" fill="currentColor"/></g></svg>
      Agree
    </div>
  </div>
</div>
</div>`,
    fields: [
      { name: 'nome_mandante', label: 'Nome do Mandante', type: 'text', required: true },
      { name: 'nif_mandante', label: 'NIF do Mandante', type: 'text', required: true },
      { name: 'nome_mandatario', label: 'Nome do Mandatário', type: 'text', required: true },
      { name: 'nif_mandatario', label: 'NIF do Mandatário', type: 'text', required: true },
      { name: 'objeto_mandato', label: 'Objeto do Mandato', type: 'textarea', required: true },
      { name: 'prazo_mandato', label: 'Prazo do Mandato', type: 'text', required: true },
      { name: 'remuneracao', label: 'Remuneração (Kz)', type: 'text', required: false },
      { name: 'poderes', label: 'Poderes Concedidos', type: 'textarea', required: true },
      { name: 'data_celebracao', label: 'Data de Celebração', type: 'date', required: true },
      { name: 'referencia', label: 'Referência', type: 'text', required: true },
    ],
    is_system: true,
  },
  {
    id: 'built-in-8',
    name: 'Contrato de Sociedade',
    description: 'Contrato de sociedade para parceria empresarial — design institucional azul marinho com acento prateado',
    category: 'Comercial',
    content: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
</style></head><body>
<div style="font-family:'DM Sans',sans-serif;max-width:820px;margin:0 auto;background:#fff;border:1px solid #e4e0d8;">

  <!-- HEADER BAND -->
  <div style="background:#0a1e3d;padding:0 52px;position:relative;">
    <div style="height:4px;background:linear-gradient(90deg,#94a3b8 0%,#bccbe0 50%,#94a3b8 100%);position:absolute;top:0;left:0;right:0;"></div>
    <div style="padding-top:40px;padding-bottom:0;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;">
        <div style="display:flex;align-items:center;gap:10px;opacity:0.55;color:#fff;">
          <div style="color:#94a3b8;"><svg width="20" height="20" viewBox="0 0 2000 2000" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0,2000) scale(0.1,-0.1)"><path d="M9810 17311 c-80 -26 -154 -80 -199 -145 -35 -51 -6334 -13066 -6351 -13122 -20 -67 -9 -189 23 -255 33 -68 97 -135 168 -174 51 -28 60 -30 164 -30 l110 1 2138 797 c1176 438 2152 804 2170 813 57 30 95 64 130 117 30 45 314 617 1328 2674 126 254 248 513 272 575 62 158 161 376 262 578 550 1099 1323 2052 2295 2831 85 69 199 156 252 194 54 39 98 73 98 77 0 4 -550 1112 -1222 2463 -1341 2697 -1246 2518 -1373 2581 -51 25 -73 29 -150 31 -49 1 -101 -1 -115 -6z" fill="currentColor"/><path d="M12592 11764 c-114 -115 -264 -275 -333 -355 -854 -1001 -1414 -2184 -1539 -3254 -6 -49 -14 -178 -17 -285 l-6 -196 538 -1059 c295 -583 567 -1118 603 -1190 78 -154 134 -220 220 -258 159 -70 4221 -1570 4279 -1580 160 -28 332 76 392 238 25 66 28 170 7 236 -13 43 -3909 7885 -3926 7903 -5 5 -99 -81 -218 -200z" fill="currentColor"/></g></svg></div>
          <span style="font-size:10px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#94a3b8;">Agree</span>
          <span style="color:rgba(255,255,255,0.2);font-size:10px;">·</span>
          <span style="font-size:10px;letter-spacing:0.08em;color:rgba(255,255,255,0.4);">{{referencia}}</span>
        </div>
        <div style="text-align:right;">
          <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:500;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:4px;">Data</div>
          <div style="font-family:'DM Sans',sans-serif;font-size:12px;font-weight:300;color:rgba(255,255,255,0.7);">{{data_celebracao}}</div>
        </div>
      </div>
      <div style="font-family:'DM Sans',sans-serif;font-size:10px;font-weight:500;letter-spacing:0.22em;text-transform:uppercase;color:#94a3b8;margin-bottom:10px;">Contrato de Sociedade</div>


  <!-- TITLE -->
  <div style="text-align:center;padding:32px 52px 8px;border-bottom:1px solid #e4e0d8;">
    <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:600;color:#0a1e3d;letter-spacing:0.03em;margin-bottom:4px;">Contrato de Constituição de Sociedade</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;color:#888;letter-spacing:0.1em;margin-bottom:12px;">que entre si celebram</div>
  </div>

  <!-- PARTIES -->
  <div style="margin:20px 52px 0;">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
      <div style="background:#f8f7f2;padding:14px 18px;border-left:3px solid #94a3b8;">
        <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#94a3b8;margin-bottom:4px;">SÓCIO 1</div>
        <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{nome_socio1}}, pessoa colectiva n.º {{nif_socio1}}</div>
      </div>
      <div style="background:#f8f7f2;padding:14px 18px;border-left:3px solid #94a3b8;">
        <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#94a3b8;margin-bottom:4px;">SÓCIO 2</div>
        <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{nome_socio2}}, pessoa colectiva n.º {{nif_socio2}}</div>
      </div>
    </div>

    <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.7;color:#444;margin-bottom:20px;">
      <p style="margin-bottom:12px;">Os outorgantes, adiante designados por Sócios, decidem constituir uma sociedade comercial nos termos e condições das cláusulas seguintes:</p>
    </div>
  </div>

  <!-- SECTIONS -->
  <div style="margin:0 52px;">
  <!-- PRIMEIRA -->
  <div style="margin-top:28px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
      <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:700;color:#94a3b8;min-width:32px;">PRIMEIRA.</span>
      <div style="flex:1;height:1px;background:linear-gradient(90deg,#94a3b844,transparent);"></div>
    </div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;color:#0a1e3d;margin-bottom:6px;padding-left:44px;">DA CONSTITUIÇÃO</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.75;color:#444;padding-left:44px;">Os outorgantes constituem uma sociedade comercial com a denominação social {{nome_empresa}}, que se rege pelo presente contrato e, subsidiariamente, pela legislação comercial aplicável.</div>
  </div>  <!-- SEGUNDA -->
  <div style="margin-top:28px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
      <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:700;color:#94a3b8;min-width:32px;">SEGUNDA.</span>
      <div style="flex:1;height:1px;background:linear-gradient(90deg,#94a3b844,transparent);"></div>
    </div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;color:#0a1e3d;margin-bottom:6px;padding-left:44px;">DO OBJECTO</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.75;color:#444;padding-left:44px;">A sociedade tem por objecto social: {{objeto_social}}. A sociedade poderá ainda realizar todas as operações relacionadas directa ou indirectamente com o seu objecto.</div>
  </div>  <!-- TERCEIRA -->
  <div style="margin-top:28px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
      <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:700;color:#94a3b8;min-width:32px;">TERCEIRA.</span>
      <div style="flex:1;height:1px;background:linear-gradient(90deg,#94a3b844,transparent);"></div>
    </div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;color:#0a1e3d;margin-bottom:6px;padding-left:44px;">DO CAPITAL</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.75;color:#444;padding-left:44px;">O capital social é de Kz {{capital_social}}, integralmente realizado em dinheiro, e encontra-se distribuído da seguinte forma: Sócio 1: {{quota_socio1}}%; Sócio 2: {{quota_socio2}}%.</div>
  </div>  <!-- QUARTA -->
  <div style="margin-top:28px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
      <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:700;color:#94a3b8;min-width:32px;">QUARTA.</span>
      <div style="flex:1;height:1px;background:linear-gradient(90deg,#94a3b844,transparent);"></div>
    </div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;color:#0a1e3d;margin-bottom:6px;padding-left:44px;">DA SEDE</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.75;color:#444;padding-left:44px;">A sede da sociedade situa-se em {{sede}}, podendo ser alterada por deliberação dos sócios tomada por maioria.</div>
  </div>  <!-- QUINTA -->
  <div style="margin-top:28px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
      <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:700;color:#94a3b8;min-width:32px;">QUINTA.</span>
      <div style="flex:1;height:1px;background:linear-gradient(90deg,#94a3b844,transparent);"></div>
    </div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;color:#0a1e3d;margin-bottom:6px;padding-left:44px;">DO PRAZO E DISSOLUÇÃO</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.75;color:#444;padding-left:44px;">A sociedade é celebrada pelo prazo de {{prazo_sociedade}}, contado da presente data, podendo ser dissolvida antecipadamente por deliberação unânime dos sócios.</div>
  </div>
  </div>

  <!-- CLOSING -->
  <div style="margin:0 52px;">
  <!-- SIGNATURE AREA -->
  <div style="margin-top:48px;padding-top:32px;border-top:2px solid #e4e0d8;">
    <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;font-weight:600;color:#0a1e3d;margin-bottom:24px;">Cláusulas Finais</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.7;color:#444;margin-bottom:24px;">
      <p style="margin-bottom:12px;">O presente contrato é celebrado em duas vias originais, ambas consideradas válidas para todos os efeitos legais, ficando um exemplar na posse de cada uma das Partes.</p>
      <p style="margin-bottom:12px;">As Partes elegem o foro da comarca de Luanda, com renúncia expressa a qualquer outro, por mais privilegiado que seja, para dirimir qualquer litígio decorrente do presente contrato.</p>
    </div>
    <div style="display:flex;gap:48px;justify-content:center;margin-top:32px;">
      <div style="text-align:center;flex:1;">
        <div style="border-bottom:1px solid #ccc;padding-bottom:48px;margin-bottom:8px;"></div>
        <div style="font-family:'DM Sans',sans-serif;font-size:10px;font-weight:600;color:#666;letter-spacing:0.08em;">{{nome_parte_a}}</div>
      </div>
      <div style="text-align:center;flex:1;">
        <div style="border-bottom:1px solid #ccc;padding-bottom:48px;margin-bottom:8px;"></div>
        <div style="font-family:'DM Sans',sans-serif;font-size:10px;font-weight:600;color:#666;letter-spacing:0.08em;">{{nome_parte_a}}</div>
      </div>
    </div>
  </div>
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
    <div style="font-family:'DM Sans',sans-serif;font-size:8px;letter-spacing:0.1em;color:#aaa;text-transform:uppercase;">Gerado por Agree • Sistema de Gestão de Contratos</div>
    <div style="display:flex;align-items:center;gap:4px;font-family:'DM Sans',sans-serif;font-size:8px;font-weight:700;color:rgba(0,0,0,0.15);letter-spacing:0.5px;">
      <svg width="10" height="10" viewBox="0 0 2000 2000" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0,2000) scale(0.1,-0.1)"><path d="M9810 17311 c-80 -26 -154 -80 -199 -145 -35 -51 -6334 -13066 -6351 -13122 -20 -67 -9 -189 23 -255 33 -68 97 -135 168 -174 51 -28 60 -30 164 -30 l110 1 2138 797 c1176 438 2152 804 2170 813 57 30 95 64 130 117 30 45 314 617 1328 2674 126 254 248 513 272 575 62 158 161 376 262 578 550 1099 1323 2052 2295 2831 85 69 199 156 252 194 54 39 98 73 98 77 0 4 -550 1112 -1222 2463 -1341 2697 -1246 2518 -1373 2581 -51 25 -73 29 -150 31 -49 1 -101 -1 -115 -6z" fill="currentColor"/><path d="M12592 11764 c-114 -115 -264 -275 -333 -355 -854 -1001 -1414 -2184 -1539 -3254 -6 -49 -14 -178 -17 -285 l-6 -196 538 -1059 c295 -583 567 -1118 603 -1190 78 -154 134 -220 220 -258 159 -70 4221 -1570 4279 -1580 160 -28 332 76 392 238 25 66 28 170 7 236 -13 43 -3909 7885 -3926 7903 -5 5 -99 -81 -218 -200z" fill="currentColor"/></g></svg>
      Agree
    </div>
  </div>
</div>
</div>`,
    fields: [
      { name: 'nome_socio1', label: 'Nome do Sócio 1', type: 'text', required: true },
      { name: 'nif_socio1', label: 'NIF do Sócio 1', type: 'text', required: true },
      { name: 'nome_socio2', label: 'Nome do Sócio 2', type: 'text', required: true },
      { name: 'nif_socio2', label: 'NIF do Sócio 2', type: 'text', required: true },
      { name: 'nome_empresa', label: 'Nome da Empresa', type: 'text', required: true },
      { name: 'objeto_social', label: 'Objeto Social', type: 'textarea', required: true },
      { name: 'capital_social', label: 'Capital Social (Kz)', type: 'text', required: true },
      { name: 'quota_socio1', label: 'Quota Sócio 1 (%)', type: 'text', required: true },
      { name: 'quota_socio2', label: 'Quota Sócio 2 (%)', type: 'text', required: true },
      { name: 'sede', label: 'Sede da Sociedade', type: 'text', required: true },
      { name: 'prazo_sociedade', label: 'Prazo da Sociedade', type: 'text', required: true },
      { name: 'data_celebracao', label: 'Data de Celebração', type: 'date', required: true },
      { name: 'referencia', label: 'Referência', type: 'text', required: true },
    ],
    is_system: true,
  },
  {
    id: 'built-in-9',
    name: 'Contrato de Consultoria Empresarial',
    description: 'Contrato de consultoria empresarial — design clean moderno com acento índigo',
    category: 'Serviços',
    content: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
</style></head><body>
<div style="font-family:'DM Sans',sans-serif;max-width:820px;margin:0 auto;background:#fff;border:1px solid #e4e0d8;">

  <!-- HEADER BAND -->
  <div style="background:#1e1b4b;padding:0 52px;position:relative;">
    <div style="height:4px;background:linear-gradient(90deg,#6366f1 0%,#8b8eff 50%,#6366f1 100%);position:absolute;top:0;left:0;right:0;"></div>
    <div style="padding-top:40px;padding-bottom:0;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;">
        <div style="display:flex;align-items:center;gap:10px;opacity:0.55;color:#fff;">
          <div style="color:#6366f1;"><svg width="20" height="20" viewBox="0 0 2000 2000" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0,2000) scale(0.1,-0.1)"><path d="M9810 17311 c-80 -26 -154 -80 -199 -145 -35 -51 -6334 -13066 -6351 -13122 -20 -67 -9 -189 23 -255 33 -68 97 -135 168 -174 51 -28 60 -30 164 -30 l110 1 2138 797 c1176 438 2152 804 2170 813 57 30 95 64 130 117 30 45 314 617 1328 2674 126 254 248 513 272 575 62 158 161 376 262 578 550 1099 1323 2052 2295 2831 85 69 199 156 252 194 54 39 98 73 98 77 0 4 -550 1112 -1222 2463 -1341 2697 -1246 2518 -1373 2581 -51 25 -73 29 -150 31 -49 1 -101 -1 -115 -6z" fill="currentColor"/><path d="M12592 11764 c-114 -115 -264 -275 -333 -355 -854 -1001 -1414 -2184 -1539 -3254 -6 -49 -14 -178 -17 -285 l-6 -196 538 -1059 c295 -583 567 -1118 603 -1190 78 -154 134 -220 220 -258 159 -70 4221 -1570 4279 -1580 160 -28 332 76 392 238 25 66 28 170 7 236 -13 43 -3909 7885 -3926 7903 -5 5 -99 -81 -218 -200z" fill="currentColor"/></g></svg></div>
          <span style="font-size:10px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#6366f1;">Agree</span>
          <span style="color:rgba(255,255,255,0.2);font-size:10px;">·</span>
          <span style="font-size:10px;letter-spacing:0.08em;color:rgba(255,255,255,0.4);">{{referencia}}</span>
        </div>
        <div style="text-align:right;">
          <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:500;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:4px;">Data</div>
          <div style="font-family:'DM Sans',sans-serif;font-size:12px;font-weight:300;color:rgba(255,255,255,0.7);">{{data_celebracao}}</div>
        </div>
      </div>
      <div style="font-family:'DM Sans',sans-serif;font-size:10px;font-weight:500;letter-spacing:0.22em;text-transform:uppercase;color:#6366f1;margin-bottom:10px;">Contrato de Consultoria</div>


  <!-- TITLE -->
  <div style="text-align:center;padding:32px 52px 8px;border-bottom:1px solid #e4e0d8;">
    <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:600;color:#1e1b4b;letter-spacing:0.03em;margin-bottom:4px;">Contrato de Prestação de Serviços de Consultoria</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;color:#888;letter-spacing:0.1em;margin-bottom:12px;">que entre si celebram</div>
  </div>

  <!-- PARTIES -->
  <div style="margin:20px 52px 0;">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
      <div style="background:#f8f7f2;padding:14px 18px;border-left:3px solid #6366f1;">
        <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#6366f1;margin-bottom:4px;">CONSULTOR</div>
        <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{nome_consultor}}, pessoa colectiva n.º {{nif_consultor}}</div>
      </div>
      <div style="background:#f8f7f2;padding:14px 18px;border-left:3px solid #6366f1;">
        <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#6366f1;margin-bottom:4px;">CLIENTE</div>
        <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{nome_cliente}}, pessoa colectiva n.º {{nif_cliente}}</div>
      </div>
    </div>

    <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.7;color:#444;margin-bottom:20px;">
      <p style="margin-bottom:12px;">O Primeiro Outorgante, na qualidade de Consultor, e o Segundo Outorgante, na qualidade de Cliente, decidem celebrar o presente contrato de consultoria, que se rege pelas cláusulas seguintes:</p>
    </div>
  </div>

  <!-- SECTIONS -->
  <div style="margin:0 52px;">
  <!-- PRIMEIRA -->
  <div style="margin-top:28px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
      <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:700;color:#6366f1;min-width:32px;">PRIMEIRA.</span>
      <div style="flex:1;height:1px;background:linear-gradient(90deg,#6366f144,transparent);"></div>
    </div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;color:#1e1b4b;margin-bottom:6px;padding-left:44px;">DO OBJECTO</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.75;color:#444;padding-left:44px;">O presente contrato tem por objecto a prestação de serviços de consultoria pelo PRIMEIRO OUTORGANTE ao SEGUNDO OUTORGANTE, na área de {{objeto_consultoria}}.</div>
  </div>  <!-- SEGUNDA -->
  <div style="margin-top:28px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
      <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:700;color:#6366f1;min-width:32px;">SEGUNDA.</span>
      <div style="flex:1;height:1px;background:linear-gradient(90deg,#6366f144,transparent);"></div>
    </div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;color:#1e1b4b;margin-bottom:6px;padding-left:44px;">DOS HONORÁRIOS</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.75;color:#444;padding-left:44px;">Pelos serviços prestados, o Cliente pagará ao Consultor o montante de Kz {{honorarios}}, liquidado de acordo com a seguinte forma de pagamento: {{forma_pagamento}}.</div>
  </div>  <!-- TERCEIRA -->
  <div style="margin-top:28px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
      <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:700;color:#6366f1;min-width:32px;">TERCEIRA.</span>
      <div style="flex:1;height:1px;background:linear-gradient(90deg,#6366f144,transparent);"></div>
    </div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;color:#1e1b4b;margin-bottom:6px;padding-left:44px;">DO PRAZO</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.75;color:#444;padding-left:44px;">Os serviços de consultoria serão prestados durante o período de {{prazo_execucao}}, com início em {{data_inicio}}, no seguinte local: {{local_prestacao}}.</div>
  </div>  <!-- QUARTA -->
  <div style="margin-top:28px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
      <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:700;color:#6366f1;min-width:32px;">QUARTA.</span>
      <div style="flex:1;height:1px;background:linear-gradient(90deg,#6366f144,transparent);"></div>
    </div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;color:#1e1b4b;margin-bottom:6px;padding-left:44px;">DOS ENTREGÁVEIS</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.75;color:#444;padding-left:44px;">No âmbito do presente contrato, o Consultor obriga-se a apresentar os seguintes entregáveis: {{entregaveis}}, nos prazos acordados entre as Partes.</div>
  </div>  <!-- QUINTA -->
  <div style="margin-top:28px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
      <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:700;color:#6366f1;min-width:32px;">QUINTA.</span>
      <div style="flex:1;height:1px;background:linear-gradient(90deg,#6366f144,transparent);"></div>
    </div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;color:#1e1b4b;margin-bottom:6px;padding-left:44px;">DA CONFIDENCIALIDADE</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.75;color:#444;padding-left:44px;">Toda a informação partilhada entre as Partes no âmbito deste contrato será tratada como confidencial e não poderá ser divulgada a terceiros sem consentimento prévio escrito.</div>
  </div>
  </div>

  <!-- CLOSING -->
  <div style="margin:0 52px;">
  <!-- SIGNATURE AREA -->
  <div style="margin-top:48px;padding-top:32px;border-top:2px solid #e4e0d8;">
    <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;font-weight:600;color:#1e1b4b;margin-bottom:24px;">Cláusulas Finais</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.7;color:#444;margin-bottom:24px;">
      <p style="margin-bottom:12px;">O presente contrato é celebrado em duas vias originais, ambas consideradas válidas para todos os efeitos legais, ficando um exemplar na posse de cada uma das Partes.</p>
      <p style="margin-bottom:12px;">As Partes elegem o foro da comarca de Luanda, com renúncia expressa a qualquer outro, por mais privilegiado que seja, para dirimir qualquer litígio decorrente do presente contrato.</p>
    </div>
    <div style="display:flex;gap:48px;justify-content:center;margin-top:32px;">
      <div style="text-align:center;flex:1;">
        <div style="border-bottom:1px solid #ccc;padding-bottom:48px;margin-bottom:8px;"></div>
        <div style="font-family:'DM Sans',sans-serif;font-size:10px;font-weight:600;color:#666;letter-spacing:0.08em;">{{nome_parte_a}}</div>
      </div>
      <div style="text-align:center;flex:1;">
        <div style="border-bottom:1px solid #ccc;padding-bottom:48px;margin-bottom:8px;"></div>
        <div style="font-family:'DM Sans',sans-serif;font-size:10px;font-weight:600;color:#666;letter-spacing:0.08em;">{{nome_parte_a}}</div>
      </div>
    </div>
  </div>
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
    <div style="font-family:'DM Sans',sans-serif;font-size:8px;letter-spacing:0.1em;color:#aaa;text-transform:uppercase;">Gerado por Agree • Sistema de Gestão de Contratos</div>
    <div style="display:flex;align-items:center;gap:4px;font-family:'DM Sans',sans-serif;font-size:8px;font-weight:700;color:rgba(0,0,0,0.15);letter-spacing:0.5px;">
      <svg width="10" height="10" viewBox="0 0 2000 2000" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0,2000) scale(0.1,-0.1)"><path d="M9810 17311 c-80 -26 -154 -80 -199 -145 -35 -51 -6334 -13066 -6351 -13122 -20 -67 -9 -189 23 -255 33 -68 97 -135 168 -174 51 -28 60 -30 164 -30 l110 1 2138 797 c1176 438 2152 804 2170 813 57 30 95 64 130 117 30 45 314 617 1328 2674 126 254 248 513 272 575 62 158 161 376 262 578 550 1099 1323 2052 2295 2831 85 69 199 156 252 194 54 39 98 73 98 77 0 4 -550 1112 -1222 2463 -1341 2697 -1246 2518 -1373 2581 -51 25 -73 29 -150 31 -49 1 -101 -1 -115 -6z" fill="currentColor"/><path d="M12592 11764 c-114 -115 -264 -275 -333 -355 -854 -1001 -1414 -2184 -1539 -3254 -6 -49 -14 -178 -17 -285 l-6 -196 538 -1059 c295 -583 567 -1118 603 -1190 78 -154 134 -220 220 -258 159 -70 4221 -1570 4279 -1580 160 -28 332 76 392 238 25 66 28 170 7 236 -13 43 -3909 7885 -3926 7903 -5 5 -99 -81 -218 -200z" fill="currentColor"/></g></svg>
      Agree
    </div>
  </div>
</div>
</div>`,
    fields: [
      { name: 'nome_consultor', label: 'Nome do Consultor', type: 'text', required: true },
      { name: 'nif_consultor', label: 'NIF do Consultor', type: 'text', required: true },
      { name: 'nome_cliente', label: 'Nome do Cliente', type: 'text', required: true },
      { name: 'nif_cliente', label: 'NIF do Cliente', type: 'text', required: true },
      { name: 'objeto_consultoria', label: 'Objeto da Consultoria', type: 'textarea', required: true },
      { name: 'honorarios', label: 'Honorários (Kz)', type: 'text', required: true },
      { name: 'prazo_execucao', label: 'Prazo de Execução', type: 'text', required: true },
      { name: 'entregaveis', label: 'Entregáveis', type: 'textarea', required: true },
      { name: 'data_inicio', label: 'Data de Início', type: 'date', required: true },
      { name: 'local_prestacao', label: 'Local de Prestação', type: 'text', required: true },
      { name: 'forma_pagamento', label: 'Forma de Pagamento', type: 'text', required: true },
      { name: 'data_celebracao', label: 'Data de Celebração', type: 'date', required: true },
      { name: 'referencia', label: 'Referência', type: 'text', required: true },
    ],
    is_system: true,
  },
  {
    id: 'built-in-10',
    name: 'Acordo de Confidencialidade Unilateral',
    description: 'NDA unilateral para divulgação segura de informação — design charcoal com acento âmbar',
    category: 'Confidencialidade',
    content: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
</style></head><body>
<div style="font-family:'DM Sans',sans-serif;max-width:820px;margin:0 auto;background:#fff;border:1px solid #e4e0d8;">

  <!-- HEADER BAND -->
  <div style="background:#1c1917;padding:0 52px;position:relative;">
    <div style="height:4px;background:linear-gradient(90deg,#f59e0b 0%,#ffc633 50%,#f59e0b 100%);position:absolute;top:0;left:0;right:0;"></div>
    <div style="padding-top:40px;padding-bottom:0;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;">
        <div style="display:flex;align-items:center;gap:10px;opacity:0.55;color:#fff;">
          <div style="color:#f59e0b;"><svg width="20" height="20" viewBox="0 0 2000 2000" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0,2000) scale(0.1,-0.1)"><path d="M9810 17311 c-80 -26 -154 -80 -199 -145 -35 -51 -6334 -13066 -6351 -13122 -20 -67 -9 -189 23 -255 33 -68 97 -135 168 -174 51 -28 60 -30 164 -30 l110 1 2138 797 c1176 438 2152 804 2170 813 57 30 95 64 130 117 30 45 314 617 1328 2674 126 254 248 513 272 575 62 158 161 376 262 578 550 1099 1323 2052 2295 2831 85 69 199 156 252 194 54 39 98 73 98 77 0 4 -550 1112 -1222 2463 -1341 2697 -1246 2518 -1373 2581 -51 25 -73 29 -150 31 -49 1 -101 -1 -115 -6z" fill="currentColor"/><path d="M12592 11764 c-114 -115 -264 -275 -333 -355 -854 -1001 -1414 -2184 -1539 -3254 -6 -49 -14 -178 -17 -285 l-6 -196 538 -1059 c295 -583 567 -1118 603 -1190 78 -154 134 -220 220 -258 159 -70 4221 -1570 4279 -1580 160 -28 332 76 392 238 25 66 28 170 7 236 -13 43 -3909 7885 -3926 7903 -5 5 -99 -81 -218 -200z" fill="currentColor"/></g></svg></div>
          <span style="font-size:10px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#f59e0b;">Agree</span>
          <span style="color:rgba(255,255,255,0.2);font-size:10px;">·</span>
          <span style="font-size:10px;letter-spacing:0.08em;color:rgba(255,255,255,0.4);">{{referencia}}</span>
        </div>
        <div style="text-align:right;">
          <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:500;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:4px;">Data</div>
          <div style="font-family:'DM Sans',sans-serif;font-size:12px;font-weight:300;color:rgba(255,255,255,0.7);">{{data_celebracao}}</div>
        </div>
      </div>
      <div style="font-family:'DM Sans',sans-serif;font-size:10px;font-weight:500;letter-spacing:0.22em;text-transform:uppercase;color:#f59e0b;margin-bottom:10px;">Acordo de Confidencialidade</div>


  <!-- TITLE -->
  <div style="text-align:center;padding:32px 52px 8px;border-bottom:1px solid #e4e0d8;">
    <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:600;color:#1c1917;letter-spacing:0.03em;margin-bottom:4px;">Acordo de Confidencialidade Unilateral (NDA)</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;color:#888;letter-spacing:0.1em;margin-bottom:12px;">que entre si celebram</div>
  </div>

  <!-- PARTIES -->
  <div style="margin:20px 52px 0;">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
      <div style="background:#f8f7f2;padding:14px 18px;border-left:3px solid #f59e0b;">
        <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#f59e0b;margin-bottom:4px;">DIVULGADOR</div>
        <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{nome_divulgador}}, representada por {{representante_d}}</div>
      </div>
      <div style="background:#f8f7f2;padding:14px 18px;border-left:3px solid #f59e0b;">
        <div style="font-family:'DM Sans',sans-serif;font-size:8.5px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#f59e0b;margin-bottom:4px;">RECETOR</div>
        <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:#1a1a1a;">{{nome_receptor}}, representada por {{representante_r}}</div>
      </div>
    </div>

    <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.7;color:#444;margin-bottom:20px;">
      <p style="margin-bottom:12px;">O Primeiro Outorgante, na qualidade de Divulgador, e o Segundo Outorgante, na qualidade de Recetor, decidem celebrar o presente acordo de confidencialidade unilateral, que se rege pelas cláusulas seguintes:</p>
    </div>
  </div>

  <!-- SECTIONS -->
  <div style="margin:0 52px;">
  <!-- PRIMEIRA -->
  <div style="margin-top:28px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
      <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:700;color:#f59e0b;min-width:32px;">PRIMEIRA.</span>
      <div style="flex:1;height:1px;background:linear-gradient(90deg,#f59e0b44,transparent);"></div>
    </div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;color:#1c1917;margin-bottom:6px;padding-left:44px;">DO PROPÓSITO</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.75;color:#444;padding-left:44px;">O presente acordo tem por propósito permitir que o DIVULGADOR revele ao RECETOR determinadas informações confidenciais para o fim específico de: {{proposito}}.</div>
  </div>  <!-- SEGUNDA -->
  <div style="margin-top:28px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
      <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:700;color:#f59e0b;min-width:32px;">SEGUNDA.</span>
      <div style="flex:1;height:1px;background:linear-gradient(90deg,#f59e0b44,transparent);"></div>
    </div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;color:#1c1917;margin-bottom:6px;padding-left:44px;">DEFINIÇÃO DE INFORMAÇÃO CONFIDENCIAL</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.75;color:#444;padding-left:44px;">Considera-se informação confidencial toda e qualquer informação, independentemente da sua forma, comunicada pelo Divulgador ao Recetor no âmbito do propósito acima descrito.</div>
  </div>  <!-- TERCEIRA -->
  <div style="margin-top:28px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
      <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:700;color:#f59e0b;min-width:32px;">TERCEIRA.</span>
      <div style="flex:1;height:1px;background:linear-gradient(90deg,#f59e0b44,transparent);"></div>
    </div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;color:#1c1917;margin-bottom:6px;padding-left:44px;">OBRIGAÇÕES DO RECETOR</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.75;color:#444;padding-left:44px;">O Recetor obriga-se a: (i) não divulgar a informação confidencial a terceiros; (ii) utilizar a informação exclusivamente para o propósito definido; (iii) restringir o acesso à informação aos seus colaboradores que necessitem de a conhecer.</div>
  </div>  <!-- QUARTA -->
  <div style="margin-top:28px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
      <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:700;color:#f59e0b;min-width:32px;">QUARTA.</span>
      <div style="flex:1;height:1px;background:linear-gradient(90deg,#f59e0b44,transparent);"></div>
    </div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;color:#1c1917;margin-bottom:6px;padding-left:44px;">EXCLUSÕES</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.75;color:#444;padding-left:44px;">Não são consideradas informações confidenciais: {{inf_excluidas}}, bem como as informações que sejam ou venham a tornar-se de domínio público sem violação do presente acordo.</div>
  </div>  <!-- QUINTA -->
  <div style="margin-top:28px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
      <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:700;color:#f59e0b;min-width:32px;">QUINTA.</span>
      <div style="flex:1;height:1px;background:linear-gradient(90deg,#f59e0b44,transparent);"></div>
    </div>
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;color:#1c1917;margin-bottom:6px;padding-left:44px;">PRAZO E PENALIDADE</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.75;color:#444;padding-left:44px;">O presente acordo vigorará pelo período de {{prazo_confid}}. Em caso de violação do dever de confidencialidade, o Recetor pagará ao Divulgador uma penalidade de Kz {{valor_penalidade}}.</div>
  </div>
  </div>

  <!-- CLOSING -->
  <div style="margin:0 52px;">
  <!-- SIGNATURE AREA -->
  <div style="margin-top:48px;padding-top:32px;border-top:2px solid #e4e0d8;">
    <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;font-weight:600;color:#1c1917;margin-bottom:24px;">Cláusulas Finais</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.7;color:#444;margin-bottom:24px;">
      <p style="margin-bottom:12px;">O presente contrato é celebrado em duas vias originais, ambas consideradas válidas para todos os efeitos legais, ficando um exemplar na posse de cada uma das Partes.</p>
      <p style="margin-bottom:12px;">As Partes elegem o foro da comarca de Luanda, com renúncia expressa a qualquer outro, por mais privilegiado que seja, para dirimir qualquer litígio decorrente do presente contrato.</p>
    </div>
    <div style="display:flex;gap:48px;justify-content:center;margin-top:32px;">
      <div style="text-align:center;flex:1;">
        <div style="border-bottom:1px solid #ccc;padding-bottom:48px;margin-bottom:8px;"></div>
        <div style="font-family:'DM Sans',sans-serif;font-size:10px;font-weight:600;color:#666;letter-spacing:0.08em;">{{nome_parte_a}}</div>
      </div>
      <div style="text-align:center;flex:1;">
        <div style="border-bottom:1px solid #ccc;padding-bottom:48px;margin-bottom:8px;"></div>
        <div style="font-family:'DM Sans',sans-serif;font-size:10px;font-weight:600;color:#666;letter-spacing:0.08em;">{{nome_parte_a}}</div>
      </div>
    </div>
  </div>
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
    <div style="font-family:'DM Sans',sans-serif;font-size:8px;letter-spacing:0.1em;color:#aaa;text-transform:uppercase;">Gerado por Agree • Sistema de Gestão de Contratos</div>
    <div style="display:flex;align-items:center;gap:4px;font-family:'DM Sans',sans-serif;font-size:8px;font-weight:700;color:rgba(0,0,0,0.15);letter-spacing:0.5px;">
      <svg width="10" height="10" viewBox="0 0 2000 2000" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0,2000) scale(0.1,-0.1)"><path d="M9810 17311 c-80 -26 -154 -80 -199 -145 -35 -51 -6334 -13066 -6351 -13122 -20 -67 -9 -189 23 -255 33 -68 97 -135 168 -174 51 -28 60 -30 164 -30 l110 1 2138 797 c1176 438 2152 804 2170 813 57 30 95 64 130 117 30 45 314 617 1328 2674 126 254 248 513 272 575 62 158 161 376 262 578 550 1099 1323 2052 2295 2831 85 69 199 156 252 194 54 39 98 73 98 77 0 4 -550 1112 -1222 2463 -1341 2697 -1246 2518 -1373 2581 -51 25 -73 29 -150 31 -49 1 -101 -1 -115 -6z" fill="currentColor"/><path d="M12592 11764 c-114 -115 -264 -275 -333 -355 -854 -1001 -1414 -2184 -1539 -3254 -6 -49 -14 -178 -17 -285 l-6 -196 538 -1059 c295 -583 567 -1118 603 -1190 78 -154 134 -220 220 -258 159 -70 4221 -1570 4279 -1580 160 -28 332 76 392 238 25 66 28 170 7 236 -13 43 -3909 7885 -3926 7903 -5 5 -99 -81 -218 -200z" fill="currentColor"/></g></svg>
      Agree
    </div>
  </div>
</div>
</div>`,
    fields: [
      { name: 'nome_divulgador', label: 'Nome do Divulgador', type: 'text', required: true },
      { name: 'representante_d', label: 'Representante do Divulgador', type: 'text', required: true },
      { name: 'nome_receptor', label: 'Nome do Recetor', type: 'text', required: true },
      { name: 'representante_r', label: 'Representante do Recetor', type: 'text', required: true },
      { name: 'proposito', label: 'Propósito da Divulgação', type: 'textarea', required: true },
      { name: 'prazo_confid', label: 'Prazo de Confidencialidade', type: 'text', required: true },
      { name: 'inf_excluidas', label: 'Informações Excluídas', type: 'textarea', required: false },
      { name: 'valor_penalidade', label: 'Penalidade (Kz)', type: 'text', required: true },
      { name: 'lei_aplicavel', label: 'Lei Aplicável', type: 'text', required: true },
      { name: 'data_celebracao', label: 'Data de Celebração', type: 'date', required: true },
      { name: 'referencia', label: 'Referência', type: 'text', required: true },
    ],
    is_system: true,
  },
]

export const TEMPLATE_CATEGORIES: { name: string; icon: string }[] = [
  { name: 'Comercial', icon: 'briefcase' },
  { name: 'Confidencialidade', icon: 'shield' },
  { name: 'Imobiliário', icon: 'home' },
  { name: 'Recursos Humanos', icon: 'users' },
  { name: 'Serviços', icon: 'handshake' },
  { name: 'Construção', icon: 'hard-hat' },
  { name: 'Jurídico', icon: 'scale' },
]