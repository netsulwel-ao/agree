/**
 * Configuração do Sentry para monitorização de erros em produção.
 *
 * Para activar:
 * 1. Cria um projecto React em https://sentry.io
 * 2. Copia o DSN e define VITE_SENTRY_DSN no .env
 * 3. O Sentry só captura erros quando VITE_SENTRY_DSN está definido.
 *    Em desenvolvimento fica silencioso.
 */

import * as Sentry from '@sentry/react';

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
const ENV = import.meta.env.MODE; // 'development' | 'production'
const RELEASE = import.meta.env.VITE_APP_VERSION as string | undefined;

export function initSentry() {
  if (!DSN) {
    if (ENV === 'production') {
      console.warn('[Agree] VITE_SENTRY_DSN não definido — monitorização de erros desactivada.');
    }
    return;
  }

  Sentry.init({
    dsn: DSN,
    environment: ENV,
    release: RELEASE,

    // Captura apenas uma amostra das sessões de replay em produção
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,   // GDPR: oculta texto sensível
        blockAllMedia: true,
      }),
    ],

    // 10% das transacções são rastreadas para performance
    tracesSampleRate: ENV === 'production' ? 0.1 : 1.0,

    // 5% das sessões têm replay — só activa em caso de erro
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,

    // Não envia erros em desenvolvimento
    enabled: ENV === 'production',

    // Ignora erros de rede comuns que não são bugs da app
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Network request failed',
      'Failed to fetch',
      'Load failed',
      /^AbortError/,
      /^ChunkLoadError/,
    ],

    beforeSend(event) {
      // Não envia erros que o utilizador causou intencionalmente
      if (event.exception?.values?.[0]?.type === 'UnhandledRejection') {
        const value = event.exception.values[0].value || '';
        if (value.includes('401') || value.includes('403')) return null;
      }
      return event;
    },
  });
}

/** Associa o utilizador autenticado ao contexto do Sentry. */
export function setSentryUser(userId: string | null, email?: string) {
  if (!DSN) return;
  if (userId) {
    Sentry.setUser({ id: userId, email });
  } else {
    Sentry.setUser(null);
  }
}

/** Captura um erro manualmente com contexto adicional. */
export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (!DSN) {
    console.error('[Agree] Erro capturado:', error, context);
    return;
  }
  Sentry.withScope(scope => {
    if (context) scope.setExtras(context);
    Sentry.captureException(error);
  });
}

export { Sentry };
