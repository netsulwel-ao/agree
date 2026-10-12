/**
 * Fix manual: aplica as assinaturas já guardadas no signing_requests
 * para o array signatures do contrato correspondente.
 * 
 * Executa: node scripts/fix-signatures.mjs
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const sb = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Buscar todos os signing_requests com status=signed
const { data: signedRequests, error: e1 } = await sb
  .from('signing_requests')
  .select('id, contract_id, signer_email, signer_name, signed_at, signature_url, content_hash')
  .eq('status', 'signed');

if (e1) { console.error('Erro:', e1.message); process.exit(1); }
console.log(`Encontrados ${signedRequests.length} signing_requests com status=signed`);

// Agrupar por contrato
const byContract = {};
for (const r of signedRequests) {
  if (!byContract[r.contract_id]) byContract[r.contract_id] = [];
  byContract[r.contract_id].push(r);
}

for (const [contractId, requests] of Object.entries(byContract)) {
  console.log(`\nContrato ${contractId} — ${requests.length} assinatura(s)`);

  const { data: contract, error: e2 } = await sb
    .from('contracts')
    .select('id, title, signatures')
    .eq('id', contractId)
    .single();

  if (e2 || !contract) { console.error('  Erro ao buscar contrato:', e2?.message); continue; }

  console.log('  signatures atual:', JSON.stringify(contract.signatures));

  let signatures = Array.isArray(contract.signatures) ? [...contract.signatures] : [];
  let changed = false;

  for (const req of requests) {
    const emailNorm = req.signer_email.toLowerCase().trim();
    const idx = signatures.findIndex(s => (s.email || '').toLowerCase().trim() === emailNorm);

    if (idx >= 0) {
      if (!signatures[idx].signed) {
        signatures[idx] = {
          ...signatures[idx],
          signed: true,
          signedAt: req.signed_at,
          signatureUrl: req.signature_url,
          hash: req.content_hash,
        };
        console.log(`  ✓ Atualizado: ${req.signer_email}`);
        changed = true;
      } else {
        console.log(`  — Já assinado: ${req.signer_email}`);
      }
    } else {
      // Adiciona se não existia
      signatures.push({
        id: req.id,
        name: req.signer_name,
        email: req.signer_email,
        signed: true,
        signedAt: req.signed_at,
        signatureUrl: req.signature_url,
        hash: req.content_hash,
      });
      console.log(`  + Adicionado: ${req.signer_email}`);
      changed = true;
    }
  }

  if (!changed) { console.log('  Nada a alterar.'); continue; }

  const allSigned = signatures.length > 0 && signatures.every(s => s.signed);

  const { error: e3 } = await sb
    .from('contracts')
    .update({ signatures, updated_at: new Date().toISOString() })
    .eq('id', contractId)
    .select();

  if (e3) console.error('  ERRO ao guardar:', e3.message);
  else console.log(`  ✓ Contrato ${contract.title} atualizado. allSigned=${allSigned}`);
}

console.log('\nConcluído.');
