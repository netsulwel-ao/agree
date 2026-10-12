import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Gera a div com a assinatura posicionada sobre a linha
const makeImgDiv = (url) =>
  `<div style="position:relative;height:52px;border-bottom:1px solid #ccc;margin-bottom:10px;">` +
  `<img src="${url}" alt="Assinatura" style="position:absolute;bottom:4px;left:0;max-height:44px;max-width:180px;object-fit:contain;" />` +
  `</div>`;

const { data: contracts } = await sb.from('contracts').select('id, title, content, signatures');

let fixed = 0;
for (const c of contracts || []) {
  if (!c.signatures?.length || !c.content) continue;

  let content = c.content;
  let changed = false;

  const signed = c.signatures.filter(s => s.signed && s.signatureUrl);
  for (const sig of signed) {
    if (content.includes(sig.signatureUrl)) {
      // Já está no HTML — mas pode estar mal posicionada (dentro da div em vez de substituir)
      // Verificar se está envolvida na estrutura correta (position:relative)
      if (content.includes(`position:relative;height:52px`) && content.includes(sig.signatureUrl)) {
        console.log(`  — Já correto: ${sig.email} em "${c.title}"`);
        continue;
      }
      // Está mal posicionada — remover e reinjetar
      content = content.replace(new RegExp(`<img[^>]*${sig.signatureUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^>]*/>`, 'g'), '');
    }

    const slotIndex = sig.slotIndex;

    if (slotIndex !== undefined && slotIndex !== null) {
      let idx = 0;
      content = content.replace(
        /(<div[^>]*height:52px[^>]*border-bottom[^>]*>)([\s\S]*?)(<\/div>)/gi,
        (m, o, inner, cl) => {
          const r = idx === slotIndex ? makeImgDiv(sig.signatureUrl) : m;
          idx++;
          return r;
        }
      );
    } else {
      let injected = false;
      content = content.replace(
        /(<div[^>]*height:52px[^>]*border-bottom[^>]*>)([\s\S]*?)(<\/div>)/gi,
        (m, o, inner, cl) => {
          if (!injected && !inner.includes('<img')) {
            injected = true;
            return makeImgDiv(sig.signatureUrl);
          }
          return m;
        }
      );
    }
    changed = true;
    console.log(`  + Injetado: ${sig.email} (slot ${slotIndex ?? 'auto'}) em "${c.title}"`);
  }

  if (changed) {
    const { error } = await sb
      .from('contracts')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', c.id);
    if (error) console.error(`  ERRO ${c.title}:`, error.message);
    else { console.log(`  ✓ "${c.title}" atualizado`); fixed++; }
  }
}

console.log(`\nConcluído. ${fixed} contrato(s) corrigido(s).`);
