import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createTransport } from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(express.static(join(__dirname, 'dist')));

// --- Supabase admin client (service_role) ---
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

// --- PayPal config ---
const paypalClientId = process.env.PAYPAL_CLIENT_ID;
const paypalSecret = process.env.PAYPAL_CLIENT_SECRET;
const paypalApi = process.env.PAYPAL_SANDBOX === 'true'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

const planAmounts = { pro: '39.90', enterprise: '99.90' };

async function getPayPalToken() {
  const basic = Buffer.from(`${paypalClientId}:${paypalSecret}`).toString('base64');
  const res = await fetch(`${paypalApi}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
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

// --- POST /api/send-email ---
app.post('/api/send-email', async (req, res) => {
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

// --- POST /api/paypal/create-order ---
app.post('/api/paypal/create-order', async (req, res) => {
  try {
    const { plan } = req.body;
    if (!plan || !planAmounts[plan]) {
      return res.status(400).json({ error: 'Plano inválido' });
    }

    const token = await getPayPalToken();
    const amount = planAmounts[plan];

    const orderRes = await fetch(`${paypalApi}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: 'USD', value: amount },
          description: `Agree — Plano ${plan === 'pro' ? 'Pro' : 'Enterprise'}`,
        }],
      }),
    });

    const order = await orderRes.json();
    if (!orderRes.ok) {
      return res.status(500).json({ error: order.message || 'Erro ao criar ordem PayPal' });
    }

    res.json({ orderId: order.id });
  } catch (e) {
    console.error('PayPal create-order error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// --- POST /api/paypal/capture-order ---
app.post('/api/paypal/capture-order', async (req, res) => {
  try {
    const { orderId, userId, plan } = req.body;
    if (!orderId || !userId || !plan) {
      return res.status(400).json({ error: 'Campos obrigatórios: orderId, userId, plan' });
    }

    const token = await getPayPalToken();

    const captureRes = await fetch(`${paypalApi}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });

    const capture = await captureRes.json();
    if (!captureRes.ok) {
      return res.status(500).json({ error: capture.message || 'Erro ao capturar pagamento' });
    }

    if (capture.status !== 'COMPLETED') {
      return res.status(400).json({ error: `Pagamento não completado: ${capture.status}` });
    }

    // Actualizar BD com service_role
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase admin client não configurado' });
    }

    const amount = parseFloat(planAmounts[plan]);

    // Inserir payment_request como aprovado
    const { error: insertError } = await supabaseAdmin
      .from('payment_requests')
      .insert({
        user_id: userId,
        plan,
        amount,
        payment_method: 'paypal',
        paypal_order_id: orderId,
        notes: `PayPal order: ${orderId}`,
        status: 'approved',
        approved_by: userId,
      });

    if (insertError) {
      console.error('Erro ao inserir payment_request:', insertError);
      return res.status(500).json({ error: 'Erro ao registar pagamento' });
    }

    // Atualizar plano do utilizador
    const { error: planError } = await supabaseAdmin
      .from('profiles')
      .update({ plan })
      .eq('id', userId);

    if (planError) {
      console.error('Erro ao atualizar plano:', planError);
      return res.status(500).json({ error: 'Pagamento capturado mas erro ao ativar plano' });
    }

    res.json({ success: true, status: capture.status, plan });
  } catch (e) {
    console.error('PayPal capture-order error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// --- SPA fallback ---
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
