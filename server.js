import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createTransport } from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(join(__dirname, 'dist')));

// --- Supabase admin client for JWT verification ---
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// --- Email transport ---
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const emailFrom = process.env.EMAIL_FROM || 'Agree <noreply@agree.netsulwel.tech>';

function getTransporter() {
  if (!smtpHost || !smtpUser || !smtpPass) return null;
  return createTransport({
    host: smtpHost,
    port: smtpPort ? parseInt(smtpPort) : 587,
    secure: smtpPort === '465',
    auth: { user: smtpUser, pass: smtpPass },
  });
}

async function sendEmail({ to, subject, html }) {
  const transporter = getTransporter();
  if (!transporter) throw new Error('SMTP não configurado');
  await transporter.sendMail({ from: emailFrom, to, subject, html });
}

// --- Middleware de autenticação via Supabase JWT ---
async function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({ error: 'Autenticação não configurada' });
    }
    console.warn('[Agree] SUPABASE_SERVICE_ROLE_KEY não definida — allowing request in dev mode');
    return next();
  }

  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }

  next();
}

// --- POST /api/sign/invite ---
// Cria um signing_request e envia email ao signatário com link único
app.post('/api/sign/invite', requireAuth, async (req, res) => {
  const { contractId, signerName, signerEmail } = req.body;
  if (!contractId || !signerName || !signerEmail) {
    return res.status(400).json({ error: 'contractId, signerName e signerEmail são obrigatórios' });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return res.status(503).json({ error: 'Serviço não configurado' });

  // Busca o contrato para incluir título e conteúdo no email
  const { data: contract, error: contractErr } = await supabase
    .from('contracts')
    .select('id, title, content, owner_id')
    .eq('id', contractId)
    .single();

  if (contractErr || !contract) {
    return res.status(404).json({ error: 'Contrato não encontrado' });
  }

  // Gera hash SHA-256 do conteúdo actual (prova de integridade)
  const { createHash } = await import('crypto');
  const contentHash = createHash('sha256').update(contract.content || '').digest('hex');

  // Cria ou reutiliza pedido de assinatura para este email+contrato
  const { data: existing } = await supabase
    .from('signing_requests')
    .select('id, token, status')
    .eq('contract_id', contractId)
    .eq('signer_email', signerEmail.toLowerCase().trim())
    .eq('status', 'pending')
    .maybeSingle();

  let token;
  if (existing) {
    token = existing.token;
  } else {
    const { data: created, error: createErr } = await supabase
      .from('signing_requests')
      .insert({
        contract_id:  contractId,
        signer_name:  signerName.trim(),
        signer_email: signerEmail.toLowerCase().trim(),
        content_hash: contentHash,
        status:       'pending',
      })
      .select('token')
      .single();
    if (createErr) return res.status(500).json({ error: createErr.message });
    token = created.token;
  }

  const appUrl = process.env.VITE_APP_URL || 'https://agree.netsulwel.tech';
  const signLink = `${appUrl}/sign/${token}`;

  const html = `
<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#0d1117;padding:28px 40px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">AGREE</h1>
            <p style="margin:8px 0 0;color:#9ca3af;font-size:13px;">Plataforma de Gestão de Contratos</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <h2 style="margin:0 0 8px;color:#09090b;font-size:20px;font-weight:700;">
              Tens um contrato para assinar
            </h2>
            <p style="margin:0 0 24px;color:#71717a;font-size:14px;line-height:1.6;">
              Olá <strong style="color:#09090b;">${signerName.split(' ')[0]}</strong>,<br/>
              Foi-te enviado o contrato <strong>"${contract.title}"</strong> para assinatura digital.
            </p>
            <div style="background:#f9fafb;border:1px solid #e4e4e7;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#a1a1aa;">Contrato</p>
              <p style="margin:0;font-size:15px;font-weight:600;color:#09090b;">${contract.title}</p>
            </div>
            <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px 18px;margin-bottom:28px;">
              <p style="margin:0;font-size:13px;color:#9a3412;line-height:1.5;">
                <strong>Como funciona:</strong> Clica no botão abaixo, lê o contrato, aceita os termos e submete a tua assinatura. Não precisas de criar conta.
              </p>
            </div>
            <div style="text-align:center;">
              <a href="${signLink}" style="display:inline-block;background:#0d1117;color:#fff;text-decoration:none;padding:16px 40px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.02em;">
                Ver e Assinar Contrato →
              </a>
            </div>
            <p style="margin:24px 0 0;font-size:12px;color:#a1a1aa;text-align:center;">
              Ou copia este link: <a href="${signLink}" style="color:#0d1117;">${signLink}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f4f4f5;text-align:center;">
            <p style="margin:0;font-size:12px;color:#a1a1aa;">Este link expira em 7 dias. Se não esperavas este email, ignora-o.</p>
            <p style="margin:6px 0 0;font-size:12px;color:#d4d4d8;">© ${new Date().getFullYear()} Agree — Gestão de Contratos</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await sendEmail({
      to:      signerEmail,
      subject: `Contrato para assinar: ${contract.title}`,
      html,
    });
    res.json({ success: true, token, signLink });
  } catch (e) {
    console.error('Email error:', e.message);
    // Token criado mas email não enviado — devolve o link na mesma
    res.json({ success: false, token, signLink, emailError: e.message });
  }
});

// --- GET /api/sign/:token --- (dados públicos do pedido de assinatura)
app.get('/api/sign/:token', async (req, res) => {
  const { token } = req.params;
  const supabase = getSupabaseAdmin();
  if (!supabase) return res.status(503).json({ error: 'Serviço não configurado' });

  const { data: request, error } = await supabase
    .from('signing_requests')
    .select('id, signer_name, signer_email, status, expires_at, viewed_at, signed_at, contract:contracts(id, title, content, value, currency, start_date, end_date, signatures)')
    .eq('token', token)
    .maybeSingle();

  if (error || !request) return res.status(404).json({ error: 'Link inválido ou expirado.' });
  if (new Date(request.expires_at) < new Date()) return res.status(410).json({ error: 'Este link expirou.' });
  if (request.status === 'signed') return res.json({ ...request, alreadySigned: true });

  // Marca como visualizado na primeira abertura
  if (request.status === 'pending') {
    await supabase
      .from('signing_requests')
      .update({ status: 'viewed', viewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('token', token);
  }

  res.json(request);
});

// --- POST /api/sign/:token/submit --- (submissão da assinatura)
app.post('/api/sign/:token/submit', async (req, res) => {
  const { token } = req.params;
  const { signatureDataUrl, acceptedTerms, signerIp, signerAgent } = req.body;

  if (!acceptedTerms) return res.status(400).json({ error: 'Tens de aceitar os termos.' });
  if (!signatureDataUrl) return res.status(400).json({ error: 'Assinatura obrigatória.' });

  const supabase = getSupabaseAdmin();
  if (!supabase) return res.status(503).json({ error: 'Serviço não configurado' });

  const { data: request, error } = await supabase
    .from('signing_requests')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (error || !request) return res.status(404).json({ error: 'Link inválido.' });
  if (new Date(request.expires_at) < new Date()) return res.status(410).json({ error: 'Link expirado.' });
  
  // Se já foi assinado numa tentativa anterior, verifica se o contrato foi
  // atualizado — se não foi (bug anterior), re-processa sem re-fazer o upload.
  if (request.status === 'signed') {
    // Verifica se a assinatura já foi aplicada no contrato
    const { data: existingContract } = await supabase
      .from('contracts')
      .select('signatures')
      .eq('id', request.contract_id)
      .single();
    
    const alreadyInContract = (existingContract?.signatures || [])
      .some(s => s.email === request.signer_email && s.signed === true);
    
    if (alreadyInContract) {
      return res.status(409).json({ error: 'Já assinaste este contrato.' });
    }
    // Não está no contrato — re-processa usando a signature_url já guardada
    console.log(`[submit] Re-processando assinatura já existente para ${request.signer_email}`);
  }

  // Upload da imagem da assinatura para o Storage
  // Se já foi assinado antes mas o contrato não foi atualizado, reutiliza a URL existente
  let publicUrl = request.signature_url || null;

  if (!publicUrl || request.status !== 'signed') {
    const base64Data = signatureDataUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const filePath = `public/signatures/${request.contract_id}/${request.id}.png`;

    const { error: uploadErr } = await supabase.storage
      .from('signatures')
      .upload(filePath, buffer, { contentType: 'image/png', upsert: true });

    if (uploadErr) {
      console.error('[submit] Erro no upload:', uploadErr.message);
      return res.status(500).json({ error: 'Erro ao guardar assinatura: ' + uploadErr.message });
    }

    const { data: { publicUrl: uploadedUrl } } = supabase.storage.from('signatures').getPublicUrl(filePath);
    publicUrl = uploadedUrl;

    // Atualiza o signing_request
    await supabase
      .from('signing_requests')
      .update({
        status:        'signed',
        signed_at:     new Date().toISOString(),
        signature_url: publicUrl,
        signer_ip:     signerIp || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        signer_agent:  signerAgent || req.headers['user-agent'],
        updated_at:    new Date().toISOString(),
      })
      .eq('token', token);
  }

  console.log(`[submit] signature URL: ${publicUrl}`);

  // Atualiza as assinaturas no contrato e injeta a imagem no HTML
  const { data: contract } = await supabase
    .from('contracts')
    .select('signatures, content')
    .eq('id', request.contract_id)
    .single();

  const signatures = (contract?.signatures || []).map((s) =>
    s.email === request.signer_email
      ? { ...s, signed: true, signedAt: new Date().toISOString(), signatureUrl: publicUrl, hash: request.content_hash }
      : s
  );

  // Injeta a imagem da assinatura no HTML do contrato.
  // Os templates usam: <div style="height:52px;border-bottom:1px solid #ccc;..."></div>
  // seguido do nome do signatário. Substituímos a 1ª div vazia encontrada perto do nome.
  let updatedContent = contract?.content || '';
  if (updatedContent && publicUrl) {
    const signerName = request.signer_name || '';
    const imgTag = `<img src="${publicUrl}" alt="Assinatura de ${signerName}" style="max-height:48px;max-width:180px;object-fit:contain;display:block;margin-bottom:4px;" />`;

    // Estratégia: encontrar divs de altura 52px (linha de assinatura) vazias
    // que estejam antes do nome do signatário, e injetar a imagem dentro delas.
    // Padrão: <div style="...height:52px;border-bottom:..."></div> seguido do nome
    const signerNameEscaped = signerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(
      `(<div[^>]*height:52px[^>]*border-bottom[^>]*>)(\\s*</div>)(?=[\\s\\S]{0,300}${signerNameEscaped})`,
      'i'
    );
    if (pattern.test(updatedContent)) {
      updatedContent = updatedContent.replace(pattern, `$1${imgTag}$2`);
    } else {
      // Fallback: injetar na 1ª linha de assinatura vazia encontrada
      const fallback = /(<div[^>]*height:52px[^>]*border-bottom[^>]*>)(\s*<\/div>)/i;
      if (fallback.test(updatedContent)) {
        updatedContent = updatedContent.replace(fallback, `$1${imgTag}$2`);
      }
    }
  }

  // Verifica se todos assinaram
  const allSigned = signatures.length > 0 && signatures.every((s) => s.signed);

  const { error: contractUpdateErr } = await supabase
    .from('contracts')
    .update({
      signatures,
      content:    updatedContent,
      status:     allSigned ? 'approved' : 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', request.contract_id);

  if (contractUpdateErr) {
    console.error('[submit] Erro ao atualizar contrato:', contractUpdateErr.message);
    return res.status(500).json({ error: 'Assinatura guardada mas erro ao atualizar contrato: ' + contractUpdateErr.message });
  }

  console.log(`[submit] Contrato ${request.contract_id} atualizado. allSigned=${allSigned}`);

  res.json({ success: true, signatureUrl: publicUrl, allSigned });
});

app.post('/api/invite-user', requireAuth, async (req, res) => {
  const { email, name } = req.body;
  if (!email) return res.status(400).json({ error: 'Email é obrigatório' });

  const supabase = getSupabaseAdmin();
  if (!supabase) return res.status(503).json({ error: 'Serviço de autenticação não configurado' });

  const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { name: name || undefined },
  });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// --- POST /api/send-email ---
app.post('/api/send-email', requireAuth, async (req, res) => {
  const { to, subject, html } = req.body;
  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Campos obrigatórios: to, subject, html' });
  }
  try {
    await sendEmail({ to, subject, html });
    res.json({ success: true });
  } catch (e) {
    console.error('Email error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// --- API 404: uma rota de API não deve devolver o index.html da SPA ---
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// --- SPA fallback ---
// Qualquer outro GET devolve o index.html para o React Router tratar a rota.
// `/oauth/authorize` entra por aqui: é uma rota do cliente, não da API.
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
