/**
 * expire-plans — Supabase Edge Function
 *
 * Processa expiração de planos e envia emails de aviso.
 * Deve ser invocada por um cron job diário (ex: pg_cron ou Supabase Scheduled Functions).
 *
 * Deploy: supabase functions deploy expire-plans
 *
 * Cron recomendado (diário às 08:00 UTC):
 *   SELECT cron.schedule('expire-plans', '0 8 * * *',
 *     $$SELECT net.http_post(url := '<FUNCTION_URL>', headers := '{"Authorization":"Bearer <ANON_KEY>"}')$$
 *   );
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const APP_URL = Deno.env.get('APP_URL') || 'https://agree.netsulwel.tech';
const SMTP_HOST = Deno.env.get('SMTP_HOST');
const SMTP_PORT = Deno.env.get('SMTP_PORT') || '587';
const SMTP_USER = Deno.env.get('SMTP_USER');
const SMTP_PASS = Deno.env.get('SMTP_PASS');
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'Agree <noreply@agree.ao>';
// Segredo partilhado com o server.js para enviar emails
const EMAIL_API_SECRET = Deno.env.get('EMAIL_API_SECRET') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── Helpers ──────────────────────────────────────────

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function sendExpiryWarningEmail(to: string, name: string, planLabel: string, daysLeft: number): Promise<void> {
  const billingUrl = `${APP_URL}/billing`;

  const subject = daysLeft <= 0
    ? `O teu plano ${planLabel} expirou`
    : `O teu plano ${planLabel} expira em ${daysLeft} dia${daysLeft !== 1 ? 's' : ''}`;

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
      <div style="background:#0d1117;padding:24px;text-align:center;margin-bottom:24px">
        <span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px">Agree</span>
      </div>
      <h2 style="font-size:20px;color:#0d1117;margin-bottom:16px">
        ${daysLeft <= 0 ? 'Plano expirado' : 'Plano a expirar'}
      </h2>
      <p style="font-size:14px;color:#374151">Olá <strong>${name}</strong>,</p>
      ${daysLeft <= 0
        ? `<p style="font-size:14px;color:#374151;line-height:1.6">
             O teu plano <strong>${planLabel}</strong> expirou. As tuas funcionalidades premium foram suspensas.
             Renova agora para recuperar o acesso.
           </p>`
        : `<p style="font-size:14px;color:#374151;line-height:1.6">
             O teu plano <strong>${planLabel}</strong> expira em <strong>${daysLeft} dia${daysLeft !== 1 ? 's' : ''}</strong>.
             Renova antes que expire para não perder o acesso às funcionalidades premium.
           </p>`
      }
      <a href="${billingUrl}"
         style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:700;color:#fff;
                background:#0d1117;text-decoration:none;margin:20px 0;border-radius:8px">
        ${daysLeft <= 0 ? 'Renovar Plano' : 'Renovar Agora'}
      </a>
      <hr style="border:none;border-top:1px solid #e2e5e9;margin:24px 0">
      <p style="font-size:12px;color:#9ca3af">
        Plataforma Agree — Gestão de Contratos<br>
        <a href="${billingUrl}" style="color:#9ca3af">Ver estado do plano</a>
      </p>
    </div>
  `;

  // Envia via endpoint do servidor Express
  try {
    await fetch(`${APP_URL}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(EMAIL_API_SECRET ? { 'x-internal-secret': EMAIL_API_SECRET } : {}),
      },
      body: JSON.stringify({ to, subject, html }),
    });
  } catch (e) {
    console.warn(`[expire-plans] Falha ao enviar email para ${to}:`, e);
  }
}

// ─── Main handler ─────────────────────────────────────

serve(async () => {
  const now = new Date();
  const results = { expired: 0, warned7d: 0, warned1d: 0, errors: 0 };

  // 1. Fazer downgrade de planos expirados (plan_expires_at < agora)
  const { data: expiredProfiles, error: expiredErr } = await supabase
    .from('profiles')
    .select('id, email, name, plan, plan_expires_at')
    .in('plan', ['pro', 'enterprise'])
    .lt('plan_expires_at', now.toISOString());

  if (expiredErr) {
    console.error('[expire-plans] Erro ao buscar planos expirados:', expiredErr.message);
    results.errors++;
  } else if (expiredProfiles?.length) {
    for (const profile of expiredProfiles) {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ plan: 'free', plan_expires_at: null })
        .eq('id', profile.id);

      if (updateErr) {
        console.error(`[expire-plans] Erro ao fazer downgrade de ${profile.id}:`, updateErr.message);
        results.errors++;
        continue;
      }

      results.expired++;

      // Inserir notificação no sistema
      await supabase.from('notifications').insert({
        user_id: profile.id,
        type: 'plan_expired',
        title: 'Plano expirado',
        message: `O teu plano ${profile.plan === 'enterprise' ? 'Enterprise' : 'Pro'} expirou. Renova para recuperar o acesso.`,
        read: false,
      });

      // Enviar email de aviso
      if (profile.email) {
        await sendExpiryWarningEmail(
          profile.email,
          profile.name || profile.email,
          profile.plan === 'enterprise' ? 'Enterprise' : 'Pro',
          0,
        );
      }
    }
  }

  // 2. Enviar aviso 7 dias antes de expirar
  const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in6days = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);

  const { data: expiring7d } = await supabase
    .from('profiles')
    .select('id, email, name, plan')
    .in('plan', ['pro', 'enterprise'])
    .gte('plan_expires_at', in6days.toISOString())
    .lte('plan_expires_at', in7days.toISOString());

  if (expiring7d?.length) {
    for (const profile of expiring7d) {
      await supabase.from('notifications').upsert({
        user_id: profile.id,
        type: 'plan_expiring_7d',
        title: 'Plano a expirar em 7 dias',
        message: `O teu plano ${profile.plan === 'enterprise' ? 'Enterprise' : 'Pro'} expira em 7 dias. Renova para não perder o acesso.`,
        read: false,
      }, { onConflict: 'user_id,type' });

      if (profile.email) {
        await sendExpiryWarningEmail(
          profile.email,
          profile.name || profile.email,
          profile.plan === 'enterprise' ? 'Enterprise' : 'Pro',
          7,
        );
      }
      results.warned7d++;
    }
  }

  // 3. Enviar aviso 1 dia antes de expirar
  const in1day = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
  const inHalf = new Date(now.getTime() + 0.5 * 24 * 60 * 60 * 1000);

  const { data: expiring1d } = await supabase
    .from('profiles')
    .select('id, email, name, plan')
    .in('plan', ['pro', 'enterprise'])
    .gte('plan_expires_at', inHalf.toISOString())
    .lte('plan_expires_at', in1day.toISOString());

  if (expiring1d?.length) {
    for (const profile of expiring1d) {
      await supabase.from('notifications').upsert({
        user_id: profile.id,
        type: 'plan_expiring_1d',
        title: 'Plano expira amanhã',
        message: `O teu plano ${profile.plan === 'enterprise' ? 'Enterprise' : 'Pro'} expira amanhã. Renova agora.`,
        read: false,
      }, { onConflict: 'user_id,type' });

      if (profile.email) {
        await sendExpiryWarningEmail(
          profile.email,
          profile.name || profile.email,
          profile.plan === 'enterprise' ? 'Enterprise' : 'Pro',
          1,
        );
      }
      results.warned1d++;
    }
  }

  console.log('[expire-plans] Concluído:', results);
  return json({ ok: true, ...results, processedAt: now.toISOString() });
});
