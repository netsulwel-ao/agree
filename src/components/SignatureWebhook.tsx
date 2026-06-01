import React from 'react';
import { Loader2 } from 'lucide-react';

export default function SignatureWebhook() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', fontFamily: "'Poppins',sans-serif" }}>
      <div style={{ maxWidth: 480, textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0d1117', marginBottom: 8 }}>Webhook de Assinatura</h2>
        <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
          Este endpoint recebe notificações dos provedores de assinatura digital quando
          um documento é assinado, visualizado ou recusado.
        </p>
        <div style={{ marginTop: 16, padding: 12, background: '#f9fafb', borderRadius: 8, fontSize: 12, color: '#374151', textAlign: 'left' }}>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>URL do Webhook:</p>
          <code style={{ fontSize: 11, wordBreak: 'break-all', color: '#3b82f6' }}>
            {window.location.origin}/signature-webhook
          </code>
          <p style={{ marginTop: 8, fontWeight: 600, marginBottom: 4 }}>Método:</p>
          <code style={{ fontSize: 11, color: '#3b82f6' }}>POST</code>
          <p style={{ marginTop: 8, fontWeight: 600, marginBottom: 4 }}>Formato:</p>
          <code style={{ fontSize: 11, color: '#6b7280' }}>JSON (application/json)</code>
        </div>
        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 12 }}>
          Configura este URL nas definições do provedor de assinatura (DocuSign, HelloSign, etc.)
          para receber actualizações automáticas de estado.
        </p>
      </div>
    </div>
  );
}
