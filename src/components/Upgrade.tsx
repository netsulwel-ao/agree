import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowUpRight, Mail } from 'lucide-react';

export default function Upgrade() {
  const { plan } = useAuth();

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '60vh', textAlign: 'center',
      padding: 40,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 16,
        background: '#0d1117', display: 'flex', alignItems: 'center',
        justifyContent: 'center', marginBottom: 20,
      }}>
        <ArrowUpRight size={28} color="#fff" />
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
        Fazer Upgrade
      </h1>
      <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 400, marginBottom: 24 }}>
        {plan === 'pro'
          ? 'Está no plano Pro. Contacte o administrador para migrar para Enterprise.'
          : 'Está no plano Free. Contacte o administrador para ativar os planos Pro ou Enterprise.'}
      </p>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 20px', borderRadius: 12,
        background: '#f3f4f6', color: '#374151', fontSize: 13,
      }}>
        <Mail size={16} />
        <span>Envie um email para o administrador a solicitar o upgrade</span>
      </div>
    </div>
  );
}
