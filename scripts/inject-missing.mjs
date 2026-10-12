import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

// Buscar todos os contratos com assinaturas que têm signatureUrl mas a imagem não está no HTML
const { data: contracts } = await sb.from('contracts').select('id, title, content, signatures');

let fixed = 0;
for (const c of contracts || []) {
  if (!c.signatures?.length || !c.content) continue;

  let content = c.content;
  let changed = false;

  // Para cada signatário com signatureUrl
  const signed = c.signatures.filter(s => s.signed && s.signatureUrl);
  for (const sig of signed) {
    // Verificar se a URL já está no HTML
    if (content.includes(sig.signatureUrl)) continue;

    // Encontrar o slotIndex — ou usar fallback (primeira div vazia)
    const slotIndex = sig.slotIndex;
    const imgTag = `<img src="${sig.signatureUrl}" alt="Assinatura" style="max-height:48px;max-width:180px;object-fit:contain;display:block;margin-bottom:4px;" />`;

    if (slotIndex !== undefined && slotIndex !== null) {
      let idx = 0;
      content = content.replace(/(<div[^>]*height:52px[^>]*border-bottom[^>]*>)([\s\S]*?)(<\/div>)/gi, (m, o, inner, cl) => {
        const r = idx === slotIndex ? `${o}${imgTag}${cl}` : m;
        idx++;
        return r;
      });
    } else {
      let injected = false;
      content = content.replace(/(<div[^>]*height:52px[^>]*border-bottom[^>]*>)([\s\S]*?)(<\/div>)/gi, (m, o, inner, cl) => {
        if (!injected && !inner.includes('<img')) { injected = true; return `${o}${imgTag}${cl}`; }
        return m;
      });
    }
    changed = true;
    console.log(`  + Injetado: ${sig.email} (slot ${slotIndex}) em "${c.title}"`);
  }

  if (changed) {
    const { error } = await sb.from('contracts').update({ content, updated_at: new Date().toISOString() }).eq('id', c.id);
    if (error) console.error(`  ERRO ${c.title}:`, error.message);
    else { console.log(`  ✓ ${c.title} atualizado`); fixed++; }
  }
}

console.log(`\nConcluído. ${fixed} contrato(s) corrigido(s).`);
