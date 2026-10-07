/**
 * Gera o bloco HTML de assinaturas para ser injetado no final do contrato.
 * Usado na visualização do ContractDetail, na página pública PublicSign,
 * e na exportação PDF.
 */

export interface SignatureEntry {
  id: string;
  name: string;
  email: string;
  signed: boolean;
  signedAt?: string;
  signatureUrl?: string;
  hash?: string;
}

export function buildSignatureBlock(signatures: SignatureEntry[]): string {
  if (!signatures || signatures.length === 0) return '';

  const rows = signatures.map((sig) => {
    const initials = sig.name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase() ?? '')
      .join('');

    const signedDate = sig.signedAt
      ? new Date(sig.signedAt).toLocaleDateString('pt-PT', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })
      : null;

    const signatureImg = sig.signatureUrl
      ? `<div style="margin:8px 0 4px;">
           <img src="${sig.signatureUrl}" alt="Assinatura de ${sig.name}"
             style="max-width:180px;max-height:60px;object-fit:contain;border:1px solid #e5e7eb;border-radius:4px;padding:4px;background:#fff;" />
         </div>`
      : `<div style="width:180px;height:60px;border-bottom:1.5px solid #374151;margin:8px 0 4px;"></div>`;

    const status = sig.signed
      ? `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:#16a34a;font-weight:600;">
           ✓ Assinado${signedDate ? ` em ${signedDate}` : ''}
         </span>`
      : `<span style="font-size:11px;color:#f59e0b;font-weight:600;">⏳ Pendente</span>`;

    const hashLine = sig.hash
      ? `<div style="margin-top:4px;font-size:9px;color:#9ca3af;font-family:monospace;word-break:break-all;">Hash: ${sig.hash}</div>`
      : '';

    return `
      <div style="flex:1;min-width:180px;max-width:260px;padding:16px 20px;border:1px solid #e5e7eb;border-radius:8px;background:#fafafa;">
        <div style="width:36px;height:36px;border-radius:50%;background:#0d1117;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;margin-bottom:8px;font-family:Arial,sans-serif;">
          ${initials}
        </div>
        <div style="font-size:13px;font-weight:700;color:#111;margin-bottom:2px;font-family:Arial,sans-serif;">${sig.name}</div>
        <div style="font-size:11px;color:#6b7280;margin-bottom:8px;font-family:Arial,sans-serif;">${sig.email}</div>
        ${signatureImg}
        ${status}
        ${hashLine}
      </div>`;
  }).join('');

  return `
    <div style="margin-top:48px;padding-top:32px;border-top:2px solid #e5e7eb;">
      <div style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:16px;font-family:Arial,sans-serif;">
        Assinaturas
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:16px;">
        ${rows}
      </div>
    </div>`;
}
