const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;

// Segredo para autenticar chamadas ao endpoint /api/send-email
const EMAIL_API_SECRET = import.meta.env.VITE_EMAIL_API_SECRET || '';

type Plan = 'free' | 'pro' | 'enterprise';

export function canSendEmail(plan: Plan, isAdmin: boolean, feature: 'approval' | 'sharing' | 'expiry' | 'digest'): boolean {
  if (isAdmin) return true;
  if (feature === 'digest') return plan === 'enterprise';
  return plan === 'pro' || plan === 'enterprise';
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Envia o segredo via header para autenticar o pedido no servidor
        ...(EMAIL_API_SECRET ? { 'x-internal-secret': EMAIL_API_SECRET } : {}),
      },
      body: JSON.stringify({ to, subject, html }),
    });
    if (!res.ok) throw new Error(await res.text());
    return true;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.warn('Email não enviado (SMTP configurado?):', message);
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

export async function sendApprovalRequest(to: string, name: string, contractTitle: string, contractId: string) {
  const url = contractUrl(contractId);
  return sendEmail({
    to,
    subject: `Contrato pendente de aprovação: ${contractTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
        <h2 style="font-size:20px;color:#0d1117;margin-bottom:16px">Aprovação Pendente</h2>
        <p style="font-size:14px;color:#374151">Olá <strong>${name}</strong>,</p>
        <p style="font-size:14px;color:#374151;line-height:1.6">
          O contrato <strong>"${contractTitle}"</strong> foi submetido para revisão e aguarda a tua aprovação.
        </p>
        <a href="${url}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:700;color:#fff;background:#0d1117;text-decoration:none;margin:16px 0">Rever Contrato</a>
        <hr style="border:none;border-top:1px solid #e2e5e9;margin:24px 0">
        <p style="font-size:12px;color:#9ca3af">Plataforma Agree — Gestão de Contratos</p>
      </div>
    `,
  });
}

export async function sendStatusChangeEmail(to: string, name: string, contractTitle: string, status: string, contractId: string, reason?: string) {
  const url = contractUrl(contractId);
  const isApproved = status === 'approved';
  const subject = isApproved
    ? `Contrato aprovado: ${contractTitle}`
    : `Contrato rejeitado: ${contractTitle}`;
  return sendEmail({
    to,
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
        <h2 style="font-size:20px;color:#0d1117;margin-bottom:16px">${isApproved ? 'Contrato Aprovado' : 'Contrato Rejeitado'}</h2>
        <p style="font-size:14px;color:#374151">Olá <strong>${name}</strong>,</p>
        <p style="font-size:14px;color:#374151;line-height:1.6">
          O contrato <strong>"${contractTitle}"</strong> foi ${isApproved ? 'aprovado' : 'rejeitado'}.
          ${reason ? `<br><br>Justificação: ${reason}` : ''}
        </p>
        <a href="${url}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:700;color:#fff;background:#0d1117;text-decoration:none;margin:16px 0">Ver Contrato</a>
        <hr style="border:none;border-top:1px solid #e2e5e9;margin:24px 0">
        <p style="font-size:12px;color:#9ca3af">Plataforma Agree — Gestão de Contratos</p>
      </div>
    `,
  });
}

export async function sendExpiryWarning(to: string, name: string, contractTitle: string, endDate: string, contractId: string) {
  const url = contractUrl(contractId);
  return sendEmail({
    to,
    subject: `Contrato a expirar: ${contractTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
        <h2 style="font-size:20px;color:#0d1117;margin-bottom:16px">Contrato a Expirar</h2>
        <p style="font-size:14px;color:#374151">Olá <strong>${name}</strong>,</p>
        <p style="font-size:14px;color:#374151;line-height:1.6">
          O contrato <strong>"${contractTitle}"</strong> expira em <strong>${endDate}</strong>.
        </p>
        <p style="font-size:14px;color:#374151">Renova ou toma as providências necessárias antes do vencimento.</p>
        <a href="${url}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:700;color:#fff;background:#0d1117;text-decoration:none;margin:16px 0">Ver Contrato</a>
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
