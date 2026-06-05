import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createTransport } from 'nodemailer';

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(express.static(join(__dirname, 'dist')));

// --- Segredo partilhado para autenticar pedidos internos do frontend ---
// Define EMAIL_API_SECRET no .env com um valor longo e aleatório.
const EMAIL_API_SECRET = process.env.EMAIL_API_SECRET || '';

if (!EMAIL_API_SECRET) {
  console.warn(
    '[Agree] EMAIL_API_SECRET não definido. ' +
    'O endpoint /api/send-email está desprotegido. Define a variável no .env.'
  );
}

// --- Email transport ---
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const emailFrom = process.env.EMAIL_FROM || 'Agree <noreply@agree-tqzf.onrender.com>';

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

// --- Middleware de autenticação do endpoint interno ---
function requireEmailSecret(req, res, next) {
  // Aceita o segredo via header ou via body (para retrocompatibilidade temporária)
  const headerSecret = req.headers['x-internal-secret'];
  const bodySecret = req.body?.secret;
  const provided = headerSecret || bodySecret;

  if (!EMAIL_API_SECRET) {
    // Se a variável não estiver configurada, bloqueia sempre em produção
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({ error: 'Endpoint de email não configurado' });
    }
    // Em dev permite mas avisa
    console.warn('[Agree] EMAIL_API_SECRET não definido — pedido permitido apenas em modo dev');
    return next();
  }

  if (!provided || provided !== EMAIL_API_SECRET) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  next();
}

// --- POST /api/send-email ---
app.post('/api/send-email', requireEmailSecret, async (req, res) => {
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

// --- SPA fallback ---
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
