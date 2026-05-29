const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html }),
    });
    if (!res.ok) throw new Error(await res.text());
    return true;
  } catch (e: any) {
    console.warn('Email não enviado (SMTP configurado?):', e.message);
    return false;
  }
}

function contractUrl(contractId: string) {
  return `${APP_URL}/contracts/${contractId}`;
}

export async function sendSignatureInvite(to: string, name: string, contractTitle: string, ownerName: string, contractId: string) {
  const url = contractUrl(contractId);
  return sendEmail({
    to,
    subject: `Foste convidado(a) para assinar: ${contractTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
        <h2 style="font-size:20px;color:#0d1117;margin-bottom:16px">Convite para Assinar Contrato</h2>
        <p style="font-size:14px;color:#374151">Olá <strong>${name}</strong>,</p>
        <p style="font-size:14px;color:#374151;line-height:1.6">
          <strong>${ownerName}</strong> convidou-te para assinar o contrato <strong>"${contractTitle}"</strong> na plataforma Agree.
        </p>
        <p style="font-size:14px;color:#374151">Acede ao link abaixo para ver e assinar o contrato:</p>
        <a href="${url}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:700;color:#fff;background:#0d1117;text-decoration:none;border-radius:10px;margin:16px 0">Ver Contrato</a>
        <hr style="border:none;border-top:1px solid #e2e5e9;margin:24px 0">
        <p style="font-size:12px;color:#9ca3af">Plataforma Agree — Gestão de Contratos</p>
      </div>
    `,
  });
}

export async function sendSignatureReminder(to: string, name: string, contractTitle: string, ownerName: string, contractId: string) {
  const url = contractUrl(contractId);
  return sendEmail({
    to,
    subject: `Lembrete: assina o contrato ${contractTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
        <h2 style="font-size:20px;color:#0d1117;margin-bottom:16px">Lembrete de Assinatura</h2>
        <p style="font-size:14px;color:#374151">Olá <strong>${name}</strong>,</p>
        <p style="font-size:14px;color:#374151;line-height:1.6">
          Ainda não assinaste o contrato <strong>"${contractTitle}"</strong>. O <strong>${ownerName}</strong> solicita a tua assinatura.
        </p>
        <a href="${url}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:700;color:#fff;background:#0d1117;text-decoration:none;border-radius:10px;margin:16px 0">Aceder ao Contrato</a>
        <hr style="border:none;border-top:1px solid #e2e5e9;margin:24px 0">
        <p style="font-size:12px;color:#9ca3af">Plataforma Agree — Gestão de Contratos</p>
      </div>
    `,
  });
}

export async function sendCollaboratorInvite(to: string, name: string, contractTitle: string, ownerName: string, contractId: string) {
  const contractUrl = `${APP_URL}/contracts/${contractId}`;
  return sendEmail({
    to,
    subject: `Foste convidado(a) para negociar: ${contractTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
        <h2 style="font-size:20px;color:#0d1117;margin-bottom:16px">Convite para Negociação</h2>
        <p style="font-size:14px;color:#374151">Olá <strong>${name}</strong>,</p>
        <p style="font-size:14px;color:#374151;line-height:1.6">
          <strong>${ownerName}</strong> convidou-te para participares na negociação do contrato <strong>"${contractTitle}"</strong>.
        </p>
        <p style="font-size:14px;color:#374151">Podes visualizar, comentar cláusulas, sugerir alterações e aceitar ou recusar os termos.</p>
        <a href="${contractUrl}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:700;color:#fff;background:#0d1117;text-decoration:none;border-radius:10px;margin:16px 0">Abrir Sala de Negociação</a>
        <hr style="border:none;border-top:1px solid #e2e5e9;margin:24px 0">
        <p style="font-size:12px;color:#9ca3af">Plataforma Agree — Gestão de Contratos</p>
      </div>
    `,
  });
}
