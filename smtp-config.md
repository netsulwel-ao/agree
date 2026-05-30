# Configuração SMTP — Supabase Auth

## 1. Supabase Dashboard → Authentication → SMTP Settings

| Campo | Valor |
|-------|-------|
| SMTP Host | `smtp.hostinger.com` |
| SMTP Port | `465` |
| SMTP User | `apoio.sulfatur@netsulwel.tech` |
| SMTP Password | `@ApoioSulfatur2022` |
| Sender Email | `apoio.sulfatur@netsulwel.tech` |
| Sender Name | `Agree` |

## 2. Supabase Dashboard → Authentication → Email Templates

### Confirmation
Colar o HTML do ficheiro `email-template-confirmacao.html`

### Password Recovery (opcional)
Personalizar com o mesmo branding (logo, cores, etc.)

## 3. Supabase Dashboard → Authentication → Settings

### Redirect URLs
Adicionar: `https://<teu-dominio>/confirmado`

## Notas
- Porta 465 = SMTP com SSL (a porta standard para Hostinger)
- As credenciais estão seguras no SMTP Settings (nunca expostas ao frontend)
- O Supabase usa estas credenciais para enviar TODOS os emails transacionais (confirmação, recovery, invite)
