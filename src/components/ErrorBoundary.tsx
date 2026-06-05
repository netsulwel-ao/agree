import React from 'react';
import { Sentry, captureError } from '../lib/sentry';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  eventId: string | null;
}

/**
 * ErrorBoundary global — envolve toda a app e captura erros de render
 * que de outra forma causariam uma tela em branco silenciosa.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, eventId: null };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const eventId = Sentry.captureException(error, {
      extra: { componentStack: info.componentStack },
    });
    this.setState({ eventId: eventId ?? null });
    captureError(error, { componentStack: info.componentStack ?? undefined });
  }

  handleReset = () => {
    this.setState({ hasError: false, eventId: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100vh', gap: 20,
            fontFamily: "'Poppins', sans-serif", padding: 24, textAlign: 'center',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: 'rgba(239,68,68,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle size={32} color="#ef4444" />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0d1117', marginBottom: 8 }}>
                Algo correu mal
              </h1>
              <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 360, lineHeight: 1.6 }}>
                Ocorreu um erro inesperado. O problema foi registado automaticamente.
              </p>
              {this.state.eventId && (
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>
                  Referência: {this.state.eventId}
                </p>
              )}
            </div>
            <button
              onClick={this.handleReset}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', background: '#0d1117', color: '#fff',
                border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
              }}
            >
              <RefreshCw size={16} /> Voltar ao início
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
