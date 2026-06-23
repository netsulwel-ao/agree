import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createTransport } from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.json());
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

// --- POST /api/invite-user ---
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

// --- SPA fallback ---
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
